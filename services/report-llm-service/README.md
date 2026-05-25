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
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o-mini
LLM_API_KEY=your-provider-key
LLM_SYSTEM_PROMPT=Optional custom report-generation system prompt
```

User LLM settings in Forenotes override the `LLM_*` provider settings. `REPORT_LLM_SERVICE_URL` always points to this service.

Supported provider names are normalized by the backend to LiteLLM model prefixes. Examples:

- `openai` + `gpt-4o-mini` -> `openai/gpt-4o-mini`
- `anthropic` + `claude-sonnet-4-5-20250929` -> `anthropic/claude-sonnet-4-5-20250929`
- `gemini` + `gemini-2.5-flash` -> `gemini/gemini-2.5-flash`
- `openrouter` + `openai/gpt-4.1-nano` -> `openrouter/openai/gpt-4.1-nano`
- `xai` + `grok-4.1-fast-non-reasoning` -> `xai/grok-4.1-fast-non-reasoning`
- `groq` + `llama-3.3-70b-versatile` -> `groq/llama-3.3-70b-versatile`
- `zai` + `glm-4.7` -> `zai/glm-4.7`
- `ollama` + `llama3.1` -> `ollama/llama3.1`

For older custom OpenAI-compatible endpoints, `provider=openai-compatible` still works, but it also requires `LLM_API_ENDPOINT`.

## API

`POST /generate-report`

```json
{
  "provider": "openai",
  "model": "gpt-4o-mini",
  "systemPrompt": "Optional per-user or per-env system prompt override.",
  "apiKey": "optional-user-api-key",
  "apiBase": "optional-custom-provider-endpoint",
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
