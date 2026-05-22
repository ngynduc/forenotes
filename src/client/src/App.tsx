import { useEffect } from "react";
import { useRoutes } from "react-router";
import { routes } from "@/config/routes";
import { useCurrentUser } from "@/hooks/use-auth";
import { LoginPage } from "@/pages/LoginPage";
import { useScopeStore } from "@/stores/scope-store";

export default function App() {
  const element = useRoutes(routes);
  const { data, isLoading, refetch } = useCurrentUser();
  const setActiveUser = useScopeStore((s) => s.setActiveUser);
  const clearSessionScope = useScopeStore((s) => s.clearSessionScope);

  useEffect(() => {
    if (data?.user) {
      setActiveUser(data.user.id);
    }
  }, [data?.user, setActiveUser]);

  useEffect(() => {
    if (!isLoading && !data?.user) {
      clearSessionScope();
    }
  }, [clearSessionScope, data?.user, isLoading]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f6] text-sm text-[var(--color-text-muted)]">
        Loading session...
      </main>
    );
  }

  if (!data?.user) {
    return <LoginPage onLoginSuccess={() => void refetch()} />;
  }

  return element;
}
