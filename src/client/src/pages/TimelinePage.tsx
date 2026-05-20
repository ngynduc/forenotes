import { useState } from "react";
import { DataTable } from "@/components/data-table/DataTable";
import { EntityModal } from "@/components/entity-modal/EntityModal";
import { Button } from "@/components/ui/Button";
import { useTimelineEvents } from "@/hooks/use-entities";
import { useScopeStore } from "@/stores/scope-store";
import { TABLE_DEFINITIONS } from "@/config/table-definitions";
import { getEntityDefinitions } from "@/config/entity-definitions";

const tableDef = TABLE_DEFINITIONS.timeline;

export default function TimelinePage() {
  const incidentId = useScopeStore((s) => s.selectedIncidentId);
  const { data, isLoading } = useTimelineEvents();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null);
  const definitions = getEntityDefinitions(() => useScopeStore.getState());
  const events = (data?.timelineEvents ?? []) as unknown as Record<string, unknown>[];

  if (!incidentId) {
    return <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">Select an incident to view timeline.</p>;
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
          data={events}
          emptyLabel={tableDef.emptyLabel}
          onRowClick={(row) => { setEditItem(row); setModalOpen(true); }}
        />
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
