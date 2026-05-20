import { Outlet, NavLink, useLocation } from "react-router";
import { useUIStore } from "@/stores/ui-store";
import { useScopeStore } from "@/stores/scope-store";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Briefcase,
  Search,
  Clock,
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
} from "lucide-react";
import { ContextBar } from "./ContextBar";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/cases", label: "Cases", icon: Briefcase },
  { to: "/findings", label: "Findings", icon: Search },
  { to: "/timeline", label: "Timeline", icon: Clock },
  { to: "/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/entities", label: "Entities", icon: Boxes },
  { to: "/queries", label: "Queries", icon: Code2 },
  { to: "/graph", label: "Graph", icon: Network },
  { to: "/tags", label: "Tags", icon: Tags },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/admin", label: "Admin", icon: Shield },
];

export function AppShell() {
  const expanded = useUIStore((s) => s.sidebarExpanded);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const flash = useUIStore((s) => s.flash);
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg)]">
      {/* Sidebar rail */}
      <aside
        className={cn(
          "flex flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-all duration-150",
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
          {NAV_ITEMS.map((item) => (
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
              <item.icon className="h-4 w-4 shrink-0" />
              {expanded && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-12 items-center border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4">
          <ContextBar />
        </header>

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
        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
