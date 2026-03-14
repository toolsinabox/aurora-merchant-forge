import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, DollarSign, Globe, RefreshCw, Trash2, Star } from "lucide-react";
import { toast } from "sonner";

export default function Currencies() {
  const { currentStore } = useAuth();
  const storeId = currentStore?.id;
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", symbol: "$", exchange_rate: "1" });

  const { data: currencies = [] } = useQuery({
    queryKey: ["currencies", storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data } = await supabase.from("currencies" as any).select("*").eq("store_id", storeId).order("is_default", { ascending: false });
      return (data || []) as any[];
    },
    enabled: !!storeId,
  });

  const addCurrency = async () => {
    if (!storeId || !form.code || !form.name) return;
    const isFirst = currencies.length === 0;
    const { error } = await supabase.from("currencies" as any).insert({
      store_id: storeId, code: form.code.toUpperCase(), name: form.name,
      symbol: form.symbol, exchange_rate: Number(form.exchange_rate),
      is_default: isFirst,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`Currency ${form.code} added`);
    setShowAdd(false);
    setForm({ code: "", name: "", symbol: "$", exchange_rate: "1" });
    qc.invalidateQueries({ queryKey: ["currencies"] });
  };

  const updateRate = async (id: string, rate: string) => {
    await supabase.from("currencies" as any).update({ exchange_rate: Number(rate) }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["currencies"] });
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("currencies" as any).update({ is_active: !active }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["currencies"] });
  };

  const setDefault = async (id: string) => {
    if (!storeId) return;
    await supabase.from("currencies" as any).update({ is_default: false }).eq("store_id", storeId);
    await supabase.from("currencies" as any).update({ is_default: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["currencies"] });
    toast.success("Default currency updated");
  };

  const deleteCurrency = async (id: string, isDefault: boolean) => {
    if (isDefault) { toast.error("Cannot delete default currency"); return; }
    await supabase.from("currencies" as any).delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["currencies"] });
    toast.success("Currency deleted");
  };

  const commonCurrencies = [
    { code: "AUD", name: "Australian Dollar", symbol: "A$" },
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "GBP", name: "British Pound", symbol: "£" },
    { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
    { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
    { code: "JPY", name: "Japanese Yen", symbol: "¥" },
    { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  ];

  const prefillCurrency = (c: typeof commonCurrencies[0]) => {
    setForm({ code: c.code, name: c.name, symbol: c.symbol, exchange_rate: "1" });
  };

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Currencies</h1>
            <p className="text-xs text-muted-foreground">Manage store currencies and exchange rates</p>
          </div>
          <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add Currency</Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-8">Code</TableHead>
                  <TableHead className="text-xs h-8">Name</TableHead>
                  <TableHead className="text-xs h-8">Symbol</TableHead>
                  <TableHead className="text-xs h-8">Exchange Rate</TableHead>
                  <TableHead className="text-xs h-8">Default</TableHead>
                  <TableHead className="text-xs h-8">Active</TableHead>
                  <TableHead className="text-xs h-8 w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {currencies.map((c: any) => (
                  <TableRow key={c.id} className="text-xs">
                    <TableCell className="py-2"><Badge variant="secondary" className="font-mono text-[10px]">{c.code}</Badge></TableCell>
                    <TableCell className="py-2">{c.name}</TableCell>
                    <TableCell className="py-2 font-medium">{c.symbol}</TableCell>
                    <TableCell className="py-2">
                      {c.is_default ? (
                        <span className="text-muted-foreground">1.0000 (base)</span>
                      ) : (
                        <Input type="number" step="0.0001" className="w-28 h-7 text-xs" defaultValue={Number(c.exchange_rate).toFixed(4)}
                          onBlur={e => updateRate(c.id, e.target.value)} />
                      )}
                    </TableCell>
                    <TableCell className="py-2">
                      {c.is_default ? (
                        <Badge variant="default" className="gap-1 text-[10px]"><Star className="h-2.5 w-2.5" /> Default</Badge>
                      ) : (
                        <Button size="sm" variant="ghost" className="text-xs h-6" onClick={() => setDefault(c.id)}>Set Default</Button>
                      )}
                    </TableCell>
                    <TableCell className="py-2"><Switch checked={c.is_active} onCheckedChange={() => toggleActive(c.id, c.is_active)} /></TableCell>
                    <TableCell className="py-2">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteCurrency(c.id, c.is_default)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {currencies.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">
                      <DollarSign className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                      No currencies configured. Add your store's base currency to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Currency</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Quick Select</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {commonCurrencies.map(c => (
                  <Button key={c.code} size="sm" variant="outline" className="h-7 text-xs" onClick={() => prefillCurrency(c)}>{c.code}</Button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Currency Code</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="AUD" maxLength={3} /></div>
              <div><Label>Symbol</Label><Input value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value })} placeholder="$" /></div>
            </div>
            <div><Label>Currency Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Australian Dollar" /></div>
            <div><Label>Exchange Rate (relative to base)</Label><Input type="number" step="0.0001" value={form.exchange_rate} onChange={e => setForm({ ...form, exchange_rate: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={addCurrency}>Add Currency</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
