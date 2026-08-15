import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
import { money } from "@/lib/currency";
import type { Expense, ExpenseCategory, Payment, Vehicle, Driver } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

type ExpenseForm = {
  category: ExpenseCategory;
  amount: string;
  description: string;
  vehicleId: string;
  driverId: string;
};

const emptyForm: ExpenseForm = { category: "OTHER", amount: "", description: "", vehicleId: "", driverId: "" };

export default function Finance() {
  const queryClient = useQueryClient();
  const [tab, setTab] = React.useState("expenses");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [form, setForm] = React.useState<ExpenseForm>(emptyForm);

  const { data: expenses, isLoading: loadingExpenses } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => (await api.get<Expense[]>("/expenses")).data,
  });
  const { data: payments, isLoading: loadingPayments } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => (await api.get<Payment[]>("/payments")).data,
  });
  const { data: vehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => (await api.get<Vehicle[]>("/vehicles")).data,
  });
  const { data: drivers } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => (await api.get<Driver[]>("/drivers")).data,
  });

  const totalIncome = payments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;
  const totalExpense = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;

  const createExpense = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => (await api.post("/expenses", payload)).data,
    onSuccess: () => {
      toast.success("Expense recorded");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setDialogOpen(false);
      setForm(emptyForm);
    },
    onError: () => toast.error("Could not record expense"),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Income and expense ledger</p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setForm(emptyForm)}>
              <Plus className="h-4 w-4" /> New Expense
            </Button>
          </DialogTrigger>
          <DialogContent title="Record expense">
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                createExpense.mutate({
                  category: form.category,
                  amount: Number(form.amount),
                  description: form.description,
                  vehicleId: form.vehicleId,
                  driverId: form.driverId,
                });
              }}
            >
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as ExpenseCategory })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FUEL">Fuel</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    <SelectItem value="SALARY">Salary</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Vehicle (optional)</Label>
                  <Select value={form.vehicleId} onValueChange={(v) => setForm({ ...form, vehicleId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
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
                  <Label>Driver (optional)</Label>
                  <Select value={form.driverId} onValueChange={(v) => setForm({ ...form, driverId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
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
              </div>
              <Button type="submit" className="w-full" disabled={createExpense.isPending}>
                Record expense
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card style={{ borderTopWidth: 3, borderTopColor: "var(--navy)" }}>
          <CardContent className="pt-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Total income</p>
            <p className="mt-1.5 font-mono text-lg font-bold text-foreground">{money(totalIncome)}</p>
          </CardContent>
        </Card>
        <Card style={{ borderTopWidth: 3, borderTopColor: "var(--destructive)" }}>
          <CardContent className="pt-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Total expense</p>
            <p className="mt-1.5 font-mono text-lg font-bold text-foreground">{money(totalExpense)}</p>
          </CardContent>
        </Card>
        <Card style={{ borderTopWidth: 3, borderTopColor: "var(--gold)" }}>
          <CardContent className="pt-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Net</p>
            <p className="mt-1.5 font-mono text-lg font-bold text-foreground">{money(totalIncome - totalExpense)}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "expenses" && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Vehicle / Driver</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingExpenses && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!loadingExpenses && expenses?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No expenses recorded yet.
                </TableCell>
              </TableRow>
            )}
            {expenses?.map((e) => (
              <TableRow key={e.id}>
                <TableCell>{format(new Date(e.date), "PP")}</TableCell>
                <TableCell>{e.category}</TableCell>
                <TableCell>{e.description}</TableCell>
                <TableCell>{e.vehicle?.plateNumber ?? e.driver?.name ?? "—"}</TableCell>
                <TableCell className="text-right text-destructive">{money(e.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {tab === "income" && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingPayments && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!loadingPayments && payments?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No payments recorded yet.
                </TableCell>
              </TableRow>
            )}
            {payments?.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{format(new Date(p.paidAt), "PP")}</TableCell>
                <TableCell>{p.invoice?.invoiceNumber}</TableCell>
                <TableCell>{p.invoice?.customer?.name}</TableCell>
                <TableCell>{p.method}</TableCell>
                <TableCell className="text-right text-success">{money(p.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
