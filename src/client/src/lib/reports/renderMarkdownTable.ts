const PREFERRED_COLUMNS = [
  "title",
  "severity",
  "status",
  "description",
  "event_time",
  "eventTime",
  "source",
  "priority",
  "note",
  "name",
  "type",
  "value",
  "confidence",
  "attack_id",
  "tactic",
  "summary",
  "clientName",
  "caseName",
];

const HIDDEN_METADATA_COLUMNS = new Set([
  "id",
  "incident_id",
  "incidentId",
  "created_by_user_id",
  "createdByUserId",
  "owner_user_id",
  "ownerUserId",
  "assignee_user_id",
  "assigneeUserId",
  "updated_by_user_id",
  "updatedByUserId",
  "created_at",
  "createdAt",
  "updated_at",
  "updatedAt",
]);

function formatHeader(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function renderTableCell(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "";
  }
  if (Array.isArray(value)) {
    return value.map(renderTableCell).filter(Boolean).join(", ");
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value).replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
}

export function renderMarkdownTable(rows: Record<string, unknown>[]) {
  if (rows.length === 0) {
    return "Not provided";
  }

  const availableColumns = rows.reduce<Set<string>>((keys, row) => {
    Object.entries(row).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "" && !HIDDEN_METADATA_COLUMNS.has(key)) {
        keys.add(key);
      }
    });
    return keys;
  }, new Set<string>());
  const preferredColumns = PREFERRED_COLUMNS.filter((column) => availableColumns.has(column));
  const remainingColumns = Array.from(availableColumns).filter((column) => !preferredColumns.includes(column));
  const columns = [...preferredColumns, ...remainingColumns].slice(0, 6);

  if (columns.length === 0) {
    return "Not provided";
  }

  const header = `| ${columns.map(formatHeader).join(" | ")} |`;
  const separator = `| ${columns.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${columns.map((column) => renderTableCell(row[column])).join(" | ")} |`);
  return [header, separator, ...body].join("\n");
}
