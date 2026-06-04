import { Link } from "react-router";
import { Container } from "./Container";

const githubUrl = "https://github.com/ngynduc/forenotes";

export function SiteFooter() {
  return (
    <footer>
      <Container className="py-12">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="text-sm font-semibold">Forenotes</p>
            <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--color-text-muted)]">
              Open-source case documentation and reporting for DFIR teams.
            </p>
          </div>
          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--color-text-soft)]">
              Project
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <Link to="/#product" className="text-[0.8125rem] text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                Features
              </Link>
              <Link to="/docs" className="text-[0.8125rem] text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                Docs
              </Link>
              <Link to="/donate" className="text-[0.8125rem] text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                Donate
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
              <a
                href={githubUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[0.8125rem] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                Source code
              </a>
              <span className="text-[0.8125rem] text-[var(--color-text-soft)]">Changelog (soon)</span>
              <a
                href="https://ko-fi.com/ducnta"
                target="_blank"
                rel="noreferrer"
                className="text-[0.8125rem] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                Ko-fi
              </a>
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
