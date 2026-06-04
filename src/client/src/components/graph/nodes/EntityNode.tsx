import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Badge } from "@/components/ui/Badge";
import type { GraphNode } from "@shared/graph-types";
import { cn } from "@/lib/utils";
import { DEFAULT_ENTITY_ICON, ENTITY_ICON_MAP } from "../entityVisuals";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "border-[var(--color-danger)]",
  high: "border-orange-500",
  medium: "border-[var(--color-warning)]",
  low: "border-[var(--color-primary)]",
};

export function EntityNode({ data, selected }: NodeProps) {
  const node = data as unknown as GraphNode & {
    label: string;
    isSelected?: boolean;
    isConnected?: boolean;
    isDimmed?: boolean;
  };
  const Icon = ENTITY_ICON_MAP[node.type] ?? DEFAULT_ENTITY_ICON;
  const severityClass = node.severity ? SEVERITY_COLORS[node.severity] ?? "" : "";
  const isSelected = selected || node.isSelected;
  const isConnected = Boolean(node.isConnected);
  const isDimmed = Boolean(node.isDimmed);

  return (
    <div
      className={cn(
        "w-full min-w-0 rounded-[var(--radius-sm)] border-2 bg-[var(--color-surface)] p-2.5 shadow-sm transition-[opacity,box-shadow,border-color,transform] duration-150",
        severityClass || "border-[var(--color-border)]",
        isSelected && "ring-2 ring-[var(--color-primary)] shadow-md",
        !isSelected && isConnected && "border-[var(--color-primary)] shadow-md",
        isDimmed && "opacity-40"
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-[var(--color-primary)]" />
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
        <span className="min-w-0 text-xs font-semibold leading-snug [overflow-wrap:anywhere]">{node.label}</span>
      </div>
      {node.subtitle && (
        <p className="mt-1 pl-6 text-[10px] leading-snug text-[var(--color-text-muted)] [overflow-wrap:anywhere]">
          {node.subtitle}
        </p>
      )}
      {node.status && (
        <Badge variant="secondary" className="mt-1 text-[10px]">
          {node.status}
        </Badge>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-[var(--color-primary)]" />
    </div>
  );
}
