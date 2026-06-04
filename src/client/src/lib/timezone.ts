import { DateTime } from "luxon";

export const DEFAULT_TIMEZONE = "UTC";
export const TIMEZONE_STORAGE_KEY = "forenotes-timezone";

const FALLBACK_TIMEZONES = [
  "UTC",
  "Asia/Ho_Chi_Minh",
  "America/New_York",
  "Europe/London",
  "America/Los_Angeles",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Australia/Sydney",
];

let currentTimezone = DEFAULT_TIMEZONE;

export interface UtcRange {
  start: string;
  end: string;
}

function isValidTimezone(timezone: string): boolean {
  return DateTime.now().setZone(timezone).isValid;
}

export function normalizeTimezone(timezone: string | null | undefined): string {
  if (!timezone) {
    return DEFAULT_TIMEZONE;
  }

  return isValidTimezone(timezone) ? timezone : DEFAULT_TIMEZONE;
}

export function readStoredTimezone(): string {
  if (typeof window === "undefined") {
    return DEFAULT_TIMEZONE;
  }

  try {
    return normalizeTimezone(window.localStorage.getItem(TIMEZONE_STORAGE_KEY));
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

export function writeStoredTimezone(timezone: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(TIMEZONE_STORAGE_KEY, normalizeTimezone(timezone));
  } catch {
    // Ignore storage failures and keep the in-memory setting.
  }
}

export function setCurrentTimezone(timezone: string): void {
  currentTimezone = normalizeTimezone(timezone);
}

export function getCurrentTimezone(): string {
  return currentTimezone;
}

export function getTimezoneOptions(): string[] {
  if (typeof Intl.supportedValuesOf === "function") {
    const supported = Intl.supportedValuesOf("timeZone");
    return Array.from(new Set([DEFAULT_TIMEZONE, ...FALLBACK_TIMEZONES, ...supported])).sort((left, right) => {
      if (left === DEFAULT_TIMEZONE) return -1;
      if (right === DEFAULT_TIMEZONE) return 1;
      return left.localeCompare(right);
    });
  }

  return FALLBACK_TIMEZONES;
}

function parseUtc(value: string | null | undefined): DateTime | null {
  if (!value) {
    return null;
  }

  const parsed = DateTime.fromISO(value, { zone: "utc" });
  return parsed.isValid ? parsed : null;
}

function parseLocalDateTime(value: string | null | undefined, timezone: string): DateTime | null {
  if (!value) {
    return null;
  }

  const parsed = DateTime.fromISO(value, { zone: normalizeTimezone(timezone) });
  return parsed.isValid ? parsed : null;
}

export function formatUtcDate(
  value: string | null | undefined,
  timezone: string = getCurrentTimezone()
): string {
  const parsed = parseUtc(value);
  if (!parsed) {
    return "—";
  }

  return parsed.setZone(normalizeTimezone(timezone)).toLocaleString(DateTime.DATE_MED);
}

export function formatUtcDateTime(
  value: string | null | undefined,
  timezone: string = getCurrentTimezone()
): string {
  const parsed = parseUtc(value);
  if (!parsed) {
    return "—";
  }

  return parsed.setZone(normalizeTimezone(timezone)).toFormat("yyyy-LL-dd HH:mm");
}

export function formatDateTimeForTimezone(
  value: string | null | undefined,
  timezone: string = getCurrentTimezone()
): string {
  const parsed = parseUtc(value);
  if (!parsed) {
    return "—";
  }

  const zoned = parsed.setZone(normalizeTimezone(timezone));
  const zoneLabel = zoned.offsetNameShort || zoned.toFormat("ZZ");
  return `${zoned.toFormat("LLL d, yyyy HH:mm")} ${zoneLabel}`;
}

export function formatRelativeTime(value: string | null | undefined): string {
  const parsed = parseUtc(value);
  if (!parsed) {
    return "";
  }

  const diffSeconds = Math.round(parsed.diffNow("seconds").seconds);
  const absSeconds = Math.abs(diffSeconds);
  const suffix = diffSeconds < 0 ? "ago" : "from now";

  if (absSeconds < 45) {
    return diffSeconds < 0 ? "just now" : "in moments";
  }

  const units: Array<[Intl.RelativeTimeFormatUnit, number, string]> = [
    ["year", 365 * 24 * 60 * 60, "y"],
    ["month", 30 * 24 * 60 * 60, "mo"],
    ["day", 24 * 60 * 60, "d"],
    ["hour", 60 * 60, "h"],
    ["minute", 60, "m"],
  ];
  const [, secondsPerUnit, label] = units.find(([, seconds]) => absSeconds >= seconds) ?? ["minute", 60, "m"];
  const amount = Math.max(1, Math.round(absSeconds / secondsPerUnit));
  return diffSeconds < 0 ? `${amount}${label} ${suffix}` : `in ${amount}${label}`;
}

export type DueStatus = "none" | "overdue" | "due_soon" | "upcoming";

export function formatDueStatus(
  value: string | null | undefined,
  timezone: string = getCurrentTimezone()
): { status: DueStatus; label: string } {
  const parsed = parseUtc(value);
  if (!parsed) {
    return { status: "none", label: "No due date" };
  }

  const zone = normalizeTimezone(timezone);
  const due = parsed.setZone(zone);
  const now = DateTime.now().setZone(zone);
  if (due < now) {
    return { status: "overdue", label: "Overdue" };
  }

  if (due <= now.plus({ hours: 72 })) {
    return { status: "due_soon", label: due <= now.plus({ hours: 24 }) ? "Due next 24h" : "Due next 72h" };
  }

  return { status: "upcoming", label: "Upcoming" };
}

export function formatUtcTimestampForTitle(value: string | null | undefined): string {
  const parsed = parseUtc(value);
  if (!parsed) {
    return "";
  }

  return `UTC ${parsed.toFormat("yyyy-LL-dd HH:mm:ss 'Z'")}`;
}

export function utcToDateInputValue(value: string | null | undefined): string {
  const parsed = parseUtc(value);
  return parsed?.toISODate() ?? "";
}

export function utcToLocalInputValue(
  value: string | null | undefined,
  timezone: string = getCurrentTimezone()
): string {
  const parsed = parseUtc(value);
  if (!parsed) {
    return "";
  }

  return parsed.setZone(normalizeTimezone(timezone)).toFormat("yyyy-LL-dd'T'HH:mm");
}

export function localInputValueToUtc(
  value: string | null | undefined,
  timezone: string = getCurrentTimezone()
): string | null {
  const parsed = parseLocalDateTime(value, timezone);
  return parsed?.toUTC().toISO({ suppressMilliseconds: false }) ?? null;
}

export function dateInputToUtcIso(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const parsed = DateTime.fromISO(value, { zone: "utc" }).startOf("day");
  return parsed.isValid ? parsed.toUTC().toISO({ suppressMilliseconds: false }) : null;
}

export function localDateRangeToUtcRange(
  startDate: string,
  endDate: string,
  timezone: string = getCurrentTimezone()
): UtcRange | null {
  if (!startDate || !endDate) {
    return null;
  }

  const zone = normalizeTimezone(timezone);
  const start = DateTime.fromISO(startDate, { zone }).startOf("day");
  const end = DateTime.fromISO(endDate, { zone }).endOf("day");
  if (!start.isValid || !end.isValid) {
    return null;
  }

  return {
    start: start.toUTC().toISO({ suppressMilliseconds: false }) ?? "",
    end: end.toUTC().toISO({ suppressMilliseconds: false }) ?? "",
  };
}

export function utcMillis(value: string | null | undefined): number | null {
  const parsed = parseUtc(value);
  return parsed?.toMillis() ?? null;
}
