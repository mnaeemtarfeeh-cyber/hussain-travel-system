import * as React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
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

type NavSection = {
  group?: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "AGENT", "ACCOUNTANT"] }],
  },
  {
    group: "Operations",
    items: [
      { to: "/customers", label: "Customers", icon: Users, roles: ["ADMIN", "AGENT", "ACCOUNTANT"] },
      { to: "/bookings", label: "Bookings", icon: CalendarCheck, roles: ["ADMIN", "AGENT", "ACCOUNTANT"] },
      { to: "/drivers", label: "Drivers", icon: UserCog, roles: ["ADMIN", "AGENT", "ACCOUNTANT"] },
      { to: "/fleet", label: "Fleet", icon: Car, roles: ["ADMIN", "AGENT", "ACCOUNTANT"] },
    ],
  },
  {
    group: "Finance",
    items: [
      { to: "/invoices", label: "Invoices", icon: Receipt, roles: ["ADMIN", "AGENT", "ACCOUNTANT"] },
      { to: "/finance", label: "Finance", icon: Wallet, roles: ["ADMIN", "ACCOUNTANT"] },
    ],
  },
  {
    group: "Administration",
    items: [{ to: "/users", label: "Staff & Roles", icon: ShieldCheck, roles: ["ADMIN"] }],
  },
];

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Dashboard", subtitle: "Income, expenses, and today's operations at a glance." },
  "/customers": { title: "Customers", subtitle: "Everyone who has booked, or might book, with you." },
  "/bookings": { title: "Bookings", subtitle: "Track every trip from request through completion." },
  "/invoices": { title: "Invoices", subtitle: "Bill customers and track what's been paid." },
  "/finance": { title: "Finance", subtitle: "Income and expenses across the business." },
  "/drivers": { title: "Drivers", subtitle: "Your driving staff and their availability." },
  "/fleet": { title: "Fleet", subtitle: "Vehicles in service, maintenance, and out of service." },
  "/users": { title: "Staff & Roles", subtitle: "Manage who can access the system, and what they can do." },
};

function HeaderClock() {
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  const formatted = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);
  return (
    <div className="rounded-lg border border-border bg-cream px-3 py-2 text-xs font-semibold text-foreground/80">
      {formatted}
    </div>
  );
}

export function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  if (!user) return null;

  const meta = PAGE_META[location.pathname] ?? { title: "", subtitle: "" };

  return (
    <div className="flex h-screen bg-background">
      <aside className="relative flex w-72 shrink-0 flex-col overflow-hidden bg-navy text-white">
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-gold bg-white text-sm font-black text-navy">
            HT
          </div>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold leading-tight">Hussain Travel</p>
            <p className="text-[9px] font-bold tracking-[0.14em] text-gold-soft">ENTERPRISE ERP</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
          {NAV_SECTIONS.map((section, i) => {
            const items = section.items.filter((item) => item.roles.includes(user.role));
            if (items.length === 0) return null;
            return (
              <div key={section.group ?? `top-${i}`} className={i > 0 ? "pt-3" : ""}>
                {section.group && (
                  <p className="px-3 pb-1.5 pt-2 text-[11px] font-semibold tracking-wide text-white/45">
                    {section.group.toUpperCase()}
                  </p>
                )}
                {items.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === "/"}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/85 transition-colors",
                        isActive
                          ? "bg-gradient-to-r from-gold-soft to-gold font-bold text-navy shadow-sm"
                          : "hover:bg-white/[0.07] hover:text-white",
                      )
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <p className="truncate text-sm font-semibold">{user.name}</p>
          <p className="text-[10px] font-bold uppercase tracking-wide text-gold-soft">{user.role}</p>
          <button
            onClick={() => logout()}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-white/15 py-2 text-xs font-semibold text-white/90 hover:bg-white/[0.07]"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-card px-6">
          <div className="min-w-0">
            <h1 className="truncate text-[17px] font-extrabold text-foreground">{meta.title}</h1>
            {meta.subtitle && <p className="truncate text-xs text-muted-foreground">{meta.subtitle}</p>}
          </div>
          <div className="ml-auto shrink-0">
            <HeaderClock />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
