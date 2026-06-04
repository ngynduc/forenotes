import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { InlineField } from "@/config/entity-definitions";

interface InlineEditorProps {
  value: string;
  field: InlineField;
  onSave: (payloadKey: string, value: string) => void;
  onCancel: () => void;
}

export function InlineEditor({ value, field, onSave, onCancel }: InlineEditorProps) {
  const [draft, setDraft] = useState(() => {
    if (field.displayToDraft) return field.displayToDraft(value);
    return value || "";
  });
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSave() {
    const finalValue = field.draftToPayload ? field.draftToPayload(draft) : draft;
    onSave(field.payloadKey, finalValue ?? draft);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") onCancel();
  }

  if (field.type === "select" && field.options) {
    return (
      <Select
        ref={inputRef as React.Ref<HTMLSelectElement>}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          onSave(field.payloadKey, e.target.value);
        }}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
      >
        {field.options.map((opt) => (
          <option key={opt} value={opt}>
            {opt || "—"}
          </option>
        ))}
      </Select>
    );
  }

  return (
    <Input
      ref={inputRef as React.Ref<HTMLInputElement>}
      type={field.type === "datetime-local" ? "datetime-local" : field.type === "color" ? "color" : "text"}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      className={field.type === "color" ? "h-8 w-12 cursor-pointer p-1" : "h-7 text-sm"}
    />
  );
}
