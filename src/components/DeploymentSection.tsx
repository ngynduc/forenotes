import { Container } from "./Container";
import { Reveal } from "./RevealSection";
import { ArrowRight, BookOpen, Shield, Server, FileCheck, Network } from "lucide-react";
import { Link } from "react-router";

const items = [
  { icon: Shield, label: "Self-hosted response workspaces" },
  { icon: Server, label: "Open-source case documentation" },
  { icon: FileCheck, label: "Report preparation" },
  { icon: Network, label: "Structured incident response" },
];

export function DeploymentSection() {
  return (
    <section className="py-20">
      <Container>
        <Reveal animation="fade-up">
          <div className="max-w-[560px]">
            <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-[var(--color-primary)]">
              Open source
            </p>
            <h2 className="mt-3 text-[1.375rem] font-semibold leading-snug tracking-tight sm:text-[1.625rem]">
              Built for self-hosted response workflows.
            </h2>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-[var(--color-text-muted)]">
              Run it as a practical internal workspace and keep the focus on investigation records, not generic project management noise or subscription mechanics.
            </p>
            <Link
              to="/docs"
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-5 text-[0.875rem] font-semibold text-[var(--color-bg)] transition-colors hover:bg-[var(--color-primary-strong)]"
            >
              <BookOpen size={16} aria-hidden="true" />
              Read the installation guide
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </Reveal>
        <Reveal animation="fade" delay={200}>
          <div className="mt-10 flex flex-wrap gap-3">
            {items.map((item) => (
              <div
                key={item.label}
                className="glass glass-hover flex w-full items-start gap-2.5 px-4 py-2.5 text-[0.875rem] text-[var(--color-text-muted)] sm:w-auto sm:items-center"
              >
                <item.icon size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-[var(--color-primary)] sm:mt-0" />
                <span className="leading-relaxed">{item.label}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
