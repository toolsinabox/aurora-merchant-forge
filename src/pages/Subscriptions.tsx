import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Repeat, Pause, Play, Trash2, CalendarDays, Package, TrendingUp, TrendingDown, DollarSign, Users, SkipForward, ArrowLeftRight, Hash } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const FREQUENCIES = [
  { value: "weekly", label: "Weekly" },
  { value: "fortnightly", label: "Fortnightly" },
  { value: "monthly", label: "Monthly" },
  { value: "bimonthly", label: "Every 2 Months" },
  { value: "quarterly", label: "Quarterly" },
  { value: "biannual", label: "Every 6 Months" },
  { value: "annual", label: "Annually" },
];

export default function Subscriptions() {
  const { currentStore } = useAuth();
  const storeId = currentStore?.id;
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellingSubId, setCancellingSubId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const CANCEL_REASONS = [
    "Too expensive", "Don't need it anymore", "Switching to competitor",
    "Product quality issues", "Delivery issues", "Other",
  ];
  const [form, setForm] = useState({
    customer_id: "", product_id: "", quantity: 1,
    frequency: "monthly", interval_count: 1, unit_price: 0,
    discount_percent: 0, next_order_date: "", payment_method: "card", notes: "",
  });

  const { data: subs = [], isLoading } = useQuery({
    queryKey: ["subscription_plans", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans" as any)
        .select("*, customers:customer_id(name, email), products:product_id(title, sku)")
        .eq("store_id", storeId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers_list", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data } = await supabase.from("customers").select("id, name, email").eq("store_id", storeId!).order("name").limit(200);
      return data || [];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products_list", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, title, sku, price").eq("store_id", storeId!).eq("status", "active").order("title").limit(200);
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const product = products.find((p: any) => p.id === form.product_id);
      const { error } = await supabase.from("subscription_plans" as any).insert({
        store_id: storeId,
        customer_id: form.customer_id,
        product_id: form.product_id || null,
        quantity: form.quantity,
        frequency: form.frequency,
        interval_count: form.interval_count,
        unit_price: form.unit_price || product?.price || 0,
        discount_percent: form.discount_percent,
        next_order_date: form.next_order_date || null,
        payment_method: form.payment_method,
        notes: form.notes || null,
        status: "active",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscription_plans"] });
      setDialogOpen(false);
      toast.success("Subscription created");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("subscription_plans" as any).update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscription_plans"] });
      toast.success("Subscription updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subscription_plans" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscription_plans"] });
      toast.success("Subscription deleted");
    },
  });

  const activeSubs = subs.filter((s: any) => s.status === "active").length;
  const pausedSubs = subs.filter((s: any) => s.status === "paused").length;
  const cancelledSubs = subs.filter((s: any) => s.status === "cancelled").length;
  const churnRate = subs.length > 0 ? ((cancelledSubs / subs.length) * 100).toFixed(1) : "0.0";

  // Calculate MRR — normalize all frequencies to monthly
  const freqMultiplier: Record<string, number> = {
    weekly: 4.33, fortnightly: 2.17, monthly: 1, bimonthly: 0.5, quarterly: 0.33, biannual: 0.167, annual: 0.083,
  };
  const mrr = subs.filter((s: any) => s.status === "active").reduce((sum: number, s: any) => {
    const price = Number(s.unit_price) * Number(s.quantity) * (1 - Number(s.discount_percent) / 100);
    const mult = freqMultiplier[s.frequency] || 1;
    return sum + price * mult;
  }, 0);
  const arr = mrr * 12;
  const monthlyRevenue = subs.filter((s: any) => s.status === "active").reduce((sum: number, s: any) => {
    const price = Number(s.unit_price) * Number(s.quantity) * (1 - Number(s.discount_percent) / 100);
    return sum + price;
  }, 0);

  const statusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-500/10 text-green-600 border-green-200 text-[10px]">Active</Badge>;
      case "paused": return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-200 text-[10px]">Paused</Badge>;
      case "cancelled": return <Badge variant="destructive" className="text-[10px]">Cancelled</Badge>;
      case "completed": return <Badge variant="outline" className="text-[10px]">Completed</Badge>;
      default: return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Subscriptions</h1>
            <p className="text-xs text-muted-foreground">Manage recurring product subscriptions and auto-orders</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />New Subscription</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Create Subscription</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Customer</Label>
                  <Select value={form.customer_id} onValueChange={v => setForm(f => ({ ...f, customer_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                    <SelectContent>{customers.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name} ({c.email})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Product</Label>
                  <Select value={form.product_id} onValueChange={v => {
                    const p = products.find((p: any) => p.id === v);
                    setForm(f => ({ ...f, product_id: v, unit_price: p?.price || f.unit_price }));
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                    <SelectContent>{products.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.title} ({p.sku})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Quantity</Label>
                    <Input type="number" min={1} value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Unit Price</Label>
                    <Input type="number" step="0.01" value={form.unit_price} onChange={e => setForm(f => ({ ...f, unit_price: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Discount %</Label>
                    <Input type="number" min={0} max={100} value={form.discount_percent} onChange={e => setForm(f => ({ ...f, discount_percent: Number(e.target.value) }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Frequency</Label>
                    <Select value={form.frequency} onValueChange={v => setForm(f => ({ ...f, frequency: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{FREQUENCIES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Next Order Date</Label>
                    <Input type="date" value={form.next_order_date} onChange={e => setForm(f => ({ ...f, next_order_date: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Payment Method</Label>
                  <Select value={form.payment_method} onValueChange={v => setForm(f => ({ ...f, payment_method: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">Credit Card</SelectItem>
                      <SelectItem value="account">Pay on Account</SelectItem>
                      <SelectItem value="invoice">Invoice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Notes</Label>
                  <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
                </div>
                <Button onClick={() => createMutation.mutate()} disabled={!form.customer_id || !form.product_id || createMutation.isPending} className="w-full">
                  Create Subscription
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Subscription Analytics KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><DollarSign className="h-3 w-3" />MRR</div>
              <p className="text-lg font-bold">${mrr.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><TrendingUp className="h-3 w-3" />ARR</div>
              <p className="text-lg font-bold">${arr.toFixed(0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Users className="h-3 w-3" />Active</div>
              <p className="text-lg font-bold">{activeSubs}</p>
              <p className="text-[10px] text-muted-foreground">{pausedSubs} paused</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><TrendingDown className="h-3 w-3" />Churn Rate</div>
              <p className="text-lg font-bold">{churnRate}%</p>
              <p className="text-[10px] text-muted-foreground">{cancelledSubs} cancelled</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Repeat className="h-3 w-3" />Total</div>
              <p className="text-lg font-bold">{subs.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-xl font-bold">{subs.length}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-muted-foreground">Active</p>
            <p className="text-xl font-bold text-primary">{activeSubs}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-muted-foreground">Paused</p>
            <p className="text-xl font-bold">{pausedSubs}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-muted-foreground">Est. Monthly Revenue</p>
            <p className="text-xl font-bold">${monthlyRevenue.toFixed(2)}</p>
          </CardContent></Card>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Customer</TableHead>
                  <TableHead className="text-xs">Product</TableHead>
                  <TableHead className="text-xs">Qty</TableHead>
                  <TableHead className="text-xs">Price</TableHead>
                  <TableHead className="text-xs">Frequency</TableHead>
                  <TableHead className="text-xs">Next Order</TableHead>
                  <TableHead className="text-xs">Orders</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={9} className="text-center text-xs text-muted-foreground py-8">Loading...</TableCell></TableRow>
                ) : subs.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center text-xs text-muted-foreground py-8">No subscriptions yet.</TableCell></TableRow>
                ) : subs.map((s: any) => {
                  const effectivePrice = Number(s.unit_price) * Number(s.quantity) * (1 - Number(s.discount_percent) / 100);
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="text-xs">
                        <div>
                          <span className="font-medium">{s.customers?.name}</span>
                          <span className="block text-muted-foreground text-[10px]">{s.customers?.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1">
                          <Package className="h-3 w-3 text-muted-foreground" />
                          {s.products?.title || "—"}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{s.quantity}</TableCell>
                      <TableCell className="text-xs">
                        ${effectivePrice.toFixed(2)}
                        {Number(s.discount_percent) > 0 && <span className="text-[10px] text-muted-foreground ml-1">(-{s.discount_percent}%)</span>}
                      </TableCell>
                      <TableCell className="text-xs">{FREQUENCIES.find(f => f.value === s.frequency)?.label || s.frequency}</TableCell>
                      <TableCell className="text-xs">
                        {s.next_order_date ? (
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3 text-muted-foreground" />
                            {new Date(s.next_order_date).toLocaleDateString()}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-xs">{s.total_orders_created}</TableCell>
                      <TableCell>{statusBadge(s.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {s.status === "active" && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Pause" onClick={() => updateStatus.mutate({ id: s.id, status: "paused" })}>
                              <Pause className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {s.status === "paused" && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Resume" onClick={() => updateStatus.mutate({ id: s.id, status: "active" })}>
                              <Play className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {(s.status === "active" || s.status === "paused") && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="Cancel" onClick={() => { setCancellingSubId(s.id); setCancelReason(""); setCancelDialogOpen(true); }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      {/* Cancellation Survey Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-sm">Cancel Subscription</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">We're sorry to see you go. Please tell us why you're cancelling so we can improve.</p>
          <div className="space-y-2">
            {CANCEL_REASONS.map(r => (
              <label key={r} className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded-md hover:bg-muted/50 transition-colors">
                <input type="radio" name="cancel_reason" value={r} checked={cancelReason === r} onChange={() => setCancelReason(r)} className="accent-primary" />
                {r}
              </label>
            ))}
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setCancelDialogOpen(false)}>Keep Subscription</Button>
            <Button variant="destructive" size="sm" disabled={!cancelReason} onClick={() => {
              if (cancellingSubId) {
                updateStatus.mutate({ id: cancellingSubId, status: "cancelled" });
                toast.info(`Cancellation reason: ${cancelReason}`);
              }
              setCancelDialogOpen(false);
              setCancellingSubId(null);
            }}>Confirm Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </AdminLayout>
  );
}
