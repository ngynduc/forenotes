import { execFile } from "node:child_process";
import { access, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import MarkdownIt from "markdown-it";
import sanitizeHtml from "sanitize-html";

const execFileAsync = promisify(execFile);

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: false
});

const allowedContentTags = [
  "a",
  "blockquote",
  "br",
  "code",
  "del",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "img",
  "li",
  "ol",
  "p",
  "pre",
  "strong",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "ul"
];

const allowedTemplateTags = [
  ...allowedContentTags,
  "body",
  "div",
  "footer",
  "head",
  "html",
  "main",
  "meta",
  "section",
  "span",
  "style",
  "title"
];

const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: allowedTemplateTags,
  allowedAttributes: {
    "*": ["class", "id"],
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title"],
    meta: ["charset"],
    td: ["colspan", "rowspan"],
    th: ["colspan", "rowspan", "scope"]
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowVulnerableTags: true,
  disallowedTagsMode: "discard",
  enforceHtmlBoundary: false,
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, true)
  }
};

export const DEFAULT_PDF_CSS = `
@page {
  size: A4;
  margin: 18mm 18mm 20mm 26mm;
}

html {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

body {
  font-family: Inter, Arial, sans-serif;
  color: #17201d;
  font-size: 12px;
  line-height: 1.6;
  margin: 0;
  position: relative;
}

body::before {
  background: #127c73;
  bottom: 0;
  content: "";
  left: 0;
  position: fixed;
  top: 0;
  width: 14mm;
}

.cover {
  min-height: calc(297mm - 38mm);
  page-break-after: always;
  padding: 34mm 0 12mm 34mm;
  position: relative;
}

.cover::before {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0) 41%, rgba(214, 238, 234, 0.92) 41%);
  content: "";
  inset: 0 -18mm 0 11mm;
  position: absolute;
  z-index: -2;
}

.cover::after {
  background: radial-gradient(circle at center, rgba(193, 227, 221, 0.45) 0%, rgba(193, 227, 221, 0.45) 62%, rgba(193, 227, 221, 0) 62%);
  border-radius: 50%;
  bottom: -20mm;
  content: "";
  height: 160mm;
  position: absolute;
  right: -34mm;
  width: 160mm;
  z-index: -1;
}

.cover__brand {
  align-items: center;
  display: flex;
  gap: 14px;
  margin-bottom: 18px;
}

.cover__mark {
  align-items: center;
  background: #127c73;
  border-radius: 16px;
  color: #ffffff;
  display: inline-flex;
  font-size: 28px;
  font-weight: 800;
  height: 56px;
  justify-content: center;
  width: 56px;
}

.cover__product {
  font-size: 28px;
  font-weight: 800;
  line-height: 1.1;
}

.cover__tagline {
  color: #6a7773;
  font-size: 11px;
  letter-spacing: 0.16em;
  margin-top: 4px;
  text-transform: uppercase;
}

.cover__report-type {
  border: 1px solid #d7e2de;
  border-radius: 999px;
  color: #135f59;
  font-size: 12px;
  font-weight: 700;
  margin: 8px 0 160px;
  max-width: 440px;
  padding: 8px 18px;
  text-transform: uppercase;
}

.cover__eyebrow {
  color: #0f766e;
  font-size: 11px;
  letter-spacing: 0.08em;
  font-weight: 700;
  margin-bottom: 14px;
  text-transform: uppercase;
}

.cover__title {
  font-size: 44px;
  font-weight: 800;
  letter-spacing: 0;
  line-height: 1.05;
  margin: 0;
  max-width: 520px;
}

.cover__subtitle {
  color: #6a7773;
  font-size: 16px;
  margin: 18px 0 88px;
  max-width: 460px;
}

.cover__meta-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  max-width: 520px;
}

.cover__meta-card {
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid #d7e2de;
  border-radius: 16px;
  padding: 14px 18px;
}

.cover__meta-card--full {
  grid-column: 1 / -1;
}

.cover__meta-label {
  color: #6a7773;
  display: block;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.cover__meta-value {
  font-size: 17px;
  font-weight: 700;
  line-height: 1.3;
}

.document-shell {
  padding-left: 34mm;
}

.document-shell__header {
  border-bottom: 1px solid #d7e2de;
  margin-bottom: 18px;
  padding-bottom: 16px;
}

.document-shell__kicker {
  color: #0f766e;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.document-shell__title {
  font-size: 28px;
  font-weight: 800;
  line-height: 1.15;
  margin: 0;
}

.document-shell__lede {
  color: #52605d;
  font-size: 13px;
  margin: 10px 0 0;
}

.document-shell__meta {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 16px;
}

.document-shell__meta-item {
  background: #f5f9f8;
  border: 1px solid #dfe8e5;
  border-radius: 12px;
  padding: 10px 12px;
}

.document-shell__meta-item span {
  color: #65726e;
  display: block;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.document-shell__meta-item strong {
  display: block;
  font-size: 12px;
  line-height: 1.4;
}

.document-shell__content {
  min-width: 0;
}

.forenotes-markdown > :first-child {
  margin-top: 0;
}

.forenotes-markdown > :last-child {
  margin-bottom: 0;
}

.forenotes-markdown h1,
.forenotes-markdown h2,
.forenotes-markdown h3,
.forenotes-markdown h4,
.forenotes-markdown h5,
.forenotes-markdown h6 {
  color: #16211f;
  font-weight: 800;
  letter-spacing: 0;
  line-height: 1.2;
  margin: 24px 0 10px;
  page-break-after: avoid;
}

.forenotes-markdown h1 {
  border-bottom: 1px solid #d7e2de;
  font-size: 26px;
  margin-top: 0;
  padding-bottom: 10px;
}

.forenotes-markdown h2 {
  border-bottom: 1px solid #e3ebe8;
  font-size: 20px;
  padding-bottom: 6px;
}

.forenotes-markdown h3 {
  font-size: 16px;
}

.forenotes-markdown p,
.forenotes-markdown ul,
.forenotes-markdown ol,
.forenotes-markdown blockquote,
.forenotes-markdown pre,
.forenotes-markdown table {
  margin: 12px 0 16px;
}

.forenotes-markdown p {
  color: #24312e;
}

.forenotes-markdown ul,
.forenotes-markdown ol {
  padding-left: 20px;
}

.forenotes-markdown li + li {
  margin-top: 6px;
}

.forenotes-markdown blockquote {
  background: #f4faf8;
  border-left: 4px solid #0f766e;
  border-radius: 0 12px 12px 0;
  color: #41514d;
  padding: 12px 14px;
}

.forenotes-markdown hr {
  border: 0;
  border-top: 1px solid #d7e2de;
  margin: 20px 0;
}

.forenotes-markdown table {
  background: #ffffff;
  border: 1px solid #d7e2de;
  border-radius: 12px;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 11px;
  overflow: hidden;
  page-break-inside: auto;
  table-layout: fixed;
  width: 100%;
}

.forenotes-markdown thead {
  display: table-header-group;
}

.forenotes-markdown tr {
  page-break-inside: avoid;
  page-break-after: auto;
}

.forenotes-markdown tbody tr:nth-child(even) {
  background: #f8fbfa;
}

.forenotes-markdown th,
.forenotes-markdown td {
  border-bottom: 1px solid #dfe8e5;
  border-right: 1px solid #dfe8e5;
  padding: 8px 10px;
  vertical-align: top;
  overflow-wrap: anywhere;
}

.forenotes-markdown tr > *:last-child {
  border-right: 0;
}

.forenotes-markdown tbody tr:last-child > * {
  border-bottom: 0;
}

.forenotes-markdown th {
  background: #eef5f3;
  color: #163430;
  font-weight: 700;
  text-align: left;
}

.forenotes-markdown code {
  font-family: Consolas, monospace;
  background: #f1f3f2;
  border-radius: 3px;
  padding: 1px 4px;
}

.forenotes-markdown pre {
  background: #f1f3f2;
  border-radius: 10px;
  overflow-wrap: break-word;
  padding: 12px 14px;
  white-space: pre-wrap;
}

.forenotes-markdown pre code {
  background: transparent;
  padding: 0;
}

.forenotes-markdown a {
  color: #0f766e;
}

.document-footer {
  border-top: 1px solid #d7e2de;
  color: #66716d;
  display: flex;
  font-size: 10px;
  justify-content: space-between;
  margin-top: 24px;
  padding: 12px 0 0 34mm;
}

@media print {
  .cover {
    min-height: calc(297mm - 38mm);
  }
}
`.trim();

export const DEFAULT_PDF_HTML_TEMPLATE = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>{{page.css}}</style>
</head>
<body>
  <section class="cover">
    <div class="cover__brand">
      <div class="cover__mark">F</div>
      <div>
        <div class="cover__product">Forenotes</div>
        <div class="cover__tagline">Digital Forensics & Incident Response</div>
      </div>
    </div>
    <div class="cover__report-type">{{report.type}}</div>
    <div class="cover__eyebrow">Confidential DFIR Report</div>
    <h1 class="cover__title">{{report.title}}</h1>
    <p class="cover__subtitle">{{incident.name}}</p>
    <div class="cover__meta-grid">
      <div class="cover__meta-card">
        <span class="cover__meta-label">Client</span>
        <div class="cover__meta-value">{{incident.clientName}}</div>
      </div>
      <div class="cover__meta-card">
        <span class="cover__meta-label">Status</span>
        <div class="cover__meta-value">{{incident.status}}</div>
      </div>
      <div class="cover__meta-card">
        <span class="cover__meta-label">Incident</span>
        <div class="cover__meta-value">{{incident.name}}</div>
      </div>
      <div class="cover__meta-card">
        <span class="cover__meta-label">Generated</span>
        <div class="cover__meta-value">{{report.generatedAt}}</div>
      </div>
      <div class="cover__meta-card cover__meta-card--full">
        <span class="cover__meta-label">Template Engine</span>
        <div class="cover__meta-value">Markdown content rendered into a branded HTML document</div>
      </div>
    </div>
  </section>
  <section class="document-shell">
    <div class="document-shell__header">
      <div class="document-shell__kicker">Forenotes incident report</div>
      <h2 class="document-shell__title">{{report.title}}</h2>
      <p class="document-shell__lede">Markdown sections, tables, lists, and callouts inherit presentation from this PDF template.</p>
      <div class="document-shell__meta">
        <div class="document-shell__meta-item">
          <span>Incident</span>
          <strong>{{incident.name}}</strong>
        </div>
        <div class="document-shell__meta-item">
          <span>Client</span>
          <strong>{{incident.clientName}}</strong>
        </div>
        <div class="document-shell__meta-item">
          <span>Generated</span>
          <strong>{{report.generatedAt}}</strong>
        </div>
      </div>
    </div>
    <main class="document-shell__content">
      {{content}}
    </main>
  </section>
  <section class="document-footer">
    <span>Generated by Forenotes</span>
    <span>{{report.type}}</span>
  </section>
</body>
</html>`;

export function renderMarkdownToSanitizedHtml(markdownContent: string) {
  return sanitizeHtml(markdown.render(markdownContent || ""), sanitizeOptions);
}

export function renderPdfHtml(input: {
  report: { title: string; type: string; generatedAt: string; markdown: string };
  incident: { name: string; clientName: string; status: string };
  htmlTemplate: string;
  css: string;
}) {
  const replacements: Record<string, string> = {
    "report.title": escapeHtml(input.report.title || "Not provided"),
    "report.type": escapeHtml(input.report.type || "Not provided"),
    "report.generatedAt": escapeHtml(input.report.generatedAt || "Not provided"),
    "incident.name": escapeHtml(input.incident.name || "Not provided"),
    "incident.clientName": escapeHtml(input.incident.clientName || "Not provided"),
    "incident.status": escapeHtml(input.incident.status || "Not provided"),
    "page.css": sanitizeCss(input.css || DEFAULT_PDF_CSS),
    content: `<div class="forenotes-markdown">${renderMarkdownToSanitizedHtml(input.report.markdown)}</div>`
  };

  const rendered = input.htmlTemplate.replace(/{{\s*([^}]+?)\s*}}/g, (_match, rawKey: string) => {
    const key = rawKey.trim();
    return replacements[key] ?? "Not provided";
  });

  return sanitizeHtml(rendered, sanitizeOptions);
}

export async function renderHtmlToPdf(html: string) {
  const executable = await resolveChromiumExecutable();
  const workDir = await mkdtemp(path.join(tmpdir(), "forenotes-pdf-"));
  const htmlPath = path.join(workDir, "report.html");
  const pdfPath = path.join(workDir, "report.pdf");
  try {
    await writeFile(htmlPath, html, "utf8");
    await execFileAsync(
      executable,
      [
        "--headless=new",
        "--no-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--run-all-compositor-stages-before-draw",
        "--no-pdf-header-footer",
        `--print-to-pdf=${pdfPath}`,
        pathToFileURL(htmlPath).href
      ],
      { timeout: 30_000, maxBuffer: 1024 * 1024 }
    );
    const pdf = await readFile(pdfPath);
    if (pdf.byteLength === 0) {
      throw new Error("Chromium produced an empty PDF.");
    }
    return pdf;
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

async function resolveChromiumExecutable() {
  const candidates = [
    process.env.PDF_CHROMIUM_EXECUTABLE_PATH,
    process.env.CHROME_PATH,
    ...(await agentBrowserChromeCandidates()),
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser"
  ];

  for (const candidate of candidates) {
    if (candidate && await pathExists(candidate)) {
      return candidate;
    }
  }

  for (const command of ["google-chrome-stable", "google-chrome", "chromium", "chromium-browser"]) {
    try {
      const { stdout } = await execFileAsync("which", [command]);
      const resolved = stdout.trim();
      if (resolved) {
        return resolved;
      }
    } catch {
      // Try the next executable name.
    }
  }

  throw new Error("Chromium executable not found for PDF export.");
}

async function agentBrowserChromeCandidates() {
  const root = path.join(homedir(), ".agent-browser", "browsers");
  try {
    const entries = await readdir(root, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory() && entry.name.startsWith("chrome-"))
      .map((entry) => path.join(root, entry.name, "chrome"))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

async function pathExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function sanitizeCss(value: string) {
  return value
    .replace(/<\/?style\b[^>]*>/gi, "")
    .replace(/expression\s*\([^)]*\)/gi, "")
    .replace(/url\s*\(\s*(['"]?)\s*(?:javascript|file):[^)]+\)/gi, "")
    .replace(/@import[^;]+;/gi, "");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
