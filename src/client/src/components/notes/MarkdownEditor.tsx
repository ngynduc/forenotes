import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handlePaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
    const files = Array.from(event.clipboardData.files);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      return;
    }

    event.preventDefault();
    setPasteError(null);
    setUploading(true);

    const textarea = textareaRef.current;
    const originalValue = value;
    let nextValue = originalValue;
    const selectionStart = textarea?.selectionStart ?? originalValue.length;
    let cursor = selectionStart;
    const selectionEnd = textarea?.selectionEnd ?? cursor;
    let selectionRemoved = false;

    try {
      for (const imageFile of imageFiles) {
        const uploaded = await onUploadImage(imageFile);
        if (!selectionRemoved) {
          nextValue = originalValue.slice(0, selectionStart) + originalValue.slice(selectionEnd);
          selectionRemoved = true;
        }
        const altText = imageFile.name || uploaded.filename || "image";
        const insertion = withBlockSpacing(nextValue, cursor, `![${escapeAltText(altText)}](${uploaded.url})`);
        nextValue = nextValue.slice(0, cursor) + insertion + nextValue.slice(cursor);
        cursor += insertion.length;
        onChange(nextValue);
      }

      requestAnimationFrame(() => {
        if (!textareaRef.current) {
          return;
        }
        textareaRef.current.focus();
        textareaRef.current.selectionStart = cursor;
        textareaRef.current.selectionEnd = cursor;
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
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onPaste={handlePaste}
          className="min-h-[420px] w-full resize-y rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-mono text-sm leading-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          placeholder="Write Markdown notes. Paste an image to upload and insert it here."
        />
      ) : (
        <div className="markdown-preview min-h-[420px] overflow-auto rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm leading-6">
          <MarkdownPreview value={value} />
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

function MarkdownPreview({ value }: { value: string }) {
  if (!value.trim()) {
    return <p className="text-[var(--color-text-muted)]">Nothing to preview yet.</p>;
  }

  return <div className="space-y-3">{renderMarkdown(value)}</div>;
}

function renderMarkdown(value: string) {
  const lines = value.split("\n");
  const nodes: React.ReactNode[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let codeLines: string[] = [];
  let inCodeBlock = false;

  function flushParagraph() {
    if (paragraph.length === 0) {
      return;
    }
    nodes.push(
      <p key={`p-${nodes.length}`} className="whitespace-pre-wrap">
        {renderInline(paragraph.join(" "))}
      </p>
    );
    paragraph = [];
  }

  function flushList() {
    if (listItems.length === 0) {
      return;
    }
    nodes.push(
      <ul key={`ul-${nodes.length}`} className="list-disc space-y-1 pl-5">
        {listItems.map((item, index) => (
          <li key={index}>{renderInline(item)}</li>
        ))}
      </ul>
    );
    listItems = [];
  }

  function flushCodeBlock() {
    if (codeLines.length === 0) {
      return;
    }
    nodes.push(
      <pre key={`code-${nodes.length}`} className="overflow-auto rounded bg-[var(--color-surface)] p-3 font-mono text-xs">
        <code>{codeLines.join("\n")}</code>
      </pre>
    );
    codeLines = [];
  }

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        flushCodeBlock();
        inCodeBlock = false;
      } else {
        flushParagraph();
        flushList();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      const className = level === 1 ? "text-xl font-semibold" : level === 2 ? "text-lg font-semibold" : "font-semibold";
      nodes.push(
        <div key={`h-${nodes.length}`} className={className}>
          {renderInline(heading[2])}
        </div>
      );
      continue;
    }

    const listItem = line.match(/^\s*[-*]\s+(.+)$/);
    if (listItem) {
      flushParagraph();
      listItems.push(listItem[1]);
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  flushCodeBlock();
  return nodes;
}

function renderInline(value: string) {
  const nodes: React.ReactNode[] = [];
  const pattern = /(!?)\[([^\]]*)\]\(([^)\s]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(value))) {
    if (match.index > lastIndex) {
      nodes.push(value.slice(lastIndex, match.index));
    }

    const isImage = match[1] === "!";
    const label = match[2];
    const href = match[3];

    if (isImage) {
      nodes.push(
        <img
          key={`img-${match.index}`}
          src={safeMarkdownUrl(href)}
          alt={label || "image"}
          className="markdown-preview-image my-2 h-auto max-w-full rounded-[var(--radius-sm)] border border-[var(--color-border)]"
        />
      );
    } else {
      nodes.push(
        <a key={`a-${match.index}`} href={safeMarkdownUrl(href)} className="text-[var(--color-primary)] underline" target="_blank" rel="noreferrer">
          {label || href}
        </a>
      );
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < value.length) {
    nodes.push(value.slice(lastIndex));
  }

  return nodes;
}

function safeMarkdownUrl(value: string) {
  if (value.startsWith("/uploads/")) {
    return `/api${value}`;
  }
  if (value.startsWith("/") || value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  return "";
}
