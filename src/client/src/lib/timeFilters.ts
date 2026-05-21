export type TimeFilterMode = "preset" | "relative" | "date" | "datetime" | "advanced";
export type TimeFilterSection = "presets" | "relative" | "date" | "datetime" | "advanced";
export type TimeFilterOperator = "between" | "before" | "after";
export type RelativeTimeUnit = "seconds" | "minutes" | "hours" | "days" | "weeks" | "months" | "years";

export interface TimeFieldOption {
  value: string;
  label: string;
}

export interface SearchTimeRange {
  earliest: string;
  latest: string;
  timezone?: string;
}

export interface TimeFilterPreset {
  key: string;
  label: string;
  earliest: string;
  latest: string;
}

export interface TimeFilterState extends SearchTimeRange {
  field: string;
  mode: TimeFilterMode;
  activeSection: TimeFilterSection;
  operator: TimeFilterOperator;
  preset: string;
  relativeValue: string;
  relativeUnit: RelativeTimeUnit;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  advancedEarliest: string;
  advancedLatest: string;
  displayValue: string;
}

export const TIME_FILTER_PRESETS: TimeFilterPreset[] = [
  { key: "all_time", label: "All time", earliest: "", latest: "" },
  { key: "last_15_minutes", label: "Last 15 minutes", earliest: "-15m", latest: "now" },
  { key: "last_60_minutes", label: "Last 60 minutes", earliest: "-60m", latest: "now" },
  { key: "last_24_hours", label: "Last 24 hours", earliest: "-24h", latest: "now" },
  { key: "last_7_days", label: "Last 7 days", earliest: "-7d", latest: "now" },
  { key: "last_30_days", label: "Last 30 days", earliest: "-30d", latest: "now" },
  { key: "today", label: "Today", earliest: "@d", latest: "now" },
  { key: "yesterday", label: "Yesterday", earliest: "-1d@d", latest: "@d" },
  { key: "this_week", label: "This week", earliest: "@w", latest: "now" },
  { key: "previous_week", label: "Previous week", earliest: "-1w@w", latest: "@w" },
];

const DEFAULT_RELATIVE_VALUE = "24";
const DEFAULT_START_TIME = "00:00:00.000";
const DEFAULT_END_TIME = "23:59:59.999";

export function createTimeFilterState(defaultField: string): TimeFilterState {
  const timezone = getLocalTimezone();
  return {
    field: defaultField,
    mode: "preset",
    activeSection: "presets",
    operator: "between",
    preset: "all_time",
    relativeValue: DEFAULT_RELATIVE_VALUE,
    relativeUnit: "hours",
    startDate: "",
    startTime: DEFAULT_START_TIME,
    endDate: "",
    endTime: DEFAULT_END_TIME,
    advancedEarliest: "",
    advancedLatest: "now",
    earliest: "",
    latest: "",
    timezone,
    displayValue: "All time",
  };
}

export function applyTimeFilter<T extends Record<string, unknown>>(
  rows: T[],
  filter: TimeFilterState
): T[] {
  const bounds = resolveTimeFilterBounds(filter);
  if (bounds == null) {
    return rows;
  }

  return rows.filter((row) => {
    const timestamp = getTimestamp(row[filter.field]);
    if (timestamp == null) {
      return false;
    }

    if (bounds.earliest != null && timestamp < bounds.earliest) {
      return false;
    }

    if (bounds.latest != null && timestamp > bounds.latest) {
      return false;
    }

    return true;
  });
}

export function validateTimeFilterState(filter: TimeFilterState): string | null {
  switch (filter.mode) {
    case "preset":
      return null;
    case "relative": {
      const amount = Number.parseInt(filter.relativeValue, 10);
      if (!Number.isFinite(amount) || amount <= 0) {
        return "Relative range must use a value greater than zero.";
      }
      return null;
    }
    case "date":
      return validateResolvedDates(filter, false);
    case "datetime":
      return validateResolvedDates(filter, true);
    case "advanced":
      return validateAdvancedRange(filter);
    default:
      return null;
  }
}

export function normalizeTimeFilterState(filter: TimeFilterState): TimeFilterState {
  const timezone = filter.timezone || getLocalTimezone();
  const baseState: TimeFilterState = {
    ...filter,
    timezone,
  };

  switch (filter.mode) {
    case "preset": {
      const preset = getPreset(filter.preset) ?? TIME_FILTER_PRESETS[0];
      return {
        ...baseState,
        preset: preset.key,
        earliest: preset.earliest,
        latest: preset.latest,
        displayValue: preset.label,
      };
    }
    case "relative": {
      const amount = Number.parseInt(filter.relativeValue, 10);
      const suffix = relativeUnitToExpression(filter.relativeUnit);
      const earliest = Number.isFinite(amount) && amount > 0 ? `-${amount}${suffix}` : "";
      return {
        ...baseState,
        earliest,
        latest: "now",
        displayValue: earliest ? `Last ${amount} ${formatRelativeUnitLabel(amount, filter.relativeUnit)}` : "Relative range",
      };
    }
    case "date": {
      const startDate = filter.startDate;
      const endDate = filter.endDate;
      const earliest = filter.operator !== "before" && startDate ? dateOnlyToIso(startDate, "start") : "";
      const latest = filter.operator !== "after" && endDate ? dateOnlyToIso(endDate, "end") : filter.operator === "after" ? "now" : "";
      return {
        ...baseState,
        earliest,
        latest,
        displayValue: buildDateSummary(filter.operator, startDate, endDate),
      };
    }
    case "datetime": {
      const start = filter.operator !== "before"
        ? dateTimePartsToIso(filter.startDate, filter.startTime || DEFAULT_START_TIME)
        : "";
      const end = filter.operator !== "after"
        ? dateTimePartsToIso(filter.endDate, filter.endTime || DEFAULT_END_TIME)
        : filter.operator === "after" ? "now" : "";
      return {
        ...baseState,
        earliest: start,
        latest: end,
        displayValue: buildDateTimeSummary(filter.operator, filter.startDate, filter.startTime, filter.endDate, filter.endTime),
      };
    }
    case "advanced":
      return {
        ...baseState,
        earliest: filter.advancedEarliest.trim(),
        latest: filter.advancedLatest.trim(),
        displayValue: buildAdvancedSummary(filter.advancedEarliest.trim(), filter.advancedLatest.trim()),
      };
    default:
      return baseState;
  }
}

export function formatAppliedTimeFilter(filter: TimeFilterState): string {
  return filter.displayValue || normalizeTimeFilterState(filter).displayValue;
}

interface NumericBounds {
  earliest: number | null;
  latest: number | null;
}

function resolveTimeFilterBounds(filter: TimeFilterState): NumericBounds | null {
  const normalized = normalizeTimeFilterState(filter);
  const earliest = parseTimeExpression(normalized.earliest);
  const latest = parseTimeExpression(normalized.latest);

  if (earliest == null && latest == null) {
    return null;
  }

  return { earliest, latest };
}

function validateResolvedDates(filter: TimeFilterState, withTime: boolean): string | null {
  if (filter.operator === "before") {
    const endValue = withTime
      ? dateTimePartsToDate(filter.endDate, filter.endTime || DEFAULT_END_TIME)
      : dateOnlyToDate(filter.endDate, "end");
    return endValue ? null : `An end ${withTime ? "date and time" : "date"} is required.`;
  }

  if (filter.operator === "after") {
    const startValue = withTime
      ? dateTimePartsToDate(filter.startDate, filter.startTime || DEFAULT_START_TIME)
      : dateOnlyToDate(filter.startDate, "start");
    return startValue ? null : `A start ${withTime ? "date and time" : "date"} is required.`;
  }

  const startValue = withTime
    ? dateTimePartsToDate(filter.startDate, filter.startTime || DEFAULT_START_TIME)
    : dateOnlyToDate(filter.startDate, "start");
  const endValue = withTime
    ? dateTimePartsToDate(filter.endDate, filter.endTime || DEFAULT_END_TIME)
    : dateOnlyToDate(filter.endDate, "end");

  if (!startValue || !endValue) {
    return `Both start and end ${withTime ? "date-times" : "dates"} are required.`;
  }

  if (startValue.getTime() >= endValue.getTime()) {
    return "Start time must be before end time.";
  }

  return null;
}

function validateAdvancedRange(filter: TimeFilterState): string | null {
  const earliest = filter.advancedEarliest.trim();
  const latest = filter.advancedLatest.trim();
  const earliestValue = earliest ? parseTimeExpression(earliest) : null;
  const latestValue = latest ? parseTimeExpression(latest) : null;

  if (earliest && earliestValue == null) {
    return "Earliest must be a relative expression or a valid ISO/local date-time.";
  }

  if (latest && latestValue == null) {
    return "Latest must be a relative expression or a valid ISO/local date-time.";
  }

  if (earliestValue != null && latestValue != null && earliestValue >= latestValue) {
    return "Start time must be before end time.";
  }

  return null;
}

function buildDateSummary(operator: TimeFilterOperator, startDate: string, endDate: string): string {
  switch (operator) {
    case "before":
      return endDate ? `Before ${formatDateLabel(endDate)}` : "Date range";
    case "after":
      return startDate ? `After ${formatDateLabel(startDate)}` : "Date range";
    default:
      if (!startDate || !endDate) return "Date range";
      return `${formatDateLabel(startDate)} -> ${formatDateLabel(endDate)}`;
  }
}

function buildDateTimeSummary(
  operator: TimeFilterOperator,
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string
): string {
  switch (operator) {
    case "before":
      return endDate ? `Before ${formatDateTimeLabel(endDate, endTime || DEFAULT_END_TIME)}` : "Date & time range";
    case "after":
      return startDate ? `After ${formatDateTimeLabel(startDate, startTime || DEFAULT_START_TIME)}` : "Date & time range";
    default:
      if (!startDate || !endDate) return "Date & time range";
      return `${formatDateTimeLabel(startDate, startTime || DEFAULT_START_TIME)} -> ${formatDateTimeLabel(endDate, endTime || DEFAULT_END_TIME)}`;
  }
}

function buildAdvancedSummary(earliest: string, latest: string): string {
  if (!earliest && !latest) {
    return "All time";
  }

  if (!earliest) {
    return `Before ${latest}`;
  }

  if (!latest) {
    return `After ${earliest}`;
  }

  return `${earliest} -> ${latest}`;
}

function getPreset(key: string): TimeFilterPreset | undefined {
  return TIME_FILTER_PRESETS.find((preset) => preset.key === key);
}

function relativeUnitToExpression(unit: RelativeTimeUnit): string {
  switch (unit) {
    case "seconds":
      return "s";
    case "minutes":
      return "m";
    case "hours":
      return "h";
    case "days":
      return "d";
    case "weeks":
      return "w";
    case "months":
      return "mon";
    case "years":
      return "y";
    default:
      return "h";
  }
}

function formatRelativeUnitLabel(amount: number, unit: RelativeTimeUnit): string {
  return amount === 1 ? unit.slice(0, -1) : unit;
}

function parseTimeExpression(value: string): number | null {
  const raw = value.trim();
  if (!raw) {
    return null;
  }

  if (raw === "now") {
    return Date.now();
  }

  if (raw.startsWith("@")) {
    return snapDate(Date.now(), raw.slice(1)).getTime();
  }

  const relativeMatch = raw.match(/^([+-]?\d+)(s|m|h|d|w|mon|y)(?:@([a-z]+))?$/i);
  if (relativeMatch) {
    const amount = Number.parseInt(relativeMatch[1], 10);
    const unit = relativeMatch[2].toLowerCase();
    const snapUnit = relativeMatch[3]?.toLowerCase();
    let date = new Date();
    date = addDateOffset(date, amount, unit);
    if (snapUnit) {
      date = snapDate(date.getTime(), snapUnit);
    }
    return date.getTime();
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

function dateOnlyToIso(date: string, boundary: "start" | "end"): string {
  return dateOnlyToDate(date, boundary)?.toISOString() ?? "";
}

function dateOnlyToDate(date: string, boundary: "start" | "end"): Date | null {
  if (!date) {
    return null;
  }

  const [year, month, day] = date.split("-").map((part) => Number.parseInt(part, 10));
  if (!year || !month || !day) {
    return null;
  }

  if (boundary === "start") {
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }

  return new Date(year, month - 1, day, 23, 59, 59, 999);
}

function dateTimePartsToIso(date: string, time: string): string {
  return dateTimePartsToDate(date, time)?.toISOString() ?? "";
}

function dateTimePartsToDate(date: string, time: string): Date | null {
  if (!date) {
    return null;
  }

  const normalizedTime = normalizeTimeInput(time);
  if (!normalizedTime) {
    return null;
  }

  const parsed = new Date(`${date}T${normalizedTime}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeTimeInput(value: string): string | null {
  const raw = value.trim();
  if (!raw) {
    return null;
  }

  const match = raw.match(/^(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/);
  if (!match) {
    return null;
  }

  const [, hour, minute, second = "00", milliseconds = "000"] = match;
  const paddedMilliseconds = milliseconds.padEnd(3, "0");
  return `${hour}:${minute}:${second}.${paddedMilliseconds}`;
}

function addDateOffset(base: Date, amount: number, unit: string): Date {
  const next = new Date(base.getTime());
  switch (unit) {
    case "s":
      next.setSeconds(next.getSeconds() + amount);
      return next;
    case "m":
      next.setMinutes(next.getMinutes() + amount);
      return next;
    case "h":
      next.setHours(next.getHours() + amount);
      return next;
    case "d":
      next.setDate(next.getDate() + amount);
      return next;
    case "w":
      next.setDate(next.getDate() + amount * 7);
      return next;
    case "mon":
      next.setMonth(next.getMonth() + amount);
      return next;
    case "y":
      next.setFullYear(next.getFullYear() + amount);
      return next;
    default:
      return next;
  }
}

function snapDate(timestamp: number, unit: string): Date {
  const date = new Date(timestamp);
  switch (unit) {
    case "d":
      date.setHours(0, 0, 0, 0);
      return date;
    case "w": {
      const day = date.getDay();
      const diff = (day + 6) % 7;
      date.setDate(date.getDate() - diff);
      date.setHours(0, 0, 0, 0);
      return date;
    }
    case "mon":
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
      return date;
    case "y":
      date.setMonth(0, 1);
      date.setHours(0, 0, 0, 0);
      return date;
    default:
      return date;
  }
}

function getTimestamp(value: unknown): number | null {
  if (typeof value !== "string" || !value) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function formatDateLabel(value: string): string {
  const parsed = dateOnlyToDate(value, "start");
  if (!parsed) {
    return value;
  }

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTimeLabel(date: string, time: string): string {
  const parsed = dateTimePartsToDate(date, time);
  if (!parsed) {
    return `${date} ${time}`.trim();
  }

  const milliseconds = parsed.getMilliseconds().toString().padStart(3, "0");
  return `${parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} ${parsed.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })}.${milliseconds}`;
}

function getLocalTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}
