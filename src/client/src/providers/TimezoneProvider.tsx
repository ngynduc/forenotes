import { createContext, useContext, useEffect, useState } from "react";
import {
  DEFAULT_TIMEZONE,
  getTimezoneOptions,
  normalizeTimezone,
  readStoredTimezone,
  setCurrentTimezone,
  writeStoredTimezone,
} from "@/lib/timezone";

interface TimezoneContextValue {
  timezone: string;
  setTimezone: (timezone: string) => void;
  options: string[];
}

const TimezoneContext = createContext<TimezoneContextValue | null>(null);

export function TimezoneProvider({ children }: { children: React.ReactNode }) {
  const [timezone, setTimezoneState] = useState(() => {
    const initialTimezone = readStoredTimezone();
    setCurrentTimezone(initialTimezone);
    return initialTimezone;
  });

  useEffect(() => {
    setCurrentTimezone(timezone);
    writeStoredTimezone(timezone);
  }, [timezone]);

  const value: TimezoneContextValue = {
    timezone,
    setTimezone: (nextTimezone) => setTimezoneState(normalizeTimezone(nextTimezone)),
    options: getTimezoneOptions(),
  };

  return <TimezoneContext.Provider value={value}>{children}</TimezoneContext.Provider>;
}

export function useTimezone() {
  const value = useContext(TimezoneContext);
  if (!value) {
    throw new Error("useTimezone must be used within TimezoneProvider");
  }

  return value;
}

export function useTimezoneLabel() {
  return useTimezone().timezone || DEFAULT_TIMEZONE;
}
