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
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Edit, Trash2, MapPin, Phone, Mail, Clock } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface LocationForm {
  name: string; address: string; city: string; state: string; postcode: string;
  country: string; phone: string; email: string; latitude: string; longitude: string;
  is_active: boolean; is_pickup_location: boolean; opening_hours: Record<string, { open: string; close: string; closed: boolean }>;
}

const emptyForm: LocationForm = {
  name: "", address: "", city: "", state: "", postcode: "", country: "AU",
  phone: "", email: "", latitude: "", longitude: "",
  is_active: true, is_pickup_location: false,
  opening_hours: Object.fromEntries(DAYS.map(d => [d, { open: "09:00", close: "17:00", closed: d === "Sunday" }])),
};

export default function StoreLocator() {
  const { currentStore } = useAuth();
  const storeId = currentStore?.id;
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LocationForm>(emptyForm);

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
      is_active: loc.is_active, is_pickup_location: loc.is_pickup_location,
      opening_hours: loc.opening_hours || emptyForm.opening_hours,
    });
    setEditingId(loc.id); setShowForm(true);
  };

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
        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Locations</p><p className="text-xl font-bold">{locations.length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Active</p><p className="text-xl font-bold text-primary">{locations.filter((l: any) => l.is_active).length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Click & Collect</p><p className="text-xl font-bold">{locations.filter((l: any) => l.is_pickup_location).length}</p></CardContent></Card>
        </div>

        {/* Locations Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-8">Name</TableHead>
                  <TableHead className="text-xs h-8">Address</TableHead>
                  <TableHead className="text-xs h-8">Phone</TableHead>
                  <TableHead className="text-xs h-8">Status</TableHead>
                  <TableHead className="text-xs h-8">Pickup</TableHead>
                  <TableHead className="text-xs h-8 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
                )) : locations.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8"><MapPin className="h-6 w-6 mx-auto mb-1 text-muted-foreground/40" />No locations yet</TableCell></TableRow>
                ) : locations.map((loc: any) => (
                  <TableRow key={loc.id} className="text-xs">
                    <TableCell className="py-1.5 font-medium">{loc.name}</TableCell>
                    <TableCell className="py-1.5 text-muted-foreground max-w-[200px] truncate">
                      {[loc.address, loc.city, loc.state, loc.postcode].filter(Boolean).join(", ")}
                    </TableCell>
                    <TableCell className="py-1.5 text-muted-foreground">{loc.phone || "—"}</TableCell>
                    <TableCell className="py-1.5"><Badge variant={loc.is_active ? "default" : "secondary"} className="text-[10px]">{loc.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                    <TableCell className="py-1.5">{loc.is_pickup_location && <Badge variant="outline" className="text-[10px]">Pickup</Badge>}</TableCell>
                    <TableCell className="py-1.5 text-right">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => editLocation(loc)}><Edit className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteLocation(loc.id)}><Trash2 className="h-3 w-3" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

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
