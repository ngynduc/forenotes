import { useRef, useState } from "react";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { Button } from "@/components/ui/Button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface UploadedImage {
  url: string;
  filename?: string;
}

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onUploadImage: (file: File) => Promise<UploadedImage>;
}

export function MarkdownEditor({ value, onChange, onUploadImage }: MarkdownEditorProps) {
  const cmRef = useRef<ReactCodeMirrorRef>(null);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handlePaste(event: React.ClipboardEvent) {
    const files = Array.from(event.clipboardData.files);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      return;
    }

    event.preventDefault();
    setPasteError(null);
    setUploading(true);

    const view = cmRef.current?.view;
    const originalValue = value;
    let nextValue = originalValue;
    let cursor = view ? view.state.selection.main.head : originalValue.length;
    const selectionEnd = view ? view.state.selection.main.to : cursor;
    let selectionRemoved = false;

    try {
      for (const imageFile of imageFiles) {
        const uploaded = await onUploadImage(imageFile);
        if (!selectionRemoved) {
          nextValue = originalValue.slice(0, cursor) + originalValue.slice(selectionEnd);
          selectionRemoved = true;
        }
        const altText = imageFile.name || uploaded.filename || "image";
        const insertion = withBlockSpacing(nextValue, cursor, `![${escapeAltText(altText)}](${uploaded.url})`);
        nextValue = nextValue.slice(0, cursor) + insertion + nextValue.slice(cursor);
        cursor += insertion.length;
        onChange(nextValue);
      }

      requestAnimationFrame(() => {
        const v = cmRef.current?.view;
        if (v) {
          v.dispatch({
            selection: { anchor: cursor },
          });
          v.focus();
        }
      });
    } catch {
      setPasteError("Image paste failed. Please try uploading the image manually.");
      if (selectionRemoved) {
        onChange(nextValue);
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex rounded-[var(--radius-sm)] border border-[var(--color-border)]">
          <button
            type="button"
            className={`px-3 py-1 text-sm ${mode === "edit" ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]" : ""}`}
            onClick={() => setMode("edit")}
          >
            Edit
          </button>
          <button
            type="button"
            className={`px-3 py-1 text-sm ${mode === "preview" ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]" : ""}`}
            onClick={() => setMode("preview")}
          >
            Preview
          </button>
        </div>
        {uploading && <span className="text-xs text-[var(--color-text-muted)]">Uploading pasted image...</span>}
      </div>

      {pasteError && (
        <div className="rounded bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {pasteError}
        </div>
      )}

      {mode === "edit" ? (
        <div className="cm-editor-wrapper" onPaste={handlePaste}>
          <CodeMirror
            ref={cmRef}
            value={value}
            onChange={onChange}
            extensions={[markdown({ base: markdownLanguage })]}
            height="420px"
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              highlightActiveLine: true,
              bracketMatching: true,
            }}
            className="cm-markdown-editor"
          />
        </div>
      ) : (
        <div className="markdown-preview min-h-[420px] overflow-auto rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm leading-6">
          {value.trim() ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              urlTransform={safeMarkdownUrl}
              components={{
                img: ({ src, alt, ...props }) => (
                  <img
                    {...props}
                    src={src}
                    alt={alt || "image"}
                    className="my-2 h-auto max-w-full rounded-[var(--radius-sm)] border border-[var(--color-border)]"
                  />
                ),
                a: ({ href, children, ...props }) => (
                  <a {...props} href={href} className="text-[var(--color-primary)] underline" target="_blank" rel="noreferrer">
                    {children}
                  </a>
                ),
              }}
            >
              {value}
            </ReactMarkdown>
          ) : (
            <p className="text-[var(--color-text-muted)]">Nothing to preview yet.</p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
        <span>Images paste as Markdown and are uploaded to task note storage.</span>
        <Button type="button" variant="ghost" size="sm" onClick={() => setMode(mode === "edit" ? "preview" : "edit")}>
          Switch to {mode === "edit" ? "preview" : "edit"}
        </Button>
      </div>
    </div>
  );
}

function withBlockSpacing(currentValue: string, cursor: number, text: string) {
  const before = currentValue.slice(0, cursor);
  const after = currentValue.slice(cursor);
  const prefix = before.length === 0 || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
  const suffix = after.length === 0 || after.startsWith("\n\n") ? "\n\n" : after.startsWith("\n") ? "\n" : "\n\n";
  return `${prefix}${text}${suffix}`;
}

function escapeAltText(value: string) {
  return value.replace(/[[\]\\]/g, "").trim() || "image";
}

function safeMarkdownUrl(uri: string) {
  if (uri.startsWith("/uploads/")) {
    return `/api${uri}`;
  }
  if (uri.startsWith("/") || uri.startsWith("http://") || uri.startsWith("https://")) {
    return uri;
  }
  return "";
}
