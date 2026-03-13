import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useShippingZones, useCreateShippingZone, useDeleteShippingZone } from "@/hooks/use-data";
import { Plus, Trash2, Truck, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function useUpdateShippingZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; regions?: string; flat_rate?: number; free_above?: number | null }) => {
      const { data, error } = await supabase.from("shipping_zones").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shipping_zones"] });
      toast.success("Shipping zone updated");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export default function ShippingZones() {
  const { data: zones = [], isLoading } = useShippingZones();
  const createZone = useCreateShippingZone();
  const deleteZone = useDeleteShippingZone();
  const updateZone = useUpdateShippingZone();
  const [createOpen, setCreateOpen] = useState(false);
  const [editZone, setEditZone] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", regions: "", flat_rate: "0", free_above: "", rate_type: "flat", per_kg_rate: "0" });

  const resetForm = () => setForm({ name: "", regions: "", flat_rate: "0", free_above: "", rate_type: "flat", per_kg_rate: "0" });

  const filtered = (zones as any[]).filter((z) =>
    z.name.toLowerCase().includes(search.toLowerCase()) ||
    z.regions.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error("Name required"); return; }
    await createZone.mutateAsync({
      name: form.name,
      regions: form.regions,
      flat_rate: Number(form.flat_rate) || 0,
      free_above: form.free_above ? Number(form.free_above) : null,
      rate_type: form.rate_type,
      per_kg_rate: Number(form.per_kg_rate) || 0,
    } as any);
    resetForm();
    setCreateOpen(false);
  };

  const handleUpdate = async () => {
    if (!editZone) return;
    await updateZone.mutateAsync({
      id: editZone.id,
      name: form.name,
      regions: form.regions,
      flat_rate: Number(form.flat_rate) || 0,
      free_above: form.free_above ? Number(form.free_above) : null,
      rate_type: form.rate_type,
      per_kg_rate: Number(form.per_kg_rate) || 0,
    } as any);
    setEditZone(null);
    resetForm();
  };

  const openEdit = (z: any) => {
    setForm({
      name: z.name,
      regions: z.regions,
      flat_rate: String(z.flat_rate),
      free_above: z.free_above ? String(z.free_above) : "",
      rate_type: z.rate_type || "flat",
      per_kg_rate: String(z.per_kg_rate || 0),
    });
    setEditZone(z);
  };

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Shipping Zones</h1>
            <p className="text-xs text-muted-foreground">{zones.length} zones configured</p>
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
            <div className="flex items-center gap-2 p-3 border-b">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search zones..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 pl-8 text-xs" />
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-8">Name</TableHead>
                  <TableHead className="text-xs h-8">Regions</TableHead>
                  <TableHead className="text-xs h-8">Rate Type</TableHead>
                  <TableHead className="text-xs h-8 text-right">Rate</TableHead>
                  <TableHead className="text-xs h-8 text-right">Free Above</TableHead>
                  <TableHead className="text-xs h-8 w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-6">
                      <Truck className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                      No shipping zones configured.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((z: any) => (
                    <TableRow key={z.id} className="text-xs cursor-pointer hover:bg-muted/50" onClick={() => openEdit(z)}>
                      <TableCell className="py-2 font-medium">{z.name}</TableCell>
                      <TableCell className="py-2 max-w-[200px] truncate text-muted-foreground">{z.regions}</TableCell>
                      <TableCell className="py-2 text-right font-medium">${Number(z.flat_rate).toFixed(2)}</TableCell>
                      <TableCell className="py-2 text-right">{z.free_above ? `$${Number(z.free_above).toFixed(2)}` : "—"}</TableCell>
                      <TableCell className="py-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); deleteZone.mutate(z.id); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!editZone} onOpenChange={(o) => { if (!o) setEditZone(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Shipping Zone</DialogTitle></DialogHeader>
          <ZoneForm form={form} setForm={setForm} onSubmit={handleUpdate} loading={updateZone.isPending} label="Save Changes" />
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function ZoneForm({ form, setForm, onSubmit, loading, label }: {
  form: { name: string; regions: string; flat_rate: string; free_above: string };
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
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Flat Rate ($)</Label>
          <Input type="number" step="0.01" min="0" value={form.flat_rate} onChange={(e) => setForm({ ...form, flat_rate: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs">Free Above ($)</Label>
          <Input type="number" step="0.01" min="0" placeholder="Optional" value={form.free_above} onChange={(e) => setForm({ ...form, free_above: e.target.value })} />
        </div>
      </div>
      <Button onClick={onSubmit} disabled={loading} className="w-full">{label}</Button>
    </div>
  );
}
