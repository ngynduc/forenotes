import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/data-table/DataTable";
import { EntityModal } from "@/components/entity-modal/EntityModal";
import { Button } from "@/components/ui/Button";
import { LockedFeature } from "@/components/shared/LockedFeature";
import { Input } from "@/components/ui/Input";
import { useUsers } from "@/hooks/use-entities";
import { useLicense } from "@/hooks/use-license";
import { api } from "@/lib/api";
import { useScopeStore } from "@/stores/scope-store";
import { TABLE_DEFINITIONS } from "@/config/table-definitions";
import { getEntityDefinitions } from "@/config/entity-definitions";

const tableDef = TABLE_DEFINITIONS.users;

export default function AdminPage() {
  const { data, isLoading } = useUsers();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const license = useLicense();
  const definitions = getEntityDefinitions(() => useScopeStore.getState());
  const rows = (data?.users ?? []) as unknown as Record<string, unknown>[];
  const resetPassword = useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) =>
      api.resetUserPassword(userId, { newPassword: password, confirmPassword: password }),
    onSuccess: async () => {
      setTemporaryPassword("");
      setResetUserId(null);
      setResetMessage("Temporary password set. User must change it on next login.");
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => setResetMessage(error instanceof Error ? error.message : "Unable to reset password."),
  });

  if (license.isLoading) {
    return <p className="text-sm text-[var(--color-text-muted)]">Loading license...</p>;
  }

  if (!license.hasFeature("multi_user")) {
    return (
      <LockedFeature
        feature="multi_user"
        title="Multiple users require Forenotes Teams"
        description="Upgrade to Teams to create users, assign case members, and manage collaboration."
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{tableDef.title}</h2>
          <p className="text-sm text-[var(--color-text-muted)]">{tableDef.subtitle}</p>
        </div>
        {tableDef.createLabel && (
          <Button onClick={() => setModalOpen(true)}>
            {tableDef.createLabel}
          </Button>
        )}
      </div>
      {isLoading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading...</p>
      ) : (
        <DataTable
          columns={tableDef.columns}
          data={rows}
          emptyLabel={tableDef.emptyLabel}
          renderRowActions={(row) => (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setResetUserId(String(row.id ?? ""));
                setTemporaryPassword("");
                setResetMessage(null);
              }}
            >
              Reset Password
            </Button>
          )}
        />
      )}
      {resetUserId ? (
        <section className="mt-4 max-w-xl rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h3 className="text-sm font-semibold">Reset Password</h3>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">Set a temporary password. The user will be forced to change it.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Input
              className="min-w-64 flex-1"
              type="password"
              placeholder="Temporary password"
              value={temporaryPassword}
              onChange={(event) => setTemporaryPassword(event.target.value)}
            />
            <Button
              size="sm"
              onClick={() => resetPassword.mutate({ userId: resetUserId, password: temporaryPassword })}
              disabled={resetPassword.isPending || !temporaryPassword}
            >
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => setResetUserId(null)}>
              Cancel
            </Button>
          </div>
        </section>
      ) : null}
      {resetMessage ? <p className="mt-3 text-sm text-[var(--color-text-muted)]">{resetMessage}</p> : null}
      <EntityModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        definition={definitions.user}
        item={null}
        mode="create"
      />
    </div>
  );
}
