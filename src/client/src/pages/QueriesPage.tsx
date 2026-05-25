import { useState } from "react";
import { DataTable } from "@/components/data-table/DataTable";
import { EntityModal } from "@/components/entity-modal/EntityModal";
import { Button } from "@/components/ui/Button";
import { useQueries } from "@/hooks/use-entities";
import { useIncidentMembers } from "@/hooks/use-incidents";
import { useScopeStore } from "@/stores/scope-store";
import { ScopeGate } from "@/components/shared/ScopeGate";
import { TABLE_DEFINITIONS } from "@/config/table-definitions";
import { getEntityDefinitions } from "@/config/entity-definitions";
import { buildMemberNameMap, withMemberDisplayNames } from "@/lib/memberDisplay";

const tableDef = TABLE_DEFINITIONS.queries;

export default function QueriesPage() {
  const incidentId = useScopeStore((s) => s.selectedIncidentId);
  const { data, isLoading } = useQueries();
  const { data: membersData } = useIncidentMembers(incidentId);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null);
  const definitions = getEntityDefinitions(() => useScopeStore.getState());
  const memberNames = buildMemberNameMap(membersData?.members);
  const queries = withMemberDisplayNames((data?.queries ?? []) as unknown as Record<string, unknown>[], memberNames);

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
        {tableDef.createLabel && (
          <Button onClick={() => { setEditItem(null); setModalOpen(true); }}>
            {tableDef.createLabel}
          </Button>
        )}
      </div>
      {isLoading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading...</p>
      ) : (
        <DataTable
          columns={tableDef.columns}
          data={queries}
          emptyLabel={tableDef.emptyLabel}
          onRowClick={(row) => { setEditItem(row); setModalOpen(true); }}
        />
      )}
      <EntityModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        definition={definitions.query}
        item={editItem}
        mode={editItem ? "edit" : "create"}
      />
    </div>
  );
}
