import { Container } from "./Container";
import { Reveal } from "./RevealSection";

export function ReportPreview() {
  return (
    <section className="py-20">
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal animation="fade-left">
            <div>
              <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-[var(--color-primary)]">
                Reports
              </p>
              <h2 className="mt-3 text-[1.625rem] font-semibold leading-snug tracking-tight">
                From investigation notes to clean reports.
              </h2>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-[var(--color-text-muted)]">
                Keep findings, timelines, and case context structured while preparing professional Markdown and PDF reports.
              </p>
            </div>
          </Reveal>
          <Reveal animation="fade-right" delay={200}>
            <div className="glass p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--color-text-soft)]">
                    Report
                  </p>
                  <p className="mt-1 text-[0.9375rem] font-semibold">Incident Response Summary</p>
                </div>
                <div className="border-t border-[var(--color-border)] pt-3">
                  <p className="text-[0.6875rem] font-semibold text-[var(--color-text-soft)]">Executive summary</p>
                  <p className="mt-1 text-[0.8125rem] leading-relaxed text-[var(--color-text-muted)]">
                    Investigation identified unauthorized access originating from compromised service account. Scope limited to internal network segment.
                  </p>
                </div>
                <div className="border-t border-[var(--color-border)] pt-3">
                  <p className="text-[0.6875rem] font-semibold text-[var(--color-text-soft)]">Findings</p>
                  <div className="mt-2 space-y-2">
                    {[
                      { title: "Lateral movement via RDP", status: "Confirmed", statusClass: "status-confirmed", severity: "High", severityClass: "severity-high" },
                      { title: "Credential dumping detected", status: "Confirmed", statusClass: "status-confirmed", severity: "Critical", severityClass: "severity-critical" },
                      { title: "Exfiltration attempt blocked", status: "Done", statusClass: "status-done", severity: "Medium", severityClass: "severity-medium" },
                    ].map((f) => (
                      <div key={f.title} className="glass flex items-center justify-between px-3 py-2">
                        <span className="text-[0.8125rem]">{f.title}</span>
                        <div className="flex items-center gap-2">
                          <span className={`severity-badge ${f.severityClass}`}>
                            {f.severity}
                          </span>
                          <span className={`status-badge ${f.statusClass}`}>
                            {f.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t border-[var(--color-border)] pt-3">
                  <p className="text-[0.6875rem] font-semibold text-[var(--color-text-soft)]">Timeline excerpt</p>
                  <div className="mt-2 space-y-1.5">
                    {[
                      { time: "2025-05-18 09:12", event: "Initial compromise detected" },
                      { time: "2025-05-18 11:30", event: "Lateral movement observed" },
                      { time: "2025-05-18 14:05", event: "Containment actions completed" },
                    ].map((t) => (
                      <div key={t.time} className="flex items-start gap-3 text-[0.8125rem]">
                        <span className="shrink-0 font-mono text-[0.75rem] text-[var(--color-text-soft)]">{t.time}</span>
                        <span className="text-[var(--color-text-muted)]">{t.event}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
