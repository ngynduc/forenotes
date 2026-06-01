import { useMemo, useState } from "react";
import type { DashboardActivityResponse } from "@shared/graph-types";
import { DashboardTablePagination, paginateDashboardRows } from "@/components/dashboard/DashboardTablePagination";
import { formatDateTimeForTimezone, formatRelativeTime } from "@/lib/timezone";

interface ActivityTabProps {
  data: DashboardActivityResponse;
  timezone: string;
}

export function ActivityTab({ data, timezone }: ActivityTabProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pageCount = Math.max(1, Math.ceil(data.activity.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visibleActivity = useMemo(() => paginateDashboardRows(data.activity, safePage, pageSize), [data.activity, safePage, pageSize]);

  function changePageSize(nextPageSize: number) {
    setPageSize(nextPageSize);
    setPage(1);
  }

  return (
    <section className="rounded-[8px] border border-[var(--color-border)] bg-white shadow-sm">
      <div className="border-b border-[var(--color-border)] px-4 py-3">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">Activity</h3>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">Recent changes inside cases and incidents you can access.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[920px] w-full border-collapse text-left text-sm">
          <thead className="bg-[var(--color-surface-muted)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
            <tr>
              <th className="px-4 py-3 font-semibold">Timestamp</th>
              <th className="px-4 py-3 font-semibold">Actor</th>
              <th className="px-4 py-3 font-semibold">Action</th>
              <th className="px-4 py-3 font-semibold">Entity</th>
              <th className="px-4 py-3 font-semibold">Case</th>
              <th className="px-4 py-3 font-semibold">Incident</th>
              <th className="px-4 py-3 font-semibold">Summary</th>
            </tr>
          </thead>
          <tbody>
            {data.activity.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-[var(--color-text-muted)]">
                  No activity found.
                </td>
              </tr>
            ) : (
              visibleActivity.map((item) => (
                <tr key={item.id} className="border-t border-[var(--color-border)] align-top">
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs text-[var(--color-text)]">{formatDateTimeForTimezone(item.timestamp, timezone)}</div>
                    <div className="mt-1 text-xs text-[var(--color-text-muted)]">{formatRelativeTime(item.timestamp)}</div>
                  </td>
                  <td className="max-w-[180px] px-4 py-3 text-[var(--color-text)]"><span className="block truncate" title={item.actor?.name ?? "System"}>{item.actor?.name ?? "System"}</span></td>
                  <td className="px-4 py-3 capitalize text-[var(--color-text-muted)]">{item.action}</td>
                  <td className="px-4 py-3">
                    <div className="max-w-[260px] truncate font-medium text-[var(--color-text)]" title={item.entityTitle}>{item.entityTitle}</div>
                    <div className="mt-1 text-xs capitalize text-[var(--color-text-muted)]">{item.entityType.replace(/_/g, " ")}</div>
                  </td>
                  <td className="max-w-[220px] px-4 py-3 text-[var(--color-text-muted)]"><span className="block truncate" title={item.case?.name ?? "-"}>{item.case?.name ?? "-"}</span></td>
                  <td className="max-w-[220px] px-4 py-3 text-[var(--color-text-muted)]"><span className="block truncate" title={item.incident?.name ?? "-"}>{item.incident?.name ?? "-"}</span></td>
                  <td className="max-w-[260px] px-4 py-3 text-[var(--color-text-muted)]"><span className="block truncate" title={item.summary ?? "-"}>{item.summary ?? "-"}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <DashboardTablePagination page={safePage} pageSize={pageSize} total={data.activity.length} onPageChange={setPage} onPageSizeChange={changePageSize} />
    </section>
  );
}
