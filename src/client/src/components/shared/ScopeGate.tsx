import { Link } from "react-router";

export function ScopeGate({ required }: { required: "case" | "incident" }) {
  const label = required === "case" ? "case" : "case or incident";

  return (
    <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <h3 className="text-lg font-semibold text-[var(--color-text)]">No {label} selected</h3>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">
        This page requires a {label} to be selected.{" "}
        <Link to="/cases" className="underline hover:text-[var(--color-text)]">
          Go to Cases
        </Link>{" "}
        to select or create a case, or ask an administrator for access.
      </p>
    </section>
  );
}
