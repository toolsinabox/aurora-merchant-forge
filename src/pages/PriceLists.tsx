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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Edit, Trash2, DollarSign, Users, Package, Search } from "lucide-react";
import { format } from "date-fns";

interface PriceListForm {
  name: string;
  description: string;
  customer_group_id: string;
  currency: string;
  is_active: boolean;
  starts_at: string;
  ends_at: string;
}

const emptyForm: PriceListForm = {
  name: "", description: "", customer_group_id: "", currency: "AUD",
  is_active: true, starts_at: "", ends_at: "",
};

interface PriceItemForm {
  product_id: string;
  variant_id: string;
  price: string;
  min_quantity: string;
}

export default function PriceLists() {
  const { currentStore } = useAuth();
  const storeId = currentStore?.id;
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PriceListForm>(emptyForm);
  const [selectedList, setSelectedList] = useState<any>(null);
  const [itemForm, setItemForm] = useState<PriceItemForm>({ product_id: "", variant_id: "", price: "", min_quantity: "1" });
  const [search, setSearch] = useState("");

  const { data: priceLists = [], isLoading } = useQuery({
    queryKey: ["price_lists", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data } = await supabase.from("price_lists" as any).select("*").eq("store_id", storeId!).order("created_at", { ascending: false });
      return (data || []) as any[];
    },
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["customer_groups", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data } = await supabase.from("customer_groups").select("id, name").eq("store_id", storeId!);
      return (data || []) as any[];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products_simple", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, title, sku, price").eq("store_id", storeId!).eq("status", "active").limit(500);
      return (data || []) as any[];
    },
  });

  const { data: listItems = [], refetch: refetchItems } = useQuery({
    queryKey: ["price_list_items", selectedList?.id],
    enabled: !!selectedList,
    queryFn: async () => {
      const { data } = await supabase.from("price_list_items" as any).select("*, products:product_id(title, sku, price)").eq("price_list_id", selectedList!.id);
      return (data || []) as any[];
    },
  });

  const savePriceList = async () => {
    if (!form.name.trim() || !storeId) { toast.error("Name is required"); return; }
    const payload: any = {
      store_id: storeId, name: form.name.trim(), description: form.description || null,
      customer_group_id: form.customer_group_id || null, currency: form.currency,
      is_active: form.is_active,
      starts_at: form.starts_at || null, ends_at: form.ends_at || null,
    };
    if (editingId) {
      await supabase.from("price_lists" as any).update(payload).eq("id", editingId);
      toast.success("Price list updated");
    } else {
      await supabase.from("price_lists" as any).insert(payload);
      toast.success("Price list created");
    }
    setShowForm(false); setEditingId(null); setForm(emptyForm);
    qc.invalidateQueries({ queryKey: ["price_lists"] });
  };

  const deletePriceList = async (id: string) => {
    await supabase.from("price_lists" as any).delete().eq("id", id);
    toast.success("Price list deleted");
    if (selectedList?.id === id) setSelectedList(null);
    qc.invalidateQueries({ queryKey: ["price_lists"] });
  };

  const addItem = async () => {
    if (!itemForm.product_id || !itemForm.price || !selectedList) { toast.error("Product and price required"); return; }
    await supabase.from("price_list_items" as any).insert({
      store_id: storeId, price_list_id: selectedList.id,
      product_id: itemForm.product_id,
      variant_id: itemForm.variant_id || null,
      price: Number(itemForm.price), min_quantity: Number(itemForm.min_quantity) || 1,
    });
    toast.success("Price added");
    setItemForm({ product_id: "", variant_id: "", price: "", min_quantity: "1" });
    refetchItems();
  };

  const deleteItem = async (id: string) => {
    await supabase.from("price_list_items" as any).delete().eq("id", id);
    toast.success("Item removed");
    refetchItems();
  };

  const editPriceList = (pl: any) => {
    setForm({
      name: pl.name, description: pl.description || "", customer_group_id: pl.customer_group_id || "",
      currency: pl.currency || "AUD", is_active: pl.is_active,
      starts_at: pl.starts_at?.split("T")[0] || "", ends_at: pl.ends_at?.split("T")[0] || "",
    });
    setEditingId(pl.id); setShowForm(true);
  };

  const filteredProducts = products.filter((p: any) =>
    !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Price Lists</h1>
            <p className="text-xs text-muted-foreground">B2B contract pricing per customer group with quantity tiers</p>
          </div>
          <Button size="sm" className="text-xs h-8 gap-1" onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }}>
            <Plus className="h-3.5 w-3.5" /> New Price List
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Price Lists */}
          <Card className="lg:col-span-1">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5"><DollarSign className="h-4 w-4" /> Price Lists ({priceLists.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-1">
              {isLoading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />) :
                priceLists.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No price lists yet</p>
                ) : priceLists.map((pl: any) => (
                  <div key={pl.id} onClick={() => setSelectedList(pl)}
                    className={`p-3 rounded-md cursor-pointer text-xs border transition-colors ${selectedList?.id === pl.id ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted"}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{pl.name}</span>
                      <div className="flex items-center gap-1">
                        <Badge variant={pl.is_active ? "default" : "secondary"} className="text-[10px]">{pl.is_active ? "Active" : "Inactive"}</Badge>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); editPriceList(pl); }}><Edit className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); deletePriceList(pl.id); }}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                    {pl.description && <p className="text-muted-foreground mt-0.5">{pl.description}</p>}
                    <div className="flex gap-2 mt-1 text-muted-foreground">
                      <span>{pl.currency}</span>
                      {pl.starts_at && <span>From {format(new Date(pl.starts_at), "MMM d")}</span>}
                    </div>
                  </div>
                ))
              }
            </CardContent>
          </Card>

          {/* Items */}
          <Card className="lg:col-span-2">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Package className="h-4 w-4" />
                {selectedList ? `${selectedList.name} — Products` : "Select a price list"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              {selectedList ? (
                <div className="space-y-3">
                  {/* Add product form */}
                  <div className="flex gap-2 items-end flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <Label className="text-xs">Product</Label>
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                        <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-7 h-9 text-xs" />
                      </div>
                      {search && filteredProducts.length > 0 && (
                        <div className="border rounded-md mt-1 max-h-32 overflow-auto bg-popover">
                          {filteredProducts.slice(0, 10).map((p: any) => (
                            <button key={p.id} className="w-full text-left px-2 py-1.5 text-xs hover:bg-muted"
                              onClick={() => { setItemForm(f => ({ ...f, product_id: p.id })); setSearch(p.title); }}>
                              {p.title} <span className="text-muted-foreground">({p.sku || "no SKU"}) — ${p.price}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="w-24">
                      <Label className="text-xs">Price</Label>
                      <Input type="number" step="0.01" placeholder="0.00" value={itemForm.price} onChange={e => setItemForm(f => ({ ...f, price: e.target.value }))} className="h-9 text-xs" />
                    </div>
                    <div className="w-20">
                      <Label className="text-xs">Min Qty</Label>
                      <Input type="number" value={itemForm.min_quantity} onChange={e => setItemForm(f => ({ ...f, min_quantity: e.target.value }))} className="h-9 text-xs" />
                    </div>
                    <Button size="sm" className="text-xs h-9" onClick={addItem}><Plus className="h-3.5 w-3.5 mr-1" /> Add</Button>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs h-8">Product</TableHead>
                        <TableHead className="text-xs h-8">SKU</TableHead>
                        <TableHead className="text-xs h-8 text-right">Base Price</TableHead>
                        <TableHead className="text-xs h-8 text-right">List Price</TableHead>
                        <TableHead className="text-xs h-8 text-right">Min Qty</TableHead>
                        <TableHead className="text-xs h-8 w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {listItems.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-6">No items — add products above</TableCell></TableRow>
                      ) : listItems.map((item: any) => (
                        <TableRow key={item.id} className="text-xs">
                          <TableCell className="py-1.5 font-medium">{item.products?.title || "—"}</TableCell>
                          <TableCell className="py-1.5 font-mono text-muted-foreground">{item.products?.sku || "—"}</TableCell>
                          <TableCell className="py-1.5 text-right text-muted-foreground">${Number(item.products?.price || 0).toFixed(2)}</TableCell>
                          <TableCell className="py-1.5 text-right font-semibold text-primary">${Number(item.price).toFixed(2)}</TableCell>
                          <TableCell className="py-1.5 text-right">{item.min_quantity}</TableCell>
                          <TableCell className="py-1.5"><Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteItem(item.id)}><Trash2 className="h-3 w-3" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-12">Select a price list from the left to manage its products</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="text-sm">{editingId ? "Edit" : "New"} Price List</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-9 text-xs" /></div>
              <div><Label className="text-xs">Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="h-9 text-xs" /></div>
              <div><Label className="text-xs">Customer Group</Label>
                <Select value={form.customer_group_id} onValueChange={v => setForm(f => ({ ...f, customer_group_id: v }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All customers" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Customers</SelectItem>
                    {groups.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">Starts</Label><Input type="date" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} className="h-9 text-xs" /></div>
                <div><Label className="text-xs">Ends</Label><Input type="date" value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} className="h-9 text-xs" /></div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                <Label className="text-xs">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" className="text-xs" onClick={savePriceList}>{editingId ? "Update" : "Create"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
