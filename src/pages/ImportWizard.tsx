import { useState, useRef, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, ArrowLeft, ArrowRight, Check, AlertTriangle, FileSpreadsheet, Save, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useImportTemplates, useCreateImportTemplate, useDeleteImportTemplate } from "@/hooks/use-data";

type ImportEntity = "products" | "orders";

// Maropost-aligned product fields
const PRODUCT_FIELDS = [
  { key: "title", label: "Name *", group: "Basic" },
  { key: "subtitle", label: "Subtitle", group: "Basic" },
  { key: "sku", label: "SKU", group: "Basic" },
  { key: "barcode", label: "UPC/EAN", group: "Basic" },
  { key: "brand", label: "Brand", group: "Basic" },
  { key: "model_number", label: "Model #", group: "Basic" },
  { key: "custom_label", label: "Custom Label", group: "Basic" },
  { key: "product_type", label: "Type", group: "Basic" },
  { key: "supplier_item_code", label: "Supplier Item Code", group: "Basic" },
  { key: "description", label: "Description", group: "Content" },
  { key: "short_description", label: "Short Description", group: "Content" },
  { key: "features", label: "Features", group: "Content" },
  { key: "specifications", label: "Specifications", group: "Content" },
  { key: "warranty", label: "Warranty", group: "Content" },
  { key: "availability_description", label: "Availability Description", group: "Content" },
  { key: "internal_notes", label: "Internal Notes", group: "Content" },
  { key: "price", label: "Price", group: "Pricing" },
  { key: "compare_at_price", label: "RRP", group: "Pricing" },
  { key: "cost_price", label: "Cost Price", group: "Pricing" },
  { key: "promo_price", label: "Promo Price", group: "Pricing" },
  { key: "promo_start", label: "Promo Start Date", group: "Pricing" },
  { key: "promo_end", label: "Promo End Date", group: "Pricing" },
  { key: "promo_tag", label: "Promo Tag", group: "Pricing" },
  { key: "status", label: "Status", group: "Status" },
  { key: "is_active", label: "Active", group: "Status" },
  { key: "is_approved", label: "Approved", group: "Status" },
  { key: "tags", label: "Tags", group: "Organization" },
  { key: "search_keywords", label: "Search Keywords", group: "Organization" },
  { key: "seo_title", label: "SEO Page Title", group: "SEO" },
  { key: "seo_description", label: "SEO Meta Description", group: "SEO" },
  { key: "seo_keywords", label: "SEO Meta Keywords", group: "SEO" },
  { key: "slug", label: "URL Slug", group: "SEO" },
  { key: "track_inventory", label: "Track Inventory", group: "Inventory" },
  { key: "is_bought", label: "Is Bought", group: "Inventory" },
  { key: "is_sold", label: "Is Sold", group: "Inventory" },
  { key: "is_inventoried", label: "Is Inventoried", group: "Inventory" },
  { key: "reorder_quantity", label: "Reorder Qty", group: "Inventory" },
  { key: "restock_quantity", label: "Restock Qty", group: "Inventory" },
  { key: "preorder_quantity", label: "Preorder Qty", group: "Inventory" },
  { key: "tax_free", label: "Tax Free", group: "Tax" },
  { key: "tax_inclusive", label: "Tax Inclusive", group: "Tax" },
  { key: "is_kit", label: "Is Kit", group: "Flags" },
  { key: "editable_bundle", label: "Editable Bundle", group: "Flags" },
  { key: "virtual_product", label: "Virtual", group: "Flags" },
  { key: "misc1", label: "Misc 1", group: "Custom" },
  { key: "misc2", label: "Misc 2", group: "Custom" },
  { key: "misc3", label: "Misc 3", group: "Custom" },
  { key: "misc4", label: "Misc 4", group: "Custom" },
  { key: "misc5", label: "Misc 5", group: "Custom" },
];

const ORDER_FIELDS = [
  { key: "order_number", label: "Order Number *", group: "Basic" },
  { key: "status", label: "Status", group: "Basic" },
  { key: "payment_status", label: "Payment Status", group: "Basic" },
  { key: "fulfillment_status", label: "Fulfillment Status", group: "Basic" },
  { key: "subtotal", label: "Subtotal", group: "Financial" },
  { key: "tax", label: "Tax", group: "Financial" },
  { key: "shipping", label: "Shipping", group: "Financial" },
  { key: "discount", label: "Discount", group: "Financial" },
  { key: "total", label: "Total", group: "Financial" },
  { key: "notes", label: "Notes", group: "Details" },
  { key: "shipping_address", label: "Shipping Address", group: "Details" },
  { key: "billing_address", label: "Billing Address", group: "Details" },
  { key: "tags", label: "Tags", group: "Details" },
  { key: "customer_email", label: "Customer Email (lookup)", group: "Customer" },
];

type FieldMapping = Record<string, { source: string; static_value?: string; transform?: string }>;

function parseCSV(text: string, delimiter = ","): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(delimiter).map((h) => h.replace(/^"|"$/g, "").trim());
  const rows = lines.slice(1).map((line) => {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === delimiter[0] && !inQuotes) { cells.push(current.trim()); current = ""; }
      else { current += char; }
    }
    cells.push(current.trim());
    return cells;
  });
  return { headers, rows };
}

export default function ImportWizard() {
  const navigate = useNavigate();
  const { currentStore, user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [delimiter, setDelimiter] = useState(",");
  const [csvData, setCsvData] = useState<{ headers: string[]; rows: string[][] }>({ headers: [], rows: [] });
  const [fileName, setFileName] = useState("");
  const [mappings, setMappings] = useState<FieldMapping>({});
  const [staticValues, setStaticValues] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{ success: number; errors: { row: number; error: string }[] } | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [entityType, setEntityType] = useState<ImportEntity>("products");

  const ACTIVE_FIELDS = entityType === "orders" ? ORDER_FIELDS : PRODUCT_FIELDS;

  const { data: templates = [] } = useImportTemplates();
  const createTemplate = useCreateImportTemplate();
  const deleteTemplate = useDeleteImportTemplate();

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text, delimiter);
      setCsvData(parsed);
      // Auto-map by name matching
      const autoMap: FieldMapping = {};
      parsed.headers.forEach((h) => {
        const normalized = h.toLowerCase().replace(/[^a-z0-9]/g, "_");
        const match = ACTIVE_FIELDS.find((f) =>
          f.key === normalized || f.label.toLowerCase().replace(/[^a-z0-9]/g, "_") === normalized
          || f.key.includes(normalized) || normalized.includes(f.key)
        );
        if (match) autoMap[match.key] = { source: h };
      });
      setMappings(autoMap);
      setStep(1);
    };
    reader.readAsText(file);
  }, [delimiter]);

  const loadTemplate = (template: any) => {
    setMappings(template.field_mappings || {});
    setStaticValues(template.static_values || {});
    toast.success(`Loaded template: ${template.name}`);
  };

  const handleImportOrders = async () => {
    if (!currentStore || !user) return;
    setImporting(true);
    const errors: { row: number; error: string }[] = [];
    let success = 0;

    for (let i = 0; i < csvData.rows.length; i++) {
      const row = csvData.rows[i];
      const order: any = { store_id: currentStore.id };

      for (const [fieldKey, mapping] of Object.entries(mappings)) {
        if (fieldKey === "customer_email") continue; // handled separately
        if (mapping.source === "__static__") {
          order[fieldKey] = staticValues[fieldKey] || mapping.static_value || "";
        } else {
          const colIndex = csvData.headers.indexOf(mapping.source);
          if (colIndex >= 0) order[fieldKey] = row[colIndex] || "";
        }
      }

      // Numeric coercion
      ["subtotal", "tax", "shipping", "discount", "total"].forEach(f => {
        if (order[f]) order[f] = parseFloat(order[f]) || 0;
      });
      if (order.tags && typeof order.tags === "string") order.tags = order.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
      if (!order.order_number) {
        errors.push({ row: i + 2, error: "Missing required field: order_number" });
        continue;
      }
      if (!order.status) order.status = "pending";
      if (!order.payment_status) order.payment_status = "unpaid";
      if (!order.fulfillment_status) order.fulfillment_status = "unfulfilled";

      // Lookup customer by email if provided
      const emailMapping = mappings["customer_email"];
      if (emailMapping) {
        let email = "";
        if (emailMapping.source === "__static__") email = staticValues["customer_email"] || "";
        else {
          const colIndex = csvData.headers.indexOf(emailMapping.source);
          email = colIndex >= 0 ? row[colIndex] || "" : "";
        }
        if (email) {
          const { data: custs } = await supabase
            .from("customers")
            .select("id")
            .eq("store_id", currentStore.id)
            .eq("email", email)
            .limit(1);
          if (custs && custs.length > 0) order.customer_id = custs[0].id;
        }
      }

      try {
        const { error } = await supabase.from("orders").insert(order);
        if (error) throw error;
        success++;
      } catch (err: any) {
        errors.push({ row: i + 2, error: err.message });
      }
    }

    await supabase.from("import_logs" as any).insert({
      store_id: currentStore.id, user_id: user.id, entity_type: "orders",
      file_name: fileName, total_rows: csvData.rows.length,
      success_count: success, error_count: errors.length,
      errors: errors as any, status: errors.length === 0 ? "completed" : "completed_with_errors",
      completed_at: new Date().toISOString(),
    });

    setResults({ success, errors });
    setImporting(false);
    setStep(3);
    toast.success(`Import complete: ${success} orders created, ${errors.length} errors`);
  };

  const handleImport = async () => {
    if (entityType === "orders") return handleImportOrders();
    if (!currentStore || !user) return;
    setImporting(true);
    const errors: { row: number; error: string }[] = [];
    let success = 0;

    for (let i = 0; i < csvData.rows.length; i++) {
      const row = csvData.rows[i];
      const product: any = { store_id: currentStore.id };

      // Apply mappings
      for (const [fieldKey, mapping] of Object.entries(mappings)) {
        if (mapping.source === "__static__") {
          product[fieldKey] = staticValues[fieldKey] || mapping.static_value || "";
        } else {
          const colIndex = csvData.headers.indexOf(mapping.source);
          if (colIndex >= 0) {
            let value = row[colIndex] || "";
            // Apply transforms
            if (mapping.transform === "lowercase") value = value.toLowerCase();
            if (mapping.transform === "uppercase") value = value.toUpperCase();
            if (mapping.transform === "slug") value = value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
            product[fieldKey] = value;
          }
        }
      }

      // Apply static values for unmapped fields
      for (const [key, val] of Object.entries(staticValues)) {
        if (!mappings[key] && val) product[key] = val;
      }

      // Type coercion
      if (product.price) product.price = parseFloat(product.price) || 0;
      if (product.compare_at_price) product.compare_at_price = parseFloat(product.compare_at_price) || null;
      if (product.cost_price) product.cost_price = parseFloat(product.cost_price) || null;
      if (product.promo_price) product.promo_price = parseFloat(product.promo_price) || null;
      if (product.reorder_quantity) product.reorder_quantity = parseInt(product.reorder_quantity) || 0;
      if (product.restock_quantity) product.restock_quantity = parseInt(product.restock_quantity) || 0;
      if (product.preorder_quantity) product.preorder_quantity = parseInt(product.preorder_quantity) || 0;
      ["is_active", "is_approved", "is_bought", "is_sold", "is_inventoried", "tax_free", "tax_inclusive", "track_inventory", "is_kit", "editable_bundle", "virtual_product"].forEach((f) => {
        if (product[f] !== undefined) product[f] = product[f] === "true" || product[f] === "1" || product[f] === "yes" || product[f] === true;
      });
      if (product.tags && typeof product.tags === "string") product.tags = product.tags.split(",").map((t: string) => t.trim()).filter(Boolean);

      // Validate required
      if (!product.title) {
        errors.push({ row: i + 2, error: "Missing required field: title/name" });
        continue;
      }

      // Auto-generate slug if not provided
      if (!product.slug) {
        product.slug = product.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      }

      try {
        const { error } = await supabase.from("products").insert(product as any);
        if (error) throw error;
        success++;
      } catch (err: any) {
        errors.push({ row: i + 2, error: err.message });
      }
    }

    // Log the import
    await supabase.from("import_logs" as any).insert({
      store_id: currentStore.id,
      user_id: user.id,
      entity_type: "products",
      file_name: fileName,
      total_rows: csvData.rows.length,
      success_count: success,
      error_count: errors.length,
      errors: errors as any,
      status: errors.length === 0 ? "completed" : "completed_with_errors",
      completed_at: new Date().toISOString(),
    });

    setResults({ success, errors });
    setImporting(false);
    setStep(3);
    toast.success(`Import complete: ${success} products created, ${errors.length} errors`);
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/products")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Import {entityType === "orders" ? "Orders" : "Products"}</h1>
              <p className="text-xs text-muted-foreground">Bulk import via CSV with field mapping</p>
            </div>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {["Upload", "Map Fields", "Review", "Results"].map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium ${
                i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {i < step ? <Check className="h-3 w-3" /> : i + 1}
              </div>
              <span className={`text-xs ${i === step ? "font-medium" : "text-muted-foreground"}`}>{s}</span>
              {i < 3 && <div className="w-8 h-px bg-border" />}
            </div>
          ))}
        </div>

        {/* STEP 0: Upload */}
        {step === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Import Type & Upload</CardTitle></CardHeader>
              <CardContent className="p-4 pt-2 pb-2">
                <div className="space-y-1 mb-3">
                  <Label className="text-xs">Entity Type</Label>
                  <Select value={entityType} onValueChange={(v) => setEntityType(v as ImportEntity)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="products" className="text-xs">Products</SelectItem>
                      <SelectItem value="orders" className="text-xs">Orders</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            <div />
            <Card>
              <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Upload CSV File</CardTitle></CardHeader>
              <CardContent className="p-4 pt-2 space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Delimiter</Label>
                  <Select value={delimiter} onValueChange={setDelimiter}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="," className="text-xs">Comma (,)</SelectItem>
                      <SelectItem value=";" className="text-xs">Semicolon (;)</SelectItem>
                      <SelectItem value="\t" className="text-xs">Tab</SelectItem>
                      <SelectItem value="|" className="text-xs">Pipe (|)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
                <Button variant="outline" className="w-full h-24 border-dashed text-xs gap-2" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-5 w-5" />
                  <div>
                    <p>Click to select CSV file</p>
                    <p className="text-muted-foreground">Supports .csv and .txt files</p>
                  </div>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Saved Templates</CardTitle></CardHeader>
              <CardContent className="p-4 pt-2 space-y-2">
                {templates.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No saved templates yet. Create one during import.</p>
                ) : (
                  templates.map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between bg-muted/50 rounded px-3 py-2">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-medium">{t.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-6 text-2xs" onClick={() => loadTemplate(t)}>Load</Button>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => deleteTemplate.mutate(t.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* STEP 1: Field Mapping */}
        {step === 1 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Found {csvData.headers.length} columns, {csvData.rows.length} rows in <span className="font-mono">{fileName}</span>
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setStep(0)}>
                  <ArrowLeft className="h-3 w-3 mr-1" /> Back
                </Button>
                <Button size="sm" className="h-7 text-xs" onClick={() => setStep(2)}>
                  Review <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-4 space-y-1">
                {Object.entries(
                  ACTIVE_FIELDS.reduce((acc, f) => {
                    (acc[f.group] = acc[f.group] || []).push(f);
                    return acc;
                  }, {} as Record<string, typeof ACTIVE_FIELDS>)
                ).map(([group, fields]) => (
                  <div key={group} className="mb-3">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{group}</h3>
                    <div className="space-y-1">
                      {fields.map((field) => (
                        <div key={field.key} className="grid grid-cols-4 gap-2 items-center py-0.5">
                          <span className="text-xs">{field.label}</span>
                          <Select
                            value={mappings[field.key]?.source || ""}
                            onValueChange={(v) => {
                              if (v === "__none__") {
                                const next = { ...mappings };
                                delete next[field.key];
                                setMappings(next);
                              } else {
                                setMappings((prev) => ({ ...prev, [field.key]: { ...prev[field.key], source: v } }));
                              }
                            }}
                          >
                            <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="— Skip —" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__" className="text-xs text-muted-foreground">— Skip —</SelectItem>
                              <SelectItem value="__static__" className="text-xs text-muted-foreground">Static Value</SelectItem>
                              {csvData.headers.map((h) => (
                                <SelectItem key={h} value={h} className="text-xs">{h}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {mappings[field.key]?.source === "__static__" && (
                            <Input
                              className="h-7 text-xs"
                              placeholder="Static value"
                              value={staticValues[field.key] || ""}
                              onChange={(e) => setStaticValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                            />
                          )}
                          <Select
                            value={mappings[field.key]?.transform || ""}
                            onValueChange={(v) => setMappings((prev) => ({ ...prev, [field.key]: { ...prev[field.key], transform: v || undefined } }))}
                          >
                            <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="No transform" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none" className="text-xs">No transform</SelectItem>
                              <SelectItem value="lowercase" className="text-xs">Lowercase</SelectItem>
                              <SelectItem value="uppercase" className="text-xs">UPPERCASE</SelectItem>
                              <SelectItem value="slug" className="text-xs">URL Slug</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Save template */}
            <Card>
              <CardContent className="p-4 flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Save as Template</Label>
                  <Input className="h-7 text-xs" value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Template name" />
                </div>
                <Button size="sm" className="h-7 text-xs gap-1" onClick={() => {
                  if (!templateName) return;
                  createTemplate.mutate({
                    name: templateName,
                    entity_type: "products",
                    field_mappings: mappings,
                    static_values: staticValues,
                  });
                  setTemplateName("");
                }}>
                  <Save className="h-3 w-3" /> Save
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* STEP 2: Review */}
        {step === 2 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {Object.keys(mappings).length} fields mapped · {csvData.rows.length} rows to import
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-3 w-3 mr-1" /> Back
                </Button>
                <Button size="sm" className="h-7 text-xs gap-1" onClick={handleImport} disabled={importing}>
                  {importing ? "Importing..." : "Start Import"} <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Preview (first 5 rows)</CardTitle></CardHeader>
              <CardContent className="p-0 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs h-8">#</TableHead>
                      {Object.keys(mappings).map((k: string) => (
                        <TableHead key={k} className="text-xs h-8">{ACTIVE_FIELDS.find((f) => f.key === k)?.label || k}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvData.rows.slice(0, 5).map((row, i) => (
                      <TableRow key={i} className="text-xs">
                        <TableCell className="py-1">{i + 1}</TableCell>
                        {Object.entries(mappings).map(([key, mapping]) => {
                          let value = "";
                          if (mapping.source === "__static__") {
                            value = staticValues[key] || mapping.static_value || "";
                          } else {
                            const colIndex = csvData.headers.indexOf(mapping.source);
                            value = colIndex >= 0 ? row[colIndex] || "" : "";
                          }
                          return <TableCell key={key} className="py-1 max-w-[150px] truncate">{value}</TableCell>;
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span>This will create {csvData.rows.length} new {entityType}. Existing records will NOT be updated — duplicates may be created.</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* STEP 3: Results */}
        {step === 3 && results && (
          <div className="space-y-3">
            <Card>
              <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Import Complete</CardTitle></CardHeader>
              <CardContent className="p-4 pt-2 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-md bg-muted p-3 text-center">
                    <p className="text-2xl font-bold">{csvData.rows.length}</p>
                    <p className="text-xs text-muted-foreground">Total Rows</p>
                  </div>
                  <div className="rounded-md bg-accent/20 p-3 text-center">
                    <p className="text-2xl font-bold text-accent-foreground">{results.success}</p>
                    <p className="text-xs text-muted-foreground">Imported</p>
                  </div>
                  <div className="rounded-md bg-destructive/10 p-3 text-center">
                    <p className="text-2xl font-bold text-destructive">{results.errors.length}</p>
                    <p className="text-xs text-muted-foreground">Errors</p>
                  </div>
                </div>

                {results.errors.length > 0 && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-medium">Errors</h4>
                    <div className="max-h-48 overflow-auto space-y-1">
                      {results.errors.map((err, i) => (
                        <div key={i} className="flex items-start gap-2 bg-destructive/5 rounded px-2 py-1">
                          <span className="text-xs font-mono text-muted-foreground">Row {err.row}</span>
                          <span className="text-xs text-destructive">{err.error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button size="sm" className="text-xs" onClick={() => navigate("/products")}>View Products</Button>
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => { setStep(0); setResults(null); setCsvData({ headers: [], rows: [] }); }}>Import More</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}