import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus, Edit, Trash2, MapPin, Phone, Mail, Clock, Search,
  Navigation, ShoppingBag, Globe, Copy, ExternalLink,
} from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface LocationForm {
  name: string; address: string; city: string; state: string; postcode: string;
  country: string; phone: string; email: string; latitude: string; longitude: string;
  is_active: boolean; is_pickup_location: boolean; notes: string;
  opening_hours: Record<string, { open: string; close: string; closed: boolean }>;
}

const emptyForm: LocationForm = {
  name: "", address: "", city: "", state: "", postcode: "", country: "AU",
  phone: "", email: "", latitude: "", longitude: "", notes: "",
  is_active: true, is_pickup_location: false,
  opening_hours: Object.fromEntries(DAYS.map(d => [d, { open: "09:00", close: "17:00", closed: d === "Sunday" }])),
};

const COUNTRIES = [
  { code: "AU", name: "Australia" }, { code: "NZ", name: "New Zealand" },
  { code: "US", name: "United States" }, { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" }, { code: "SG", name: "Singapore" },
  { code: "HK", name: "Hong Kong" }, { code: "MY", name: "Malaysia" },
];

export default function StoreLocator() {
  const { currentStore } = useAuth();
  const storeId = currentStore?.id;
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LocationForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [filterCountry, setFilterCountry] = useState<string>("all");

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ["store_locations", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data } = await supabase.from("store_locations" as any).select("*").eq("store_id", storeId!).order("name");
      return (data || []) as any[];
    },
  });

  const saveLocation = async () => {
    if (!form.name.trim() || !storeId) { toast.error("Name is required"); return; }
    const payload: any = {
      store_id: storeId, name: form.name.trim(), address: form.address || null,
      city: form.city || null, state: form.state || null, postcode: form.postcode || null,
      country: form.country, phone: form.phone || null, email: form.email || null,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
      is_active: form.is_active, is_pickup_location: form.is_pickup_location,
      opening_hours: form.opening_hours,
    };
    if (editingId) {
      await supabase.from("store_locations" as any).update(payload).eq("id", editingId);
      toast.success("Location updated");
    } else {
      await supabase.from("store_locations" as any).insert(payload);
      toast.success("Location created");
    }
    setShowForm(false); setEditingId(null); setForm(emptyForm);
    qc.invalidateQueries({ queryKey: ["store_locations"] });
  };

  const deleteLocation = async (id: string) => {
    await supabase.from("store_locations" as any).delete().eq("id", id);
    toast.success("Location deleted");
    qc.invalidateQueries({ queryKey: ["store_locations"] });
  };

  const editLocation = (loc: any) => {
    setForm({
      name: loc.name, address: loc.address || "", city: loc.city || "", state: loc.state || "",
      postcode: loc.postcode || "", country: loc.country || "AU", phone: loc.phone || "",
      email: loc.email || "", latitude: loc.latitude?.toString() || "", longitude: loc.longitude?.toString() || "",
      is_active: loc.is_active, is_pickup_location: loc.is_pickup_location, notes: "",
      opening_hours: loc.opening_hours || emptyForm.opening_hours,
    });
    setEditingId(loc.id); setShowForm(true);
  };

  const duplicateLocation = (loc: any) => {
    editLocation(loc);
    setEditingId(null);
    setForm(f => ({ ...f, name: `${f.name} (Copy)` }));
  };

  const getFullAddress = (loc: any) => [loc.address, loc.city, loc.state, loc.postcode, loc.country].filter(Boolean).join(", ");

  const openInMaps = (loc: any) => {
    const q = loc.latitude && loc.longitude ? `${loc.latitude},${loc.longitude}` : encodeURIComponent(getFullAddress(loc));
    window.open(`https://maps.google.com/?q=${q}`, "_blank");
  };

  const isOpen = (loc: any) => {
    const now = new Date();
    const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()];
    const hrs = loc.opening_hours?.[dayName];
    if (!hrs || hrs.closed) return false;
    const nowTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    return nowTime >= hrs.open && nowTime <= hrs.close;
  };

  const countries = useMemo(() => [...new Set(locations.map((l: any) => l.country).filter(Boolean))], [locations]);

  const filtered = locations.filter((l: any) => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.city || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.address || "").toLowerCase().includes(search.toLowerCase());
    const matchCountry = filterCountry === "all" || l.country === filterCountry;
    return matchSearch && matchCountry;
  });

  const activeCount = locations.filter((l: any) => l.is_active).length;
  const pickupCount = locations.filter((l: any) => l.is_pickup_location).length;
  const openNow = locations.filter((l: any) => l.is_active && isOpen(l)).length;

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Store Locator</h1>
            <p className="text-xs text-muted-foreground">Manage physical store locations shown on your storefront</p>
          </div>
          <Button size="sm" className="text-xs h-8 gap-1" onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }}>
            <Plus className="h-3.5 w-3.5" /> Add Location
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="p-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center"><MapPin className="h-3.5 w-3.5 text-primary" /></div>
            <div><p className="text-[10px] text-muted-foreground">Total</p><p className="text-lg font-bold">{locations.length}</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center"><Navigation className="h-3.5 w-3.5 text-primary" /></div>
            <div><p className="text-[10px] text-muted-foreground">Active</p><p className="text-lg font-bold">{activeCount}</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center"><ShoppingBag className="h-3.5 w-3.5 text-primary" /></div>
            <div><p className="text-[10px] text-muted-foreground">Click & Collect</p><p className="text-lg font-bold">{pickupCount}</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center"><Clock className="h-3.5 w-3.5 text-primary" /></div>
            <div><p className="text-[10px] text-muted-foreground">Open Now</p><p className="text-lg font-bold">{openNow}</p></div>
          </CardContent></Card>
        </div>

        <Tabs defaultValue="list">
          <TabsList className="h-8">
            <TabsTrigger value="list" className="text-xs h-7"><MapPin className="h-3 w-3 mr-1" />Locations</TabsTrigger>
            <TabsTrigger value="map" className="text-xs h-7"><Globe className="h-3 w-3 mr-1" />Map View</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-3 space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search locations..." value={search} onChange={e => setSearch(e.target.value)} className="h-8 pl-8 text-xs" />
              </div>
              {countries.length > 1 && (
                <Select value={filterCountry} onValueChange={setFilterCountry}>
                  <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">All Countries</SelectItem>
                    {countries.map(c => <SelectItem key={c} value={c} className="text-xs">{COUNTRIES.find(x => x.code === c)?.name || c}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs h-8">Name</TableHead>
                      <TableHead className="text-xs h-8">Address</TableHead>
                      <TableHead className="text-xs h-8">Contact</TableHead>
                      <TableHead className="text-xs h-8">Hours</TableHead>
                      <TableHead className="text-xs h-8">Status</TableHead>
                      <TableHead className="text-xs h-8 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
                    )) : filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">
                        <MapPin className="h-6 w-6 mx-auto mb-1 text-muted-foreground/40" />No locations found
                      </TableCell></TableRow>
                    ) : filtered.map((loc: any) => {
                      const nowOpen = loc.is_active && isOpen(loc);
                      return (
                        <TableRow key={loc.id} className="text-xs">
                          <TableCell className="py-2">
                            <div className="font-medium">{loc.name}</div>
                            <div className="flex gap-1 mt-0.5">
                              {loc.is_pickup_location && <Badge variant="outline" className="text-[9px]">Pickup</Badge>}
                              {loc.country && <Badge variant="secondary" className="text-[9px]">{loc.country}</Badge>}
                            </div>
                          </TableCell>
                          <TableCell className="py-2 text-muted-foreground max-w-[200px] truncate">
                            {getFullAddress(loc) || "—"}
                          </TableCell>
                          <TableCell className="py-2">
                            {loc.phone && <div className="flex items-center gap-1 text-muted-foreground"><Phone className="h-2.5 w-2.5" />{loc.phone}</div>}
                            {loc.email && <div className="flex items-center gap-1 text-muted-foreground"><Mail className="h-2.5 w-2.5" />{loc.email}</div>}
                          </TableCell>
                          <TableCell className="py-2">
                            <Badge variant={nowOpen ? "default" : "secondary"} className="text-[9px]">
                              {nowOpen ? "Open Now" : "Closed"}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2">
                            <Badge variant={loc.is_active ? "default" : "secondary"} className="text-[10px]">
                              {loc.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2 text-right">
                            <div className="flex gap-0.5 justify-end">
                              <Button variant="ghost" size="icon" className="h-6 w-6" title="Open in Maps" onClick={() => openInMaps(loc)}>
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6" title="Duplicate" onClick={() => duplicateLocation(loc)}>
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => editLocation(loc)}>
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteLocation(loc.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Map View Tab */}
          <TabsContent value="map" className="mt-3">
            <Card>
              <CardContent className="p-0">
                {locations.filter((l: any) => l.latitude && l.longitude).length === 0 ? (
                  <div className="py-16 text-center">
                    <Globe className="h-10 w-10 mx-auto mb-2 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">Add latitude/longitude to your locations to see them on the map</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
                    {locations.filter((l: any) => l.is_active).map((loc: any) => {
                      const nowOpen = isOpen(loc);
                      return (
                        <Card key={loc.id} className="overflow-hidden hover:shadow-md transition-shadow">
                          {loc.latitude && loc.longitude && (
                            <div className="h-32 bg-muted relative cursor-pointer" onClick={() => openInMaps(loc)}>
                              <img
                                src={`https://maps.googleapis.com/maps/api/staticmap?center=${loc.latitude},${loc.longitude}&zoom=14&size=400x200&markers=${loc.latitude},${loc.longitude}&key=placeholder`}
                                alt={loc.name}
                                className="w-full h-full object-cover opacity-40"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-primary text-primary-foreground rounded-full p-2">
                                  <MapPin className="h-5 w-5" />
                                </div>
                              </div>
                              {loc.latitude && loc.longitude && (
                                <div className="absolute bottom-1 right-1">
                                  <Badge variant="secondary" className="text-[9px]">{Number(loc.latitude).toFixed(4)}, {Number(loc.longitude).toFixed(4)}</Badge>
                                </div>
                              )}
                            </div>
                          )}
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="text-sm font-medium">{loc.name}</h3>
                              <Badge variant={nowOpen ? "default" : "secondary"} className="text-[9px]">{nowOpen ? "Open" : "Closed"}</Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground mb-2">{getFullAddress(loc)}</p>
                            <div className="flex gap-2">
                              {loc.phone && <Badge variant="outline" className="text-[9px] gap-0.5"><Phone className="h-2.5 w-2.5" />{loc.phone}</Badge>}
                              {loc.is_pickup_location && <Badge variant="outline" className="text-[9px] gap-0.5"><ShoppingBag className="h-2.5 w-2.5" />Pickup</Badge>}
                            </div>
                            <Button variant="outline" size="sm" className="w-full mt-2 text-xs h-7 gap-1" onClick={() => openInMaps(loc)}>
                              <Navigation className="h-3 w-3" /> Get Directions
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create/Edit Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="text-sm">{editingId ? "Edit" : "New"} Location</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-9 text-xs" placeholder="Sydney CBD Store" /></div>
              <div><Label className="text-xs">Address</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="h-9 text-xs" /></div>
              <div className="grid grid-cols-3 gap-2">
                <div><Label className="text-xs">City</Label><Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="h-9 text-xs" /></div>
                <div><Label className="text-xs">State</Label><Input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className="h-9 text-xs" /></div>
                <div><Label className="text-xs">Postcode</Label><Input value={form.postcode} onChange={e => setForm(f => ({ ...f, postcode: e.target.value }))} className="h-9 text-xs" /></div>
              </div>
              <div>
                <Label className="text-xs">Country</Label>
                <Select value={form.country} onValueChange={v => setForm(f => ({ ...f, country: v }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code} className="text-xs">{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="h-9 text-xs" /></div>
                <div><Label className="text-xs">Email</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="h-9 text-xs" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">Latitude</Label><Input value={form.latitude} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))} className="h-9 text-xs" placeholder="-33.8688" /></div>
                <div><Label className="text-xs">Longitude</Label><Input value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))} className="h-9 text-xs" placeholder="151.2093" /></div>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} /><Label className="text-xs">Active</Label></div>
                <div className="flex items-center gap-2"><Switch checked={form.is_pickup_location} onCheckedChange={v => setForm(f => ({ ...f, is_pickup_location: v }))} /><Label className="text-xs">Click & Collect</Label></div>
              </div>

              {/* Opening Hours */}
              <div>
                <Label className="text-xs flex items-center gap-1 mb-2"><Clock className="h-3 w-3" /> Opening Hours</Label>
                <div className="space-y-1.5">
                  {DAYS.map(day => {
                    const hrs = form.opening_hours[day] || { open: "09:00", close: "17:00", closed: false };
                    return (
                      <div key={day} className="flex items-center gap-2 text-xs">
                        <span className="w-20 font-medium">{day.slice(0, 3)}</span>
                        <Switch checked={!hrs.closed} onCheckedChange={v => setForm(f => ({
                          ...f, opening_hours: { ...f.opening_hours, [day]: { ...hrs, closed: !v } }
                        }))} />
                        {!hrs.closed ? (
                          <>
                            <Input type="time" value={hrs.open} className="h-7 text-xs w-24"
                              onChange={e => setForm(f => ({ ...f, opening_hours: { ...f.opening_hours, [day]: { ...hrs, open: e.target.value } } }))} />
                            <span>–</span>
                            <Input type="time" value={hrs.close} className="h-7 text-xs w-24"
                              onChange={e => setForm(f => ({ ...f, opening_hours: { ...f.opening_hours, [day]: { ...hrs, close: e.target.value } } }))} />
                          </>
                        ) : <span className="text-muted-foreground">Closed</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" className="text-xs" onClick={saveLocation}>{editingId ? "Update" : "Create"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
