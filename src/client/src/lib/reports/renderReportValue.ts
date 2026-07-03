import { renderMarkdownTable } from "./renderMarkdownTable";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function renderScalar(value: unknown) {
  if (value === null || value === undefined) {
    return "Not provided";
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value, null, 2);
}

function renderBulletValue(value: unknown) {
  if (isRecord(value)) {
    return Object.entries(value)
      .filter(([, entryValue]) => entryValue !== null && entryValue !== undefined && entryValue !== "")
      .map(([key, entryValue]) => `${key}: ${renderScalar(entryValue)}`)
      .join("; ");
  }
  return renderScalar(value);
}

export function renderReportValue(value: unknown) {
  if (value === null || value === undefined) {
    return "Not provided";
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "Not provided";
    }
    if (value.every(isRecord)) {
      return renderMarkdownTable(value);
    }
    return value.map((item) => `- ${renderBulletValue(item)}`).join("\n");
  }

  if (isRecord(value)) {
    return renderMarkdownTable([value]);
  }

  return renderScalar(value);
}
