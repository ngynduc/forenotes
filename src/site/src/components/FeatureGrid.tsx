import { Container } from "./Container";
import { Reveal } from "./RevealSection";
import {
  FolderOpen,
  Clock,
  FileText,
  ListChecks,
  StickyNote,
  FileOutput,
  Users,
  Tag,
} from "lucide-react";

const features = [
  {
    icon: FolderOpen,
    title: "Case-oriented workspace",
    desc: "Organize work around cases and incidents, not loose documents.",
  },
  {
    icon: Clock,
    title: "Incident timeline",
    desc: "Chronological record of events, fully sequenced and searchable.",
  },
  {
    icon: FileText,
    title: "Findings and evidence context",
    desc: "Structured observations with status, severity, and linked evidence.",
  },
  {
    icon: ListChecks,
    title: "Task tracking",
    desc: "Assign and track tasks linked to cases and incidents.",
  },
  {
    icon: StickyNote,
    title: "Markdown notes",
    desc: "Write case and incident notes with full Markdown support.",
  },
  {
    icon: FileOutput,
    title: "Report generation",
    desc: "Generate structured Markdown and PDF reports from case data.",
  },
  {
    icon: Users,
    title: "Case membership and access control",
    desc: "Control access each case with membership-based permissions.",
  },
  {
    icon: Tag,
    title: "Tags and MITRE mapping",
    desc: "Tag entities with custom labels or built-in MITRE ATT&CK references.",
  },
];

export function FeatureGrid() {
  return (
    <section className="py-20">
      <Container>
        <Reveal animation="fade-up">
          <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-[var(--color-primary)]">
            Features
          </p>
          <h2 className="mt-3 text-[1.625rem] font-semibold leading-snug tracking-tight">
            Built for focused investigation work.
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {features.map((f, i) => (
            <Reveal key={f.title} animation="fade-scale" delay={i * 60}>
              <div className="glass glass-hover flex gap-4 p-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                  <f.icon size={18} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[0.9375rem] font-semibold">{f.title}</p>
                  <p className="mt-1 text-[0.8125rem] leading-relaxed text-[var(--color-text-muted)]">{f.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
