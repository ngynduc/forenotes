---
title: Troubleshooting
description: Diagnose startup, database, port, cookie, and LLM provider problems.
---

Start with container state and application logs:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production ps
docker compose -f docker-compose.prod.yml --env-file .env.production logs --tail=200 app postgres
```

## HTTP access logs

App builds containing HTTP access logging write one JSON line per request to stdout. The published `0.2.2` image predates this feature; use a subsequent image containing the change or rebuild the app.

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f app
# Or use the actual app container name:
APP_CONTAINER='<app-container>'
docker logs -f --tail 100 "$APP_CONTAINER"
```

```json
{"timestamp":"2026-10-03T12:00:00.000Z","event":"http_request","method":"GET","path":"/api/cases","status":200,"durationMs":18.42,"outcome":"completed"}
```

Logs cover API, MCP, static assets, and health requests. They omit query strings, headers, cookies, and request/response bodies. Paths retain resource IDs and filenames. An interrupted response has `outcome: "aborted"` and `status: null`, so it is distinguishable from a completed response.

The `/api/health` probe appears every 30 seconds in app access logs. Docker stores healthcheck results separately:

```bash
docker inspect --format '{{json .State.Health}}' "$APP_CONTAINER"
```

## A required variable is missing

Compose reports messages such as `set DATABASE_URL` before containers start. Confirm the required values exist:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production config --quiet
```

This validates Compose without printing resolved secrets. Check the named variable locally; avoid copying credentials into shared logs or chat.

## Production validation rejects the configuration

Common causes are default database credentials, a bootstrap password shorter than 12 characters, a missing 32-character LLM encryption key, demo mode, or header authentication.

## PostgreSQL is unreachable

With bundled PostgreSQL, the hostname in `DATABASE_URL` must be `postgres`, not `localhost`. Its username, password, and database must match the `POSTGRES_*` values.

## Port 3000 is already in use

Change only the host port:

```dotenv
FORENOTES_HOST_PORT=3100
```

Then recreate the stack and open port `3100`.

## Login loops over HTTP

Secure cookies require HTTPS. For a local-only HTTP evaluation set `SECURE_SESSION_COOKIES=false`; restore `true` before placing the service behind HTTPS.

## The app is unhealthy or requests fail fast

`/api/health` runs a database query and returns `503` when PostgreSQL is unreachable. Check the `postgres` container and `DATABASE_URL`.

Errors such as `timeout exceeded when trying to connect` mean every database connection was busy for 10 seconds. Look for slow requests in the access logs, or raise `DB_POOL_MAX`. `canceling statement due to statement timeout` means a query ran longer than `DB_STATEMENT_TIMEOUT_MS`. The app logs dropped idle connections as `db_pool_error` and keeps running.

Docker's restart policy restarts a container that exits, not one that is only marked unhealthy.

## A report-llm-service container is still running

From 0.2.6 the app calls the provider directly. Remove the leftover container with `docker compose -f docker-compose.prod.yml --env-file .env.production up -d --remove-orphans`.

## AI reports fail

Open **Settings → LLM** and choose **Test connection**. The message shows the provider's HTTP status and reason:

- `404` or "not found": the model name is wrong or unavailable to your account;
- `401` or `403`: the API key is invalid or lacks access;
- "needs an OpenAI-compatible API base URL": a custom provider name requires `LLM_API_ENDPOINT`;
- "must be listed in FORENOTES_LLM_ALLOWED_HOSTS": add the endpoint hostname in production.

AI Report Chat also needs a model that supports tool calling. Requests stop after `LLM_TIMEOUT_MS`. Core investigation workflows do not depend on an LLM.

## MCP cannot connect

A disabled endpoint returns `404`. Confirm that Compose passes `FORENOTES_MCP_ENABLED=true` and the public URL into the app, then recreate it. Host/Origin failures indicate a mismatch between the public URL, proxy headers, and allowed origins. Authentication failures may indicate an expired or revoked token, a disabled owner, or required password rotation.

Follow the [MCP troubleshooting table](/docs/admin/mcp/#troubleshooting) for permission, run-state, and support-chain errors.
