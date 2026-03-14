import { useState, useEffect, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProducts } from "@/hooks/use-data";
import { toast } from "sonner";
import { Plus, ClipboardCheck, Search, CheckCircle, AlertTriangle, Package, Calendar, Clock, Trash2, Download } from "lucide-react";
import { format } from "date-fns";

interface CycleCountSchedule {
  id: string;
  name: string;
  frequency: "daily" | "weekly" | "biweekly" | "monthly" | "quarterly";
  zone: string;
  category: string;
  nextRunDate: string;
  lastRunDate: string | null;
  isActive: boolean;
}

export default function Stocktake() {
  const { currentStore, user } = useAuth();
  const { data: products = [] } = useProducts();
  const [stocktakes, setStocktakes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("Stocktake");
  const [newNotes, setNewNotes] = useState("");
  const [activeStocktake, setActiveStocktake] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("stocktakes");

  // Cycle Count Scheduling state
  const [schedules, setSchedules] = useState<CycleCountSchedule[]>(() => {
    try { return JSON.parse(localStorage.getItem("cycle_count_schedules") || "[]"); } catch { return []; }
  });
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ name: "", frequency: "weekly" as CycleCountSchedule["frequency"], zone: "", category: "", nextRunDate: "" });

  const saveSchedules = (updated: CycleCountSchedule[]) => {
    setSchedules(updated);
    localStorage.setItem("cycle_count_schedules", JSON.stringify(updated));
  };

  const createSchedule = () => {
    if (!scheduleForm.name.trim()) { toast.error("Schedule name is required"); return; }
    if (!scheduleForm.nextRunDate) { toast.error("Next run date is required"); return; }
    const schedule: CycleCountSchedule = {
      id: crypto.randomUUID(),
      name: scheduleForm.name.trim(),
      frequency: scheduleForm.frequency,
      zone: scheduleForm.zone.trim(),
      category: scheduleForm.category.trim(),
      nextRunDate: scheduleForm.nextRunDate,
      lastRunDate: null,
      isActive: true,
    };
    saveSchedules([...schedules, schedule]);
    setScheduleForm({ name: "", frequency: "weekly", zone: "", category: "", nextRunDate: "" });
    setScheduleOpen(false);
    toast.success(`Schedule "${schedule.name}" created`);
  };

  const toggleSchedule = (id: string) => {
    saveSchedules(schedules.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
  };

  const deleteSchedule = (id: string) => {
    saveSchedules(schedules.filter(s => s.id !== id));
    toast.success("Schedule deleted");
  };

  const runScheduleNow = (schedule: CycleCountSchedule) => {
    // Create a stocktake from this schedule
    setNewName(`${schedule.name} — ${format(new Date(), "MMM d, yyyy")}`);
    setNewNotes(`Scheduled cycle count: ${schedule.frequency}, Zone: ${schedule.zone || "All"}, Category: ${schedule.category || "All"}`);
    setCreateOpen(true);
    // Update last run date
    saveSchedules(schedules.map(s => s.id === schedule.id ? { ...s, lastRunDate: new Date().toISOString() } : s));
  };

  const frequencyLabel: Record<string, string> = { daily: "Daily", weekly: "Weekly", biweekly: "Bi-weekly", monthly: "Monthly", quarterly: "Quarterly" };

  const fetchStocktakes = async () => {
    if (!currentStore) return;
    setLoading(true);
    const { data } = await supabase
      .from("stocktakes" as any)
      .select("*")
      .eq("store_id", currentStore.id)
      .order("created_at", { ascending: false });
    setStocktakes(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchStocktakes(); }, [currentStore]);

  const createStocktake = async () => {
    if (!currentStore || !user) return;
    try {
      // Create stocktake
      const { data: st, error } = await supabase
        .from("stocktakes" as any)
        .insert({ store_id: currentStore.id, name: newName, notes: newNotes || null, created_by: user.id } as any)
        .select()
        .single();
      if (error) throw error;

      // Create items from all products with their current stock
      const stockItems = products.map((p: any) => ({
        stocktake_id: (st as any).id,
        store_id: currentStore.id,
        product_id: p.id,
        expected_quantity: p.product_variants?.reduce((s: number, v: any) => s + (v.stock || 0), 0) || 0,
      }));

      if (stockItems.length > 0) {
        await supabase.from("stocktake_items" as any).insert(stockItems as any);
      }

      toast.success("Stocktake created with " + stockItems.length + " products");
      setCreateOpen(false);
      setNewName("Stocktake");
      setNewNotes("");
      fetchStocktakes();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const openStocktake = async (st: any) => {
    setActiveStocktake(st);
    const { data } = await supabase
      .from("stocktake_items" as any)
      .select("*, products:product_id(title, sku, images)")
      .eq("stocktake_id", st.id);
    setItems(data || []);
  };

  const updateCount = async (itemId: string, count: string) => {
    const qty = count === "" ? null : parseInt(count);
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, counted_quantity: qty } : i));
    await supabase
      .from("stocktake_items" as any)
      .update({ counted_quantity: qty, counted_at: qty !== null ? new Date().toISOString() : null, counted_by: user?.id } as any)
      .eq("id", itemId);
  };

  const completeStocktake = async () => {
    if (!activeStocktake) return;
    const uncounted = items.filter(i => i.counted_quantity === null || i.counted_quantity === undefined);
    if (uncounted.length > 0) {
      toast.error(`${uncounted.length} items haven't been counted yet`);
      return;
    }
    await supabase
      .from("stocktakes" as any)
      .update({ status: "completed", completed_at: new Date().toISOString() } as any)
      .eq("id", activeStocktake.id);
    toast.success("Stocktake completed");
    setActiveStocktake(null);
    fetchStocktakes();
  };

  const filteredItems = items.filter(i => {
    const title = (i.products as any)?.title || "";
    const sku = (i.products as any)?.sku || "";
    return title.toLowerCase().includes(search.toLowerCase()) || sku.toLowerCase().includes(search.toLowerCase());
  });

  const countedCount = items.filter(i => i.counted_quantity !== null && i.counted_quantity !== undefined).length;
  const discrepancies = items.filter(i => i.counted_quantity !== null && i.counted_quantity !== i.expected_quantity).length;

  // Variance summary calculations
  const varianceSummary = useMemo(() => {
    const counted = items.filter(i => i.counted_quantity !== null && i.counted_quantity !== undefined);
    const overItems = counted.filter(i => i.counted_quantity > i.expected_quantity);
    const underItems = counted.filter(i => i.counted_quantity < i.expected_quantity);
    const matchItems = counted.filter(i => i.counted_quantity === i.expected_quantity);
    const totalVariance = counted.reduce((s, i) => s + (i.counted_quantity - i.expected_quantity), 0);
    const absVariance = counted.reduce((s, i) => s + Math.abs(i.counted_quantity - i.expected_quantity), 0);
    return { counted: counted.length, over: overItems.length, under: underItems.length, match: matchItems.length, totalVariance, absVariance };
  }, [items]);

  const [varianceFilter, setVarianceFilter] = useState<"all" | "over" | "under" | "match">("all");

  const varianceFilteredItems = useMemo(() => {
    let filtered = filteredItems;
    if (varianceFilter === "over") filtered = filtered.filter(i => i.counted_quantity !== null && i.counted_quantity > i.expected_quantity);
    else if (varianceFilter === "under") filtered = filtered.filter(i => i.counted_quantity !== null && i.counted_quantity < i.expected_quantity);
    else if (varianceFilter === "match") filtered = filtered.filter(i => i.counted_quantity !== null && i.counted_quantity === i.expected_quantity);
    return filtered;
  }, [filteredItems, varianceFilter]);

  if (activeStocktake) {
    return (
      <AdminLayout>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold">{activeStocktake.name}</h1>
              <p className="text-xs text-muted-foreground">
                {countedCount}/{items.length} counted • {discrepancies} discrepancies
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => {
                const csvRows = [["SKU", "Product", "Expected", "Counted", "Variance"].join(",")];
                items.forEach(i => {
                  const variance = i.counted_quantity !== null ? i.counted_quantity - i.expected_quantity : "";
                  csvRows.push([`"${i.sku || ''}"`, `"${i.product_name || ''}"`, i.expected_quantity, i.counted_quantity ?? "", variance].join(","));
                });
                const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a"); a.href = url; a.download = `stocktake-${activeStocktake.name}-${format(new Date(), "yyyy-MM-dd")}.csv`; a.click();
                URL.revokeObjectURL(url);
                toast.success("Stocktake exported to CSV");
              }}>
                <Download className="h-3.5 w-3.5" /> Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setActiveStocktake(null); setVarianceFilter("all"); }}>Back</Button>
              {activeStocktake.status === "in_progress" && (
                <Button size="sm" onClick={completeStocktake}>
                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Complete
                </Button>
              )}
            </div>
          </div>

          {/* Variance Summary KPIs */}
          {countedCount > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Card className="p-3 cursor-pointer hover:ring-2 ring-primary" onClick={() => setVarianceFilter("all")}>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Counted</p>
                <p className="text-xl font-bold">{varianceSummary.counted}<span className="text-xs font-normal text-muted-foreground">/{items.length}</span></p>
              </Card>
              <Card className="p-3 cursor-pointer hover:ring-2 ring-primary" onClick={() => setVarianceFilter("match")}>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">✓ Match</p>
                <p className="text-xl font-bold text-primary">{varianceSummary.match}</p>
              </Card>
              <Card className="p-3 cursor-pointer hover:ring-2 ring-primary" onClick={() => setVarianceFilter("over")}>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">↑ Over</p>
                <p className="text-xl font-bold text-amber-600">{varianceSummary.over}</p>
              </Card>
              <Card className="p-3 cursor-pointer hover:ring-2 ring-primary" onClick={() => setVarianceFilter("under")}>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">↓ Under</p>
                <p className="text-xl font-bold text-destructive">{varianceSummary.under}</p>
              </Card>
              <Card className="p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Net Variance</p>
                <p className={`text-xl font-bold ${varianceSummary.totalVariance === 0 ? "text-primary" : varianceSummary.totalVariance > 0 ? "text-amber-600" : "text-destructive"}`}>
                  {varianceSummary.totalVariance > 0 ? "+" : ""}{varianceSummary.totalVariance}
                </p>
              </Card>
            </div>
          )}

          {varianceFilter !== "all" && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs gap-1">
                Showing: {varianceFilter === "match" ? "Matched" : varianceFilter === "over" ? "Over Count" : "Under Count"}
              </Badge>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setVarianceFilter("all")}>Clear Filter</Button>
            </div>
          )}

          <div className="relative max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="h-8 pl-8 text-xs" />
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs h-8">Product</TableHead>
                    <TableHead className="text-xs h-8">SKU</TableHead>
                    <TableHead className="text-xs h-8 text-right">Expected</TableHead>
                    <TableHead className="text-xs h-8 text-right w-28">Counted</TableHead>
                    <TableHead className="text-xs h-8 text-right">Diff</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {varianceFilteredItems.map((item: any) => {
                    const diff = item.counted_quantity !== null && item.counted_quantity !== undefined
                      ? item.counted_quantity - item.expected_quantity : null;
                    return (
                      <TableRow key={item.id} className="text-xs">
                        <TableCell className="py-1.5 font-medium max-w-[200px] truncate">
                          {(item.products as any)?.title || "—"}
                        </TableCell>
                        <TableCell className="py-1.5 font-mono text-muted-foreground">
                          {(item.products as any)?.sku || "—"}
                        </TableCell>
                        <TableCell className="py-1.5 text-right">{item.expected_quantity}</TableCell>
                        <TableCell className="py-1.5 text-right">
                          {activeStocktake.status === "in_progress" ? (
                            <Input
                              type="number"
                              min={0}
                              value={item.counted_quantity ?? ""}
                              onChange={e => updateCount(item.id, e.target.value)}
                              className="h-7 w-20 text-xs text-right ml-auto"
                            />
                          ) : (
                            item.counted_quantity ?? "—"
                          )}
                        </TableCell>
                        <TableCell className="py-1.5 text-right">
                          {diff !== null ? (
                            <Badge variant={diff === 0 ? "default" : "destructive"} className="text-[10px]">
                              {diff > 0 ? `+${diff}` : diff}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Stock Count</h1>
            <p className="text-xs text-muted-foreground">Physical inventory reconciliation & cycle count scheduling</p>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> New Stocktake
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-auto flex-wrap gap-1 p-1">
            <TabsTrigger value="stocktakes">Stocktakes</TabsTrigger>
            <TabsTrigger value="schedules">
              <Calendar className="h-3 w-3 mr-1" /> Cycle Count Schedules
              {schedules.filter(s => s.isActive).length > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px]">{schedules.filter(s => s.isActive).length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stocktakes">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs h-8">Name</TableHead>
                      <TableHead className="text-xs h-8">Date</TableHead>
                      <TableHead className="text-xs h-8">Status</TableHead>
                      <TableHead className="text-xs h-8 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
                      ))
                    ) : stocktakes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-8">
                          <ClipboardCheck className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                          No stocktakes yet. Start one to count your physical inventory.
                        </TableCell>
                      </TableRow>
                    ) : (
                      stocktakes.map((st: any) => (
                        <TableRow key={st.id} className="text-xs">
                          <TableCell className="py-2 font-medium">{st.name}</TableCell>
                          <TableCell className="py-2 text-muted-foreground">
                            {format(new Date(st.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="py-2">
                            <Badge variant={st.status === "completed" ? "default" : "secondary"} className="text-[10px]">
                              {st.status === "completed" ? "Completed" : "In Progress"}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2 text-right">
                            <Button variant="ghost" size="sm" onClick={() => openStocktake(st)} className="h-7 text-xs">
                              {st.status === "completed" ? "View" : "Continue"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedules" className="space-y-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setScheduleOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1.5" /> New Schedule
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs h-8">Name</TableHead>
                      <TableHead className="text-xs h-8">Frequency</TableHead>
                      <TableHead className="text-xs h-8">Zone</TableHead>
                      <TableHead className="text-xs h-8">Category</TableHead>
                      <TableHead className="text-xs h-8">Next Run</TableHead>
                      <TableHead className="text-xs h-8">Last Run</TableHead>
                      <TableHead className="text-xs h-8">Status</TableHead>
                      <TableHead className="text-xs h-8 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedules.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">
                          <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                          No cycle count schedules. Create one to automate regular stock counts.
                        </TableCell>
                      </TableRow>
                    ) : (
                      schedules.map((s) => (
                        <TableRow key={s.id} className="text-xs">
                          <TableCell className="py-2 font-medium">{s.name}</TableCell>
                          <TableCell className="py-2">
                            <Badge variant="outline" className="text-[10px]">{frequencyLabel[s.frequency]}</Badge>
                          </TableCell>
                          <TableCell className="py-2 text-muted-foreground">{s.zone || "All zones"}</TableCell>
                          <TableCell className="py-2 text-muted-foreground">{s.category || "All categories"}</TableCell>
                          <TableCell className="py-2">{format(new Date(s.nextRunDate), "MMM d, yyyy")}</TableCell>
                          <TableCell className="py-2 text-muted-foreground">{s.lastRunDate ? format(new Date(s.lastRunDate), "MMM d, yyyy") : "Never"}</TableCell>
                          <TableCell className="py-2">
                            <Badge variant={s.isActive ? "default" : "secondary"} className="text-[10px] cursor-pointer" onClick={() => toggleSchedule(s.id)}>
                              {s.isActive ? "Active" : "Paused"}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2 text-right space-x-1">
                            <Button size="sm" variant="outline" className="text-xs h-6" onClick={() => runScheduleNow(s)}>Run Now</Button>
                            <Button size="sm" variant="ghost" className="text-xs h-6 text-destructive" onClick={() => deleteSchedule(s.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Stocktake Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>New Stocktake</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Optional notes..." />
            </div>
            <p className="text-xs text-muted-foreground">
              <Package className="inline h-3 w-3 mr-1" />
              {products.length} products will be included
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={createStocktake}>Create Stocktake</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Schedule Dialog */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>New Cycle Count Schedule</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Schedule Name *</Label>
              <Input value={scheduleForm.name} onChange={e => setScheduleForm({ ...scheduleForm, name: e.target.value })} placeholder="e.g., Weekly Zone A Count" className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Frequency *</Label>
              <Select value={scheduleForm.frequency} onValueChange={(v: any) => setScheduleForm({ ...scheduleForm, frequency: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily" className="text-xs">Daily</SelectItem>
                  <SelectItem value="weekly" className="text-xs">Weekly</SelectItem>
                  <SelectItem value="biweekly" className="text-xs">Bi-weekly</SelectItem>
                  <SelectItem value="monthly" className="text-xs">Monthly</SelectItem>
                  <SelectItem value="quarterly" className="text-xs">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Zone (optional)</Label>
                <Input value={scheduleForm.zone} onChange={e => setScheduleForm({ ...scheduleForm, zone: e.target.value })} placeholder="e.g., Zone A" className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Category (optional)</Label>
                <Input value={scheduleForm.category} onChange={e => setScheduleForm({ ...scheduleForm, category: e.target.value })} placeholder="e.g., Electronics" className="h-8 text-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Next Run Date *</Label>
              <Input type="date" value={scheduleForm.nextRunDate} onChange={e => setScheduleForm({ ...scheduleForm, nextRunDate: e.target.value })} className="h-8 text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>Cancel</Button>
            <Button onClick={createSchedule}>Create Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
