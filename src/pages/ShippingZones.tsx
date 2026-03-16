import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useShippingZones, useCreateShippingZone, useDeleteShippingZone } from "@/hooks/use-data";
import { Plus, Trash2, Truck, Search, Package, ChevronRight, Settings2, Ban } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";

function useUpdateShippingZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase.from("shipping_zones").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["shipping_zones"] }); toast.success("Zone updated"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export default function ShippingZones() {
  const { currentStore } = useAuth();
  const storeId = currentStore?.id;
  const { data: zones = [], isLoading } = useShippingZones();
  const createZone = useCreateShippingZone();
  const deleteZone = useDeleteShippingZone();
  const updateZone = useUpdateShippingZone();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editZone, setEditZone] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", regions: "", flat_rate: "0", free_above: "", rate_type: "flat", per_kg_rate: "0", surcharge_postcodes: "", surcharge_amount: "0", surcharge_label: "Remote area surcharge", blocked_postcodes: "", blocked_message: "Sorry, we cannot ship to this postcode" });
  const [activeTab, setActiveTab] = useState("zones");

  // Shipping services
  const { data: services = [] } = useQuery({
    queryKey: ["shipping_services", storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data } = await supabase.from("shipping_services").select("*").eq("store_id", storeId).order("sort_order");
      return data || [];
    },
    enabled: !!storeId,
  });

  // Shipping rates
  const { data: rates = [] } = useQuery({
    queryKey: ["shipping_rates", storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data } = await supabase.from("shipping_rates").select("*").eq("store_id", storeId).order("min_weight");
      return data || [];
    },
    enabled: !!storeId,
  });

  // Service CRUD
  const [serviceOpen, setServiceOpen] = useState(false);
  const [serviceForm, setServiceForm] = useState({ zone_id: "", name: "", carrier: "", estimated_days_min: "1", estimated_days_max: "5" });
  const [rateOpen, setRateOpen] = useState(false);
  const [rateForm, setRateForm] = useState({ service_id: "", min_weight: "0", max_weight: "99999", min_order_total: "0", max_order_total: "99999", rate: "0", rate_type: "flat" });

  const resetForm = () => setForm({ name: "", regions: "", flat_rate: "0", free_above: "", rate_type: "flat", per_kg_rate: "0", surcharge_postcodes: "", surcharge_amount: "0", surcharge_label: "Remote area surcharge", blocked_postcodes: "", blocked_message: "Sorry, we cannot ship to this postcode" });

  const filtered = (zones as any[]).filter((z) =>
    z.name.toLowerCase().includes(search.toLowerCase()) ||
    z.regions.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error("Name required"); return; }
    await createZone.mutateAsync({
      name: form.name, regions: form.regions,
      flat_rate: Number(form.flat_rate) || 0,
      free_above: form.free_above ? Number(form.free_above) : null,
      rate_type: form.rate_type, per_kg_rate: Number(form.per_kg_rate) || 0,
      surcharge_postcodes: form.surcharge_postcodes, surcharge_amount: Number(form.surcharge_amount) || 0,
      surcharge_label: form.surcharge_label,
    } as any);
    resetForm();
    setCreateOpen(false);
  };

  const handleUpdate = async () => {
    if (!editZone) return;
    await updateZone.mutateAsync({
      id: editZone.id, name: form.name, regions: form.regions,
      flat_rate: Number(form.flat_rate) || 0,
      free_above: form.free_above ? Number(form.free_above) : null,
      rate_type: form.rate_type, per_kg_rate: Number(form.per_kg_rate) || 0,
      surcharge_postcodes: form.surcharge_postcodes, surcharge_amount: Number(form.surcharge_amount) || 0,
      surcharge_label: form.surcharge_label,
    } as any);
    setEditZone(null);
    resetForm();
  };

  const openEdit = (z: any) => {
    setForm({
      name: z.name, regions: z.regions, flat_rate: String(z.flat_rate),
      free_above: z.free_above ? String(z.free_above) : "",
      rate_type: z.rate_type || "flat", per_kg_rate: String(z.per_kg_rate || 0),
      surcharge_postcodes: z.surcharge_postcodes || "", surcharge_amount: String(z.surcharge_amount || 0),
      surcharge_label: z.surcharge_label || "Remote area surcharge",
      blocked_postcodes: z.blocked_postcodes || "", blocked_message: z.blocked_message || "Sorry, we cannot ship to this postcode",
    });
    setEditZone(z);
  };

  const createService = async () => {
    if (!serviceForm.name.trim() || !serviceForm.zone_id || !storeId) { toast.error("Name and zone required"); return; }
    const { error } = await supabase.from("shipping_services").insert({
      store_id: storeId, zone_id: serviceForm.zone_id, name: serviceForm.name,
      carrier: serviceForm.carrier, estimated_days_min: Number(serviceForm.estimated_days_min),
      estimated_days_max: Number(serviceForm.estimated_days_max),
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Service created");
    qc.invalidateQueries({ queryKey: ["shipping_services"] });
    setServiceOpen(false);
    setServiceForm({ zone_id: "", name: "", carrier: "", estimated_days_min: "1", estimated_days_max: "5" });
  };

  const deleteService = async (id: string) => {
    await supabase.from("shipping_services").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["shipping_services"] });
    qc.invalidateQueries({ queryKey: ["shipping_rates"] });
    toast.success("Service deleted");
  };

  const toggleService = async (id: string, is_active: boolean) => {
    await supabase.from("shipping_services").update({ is_active }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["shipping_services"] });
  };

  const createRate = async () => {
    if (!rateForm.service_id || !storeId) { toast.error("Service required"); return; }
    const { error } = await supabase.from("shipping_rates").insert({
      store_id: storeId, service_id: rateForm.service_id,
      min_weight: Number(rateForm.min_weight), max_weight: Number(rateForm.max_weight),
      min_order_total: Number(rateForm.min_order_total), max_order_total: Number(rateForm.max_order_total),
      rate: Number(rateForm.rate), rate_type: rateForm.rate_type,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Rate added");
    qc.invalidateQueries({ queryKey: ["shipping_rates"] });
    setRateOpen(false);
    setRateForm({ service_id: "", min_weight: "0", max_weight: "99999", min_order_total: "0", max_order_total: "99999", rate: "0", rate_type: "flat" });
  };

  const deleteRate = async (id: string) => {
    await supabase.from("shipping_rates").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["shipping_rates"] });
    toast.success("Rate removed");
  };

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="page-header">
          <div>
            <h1 className="text-lg font-semibold">Shipping</h1>
            <p className="text-xs text-muted-foreground">
              Zones, services & rate matrix
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-8 flex-wrap">
            <TabsTrigger value="zones" className="text-xs h-7">Zones ({(zones as any[]).length})</TabsTrigger>
            <TabsTrigger value="services" className="text-xs h-7">Services ({(services as any[]).length})</TabsTrigger>
            <TabsTrigger value="rates" className="text-xs h-7">Rate Matrix ({(rates as any[]).length})</TabsTrigger>
            <TabsTrigger value="rules" className="text-xs h-7">Advanced Rules</TabsTrigger>
            <TabsTrigger value="exclusions" className="text-xs h-7">Exclusions</TabsTrigger>
          </TabsList>

          {/* ── Zones Tab ── */}
          <TabsContent value="zones" className="space-y-3 mt-3">
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search zones..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 pl-8 text-xs" />
              </div>
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={resetForm}><Plus className="h-4 w-4 mr-1" /> Add Zone</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>Add Shipping Zone</DialogTitle></DialogHeader>
                  <ZoneForm form={form} setForm={setForm} onSubmit={handleCreate} loading={createZone.isPending} label="Create" />
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs h-8">Name</TableHead>
                      <TableHead className="text-xs h-8">Regions</TableHead>
                      <TableHead className="text-xs h-8">Rate Type</TableHead>
                      <TableHead className="text-xs h-8 text-right">Rate</TableHead>
                      <TableHead className="text-xs h-8 text-right">Free Above</TableHead>
                      <TableHead className="text-xs h-8">Services</TableHead>
                      <TableHead className="text-xs h-8 w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
                      ))
                    ) : filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-6">
                          <Truck className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                          No shipping zones configured.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((z: any) => {
                        const zoneServices = (services as any[]).filter((s) => s.zone_id === z.id);
                        return (
                          <TableRow key={z.id} className="text-xs cursor-pointer hover:bg-muted/50" onClick={() => openEdit(z)}>
                            <TableCell className="py-2 font-medium">{z.name}</TableCell>
                            <TableCell className="py-2 max-w-[160px] truncate text-muted-foreground">{z.regions}</TableCell>
                            <TableCell className="py-2 capitalize">{z.rate_type === "per_item" ? "Per Item" : z.rate_type || "flat"}</TableCell>
                            <TableCell className="py-2 text-right font-medium">
                              {z.rate_type === "weight" ? `$${Number(z.per_kg_rate).toFixed(2)}/kg` : z.rate_type === "per_item" ? `$${Number(z.per_kg_rate).toFixed(2)}/item` : `$${Number(z.flat_rate).toFixed(2)}`}
                            </TableCell>
                            <TableCell className="py-2 text-right">{z.free_above ? `$${Number(z.free_above).toFixed(2)}` : "—"}</TableCell>
                            <TableCell className="py-2">
                              <Badge variant="secondary" className="text-2xs">{zoneServices.length} services</Badge>
                            </TableCell>
                            <TableCell className="py-2">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); deleteZone.mutate(z.id); }}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Services Tab ── */}
          <TabsContent value="services" className="space-y-3 mt-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Shipping methods available per zone (e.g. Express, Standard, Economy)</p>
              <Dialog open={serviceOpen} onOpenChange={setServiceOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Service</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>Add Shipping Service</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Zone</Label>
                      <Select value={serviceForm.zone_id} onValueChange={(v) => setServiceForm({ ...serviceForm, zone_id: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select zone" /></SelectTrigger>
                        <SelectContent>
                          {(zones as any[]).map((z) => (
                            <SelectItem key={z.id} value={z.id} className="text-xs">{z.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Service Name</Label>
                      <Input placeholder="e.g. Express Shipping" value={serviceForm.name} onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Carrier</Label>
                      <Input placeholder="e.g. Australia Post, DHL" value={serviceForm.carrier} onChange={(e) => setServiceForm({ ...serviceForm, carrier: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Min Days</Label>
                        <Input type="number" min="0" value={serviceForm.estimated_days_min} onChange={(e) => setServiceForm({ ...serviceForm, estimated_days_min: e.target.value })} />
                      </div>
                      <div>
                        <Label className="text-xs">Max Days</Label>
                        <Input type="number" min="0" value={serviceForm.estimated_days_max} onChange={(e) => setServiceForm({ ...serviceForm, estimated_days_max: e.target.value })} />
                      </div>
                    </div>
                    <Button onClick={createService} className="w-full">Create Service</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {(zones as any[]).map((zone) => {
              const zoneServices = (services as any[]).filter((s) => s.zone_id === zone.id);
              if (zoneServices.length === 0 && (zones as any[]).length > 3) return null;
              return (
                <Card key={zone.id}>
                  <CardHeader className="p-3 pb-0">
                    <CardTitle className="text-xs font-medium flex items-center gap-2">
                      <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                      {zone.name}
                      <span className="text-muted-foreground font-normal">— {zone.regions}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 pt-2">
                    {zoneServices.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">No services configured for this zone.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs h-7">Service</TableHead>
                            <TableHead className="text-xs h-7">Carrier</TableHead>
                            <TableHead className="text-xs h-7">Est. Days</TableHead>
                            <TableHead className="text-xs h-7">Rates</TableHead>
                            <TableHead className="text-xs h-7">Active</TableHead>
                            <TableHead className="text-xs h-7 w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {zoneServices.map((svc: any) => {
                            const svcRates = (rates as any[]).filter((r) => r.service_id === svc.id);
                            return (
                              <TableRow key={svc.id} className="text-xs">
                                <TableCell className="py-1.5 font-medium">{svc.name}</TableCell>
                                <TableCell className="py-1.5 text-muted-foreground">{svc.carrier || "—"}</TableCell>
                                <TableCell className="py-1.5">{svc.estimated_days_min}–{svc.estimated_days_max} days</TableCell>
                                <TableCell className="py-1.5">
                                  <Badge variant="secondary" className="text-2xs">{svcRates.length} tiers</Badge>
                                </TableCell>
                                <TableCell className="py-1.5">
                                  <Switch checked={svc.is_active} onCheckedChange={(v) => toggleService(svc.id, v)} />
                                </TableCell>
                                <TableCell className="py-1.5">
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteService(svc.id)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* ── Rate Matrix Tab ── */}
          <TabsContent value="rates" className="space-y-3 mt-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Weight & order-value based rate tiers per service</p>
              <Dialog open={rateOpen} onOpenChange={setRateOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Rate Tier</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>Add Rate Tier</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Service</Label>
                      <Select value={rateForm.service_id} onValueChange={(v) => setRateForm({ ...rateForm, service_id: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select service" /></SelectTrigger>
                        <SelectContent>
                          {(services as any[]).map((s) => {
                            const zone = (zones as any[]).find((z) => z.id === s.zone_id);
                            return (
                              <SelectItem key={s.id} value={s.id} className="text-xs">
                                {zone?.name} → {s.name}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Rate Type</Label>
                      <Select value={rateForm.rate_type} onValueChange={(v) => setRateForm({ ...rateForm, rate_type: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flat" className="text-xs">Flat Rate ($)</SelectItem>
                          <SelectItem value="per_kg" className="text-xs">Per Kg ($)</SelectItem>
                          <SelectItem value="percentage" className="text-xs">Percentage (%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Rate</Label>
                      <Input type="number" step="0.01" min="0" value={rateForm.rate} onChange={(e) => setRateForm({ ...rateForm, rate: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Min Weight (kg)</Label>
                        <Input type="number" step="0.01" min="0" value={rateForm.min_weight} onChange={(e) => setRateForm({ ...rateForm, min_weight: e.target.value })} />
                      </div>
                      <div>
                        <Label className="text-xs">Max Weight (kg)</Label>
                        <Input type="number" step="0.01" min="0" value={rateForm.max_weight} onChange={(e) => setRateForm({ ...rateForm, max_weight: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Min Order ($)</Label>
                        <Input type="number" step="0.01" min="0" value={rateForm.min_order_total} onChange={(e) => setRateForm({ ...rateForm, min_order_total: e.target.value })} />
                      </div>
                      <div>
                        <Label className="text-xs">Max Order ($)</Label>
                        <Input type="number" step="0.01" min="0" value={rateForm.max_order_total} onChange={(e) => setRateForm({ ...rateForm, max_order_total: e.target.value })} />
                      </div>
                    </div>
                    <Button onClick={createRate} className="w-full">Add Rate Tier</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs h-8">Zone → Service</TableHead>
                      <TableHead className="text-xs h-8">Weight Range</TableHead>
                      <TableHead className="text-xs h-8">Order Range</TableHead>
                      <TableHead className="text-xs h-8">Type</TableHead>
                      <TableHead className="text-xs h-8 text-right">Rate</TableHead>
                      <TableHead className="text-xs h-8 w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(rates as any[]).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-6">
                          <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                          No rate tiers configured. Add services first, then define rate tiers.
                        </TableCell>
                      </TableRow>
                    ) : (
                      (rates as any[]).map((r) => {
                        const svc = (services as any[]).find((s) => s.id === r.service_id);
                        const zone = svc ? (zones as any[]).find((z) => z.id === svc.zone_id) : null;
                        return (
                          <TableRow key={r.id} className="text-xs">
                            <TableCell className="py-1.5 font-medium">
                              {zone?.name || "?"} <ChevronRight className="inline h-3 w-3 text-muted-foreground" /> {svc?.name || "?"}
                            </TableCell>
                            <TableCell className="py-1.5">{r.min_weight}–{r.max_weight} kg</TableCell>
                            <TableCell className="py-1.5">${r.min_order_total}–${r.max_order_total}</TableCell>
                            <TableCell className="py-1.5 capitalize">{r.rate_type}</TableCell>
                            <TableCell className="py-1.5 text-right font-medium">
                              {r.rate_type === "percentage" ? `${r.rate}%` : `$${Number(r.rate).toFixed(2)}`}
                              {r.rate_type === "per_kg" && "/kg"}
                            </TableCell>
                            <TableCell className="py-1.5">
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteRate(r.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Advanced Rules Tab ── */}
          <TabsContent value="rules" className="space-y-3 mt-3">
            <ShippingRulesTab />
          </TabsContent>

          {/* ── Exclusions Tab ── */}
          <TabsContent value="exclusions" className="space-y-3 mt-3">
            <ShippingExclusionsTab storeId={storeId} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Zone Dialog */}
      <Dialog open={!!editZone} onOpenChange={(o) => { if (!o) setEditZone(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Shipping Zone</DialogTitle></DialogHeader>
          <ZoneForm form={form} setForm={setForm} onSubmit={handleUpdate} loading={updateZone.isPending} label="Save Changes" />
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function ShippingExclusionsTab({ storeId }: { storeId?: string }) {
  const [exclusions, setExclusions] = useState<Array<{ id: string; name: string; match_type: string; match_value: string; excluded_methods: string; is_active: boolean }>>([]);
  const [form, setForm] = useState({ name: "", match_type: "category", match_value: "", excluded_methods: "all" });

  useEffect(() => {
    if (!storeId) return;
    try { setExclusions(JSON.parse(localStorage.getItem(`shipping_exclusions_${storeId}`) || "[]")); } catch {}
  }, [storeId]);

  const save = (updated: typeof exclusions) => {
    setExclusions(updated);
    if (storeId) localStorage.setItem(`shipping_exclusions_${storeId}`, JSON.stringify(updated));
  };

  const addExclusion = () => {
    if (!form.name.trim() || !form.match_value.trim()) { toast.error("Name and match value required"); return; }
    save([...exclusions, { id: crypto.randomUUID(), name: form.name, match_type: form.match_type, match_value: form.match_value, excluded_methods: form.excluded_methods, is_active: true }]);
    setForm({ name: "", match_type: "category", match_value: "", excluded_methods: "all" });
    toast.success("Shipping exclusion rule added");
  };

  const matchTypeLabels: Record<string, string> = {
    category: "Product Category",
    tag: "Product Tag",
    sku_prefix: "SKU Prefix",
    brand: "Brand",
    weight_above: "Weight Above (kg)",
    product_type: "Product Type",
  };

  const methodLabels: Record<string, string> = {
    all: "All shipping methods",
    express: "Express only",
    standard: "Standard only",
    international: "International only",
    same_day: "Same-day delivery",
    click_collect: "Click & Collect",
  };

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><Ban className="h-4 w-4" /> Shipping Exclusion Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Exclude specific products or categories from certain shipping methods. E.g. prevent oversized items from same-day delivery, or block hazmat from air freight.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Input placeholder="Rule name (e.g. No express for bulky)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="h-8 text-sm" />
            <Select value={form.match_type} onValueChange={v => setForm({ ...form, match_type: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(matchTypeLabels).map(([k, v]) => <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Input placeholder={form.match_type === "weight_above" ? "e.g. 30" : "e.g. Furniture, hazmat, BULK-"} value={form.match_value} onChange={e => setForm({ ...form, match_value: e.target.value })} className="h-8 text-sm" />
            <Select value={form.excluded_methods} onValueChange={v => setForm({ ...form, excluded_methods: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(methodLabels).map(([k, v]) => <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" className="text-xs h-7" onClick={addExclusion}><Plus className="h-3 w-3 mr-1" /> Add Exclusion</Button>

          {exclusions.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-8">Rule</TableHead>
                  <TableHead className="text-xs h-8">Match</TableHead>
                  <TableHead className="text-xs h-8">Value</TableHead>
                  <TableHead className="text-xs h-8">Excluded Method</TableHead>
                  <TableHead className="text-xs h-8">Active</TableHead>
                  <TableHead className="text-xs h-8 w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exclusions.map(r => (
                  <TableRow key={r.id} className="text-xs">
                    <TableCell className="py-1.5 font-medium">{r.name}</TableCell>
                    <TableCell className="py-1.5"><Badge variant="outline" className="text-[10px]">{matchTypeLabels[r.match_type] || r.match_type}</Badge></TableCell>
                    <TableCell className="py-1.5 font-mono text-muted-foreground">{r.match_value}</TableCell>
                    <TableCell className="py-1.5"><Badge variant="secondary" className="text-[10px]">{methodLabels[r.excluded_methods] || r.excluded_methods}</Badge></TableCell>
                    <TableCell className="py-1.5">
                      <Switch checked={r.is_active} onCheckedChange={v => save(exclusions.map(x => x.id === r.id ? { ...x, is_active: v } : x))} />
                    </TableCell>
                    <TableCell className="py-1.5">
                      <Button size="sm" variant="ghost" className="h-6 w-6 text-destructive p-0" onClick={() => save(exclusions.filter(x => x.id !== r.id))}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ZoneForm({ form, setForm, onSubmit, loading, label }: {
  form: { name: string; regions: string; flat_rate: string; free_above: string; rate_type: string; per_kg_rate: string; surcharge_postcodes: string; surcharge_amount: string; surcharge_label: string; blocked_postcodes: string; blocked_message: string };
  setForm: (f: any) => void;
  onSubmit: () => void;
  loading: boolean;
  label: string;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Zone Name</Label>
        <Input placeholder="e.g. Domestic" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div>
        <Label className="text-xs">Regions</Label>
        <Input placeholder="e.g. AU, NZ or Worldwide" value={form.regions} onChange={(e) => setForm({ ...form, regions: e.target.value })} />
      </div>
      <div>
        <Label className="text-xs">Rate Type</Label>
        <Select value={form.rate_type} onValueChange={(v) => setForm({ ...form, rate_type: v })}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="flat" className="text-xs">Flat Rate</SelectItem>
            <SelectItem value="weight" className="text-xs">Weight-Based (per kg)</SelectItem>
            <SelectItem value="cubic" className="text-xs">Dimension / Cubic Weight</SelectItem>
            <SelectItem value="per_item" className="text-xs">Per Item (quantity-based)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {form.rate_type === "weight" ? (
          <div>
            <Label className="text-xs">Rate per kg ($)</Label>
            <Input type="number" step="0.01" min="0" value={form.per_kg_rate} onChange={(e) => setForm({ ...form, per_kg_rate: e.target.value })} />
          </div>
        ) : form.rate_type === "cubic" ? (
          <div>
            <Label className="text-xs">Rate per cubic meter ($)</Label>
            <Input type="number" step="0.01" min="0" value={form.per_kg_rate} onChange={(e) => setForm({ ...form, per_kg_rate: e.target.value })} />
            <p className="text-[10px] text-muted-foreground mt-0.5">Cubic weight = L×W×H / 5000 (cm). Higher of actual vs cubic weight used.</p>
          </div>
        ) : form.rate_type === "per_item" ? (
          <div>
            <Label className="text-xs">Rate per item ($)</Label>
            <Input type="number" step="0.01" min="0" value={form.per_kg_rate} onChange={(e) => setForm({ ...form, per_kg_rate: e.target.value })} />
            <p className="text-[10px] text-muted-foreground mt-0.5">Shipping cost = base flat rate + (rate × item count)</p>
          </div>
        ) : (
          <div>
            <Label className="text-xs">Flat Rate ($)</Label>
            <Input type="number" step="0.01" min="0" value={form.flat_rate} onChange={(e) => setForm({ ...form, flat_rate: e.target.value })} />
          </div>
        )}
        <div>
          <Label className="text-xs">Free Above ($)</Label>
          <Input type="number" step="0.01" min="0" placeholder="Optional" value={form.free_above} onChange={(e) => setForm({ ...form, free_above: e.target.value })} />
        </div>
      </div>
      {(form.rate_type === "weight" || form.rate_type === "cubic" || form.rate_type === "per_item") && (
        <div>
          <Label className="text-xs">Base Flat Rate ($) <span className="text-muted-foreground">(added to {form.rate_type === "cubic" ? "cubic" : form.rate_type === "per_item" ? "per-item" : "weight"} cost)</span></Label>
          <Input type="number" step="0.01" min="0" value={form.flat_rate} onChange={(e) => setForm({ ...form, flat_rate: e.target.value })} />
        </div>
      )}
      <div className="border-t pt-3 mt-1 space-y-2">
        <p className="text-xs font-medium">Rural / Remote Surcharge</p>
        <div>
          <Label className="text-xs">Surcharge Postcodes <span className="text-muted-foreground">(comma-separated ranges e.g. 0800-0899,4000-4999)</span></Label>
          <Input placeholder="e.g. 0800-0899, 6700-6799" value={form.surcharge_postcodes} onChange={(e) => setForm({ ...form, surcharge_postcodes: e.target.value })} className="text-xs" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Surcharge Amount ($)</Label>
            <Input type="number" step="0.01" min="0" value={form.surcharge_amount} onChange={(e) => setForm({ ...form, surcharge_amount: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Surcharge Label</Label>
            <Input value={form.surcharge_label} onChange={(e) => setForm({ ...form, surcharge_label: e.target.value })} />
          </div>
        </div>
      </div>
      <div className="border-t pt-3 mt-1 space-y-2">
        <p className="text-xs font-medium flex items-center gap-1.5"><Ban className="h-3.5 w-3.5" /> Blocked Postcodes</p>
        <p className="text-[10px] text-muted-foreground">Orders with these postcodes will be blocked from checkout.</p>
        <div>
          <Label className="text-xs">Blocked Postcode Ranges <span className="text-muted-foreground">(comma-separated e.g. 0800-0899,9000-9999)</span></Label>
          <Input placeholder="e.g. 0800-0899, 9000-9999" value={form.blocked_postcodes} onChange={(e) => setForm({ ...form, blocked_postcodes: e.target.value })} className="text-xs" />
        </div>
        <div>
          <Label className="text-xs">Blocked Message</Label>
          <Input value={form.blocked_message} onChange={(e) => setForm({ ...form, blocked_message: e.target.value })} className="text-xs" placeholder="Shown to customer at checkout" />
        </div>
      </div>
      <Button onClick={onSubmit} disabled={loading} className="w-full">{label}</Button>
    </div>
  );
}
