import { useEffect, useRef, useState } from "react";
import { DateTime } from "luxon";
import { cn } from "@/lib/utils";

interface TimezonePickerProps {
  value: string;
  options: string[];
  onChange: (timezone: string) => void;
  className?: string;
  compactOnSmall?: boolean;
}

const KEYWORDS: Record<string, string> = {
  "Asia/Ho_Chi_Minh": "Vietnam Viet Nam Saigon Ho Chi Minh",
  UTC: "GMT Coordinated Universal Time Zulu",
};

export function TimezonePicker({ value, options, onChange, className, compactOnSmall = false }: TimezonePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = normalizedQuery
    ? options.filter((option) => timezoneSearchText(option).includes(normalizedQuery))
    : options;

  useEffect(() => {
    if (!open) {
      return;
    }
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  function handleSelect(timezone: string) {
    onChange(timezone);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-left text-xs text-[var(--color-text)]"
        aria-expanded={open}
        aria-label={`Timezone: ${formatTimezoneLabel(value)}`}
        onClick={() => setOpen((current) => !current)}
      >
        {compactOnSmall ? (
          <>
            <span aria-hidden="true" className="block truncate sm:hidden">{formatCompactTimezoneLabel(value)}</span>
            <span aria-hidden="true" className="hidden truncate sm:block">{formatTimezoneLabel(value)}</span>
          </>
        ) : (
          <span className="block truncate">{formatTimezoneLabel(value)}</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+4px)] z-50 w-80 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-lg">
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setOpen(false);
              }
            }}
            placeholder="Search timezone..."
            className="mb-2 w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-sm text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          />

          <div className="max-h-[280px] overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-2 py-6 text-center text-sm text-[var(--color-text-muted)]">No timezone found</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded px-2 py-1.5 text-left text-sm hover:bg-[var(--color-surface-muted)]",
                    option === value && "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                  )}
                  onClick={() => handleSelect(option)}
                >
                  <span className="min-w-0 truncate">{formatTimezoneLabel(option)}</span>
                  <span className="shrink-0 text-xs text-[var(--color-text-muted)]">{timezoneOffset(option)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTimezoneLabel(timezone: string) {
  const city = timezone.split("/").pop()?.replace(/_/g, " ");
  return city && city !== timezone ? `${timezone} (${city})` : timezone;
}

function timezoneOffset(timezone: string) {
  const offset = DateTime.now().setZone(timezone).toFormat("ZZ");
  return offset === "Invalid DateTime" ? "+00:00" : offset;
}

function formatCompactTimezoneLabel(timezone: string) {
  const offset = timezoneOffset(timezone);
  const sign = offset.startsWith("-") ? "-" : "+";
  const [hours = "00", minutes = "00"] = offset.replace(/^[-+]/, "").split(":");
  const compactHours = String(Number(hours));
  return minutes === "00" ? `UTC${sign}${compactHours}` : `UTC${sign}${compactHours}:${minutes}`;
}

function timezoneSearchText(timezone: string) {
  return [
    timezone,
    timezone.replace(/_/g, " "),
    formatTimezoneLabel(timezone),
    timezoneOffset(timezone),
    KEYWORDS[timezone] ?? "",
  ]
    .join(" ")
    .toLowerCase();
}
