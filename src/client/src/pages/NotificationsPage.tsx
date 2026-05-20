import { DataTable } from "@/components/data-table/DataTable";
import { useNotifications } from "@/hooks/use-entities";
import { TABLE_DEFINITIONS } from "@/config/table-definitions";

const tableDef = TABLE_DEFINITIONS.notifications;

export default function NotificationsPage() {
  const { data, isLoading } = useNotifications();
  const rows = (data?.notifications ?? []) as unknown as Record<string, unknown>[];

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
