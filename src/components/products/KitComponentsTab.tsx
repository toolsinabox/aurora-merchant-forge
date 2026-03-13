import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useProducts } from "@/hooks/use-data";

export function KitComponentsTab({ productId, isEdit }: { productId: string; isEdit: boolean }) {
  const qc = useQueryClient();
  const { currentStore } = useAuth();
  const { data: allProducts = [] } = useProducts();
  const [selectedProduct, setSelectedProduct] = useState("");
  const [qty, setQty] = useState("1");
  const [optional, setOptional] = useState(false);
  const [swappable, setSwappable] = useState(false);
  const [swapGroup, setSwapGroup] = useState("");

  const { data: components = [], isLoading } = useQuery({
    queryKey: ["kit_components", productId],
    queryFn: async () => {
      if (!productId || !isEdit) return [];
      const { data, error } = await supabase
        .from("kit_components" as any)
        .select("*, component:component_product_id(id, title, sku, price, images)")
        .eq("kit_product_id", productId)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
    enabled: !!productId && isEdit,
  });

  const addComponent = useMutation({
    mutationFn: async () => {
      if (!selectedProduct || !currentStore) throw new Error("Select a product");
      const { error } = await supabase.from("kit_components" as any).insert({
        kit_product_id: productId,
        component_product_id: selectedProduct,
        store_id: currentStore.id,
        quantity: Number(qty) || 1,
        is_optional: optional,
        is_swappable: swappable,
        swap_group: swapGroup || null,
        sort_order: (components as any[]).length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kit_components", productId] });
      setSelectedProduct("");
      setQty("1");
      setOptional(false);
      setSwappable(false);
      setSwapGroup("");
      toast.success("Component added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeComponent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("kit_components" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kit_components", productId] });
      toast.success("Component removed");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!isEdit) return <p className="text-xs text-muted-foreground py-4 text-center">Save the product first, then add kit components.</p>;

  const availableProducts = (allProducts as any[]).filter((p: any) => p.id !== productId);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Define the products that make up this kit/bundle. Mark components as optional or swappable to let customers customize.</p>

      {/* Add component form */}
      <div className="border rounded-lg p-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Product</Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select product..." /></SelectTrigger>
              <SelectContent>
                {availableProducts.map((p: any) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">{p.title} {p.sku ? `(${p.sku})` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Quantity</Label>
            <Input className="h-8 text-xs" type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={optional} onCheckedChange={setOptional} id="optional" />
            <Label htmlFor="optional" className="text-xs cursor-pointer">Optional</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={swappable} onCheckedChange={setSwappable} id="swappable" />
            <Label htmlFor="swappable" className="text-xs cursor-pointer">Swappable</Label>
          </div>
          {swappable && (
            <div className="flex-1">
              <Input className="h-7 text-xs" placeholder="Swap group name" value={swapGroup} onChange={(e) => setSwapGroup(e.target.value)} />
            </div>
          )}
        </div>
        <Button size="sm" className="text-xs" onClick={() => addComponent.mutate()} disabled={!selectedProduct || addComponent.isPending}>
          <Plus className="h-3 w-3 mr-1" /> Add Component
        </Button>
      </div>

      {/* Components list */}
      {(components as any[]).length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs h-8">Component</TableHead>
              <TableHead className="text-xs h-8 w-16">Qty</TableHead>
              <TableHead className="text-xs h-8">Price</TableHead>
              <TableHead className="text-xs h-8">Flags</TableHead>
              <TableHead className="text-xs h-8 w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(components as any[]).map((c: any) => (
              <TableRow key={c.id} className="text-xs">
                <TableCell className="py-1.5 font-medium">{c.component?.title || "Unknown"}</TableCell>
                <TableCell className="py-1.5">{c.quantity}</TableCell>
                <TableCell className="py-1.5">${Number(c.component?.price || 0).toFixed(2)}</TableCell>
                <TableCell className="py-1.5 space-x-1">
                  {c.is_optional && <span className="text-xs bg-muted px-1.5 py-0.5 rounded">Optional</span>}
                  {c.is_swappable && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">Swap: {c.swap_group || "any"}</span>}
                </TableCell>
                <TableCell className="py-1.5">
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeComponent.mutate(c.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {(components as any[]).length === 0 && !isLoading && (
        <p className="text-xs text-muted-foreground text-center py-4">No components added yet. Add products above to build this kit.</p>
      )}
    </div>
  );
}
