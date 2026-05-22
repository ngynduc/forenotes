import { useEffect, useState } from "react";
import type { GraphEdgeType, GraphNodeType } from "@shared/domain";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import {
  useAccounts,
  useCreateEntityLink,
  useCustomTags,
  useDeleteEntityLink,
  useEntityLinks,
  useFindings,
  useIndicators,
  useQueries,
  useSystems,
  useTimelineEvents,
} from "@/hooks/use-entities";
import { useIncidentMembers } from "@/hooks/use-incidents";
import { useTasks } from "@/hooks/use-tasks";
import { useScopeStore } from "@/stores/scope-store";

type LinkableType = Exclude<GraphNodeType, "mitre_technique" | "mitre_tactic">;

interface EntityLinksSectionProps {
  sourceType: LinkableType;
  sourceId?: string;
}

interface EntityOption {
  type: LinkableType;
  id: string;
  label: string;
  detail?: string;
}

const TARGET_TYPES: LinkableType[] = [
  "finding",
  "timeline_event",
  "task",
  "system",
  "account",
  "ioc",
  "query",
  "user",
  "tag",
];

const LINK_TYPES: GraphEdgeType[] = [
  "related_to",
  "evidence_for",
  "caused_by",
  "followed_by",
  "investigates",
  "references",
  "observed_on",
  "used_account",
  "contains_ioc",
  "assigned_to",
  "has_tag",
];

const TYPE_LABELS: Record<LinkableType, string> = {
  finding: "Finding",
  timeline_event: "Timeline Event",
  task: "Task",
  system: "System",
  account: "Account",
  ioc: "Indicator",
  query: "Query",
  user: "User",
  tag: "Tag",
};

export function EntityLinksSection({ sourceType, sourceId }: EntityLinksSectionProps) {
  const incidentId = useScopeStore((s) => s.selectedIncidentId);
  const hasId = !!sourceId;
  const [targetType, setTargetType] = useState<LinkableType>(sourceType === "finding" ? "timeline_event" : "finding");
  const [targetId, setTargetId] = useState("");
  const [linkType, setLinkType] = useState<GraphEdgeType>("related_to");
  const [error, setError] = useState<string | null>(null);

  const { data: linksData, isLoading: linksLoading } = useEntityLinks();
  const linksEnabled = hasId && !!incidentId;
  const { data: findingsData } = useFindings();
  const { data: timelineData } = useTimelineEvents();
  const { data: tasksData } = useTasks();
  const { data: systemsData } = useSystems();
  const { data: accountsData } = useAccounts();
  const { data: indicatorsData } = useIndicators();
  const { data: queriesData } = useQueries();
  const { data: membersData } = useIncidentMembers(incidentId || undefined);
  const { data: customTagsData } = useCustomTags();
  const createLink = useCreateEntityLink();
  const deleteLink = useDeleteEntityLink();

  useEffect(() => {
    setTargetId("");
    setError(null);
  }, [sourceId, targetType]);

  const options = buildEntityOptions({
    findings: findingsData?.findings ?? [],
    timelineEvents: timelineData?.timelineEvents ?? [],
    tasks: tasksData?.tasks ?? [],
    systems: systemsData?.systems ?? [],
    accounts: accountsData?.accounts ?? [],
    indicators: indicatorsData?.indicators ?? [],
    queries: queriesData?.queries ?? [],
    members: membersData?.members ?? [],
    customTags: customTagsData?.customTags ?? [],
  }).filter((option) => option.type !== sourceType || option.id !== sourceId);

  const optionsByType = new Map<LinkableType, EntityOption[]>();
  const optionLabels = new Map<string, EntityOption>();
  for (const option of options) {
    const group = optionsByType.get(option.type) ?? [];
    group.push(option);
    optionsByType.set(option.type, group);
    optionLabels.set(entityKey(option.type, option.id), option);
  }

  const currentLinks = hasId
    ? (linksData?.links ?? []).filter(
        (link) =>
          (link.sourceType === sourceType && link.sourceId === sourceId) ||
          (link.targetType === sourceType && link.targetId === sourceId)
      )
    : [];
  const targetOptions = optionsByType.get(targetType) ?? [];
  const hasTargetOptions = targetOptions.length > 0;
  const busy = createLink.isPending || deleteLink.isPending;

  async function handleAddLink() {
    if (!sourceId) return;
    if (!targetId) {
      setError(`Select a ${TYPE_LABELS[targetType].toLowerCase()} to link.`);
      return;
    }

    setError(null);
    try {
      await createLink.mutateAsync({
        sourceType,
        sourceId,
        targetType,
        targetId,
        linkType,
      });
      setTargetId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create entity link");
    }
  }

  async function handleDeleteLink(linkId: string) {
    setError(null);
    try {
      await deleteLink.mutateAsync(linkId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove entity link");
    }
  }

  return (
    <section className="col-span-2 mt-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
      <div className="mb-3 flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">Linked Entities</h3>
        <p className="text-xs text-[var(--color-text-muted)]">
          Link this {TYPE_LABELS[sourceType].toLowerCase()} to incident records that explain relationships in the graph.
        </p>
      </div>

      {error && (
        <div className="mb-3 rounded bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      )}

      {!hasId ? (
        <p className="text-xs text-[var(--color-text-muted)]">
          Save this {TYPE_LABELS[sourceType].toLowerCase()} first to start linking entities.
        </p>
      ) : (
        <div className="grid gap-2 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)_minmax(0,1fr)_auto]">
          <Select
            aria-label="Link target type"
            value={targetType}
            onChange={(event) => setTargetType(event.target.value as LinkableType)}
            disabled={busy}
          >
            {TARGET_TYPES.map((type) => (
              <option key={type} value={type}>
                {TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Link target entity"
            value={targetId}
            onChange={(event) => setTargetId(event.target.value)}
            disabled={busy || !hasTargetOptions}
          >
            <option value="">{hasTargetOptions ? `Select ${TYPE_LABELS[targetType].toLowerCase()}` : "No records available"}</option>
            {targetOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.detail ? `${option.label} - ${option.detail}` : option.label}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Relationship type"
            value={linkType}
            onChange={(event) => setLinkType(event.target.value as GraphEdgeType)}
            disabled={busy}
          >
            {LINK_TYPES.map((type) => (
              <option key={type} value={type}>
                {formatLabel(type)}
              </option>
            ))}
          </Select>
          <Button type="button" size="sm" onClick={handleAddLink} disabled={busy || !targetId}>
            Link
          </Button>
        </div>
      )}

      <div className="mt-3 space-y-2">
        {linksLoading ? (
          <p className="text-xs text-[var(--color-text-muted)]">Loading links...</p>
        ) : currentLinks.length === 0 ? (
          <p className="text-xs text-[var(--color-text-muted)]">No linked entities yet.</p>
        ) : (
          currentLinks.map((link) => {
            const otherType = link.sourceType === sourceType && link.sourceId === sourceId ? link.targetType : link.sourceType;
            const otherId = link.sourceType === sourceType && link.sourceId === sourceId ? link.targetId : link.sourceId;
            const linkedOption = optionLabels.get(entityKey(otherType as LinkableType, otherId));

            return (
              <div
                key={link.id}
                className="flex flex-col gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 md:flex-row md:items-center"
              >
                <Badge variant="secondary">{TYPE_LABELS[otherType as LinkableType] ?? formatLabel(otherType)}</Badge>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{linkedOption?.label ?? otherId}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {formatLabel(link.linkType)}
                    {linkedOption?.detail ? ` - ${linkedOption.detail}` : ""}
                  </div>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => handleDeleteLink(link.id)} disabled={busy}>
                  Remove
                </Button>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function buildEntityOptions(input: {
  findings: Array<{ id: string; title: string; severity?: string; status?: string }>;
  timelineEvents: Array<{ id: string; title: string; eventTime?: string; source?: string }>;
  tasks: Array<{ id: string; title: string; status?: string }>;
  systems: Array<{ id: string; hostname: string; ipAddress?: string }>;
  accounts: Array<{ id: string; username: string; domain?: string }>;
  indicators: Array<{ id: string; indicatorType: string; value: string }>;
  queries: Array<{ id: string; name: string; language?: string }>;
  members: Array<{ userId: string; displayName: string; email: string }>;
  customTags: Array<{ id: string; name: string }>;
}): EntityOption[] {
  return [
    ...input.findings.map((item) => ({
      type: "finding" as const,
      id: item.id,
      label: item.title,
      detail: [item.severity, item.status].filter(Boolean).join(" / "),
    })),
    ...input.timelineEvents.map((item) => ({
      type: "timeline_event" as const,
      id: item.id,
      label: item.title,
      detail: [item.eventTime, item.source].filter(Boolean).join(" / "),
    })),
    ...input.tasks.map((item) => ({
      type: "task" as const,
      id: item.id,
      label: item.title,
      detail: item.status,
    })),
    ...input.systems.map((item) => ({
      type: "system" as const,
      id: item.id,
      label: item.hostname,
      detail: item.ipAddress,
    })),
    ...input.accounts.map((item) => ({
      type: "account" as const,
      id: item.id,
      label: item.domain ? `${item.domain}\\${item.username}` : item.username,
    })),
    ...input.indicators.map((item) => ({
      type: "ioc" as const,
      id: item.id,
      label: item.value,
      detail: item.indicatorType,
    })),
    ...input.queries.map((item) => ({
      type: "query" as const,
      id: item.id,
      label: item.name,
      detail: item.language,
    })),
    ...input.members.map((item) => ({
      type: "user" as const,
      id: item.userId,
      label: item.displayName,
      detail: item.email,
    })),
    ...input.customTags.map((item) => ({
      type: "tag" as const,
      id: item.id,
      label: item.name,
    })),
  ];
}

function entityKey(type: string, id: string) {
  return `${type}:${id}`;
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
