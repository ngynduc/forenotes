import { Container } from "./Container";
import { Reveal } from "./RevealSection";

export function ProductSection() {
  return (
    <section id="product" className="py-20">
      <Container>
        <Reveal animation="fade-up">
          <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-[var(--color-primary)]">
            What is Forenotes
          </p>
          <h2 className="mt-3 max-w-[600px] text-[1.625rem] font-semibold leading-snug tracking-tight">
            A workspace for DFIR teams to turn scattered investigation work into structured case records.
          </h2>
          <p className="mt-4 max-w-[560px] text-[0.9375rem] leading-relaxed text-[var(--color-text-muted)]">
            Forenotes organizes incident response around cases and incidents. Each case holds findings, timeline events, indicators, tasks, and evidence&nbsp;&mdash; connected, searchable, and ready for reporting.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Cases", desc: "Top-level containers for investigations, scoped with membership and access control." },
            { label: "Incidents", desc: "Events within a case. Findings, timelines, tasks, and entities live here." },
            { label: "Findings", desc: "Structured observations with status, severity, and evidence context." },
          ].map((item, i) => (
            <Reveal key={item.label} animation="fade-scale" delay={i * 120}>
              <div className="glass glass-hover p-6">
                <p className="text-[0.9375rem] font-semibold">{item.label}</p>
                <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--color-text-muted)]">{item.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
