import { useState } from "react";
import { useParams } from "react-router-dom";
import { ThemedStorefrontLayout as StorefrontLayout } from "@/components/storefront/ThemedStorefrontLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, ShoppingCart, Search, Loader2, Upload } from "lucide-react";
import { useStoreSlug } from "@/lib/subdomain";

interface OrderLine {
  id: string;
  sku: string;
  productId: string;
  title: string;
  price: number;
  quantity: number;
  found: boolean;
}

export default function StorefrontQuickOrder() {
  const { storeSlug: paramSlug } = useParams();
  const { basePath } = useStoreSlug(paramSlug);
  const { addItem } = useCart();
  const [lines, setLines] = useState<OrderLine[]>([
    { id: "1", sku: "", productId: "", title: "", price: 0, quantity: 1, found: false },
  ]);
  const [lookingUp, setLookingUp] = useState<string | null>(null);

  const addLine = () => {
    setLines([...lines, {
      id: Date.now().toString(),
      sku: "", productId: "", title: "", price: 0, quantity: 1, found: false,
    }]);
  };

  const removeLine = (id: string) => {
    if (lines.length <= 1) return;
    setLines(lines.filter(l => l.id !== id));
  };

  const updateLine = (id: string, field: string, value: any) => {
    setLines(lines.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const lookupSku = async (lineId: string) => {
    const line = lines.find(l => l.id === lineId);
    if (!line || !line.sku.trim()) return;
    
    setLookingUp(lineId);
    const { data } = await supabase
      .from("products")
      .select("id, title, price, sku")
      .or(`sku.eq.${line.sku.trim()},barcode.eq.${line.sku.trim()}`)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    
    if (data) {
      updateLine(lineId, "productId", data.id);
      setLines(prev => prev.map(l => l.id === lineId ? {
        ...l, productId: data.id, title: data.title, price: Number(data.price), found: true,
      } : l));
    } else {
      toast.error(`No product found for SKU: ${line.sku}`);
      setLines(prev => prev.map(l => l.id === lineId ? { ...l, found: false, title: "", price: 0, productId: "" } : l));
    }
    setLookingUp(null);
  };

  const totalItems = lines.filter(l => l.found).reduce((s, l) => s + l.quantity, 0);
  const totalValue = lines.filter(l => l.found).reduce((s, l) => s + l.price * l.quantity, 0);

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;
      const rows = text.split("\n").map(r => r.trim()).filter(Boolean);
      // Skip header if first row contains "sku" or "SKU"
      const start = rows[0]?.toLowerCase().includes("sku") ? 1 : 0;
      const newLines: OrderLine[] = [];
      for (let i = start; i < rows.length; i++) {
        const cols = rows[i].split(/[,\t;]/);
        const sku = cols[0]?.trim();
        const qty = parseInt(cols[1]?.trim()) || 1;
        if (!sku) continue;
        newLines.push({
          id: `csv-${Date.now()}-${i}`,
          sku, productId: "", title: "", price: 0, quantity: qty, found: false,
        });
      }
      if (newLines.length === 0) { toast.error("No valid rows found in CSV"); return; }
      setLines(newLines);
      toast.success(`Loaded ${newLines.length} lines from CSV. Looking up products...`);
      // Auto-lookup all SKUs
      for (const line of newLines) {
        const { data } = await supabase
          .from("products")
          .select("id, title, price, sku")
          .or(`sku.eq.${line.sku},barcode.eq.${line.sku}`)
          .eq("status", "active")
          .limit(1)
          .maybeSingle();
        if (data) {
          setLines(prev => prev.map(l => l.id === line.id ? {
            ...l, productId: data.id, title: data.title, price: Number(data.price), found: true,
          } : l));
        }
      }
      toast.success("CSV lookup complete");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleAddAllToCart = () => {
    const validLines = lines.filter(l => l.found && l.quantity > 0);
    if (validLines.length === 0) {
      toast.error("No valid products to add");
      return;
    }
    validLines.forEach(line => {
      addItem({
        product_id: line.productId,
        title: line.title,
        price: line.price,
        image: "",
        quantity: line.quantity,
      });
    });
    toast.success(`Added ${validLines.length} product(s) to cart`);
    // Reset form
    setLines([{ id: Date.now().toString(), sku: "", productId: "", title: "", price: 0, quantity: 1, found: false }]);
  };

  return (
    <StorefrontLayout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-2">Quick Order</h1>
        <p className="text-muted-foreground mb-6">Enter SKUs or barcodes to quickly add multiple products to your cart, or upload a CSV.</p>

        <div className="flex gap-2 mb-4">
          <label className="cursor-pointer">
            <input type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={handleCsvUpload} />
            <Button variant="outline" size="sm" className="gap-1" asChild>
              <span><Upload className="h-4 w-4" /> Upload CSV</span>
            </Button>
          </label>
          <p className="text-xs text-muted-foreground self-center">Format: SKU, Quantity (one per line)</p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Order Lines</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">SKU / Barcode</TableHead>
                  <TableHead></TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right w-[100px]">Price</TableHead>
                  <TableHead className="w-[100px]">Qty</TableHead>
                  <TableHead className="text-right w-[100px]">Subtotal</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>
                      <Input
                        className="h-8 text-sm"
                        placeholder="Enter SKU..."
                        value={line.sku}
                        onChange={(e) => updateLine(line.id, "sku", e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && lookupSku(line.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => lookupSku(line.id)}
                        disabled={lookingUp === line.id}
                      >
                        {lookingUp === line.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                    <TableCell className="text-sm">
                      {line.found ? (
                        <span className="text-foreground">{line.title}</span>
                      ) : (
                        <span className="text-muted-foreground italic">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {line.found ? `$${line.price.toFixed(2)}` : "—"}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number" min={1}
                        className="h-8 text-sm w-20"
                        value={line.quantity}
                        onChange={(e) => updateLine(line.id, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                      />
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {line.found ? `$${(line.price * line.quantity).toFixed(2)}` : "—"}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => removeLine(line.id)} disabled={lines.length <= 1}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <Button variant="outline" size="sm" onClick={addLine} className="gap-1">
                <Plus className="h-4 w-4" /> Add Line
              </Button>
              <div className="flex items-center gap-6">
                <div className="text-sm text-muted-foreground">
                  {totalItems} item(s) · <span className="font-semibold text-foreground">${totalValue.toFixed(2)}</span>
                </div>
                <Button onClick={handleAddAllToCart} disabled={totalItems === 0} className="gap-1">
                  <ShoppingCart className="h-4 w-4" /> Add All to Cart
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </StorefrontLayout>
  );
}
