---
title: Production quickstart
description: Install a pinned Forenotes release with Docker Compose and verify the first login.
sidebar:
  order: 1
---

This path is for a new operator installing published app and report-service images on a Linux host. It uses bundled PostgreSQL and persistent Docker volumes.

## Before you begin

You need Docker, the Compose v2 plugin, `curl`, `openssl`, and an unused host port. A practical starting point is 2 CPU cores, 4 GB RAM, and 20 GB free storage.

For a network-accessible deployment, prepare an HTTPS reverse proxy. The installer defaults to HTTP-friendly session cookies unless you pass `--secure-cookies`.

## Install a chosen release

Replace `<release-tag>` with a published Git tag, such as `v0.2.2`, without angle brackets. Releases from 0.2.2 include both app and report-service images.

```bash
RELEASE_TAG='<release-tag>'
RELEASE_BASE="https://raw.githubusercontent.com/ngynduc/forenotes/$RELEASE_TAG"
curl -fsSLo install.sh "$RELEASE_BASE/install.sh"
FORENOTES_RAW_BASE_URL="$RELEASE_BASE" bash install.sh
```

The URL override pins the downloaded Compose file to the same release. The installer creates `forenotes-prod/`, generates secrets, starts PostgreSQL, the report service, and Forenotes, waits for application health, and prints the first administrator password.

For a different directory or host port:

```bash
FORENOTES_RAW_BASE_URL="$RELEASE_BASE" bash install.sh --dir /opt/forenotes --port 8080
```

For a host already served through HTTPS:

```bash
FORENOTES_RAW_BASE_URL="$RELEASE_BASE" bash install.sh --dir /opt/forenotes --secure-cookies
```

## Check the image pins

The installer preserves an existing environment file and app image pin. For a fresh installation, verify both Docker tags match the selected release. Docker tags omit the Git tag's `v` prefix:

```dotenv
FORENOTES_IMAGE=ngynduc/forenotes:<image-tag>
FORENOTES_REPORT_LLM_IMAGE=ngynduc/forenotes-report-llm:<image-tag>
LITELLM_SERVICE_URL=http://report-llm-service:8001
```

For an existing installation, follow [Upgrade Forenotes](/docs/operations/upgrade/) to update Compose and both image pins together.

## Verify the deployment

Run from your deployment directory (`forenotes-prod/` by default):

```bash
cd forenotes-prod
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=100 app
curl --fail http://127.0.0.1:3000/api/health
docker compose --env-file .env.production -f docker-compose.prod.yml \
  exec app sh -c 'wget -qO- "$LITELLM_SERVICE_URL/health"'
```

Use your configured directory and host port when they differ. Expect all three services to be healthy. The report service is internal to Compose; it does not publish port 8001 on the host.

## Complete first login

Open the application, sign in as `admin` with the generated password stored in `.bootstrap-admin-password`, and set a permanent password when prompted.

Before inviting users:

- put the deployment behind HTTPS;
- set `SECURE_SESSION_COOKIES=true`;
- create a complete [database and app-data backup](/docs/operations/backup-and-restore/);
- restrict PostgreSQL and deployment files to trusted administrators.

The report service starts without provider credentials. Configure [LLM settings](/docs/admin/llm-settings/) before generating AI-assisted drafts. To connect investigation agents, enable the separate [MCP endpoint](/docs/admin/mcp/) and create a scoped token.

For manual setup or external PostgreSQL, continue to [Production installation](/docs/operations/production-install/).
