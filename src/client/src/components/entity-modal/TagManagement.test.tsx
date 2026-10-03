import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TagManagement } from "./TagManagement";

const attackTags = [{ id: "attack-1", attackId: "T1003", name: "Credential Dumping" }];
describe("Tag removal controls", () => {
  it("renders an accessible remove action in editable mode", () => {
    const html = renderToStaticMarkup(<TagManagement attackTags={attackTags} onRemoveAttackTag={() => undefined} />);
    expect(html).toContain('aria-label="Remove T1003"');
    expect(html).toContain('type="button"');
  });
  it("disables removal while saving and hides actions in read-only mode", () => {
    expect(renderToStaticMarkup(<TagManagement attackTags={attackTags} disabled onRemoveAttackTag={() => undefined} />)).toContain('disabled=""');
    expect(renderToStaticMarkup(<TagManagement attackTags={attackTags} />)).not.toContain("button");
  });
});
