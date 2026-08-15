import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Vehicle, VehicleStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";

type VehicleForm = {
  plateNumber: string;
  make: string;
  model: string;
  year: string;
  capacity: string;
  status: VehicleStatus;
};

const emptyForm: VehicleForm = { plateNumber: "", make: "", model: "", year: "", capacity: "", status: "ACTIVE" };

export default function Fleet() {
  const { user } = useAuth();
  const canWrite = user?.role === "ADMIN" || user?.role === "AGENT";
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Vehicle | null>(null);
  const [form, setForm] = React.useState<VehicleForm>(emptyForm);

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => (await api.get<Vehicle[]>("/vehicles")).data,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => (await api.post("/vehicles", payload)).data,
    onSuccess: () => {
      toast.success("Vehicle added");
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      closeDialog();
    },
    onError: () => toast.error("Could not save vehicle"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      (await api.patch(`/vehicles/${id}`, payload)).data,
    onSuccess: () => {
      toast.success("Vehicle updated");
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      closeDialog();
    },
    onError: () => toast.error("Could not update vehicle"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/vehicles/${id}`),
    onSuccess: () => {
      toast.success("Vehicle removed");
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
    onError: () => toast.error("Could not remove vehicle"),
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(vehicle: Vehicle) {
    setEditing(vehicle);
    setForm({
      plateNumber: vehicle.plateNumber,
      make: vehicle.make,
      model: vehicle.model,
      year: String(vehicle.year),
      capacity: String(vehicle.capacity),
      status: vehicle.status,
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
      plateNumber: form.plateNumber,
      make: form.make,
      model: form.model,
      year: Number(form.year),
      capacity: Number(form.capacity),
      status: form.status,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Fleet</h1>
          <p className="text-sm text-muted-foreground">{vehicles?.length ?? 0} vehicles</p>
        </div>
        {canWrite && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> New Vehicle
              </Button>
            </DialogTrigger>
            <DialogContent title={editing ? "Edit vehicle" : "New vehicle"}>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="plateNumber">Plate number</Label>
                  <Input
                    id="plateNumber"
                    required
                    value={form.plateNumber}
                    onChange={(e) => setForm({ ...form, plateNumber: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="make">Make</Label>
                    <Input id="make" required value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="model">Model</Label>
                    <Input id="model" required value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      type="number"
                      required
                      value={form.year}
                      onChange={(e) => setForm({ ...form, year: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="capacity">Capacity (seats)</Label>
                    <Input
                      id="capacity"
                      type="number"
                      required
                      value={form.capacity}
                      onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as VehicleStatus })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editing ? "Save changes" : "Add vehicle"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Plate</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Status</TableHead>
            {canWrite && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                Loading…
              </TableCell>
            </TableRow>
          )}
          {!isLoading && vehicles?.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                No vehicles yet.
              </TableCell>
            </TableRow>
          )}
          {vehicles?.map((v) => (
            <TableRow key={v.id}>
              <TableCell className="font-medium">{v.plateNumber}</TableCell>
              <TableCell>
                {v.year} {v.make} {v.model}
              </TableCell>
              <TableCell>{v.capacity} seats</TableCell>
              <TableCell>
                <StatusBadge status={v.status} />
              </TableCell>
              {canWrite && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(v)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm(`Remove vehicle ${v.plateNumber}?`)) deleteMutation.mutate(v.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
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
