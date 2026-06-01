import { ChevronLeft, ChevronRight } from "lucide-react";

export type DashboardTablePaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
};

const PAGE_SIZES = [10, 25, 50];

export function DashboardTablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange
}: DashboardTablePaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), pageCount);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, total);

  return (
    <div className="flex flex-col gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-muted)] sm:flex-row sm:items-center sm:justify-between">
      <div className="font-mono text-xs tabular-nums">
        Showing {start}-{end} of {total}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {onPageSizeChange && (
          <label className="flex items-center gap-2 text-xs">
            <span>Rows</span>
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="rounded-[6px] border border-[var(--color-border)] bg-white px-2 py-1.5 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-soft)]"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-[6px] border border-[var(--color-border)] bg-white px-2.5 py-1.5 text-xs font-medium text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Previous
        </button>
        <span className="font-mono text-xs tabular-nums">
          Page {safePage} of {pageCount}
        </span>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-[6px] border border-[var(--color-border)] bg-white px-2.5 py-1.5 text-xs font-medium text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={safePage >= pageCount}
          onClick={() => onPageChange(safePage + 1)}
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function paginateDashboardRows<T>(rows: T[], page: number, pageSize: number): T[] {
  const safePage = Math.max(page, 1);
  return rows.slice((safePage - 1) * pageSize, safePage * pageSize);
}
