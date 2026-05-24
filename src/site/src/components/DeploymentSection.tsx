import { Container } from "./Container";
import { Reveal } from "./RevealSection";
import { Shield, Server, FileCheck, Network } from "lucide-react";

const items = [
  { icon: Shield, label: "Internal teams" },
  { icon: Server, label: "Case documentation" },
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
              Deployment
            </p>
            <h2 className="mt-3 text-[1.625rem] font-semibold leading-snug tracking-tight">
              Built for focused internal response workflows.
            </h2>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-[var(--color-text-muted)]">
              Start with a simple team deployment and keep the workspace focused on investigation records, not generic project management noise.
            </p>
          </div>
        </Reveal>
        <Reveal animation="fade" delay={200}>
          <div className="mt-10 flex flex-wrap gap-3">
            {items.map((item) => (
              <div key={item.label} className="glass glass-hover flex items-center gap-2.5 px-4 py-2.5 text-[0.875rem] text-[var(--color-text-muted)]">
                <item.icon size={16} strokeWidth={1.5} className="text-[var(--color-primary)]" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
