import { useMemo, useState, type KeyboardEvent } from "react";
import { DataTable } from "@/components/data-table/DataTable";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { ColumnDef } from "@/config/table-definitions";
import { cleanObject, cn, localDateTimeToIso, toLocalInputValue } from "@/lib/utils";

type InlineFieldType = "text" | "select" | "datetime-local";
type RowState = "view" | "editing" | "creating" | "saving" | "error";

export interface InlineTableField {
  key: string;
  label: string;
  type: InlineFieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  defaultValue?: string;
}

interface InlineEntityTableProps {
  columns: ColumnDef[];
  data: Record<string, unknown>[];
  emptyLabel?: string;
  fields: InlineTableField[];
  canCreate: boolean;
  canUpdate: boolean;
  createLabel: string;
  createRecord: (payload: Record<string, unknown>) => Promise<Record<string, unknown>>;
  updateRecord: (row: Record<string, unknown>, payload: Record<string, unknown>) => Promise<void>;
  onOpenDetails: (row: Record<string, unknown>) => void;
  onCreated?: (row: Record<string, unknown>) => void;
}

export function InlineEntityTable({
  columns,
  data,
  emptyLabel,
  fields,
  canCreate,
  canUpdate,
  createLabel,
  createRecord,
  updateRecord,
  onOpenDetails,
  onCreated,
}: InlineEntityTableProps) {
  const [creating, setCreating] = useState(false);
  const [createDraft, setCreateDraft] = useState(() => makeDefaultDraft(fields));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const editableKeys = useMemo(() => new Set(fields.map((field) => field.key)), [fields]);
  const createState: RowState = savingKey === "new" ? "saving" : error && creating ? "error" : creating ? "creating" : "view";
  const editingState: RowState = savingKey && savingKey !== "new" ? "saving" : error && editingId ? "error" : editingId ? "editing" : "view";
  const isCreateValid = validateDraft(fields, createDraft).length === 0;
  const isEditValid = validateDraft(fields, editDraft).length === 0;

  function beginCreate() {
    setCreateDraft(makeDefaultDraft(fields));
    setEditingId(null);
    setError(null);
    setCreating(true);
  }

  function cancelCreate() {
    setCreating(false);
    setCreateDraft(makeDefaultDraft(fields));
    setError(null);
  }

  function beginEdit(row: Record<string, unknown>) {
    if (!canUpdate || savingKey) return;
    setCreating(false);
    setEditingId(String(row.id ?? ""));
    setEditDraft(rowToDraft(fields, row));
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft({});
    setError(null);
  }

  async function saveCreate() {
    const validation = validateDraft(fields, createDraft);
    if (validation.length > 0) {
      setError(validation.join(" "));
      return;
    }

    setSavingKey("new");
    setError(null);
    try {
      const created = await createRecord(draftToPayload(fields, createDraft));
      setCreating(false);
      setCreateDraft(makeDefaultDraft(fields));
      onCreated?.(created);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setSavingKey(null);
    }
  }

  async function saveEdit(row: Record<string, unknown>) {
    const validation = validateDraft(fields, editDraft);
    if (validation.length > 0) {
      setError(validation.join(" "));
      return;
    }

    setSavingKey(String(row.id ?? ""));
    setError(null);
    try {
      await updateRecord(row, draftToPayload(fields, editDraft));
      setEditingId(null);
      setEditDraft({});
    } catch (err) {
      setError(formatError(err));
    } finally {
      setSavingKey(null);
    }
  }

  function handleKeyDown(event: KeyboardEvent, row?: Record<string, unknown>) {
    if (event.key === "Enter") {
      event.preventDefault();
      if (row) {
        void saveEdit(row);
      } else {
        void saveCreate();
      }
    }
    if (event.key === "Escape") {
      event.preventDefault();
      if (row) {
        cancelEdit();
      } else {
        cancelCreate();
      }
    }
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-[var(--color-text-muted)]" data-row-state={creating ? createState : editingId ? editingState : "view"} />
        {canCreate ? (
          <Button type="button" size="sm" variant="outline" onClick={beginCreate} disabled={creating || Boolean(editingId) || Boolean(savingKey)}>
            {createLabel}
          </Button>
        ) : null}
      </div>
      {editingId && error ? (
        <div className="mb-3 rounded-[var(--radius-sm)] border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 px-3 py-2 text-xs text-[var(--color-danger)]">
          {error}
        </div>
      ) : null}
      <DataTable
        columns={columns}
        data={data}
        emptyLabel={emptyLabel}
        onRowClick={onOpenDetails}
        renderTopRows={(columnCount) =>
          creating ? (
            <InlineEditRow
              columns={columns}
              columnCount={columnCount}
              draft={createDraft}
              fields={fields}
              saving={savingKey === "new"}
              error={error}
              saveDisabled={!isCreateValid || savingKey === "new"}
              onChange={(key, value) => setCreateDraft((current) => ({ ...current, [key]: value }))}
              onCancel={cancelCreate}
              onKeyDown={(event) => handleKeyDown(event)}
              onSave={() => void saveCreate()}
            />
          ) : null
        }
        renderCellContent={(row, column, defaultContent) => {
          const rowId = String(row.id ?? "");
          if (editingId === rowId && editableKeys.has(column.key)) {
            const field = fields.find((item) => item.key === column.key);
            if (!field) return defaultContent;
            return (
              <InlineFieldInput
                field={field}
                value={editDraft[field.key] ?? ""}
                disabled={savingKey === rowId}
                onChange={(value) => setEditDraft((current) => ({ ...current, [field.key]: value }))}
                onKeyDown={(event) => handleKeyDown(event, row)}
              />
            );
          }

          if (canUpdate && editableKeys.has(column.key)) {
            return (
              <button
                type="button"
                className="block w-full rounded-[var(--radius-sm)] text-left transition-colors hover:bg-[var(--color-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                onClick={(event) => {
                  event.stopPropagation();
                  beginEdit(row);
                }}
              >
                {defaultContent}
              </button>
            );
          }

          return defaultContent;
        }}
        renderRowActions={(row) => {
          const rowId = String(row.id ?? "");
          if (editingId === rowId) {
            return (
              <>
                <Button type="button" size="sm" onClick={() => void saveEdit(row)} disabled={!isEditValid || savingKey === rowId}>
                  {savingKey === rowId ? "Saving..." : "Save"}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={cancelEdit} disabled={savingKey === rowId}>
                  Cancel
                </Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => onOpenDetails(row)} disabled={savingKey === rowId}>
                  Details
                </Button>
              </>
            );
          }

          return (
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenDetails(row)}>
              Details
            </Button>
          );
        }}
      />
    </div>
  );
}

interface InlineEditRowProps {
  columns: ColumnDef[];
  columnCount: number;
  draft: Record<string, string>;
  fields: InlineTableField[];
  saving: boolean;
  error: string | null;
  saveDisabled: boolean;
  onChange: (key: string, value: string) => void;
  onCancel: () => void;
  onKeyDown: (event: KeyboardEvent) => void;
  onSave: () => void;
}

function InlineEditRow({
  columns,
  columnCount,
  draft,
  fields,
  saving,
  error,
  saveDisabled,
  onChange,
  onCancel,
  onKeyDown,
  onSave,
}: InlineEditRowProps) {
  return (
    <>
      <tr className="border-b border-[var(--color-border)] bg-[var(--color-primary-soft)]/30 align-top">
        {columns.map((column) => {
          const field = fields.find((item) => item.key === column.key);
          return (
            <td key={column.key} className="px-3 py-2">
              {field ? (
                <InlineFieldInput
                  field={field}
                  value={draft[field.key] ?? ""}
                  disabled={saving}
                  onChange={(value) => onChange(field.key, value)}
                  onKeyDown={onKeyDown}
                />
              ) : (
                <span className="text-[var(--color-text-muted)]">-</span>
              )}
            </td>
          );
        })}
        <td className="px-3 py-2 text-right">
          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" onClick={onSave} disabled={saveDisabled}>
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
          </div>
        </td>
      </tr>
      {error ? (
        <tr className="border-b border-[var(--color-border)] bg-[var(--color-danger)]/5">
          <td colSpan={columnCount} className="px-3 py-2 text-xs text-[var(--color-danger)]">
            {error}
          </td>
        </tr>
      ) : null}
    </>
  );
}

interface InlineFieldInputProps {
  field: InlineTableField;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent) => void;
}

function InlineFieldInput({ field, value, disabled, onChange, onKeyDown }: InlineFieldInputProps) {
  const commonClassName = cn("h-8 min-w-[8rem] text-sm", field.required && !value.trim() && "border-[var(--color-danger)]");

  if (field.type === "select") {
    return (
      <Select
        aria-label={field.label}
        value={value}
        disabled={disabled}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        className={commonClassName}
      >
        {(field.options ?? []).map((option) => (
          <option key={option || "empty"} value={option}>
            {option || "-"}
          </option>
        ))}
      </Select>
    );
  }

  return (
    <Input
      aria-label={field.label}
      type={field.type === "datetime-local" ? "datetime-local" : "text"}
      value={value}
      disabled={disabled}
      placeholder={field.placeholder}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={onKeyDown}
      className={commonClassName}
    />
  );
}

function makeDefaultDraft(fields: InlineTableField[]) {
  return fields.reduce<Record<string, string>>((draft, field) => {
    draft[field.key] = field.defaultValue ?? "";
    return draft;
  }, {});
}

function rowToDraft(fields: InlineTableField[], row: Record<string, unknown>) {
  return fields.reduce<Record<string, string>>((draft, field) => {
    const value = row[field.key];
    draft[field.key] = field.type === "datetime-local" ? toLocalInputValue(String(value ?? "")) : String(value ?? "");
    return draft;
  }, {});
}

export function validateDraft(fields: InlineTableField[], draft: Record<string, string>) {
  return fields
    .filter((field) => field.required && !String(draft[field.key] ?? "").trim())
    .map((field) => `${field.label} is required.`);
}

export function draftToPayload(fields: InlineTableField[], draft: Record<string, string>) {
  const payload: Record<string, unknown> = {};
  for (const field of fields) {
    const value = draft[field.key] ?? "";
    if (!value && !field.required) {
      continue;
    }
    payload[field.key] = field.type === "datetime-local" ? localDateTimeToIso(value) : value;
  }
  return cleanObject(payload);
}

function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unable to save inline changes.";
}
