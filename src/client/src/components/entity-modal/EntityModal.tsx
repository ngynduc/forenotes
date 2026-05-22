import { useState, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useQueryClient } from "@tanstack/react-query";
import { useUIStore } from "@/stores/ui-store";
import { useScopeStore } from "@/stores/scope-store";
import type { EntityDefinition } from "@/config/entity-definitions";
import { useUsers } from "@/hooks/use-entities";
import { useIncidentMembers } from "@/hooks/use-incidents";
import { EntityLinksSection } from "@/components/entity-modal/EntityLinksSection";

interface EntityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  definition: EntityDefinition;
  item?: Record<string, unknown> | null;
  mode: "create" | "edit";
  onSuccess?: (savedItem?: Record<string, unknown> | null) => void;
}

export function EntityModal({ open, onOpenChange, definition, item, mode, onSuccess }: EntityModalProps) {
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const itemId = item?.id;
  const setFlash = useUIStore((s) => s.setFlash);
  const selectedIncidentId = useScopeStore((s) => s.selectedIncidentId);
  const qc = useQueryClient();
  const { data: usersData } = useUsers();
  const { data: incidentMembersData } = useIncidentMembers(selectedIncidentId || undefined);

  const userOptions = (usersData?.users ?? []).map((user) => ({
    value: user.id,
    label: String(user.displayName ?? user.email),
  }));
  const memberOptions = (incidentMembersData?.members ?? []).map((member) => ({
    value: member.userId,
    label: String(member.displayName ?? member.email),
  }));

  useEffect(() => {
    if (open) {
      setForm(definition.values(item));
      setError(null);
    }
  }, [open, definition.collection, itemId]);

  useEffect(() => {
    if (!open || mode !== "create" || definition.collection !== "tasks") {
      return;
    }

    const activeUserId = useScopeStore.getState().activeUserId;
    if (!activeUserId) {
      return;
    }

    setForm((prev) => {
      if (prev.ownerUserId) {
        return prev;
      }
      return { ...prev, ownerUserId: activeUserId };
    });
  }, [open, mode, definition.collection]);

  function updateField(name: string, value: unknown) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const payload = definition.fromForm(form);
      let response: unknown;
      if (mode === "create") {
        const { url, method } = definition.create();
        response = await requestApi(url, {
          method,
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify(payload),
        });
      } else {
        const { url, method } = definition.update!(String(item?.id));
        response = await requestApi(url, {
          method,
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify(payload),
        });
      }
      setFlash({ kind: "success", message: `${definition.label} saved.` });
      qc.invalidateQueries();
      onSuccess?.(extractSavedItem(response, definition.collection));
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!definition.delete || !item?.id) return;
    if (!confirm(`Delete this ${definition.label.toLowerCase()}?`)) return;
    setSaving(true);
    try {
      const { url, method } = definition.delete(String(item.id));
      await requestApi(url, { method, headers: authHeaders() });
      setFlash({ kind: "success", message: `${definition.label} deleted.` });
      qc.invalidateQueries();
      onSuccess?.();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setSaving(false);
    }
  }

  const fields = definition.fields();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? definition.createTitle : definition.editTitle}</DialogTitle>
          <DialogDescription>
            {mode === "edit" ? `Edit ${definition.label.toLowerCase()} details.` : `Create a new ${definition.label.toLowerCase()}.`}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {fields.map((field) => (
            <div key={field.name} className={field.span === 2 ? "col-span-2" : ""}>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-muted)]">
                {field.label}
                {field.required && <span className="text-[var(--color-danger)]"> *</span>}
              </label>
              {field.type === "textarea" ? (
                <textarea
                  className="flex w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                  rows={3}
                  value={String(form[field.name] ?? "")}
                  onChange={(e) => updateField(field.name, e.target.value)}
                  autoFocus={field.autofocus}
                />
              ) : field.type === "select" || field.type === "user-select" || field.type === "member-select" ? (
                <Select
                  value={String(form[field.name] ?? "")}
                  onChange={(e) => updateField(field.name, e.target.value)}
                >
                  {getSelectOptions(field.type, field.options, userOptions, memberOptions).map((opt) => (
                    <option key={opt.value || "__empty__"} value={opt.value}>
                      {opt.label || "—"}
                    </option>
                  ))}
                </Select>
              ) : field.type === "color" ? (
                <div className="flex items-center gap-3">
                  <Input
                    type="color"
                    value={String(form[field.name] ?? "#0f766e")}
                    onChange={(e) => updateField(field.name, e.target.value)}
                    autoFocus={field.autofocus}
                    className="h-10 w-16 cursor-pointer p-1"
                  />
                  <span className="text-sm text-[var(--color-text-muted)]">{String(form[field.name] ?? "#0f766e").toUpperCase()}</span>
                </div>
              ) : field.type === "code" ? (
                <div className="space-y-1">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      style={{
                        padding: "2px 8px",
                        fontSize: "12px",
                        border: "1px solid #888",
                        borderRadius: "4px",
                        background: "#fff",
                        color: "#333",
                        cursor: "pointer",
                      }}
                      title="Copy to clipboard"
                      onClick={() => {
                        navigator.clipboard.writeText(String(form[field.name] ?? "")).then(() => {
                          const btn = document.activeElement as HTMLButtonElement;
                          const orig = btn.textContent;
                          btn.textContent = "Copied!";
                          setTimeout(() => { btn.textContent = orig; }, 1500);
                        });
                      }}
                    >
                      Copy
                    </button>
                  </div>
                  <div className="cm-editor-wrapper">
                    <CodeMirror
                      value={String(form[field.name] ?? "")}
                      onChange={(val) => updateField(field.name, val)}
                      height="260px"
                      extensions={[]}
                      basicSetup={{
                        lineNumbers: true,
                        foldGutter: true,
                        highlightActiveLine: true,
                        bracketMatching: true,
                      }}
                      placeholder={field.placeholder}
                    />
                  </div>
                </div>
              ) : (
                <Input
                  type={field.type}
                  value={String(form[field.name] ?? "")}
                  onChange={(e) => updateField(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  autoFocus={field.autofocus}
                />
              )}
            </div>
          ))}
          {mode === "edit" && definition.entityLinkSourceType && typeof item?.id === "string" && (
            <EntityLinksSection
              sourceType={definition.entityLinkSourceType}
              sourceId={item.id}
            />
          )}
        </div>

        <DialogFooter>
          {mode === "edit" && definition.delete && (
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              Delete
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : mode === "create" ? definition.createAction : definition.updateAction}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getSelectOptions(
  fieldType: string,
  options: string[] | undefined,
  userOptions: Array<{ value: string; label: string }>,
  memberOptions: Array<{ value: string; label: string }>
) {
  if (fieldType === "user-select") {
    return [{ value: "", label: "Select user" }, ...userOptions];
  }
  if (fieldType === "member-select") {
    return [{ value: "", label: "Unassigned" }, ...memberOptions];
  }
  return (options ?? []).map((option) => ({ value: option, label: option }));
}

function authHeaders(): Record<string, string> {
  return {};
}

async function requestApi(url: string, init: RequestInit) {
  const response = await fetch(url, { ...init, credentials: "include" });
  if (response.ok) {
    return response.status === 204 ? null : response.json().catch(() => null);
  }

  const payload = await response.json().catch(() => null);
  const message =
    payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
      ? payload.error
      : `${init.method ?? "GET"} ${url} failed`;
  throw new Error(message);
}

function extractSavedItem(
  response: unknown,
  collection: string
): Record<string, unknown> | null {
  if (!response || typeof response !== "object") {
    return null;
  }

  const payload = response as Record<string, unknown>;
  const singularKey = collection.endsWith("s") ? collection.slice(0, -1) : collection;
  const directMatch = payload[singularKey];
  if (directMatch && typeof directMatch === "object") {
    return directMatch as Record<string, unknown>;
  }

  for (const value of Object.values(payload)) {
    if (value && typeof value === "object" && "id" in (value as Record<string, unknown>)) {
      return value as Record<string, unknown>;
    }
  }

  return null;
}
