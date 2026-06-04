# Forenotes LiteLLM Service

Small FastAPI service that owns report LLM generation for Forenotes. The Node backend calls this service instead of speaking to model providers directly.

## Run Locally

```bash
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 8001
```

Configure the Forenotes backend with:

```env
LITELLM_SERVICE_URL=http://localhost:8001
LLM_PROVIDER=litellm
LLM_MODEL=openai/gpt-4o-mini
LLM_API_KEY=
LLM_API_ENDPOINT=
LLM_CUSTOM_HEADERS_JSON={}
```

User LLM settings in Forenotes override the `LLM_*` provider settings. `LITELLM_SERVICE_URL` always points to this service.

## API

`POST /generate-report`

```json
{
  "model": "openai/gpt-4o-mini",
  "apiKey": "optional-user-api-key",
  "apiBase": "optional-provider-endpoint",
  "customHeaders": {
    "HTTP-Referer": "https://forenotes.local",
    "X-Title": "Forenotes"
  },
  "reportType": "incident",
  "templateMarkdown": "# Report",
  "incidentContext": {}
}
```

Successful response:

```json
{
  "ok": true,
  "markdown": "# Report\n\n..."
}
```

Failure response:

```json
{
  "ok": false,
  "error": "LLM generation failed"
}
```

The service never returns stack traces, API keys, or custom header values.
