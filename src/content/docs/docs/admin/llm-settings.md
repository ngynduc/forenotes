---
title: LLM settings
description: Configure optional AI-assisted report drafting without weakening endpoint or credential controls.
---

AI-assisted reports are optional. Cases, evidence, notes, timelines, and manual reports continue to work without an LLM provider.

## How Forenotes reaches the provider

The application calls the provider's OpenAI-compatible Chat Completions API directly. There is no separate report service or container. Releases up to 0.2.5 used a separate `report-llm-service`; 0.2.6 removed it. See the [upgrade guide](/docs/operations/upgrade/) to remove the old container.

AI Report Chat streams answers and calls tools to read incident data, so choose a model that supports tool calling. Requests time out after `LLM_TIMEOUT_MS` (default 180000 ms).

## Deployment settings

Set deployment-wide defaults in `.env.production`:

```dotenv
LLM_PROVIDER=openai
LLM_MODEL=gpt-4.1-mini
LLM_API_KEY=replace-with-provider-key
LLM_API_ENDPOINT=
LLM_CUSTOM_HEADERS_JSON={}
```

Then recreate the app:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d app
```

Known providers work without `LLM_API_ENDPOINT`: `openai`, `anthropic`, `gemini`, `openrouter`, `xai`, `groq`, `zai`, and `ollama`. Anthropic and Gemini are reached through their OpenAI-compatible endpoints. Any other provider name, or a gateway, requires `LLM_API_ENDPOINT` set to its OpenAI-compatible base URL, such as `https://gateway.example.com/v1`.

A model name that starts with the provider name, such as `openai/gpt-4o-mini` with provider `openai`, is sent without that prefix. Other names, such as a gateway's `vendor/model`, are sent unchanged.

## Per-user credentials

Users can save their own provider, model, endpoint, API key, and custom headers in **Settings → LLM**; these override the deployment defaults. API keys are encrypted with `FORENOTES_LLM_SECRET_KEY` before storage.

Back up that key with the database. Replacing it makes existing saved credentials unreadable.

## Custom endpoints

Custom endpoints should use HTTPS and, in production, a hostname listed in `FORENOTES_LLM_ALLOWED_HOSTS`. The application blocks unsafe private, loopback, and non-HTTPS endpoints by default and rechecks the destination before each request.

`FORENOTES_ALLOW_UNSAFE_LLM_ENDPOINTS=true` disables these protections. Reserve it for an isolated local lab, never a shared or internet-facing deployment.

## Verify the configuration

Open **Settings → LLM** and choose **Test connection**. A failure shows the provider's HTTP status and message, such as an unknown model or an invalid key; the API key itself is never shown.

Then ask AI Report Chat a short question in a test case that contains no sensitive customer data, and confirm a tool lookup appears before the answer.

For investigation agents, configure the separate [MCP endpoint](/docs/admin/mcp/).
