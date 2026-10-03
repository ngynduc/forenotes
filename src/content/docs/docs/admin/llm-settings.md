---
title: LLM settings
description: Configure optional AI-assisted report drafting without weakening endpoint or credential controls.
---

AI-assisted report generation is optional. Cases, evidence, notes, timelines, and manual reports continue to work without an LLM provider.

## Deployment settings

From release 0.2.2, production Compose includes `report-llm-service` using a separate published image. It starts without provider credentials and is reachable only inside the Compose network. The app waits for the service healthcheck.

If your installation has only `app` and `postgres`, follow the [upgrade guide](/docs/operations/upgrade/) to replace Compose and pin both images. Changing the app image alone does not create the report service.

Configure the report service and provider in `.env.production`:

```dotenv
LITELLM_SERVICE_URL=http://report-llm-service:8001
FORENOTES_REPORT_LLM_IMAGE=ngynduc/forenotes-report-llm:<image-tag>
LLM_PROVIDER=openai
LLM_MODEL=gpt-4.1-mini
LLM_API_KEY=replace-with-provider-key
LLM_API_ENDPOINT=
LLM_CUSTOM_HEADERS_JSON={}
```

Replace `<image-tag>` with the same published version as the application. Keep an existing external `LITELLM_SERVICE_URL` when using an independently hosted report service. Apply deployment-level changes to both containers:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production \
  up -d app report-llm-service
```

## Per-user credentials

Users can save their own provider settings in Forenotes. API keys are encrypted with `FORENOTES_LLM_SECRET_KEY` before storage.

Back up that key with the database. Replacing it makes existing saved credentials unreadable.

## Custom endpoints

Custom endpoints should use HTTPS and a hostname listed in `FORENOTES_LLM_ALLOWED_HOSTS`. The application blocks unsafe private, loopback, and non-HTTPS endpoints by default.

`FORENOTES_ALLOW_UNSAFE_LLM_ENDPOINTS=true` disables these protections. Reserve it for an isolated local lab, never a shared or internet-facing deployment.

## Verify the service

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production \
  exec app sh -c 'wget -qO- "$LITELLM_SERVICE_URL/health"'
```

Then generate a short draft from a test case that contains no sensitive customer data.

If health fails, inspect `docker compose -f docker-compose.prod.yml --env-file .env.production logs --tail=100 report-llm-service`. A healthy service confirms connectivity; generating a draft also tests provider credentials and model configuration.

For investigation agents, configure the separate [MCP endpoint](/docs/admin/mcp/).
