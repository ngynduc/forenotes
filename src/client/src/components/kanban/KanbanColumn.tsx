import { useState } from "react";
import { KanbanCard } from "./KanbanCard";
import type { TaskItem } from "@/lib/api";
import { cn } from "@/lib/utils";

const STATUS_ACCENT: Record<string, string> = {
  todo: "bg-[var(--color-status-todo)]",
  open: "bg-[var(--color-status-open)]",
  in_progress: "bg-[var(--color-status-progress)]",
  blocked: "bg-[var(--color-status-blocked)]",
  confirmed: "bg-[var(--color-status-confirmed)]",
  done: "bg-[var(--color-status-done)]",
  false_positive: "bg-[var(--color-status-false-positive)]",
};

const STATUS_DOT: Record<string, string> = {
  todo: "bg-[var(--color-status-todo)]",
  open: "bg-[var(--color-status-open)]",
  in_progress: "bg-[var(--color-status-progress)]",
  blocked: "bg-[var(--color-status-blocked)]",
  confirmed: "bg-[var(--color-status-confirmed)]",
  done: "bg-[var(--color-status-done)]",
  false_positive: "bg-[var(--color-status-false-positive)]",
};

interface KanbanColumnProps {
  label: string;
  status: string;
  tasks: TaskItem[];
  memberNames: Record<string, string>;
  onTaskClick: (task: TaskItem) => void;
  onOpenNotes: (task: TaskItem) => void;
  onStatusChange: (taskId: string, newStatus: string) => void;
}

export function KanbanColumn({ label, status, tasks, memberNames, onTaskClick, onOpenNotes, onStatusChange }: KanbanColumnProps) {
  const [dragOver, setDragOver] = useState(false);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) {
      onStatusChange(taskId, status);
    }
  }

  return (
    <div
      className={cn(
        "flex min-w-[250px] flex-col overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)]",
        dragOver && "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={cn("h-1", STATUS_ACCENT[status] ?? "bg-[var(--color-text-soft)]")} />
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-2">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", STATUS_DOT[status] ?? "bg-[var(--color-text-soft)]")} />
          <h3 className="text-sm font-semibold">{label}</h3>
        </div>
        <span className="rounded-full bg-[var(--color-surface-subtle)] px-2 py-0.5 text-xs">{tasks.length}</span>
      </div>
      <div className="flex flex-col gap-2 p-2">
        {tasks.map((task) => (
          <KanbanCard
            key={task.id}
            task={task}
            memberNames={memberNames}
            onClick={() => onTaskClick(task)}
            onOpenNotes={() => onOpenNotes(task)}
          />
        ))}
        {tasks.length === 0 && (
          <p className="py-4 text-center text-xs text-[var(--color-text-soft)]">No tasks</p>
        )}
      </div>
    </div>
  );
}
