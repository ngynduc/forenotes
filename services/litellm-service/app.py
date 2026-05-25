import json
import os
import ipaddress
from typing import Any
from urllib.parse import urlparse

import litellm
from fastapi import FastAPI
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

app = FastAPI(title="Forenotes LiteLLM Service")
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
    model: str
    apiKey: str | None = None
    apiBase: str | None = None
    customHeaders: dict[str, str] = Field(default_factory=dict)
    reportType: str
    templateMarkdown: str
    incidentContext: dict[str, Any]


@app.post("/generate-report")
def generate_report(req: GenerateReportRequest) -> dict[str, Any]:
    try:
        api_base = req.apiBase or os.getenv("LLM_API_ENDPOINT")
        if api_base:
            validate_api_base(api_base)
        custom_headers = validate_custom_headers(req.customHeaders or {})
        user_payload = {
            "task": "Generate report markdown",
            "reportType": req.reportType,
            "templateMarkdown": req.templateMarkdown,
            "incidentContext": req.incidentContext,
        }
        response = litellm.completion(
            model=req.model,
            api_key=req.apiKey or os.getenv("LLM_API_KEY"),
            api_base=api_base,
            extra_headers=custom_headers or None,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": json.dumps(user_payload, separators=(",", ":"))},
            ],
        )
        markdown = response["choices"][0]["message"]["content"]
        if not isinstance(markdown, str) or not markdown.strip():
            return {"ok": False, "error": "LLM generation failed"}
        return {"ok": True, "markdown": markdown.strip()}
    except Exception as exc:
        return {"ok": False, "error": f"LLM generation failed: {exc}"}


def validate_api_base(api_base: str) -> None:
    parsed = urlparse(api_base)
    if parsed.scheme != "https":
        raise ValueError("LLM API base URL must use HTTPS.")
    hostname = (parsed.hostname or "").lower()
    if not hostname or is_blocked_host(hostname):
        raise ValueError("LLM API base URL cannot target local, private, link-local, or metadata hosts.")


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
            raise ValueError("Custom LLM headers cannot override credential, proxy, host, or forwarding headers.")
        if "\r" in raw_value or "\n" in raw_value:
            raise ValueError("Custom LLM header values cannot contain newlines.")
        safe_headers[name] = raw_value
    return safe_headers
