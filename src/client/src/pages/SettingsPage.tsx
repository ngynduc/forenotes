import { useEffect, useState } from "react";
import { CheckCircle2, KeyRound, LogOut, Plus, Save, ShieldCheck, Trash2, Wifi, XCircle } from "lucide-react";
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
import { useActivateLicense, useDeactivateLicense, useLicenseStatus } from "@/hooks/use-license";
import { useTimezone } from "@/providers/TimezoneProvider";
import type { FeatureKey, LicenseStatusResponse } from "@shared/license";

const LLM_PROVIDER_OPTIONS = [
  { value: "openai", label: "OpenAI", modelExample: "gpt-4o-mini" },
  { value: "anthropic", label: "Anthropic", modelExample: "claude-sonnet-4-5-20250929" },
  { value: "gemini", label: "Google Gemini", modelExample: "gemini-2.5-flash" },
  { value: "openrouter", label: "OpenRouter", modelExample: "openai/gpt-4.1-nano" },
  { value: "xai", label: "xAI", modelExample: "grok-4.1-fast-non-reasoning" },
  { value: "groq", label: "Groq", modelExample: "llama-3.3-70b-versatile" },
  { value: "zai", label: "Z.ai", modelExample: "glm-4.7" },
  { value: "ollama", label: "Ollama", modelExample: "llama3.1" },
  { value: "custom", label: "Custom / Any LiteLLM provider", modelExample: "deepseek/deepseek-v4-flash" }
] as const;

function messageFromError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

type LlmHeaderFormRow = {
  name: string;
  value: string;
};

type SettingsTab = "general" | "license";

function emptyHeaderRow(): LlmHeaderFormRow {
  return { name: "", value: "" };
}

function labelFromKey(value: string) {
  return value
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function formatLicenseDate(value?: string) {
  if (!value) return "Never";
  return new Date(value).toLocaleDateString();
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
  const licenseStatus = useLicenseStatus();
  const activateLicense = useActivateLicense();
  const deactivateLicense = useDeactivateLicense();
  const user = data?.user;
  const llmStatus = llmSettings.data;
  const [llmForm, setLlmForm] = useState({
    provider: "openai",
    model: "gpt-4o-mini",
    baseUrl: "",
    systemPrompt: "",
    apiKey: "",
    customHeaders: [emptyHeaderRow()] as LlmHeaderFormRow[],
  });
  const selectedProvider = LLM_PROVIDER_OPTIONS.find((option) => option.value === llmForm.provider) ?? LLM_PROVIDER_OPTIONS.at(-1)!;
  const providerSelectValue = LLM_PROVIDER_OPTIONS.some((option) => option.value === llmForm.provider) ? llmForm.provider : "custom";
  const [llmMessage, setLlmMessage] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [licenseKey, setLicenseKey] = useState("");
  const [licenseMessage, setLicenseMessage] = useState<string | null>(null);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("general");

  useEffect(() => {
    if (llmStatus?.model) {
      setLlmForm((value) => ({
        ...value,
        provider: llmStatus.provider || value.provider,
        model: llmStatus.model,
        baseUrl: "",
        systemPrompt: llmStatus.systemPrompt || ""
      }));
    }
  }, [llmStatus?.model, llmStatus?.provider, llmStatus?.systemPrompt]);

  function saveProviderSettings() {
    setLlmMessage(null);
    const customHeaders = llmForm.customHeaders
      .map((header) => ({ name: header.name.trim(), value: header.value }))
      .filter((header) => header.name || header.value);
    saveLlmSettings.mutate({
      provider: llmForm.provider,
      model: llmForm.model,
      baseUrl: llmForm.baseUrl.trim(),
      systemPrompt: llmForm.systemPrompt,
      apiKey: llmForm.apiKey,
      customHeaders,
    }, {
      onSuccess: () => {
        setLlmForm((value) => ({
          ...value,
          baseUrl: "",
          apiKey: "",
          customHeaders: [emptyHeaderRow()],
        }));
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
        setLlmForm({
          provider: "openai",
          model: "gpt-4o-mini",
          baseUrl: "",
          systemPrompt: "",
          apiKey: "",
          customHeaders: [emptyHeaderRow()],
        });
        setLlmMessage("User LLM settings removed. Reports will use .env fallback if configured.");
      },
      onError: (error) => setLlmMessage(messageFromError(error, "Unable to remove LLM settings.")),
    });
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

  function submitLicenseActivation() {
    setLicenseMessage(null);
    activateLicense.mutate(licenseKey.trim(), {
      onSuccess: (status) => {
        setLicenseKey("");
        setLicenseMessage(`Activated ${labelFromKey(status.tier)} license for ${status.customerName}.`);
      },
      onError: (error) => setLicenseMessage(messageFromError(error, "Unable to activate license.")),
    });
  }

  function submitLicenseDeactivation() {
    setLicenseMessage(null);
    deactivateLicense.mutate(undefined, {
      onSuccess: () => setLicenseMessage("License deactivated. Forenotes is running as Individual Free."),
      onError: (error) => setLicenseMessage(messageFromError(error, "Unable to deactivate license.")),
    });
  }

  function updateCustomHeader(index: number, key: keyof LlmHeaderFormRow, nextValue: string) {
    setLlmForm((value) => ({
      ...value,
      customHeaders: value.customHeaders.map((header, headerIndex) =>
        headerIndex === index ? { ...header, [key]: nextValue } : header
      ),
    }));
  }

  function addCustomHeader() {
    setLlmForm((value) => ({ ...value, customHeaders: [...value.customHeaders, emptyHeaderRow()] }));
  }

  function removeCustomHeader(index: number) {
    setLlmForm((value) => ({
      ...value,
      customHeaders: value.customHeaders.length === 1
        ? [emptyHeaderRow()]
        : value.customHeaders.filter((_, headerIndex) => headerIndex !== index),
    }));
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h2 className="mb-1 text-lg font-semibold">Settings</h2>
        <p className="text-sm text-[var(--color-text-muted)]">Configure your session and user-owned provider settings.</p>
      </div>

      <div role="tablist" aria-label="Settings sections" className="flex flex-wrap gap-2 border-b border-[var(--color-border)]">
        <button
          type="button"
          role="tab"
          aria-selected={settingsTab === "general"}
          onClick={() => setSettingsTab("general")}
          className={`border-b-2 px-3 py-2 text-sm font-medium ${settingsTab === "general" ? "border-[var(--color-primary)] text-[var(--color-primary)]" : "border-transparent text-[var(--color-text-muted)]"}`}
        >
          General
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={settingsTab === "license"}
          onClick={() => setSettingsTab("license")}
          className={`border-b-2 px-3 py-2 text-sm font-medium ${settingsTab === "license" ? "border-[var(--color-primary)] text-[var(--color-primary)]" : "border-transparent text-[var(--color-text-muted)]"}`}
        >
          License
        </button>
      </div>

      {settingsTab === "general" ? (
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
              <p className="text-xs text-[var(--color-text-muted)]">Choose a provider, or enter any LiteLLM provider name such as `nano-gpt`, then add the model name and API key.</p>
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
                Provider: {llmStatus.provider}. Source: {llmStatus.source}. API key: {llmStatus.apiKeyConfigured ? "configured and hidden" : "not configured"}.
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                System prompt: {llmStatus.systemPromptConfigured ? "customized" : "default service prompt"}.
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                API base: {llmStatus.endpointConfigured ? "configured" : "provider default or LiteLLM default"}.
                Custom headers: {llmStatus.customHeadersConfigured ? llmStatus.customHeaders.map((header) => header.name).join(", ") : "none"}.
              </p>
            </div>
          ) : (
            <div className="rounded border border-dashed border-[var(--color-border)] p-3 text-sm text-[var(--color-text-muted)]">
              Add user settings here or set `LITELLM_SERVICE_URL`, `LLM_PROVIDER`, `LLM_MODEL`, and `LLM_API_KEY` in `.env`.
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm font-medium">
              Provider
              <select
                value={providerSelectValue}
                onChange={(event) => {
                  const nextProvider = event.target.value;
                  setLlmForm((value) => ({
                    ...value,
                    provider: nextProvider === "custom"
                      ? (LLM_PROVIDER_OPTIONS.some((option) => option.value === value.provider) ? "" : value.provider)
                      : nextProvider
                  }));
                }}
                className="flex h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              >
                {LLM_PROVIDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {providerSelectValue === "custom" ? (
              <label className="space-y-1 text-sm font-medium">
                Custom provider
                <Input
                  value={llmForm.provider}
                  onChange={(event) => setLlmForm((value) => ({ ...value, provider: event.target.value }))}
                  placeholder="nano-gpt"
                />
              </label>
            ) : null}
            <label className="space-y-1 text-sm font-medium">
              Model
              <Input
                value={llmForm.model}
                onChange={(event) => setLlmForm((value) => ({ ...value, model: event.target.value }))}
                placeholder={selectedProvider.modelExample}
              />
            </label>
            <label className="space-y-1 text-sm font-medium md:col-span-2">
              API Key
              <Input
                type="password"
                value={llmForm.apiKey}
                onChange={(event) => setLlmForm((value) => ({ ...value, apiKey: event.target.value }))}
                placeholder={llmStatus?.configured ? "Stored key is hidden. Enter a new key to replace it." : "Provider API key"}
                autoComplete="new-password"
              />
            </label>
            <label className="space-y-1 text-sm font-medium md:col-span-2">
              API Base URL
              <Input
                value={llmForm.baseUrl}
                onChange={(event) => setLlmForm((value) => ({ ...value, baseUrl: event.target.value }))}
                placeholder="Optional override. Leave blank to use provider or LiteLLM defaults."
              />
            </label>
            <label className="space-y-1 text-sm font-medium md:col-span-2">
              System Prompt
              <textarea
                value={llmForm.systemPrompt}
                onChange={(event) => setLlmForm((value) => ({ ...value, systemPrompt: event.target.value }))}
                placeholder="Optional custom system prompt for report generation. Leave blank to use the default DFIR prompt."
                className="min-h-40 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              />
            </label>
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Custom Headers</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Optional headers forwarded to LiteLLM for this user configuration.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addCustomHeader}>
                  <Plus className="h-4 w-4" />
                  Add header
                </Button>
              </div>
              <div className="space-y-2">
                {llmForm.customHeaders.map((header, index) => (
                  <div key={`llm-header-${index}`} className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                    <Input
                      value={header.name}
                      onChange={(event) => updateCustomHeader(index, "name", event.target.value)}
                      placeholder="Header name"
                    />
                    <Input
                      value={header.value}
                      onChange={(event) => updateCustomHeader(index, "value", event.target.value)}
                      placeholder="Header value"
                    />
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeCustomHeader(index)} aria-label={`Remove header ${index + 1}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-xs text-[var(--color-text-muted)]">
            Example for NanoGPT: provider `nano-gpt`, model `deepseek/deepseek-v4-flash`.
          </p>

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
      ) : (
        <LicenseSettingsPanel
          status={licenseStatus.data}
          isLoading={licenseStatus.isLoading}
          licenseKey={licenseKey}
          licenseMessage={licenseMessage}
          onLicenseKeyChange={setLicenseKey}
          onActivate={submitLicenseActivation}
          onDeactivate={submitLicenseDeactivation}
          activating={activateLicense.isPending}
          deactivating={deactivateLicense.isPending}
        />
      )}
    </div>
  );
}

interface LicenseSettingsPanelProps {
  status?: LicenseStatusResponse;
  isLoading: boolean;
  licenseKey: string;
  licenseMessage: string | null;
  activating: boolean;
  deactivating: boolean;
  onLicenseKeyChange: (value: string) => void;
  onActivate: () => void;
  onDeactivate: () => void;
}

function LicenseSettingsPanel({
  status,
  isLoading,
  licenseKey,
  licenseMessage,
  activating,
  deactivating,
  onLicenseKeyChange,
  onActivate,
  onDeactivate,
}: LicenseSettingsPanelProps) {
  const features = status?.features ?? [];
  const statusLabel = status ? labelFromKey(status.status) : "Loading";
  const premiumFeatureLabels = features.map((feature: FeatureKey) => labelFromKey(feature));

  return (
    <section className="space-y-4 rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">License</h3>
          <p className="text-xs text-[var(--color-text-muted)]">Offline signed license status and activation.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-text-muted)]">
          {status?.status === "invalid" || status?.status === "expired" ? <XCircle className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
          {statusLabel}
        </span>
      </div>

      {isLoading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading license...</p>
      ) : status ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <LicenseMetric label="Tier" value={labelFromKey(status.tier)} />
          <LicenseMetric label="Customer" value={status.customerName} />
          <LicenseMetric label="Expiration" value={formatLicenseDate(status.expiresAt)} />
          <LicenseMetric label="Seats Used" value={`${status.usedSeats} / ${status.seats}`} />
        </div>
      ) : null}

      {status?.message ? (
        <p className="rounded border border-[var(--color-danger-soft)] bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {status.message}
        </p>
      ) : null}

      <div className="rounded border border-[var(--color-border)] bg-[var(--color-background)] p-3">
        <p className="mb-2 text-xs font-semibold uppercase text-[var(--color-text-muted)]">Enabled Features</p>
        {premiumFeatureLabels.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {premiumFeatureLabels.map((feature) => (
              <span key={feature} className="rounded-[var(--radius-sm)] bg-[var(--color-primary-soft)] px-2 py-1 text-xs font-medium text-[var(--color-primary-strong)]">
                {feature}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">No premium features enabled.</p>
        )}
      </div>

      <label className="space-y-1 text-sm font-medium">
        License key
        <textarea
          value={licenseKey}
          onChange={(event) => onLicenseKeyChange(event.target.value)}
          placeholder="FNLIC-v1.payload.signature"
          className="min-h-28 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 font-mono text-sm"
        />
      </label>

      {licenseMessage ? (
        <p className="rounded border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-muted)]">
          {licenseMessage}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={onActivate} disabled={!licenseKey.trim() || activating}>
          <KeyRound className="h-4 w-4" />
          {activating ? "Activating..." : "Activate license"}
        </Button>
        <Button type="button" variant="outline" onClick={onDeactivate} disabled={deactivating || status?.source !== "database"}>
          <Trash2 className="h-4 w-4" />
          {deactivating ? "Deactivating..." : "Deactivate"}
        </Button>
      </div>
    </section>
  );
}

function LicenseMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2">
      <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
