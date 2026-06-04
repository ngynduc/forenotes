import type { DashboardRecentActivity } from "@shared/graph-types";
import { useTimezone } from "@/providers/TimezoneProvider";
import { RecentActivityPanel } from "./RecentActivityPanel";

interface RecentActivityProps {
  items: DashboardRecentActivity[];
}

export function RecentActivity({ items }: RecentActivityProps) {
  const { timezone } = useTimezone();
  return <RecentActivityPanel items={items} timezone={timezone} />;
}
