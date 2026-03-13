import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, ArrowLeft, FileSpreadsheet, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Maropost-aligned export field groups
const EXPORT_GROUPS = [
  {
    group: "Identity",
    fields: [
      { key: "sku", label: "SKU", maropost: "SKU*" },
      { key: "title", label: "Name", maropost: "Name" },
      { key: "subtitle", label: "Subtitle", maropost: "Subtitle" },
      { key: "model_number", label: "Model #", maropost: "Model #" },
      { key: "custom_label", label: "Custom Label/Code", maropost: "Custom Label/Code" },
      { key: "barcode", label: "UPC/EAN", maropost: "UPC/EAN" },
      { key: "brand", label: "Brand", maropost: "Brand" },
      { key: "product_type", label: "Type", maropost: "Type" },
      { key: "product_subtype", label: "Subtype", maropost: "Subtype" },
      { key: "supplier_item_code", label: "Supplier Item Code", maropost: "Supplier Item Code" },
    ],
  },
  {
    group: "Content",
    fields: [
      { key: "description", label: "Description", maropost: "Description" },
      { key: "short_description", label: "Short Description", maropost: "Short Description" },
      { key: "features", label: "Features", maropost: "Features" },
      { key: "specifications", label: "Specifications", maropost: "Specifications" },
      { key: "terms_conditions", label: "Terms & Conditions", maropost: "Terms And Conditions" },
      { key: "internal_notes", label: "Internal Notes", maropost: "Internal Notes" },
      { key: "warranty", label: "Warranty", maropost: "Warranty" },
      { key: "availability_description", label: "Availability Description", maropost: "Availability Description" },
    ],
  },
  {
    group: "Pricing",
    fields: [
      { key: "price", label: "Price", maropost: "Price (Default)" },
      { key: "compare_at_price", label: "RRP", maropost: "RRP" },
      { key: "cost_price", label: "Cost Price", maropost: "Cost Price" },
      { key: "promo_price", label: "Promo Price", maropost: "Promotion Price" },
      { key: "promo_start", label: "Promo Start", maropost: "Promotion Start Date" },
      { key: "promo_end", label: "Promo End", maropost: "Promotion Expiry Date" },
      { key: "promo_tag", label: "Promo Tag", maropost: "Promotion Tag" },
    ],
  },
  {
    group: "Status",
    fields: [
      { key: "status", label: "Status", maropost: "Status" },
      { key: "is_active", label: "Active", maropost: "Active" },
      { key: "is_approved", label: "Approved", maropost: "Approved" },
    ],
  },
  {
    group: "Inventory",
    fields: [
      { key: "track_inventory", label: "Track Inventory", maropost: "Track Inventory" },
      { key: "is_bought", label: "Is Bought", maropost: "Item Is Bought" },
      { key: "is_sold", label: "Is Sold", maropost: "Item Is Sold" },
      { key: "is_inventoried", label: "Is Inventoried", maropost: "Item Is Inventoried" },
      { key: "reorder_quantity", label: "Reorder Qty", maropost: "Reorder Qty" },
      { key: "restock_quantity", label: "Restock Qty", maropost: "Restock Qty" },
      { key: "preorder_quantity", label: "Preorder Qty", maropost: "Preorder Qty" },
    ],
  },
  {
    group: "Tax",
    fields: [
      { key: "tax_free", label: "Tax Free", maropost: "Tax Free Item" },
      { key: "tax_inclusive", label: "Tax Inclusive", maropost: "Tax Inclusive" },
    ],
  },
  {
    group: "SEO",
    fields: [
      { key: "seo_title", label: "SEO Title", maropost: "SEO Page Title" },
      { key: "seo_description", label: "SEO Description", maropost: "SEO Meta Description" },
      { key: "seo_keywords", label: "SEO Keywords", maropost: "SEO Meta Keywords" },
      { key: "slug", label: "URL Slug", maropost: "URL" },
      { key: "auto_url_update", label: "Auto URL Update", maropost: "Generate URL Automatically" },
    ],
  },
  {
    group: "Organization",
    fields: [
      { key: "tags", label: "Tags", maropost: "Tags" },
      { key: "search_keywords", label: "Search Keywords", maropost: "Search Keywords" },
    ],
  },
  {
    group: "Flags",
    fields: [
      { key: "is_kit", label: "Is Kit", maropost: "Kit" },
      { key: "editable_bundle", label: "Editable Bundle", maropost: "Editable Kit" },
      { key: "virtual_product", label: "Virtual", maropost: "Virtual" },
    ],
  },
  {
    group: "Custom",
    fields: [
      { key: "misc1", label: "Misc 1", maropost: "Misc 1" },
      { key: "misc2", label: "Misc 2", maropost: "Misc 2" },
      { key: "misc3", label: "Misc 3", maropost: "Misc 3" },
      { key: "misc4", label: "Misc 4", maropost: "Misc 4" },
      { key: "misc5", label: "Misc 5", maropost: "Misc 5" },
    ],
  },
  {
    group: "Shipping",
    fields: [
      { key: "shipping_weight", label: "Weight", maropost: "Weight (Shipping)", source: "shipping" },
      { key: "shipping_cubic", label: "Cubic", maropost: "Cubic (Shipping)", source: "shipping" },
      { key: "shipping_length", label: "Length", maropost: "Length m (Shipping)", source: "shipping" },
      { key: "shipping_width", label: "Width", maropost: "Width m (Shipping)", source: "shipping" },
      { key: "shipping_height", label: "Height", maropost: "Height m (Shipping)", source: "shipping" },
      { key: "actual_length", label: "Actual Length", maropost: "Length m (Actual)", source: "shipping" },
      { key: "actual_width", label: "Actual Width", maropost: "Width m (Actual)", source: "shipping" },
      { key: "actual_height", label: "Actual Height", maropost: "Height m (Actual)", source: "shipping" },
      { key: "selling_unit", label: "Selling Unit", maropost: "Selling Unit of Measure", source: "shipping" },
      { key: "base_unit", label: "Base Unit", maropost: "Base Unit of Measure", source: "shipping" },
      { key: "base_unit_qty", label: "Base Unit Qty", maropost: "Base Unit Per Quantity", source: "shipping" },
      { key: "requires_packaging", label: "Requires Packaging", maropost: "Requires Packaging", source: "shipping" },
      { key: "flat_rate_charge", label: "Flat Rate Charge", maropost: "Flat Rate Shipping Charge", source: "shipping" },
      { key: "cartons", label: "Cartons", maropost: "Cartons", source: "shipping" },
    ],
  },
  {
    group: "Dates",
    fields: [
      { key: "created_at", label: "Date Added", maropost: "Date Added" },
      { key: "updated_at", label: "Date Updated", maropost: "Date Updated" },
    ],
  },
];

const ALL_FIELDS = EXPORT_GROUPS.flatMap(g => g.fields);

function escapeCSV(val: any): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default function ExportWizard() {
  const navigate = useNavigate();
  const { currentStore } = useAuth();
  const [selectedFields, setSelectedFields] = useState<Set<string>>(
    new Set(EXPORT_GROUPS.slice(0, 4).flatMap(g => g.fields.map(f => f.key)))
  );
  const [useMaropostHeaders, setUseMaropostHeaders] = useState(true);
  const [includeShipping, setIncludeShipping] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);

  const toggleField = (key: string) => {
    setSelectedFields(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const toggleGroup = (fields: { key: string }[]) => {
    const allSelected = fields.every(f => selectedFields.has(f.key));
    setSelectedFields(prev => {
      const next = new Set(prev);
      fields.forEach(f => { if (allSelected) next.delete(f.key); else next.add(f.key); });
      return next;
    });
  };

  const selectAll = () => setSelectedFields(new Set(ALL_FIELDS.map(f => f.key)));
  const selectNone = () => setSelectedFields(new Set());

  // Check if any shipping fields are selected
  const hasShippingFields = ALL_FIELDS.filter(f => (f as any).source === "shipping").some(f => selectedFields.has(f.key));

  const handleExport = async () => {
    if (!currentStore) return;
    setExporting(true);

    try {
      // Fetch products
      const { data: products, error } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", currentStore.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!products || products.length === 0) {
        toast.error("No products to export");
        setExporting(false);
        return;
      }

      // Fetch shipping data if needed
      let shippingMap: Record<string, any> = {};
      if (hasShippingFields) {
        const { data: shipData } = await supabase
          .from("product_shipping")
          .select("*")
          .eq("store_id", currentStore.id);
        (shipData || []).forEach((s: any) => { shippingMap[s.product_id] = s; });
      }

      // Build selected field list
      const fields = ALL_FIELDS.filter(f => selectedFields.has(f.key));

      // Build CSV
      const headers = fields.map(f => useMaropostHeaders ? f.maropost : f.label);
      const rows = products.map((p: any) => {
        return fields.map(f => {
          if ((f as any).source === "shipping") {
            const ship = shippingMap[p.id];
            return escapeCSV(ship ? ship[f.key] : "");
          }
          const val = p[f.key];
          if (Array.isArray(val)) return escapeCSV(val.join(", "));
          if (typeof val === "boolean") return val ? "Yes" : "No";
          return escapeCSV(val);
        });
      });

      const csv = [headers.map(escapeCSV).join(","), ...rows.map(r => r.join(","))].join("\n");

      // Download
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `products-export-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      setDone(true);
      toast.success(`Exported ${products.length} products`);
    } catch (err: any) {
      toast.error(err.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/products")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Export Products</h1>
            <p className="text-muted-foreground text-sm">Download your product catalog as CSV with Maropost-compatible field names</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Field selection */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Select Fields</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAll}>All</Button>
                    <Button variant="outline" size="sm" onClick={selectNone}>None</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {EXPORT_GROUPS.map(g => {
                  const allSelected = g.fields.every(f => selectedFields.has(f.key));
                  const someSelected = g.fields.some(f => selectedFields.has(f.key));
                  return (
                    <div key={g.group}>
                      <div className="flex items-center gap-2 mb-2">
                        <Checkbox
                          checked={allSelected}
                          className={someSelected && !allSelected ? "opacity-50" : ""}
                          onCheckedChange={() => toggleGroup(g.fields)}
                        />
                        <h3 className="text-sm font-semibold">{g.group}</h3>
                        <Badge variant="secondary" className="text-2xs">{g.fields.filter(f => selectedFields.has(f.key)).length}/{g.fields.length}</Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pl-6">
                        {g.fields.map(f => (
                          <label key={f.key} className="flex items-center gap-2 text-sm cursor-pointer py-0.5">
                            <Checkbox
                              checked={selectedFields.has(f.key)}
                              onCheckedChange={() => toggleField(f.key)}
                            />
                            <span className="truncate">{f.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Options & Export */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={useMaropostHeaders}
                    onCheckedChange={(v) => setUseMaropostHeaders(!!v)}
                  />
                  <div>
                    <p className="text-sm font-medium">Maropost-compatible headers</p>
                    <p className="text-xs text-muted-foreground">Use official Maropost field names as CSV headers</p>
                  </div>
                </label>

                <div className="pt-2">
                  <p className="text-sm text-muted-foreground">
                    <strong>{selectedFields.size}</strong> fields selected
                    {hasShippingFields && " (includes shipping data)"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                {done ? (
                  <div className="text-center space-y-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <Check className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-sm font-medium">Export complete!</p>
                    <Button variant="outline" onClick={() => setDone(false)} className="w-full">Export Again</Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleExport}
                    disabled={exporting || selectedFields.size === 0}
                    className="w-full gap-2"
                  >
                    {exporting ? (
                      <>Exporting...</>
                    ) : (
                      <><Download className="h-4 w-4" /> Export to CSV</>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
