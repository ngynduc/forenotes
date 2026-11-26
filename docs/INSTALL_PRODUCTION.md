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

## Fast install

On a fresh Docker host, the installer downloads the production Compose file, generates the database/app/admin secrets, starts the stack, waits for `/api/health`, and prints the first-login password:

```bash
curl -fsSL https://raw.githubusercontent.com/ngynduc/forenotes/main/install.sh | bash
```

It creates `forenotes-prod/` in the current directory. Use `--dir /opt/forenotes --port 8080` to customize the location and port. Existing `.env.production` files are preserved, so rerunning the command does not rotate credentials.

The fast installer uses `SECURE_SESSION_COOKIES=false` so a new local HTTP install works immediately. For an HTTPS deployment, set the value to `true` in `.env.production` before starting, or run the installer with `--secure-cookies`. When rerunning the installer against an existing directory, `--secure-cookies` updates the persisted environment file safely.

For audited or pinned deployments, continue with the manual install below and set `FORENOTES_IMAGE` to a versioned image tag.

Recommended baseline:

```text
CPU: 2 cores minimum
RAM: 4 GB minimum
Storage: 20 GB minimum
```

## Image Tags

Pin the image to a published release:

```dotenv
FORENOTES_IMAGE=ngynduc/forenotes:<release-tag>
```

Replace `<release-tag>` with an available full version tag. Since this release the app calls the LLM provider directly; the separate `forenotes-report-llm` image is no longer used.

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
FORENOTES_IMAGE=ngynduc/forenotes:<release-tag>
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
FORENOTES_MCP_ENABLED=false
FORENOTES_MCP_PUBLIC_URL=
FORENOTES_MCP_ALLOWED_ORIGINS=
```

Use `SECURE_SESSION_COOKIES=false` only for local HTTP testing. Keep it `true` behind HTTPS.

MCP is disabled by default. To enable it, set `FORENOTES_MCP_ENABLED=true`, set the externally reachable HTTPS endpoint such as `FORENOTES_MCP_PUBLIC_URL=https://forenotes.example.com/mcp`, and optionally provide comma-separated additional browser origins in `FORENOTES_MCP_ALLOWED_ORIGINS`. The public URL is also used to validate the request Host and Origin.

Forenotes uses database-backed opaque session cookies in this release. `SESSION_SECRET` and `JWT_SECRET` are not used.

## Example .env.production

```dotenv
NODE_ENV=production
FORENOTES_IMAGE=ngynduc/forenotes:<release-tag>

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

FORENOTES_MCP_ENABLED=false
FORENOTES_MCP_PUBLIC_URL=
FORENOTES_MCP_ALLOWED_ORIGINS=

LLM_PROVIDER=
LLM_MODEL=
LLM_API_KEY=
LLM_API_ENDPOINT=
FORENOTES_LLM_ALLOWED_HOSTS=
LLM_SYSTEM_PROMPT=
LLM_CUSTOM_HEADERS_JSON={}
```

## Docker Compose Production Services

Use the downloaded `docker-compose.prod.yml` as the source of truth. It starts `postgres` and `app`. The app waits for the Postgres healthcheck.

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

### HTTP access logs

App builds containing HTTP access logging write one JSON line per completed request to stdout, visible through the command above or `docker logs -f <app-container>`. The published `0.2.2` image predates this feature; use a subsequent image containing the change or rebuild the app.

```json
{"timestamp":"2026-10-03T12:00:00.000Z","event":"http_request","method":"GET","path":"/api/cases","status":200,"durationMs":18.42,"outcome":"completed"}
```

API, MCP, static assets, and health requests are logged automatically. Query strings, headers, cookies, and request/response bodies are excluded. If a connection closes before the response finishes, `outcome` is `aborted` and `status` is `null`; no completed HTTP status is implied. Paths retain resource IDs and filenames.

The Docker healthcheck still probes `/api/health` every 30 seconds. Its request appears in app access logs; Docker stores its health result separately in `docker inspect --format '{{json .State.Health}}' <app-container>`.

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
FORENOTES_IMAGE=ngynduc/forenotes:<release-tag>
```

Pull and recreate the app:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production pull app
docker compose -f docker-compose.prod.yml --env-file .env.production up -d app
```

The app runs migrations before it starts. Keep the install directory and Compose project name unchanged so existing volumes are reused.

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

The external database must already exist and the configured user must be able to create tables, indexes, and constraints. `up -d app` does not start bundled PostgreSQL.

## AI Reports

The app calls the configured model provider directly over its OpenAI-compatible Chat Completions API:

```text
Forenotes app → configured model provider
```

The container starts without provider credentials. Configure a provider, model, and API key in user settings or the `LLM_*` environment variables before using AI reports. Manual reports work without provider settings. `FORENOTES_LLM_SECRET_KEY` encrypts saved keys; it is not a provider API key. Requests time out after `LLM_TIMEOUT_MS` (default 180000).

Known providers (OpenAI, Anthropic, Gemini, OpenRouter, xAI, Groq, Z.ai, Ollama) work without an API base URL. Any other provider, or a gateway, needs `LLM_API_ENDPOINT` set to its OpenAI-compatible base URL. In production, custom endpoints must also be listed in `FORENOTES_LLM_ALLOWED_HOSTS`.

Upgrading from a release with the separate report service: download the updated Compose file, remove `LITELLM_SERVICE_URL` and `FORENOTES_REPORT_LLM_IMAGE` from `.env.production` (they are ignored if left), then run:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production pull app
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --remove-orphans app
```

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

Saved report bodies live in the app data volume. Keep the database dump and data
archive together, and stop the app while taking or restoring this backup pair.

Backup bundled PostgreSQL:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production stop app
docker compose -f docker-compose.prod.yml --env-file .env.production exec postgres sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > forenotes-backup.sql

# Back up saved report bodies, task notes, and uploaded images from the app data volume.
APP_CONTAINER="$(docker compose -f docker-compose.prod.yml --env-file .env.production ps -aq app)"
docker run --rm --volumes-from "$APP_CONTAINER" -v "$PWD":/backup alpine \
  tar czf /backup/forenotes-app-data.tar.gz -C /app/data .

# Preserve the environment file and especially FORENOTES_LLM_SECRET_KEY.
umask 077
cp .env.production forenotes-env.production.backup
docker compose -f docker-compose.prod.yml --env-file .env.production up -d app
```

Restore bundled PostgreSQL:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production stop app
cat forenotes-backup.sql | docker compose -f docker-compose.prod.yml --env-file .env.production exec -T postgres sh -c 'psql -U "$POSTGRES_USER" "$POSTGRES_DB"'

# Restore app data into the named volume after stopping the app.
APP_CONTAINER="$(docker compose -f docker-compose.prod.yml --env-file .env.production ps -aq app)"
docker run --rm --volumes-from "$APP_CONTAINER" -v "$PWD":/backup alpine \
  tar xzf /backup/forenotes-app-data.tar.gz -C /app/data
docker compose -f docker-compose.prod.yml --env-file .env.production up -d app
```

For external PostgreSQL, use your database platform's backup and restore procedure. Restore the data archive and the exact environment file as well; changing `FORENOTES_LLM_SECRET_KEY` makes stored provider credentials undecryptable. Test the procedure on a disposable host before relying on it.

## Publisher Build And Push Commands

See [RELEASING.md](./RELEASING.md). Publish the image before updating installation defaults to that release.

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

### AI report errors

Use **Settings → LLM → Test connection**. The error shows the provider's HTTP status and message. Check the model name, API key, and base URL, and that the app container can reach the provider:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production logs app
```

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
