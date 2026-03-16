import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Zap, ArrowRight, Trash2, Edit, Copy, Play, Pause } from "lucide-react";

const TRIGGERS = [
  { value: "order_created", label: "Order Created" },
  { value: "status_changed", label: "Order Status Changed" },
  { value: "payment_received", label: "Payment Received" },
  { value: "payment_failed", label: "Payment Failed" },
  { value: "order_shipped", label: "Order Shipped" },
  { value: "order_delivered", label: "Order Delivered" },
  { value: "order_cancelled", label: "Order Cancelled" },
  { value: "refund_issued", label: "Refund Issued" },
  { value: "return_requested", label: "Return Requested" },
  { value: "order_on_hold", label: "Order On Hold" },
  { value: "backorder_created", label: "Backorder Created" },
];

const ACTIONS = [
  { value: "send_email", label: "Send Email" },
  { value: "send_sms", label: "Send SMS" },
  { value: "change_status", label: "Change Order Status" },
  { value: "add_tag", label: "Add Tag" },
  { value: "fire_webhook", label: "Fire Webhook" },
  { value: "assign_warehouse", label: "Assign Warehouse" },
  { value: "create_task", label: "Create Staff Task" },
  { value: "update_inventory", label: "Update Inventory" },
  { value: "notify_staff", label: "Notify Staff" },
  { value: "apply_coupon", label: "Apply Coupon" },
];

const STATUSES = ["new", "processing", "awaiting_payment", "awaiting_shipment", "shipped", "delivered", "completed", "cancelled", "on_hold", "refunded"];

interface WorkflowRule {
  id: string;
  name: string;
  trigger: string;
  trigger_value?: string;
  conditions: { field: string; operator: string; value: string }[];
  actions: { type: string; config: Record<string, string> }[];
  is_active: boolean;
  priority: number;
  runs: number;
}

function generateId() { return Math.random().toString(36).slice(2, 10); }

export default function OrderWorkflows() {
  const [rules, setRules] = useState<WorkflowRule[]>(() => {
    try { return JSON.parse(localStorage.getItem("order_workflows") || "[]"); } catch { return []; }
  });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    trigger: "order_created",
    trigger_value: "",
    conditions: [] as { field: string; operator: string; value: string }[],
    actions: [{ type: "send_email", config: {} as Record<string, string> }],
    priority: 10,
  });

  const save = (newRules: WorkflowRule[]) => {
    setRules(newRules);
    localStorage.setItem("order_workflows", JSON.stringify(newRules));
  };

  const handleSave = () => {
    if (!form.name) { toast.error("Name is required"); return; }
    if (editingId) {
      save(rules.map(r => r.id === editingId ? { ...r, ...form, trigger_value: form.trigger_value } : r));
      toast.success("Workflow updated");
    } else {
      save([...rules, { id: generateId(), ...form, trigger_value: form.trigger_value, is_active: true, runs: 0 }]);
      toast.success("Workflow created");
    }
    setShowForm(false);
    setEditingId(null);
    resetForm();
  };

  const resetForm = () => setForm({ name: "", trigger: "order_created", trigger_value: "", conditions: [], actions: [{ type: "send_email", config: {} }], priority: 10 });

  const editRule = (r: WorkflowRule) => {
    setForm({ name: r.name, trigger: r.trigger, trigger_value: r.trigger_value || "", conditions: r.conditions, actions: r.actions, priority: r.priority });
    setEditingId(r.id);
    setShowForm(true);
  };

  const duplicateRule = (r: WorkflowRule) => {
    const dup: WorkflowRule = { ...r, id: generateId(), name: `${r.name} (Copy)`, runs: 0 };
    save([...rules, dup]);
    toast.success("Workflow duplicated");
  };

  const deleteRule = (id: string) => { save(rules.filter(r => r.id !== id)); toast.success("Workflow deleted"); };
  const toggleActive = (id: string) => { save(rules.map(r => r.id === id ? { ...r, is_active: !r.is_active } : r)); };

  const addAction = () => setForm({ ...form, actions: [...form.actions, { type: "send_email", config: {} }] });
  const removeAction = (i: number) => setForm({ ...form, actions: form.actions.filter((_, idx) => idx !== i) });
  const addCondition = () => setForm({ ...form, conditions: [...form.conditions, { field: "total", operator: "gt", value: "0" }] });
  const removeCondition = (i: number) => setForm({ ...form, conditions: form.conditions.filter((_, idx) => idx !== i) });

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Order Workflow Automation</h1>
            <p className="text-xs text-muted-foreground">Automate actions when order events occur — Maropost-style trigger → condition → action rules</p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => { resetForm(); setEditingId(null); setShowForm(true); }}>
            <Plus className="h-3.5 w-3.5" /> New Workflow
          </Button>
        </div>

        {rules.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center space-y-3">
              <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">No workflow rules yet</h3>
                <p className="text-sm text-muted-foreground">Create automation rules to trigger actions on order events.</p>
              </div>
              <Button size="sm" onClick={() => setShowForm(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Create First Workflow</Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs h-9">Status</TableHead>
                    <TableHead className="text-xs h-9">Name</TableHead>
                    <TableHead className="text-xs h-9">Trigger</TableHead>
                    <TableHead className="text-xs h-9">Actions</TableHead>
                    <TableHead className="text-xs h-9">Priority</TableHead>
                    <TableHead className="text-xs h-9">Runs</TableHead>
                    <TableHead className="text-xs h-9 w-32"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.sort((a, b) => a.priority - b.priority).map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="py-2">
                        <Switch checked={r.is_active} onCheckedChange={() => toggleActive(r.id)} />
                      </TableCell>
                      <TableCell className="py-2 font-medium text-xs">{r.name}</TableCell>
                      <TableCell className="py-2">
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <Zap className="h-2.5 w-2.5" />
                          {TRIGGERS.find(t => t.value === r.trigger)?.label || r.trigger}
                        </Badge>
                        {r.trigger_value && <span className="text-[10px] text-muted-foreground ml-1">→ {r.trigger_value}</span>}
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-1 flex-wrap">
                          {r.actions.map((a, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px]">
                              {ACTIONS.find(ac => ac.value === a.type)?.label || a.type}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground">{r.priority}</TableCell>
                      <TableCell className="py-2 text-xs">{r.runs}</TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => editRule(r)}><Edit className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => duplicateRule(r)}><Copy className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteRule(r.id)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Workflow form dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-sm">{editingId ? "Edit" : "New"} Workflow Rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Rule Name</Label>
                <Input className="h-8 text-xs mt-1" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Send confirmation email" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Trigger Event</Label>
                  <Select value={form.trigger} onValueChange={v => setForm({ ...form, trigger: v })}>
                    <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TRIGGERS.map(t => <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {form.trigger === "status_changed" && (
                  <div>
                    <Label className="text-xs">To Status</Label>
                    <Select value={form.trigger_value} onValueChange={v => setForm({ ...form, trigger_value: v })}>
                      <SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="Any" /></SelectTrigger>
                      <SelectContent>
                        {STATUSES.map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace(/_/g, " ")}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label className="text-xs">Priority (lower = first)</Label>
                  <Input className="h-8 text-xs mt-1" type="number" value={form.priority} onChange={e => setForm({ ...form, priority: parseInt(e.target.value) || 10 })} />
                </div>
              </div>

              {/* Conditions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs font-medium">Conditions (optional)</Label>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={addCondition}><Plus className="h-3 w-3 mr-1" /> Add</Button>
                </div>
                {form.conditions.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <Select value={c.field} onValueChange={v => { const conds = [...form.conditions]; conds[i].field = v; setForm({ ...form, conditions: conds }); }}>
                      <SelectTrigger className="h-7 text-[10px] w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="total" className="text-xs">Order Total</SelectItem>
                        <SelectItem value="items_count" className="text-xs">Item Count</SelectItem>
                        <SelectItem value="payment_method" className="text-xs">Payment Method</SelectItem>
                        <SelectItem value="shipping_method" className="text-xs">Shipping Method</SelectItem>
                        <SelectItem value="customer_segment" className="text-xs">Customer Segment</SelectItem>
                        <SelectItem value="tag" className="text-xs">Order Tag</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={c.operator} onValueChange={v => { const conds = [...form.conditions]; conds[i].operator = v; setForm({ ...form, conditions: conds }); }}>
                      <SelectTrigger className="h-7 text-[10px] w-20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="eq" className="text-xs">equals</SelectItem>
                        <SelectItem value="ne" className="text-xs">not equal</SelectItem>
                        <SelectItem value="gt" className="text-xs">greater than</SelectItem>
                        <SelectItem value="lt" className="text-xs">less than</SelectItem>
                        <SelectItem value="contains" className="text-xs">contains</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input className="h-7 text-[10px] flex-1" value={c.value} onChange={e => { const conds = [...form.conditions]; conds[i].value = e.target.value; setForm({ ...form, conditions: conds }); }} />
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeCondition(i)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs font-medium">Actions</Label>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={addAction}><Plus className="h-3 w-3 mr-1" /> Add</Button>
                </div>
                {form.actions.map((a, i) => (
                  <div key={i} className="border rounded-md p-3 mb-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <Select value={a.type} onValueChange={v => { const acts = [...form.actions]; acts[i] = { type: v, config: {} }; setForm({ ...form, actions: acts }); }}>
                        <SelectTrigger className="h-7 text-[10px] flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ACTIONS.map(ac => <SelectItem key={ac.value} value={ac.value} className="text-xs">{ac.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {form.actions.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeAction(i)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                      )}
                    </div>
                    {a.type === "send_email" && (
                      <div className="space-y-1.5">
                        <Input className="h-7 text-[10px]" placeholder="Email template key or subject" value={a.config.template || ""} onChange={e => { const acts = [...form.actions]; acts[i].config = { ...acts[i].config, template: e.target.value }; setForm({ ...form, actions: acts }); }} />
                      </div>
                    )}
                    {a.type === "change_status" && (
                      <Select value={a.config.status || ""} onValueChange={v => { const acts = [...form.actions]; acts[i].config = { status: v }; setForm({ ...form, actions: acts }); }}>
                        <SelectTrigger className="h-7 text-[10px]"><SelectValue placeholder="New status" /></SelectTrigger>
                        <SelectContent>
                          {STATUSES.map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace(/_/g, " ")}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                    {a.type === "fire_webhook" && (
                      <Input className="h-7 text-[10px]" placeholder="https://example.com/webhook" value={a.config.url || ""} onChange={e => { const acts = [...form.actions]; acts[i].config = { url: e.target.value }; setForm({ ...form, actions: acts }); }} />
                    )}
                    {a.type === "add_tag" && (
                      <Input className="h-7 text-[10px]" placeholder="Tag name" value={a.config.tag || ""} onChange={e => { const acts = [...form.actions]; acts[i].config = { tag: e.target.value }; setForm({ ...form, actions: acts }); }} />
                    )}
                    {a.type === "notify_staff" && (
                      <Input className="h-7 text-[10px]" placeholder="Staff email" value={a.config.email || ""} onChange={e => { const acts = [...form.actions]; acts[i].config = { email: e.target.value }; setForm({ ...form, actions: acts }); }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSave}>{editingId ? "Update" : "Create"} Workflow</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
