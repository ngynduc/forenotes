import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Container } from "@/components/Container";
import { CodeBlock } from "@/components/documentation/CodeBlock";
import { DocsLayout } from "@/components/documentation/DocsLayout";
import { DocsSection } from "@/components/documentation/DocsSection";
import { DocsTable } from "@/components/documentation/DocsTable";
import {
  ArrowDown,
  BookOpen,
  CheckCircle2,
  FileText,
  LockKeyhole,
  Server,
  ShieldCheck,
  Users,
} from "lucide-react";

const toc = [
  { id: "introduction", label: "Introduction" },
  { id: "deployment-options", label: "Deployment options" },
  { id: "prerequisites", label: "Prerequisites" },
  { id: "installation", label: "Install with Docker Compose" },
  { id: "first-time-setup", label: "First-time setup" },
  { id: "core-concepts", label: "Core concepts" },
  { id: "usage-guide", label: "Usage guide" },
  { id: "environment", label: "Environment variables" },
  { id: "updating", label: "Updating Forenotes" },
  { id: "backup-restore", label: "Backup and restore" },
  { id: "troubleshooting", label: "Troubleshooting" },
];

const folderStructure = `
forenotes/
|-- docker-compose.prod.yml
|-- .env.production
|-- forenotes-app-v1.tar
|-- services/
|   \`-- report-llm-service/
\`-- docs/
`;

const composeExample = `
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: \${POSTGRES_USER:?set POSTGRES_USER}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:?set POSTGRES_PASSWORD}
      POSTGRES_DB: \${POSTGRES_DB:?set POSTGRES_DB}
    volumes:
      - forenotes_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \\"$\${POSTGRES_USER}\\" -d \\"$\${POSTGRES_DB}\\""]
      interval: 5s
      timeout: 3s
      retries: 10

  app:
    image: forenotes-app:v1
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      report-llm-service:
        condition: service_healthy
    environment:
      NODE_ENV: production
      APP_HOST: \${APP_HOST:-0.0.0.0}
      APP_PORT: \${APP_PORT:-3000}
      DATABASE_URL: \${DATABASE_URL:?set DATABASE_URL}
      FORENOTES_DATA_DIR: /app/data
      FORENOTES_BOOTSTRAP_ADMIN_USERNAME: \${FORENOTES_BOOTSTRAP_ADMIN_USERNAME:?set FORENOTES_BOOTSTRAP_ADMIN_USERNAME}
      FORENOTES_BOOTSTRAP_ADMIN_EMAIL: \${FORENOTES_BOOTSTRAP_ADMIN_EMAIL:?set FORENOTES_BOOTSTRAP_ADMIN_EMAIL}
      FORENOTES_BOOTSTRAP_ADMIN_DISPLAY_NAME: \${FORENOTES_BOOTSTRAP_ADMIN_DISPLAY_NAME:?set FORENOTES_BOOTSTRAP_ADMIN_DISPLAY_NAME}
      FORENOTES_BOOTSTRAP_ADMIN_PASSWORD: \${FORENOTES_BOOTSTRAP_ADMIN_PASSWORD:?set FORENOTES_BOOTSTRAP_ADMIN_PASSWORD}
      FORENOTES_BOOTSTRAP_ADMIN_TEMPORARY: \${FORENOTES_BOOTSTRAP_ADMIN_TEMPORARY:-true}
      FORENOTES_LLM_SECRET_KEY: \${FORENOTES_LLM_SECRET_KEY:?set FORENOTES_LLM_SECRET_KEY}
      SECURE_SESSION_COOKIES: \${SECURE_SESSION_COOKIES:-true}
      LITELLM_SERVICE_URL: http://report-llm-service:8001
      LLM_PROVIDER: \${LLM_PROVIDER:-}
      LLM_MODEL: \${LLM_MODEL:-}
      LLM_API_KEY: \${LLM_API_KEY:-}
      LLM_API_ENDPOINT: \${LLM_API_ENDPOINT:-}
      LLM_SYSTEM_PROMPT: \${LLM_SYSTEM_PROMPT:-}
      LLM_CUSTOM_HEADERS_JSON: \${LLM_CUSTOM_HEADERS_JSON:-{}}
    ports:
      - "\${FORENOTES_HOST_PORT:-3000}:\${APP_PORT:-3000}"
    volumes:
      - forenotes_app_data:/app/data

  report-llm-service:
    build: ./services/report-llm-service
    image: forenotes-report-llm:v1
    restart: unless-stopped
    environment:
      NODE_ENV: production
      LLM_PROVIDER: \${LLM_PROVIDER:-}
      LLM_MODEL: \${LLM_MODEL:-}
      LLM_API_KEY: \${LLM_API_KEY:-}
      LLM_API_ENDPOINT: \${LLM_API_ENDPOINT:-}
      LLM_SYSTEM_PROMPT: \${LLM_SYSTEM_PROMPT:-}
      LLM_CUSTOM_HEADERS_JSON: \${LLM_CUSTOM_HEADERS_JSON:-{}}

volumes:
  forenotes_postgres_data:
  forenotes_app_data:
`;

const envExample = `
NODE_ENV=production
APP_HOST=0.0.0.0
APP_PORT=3000
FORENOTES_HOST_PORT=3000

POSTGRES_USER=forenotes
POSTGRES_PASSWORD=change_me_to_a_long_random_database_password
POSTGRES_DB=forenotes
DATABASE_URL=postgres://forenotes:change_me_to_a_long_random_database_password@postgres:5432/forenotes

FORENOTES_BOOTSTRAP_ADMIN_USERNAME=admin
FORENOTES_BOOTSTRAP_ADMIN_EMAIL=admin@example.com
FORENOTES_BOOTSTRAP_ADMIN_DISPLAY_NAME=Forenotes Admin
FORENOTES_BOOTSTRAP_ADMIN_PASSWORD=change_me_to_a_long_random_temporary_password
FORENOTES_BOOTSTRAP_ADMIN_TEMPORARY=true

FORENOTES_LLM_SECRET_KEY=change_me_to_at_least_32_random_characters
SECURE_SESSION_COOKIES=true

LLM_PROVIDER=
LLM_MODEL=
LLM_API_KEY=
LLM_API_ENDPOINT=
LLM_SYSTEM_PROMPT=
LLM_CUSTOM_HEADERS_JSON={}
`;

const startCommands = `
docker build -t forenotes:beta-v1-prod -f Dockerfile .
docker run --env-file .env.production -p 3000:3000 -v forenotes_data:/app/data forenotes:beta-v1-prod
`;

const startCommandsCompose = `
cp .env.production.example .env.production
docker compose --env-file .env.production up -d --build
`;

const stopCommands = `
docker compose -f docker-compose.prod.yml --env-file .env.production restart app
docker compose -f docker-compose.prod.yml --env-file .env.production down
`;

const minimumRequirements = `
CPU: 2 cores minimum
RAM: 4 GB minimum
Disk: 20 GB minimum
OS: Linux recommended
`;

const updateCommands = `
docker compose -f docker-compose.prod.yml --env-file .env.production pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
`;

const archiveUpdateCommands = `
docker load -i forenotes-app-v1-new.tar
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
`;

const backupCommand = `
docker compose -f docker-compose.prod.yml --env-file .env.production exec postgres pg_dump -U forenotes forenotes > forenotes-backup.sql
`;

const restoreCommand = `
cat forenotes-backup.sql | docker compose -f docker-compose.prod.yml --env-file .env.production exec -T postgres psql -U forenotes forenotes
`;

const concepts = [
  ["Case", "The top-level workspace for an investigation. A case groups related incidents, members, notes, timeline entries, tasks, and reports."],
  ["Incident", "A specific investigation or security event inside a case. Incidents hold the focused evidence and workflow for that event."],
  ["Finding", "An observed issue, suspicious activity, evidence-backed conclusion, or investigative result that needs review or remediation."],
  ["Timeline", "Timestamped events that help analysts reconstruct what happened, when it happened, and which timezone is being reviewed."],
  ["Task", "Action items for response or investigation work, including ownership, priority, due dates, and status tracking."],
  ["Note", "Markdown-based investigation notes used to capture analysis, images, hypotheses, and links to case or incident context."],
  ["Report", "Structured DFIR documentation generated from case and incident context, then reviewed, edited, and exported as PDF."],
  ["Graph", "A relationship view linking entities, findings, timeline events, notes, MITRE techniques, queries, and other investigation objects."],
];

const workflowSteps = [
  {
    title: "Create a case",
    steps: [
      "Go to Cases.",
      "Select New Case.",
      "Enter the case name, client, severity, status, and summary.",
      "Save the case and open the case workspace.",
    ],
  },
  {
    title: "Add team members",
    steps: [
      "Open the case.",
      "Go to the members or settings area.",
      "Add users by username or email.",
      "Assign a role that matches the work they should perform.",
    ],
    note: "Case membership controls access to incidents inside that case. Users who are not members should not see or modify case content.",
  },
  {
    title: "Create an incident",
    steps: [
      "Open a case.",
      "Select New Incident.",
      "Add incident name, status, severity, summary, and key timestamps.",
      "Save the incident before adding findings, timeline events, tasks, notes, or reports.",
    ],
  },
  {
    title: "Add findings",
    steps: [
      "Open an incident.",
      "Go to Findings.",
      "Add a finding title, severity, status, affected asset, description, evidence, and recommendation.",
      "Save the finding and keep evidence language specific enough for report review.",
    ],
  },
  {
    title: "Build a timeline",
    steps: [
      "Open Timeline.",
      "Add timestamped events with the source, confidence, and description when available.",
      "Use the timezone picker when reviewing events from different systems.",
      "Filter or sort entries to validate sequence and gaps.",
    ],
  },
  {
    title: "Manage tasks",
    steps: [
      "Open Tasks.",
      "Create a task with a clear action title.",
      "Assign an owner.",
      "Set priority and due date.",
      "Track overdue and due-soon tasks from the dashboard.",
    ],
  },
  {
    title: "Write notes",
    steps: [
      "Open Notes.",
      "Create a Markdown note.",
      "Paste images if your release package supports image uploads.",
      "Link notes to case or incident objects when those linking controls are available.",
    ],
  },
  {
    title: "Generate reports",
    steps: [
      "Open Reports.",
      "Select a report template.",
      "Review the generated Markdown.",
      "Edit the report until the narrative is accurate.",
      "Export as PDF using the selected template or theme.",
    ],
    note: "Generated reports should only use the provided case and incident context. Missing information should be marked clearly instead of guessed. PDF output depends on the selected template and rendering dependencies.",
  },
];

const envRows = [
  ["NODE_ENV", "Yes", "production", "Runtime mode. Production enables stricter startup validation."],
  ["APP_HOST", "Yes", "0.0.0.0", "Container bind address. Keep this value for Docker deployments."],
  ["APP_PORT", "Yes", "3000", "Application port inside the app container."],
  ["FORENOTES_HOST_PORT", "Yes", "3000", "Host port published by Docker Compose."],
  ["POSTGRES_USER", "Yes", "forenotes", "PostgreSQL username used by the database container."],
  ["POSTGRES_PASSWORD", "Yes", "long random password", "PostgreSQL password. Keep it aligned with DATABASE_URL."],
  ["POSTGRES_DB", "Yes", "forenotes", "PostgreSQL database name."],
  ["DATABASE_URL", "Yes", "postgres://forenotes:...@postgres:5432/forenotes", "Application PostgreSQL connection string."],
  ["FORENOTES_BOOTSTRAP_ADMIN_USERNAME", "Yes", "admin", "First admin username used only when no admin exists."],
  ["FORENOTES_BOOTSTRAP_ADMIN_EMAIL", "Yes", "admin@example.com", "First admin email."],
  ["FORENOTES_BOOTSTRAP_ADMIN_DISPLAY_NAME", "Yes", "Forenotes Admin", "First admin display name."],
  ["FORENOTES_BOOTSTRAP_ADMIN_PASSWORD", "Yes", "long temporary password", "Temporary first admin password. Change it after first login."],
  ["FORENOTES_BOOTSTRAP_ADMIN_TEMPORARY", "Yes", "true", "Forces the bootstrap admin to change password after first login."],
  ["FORENOTES_LLM_SECRET_KEY", "Yes", "32+ random characters", "Secret used to encrypt stored per-user LLM API keys."],
  ["SECURE_SESSION_COOKIES", "Yes", "true", "Use true behind HTTPS. Use false only for local HTTP testing."],
  ["LLM_PROVIDER", "No", "openai", "Optional environment-level default provider for report generation."],
  ["LLM_MODEL", "No", "gpt-4o-mini", "Optional default model. User settings can override it."],
  ["LLM_API_KEY", "No", "provider key", "Optional default LLM provider API key."],
  ["LLM_API_ENDPOINT", "No", "https://api.example.com/v1", "Optional custom or provider-specific API endpoint."],
  ["LLM_SYSTEM_PROMPT", "No", "custom prompt", "Optional report-generation system prompt."],
  ["LLM_CUSTOM_HEADERS_JSON", "No", "{}", "Optional JSON object for provider-specific headers."],
];

const licenseRows = [
  ["Individual", "Solo analyst", "Core case and incident workflow"],
  ["Pro", "Professional analyst", "Individual features plus Graph"],
  ["Teams", "Internal team", "Pro features plus multiple users and tasks"],
  ["Enterprise", "Large organization", "Teams features plus future SSO and enterprise controls"],
];

const troubleshooting = [
  {
    title: "App cannot connect to database",
    checks: [
      "Confirm DATABASE_URL uses the postgres hostname when using Docker Compose.",
      "Check PostgreSQL health with docker compose ps.",
      "Compare POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, and DATABASE_URL.",
      "Read app and postgres logs before changing the compose file.",
    ],
  },
  {
    title: "Cannot log in",
    checks: [
      "Confirm migrations ran successfully.",
      "Check the bootstrap admin username and password variables.",
      "If the admin already changed the password, use the current password rather than the original env value.",
      "Read server logs for authentication or bootstrap errors.",
    ],
  },
  {
    title: "PDF export fails",
    checks: [
      "Check report template HTML and CSS validity.",
      "Confirm the app container can reach any required rendering dependency.",
      "Review app logs for Chromium, template, or report service errors.",
      "Try a simpler template to separate content issues from renderer issues.",
    ],
  },
  {
    title: "Port already in use",
    checks: [
      "Run sudo lsof -i :3000 on the host.",
      "Change FORENOTES_HOST_PORT in .env.production, for example 8080.",
      "Restart the stack with the same --env-file so Compose expands variables correctly.",
    ],
  },
];

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-2">
      {steps.map((step, index) => (
        <li key={step} className="docs-step-item">
          <span className="docs-step-index">
            {index + 1}
          </span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="docs-inline-code">
      {children}
    </code>
  );
}

export function DocsPage() {
  return (
    <div className="landing-page">
      <SiteHeader />
      <main>
        <section className="border-b border-[var(--color-border)] py-16 sm:py-20">
          <Container>
            <div className="max-w-[780px]">
              <p className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-[0.75rem] font-medium text-[var(--color-primary)]">
                <BookOpen size={14} aria-hidden="true" />
                Forenotes product guide
              </p>
              <h1 className="mt-6 text-[2.25rem] font-semibold leading-[1.05] tracking-tight text-[var(--color-text)] sm:text-[3.25rem]">
                Install Forenotes and start investigating your first DFIR case.
              </h1>
              <p className="mt-5 text-[1rem] leading-relaxed text-[var(--color-text-muted)] sm:text-[1.0625rem]">
                This guide walks through self-hosted deployment, first login, case creation, incident workflow, reporting,
                backups, and common setup problems.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#installation"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 text-[0.875rem] font-semibold text-[var(--color-bg)] transition-colors hover:bg-[var(--color-primary-strong)]"
                >
                  <ArrowDown size={16} aria-hidden="true" />
                  Start installation
                </a>
                <a
                  href="#usage-guide"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] px-4 text-[0.875rem] font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)]"
                >
                  <FileText size={16} aria-hidden="true" />
                  Read workflow
                </a>
              </div>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Server, label: "Docker-first", text: "Production deployment is built around Docker Compose and persistent data volumes." },
                { icon: ShieldCheck, label: "Self-hosted", text: "Run Forenotes in your own network, lab, workstation, or server environment." },
                { icon: Users, label: "Team workflow", text: "Organize cases, incidents, tasks, notes, reports, and analyst access." },
                { icon: LockKeyhole, label: "Secure by default", text: "Production guidance emphasizes safe secrets, strong admin credentials, and self-hosted control." },
              ].map((item) => (
                <div key={item.label} className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                  <item.icon size={18} strokeWidth={1.6} className="text-[var(--color-primary)]" aria-hidden="true" />
                  <p className="mt-3 text-[0.875rem] font-semibold text-[var(--color-text)]">{item.label}</p>
                  <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--color-text-muted)]">{item.text}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        <DocsLayout toc={toc}>
          <DocsSection id="introduction" eyebrow="Start here" title="Introduction">
            <p>
              Forenotes is a DFIR case management and reporting workspace. It helps security teams organize cases,
              incidents, findings, timelines, tasks, notes, evidence references, graph relationships, and reports in one
              internal workspace.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {["Individual analysts", "Internal SOC and DFIR teams", "Consultants", "Enterprise security teams"].map((audience) => (
                <div key={audience} className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[var(--color-primary)]" aria-hidden="true" />
                  <span className="text-[0.875rem] text-[var(--color-text)]">{audience}</span>
                </div>
              ))}
            </div>
          </DocsSection>

          <DocsSection id="deployment-options" eyebrow="Deployment" title="Deployment options">
            <p>
              The intended production path is a customer-owned, self-hosted deployment. Use the Forenotes Docker image,
              Docker Compose, PostgreSQL, persistent volumes, and environment configuration. The app can run on an
              internet-connected server, an internal network, or an offline environment where images are loaded from an
              archive.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <h3 className="text-[1rem] font-semibold text-[var(--color-text)]">Connected server</h3>
                <p className="mt-2 text-[0.875rem]">
                  Pull or build the image, configure <InlineCode>.env.production</InlineCode>, then start the stack with
                  Docker Compose. Put Nginx, Caddy, Traefik, or another reverse proxy in front when serving over HTTPS.
                </p>
              </div>
              <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <h3 className="text-[1rem] font-semibold text-[var(--color-text)]">Offline environment</h3>
                <p className="mt-2 text-[0.875rem]">
                  Transfer the release bundle and Docker image archive to the target machine, load the image with Docker,
                  configure local secrets, and run the same Compose stack without relying on external documentation services.
                </p>
              </div>
            </div>
          </DocsSection>

          <DocsSection id="prerequisites" eyebrow="Before install" title="Prerequisites">
            <p>Prepare these items before starting installation:</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {[
                "Docker",
                "Docker Compose",
                "A server, VM, or local machine",
                "PostgreSQL, either in Compose or external",
                "A release image or image archive",
                "Optional reverse proxy such as Nginx, Caddy, or Traefik",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <CodeBlock title="Minimum system requirements" code={minimumRequirements} />
          </DocsSection>

          <DocsSection id="installation" eyebrow="Docker Compose" title="Installation with Docker Compose">
            <p>
              Create a working folder for the release bundle. The current production package uses
              <InlineCode>docker-compose.prod.yml</InlineCode> and <InlineCode>.env.production</InlineCode> so Compose
              always receives the correct variables.
            </p>
            <CodeBlock title="Example folder structure" code={folderStructure} />
            <p>
              Copy .env.production.example to .env.production and replace every placeholder secret before first boot. 
              Production startup refuses checked-in database credentials, demo mode, header authentication, the default bootstrap admin password, and missing <InlineCode>FORENOTES_LLM_SECRET_KEY</InlineCode>.
            </p>
            <CodeBlock title="Start Forenotes" language="bash" code={startCommands} />
            <CodeBlock title="Compose Deployment" language="bash" code={startCommandsCompose} />
            <CodeBlock title="Restart or stop" language="bash" code={stopCommands} />
            
            <p>
              If your release ships with a prebuilt archive, load it with <InlineCode>docker load</InlineCode>. If your
              team builds images internally, tag the resulting app image as <InlineCode>forenotes-app:v1</InlineCode> or
              adjust the Compose image name consistently.
            </p>
          </DocsSection>

          <DocsSection id="first-time-setup" eyebrow="First run" title="First-time setup">
            <StepList
              steps={[
                "Open the application in a browser, usually http://localhost:3000 or http://SERVER_IP:3000.",
                "Log in with the bootstrap admin username and temporary password from .env.production.",
                "Change the default or temporary admin password when prompted.",
                "Review system settings and confirm secure cookie behavior matches your HTTPS setup.",
                "Configure LLM settings only if you plan to use AI-assisted report generation.",
                "Create the first case and invite the users who need access.",
              ]}
            />
            <div className="rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-primary-soft)] p-4 text-[0.875rem] text-[var(--color-text)]">
              <p>
                Bootstrap admin values are only used to create the first admin when no admin exists. They do not reset an
                existing account after the first user has been created.
              </p>
            </div>
          </DocsSection>

          <DocsSection id="core-concepts" eyebrow="Model" title="Core concepts">
            <p>
              These objects make up the Forenotes workspace. Feature availability can vary by release package or license tier.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {concepts.map(([name, description]) => (
                <div key={name} className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                  <h3 className="text-[1rem] font-semibold text-[var(--color-text)]">{name}</h3>
                  <p className="mt-2 text-[0.875rem]">{description}</p>
                </div>
              ))}
            </div>
          </DocsSection>

          <DocsSection id="usage-guide" eyebrow="Workflow" title="Usage guide">
            <p>
              A typical investigation starts with a case, narrows into one or more incidents, then collects findings,
              timeline events, tasks, notes, and reports as the response work develops.
            </p>
            <div className="space-y-4">
              {workflowSteps.map((workflow) => (
                <section key={workflow.title} className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                  <h3 className="text-[1.0625rem] font-semibold text-[var(--color-text)]">{workflow.title}</h3>
                  <div className="mt-4">
                    <StepList steps={workflow.steps} />
                  </div>
                  {workflow.note ? (
                    <p className="mt-4 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[rgba(255,255,255,0.03)] p-3 text-[0.875rem] text-[var(--color-text-muted)]">
                      {workflow.note}
                    </p>
                  ) : null}
                </section>
              ))}
            </div>
          </DocsSection>

          <DocsSection id="environment" eyebrow="Configuration" title="Environment variables reference">
            <p>
              These names are taken from the current v1 production release files. This release uses database-backed opaque
              session cookies, so <InlineCode>SESSION_SECRET</InlineCode> and <InlineCode>JWT_SECRET</InlineCode> are not
              used.
            </p>
            <DocsTable columns={["Variable", "Required", "Example", "Description"]} rows={envRows.map((row) => [<InlineCode key={row[0]}>{row[0]}</InlineCode>, row[1], row[2], row[3]])} />
          </DocsSection>

          <DocsSection id="updating" eyebrow="Maintenance" title="Updating Forenotes">
            <p>Back up PostgreSQL before upgrading. Then update the image and restart the stack.</p>
            <CodeBlock title="Registry-based update" language="bash" code={updateCommands} />
            <CodeBlock title="Archive-based update" language="bash" code={archiveUpdateCommands} />
            <p>
              If a release includes migrations, run the app with the same production environment. The production app
              startup path runs migrations, and release notes may provide an explicit migration command for controlled
              maintenance windows.
            </p>
          </DocsSection>

          <DocsSection id="backup-restore" eyebrow="Data safety" title="Backup and restore">
            <p>
              PostgreSQL stores the investigation data. Application uploads and generated artifacts are stored in the app
              data volume, so include both database and volume backup processes in production operations.
            </p>
            <CodeBlock title="PostgreSQL backup" language="bash" code={backupCommand} />
            <CodeBlock title="PostgreSQL restore" language="bash" code={restoreCommand} />
            <p>
              Stop app writes during backup or restore when possible. At minimum, avoid report generation and analyst
              editing while a restore is running.
            </p>
          </DocsSection>

          <DocsSection id="troubleshooting" eyebrow="Help" title="Troubleshooting">
            <div className="space-y-4">
              {troubleshooting.map((item) => (
                <section key={item.title} className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                  <h3 className="text-[1.0625rem] font-semibold text-[var(--color-text)]">{item.title}</h3>
                  <ul className="mt-4 space-y-2">
                    {item.checks.map((check) => (
                      <li key={check} className="flex items-start gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
                        <span>{check}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
            <CodeBlock title="Find the process using port 3000" language="bash" code="sudo lsof -i :3000" />
            <CodeBlock title="Use a different host port" language="yaml" code={'ports:\n  - "8080:3000"'} />
          </DocsSection>
        </DocsLayout>
      </main>
      <SiteFooter />
    </div>
  );
}
