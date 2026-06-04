# Forenotes v1 Production Installation Guide

## Overview

Forenotes v1 is distributed as a Docker image and can be deployed with Docker Compose.

The production deployment includes:

- Forenotes application container
- PostgreSQL database container
- Persistent database and application data volumes
- Environment-based configuration
- Report LLM sidecar used when AI report generation is configured

## Requirements

- Docker
- Docker Compose
- Linux server, VM, or local workstation
- Open network port for the app, usually `3000`

Recommended baseline:

```text
CPU: 2 cores minimum
RAM: 4 GB minimum
Storage: 20 GB minimum
OS: Linux recommended
```

## Files Included

Expected release files:

```bash
Dockerfile
docker-compose.prod.yml
.env.production.example
docs/INSTALL_PRODUCTION.md
services/report-llm-service/
```

If the release package includes a prebuilt image archive, it may also include:

```bash
forenotes-app-v1.tar
```

## Option A: Build Image From Source

```bash
docker build -t forenotes-app:v1 .
docker tag forenotes-app:v1 forenotes-app:latest
```

## Option B: Load Image From Archive

```bash
docker load -i forenotes-app-v1.tar
docker images | grep forenotes-app
```

## Configure Environment

Copy the production example:

```bash
cp .env.production.example .env.production
```

Edit the file:

```bash
nano .env.production
```

Important settings:

- `APP_HOST`: container bind address. Keep `0.0.0.0` for Docker.
- `APP_PORT`: application port inside the container. Default `3000`.
- `FORENOTES_HOST_PORT`: host port published by Docker Compose.
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`: PostgreSQL container settings.
- `DATABASE_URL`: app database connection string. The host must be `postgres` when using `docker-compose.prod.yml`.
- `FORENOTES_BOOTSTRAP_ADMIN_USERNAME`: first admin username.
- `FORENOTES_BOOTSTRAP_ADMIN_EMAIL`: first admin email.
- `FORENOTES_BOOTSTRAP_ADMIN_DISPLAY_NAME`: first admin display name.
- `FORENOTES_BOOTSTRAP_ADMIN_PASSWORD`: first admin temporary password.
- `FORENOTES_BOOTSTRAP_ADMIN_TEMPORARY`: set `true` to force a password change after first login.
- `FORENOTES_LLM_SECRET_KEY`: 32+ character secret for encrypting stored user LLM API keys.
- `SECURE_SESSION_COOKIES`: set `true` behind HTTPS; use `false` only for local HTTP testing.
- `LLM_PROVIDER`, `LLM_MODEL`, `LLM_API_KEY`, `LLM_API_ENDPOINT`: optional environment-level LLM defaults.
- `LLM_SYSTEM_PROMPT`: optional report-generation system prompt.
- `LLM_CUSTOM_HEADERS_JSON`: optional JSON object for provider-specific headers.

Generate strong secrets:

```bash
openssl rand -base64 48
```

Change every default password and secret before production use. Forenotes v1 uses database-backed opaque session cookies, so `SESSION_SECRET` and `JWT_SECRET` are not used by this release.

## Start Forenotes

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

Check status:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production ps
```

View logs:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f app
```

## Run Database Migrations

The application container runs migrations on startup. You can also run them manually:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm app npm run db:migrate
```

Migrations are written to be re-runnable. Failures exit non-zero and are printed to the app logs.

## Create First Admin User

Forenotes uses env-based first-admin bootstrap. The migration startup path creates the first admin when no admin exists. You can also run the bootstrap command manually after migrations:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm app npm run bootstrap:admin
```

This creates the first admin user only when no admin exists. It does not overwrite existing admin users. Change the temporary password after first login.

## Access The Application

Local workstation:

```text
http://localhost:3000
```

Server:

```text
http://SERVER_IP:3000
```

Log in with the configured bootstrap admin username and password.

## Stop The Application

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production down
```

This keeps the database and application data volumes. To delete volumes, you must explicitly add `-v`.

## Backup And Restore

Backup:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production exec postgres pg_dump -U forenotes forenotes > forenotes-backup.sql
```

Restore:

```bash
cat forenotes-backup.sql | docker compose -f docker-compose.prod.yml --env-file .env.production exec -T postgres psql -U forenotes forenotes
```

Adjust the username and database name if you changed `POSTGRES_USER` or `POSTGRES_DB`.

## Upgrade Process

Always back up the database before upgrading.

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production down
docker load -i forenotes-app-v1-new.tar
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm app npm run db:migrate
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

## Troubleshooting

### App Cannot Connect To Database

Check:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production logs postgres
docker compose -f docker-compose.prod.yml --env-file .env.production logs app
```

Verify `DATABASE_URL` uses the `postgres` hostname and matches the configured database credentials.

### Cannot Log In

Check that migrations and bootstrap ran:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm app npm run db:migrate
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm app npm run bootstrap:admin
```

Verify:

```bash
FORENOTES_BOOTSTRAP_ADMIN_USERNAME
FORENOTES_BOOTSTRAP_ADMIN_PASSWORD
```

### Port Already In Use

Change `FORENOTES_HOST_PORT` in `.env.production`, then restart:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

### LLM Features Do Not Work

LLM settings are optional unless you want AI report generation. Verify:

```bash
LLM_PROVIDER
LLM_API_KEY
LLM_API_ENDPOINT
LLM_MODEL
LLM_CUSTOM_HEADERS_JSON
```

User-owned LLM settings configured in the app override environment defaults.

## Security Notes

- Change all default secrets.
- Change the default admin password after first login.
- Do not expose PostgreSQL to the public internet.
- Use HTTPS behind a reverse proxy for real deployments.
- Keep backups secure.
- Do not commit `.env.production`.
- Restrict server access.
- Keep `FORENOTES_LLM_SECRET_KEY` stable; changing it prevents decrypting stored user LLM API keys.
