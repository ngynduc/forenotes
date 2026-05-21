import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { DataTable } from "@/components/data-table/DataTable";
import { EntityModal } from "@/components/entity-modal/EntityModal";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { TaskNotesDialog } from "@/components/notes/TaskNotesDialog";
import { Button } from "@/components/ui/Button";
import type { TaskItem } from "@/lib/api";
import { useTasks, useUpdateTask } from "@/hooks/use-tasks";
import { useIncidentMembers } from "@/hooks/use-incidents";
import { useScopeStore } from "@/stores/scope-store";
import { useUIStore } from "@/stores/ui-store";
import { TABLE_DEFINITIONS } from "@/config/table-definitions";
import { getEntityDefinitions } from "@/config/entity-definitions";
import { buildMemberNameMap, withMemberDisplayNames } from "@/lib/memberDisplay";

const tableDef = TABLE_DEFINITIONS.tasks;

export default function TasksPage() {
  const incidentId = useScopeStore((s) => s.selectedIncidentId);
  const taskView = useUIStore((s) => s.taskView);
  const setTaskView = useUIStore((s) => s.setTaskView);
  const { data, isLoading } = useTasks();
  const { data: membersData } = useIncidentMembers(incidentId);
  const updateTask = useUpdateTask();
  const [searchParams, setSearchParams] = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null);
  const definitions = getEntityDefinitions(() => useScopeStore.getState());
  const memberNames = buildMemberNameMap(membersData?.members);
  const tasks = withMemberDisplayNames(data?.tasks ?? [], memberNames);
  const itemId = searchParams.get("itemId");
  const openedItemIdRef = useRef<string | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesTask, setNotesTask] = useState<TaskItem | null>(null);

  useEffect(() => {
    if (!itemId) {
      openedItemIdRef.current = null;
      return;
    }
    if (isLoading || openedItemIdRef.current === itemId) {
      return;
    }

    const item = tasks.find((row) => String(row.id ?? "") === itemId);
    if (!item) {
      return;
    }

    openedItemIdRef.current = itemId;
    setEditItem(item as unknown as Record<string, unknown>);
    setModalOpen(true);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("itemId");
    setSearchParams(nextParams, { replace: true });
  }, [isLoading, itemId, searchParams, setSearchParams, tasks]);

  if (!incidentId) {
    return <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">Select an incident to view tasks.</p>;
  }

  function handleStatusChange(taskId: string, newStatus: string) {
    updateTask.mutate({ taskId, data: { status: newStatus } });
  }

  function handleOpenNotes(task: TaskItem) {
    setNotesTask(task);
    setNotesOpen(true);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Tasks</h2>
          <p className="text-sm text-[var(--color-text-muted)]">Manage and track incident tasks.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-[var(--radius-sm)] border border-[var(--color-border)]">
            <button
              className={`px-3 py-1 text-sm ${taskView === "board" ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]" : ""}`}
              onClick={() => setTaskView("board")}
            >
              Board
            </button>
            <button
              className={`px-3 py-1 text-sm ${taskView === "table" ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]" : ""}`}
              onClick={() => setTaskView("table")}
            >
              Table
            </button>
          </div>
          <Button onClick={() => { setEditItem(null); setModalOpen(true); }}>
            Create Task
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading...</p>
      ) : taskView === "board" ? (
        <KanbanBoard
          tasks={tasks}
          memberNames={memberNames}
          onTaskClick={(task) => { setEditItem(task as unknown as Record<string, unknown>); setModalOpen(true); }}
          onOpenNotes={handleOpenNotes}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <DataTable
          columns={tableDef.columns}
          data={tasks as unknown as Record<string, unknown>[]}
          emptyLabel={tableDef.emptyLabel}
          onRowClick={(row) => { setEditItem(row); setModalOpen(true); }}
          renderRowActions={(row) => (
            <Button type="button" variant="outline" size="sm" onClick={() => handleOpenNotes(row as unknown as TaskItem)}>
              Notes
            </Button>
          )}
        />
      )}

      <EntityModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        definition={definitions.task}
        item={editItem}
        mode={editItem ? "edit" : "create"}
      />
      <TaskNotesDialog
        open={notesOpen}
        onOpenChange={setNotesOpen}
        incidentId={incidentId}
        task={notesTask}
      />
    </div>
  );
}
