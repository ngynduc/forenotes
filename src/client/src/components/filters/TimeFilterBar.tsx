import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import {
  TIME_FILTER_PRESETS,
  createTimeFilterState,
  formatAppliedTimeFilter,
  normalizeTimeFilterState,
  type TimeFieldOption,
  type TimeFilterSection,
  type TimeFilterState,
  validateTimeFilterState,
} from "@/lib/timeFilters";

interface TimeFilterBarProps {
  fieldOptions: TimeFieldOption[];
  totalCount: number;
  filteredCount: number;
  value: TimeFilterState;
  onChange: (next: TimeFilterState) => void;
  layout?: "panel" | "compact";
}

const sections: Array<{ key: TimeFilterSection; label: string }> = [
  { key: "presets", label: "Presets" },
  { key: "relative", label: "Relative" },
  { key: "date", label: "Date Range" },
  { key: "datetime", label: "Date & Time" },
  { key: "advanced", label: "Advanced" },
];

function modeForSection(section: TimeFilterSection): TimeFilterState["mode"] {
  return section === "presets" ? "preset" : section;
}

export function TimeFilterBar({
  fieldOptions,
  totalCount,
  filteredCount,
  value,
  onChange,
  layout = "panel",
}: TimeFilterBarProps) {
  const [draft, setDraft] = useState(value);
  const [expanded, setExpanded] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const appliedSummary = useMemo(() => formatAppliedTimeFilter(value), [value]);
  const validationError = useMemo(() => validateTimeFilterState(draft), [draft]);
  const isCompact = layout === "compact";

  useEffect(() => {
    if (!expanded) {
      setDraft(value);
    }
  }, [value]);

  useEffect(() => {
    if (validationError) {
      setExpanded(true);
    }
  }, [validationError]);

  useEffect(() => {
    if (!expanded) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setDraft(value);
        setExpanded(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDraft(value);
        setExpanded(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [expanded, value]);

  function updateDraft(next: Partial<TimeFilterState>) {
    setDraft((current) => ({ ...current, ...next }));
  }

  function setSection(section: TimeFilterSection) {
    updateDraft({
      activeSection: section,
      mode: modeForSection(section),
    });
  }

  function applyDraft() {
    if (validationError) {
      return;
    }

    onChange(normalizeTimeFilterState(draft));
    setExpanded(false);
  }

  function clearFilter() {
    const cleared = createTimeFilterState(draft.field, draft.timezone || value.timezone || "UTC");
    setDraft(cleared);
  }

  function openEditor() {
    setDraft(value);
    setExpanded(true);
  }

  function cancelDraft() {
    setDraft(value);
    setExpanded(false);
  }

  function updateAppliedField(field: string) {
    const nextApplied = normalizeTimeFilterState({ ...value, field });
    setDraft((current) => ({ ...current, field }));
    onChange(nextApplied);
  }

  const editorContent = (
    <>
      <div className="mb-3 flex gap-1 overflow-x-auto pb-1">
        {sections.map((section) => (
          <button
            key={section.key}
            type="button"
            className={cn(
              "shrink-0 rounded-[var(--radius-sm)] border px-2.5 py-1 text-xs font-medium transition-colors",
              draft.activeSection === section.key
                ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]"
                : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
            )}
            onClick={() => setSection(section.key)}
          >
            {section.label}
          </button>
        ))}
      </div>

      <div className="mb-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,9rem)]">
        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Time field</span>
          <Select
            className="h-8 px-2 text-xs shadow-none"
            value={draft.field}
            onChange={(event) => updateDraft({ field: event.target.value })}
          >
            {fieldOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </label>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Timezone</span>
          <div className="flex h-8 items-center rounded-[var(--radius-sm)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2 text-xs text-[var(--color-text)]">
            {draft.timezone || "UTC"}
          </div>
        </div>
      </div>

      {draft.activeSection === "presets" && (
        <div className="grid gap-1.5 sm:grid-cols-2">
          {TIME_FILTER_PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              className={cn(
                "rounded-[var(--radius-sm)] border px-2.5 py-1.5 text-left text-xs transition-colors",
                draft.preset === preset.key
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-muted)]"
              )}
              onClick={() => updateDraft({ mode: "preset", preset: preset.key })}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      {draft.activeSection === "relative" && (
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1.35fr)_minmax(0,0.8fr)_minmax(0,0.8fr)]">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">From</span>
            <div className="flex gap-1.5">
              <Input
                className="h-8 px-2 text-xs shadow-none"
                min={1}
                step={1}
                type="number"
                value={draft.relativeValue}
                onChange={(event) => updateDraft({ mode: "relative", relativeValue: event.target.value })}
              />
              <Select
                className="h-8 px-2 text-xs shadow-none"
                value={draft.relativeUnit}
                onChange={(event) => updateDraft({ mode: "relative", relativeUnit: event.target.value as TimeFilterState["relativeUnit"] })}
              >
                <option value="seconds">Seconds</option>
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
                <option value="years">Years</option>
              </Select>
            </div>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Direction</span>
            <div className="flex h-8 items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs text-[var(--color-text)]">
              ago
            </div>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">To</span>
            <div className="flex h-8 items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs text-[var(--color-text)]">
              now
            </div>
          </label>
        </div>
      )}

      {(draft.activeSection === "date" || draft.activeSection === "datetime") && (
        <div className="flex flex-col gap-2">
          <div className="grid gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Operator</span>
              <Select
                className="h-8 px-2 text-xs shadow-none"
                value={draft.operator}
                onChange={(event) => updateDraft({
                  mode: modeForSection(draft.activeSection),
                  operator: event.target.value as TimeFilterState["operator"],
                })}
              >
                <option value="between">Between</option>
                <option value="before">Before</option>
                <option value="after">After</option>
              </Select>
            </label>

            {draft.operator !== "before" && (
              <div className={cn("grid gap-2", draft.activeSection === "datetime" ? "sm:grid-cols-2" : undefined)}>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Start date</span>
                  <Input
                    className="h-8 px-2 text-xs shadow-none"
                    type="date"
                    value={draft.startDate}
                    onChange={(event) => updateDraft({ mode: modeForSection(draft.activeSection), startDate: event.target.value })}
                  />
                </label>
                {draft.activeSection === "datetime" && (
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Start time</span>
                    <Input
                      className="h-8 px-2 text-xs shadow-none"
                      type="text"
                      inputMode="numeric"
                      placeholder="00:00:00.000"
                      value={draft.startTime}
                      onChange={(event) => updateDraft({ mode: "datetime", startTime: event.target.value })}
                    />
                  </label>
                )}
              </div>
            )}

            {draft.operator !== "after" && (
              <div className={cn("grid gap-2", draft.activeSection === "datetime" ? "sm:grid-cols-2" : undefined)}>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">End date</span>
                  <Input
                    className="h-8 px-2 text-xs shadow-none"
                    type="date"
                    value={draft.endDate}
                    onChange={(event) => updateDraft({ mode: modeForSection(draft.activeSection), endDate: event.target.value })}
                  />
                </label>
                {draft.activeSection === "datetime" && (
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">End time</span>
                    <Input
                      className="h-8 px-2 text-xs shadow-none"
                      type="text"
                      inputMode="numeric"
                      placeholder="23:59:59.999"
                      value={draft.endTime}
                      onChange={(event) => updateDraft({ mode: "datetime", endTime: event.target.value })}
                    />
                  </label>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {draft.activeSection === "advanced" && (
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Earliest</span>
            <Input
              className="h-8 px-2 text-xs shadow-none"
              type="text"
              placeholder="-7d@d or 2026-05-01T00:00:00"
              value={draft.advancedEarliest}
              onChange={(event) => updateDraft({ mode: "advanced", advancedEarliest: event.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Latest</span>
            <Input
              className="h-8 px-2 text-xs shadow-none"
              type="text"
              placeholder="now or 2026-05-21T09:26:47"
              value={draft.advancedLatest}
              onChange={(event) => updateDraft({ mode: "advanced", advancedLatest: event.target.value })}
            />
          </label>
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2 border-t border-[var(--color-border)] pt-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-[var(--color-text-muted)]">
            Showing {filteredCount} of {totalCount} records
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button type="button" size="sm" variant="outline" onClick={clearFilter}>
              Clear
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={cancelDraft}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={applyDraft} disabled={Boolean(validationError)}>
              Apply
            </Button>
          </div>
        </div>
        {validationError ? (
          <div className="rounded-[var(--radius-sm)] border border-[var(--color-danger)]/20 bg-[var(--color-danger-soft)] px-2.5 py-1.5 text-xs text-[var(--color-danger)]">
            {validationError}
          </div>
        ) : (
          <div className="text-[11px] text-[var(--color-text-muted)]">
            Draft changes stay local until you apply them.
          </div>
        )}
      </div>
    </>
  );

  if (isCompact) {
    return (
      <div ref={rootRef} className="relative mb-3">
        <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 shadow-sm">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">Time filter</span>
          <button
            type="button"
            className="inline-flex h-8 items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-xs font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-muted)]"
            onClick={() => (expanded ? cancelDraft() : openEditor())}
          >
            <span className="truncate">{appliedSummary}</span>
            <span aria-hidden="true" className="ml-1 text-[10px] text-[var(--color-text-muted)]">▼</span>
          </button>
          <Select
            className="h-8 w-auto min-w-[8.5rem] px-2 text-xs shadow-none"
            value={value.field}
            onChange={(event) => updateAppliedField(event.target.value)}
            aria-label="Time field"
          >
            {fieldOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <div className="inline-flex h-8 items-center rounded-full border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2.5 text-xs text-[var(--color-text-muted)]">
            {value.timezone || "UTC"}
          </div>
          <div className="text-xs text-[var(--color-text-muted)]">
            {filteredCount} / {totalCount}
          </div>
          <Button type="button" size="sm" variant="outline" className="ml-auto" onClick={() => setExpanded(false)}>
            Hide
          </Button>
        </div>

        {expanded && (
          <div className="absolute left-0 top-[calc(100%+0.5rem)] z-30 w-full max-w-[520px] rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-lg">
            {editorContent}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="mb-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
      <div className={cn("px-3 py-2", expanded && "border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]/70")}>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">Time filter</div>
            <div className="truncate text-xs font-medium text-[var(--color-text)]">{appliedSummary}</div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="rounded-[var(--radius-sm)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2 py-1 text-[11px] text-[var(--color-text-muted)]">
              {draft.timezone || "UTC"}
            </div>
            <div className="text-[11px] text-[var(--color-text-muted)]">
              {filteredCount} / {totalCount}
            </div>
            <Button type="button" size="sm" variant="outline" onClick={() => (expanded ? cancelDraft() : openEditor())}>
              {expanded ? "Hide" : "Edit"}
            </Button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="p-3">
          {editorContent}
        </div>
      )}
    </div>
  );
}
