---
title: Configuration
description: Configure networking, PostgreSQL, sessions, bootstrap access, storage, and optional LLM support.
---

Production Compose reads `.env.production`. Keep this file outside source control, restrict its permissions, and include it in protected backups.

## Image pin

```dotenv
FORENOTES_IMAGE=ngynduc/forenotes:<image-tag>
```

Pin the image to a published release. AI reports call the provider directly from the app; configure credentials using [LLM settings](/docs/admin/llm-settings/).

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

### Connection limits and timeouts

```dotenv
DB_POOL_MAX=20
DB_STATEMENT_TIMEOUT_MS=60000
```

The app keeps at most `DB_POOL_MAX` connections. A request that cannot get a connection within 10 seconds fails instead of waiting forever, and PostgreSQL cancels any single query running longer than `DB_STATEMENT_TIMEOUT_MS`. Transactions left idle for 5 minutes are closed. Raise the statement timeout only if very large incidents need longer queries. Migrations run without these limits.

## Persistent files

`FORENOTES_DATA_DIR` defaults to `/app/data` in the container. It contains uploaded evidence images and task-note files. Preserve its volume alongside PostgreSQL.

## Secrets

- Use a bootstrap password of at least 12 characters.
- Use at least 32 random characters for `FORENOTES_LLM_SECRET_KEY`.
- Set `SECURE_SESSION_COOKIES=true` behind HTTPS.
- Never enable `FORENOTES_ALLOW_HEADER_AUTH` in production.

See [environment variables](/docs/reference/environment-variables/) for the full quick-reference table.

## MCP agents

MCP is disabled by default. To connect an investigation agent, set `FORENOTES_MCP_ENABLED=true` and an externally reachable HTTPS `FORENOTES_MCP_PUBLIC_URL`, then recreate the app. Follow [MCP investigation agents](/docs/admin/mcp/) to issue a scoped token and configure your client.
