import { useEffect, useState } from "react";
import { CheckCircle2, LogOut, Save, Trash2, Wifi } from "lucide-react";
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
    provider: "openai",
    model: "gpt-4o-mini",
    systemPrompt: "",
    apiKey: "",
  });
  const selectedProvider = LLM_PROVIDER_OPTIONS.find((option) => option.value === llmForm.provider) ?? LLM_PROVIDER_OPTIONS.at(-1)!;
  const providerSelectValue = LLM_PROVIDER_OPTIONS.some((option) => option.value === llmForm.provider) ? llmForm.provider : "custom";
  const [llmMessage, setLlmMessage] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  useEffect(() => {
    if (llmStatus?.model) {
      setLlmForm((value) => ({
        ...value,
        provider: llmStatus.provider || value.provider,
        model: llmStatus.model,
        systemPrompt: llmStatus.systemPrompt || ""
      }));
    }
  }, [llmStatus?.model, llmStatus?.provider, llmStatus?.systemPrompt]);

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
        setLlmForm({
          provider: "openai",
          model: "gpt-4o-mini",
          systemPrompt: "",
          apiKey: "",
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
              System Prompt
              <textarea
                value={llmForm.systemPrompt}
                onChange={(event) => setLlmForm((value) => ({ ...value, systemPrompt: event.target.value }))}
                placeholder="Optional custom system prompt for report generation. Leave blank to use the default DFIR prompt."
                className="min-h-40 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              />
            </label>
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
    </div>
  );
}
