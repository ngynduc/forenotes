#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

service="app"
no_cache="0"

for arg in "$@"; do
  case "${arg}" in
    --no-cache)
      no_cache="1"
      ;;
    -h|--help)
      echo "Usage: ./rebuild.sh [service] [--no-cache]"
      echo
      echo "Examples:"
      echo "  ./rebuild.sh"
      echo "  ./rebuild.sh --no-cache"
      echo "  ./rebuild.sh app --no-cache"
      exit 0
      ;;
    *)
      service="${arg}"
      ;;
  esac
done

if [[ "${no_cache}" == "1" ]]; then
  echo "Building ${service} without cache..."
  docker compose build --no-cache "${service}"
  echo "Recreating ${service}..."
  docker compose up -d --force-recreate "${service}"
else
  echo "Building and recreating ${service}..."
  docker compose up -d --build --force-recreate "${service}"
fi

echo
echo "Container status:"
docker compose ps "${service}"

echo
echo "Recent ${service} logs:"
docker compose logs --tail=40 "${service}"

echo
echo "Health check:"
if command -v curl >/dev/null 2>&1; then
  curl -fsS http://127.0.0.1:8787/api/health || {
    echo
    echo "Health endpoint did not respond yet. Run: docker compose logs -f ${service}"
  }
else
  echo "curl is not installed. Check manually: http://127.0.0.1:8787/api/health"
fi

echo
echo "Done."
