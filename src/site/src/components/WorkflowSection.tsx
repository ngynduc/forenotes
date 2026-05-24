import { useRef, useEffect, useState } from "react";
import { Container } from "./Container";

const steps = [
  { num: "01", label: "Create a case", desc: "Start an investigation container." },
  { num: "02", label: "Add incidents", desc: "Define events within the case." },
  { num: "03", label: "Record findings", desc: "Document observations with context." },
  { num: "04", label: "Build the timeline", desc: "Sequence events chronologically." },
  { num: "05", label: "Assign tasks", desc: "Track work across the team." },
  { num: "06", label: "Generate reports", desc: "Export structured Markdown or PDF." },
];

const STEP_DELAY = 300;

export function WorkflowSection() {
  const triggerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(-1);

  useEffect(() => {
    const el = triggerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.unobserve(el);
          for (let i = 0; i <= steps.length; i++) {
            setTimeout(() => setActiveStep(i), i * STEP_DELAY);
          }
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="workflow" className="py-20">
      <Container>
        <div ref={triggerRef}>
          <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-[var(--color-primary)]">
            Workflow
          </p>
          <h2 className="mt-3 text-[1.625rem] font-semibold leading-snug tracking-tight">
            From first alert to finished report.
          </h2>
          <p className="mt-4 max-w-[520px] text-[0.9375rem] leading-relaxed text-[var(--color-text-muted)]">
            A clear, repeatable process for documenting incident response work.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, i) => (
            <article
              key={step.num}
              className={`glass glass-hover p-5 transition-[opacity,transform] duration-500 ease-out ${
                activeStep >= i ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              }`}
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-primary)] text-[0.6875rem] font-bold text-[var(--color-primary)]">
                {step.num}
              </span>
              <p className="mt-2 text-[0.9375rem] font-semibold">{step.label}</p>
              <p className="mt-1 text-[0.8125rem] leading-relaxed text-[var(--color-text-muted)]">
                {step.desc}
              </p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
