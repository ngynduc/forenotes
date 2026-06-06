# Forenotes Production Installation Guide

This guide is for a new operator installing the published Forenotes production image with Docker Compose. You do not need to clone the source repository or build the app image to run production.

The production install runs:

- the Forenotes application image from Docker Hub
- PostgreSQL from the Compose file, or an external PostgreSQL database if you change `DATABASE_URL`
- persistent volumes for database state and uploaded app data
- startup migrations and first-admin bootstrap

## Requirements

- Docker
- Docker Compose
- a Linux server, VM, or local workstation
- an open host port for the app, usually `3000`

Recommended baseline:

```text
CPU: 2 cores minimum
RAM: 4 GB minimum
Storage: 20 GB minimum
```

## Image Tags

Published image:

```text
ngynduc/forenotes:latest
ngynduc/forenotes:main-acab558
```

Use the versioned tag for production so upgrades are deliberate. Use `latest` only when you intentionally want the newest published image.

## Clean Folder Install

Create an install directory:

```bash
mkdir -p forenotes-prod
cd forenotes-prod
```

Download the production Compose and environment template:

```bash
curl -fsSLO https://raw.githubusercontent.com/ngynduc/forenotes/main/docker-compose.prod.yml
curl -fsSLO https://raw.githubusercontent.com/ngynduc/forenotes/main/.env.production.example
cp .env.production.example .env.production
```

If you received these files in a release bundle, place `docker-compose.prod.yml` and `.env.production.example` in the install directory, then copy the environment file:

```bash
cp .env.production.example .env.production
```

Edit `.env.production` before first start:

```bash
nano .env.production
```

Generate secrets:

```bash
openssl rand -base64 48
```

Change every placeholder password and secret before production use.

## Required Environment Variables

Set these values in `.env.production`:

```text
NODE_ENV=production
FORENOTES_IMAGE=ngynduc/forenotes:main-acab558
APP_HOST=0.0.0.0
APP_PORT=3000
FORENOTES_HOST_PORT=3000
POSTGRES_USER=forenotes
POSTGRES_PASSWORD=<long random database password>
POSTGRES_DB=forenotes
DATABASE_URL=postgres://forenotes:<long random database password>@postgres:5432/forenotes
FORENOTES_BOOTSTRAP_ADMIN_USERNAME=admin
FORENOTES_BOOTSTRAP_ADMIN_EMAIL=admin@example.com
FORENOTES_BOOTSTRAP_ADMIN_DISPLAY_NAME=Forenotes Admin
FORENOTES_BOOTSTRAP_ADMIN_PASSWORD=<long random temporary admin password>
FORENOTES_BOOTSTRAP_ADMIN_TEMPORARY=true
FORENOTES_LLM_SECRET_KEY=<32+ random characters>
SECURE_SESSION_COOKIES=true
```

Use `SECURE_SESSION_COOKIES=false` only for local HTTP testing. Keep it `true` behind HTTPS.

Forenotes uses database-backed opaque session cookies in this release. `SESSION_SECRET` and `JWT_SECRET` are not used.

## Example .env.production

```dotenv
NODE_ENV=production
FORENOTES_IMAGE=ngynduc/forenotes:main-acab558

APP_HOST=0.0.0.0
APP_PORT=3000
FORENOTES_HOST_PORT=3000

POSTGRES_USER=forenotes
POSTGRES_PASSWORD=replace_with_a_long_random_database_password
POSTGRES_DB=forenotes
DATABASE_URL=postgres://forenotes:replace_with_a_long_random_database_password@postgres:5432/forenotes

FORENOTES_BOOTSTRAP_ADMIN_USERNAME=admin
FORENOTES_BOOTSTRAP_ADMIN_EMAIL=admin@example.com
FORENOTES_BOOTSTRAP_ADMIN_DISPLAY_NAME=Forenotes Admin
FORENOTES_BOOTSTRAP_ADMIN_PASSWORD=replace_with_a_long_random_temporary_admin_password
FORENOTES_BOOTSTRAP_ADMIN_TEMPORARY=true

FORENOTES_LLM_SECRET_KEY=replace_with_at_least_32_random_characters
SECURE_SESSION_COOKIES=true

LITELLM_SERVICE_URL=
LLM_PROVIDER=
LLM_MODEL=
LLM_API_KEY=
LLM_API_ENDPOINT=
LLM_SYSTEM_PROMPT=
LLM_CUSTOM_HEADERS_JSON={}
```

## Docker Compose Production Example

```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:?set POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?set POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:?set POSTGRES_DB}
    volumes:
      - forenotes_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \"$${POSTGRES_USER}\" -d \"$${POSTGRES_DB}\""]
      interval: 5s
      timeout: 3s
      retries: 10

  app:
    image: ${FORENOTES_IMAGE:-ngynduc/forenotes:latest}
    restart: unless-stopped
    environment:
      NODE_ENV: production
      APP_HOST: ${APP_HOST:-0.0.0.0}
      APP_PORT: ${APP_PORT:-3000}
      DATABASE_URL: ${DATABASE_URL:?set DATABASE_URL}
      FORENOTES_DATA_DIR: /app/data
      FORENOTES_BOOTSTRAP_ADMIN_USERNAME: ${FORENOTES_BOOTSTRAP_ADMIN_USERNAME:?set FORENOTES_BOOTSTRAP_ADMIN_USERNAME}
      FORENOTES_BOOTSTRAP_ADMIN_EMAIL: ${FORENOTES_BOOTSTRAP_ADMIN_EMAIL:?set FORENOTES_BOOTSTRAP_ADMIN_EMAIL}
      FORENOTES_BOOTSTRAP_ADMIN_DISPLAY_NAME: ${FORENOTES_BOOTSTRAP_ADMIN_DISPLAY_NAME:?set FORENOTES_BOOTSTRAP_ADMIN_DISPLAY_NAME}
      FORENOTES_BOOTSTRAP_ADMIN_PASSWORD: ${FORENOTES_BOOTSTRAP_ADMIN_PASSWORD:?set FORENOTES_BOOTSTRAP_ADMIN_PASSWORD}
      FORENOTES_BOOTSTRAP_ADMIN_TEMPORARY: ${FORENOTES_BOOTSTRAP_ADMIN_TEMPORARY:-true}
      FORENOTES_LLM_SECRET_KEY: ${FORENOTES_LLM_SECRET_KEY:?set FORENOTES_LLM_SECRET_KEY}
      SECURE_SESSION_COOKIES: ${SECURE_SESSION_COOKIES:-true}
      LITELLM_SERVICE_URL: ${LITELLM_SERVICE_URL:-}
      LLM_PROVIDER: ${LLM_PROVIDER:-}
      LLM_MODEL: ${LLM_MODEL:-}
      LLM_API_KEY: ${LLM_API_KEY:-}
      LLM_API_ENDPOINT: ${LLM_API_ENDPOINT:-}
      LLM_SYSTEM_PROMPT: ${LLM_SYSTEM_PROMPT:-}
      LLM_CUSTOM_HEADERS_JSON: ${LLM_CUSTOM_HEADERS_JSON:-{}}
    ports:
      - "${FORENOTES_HOST_PORT:-3000}:${APP_PORT:-3000}"
    volumes:
      - forenotes_app_data:/app/data

volumes:
  forenotes_postgres_data:
  forenotes_app_data:
```

## Pull And Start

Pull the image:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production pull
```

Start PostgreSQL and wait until it is healthy:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d postgres
docker compose -f docker-compose.prod.yml --env-file .env.production ps postgres
```

Start Forenotes:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d app
```

Check status:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production ps
```

View app logs:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f app
```

Open the app:

```text
http://localhost:3000
```

On a server, replace `localhost` with the server hostname or IP address. Log in with `FORENOTES_BOOTSTRAP_ADMIN_USERNAME` and `FORENOTES_BOOTSTRAP_ADMIN_PASSWORD`, then change the temporary password.

## Stop

Stop containers while keeping volumes:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production down
```

Delete containers and volumes only when you intentionally want to remove the database and uploaded app data:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production down -v
```

## Upgrade

Back up the database before upgrading.

Pin the next version in `.env.production`:

```dotenv
FORENOTES_IMAGE=ngynduc/forenotes:main-acab558
```

Pull and recreate the app:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production pull app
docker compose -f docker-compose.prod.yml --env-file .env.production up -d app
```

The app runs migrations before it starts.

## PostgreSQL Configuration

For the bundled PostgreSQL container, keep `DATABASE_URL` pointed at the Compose service name:

```dotenv
POSTGRES_USER=forenotes
POSTGRES_PASSWORD=<long random database password>
POSTGRES_DB=forenotes
DATABASE_URL=postgres://forenotes:<long random database password>@postgres:5432/forenotes
```

To use external PostgreSQL, point `DATABASE_URL` at the external host and start only the app service:

```dotenv
DATABASE_URL=postgres://forenotes:<password>@db.example.internal:5432/forenotes
```

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d app
```

The external database must already exist and the configured user must be able to create tables, indexes, and constraints. The `postgres` service may remain in `docker-compose.prod.yml`; `up -d app` starts only the app because the production Compose file does not declare `depends_on`.

## Report LLM Service

AI report generation calls the service URL configured by `LITELLM_SERVICE_URL`.

Example:

```dotenv
LITELLM_SERVICE_URL=http://llm-service.example.internal:8001
```

Leave `LITELLM_SERVICE_URL` empty if you are not running a report LLM service. The app still starts. Service-backed report generation is unavailable until the URL and provider settings are configured.

Optional environment-level provider defaults:

```dotenv
LLM_PROVIDER=openai
LLM_MODEL=gpt-4.1-mini
LLM_API_KEY=<provider key>
LLM_API_ENDPOINT=
LLM_SYSTEM_PROMPT=
LLM_CUSTOM_HEADERS_JSON={}
```

Users can also configure LLM settings inside the app.

## Bootstrap Admin

The startup migration path creates the first admin only when no admin exists.

Required bootstrap variables:

```dotenv
FORENOTES_BOOTSTRAP_ADMIN_USERNAME=admin
FORENOTES_BOOTSTRAP_ADMIN_EMAIL=admin@example.com
FORENOTES_BOOTSTRAP_ADMIN_DISPLAY_NAME=Forenotes Admin
FORENOTES_BOOTSTRAP_ADMIN_PASSWORD=<long random temporary admin password>
FORENOTES_BOOTSTRAP_ADMIN_TEMPORARY=true
```

The production app refuses to start if `FORENOTES_BOOTSTRAP_ADMIN_PASSWORD` is missing, still set to the default, or shorter than 12 characters.

To rerun bootstrap manually:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm app npm run bootstrap:admin
```

## Migrations

The app runs migrations on startup. To run them manually:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm app npm run db:migrate
```

Migrations are written to be re-runnable. Failures exit non-zero and are printed in the app logs.

## Backup And Restore

Backup bundled PostgreSQL:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production exec postgres sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > forenotes-backup.sql
```

Restore bundled PostgreSQL:

```bash
cat forenotes-backup.sql | docker compose -f docker-compose.prod.yml --env-file .env.production exec -T postgres sh -c 'psql -U "$POSTGRES_USER" "$POSTGRES_DB"'
```

For external PostgreSQL, use your database platform's backup and restore procedure.

## Publisher Build And Push Commands

These are the exact production image commands used for the published tags:

```bash
docker build --pull --target runtime -f Dockerfile -t ngynduc/forenotes:main-acab558 -t ngynduc/forenotes:latest .
docker push ngynduc/forenotes:main-acab558
docker push ngynduc/forenotes:latest
```

This uses the production Dockerfile runtime target, not `Dockerfile.dev`.

## Troubleshooting

### Missing environment variable

Compose exits with a message like `set DATABASE_URL` when a required variable is missing.

Check the file:

```bash
grep -n 'DATABASE_URL\|FORENOTES_BOOTSTRAP_ADMIN_PASSWORD\|FORENOTES_LLM_SECRET_KEY' .env.production
```

Then retry:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

### Production environment validation fails

The app refuses unsafe production settings. View the app logs:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production logs app
```

Common causes:

- `DATABASE_URL` is missing or uses default checked-in credentials
- `FORENOTES_BOOTSTRAP_ADMIN_PASSWORD` is missing, default, or shorter than 12 characters
- `FORENOTES_LLM_SECRET_KEY` is missing or shorter than 32 characters
- demo mode or header authentication is enabled in production

### Database connection errors

For bundled PostgreSQL, verify the database service is healthy:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production ps postgres
docker compose -f docker-compose.prod.yml --env-file .env.production logs postgres
```

Verify `DATABASE_URL` uses host `postgres` and matches `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB`.

If the app started before PostgreSQL became healthy on first boot, recreate the app after Postgres is healthy:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d app
```

For external PostgreSQL, verify DNS, firewall rules, database name, username, password, and TLS requirements.

### Port conflict

If port `3000` is already in use, change `FORENOTES_HOST_PORT`:

```dotenv
FORENOTES_HOST_PORT=3100
```

Restart:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

Open:

```text
http://localhost:3100
```

### Report LLM service errors

Check that `LITELLM_SERVICE_URL` points to the report LLM service from inside the app container:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production exec app sh -c 'wget -qO- "$LITELLM_SERVICE_URL/health"'
```

If the URL is empty, service-backed report generation is not configured.

### Cannot log in

Check startup logs for bootstrap output and validation errors:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production logs app
```

If an admin already exists, bootstrap will not overwrite it. Use the existing admin account or reset through the database using your operational recovery procedure.

## Security Notes

- Change all default secrets.
- Change the bootstrap admin password after first login.
- Do not expose PostgreSQL to the public internet.
- Use HTTPS behind a reverse proxy for real deployments.
- Keep backups secure.
- Do not commit `.env.production`.
- Restrict server access.
- Keep `FORENOTES_LLM_SECRET_KEY` stable; changing it prevents decrypting stored user LLM API keys.
