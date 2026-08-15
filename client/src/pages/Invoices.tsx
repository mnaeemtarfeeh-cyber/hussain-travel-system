import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, DollarSign } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { money } from "@/lib/currency";
import type { Booking, Invoice } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";

export default function Invoices() {
  const { user } = useAuth();
  const canCreate = user?.role === "ADMIN" || user?.role === "AGENT" || user?.role === "ACCOUNTANT";
  const canRecordPayment = user?.role === "ADMIN" || user?.role === "ACCOUNTANT";
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = React.useState(false);
  const [bookingId, setBookingId] = React.useState("");
  const [tax, setTax] = React.useState("0");
  const [discount, setDiscount] = React.useState("0");

  const [payOpen, setPayOpen] = React.useState(false);
  const [payInvoice, setPayInvoice] = React.useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = React.useState("");
  const [payMethod, setPayMethod] = React.useState("Cash");

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => (await api.get<Invoice[]>("/invoices")).data,
  });

  const { data: bookings } = useQuery({
    queryKey: ["bookings", "ALL"],
    queryFn: async () => (await api.get<Booking[]>("/bookings")).data,
  });

  const invoiceableBookings = bookings?.filter((b) => !b.invoice && b.status !== "CANCELLED") ?? [];

  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => (await api.post("/invoices", payload)).data,
    onSuccess: () => {
      toast.success("Invoice created");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setCreateOpen(false);
      setBookingId("");
      setTax("0");
      setDiscount("0");
    },
    onError: () => toast.error("Could not create invoice"),
  });

  const paymentMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => (await api.post("/payments", payload)).data,
    onSuccess: () => {
      toast.success("Payment recorded");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setPayOpen(false);
      setPayInvoice(null);
      setPayAmount("");
    },
    onError: () => toast.error("Could not record payment"),
  });

  function openPayment(invoice: Invoice) {
    setPayInvoice(invoice);
    const paid = (invoice.payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
    setPayAmount(String(Number(invoice.total) - paid));
    setPayOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{invoices?.length ?? 0} invoices</p>
        {canCreate && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" /> New Invoice
              </Button>
            </DialogTrigger>
            <DialogContent title="Create invoice from booking">
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  createMutation.mutate({ bookingId, tax: Number(tax), discount: Number(discount) });
                }}
              >
                <div className="space-y-1.5">
                  <Label>Booking</Label>
                  <Select value={bookingId} onValueChange={setBookingId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a booking" />
                    </SelectTrigger>
                    <SelectContent>
                      {invoiceableBookings.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.bookingNumber} · {b.customer?.name} · {money(b.fare)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {invoiceableBookings.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No bookings available to invoice — every active booking already has one.
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="tax">Tax</Label>
                    <Input id="tax" type="number" step="0.01" min="0" value={tax} onChange={(e) => setTax(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="discount">Discount</Label>
                    <Input
                      id="discount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={!bookingId || createMutation.isPending}>
                  Create invoice
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Issued</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            {canRecordPayment && <TableHead className="text-right">Actions</TableHead>}
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
          {!isLoading && invoices?.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                No invoices yet.
              </TableCell>
            </TableRow>
          )}
          {invoices?.map((inv) => (
            <TableRow key={inv.id}>
              <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
              <TableCell>{inv.customer?.name}</TableCell>
              <TableCell>{format(new Date(inv.issueDate), "PP")}</TableCell>
              <TableCell>{money(inv.total)}</TableCell>
              <TableCell>
                <StatusBadge status={inv.status} />
              </TableCell>
              {canRecordPayment && (
                <TableCell className="text-right">
                  {inv.status !== "PAID" && (
                    <Button variant="outline" size="sm" onClick={() => openPayment(inv)}>
                      <DollarSign className="h-3.5 w-3.5" /> Record payment
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent title={`Record payment — ${payInvoice?.invoiceNumber ?? ""}`}>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!payInvoice) return;
              paymentMutation.mutate({ invoiceId: payInvoice.id, amount: Number(payAmount), method: payMethod });
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="payAmount">Amount</Label>
              <Input
                id="payAmount"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Method</Label>
              <Select value={payMethod} onValueChange={setPayMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={paymentMutation.isPending}>
              Record payment
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
