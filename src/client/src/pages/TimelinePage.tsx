import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { InlineEntityTable, type InlineTableField } from "@/components/data-table/InlineEntityTable";
import { EntityModal } from "@/components/entity-modal/EntityModal";
import { TimeFilterBar } from "@/components/filters/TimeFilterBar";
import { Button } from "@/components/ui/Button";
import { usePermissions } from "@/hooks/use-auth";
import { useCreateTimelineEvent, useTimelineEvents, useUpdateTimelineEvent } from "@/hooks/use-entities";
import { useIncidentMembers } from "@/hooks/use-incidents";
import { useTimezone } from "@/providers/TimezoneProvider";
import { useScopeStore } from "@/stores/scope-store";
import { ScopeGate } from "@/components/shared/ScopeGate";
import { TABLE_DEFINITIONS } from "@/config/table-definitions";
import { getEntityDefinitions } from "@/config/entity-definitions";
import type { CreateTimelineEventInput } from "@/lib/api";
import { buildMemberNameMap, withMemberDisplayNames } from "@/lib/memberDisplay";
import { createTimeFilterState, normalizeTimeFilterState, toTimeFilterRequest } from "@/lib/timeFilters";
import { toLocalInputValue } from "@/lib/utils";

const tableDef = TABLE_DEFINITIONS.timeline;
const timeFieldOptions = [
  { value: "eventTime", label: "Event time" },
  { value: "updatedAt", label: "Updated time" },
  { value: "createdAt", label: "Created time" },
];

export default function TimelinePage() {
  const incidentId = useScopeStore((s) => s.selectedIncidentId);
  const { timezone } = useTimezone();
  const { canAccessEntity } = usePermissions();
  const [timeFilter, setTimeFilter] = useState(() => createTimeFilterState("eventTime", timezone));
  const appliedFilter = normalizeTimeFilterState(timeFilter, timezone);
  const filterRequest = toTimeFilterRequest(appliedFilter);
  const { data, isLoading } = useTimelineEvents(filterRequest);
  const { data: membersData } = useIncidentMembers(incidentId);
  const createTimelineEvent = useCreateTimelineEvent();
  const updateTimelineEvent = useUpdateTimelineEvent();
  const [searchParams, setSearchParams] = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null);
  const definitions = getEntityDefinitions(() => useScopeStore.getState());
  const memberNames = buildMemberNameMap(membersData?.members);
  const events = withMemberDisplayNames((data?.timelineEvents ?? []) as unknown as Record<string, unknown>[], memberNames);
  const itemId = searchParams.get("itemId");
  const openedItemIdRef = useRef<string | null>(null);
  const canCreate = canAccessEntity("timeline_event", "create");
  const canUpdate = canAccessEntity("timeline_event", "update");
  const inlineFields: InlineTableField[] = [
    { key: "eventTime", label: "Timestamp", type: "datetime-local", required: true, defaultValue: toLocalInputValue(new Date().toISOString()) },
    { key: "title", label: "Event", type: "text", required: true, placeholder: "Event title" },
    { key: "source", label: "Source", type: "text", placeholder: "EDR, SIEM, witness" },
    { key: "description", label: "Summary", type: "text", placeholder: "Short summary" },
  ];

  useEffect(() => {
    setTimeFilter((current) => normalizeTimeFilterState(current, timezone));
  }, [timezone]);

  useEffect(() => {
    if (!itemId) {
      openedItemIdRef.current = null;
      return;
    }
    if (isLoading || openedItemIdRef.current === itemId) {
      return;
    }

    const item = events.find((row) => String(row.id ?? "") === itemId);
    if (!item) {
      return;
    }

    openedItemIdRef.current = itemId;
    setEditItem(item);
    setModalOpen(true);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("itemId");
    setSearchParams(nextParams, { replace: true });
  }, [events, isLoading, itemId, searchParams, setSearchParams]);

  if (!incidentId) {
    return <ScopeGate required="incident" />;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{tableDef.title}</h2>
          <p className="text-sm text-[var(--color-text-muted)]">{tableDef.subtitle}</p>
        </div>
        {tableDef.createLabel && canCreate && (
          <Button onClick={() => { setEditItem(null); setModalOpen(true); }}>
            Full editor
          </Button>
        )}
      </div>
      {isLoading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading...</p>
      ) : (
        <>
          <TimeFilterBar
            fieldOptions={timeFieldOptions}
            totalCount={events.length}
            filteredCount={events.length}
            layout="compact"
            value={appliedFilter}
            onChange={setTimeFilter}
          />
          <InlineEntityTable
            columns={tableDef.columns}
            data={events}
            emptyLabel={tableDef.emptyLabel}
            fields={inlineFields}
            canCreate={canCreate}
            canUpdate={canUpdate}
            createLabel={tableDef.createLabel ?? "Add row"}
            createRecord={async (payload) => {
              const response = await createTimelineEvent.mutateAsync(toCreateTimelineEventInput(payload));
              return response.timelineEvent as unknown as Record<string, unknown>;
            }}
            updateRecord={async (row, payload) => {
              await updateTimelineEvent.mutateAsync({ eventId: String(row.id ?? ""), data: payload });
            }}
            onOpenDetails={(row) => { setEditItem(row); setModalOpen(true); }}
          />
        </>
      )}
      <EntityModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        definition={definitions.timeline_event}
        item={editItem}
        mode={editItem ? "edit" : "create"}
      />
    </div>
  );
}

function toCreateTimelineEventInput(payload: Record<string, unknown>): CreateTimelineEventInput {
  return {
    title: String(payload.title ?? ""),
    eventTime: String(payload.eventTime ?? ""),
    description: typeof payload.description === "string" ? payload.description : undefined,
    source: typeof payload.source === "string" ? payload.source : undefined,
  };
}
