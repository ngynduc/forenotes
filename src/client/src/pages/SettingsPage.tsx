import { useEffect, useState } from "react";
import { CheckCircle2, LogOut, Plus, Save, Trash2, Wifi } from "lucide-react";
import { TimezonePicker } from "@/components/timezone/TimezonePicker";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  useDeleteLlmSettings,
  useLlmSettings,
  useSaveLlmSettings,
  useTestLlmSettings,
} from "@/hooks/use-entities";
import { useChangePassword, useCurrentUser, useLogout } from "@/hooks/use-auth";
import { useTimezone } from "@/providers/TimezoneProvider";

function messageFromError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function SettingsPage() {
  const { data } = useCurrentUser();
  const { timezone, setTimezone, options: timezoneOptions } = useTimezone();
  const llmSettings = useLlmSettings();
  const saveLlmSettings = useSaveLlmSettings();
  const deleteLlmSettings = useDeleteLlmSettings();
  const testLlmSettings = useTestLlmSettings();
  const changePassword = useChangePassword();
  const logout = useLogout();
  const user = data?.user;
  const llmStatus = llmSettings.data;
  const [llmForm, setLlmForm] = useState({
    provider: "litellm",
    baseUrl: "",
    model: "gpt-4o-mini",
    apiKey: "",
    customHeaders: [] as Array<{ name: string; value: string }>,
  });
  const [llmMessage, setLlmMessage] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  useEffect(() => {
    if (llmStatus?.model) {
      setLlmForm((value) => ({ ...value, provider: llmStatus.provider || value.provider, model: llmStatus.model }));
    }
  }, [llmStatus?.model, llmStatus?.provider]);

  function saveProviderSettings() {
    setLlmMessage(null);
    saveLlmSettings.mutate(llmForm, {
      onSuccess: () => {
        setLlmForm((value) => ({ ...value, apiKey: "" }));
        setLlmMessage("LLM settings saved. API key is stored server-side and remains hidden.");
      },
      onError: (error) => setLlmMessage(messageFromError(error, "Unable to save LLM settings.")),
    });
  }

  function testProviderConnection() {
    setLlmMessage(null);
    testLlmSettings.mutate(undefined, {
      onSuccess: (result) => {
        setLlmMessage(
          result.ok
            ? `Connection test passed using ${result.source ?? "configured"} model ${result.model ?? ""}`.trim()
            : result.error ?? "LLM provider connection failed"
        );
      },
      onError: (error) => setLlmMessage(messageFromError(error, "LLM provider connection failed.")),
    });
  }

  function resetProviderSettings() {
    setLlmMessage(null);
    deleteLlmSettings.mutate(undefined, {
      onSuccess: () => {
        setLlmForm((value) => ({ ...value, apiKey: "" }));
        setLlmMessage("User LLM settings removed. Reports will use .env fallback if configured.");
      },
      onError: (error) => setLlmMessage(messageFromError(error, "Unable to remove LLM settings.")),
    });
  }

  function addHeaderRow() {
    setLlmForm((value) => ({
      ...value,
      customHeaders: [...value.customHeaders, { name: "", value: "" }],
    }));
  }

  function updateHeaderRow(index: number, field: "name" | "value", nextValue: string) {
    setLlmForm((value) => ({
      ...value,
      customHeaders: value.customHeaders.map((header, currentIndex) =>
        currentIndex === index ? { ...header, [field]: nextValue } : header
      ),
    }));
  }

  function removeHeaderRow(index: number) {
    setLlmForm((value) => ({
      ...value,
      customHeaders: value.customHeaders.filter((_header, currentIndex) => currentIndex !== index),
    }));
  }

  function submitPasswordChange() {
    setPasswordMessage(null);
    changePassword.mutate(passwordForm, {
      onSuccess: () => {
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setPasswordMessage("Password changed.");
      },
      onError: (error) => setPasswordMessage(messageFromError(error, "Unable to change password.")),
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h2 className="mb-1 text-lg font-semibold">Settings</h2>
        <p className="text-sm text-[var(--color-text-muted)]">Configure your session and user-owned provider settings.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
        <section className="space-y-4 rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div>
            <h3 className="text-sm font-semibold">User Session</h3>
            <p className="text-xs text-[var(--color-text-muted)]">Identity and local display preferences.</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Signed In User</label>
            <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm">
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

          <div className="border-t border-[var(--color-border)] pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              <LogOut className="h-4 w-4" />
              {logout.isPending ? "Logging out..." : "Log Out"}
            </Button>
          </div>

          <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
            <div>
              <h4 className="text-sm font-semibold">Password</h4>
              <p className="text-xs text-[var(--color-text-muted)]">
                {user?.mustChangePassword ? "Password rotation is required before normal workspace use." : "Change your account password."}
              </p>
            </div>
            <Input
              type="password"
              placeholder="Current password"
              value={passwordForm.currentPassword}
              onChange={(event) => setPasswordForm((value) => ({ ...value, currentPassword: event.target.value }))}
            />
            <Input
              type="password"
              placeholder="New password"
              value={passwordForm.newPassword}
              onChange={(event) => setPasswordForm((value) => ({ ...value, newPassword: event.target.value }))}
            />
            <Input
              type="password"
              placeholder="Confirm new password"
              value={passwordForm.confirmPassword}
              onChange={(event) => setPasswordForm((value) => ({ ...value, confirmPassword: event.target.value }))}
            />
            {passwordMessage ? <p className="text-xs text-[var(--color-text-muted)]">{passwordMessage}</p> : null}
            <Button size="sm" onClick={submitPasswordChange} disabled={changePassword.isPending}>
              {changePassword.isPending ? "Saving..." : "Change Password"}
            </Button>
          </div>
        </section>

        <section className="space-y-4 rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">LLM Provider</h3>
              <p className="text-xs text-[var(--color-text-muted)]">Passed to the LiteLLM report service when provider-assisted generation is enabled.</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-text-muted)]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {llmStatus?.configured ? `Configured via ${llmStatus.source}` : "Not configured"}
            </span>
          </div>

          {llmStatus?.configured ? (
            <div className="rounded border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm">
              <p className="font-medium">Configured model: {llmStatus.model}</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Provider: {llmStatus.provider}. Source: {llmStatus.source}. Endpoint {llmStatus.endpointConfigured ? "is configured" : "uses the provider default"}.
                API key: {llmStatus.apiKeyConfigured ? "configured and hidden" : "not configured"}.
              </p>
              {llmStatus.customHeaders.length ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {llmStatus.customHeaders.map((header) => (
                    <span key={header.name} className="rounded border border-[var(--color-border)] px-2 py-1 text-xs">
                      {header.name}: configured
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded border border-dashed border-[var(--color-border)] p-3 text-sm text-[var(--color-text-muted)]">
              Add user settings here or set `LITELLM_SERVICE_URL`, `LLM_MODEL`, and optional provider credentials in `.env`.
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm font-medium">
              Provider name
              <Input
                value={llmForm.provider}
                onChange={(event) => setLlmForm((value) => ({ ...value, provider: event.target.value }))}
                placeholder="litellm"
              />
            </label>
            <label className="space-y-1 text-sm font-medium">
              Model
              <Input
                value={llmForm.model}
                onChange={(event) => setLlmForm((value) => ({ ...value, model: event.target.value }))}
                placeholder="openai/gpt-4o-mini"
              />
            </label>
            <label className="space-y-1 text-sm font-medium md:col-span-2">
              Provider API base / Endpoint
              <Input
                value={llmForm.baseUrl}
                onChange={(event) => setLlmForm((value) => ({ ...value, baseUrl: event.target.value }))}
                placeholder="https://api.openai.com/v1"
              />
            </label>
            <label className="space-y-1 text-sm font-medium md:col-span-2">
              API Key
              <Input
                type="password"
                value={llmForm.apiKey}
                onChange={(event) => setLlmForm((value) => ({ ...value, apiKey: event.target.value }))}
                placeholder={llmStatus?.configured ? "Stored key is hidden. Enter a new key to replace it." : "Optional LiteLLM proxy key"}
                autoComplete="new-password"
              />
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm font-medium">Custom Headers</label>
              <Button type="button" variant="outline" size="sm" onClick={addHeaderRow}>
                <Plus className="h-4 w-4" />
                Add Header
              </Button>
            </div>
            <div className="space-y-2">
              {llmForm.customHeaders.map((header, index) => (
                <div key={`${index}-${header.name}`} className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <Input
                    value={header.name}
                    onChange={(event) => updateHeaderRow(index, "name", event.target.value)}
                    placeholder="Header Name"
                    aria-label="Header Name"
                  />
                  <Input
                    type="password"
                    value={header.value}
                    onChange={(event) => updateHeaderRow(index, "value", event.target.value)}
                    placeholder="Header Value"
                    aria-label="Header Value"
                    autoComplete="new-password"
                  />
                  <Button type="button" variant="ghost" size="icon" title="Remove header" onClick={() => removeHeaderRow(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {llmForm.customHeaders.length === 0 ? (
                <p className="rounded border border-dashed border-[var(--color-border)] p-3 text-xs text-[var(--color-text-muted)]">
                  Add provider headers such as HTTP-Referer, X-Title, or anthropic-version. Values are stored server-side and masked after save.
                </p>
              ) : null}
            </div>
          </div>

          {llmMessage ? (
            <p className="rounded border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-muted)]">
              {llmMessage}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={testProviderConnection}
              disabled={testLlmSettings.isPending}
              variant="outline"
            >
              <Wifi className="h-4 w-4" />
              Test connection
            </Button>
            <Button
              type="button"
              onClick={saveProviderSettings}
              disabled={!llmForm.provider || !llmForm.model || saveLlmSettings.isPending}
            >
              <Save className="h-4 w-4" />
              Save settings
            </Button>
            <Button
              type="button"
              onClick={resetProviderSettings}
              disabled={deleteLlmSettings.isPending}
              variant="ghost"
            >
              <Trash2 className="h-4 w-4" />
              Delete settings
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
