#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

services=("app" "report-llm-service")
no_cache="0"
service_arg_seen="0"

for arg in "$@"; do
  case "${arg}" in
    --no-cache)
      no_cache="1"
      ;;
    -h|--help)
      echo "Usage: ./rebuild.sh [service ...] [--no-cache]"
      echo
      echo "Examples:"
      echo "  ./rebuild.sh"
      echo "  ./rebuild.sh --no-cache"
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

if [[ "${no_cache}" == "1" ]]; then
  echo "Building ${services[*]} without cache..."
  docker compose build --no-cache "${services[@]}"
  echo "Recreating ${services[*]}..."
  docker compose up -d --force-recreate "${services[@]}"
else
  echo "Building and recreating ${services[*]}..."
  docker compose up -d --build --force-recreate "${services[@]}"
fi

echo
echo "Container status:"
docker compose ps "${services[@]}"

echo
echo "Recent service logs:"
docker compose logs --tail=40 "${services[@]}"

echo
echo "Health check:"
if command -v curl >/dev/null 2>&1; then
  curl -fsS http://127.0.0.1:8787/api/health || {
    echo
    echo "Health endpoint did not respond yet. Run: docker compose logs -f ${services[*]}"
  }
else
  echo "curl is not installed. Check manually: http://127.0.0.1:8787/api/health"
fi

echo
echo "Done."
