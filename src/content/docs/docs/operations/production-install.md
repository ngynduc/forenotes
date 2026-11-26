---
title: Production install
description: Install a pinned Forenotes image with Docker Compose.
---

Production Compose runs two services: the Forenotes application and PostgreSQL. The application calls your LLM provider directly for AI reports. Releases up to 0.2.5 also ran a separate report LLM service; it is no longer needed.

## Prerequisites

- Docker Engine with the Compose v2 plugin
- `curl` and `openssl` for the installer
- A Linux host with persistent storage and an unused application port
- HTTPS termination for a network-accessible deployment

## Choose a release

Use matching artifacts from a published release. `<release-tag>` is a Git tag, such as `v0.2.5`; `<image-tag>` is a Docker tag, such as `0.2.5`. Replace placeholders without angle brackets.

```bash
RELEASE_TAG='<release-tag>'
RELEASE_BASE="https://raw.githubusercontent.com/ngynduc/forenotes/$RELEASE_TAG"
```

## Install with generated secrets

The installer creates a deployment directory, generates secrets, starts the services, waits for application health, and prints the first-login password:

```bash
curl -fsSLo install.sh "$RELEASE_BASE/install.sh"
FORENOTES_RAW_BASE_URL="$RELEASE_BASE" bash install.sh
```

The URL override makes the installer download Compose from the same Git tag. Without it, the installer downloads Compose from `main`.

For an HTTPS host, choose the install directory and enable secure cookies:

```bash
FORENOTES_RAW_BASE_URL="$RELEASE_BASE" bash install.sh \
  --dir /opt/forenotes --port 8080 --secure-cookies
```

The installer permits HTTP cookies by default for local evaluation. Rerunning it preserves existing credentials and app image pins. Use the [upgrade guide](/docs/operations/upgrade/) to change an existing deployment's version.

## Manual install

You do not need a source checkout or a local image build:

```bash
mkdir -p forenotes-prod
cd forenotes-prod
curl -fsSLo docker-compose.prod.yml "$RELEASE_BASE/docker-compose.prod.yml"
curl -fsSLo .env.production.example "$RELEASE_BASE/.env.production.example"
cp .env.production.example .env.production
chmod 600 .env.production
openssl rand -hex 32
```

Run the secret-generation command separately for each password or key. Edit `.env.production`, replace every placeholder, and set at least:

```dotenv
NODE_ENV=production
FORENOTES_IMAGE=ngynduc/forenotes:<image-tag>
APP_HOST=0.0.0.0
APP_PORT=3000
FORENOTES_HOST_PORT=3000
POSTGRES_USER=forenotes
POSTGRES_PASSWORD=replace-with-a-long-random-password
POSTGRES_DB=forenotes
DATABASE_URL=postgres://forenotes:replace-with-a-long-random-password@postgres:5432/forenotes
FORENOTES_BOOTSTRAP_ADMIN_USERNAME=admin
FORENOTES_BOOTSTRAP_ADMIN_EMAIL=admin@example.com
FORENOTES_BOOTSTRAP_ADMIN_DISPLAY_NAME=Forenotes Admin
FORENOTES_BOOTSTRAP_ADMIN_PASSWORD=replace-with-a-long-random-temporary-password
FORENOTES_BOOTSTRAP_ADMIN_TEMPORARY=true
FORENOTES_LLM_SECRET_KEY=replace-with-at-least-32-random-characters
SECURE_SESSION_COOKIES=true
FORENOTES_MCP_ENABLED=false
```

The database password in `DATABASE_URL` must match `POSTGRES_PASSWORD`. Hex secrets avoid URL-encoding issues. Use `SECURE_SESSION_COOKIES=false` only for local HTTP testing. Preserve the LLM encryption key across upgrades and restores.

Pull the image, wait for PostgreSQL, then start the stack:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --wait postgres
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --wait
```

Startup applies database migrations and creates the bootstrap admin if no admin exists. Open your HTTPS hostname, or `http://localhost:3000` for local testing. Sign in and replace the temporary password.

## Verify the services

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production ps
curl --fail http://localhost:3000/api/health
docker compose -f docker-compose.prod.yml --env-file .env.production \
  logs --tail=100 app
```

Use your configured host port for the health request. Expect `postgres` and `app` to be healthy. The health check queries the database and returns `503` while it is unreachable. Configure a provider in [LLM settings](/docs/admin/llm-settings/) before using AI Report Chat.

MCP remains disabled until explicitly enabled. Follow [MCP investigation agents](/docs/admin/mcp/) to configure the endpoint and create a token.
