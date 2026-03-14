import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Users, Target, Play, Pause, RefreshCw } from "lucide-react";
import { format } from "date-fns";

const RULE_FIELDS = [
  { value: "total_spent", label: "Total Spent" },
  { value: "total_orders", label: "Total Orders" },
  { value: "segment", label: "Current Segment" },
  { value: "created_at", label: "Account Created" },
  { value: "tags", label: "Tags" },
  { value: "rfm_recency", label: "RFM Recency (days since last order)" },
  { value: "rfm_frequency", label: "RFM Frequency (order count)" },
  { value: "rfm_monetary", label: "RFM Monetary (total spent)" },
];

const OPERATORS = [
  { value: "gt", label: "Greater than" },
  { value: "lt", label: "Less than" },
  { value: "eq", label: "Equals" },
  { value: "gte", label: "Greater or equal" },
  { value: "lte", label: "Less or equal" },
  { value: "contains", label: "Contains" },
];

const SEGMENTS = ["vip", "regular", "new", "at_risk", "churned", "wholesale", "high_value"];

interface RuleCondition {
  field: string;
  operator: string;
  value: string;
}

export default function CustomerSegments() {
  const { currentStore } = useAuth();
  const storeId = currentStore?.id;
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", segment: "vip", match_type: "all", is_active: true,
    conditions: [{ field: "total_spent", operator: "gt", value: "" }] as RuleCondition[],
  });

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["segmentation_rules", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data } = await supabase.from("customer_segmentation_rules")
        .select("*").eq("store_id", storeId!).order("created_at", { ascending: false });
      return (data || []) as any[];
    },
  });

  const addCondition = () => {
    setForm(f => ({ ...f, conditions: [...f.conditions, { field: "total_orders", operator: "gt", value: "" }] }));
  };

  const removeCondition = (idx: number) => {
    setForm(f => ({ ...f, conditions: f.conditions.filter((_, i) => i !== idx) }));
  };

  const updateCondition = (idx: number, key: keyof RuleCondition, val: string) => {
    setForm(f => ({
      ...f,
      conditions: f.conditions.map((c, i) => i === idx ? { ...c, [key]: val } : c),
    }));
  };

  const saveRule = async () => {
    if (!form.name.trim() || !storeId) { toast.error("Name required"); return; }
    if (form.conditions.some(c => !c.value)) { toast.error("All conditions need values"); return; }
    const payload: any = {
      store_id: storeId, name: form.name.trim(), segment: form.segment,
      match_type: form.match_type, is_active: form.is_active,
      rules: form.conditions,
    };
    if (editingId) {
      await supabase.from("customer_segmentation_rules").update(payload).eq("id", editingId);
      toast.success("Rule updated");
    } else {
      await supabase.from("customer_segmentation_rules").insert(payload);
      toast.success("Rule created");
    }
    setShowForm(false); setEditingId(null);
    setForm({ name: "", segment: "vip", match_type: "all", is_active: true, conditions: [{ field: "total_spent", operator: "gt", value: "" }] });
    qc.invalidateQueries({ queryKey: ["segmentation_rules"] });
  };

  const deleteRule = async (id: string) => {
    await supabase.from("customer_segmentation_rules").delete().eq("id", id);
    toast.success("Rule deleted");
    qc.invalidateQueries({ queryKey: ["segmentation_rules"] });
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await supabase.from("customer_segmentation_rules").update({ is_active: !isActive } as any).eq("id", id);
    qc.invalidateQueries({ queryKey: ["segmentation_rules"] });
  };

  const editRule = (r: any) => {
    setForm({
      name: r.name, segment: r.segment, match_type: r.match_type, is_active: r.is_active,
      conditions: Array.isArray(r.rules) ? r.rules : [{ field: "total_spent", operator: "gt", value: "" }],
    });
    setEditingId(r.id); setShowForm(true);
  };

  const runRule = async (rule: any) => {
    // Simulate running the rule by counting matching customers
    if (!storeId) return;
    let query = supabase.from("customers").select("id", { count: "exact" }).eq("store_id", storeId);
    const conditions: RuleCondition[] = Array.isArray(rule.rules) ? rule.rules : [];
    for (const c of conditions) {
      if (c.field === "total_spent" || c.field === "total_orders") {
        const val = Number(c.value);
        if (c.operator === "gt") query = query.gt(c.field, val);
        else if (c.operator === "lt") query = query.lt(c.field, val);
        else if (c.operator === "gte") query = query.gte(c.field, val);
        else if (c.operator === "lte") query = query.lte(c.field, val);
        else if (c.operator === "eq") query = query.eq(c.field, val);
      } else if (c.field === "segment") {
        query = query.eq("segment", c.value);
      }
    }
    const { count } = await query;
    // Update matched_count and last_run_at
    await supabase.from("customer_segmentation_rules").update({
      matched_count: count || 0, last_run_at: new Date().toISOString(),
    } as any).eq("id", rule.id);
    toast.success(`Matched ${count || 0} customers`);
    qc.invalidateQueries({ queryKey: ["segmentation_rules"] });
  };

  // RFM Analysis
  const [rfmData, setRfmData] = useState<any[]>([]);
  const [rfmLoading, setRfmLoading] = useState(false);

  const runRfmAnalysis = async () => {
    if (!storeId) return;
    setRfmLoading(true);
    try {
      const { data: customers } = await supabase.from("customers").select("id, name, email, total_orders, total_spent, segment").eq("store_id", storeId).order("total_spent", { ascending: false }).limit(200);
      if (!customers || customers.length === 0) { toast.info("No customers found"); setRfmLoading(false); return; }
      const { data: orders } = await supabase.from("orders").select("customer_id, created_at").eq("store_id", storeId).order("created_at", { ascending: false });
      const now = Date.now();
      const lastOrderMap: Record<string, number> = {};
      (orders || []).forEach((o: any) => {
        if (!lastOrderMap[o.customer_id]) lastOrderMap[o.customer_id] = new Date(o.created_at).getTime();
      });
      const scored = customers.map((c: any) => {
        const lastOrder = lastOrderMap[c.id];
        const recencyDays = lastOrder ? Math.floor((now - lastOrder) / (1000 * 60 * 60 * 24)) : 999;
        const frequency = c.total_orders || 0;
        const monetary = c.total_spent || 0;
        // Score 1-5 (5 = best)
        const rScore = recencyDays <= 7 ? 5 : recencyDays <= 30 ? 4 : recencyDays <= 90 ? 3 : recencyDays <= 180 ? 2 : 1;
        const fScore = frequency >= 20 ? 5 : frequency >= 10 ? 4 : frequency >= 5 ? 3 : frequency >= 2 ? 2 : 1;
        const mScore = monetary >= 5000 ? 5 : monetary >= 1000 ? 4 : monetary >= 500 ? 3 : monetary >= 100 ? 2 : 1;
        const rfmSegment = rScore >= 4 && fScore >= 4 ? "Champion" :
          rScore >= 3 && fScore >= 3 ? "Loyal" :
          rScore >= 4 && fScore <= 2 ? "New" :
          rScore <= 2 && fScore >= 3 ? "At Risk" :
          rScore <= 2 && fScore <= 2 ? "Lost" : "Potential";
        return { ...c, recencyDays, rScore, fScore, mScore, rfmSegment };
      });
      setRfmData(scored);
      toast.success(`RFM analysis complete for ${scored.length} customers`);
    } catch (err: any) { toast.error(err.message); }
    finally { setRfmLoading(false); }
  };

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Customer Segments</h1>
            <p className="text-xs text-muted-foreground">Automated segmentation rules & RFM analysis</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="text-xs h-8 gap-1" onClick={runRfmAnalysis} disabled={rfmLoading}>
              <Target className="h-3.5 w-3.5" /> {rfmLoading ? "Analyzing..." : "RFM Analysis"}
            </Button>
            <Button size="sm" className="text-xs h-8 gap-1" onClick={() => {
              setForm({ name: "", segment: "vip", match_type: "all", is_active: true, conditions: [{ field: "total_spent", operator: "gt", value: "" }] });
              setEditingId(null); setShowForm(true);
            }}>
              <Plus className="h-3.5 w-3.5" /> New Rule
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Rules</p><p className="text-xl font-bold">{rules.length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Active</p><p className="text-xl font-bold text-primary">{rules.filter((r: any) => r.is_active).length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Matched</p><p className="text-xl font-bold">{rules.reduce((s: number, r: any) => s + (r.matched_count || 0), 0)}</p></CardContent></Card>
        </div>

        {/* RFM Results */}
        {rfmData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">RFM Segmentation Results</CardTitle>
                <Badge variant="outline" className="text-[10px]">{rfmData.length} customers</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 p-4 pb-2">
                {["Champion", "Loyal", "Potential", "New", "At Risk", "Lost"].map(seg => {
                  const count = rfmData.filter(d => d.rfmSegment === seg).length;
                  return (
                    <div key={seg} className="text-center p-2 rounded-md bg-muted/50">
                      <p className="text-lg font-bold">{count}</p>
                      <p className="text-[10px] text-muted-foreground">{seg}</p>
                    </div>
                  );
                })}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs h-8">Customer</TableHead>
                    <TableHead className="text-xs h-8 text-center">R</TableHead>
                    <TableHead className="text-xs h-8 text-center">F</TableHead>
                    <TableHead className="text-xs h-8 text-center">M</TableHead>
                    <TableHead className="text-xs h-8">Segment</TableHead>
                    <TableHead className="text-xs h-8 text-right">Last Order</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rfmData.slice(0, 20).map((c: any) => (
                    <TableRow key={c.id} className="text-xs">
                      <TableCell className="py-1.5">{c.name}</TableCell>
                      <TableCell className="py-1.5 text-center font-mono">{c.rScore}</TableCell>
                      <TableCell className="py-1.5 text-center font-mono">{c.fScore}</TableCell>
                      <TableCell className="py-1.5 text-center font-mono">{c.mScore}</TableCell>
                      <TableCell className="py-1.5">
                        <Badge variant={c.rfmSegment === "Champion" ? "default" : c.rfmSegment === "At Risk" || c.rfmSegment === "Lost" ? "destructive" : "secondary"} className="text-[10px]">
                          {c.rfmSegment}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-1.5 text-right text-muted-foreground">{c.recencyDays < 999 ? `${c.recencyDays}d ago` : "Never"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-8">Name</TableHead>
                  <TableHead className="text-xs h-8">Segment</TableHead>
                  <TableHead className="text-xs h-8">Match</TableHead>
                  <TableHead className="text-xs h-8">Conditions</TableHead>
                  <TableHead className="text-xs h-8 text-right">Matched</TableHead>
                  <TableHead className="text-xs h-8">Last Run</TableHead>
                  <TableHead className="text-xs h-8">Status</TableHead>
                  <TableHead className="text-xs h-8 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
                )) : rules.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">
                    <Target className="h-6 w-6 mx-auto mb-1 text-muted-foreground/40" />No segmentation rules
                  </TableCell></TableRow>
                ) : rules.map((r: any) => (
                  <TableRow key={r.id} className="text-xs">
                    <TableCell className="py-1.5 font-medium">{r.name}</TableCell>
                    <TableCell className="py-1.5"><Badge variant="outline" className="text-[10px] capitalize">{r.segment}</Badge></TableCell>
                    <TableCell className="py-1.5 capitalize text-muted-foreground">{r.match_type}</TableCell>
                    <TableCell className="py-1.5 text-muted-foreground">
                      {Array.isArray(r.rules) ? `${r.rules.length} condition${r.rules.length !== 1 ? "s" : ""}` : "—"}
                    </TableCell>
                    <TableCell className="py-1.5 text-right font-semibold">{r.matched_count || 0}</TableCell>
                    <TableCell className="py-1.5 text-muted-foreground">{r.last_run_at ? format(new Date(r.last_run_at), "MMM d HH:mm") : "Never"}</TableCell>
                    <TableCell className="py-1.5">
                      <Badge variant={r.is_active ? "default" : "secondary"} className="text-[10px] cursor-pointer" onClick={() => toggleActive(r.id, r.is_active)}>
                        {r.is_active ? "Active" : "Paused"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-1.5 text-right space-x-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6" title="Run now" onClick={() => runRule(r)}><RefreshCw className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => editRule(r)}><Edit className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteRule(r.id)}><Trash2 className="h-3 w-3" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="text-sm">{editingId ? "Edit" : "New"} Segmentation Rule</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-9 text-xs" placeholder="VIP Customers" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Target Segment</Label>
                  <Select value={form.segment} onValueChange={v => setForm(f => ({ ...f, segment: v }))}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SEGMENTS.map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace("_", " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Match Type</Label>
                  <Select value={form.match_type} onValueChange={v => setForm(f => ({ ...f, match_type: v }))}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">All conditions (AND)</SelectItem>
                      <SelectItem value="any" className="text-xs">Any condition (OR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs">Conditions</Label>
                  <Button variant="outline" size="sm" className="text-xs h-6" onClick={addCondition}><Plus className="h-3 w-3 mr-1" /> Add</Button>
                </div>
                <div className="space-y-2">
                  {form.conditions.map((c, idx) => (
                    <div key={idx} className="flex gap-1.5 items-center">
                      <Select value={c.field} onValueChange={v => updateCondition(idx, "field", v)}>
                        <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>{RULE_FIELDS.map(f => <SelectItem key={f.value} value={f.value} className="text-xs">{f.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={c.operator} onValueChange={v => updateCondition(idx, "operator", v)}>
                        <SelectTrigger className="h-8 text-xs w-[120px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{OPERATORS.map(o => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input value={c.value} onChange={e => updateCondition(idx, "value", e.target.value)} className="h-8 text-xs w-24" placeholder="Value" />
                      {form.conditions.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive shrink-0" onClick={() => removeCondition(idx)}><Trash2 className="h-3 w-3" /></Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                <Label className="text-xs">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" className="text-xs" onClick={saveRule}>{editingId ? "Update" : "Create"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
