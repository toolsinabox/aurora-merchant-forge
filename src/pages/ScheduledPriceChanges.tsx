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
import { toast } from "sonner";
import { Plus, Edit, Trash2, Clock, Calendar, DollarSign, Percent, Zap } from "lucide-react";
import { format, isPast, isFuture, isWithinInterval } from "date-fns";

interface PriceSchedule {
  id: string;
  name: string;
  change_type: "percentage" | "fixed" | "set_price";
  change_value: number;
  applies_to: "all" | "sku_list" | "category";
  sku_list: string;
  category_name: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_at: string;
}

function genId() { return Math.random().toString(36).slice(2, 10); }

export default function ScheduledPriceChanges() {
  const [schedules, setSchedules] = useState<PriceSchedule[]>(() => {
    try { return JSON.parse(localStorage.getItem("scheduled_price_changes") || "[]"); } catch { return []; }
  });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", change_type: "percentage" as "percentage" | "fixed" | "set_price",
    change_value: "10", applies_to: "all" as "all" | "sku_list" | "category",
    sku_list: "", category_name: "", starts_at: "", ends_at: "",
  });

  const save = (s: PriceSchedule[]) => { setSchedules(s); localStorage.setItem("scheduled_price_changes", JSON.stringify(s)); };

  const handleSave = () => {
    if (!form.name || !form.starts_at) { toast.error("Name and start date required"); return; }
    const entry: PriceSchedule = {
      id: editingId || genId(),
      name: form.name,
      change_type: form.change_type,
      change_value: parseFloat(form.change_value) || 0,
      applies_to: form.applies_to,
      sku_list: form.sku_list,
      category_name: form.category_name,
      starts_at: form.starts_at,
      ends_at: form.ends_at,
      is_active: true,
      created_at: editingId ? schedules.find(s => s.id === editingId)?.created_at || new Date().toISOString() : new Date().toISOString(),
    };
    if (editingId) {
      save(schedules.map(s => s.id === editingId ? entry : s));
      toast.success("Schedule updated");
    } else {
      save([...schedules, entry]);
      toast.success("Schedule created");
    }
    setShowForm(false);
    setEditingId(null);
    resetForm();
  };

  const resetForm = () => setForm({ name: "", change_type: "percentage", change_value: "10", applies_to: "all", sku_list: "", category_name: "", starts_at: "", ends_at: "" });

  const editSchedule = (s: PriceSchedule) => {
    setForm({
      name: s.name, change_type: s.change_type, change_value: String(s.change_value),
      applies_to: s.applies_to, sku_list: s.sku_list, category_name: s.category_name,
      starts_at: s.starts_at, ends_at: s.ends_at,
    });
    setEditingId(s.id);
    setShowForm(true);
  };

  const deleteSchedule = (id: string) => { save(schedules.filter(s => s.id !== id)); toast.success("Deleted"); };
  const toggleActive = (id: string) => { save(schedules.map(s => s.id === id ? { ...s, is_active: !s.is_active } : s)); };

  const getStatus = (s: PriceSchedule) => {
    if (!s.is_active) return "inactive";
    const now = new Date();
    const start = new Date(s.starts_at);
    if (s.ends_at) {
      const end = new Date(s.ends_at);
      if (isWithinInterval(now, { start, end })) return "active";
      if (isPast(end)) return "expired";
    }
    if (isPast(start)) return "active";
    if (isFuture(start)) return "scheduled";
    return "active";
  };

  const statusColor: Record<string, string> = {
    active: "bg-success/10 text-success",
    scheduled: "bg-primary/10 text-primary",
    expired: "bg-muted text-muted-foreground",
    inactive: "bg-muted text-muted-foreground",
  };

  const changeTypeIcon: Record<string, React.ReactNode> = {
    percentage: <Percent className="h-3 w-3" />,
    fixed: <DollarSign className="h-3 w-3" />,
    set_price: <Zap className="h-3 w-3" />,
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Scheduled Price Changes</h1>
            <p className="text-xs text-muted-foreground">Schedule automatic price adjustments by date range — sales, promotions, seasonal pricing</p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => { resetForm(); setEditingId(null); setShowForm(true); }}>
            <Plus className="h-3.5 w-3.5" /> New Schedule
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-3">
          {["active", "scheduled", "expired", "inactive"].map(status => (
            <Card key={status}>
              <CardContent className="p-3 text-center">
                <p className="text-lg font-bold">{schedules.filter(s => getStatus(s) === status).length}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground capitalize">{status}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {schedules.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center space-y-3">
              <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">No scheduled price changes</h3>
              <p className="text-sm text-muted-foreground">Create rules to automatically adjust prices at set times.</p>
              <Button size="sm" onClick={() => setShowForm(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Create First Schedule</Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs h-9">Active</TableHead>
                    <TableHead className="text-xs h-9">Name</TableHead>
                    <TableHead className="text-xs h-9">Change</TableHead>
                    <TableHead className="text-xs h-9">Applies To</TableHead>
                    <TableHead className="text-xs h-9">Period</TableHead>
                    <TableHead className="text-xs h-9">Status</TableHead>
                    <TableHead className="text-xs h-9 w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map(s => {
                    const status = getStatus(s);
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="py-2"><Switch checked={s.is_active} onCheckedChange={() => toggleActive(s.id)} /></TableCell>
                        <TableCell className="py-2 text-xs font-medium">{s.name}</TableCell>
                        <TableCell className="py-2">
                          <Badge variant="outline" className="text-[10px] gap-1">
                            {changeTypeIcon[s.change_type]}
                            {s.change_type === "percentage" ? `${s.change_value}% off` :
                             s.change_type === "fixed" ? `$${s.change_value} off` :
                             `Set to $${s.change_value}`}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2 text-xs text-muted-foreground">
                          {s.applies_to === "all" ? "All Products" :
                           s.applies_to === "sku_list" ? `SKUs: ${s.sku_list.split(",").length} items` :
                           `Category: ${s.category_name}`}
                        </TableCell>
                        <TableCell className="py-2 text-xs text-muted-foreground">
                          {format(new Date(s.starts_at), "MMM d")}
                          {s.ends_at ? ` → ${format(new Date(s.ends_at), "MMM d")}` : " → Ongoing"}
                        </TableCell>
                        <TableCell className="py-2">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium uppercase ${statusColor[status]}`}>
                            {status}
                          </span>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => editSchedule(s)}><Edit className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteSchedule(s.id)}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm">{editingId ? "Edit" : "New"} Price Schedule</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Schedule Name</Label>
                <Input className="h-8 text-xs mt-1" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Summer Sale 20% Off" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Change Type</Label>
                  <Select value={form.change_type} onValueChange={(v: any) => setForm({ ...form, change_type: v })}>
                    <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage" className="text-xs">Percentage Off</SelectItem>
                      <SelectItem value="fixed" className="text-xs">Fixed Amount Off</SelectItem>
                      <SelectItem value="set_price" className="text-xs">Set Price</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Value</Label>
                  <Input className="h-8 text-xs mt-1" type="number" value={form.change_value}
                    onChange={e => setForm({ ...form, change_value: e.target.value })}
                    placeholder={form.change_type === "percentage" ? "e.g. 20" : "e.g. 5.00"} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Applies To</Label>
                <Select value={form.applies_to} onValueChange={(v: any) => setForm({ ...form, applies_to: v })}>
                  <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">All Products</SelectItem>
                    <SelectItem value="sku_list" className="text-xs">Specific SKUs</SelectItem>
                    <SelectItem value="category" className="text-xs">Category</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.applies_to === "sku_list" && (
                <div>
                  <Label className="text-xs">SKUs (comma-separated)</Label>
                  <Input className="h-8 text-xs mt-1" value={form.sku_list} onChange={e => setForm({ ...form, sku_list: e.target.value })} placeholder="SKU-001, SKU-002, SKU-003" />
                </div>
              )}
              {form.applies_to === "category" && (
                <div>
                  <Label className="text-xs">Category Name</Label>
                  <Input className="h-8 text-xs mt-1" value={form.category_name} onChange={e => setForm({ ...form, category_name: e.target.value })} placeholder="e.g. Summer Collection" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Start Date</Label>
                  <Input className="h-8 text-xs mt-1" type="datetime-local" value={form.starts_at} onChange={e => setForm({ ...form, starts_at: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">End Date (optional)</Label>
                  <Input className="h-8 text-xs mt-1" type="datetime-local" value={form.ends_at} onChange={e => setForm({ ...form, ends_at: e.target.value })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSave}>{editingId ? "Update" : "Create"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
