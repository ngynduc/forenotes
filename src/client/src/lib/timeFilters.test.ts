import { afterEach, describe, expect, it, vi } from "vitest";
import { createTimeFilterState, normalizeTimeFilterState, toTimeFilterRequest } from "./timeFilters";

describe("toTimeFilterRequest", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null for all time", () => {
    const filter = createTimeFilterState("eventTime", "UTC");

    expect(toTimeFilterRequest(filter)).toBeNull();
  });

  it("serializes preset expressions as UTC ISO bounds", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-25T12:00:00.000Z"));

    const filter = normalizeTimeFilterState({
      ...createTimeFilterState("eventTime", "UTC"),
      preset: "last_24_hours",
    });

    expect(toTimeFilterRequest(filter)).toEqual({
      field: "eventTime",
      start: "2026-05-24T12:00:00.000Z",
      end: "2026-05-25T12:00:00.000Z",
    });
  });

  it("serializes relative day expressions as full UTC ISO day bounds", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-25T12:00:42.321Z"));

    const filter = normalizeTimeFilterState({
      ...createTimeFilterState("updatedAt", "UTC"),
      mode: "relative",
      activeSection: "relative",
      relativeValue: "2",
      relativeUnit: "days",
    });

    expect(toTimeFilterRequest(filter)).toEqual({
      field: "updatedAt",
      start: "2026-05-23T00:00:00.000Z",
      end: "2026-05-25T23:59:59.999Z",
    });
  });

  it("serializes relative day expressions using the selected timezone day bounds", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-26T10:30:42.321Z"));

    const filter = normalizeTimeFilterState({
      ...createTimeFilterState("eventTime", "Asia/Ho_Chi_Minh"),
      mode: "relative",
      activeSection: "relative",
      relativeValue: "4",
      relativeUnit: "days",
    });

    expect(toTimeFilterRequest(filter)).toEqual({
      field: "eventTime",
      start: "2026-05-21T17:00:00.000Z",
      end: "2026-05-26T16:59:59.999Z",
    });
  });

  it("keeps request bounds stable across rerenders in the same minute", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-25T12:00:05.000Z"));

    const filter = normalizeTimeFilterState({
      ...createTimeFilterState("updatedAt", "UTC"),
      mode: "relative",
      activeSection: "relative",
      relativeValue: "24",
      relativeUnit: "hours",
    });
    const firstRequest = toTimeFilterRequest(filter);

    vi.setSystemTime(new Date("2026-05-25T12:00:55.999Z"));

    expect(toTimeFilterRequest(filter)).toEqual(firstRequest);
  });

  it("serializes advanced expressions as UTC ISO bounds", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-25T12:00:42.321Z"));

    const filter = normalizeTimeFilterState({
      ...createTimeFilterState("createdAt", "UTC"),
      mode: "advanced",
      activeSection: "advanced",
      advancedEarliest: "-7d@d",
      advancedLatest: "now",
    });

    expect(toTimeFilterRequest(filter)).toEqual({
      field: "createdAt",
      start: "2026-05-18T00:00:00.000Z",
      end: "2026-05-25T12:00:00.000Z",
    });
  });

  it("serializes after operators without leaking now", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-25T12:00:42.321Z"));

    const filter = normalizeTimeFilterState({
      ...createTimeFilterState("eventTime", "Asia/Ho_Chi_Minh"),
      mode: "datetime",
      activeSection: "datetime",
      operator: "after",
      startDate: "2026-05-25",
      startTime: "09:30",
    });

    expect(toTimeFilterRequest(filter)).toEqual({
      field: "eventTime",
      start: "2026-05-25T02:30:00.000Z",
      end: "2026-05-25T12:00:00.000Z",
    });
  });
});
