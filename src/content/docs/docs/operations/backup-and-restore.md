---
title: Backup and restore
description: Protect the database, uploaded files, notes, and encryption key as one recoverable set.
---

A complete backup has three parts:

1. PostgreSQL data
2. The `/app/data` volume
3. `.env.production`, especially `FORENOTES_LLM_SECRET_KEY`

## Create a backup

Run these commands from the deployment directory:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production \
  exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' \
  > forenotes-backup.sql

APP_CONTAINER="$(docker compose -f docker-compose.prod.yml \
  --env-file .env.production ps -aq app)"
docker run --rm --volumes-from "$APP_CONTAINER" -v "$PWD":/backup alpine \
  tar czf /backup/forenotes-data.tar.gz -C /app/data .

cp .env.production forenotes-env.backup
chmod 600 forenotes-env.backup
```

Store all three artifacts together in encrypted backup storage.

## Restore

Start a clean stack, then restore PostgreSQL:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production \
  exec -T postgres sh -c 'psql -U "$POSTGRES_USER" "$POSTGRES_DB"' \
  < forenotes-backup.sql
```

Restore application data:

```bash
APP_CONTAINER="$(docker compose -f docker-compose.prod.yml \
  --env-file .env.production ps -aq app)"
docker run --rm --volumes-from "$APP_CONTAINER" -v "$PWD":/backup alpine \
  tar xzf /backup/forenotes-data.tar.gz -C /app/data
```

Restore the matching environment values and restart the stack. Changing `FORENOTES_LLM_SECRET_KEY` prevents decryption of previously saved provider credentials.

Test this procedure on a disposable host before treating a backup policy as complete.
