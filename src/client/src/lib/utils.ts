import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  dateInputToUtcIso,
  formatUtcDate,
  formatUtcDateTime,
  utcToDateInputValue,
  utcToLocalInputValue,
  localInputValueToUtc,
} from "@/lib/timezone";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string | null | undefined): string {
  return formatUtcDate(value);
}

export function formatDateTime(value: string | null | undefined): string {
  return formatUtcDateTime(value);
}

export function escapeHtml(text: string): string {
  const el = document.createElement("span");
  el.textContent = text;
  return el.innerHTML;
}

export function compactText(text: string, max: number): string {
  if (!text) return "";
  return text.length > max ? text.slice(0, max) + "…" : text;
}

export function toDateInputValue(value: string | null | undefined): string {
  return utcToDateInputValue(value);
}

export function toLocalInputValue(value: string | null | undefined): string {
  return utcToLocalInputValue(value);
}

export function localDateTimeToIso(value: string | null | undefined): string | null {
  return localInputValueToUtc(value);
}

export function dateInputToIso(value: string | null | undefined): string | null {
  return dateInputToUtcIso(value);
}

export function cleanObject<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== "" && value !== null && value !== undefined) {
      result[key] = value;
    }
  }
  return result as Partial<T>;
}
