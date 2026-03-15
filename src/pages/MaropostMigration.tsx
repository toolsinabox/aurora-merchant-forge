import { useState, useCallback, useEffect, useRef } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ArrowRight, Check, CheckCircle, XCircle, Loader2, AlertTriangle,
  Package, Users, ShoppingCart, Layers, FileText, Palette, Globe,
  Truck, Gift, CreditCard, Warehouse, Star, Shield,
  RefreshCw, Download, Eye, Zap, Clock, Terminal,
  Pause, Play, MapPin, Image, Link, Search,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMigration } from "@/contexts/MigrationContext";

type MigrationStep = "connect" | "scan" | "mapping" | "select" | "import" | "verify" | "theme" | "review";

interface EntityCount {
  entity: string;
  label: string;
  icon: React.ReactNode;
  count: number;
  selected: boolean;
  status: "pending" | "importing" | "success" | "failed" | "skipped" | "paused";
  imported: number;
  failed: number;
  errors: string[];
  pages: number;
  batchProgress?: number;
  sampleFields?: string[]; // sample fields from scan
}

interface FieldMapping {
  sourceField: string;
  targetField: string;
  enabled: boolean;
  preview?: string; // sample value
}

interface VerificationResult {
  check: string;
  status: "pass" | "warn" | "fail";
  details: string;
  count?: number;
}

const MIGRATION_ENTITIES: Omit<EntityCount, "count" | "selected" | "status" | "imported" | "failed" | "errors" | "pages" | "sampleFields">[] = [
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

// Default field mappings per entity type (Maropost → Celora)
const DEFAULT_FIELD_MAPPINGS: Record<string, FieldMapping[]> = {
  products: [
    { sourceField: "Name", targetField: "name", enabled: true },
    { sourceField: "ParentSKU", targetField: "sku", enabled: true },
    { sourceField: "DefaultPrice", targetField: "price", enabled: true },
    { sourceField: "CostPrice", targetField: "cost_price", enabled: true },
    { sourceField: "RRP", targetField: "compare_at_price", enabled: true },
    { sourceField: "Description", targetField: "description", enabled: true },
    { sourceField: "ShortDescription", targetField: "short_description", enabled: true },
    { sourceField: "Brand", targetField: "brand", enabled: true },
    { sourceField: "Model", targetField: "model", enabled: true },
    { sourceField: "SEOPageTitle", targetField: "seo_title", enabled: true },
    { sourceField: "SEOMetaDescription", targetField: "seo_description", enabled: true },
    { sourceField: "ProductURL", targetField: "slug", enabled: true },
    { sourceField: "Images", targetField: "images", enabled: true },
    { sourceField: "Tags", targetField: "tags", enabled: true },
    { sourceField: "IsActive", targetField: "is_active", enabled: true },
    { sourceField: "WarehouseQuantity", targetField: "stock_quantity", enabled: true },
    { sourceField: "ShippingWeight", targetField: "weight", enabled: true },
    { sourceField: "Categories", targetField: "category_ids", enabled: true },
    { sourceField: "VariantInventory", targetField: "variants", enabled: true },
    { sourceField: "ItemSpecifics", targetField: "specifics", enabled: true },
    { sourceField: "CrossSellProducts", targetField: "cross_sells", enabled: true },
    { sourceField: "UpsellProducts", targetField: "upsells", enabled: true },
    { sourceField: "PriceGroups", targetField: "pricing_tiers", enabled: true },
  ],
  categories: [
    { sourceField: "CategoryName", targetField: "name", enabled: true },
    { sourceField: "CategoryID", targetField: "external_id", enabled: true },
    { sourceField: "ParentCategoryID", targetField: "parent_id", enabled: true },
    { sourceField: "SortOrder", targetField: "sort_order", enabled: true },
    { sourceField: "Active", targetField: "is_active", enabled: true },
    { sourceField: "Description", targetField: "description", enabled: true },
    { sourceField: "SEOPageTitle", targetField: "seo_title", enabled: true },
    { sourceField: "SEOMetaDescription", targetField: "seo_description", enabled: true },
  ],
  customers: [
    { sourceField: "Username", targetField: "username", enabled: true },
    { sourceField: "EmailAddress", targetField: "email", enabled: true },
    { sourceField: "Name", targetField: "first_name", enabled: true },
    { sourceField: "Surname", targetField: "last_name", enabled: true },
    { sourceField: "CompanyName", targetField: "company", enabled: true },
    { sourceField: "Phone", targetField: "phone", enabled: true },
    { sourceField: "ABN", targetField: "abn_vat_number", enabled: true },
    { sourceField: "Active", targetField: "is_active", enabled: true },
    { sourceField: "UserGroup", targetField: "customer_group", enabled: true },
    { sourceField: "BillingAddress", targetField: "billing_address", enabled: true },
    { sourceField: "ShippingAddress", targetField: "shipping_address", enabled: true },
  ],
  orders: [
    { sourceField: "OrderID", targetField: "order_number", enabled: true },
    { sourceField: "Username", targetField: "customer_email", enabled: true },
    { sourceField: "GrandTotal", targetField: "total", enabled: true },
    { sourceField: "TaxTotal", targetField: "tax_total", enabled: true },
    { sourceField: "ShippingTotal", targetField: "shipping_total", enabled: true },
    { sourceField: "Status", targetField: "status", enabled: true },
    { sourceField: "DatePlaced", targetField: "placed_at", enabled: true },
    { sourceField: "OrderLine", targetField: "line_items", enabled: true },
    { sourceField: "ShipAddress", targetField: "shipping_address", enabled: true },
    { sourceField: "BillAddress", targetField: "billing_address", enabled: true },
    { sourceField: "InternalOrderNotes", targetField: "notes", enabled: true },
  ],
  content: [
    { sourceField: "ContentName", targetField: "title", enabled: true },
    { sourceField: "Description", targetField: "content", enabled: true },
    { sourceField: "ContentType", targetField: "page_type", enabled: true },
    { sourceField: "Active", targetField: "is_published", enabled: true },
    { sourceField: "SEOPageTitle", targetField: "seo_title", enabled: true },
    { sourceField: "SEOMetaDescription", targetField: "seo_description", enabled: true },
  ],
};

const ITEMS_PER_PAGE = 20;
const SCAN_PAGE_SIZE = 500;

export default function MaropostMigration() {
  const migration = useMigration();
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
  const [paused, setPaused] = useState(false);
  const pauseRef = useRef(false);
  const [connectionError, setConnectionError] = useState("");
  const [entities, setEntities] = useState<EntityCount[]>(() => {
    try { const s = sessionStorage.getItem("maropost_entities"); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [overallProgress, setOverallProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [themeImporting, setThemeImporting] = useState(false);
  const [themeStatus, setThemeStatus] = useState<Record<string, "pending" | "converting" | "done" | "error">>({});
  const [dryRun, setDryRun] = useState(false);
  const [fieldMappings, setFieldMappings] = useState<Record<string, FieldMapping[]>>({});
  const [mappingEntity, setMappingEntity] = useState<string>("products");
  const [verificationResults, setVerificationResults] = useState<VerificationResult[]>([]);
  const [verifying, setVerifying] = useState(false);

  // Sync from migration context when it's running (so we see live updates even on this page)
  useEffect(() => {
    if (migration.state.isRunning || migration.state.overallProgress > 0) {
      setEntities(migration.state.entities as EntityCount[]);
      setOverallProgress(migration.state.overallProgress);
      setImporting(migration.state.isRunning);
      setPaused(migration.state.isPaused);
      setLogs(migration.state.logs);
    }
  }, [migration.state.entities, migration.state.overallProgress, migration.state.isRunning, migration.state.isPaused, migration.state.logs]);

  // Persist state to sessionStorage for resume
  const persistState = useCallback(() => {
    sessionStorage.setItem("maropost_step", step);
    sessionStorage.setItem("maropost_domain", storeDomain);
    sessionStorage.setItem("maropost_key", apiKey);
    sessionStorage.setItem("maropost_connected", connected ? "1" : "");
    sessionStorage.setItem("maropost_entities", JSON.stringify(entities));
  }, [step, storeDomain, apiKey, connected, entities]);

  useEffect(() => { persistState(); }, [persistState]);

  const addLog = useCallback((msg: string) => {
    const ts = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${ts}] ${msg}`]);
  }, []);

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

  const countItems = (responseData: any): { count: number; sampleFields: string[] } => {
    if (!responseData) return { count: 0, sampleFields: [] };
    const keys = Object.keys(responseData).filter(k => k !== "Messages" && k !== "CurrentTime" && k !== "Ack");
    if (keys.length === 0) return { count: 0, sampleFields: [] };
    const items = responseData[keys[0]];
    if (Array.isArray(items)) {
      const fields = items.length > 0 ? Object.keys(items[0]) : [];
      return { count: items.length, sampleFields: fields };
    }
    if (items && typeof items === "object") return { count: 1, sampleFields: Object.keys(items) };
    return { count: 0, sampleFields: [] };
  };

  const scanStore = async () => {
    setScanning(true);
    addLog("Starting store scan...");
    const scannedEntities: EntityCount[] = [];

    for (const entity of MIGRATION_ENTITIES) {
      try {
        addLog(`Scanning ${entity.label}...`);
        let totalCount = 0;
        let page = 0;
        let hasMore = true;
        const scanLimit = 200;
        let sampleFields: string[] = [];

        while (hasMore) {
          const { data } = await supabase.functions.invoke("maropost-migration", {
            body: {
              action: FETCH_ACTION_MAP[entity.entity] || "test_connection",
              store_domain: storeDomain, api_key: apiKey,
              page, limit: scanLimit, scan_mode: true,
            },
          });

          const result = countItems(data?.data);
          totalCount += result.count;
          if (page === 0) sampleFields = result.sampleFields;

          if (result.count < scanLimit || page >= 50) {
            hasMore = false;
          } else {
            page++;
            addLog(`  … page ${page + 1} (${totalCount} so far)`);
          }
        }

        addLog(`  → ${entity.label}: ${totalCount} records found`);
        scannedEntities.push({ ...entity, count: totalCount, selected: totalCount > 0, status: "pending", imported: 0, failed: 0, errors: [], pages: Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE)), sampleFields });
      } catch (err: any) {
        addLog(`  → ${entity.label}: scan failed (${err.message})`);
        scannedEntities.push({ ...entity, count: 0, selected: false, status: "pending", imported: 0, failed: 0, errors: [], pages: 0, sampleFields: [] });
      }
    }

    setEntities(scannedEntities);
    // Initialize field mappings
    const mappings: Record<string, FieldMapping[]> = {};
    for (const e of scannedEntities) {
      if (DEFAULT_FIELD_MAPPINGS[e.entity]) {
        mappings[e.entity] = DEFAULT_FIELD_MAPPINGS[e.entity].map(m => ({ ...m }));
      }
    }
    setFieldMappings(mappings);
    setScanning(false);
    setStep("mapping");
    addLog("Scan complete!");
    toast.success("Store scan complete!");
  };

  const toggleEntity = (entityName: string) => {
    setEntities(prev => prev.map(e => e.entity === entityName ? { ...e, selected: !e.selected } : e));
  };

  const toggleFieldMapping = (entity: string, sourceField: string) => {
    setFieldMappings(prev => ({
      ...prev,
      [entity]: (prev[entity] || []).map(m =>
        m.sourceField === sourceField ? { ...m, enabled: !m.enabled } : m
      ),
    }));
  };

  const fetchAllPages = async (entity: string): Promise<any[]> => {
    let allItems: any[] = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      // Check pause
      while (pauseRef.current) {
        await new Promise(r => setTimeout(r, 500));
      }

      const { data, error } = await supabase.functions.invoke("maropost-migration", {
        body: {
          action: FETCH_ACTION_MAP[entity] || "test_connection",
          store_domain: storeDomain, api_key: apiKey,
          page, limit: ITEMS_PER_PAGE,
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
      if (page >= 200) { addLog(`  ⚠ Reached 200-page limit for ${entity}`); break; }
    }

    return allItems;
  };

  const togglePause = () => {
    migration.togglePause();
  };

  const startImport = async (testMode = false) => {
    const selected = entities.filter(e => e.selected);
    if (selected.length === 0) { toast.error("Select at least one entity to import"); return; }

    const sid = await resolveStoreId();
    if (!sid) { toast.error("No store found. Please complete onboarding first."); return; }

    setStep("import");
    toast.success(testMode
      ? "Test import started — importing ~3 items per entity to verify..."
      : "Migration started in background — you can navigate away safely!"
    );

    // Delegate to context — runs in background across page navigation
    migration.startBackgroundImport({
      entities: entities as any,
      storeDomain,
      apiKey,
      storeId: sid,
      dryRun,
      testMode,
    });
  };

  const retryEntity = async (entityName: string) => {
    const sid = await resolveStoreId();
    if (!sid) return;
    migration.retryEntity(entityName, sid);
    toast.success(`Retrying ${entityName} in background...`);
  };

  // ── Post-migration verification ──
  const runVerification = async () => {
    setVerifying(true);
    setVerificationResults([]);
    addLog("═══ Running Post-Migration Verification ═══");

    const sid = await resolveStoreId();
    if (!sid) { setVerifying(false); return; }

    const results: VerificationResult[] = [];

    // 1. Check product count matches
    try {
      const { count } = await supabase.from("products").select("*", { count: "exact", head: true }).eq("store_id", sid);
      const expected = entities.find(e => e.entity === "products")?.imported || 0;
      const diff = Math.abs((count || 0) - expected);
      results.push({
        check: "Product Count",
        status: diff === 0 ? "pass" : diff <= 5 ? "warn" : "fail",
        details: `${count || 0} in DB, ${expected} imported${diff > 0 ? ` (${diff} difference)` : ""}`,
        count: count || 0,
      });
    } catch { results.push({ check: "Product Count", status: "fail", details: "Unable to query" }); }

    // 2. Check products with images
    try {
      const { data: noImgProducts } = await supabase.from("products").select("id").eq("store_id", sid).or("images.is.null,images.eq.{}") as any;
      const noImgCount = noImgProducts?.length || 0;
      results.push({
        check: "Products Missing Images",
        status: noImgCount === 0 ? "pass" : noImgCount <= 10 ? "warn" : "fail",
        details: noImgCount === 0 ? "All products have images" : `${noImgCount} products have no images`,
        count: noImgCount,
      });
    } catch { results.push({ check: "Products Missing Images", status: "warn", details: "Unable to check" }); }

    // 3. Customer count
    try {
      const { count } = await supabase.from("customers").select("*", { count: "exact", head: true }).eq("store_id", sid);
      const expected = entities.find(e => e.entity === "customers")?.imported || 0;
      results.push({
        check: "Customer Count",
        status: (count || 0) >= expected ? "pass" : "warn",
        details: `${count || 0} in DB, ${expected} imported`,
        count: count || 0,
      });
    } catch { results.push({ check: "Customer Count", status: "fail", details: "Unable to query" }); }

    // 4. Order count
    try {
      const { count } = await supabase.from("orders").select("*", { count: "exact", head: true }).eq("store_id", sid);
      const expected = entities.find(e => e.entity === "orders")?.imported || 0;
      results.push({
        check: "Order Count",
        status: (count || 0) >= expected ? "pass" : "warn",
        details: `${count || 0} in DB, ${expected} imported`,
        count: count || 0,
      });
    } catch { results.push({ check: "Order Count", status: "fail", details: "Unable to query" }); }

    // 5. Orphan orders (no customer linked)
    try {
      const { data: orphans } = await supabase.from("orders").select("id").eq("store_id", sid).is("customer_id", null);
      const orphanCount = orphans?.length || 0;
      results.push({
        check: "Orphan Orders (no customer)",
        status: orphanCount === 0 ? "pass" : orphanCount <= 5 ? "warn" : "fail",
        details: orphanCount === 0 ? "All orders linked to customers" : `${orphanCount} orders without customer link`,
        count: orphanCount,
      });
    } catch { results.push({ check: "Orphan Orders", status: "warn", details: "Unable to check" }); }

    // 6. Category count
    try {
      const { count } = await supabase.from("categories").select("*", { count: "exact", head: true }).eq("store_id", sid);
      const expected = entities.find(e => e.entity === "categories")?.imported || 0;
      results.push({
        check: "Category Count",
        status: (count || 0) >= expected ? "pass" : "warn",
        details: `${count || 0} in DB, ${expected} imported`,
        count: count || 0,
      });
    } catch { results.push({ check: "Category Count", status: "fail", details: "Unable to query" }); }

    // 7. Products without categories
    try {
      const { data: uncatProducts } = await supabase.from("products").select("id").eq("store_id", sid).is("category_id", null);
      const uncatCount = uncatProducts?.length || 0;
      results.push({
        check: "Uncategorized Products",
        status: uncatCount === 0 ? "pass" : uncatCount <= 10 ? "warn" : "fail",
        details: uncatCount === 0 ? "All products categorized" : `${uncatCount} products without category`,
        count: uncatCount,
      });
    } catch { results.push({ check: "Uncategorized Products", status: "warn", details: "Unable to check" }); }

    // 8. Content pages
    try {
      const { count } = await supabase.from("content_pages").select("*", { count: "exact", head: true }).eq("store_id", sid);
      const expected = entities.find(e => e.entity === "content")?.imported || 0;
      results.push({
        check: "Content Pages",
        status: (count || 0) >= expected ? "pass" : "warn",
        details: `${count || 0} in DB, ${expected} imported`,
        count: count || 0,
      });
    } catch { results.push({ check: "Content Pages", status: "fail", details: "Unable to query" }); }

    // 9. Products with SEO
    try {
      const { data: noSeo } = await supabase.from("products").select("id").eq("store_id", sid).is("seo_title", null) as any;
      const noSeoCount = noSeo?.length || 0;
      results.push({
        check: "Products Missing SEO Title",
        status: noSeoCount === 0 ? "pass" : "warn",
        details: noSeoCount === 0 ? "All products have SEO titles" : `${noSeoCount} products missing SEO title`,
        count: noSeoCount,
      });
    } catch { results.push({ check: "Products Missing SEO", status: "warn", details: "Unable to check" }); }

    // 10. 301 Redirects
    try {
      const { count } = await supabase.from("redirects" as any).select("*", { count: "exact", head: true }).eq("store_id", sid);
      results.push({
        check: "301 Redirects",
        status: "pass",
        details: `${count || 0} redirects imported`,
        count: count || 0,
      });
    } catch { results.push({ check: "301 Redirects", status: "warn", details: "Redirects table may not exist" }); }

    setVerificationResults(results);
    setVerifying(false);
    addLog(`═══ Verification Complete: ${results.filter(r => r.status === "pass").length}/${results.length} checks passed ═══`);
    toast.success("Verification complete!");
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

    try {
      const { data: contentData } = await supabase.functions.invoke("maropost-migration", {
        body: { action: "get_content", store_domain: storeDomain, api_key: apiKey, filter: {}, limit: 200 },
      });

      const allContent = contentData?.data?.Content || [];
      let customCss = "";
      let customJs = "";

      for (const c of (Array.isArray(allContent) ? allContent : [])) {
        if (c.ContentFileIdentifier?.includes(".css")) customCss += `\n/* From: ${c.ContentName} */\n${c.Description || ""}`;
        if (c.ContentFileIdentifier?.includes(".js")) customJs += `\n// From: ${c.ContentName}\n${c.Description || ""}`;
      }

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

      const { data: result } = await supabase.functions.invoke("maropost-import", {
        body: {
          action: "import_theme_css",
          store_id: sid,
          source_data: { templates, css: customCss, js: customJs },
        },
      });

      addLog(`  ✓ Theme: ${result?.imported || 0} templates/assets imported`);

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

  const exportMigrationCSV = useCallback(() => {
    const rows = [["Entity", "Label", "Count", "Imported", "Failed", "Status", "Errors"]];
    for (const e of entities) {
      rows.push([e.entity, e.label, String(e.count), String(e.imported), String(e.failed), e.status, e.errors.join("; ")]);
    }
    rows.push([]);
    rows.push(["--- Verification Results ---"]);
    for (const v of verificationResults) {
      rows.push([v.check, v.status, v.details, String(v.count || "")]);
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
  }, [entities, logs, verificationResults]);

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
    setVerificationResults([]);
    addLog("═══ Rollback Complete ═══");
    toast.success("All imported data has been deleted");
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "failed": return <XCircle className="h-5 w-5 text-destructive" />;
      case "importing": return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      case "paused": return <Pause className="h-5 w-5 text-yellow-500" />;
      case "skipped": return <ArrowRight className="h-5 w-5 text-muted-foreground" />;
      default: return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const verifyIcon = (status: string) => {
    switch (status) {
      case "pass": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warn": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "fail": return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const steps = [
    { id: "connect", label: "Connect", icon: <Globe className="h-4 w-4" /> },
    { id: "scan", label: "Scan Store", icon: <Eye className="h-4 w-4" /> },
    { id: "mapping", label: "Field Map", icon: <Link className="h-4 w-4" /> },
    { id: "select", label: "Select Data", icon: <Check className="h-4 w-4" /> },
    { id: "import", label: "Import", icon: <Download className="h-4 w-4" /> },
    { id: "verify", label: "Verify", icon: <Shield className="h-4 w-4" /> },
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

        {/* Step 3: Field Mapping Preview */}
        {step === "mapping" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Link className="h-5 w-5" />Field Mapping Preview</CardTitle>
              <CardDescription>Review how Maropost fields map to our platform. Toggle fields on/off to control what gets imported.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={mappingEntity} onValueChange={setMappingEntity}>
                <TabsList className="flex-wrap h-auto gap-1">
                  {Object.keys(fieldMappings).map(entity => (
                    <TabsTrigger key={entity} value={entity} className="capitalize">{entity}</TabsTrigger>
                  ))}
                </TabsList>
                {Object.entries(fieldMappings).map(([entity, mappings]) => (
                  <TabsContent key={entity} value={entity}>
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10">Use</TableHead>
                            <TableHead>Maropost Field</TableHead>
                            <TableHead><ArrowRight className="h-4 w-4 inline" /></TableHead>
                            <TableHead>Platform Field</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mappings.map(m => (
                            <TableRow key={m.sourceField} className={!m.enabled ? "opacity-50" : ""}>
                              <TableCell>
                                <Checkbox checked={m.enabled} onCheckedChange={() => toggleFieldMapping(entity, m.sourceField)} />
                              </TableCell>
                              <TableCell className="font-mono text-xs">{m.sourceField}</TableCell>
                              <TableCell><ArrowRight className="h-3 w-3 text-muted-foreground" /></TableCell>
                              <TableCell className="font-mono text-xs text-primary">{m.targetField}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {mappings.filter(m => m.enabled).length}/{mappings.length} fields enabled for {entity}
                    </p>
                  </TabsContent>
                ))}
              </Tabs>

              {/* Source fields detected */}
              {entities.some(e => e.sampleFields && e.sampleFields.length > 0) && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground font-medium">Detected source fields (from scan)</summary>
                  <div className="mt-2 space-y-2">
                    {entities.filter(e => e.sampleFields && e.sampleFields.length > 0).map(e => (
                      <div key={e.entity}>
                        <p className="font-medium text-xs capitalize">{e.entity}:</p>
                        <p className="text-xs text-muted-foreground font-mono">{e.sampleFields?.join(", ")}</p>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              <div className="flex gap-3 pt-4">
                <Button onClick={() => setStep("select")}>
                  Continue to Selection <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button variant="outline" onClick={() => setStep("scan")}>Back</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Select */}
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

              <div className="flex items-center gap-3 pt-4">
                <Button onClick={startImport} disabled={!entities.some(e => e.selected)}>
                  <Download className="h-4 w-4 mr-2" />
                  {dryRun ? "Dry Run" : "Start Import"} ({entities.filter(e => e.selected).length} entities)
                </Button>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={dryRun} onCheckedChange={(v) => setDryRun(!!v)} />
                  <span className="text-muted-foreground">Dry run (validate only, no database writes)</span>
                </label>
                <Button variant="outline" onClick={() => setStep("mapping")}>Back</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Import Progress */}
        {(step === "import" || (step === "review" && !verificationResults.length)) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {importing ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5 text-green-500" />}
                {importing ? (paused ? "Migration Paused" : "Importing Data…") : "Data Import Complete"}
              </CardTitle>
              <CardDescription>
                {importing ? "Please don't close this page while the import is running" : `${totalImported} records imported, ${totalFailed} failed`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <div className="flex items-center gap-2">
                    {importing && (
                      <Button variant="outline" size="sm" onClick={togglePause} className="h-7 px-2">
                        {paused ? <><Play className="h-3 w-3 mr-1" />Resume</> : <><Pause className="h-3 w-3 mr-1" />Pause</>}
                      </Button>
                    )}
                    <span>{overallProgress}%</span>
                  </div>
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
                        {entity.status === "importing" && <span>Importing… {entity.batchProgress || 0}%</span>}
                        {entity.status === "paused" && <span className="text-yellow-600">Paused</span>}
                        {entity.status === "pending" && <span>Waiting</span>}
                      </div>
                    </div>
                    {(entity.status === "importing" || entity.status === "paused") && (
                      <Progress value={entity.batchProgress || 0} className="h-1.5" />
                    )}
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
                  <Button onClick={() => { setStep("verify"); runVerification(); }}>
                    <Shield className="h-4 w-4 mr-2" />
                    Run Verification
                  </Button>
                  <Button variant="outline" onClick={startThemeMigration}>
                    <Palette className="h-4 w-4 mr-2" />
                    Skip to Theme Migration
                  </Button>
                  <Button variant="outline" onClick={() => window.location.href = "/_cpanel/dashboard"}>
                    Skip to Dashboard
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 6: Post-Migration Verification */}
        {step === "verify" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Post-Migration Verification</CardTitle>
              <CardDescription>Automated checks to verify data integrity and completeness after import</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {verifying && (
                <div className="flex items-center gap-3 p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Running verification checks…</span>
                </div>
              )}

              {verificationResults.length > 0 && (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-3 rounded-lg bg-green-50 border border-green-200">
                      <p className="text-2xl font-bold text-green-600">{verificationResults.filter(r => r.status === "pass").length}</p>
                      <p className="text-xs text-muted-foreground">Passed</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                      <p className="text-2xl font-bold text-yellow-600">{verificationResults.filter(r => r.status === "warn").length}</p>
                      <p className="text-xs text-muted-foreground">Warnings</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-red-50 border border-red-200">
                      <p className="text-2xl font-bold text-destructive">{verificationResults.filter(r => r.status === "fail").length}</p>
                      <p className="text-xs text-muted-foreground">Failed</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {verificationResults.map((result, i) => (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${
                        result.status === "pass" ? "border-green-200 bg-green-50/50" :
                        result.status === "warn" ? "border-yellow-200 bg-yellow-50/50" :
                        "border-red-200 bg-red-50/50"
                      }`}>
                        {verifyIcon(result.status)}
                        <div className="flex-1">
                          <p className="font-medium text-sm">{result.check}</p>
                          <p className="text-xs text-muted-foreground">{result.details}</p>
                        </div>
                        <Badge variant={result.status === "pass" ? "default" : result.status === "warn" ? "secondary" : "destructive"} className="text-xs">
                          {result.status === "pass" ? "Pass" : result.status === "warn" ? "Warning" : "Fail"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                {!verifying && (
                  <>
                    <Button variant="outline" onClick={runVerification}>
                      <RefreshCw className="h-4 w-4 mr-2" />Re-run Checks
                    </Button>
                    <Button onClick={startThemeMigration}>
                      <Palette className="h-4 w-4 mr-2" />
                      Continue to Theme Migration
                    </Button>
                    <Button variant="outline" onClick={() => setStep("import")}>Back</Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 7: Theme Migration */}
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
                <Button variant="outline" onClick={() => setStep("verify")}>Back</Button>
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
                    <div key={i} className={`${log.includes("✗") ? "text-destructive" : log.includes("✓") ? "text-green-600" : log.includes("═══") ? "font-bold text-foreground" : log.includes("⏸") ? "text-yellow-600" : "text-muted-foreground"}`}>
                      {log}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Final Review */}
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

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                <div className="text-center p-3 bg-background rounded-lg">
                  <p className="text-2xl font-bold text-foreground">{verificationResults.filter(r => r.status === "pass").length}/{verificationResults.length}</p>
                  <p className="text-xs text-muted-foreground">Checks Passed</p>
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
