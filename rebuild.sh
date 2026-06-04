#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

services=("app" "report-llm-service")
no_cache="0"
service_arg_seen="0"
compose_file="docker-compose.demo.yml"
env_file=".env.demo"
stack_name="demo"

for arg in "$@"; do
  case "${arg}" in
    --prod|--production)
      compose_file="docker-compose.yml"
      env_file=".env.production"
      stack_name="production"
      ;;
    --demo|--dev)
      compose_file="docker-compose.demo.yml"
      env_file=".env.demo"
      stack_name="demo"
      ;;
    --no-cache)
      no_cache="1"
      ;;
    -h|--help)
      echo "Usage: ./rebuild.sh [--demo|--prod] [service ...] [--no-cache]"
      echo
      echo "Examples:"
      echo "  ./rebuild.sh"
      echo "  ./rebuild.sh --no-cache"
      echo "  ./rebuild.sh --prod"
      echo "  ./rebuild.sh app --no-cache"
      echo "  ./rebuild.sh report-llm-service --no-cache"
      exit 0
      ;;
    *)
      if [[ "${service_arg_seen}" == "0" ]]; then
        services=()
        service_arg_seen="1"
      fi
      services+=("${arg}")
      ;;
  esac
done

if [[ ! -f "${compose_file}" ]]; then
  echo "Compose file not found: ${compose_file}" >&2
  exit 1
fi

if [[ ! -f "${env_file}" ]]; then
  echo "Env file not found: ${env_file}" >&2
  echo "Create it from ${env_file}.example first." >&2
  exit 1
fi

compose_cmd=(docker compose -f "${compose_file}" --env-file "${env_file}")

app_port="3000"
if [[ "${stack_name}" == "demo" ]]; then
  configured_port="$(sed -n 's/^FORENOTES_DEMO_HOST_PORT=//p' "${env_file}" | tail -n 1)"
  app_port="${configured_port:-${FORENOTES_DEMO_HOST_PORT:-3000}}"
else
  configured_port="$(sed -n 's/^FORENOTES_HOST_PORT=//p' "${env_file}" | tail -n 1)"
  app_port="${configured_port:-${FORENOTES_HOST_PORT:-3000}}"
fi

if [[ "${no_cache}" == "1" ]]; then
  echo "Building ${stack_name} services without cache via ${compose_file}: ${services[*]}"
  "${compose_cmd[@]}" build --no-cache "${services[@]}"
  echo "Recreating ${services[*]}..."
  "${compose_cmd[@]}" up -d --force-recreate "${services[@]}"
else
  echo "Building and recreating ${stack_name} services via ${compose_file}: ${services[*]}"
  "${compose_cmd[@]}" up -d --build --force-recreate "${services[@]}"
fi

echo
echo "Container status:"
"${compose_cmd[@]}" ps "${services[@]}"

echo
echo "Recent service logs:"
"${compose_cmd[@]}" logs --tail=40 "${services[@]}"

echo
echo "Health check:"
if command -v curl >/dev/null 2>&1; then
  curl -fsS "http://127.0.0.1:${app_port}/api/health" || {
    echo
    echo "Health endpoint did not respond yet. Run: ${compose_cmd[*]} logs -f ${services[*]}"
  }
else
  echo "curl is not installed. Check manually: http://127.0.0.1:${app_port}/api/health"
fi

echo
echo "Done."
