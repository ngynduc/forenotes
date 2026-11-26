import { Badge } from "@/components/ui/Badge";

interface InvestigationDetailsPanelProps {
  item: Record<string, unknown>;
  kind: "finding" | "timeline_event";
}

export function InvestigationDetailsPanel({ item, kind }: InvestigationDetailsPanelProps) {
  const evidenceLinks = Array.isArray(item.evidenceLinks) ? item.evidenceLinks as Array<Record<string, unknown>> : [];
  const creator = String(item.creatorDisplayName || item.creatorEmail || item.createdByUserId || "Unknown user");
  const owner = String(item.ownerDisplayName || item.ownerUserId || "Unassigned");

  return (
    <details open className="mb-4 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
      <summary className="cursor-pointer px-3 py-2 text-sm font-semibold">Investigation context</summary>
      <div className="grid gap-3 border-t border-[var(--color-border)] px-3 py-3 text-xs sm:grid-cols-2">
        <Detail label="Created by" value={creator} status={String(item.creatorStatus || "")} />
        <Detail label="Owner" value={owner} status={String(item.ownerStatus || "")} />
        <Detail label="Created" value={formatTimestamp(item.createdAt)} />
        <Detail label="Last updated" value={formatTimestamp(item.updatedAt)} />
        {kind === "timeline_event" ? (
          <>
            <Detail label="Event time" value={formatTimestamp(item.eventTime)} />
            <Detail label="Event role" value={String(item.eventRole || "primary")} />
            {item.primaryEventId ? (
              <Detail label="Primary event" value={String(item.primaryEventTitle || item.primaryEventId)} />
            ) : null}
            {item.rawEvidenceRef ? <Detail label="Evidence reference" value={String(item.rawEvidenceRef)} wide /> : null}
          </>
        ) : evidenceLinks.length ? (
          <div className="sm:col-span-2">
            <p className="font-medium text-[var(--color-text-muted)]">Evidence</p>
            <ul className="mt-1 space-y-1">
              {evidenceLinks.map((link) => (
                <li key={String(link.id)} className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5">
                  <span className="font-medium">{String(link.evidenceType || "Evidence").replaceAll("_", " ")}</span>
                  <span className="ml-2 font-mono text-[var(--color-text-muted)]">{String(link.evidenceId || "")}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <Detail label="Evidence" value="No evidence linked" wide />
        )}
      </div>
    </details>
  );
}

function Detail({ label, value, status, wide = false }: { label: string; value: string; status?: string; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <p className="font-medium text-[var(--color-text-muted)]">{label}</p>
      <div className="mt-0.5 flex min-w-0 items-center gap-2">
        <span className="break-words text-[var(--color-text)]">{value || "—"}</span>
        {status === "disabled" ? <Badge variant="secondary">Deactivated</Badge> : null}
      </div>
    </div>
  );
}

function formatTimestamp(value: unknown) {
  if (!value) return "—";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}
