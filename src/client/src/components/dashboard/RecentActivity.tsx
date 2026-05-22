import { useNavigate } from "react-router";
import { formatDateTime } from "@/lib/utils";
import { formatUtcTimestampForTitle } from "@/lib/timezone";
import { useScopeStore } from "@/stores/scope-store";
import type { DashboardRecentActivity } from "@shared/graph-types";

interface RecentActivityProps {
  items: DashboardRecentActivity[];
}

const KIND_STYLES: Record<string, string> = {
  case: "bg-[#e0f2fe] text-[#075985]",
  incident: "bg-[#ccfbf1] text-[#115e59]",
  finding: "bg-[#fef3c7] text-[#92400e]",
  task: "bg-[#ede9fe] text-[#5b21b6]",
  timeline: "bg-[#fee2e2] text-[#991b1b]",
};

export function RecentActivity({ items }: RecentActivityProps) {
  const navigate = useNavigate();
  const selectCase = useScopeStore((s) => s.selectCase);
  const selectIncident = useScopeStore((s) => s.selectIncident);

  if (!items.length) return null;

  function openActivityItem(item: DashboardRecentActivity) {
    if (item.caseId) {
      selectCase(item.caseId);
    }
    if (item.incidentId) {
      selectIncident(item.incidentId);
    }

    switch (item.kind) {
      case "case":
        navigate(`/cases?caseId=${encodeURIComponent(item.id)}`);
        return;
      case "incident":
        navigate(`/cases?incidentId=${encodeURIComponent(item.id)}`);
        return;
      case "finding":
        navigate(`/findings?itemId=${encodeURIComponent(item.id)}`);
        return;
      case "task":
        navigate(`/tasks?itemId=${encodeURIComponent(item.id)}`);
        return;
      case "timeline":
        navigate(`/timeline?itemId=${encodeURIComponent(item.id)}`);
        return;
      default:
        navigate("/");
    }
  }

  return (
    <div className="relative rounded-[20px] border border-[#dfe5e1] bg-white p-5 shadow-[0_14px_34px_rgba(25,38,34,0.07)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#132927]">Recent Activity</h3>
        <span className="font-mono text-xs font-semibold text-[#52615d]">{items.length} events</span>
      </div>
      <ul className="space-y-2">
        {items.slice(0, 10).map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className="flex w-full items-start gap-3 rounded-[14px] px-3 py-2 text-left transition-[background-color,transform] duration-150 hover:-translate-y-0.5 hover:bg-[#f1f6f3] active:scale-[0.96]"
              onClick={() => openActivityItem(item)}
            >
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${KIND_STYLES[item.kind] ?? "bg-[#e2e8f0] text-[#334155]"}`}>
                {item.kind}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#132927]">{item.title}</p>
                <p className="truncate text-xs text-[#66746f]">{item.detail}</p>
              </div>
              <span
                className="shrink-0 font-mono text-xs text-[#8a7a61]"
                title={formatUtcTimestampForTitle(item.timestamp)}
              >
                {item.timestamp ? formatDateTime(item.timestamp) : ""}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
