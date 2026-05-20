import { useScopeStore } from "@/stores/scope-store";
import { useUsers } from "@/hooks/use-entities";
import { Select } from "@/components/ui/Select";

export default function SettingsPage() {
  const { activeUserId, setActiveUser } = useScopeStore();
  const { data } = useUsers();
  const users = data?.users ?? [];

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold">Settings</h2>
      <p className="mb-4 text-sm text-[var(--color-text-muted)]">Configure your session.</p>

      <div className="max-w-md space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Active User</label>
          <Select value={activeUserId} onChange={(e) => setActiveUser(e.target.value)}>
            <option value="">Select User</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {String(u.displayName ?? u.email)} ({String(u.globalRole ?? "user")})
              </option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
}
