import { Link } from "react-router";
import { Container } from "./Container";

export function SiteFooter() {
  return (
    <footer>
      <Container className="py-12">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="text-sm font-semibold">Forenotes</p>
            <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--color-text-muted)]">
              Case documentation and reporting for DFIR teams.
            </p>
          </div>
          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--color-text-soft)]">
              Product
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <Link to="/#product" className="text-[0.8125rem] text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                Features
              </Link>
              <Link to="/#workflow" className="text-[0.8125rem] text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                Workflow
              </Link>
              <Link to="/docs" className="text-[0.8125rem] text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                Docs
              </Link>
            </div>
          </div>
          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--color-text-soft)]">
              Resources
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <Link to="/docs" className="text-[0.8125rem] text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                Documentation
              </Link>
              <span className="text-[0.8125rem] text-[var(--color-text-soft)]">Changelog (soon)</span>
              <span className="text-[0.8125rem] text-[var(--color-text-soft)]">Pricing (soon)</span>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-[var(--color-border)] pt-6 text-[0.75rem] text-[var(--color-text-soft)]">
          &copy; {new Date().getFullYear()} Forenotes
        </div>
      </Container>
    </footer>
  );
}
