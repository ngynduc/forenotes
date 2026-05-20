import { useState } from "react";
import { DataTable } from "@/components/data-table/DataTable";
import { EntityModal } from "@/components/entity-modal/EntityModal";
import { Button } from "@/components/ui/Button";
import { useIndicators, useSystems, useAccounts } from "@/hooks/use-entities";
import { useScopeStore } from "@/stores/scope-store";
import { useUIStore } from "@/stores/ui-store";
import { TABLE_DEFINITIONS } from "@/config/table-definitions";
import { getEntityDefinitions } from "@/config/entity-definitions";

const TABS = [
  { key: "indicators", label: "Indicators", tableDef: TABLE_DEFINITIONS.indicators, entityKey: "indicator" },
  { key: "systems", label: "Systems", tableDef: TABLE_DEFINITIONS.systems, entityKey: "system" },
  { key: "accounts", label: "Accounts", tableDef: TABLE_DEFINITIONS.accounts, entityKey: "account" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function EntitiesPage() {
  const incidentId = useScopeStore((s) => s.selectedIncidentId);
  const activeTab = useUIStore((s) => s.entityTab) as TabKey;
  const setEntityTab = useUIStore((s) => s.setEntityTab);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null);
  const definitions = getEntityDefinitions(() => useScopeStore.getState());

  const indicators = useIndicators();
  const systems = useSystems();
  const accounts = useAccounts();

  const dataMap: Record<string, { data: Record<string, unknown[]> | undefined; isLoading: boolean }> = {
    indicators: indicators,
    systems: systems,
    accounts: accounts,
  };

  const keyMap: Record<string, string> = {
    indicators: "indicators",
    systems: "systems",
    accounts: "accounts",
  };

  if (!incidentId) {
    return <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">Select an incident to view entities.</p>;
  }

  const tab = TABS.find((t) => t.key === activeTab) ?? TABS[0];
  const currentData = dataMap[tab.key];
  const rows = ((currentData?.data as any)?.[keyMap[tab.key]] ?? []) as Record<string, unknown>[];

  return (
    <div>
      <div className="mb-4">
        <div className="flex gap-1 border-b border-[var(--color-border)]">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                t.key === tab.key
                  ? "border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
              onClick={() => setEntityTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{tab.tableDef.title}</h2>
          <p className="text-sm text-[var(--color-text-muted)]">{tab.tableDef.subtitle}</p>
        </div>
        {tab.tableDef.createLabel && (
          <Button onClick={() => { setEditItem(null); setModalOpen(true); }}>
            {tab.tableDef.createLabel}
          </Button>
        )}
      </div>

      {currentData?.isLoading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading...</p>
      ) : (
        <DataTable
          columns={tab.tableDef.columns}
          data={rows}
          emptyLabel={tab.tableDef.emptyLabel}
          onRowClick={(row) => { setEditItem(row); setModalOpen(true); }}
        />
      )}

      <EntityModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        definition={definitions[tab.entityKey]}
        item={editItem}
        mode={editItem ? "edit" : "create"}
      />
    </div>
  );
}
