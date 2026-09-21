---
title: Troubleshooting
description: Diagnose startup, database, port, cookie, and LLM service problems.
---

Start with container state and application logs:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production ps
docker compose -f docker-compose.prod.yml --env-file .env.production logs --tail=200 app postgres
```

## A required variable is missing

Compose reports messages such as `set DATABASE_URL` before containers start. Confirm the required values exist:

```bash
grep -n 'DATABASE_URL\|FORENOTES_BOOTSTRAP_ADMIN_PASSWORD\|FORENOTES_LLM_SECRET_KEY' .env.production
```

Avoid printing the whole environment file into shared logs or chat.

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

## Report generation fails

Check the report service from inside the app container:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production \
  exec app sh -c 'wget -qO- "$LITELLM_SERVICE_URL/health"'
```

Also confirm the model, provider credential, endpoint allowlist, and user-level settings. Core investigation workflows do not depend on the LLM service.
