import { Outlet, NavLink } from "react-router";
import { useUIStore } from "@/stores/ui-store";
import { useScopeStore } from "@/stores/scope-store";
import { usePermissions } from "@/hooks/use-auth";
import { useNotificationStream, useNotifications } from "@/hooks/use-entities";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Briefcase,
  Search,
  Clock,
  FileText,
  CheckSquare,
  Boxes,
  Code2,
  Network,
  Tags,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { ContextBar } from "./ContextBar";

const NAV_ITEMS: Array<{ to: string; label: string; icon: LucideIcon; permission?: string }> = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/cases", label: "Cases", icon: Briefcase },
  { to: "/findings", label: "Findings", icon: Search },
  { to: "/timeline", label: "Timeline", icon: Clock },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/entities", label: "Entities", icon: Boxes },
  { to: "/queries", label: "Queries", icon: Code2 },
  { to: "/graph", label: "Graph", icon: Network },
  { to: "/tags", label: "Tags", icon: Tags },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/admin", label: "Admin", icon: Shield, permission: "user:manage" },
];

export function AppShell() {
  const expanded = useUIStore((s) => s.sidebarExpanded);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const flash = useUIStore((s) => s.flash);
  useNotificationStream();
  const { can } = usePermissions();
  const { data: notificationsData } = useNotifications();
  const unreadNotifications = notificationsData?.notifications.filter((notification) => notification.unseen).length ?? 0;
  const unreadLabel = unreadNotifications > 99 ? "99+" : String(unreadNotifications);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg)]">
      {/* Sidebar rail */}
      <aside
        className={cn(
          "hidden flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-all duration-150 md:flex",
          expanded ? "w-52" : "w-14"
        )}
      >
        <div className="flex h-12 items-center justify-between border-b border-[var(--color-border)] px-3">
          {expanded && <span className="text-sm font-bold tracking-tight">Forenotes</span>}
          <button
            onClick={toggleSidebar}
            className="rounded p-1 hover:bg-[var(--color-surface-muted)]"
          >
            {expanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV_ITEMS.filter((item) => can(item.permission)).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)] font-medium"
                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
                )
              }
            >
              <span className="relative inline-flex shrink-0">
                <item.icon className="h-4 w-4" />
                {!expanded && item.to === "/notifications" && unreadNotifications > 0 && (
                  <span className="absolute -right-2 -top-2 rounded bg-[var(--color-danger)] px-1 text-[10px] font-bold leading-4 text-white">
                    {unreadLabel}
                  </span>
                )}
              </span>
              {expanded && <span>{item.label}</span>}
              {expanded && item.to === "/notifications" && unreadNotifications > 0 && (
                <span className="ml-auto rounded bg-[var(--color-danger)] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                  {unreadLabel}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex min-h-12 items-center border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 sm:px-4">
          <ContextBar />
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-2 md:hidden" aria-label="Primary navigation">
          {NAV_ITEMS.filter((item) => can(item.permission)).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-muted)]",
                  isActive
                    ? "bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]"
                    : "hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
                )
              }
              title={item.label}
              aria-label={item.label}
            >
              <item.icon className="h-4 w-4" />
              {item.to === "/notifications" && unreadNotifications > 0 && (
                <span className="absolute right-0.5 top-0.5 rounded bg-[var(--color-danger)] px-1 text-[10px] font-bold leading-4 text-white">
                  {unreadLabel}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Flash message */}
        {flash && (
          <div
            className={cn(
              "px-4 py-2 text-sm",
              flash.kind === "success" && "bg-[var(--color-success-soft)] text-[var(--color-primary-strong)]",
              flash.kind === "error" && "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
              flash.kind === "info" && "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
            )}
          >
            {flash.message}
          </div>
        )}

        {/* Content */}
        <main className="min-w-0 flex-1 overflow-y-auto p-3 sm:p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
