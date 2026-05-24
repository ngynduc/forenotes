# Forenotes Report LLM Service

Small FastAPI service that owns report LLM generation for Forenotes. The Node backend calls this service instead of speaking to model providers directly. The service uses the LiteLLM Python SDK internally as a provider interface.

## Run Locally

```bash
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 8001
```

Configure the Forenotes backend with:

```env
REPORT_LLM_SERVICE_URL=http://localhost:8001
LLM_PROVIDER=openai-compatible
LLM_MODEL=GLM-4.7
LLM_API_KEY=
LLM_API_ENDPOINT=https://api.z.ai/api/paas/v4
LLM_CUSTOM_HEADERS_JSON={}
```

User LLM settings in Forenotes override the `LLM_*` provider settings. `REPORT_LLM_SERVICE_URL` always points to this service.

For Z.ai, set Provider to `openai-compatible`, Model to `GLM-4.7`, API Base URL to `https://api.z.ai/api/paas/v4`, and provide the user API key. Optional custom headers can be sent as a JSON object.

## API

`POST /generate-report`

```json
{
  "provider": "openai-compatible",
  "model": "GLM-4.7",
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
  "detail": "LLM provider generation failed: ..."
}
```

The service never returns stack traces, API keys, or custom header values.
