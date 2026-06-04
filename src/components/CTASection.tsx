import { Github } from "lucide-react";
import { Container } from "./Container";
import { Reveal } from "./RevealSection";

const githubUrl = "https://github.com/ngynduc/forenotes";

export function CTASection() {
  return (
    <section className="py-20">
      <Container className="text-center">
        <Reveal animation="fade-scale">
          <h2 className="text-[1.625rem] font-semibold tracking-tight">
            Use it, improve it, keep it open.
          </h2>
          <p className="mx-auto mt-3 max-w-[420px] text-[0.9375rem] leading-relaxed text-[var(--color-text-muted)]">
            Forenotes is now open source. Read the docs, inspect the code, or support ongoing development through Ko-fi.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="/docs"
              className="inline-flex h-10 items-center rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-6 text-[0.875rem] font-medium text-[var(--color-bg)] transition-colors hover:bg-[var(--color-primary-strong)]"
            >
              Read docs
            </a>
            <a
              href="/donate"
              className="glass glass-hover inline-flex h-10 items-center rounded-[var(--radius-sm)] px-6 text-[0.875rem] font-medium text-[var(--color-text)] transition-colors"
            >
              Donate
            </a>
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="glass glass-hover inline-flex h-10 items-center gap-2 rounded-[var(--radius-sm)] px-6 text-[0.875rem] font-medium text-[var(--color-text)] transition-colors"
            >
              <Github size={16} aria-hidden="true" />
              View on GitHub
            </a>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
