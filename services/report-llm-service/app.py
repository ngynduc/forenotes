import json
import os
from typing import Any

import litellm
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field


SYSTEM_PROMPT = (
    "You are assisting with DFIR report writing. "
    "Generate a professional Markdown report using only the provided incident context. "
    "Do not invent facts. "
    "If data is missing, write \"Not provided\" or omit the section. "
    "Return Markdown only. "
    "Do not wrap the response in JSON. "
    "Do not include HTML."
)

app = FastAPI(title="Forenotes Report LLM Service")

PROVIDER_SPECS = {
    "anthropic": {"prefix": "anthropic", "local": False, "requires_api_base": False},
    "custom": {"prefix": "openai", "local": False, "requires_api_base": True},
    "gemini": {"prefix": "gemini", "local": False, "requires_api_base": False},
    "google": {"prefix": "gemini", "local": False, "requires_api_base": False},
    "google-ai-studio": {"prefix": "gemini", "local": False, "requires_api_base": False},
    "groq": {"prefix": "groq", "local": False, "requires_api_base": False},
    "model-prefixed": {"prefix": None, "local": False, "requires_api_base": False},
    "ollama": {"prefix": "ollama", "local": True, "requires_api_base": False},
    "openai": {"prefix": "openai", "local": False, "requires_api_base": False},
    "openai-compatible": {"prefix": "openai", "local": False, "requires_api_base": True},
    "openrouter": {"prefix": "openrouter", "local": False, "requires_api_base": False},
    "xai": {"prefix": "xai", "local": False, "requires_api_base": False},
    "z-ai": {"prefix": "zai", "local": False, "requires_api_base": False},
    "z.ai": {"prefix": "zai", "local": False, "requires_api_base": False},
    "zai": {"prefix": "zai", "local": False, "requires_api_base": False},
}
MODEL_PREFIXES = tuple({f"{spec['prefix']}/" for spec in PROVIDER_SPECS.values() if spec["prefix"]})


class GenerateReportRequest(BaseModel):
    provider: str = "openai"
    model: str
    systemPrompt: str | None = None
    apiKey: str | None = None
    apiBase: str | None = None
    customHeaders: dict[str, str] = Field(default_factory=dict)
    reportType: str
    templateMarkdown: str
    incidentContext: dict[str, Any]


def provider_spec(provider: str) -> dict[str, Any]:
    clean_provider = provider.strip().lower() or "openai"
    if clean_provider == "litellm":
        clean_provider = "model-prefixed"
    return PROVIDER_SPECS.get(clean_provider, {"prefix": clean_provider or "openai", "local": False, "requires_api_base": False})


def normalize_model(provider: str, model: str) -> str:
    clean_model = model.strip()
    if not clean_model:
        raise HTTPException(status_code=400, detail="Missing model.")
    if clean_model.startswith(MODEL_PREFIXES):
        return clean_model

    spec = provider_spec(provider)
    if spec["prefix"] and clean_model.lower().startswith(f"{str(spec['prefix']).lower()}/"):
        return clean_model
    if spec["prefix"]:
        return f"{spec['prefix']}/{clean_model}"
    return clean_model


def validate_provider_config(provider: str, model: str, api_key: str | None, api_base: str | None) -> str:
    spec = provider_spec(provider)
    normalized_model = normalize_model(provider, model)
    if spec["requires_api_base"] and not api_base:
        raise HTTPException(status_code=400, detail="Missing API base URL for OpenAI-compatible provider.")
    if not spec["local"] and not api_key:
        raise HTTPException(status_code=400, detail="Missing API key for LLM provider.")
    return normalized_model


@app.post("/generate-report")
def generate_report(req: GenerateReportRequest) -> dict[str, Any]:
    api_key = req.apiKey or os.getenv("LLM_API_KEY")
    api_base = req.apiBase or os.getenv("LLM_API_ENDPOINT")
    system_prompt = (req.systemPrompt or os.getenv("LLM_SYSTEM_PROMPT") or SYSTEM_PROMPT).strip()
    model = validate_provider_config(req.provider, req.model, api_key, api_base)

    try:
        user_payload = {
            "task": "Generate report markdown",
            "reportType": req.reportType,
            "templateMarkdown": req.templateMarkdown,
            "incidentContext": req.incidentContext,
        }
        response = litellm.completion(
            model=model,
            api_key=api_key,
            api_base=api_base,
            extra_headers=req.customHeaders or None,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(user_payload, separators=(",", ":"))},
            ],
        )
        markdown = response["choices"][0]["message"]["content"]
        if not isinstance(markdown, str) or not markdown.strip():
            raise HTTPException(status_code=502, detail="LLM provider returned an empty response.")
        return {"ok": True, "markdown": markdown.strip()}
    except Exception as exc:
        if isinstance(exc, HTTPException):
            raise
        raise HTTPException(status_code=502, detail=f"LLM provider generation failed: {exc}") from exc
