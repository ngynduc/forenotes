import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  InlineEntityTable,
  draftToPayload,
  validateDraft,
  type InlineTableField,
} from "./InlineEntityTable";
import type { ColumnDef } from "@/config/table-definitions";

const timelineFields: InlineTableField[] = [
  { key: "eventTime", label: "Timestamp", type: "datetime-local", required: true },
  { key: "title", label: "Event", type: "text", required: true },
  { key: "source", label: "Source", type: "text" },
  { key: "description", label: "Summary", type: "text" },
];

const findingColumns: ColumnDef[] = [
  { key: "title", label: "Finding", sortKey: "title", title: true, editable: true },
  { key: "status", label: "Status", sortKey: "status", editable: true },
  { key: "description", label: "Summary", sortKey: "description", editable: true },
];

describe("InlineEntityTable helpers", () => {
  it("validates required inline timeline fields without dropping draft values", () => {
    const errors = validateDraft(timelineFields, {
      eventTime: "",
      title: "  ",
      source: "EDR",
      description: "Kept while validation fails",
    });

    expect(errors).toEqual(["Timestamp is required.", "Event is required."]);
  });

  it("builds create/update payloads with UTC timeline timestamps and optional empty fields removed", () => {
    const payload = draftToPayload(timelineFields, {
      eventTime: "2026-06-02T14:30",
      title: "PowerShell execution",
      source: "",
      description: "Encoded command observed",
    });

    expect(payload).toMatchObject({
      eventTime: expect.stringMatching(/^2026-06-02T/),
      title: "PowerShell execution",
      description: "Encoded command observed",
    });
    expect(payload).not.toHaveProperty("source");
  });

  it("renders read-only rows without inline add or editable controls", () => {
    const html = renderToStaticMarkup(
      <InlineEntityTable
        columns={findingColumns}
        data={[{ id: "finding-1", title: "Suspicious login", status: "draft", description: "VPN anomaly" }]}
        fields={[
          { key: "title", label: "Title", type: "text", required: true },
          { key: "status", label: "Status", type: "select", required: true, options: ["draft", "confirmed"] },
          { key: "description", label: "Summary", type: "text" },
        ]}
        canCreate={false}
        canUpdate={false}
        createLabel="Add Finding"
        createRecord={async () => ({})}
        updateRecord={async () => undefined}
        onOpenDetails={() => undefined}
      />
    );

    expect(html).toContain("Suspicious login");
    expect(html).toContain("Details");
    expect(html).not.toContain("Add Finding");
    expect(html).not.toContain("aria-label=\"Title\"");
  });
});
