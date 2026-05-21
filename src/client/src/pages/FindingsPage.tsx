import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { DataTable } from "@/components/data-table/DataTable";
import { EntityModal } from "@/components/entity-modal/EntityModal";
import { TimeFilterBar } from "@/components/filters/TimeFilterBar";
import { Button } from "@/components/ui/Button";
import { useFindings } from "@/hooks/use-entities";
import { useIncidentMembers } from "@/hooks/use-incidents";
import { useScopeStore } from "@/stores/scope-store";
import { TABLE_DEFINITIONS } from "@/config/table-definitions";
import { getEntityDefinitions } from "@/config/entity-definitions";
import { buildMemberNameMap, withMemberDisplayNames } from "@/lib/memberDisplay";
import { applyTimeFilter, createTimeFilterState } from "@/lib/timeFilters";

const tableDef = TABLE_DEFINITIONS.findings;
const timeFieldOptions = [
  { value: "updatedAt", label: "Updated time" },
  { value: "createdAt", label: "Created time" },
];

export default function FindingsPage() {
  const incidentId = useScopeStore((s) => s.selectedIncidentId);
  const { data, isLoading } = useFindings();
  const { data: membersData } = useIncidentMembers(incidentId);
  const [searchParams, setSearchParams] = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null);
  const [timeFilter, setTimeFilter] = useState(() => createTimeFilterState("updatedAt"));
  const definitions = getEntityDefinitions(() => useScopeStore.getState());
  const memberNames = buildMemberNameMap(membersData?.members);
  const findings = withMemberDisplayNames((data?.findings ?? []) as unknown as Record<string, unknown>[], memberNames);
  const filteredFindings = applyTimeFilter(findings, timeFilter);
  const itemId = searchParams.get("itemId");
  const openedItemIdRef = useRef<string | null>(null);

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
    return <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">Select an incident to view findings.</p>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{tableDef.title}</h2>
          <p className="text-sm text-[var(--color-text-muted)]">{tableDef.subtitle}</p>
        </div>
        {tableDef.createLabel && (
          <Button onClick={() => { setEditItem(null); setModalOpen(true); }}>
            {tableDef.createLabel}
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
            filteredCount={filteredFindings.length}
            layout="compact"
            value={timeFilter}
            onChange={setTimeFilter}
          />
          <DataTable
            columns={tableDef.columns}
            data={filteredFindings}
            emptyLabel={tableDef.emptyLabel}
            onRowClick={(row) => { setEditItem(row); setModalOpen(true); }}
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
