import { useState } from "react";
import { Link } from "react-router";
import { Menu, X } from "lucide-react";
import { Container } from "./Container";

const navLinks = [
  { label: "Product", href: "/#product" },
  { label: "Workflow", href: "/#workflow" },
  { label: "Docs", href: "/docs" },
];

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[rgba(10,15,14,0.7)] backdrop-blur-xl">
      <Container className="flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 text-sm font-semibold tracking-tight">
          <img
            src="/forenotes_logo_no_text.png"
            alt="Forenotes"
            className="h-20 w-auto"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <span>Forenotes</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="text-[0.8125rem] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
            >
              {link.label}
            </Link>
          ))}
          <a
            href="/app"
            className="inline-flex h-8 items-center rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 text-[0.8125rem] font-medium text-[var(--color-bg)] transition-colors hover:bg-[var(--color-primary-strong)]"
          >
            Get started
          </a>
        </nav>

        <button
          type="button"
          className="flex items-center justify-center text-[var(--color-text-muted)] md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </Container>

      {mobileOpen && (
        <nav className="border-t border-[var(--color-border)] bg-[rgba(10,15,14,0.9)] px-6 pb-4 backdrop-blur-xl md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="block py-2.5 text-[0.8125rem] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <a
            href="/app"
            className="mt-2 inline-flex h-8 items-center rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 text-[0.8125rem] font-medium text-[var(--color-bg)]"
          >
            Open app
          </a>
        </nav>
      )}
    </header>
  );
}
