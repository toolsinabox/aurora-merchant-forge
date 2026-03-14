import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTaxRates, useCreateTaxRate, useDeleteTaxRate } from "@/hooks/use-data";
import { Plus, Trash2, Percent, Search, Pencil } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useMutation } from "@tanstack/react-query";

function useUpdateTaxRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase.from("tax_rates").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tax_rates"] }); toast.success("Tax rate updated"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export default function TaxRates() {
  const { data: rates = [], isLoading } = useTaxRates();
  const createRate = useCreateTaxRate();
  const deleteRate = useDeleteTaxRate();
  const updateRate = useUpdateTaxRate();
  const [createOpen, setCreateOpen] = useState(false);
  const [editRate, setEditRate] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "", region: "", country: "", rate: "10",
    is_default: false, is_compound: false, is_inclusive: false,
    priority: "0", applies_to: "all",
  });

  const resetForm = () => setForm({
    name: "", region: "", country: "", rate: "10",
    is_default: false, is_compound: false, is_inclusive: false,
    priority: "0", applies_to: "all",
  });

  const filtered = (rates as any[]).filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.region?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!form.name.trim() || !form.region.trim()) { toast.error("Name and region required"); return; }
    await createRate.mutateAsync({
      name: form.name, region: form.region, rate: Number(form.rate) || 0,
      country: form.country || null, is_default: form.is_default,
      is_compound: form.is_compound, is_inclusive: form.is_inclusive,
      priority: Number(form.priority) || 0, applies_to: form.applies_to,
    } as any);
    resetForm();
    setCreateOpen(false);
  };

  const handleUpdate = async () => {
    if (!editRate) return;
    await updateRate.mutateAsync({
      id: editRate.id, name: form.name, region: form.region,
      rate: Number(form.rate) || 0, country: form.country || null,
      is_default: form.is_default, is_compound: form.is_compound,
      is_inclusive: form.is_inclusive, priority: Number(form.priority) || 0,
      applies_to: form.applies_to,
    });
    setEditRate(null);
    resetForm();
  };

  const openEdit = (r: any) => {
    setForm({
      name: r.name, region: r.region || "", country: r.country || "",
      rate: String(r.rate), is_default: r.is_default || false,
      is_compound: r.is_compound || false, is_inclusive: r.is_inclusive || false,
      priority: String(r.priority || 0), applies_to: r.applies_to || "all",
    });
    setEditRate(r);
  };

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Tax Rates</h1>
            <p className="text-xs text-muted-foreground">{rates.length} tax rates configured</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={resetForm}><Plus className="h-4 w-4 mr-1" /> Add Tax Rate</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Add Tax Rate</DialogTitle></DialogHeader>
              <TaxRateForm form={form} setForm={setForm} onSubmit={handleCreate} loading={createRate.isPending} label="Create" />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="flex items-center gap-2 p-3 border-b">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search tax rates..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 pl-8 text-xs" />
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-8">Name</TableHead>
                  <TableHead className="text-xs h-8">Region</TableHead>
                  <TableHead className="text-xs h-8">Country</TableHead>
                  <TableHead className="text-xs h-8 text-right">Rate</TableHead>
                  <TableHead className="text-xs h-8">Type</TableHead>
                  <TableHead className="text-xs h-8">Applies To</TableHead>
                  <TableHead className="text-xs h-8 w-20"></TableHead>
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
                      <Percent className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                      No tax rates configured.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r: any) => (
                    <TableRow key={r.id} className="text-xs cursor-pointer hover:bg-muted/50" onClick={() => openEdit(r)}>
                      <TableCell className="py-2 font-medium">
                        {r.name}
                        {r.is_default && <Badge variant="secondary" className="ml-1.5 text-2xs">Default</Badge>}
                      </TableCell>
                      <TableCell className="py-2 text-muted-foreground">{r.region}</TableCell>
                      <TableCell className="py-2 text-muted-foreground">{r.country || "—"}</TableCell>
                      <TableCell className="py-2 text-right font-medium">{Number(r.rate).toFixed(2)}%</TableCell>
                      <TableCell className="py-2">
                        <div className="flex gap-1">
                          {r.is_inclusive && <Badge variant="outline" className="text-2xs">Inclusive</Badge>}
                          {r.is_compound && <Badge variant="outline" className="text-2xs">Compound</Badge>}
                          {!r.is_inclusive && !r.is_compound && <span className="text-muted-foreground">Standard</span>}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 capitalize text-muted-foreground">{r.applies_to || "all"}</TableCell>
                      <TableCell className="py-2">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEdit(r); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); deleteRate.mutate(r.id); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!editRate} onOpenChange={(o) => { if (!o) setEditRate(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Tax Rate</DialogTitle></DialogHeader>
          <TaxRateForm form={form} setForm={setForm} onSubmit={handleUpdate} loading={updateRate.isPending} label="Save Changes" />
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function TaxRateForm({ form, setForm, onSubmit, loading, label }: {
  form: { name: string; region: string; country: string; rate: string; is_default: boolean; is_compound: boolean; is_inclusive: boolean; priority: string; applies_to: string };
  setForm: (f: any) => void;
  onSubmit: () => void;
  loading: boolean;
  label: string;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Name</Label>
          <Input placeholder="e.g. GST" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs">Rate (%)</Label>
          <Input type="number" step="0.01" min="0" max="100" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Region / State</Label>
          <Input placeholder="e.g. NSW, CA" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs">Country</Label>
          <Input placeholder="e.g. AU, US" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Applies To</Label>
          <Select value={form.applies_to} onValueChange={(v) => setForm({ ...form, applies_to: v })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All (Products + Shipping)</SelectItem>
              <SelectItem value="products" className="text-xs">Products Only</SelectItem>
              <SelectItem value="shipping" className="text-xs">Shipping Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Priority</Label>
          <Input type="number" min="0" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
          <p className="text-2xs text-muted-foreground mt-0.5">Higher = applied first. Compound taxes use previous tax as base.</p>
        </div>
      </div>
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Default Tax Rate</Label>
          <Switch checked={form.is_default} onCheckedChange={(v) => setForm({ ...form, is_default: v })} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-xs">Tax Inclusive</Label>
            <p className="text-2xs text-muted-foreground">Prices already include this tax</p>
          </div>
          <Switch checked={form.is_inclusive} onCheckedChange={(v) => setForm({ ...form, is_inclusive: v })} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-xs">Compound Tax</Label>
            <p className="text-2xs text-muted-foreground">Applied on top of other taxes</p>
          </div>
          <Switch checked={form.is_compound} onCheckedChange={(v) => setForm({ ...form, is_compound: v })} />
        </div>
      </div>
      <Button onClick={onSubmit} disabled={loading} className="w-full">{label}</Button>
    </div>
  );
}
