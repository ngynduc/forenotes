import { Badge } from "@/components/ui/Badge";
import { formatDate, formatDateTime } from "@/lib/utils";
import { formatUtcTimestampForTitle } from "@/lib/timezone";
import type { TaskItem } from "@/lib/api";
import { cn } from "@/lib/utils";

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-[var(--color-danger)]",
  high: "bg-orange-500",
  medium: "bg-[var(--color-warning)]",
  low: "bg-[var(--color-primary)]",
};

const PRIORITY_BADGES: Record<string, "default" | "warning" | "danger" | "secondary"> = {
  critical: "danger",
  high: "warning",
  medium: "secondary",
  low: "default",
};

interface KanbanCardProps {
  task: TaskItem;
  memberNames: Record<string, string>;
  onClick: () => void;
  onOpenNotes: () => void;
}

function getMemberName(memberNames: Record<string, string>, userId?: string) {
  if (!userId) return null;
  return memberNames[userId] ?? "Unknown member";
}

function compactDescription(description?: string) {
  if (!description) return null;
  return description.length > 140 ? `${description.slice(0, 140)}...` : description;
}

export function KanbanCard({ task, memberNames, onClick, onOpenNotes }: KanbanCardProps) {
  const assigneeName = getMemberName(memberNames, task.assigneeUserId);
  const ownerName = getMemberName(memberNames, task.ownerUserId);
  const dueAt = task.dueAt;
  const updatedAt = task.updatedAt;
  const description = compactDescription(task.description);

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData("text/plain", task.id);
    e.dataTransfer.effectAllowed = "move";
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      className="cursor-pointer rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <span className="text-sm font-medium leading-tight">{task.title}</span>
        <span className={cn("h-2 w-2 shrink-0 rounded-full", PRIORITY_COLORS[task.priority] ?? "bg-gray-400")} />
      </div>

      {description && (
        <p className="mb-3 text-xs leading-5 text-[var(--color-text-muted)]">{description}</p>
      )}

      <div className="mb-3 flex flex-wrap gap-2">
        <Badge variant={PRIORITY_BADGES[task.priority] ?? "secondary"}>{task.priority.replace("_", " ")}</Badge>
        {dueAt && <Badge variant="outline">Due {formatDate(dueAt)}</Badge>}
      </div>

      <div className="space-y-1 text-xs text-[var(--color-text-muted)]">
        {assigneeName && (
          <div>
            <span className="font-medium text-[var(--color-text)]">Assignee:</span> {assigneeName}
          </div>
        )}
        {ownerName && (
          <div>
            <span className="font-medium text-[var(--color-text)]">Owner:</span> {ownerName}
          </div>
        )}
        {updatedAt && (
          <div>
            <span className="font-medium text-[var(--color-text)]">Updated:</span>{" "}
            <span title={formatUtcTimestampForTitle(updatedAt)}>{formatDateTime(updatedAt)}</span>
          </div>
        )}
      </div>

      <button
        type="button"
        className="mt-3 rounded border border-[var(--color-border)] px-2 py-1 text-xs font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]"
        onClick={(event) => {
          event.stopPropagation();
          onOpenNotes();
        }}
      >
        Open Notes
      </button>
    </div>
  );
}
