import { useMemo, useState } from "react";
import { useGraph } from "@/hooks/use-graph";
import { useGraphStore } from "@/stores/graph-store";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { DEFAULT_ENTITY_ICON, ENTITY_ICON_MAP } from "./entityVisuals";

export function NodeInspector() {
  const [collapsed, setCollapsed] = useState(false);
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const setSelectedNode = useGraphStore((s) => s.setSelectedNode);
  const { data } = useGraph();

  const node = data?.nodes?.find((n) => n.id === selectedNodeId);
  const SelectedNodeIcon = node ? ENTITY_ICON_MAP[node.type] ?? DEFAULT_ENTITY_ICON : null;
  const linkedEntities = useMemo(() => {
    if (!data || !selectedNodeId) return [];

    return data.edges
      .filter((edge) => edge.source === selectedNodeId || edge.target === selectedNodeId)
      .map((edge) => {
        const linkedNodeId = edge.source === selectedNodeId ? edge.target : edge.source;
        const linkedNode = data.nodes.find((candidate) => candidate.id === linkedNodeId);

        if (!linkedNode) return null;

        return {
          edgeId: edge.id,
          edgeLabel: edge.label,
          edgeType: edge.type,
          derived: edge.derived,
          linkedNode,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  }, [data, selectedNodeId]);

  return (
    <aside
      className={cn(
        "flex h-[calc(100vh-200px)] shrink-0 flex-col rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] transition-[width] duration-200",
        collapsed ? "w-14" : "w-80"
      )}
    >
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-3">
        {!collapsed && (
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text)]">Inspect</h3>
            <p className="text-xs text-[var(--color-text-muted)]">
              {node ? "Selected node details" : "Select a node to inspect"}
            </p>
          </div>
        )}
        <div className={cn("flex items-center gap-1", collapsed && "w-full justify-center")}>
          {!collapsed && node && (
            <Button variant="ghost" size="icon" onClick={() => setSelectedNode(null)} aria-label="Clear selection">
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand inspector" : "Collapse inspector"}
          >
            {collapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto p-4">
          {node ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                {SelectedNodeIcon ? (
                  <div className="mt-0.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-2">
                    <SelectedNodeIcon className="h-5 w-5 text-[var(--color-text-muted)]" />
                  </div>
                ) : null}
                <div className="min-w-0">
                  <h4 className="text-base font-semibold">{node.label}</h4>
                  <p className="mt-1 text-sm capitalize text-[var(--color-text-muted)]">
                    {node.type.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
              {node.subtitle && <p className="text-sm text-[var(--color-text-muted)]">{node.subtitle}</p>}
              {node.status && (
                <div>
                  <span className="text-xs text-[var(--color-text-muted)]">Status</span>
                  <Badge variant="secondary" className="ml-2">{node.status}</Badge>
                </div>
              )}
              {node.severity && (
                <div>
                  <span className="text-xs text-[var(--color-text-muted)]">Severity</span>
                  <Badge variant="secondary" className="ml-2">{node.severity}</Badge>
                </div>
              )}
              {node.owner && (
                <div>
                  <span className="text-xs text-[var(--color-text-muted)]">Owner</span>
                  <span className="ml-2 text-sm">{node.owner}</span>
                </div>
              )}
              {node.mitreId && (
                <div>
                  <span className="text-xs text-[var(--color-text-muted)]">MITRE ID</span>
                  <span className="ml-2 text-sm">{node.mitreId}</span>
                </div>
              )}
              {node.counts && (
                <div>
                  <span className="text-xs text-[var(--color-text-muted)]">Links</span>
                  <span className="ml-2 text-sm">{node.counts.linkedItems ?? 0} linked items</span>
                </div>
              )}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                    Linked Entities
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">{linkedEntities.length}</span>
                </div>
                {linkedEntities.length ? (
                  <div className="space-y-2">
                    {linkedEntities.map(({ edgeId, edgeLabel, edgeType, derived, linkedNode }) => {
                      const LinkedNodeIcon = ENTITY_ICON_MAP[linkedNode.type] ?? DEFAULT_ENTITY_ICON;

                      return (
                        <button
                          key={edgeId}
                          type="button"
                          onClick={() => setSelectedNode(linkedNode.id)}
                          className="flex w-full items-start justify-between rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-left transition-colors hover:bg-[var(--color-surface-subtle)]"
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2">
                              <LinkedNodeIcon className="h-4 w-4 text-[var(--color-text-muted)]" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-[var(--color-text)]">{linkedNode.label}</p>
                              <p className="mt-0.5 text-xs capitalize text-[var(--color-text-muted)]">
                                {linkedNode.type.replace(/_/g, " ")}
                              </p>
                              {linkedNode.subtitle && (
                                <p className="mt-1 truncate text-xs text-[var(--color-text-muted)]">{linkedNode.subtitle}</p>
                              )}
                            </div>
                          </div>
                          <div className="ml-3 flex shrink-0 flex-col items-end gap-1">
                            {edgeLabel ? (
                              <Badge variant="secondary" className="max-w-[120px] truncate text-[10px]">
                                {edgeLabel}
                              </Badge>
                            ) : null}
                            <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                              {derived ? "Derived" : edgeType}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-[var(--radius-sm)] border border-dashed border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-text-muted)]">
                    No linked entities for this node in the current graph view.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-[var(--radius-sm)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-sm text-[var(--color-text-muted)]">
              Click a node to inspect it here. The graph stays interactive while this panel remains docked.
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
