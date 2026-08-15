import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { money } from "@/lib/currency";
import type { DashboardSummary } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";

export default function Dashboard() {
  const { data, isLoading } = useQuery<DashboardSummary>({
    queryKey: ["dashboard-summary"],
    queryFn: async () => (await api.get("/dashboard/summary")).data,
  });

  const statuses: { key: keyof DashboardSummary["bookingsByStatus"]; label: string }[] = [
    { key: "PENDING", label: "Pending" },
    { key: "CONFIRMED", label: "Confirmed" },
    { key: "COMPLETED", label: "Completed" },
    { key: "CANCELLED", label: "Cancelled" },
  ];

  const income = data?.incomeThisMonth ?? 0;
  const expense = data?.expenseThisMonth ?? 0;
  const profit = income - expense;
  const totalBookings = Object.values(data?.bookingsByStatus ?? {}).reduce((a, b) => a + (b ?? 0), 0);

  const kpis = [
    { label: "Income this month", value: money(income), accent: "var(--navy)" },
    { label: "Expenses this month", value: money(expense), accent: "var(--destructive)" },
    { label: "Net profit", value: money(profit), accent: "var(--gold)" },
    { label: "Bookings this month", value: String(totalBookings), accent: "var(--navy)" },
  ];

  return (
    <div className="space-y-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">This month</p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} style={{ borderTopWidth: 3, borderTopColor: kpi.accent }}>
            <CardContent className="pt-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{kpi.label}</p>
              <p className="mt-1.5 font-mono text-lg font-bold text-foreground">
                {isLoading ? "…" : kpi.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <p className="mb-2 text-sm font-bold text-foreground">Bookings by status</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statuses.map(({ key, label }) => (
            <Card key={key}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <Badge tone="muted">{data?.bookingsByStatus[key] ?? 0}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="space-y-2 pt-4">
          <p className="mb-1 text-sm font-bold text-foreground">Upcoming pickups</p>
          {!data?.upcomingBookings.length && (
            <p className="text-sm text-muted-foreground">No upcoming pending or confirmed bookings.</p>
          )}
          {data?.upcomingBookings.map((b) => (
            <Link
              key={b.id}
              to={`/bookings`}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm hover:bg-muted/50"
            >
              <div>
                <p className="font-medium">{b.customer?.name ?? "Unknown customer"}</p>
                <p className="text-xs text-muted-foreground">
                  {b.pickupLocation} → {b.dropoffLocation} · {format(new Date(b.pickupDate), "PP p")}
                </p>
              </div>
              <StatusBadge status={b.status} />
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
