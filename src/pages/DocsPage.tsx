import { Fragment, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Braces,
  Database,
  FileText,
  LockKeyhole,
  Network,
  ServerCog,
  TerminalSquare,
} from "lucide-react";
import apiMarkdown from "@/docs-content/API.md?raw";
import architectureMarkdown from "@/docs-content/ARCHITECTURE.md?raw";
import authenticationMarkdown from "@/docs-content/AUTHENTICATION.md?raw";
import databaseMarkdown from "@/docs-content/DATABASE.md?raw";
import featuresMarkdown from "@/docs-content/FEATURES.md?raw";
import gettingStartedMarkdown from "@/docs-content/GETTING-STARTED.md?raw";
import installMarkdown from "@/docs-content/INSTALL_PRODUCTION.md?raw";
import readmeMarkdown from "@/docs-content/README.md?raw";
import { Container } from "@/components/Container";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

type MarkdownBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "code"; language: string; code: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "blockquote"; text: string }
  | { type: "rule" };

type DocTab = {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
  markdown: string;
};

const docsTabs: DocTab[] = [
  {
    id: "overview",
    label: "Overview",
    description: "Project index, stack, concepts, and runtime notes.",
    icon: BookOpen,
    markdown: readmeMarkdown,
  },
  {
    id: "install",
    label: "Install",
    description: "Production Docker Compose install, upgrades, backup, and troubleshooting.",
    icon: ServerCog,
    markdown: installMarkdown,
  },
  {
    id: "develop",
    label: "Develop",
    description: "Local development, demo data, Docker demo, and verification commands.",
    icon: TerminalSquare,
    markdown: gettingStartedMarkdown,
  },
  {
    id: "features",
    label: "Features",
    description: "Cases, incidents, findings, timelines, graphing, reports, and administration.",
    icon: FileText,
    markdown: featuresMarkdown,
  },
  {
    id: "architecture",
    label: "Architecture",
    description: "Client, API, service, persistence, deployment, and request-flow architecture.",
    icon: Network,
    markdown: architectureMarkdown,
  },
  {
    id: "api",
    label: "API",
    description: "REST API endpoints, response shape, auth, uploads, reports, and notifications.",
    icon: Braces,
    markdown: apiMarkdown,
  },
  {
    id: "auth",
    label: "Auth",
    description: "Session-cookie authentication, header-auth boundary, RBAC, and permissions.",
    icon: LockKeyhole,
    markdown: authenticationMarkdown,
  },
  {
    id: "data",
    label: "Data",
    description: "PostgreSQL schema, tables, relationships, and integrity constraints.",
    icon: Database,
    markdown: databaseMarkdown,
  },
];

function isTableSeparator(line: string) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function splitTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function parseMarkdown(markdown: string): MarkdownBlock[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const language = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }
      blocks.push({ type: "code", language, code: codeLines.join("\n") });
      index += 1;
      continue;
    }

    if (/^#{1,4}\s+/.test(trimmed)) {
      const match = trimmed.match(/^(#{1,4})\s+(.*)$/);
      if (match) {
        blocks.push({ type: "heading", level: match[1].length, text: match[2] });
      }
      index += 1;
      continue;
    }

    if (/^[-*_]{3,}$/.test(trimmed)) {
      blocks.push({ type: "rule" });
      index += 1;
      continue;
    }

    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith(">")) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push({ type: "blockquote", text: quoteLines.join(" ") });
      continue;
    }

    if (trimmed.includes("|") && index + 1 < lines.length && isTableSeparator(lines[index + 1])) {
      const headers = splitTableRow(line);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index].trim().includes("|")) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }
      blocks.push({ type: "table", headers, rows });
      continue;
    }

    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line);
      const items: string[] = [];
      while (
        index < lines.length &&
        (ordered ? /^\s*\d+\.\s+/.test(lines[index]) : /^\s*[-*]\s+/.test(lines[index]))
      ) {
        items.push(lines[index].replace(/^\s*(?:[-*]|\d+\.)\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }

    const paragraphLines = [trimmed];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].trim().startsWith("```") &&
      !/^#{1,4}\s+/.test(lines[index].trim()) &&
      !/^\s*[-*]\s+/.test(lines[index]) &&
      !/^\s*\d+\.\s+/.test(lines[index]) &&
      !lines[index].trim().startsWith(">") &&
      !(lines[index].trim().includes("|") && index + 1 < lines.length && isTableSeparator(lines[index + 1]))
    ) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }
    blocks.push({ type: "paragraph", text: paragraphLines.join(" ") });
  }

  return blocks;
}

function renderInline(text: string) {
  const pieces = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).filter(Boolean);

  return pieces.map((piece, index) => {
    if (piece.startsWith("`") && piece.endsWith("`")) {
      return (
        <code key={`${piece}-${index}`} className="docs-inline-code">
          {piece.slice(1, -1)}
        </code>
      );
    }

    if (piece.startsWith("**") && piece.endsWith("**")) {
      return <strong key={`${piece}-${index}`}>{piece.slice(2, -2)}</strong>;
    }

    const link = piece.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const href = link[2].startsWith("./")
        ? `https://github.com/ngynduc/forenotes/tree/main/docs/${link[2].slice(2)}`
        : link[2];
      return (
        <a key={`${piece}-${index}`} href={href} target="_blank" rel="noreferrer">
          {link[1]}
        </a>
      );
    }

    return <Fragment key={`${piece}-${index}`}>{piece}</Fragment>;
  });
}

function MarkdownContent({ markdown }: { markdown: string }) {
  const blocks = useMemo(() => parseMarkdown(markdown), [markdown]);

  return (
    <div className="docs-markdown">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const Heading = `h${Math.min(block.level + 1, 5)}` as keyof JSX.IntrinsicElements;
          return <Heading key={`${block.type}-${index}`}>{renderInline(block.text)}</Heading>;
        }

        if (block.type === "paragraph") {
          return <p key={`${block.type}-${index}`}>{renderInline(block.text)}</p>;
        }

        if (block.type === "list") {
          const List = block.ordered ? "ol" : "ul";
          return (
            <List key={`${block.type}-${index}`}>
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`}>{renderInline(item)}</li>
              ))}
            </List>
          );
        }

        if (block.type === "code") {
          return (
            <div key={`${block.type}-${index}`} className="docs-code-block">
              {block.language && <div className="docs-code-language">{block.language}</div>}
              <pre>
                <code>{block.code}</code>
              </pre>
            </div>
          );
        }

        if (block.type === "table") {
          return (
            <div key={`${block.type}-${index}`} className="docs-table-wrap">
              <table>
                <thead>
                  <tr>
                    {block.headers.map((header) => (
                      <th key={header}>{renderInline(header)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={`${row.join("-")}-${rowIndex}`}>
                      {row.map((cell, cellIndex) => (
                        <td key={`${cell}-${cellIndex}`}>{renderInline(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (block.type === "blockquote") {
          return <blockquote key={`${block.type}-${index}`}>{renderInline(block.text)}</blockquote>;
        }

        return <hr key={`${block.type}-${index}`} />;
      })}
    </div>
  );
}

export function DocsPage() {
  const [activeTab, setActiveTab] = useState(docsTabs[0].id);
  const docsPanelRef = useRef<HTMLDivElement>(null);
  const activeDoc = useMemo(() => docsTabs.find((tab) => tab.id === activeTab) ?? docsTabs[0], [activeTab]);
  const ActiveIcon = activeDoc.icon;
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    window.requestAnimationFrame(() => {
      const panelTop = docsPanelRef.current?.getBoundingClientRect().top ?? 0;
      const stickyOffset = window.matchMedia("(min-width: 1024px)").matches ? 88 : 134;
      window.scrollTo({
        top: window.scrollY + panelTop - stickyOffset,
        behavior: "smooth",
      });
    });
  };

  return (
    <div className="landing-page">
      <SiteHeader />
      <main>
        <section className="border-b border-[var(--color-border)] py-16 md:py-20">
          <Container>
            <div className="max-w-3xl">
              <h1 className="text-[2.45rem] font-semibold leading-[1.05] tracking-tight text-[var(--color-text)] sm:text-[3.25rem]">
                Forenotes documentation
              </h1>
              <p className="mt-5 max-w-2xl text-[1rem] leading-7 text-[var(--color-text-muted)]">
                Practical guides for installing, running, extending, and operating Forenotes, organized for quick
                reference without leaving the product site.
              </p>
            </div>
          </Container>
        </section>

        <section className="py-10 md:py-14">
          <Container>
            <div className="grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
              <aside className="sticky top-14 z-40 -mx-6 min-w-0 border-b border-[var(--color-border)] bg-[rgba(6,16,13,0.92)] px-6 py-3 backdrop-blur-xl lg:top-20 lg:z-auto lg:mx-0 lg:self-start lg:border-b-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
                <div
                  className="docs-tablist flex max-w-full gap-2 overflow-x-auto lg:grid lg:overflow-visible"
                  role="tablist"
                  aria-label="Documentation sections"
                >
                  {docsTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-controls={`docs-panel-${tab.id}`}
                        id={`docs-tab-${tab.id}`}
                        onClick={() => handleTabChange(tab.id)}
                        className={`group flex min-h-11 shrink-0 items-center gap-3 rounded-[var(--radius-sm)] border px-3.5 text-left text-[0.8125rem] font-medium transition-colors lg:w-full ${
                          isActive
                            ? "border-[rgba(45,212,191,0.45)] bg-[var(--color-primary-soft)] text-[var(--color-text)]"
                            : "border-[var(--color-border)] bg-[rgba(255,255,255,0.025)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]"
                        }`}
                      >
                        <Icon size={16} aria-hidden />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </aside>

              <article
                role="tabpanel"
                id={`docs-panel-${activeDoc.id}`}
                aria-labelledby={`docs-tab-${activeDoc.id}`}
                className="min-w-0"
              >
                <div
                  ref={docsPanelRef}
                  className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[rgba(255,255,255,0.035)] p-5 md:p-7"
                >
                  <div className="flex flex-col gap-5 border-b border-[var(--color-border)] pb-6 md:flex-row md:items-start md:justify-between">
                    <div className="max-w-2xl">
                      <h2 className="text-[1.85rem] font-semibold leading-tight tracking-tight md:text-[2.25rem]">
                        {activeDoc.label}
                      </h2>
                      <p className="mt-4 text-[0.9375rem] leading-7 text-[var(--color-text-muted)]">
                        {activeDoc.description}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[rgba(45,212,191,0.28)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                      <ActiveIcon size={22} aria-hidden />
                    </div>
                  </div>

                  <MarkdownContent markdown={activeDoc.markdown} />
                </div>
              </article>
            </div>
          </Container>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
