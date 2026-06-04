import { Input } from "@/components/ui/Input";
import { useGraphStore } from "@/stores/graph-store";

export function GraphToolbar() {
  const { q, setQ, mode, setMode, includeDerived, setIncludeDerived, includeManual, setIncludeManual } =
    useGraphStore();

  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value)}
        className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-sm"
      >
        <option value="overview">Overview</option>
        <option value="timeline">Timeline</option>
        <option value="mitre">MITRE</option>
      </select>

      <label className="flex items-center gap-1 text-sm">
        <input type="checkbox" checked={includeDerived} onChange={(e) => setIncludeDerived(e.target.checked)} />
        Derived
      </label>
      <label className="flex items-center gap-1 text-sm">
        <input type="checkbox" checked={includeManual} onChange={(e) => setIncludeManual(e.target.checked)} />
        Manual
      </label>

      <Input
        placeholder="Search nodes..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-48"
      />
    </div>
  );
}
