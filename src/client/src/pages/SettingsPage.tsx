import { useTimezone } from "@/providers/TimezoneProvider";
import { TimezonePicker } from "@/components/timezone/TimezonePicker";
import { useCurrentUser } from "@/hooks/use-auth";

export default function SettingsPage() {
  const { data } = useCurrentUser();
  const { timezone, setTimezone, options: timezoneOptions } = useTimezone();
  const user = data?.user;

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold">Settings</h2>
      <p className="mb-4 text-sm text-[var(--color-text-muted)]">Configure your session.</p>

      <div className="max-w-md space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Signed In User</label>
          <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm">
            <div className="font-medium">{user?.displayName ?? "Authenticated user"}</div>
            <div className="text-xs text-[var(--color-text-muted)]">
              {user?.username} {user?.globalRole ? `(${user.globalRole})` : ""}
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Timezone</label>
          <TimezonePicker value={timezone} onChange={setTimezone} options={timezoneOptions} />
        </div>
      </div>
    </div>
  );
}
