---
title: Troubleshooting
description: Diagnose startup, database, port, cookie, and LLM service problems.
---

Start with container state and application logs:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production ps
docker compose -f docker-compose.prod.yml --env-file .env.production logs --tail=200 app postgres report-llm-service
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

## No report-service container exists

Production Compose from 0.2.2 includes `report-llm-service`. If `ps` shows only `app` and `postgres`, the installed Compose file may predate that release. Follow [Upgrade Forenotes](/docs/operations/upgrade/) to replace Compose and pin both images. An app image update alone does not add the service.

## Report generation fails

Check the report service from inside the app container:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production \
  exec app sh -c 'wget -qO- "$LITELLM_SERVICE_URL/health"'
```

Also confirm the model, provider credential, endpoint allowlist, and user-level settings. Core investigation workflows do not depend on the LLM service.


## MCP cannot connect

A disabled endpoint returns `404`. Confirm that Compose passes `FORENOTES_MCP_ENABLED=true` and the public URL into the app, then recreate it. Host/Origin failures indicate a mismatch between the public URL, proxy headers, and allowed origins. Authentication failures may indicate an expired or revoked token, a disabled owner, or required password rotation.

Follow the [MCP troubleshooting table](/docs/admin/mcp/#troubleshooting) for permission, run-state, and support-chain errors.
