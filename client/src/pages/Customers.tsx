import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useDebouncedValue } from "@/lib/useDebounce";
import type { Customer } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type CustomerForm = {
  name: string;
  phone: string;
  email: string;
  passportId: string;
  nationality: string;
  address: string;
};

const emptyForm: CustomerForm = {
  name: "",
  phone: "",
  email: "",
  passportId: "",
  nationality: "",
  address: "",
};

export default function Customers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canWrite = user?.role === "ADMIN" || user?.role === "AGENT";
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [form, setForm] = React.useState<CustomerForm>(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ["customers", debouncedSearch],
    queryFn: async () => {
      const res = await api.get("/customers", { params: { search: debouncedSearch, pageSize: 50 } });
      return res.data as { items: Customer[]; total: number };
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: CustomerForm) => (await api.post("/customers", payload)).data,
    onSuccess: () => {
      toast.success("Customer added");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setForm(emptyForm);
    },
    onError: () => toast.error("Could not add customer"),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate(form);
  }

  return (
    <div className="space-y-4">
      {canWrite && (
        <Card className="p-6">
          <h2 className="mb-4 text-[15px] font-bold">New customer</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name *</Label>
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
            </div>
            <div className="mt-4 flex gap-2">
              <Button type="submit" disabled={createMutation.isPending}>
                Add customer
              </Button>
              <Button type="button" variant="outline" onClick={() => setForm(emptyForm)}>
                Clear
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden p-0">
        <h2 className="p-6 pb-0 text-[15px] font-bold">Customer directory</h2>
        <div className="m-6 rounded-md bg-muted p-4">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            className="mt-1.5 max-w-sm bg-card"
            placeholder="Name, phone or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>ID / Passport</TableHead>
              <TableHead>Nationality</TableHead>
              <TableHead>Bookings</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center italic text-muted-foreground">
                  No customers yet. Add one above, or add a booking to create one automatically.
                </TableCell>
              </TableRow>
            )}
            {data?.items.map((customer) => (
              <TableRow key={customer.id} className="cursor-pointer" onClick={() => navigate(`/customers/${customer.id}`)}>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell>{customer.phone || "—"}</TableCell>
                <TableCell>{customer.email || "—"}</TableCell>
                <TableCell>{customer.passportId || "—"}</TableCell>
                <TableCell>{customer.nationality || "—"}</TableCell>
                <TableCell>{customer._count?.bookings ?? 0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
