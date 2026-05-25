import { DateTime } from "luxon";
import {
  DEFAULT_TIMEZONE,
  getCurrentTimezone,
  localDateRangeToUtcRange,
  normalizeTimezone,
  utcMillis,
} from "@/lib/timezone";

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

export interface TimeFilterRequest {
  field: string;
  start?: string;
  end?: string;
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

export function createTimeFilterState(defaultField: string, timezone: string = getCurrentTimezone()): TimeFilterState {
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
    timezone: normalizeTimezone(timezone),
    displayValue: "All time",
  };
}

export function applyTimeFilter<T extends Record<string, unknown>>(rows: T[], filter: TimeFilterState): T[] {
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

export function normalizeTimeFilterState(
  filter: TimeFilterState,
  timezone: string = filter.timezone || getCurrentTimezone()
): TimeFilterState {
  const normalizedTimezone = normalizeTimezone(timezone);
  const baseState: TimeFilterState = {
    ...filter,
    timezone: normalizedTimezone,
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
      const isBetween = filter.operator === "between";
      const isBefore = filter.operator === "before";
      const range = isBetween ? localDateRangeToUtcRange(filter.startDate, filter.endDate, normalizedTimezone) : null;
      const earliest = !isBefore && filter.startDate ? dateOnlyToIso(filter.startDate, "start", normalizedTimezone) : "";
      const latest = filter.operator === "after"
        ? "now"
        : filter.endDate
          ? dateOnlyToIso(filter.endDate, "end", normalizedTimezone)
          : "";
      return {
        ...baseState,
        earliest: isBetween ? range?.start ?? earliest : earliest,
        latest: isBetween ? range?.end ?? latest : latest,
        displayValue: buildDateSummary(filter.operator, filter.startDate, filter.endDate, normalizedTimezone),
      };
    }
    case "datetime": {
      const isBefore = filter.operator === "before";
      const start = !isBefore
        ? dateTimePartsToIso(filter.startDate, filter.startTime || DEFAULT_START_TIME, normalizedTimezone)
        : "";
      const end = filter.operator === "after"
        ? "now"
        : filter.endDate
          ? dateTimePartsToIso(filter.endDate, filter.endTime || DEFAULT_END_TIME, normalizedTimezone)
          : "";
      return {
        ...baseState,
        earliest: start,
        latest: end,
        displayValue: buildDateTimeSummary(
          filter.operator,
          filter.startDate,
          filter.startTime,
          filter.endDate,
          filter.endTime,
          normalizedTimezone
        ),
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

export function toTimeFilterRequest(filter: TimeFilterState): TimeFilterRequest | null {
  const normalized = normalizeTimeFilterState(filter);
  if (!normalized.earliest && !normalized.latest) {
    return null;
  }

  const timezone = normalized.timezone || DEFAULT_TIMEZONE;
  const start = toUtcIsoBound(normalized.earliest, timezone);
  const end = toUtcIsoBound(normalized.latest, timezone);

  return {
    field: normalized.field,
    start,
    end,
  };
}

function toUtcIsoBound(value: string, timezone: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const millis = parseRequestTimeExpression(value, timezone);
  return millis == null
    ? undefined
    : DateTime.fromMillis(millis, { zone: "utc" }).toISO({ suppressMilliseconds: false }) ?? undefined;
}

function parseRequestTimeExpression(value: string, timezone: string): number | null {
  const raw = value.trim();
  if (raw === "now") {
    return DateTime.now().setZone(normalizeTimezone(timezone)).startOf("minute").toUTC().toMillis();
  }

  const relativeToNowMatch = raw.match(/^([+-]?\d+)(s|m|h|d|w|mon|y)$/i);
  if (relativeToNowMatch) {
    const [, amount, unit] = relativeToNowMatch;
    return addDateOffset(
      DateTime.now().setZone(normalizeTimezone(timezone)).startOf("minute"),
      Number.parseInt(amount, 10),
      unit.toLowerCase()
    ).toUTC().toMillis();
  }

  return parseTimeExpression(value, timezone);
}

interface NumericBounds {
  earliest: number | null;
  latest: number | null;
}

function resolveTimeFilterBounds(filter: TimeFilterState): NumericBounds | null {
  const normalized = normalizeTimeFilterState(filter);
  const timezone = normalized.timezone || DEFAULT_TIMEZONE;
  const earliest = parseTimeExpression(normalized.earliest, timezone);
  const latest = parseTimeExpression(normalized.latest, timezone);

  if (earliest == null && latest == null) {
    return null;
  }

  return { earliest, latest };
}

function validateResolvedDates(filter: TimeFilterState, withTime: boolean): string | null {
  const timezone = filter.timezone || getCurrentTimezone();
  if (filter.operator === "before") {
    const endValue = withTime
      ? dateTimePartsToDate(filter.endDate, filter.endTime || DEFAULT_END_TIME, timezone)
      : dateOnlyToDate(filter.endDate, "end", timezone);
    return endValue ? null : `An end ${withTime ? "date and time" : "date"} is required.`;
  }

  if (filter.operator === "after") {
    const startValue = withTime
      ? dateTimePartsToDate(filter.startDate, filter.startTime || DEFAULT_START_TIME, timezone)
      : dateOnlyToDate(filter.startDate, "start", timezone);
    return startValue ? null : `A start ${withTime ? "date and time" : "date"} is required.`;
  }

  const startValue = withTime
    ? dateTimePartsToDate(filter.startDate, filter.startTime || DEFAULT_START_TIME, timezone)
    : dateOnlyToDate(filter.startDate, "start", timezone);
  const endValue = withTime
    ? dateTimePartsToDate(filter.endDate, filter.endTime || DEFAULT_END_TIME, timezone)
    : dateOnlyToDate(filter.endDate, "end", timezone);

  if (!startValue || !endValue) {
    return `Both start and end ${withTime ? "date-times" : "dates"} are required.`;
  }

  if (startValue.toMillis() >= endValue.toMillis()) {
    return "Start time must be before end time.";
  }

  return null;
}

function validateAdvancedRange(filter: TimeFilterState): string | null {
  const timezone = filter.timezone || getCurrentTimezone();
  const earliest = filter.advancedEarliest.trim();
  const latest = filter.advancedLatest.trim();
  const earliestValue = earliest ? parseTimeExpression(earliest, timezone) : null;
  const latestValue = latest ? parseTimeExpression(latest, timezone) : null;

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

function buildDateSummary(
  operator: TimeFilterOperator,
  startDate: string,
  endDate: string,
  timezone: string
): string {
  switch (operator) {
    case "before":
      return endDate ? `Before ${formatDateLabel(endDate, timezone)}` : "Date range";
    case "after":
      return startDate ? `After ${formatDateLabel(startDate, timezone)}` : "Date range";
    default:
      if (!startDate || !endDate) return "Date range";
      return `${formatDateLabel(startDate, timezone)} -> ${formatDateLabel(endDate, timezone)}`;
  }
}

function buildDateTimeSummary(
  operator: TimeFilterOperator,
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
  timezone: string
): string {
  switch (operator) {
    case "before":
      return endDate ? `Before ${formatDateTimeLabel(endDate, endTime || DEFAULT_END_TIME, timezone)}` : "Date & time range";
    case "after":
      return startDate ? `After ${formatDateTimeLabel(startDate, startTime || DEFAULT_START_TIME, timezone)}` : "Date & time range";
    default:
      if (!startDate || !endDate) return "Date & time range";
      return `${formatDateTimeLabel(startDate, startTime || DEFAULT_START_TIME, timezone)} -> ${formatDateTimeLabel(endDate, endTime || DEFAULT_END_TIME, timezone)}`;
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

function parseTimeExpression(value: string, timezone: string): number | null {
  const raw = value.trim();
  if (!raw) {
    return null;
  }

  const zone = normalizeTimezone(timezone);
  if (raw === "now") {
    return DateTime.now().setZone(zone).toUTC().toMillis();
  }

  if (raw.startsWith("@")) {
    return snapDate(DateTime.now().setZone(zone), raw.slice(1)).toUTC().toMillis();
  }

  const relativeMatch = raw.match(/^([+-]?\d+)(s|m|h|d|w|mon|y)(?:@([a-z]+))?$/i);
  if (relativeMatch) {
    const amount = Number.parseInt(relativeMatch[1], 10);
    const unit = relativeMatch[2].toLowerCase();
    const snapUnit = relativeMatch[3]?.toLowerCase();
    let date = addDateOffset(DateTime.now().setZone(zone), amount, unit);
    if (snapUnit) {
      date = snapDate(date, snapUnit);
    }
    return date.toUTC().toMillis();
  }

  const utcParsed = DateTime.fromISO(raw, { zone: "utc" });
  if (utcParsed.isValid) {
    return utcParsed.toMillis();
  }

  const localParsed = DateTime.fromISO(raw, { zone });
  return localParsed.isValid ? localParsed.toUTC().toMillis() : null;
}

function dateOnlyToIso(date: string, boundary: "start" | "end", timezone: string): string {
  return dateOnlyToDate(date, boundary, timezone)?.toUTC().toISO({ suppressMilliseconds: false }) ?? "";
}

function dateOnlyToDate(date: string, boundary: "start" | "end", timezone: string): DateTime | null {
  if (!date) {
    return null;
  }

  const parsed = DateTime.fromISO(date, { zone: normalizeTimezone(timezone) });
  if (!parsed.isValid) {
    return null;
  }

  return boundary === "start" ? parsed.startOf("day") : parsed.endOf("day");
}

function dateTimePartsToIso(date: string, time: string, timezone: string): string {
  return dateTimePartsToDate(date, time, timezone)?.toUTC().toISO({ suppressMilliseconds: false }) ?? "";
}

function dateTimePartsToDate(date: string, time: string, timezone: string): DateTime | null {
  if (!date) {
    return null;
  }

  const normalizedTime = normalizeTimeInput(time);
  if (!normalizedTime) {
    return null;
  }

  const parsed = DateTime.fromISO(`${date}T${normalizedTime}`, { zone: normalizeTimezone(timezone) });
  return parsed.isValid ? parsed : null;
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

function addDateOffset(base: DateTime, amount: number, unit: string): DateTime {
  switch (unit) {
    case "s":
      return base.plus({ seconds: amount });
    case "m":
      return base.plus({ minutes: amount });
    case "h":
      return base.plus({ hours: amount });
    case "d":
      return base.plus({ days: amount });
    case "w":
      return base.plus({ weeks: amount });
    case "mon":
      return base.plus({ months: amount });
    case "y":
      return base.plus({ years: amount });
    default:
      return base;
  }
}

function snapDate(date: DateTime, unit: string): DateTime {
  switch (unit) {
    case "d":
      return date.startOf("day");
    case "w":
      return date.startOf("week");
    case "mon":
      return date.startOf("month");
    case "y":
      return date.startOf("year");
    default:
      return date;
  }
}

function getTimestamp(value: unknown): number | null {
  return typeof value === "string" ? utcMillis(value) : null;
}

function formatDateLabel(value: string, timezone: string): string {
  const parsed = dateOnlyToDate(value, "start", timezone);
  return parsed?.toFormat("LLL d, yyyy") ?? value;
}

function formatDateTimeLabel(date: string, time: string, timezone: string): string {
  const parsed = dateTimePartsToDate(date, time, timezone);
  return parsed?.toFormat("LLL d, yyyy HH:mm:ss.SSS") ?? `${date} ${time}`.trim();
}
