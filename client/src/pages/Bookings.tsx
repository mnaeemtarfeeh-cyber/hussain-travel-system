import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, Pencil } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { money } from "@/lib/currency";
import type { Booking, BookingStatus, Customer, Driver, Vehicle } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";

type BookingForm = {
  customerId: string;
  driverId: string;
  vehicleId: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  passengers: string;
  fare: string;
  notes: string;
};

const emptyForm: BookingForm = {
  customerId: "",
  driverId: "",
  vehicleId: "",
  pickupLocation: "",
  dropoffLocation: "",
  pickupDate: "",
  passengers: "1",
  fare: "",
  notes: "",
};

const TABS: { value: string; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function Bookings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canWrite = user?.role === "ADMIN" || user?.role === "AGENT";
  const queryClient = useQueryClient();
  const [tab, setTab] = React.useState("ALL");
  const [driverFilter, setDriverFilter] = React.useState("ALL");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Booking | null>(null);
  const [form, setForm] = React.useState<BookingForm>(emptyForm);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["bookings", tab, driverFilter, dateFrom, dateTo],
    queryFn: async () =>
      (
        await api.get<Booking[]>("/bookings", {
          params: {
            status: tab === "ALL" ? undefined : tab,
            driverId: driverFilter === "ALL" ? undefined : driverFilter,
            from: dateFrom ? new Date(dateFrom).toISOString() : undefined,
            to: dateTo ? new Date(dateTo + "T23:59:59").toISOString() : undefined,
          },
        })
      ).data,
  });

  const { data: customers } = useQuery({
    queryKey: ["customers-all"],
    queryFn: async () => (await api.get("/customers", { params: { pageSize: 100 } })).data.items as Customer[],
  });
  const { data: drivers } = useQuery({
    queryKey: ["drivers", "ACTIVE"],
    queryFn: async () => (await api.get<Driver[]>("/drivers", { params: { status: "ACTIVE" } })).data,
  });
  const { data: vehicles } = useQuery({
    queryKey: ["vehicles", "ACTIVE"],
    queryFn: async () => (await api.get<Vehicle[]>("/vehicles", { params: { status: "ACTIVE" } })).data,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => (await api.post("/bookings", payload)).data,
    onSuccess: () => {
      toast.success("Booking created");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      closeDialog();
    },
    onError: () => toast.error("Could not create booking"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      (await api.patch(`/bookings/${id}`, payload)).data,
    onSuccess: () => {
      toast.success("Booking updated");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      closeDialog();
    },
    onError: () => toast.error("Could not update booking"),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BookingStatus }) =>
      (await api.patch(`/bookings/${id}/status`, { status })).data,
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
    onError: () => toast.error("Could not update status"),
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(booking: Booking) {
    setEditing(booking);
    setForm({
      customerId: booking.customerId,
      driverId: booking.driverId ?? "",
      vehicleId: booking.vehicleId ?? "",
      pickupLocation: booking.pickupLocation,
      dropoffLocation: booking.dropoffLocation,
      pickupDate: booking.pickupDate.slice(0, 16),
      passengers: String(booking.passengers ?? 1),
      fare: String(booking.fare),
      notes: booking.notes ?? "",
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditing(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      customerId: form.customerId,
      driverId: form.driverId || "",
      vehicleId: form.vehicleId || "",
      pickupLocation: form.pickupLocation,
      dropoffLocation: form.dropoffLocation,
      pickupDate: new Date(form.pickupDate).toISOString(),
      passengers: Number(form.passengers) || 1,
      fare: Number(form.fare),
      notes: form.notes,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const nextStatus: Partial<Record<BookingStatus, BookingStatus>> = {
    PENDING: "CONFIRMED",
    CONFIRMED: "COMPLETED",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{bookings?.length ?? 0} bookings</p>
        {canWrite && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> New Booking
              </Button>
            </DialogTrigger>
            <DialogContent title={editing ? "Edit booking" : "New booking"} className="max-w-xl">
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label>Customer</Label>
                  <Select value={form.customerId} onValueChange={(v) => setForm({ ...form, customerId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} · {c.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Driver (optional)</Label>
                  <Select value={form.driverId} onValueChange={(v) => setForm({ ...form, driverId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers?.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Vehicle (optional)</Label>
                  <Select value={form.vehicleId} onValueChange={(v) => setForm({ ...form, vehicleId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles?.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.plateNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pickupLocation">Pickup location</Label>
                  <Input
                    id="pickupLocation"
                    required
                    value={form.pickupLocation}
                    onChange={(e) => setForm({ ...form, pickupLocation: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dropoffLocation">Dropoff location</Label>
                  <Input
                    id="dropoffLocation"
                    required
                    value={form.dropoffLocation}
                    onChange={(e) => setForm({ ...form, dropoffLocation: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pickupDate">Pickup date & time</Label>
                  <Input
                    id="pickupDate"
                    type="datetime-local"
                    required
                    value={form.pickupDate}
                    onChange={(e) => setForm({ ...form, pickupDate: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="passengers">Passengers</Label>
                  <Input
                    id="passengers"
                    type="number"
                    min="1"
                    required
                    value={form.passengers}
                    onChange={(e) => setForm({ ...form, passengers: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fare">Fare</Label>
                  <Input
                    id="fare"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form.fare}
                    onChange={(e) => setForm({ ...form, fare: e.target.value })}
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <Button
                  type="submit"
                  className="col-span-2"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editing ? "Save changes" : "Create booking"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">From</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">To</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Driver</Label>
          <Select value={driverFilter} onValueChange={setDriverFilter}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All drivers</SelectItem>
              {drivers?.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {(dateFrom || dateTo || driverFilter !== "ALL") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDateFrom("");
              setDateTo("");
              setDriverFilter("ALL");
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Booking #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Route</TableHead>
            <TableHead>Pickup</TableHead>
            <TableHead>Pax</TableHead>
            <TableHead>Fare</TableHead>
            <TableHead>Status</TableHead>
            {canWrite && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                Loading…
              </TableCell>
            </TableRow>
          )}
          {!isLoading && bookings?.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                No bookings in this view.
              </TableCell>
            </TableRow>
          )}
          {bookings?.map((b) => (
            <TableRow key={b.id} className="cursor-pointer" onClick={() => navigate(`/bookings/${b.id}`)}>
              <TableCell className="font-medium">{b.bookingNumber}</TableCell>
              <TableCell>{b.customer?.name}</TableCell>
              <TableCell className="max-w-48 truncate">
                {b.pickupLocation} → {b.dropoffLocation}
              </TableCell>
              <TableCell>{format(new Date(b.pickupDate), "PP p")}</TableCell>
              <TableCell>{b.passengers}</TableCell>
              <TableCell className="font-mono">{money(b.fare)}</TableCell>
              <TableCell>
                <StatusBadge status={b.status} />
              </TableCell>
              {canWrite && (
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-1">
                    {nextStatus[b.status] && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => statusMutation.mutate({ id: b.id, status: nextStatus[b.status]! })}
                      >
                        Mark {nextStatus[b.status]?.toLowerCase()}
                      </Button>
                    )}
                    {b.status !== "CANCELLED" && b.status !== "COMPLETED" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => statusMutation.mutate({ id: b.id, status: "CANCELLED" })}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => openEdit(b)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
