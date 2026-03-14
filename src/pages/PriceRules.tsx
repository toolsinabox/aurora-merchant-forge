import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Percent, DollarSign, Gift, Truck, Zap, ShoppingBag, UserPlus } from "lucide-react";
import { format } from "date-fns";

const RULE_TYPES = [
  { value: "percentage", label: "Percentage Off", icon: Percent },
  { value: "fixed_amount", label: "Fixed Amount Off", icon: DollarSign },
  { value: "buy_x_get_y", label: "Buy X Get Y", icon: Gift },
  { value: "free_shipping", label: "Free Shipping", icon: Truck },
  { value: "gift_with_purchase", label: "Gift With Purchase", icon: ShoppingBag },
  { value: "first_order", label: "First Order Discount", icon: UserPlus },
];

const APPLIES_TO = [
  { value: "all", label: "All Products" },
  { value: "specific_products", label: "Specific Products" },
  { value: "specific_categories", label: "Specific Categories" },
];

export default function PriceRules() {
  const { currentStore } = useAuth();
  const storeId = currentStore?.id;
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", rule_type: "percentage", discount_value: "10", applies_to: "all",
    min_order_amount: "", min_quantity: "", buy_quantity: "2", get_quantity: "1",
    starts_at: "", ends_at: "", priority: "0", max_uses: "",
    gift_product_sku: "", // for gift_with_purchase type
  });

  const { data: rules = [] } = useQuery({
    queryKey: ["price-rules", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data } = await supabase.from("price_rules" as any).select("*")
        .eq("store_id", storeId!).order("priority", { ascending: false });
      return (data || []) as any[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.name) throw new Error("Name is required");
      const payload: any = {
        store_id: storeId!,
        name: form.name,
        rule_type: form.rule_type,
        discount_value: parseFloat(form.discount_value) || 0,
        applies_to: form.applies_to,
        min_order_amount: form.min_order_amount ? parseFloat(form.min_order_amount) : null,
        min_quantity: form.min_quantity ? parseInt(form.min_quantity) : null,
        buy_quantity: form.rule_type === "buy_x_get_y" ? parseInt(form.buy_quantity) || 2 : null,
        get_quantity: form.rule_type === "buy_x_get_y" ? parseInt(form.get_quantity) || 1 : null,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
        priority: parseInt(form.priority) || 0,
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      };
      if (editingId) {
        await supabase.from("price_rules" as any).update(payload).eq("id", editingId);
      } else {
        await supabase.from("price_rules" as any).insert(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-rules"] });
      closeForm();
      toast.success(editingId ? "Rule updated" : "Rule created");
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await supabase.from("price_rules" as any).update({ is_active: active }).eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["price-rules"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("price_rules" as any).delete().eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-rules"] });
      toast.success("Rule deleted");
    },
  });

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ name: "", rule_type: "percentage", discount_value: "10", applies_to: "all",
      min_order_amount: "", min_quantity: "", buy_quantity: "2", get_quantity: "1",
      starts_at: "", ends_at: "", priority: "0", max_uses: "" });
  };

  const editRule = (r: any) => {
    setForm({
      name: r.name, rule_type: r.rule_type,
      discount_value: String(r.discount_value),
      applies_to: r.applies_to,
      min_order_amount: r.min_order_amount ? String(r.min_order_amount) : "",
      min_quantity: r.min_quantity ? String(r.min_quantity) : "",
      buy_quantity: r.buy_quantity ? String(r.buy_quantity) : "2",
      get_quantity: r.get_quantity ? String(r.get_quantity) : "1",
      starts_at: r.starts_at ? r.starts_at.slice(0, 16) : "",
      ends_at: r.ends_at ? r.ends_at.slice(0, 16) : "",
      priority: String(r.priority || 0),
      max_uses: r.max_uses ? String(r.max_uses) : "",
    });
    setEditingId(r.id);
    setShowForm(true);
  };

  const activeCount = rules.filter((r) => r.is_active).length;

  const getRuleTypeInfo = (type: string) => RULE_TYPES.find(t => t.value === type) || RULE_TYPES[0];

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Automatic Discounts</h1>
            <p className="text-xs text-muted-foreground">Price rules that apply automatically at checkout without a coupon code</p>
          </div>
          <Button size="sm" className="h-8 text-xs gap-1" onClick={() => setShowForm(true)}><Plus className="h-3.5 w-3.5" /> New Rule</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <Zap className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-xs text-muted-foreground">Active Rules</p>
              <p className="text-2xl font-bold">{activeCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <Percent className="h-5 w-5 mx-auto mb-1 text-blue-600" />
              <p className="text-xs text-muted-foreground">Total Rules</p>
              <p className="text-2xl font-bold">{rules.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <DollarSign className="h-5 w-5 mx-auto mb-1 text-green-600" />
              <p className="text-xs text-muted-foreground">Total Uses</p>
              <p className="text-2xl font-bold">{rules.reduce((s, r) => s + (r.usage_count || 0), 0)}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Price Rules</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Conditions</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Uses</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((r) => {
                  const info = getRuleTypeInfo(r.rule_type);
                  const Icon = info.icon;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium text-sm">{r.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs gap-1">
                          <Icon className="h-3 w-3" /> {info.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.rule_type === "percentage" ? `${r.discount_value}%` :
                         r.rule_type === "fixed_amount" ? `$${r.discount_value}` :
                         r.rule_type === "buy_x_get_y" ? `Buy ${r.buy_quantity} Get ${r.get_quantity}` :
                         "Free Shipping"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.min_order_amount ? `Min $${r.min_order_amount}` : ""}
                        {r.min_quantity ? ` Min ${r.min_quantity} items` : ""}
                        {!r.min_order_amount && !r.min_quantity ? "None" : ""}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.starts_at || r.ends_at ? (
                          <span>{r.starts_at ? format(new Date(r.starts_at), "MMM d") : "—"} → {r.ends_at ? format(new Date(r.ends_at), "MMM d") : "∞"}</span>
                        ) : "Always"}
                      </TableCell>
                      <TableCell className="text-sm">{r.usage_count}{r.max_uses ? `/${r.max_uses}` : ""}</TableCell>
                      <TableCell>
                        <Switch checked={r.is_active} onCheckedChange={(c) => toggleMutation.mutate({ id: r.id, active: c })} />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => editRule(r)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(r.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {rules.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No price rules yet. Create one to apply automatic discounts.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showForm} onOpenChange={(o) => !o && closeForm()}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Edit" : "New"} Price Rule</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Rule Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. 10% off orders over $100" /></div>
            <div><Label>Rule Type</Label>
              <Select value={form.rule_type} onValueChange={v => setForm(f => ({ ...f, rule_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{RULE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {form.rule_type !== "free_shipping" && form.rule_type !== "buy_x_get_y" && (
              <div><Label>Discount Value {form.rule_type === "percentage" ? "(%)" : "($)"}</Label>
                <Input type="number" value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))} />
              </div>
            )}
            {form.rule_type === "buy_x_get_y" && (
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Buy Quantity</Label><Input type="number" value={form.buy_quantity} onChange={e => setForm(f => ({ ...f, buy_quantity: e.target.value }))} /></div>
                <div><Label>Get Quantity (Free)</Label><Input type="number" value={form.get_quantity} onChange={e => setForm(f => ({ ...f, get_quantity: e.target.value }))} /></div>
              </div>
            )}
            <div><Label>Applies To</Label>
              <Select value={form.applies_to} onValueChange={v => setForm(f => ({ ...f, applies_to: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{APPLIES_TO.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Min Order Amount ($)</Label><Input type="number" value={form.min_order_amount} onChange={e => setForm(f => ({ ...f, min_order_amount: e.target.value }))} placeholder="Optional" /></div>
              <div><Label>Min Quantity</Label><Input type="number" value={form.min_quantity} onChange={e => setForm(f => ({ ...f, min_quantity: e.target.value }))} placeholder="Optional" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Starts At</Label><Input type="datetime-local" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} /></div>
              <div><Label>Ends At</Label><Input type="datetime-local" value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Priority (higher = first)</Label><Input type="number" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} /></div>
              <div><Label>Max Uses</Label><Input type="number" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))} placeholder="Unlimited" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()}>{editingId ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
