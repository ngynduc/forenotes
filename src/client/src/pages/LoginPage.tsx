import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useLogin } from "@/hooks/use-auth";

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const login = useLogin();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      await login.mutateAsync({ username, password });
      onLoginSuccess();
    } catch (err) {
      setError(getLoginErrorMessage(err));
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f6] px-4 py-10 text-[#17201d]">
      <section className="w-full max-w-[420px] rounded-[24px] border border-[#dfe5e1] bg-white p-6 shadow-[0_24px_60px_rgba(25,38,34,0.1)]">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#0f766e]">Forenotes</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-[#66716d]">
            Use your incident workspace credentials to continue.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="username">
              Username
            </label>
            <Input
              id="username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              disabled={login.isPending}
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="password">
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={login.isPending}
              required
            />
          </div>

          {error && (
            <p className="rounded-[12px] border border-[#f2c8c2] bg-[#fff1f0] px-3 py-2 text-sm text-[#b42318]">
              {error}
            </p>
          )}

          <Button type="submit" className="h-10 w-full active:scale-[0.96]" disabled={login.isPending}>
            {login.isPending ? "Signing in..." : "Login"}
          </Button>
        </form>

        <p className="mt-5 rounded-[14px] bg-[#f7f9f7] px-3 py-2 text-xs text-[#66716d]">
          Development seed users include <span className="font-mono text-[#40514d]">lead / lead123</span>.
        </p>
      </section>
    </main>
  );
}

function getLoginErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.toLowerCase().includes("disabled")) {
    return "Your account is disabled.";
  }
  if (message.toLowerCase().includes("invalid username or password")) {
    return "Invalid username or password.";
  }
  return "Unable to login. Please try again.";
}
