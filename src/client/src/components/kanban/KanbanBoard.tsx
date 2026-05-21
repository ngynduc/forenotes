import { TASK_BOARD_COLUMNS } from "@/config/entity-definitions";
import { KanbanColumn } from "./KanbanColumn";
import type { TaskItem } from "@/lib/api";

interface KanbanBoardProps {
  tasks: TaskItem[];
  memberNames: Record<string, string>;
  onTaskClick: (task: TaskItem) => void;
  onOpenNotes: (task: TaskItem) => void;
  onStatusChange: (taskId: string, newStatus: string) => void;
}

export function KanbanBoard({ tasks, memberNames, onTaskClick, onOpenNotes, onStatusChange }: KanbanBoardProps) {
  const columns = TASK_BOARD_COLUMNS;

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.value);
        return (
          <KanbanColumn
            key={col.value}
            label={col.label}
            status={col.value}
            tasks={colTasks}
            memberNames={memberNames}
            onTaskClick={onTaskClick}
            onOpenNotes={onOpenNotes}
            onStatusChange={onStatusChange}
          />
        );
      })}
    </div>
  );
}
