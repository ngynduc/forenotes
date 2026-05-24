import { Container } from "./Container";
import { Reveal } from "./RevealSection";

export function CTASection() {
  return (
    <section className="py-20">
      <Container className="text-center">
        <Reveal animation="fade-scale">
          <h2 className="text-[1.625rem] font-semibold tracking-tight">
            Start documenting with clarity.
          </h2>
          <p className="mx-auto mt-3 max-w-[420px] text-[0.9375rem] leading-relaxed text-[var(--color-text-muted)]">
            Less noise, more context. Forenotes keeps the focus on investigation records and clean reports.
          </p>
          <div className="mt-8">
            <a
              href="/app"
              className="inline-flex h-10 items-center rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-6 text-[0.875rem] font-medium text-[var(--color-bg)] transition-colors hover:bg-[var(--color-primary-strong)]"
            >
              Get started
            </a>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
