# Production Installation

This guide is for operators installing the full Forenotes application with Docker Compose. You do not need to clone the repository if you use the published image and the production Compose file.

## What Runs

- Forenotes application image from Docker Hub
- PostgreSQL from the Compose file, unless you configure an external database
- A database volume for PostgreSQL state
- An app data volume for uploaded files and generated assets
- Startup migrations and first-admin bootstrap

## Requirements

| Requirement | Recommendation |
|-------------|----------------|
| Docker | Current stable Docker Engine |
| Compose | Docker Compose plugin |
| CPU | 2 cores minimum |
| RAM | 4 GB minimum |
| Storage | 20 GB minimum before backups |
| Network | HTTPS-capable reverse proxy for real deployments |

## Pick An Image Tag

Use a release tag when one is available. Use `latest` only for test installs where automatic movement is acceptable.

```dotenv
FORENOTES_IMAGE=ngynduc/forenotes:<release-tag>
```

Check the repository or registry for the current tag before production rollout:

[https://github.com/ngynduc/forenotes](https://github.com/ngynduc/forenotes)

## Install Directory

Create a clean directory:

```bash
mkdir -p forenotes-prod
cd forenotes-prod
```

Download the production Compose file and environment template from the main application branch:

```bash
curl -fsSLO https://raw.githubusercontent.com/ngynduc/forenotes/main/docker-compose.prod.yml
curl -fsSLO https://raw.githubusercontent.com/ngynduc/forenotes/main/.env.production.example
cp .env.production.example .env.production
```

If you received a release bundle, copy `docker-compose.prod.yml` and `.env.production.example` from that bundle instead.

## Required Environment

Edit `.env.production`:

```bash
nano .env.production
```

Generate strong secrets:

```bash
openssl rand -base64 48
```

Set these values before first start:

```dotenv
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
```

Keep `SECURE_SESSION_COOKIES=true` behind HTTPS. Use `false` only for local HTTP testing.

## Start

Pull the image:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production pull
```

Start PostgreSQL first and wait for it to become healthy:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d postgres
docker compose -f docker-compose.prod.yml --env-file .env.production ps postgres
```

Start the app:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d app
```

Check status and logs:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production ps
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f app
```

Open the app at the configured host and port, then sign in with the bootstrap admin credentials and change the temporary password.

## External PostgreSQL

Point `DATABASE_URL` to the external database and start only the app service:

```dotenv
DATABASE_URL=postgres://forenotes:<password>@db.example.internal:5432/forenotes
```

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d app
```

The database must already exist. The configured user must be able to create tables, indexes, and constraints.

## LLM Report Generation

Report generation can call an external LLM service through `LITELLM_SERVICE_URL`.

```dotenv
LITELLM_SERVICE_URL=http://llm-service.example.internal:8001
LLM_PROVIDER=openai
LLM_MODEL=<model-name>
LLM_API_KEY=<provider key>
LLM_API_ENDPOINT=
LLM_SYSTEM_PROMPT=
LLM_CUSTOM_HEADERS_JSON={}
```

Leave `LITELLM_SERVICE_URL` empty if you are not running a report-generation service. The app still starts, but service-backed generation is unavailable.

## Backup And Restore

Back up bundled PostgreSQL:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production exec postgres sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > forenotes-backup.sql
```

Restore bundled PostgreSQL:

```bash
cat forenotes-backup.sql | docker compose -f docker-compose.prod.yml --env-file .env.production exec -T postgres sh -c 'psql -U "$POSTGRES_USER" "$POSTGRES_DB"'
```

For external PostgreSQL, use your database platform's backup and restore procedure.

## Upgrade

Back up the database first. Then change `FORENOTES_IMAGE` to the next release tag:

```dotenv
FORENOTES_IMAGE=ngynduc/forenotes:<next-release-tag>
```

Pull and recreate the app:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production pull app
docker compose -f docker-compose.prod.yml --env-file .env.production up -d app
```

The app runs migrations before it starts.

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Compose says a variable is missing | Confirm `.env.production` is passed with `--env-file` and all required variables are set |
| App exits during production validation | Check default passwords, short secrets, demo mode, and header auth |
| Database connection fails | Confirm `DATABASE_URL`, service name, username, password, firewall, and database existence |
| Port is busy | Change `FORENOTES_HOST_PORT` and recreate the app |
| Cannot log in | Check bootstrap logs and confirm whether an admin already exists |
| Report generation fails | Check `LITELLM_SERVICE_URL` from inside the app container |

## Security Notes

- Change every placeholder secret.
- Change the bootstrap admin password after first login.
- Do not expose PostgreSQL to the public internet.
- Put the app behind HTTPS for real deployments.
- Keep backups encrypted or access-restricted.
- Do not commit `.env.production`.
- Keep `FORENOTES_LLM_SECRET_KEY` stable; changing it prevents decrypting stored user LLM API keys.
