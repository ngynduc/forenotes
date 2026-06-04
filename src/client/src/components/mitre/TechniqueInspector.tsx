import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/Sheet";
import { Badge } from "@/components/ui/Badge";
import type { MitreTechnique } from "@shared/graph-types";

interface TechniqueInspectorProps {
  technique: MitreTechnique;
  onClose: () => void;
}

export function TechniqueInspector({ technique, onClose }: TechniqueInspectorProps) {
  return (
    <Sheet open={true} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{technique.mitreId}: {technique.name}</SheetTitle>
          <SheetDescription>MITRE ATT&CK Technique</SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-[var(--color-text-muted)]">Evidence Count</h4>
            <div className="mt-1 flex flex-wrap gap-1">
              {technique.counts.findings > 0 && <Badge variant="secondary">Findings: {technique.counts.findings}</Badge>}
              {technique.counts.timelineEvents > 0 && <Badge variant="secondary">Timeline: {technique.counts.timelineEvents}</Badge>}
              {technique.counts.queries > 0 && <Badge variant="secondary">Queries: {technique.counts.queries}</Badge>}
              {technique.counts.tasks > 0 && <Badge variant="secondary">Tasks: {technique.counts.tasks}</Badge>}
            </div>
          </div>

          {technique.evidence.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-[var(--color-text-muted)]">Linked Evidence</h4>
              <ul className="mt-1 space-y-1">
                {technique.evidence.map((ev) => (
                  <li key={ev.entityId} className="text-sm">
                    <Badge variant="outline" className="mr-1 text-[10px]">{ev.entityType}</Badge>
                    {ev.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
