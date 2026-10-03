# Forenotes Production Installation Guide

This guide is for a new operator installing the published Forenotes production image with Docker Compose. You do not need to clone the source repository or build the app image to run production.

The production install runs:

- the Forenotes application image from Docker Hub
- the report LLM service image (`report-llm-service`), reachable only inside the Compose network
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

Pin both images to a published release that includes the report service:

```dotenv
FORENOTES_IMAGE=ngynduc/forenotes:<release-tag>
FORENOTES_REPORT_LLM_IMAGE=ngynduc/forenotes-report-llm:<release-tag>
```

Replace `<release-tag>` with an available full version tag. The app and report service are separate images; the app image alone does not contain Python or LiteLLM. Older releases may have only the app image.

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
FORENOTES_REPORT_LLM_IMAGE=ngynduc/forenotes-report-llm:<release-tag>
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
FORENOTES_REPORT_LLM_IMAGE=ngynduc/forenotes-report-llm:<release-tag>

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

LITELLM_SERVICE_URL=http://report-llm-service:8001
LLM_PROVIDER=
LLM_MODEL=
LLM_API_KEY=
LLM_API_ENDPOINT=
FORENOTES_LLM_ALLOWED_HOSTS=
LLM_SYSTEM_PROMPT=
LLM_CUSTOM_HEADERS_JSON={}
```

## Docker Compose Production Services

Use the downloaded `docker-compose.prod.yml` as the source of truth. It starts `postgres`, `app`, and `report-llm-service`. The app waits for the report service healthcheck. The report service does not publish a host port.

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
FORENOTES_IMAGE=ngynduc/forenotes:<release-tag>
FORENOTES_REPORT_LLM_IMAGE=ngynduc/forenotes-report-llm:<release-tag>
```

Pull and recreate the app:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production pull app report-llm-service
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

The external database must already exist and the configured user must be able to create tables, indexes, and constraints. `up -d app` also starts the report service dependency, but does not start bundled PostgreSQL.

## Report LLM Service

The production stack includes the Python report service. AI report requests follow this path:

```text
Forenotes app → report-llm-service:8001 → configured model provider
```

The default service URL is:

```dotenv
LITELLM_SERVICE_URL=http://report-llm-service:8001
```

The container starts without provider credentials. Configure a provider, model, and API key in user settings or the environment before generating AI reports. Manual reports work without provider settings. `FORENOTES_LLM_SECRET_KEY` encrypts saved keys; it is not a provider API key.

For an independently hosted report service, override `LITELLM_SERVICE_URL` with a URL reachable from the app container. Do not use `localhost` to reach another container or the Docker host.

To add the service to an existing installation, download the updated Compose file, keep your existing environment and secrets, set `FORENOTES_REPORT_LLM_IMAGE` to a published report-service image, and replace an empty or absent `LITELLM_SERVICE_URL` with the default above. Then run:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production pull app report-llm-service
docker compose -f docker-compose.prod.yml --env-file .env.production up -d app report-llm-service
```

Optional environment-level provider defaults:

```dotenv
LLM_PROVIDER=openai
LLM_MODEL=gpt-4.1-mini
LLM_API_KEY=<provider key>
LLM_API_ENDPOINT=
FORENOTES_LLM_ALLOWED_HOSTS=<comma-separated provider hostnames allowed for custom endpoints>
FORENOTES_ALLOW_UNSAFE_LLM_ENDPOINTS=false
LLM_SYSTEM_PROMPT=
LLM_CUSTOM_HEADERS_JSON={}
```

Users can also configure LLM settings inside the app.

For a self-hosted or HTTP OpenAI-compatible gateway such as 9router, set
`FORENOTES_ALLOW_UNSAFE_LLM_ENDPOINTS=true`. This disables HTTPS, private-host,
DNS-rebinding, and production host-allowlist checks for the configured endpoint.
Use it only when the endpoint is trusted and reachable from the app container.

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

# Back up task notes and uploaded report images from the app data volume.
APP_CONTAINER="$(docker compose -f docker-compose.prod.yml --env-file .env.production ps -aq app)"
docker run --rm --volumes-from "$APP_CONTAINER" -v "$PWD":/backup alpine \
  tar czf /backup/forenotes-app-data.tar.gz -C /app/data .

# Preserve the environment file and especially FORENOTES_LLM_SECRET_KEY.
umask 077
cp .env.production forenotes-env.production.backup
```

Restore bundled PostgreSQL:

```bash
cat forenotes-backup.sql | docker compose -f docker-compose.prod.yml --env-file .env.production exec -T postgres sh -c 'psql -U "$POSTGRES_USER" "$POSTGRES_DB"'

# Restore app data into the named volume after stopping the app.
docker compose -f docker-compose.prod.yml --env-file .env.production stop app
APP_CONTAINER="$(docker compose -f docker-compose.prod.yml --env-file .env.production ps -aq app)"
docker run --rm --volumes-from "$APP_CONTAINER" -v "$PWD":/backup alpine \
  tar xzf /backup/forenotes-app-data.tar.gz -C /app/data
docker compose -f docker-compose.prod.yml --env-file .env.production up -d app
```

For external PostgreSQL, use your database platform's backup and restore procedure. Restore the data archive and the exact environment file as well; changing `FORENOTES_LLM_SECRET_KEY` makes stored provider credentials undecryptable. Test the procedure on a disposable host before relying on it.

## Publisher Build And Push Commands

See [RELEASING.md](./RELEASING.md). Publish both images before updating installation defaults to that release.

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

Check `docker compose -f docker-compose.prod.yml --env-file .env.production ps report-llm-service` and its logs. An empty URL uses the client fallback `localhost:8001`, where the app container has no report service. Set the Compose service URL and recreate the app.

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
