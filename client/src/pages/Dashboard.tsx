import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import type { DashboardSummary } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";

function money(n: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);
}

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

  const profit = (data?.incomeThisMonth ?? 0) - (data?.expenseThisMonth ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of bookings and finances this month.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Income this month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-success">
              {isLoading ? "…" : money(data?.incomeThisMonth ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Expense this month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-destructive">
              {isLoading ? "…" : money(data?.expenseThisMonth ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Net profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-semibold ${profit >= 0 ? "text-success" : "text-destructive"}`}>
              {isLoading ? "…" : money(profit)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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

      <Card>
        <CardHeader>
          <CardTitle>Upcoming pickups</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!data?.upcomingBookings.length && (
            <p className="text-sm text-muted-foreground">No upcoming pending or confirmed bookings.</p>
          )}
          {data?.upcomingBookings.map((b) => (
            <Link
              key={b.id}
              to={`/bookings`}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm hover:bg-muted/40"
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
