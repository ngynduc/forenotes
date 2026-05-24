import { lazy, Suspense } from "react";
import type { RouteObject } from "react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

function LazyPage({ Component }: { Component: React.LazyExoticComponent<() => React.ReactElement> }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<p className="py-8 text-center text-sm text-[var(--color-text-muted)]">Loading...</p>}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  );
}

const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const CasesPage = lazy(() => import("@/pages/CasesPage"));
const FindingsPage = lazy(() => import("@/pages/FindingsPage"));
const TimelinePage = lazy(() => import("@/pages/TimelinePage"));
const ReportsPage = lazy(() => import("@/pages/ReportsPage"));
const TasksPage = lazy(() => import("@/pages/TasksPage"));
const EntitiesPage = lazy(() => import("@/pages/EntitiesPage"));
const QueriesPage = lazy(() => import("@/pages/QueriesPage"));
const GraphPage = lazy(() => import("@/pages/GraphPage"));
const TagsPage = lazy(() => import("@/pages/TagsPage"));
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage"));
const AuditPage = lazy(() => import("@/pages/AuditPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <LazyPage Component={DashboardPage} /> },
      { path: "cases", element: <LazyPage Component={CasesPage} /> },
      { path: "findings", element: <LazyPage Component={FindingsPage} /> },
      { path: "timeline", element: <LazyPage Component={TimelinePage} /> },
      { path: "reports", element: <LazyPage Component={ReportsPage} /> },
      { path: "tasks", element: <LazyPage Component={TasksPage} /> },
      { path: "entities", element: <LazyPage Component={EntitiesPage} /> },
      { path: "queries", element: <LazyPage Component={QueriesPage} /> },
      { path: "graph", element: <LazyPage Component={GraphPage} /> },
      { path: "tags", element: <LazyPage Component={TagsPage} /> },
      { path: "notifications", element: <LazyPage Component={NotificationsPage} /> },
      { path: "audit", element: <LazyPage Component={AuditPage} /> },
      { path: "settings", element: <LazyPage Component={SettingsPage} /> },
      { path: "admin", element: <LazyPage Component={AdminPage} /> },
    ],
  },
];
