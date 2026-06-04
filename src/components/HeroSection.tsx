import { Link } from "react-router";
import { Container } from "./Container";
import { GraphCanvas } from "./GraphCanvas";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pb-16 pt-24 sm:pt-32">
      <GraphCanvas />
      <Container className="relative z-10 text-center">
        <h1 className="mx-auto max-w-[680px] text-[2.25rem] font-semibold leading-[1.15] tracking-tight sm:text-[2.75rem]">
          Your DFIR workspace for clear notes, connected evidence, and faster reports.
        </h1>
        <p className="mx-auto mt-5 max-w-[560px] text-[1.0625rem] leading-relaxed text-[var(--color-text-muted)]">
          Keep incidents organized from first finding to final report, with a workspace built for investigators, responders, and security teams.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <a
            href="/docs"
            className="inline-flex h-10 items-center rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-6 text-[0.875rem] font-medium text-[var(--color-bg)] transition-colors hover:bg-[var(--color-primary-strong)]"
          >
            Read docs
          </a>
          <Link
            to="/donate"
            className="glass glass-hover inline-flex h-10 items-center rounded-[var(--radius-sm)] px-6 text-[0.875rem] font-medium text-[var(--color-text)] transition-colors"
          >
            Donate
          </Link>
        </div>
      </Container>
    </section>
  );
}
