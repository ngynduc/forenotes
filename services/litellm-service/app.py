import json
import os
from typing import Any

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
        user_payload = {
            "task": "Generate report markdown",
            "reportType": req.reportType,
            "templateMarkdown": req.templateMarkdown,
            "incidentContext": req.incidentContext,
        }
        response = litellm.completion(
            model=req.model,
            api_key=req.apiKey or os.getenv("LLM_API_KEY"),
            api_base=req.apiBase or os.getenv("LLM_API_ENDPOINT"),
            extra_headers=req.customHeaders or None,
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
