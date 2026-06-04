import { afterEach, describe, expect, it, vi } from "vitest";
import { formatDateTimeForTimezone, formatDueStatus, formatRelativeTime } from "./timezone";

describe("timezone dashboard helpers", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("formats the same UTC timestamp in the selected timezone", () => {
    const timestamp = "2026-05-31T07:42:00.000Z";

    expect(formatDateTimeForTimezone(timestamp, "UTC")).toContain("07:42");
    expect(formatDateTimeForTimezone(timestamp, "Asia/Ho_Chi_Minh")).toContain("14:42");
  });

  it("formats compact relative time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-31T08:00:00.000Z"));

    expect(formatRelativeTime("2026-05-31T07:52:00.000Z")).toBe("8m ago");
    expect(formatRelativeTime("2026-05-31T10:00:00.000Z")).toBe("in 2h");
  });

  it("classifies due status against the selected timezone clock", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-31T00:00:00.000Z"));

    expect(formatDueStatus("2026-05-30T23:00:00.000Z", "UTC")).toEqual({ status: "overdue", label: "Overdue" });
    expect(formatDueStatus("2026-05-31T12:00:00.000Z", "UTC")).toEqual({ status: "due_soon", label: "Due next 24h" });
    expect(formatDueStatus("2026-06-02T00:00:00.000Z", "UTC")).toEqual({ status: "due_soon", label: "Due next 72h" });
    expect(formatDueStatus("2026-06-05T00:00:00.000Z", "UTC")).toEqual({ status: "upcoming", label: "Upcoming" });
  });
});
