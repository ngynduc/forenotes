import json
import os
import ipaddress
from typing import Any
from urllib.parse import urlparse

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
    "custom": {"prefix": None, "local": False, "requires_api_base": False},
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
BLOCKED_HEADER_NAMES = {
    "authorization",
    "cookie",
    "host",
    "proxy-authorization",
    "x-api-key",
    "x-forwarded-for",
    "x-forwarded-host",
    "x-forwarded-proto",
    "x-real-ip",
}


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
    return PROVIDER_SPECS.get(clean_provider, {"prefix": clean_provider, "local": False, "requires_api_base": False})


def normalize_model(provider: str, model: str) -> str:
    clean_model = model.strip()
    if not clean_model:
        raise HTTPException(status_code=400, detail="Missing model.")

    spec = provider_spec(provider)
    prefix = spec["prefix"]
    if prefix is None:
        return clean_model
    if clean_model.lower().startswith(f"{str(prefix).lower()}/"):
        return clean_model
    return f"{prefix}/{clean_model}"


def validate_provider_config(provider: str, model: str, api_key: str | None, api_base: str | None) -> str:
    spec = provider_spec(provider)
    normalized_model = normalize_model(provider, model)
    if spec["requires_api_base"] and not api_base:
        raise HTTPException(status_code=400, detail="Missing API base URL for OpenAI-compatible provider.")
    if not spec["local"] and not api_key:
        raise HTTPException(status_code=400, detail="Missing API key for LLM provider.")
    if api_base:
        validate_api_base(provider, api_base)
    return normalized_model


def validate_api_base(provider: str, api_base: str) -> None:
    parsed = urlparse(api_base)
    if parsed.scheme != "https" and not is_allowed_local_endpoint(provider, parsed):
        raise HTTPException(status_code=400, detail="LLM API base URL must use HTTPS unless using local Ollama in non-production.")
    hostname = (parsed.hostname or "").lower()
    if not hostname or is_blocked_host(hostname):
        raise HTTPException(status_code=400, detail="LLM API base URL cannot target local, private, link-local, or metadata hosts.")


def is_allowed_local_endpoint(provider: str, parsed: Any) -> bool:
    return (
        provider.strip().lower() == "ollama"
        and os.getenv("NODE_ENV") != "production"
        and parsed.scheme == "http"
        and (parsed.hostname or "").lower() in {"localhost", "127.0.0.1", "::1"}
    )


def is_blocked_host(hostname: str) -> bool:
    if hostname in {"localhost", "metadata.google.internal"} or hostname.endswith((".internal", ".local")):
        return True
    try:
        address = ipaddress.ip_address(hostname)
    except ValueError:
        return os.getenv("NODE_ENV") == "production" and "." not in hostname
    return (
        address.is_private
        or address.is_loopback
        or address.is_link_local
        or address.is_multicast
        or address.is_reserved
        or address.is_unspecified
    )


def validate_custom_headers(headers: dict[str, str]) -> dict[str, str]:
    safe_headers: dict[str, str] = {}
    for raw_name, raw_value in headers.items():
        name = raw_name.strip()
        lower_name = name.lower()
        if (
            not name
            or lower_name in BLOCKED_HEADER_NAMES
            or lower_name.startswith(("proxy-", "x-forwarded-", "cf-"))
            or lower_name == "true-client-ip"
        ):
            raise HTTPException(status_code=400, detail="Custom LLM headers cannot override credential, proxy, host, or forwarding headers.")
        if "\r" in raw_value or "\n" in raw_value:
            raise HTTPException(status_code=400, detail="Custom LLM header values cannot contain newlines.")
        safe_headers[name] = raw_value
    return safe_headers


@app.post("/generate-report")
def generate_report(req: GenerateReportRequest) -> dict[str, Any]:
    api_key = req.apiKey or os.getenv("LLM_API_KEY")
    api_base = req.apiBase or os.getenv("LLM_API_ENDPOINT")
    system_prompt = (req.systemPrompt or os.getenv("LLM_SYSTEM_PROMPT") or SYSTEM_PROMPT).strip()
    model = validate_provider_config(req.provider, req.model, api_key, api_base)
    custom_headers = validate_custom_headers(req.customHeaders or {})

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
            extra_headers=custom_headers or None,
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
