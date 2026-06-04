import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { InlineEntityTable, type InlineTableField } from "@/components/data-table/InlineEntityTable";
import { EntityModal } from "@/components/entity-modal/EntityModal";
import { TimeFilterBar } from "@/components/filters/TimeFilterBar";
import { Button } from "@/components/ui/Button";
import { usePermissions } from "@/hooks/use-auth";
import { useCreateFinding, useFindings, useUpdateFinding } from "@/hooks/use-entities";
import { useIncidentMembers } from "@/hooks/use-incidents";
import { useTimezone } from "@/providers/TimezoneProvider";
import { useScopeStore } from "@/stores/scope-store";
import { ScopeGate } from "@/components/shared/ScopeGate";
import { TABLE_DEFINITIONS } from "@/config/table-definitions";
import { getEntityDefinitions, OPTION_SETS } from "@/config/entity-definitions";
import type { CreateFindingInput } from "@/lib/api";
import { buildMemberNameMap, withMemberDisplayNames } from "@/lib/memberDisplay";
import { createTimeFilterState, normalizeTimeFilterState, toTimeFilterRequest } from "@/lib/timeFilters";

const tableDef = TABLE_DEFINITIONS.findings;
const timeFieldOptions = [
  { value: "updatedAt", label: "Updated time" },
  { value: "createdAt", label: "Created time" },
];

export default function FindingsPage() {
  const incidentId = useScopeStore((s) => s.selectedIncidentId);
  const { timezone } = useTimezone();
  const { canAccessEntity } = usePermissions();
  const [timeFilter, setTimeFilter] = useState(() => createTimeFilterState("updatedAt", timezone));
  const appliedFilter = normalizeTimeFilterState(timeFilter, timezone);
  const filterRequest = toTimeFilterRequest(appliedFilter);
  const { data, isLoading } = useFindings(filterRequest);
  const { data: membersData } = useIncidentMembers(incidentId);
  const createFinding = useCreateFinding();
  const updateFinding = useUpdateFinding();
  const [searchParams, setSearchParams] = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null);
  const definitions = getEntityDefinitions(() => useScopeStore.getState());
  const memberNames = buildMemberNameMap(membersData?.members);
  const findings = withMemberDisplayNames((data?.findings ?? []) as unknown as Record<string, unknown>[], memberNames);
  const itemId = searchParams.get("itemId");
  const openedItemIdRef = useRef<string | null>(null);
  const canCreate = canAccessEntity("finding", "create");
  const canUpdate = canAccessEntity("finding", "update");
  const inlineFields: InlineTableField[] = [
    { key: "title", label: "Title", type: "text", required: true, placeholder: "Finding title" },
    { key: "status", label: "Status", type: "select", required: true, options: [...OPTION_SETS.findingStatus], defaultValue: "draft" },
    { key: "severity", label: "Severity", type: "select", options: ["", ...OPTION_SETS.findingSeverity], defaultValue: "" },
    { key: "confidence", label: "Confidence", type: "select", options: ["", ...OPTION_SETS.confidence], defaultValue: "" },
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

    const item = findings.find((row) => String(row.id ?? "") === itemId);
    if (!item) {
      return;
    }

    openedItemIdRef.current = itemId;
    setEditItem(item);
    setModalOpen(true);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("itemId");
    setSearchParams(nextParams, { replace: true });
  }, [findings, isLoading, itemId, searchParams, setSearchParams]);

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
            totalCount={findings.length}
            filteredCount={findings.length}
            layout="compact"
            value={appliedFilter}
            onChange={setTimeFilter}
          />
          <InlineEntityTable
            columns={tableDef.columns}
            data={findings}
            emptyLabel={tableDef.emptyLabel}
            fields={inlineFields}
            canCreate={canCreate}
            canUpdate={canUpdate}
            createLabel={tableDef.createLabel ?? "Add row"}
            createRecord={async (payload) => {
              const response = await createFinding.mutateAsync(toCreateFindingInput(payload));
              return response.finding as unknown as Record<string, unknown>;
            }}
            updateRecord={async (row, payload) => {
              await updateFinding.mutateAsync({ findingId: String(row.id ?? ""), data: payload });
            }}
            onOpenDetails={(row) => { setEditItem(row); setModalOpen(true); }}
          />
        </>
      )}
      <EntityModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        definition={definitions.finding}
        item={editItem}
        mode={editItem ? "edit" : "create"}
      />
    </div>
  );
}

function toCreateFindingInput(payload: Record<string, unknown>): CreateFindingInput {
  return {
    title: String(payload.title ?? ""),
    status: String(payload.status ?? "draft"),
    description: typeof payload.description === "string" ? payload.description : undefined,
    severity: typeof payload.severity === "string" ? payload.severity : undefined,
    confidence: typeof payload.confidence === "string" ? payload.confidence : undefined,
  };
}
