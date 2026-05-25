import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TagManagement } from "@/components/entity-modal/TagManagement";
import { useAttackTags, useCustomTags } from "@/hooks/use-entities";
import { api, type AttackTagItem, type TagItem } from "@/lib/api";
import { useScopeStore } from "@/stores/scope-store";
import type { GraphNodeType } from "@shared/domain";

type TaggableEntityType = Extract<GraphNodeType, "finding" | "timeline_event">;

interface EntityTagsSectionProps {
  sourceType: TaggableEntityType;
  sourceId?: string;
  initialCustomTags?: TagItem[];
  initialAttackTags?: AttackTagItem[];
}

interface AttachedTags {
  customTags: TagItem[];
  attackTags: AttackTagItem[];
}

export function EntityTagsSection({
  sourceType,
  sourceId,
  initialCustomTags,
  initialAttackTags,
}: EntityTagsSectionProps) {
  const incidentId = useScopeStore((s) => s.selectedIncidentId);
  const [customTagId, setCustomTagId] = useState("");
  const [attackTagId, setAttackTagId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const qc = useQueryClient();
  const customCatalog = useCustomTags();
  const attackCatalog = useAttackTags();

  const tagsQuery = useQuery({
    queryKey: ["incidents", incidentId, sourceType, sourceId, "tags"],
    queryFn: () => loadAttachedTags(sourceType, incidentId!, sourceId!),
    enabled: !!incidentId && !!sourceId,
    initialData:
      sourceId && (initialCustomTags?.length || initialAttackTags?.length)
        ? { customTags: initialCustomTags ?? [], attackTags: initialAttackTags ?? [] }
        : undefined,
  });

  const attached = tagsQuery.data ?? { customTags: [], attackTags: [] };
  const customOptions = useMemo(
    () => withoutAttached(customCatalog.data?.customTags ?? [], attached.customTags),
    [customCatalog.data?.customTags, attached.customTags]
  );
  const attackOptions = useMemo(
    () => withoutAttached(attackCatalog.data?.attackTags ?? [], attached.attackTags),
    [attackCatalog.data?.attackTags, attached.attackTags]
  );

  const attachTag = useMutation({
    mutationFn: async (input: { kind: "custom" | "attack"; tagId: string }) => {
      if (!incidentId || !sourceId) {
        throw new Error("Save this record before adding tags.");
      }

      if (sourceType === "finding") {
        return input.kind === "custom"
          ? api.attachCustomTagToFinding(incidentId, sourceId, input.tagId)
          : api.attachAttackTagToFinding(incidentId, sourceId, input.tagId);
      }

      return input.kind === "custom"
        ? api.attachCustomTagToTimelineEvent(incidentId, sourceId, input.tagId)
        : api.attachAttackTagToTimelineEvent(incidentId, sourceId, input.tagId);
    },
    onSuccess: async () => {
      setError(null);
      setCustomTagId("");
      setAttackTagId("");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["incidents", incidentId] }),
        qc.invalidateQueries({ queryKey: ["incidents", incidentId, sourceType, sourceId, "tags"] }),
      ]);
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Tag attach failed"),
  });

  return (
    <section className="col-span-2 space-y-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
      <div>
        <h3 className="text-sm font-semibold text-[var(--color-text)]">Tags</h3>
        <div className="mt-2">
          <TagManagement customTags={attached.customTags} attackTags={attached.attackTags} />
        </div>
      </div>

      {error && <div className="text-sm text-[var(--color-danger)]">{error}</div>}

      {!sourceId ? (
        <p className="text-sm text-[var(--color-text-muted)]">Save this record before adding tags.</p>
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          <TagAttachControl
            label="Custom Tag"
            value={customTagId}
            options={customOptions}
            placeholder="Select custom tag"
            disabled={attachTag.isPending || customOptions.length === 0}
            onChange={setCustomTagId}
            onAttach={() => attachTag.mutate({ kind: "custom", tagId: customTagId })}
          />
          <TagAttachControl
            label="ATT&CK Tag"
            value={attackTagId}
            options={attackOptions}
            placeholder="Select ATT&CK tag"
            disabled={attachTag.isPending || attackOptions.length === 0}
            onChange={setAttackTagId}
            onAttach={() => attachTag.mutate({ kind: "attack", tagId: attackTagId })}
            getLabel={(tag) => (tag.attackId ? `${tag.attackId} - ${tag.name}` : tag.name)}
          />
        </div>
      )}
    </section>
  );
}

function TagAttachControl<T extends { id: string; name: string }>({
  label,
  value,
  options,
  placeholder,
  disabled,
  onChange,
  onAttach,
  getLabel = (tag) => tag.name,
}: {
  label: string;
  value: string;
  options: T[];
  placeholder: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onAttach: () => void;
  getLabel?: (tag: T) => string;
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = useMemo(
    () =>
      normalizedQuery
        ? options.filter((tag) => getLabel(tag).toLowerCase().includes(normalizedQuery))
        : options,
    [getLabel, normalizedQuery, options]
  );
  const visibleOptions = filteredOptions.slice(0, 8);
  const hasNoAvailableTags = options.length === 0;
  const showDropdown = isOpen && !hasNoAvailableTags;

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-[var(--color-text-muted)]">{label}</label>
      <div className="relative">
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              onChange("");
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setIsOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setIsOpen(false);
              }
            }}
            placeholder={hasNoAvailableTags ? "No tags available" : `${placeholder} by name or ID`}
            disabled={disabled && hasNoAvailableTags}
          />
          <Button type="button" variant="outline" disabled={disabled || !value} onClick={onAttach} title={`Add ${label}`}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {showDropdown && (
          <div
            className="absolute left-0 right-11 top-10 z-50 max-h-48 overflow-y-auto rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg"
            onMouseDown={(event) => event.preventDefault()}
          >
            {visibleOptions.length === 0 ? (
              <p className="px-3 py-2 text-sm text-[var(--color-text-muted)]">No matching tags</p>
            ) : (
              visibleOptions.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  className="block w-full truncate px-3 py-1.5 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
                  onClick={() => {
                    onChange(tag.id);
                    setQuery(getLabel(tag));
                    setIsOpen(false);
                  }}
                >
                  {getLabel(tag)}
                </button>
              ))
            )}
            {filteredOptions.length > visibleOptions.length && (
              <div className="border-t border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-muted)]">
                {filteredOptions.length - visibleOptions.length} more. Keep typing.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function withoutAttached<T extends { id: string }>(catalog: T[], attached: Array<{ id: string }>) {
  const attachedIds = new Set(attached.map((tag) => tag.id));
  return catalog.filter((tag) => !attachedIds.has(tag.id));
}

function loadAttachedTags(sourceType: TaggableEntityType, incidentId: string, sourceId: string): Promise<AttachedTags> {
  if (sourceType === "finding") {
    return api.listFindingTags(incidentId, sourceId);
  }
  return api.listTimelineEventTags(incidentId, sourceId);
}
