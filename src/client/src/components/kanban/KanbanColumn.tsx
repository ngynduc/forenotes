import { useState } from "react";
import { KanbanCard } from "./KanbanCard";
import type { TaskItem } from "@/lib/api";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  label: string;
  status: string;
  tasks: TaskItem[];
  memberNames: Record<string, string>;
  onTaskClick: (task: TaskItem) => void;
  onStatusChange: (taskId: string, newStatus: string) => void;
}

export function KanbanColumn({ label, status, tasks, memberNames, onTaskClick, onStatusChange }: KanbanColumnProps) {
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
        "flex min-w-[250px] flex-col rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)]",
        dragOver && "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-2">
        <h3 className="text-sm font-semibold">{label}</h3>
        <span className="rounded-full bg-[var(--color-surface-subtle)] px-2 py-0.5 text-xs">{tasks.length}</span>
      </div>
      <div className="flex flex-col gap-2 p-2">
        {tasks.map((task) => (
          <KanbanCard key={task.id} task={task} memberNames={memberNames} onClick={() => onTaskClick(task)} />
        ))}
        {tasks.length === 0 && (
          <p className="py-4 text-center text-xs text-[var(--color-text-soft)]">No tasks</p>
        )}
      </div>
    </div>
  );
}
