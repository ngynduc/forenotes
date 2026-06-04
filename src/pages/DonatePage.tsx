import { Heart, Coffee, Code2, Github } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Container } from "@/components/Container";
import { Reveal } from "@/components/RevealSection";

const supportItems = [
  {
    icon: Code2,
    title: "Project maintenance",
    desc: "Donations help cover the time needed to maintain the project, review issues, and keep the app usable for responders.",
  },
  {
    icon: Coffee,
    title: "Ongoing improvements",
    desc: "Support goes toward focused improvements: deployment polish, docs, bug fixes, and investigation workflows.",
  },
  {
    icon: Github,
    title: "Open access",
    desc: "Forenotes is an open-source project. No pricing or subscription.",
  },
];

export function DonatePage() {
  return (
    <div className="landing-page">
      <SiteHeader />
      <main>
        <section className="py-24 sm:py-32">
          <Container>
            <Reveal animation="fade-up">
              <div className="mx-auto max-w-[720px] text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                  <Heart size={22} strokeWidth={1.7} />
                </div>
                <p className="mt-6 text-[0.6875rem] font-bold uppercase tracking-wider text-[var(--color-primary)]">
                  Donate
                </p>
                <h1 className="mt-3 text-[2.1rem] font-semibold leading-[1.12] tracking-tight sm:text-[2.75rem]">
                  Support Forenotes.
                </h1>
                <p className="mx-auto mt-5 max-w-[560px] text-[1.0625rem] leading-relaxed text-[var(--color-text-muted)]">
                  If the project helps your DFIR work, you can support ongoing development through Ko-fi.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <a
                    href="https://ko-fi.com/ducnta"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center rounded-[var(--radius-sm)] bg-[#00b9fe] px-6 text-[0.875rem] font-medium text-white transition-colors hover:bg-[#00a5e3]"
                  >
                    Support me on Ko-fi
                  </a>
                  <a
                    href="/docs"
                    className="glass glass-hover inline-flex h-10 items-center rounded-[var(--radius-sm)] px-6 text-[0.875rem] font-medium text-[var(--color-text)] transition-colors"
                  >
                    Read docs
                  </a>
                </div>
              </div>
            </Reveal>
            <div className="mt-14 grid gap-4 md:grid-cols-3">
              {supportItems.map((item, index) => (
                <Reveal key={item.title} animation="fade-scale" delay={index * 90}>
                  <div className="glass glass-hover h-full p-6">
                    <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                      <item.icon size={18} strokeWidth={1.6} />
                    </div>
                    <p className="mt-4 text-[0.9375rem] font-semibold">{item.title}</p>
                    <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--color-text-muted)]">
                      {item.desc}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
