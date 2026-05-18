export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function option(value, label, selected = false) {
  return `<option value="${escapeHtml(value)}" ${selected ? "selected" : ""}>${escapeHtml(label)}</option>`;
}

export function renderOptions(options, selectedValue) {
  return options.map((entry) => option(entry.value, entry.label, String(entry.value) === String(selectedValue ?? ""))).join("");
}

export function compactText(value, limit = 88) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit);
}

export function cleanObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== "" && entry !== null && entry !== undefined)
  );
}

export function formatDateTime(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString();
}

export function formatDate(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleDateString();
}

export function toDateInputValue(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().slice(0, 10);
}

export function dateInputToIso(value) {
  return value ? new Date(`${value}T00:00:00`).toISOString() : "";
}

export function toLocalInputValue(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const pad = (entry) => String(entry).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function localDateTimeToIso(value) {
  return value ? new Date(value).toISOString() : "";
}

export function comparableValue(value) {
  if (!value) {
    return "";
  }
  const time = Date.parse(value);
  if (!Number.isNaN(time)) {
    return time;
  }
  return String(value).toLowerCase();
}

export function roleLabel(value) {
  return String(value || "none").replaceAll("_", " ");
}

export function summarizeJson(value) {
  if (!value) {
    return "-";
  }
  const parsed = typeof value === "string" ? safeJson(value) : value;
  if (!parsed || typeof parsed !== "object") {
    return compactText(String(value), 120);
  }
  return Object.keys(parsed).slice(0, 5).join(", ") || "-";
}

function safeJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
