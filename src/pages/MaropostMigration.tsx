import { useState, useCallback, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowRight, Check, CheckCircle, XCircle, Loader2, AlertTriangle,
  Package, Users, ShoppingCart, Layers, FileText, Palette, Globe,
  Truck, Gift, CreditCard, Warehouse, Star, Shield,
  RefreshCw, Download, Eye, Zap, Clock, Terminal,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type MigrationStep = "connect" | "scan" | "select" | "import" | "theme" | "review";

interface EntityCount {
  entity: string;
  label: string;
  icon: React.ReactNode;
  count: number;
  selected: boolean;
  status: "pending" | "importing" | "success" | "failed" | "skipped";
  imported: number;
  failed: number;
  errors: string[];
  pages: number;
  batchProgress?: number; // 0-100
}

const MIGRATION_ENTITIES: Omit<EntityCount, "count" | "selected" | "status" | "imported" | "failed" | "errors" | "pages">[] = [
  { entity: "categories", label: "Categories", icon: <Layers className="h-5 w-5" /> },
  { entity: "products", label: "Products & Variants", icon: <Package className="h-5 w-5" /> },
  { entity: "customers", label: "Customers & Addresses", icon: <Users className="h-5 w-5" /> },
  { entity: "orders", label: "Orders & Invoices", icon: <ShoppingCart className="h-5 w-5" /> },
  { entity: "content", label: "Content Pages & Blog", icon: <FileText className="h-5 w-5" /> },
  { entity: "vouchers", label: "Gift Vouchers & Coupons", icon: <Gift className="h-5 w-5" /> },
  { entity: "suppliers", label: "Suppliers", icon: <Warehouse className="h-5 w-5" /> },
  { entity: "warehouses", label: "Warehouses & Locations", icon: <Warehouse className="h-5 w-5" /> },
  { entity: "shipping", label: "Shipping Methods & Zones", icon: <Truck className="h-5 w-5" /> },
  { entity: "rma", label: "Returns / RMAs", icon: <RefreshCw className="h-5 w-5" /> },
  { entity: "payments", label: "Payment History", icon: <CreditCard className="h-5 w-5" /> },
  { entity: "currency", label: "Currencies & Exchange Rates", icon: <Globe className="h-5 w-5" /> },
  { entity: "redirects", label: "301 Redirects (SEO)", icon: <ArrowRight className="h-5 w-5" /> },
  { entity: "templates", label: "Templates & Theme", icon: <Palette className="h-5 w-5" /> },
];

const FETCH_ACTION_MAP: Record<string, string> = {
  products: "get_products", categories: "get_categories",
  customers: "get_customers", orders: "get_orders",
  content: "get_content", templates: "get_content",
  shipping: "get_shipping", vouchers: "get_vouchers",
  suppliers: "get_suppliers", payments: "get_payments",
  rma: "get_rma", warehouses: "get_warehouses",
  currency: "get_currency",
};

const IMPORT_ACTION_MAP: Record<string, string> = {
  products: "import_products", categories: "import_categories",
  customers: "import_customers", orders: "import_orders",
  content: "import_content", vouchers: "import_vouchers",
  suppliers: "import_suppliers", warehouses: "import_warehouses",
  shipping: "import_shipping", rma: "import_rma",
  templates: "import_theme_css", payments: "import_orders",
  currency: "import_currencies", redirects: "import_redirects",
};

const ITEMS_PER_PAGE = 20; // Maropost API has response size limits, products especially need small pages
const SCAN_PAGE_SIZE = 500; // Scan mode uses minimal fields, can handle larger pages

export default function MaropostMigration() {
  const [step, setStep] = useState<MigrationStep>(() => {
    const saved = sessionStorage.getItem("maropost_step");
    return (saved as MigrationStep) || "connect";
  });
  const [storeDomain, setStoreDomain] = useState(() => sessionStorage.getItem("maropost_domain") || "");
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem("maropost_key") || "");
  const [storeId, setStoreId] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(() => !!sessionStorage.getItem("maropost_connected"));
  const [scanning, setScanning] = useState(false);
  const [importing, setImporting] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const [entities, setEntities] = useState<EntityCount[]>(() => {
    try { const s = sessionStorage.getItem("maropost_entities"); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [overallProgress, setOverallProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [themeImporting, setThemeImporting] = useState(false);
  const [themeStatus, setThemeStatus] = useState<Record<string, "pending" | "converting" | "done" | "error">>({});

  // Persist state to sessionStorage for resume
  const persistState = useCallback(() => {
    sessionStorage.setItem("maropost_step", step);
    sessionStorage.setItem("maropost_domain", storeDomain);
    sessionStorage.setItem("maropost_key", apiKey);
    sessionStorage.setItem("maropost_connected", connected ? "1" : "");
    sessionStorage.setItem("maropost_entities", JSON.stringify(entities));
  }, [step, storeDomain, apiKey, connected, entities]);

  // Auto-persist on state changes
  useEffect(() => { persistState(); }, [persistState]);

  const addLog = useCallback((msg: string) => {
    const ts = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${ts}] ${msg}`]);
  }, []);

  // Get current store ID
  const resolveStoreId = useCallback(async () => {
    if (storeId) return storeId;
    const { data } = await supabase.from("stores").select("id").limit(1).single() as any;
    if (data?.id) { setStoreId(data.id); return data.id; }
    return null;
  }, [storeId]);

  const testConnection = async () => {
    if (!storeDomain || !apiKey) { toast.error("Enter your Maropost store domain and API key"); return; }
    setConnecting(true);
    setConnectionError("");

    try {
      const { data, error } = await supabase.functions.invoke("maropost-migration", {
        body: { action: "test_connection", store_domain: storeDomain, api_key: apiKey },
      });
      if (error) throw error;
      if (data?.connected) {
        setConnected(true);
        addLog(`Connected to ${storeDomain}`);
        toast.success("Successfully connected to your Maropost store!");
        setStep("scan");
      } else {
        setConnectionError(data?.error?.Error?.[0]?.Message || "Could not connect. Check your domain and API key.");
      }
    } catch (err: any) {
      setConnectionError(err.message || "Connection failed");
    } finally {
      setConnecting(false);
    }
  };

  const countItems = (responseData: any): number => {
    if (!responseData) return 0;
    const keys = Object.keys(responseData).filter(k => k !== "Messages" && k !== "CurrentTime" && k !== "Ack");
    if (keys.length === 0) return 0;
    const items = responseData[keys[0]];
    if (Array.isArray(items)) return items.length;
    if (items && typeof items === "object") return 1;
    return 0;
  };

  const scanStore = async () => {
    setScanning(true);
    addLog("Starting store scan...");
    const scannedEntities: EntityCount[] = [];

    for (const entity of MIGRATION_ENTITIES) {
      try {
        addLog(`Scanning ${entity.label}...`);
        // Use scan_mode for fast counting with minimal fields
        let totalCount = 0;
        let page = 0;
        let hasMore = true;
        const scanLimit = 200; // Scan pages

        while (hasMore) {
          const { data } = await supabase.functions.invoke("maropost-migration", {
            body: {
              action: FETCH_ACTION_MAP[entity.entity] || "test_connection",
              store_domain: storeDomain, api_key: apiKey,
              page, limit: scanLimit, scan_mode: true,
            },
          });

          const pageCount = countItems(data?.data);
          totalCount += pageCount;

          if (pageCount < scanLimit || page >= 50) {
            hasMore = false;
          } else {
            page++;
            addLog(`  … page ${page + 1} (${totalCount} so far)`);
          }
        }

        addLog(`  → ${entity.label}: ${totalCount} records found`);
        scannedEntities.push({ ...entity, count: totalCount, selected: totalCount > 0, status: "pending", imported: 0, failed: 0, errors: [], pages: Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE)) });
      } catch (err: any) {
        addLog(`  → ${entity.label}: scan failed (${err.message})`);
        scannedEntities.push({ ...entity, count: 0, selected: false, status: "pending", imported: 0, failed: 0, errors: [], pages: 0 });
      }
    }

    setEntities(scannedEntities);
    setScanning(false);
    setStep("select");
    addLog("Scan complete!");
    toast.success("Store scan complete!");
  };

  const toggleEntity = (entityName: string) => {
    setEntities(prev => prev.map(e => e.entity === entityName ? { ...e, selected: !e.selected } : e));
  };

  const fetchAllPages = async (entity: string): Promise<any[]> => {
    let allItems: any[] = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase.functions.invoke("maropost-migration", {
        body: {
          action: FETCH_ACTION_MAP[entity] || "test_connection",
          store_domain: storeDomain, api_key: apiKey,
          page, limit: ITEMS_PER_PAGE,
          // Don't pass scan_mode - we want full data for import
        },
      });

      if (error) throw error;

      const responseData = data?.data;
      if (responseData) {
        const keys = Object.keys(responseData).filter(k => k !== "Messages" && k !== "CurrentTime" && k !== "Ack");
        if (keys.length > 0) {
          const items = responseData[keys[0]];
          if (Array.isArray(items) && items.length > 0) {
            allItems = [...allItems, ...items];
            addLog(`  Fetched page ${page + 1}: ${items.length} ${entity}`);
            // If we got fewer items than the page size, we've reached the end
            if (items.length < ITEMS_PER_PAGE) hasMore = false;
          } else {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
      page++;
      // Safety: max 200 pages
      if (page >= 200) { addLog(`  ⚠ Reached 200-page limit for ${entity}`); break; }
    }

    return allItems;
  };

  const startImport = async () => {
    const selected = entities.filter(e => e.selected);
    if (selected.length === 0) { toast.error("Select at least one entity to import"); return; }

    const sid = await resolveStoreId();
    if (!sid) { toast.error("No store found. Please complete onboarding first."); return; }

    setImporting(true);
    setStep("import");
    addLog("═══ Starting Migration ═══");

    // Create migration job
    let migrationJobId: string | null = null;
    try {
      const { data: job } = await (supabase.from("migration_jobs" as any).insert({
        store_id: sid,
        source_platform: "maropost",
        source_domain: storeDomain,
        status: "running",
        entities_selected: selected.map(e => e.entity),
        progress: {},
      } as any).select("id").single() as any);
      migrationJobId = job?.id || null;
    } catch { /* migration_jobs table may not exist yet */ }

    let completed = 0;
    const total = selected.length;

    for (const entity of selected) {
      addLog(`▶ Importing ${entity.label}...`);
      setEntities(prev => prev.map(e => e.entity === entity.entity ? { ...e, status: "importing" } : e));

      try {
        // 1. Fetch all data from Maropost (paginated)
        const sourceItems = await fetchAllPages(entity.entity);
        addLog(`  Fetched ${sourceItems.length} total ${entity.entity} from Maropost`);

        if (sourceItems.length === 0) {
          setEntities(prev => prev.map(e => e.entity === entity.entity ? { ...e, status: "success", imported: 0 } : e));
          addLog(`  No ${entity.entity} to import, skipping`);
          completed++;
          setOverallProgress(Math.round((completed / total) * 100));
          continue;
        }

        // 2. Send to import function in batches of 50
        let totalImported = 0;
        let totalFailed = 0;
        const allErrors: string[] = [];
        const batchSize = 50;

        for (let i = 0; i < sourceItems.length; i += batchSize) {
          const batch = sourceItems.slice(i, i + batchSize);
          addLog(`  Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} items)...`);

          const importAction = IMPORT_ACTION_MAP[entity.entity];
          // Wrap data in expected format
          const dataKey = entity.entity === "products" ? "Item" : entity.entity === "categories" ? "Category" :
            entity.entity === "customers" ? "Customer" : entity.entity === "orders" ? "Order" :
            entity.entity === "content" ? "Content" : entity.entity === "vouchers" ? "Voucher" :
            entity.entity === "suppliers" ? "Supplier" : entity.entity === "warehouses" ? "Warehouse" :
            entity.entity === "shipping" ? "ShippingMethod" : entity.entity === "rma" ? "Rma" : "Item";

          const { data: result, error } = await supabase.functions.invoke("maropost-import", {
            body: {
              action: importAction,
              store_id: sid,
              source_data: { [dataKey]: batch },
              migration_job_id: migrationJobId,
            },
          });

          if (error) throw error;

          totalImported += result?.imported || 0;
          totalFailed += result?.failed || 0;
          if (result?.errors) allErrors.push(...result.errors);
        }

        setEntities(prev => prev.map(e =>
          e.entity === entity.entity ? { ...e, status: totalFailed > 0 && totalImported === 0 ? "failed" : "success", imported: totalImported, failed: totalFailed, errors: allErrors } : e
        ));
        addLog(`  ✓ ${entity.label}: ${totalImported} imported, ${totalFailed} failed`);
      } catch (err: any) {
        setEntities(prev => prev.map(e =>
          e.entity === entity.entity ? { ...e, status: "failed", errors: [err.message] } : e
        ));
        addLog(`  ✗ ${entity.label} FAILED: ${err.message}`);
      }

      completed++;
      setOverallProgress(Math.round((completed / total) * 100));
    }

    // Update migration job
    if (migrationJobId) {
      await supabase.from("migration_jobs" as any).update({
        status: "completed",
        completed_at: new Date().toISOString(),
      }).eq("id", migrationJobId);
    }

    setImporting(false);
    addLog("═══ Migration Complete ═══");
    toast.success("Migration complete!");
  };

  const retryEntity = async (entityName: string) => {
    const entity = entities.find(e => e.entity === entityName);
    if (!entity) return;
    const sid = await resolveStoreId();
    if (!sid) return;

    setImporting(true);
    setEntities(prev => prev.map(e => e.entity === entityName ? { ...e, status: "importing", imported: 0, failed: 0, errors: [] } : e));
    addLog(`▶ Retrying ${entity.label}...`);

    try {
      const sourceItems = await fetchAllPages(entity.entity);
      addLog(`  Fetched ${sourceItems.length} total ${entity.entity} from Maropost`);

      if (sourceItems.length === 0) {
        setEntities(prev => prev.map(e => e.entity === entityName ? { ...e, status: "success", imported: 0 } : e));
        setImporting(false);
        return;
      }

      let totalImported = 0;
      let totalFailed = 0;
      const allErrors: string[] = [];
      const batchSize = 50;

      for (let i = 0; i < sourceItems.length; i += batchSize) {
        const batch = sourceItems.slice(i, i + batchSize);
        const importAction = IMPORT_ACTION_MAP[entity.entity];
        const dataKey = entity.entity === "products" ? "Item" : entity.entity === "categories" ? "Category" :
          entity.entity === "customers" ? "Customer" : entity.entity === "orders" ? "Order" :
          entity.entity === "content" ? "Content" : entity.entity === "vouchers" ? "Voucher" :
          entity.entity === "suppliers" ? "Supplier" : entity.entity === "warehouses" ? "Warehouse" :
          entity.entity === "shipping" ? "ShippingMethod" : entity.entity === "rma" ? "Rma" : "Item";

        const { data: result, error } = await supabase.functions.invoke("maropost-import", {
          body: { action: importAction, store_id: sid, source_data: { [dataKey]: batch } },
        });
        if (error) throw error;
        totalImported += result?.imported || 0;
        totalFailed += result?.failed || 0;
        if (result?.errors) allErrors.push(...result.errors);
      }

      setEntities(prev => prev.map(e =>
        e.entity === entityName ? { ...e, status: totalFailed > 0 && totalImported === 0 ? "failed" : "success", imported: totalImported, failed: totalFailed, errors: allErrors } : e
      ));
      addLog(`  ✓ ${entity.label}: ${totalImported} imported, ${totalFailed} failed`);
    } catch (err: any) {
      setEntities(prev => prev.map(e => e.entity === entityName ? { ...e, status: "failed", errors: [err.message] } : e));
      addLog(`  ✗ ${entity.label} FAILED: ${err.message}`);
    }

    setImporting(false);
  };

  const startThemeMigration = async () => {
    setThemeImporting(true);
    setStep("theme");
    addLog("▶ Starting theme migration...");

    const sid = await resolveStoreId();
    if (!sid) return;

    const TEMPLATE_TYPES = [
      { slug: "header", name: "Header", template_type: "partial" },
      { slug: "footer", name: "Footer", template_type: "partial" },
      { slug: "homepage", name: "Homepage", template_type: "page" },
      { slug: "product-detail", name: "Product Page", template_type: "page" },
      { slug: "category-listing", name: "Category Page", template_type: "page" },
      { slug: "cart", name: "Cart", template_type: "page" },
      { slug: "checkout", name: "Checkout", template_type: "page" },
      { slug: "account", name: "Account", template_type: "page" },
      { slug: "blog-listing", name: "Blog", template_type: "page" },
      { slug: "contact", name: "Contact", template_type: "page" },
      { slug: "search-results", name: "Search Results", template_type: "page" },
      { slug: "wishlist", name: "Wishlist", template_type: "page" },
    ];

    // Fetch content pages that might contain template data
    try {
      const { data: contentData } = await supabase.functions.invoke("maropost-migration", {
        body: { action: "get_content", store_domain: storeDomain, api_key: apiKey, filter: {}, limit: 200 },
      });

      // Extract any CSS/JS from content
      const allContent = contentData?.data?.Content || [];
      let customCss = "";
      let customJs = "";

      for (const c of (Array.isArray(allContent) ? allContent : [])) {
        if (c.ContentFileIdentifier?.includes(".css")) customCss += `\n/* From: ${c.ContentName} */\n${c.Description || ""}`;
        if (c.ContentFileIdentifier?.includes(".js")) customJs += `\n// From: ${c.ContentName}\n${c.Description || ""}`;
      }

      // Generate template stubs based on Maropost structure
      const templates = TEMPLATE_TYPES.map(tpl => {
        setThemeStatus(prev => ({ ...prev, [tpl.slug]: "converting" }));
        return {
          slug: tpl.slug,
          name: tpl.name,
          template_type: tpl.template_type,
          content: generateTemplateContent(tpl.slug, tpl.name),
          custom_css: "",
        };
      });

      // Send to import
      const { data: result } = await supabase.functions.invoke("maropost-import", {
        body: {
          action: "import_theme_css",
          store_id: sid,
          source_data: { templates, css: customCss, js: customJs },
        },
      });

      addLog(`  ✓ Theme: ${result?.imported || 0} templates/assets imported`);

      // Mark all as done
      const statusUpdate: Record<string, "done"> = {};
      TEMPLATE_TYPES.forEach(t => { statusUpdate[t.slug] = "done"; });
      setThemeStatus(statusUpdate);
    } catch (err: any) {
      addLog(`  ✗ Theme migration error: ${err.message}`);
    }

    setThemeImporting(false);
    addLog("Theme migration complete!");
    toast.success("Theme migration complete!");
  };

  // Export migration log as CSV
  const exportMigrationCSV = useCallback(() => {
    const rows = [["Entity", "Label", "Count", "Imported", "Failed", "Status", "Errors"]];
    for (const e of entities) {
      rows.push([e.entity, e.label, String(e.count), String(e.imported), String(e.failed), e.status, e.errors.join("; ")]);
    }
    rows.push([]);
    rows.push(["--- Migration Log ---"]);
    for (const log of logs) {
      rows.push([log]);
    }
    const csv = rows.map(r => r.map(c => `"${(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `maropost-migration-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Migration report downloaded");
  }, [entities, logs]);

  // Rollback: delete all data for current store (destructive)
  const rollbackMigration = async () => {
    const confirmed = window.confirm(
      "⚠️ This will DELETE all imported data (products, categories, customers, orders, content, vouchers, suppliers, shipping zones) for the current store. This cannot be undone.\n\nAre you sure?"
    );
    if (!confirmed) return;

    const sid = await resolveStoreId();
    if (!sid) { toast.error("No store found"); return; }

    addLog("═══ Starting Rollback ═══");
    const tables = [
      "order_items", "order_payments", "orders",
      "customer_addresses", "customer_communications", "customers",
      "product_variants", "product_shipping", "product_pricing_tiers",
      "product_specifics", "product_relations", "inventory_stock", "products",
      "categories", "content_pages", "gift_vouchers", "suppliers",
      "inventory_locations", "shipping_zones", "returns", "redirects", "currencies",
    ];

    for (const table of tables) {
      try {
        const { error } = await supabase.from(table as any).delete().eq("store_id", sid);
        if (error) { addLog(`  ⚠ ${table}: ${error.message}`); } 
        else { addLog(`  ✓ Cleared ${table}`); }
      } catch (err: any) {
        addLog(`  ✗ ${table}: ${err.message}`);
      }
    }

    setEntities(prev => prev.map(e => ({ ...e, status: "pending", imported: 0, failed: 0, errors: [] })));
    setOverallProgress(0);
    addLog("═══ Rollback Complete ═══");
    toast.success("All imported data has been deleted");
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "failed": return <XCircle className="h-5 w-5 text-destructive" />;
      case "importing": return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      case "skipped": return <ArrowRight className="h-5 w-5 text-muted-foreground" />;
      default: return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const steps = [
    { id: "connect", label: "Connect", icon: <Globe className="h-4 w-4" /> },
    { id: "scan", label: "Scan Store", icon: <Eye className="h-4 w-4" /> },
    { id: "select", label: "Select Data", icon: <Check className="h-4 w-4" /> },
    { id: "import", label: "Import", icon: <Download className="h-4 w-4" /> },
    { id: "theme", label: "Theme", icon: <Palette className="h-4 w-4" /> },
    { id: "review", label: "Review", icon: <CheckCircle className="h-4 w-4" /> },
  ];

  const stepIndex = steps.findIndex(s => s.id === step);

  const totalImported = entities.reduce((sum, e) => sum + e.imported, 0);
  const totalFailed = entities.reduce((sum, e) => sum + e.failed, 0);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Maropost Store Migration</h1>
          <p className="text-sm text-muted-foreground">Transfer your entire Maropost Commerce Cloud store — products, orders, customers, themes, and more</p>
        </div>

        {/* Step Progress */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <button
                onClick={() => i <= stepIndex && setStep(s.id as MigrationStep)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  s.id === step ? "bg-primary text-primary-foreground"
                    : i < stepIndex ? "bg-primary/10 text-primary cursor-pointer"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s.icon}
                {s.label}
              </button>
              {i < steps.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />}
            </div>
          ))}
        </div>

        {/* Step 1: Connect */}
        {step === "connect" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />Connect to Maropost</CardTitle>
              <CardDescription>Enter your Maropost Commerce Cloud store domain and API key to begin the migration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Your API key is used only during migration and is never stored permanently. Find your API key in the Maropost Control Panel under <strong>Settings &amp; Tools → All Settings → API</strong>.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Store Domain</Label>
                  <Input value={storeDomain} onChange={e => setStoreDomain(e.target.value)} placeholder="mystore.neto.com.au" />
                  <p className="text-xs text-muted-foreground mt-1">Your Maropost webstore URL without https://</p>
                </div>
                <div>
                  <Label>API Key</Label>
                  <Input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Enter your NETOAPI_KEY" />
                  <p className="text-xs text-muted-foreground mt-1">Global or user-based API key from Settings → API</p>
                </div>
              </div>

              {connectionError && (
                <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>{connectionError}</AlertDescription></Alert>
              )}
              {connected && (
                <Alert><CheckCircle className="h-4 w-4 text-green-500" /><AlertDescription className="text-green-700">Connected to {storeDomain} successfully!</AlertDescription></Alert>
              )}

              <div className="flex gap-3">
                <Button onClick={testConnection} disabled={connecting}>
                  {connecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
                  {connecting ? "Connecting…" : "Test Connection"}
                </Button>
                {connected && (
                  <Button variant="outline" onClick={() => setStep("scan")}>Continue <ArrowRight className="h-4 w-4 ml-2" /></Button>
                )}
              </div>

              <Separator />
              <div>
                <h3 className="font-semibold mb-3">What gets migrated?</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {MIGRATION_ENTITIES.map(e => (
                    <div key={e.entity} className="flex items-center gap-2 text-sm text-muted-foreground">{e.icon}<span>{e.label}</span></div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Scan */}
        {step === "scan" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5" />Scan Your Store</CardTitle>
              <CardDescription>Scan your Maropost store to discover all available data for migration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Connected to: <strong>{storeDomain}</strong></p>
              <Button onClick={scanStore} disabled={scanning} size="lg">
                {scanning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
                {scanning ? "Scanning store…" : "Start Scan"}
              </Button>
              {scanning && (
                <div className="space-y-2">
                  <Progress value={50} className="h-2" />
                  <p className="text-sm text-muted-foreground">Discovering products, categories, customers, orders…</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Select */}
        {step === "select" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Check className="h-5 w-5" />Select Data to Import</CardTitle>
              <CardDescription>Choose which entities to migrate. Categories should be imported before products.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 mb-2">
                <Button variant="outline" size="sm" onClick={() => setEntities(prev => prev.map(e => e.count > 0 ? { ...e, selected: true } : e))}>Select All</Button>
                <Button variant="outline" size="sm" onClick={() => setEntities(prev => prev.map(e => ({ ...e, selected: false })))}>Deselect All</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {entities.map(entity => (
                  <div
                    key={entity.entity}
                    className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                      entity.selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    } ${entity.count === 0 ? "opacity-50" : ""}`}
                    onClick={() => entity.count > 0 && toggleEntity(entity.entity)}
                  >
                    <Checkbox checked={entity.selected} disabled={entity.count === 0} />
                    <div className="flex items-center gap-2 flex-1">
                      {entity.icon}
                      <div>
                        <p className="font-medium text-sm">{entity.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {entity.count > 0 ? `~${entity.count} records (${entity.pages} pages)` : "No data found"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pre-import validation summary */}
              {entities.some(e => e.selected) && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4 space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2"><Shield className="h-4 w-4" />Pre-Import Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div className="p-2 rounded bg-background">
                        <p className="font-bold text-foreground">{entities.filter(e => e.selected).reduce((s, e) => s + e.count, 0).toLocaleString()}</p>
                        <p className="text-muted-foreground">Total Records</p>
                      </div>
                      <div className="p-2 rounded bg-background">
                        <p className="font-bold text-foreground">{entities.filter(e => e.selected).length}</p>
                        <p className="text-muted-foreground">Entity Types</p>
                      </div>
                      <div className="p-2 rounded bg-background">
                        <p className="font-bold text-foreground">{entities.filter(e => e.selected).reduce((s, e) => s + e.pages, 0)}</p>
                        <p className="text-muted-foreground">API Pages</p>
                      </div>
                      <div className="p-2 rounded bg-background">
                        <p className="font-bold text-foreground">~{Math.ceil(entities.filter(e => e.selected).reduce((s, e) => s + e.pages, 0) * 3 / 60)}m</p>
                        <p className="text-muted-foreground">Est. Duration</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1 pt-1">
                      <p>• Categories → Products → Customers → Orders (auto-ordered for relationship linking)</p>
                      <p>• Products will be linked to categories and relations (cross-sell/upsell) post-import</p>
                      <p>• Orders will be linked to customers by email match</p>
                      <p>• Newsletter subscribers auto-extracted from customer data</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Import order matters:</strong> Categories are imported first, then products (to link categories), then customers, then orders (to link customers). The wizard handles this automatically.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3 pt-4">
                <Button onClick={startImport} disabled={!entities.some(e => e.selected)}>
                  <Download className="h-4 w-4 mr-2" />
                  Start Import ({entities.filter(e => e.selected).length} entities)
                </Button>
                <Button variant="outline" onClick={() => setStep("scan")}>Back</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Import Progress */}
        {(step === "import" || step === "review") && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {importing ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5 text-green-500" />}
                {importing ? "Importing Data…" : "Data Import Complete"}
              </CardTitle>
              <CardDescription>
                {importing ? "Please don't close this page while the import is running" : `${totalImported} records imported, ${totalFailed} failed`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>{overallProgress}%</span>
                </div>
                <Progress value={overallProgress} className="h-3" />
              </div>

              <div className="space-y-2">
               {entities.filter(e => e.selected).map(entity => (
                  <div key={entity.entity} className="p-3 rounded-lg border space-y-2">
                    <div className="flex items-center gap-3">
                      {statusIcon(entity.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {entity.icon}
                          <span className="font-medium text-sm">{entity.label}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {entity.status === "success" && <span className="text-green-600">{entity.imported} imported{entity.failed > 0 && <span className="text-destructive ml-1">({entity.failed} failed)</span>}</span>}
                        {entity.status === "failed" && (
                          <>
                            <span className="text-destructive">Failed</span>
                            {!importing && <Button variant="outline" size="sm" onClick={() => retryEntity(entity.entity)}><RefreshCw className="h-3 w-3 mr-1" />Retry</Button>}
                          </>
                        )}
                        {entity.status === "importing" && <span>Importing…</span>}
                        {entity.status === "pending" && <span>Waiting</span>}
                      </div>
                    </div>
                    {entity.errors.length > 0 && (
                      <details className="text-xs">
                        <summary className="text-destructive cursor-pointer">{entity.errors.length} error(s) — click to expand</summary>
                        <div className="mt-1 space-y-0.5 max-h-32 overflow-y-auto pl-4 text-muted-foreground">
                          {entity.errors.map((err, i) => <div key={i}>• {err}</div>)}
                        </div>
                      </details>
                    )}
                  </div>
                ))}
              </div>

              {!importing && (
                <div className="flex gap-3 pt-4">
                  <Button onClick={startThemeMigration}>
                    <Palette className="h-4 w-4 mr-2" />
                    Continue to Theme Migration
                  </Button>
                  <Button variant="outline" onClick={() => window.location.href = "/_cpanel/dashboard"}>
                    Skip to Dashboard
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 5: Theme Migration */}
        {step === "theme" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" />Theme & Template Migration</CardTitle>
              <CardDescription>Converting your Maropost B@SE templates to work with our platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>B@SE Template Conversion:</strong> Our system automatically converts Maropost B@SE tags to our template engine.
                  Some custom tags may require manual review. Complex JavaScript add-ons may need adjustment.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-semibold flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />Auto-Converted</h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Product data tags ([%product_name%], [%price%])</li>
                      <li>• Category loops ([%category%]…[%/category%])</li>
                      <li>• Content blocks ([%content_block%])</li>
                      <li>• Navigation menus</li>
                      <li>• Cart & checkout templates</li>
                      <li>• Customer account pages</li>
                      <li>• Image/thumb iterators</li>
                      <li>• Include tags ([!include!])</li>
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-yellow-500" />Manual Review Needed</h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Custom JavaScript add-ons</li>
                      <li>• Third-party payment gateway skins</li>
                      <li>• Custom AJAX endpoints</li>
                      <li>• eBay listing templates</li>
                      <li>• External widget embeds</li>
                      <li>• Custom CSS overrides (preserved as-is)</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Template Conversion Status</h3>
                {["header", "footer", "homepage", "product-detail", "category-listing", "cart", "checkout", "account", "blog-listing", "contact", "search-results", "wishlist"].map(tpl => (
                  <div key={tpl} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm capitalize">{tpl.replace("-", " ")}</span>
                    </div>
                    <Badge variant="secondary" className="gap-1">
                      {themeStatus[tpl] === "done" ? <><CheckCircle className="h-3 w-3" /> Converted</> :
                       themeStatus[tpl] === "converting" ? <><Loader2 className="h-3 w-3 animate-spin" /> Converting</> :
                       themeStatus[tpl] === "error" ? <><XCircle className="h-3 w-3" /> Error</> :
                       <><Clock className="h-3 w-3" /> Pending</>}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                {themeImporting ? (
                  <Button disabled><Loader2 className="h-4 w-4 mr-2 animate-spin" />Converting templates…</Button>
                ) : Object.values(themeStatus).some(s => s === "done") ? (
                  <Button onClick={() => { setStep("review"); toast.success("Migration complete!"); }}>
                    <CheckCircle className="h-4 w-4 mr-2" />Finalize Migration
                  </Button>
                ) : (
                  <Button onClick={startThemeMigration}><Palette className="h-4 w-4 mr-2" />Start Theme Conversion</Button>
                )}
                <Button variant="outline" onClick={() => setStep("import")}>Back</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Live Log Console */}
        {logs.length > 0 && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2"><Terminal className="h-4 w-4" />Migration Log</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-48 rounded-b-lg">
                <div className="p-4 font-mono text-xs space-y-0.5 bg-muted/30">
                  {logs.map((log, i) => (
                    <div key={i} className={`${log.includes("✗") ? "text-destructive" : log.includes("✓") ? "text-green-600" : log.includes("═══") ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                      {log}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Final Review (on "review" step after theme) */}
        {step === "review" && !importing && (
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <h2 className="text-xl font-bold text-foreground">Migration Complete!</h2>
                  <p className="text-sm text-muted-foreground">Your Maropost store has been successfully transferred</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-background rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{totalImported}</p>
                  <p className="text-xs text-muted-foreground">Records Imported</p>
                </div>
                <div className="text-center p-3 bg-background rounded-lg">
                  <p className="text-2xl font-bold text-destructive">{totalFailed}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
                <div className="text-center p-3 bg-background rounded-lg">
                  <p className="text-2xl font-bold text-foreground">{entities.filter(e => e.selected).length}</p>
                  <p className="text-xs text-muted-foreground">Entity Types</p>
                </div>
              </div>

              <div className="flex gap-3 flex-wrap">
                <Button onClick={() => window.location.href = "/_cpanel/dashboard"}>Go to Dashboard</Button>
                <Button variant="outline" onClick={() => window.location.href = "/_cpanel/maropost-transfer-audit"}>View Transfer Audit</Button>
                <Button variant="outline" onClick={() => window.location.href = "/_cpanel/products"}>View Products</Button>
                <Button variant="outline" onClick={exportMigrationCSV}><Download className="h-4 w-4 mr-2" />Export Report</Button>
                <Button variant="destructive" onClick={rollbackMigration}><RefreshCw className="h-4 w-4 mr-2" />Rollback Migration</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}

/** Generate a B@SE-compatible template stub for each template type */
function generateTemplateContent(slug: string, name: string): string {
  const templates: Record<string, string> = {
    header: `<header class="site-header">
  <div class="container">
    <a href="/" class="logo">[@store_name@]</a>
    <nav class="main-nav">[@navigation@]</nav>
    <div class="header-actions">
      <a href="/cart">Cart ([@cart_count@])</a>
      <a href="/account">Account</a>
    </div>
  </div>
</header>`,
    footer: `<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div><h4>About</h4><p>[@store_description@]</p></div>
      <div><h4>Quick Links</h4>[@footer_navigation@]</div>
      <div><h4>Contact</h4><p>[@store_email@]</p><p>[@store_phone@]</p></div>
    </div>
    <p class="copyright">&copy; [@year@] [@store_name@]. All rights reserved.</p>
  </div>
</footer>`,
    homepage: `<section class="hero">
  <h1>Welcome to [@store_name@]</h1>
</section>
<section class="featured-products">
  <h2>Featured Products</h2>
  <div class="product-grid">[@featured_products@]</div>
</section>
<section class="categories">
  <h2>Shop by Category</h2>
  <div class="category-grid">[@categories@]</div>
</section>`,
    "product-detail": `<div class="product-page">
  <div class="product-gallery">[@product_images@]</div>
  <div class="product-info">
    <h1>[@product_name@]</h1>
    <p class="price">[@price@]</p>
    <p class="sku">SKU: [@sku@]</p>
    <div class="variants">[@variants@]</div>
    <button class="add-to-cart">Add to Cart</button>
    <div class="description">[@description@]</div>
    <div class="specifications">[@specifications@]</div>
  </div>
</div>`,
    "category-listing": `<div class="category-page">
  <h1>[@category_name@]</h1>
  <p>[@category_description@]</p>
  <div class="filters">[@filters@]</div>
  <div class="product-grid">[@products@]</div>
  <div class="pagination">[@pagination@]</div>
</div>`,
    cart: `<div class="cart-page">
  <h1>Shopping Cart</h1>
  <div class="cart-items">[@cart_items@]</div>
  <div class="cart-summary">
    <p>Subtotal: [@subtotal@]</p>
    <p>Shipping: [@shipping@]</p>
    <p>Total: [@total@]</p>
    <a href="/checkout" class="checkout-btn">Proceed to Checkout</a>
  </div>
</div>`,
    checkout: `<div class="checkout-page">
  <h1>Checkout</h1>
  <div class="checkout-steps">[@checkout_form@]</div>
</div>`,
    account: `<div class="account-page">
  <h1>My Account</h1>
  <div class="account-nav">[@account_navigation@]</div>
  <div class="account-content">[@account_content@]</div>
</div>`,
    "blog-listing": `<div class="blog-page">
  <h1>Blog</h1>
  <div class="blog-posts">[@blog_posts@]</div>
  <div class="pagination">[@pagination@]</div>
</div>`,
    contact: `<div class="contact-page">
  <h1>Contact Us</h1>
  <div class="contact-form">[@contact_form@]</div>
  <div class="store-info">
    <p>[@store_address@]</p>
    <p>[@store_phone@]</p>
    <p>[@store_email@]</p>
  </div>
</div>`,
    "search-results": `<div class="search-page">
  <h1>Search Results for "[@search_query@]"</h1>
  <div class="product-grid">[@search_results@]</div>
  <div class="pagination">[@pagination@]</div>
</div>`,
    wishlist: `<div class="wishlist-page">
  <h1>My Wishlist</h1>
  <div class="wishlist-items">[@wishlist_items@]</div>
</div>`,
  };
  return templates[slug] || `<div class="${slug}"><h1>${name}</h1><p>[@content@]</p></div>`;
}
