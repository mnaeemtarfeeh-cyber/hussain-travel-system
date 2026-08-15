import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowLeft, MapPin, Users, Calendar, StickyNote } from "lucide-react";
import { api } from "@/lib/api";
import { money } from "@/lib/currency";
import { useAuth } from "@/lib/auth";
import type { Booking, BookingStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canWrite = user?.role === "ADMIN" || user?.role === "AGENT";
  const queryClient = useQueryClient();

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking", id],
    queryFn: async () => (await api.get<Booking>(`/bookings/${id}`)).data,
  });

  const statusMutation = useMutation({
    mutationFn: async (status: BookingStatus) => (await api.patch(`/bookings/${id}/status`, { status })).data,
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: () => toast.error("Could not update status"),
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async () => (await api.post("/invoices", { bookingId: id, tax: 0, discount: 0 })).data,
    onSuccess: (invoice) => {
      toast.success("Invoice created");
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
      navigate("/invoices", { state: { highlight: invoice.id } });
    },
    onError: () => toast.error("Could not create invoice"),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!booking) return <p className="text-sm text-muted-foreground">Booking not found.</p>;

  const nextStatus: Partial<Record<BookingStatus, BookingStatus>> = {
    PENDING: "CONFIRMED",
    CONFIRMED: "COMPLETED",
  };

  return (
    <div className="space-y-6">
      <Link to="/bookings" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to bookings
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{booking.bookingNumber}</h2>
            <StatusBadge status={booking.status} />
          </div>
          <Link to={`/customers/${booking.customerId}`} className="text-sm text-primary hover:underline">
            {booking.customer?.name}
          </Link>
        </div>
        {canWrite && (
          <div className="flex gap-2">
            {nextStatus[booking.status] && (
              <Button onClick={() => statusMutation.mutate(nextStatus[booking.status]!)} disabled={statusMutation.isPending}>
                Mark {nextStatus[booking.status]?.toLowerCase()}
              </Button>
            )}
            {booking.status !== "CANCELLED" && booking.status !== "COMPLETED" && (
              <Button
                variant="outline"
                className="text-destructive"
                onClick={() => statusMutation.mutate("CANCELLED")}
                disabled={statusMutation.isPending}
              >
                Cancel booking
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Trip details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="text-sm">
                <p className="font-medium">{booking.pickupLocation}</p>
                <p className="my-0.5 text-xs text-muted-foreground">to</p>
                <p className="font-medium">{booking.dropoffLocation}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
              {format(new Date(booking.pickupDate), "PPPP p")}
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
              {booking.passengers} passenger{booking.passengers === 1 ? "" : "s"}
            </div>
            {booking.notes && (
              <div className="flex items-start gap-3 text-sm">
                <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                {booking.notes}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Driver</span>
                <span className="font-medium">{booking.driver?.name ?? "Unassigned"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vehicle</span>
                <span className="font-medium">{booking.vehicle?.plateNumber ?? "Unassigned"}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fare</span>
                <span className="font-mono font-medium">{money(booking.fare)}</span>
              </div>
              {booking.invoice ? (
                <Link
                  to="/invoices"
                  className="block rounded-md border border-border px-3 py-2 text-center text-xs font-medium hover:bg-muted"
                >
                  View invoice {booking.invoice.invoiceNumber}
                </Link>
              ) : (
                canWrite && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => createInvoiceMutation.mutate()}
                    disabled={createInvoiceMutation.isPending || booking.status === "CANCELLED"}
                  >
                    Create invoice
                  </Button>
                )
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
