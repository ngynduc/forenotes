import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { MarkdownEditor } from "@/components/notes/MarkdownEditor";
import { api, type TaskItem } from "@/lib/api";
import { useUIStore } from "@/stores/ui-store";

interface TaskNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incidentId: string;
  task: TaskItem | null;
}

export function TaskNotesDialog({ open, onOpenChange, incidentId, task }: TaskNotesDialogProps) {
  const [content, setContent] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setFlash = useUIStore((state) => state.setFlash);
  const dirty = content !== savedContent;

  useEffect(() => {
    if (!open || !task) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .getTaskNote(incidentId, task.id)
      .then((note) => {
        if (cancelled) {
          return;
        }
        setContent(note.content);
        setSavedContent(note.content);
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Unable to load task note.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [incidentId, open, task]);

  async function handleSave() {
    if (!task) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const note = await api.updateTaskNote(incidentId, task.id, content);
      setContent(note.content);
      setSavedContent(note.content);
      setFlash({ kind: "success", message: "Task note saved." });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save task note.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadImage(file: File) {
    if (!task) {
      throw new Error("Task is required for note image uploads.");
    }
    return api.uploadTaskNoteImage(incidentId, task.id, file);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-auto">
        <DialogHeader>
          <DialogTitle>{task ? `Notes: ${task.title}` : "Task Notes"}</DialogTitle>
          <DialogDescription>
            File-backed Markdown notes for the selected task. Paste images directly into the editor to upload them.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        )}

        {loading ? (
          <p className="py-12 text-center text-sm text-[var(--color-text-muted)]">Loading note...</p>
        ) : (
          <MarkdownEditor value={content} onChange={setContent} onUploadImage={handleUploadImage} />
        )}

        <DialogFooter className="items-center">
          <span className="text-xs text-[var(--color-text-muted)]">{dirty ? "Unsaved changes" : "Saved"}</span>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button type="button" onClick={handleSave} disabled={!dirty || saving || loading}>
            {saving ? "Saving..." : "Save Note"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
