import { useScopeStore } from "@/stores/scope-store";
import { useCases } from "@/hooks/use-cases";
import { useIncidents } from "@/hooks/use-incidents";
import { useUsers } from "@/hooks/use-entities";
import { useTimezone } from "@/providers/TimezoneProvider";
import { TimezonePicker } from "@/components/timezone/TimezonePicker";

export function ContextBar() {
  const { selectedCaseId, selectedIncidentId, selectCase, selectIncident, activeUserId, setActiveUser } =
    useScopeStore();
  const { data: casesData } = useCases();
  const { data: usersData } = useUsers();
  const { data: incidentsData } = useIncidents();
  const { timezone, setTimezone, options: timezoneOptions } = useTimezone();

  const users = usersData?.users ?? [];
  const cases = casesData?.cases ?? [];
  const incidents = incidentsData?.incidents ?? [];

  return (
    <div className="flex w-full flex-wrap items-center gap-2 text-sm text-[var(--color-text-muted)]">
      <ContextField label="Current User">
        <select
          value={activeUserId}
          onChange={(e) => setActiveUser(e.target.value)}
          className="min-w-40 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-text)]"
        >
          <option value="">Select User</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {String(user.displayName ?? user.email)} ({String(user.globalRole ?? "user")})
            </option>
          ))}
        </select>
      </ContextField>

      <span className="text-[var(--color-border)]">|</span>

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

      <span className="text-[var(--color-border)]">|</span>

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

      <span className="text-[var(--color-border)]">|</span>

      <ContextField label="Timezone">
        <TimezonePicker
          value={timezone}
          onChange={setTimezone}
          options={timezoneOptions}
          className="min-w-64"
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
