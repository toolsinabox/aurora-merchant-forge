import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Globe, Pencil, Trash2, Star, ArrowUpDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const CURRENCIES = ["AUD", "USD", "GBP", "EUR", "NZD", "CAD", "SGD", "HKD", "JPY", "CNY"];
const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "es", name: "Spanish" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ja", name: "Japanese" },
  { code: "zh", name: "Chinese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic" },
];

const PRICE_ADJUSTMENTS = [
  { value: "none", label: "No adjustment" },
  { value: "percentage_increase", label: "% Increase" },
  { value: "percentage_decrease", label: "% Decrease" },
  { value: "fixed_increase", label: "Fixed Increase" },
  { value: "fixed_decrease", label: "Fixed Decrease" },
];

interface MarketForm {
  name: string;
  code: string;
  currency: string;
  language: string;
  is_default: boolean;
  is_active: boolean;
  price_adjustment_type: string;
  price_adjustment_value: number;
  tax_inclusive: boolean;
  custom_domain: string;
  description: string;
}

const emptyForm: MarketForm = {
  name: "", code: "", currency: "AUD", language: "en",
  is_default: false, is_active: true,
  price_adjustment_type: "none", price_adjustment_value: 0,
  tax_inclusive: true, custom_domain: "", description: "",
};

export default function Multimarket() {
  const { currentStore } = useAuth();
  const storeId = currentStore?.id;
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MarketForm>(emptyForm);

  const { data: markets = [], isLoading } = useQuery({
    queryKey: ["store_markets", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_markets" as any)
        .select("*")
        .eq("store_id", storeId!)
        .order("sort_order");
      if (error) throw error;
      return data as any[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (f: MarketForm) => {
      const payload = { ...f, store_id: storeId, price_adjustment_value: Number(f.price_adjustment_value) };
      if (editingId) {
        const { error } = await supabase.from("store_markets" as any).update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("store_markets" as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["store_markets"] });
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      toast.success(editingId ? "Market updated" : "Market created");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("store_markets" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["store_markets"] });
      toast.success("Market deleted");
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("store_markets" as any).update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["store_markets"] }),
  });

  const openEdit = (m: any) => {
    setEditingId(m.id);
    setForm({
      name: m.name, code: m.code, currency: m.currency, language: m.language,
      is_default: m.is_default, is_active: m.is_active,
      price_adjustment_type: m.price_adjustment_type, price_adjustment_value: m.price_adjustment_value,
      tax_inclusive: m.tax_inclusive, custom_domain: m.custom_domain || "", description: m.description || "",
    });
    setDialogOpen(true);
  };

  const langName = (code: string) => LANGUAGES.find(l => l.code === code)?.name || code;

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Multimarket</h1>
            <p className="text-xs text-muted-foreground">Manage multiple storefronts with different pricing, currencies, and languages</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditingId(null); setForm(emptyForm); } }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Market</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Market" : "New Market"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Name</Label>
                    <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Australia" />
                  </div>
                  <div>
                    <Label className="text-xs">Code</Label>
                    <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toLowerCase() }))} placeholder="au" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Currency</Label>
                    <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Language</Label>
                    <Select value={form.language} onValueChange={v => setForm(f => ({ ...f, language: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{LANGUAGES.map(l => <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Price Adjustment</Label>
                    <Select value={form.price_adjustment_type} onValueChange={v => setForm(f => ({ ...f, price_adjustment_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{PRICE_ADJUSTMENTS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  {form.price_adjustment_type !== "none" && (
                    <div>
                      <Label className="text-xs">Value</Label>
                      <Input type="number" value={form.price_adjustment_value} onChange={e => setForm(f => ({ ...f, price_adjustment_value: Number(e.target.value) }))} />
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-xs">Custom Domain (optional)</Label>
                  <Input value={form.custom_domain} onChange={e => setForm(f => ({ ...f, custom_domain: e.target.value }))} placeholder="au.mystore.com" />
                </div>
                <div>
                  <Label className="text-xs">Description</Label>
                  <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Australian market" />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs">
                    <Switch checked={form.tax_inclusive} onCheckedChange={v => setForm(f => ({ ...f, tax_inclusive: v }))} />
                    Tax Inclusive
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <Switch checked={form.is_default} onCheckedChange={v => setForm(f => ({ ...f, is_default: v }))} />
                    Default Market
                  </label>
                </div>
                <Button onClick={() => saveMutation.mutate(form)} disabled={!form.name || !form.code || saveMutation.isPending} className="w-full">
                  {editingId ? "Update" : "Create"} Market
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-muted-foreground">Total Markets</p>
            <p className="text-xl font-bold">{markets.length}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-muted-foreground">Active</p>
            <p className="text-xl font-bold text-primary">{markets.filter((m: any) => m.is_active).length}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-muted-foreground">Currencies</p>
            <p className="text-xl font-bold">{new Set(markets.map((m: any) => m.currency)).size}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-muted-foreground">Languages</p>
            <p className="text-xl font-bold">{new Set(markets.map((m: any) => m.language)).size}</p>
          </CardContent></Card>
        </div>

        {/* Markets Table */}
        <Card>
          <CardHeader className="py-3 px-4"><CardTitle className="text-sm">Markets</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Code</TableHead>
                  <TableHead className="text-xs">Currency</TableHead>
                  <TableHead className="text-xs">Language</TableHead>
                  <TableHead className="text-xs">Price Adjustment</TableHead>
                  <TableHead className="text-xs">Tax</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">Loading...</TableCell></TableRow>
                ) : markets.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">No markets configured. Add your first market to start selling in multiple regions.</TableCell></TableRow>
                ) : markets.map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs font-medium">
                      <div className="flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                        {m.name}
                        {m.is_default && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs"><Badge variant="outline" className="text-[10px]">{m.code}</Badge></TableCell>
                    <TableCell className="text-xs">{m.currency}</TableCell>
                    <TableCell className="text-xs">{langName(m.language)}</TableCell>
                    <TableCell className="text-xs">
                      {m.price_adjustment_type === "none" ? "—" : (
                        <span>
                          {m.price_adjustment_type.includes("percentage") ? `${m.price_adjustment_value}%` : `$${m.price_adjustment_value}`}
                          {m.price_adjustment_type.includes("increase") ? " ↑" : " ↓"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">{m.tax_inclusive ? "Inclusive" : "Exclusive"}</TableCell>
                    <TableCell>
                      <Switch checked={m.is_active} onCheckedChange={v => toggleActive.mutate({ id: m.id, is_active: v })} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(m)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("Delete this market?")) deleteMutation.mutate(m.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
