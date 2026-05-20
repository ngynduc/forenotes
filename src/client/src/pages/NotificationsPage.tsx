import { DataTable } from "@/components/data-table/DataTable";
import { Button } from "@/components/ui/Button";
import { useMarkNotificationRead, useNotifications } from "@/hooks/use-entities";
import { TABLE_DEFINITIONS } from "@/config/table-definitions";

const tableDef = TABLE_DEFINITIONS.notifications;

export default function NotificationsPage() {
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const rows = (data?.notifications ?? []) as unknown as Record<string, unknown>[];
  const unreadCount = rows.filter((row) => row.unseen).length;

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold">{tableDef.title}</h2>
      <p className="mb-4 text-sm text-[var(--color-text-muted)]">
        {tableDef.subtitle}
        {unreadCount > 0 ? (
          <span className="ml-2 rounded bg-[var(--color-danger)] px-1.5 py-0.5 text-xs font-bold text-white">
            {unreadCount} unread
          </span>
        ) : null}
      </p>
      {isLoading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading...</p>
      ) : (
        <DataTable
          columns={tableDef.columns}
          data={rows}
          emptyLabel={tableDef.emptyLabel}
          renderRowActions={(row) => {
            const notificationId = String(row.id ?? "");
            const isUnread = Boolean(row.unseen);

            return (
              <Button
                size="sm"
                variant={isUnread ? "default" : "outline"}
                disabled={!isUnread || markRead.isPending}
                onClick={() => markRead.mutate(notificationId)}
              >
                {isUnread ? "Mark read" : "Read"}
              </Button>
            );
          }}
        />
      )}
    </div>
  );
}
