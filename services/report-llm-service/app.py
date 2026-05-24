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

LOCAL_PROVIDERS = {"ollama"}
MODEL_PREFIXES = ("openai/", "anthropic/", "gemini/", "ollama/")


class GenerateReportRequest(BaseModel):
    provider: str = "openai-compatible"
    model: str
    apiKey: str | None = None
    apiBase: str | None = None
    customHeaders: dict[str, str] = Field(default_factory=dict)
    reportType: str
    templateMarkdown: str
    incidentContext: dict[str, Any]


def normalize_model(provider: str, model: str) -> str:
    clean_model = model.strip()
    if not clean_model:
        raise HTTPException(status_code=400, detail="Missing model.")
    if clean_model.startswith(MODEL_PREFIXES):
        return clean_model

    clean_provider = provider.strip().lower()
    if clean_provider == "openai-compatible":
        return f"openai/{clean_model}"
    if clean_provider in {"openai", "anthropic", "gemini", "ollama"}:
        return f"{clean_provider}/{clean_model}"
    return clean_model


def validate_provider_config(provider: str, model: str, api_key: str | None, api_base: str | None) -> str:
    clean_provider = provider.strip().lower()
    normalized_model = normalize_model(clean_provider, model)
    if clean_provider == "openai-compatible" and not api_base:
        raise HTTPException(status_code=400, detail="Missing API base URL for OpenAI-compatible provider.")
    if clean_provider not in LOCAL_PROVIDERS and not api_key:
        raise HTTPException(status_code=400, detail="Missing API key for LLM provider.")
    return normalized_model


@app.post("/generate-report")
def generate_report(req: GenerateReportRequest) -> dict[str, Any]:
    api_key = req.apiKey or os.getenv("LLM_API_KEY")
    api_base = req.apiBase or os.getenv("LLM_API_ENDPOINT")
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
                {"role": "system", "content": SYSTEM_PROMPT},
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
