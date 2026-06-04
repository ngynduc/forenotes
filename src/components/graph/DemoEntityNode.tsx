import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  Briefcase,
  AlertTriangle,
  Search,
  Clock,
  CheckSquare,
  Network,
  Monitor,
  User,
  Shield,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  case: Briefcase,
  incident: AlertTriangle,
  finding: Search,
  timeline_event: Clock,
  task: CheckSquare,
  indicator: Network,
  system: Monitor,
  account: User,
  mitre_technique: Shield,
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#f87171",
  high: "#fb923c",
  medium: "#fbbf24",
  low: "#2dd4bf",
};

interface DemoNodeData {
  label: string;
  subtitle?: string;
  entityType: string;
  severity?: string;
  status?: string;
  isSelected?: boolean;
  isConnected?: boolean;
  isDimmed?: boolean;
}

export function DemoEntityNode({ data, selected }: NodeProps) {
  const d = data as unknown as DemoNodeData;
  const Icon = ICON_MAP[d.entityType] ?? Network;
  const severityBorder = d.severity ? SEVERITY_COLORS[d.severity] : undefined;
  const isSelected = selected || d.isSelected;
  const isConnected = Boolean(d.isConnected);
  const isDimmed = Boolean(d.isDimmed);

  return (
    <div
      style={{
        opacity: isDimmed ? 0.2 : 1,
        borderColor: severityBorder ?? "rgba(255,255,255,0.1)",
        boxShadow: isSelected
          ? "0 0 0 2px rgba(45,212,191,0.6), 0 0 24px rgba(45,212,191,0.2)"
          : isConnected
            ? "0 0 0 1.5px rgba(45,212,191,0.4), 0 0 16px rgba(45,212,191,0.1)"
            : undefined,
        cursor: "pointer",
        transition: "opacity 400ms ease, box-shadow 400ms ease, border-color 400ms ease",
      }}
      className="relative min-w-[132px] rounded-[10px] border bg-[rgba(255,255,255,0.05)] px-2.5 py-2 backdrop-blur-sm sm:min-w-[180px] sm:px-3 sm:py-2.5"
    >
      <Handle type="target" position={Position.Top} className="!h-0 !w-0 !border-0 !bg-transparent" />
      <Handle type="source" position={Position.Bottom} className="!h-0 !w-0 !border-0 !bg-transparent" />
      <div className="flex items-center gap-2.5">
        <Icon className="h-4 w-4 shrink-0 text-[#2dd4bf]" />
        <span className="truncate text-[11px] font-semibold text-[#e8efec] sm:text-[13px]">{d.label}</span>
      </div>
      {d.subtitle && (
        <p className="mt-1 truncate pl-[26px] text-[9px] text-[#8fa9a1] sm:text-[10px]">{d.subtitle}</p>
      )}
      {(d.status || d.severity) && (
        <div className="mt-1.5 flex items-center gap-1.5 pl-[26px]">
          {d.severity && (
            <span
              className="rounded-[4px] px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide sm:px-2 sm:text-[9px]"
              style={{
                color: SEVERITY_COLORS[d.severity] ?? "#2dd4bf",
                background: d.severity === "critical" ? "rgba(248,113,113,0.12)"
                  : d.severity === "high" ? "rgba(251,146,60,0.12)"
                  : d.severity === "medium" ? "rgba(251,191,36,0.12)"
                  : "rgba(45,212,191,0.12)",
              }}
            >
              {d.severity}
            </span>
          )}
          {d.status && (
            <span className="rounded-[4px] bg-[rgba(45,212,191,0.1)] px-1.5 py-0.5 text-[8px] font-semibold text-[#2dd4bf] sm:px-2 sm:text-[9px]">
              {d.status}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
