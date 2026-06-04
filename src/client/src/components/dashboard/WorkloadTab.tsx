import { useMemo, useState } from "react";
import type { DashboardWorkloadResponse } from "@shared/graph-types";
import { DashboardTablePagination, paginateDashboardRows } from "@/components/dashboard/DashboardTablePagination";

interface WorkloadTabProps {
  data: DashboardWorkloadResponse;
}

export function WorkloadTab({ data }: WorkloadTabProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const maxTasks = Math.max(...data.workload.map((row) => row.taskCount), 1);
  const pageCount = Math.max(1, Math.ceil(data.workload.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visibleWorkload = useMemo(() => paginateDashboardRows(data.workload, safePage, pageSize), [data.workload, safePage, pageSize]);

  function changePageSize(nextPageSize: number) {
    setPageSize(nextPageSize);
    setPage(1);
  }

  return (
    <section className="rounded-[8px] border border-[var(--color-border)] bg-white shadow-sm">
      <div className="border-b border-[var(--color-border)] px-4 py-3">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">Workload</h3>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          {data.scope === "team" ? "Team task load across accessible cases." : "Your task workload summary."}
        </p>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)]">
        <div className="space-y-3">
          {data.workload.length === 0 ? (
            <p className="rounded-[8px] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-8 text-center text-sm text-[var(--color-text-muted)]">
              No workload data.
            </p>
          ) : (
            data.workload.map((row) => (
              <div key={row.assignee.id} className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-semibold text-[var(--color-text)]">{row.assignee.name}</span>
                  <span className="font-mono text-xs font-semibold text-[var(--color-text-muted)]">{row.taskCount} open</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${Math.max(4, (row.taskCount / maxTasks) * 100)}%` }} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <Stat label="Overdue" value={row.overdueCount} tone="text-rose-700" />
                  <Stat label="Due soon" value={row.dueSoonCount} tone="text-amber-700" />
                  <Stat label="Completed" value={row.completedCount} tone="text-emerald-700" />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="overflow-x-auto rounded-[8px] border border-[var(--color-border)]">
          <table className="min-w-[420px] w-full border-collapse text-left text-sm">
            <thead className="bg-[var(--color-surface-muted)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
              <tr>
                <th className="px-4 py-3 font-semibold">Assignee</th>
                <th className="px-4 py-3 font-semibold">Open</th>
                <th className="px-4 py-3 font-semibold">Overdue</th>
                <th className="px-4 py-3 font-semibold">Due soon</th>
                <th className="px-4 py-3 font-semibold">Completed</th>
              </tr>
            </thead>
            <tbody>
              {data.workload.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-[var(--color-text-muted)]">
                    No rows.
                  </td>
                </tr>
              ) : (
                visibleWorkload.map((row) => (
                  <tr key={row.assignee.id} className="border-t border-[var(--color-border)]">
                    <td className="max-w-[220px] px-4 py-3 font-medium text-[var(--color-text)]"><span className="block truncate" title={row.assignee.name}>{row.assignee.name}</span></td>
                    <td className="px-4 py-3 font-mono text-[var(--color-text)]">{row.taskCount}</td>
                    <td className="px-4 py-3 font-mono text-rose-700">{row.overdueCount}</td>
                    <td className="px-4 py-3 font-mono text-amber-700">{row.dueSoonCount}</td>
                    <td className="px-4 py-3 font-mono text-emerald-700">{row.completedCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <DashboardTablePagination page={safePage} pageSize={pageSize} total={data.workload.length} onPageChange={setPage} onPageSizeChange={changePageSize} />
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-[6px] bg-white px-2 py-2">
      <div className={`font-mono text-base font-semibold ${tone}`}>{value}</div>
      <div className="truncate text-[var(--color-text-muted)]">{label}</div>
    </div>
  );
}
