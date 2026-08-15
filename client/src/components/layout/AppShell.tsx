import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Receipt,
  Wallet,
  UserCog,
  Car,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
};

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "AGENT", "ACCOUNTANT"] },
  { to: "/customers", label: "Customers", icon: Users, roles: ["ADMIN", "AGENT", "ACCOUNTANT"] },
  { to: "/bookings", label: "Bookings", icon: CalendarCheck, roles: ["ADMIN", "AGENT", "ACCOUNTANT"] },
  { to: "/invoices", label: "Invoices", icon: Receipt, roles: ["ADMIN", "AGENT", "ACCOUNTANT"] },
  { to: "/finance", label: "Finance", icon: Wallet, roles: ["ADMIN", "ACCOUNTANT"] },
  { to: "/drivers", label: "Drivers", icon: UserCog, roles: ["ADMIN", "AGENT", "ACCOUNTANT"] },
  { to: "/fleet", label: "Fleet", icon: Car, roles: ["ADMIN", "AGENT", "ACCOUNTANT"] },
  { to: "/users", label: "Staff & Roles", icon: ShieldCheck, roles: ["ADMIN"] },
];

export function AppShell() {
  const { user, logout } = useAuth();
  if (!user) return null;

  const items = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-background">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-card">
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
            H
          </div>
          <span className="text-sm font-semibold">Hussain Travel</span>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  isActive && "bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <div className="mb-2 px-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.role}</p>
          </div>
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
