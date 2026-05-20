import { DataTable } from "@/components/data-table/DataTable";
import { useAuditLogs } from "@/hooks/use-entities";
import { useScopeStore } from "@/stores/scope-store";
import { TABLE_DEFINITIONS } from "@/config/table-definitions";

const tableDef = TABLE_DEFINITIONS.audit;

export default function AuditPage() {
  const caseId = useScopeStore((s) => s.selectedCaseId);
  const incidentId = useScopeStore((s) => s.selectedIncidentId);
  const { data, isLoading } = useAuditLogs(caseId || undefined, incidentId || undefined);
  const rows = (data?.logs ?? []) as unknown as Record<string, unknown>[];

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold">{tableDef.title}</h2>
      <p className="mb-4 text-sm text-[var(--color-text-muted)]">{tableDef.subtitle}</p>
      {isLoading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading...</p>
      ) : (
        <DataTable columns={tableDef.columns} data={rows} emptyLabel={tableDef.emptyLabel} />
      )}
    </div>
  );
}
