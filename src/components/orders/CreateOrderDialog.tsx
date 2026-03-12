import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Search } from "lucide-react";
import { useProducts, useCustomers, useCreateOrder } from "@/hooks/use-data";

interface LineItem {
  product_id: string;
  variant_id?: string | null;
  title: string;
  sku?: string;
  quantity: number;
  unit_price: number;
}

export function CreateOrderDialog() {
  const [open, setOpen] = useState(false);
  const { data: products = [] } = useProducts();
  const { data: customers = [] } = useCustomers();
  const createOrder = useCreateOrder();

  const [customerId, setCustomerId] = useState<string>("");
  const [items, setItems] = useState<LineItem[]>([]);
  const [notes, setNotes] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const filteredProducts = useMemo(() => {
    if (!productSearch) return products.slice(0, 10);
    return products.filter((p: any) =>
      p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.sku || "").toLowerCase().includes(productSearch.toLowerCase())
    ).slice(0, 10);
  }, [products, productSearch]);

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);

  function addProduct(product: any) {
    setItems((prev) => [
      ...prev,
      {
        product_id: product.id,
        title: product.title,
        sku: product.sku || undefined,
        quantity: 1,
        unit_price: product.price,
      },
    ]);
    setProductSearch("");
  }

  function updateItem(idx: number, updates: Partial<LineItem>) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, ...updates } : item)));
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    if (items.length === 0) return;
    await createOrder.mutateAsync({
      customer_id: customerId || null,
      items,
      notes: notes || undefined,
      shipping_address: shippingAddress || undefined,
    });
    setOpen(false);
    resetForm();
  }

  function resetForm() {
    setCustomerId("");
    setItems([]);
    setNotes("");
    setShippingAddress("");
    setProductSearch("");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="text-xs"><Plus className="h-3.5 w-3.5 mr-1" /> New Order</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Create Order</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Customer */}
          <div className="space-y-1.5">
            <Label className="text-xs">Customer (optional)</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select customer..." /></SelectTrigger>
              <SelectContent>
                {customers.map((c: any) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">{c.name} {c.email ? `(${c.email})` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Add products */}
          <div className="space-y-1.5">
            <Label className="text-xs">Add Products</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="h-8 pl-8 text-xs"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
            </div>
            {productSearch && filteredProducts.length > 0 && (
              <div className="border rounded-md max-h-32 overflow-y-auto">
                {filteredProducts.map((p: any) => (
                  <button
                    key={p.id}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-muted/50 flex justify-between"
                    onClick={() => addProduct(p)}
                  >
                    <span>{p.title}</span>
                    <span className="text-muted-foreground">${Number(p.price).toFixed(2)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Line items */}
          {items.length > 0 && (
            <div className="border rounded-md divide-y">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-2 text-xs">
                  <div className="flex-1">
                    <p className="font-medium">{item.title}</p>
                    {item.sku && <p className="text-muted-foreground">SKU: {item.sku}</p>}
                  </div>
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, { quantity: parseInt(e.target.value) || 1 })}
                    className="w-16 h-7 text-xs text-center"
                  />
                  <span className="text-muted-foreground">×</span>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.unit_price}
                    onChange={(e) => updateItem(idx, { unit_price: parseFloat(e.target.value) || 0 })}
                    className="w-20 h-7 text-xs text-right"
                  />
                  <span className="font-medium w-16 text-right">${(item.quantity * item.unit_price).toFixed(2)}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeItem(idx)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))}
              <div className="flex justify-between px-3 py-2 text-xs font-semibold">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Shipping & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Shipping Address</Label>
              <Textarea className="text-xs min-h-[60px]" value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} placeholder="Enter shipping address..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Textarea className="text-xs min-h-[60px]" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes..." />
            </div>
          </div>

          <Button
            className="w-full text-xs"
            disabled={items.length === 0 || createOrder.isPending}
            onClick={handleSubmit}
          >
            {createOrder.isPending ? "Creating..." : `Create Order — $${subtotal.toFixed(2)}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
