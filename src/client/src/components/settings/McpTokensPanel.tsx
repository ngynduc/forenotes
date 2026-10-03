import { useState } from "react";
import { Bot, Check, Copy, KeyRound, ShieldOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCreateMcpToken, useMcpTokens, useRevokeMcpToken } from "@/hooks/use-investigation";

export function McpTokensPanel() {
  const tokens = useMcpTokens();
  const createToken = useCreateMcpToken();
  const revokeToken = useRevokeMcpToken();
  const [form, setForm] = useState({ label: "", scope: "read_only" as "read_only" | "read_write", expiresAt: "" });
  const [disclosedToken, setDisclosedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function submit() {
    createToken.mutate({
      label: form.label,
      scope: form.scope,
      expiresAt: form.expiresAt ? new Date(`${form.expiresAt}T23:59:59`).toISOString() : null
    }, {
      onSuccess: (result) => {
        setDisclosedToken(result.token);
        setForm({ label: "", scope: "read_only", expiresAt: "" });
      }
    });
  }

  async function copyToken() {
    if (!disclosedToken) return;
    await navigator.clipboard.writeText(disclosedToken);
    setCopied(true);
  }

  return (
    <section className="space-y-4 rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-4 lg:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold"><Bot className="h-4 w-4" /> MCP access tokens</h3>
          <p className="text-xs text-[var(--color-text-muted)]">Issue revocable agent credentials. Tokens inherit your live permissions and case access.</p>
        </div>
        <span className="rounded border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
          one-time disclosure
        </span>
      </div>

      {disclosedToken ? (
        <div className="border-l-4 border-[var(--color-warning)] bg-[var(--color-background)] p-3">
          <p className="text-xs font-semibold text-[var(--color-warning)]">Copy this token now. It cannot be shown again.</p>
          <div className="mt-2 flex gap-2">
            <code className="min-w-0 flex-1 overflow-x-auto rounded bg-[var(--color-surface-muted)] px-3 py-2 text-xs">{disclosedToken}</code>
            <Button size="sm" variant="outline" onClick={() => void copyToken()}>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy"}</Button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-2 md:grid-cols-[minmax(180px,1fr)_180px_170px_auto]">
        <Input value={form.label} onChange={(event) => setForm((value) => ({ ...value, label: event.target.value }))} placeholder="Agent label" />
        <select value={form.scope} onChange={(event) => setForm((value) => ({ ...value, scope: event.target.value as typeof value.scope }))} className="h-10 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm">
          <option value="read_only">Read only</option>
          <option value="read_write">Read and write</option>
        </select>
        <Input type="date" value={form.expiresAt} onChange={(event) => setForm((value) => ({ ...value, expiresAt: event.target.value }))} aria-label="Token expiry" />
        <Button onClick={submit} disabled={!form.label.trim() || createToken.isPending}><KeyRound className="h-4 w-4" /> Create token</Button>
      </div>

      {createToken.error ? <p className="text-sm text-[var(--color-danger)]">{createToken.error.message}</p> : null}
      {tokens.isLoading ? <p className="text-sm text-[var(--color-text-muted)]">Loading tokens…</p> : null}
      {!tokens.isLoading && !tokens.data?.tokens.length ? (
        <div className="rounded border border-dashed border-[var(--color-border)] p-4 text-sm text-[var(--color-text-muted)]">No MCP tokens. Create one when an agent needs access.</div>
      ) : null}
      <div className="divide-y divide-[var(--color-border)] rounded border border-[var(--color-border)]">
        {tokens.data?.tokens.map((token) => {
          const expired = new Date(token.expiresAt).getTime() <= Date.now();
          return (
          <div key={token.id} className="grid gap-2 p-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{token.label}</p>
              <p className="font-mono text-[11px] text-[var(--color-text-muted)]">{token.tokenPrefix}… · {token.scope === "read_write" ? "read/write" : "read only"}</p>
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">
              <p>Expires {new Date(token.expiresAt).toLocaleDateString()}</p>
              <p>{token.lastUsedAt ? `Last used ${new Date(token.lastUsedAt).toLocaleString()}` : "Never used"}</p>
            </div>
            {token.revokedAt ? (
              <span className="inline-flex items-center gap-1 text-xs text-[var(--color-danger)]"><ShieldOff className="h-3.5 w-3.5" /> Revoked</span>
            ) : expired ? (
              <span className="inline-flex items-center gap-1 text-xs text-[var(--color-danger)]"><ShieldOff className="h-3.5 w-3.5" /> Expired</span>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => revokeToken.mutate(token.id)} disabled={revokeToken.isPending}><Trash2 className="h-4 w-4" /> Revoke</Button>
            )}
          </div>
          );
        })}
      </div>
    </section>
  );
}
