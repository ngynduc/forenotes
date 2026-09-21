---
title: Configuration
description: Configure networking, PostgreSQL, sessions, bootstrap access, storage, and optional LLM support.
---

Production Compose reads `.env.production`. Keep this file outside source control, restrict its permissions, and include it in protected backups.

## Networking

```dotenv
APP_HOST=0.0.0.0
APP_PORT=3000
FORENOTES_HOST_PORT=3000
```

`APP_PORT` is the port inside the container. `FORENOTES_HOST_PORT` is the port exposed by the host.

## PostgreSQL

For bundled PostgreSQL, use the Compose service name:

```dotenv
POSTGRES_USER=forenotes
POSTGRES_PASSWORD=replace-with-a-long-random-password
POSTGRES_DB=forenotes
DATABASE_URL=postgres://forenotes:replace-with-a-long-random-password@postgres:5432/forenotes
```

For managed PostgreSQL, set `DATABASE_URL` to the provider connection string and apply its TLS requirements.

## Persistent files

`FORENOTES_DATA_DIR` defaults to `/app/data` in the container. It contains uploaded evidence images and task-note files. Preserve its volume alongside PostgreSQL.

## Secrets

- Use a bootstrap password of at least 12 characters.
- Use at least 32 random characters for `FORENOTES_LLM_SECRET_KEY`.
- Set `SECURE_SESSION_COOKIES=true` behind HTTPS.
- Never enable `FORENOTES_ALLOW_HEADER_AUTH` in production.

See [environment variables](/docs/reference/environment-variables/) for the full quick-reference table.
