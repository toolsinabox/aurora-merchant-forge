import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, DollarSign, Calendar, CreditCard, Mail } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Layby() {
  const { currentStore } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [payDialog, setPayDialog] = useState<any>(null);
  const [payAmount, setPayAmount] = useState("");

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["layby_plans", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data, error } = await supabase
        .from("layby_plans" as any)
        .select("*, order:order_id(order_number), customer:customer_id(name, email)")
        .eq("store_id", currentStore.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentStore,
  });

  const recordPayment = useMutation({
    mutationFn: async () => {
      const amt = Number(payAmount);
      if (!amt || amt <= 0 || !payDialog || !currentStore) throw new Error("Enter a valid amount");
      // Insert layby payment
      const { error: payErr } = await supabase.from("layby_payments" as any).insert({
        layby_plan_id: payDialog.id,
        store_id: currentStore.id,
        amount: amt,
        payment_method: "manual",
      });
      if (payErr) throw payErr;
      // Update plan
      const newPaid = Number(payDialog.amount_paid) + amt;
      const newInstallmentsPaid = payDialog.installments_paid + 1;
      const isComplete = newPaid >= Number(payDialog.total_amount);
      const { error: updateErr } = await supabase.from("layby_plans" as any).update({
        amount_paid: newPaid,
        installments_paid: newInstallmentsPaid,
        status: isComplete ? "completed" : "active",
        completed_at: isComplete ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }).eq("id", payDialog.id);
      if (updateErr) throw updateErr;
      // If complete, update order payment status
      if (isComplete) {
        await supabase.from("orders").update({ payment_status: "paid" } as any).eq("id", payDialog.order_id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["layby_plans"] });
      toast.success("Payment recorded");
      setPayDialog(null);
      setPayAmount("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const cancelPlan = useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase.from("layby_plans" as any).update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", planId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["layby_plans"] });
      toast.success("Layby plan cancelled");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const sendReminder = useMutation({
    mutationFn: async (plan: any) => {
      if (!plan.customer?.email || !currentStore) throw new Error("No customer email");
      const remaining = Number(plan.total_amount) - Number(plan.amount_paid);
      const { error } = await supabase.functions.invoke("send-email", {
        body: {
          store_id: currentStore.id,
          to: plan.customer.email,
          subject: `Layby Payment Reminder — ${plan.order?.order_number || "Your Plan"}`,
          html: `<p>Hi ${plan.customer.name},</p><p>This is a friendly reminder that your next layby installment of <strong>$${plan.installment_amount?.toFixed(2)}</strong> is due soon.</p><p>Outstanding balance: <strong>$${remaining.toFixed(2)}</strong></p><p>Installments completed: ${plan.installments_paid} of ${plan.installments_count}</p><p>Thank you for your continued payments.</p>`,
        },
      });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Payment reminder sent"),
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = (plans as any[]).filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (p.order?.order_number || "").toLowerCase().includes(q) ||
        (p.customer?.name || "").toLowerCase().includes(q) ||
        (p.customer?.email || "").toLowerCase().includes(q);
    }
    return true;
  });

  const totalActive = (plans as any[]).filter((p) => p.status === "active").length;
  const totalOutstanding = (plans as any[]).filter((p) => p.status === "active")
    .reduce((s: number, p: any) => s + (Number(p.total_amount) - Number(p.amount_paid)), 0);

  const statusBadge = (status: string) => {
    const map: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default", completed: "secondary", cancelled: "destructive", defaulted: "destructive",
    };
    return <Badge variant={map[status] || "outline"} className="text-[10px] capitalize">{status}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Layby / Lay-Away</h1>
            <p className="text-xs text-muted-foreground">{totalActive} active plans · ${totalOutstanding.toFixed(2)} outstanding</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="p-4 text-center">
            <p className="text-lg font-bold">{totalActive}</p>
            <p className="text-xs text-muted-foreground">Active Plans</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-lg font-bold text-primary">${totalOutstanding.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Outstanding</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-lg font-bold">{(plans as any[]).filter((p) => p.status === "completed").length}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="flex items-center gap-2 p-3 border-b">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search by order or customer..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 pl-8 text-xs" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All</SelectItem>
                  <SelectItem value="active" className="text-xs">Active</SelectItem>
                  <SelectItem value="completed" className="text-xs">Completed</SelectItem>
                  <SelectItem value="cancelled" className="text-xs">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-8">Order</TableHead>
                  <TableHead className="text-xs h-8">Customer</TableHead>
                  <TableHead className="text-xs h-8 text-right">Total</TableHead>
                  <TableHead className="text-xs h-8 text-right">Paid</TableHead>
                  <TableHead className="text-xs h-8">Progress</TableHead>
                  <TableHead className="text-xs h-8">Frequency</TableHead>
                  <TableHead className="text-xs h-8">Status</TableHead>
                  <TableHead className="text-xs h-8 w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">
                      <CreditCard className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                      No layby plans found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((plan: any) => {
                    const remaining = Number(plan.total_amount) - Number(plan.amount_paid);
                    const progressPct = Number(plan.total_amount) > 0 ? Math.round((Number(plan.amount_paid) / Number(plan.total_amount)) * 100) : 0;
                    return (
                      <TableRow key={plan.id} className="text-xs">
                        <TableCell className="py-2 font-mono font-medium">{plan.order?.order_number || "—"}</TableCell>
                        <TableCell className="py-2">{plan.customer?.name || "—"}</TableCell>
                        <TableCell className="py-2 text-right font-medium">${Number(plan.total_amount).toFixed(2)}</TableCell>
                        <TableCell className="py-2 text-right">${Number(plan.amount_paid).toFixed(2)}</TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-1.5">
                              <div className="bg-primary rounded-full h-1.5 transition-all" style={{ width: `${progressPct}%` }} />
                            </div>
                            <span className="text-[10px] text-muted-foreground w-8">{progressPct}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 capitalize">{plan.frequency}</TableCell>
                        <TableCell className="py-2">{statusBadge(plan.status)}</TableCell>
                        <TableCell className="py-2">
                          {plan.status === "active" && (
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => { setPayDialog(plan); setPayAmount(String(plan.installment_amount)); }}>
                                <DollarSign className="h-3 w-3 mr-0.5" /> Pay
                              </Button>
                              <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-destructive" onClick={() => cancelPlan.mutate(plan.id)}>
                                Cancel
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Payment Dialog */}
      <Dialog open={!!payDialog} onOpenChange={(o) => { if (!o) setPayDialog(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-sm">Record Layby Payment</DialogTitle></DialogHeader>
          {payDialog && (
            <div className="space-y-3">
              <div className="text-xs space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Order</span><span className="font-mono">{payDialog.order?.order_number}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Remaining</span><span className="font-medium">${(Number(payDialog.total_amount) - Number(payDialog.amount_paid)).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Installments</span><span>{payDialog.installments_paid}/{payDialog.installments_count}</span></div>
              </div>
              <div>
                <Label className="text-xs">Payment Amount ($)</Label>
                <Input type="number" step="0.01" min="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="h-8 text-xs" />
              </div>
              <Button className="w-full text-xs" onClick={() => recordPayment.mutate()} disabled={recordPayment.isPending}>
                Record Payment
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
