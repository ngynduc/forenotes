import { useState } from "react";
import { DataTable } from "@/components/data-table/DataTable";
import { EntityModal } from "@/components/entity-modal/EntityModal";
import { Button } from "@/components/ui/Button";
import { useCustomTags, useAttackTags } from "@/hooks/use-entities";
import { useScopeStore } from "@/stores/scope-store";
import { useUIStore } from "@/stores/ui-store";
import { ScopeGate } from "@/components/shared/ScopeGate";
import { TABLE_DEFINITIONS } from "@/config/table-definitions";
import { getEntityDefinitions } from "@/config/entity-definitions";

export default function TagsPage() {
  const caseId = useScopeStore((s) => s.selectedCaseId);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null);
  const definitions = getEntityDefinitions(() => useScopeStore.getState());

  const custom = useCustomTags();
  const attack = useAttackTags();

  const customRows = (custom.data?.customTags ?? []) as unknown as Record<string, unknown>[];
  const attackRows = (attack.data?.attackTags ?? []) as unknown as Record<string, unknown>[];

  const customDef = TABLE_DEFINITIONS.customTags;
  const attackDef = TABLE_DEFINITIONS.attackTags;

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{customDef.title}</h2>
            <p className="text-sm text-[var(--color-text-muted)]">{customDef.subtitle}</p>
          </div>
          {caseId && customDef.createLabel && (
            <Button onClick={() => { setEditItem(null); setModalOpen(true); }}>
              {customDef.createLabel}
            </Button>
          )}
        </div>
        {!caseId ? (
          <ScopeGate required="case" />
        ) : (
          <DataTable
            columns={customDef.columns}
            data={customRows}
            emptyLabel={customDef.emptyLabel}
            onRowClick={(row) => { setEditItem(row); setModalOpen(true); }}
          />
        )}
      </div>

      <div>
        <h2 className="mb-1 text-lg font-semibold">{attackDef.title}</h2>
        <p className="mb-4 text-sm text-[var(--color-text-muted)]">{attackDef.subtitle}</p>
        <DataTable
          columns={attackDef.columns}
          data={attackRows}
          emptyLabel={attackDef.emptyLabel}
          searchable
        />
      </div>

      {caseId && (
        <EntityModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          definition={definitions.custom_tag}
          item={editItem}
          mode={editItem ? "edit" : "create"}
        />
      )}
    </div>
  );
}
