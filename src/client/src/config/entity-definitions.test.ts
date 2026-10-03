import { describe, expect, it } from "vitest";
import { getEntityDefinitions } from "./entity-definitions";

const definitions = getEntityDefinitions(() => ({ activeUserId: "user-1", selectedCaseId: "case-1", selectedIncidentId: "incident-1" }));
describe("User editing definition", () => {
  it("updates existing users through PATCH and loads only editable fields", () => {
    expect(definitions.user.update("user-1")).toEqual({ url: "/api/users/user-1", method: "PATCH" });
    const item = { id: "user-1", username: "analyst", email: "a@example.com", displayName: "Analyst", globalRole: "analyst", status: "active", isBootstrapAdmin: true };
    expect(definitions.user.values(item)).toEqual({ username: "analyst", email: "a@example.com", displayName: "Analyst", globalRole: "analyst", status: "active" });
    expect(definitions.user.values(item)).not.toHaveProperty("password");
  });
  it("keeps cleared required fields in the payload so backend validation can reject them", () => {
    const form = { ...definitions.user.values({ username: "analyst", email: "a@example.com", displayName: "Analyst", globalRole: "analyst", status: "active" }), displayName: "" };
    expect(definitions.user.fromForm(form)).toHaveProperty("displayName", "");
    expect(definitions.user.create()).toEqual({ url: "/api/users", method: "POST" });
    expect(definitions.user.values()).toHaveProperty("password", "");
  });
});
