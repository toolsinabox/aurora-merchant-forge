import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, X } from "lucide-react";
import { useUpdateProduct, useCategories } from "@/hooks/use-data";
import { toast } from "sonner";

interface BulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  products: any[];
  onComplete: () => void;
}

type BulkField = "status" | "category_id" | "brand" | "product_type" | "price_adjust" | "tags_add" | "tags_remove" | "tax_free" | "is_active";

export function BulkEditDialog({ open, onOpenChange, selectedIds, products, onComplete }: BulkEditDialogProps) {
  const updateProduct = useUpdateProduct();
  const { data: categories = [] } = useCategories();
  const [processing, setProcessing] = useState(false);

  // Which fields to update
  const [enabledFields, setEnabledFields] = useState<Set<BulkField>>(new Set());

  // Field values
  const [status, setStatus] = useState("active");
  const [categoryId, setCategoryId] = useState<string>("");
  const [brand, setBrand] = useState("");
  const [productType, setProductType] = useState("");
  const [priceAdjustType, setPriceAdjustType] = useState<"set" | "increase_pct" | "decrease_pct" | "increase_amt" | "decrease_amt">("set");
  const [priceAdjustValue, setPriceAdjustValue] = useState("");
  const [tagsToAdd, setTagsToAdd] = useState("");
  const [tagsToRemove, setTagsToRemove] = useState("");
  const [taxFree, setTaxFree] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const toggleField = (field: BulkField) => {
    setEnabledFields((prev) => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  };

  const selectedProducts = products.filter((p) => selectedIds.includes(p.id));

  const handleApply = async () => {
    if (enabledFields.size === 0) { toast.error("Select at least one field to update"); return; }
    setProcessing(true);

    try {
      let successCount = 0;
      for (const product of selectedProducts) {
        const updates: Record<string, any> = {};

        if (enabledFields.has("status")) updates.status = status;
        if (enabledFields.has("category_id")) updates.category_id = categoryId || null;
        if (enabledFields.has("brand")) updates.brand = brand || null;
        if (enabledFields.has("product_type")) updates.product_type = productType || null;
        if (enabledFields.has("tax_free")) updates.tax_free = taxFree;
        if (enabledFields.has("is_active")) updates.is_active = isActive;

        if (enabledFields.has("price_adjust") && priceAdjustValue) {
          const val = parseFloat(priceAdjustValue);
          if (!isNaN(val)) {
            const currentPrice = Number(product.price);
            switch (priceAdjustType) {
              case "set": updates.price = val; break;
              case "increase_pct": updates.price = Math.round(currentPrice * (1 + val / 100) * 100) / 100; break;
              case "decrease_pct": updates.price = Math.round(currentPrice * (1 - val / 100) * 100) / 100; break;
              case "increase_amt": updates.price = Math.round((currentPrice + val) * 100) / 100; break;
              case "decrease_amt": updates.price = Math.max(0, Math.round((currentPrice - val) * 100) / 100); break;
            }
          }
        }

        if (enabledFields.has("tags_add") && tagsToAdd) {
          const currentTags = product.tags || [];
          const newTags = tagsToAdd.split(",").map((t: string) => t.trim()).filter(Boolean);
          updates.tags = [...new Set([...currentTags, ...newTags])];
        }

        if (enabledFields.has("tags_remove") && tagsToRemove) {
          const currentTags = updates.tags || product.tags || [];
          const removeTags = tagsToRemove.split(",").map((t: string) => t.trim().toLowerCase());
          updates.tags = currentTags.filter((t: string) => !removeTags.includes(t.toLowerCase()));
        }

        if (Object.keys(updates).length > 0) {
          await updateProduct.mutateAsync({ id: product.id, ...updates });
          successCount++;
        }
      }

      toast.success(`Updated ${successCount} products`);
      onComplete();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Bulk update failed");
    } finally {
      setProcessing(false);
    }
  };

  const fields: { key: BulkField; label: string }[] = [
    { key: "status", label: "Status" },
    { key: "category_id", label: "Category" },
    { key: "brand", label: "Brand" },
    { key: "product_type", label: "Product Type" },
    { key: "price_adjust", label: "Price Adjustment" },
    { key: "tags_add", label: "Add Tags" },
    { key: "tags_remove", label: "Remove Tags" },
    { key: "tax_free", label: "Tax Free" },
    { key: "is_active", label: "Active / Inactive" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Bulk Edit {selectedIds.length} Products</DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground">Select the fields you want to update. Only checked fields will be changed.</p>

        <div className="space-y-3 mt-2">
          {fields.map(({ key, label }) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`bulk-${key}`}
                  checked={enabledFields.has(key)}
                  onCheckedChange={() => toggleField(key)}
                />
                <Label htmlFor={`bulk-${key}`} className="text-xs font-medium cursor-pointer">{label}</Label>
              </div>

              {enabledFields.has(key) && (
                <div className="ml-6">
                  {key === "status" && (
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active" className="text-xs">Active</SelectItem>
                        <SelectItem value="draft" className="text-xs">Draft</SelectItem>
                        <SelectItem value="archived" className="text-xs">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  {key === "category_id" && (
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="" className="text-xs">None</SelectItem>
                        {(categories as any[]).map((c: any) => (
                          <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {key === "brand" && (
                    <Input className="h-8 text-xs" placeholder="Brand name" value={brand} onChange={(e) => setBrand(e.target.value)} />
                  )}

                  {key === "product_type" && (
                    <Input className="h-8 text-xs" placeholder="e.g. Physical, Digital, Service" value={productType} onChange={(e) => setProductType(e.target.value)} />
                  )}

                  {key === "price_adjust" && (
                    <div className="space-y-2">
                      <Select value={priceAdjustType} onValueChange={(v: any) => setPriceAdjustType(v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="set" className="text-xs">Set to exact price</SelectItem>
                          <SelectItem value="increase_pct" className="text-xs">Increase by %</SelectItem>
                          <SelectItem value="decrease_pct" className="text-xs">Decrease by %</SelectItem>
                          <SelectItem value="increase_amt" className="text-xs">Increase by $</SelectItem>
                          <SelectItem value="decrease_amt" className="text-xs">Decrease by $</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        className="h-8 text-xs"
                        type="number"
                        step="0.01"
                        placeholder={priceAdjustType === "set" ? "New price" : priceAdjustType.includes("pct") ? "Percentage" : "Amount"}
                        value={priceAdjustValue}
                        onChange={(e) => setPriceAdjustValue(e.target.value)}
                      />
                      {priceAdjustType !== "set" && priceAdjustValue && selectedProducts.length > 0 && (
                        <div className="text-[10px] text-muted-foreground">
                          Preview: {selectedProducts[0].title} ${Number(selectedProducts[0].price).toFixed(2)} →{" "}
                          {(() => {
                            const val = parseFloat(priceAdjustValue);
                            const cur = Number(selectedProducts[0].price);
                            if (isNaN(val)) return "?";
                            switch (priceAdjustType) {
                              case "increase_pct": return `$${(cur * (1 + val / 100)).toFixed(2)}`;
                              case "decrease_pct": return `$${(cur * (1 - val / 100)).toFixed(2)}`;
                              case "increase_amt": return `$${(cur + val).toFixed(2)}`;
                              case "decrease_amt": return `$${Math.max(0, cur - val).toFixed(2)}`;
                              default: return `$${val.toFixed(2)}`;
                            }
                          })()}
                        </div>
                      )}
                    </div>
                  )}

                  {key === "tags_add" && (
                    <div className="space-y-1">
                      <Input className="h-8 text-xs" placeholder="tag1, tag2, tag3" value={tagsToAdd} onChange={(e) => setTagsToAdd(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground">Comma-separated. Will be added to existing tags.</p>
                    </div>
                  )}

                  {key === "tags_remove" && (
                    <div className="space-y-1">
                      <Input className="h-8 text-xs" placeholder="tag1, tag2" value={tagsToRemove} onChange={(e) => setTagsToRemove(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground">Comma-separated. Will be removed from existing tags.</p>
                    </div>
                  )}

                  {key === "tax_free" && (
                    <div className="flex items-center gap-2">
                      <Checkbox checked={taxFree} onCheckedChange={(v) => setTaxFree(!!v)} />
                      <span className="text-xs">Mark as tax-free</span>
                    </div>
                  )}

                  {key === "is_active" && (
                    <Select value={isActive ? "true" : "false"} onValueChange={(v) => setIsActive(v === "true")}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true" className="text-xs">Active</SelectItem>
                        <SelectItem value="false" className="text-xs">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {key !== fields[fields.length - 1].key && <Separator className="mt-2" />}
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {enabledFields.size} field{enabledFields.size !== 1 ? "s" : ""} will be updated on {selectedIds.length} product{selectedIds.length !== 1 ? "s" : ""}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button size="sm" className="text-xs gap-1" onClick={handleApply} disabled={processing || enabledFields.size === 0}>
              {processing ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating...</> : `Apply to ${selectedIds.length} Products`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
