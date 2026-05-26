import { useScopeStore } from "@/stores/scope-store";
import { useCases } from "@/hooks/use-cases";
import { useIncidents } from "@/hooks/use-incidents";
import { useTimezone } from "@/providers/TimezoneProvider";
import { TimezonePicker } from "@/components/timezone/TimezonePicker";
import { useCurrentUser } from "@/hooks/use-auth";

export function ContextBar() {
  const { selectedCaseId, selectedIncidentId, selectCase, selectIncident } = useScopeStore();
  const { data: casesData } = useCases();
  const { data: incidentsData } = useIncidents();
  const { timezone, setTimezone, options: timezoneOptions } = useTimezone();
  const { data: authData } = useCurrentUser();

  const cases = casesData?.cases ?? [];
  const incidents = incidentsData?.incidents ?? [];
  const user = authData?.user;

  return (
    <div className="flex w-full flex-wrap items-center gap-2 text-sm text-[var(--color-text-muted)]">
      <ContextField label="Current User">
        <span className="max-w-40 truncate rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-text)] sm:max-w-56">
          {user?.displayName ?? "Authenticated"}
        </span>
      </ContextField>

      <span className="hidden text-[var(--color-border)] sm:inline">|</span>

      <ContextField label="Case">
        <select
          value={selectedCaseId}
          onChange={(e) => selectCase(e.target.value)}
          className="min-w-32 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-text)]"
        >
          <option value="">Select Case</option>
          {cases.map((c) => (
            <option key={c.id} value={c.id}>
              {String(c.caseName ?? c.id)}
            </option>
          ))}
        </select>
      </ContextField>

      <span className="hidden text-[var(--color-border)] sm:inline">|</span>

      <ContextField label="Incident">
        <select
          value={selectedIncidentId}
          onChange={(e) => selectIncident(e.target.value)}
          disabled={!selectedCaseId}
          className="min-w-36 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="">Select Incident</option>
          {incidents.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
      </ContextField>

      <span className="hidden text-[var(--color-border)] sm:inline">|</span>

      <ContextField label="Timezone">
        <TimezonePicker
          value={timezone}
          onChange={setTimezone}
          options={timezoneOptions}
          compactOnSmall
          className="w-20 2xl:w-64"
        />
      </ContextField>
    </div>
  );
}

function ContextField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-2 whitespace-nowrap">
      <span>{label} :</span>
      {children}
    </label>
  );
}
