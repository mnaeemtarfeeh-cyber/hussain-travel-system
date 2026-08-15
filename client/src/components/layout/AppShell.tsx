import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import type { Role } from "@/lib/types";

type NavItem = {
  to: string;
  label: string;
  roles: Role[];
};

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", roles: ["ADMIN", "AGENT", "ACCOUNTANT"] },
  { to: "/customers", label: "Customers", roles: ["ADMIN", "AGENT", "ACCOUNTANT"] },
  { to: "/bookings", label: "Bookings", roles: ["ADMIN", "AGENT", "ACCOUNTANT"] },
  { to: "/drivers", label: "Drivers", roles: ["ADMIN", "AGENT", "ACCOUNTANT"] },
  { to: "/fleet", label: "Fleet", roles: ["ADMIN", "AGENT", "ACCOUNTANT"] },
  { to: "/invoices", label: "Invoices", roles: ["ADMIN", "AGENT", "ACCOUNTANT"] },
  { to: "/finance", label: "Finance", roles: ["ADMIN", "ACCOUNTANT"] },
  { to: "/users", label: "Staff & Roles", roles: ["ADMIN"] },
];

export function AppShell() {
  const { user, logout } = useAuth();
  if (!user) return null;

  const items = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-52 shrink-0 border-r border-border bg-sidebar p-3">
        <p className="mb-3 text-sm font-bold">Hussain Travel</p>
        <nav className="flex flex-col">
          {items.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `border-b border-border px-1 py-2 text-sm ${isActive ? "font-bold underline" : ""}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-4 border-t border-border pt-3 text-sm">
          <p>{user.name}</p>
          <p className="text-muted-foreground">{user.role}</p>
          <button onClick={() => logout()} className="mt-2 underline">
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  );
}
