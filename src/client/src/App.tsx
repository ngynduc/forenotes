import { useEffect } from "react";
import { Navigate, useLocation, useNavigate, useRoutes } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { clearClientSession, SESSION_ENDED_EVENT } from "@/lib/session-state";
import { routes } from "@/config/routes";
import { useCurrentUser } from "@/hooks/use-auth";
import { LoginPage } from "@/pages/LoginPage";
import { useScopeStore } from "@/stores/scope-store";

export default function App() {
  const element = useRoutes(routes);
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useCurrentUser();
  const setActiveUser = useScopeStore((s) => s.setActiveUser);
  const clearSessionScope = useScopeStore((s) => s.clearSessionScope);

  useEffect(() => {
    const endSession = () => {
      clearClientSession(queryClient);
      navigate("/login", { replace: true });
      void api.logout().catch(() => undefined);
    };
    window.addEventListener(SESSION_ENDED_EVENT, endSession);
    return () => window.removeEventListener(SESSION_ENDED_EVENT, endSession);
  }, [navigate, queryClient]);

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
      <main className="night-ops-shell flex min-h-screen items-center justify-center bg-[var(--color-bg)] text-sm text-[var(--color-text-muted)]">
        Loading session...
      </main>
    );
  }

  if (isError || !data?.user) {
    return <LoginPage onLoginSuccess={() => { void refetch(); navigate("/", { replace: true }); }} />;
  }

  if (data.user.mustChangePassword && location.pathname !== "/settings") {
    return <Navigate to="/settings" replace />;
  }

  if (location.pathname === "/login") return <Navigate to="/" replace />;

  return element;
}
