import { useMemo, useState } from "react";
import type { DashboardCasesResponse } from "@shared/graph-types";
import { DashboardTablePagination, paginateDashboardRows } from "@/components/dashboard/DashboardTablePagination";
import { formatDateTimeForTimezone, formatRelativeTime } from "@/lib/timezone";

interface CasesIncidentsTabProps {
  data: DashboardCasesResponse;
  timezone: string;
}

export function CasesIncidentsTab({ data, timezone }: CasesIncidentsTabProps) {
  return (
    <div className="space-y-4">
      <HealthTable
        title="Cases"
        rows={data.cases.map((item) => ({
          id: item.id,
          name: item.name,
          status: item.status,
          context: `${item.activeIncidents} active incidents`,
          openFindings: item.openFindings,
          openTasks: item.openTasks,
          lastActivityAt: item.lastActivityAt,
          slaRiskCount: item.slaRiskCount
        }))}
        timezone={timezone}
      />
      <HealthTable
        title="Incidents"
        rows={data.incidents.map((item) => ({
          id: item.id,
          name: item.name,
          status: item.status,
          context: item.case.name,
          openFindings: item.openFindings,
          openTasks: item.openTasks,
          lastActivityAt: item.lastActivityAt,
          slaRiskCount: item.slaRiskCount
        }))}
        timezone={timezone}
      />
    </div>
  );
}

function HealthTable({
  title,
  rows,
  timezone
}: {
  title: string;
  rows: Array<{
    id: string;
    name: string;
    status: string;
    context: string;
    openFindings: number;
    openTasks: number;
    lastActivityAt: string | null;
    slaRiskCount: number;
  }>;
  timezone: string;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visibleRows = useMemo(() => paginateDashboardRows(rows, safePage, pageSize), [rows, safePage, pageSize]);

  function changePageSize(nextPageSize: number) {
    setPageSize(nextPageSize);
    setPage(1);
  }

  return (
    <section className="rounded-[8px] border border-[var(--color-border)] bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">{title}</h3>
        <span className="rounded-full bg-[var(--color-surface-muted)] px-2.5 py-1 font-mono text-xs text-[var(--color-text-muted)]">{rows.length}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[760px] w-full border-collapse text-left text-sm">
          <thead className="bg-[var(--color-surface-muted)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Open findings</th>
              <th className="px-4 py-3 font-semibold">Open tasks</th>
              <th className="px-4 py-3 font-semibold">Last activity</th>
              <th className="px-4 py-3 font-semibold">SLA risk</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-[var(--color-text-muted)]">
                  No {title.toLowerCase()} in scope.
                </td>
              </tr>
            ) : (
              visibleRows.map((row) => (
                <tr key={row.id} className="border-t border-[var(--color-border)] align-top">
                  <td className="px-4 py-3">
                    <div className="max-w-[300px] truncate font-medium text-[var(--color-text)]" title={row.name}>{row.name}</div>
                    <div className="mt-1 max-w-[300px] truncate text-xs text-[var(--color-text-muted)]" title={row.context}>{row.context}</div>
                  </td>
                  <td className="px-4 py-3 capitalize text-[var(--color-text-muted)]">{row.status}</td>
                  <td className="px-4 py-3 font-mono text-[var(--color-text)]">{row.openFindings}</td>
                  <td className="px-4 py-3 font-mono text-[var(--color-text)]">{row.openTasks}</td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs text-[var(--color-text)]">{formatDateTimeForTimezone(row.lastActivityAt, timezone)}</div>
                    <div className="mt-1 text-xs text-[var(--color-text-muted)]">{formatRelativeTime(row.lastActivityAt)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-amber-50 px-2 py-1 font-mono text-xs font-semibold text-amber-700">{row.slaRiskCount}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <DashboardTablePagination page={safePage} pageSize={pageSize} total={rows.length} onPageChange={setPage} onPageSizeChange={changePageSize} />
    </section>
  );
}
