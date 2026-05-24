import { Container } from "./Container";
import { Reveal } from "./RevealSection";
import { DemoGraph } from "./graph/DemoGraph";

export function RelationGraphSection() {
  return (
    <section className="py-20">
      <Container>
        <Reveal animation="fade-up">
          <div className="text-center">
            <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-[var(--color-primary)]">
              Relational graph
            </p>
            <h2 className="mt-3 text-[1.625rem] font-semibold leading-snug tracking-tight">
              Every entity connected. Every link traced.
            </h2>
            <p className="mx-auto mt-4 max-w-[560px] text-[0.9375rem] leading-relaxed text-[var(--color-text-muted)]">
              Cases, incidents, findings, indicators, accounts, systems, and evidence&nbsp;&mdash; linked together. Click any node to explore the relationship model.
            </p>
          </div>
        </Reveal>
        <Reveal animation="fade-scale" delay={200}>
          <div className="mt-10">
            <DemoGraph />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
