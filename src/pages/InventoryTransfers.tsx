import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, ArrowRight, Truck, Package, CheckCircle, Clock, Search } from "lucide-react";
import { format } from "date-fns";
import { StatusBadge } from "@/components/admin/StatusBadge";

export default function InventoryTransfers() {
  const { currentStore } = useAuth();
  const storeId = currentStore?.id;
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ["inventory-transfers", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data } = await supabase.from("inventory_transfers" as any).select("*")
        .eq("store_id", storeId!).order("created_at", { ascending: false });
      return (data || []) as any[];
    },
  });

  const { data: locations = [] } = useQuery({
    queryKey: ["inventory-locations", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data } = await supabase.from("inventory_locations").select("*").eq("store_id", storeId!);
      return data || [];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["transfer-products", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, title, sku").eq("store_id", storeId!).eq("status", "active").limit(200);
      return data || [];
    },
  });

  const [form, setForm] = useState({
    from_location_id: "",
    to_location_id: "",
    notes: "",
    items: [{ product_id: "", quantity: 1 }] as { product_id: string; quantity: number }[],
  });

  const createTransfer = useMutation({
    mutationFn: async () => {
      if (!form.from_location_id || !form.to_location_id) throw new Error("Select both locations");
      if (form.from_location_id === form.to_location_id) throw new Error("Locations must be different");
      const validItems = form.items.filter(i => i.product_id && i.quantity > 0);
      if (validItems.length === 0) throw new Error("Add at least one item");

      const transferNumber = `TRF-${Date.now().toString(36).toUpperCase()}`;
      const { data: transfer, error } = await supabase.from("inventory_transfers" as any).insert({
        store_id: storeId!,
        transfer_number: transferNumber,
        from_location_id: form.from_location_id,
        to_location_id: form.to_location_id,
        status: "pending",
        notes: form.notes,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      } as any).select().single();
      if (error) throw error;

      const itemPayloads = validItems.map(i => ({
        transfer_id: (transfer as any).id,
        store_id: storeId!,
        product_id: i.product_id,
        quantity_requested: i.quantity,
      }));
      const { error: itemsErr } = await supabase.from("inventory_transfer_items").insert(itemPayloads);
      if (itemsErr) throw itemsErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-transfers"] });
      setShowForm(false);
      setForm({ from_location_id: "", to_location_id: "", notes: "", items: [{ product_id: "", quantity: 1 }] });
      toast.success("Transfer request created");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("inventory_transfers" as any).update({ status }).eq("id", id);
    if (error) { toast.error("Update failed"); return; }
    queryClient.invalidateQueries({ queryKey: ["inventory-transfers"] });
    toast.success(`Transfer ${status}`);
  };

  const filtered = transfers.filter((t: any) =>
    !search || (t.transfer_number || "").toLowerCase().includes(search.toLowerCase())
  );

  const addItem = () => setForm({ ...form, items: [...form.items, { product_id: "", quantity: 1 }] });
  const removeItem = (i: number) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });

  const getLocName = (id: string) => locations.find((l: any) => l.id === id)?.name || "—";

  const statusCounts = {
    pending: transfers.filter((t: any) => t.status === "pending").length,
    in_transit: transfers.filter((t: any) => t.status === "in_transit").length,
    received: transfers.filter((t: any) => t.status === "received").length,
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Inventory Transfers</h1>
            <p className="text-xs text-muted-foreground">Move stock between warehouse locations</p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5" /> New Transfer
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-lg font-bold">{statusCounts.pending}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Truck className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold">{statusCounts.in_transit}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">In Transit</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-lg font-bold">{statusCounts.received}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Received</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input className="pl-9 h-8 text-xs" placeholder="Search transfers..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Transfers table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-9">Transfer #</TableHead>
                  <TableHead className="text-xs h-9">From</TableHead>
                  <TableHead className="text-xs h-9"></TableHead>
                  <TableHead className="text-xs h-9">To</TableHead>
                  <TableHead className="text-xs h-9">Status</TableHead>
                  <TableHead className="text-xs h-9">Date</TableHead>
                  <TableHead className="text-xs h-9 w-40"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">No transfers found</TableCell></TableRow>
                ) : filtered.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell className="py-2 font-mono text-xs font-medium">{t.transfer_number}</TableCell>
                    <TableCell className="py-2 text-xs">{getLocName(t.from_location_id)}</TableCell>
                    <TableCell className="py-2"><ArrowRight className="h-3 w-3 text-muted-foreground" /></TableCell>
                    <TableCell className="py-2 text-xs">{getLocName(t.to_location_id)}</TableCell>
                    <TableCell className="py-2"><StatusBadge status={t.status} /></TableCell>
                    <TableCell className="py-2 text-xs text-muted-foreground">{format(new Date(t.created_at), "MMM d, yyyy")}</TableCell>
                    <TableCell className="py-2">
                      <div className="flex gap-1">
                        {t.status === "pending" && (
                          <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => updateStatus(t.id, "in_transit")}>
                            Ship
                          </Button>
                        )}
                        {t.status === "in_transit" && (
                          <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => updateStatus(t.id, "received")}>
                            Receive
                          </Button>
                        )}
                        {t.status === "pending" && (
                          <Button size="sm" variant="ghost" className="h-6 text-[10px] text-destructive" onClick={() => updateStatus(t.id, "cancelled")}>
                            Cancel
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create Transfer Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-sm">New Inventory Transfer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">From Location</Label>
                  <Select value={form.from_location_id} onValueChange={v => setForm({ ...form, from_location_id: v })}>
                    <SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {locations.map((l: any) => <SelectItem key={l.id} value={l.id} className="text-xs">{l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">To Location</Label>
                  <Select value={form.to_location_id} onValueChange={v => setForm({ ...form, to_location_id: v })}>
                    <SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {locations.filter((l: any) => l.id !== form.from_location_id).map((l: any) =>
                        <SelectItem key={l.id} value={l.id} className="text-xs">{l.name}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs">Notes</Label>
                <Input className="h-8 text-xs mt-1" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs font-medium">Items to Transfer</Label>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={addItem}>
                    <Plus className="h-3 w-3 mr-1" /> Add Item
                  </Button>
                </div>
                {form.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <Select value={item.product_id} onValueChange={v => {
                      const items = [...form.items]; items[i].product_id = v; setForm({ ...form, items });
                    }}>
                      <SelectTrigger className="h-7 text-[10px] flex-1"><SelectValue placeholder="Select product" /></SelectTrigger>
                      <SelectContent>
                        {products.map((p: any) => (
                          <SelectItem key={p.id} value={p.id} className="text-xs">
                            {p.sku ? `[${p.sku}] ` : ""}{p.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input className="h-7 text-[10px] w-20" type="number" min="1" value={item.quantity}
                      onChange={e => { const items = [...form.items]; items[i].quantity = parseInt(e.target.value) || 1; setForm({ ...form, items }); }}
                    />
                    {form.items.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeItem(i)}>×</Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" onClick={() => createTransfer.mutate()} disabled={createTransfer.isPending}>
                {createTransfer.isPending ? "Creating..." : "Create Transfer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
