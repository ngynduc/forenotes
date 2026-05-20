import { useState } from "react";
import { DataTable } from "@/components/data-table/DataTable";
import { EntityModal } from "@/components/entity-modal/EntityModal";
import { Button } from "@/components/ui/Button";
import { useUsers } from "@/hooks/use-entities";
import { useScopeStore } from "@/stores/scope-store";
import { TABLE_DEFINITIONS } from "@/config/table-definitions";
import { getEntityDefinitions } from "@/config/entity-definitions";

const tableDef = TABLE_DEFINITIONS.users;

export default function AdminPage() {
  const { data, isLoading } = useUsers();
  const [modalOpen, setModalOpen] = useState(false);
  const definitions = getEntityDefinitions(() => useScopeStore.getState());
  const rows = (data?.users ?? []) as unknown as Record<string, unknown>[];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{tableDef.title}</h2>
          <p className="text-sm text-[var(--color-text-muted)]">{tableDef.subtitle}</p>
        </div>
        {tableDef.createLabel && (
          <Button onClick={() => setModalOpen(true)}>
            {tableDef.createLabel}
          </Button>
        )}
      </div>
      {isLoading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading...</p>
      ) : (
        <DataTable columns={tableDef.columns} data={rows} emptyLabel={tableDef.emptyLabel} />
      )}
      <EntityModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        definition={definitions.user}
        item={null}
        mode="create"
      />
    </div>
  );
}
