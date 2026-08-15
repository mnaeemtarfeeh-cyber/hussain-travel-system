import * as React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowLeft, Pencil, User as UserIcon } from "lucide-react";
import { api } from "@/lib/api";
import { money } from "@/lib/currency";
import { useAuth } from "@/lib/auth";
import type { CustomerDetail as CustomerDetailType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";

type CustomerForm = {
  name: string;
  phone: string;
  email: string;
  passportId: string;
  nationality: string;
  address: string;
  notes: string;
};

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canWrite = user?.role === "ADMIN" || user?.role === "AGENT";
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [form, setForm] = React.useState<CustomerForm | null>(null);

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customer", id],
    queryFn: async () => (await api.get<CustomerDetailType>(`/customers/${id}`)).data,
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: CustomerForm) => (await api.patch(`/customers/${id}`, payload)).data,
    onSuccess: () => {
      toast.success("Customer updated");
      queryClient.invalidateQueries({ queryKey: ["customer", id] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setDialogOpen(false);
    },
    onError: () => toast.error("Could not update customer"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/customers/${id}`),
    onSuccess: () => {
      toast.success("Customer deleted");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      navigate("/customers");
    },
    onError: () => toast.error("Could not delete customer — they may have existing bookings"),
  });

  function openEdit() {
    if (!customer) return;
    setForm({
      name: customer.name,
      phone: customer.phone,
      email: customer.email ?? "",
      passportId: customer.passportId ?? "",
      nationality: customer.nationality ?? "",
      address: customer.address ?? "",
      notes: customer.notes ?? "",
    });
    setDialogOpen(true);
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!customer) return <p className="text-sm text-muted-foreground">Customer not found.</p>;

  return (
    <div className="space-y-6">
      <Link to="/customers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to customers
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <UserIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{customer.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {customer.phone || "—"}
              {customer.email ? ` · ${customer.email}` : ""}
              {customer.nationality ? ` · ${customer.nationality}` : ""}
            </p>
          </div>
        </div>
        {canWrite && (
          <div className="flex gap-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={openEdit}>
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
              </DialogTrigger>
              {form && (
                <DialogContent title="Edit customer">
                  <form
                    className="space-y-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      updateMutation.mutate(form);
                    }}
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Full name</Label>
                      <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="passportId">Passport / ID no.</Label>
                      <Input
                        id="passportId"
                        value={form.passportId}
                        onChange={(e) => setForm({ ...form, passportId: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="nationality">Nationality</Label>
                      <Input
                        id="nationality"
                        value={form.nationality}
                        onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                    </div>
                    <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
                      Save changes
                    </Button>
                  </form>
                </DialogContent>
              )}
            </Dialog>
            {user?.role === "ADMIN" && (
              <Button
                variant="outline"
                onClick={() => {
                  if (confirm(`Delete ${customer.name}? This cannot be undone.`)) deleteMutation.mutate();
                }}
              >
                Delete
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-label">Total bookings</p>
            <p className="mt-1.5 font-mono text-xl font-semibold">{customer.stats.totalBookings}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-label">Completed</p>
            <p className="mt-1.5 font-mono text-xl font-semibold">{customer.stats.completedBookings}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-label">Total spent</p>
            <p className="mt-1.5 font-mono text-xl font-semibold text-success">{money(customer.stats.totalSpent)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-label">Last trip</p>
            <p className="mt-1.5 text-sm font-medium">
              {customer.stats.lastBookingAt ? format(new Date(customer.stats.lastBookingAt), "PP") : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {(customer.passportId || customer.address) && (
        <Card>
          <CardHeader>
            <CardTitle>Identification</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 pt-0 text-sm">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-label">Passport / ID no.</p>
              <p className="mt-1">{customer.passportId || "—"}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-label">Address</p>
              <p className="mt-1">{customer.address || "—"}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {customer.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm">{customer.notes}</CardContent>
        </Card>
      )}

      <div>
        <p className="mb-2 text-sm font-semibold">Booking history</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking #</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Pickup</TableHead>
              <TableHead>Fare</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customer.bookings.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No bookings yet.
                </TableCell>
              </TableRow>
            )}
            {customer.bookings.map((b) => (
              <TableRow key={b.id} className="cursor-pointer" onClick={() => navigate(`/bookings/${b.id}`)}>
                <TableCell className="font-medium">{b.bookingNumber}</TableCell>
                <TableCell className="max-w-48 truncate">
                  {b.pickupLocation} → {b.dropoffLocation}
                </TableCell>
                <TableCell>{format(new Date(b.pickupDate), "PP p")}</TableCell>
                <TableCell className="font-mono">{money(b.fare)}</TableCell>
                <TableCell>
                  <StatusBadge status={b.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
