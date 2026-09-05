#!/usr/bin/env bash

set -Eeuo pipefail

readonly RAW_BASE_URL="${FORENOTES_RAW_BASE_URL:-https://raw.githubusercontent.com/ngynduc/forenotes/main}"
readonly DEFAULT_INSTALL_DIR="${FORENOTES_INSTALL_DIR:-$PWD/forenotes-prod}"
INSTALL_DIR="$DEFAULT_INSTALL_DIR"
HOST_PORT="${FORENOTES_HOST_PORT:-3000}"
SECURE_SESSION_COOKIES="${SECURE_SESSION_COOKIES:-false}"

usage() {
  cat <<'EOF'
Forenotes installer

Usage:
  install.sh [--dir PATH] [--port PORT] [--secure-cookies]

Environment overrides:
  FORENOTES_INSTALL_DIR   Installation directory
  FORENOTES_HOST_PORT     Host port (default: 3000)
  SECURE_SESSION_COOKIES  Set to true when serving through HTTPS
EOF
}

die() {
  echo "Error: $*" >&2
  exit 1
}

while (($# > 0)); do
  case "$1" in
    --dir)
      (($# >= 2)) || die "--dir requires a path"
      INSTALL_DIR="$2"
      shift 2
      ;;
    --port)
      (($# >= 2)) || die "--port requires a number"
      HOST_PORT="$2"
      shift 2
      ;;
    --secure-cookies)
      SECURE_SESSION_COOKIES=true
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      die "unknown option: $1"
      ;;
  esac
done

command -v curl >/dev/null 2>&1 || die "curl is required"
command -v openssl >/dev/null 2>&1 || die "openssl is required"
command -v docker >/dev/null 2>&1 || die "Docker is required: https://docs.docker.com/engine/install/"
docker compose version >/dev/null 2>&1 || die "Docker Compose v2 is required"

[[ "$HOST_PORT" =~ ^[0-9]+$ ]] || die "port must be a number"
((HOST_PORT >= 1 && HOST_PORT <= 65535)) || die "port must be between 1 and 65535"

mkdir -p "$INSTALL_DIR"
COMPOSE_FILE="$INSTALL_DIR/docker-compose.prod.yml"
ENV_FILE="$INSTALL_DIR/.env.production"
PASSWORD_FILE="$INSTALL_DIR/.bootstrap-admin-password"

echo "Installing Forenotes into $INSTALL_DIR"
curl --fail --silent --show-error --location "$RAW_BASE_URL/docker-compose.prod.yml" --output "$COMPOSE_FILE"

if [[ ! -f "$ENV_FILE" ]]; then
  db_password="$(openssl rand -hex 24)"
  admin_password="$(openssl rand -hex 16)"
  llm_secret="$(openssl rand -hex 32)"

  umask 077
  cat >"$ENV_FILE" <<EOF
NODE_ENV=production
FORENOTES_IMAGE=ngynduc/forenotes:latest

APP_HOST=0.0.0.0
APP_PORT=3000
FORENOTES_HOST_PORT=$HOST_PORT

POSTGRES_USER=forenotes
POSTGRES_PASSWORD=$db_password
POSTGRES_DB=forenotes
DATABASE_URL=postgres://forenotes:$db_password@postgres:5432/forenotes

FORENOTES_BOOTSTRAP_ADMIN_USERNAME=admin
FORENOTES_BOOTSTRAP_ADMIN_EMAIL=admin@example.com
FORENOTES_BOOTSTRAP_ADMIN_DISPLAY_NAME=Forenotes Admin
FORENOTES_BOOTSTRAP_ADMIN_PASSWORD=$admin_password
FORENOTES_BOOTSTRAP_ADMIN_TEMPORARY=true

FORENOTES_LLM_SECRET_KEY=$llm_secret
SECURE_SESSION_COOKIES=$SECURE_SESSION_COOKIES

LITELLM_SERVICE_URL=
LLM_PROVIDER=
LLM_MODEL=
LLM_API_KEY=
LLM_API_ENDPOINT=
LLM_SYSTEM_PROMPT=
LLM_CUSTOM_HEADERS_JSON={}
EOF
  printf '%s\n' "$admin_password" >"$PASSWORD_FILE"
  chmod 600 "$ENV_FILE" "$PASSWORD_FILE"
else
  echo "Keeping existing $ENV_FILE"
fi

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" pull
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d

url="http://127.0.0.1:$HOST_PORT"
echo "Waiting for Forenotes at $url ..."
for _ in {1..60}; do
  if curl --fail --silent "$url/api/health" >/dev/null; then
    echo
    echo "Forenotes is ready: $url"
    echo "Username: admin"
    if [[ -f "$PASSWORD_FILE" ]]; then
      echo "Password: $(<"$PASSWORD_FILE")"
      echo "Credentials saved in: $PASSWORD_FILE"
    else
      echo "The existing admin credentials were preserved."
    fi
    if [[ "$SECURE_SESSION_COOKIES" != true ]]; then
      echo "Warning: HTTP session cookies are enabled for this local install. Put it behind HTTPS and rerun with --secure-cookies."
    fi
    exit 0
  fi
  sleep 2
done

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps
die "Forenotes did not become healthy. Check logs with: docker compose --env-file $ENV_FILE -f $COMPOSE_FILE logs app"
