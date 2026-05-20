import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { ColumnDef } from "@/config/table-definitions";

interface DataTableProps {
  columns: ColumnDef[];
  data: Record<string, unknown>[];
  emptyLabel?: string;
  onRowClick?: (row: Record<string, unknown>) => void;
  onRowDoubleClick?: (row: Record<string, unknown>, column: ColumnDef) => void;
  renderRowActions?: (row: Record<string, unknown>) => React.ReactNode;
  selectedRowId?: string | null;
  searchable?: boolean;
  pageSize?: number;
}

function getBadgeVariant(value: string): "success" | "warning" | "danger" | "secondary" | "default" {
  const v = value.toLowerCase();
  if (["open", "active", "online", "confirmed", "done"].includes(v)) return "success";
  if (["in_progress", "medium", "contained"].includes(v)) return "warning";
  if (["critical", "high", "closed", "compromised", "locked", "blocked"].includes(v)) return "danger";
  return "secondary";
}

export function DataTable({
  columns,
  data,
  emptyLabel = "No data available.",
  onRowClick,
  onRowDoubleClick,
  renderRowActions,
  selectedRowId,
  searchable = true,
  pageSize = 25,
}: DataTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => String(row[col.key] ?? "").toLowerCase().includes(q))
    );
  }, [data, search, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = String(a[sortKey] ?? "");
      const bv = String(b[sortKey] ?? "");
      const cmp = av.localeCompare(bv, undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const paged = sorted.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  useEffect(() => {
    setRowsPerPage(pageSize);
  }, [pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  function toggleSort(col: ColumnDef) {
    if (sortKey === col.sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(col.sortKey);
      setSortDir("asc");
    }
  }

  return (
    <div>
      {searchable && (
        <div className="mb-3">
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="max-w-xs"
          />
        </div>
      )}

      {paged.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">{emptyLabel}</p>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-sm)] border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="cursor-pointer px-3 py-2 text-left font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    onClick={() => toggleSort(col)}
                  >
                    {col.label}
                    {sortKey === col.sortKey && (
                      <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
                    )}
                  </th>
                ))}
                {renderRowActions && <th className="px-3 py-2 text-right font-medium text-[var(--color-text-muted)]">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {paged.map((row, i) => (
                <tr
                  key={String(row.id ?? i)}
                  className={cn(
                    "border-b border-[var(--color-border)] last:border-0",
                    onRowClick && "cursor-pointer hover:bg-[var(--color-surface-muted)]",
                    selectedRowId && String(row.id ?? "") === selectedRowId && "bg-[var(--color-primary-soft)]/40"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-3 py-2",
                        col.title && "font-medium",
                        col.editable && onRowDoubleClick && "cursor-text hover:bg-[var(--color-surface-subtle)]"
                      )}
                      onDoubleClick={() => col.editable && onRowDoubleClick?.(row, col)}
                    >
                      {renderCell(col, row)}
                    </td>
                  ))}
                  {renderRowActions && (
                    <td className="px-3 py-2 text-right" onClick={(event) => event.stopPropagation()}>
                      <div className="flex justify-end gap-2">{renderRowActions(row)}</div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sorted.length > 0 && (
        <div className="mt-3 flex flex-col gap-3 text-sm text-[var(--color-text-muted)] md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              {(currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, sorted.length)} of{" "}
              {sorted.length}
            </span>
            <label className="flex items-center gap-2">
              <span>Rows</span>
              <select
                className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-[var(--color-text)]"
                value={rowsPerPage}
                onChange={(event) => {
                  setRowsPerPage(Number(event.target.value));
                  setPage(1);
                }}
              >
                {[10, 25, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span>
              Page {currentPage} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setPage(1)}
            >
              First
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(totalPages)}
            >
              Last
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function renderCell(col: ColumnDef, row: Record<string, unknown>) {
  const raw = row[col.key];
  if (col.format) return <>{col.format(raw, row)}</>;
  if (col.badge && raw) {
    return <Badge variant={getBadgeVariant(String(raw))}>{String(raw)}</Badge>;
  }
  return <>{raw != null ? String(raw) : "—"}</>;
}
