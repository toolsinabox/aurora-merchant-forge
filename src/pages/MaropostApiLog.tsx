import { useState, useCallback, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  CheckCircle, XCircle, Loader2, AlertTriangle, Package, Users,
  ShoppingCart, Layers, FileText, Globe, Truck, Gift, CreditCard,
  Warehouse, Search, Download, RefreshCw, Upload, Palette, Eye,
  ArrowRight, Terminal, Shield, FolderArchive, FileUp,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import JSZip from "jszip";

// ── DB schema field maps — ACCURATE to actual Maropost API response shapes ──
// Key insight: Customer Name/Surname are NOT top-level fields — they're inside BillingAddress
// Orders return FLAT fields (BillFirstName, ShipCity) not nested objects
const DB_FIELDS: Record<string, Record<string, string>> = {
  products: {
    ID: "external_id (migration ref)", SKU: "sku", ParentSKU: "parent_sku → sku lookup",
    Name: "title", Brand: "brand", Model: "model_number",
    Description: "description", ShortDescription: "short_description",
    Features: "features", Specifications: "specifications",
    Warranty: "warranty", TermsAndConditions: "terms_conditions",
    DefaultPrice: "price", CostPrice: "cost_price", RRP: "compare_at_price",
    PromotionPrice: "promo_price",
    IsActive: "is_active", Approved: "is_approved",
    SEOPageTitle: "seo_title", SEOMetaDescription: "seo_description",
    SEOPageHeading: "seo_title (fallback)", ProductURL: "slug",
    AutomaticURL: "—(not stored)",
    Tags: "tags", SearchKeywords: "search_keywords",
    Images: "images[] (product_images)", ImageURL: "images (fallback)",
    ThumbURL: "images (fallback)", DefaultImageURL: "images (fallback)",
    TaxFreeItem: "tax_free", TaxInclusive: "tax_inclusive",
    TaxCategory: "—(not stored)",
    Type: "product_type", SubType: "product_subtype",
    CustomLabel: "custom_label", CustomContent: "—(not stored)",
    ShippingWeight: "product_shipping.shipping_weight",
    ShippingLength: "product_shipping.shipping_length",
    ShippingWidth: "product_shipping.shipping_width",
    ShippingHeight: "product_shipping.shipping_height",
    CubicWeight: "product_shipping.shipping_cubic",
    ItemLength: "product_shipping.actual_length",
    ItemWidth: "product_shipping.actual_width",
    ItemHeight: "product_shipping.actual_height",
    WarehouseQuantity: "inventory_stock.quantity",
    WarehouseLocations: "inventory_stock (multi-warehouse)",
    CommittedQuantity: "—(not stored)", AvailableSellQuantity: "—(calculated)",
    VariantInventory: "product_variants",
    ItemSpecifics: "product_specifics (name/value pairs)",
    Categories: "product ↔ category mapping",
    PriceGroups: "product_pricing_tiers (group/price/qty)",
    CrossSellProducts: "product_relations (cross_sell)",
    UpsellProducts: "product_relations (upsell)",
    FreeGifts: "product_relations (free_gift)",
    DateAdded: "created_at", DateUpdated: "updated_at",
    SortOrder: "sort_order",
    AccountingCode: "accounting_code",
    ContentFileIdentifier: "—(not stored)",
    eBayProductIDs: "—(not stored, marketplace-specific)",
    InventoryID: "external_id (same as ID)",
    UnitOfMeasure: "—(not stored)",
    BaseUnitOfMeasure: "product_shipping.base_unit",
    BaseUnitQuantity: "product_shipping.base_unit_qty",
    QuantityPerScan: "—(not stored)",
    BuyUnitQuantity: "—(not stored)",
    SellUnitQuantity: "product_shipping.selling_unit",
    PreorderQuantity: "preorder_quantity",
    PickPriority: "—(not stored)", PickZone: "inventory_stock.bin_location",
    PrimarySupplier: "supplier_id (FK lookup)",
  },
  categories: {
    CategoryID: "external_id (used for parent mapping)",
    CategoryName: "name",
    ParentCategoryID: "parent_id (mapped via CategoryID)",
    Active: "—(implied by existence)",
    SortOrder: "sort_order",
    OnSiteMap: "—(not stored)", OnMenu: "—(not stored)",
    AllowFiltering: "—(not stored)",
    ExternalSource: "—(not stored)",
    ExternalReference1: "—(not stored)",
    ExternalReference2: "—(not stored)",
    ExternalReference3: "—(not stored)",
    CategoryReference: "slug (derived)",
    ShortDescription: "description",
    Description: "description",
    ContentFileIdentifier: "—(not stored)",
    SEOPageTitle: "seo_title",
    SEOPageHeading: "—(not stored)",
    SEOMetaDescription: "seo_description",
    SEOMetaKeywords: "—(not stored)",
  },
  customers: {
    // ⚠ CRITICAL: Maropost does NOT return Name/Surname as top-level fields!
    // Customer name MUST be extracted from BillingAddress.BillFirstName + BillLastName
    Username: "external_ref (used for order→customer matching)",
    Email: "email", EmailAddress: "email",
    // These are NOT returned by API — name comes from BillingAddress only:
    Name: "⚠ NOT RETURNED — use BillingAddress.BillFirstName",
    Surname: "⚠ NOT RETURNED — use BillingAddress.BillLastName",
    CompanyName: "⚠ NOT RETURNED — use BillingAddress.BillCompany",
    Phone: "⚠ NOT RETURNED — use BillingAddress.BillPhone",
    Fax: "⚠ NOT RETURNED — use BillingAddress.BillFax",
    Mobile: "⚠ NOT RETURNED — use BillingAddress.BillPhone",
    ABN: "abn_vat_number",
    Active: "is_approved",
    DateAdded: "created_at", DateUpdated: "updated_at",
    Type: "segment (Customer→regular, Prospect→lead)",
    IdentificationType: "—(not stored)",
    IdentificationDetails: "notes",
    NewsletterSubscriber: "tags[] (newsletter)",
    CustomerLogs: "customer_communications",
    UserGroup: "customer_group_id + tags",
    AccountBalance: "—(not stored)",
    AvailableCredit: "—(not stored)",
    OnCreditHold: "—(not stored)",
    CreditLimit: "credit_limit",
    // Billing address sub-fields — these ARE returned
    BillingAddress: "customer_addresses (type=billing)",
    "BillingAddress.BillFirstName": "★ name (first part) — PRIMARY SOURCE",
    "BillingAddress.BillLastName": "★ name (last part) — PRIMARY SOURCE",
    "BillingAddress.BillCompany": "★ company_name — customer_addresses.company",
    "BillingAddress.BillPhone": "★ phone — PRIMARY SOURCE",
    "BillingAddress.BillFax": "customer_addresses (fax field missing)",
    "BillingAddress.BillStreetLine1": "customer_addresses.address_1",
    "BillingAddress.BillStreetLine2": "customer_addresses.address_2",
    "BillingAddress.BillCity": "customer_addresses.city",
    "BillingAddress.BillState": "customer_addresses.state",
    "BillingAddress.BillPostCode": "customer_addresses.postcode",
    "BillingAddress.BillCountry": "customer_addresses.country",
    // Shipping address sub-fields
    ShippingAddress: "customer_addresses (type=shipping)",
    "ShippingAddress.ShipFirstName": "customer_addresses.first_name",
    "ShippingAddress.ShipLastName": "customer_addresses.last_name",
    "ShippingAddress.ShipCompany": "customer_addresses.company",
    "ShippingAddress.ShipPhone": "customer_addresses.phone",
    "ShippingAddress.ShipFax": "—(not stored)",
    "ShippingAddress.ShipStreetLine1": "customer_addresses.address_1",
    "ShippingAddress.ShipStreetLine2": "customer_addresses.address_2",
    "ShippingAddress.ShipCity": "customer_addresses.city",
    "ShippingAddress.ShipState": "customer_addresses.state",
    "ShippingAddress.ShipPostCode": "customer_addresses.postcode",
    "ShippingAddress.ShipCountry": "customer_addresses.country",
  },
  orders: {
    // ⚠ Orders return FLAT fields, not nested ShipAddress/BillAddress objects
    OrderID: "order_number",
    Username: "customer_id (lookup by username→customer)",
    Email: "customer email (used for customer lookup fallback)",
    SalesChannel: "order_channel",
    GrandTotal: "total",
    TaxTotal: "tax",
    ShippingTotal: "shipping",
    SurchargeTotal: "—(not stored)",
    DiscountTotal: "discount",
    CashPayments: "—(not stored)",
    ChequePayments: "—(not stored)",
    Status: "status (mapped to our statuses)",
    ShippingOption: "shipping_method",
    DeliveryInstruction: "notes (appended)",
    InternalOrderNotes: "notes",
    CustomerRef1: "—(not stored)",
    CustomerRef2: "—(not stored)",
    OrderLine: "order_items (SKU, Quantity, OrderLineID)",
    OrderPayment: "order_payments (Amount, DatePaid, Id)",
    DatePlaced: "created_at",
    DateUpdated: "updated_at",
    DateRequired: "—(not stored)",
    DateInvoiced: "—(not stored)",
    DatePaid: "paid_at",
    DateCompleted: "completed_at",
    DatePosted: "—(not stored)",
    // Flat billing fields
    BillFirstName: "billing_address.first_name (JSON)",
    BillLastName: "billing_address.last_name (JSON)",
    BillCompany: "billing_address.company (JSON)",
    BillPhone: "billing_address.phone (JSON)",
    BillStreetLine1: "billing_address.address_1 (JSON)",
    BillCity: "billing_address.city (JSON)",
    BillState: "billing_address.state (JSON)",
    BillPostCode: "billing_address.postcode (JSON)",
    BillCountry: "billing_address.country (JSON)",
    // Flat shipping fields
    ShipFirstName: "shipping_address.first_name (JSON)",
    ShipLastName: "shipping_address.last_name (JSON)",
    ShipCompany: "shipping_address.company (JSON)",
    ShipPhone: "shipping_address.phone (JSON)",
    ShipStreetLine1: "shipping_address.address_1 (JSON)",
    ShipCity: "shipping_address.city (JSON)",
    ShipState: "shipping_address.state (JSON)",
    ShipPostCode: "shipping_address.postcode (JSON)",
    ShipCountry: "shipping_address.country (JSON)",
  },
  content: {
    ContentID: "external_id",
    ContentName: "title",
    ContentReference: "slug (derived)",
    ContentType: "page_type (mapped: 2→page)",
    Active: "is_published",
    SortOrder: "sort_order",
    OnSiteMap: "—(not stored)", OnMenu: "—(not stored)",
    ParentContentID: "—(not stored)",
    ShortDescription: "content (fallback)",
    Description: "content",
    Author: "—(not stored)",
    ContentFileIdentifier: "—(not stored)",
    SEOPageTitle: "seo_title",
    SEOPageHeading: "—(not stored)",
    SEOMetaDescription: "seo_description",
    SEOMetaKeywords: "—(not stored)",
    DatePosted: "published_at",
    DateUpdated: "updated_at",
  },
  suppliers: {
    ID: "external_id",
    SupplierID: "external_id (same as ID)",
    SupplierName: "name (NOT RETURNED — need OutputSelector)",
    ContactName: "—(not stored)",
    Email: "—(not stored)",
    Phone: "—(not stored)",
  },
  warehouses: {
    ID: "external_id",
    WarehouseID: "external_id (same as ID)",
    WarehouseName: "name (NOT RETURNED — need OutputSelector)",
    Address: "address (NOT RETURNED)",
  },
  shipping: {
    ShippingMethod: "shipping_zones / shipping_methods",
    "ShippingMethod.id": "external_id",
    "ShippingMethod.name": "name",
    "ShippingMethod.status": "is_active",
    "ShippingMethod.description": "description",
    "ShippingMethod.visibility": "visibility settings",
    "ShippingMethod.visibility.customers": "visible_to_customers",
    "ShippingMethod.visibility.staff": "visible_to_staff",
    "ShippingMethod.visibility.ebay": "visible_on_ebay",
  },
  rma: {
    RmaID: "returns.external_id",
    // API only returns RmaID with current OutputSelector — need more fields
    OrderID: "returns.order_id (NOT RETURNED)",
    Status: "returns.status (NOT RETURNED)",
    Reason: "returns.reason (NOT RETURNED)",
  },
  payments: {
    ID: "order_payments.external_id",
    PaymentID: "order_payments.external_id (same as ID)",
    OrderID: "order_payments → order.order_number",
    // API returns minimal data — need more OutputSelector fields
    Amount: "order_payments.amount (NOT RETURNED)",
    PaymentMethod: "order_payments.method (NOT RETURNED)",
    DatePaid: "order_payments.paid_at (NOT RETURNED)",
  },
  vouchers: {
    // API returned error — needs different OutputSelector
    VoucherID: "gift_vouchers.external_id",
    Code: "gift_vouchers.code",
    Balance: "gift_vouchers.balance",
    InitialValue: "gift_vouchers.initial_value",
  },
  currency: {
    // API returned internal server error
    CurrencyCode: "currencies.code",
    CurrencyName: "currencies.name",
  },
};

const ENTITY_CONFIG = [
  { key: "products", label: "Products", icon: <Package className="h-4 w-4" />, action: "get_products" },
  { key: "categories", label: "Categories", icon: <Layers className="h-4 w-4" />, action: "get_categories" },
  { key: "customers", label: "Customers", icon: <Users className="h-4 w-4" />, action: "get_customers" },
  { key: "orders", label: "Orders", icon: <ShoppingCart className="h-4 w-4" />, action: "get_orders" },
  { key: "content", label: "Content", icon: <FileText className="h-4 w-4" />, action: "get_content" },
  { key: "vouchers", label: "Vouchers", icon: <Gift className="h-4 w-4" />, action: "get_vouchers" },
  { key: "suppliers", label: "Suppliers", icon: <Warehouse className="h-4 w-4" />, action: "get_suppliers" },
  { key: "warehouses", label: "Warehouses", icon: <Warehouse className="h-4 w-4" />, action: "get_warehouses" },
  { key: "shipping", label: "Shipping", icon: <Truck className="h-4 w-4" />, action: "get_shipping" },
  { key: "rma", label: "Returns/RMA", icon: <RefreshCw className="h-4 w-4" />, action: "get_rma" },
  { key: "payments", label: "Payments", icon: <CreditCard className="h-4 w-4" />, action: "get_payments" },
  { key: "currency", label: "Currency", icon: <Globe className="h-4 w-4" />, action: "get_currency" },
];

interface AuditResult {
  entity: string;
  rawData: any;
  fields: string[];
  sampleItem: any;
  count: number;
  error?: string;
}

interface ThemeFile {
  path: string;
  size: number;
  type: string;
  content?: string;
}

interface ThemeAuditResult {
  totalFiles: number;
  templates: ThemeFile[];
  css: ThemeFile[];
  js: ThemeFile[];
  images: ThemeFile[];
  fonts: ThemeFile[];
  other: ThemeFile[];
  baseTags: string[];
  unsupportedTags: string[];
  customScripts: string[];
}

export default function MaropostApiLog() {
  const [storeDomain] = useState("toolsinabox.com.au");
  const [apiKey] = useState("icsH8JPuS9SYeWhHlaiSKLS75qGHpHg0");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentEntity, setCurrentEntity] = useState("");
  const [results, setResults] = useState<Record<string, AuditResult>>({});
  const [activeTab, setActiveTab] = useState("overview");
  const [logs, setLogs] = useState<string[]>([]);
  const [reportDate, setReportDate] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  
  // Theme audit state
  const [themeFiles, setThemeFiles] = useState<ThemeFile[]>([]);
  const [themeAudit, setThemeAudit] = useState<ThemeAuditResult | null>(null);
  const [themeUploading, setThemeUploading] = useState(false);

  const addLog = useCallback((msg: string) => {
    const ts = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${ts}] ${msg}`]);
  }, []);

  // ── Import previously exported audit JSON ──
  const handleImportReport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!data.entities) {
        toast.error("Invalid audit report — missing 'entities' key");
        return;
      }

      setResults(data.entities);
      setReportDate(data.auditDate || null);
      if (data.themeAudit) setThemeAudit(data.themeAudit);
      
      setLogs([]);
      addLog("═══ Imported Audit Report ═══");
      addLog(`Store: ${data.store || "unknown"}`);
      addLog(`Date: ${data.auditDate || "unknown"}`);
      
      const entityKeys = Object.keys(data.entities);
      for (const key of entityKeys) {
        const r = data.entities[key];
        if (r.error) {
          addLog(`  ✗ ${key}: ${r.error}`);
        } else {
          addLog(`  ✓ ${key}: ${r.count} records, ${r.fields?.length || 0} fields`);
        }
      }
      
      addLog(`Summary: ${data.summary?.totalFields || "?"} fields, ${data.summary?.mappedFields || "?"} mapped, ${data.summary?.missingFields || "?"} missing`);
      toast.success(`Loaded audit report from ${new Date(data.auditDate).toLocaleDateString()}`);
    } catch (err: any) {
      toast.error(`Failed to parse report: ${err.message}`);
    }
    
    // Reset input
    if (importInputRef.current) importInputRef.current.value = "";
  };

  const runFullAudit = async () => {
    setLoading(true);
    setResults({});
    setLogs([]);
    setReportDate(null);
    addLog("═══ Starting Full Maropost API Audit ═══");
    addLog(`Store: ${storeDomain}`);

    const newResults: Record<string, AuditResult> = {};

    for (let i = 0; i < ENTITY_CONFIG.length; i++) {
      const entity = ENTITY_CONFIG[i];
      setCurrentEntity(entity.label);
      setProgress(Math.round(((i) / ENTITY_CONFIG.length) * 100));
      addLog(`▶ Fetching ${entity.label}...`);

      try {
        const { data, error } = await supabase.functions.invoke("maropost-migration", {
          body: {
            action: entity.action,
            store_domain: storeDomain,
            api_key: apiKey,
            page: 0,
            limit: 5,
            scan_mode: false,
          },
        });

        if (error) throw error;

        const responseData = data?.data;
        const keys = responseData ? Object.keys(responseData).filter((k: string) => k !== "Messages" && k !== "CurrentTime" && k !== "Ack") : [];
        const items = keys.length > 0 ? responseData[keys[0]] : null;
        const itemsArr = Array.isArray(items) ? items : items ? [items] : [];
        const sampleItem = itemsArr[0] || null;
        const allFields = new Set<string>();

        for (const item of itemsArr) {
          if (item && typeof item === "object") {
            collectFields(item, "", allFields);
          }
        }

        newResults[entity.key] = {
          entity: entity.key,
          rawData: responseData,
          fields: Array.from(allFields).sort(),
          sampleItem,
          count: itemsArr.length,
        };

        addLog(`  ✓ ${entity.label}: ${itemsArr.length} records, ${allFields.size} fields detected`);
      } catch (err: any) {
        newResults[entity.key] = {
          entity: entity.key,
          rawData: null,
          fields: [],
          sampleItem: null,
          count: 0,
          error: err.message,
        };
        addLog(`  ✗ ${entity.label}: ${err.message}`);
      }
    }

    setResults(newResults);
    setProgress(100);
    setCurrentEntity("");
    setLoading(false);
    setReportDate(new Date().toISOString());
    addLog("═══ Audit Complete ═══");
    toast.success("Full API audit complete!");
  };

  const collectFields = (obj: any, prefix: string, fields: Set<string>) => {
    for (const key of Object.keys(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      fields.add(fullKey);
      const val = obj[key];
      if (val && typeof val === "object" && !Array.isArray(val)) {
        collectFields(val, fullKey, fields);
      } else if (Array.isArray(val) && val.length > 0 && typeof val[0] === "object") {
        collectFields(val[0], `${fullKey}[0]`, fields);
      }
    }
  };

  const getFieldStatus = (entityKey: string, field: string): { status: "mapped" | "partial" | "missing" | "critical"; target: string } => {
    const dbMap = DB_FIELDS[entityKey];
    if (!dbMap) return { status: "missing", target: "No mapping defined" };
    
    // Try exact match first
    if (dbMap[field]) {
      const target = dbMap[field];
      if (target.startsWith("⚠")) return { status: "critical", target };
      if (target.startsWith("—")) return { status: "partial", target };
      return { status: "mapped", target };
    }
    
    // Try top-level field
    const topField = field.split(".")[0].split("[")[0];
    const target = dbMap[topField];
    if (!target) return { status: "missing", target: "NOT MAPPED" };
    if (target.startsWith("⚠")) return { status: "critical", target };
    if (target.startsWith("—")) return { status: "partial", target };
    return { status: "mapped", target };
  };

  const renderValue = (val: any, depth = 0): string => {
    if (val === null || val === undefined) return "null";
    if (typeof val === "string") return val.length > 120 ? val.substring(0, 120) + "..." : val;
    if (typeof val === "number" || typeof val === "boolean") return String(val);
    if (Array.isArray(val)) {
      if (val.length === 0) return "[]";
      if (depth > 1) return `[${val.length} items]`;
      return `[${val.slice(0, 2).map(v => renderValue(v, depth + 1)).join(", ")}${val.length > 2 ? `, ...+${val.length - 2}` : ""}]`;
    }
    if (typeof val === "object") {
      if (depth > 1) return "{...}";
      const keys = Object.keys(val);
      return `{${keys.slice(0, 3).map(k => `${k}: ${renderValue(val[k], depth + 1)}`).join(", ")}${keys.length > 3 ? `, ...+${keys.length - 3}` : ""}}`;
    }
    return String(val);
  };

  // ── Theme ZIP upload handler ──
  const handleThemeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setThemeUploading(true);
    addLog(`▶ Parsing theme ZIP: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);

    try {
      const zip = await JSZip.loadAsync(file);
      const files: ThemeFile[] = [];
      const baseTags = new Set<string>();
      const unsupportedTags = new Set<string>();
      const customScripts = new Set<string>();

      for (const [path, zipEntry] of Object.entries(zip.files)) {
        if (zipEntry.dir) continue;
        const ext = path.split(".").pop()?.toLowerCase() || "";
        const size = (zipEntry as any)._data?.uncompressedSize || 0;
        let type = "other";
        if (["html", "htm", "tpl", "template"].includes(ext)) type = "template";
        else if (["css", "scss", "less"].includes(ext)) type = "css";
        else if (["js", "mjs", "ts"].includes(ext)) type = "js";
        else if (["png", "jpg", "jpeg", "gif", "svg", "webp", "ico"].includes(ext)) type = "image";
        else if (["woff", "woff2", "ttf", "otf", "eot"].includes(ext)) type = "font";

        let content: string | undefined;
        if (["template", "css", "js", "other"].includes(type) && size < 500000) {
          try {
            content = await zipEntry.async("string");
            if (type === "template" || type === "other") {
              const tagMatches = content.match(/\[%[^\]]+%\]/g) || [];
              const includeMatches = content.match(/\[!include[^\]]*!\]/g) || [];
              const atTagMatches = content.match(/\[@[^\]]+@\]/g) || [];
              for (const tag of [...tagMatches, ...includeMatches, ...atTagMatches]) {
                baseTags.add(tag);
              }
              const netoApiCalls = content.match(/neto\.api\.|NetoAPI|NETOAPI/g) || [];
              const ajaxCalls = content.match(/\$\.ajax|fetch\(['"]\/do\//g) || [];
              for (const m of [...netoApiCalls, ...ajaxCalls]) {
                unsupportedTags.add(m);
              }
            }
            if (type === "js") {
              const scriptPatterns = content.match(/(jQuery|neto\.|Neto\.|addToCart|updateCart|checkout\.)/g) || [];
              for (const p of scriptPatterns) customScripts.add(p);
            }
          } catch { /* binary file */ }
        }

        files.push({ path, size, type, content: content?.substring(0, 2000) });
      }

      setThemeFiles(files);
      const audit: ThemeAuditResult = {
        totalFiles: files.length,
        templates: files.filter(f => f.type === "template"),
        css: files.filter(f => f.type === "css"),
        js: files.filter(f => f.type === "js"),
        images: files.filter(f => f.type === "image"),
        fonts: files.filter(f => f.type === "font"),
        other: files.filter(f => f.type === "other"),
        baseTags: Array.from(baseTags).sort(),
        unsupportedTags: Array.from(unsupportedTags),
        customScripts: Array.from(customScripts),
      };
      setThemeAudit(audit);
      addLog(`  ✓ Theme parsed: ${files.length} files, ${audit.templates.length} templates, ${baseTags.size} B@SE tags found`);
      if (unsupportedTags.size > 0) {
        addLog(`  ⚠ ${unsupportedTags.size} potentially unsupported API calls detected`);
      }
      toast.success(`Theme parsed: ${files.length} files analyzed`);
    } catch (err: any) {
      addLog(`  ✗ Theme parse error: ${err.message}`);
      toast.error("Failed to parse ZIP file");
    }

    setThemeUploading(false);
  };

  const totalFields = Object.values(results).reduce((sum, r) => sum + r.fields.length, 0);
  const mappedFields = Object.entries(results).reduce((sum, [key, r]) => {
    return sum + r.fields.filter(f => getFieldStatus(key, f).status === "mapped").length;
  }, 0);
  const missingFields = Object.entries(results).reduce((sum, [key, r]) => {
    return sum + r.fields.filter(f => getFieldStatus(key, f).status === "missing").length;
  }, 0);
  const criticalFields = Object.entries(results).reduce((sum, [key, r]) => {
    return sum + r.fields.filter(f => getFieldStatus(key, f).status === "critical").length;
  }, 0);

  const exportAuditJSON = () => {
    const data = {
      store: storeDomain,
      auditDate: reportDate || new Date().toISOString(),
      entities: results,
      themeAudit,
      summary: { totalFields, mappedFields, missingFields, criticalFields },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `maropost-api-audit-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit exported");
  };

  // Get critical findings for summary
  const getCriticalFindings = (): { entity: string; field: string; issue: string }[] => {
    const findings: { entity: string; field: string; issue: string }[] = [];
    
    // Customer name issue
    if (results.customers) {
      const customerFields = results.customers.fields;
      const hasName = customerFields.some(f => f === "Name" || f === "Surname" || f === "FirstName");
      const hasBillName = customerFields.some(f => f.includes("BillFirstName"));
      if (!hasName && hasBillName) {
        findings.push({
          entity: "Customers",
          field: "Name / Surname",
          issue: "NOT returned as top-level fields. Customer names only exist inside BillingAddress.BillFirstName/BillLastName. Import must extract from billing address.",
        });
      }
      const hasPhone = customerFields.some(f => f === "Phone" || f === "Mobile");
      if (!hasPhone) {
        findings.push({
          entity: "Customers",
          field: "Phone / Mobile",
          issue: "NOT returned as top-level fields. Phone only exists in BillingAddress.BillPhone.",
        });
      }
      const hasCompany = customerFields.some(f => f === "CompanyName");
      if (!hasCompany) {
        findings.push({
          entity: "Customers",
          field: "CompanyName",
          issue: "NOT returned as top-level field. Company only exists in BillingAddress.BillCompany.",
        });
      }
    }
    
    // Orders missing Status/TaxTotal
    if (results.orders) {
      const orderFields = results.orders.fields;
      if (!orderFields.includes("Status")) {
        findings.push({
          entity: "Orders",
          field: "Status",
          issue: "Not returned by API despite being in OutputSelector. Orders imported without status.",
        });
      }
      if (!orderFields.includes("TaxTotal")) {
        findings.push({
          entity: "Orders",
          field: "TaxTotal",
          issue: "Not returned by API. Tax amounts not imported.",
        });
      }
      if (!orderFields.includes("DiscountTotal")) {
        findings.push({
          entity: "Orders",
          field: "DiscountTotal",
          issue: "Not returned by API. Discount amounts not imported.",
        });
      }
    }

    // Vouchers error
    if (results.vouchers?.error || (results.vouchers?.rawData?.Ack === "Error")) {
      findings.push({
        entity: "Vouchers",
        field: "ALL",
        issue: "API returns error — needs different OutputSelector fields (e.g., VoucherID, Code, Balance).",
      });
    }

    // Currency error
    if (results.currency?.error || (results.currency?.rawData?.Ack === "Error")) {
      findings.push({
        entity: "Currency",
        field: "ALL",
        issue: "API returns internal server error. Currency data cannot be fetched.",
      });
    }

    // Suppliers/Warehouses minimal data
    if (results.suppliers && results.suppliers.fields.length <= 2) {
      findings.push({
        entity: "Suppliers",
        field: "SupplierName, Contact, Email",
        issue: "Only ID/SupplierID returned. Need to add SupplierName, ContactName, Email to OutputSelector.",
      });
    }

    if (results.rma && results.rma.fields.length <= 1) {
      findings.push({
        entity: "Returns/RMA",
        field: "OrderID, Status, Reason",
        issue: "Only RmaID returned. Need to add OrderID, Status, Reason, DateIssued to OutputSelector.",
      });
    }

    if (results.payments && results.payments.fields.length <= 3) {
      findings.push({
        entity: "Payments",
        field: "Amount, PaymentMethod, DatePaid",
        issue: "Only ID/PaymentID/OrderID returned. Need to add Amount, PaymentMethod, DatePaid to OutputSelector.",
      });
    }

    return findings;
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Maropost API Audit Log</h1>
            <p className="text-sm text-muted-foreground">
              Full field-by-field audit of <strong>toolsinabox.com.au</strong> — comparing API data against our database schema
            </p>
            {reportDate && (
              <p className="text-xs text-muted-foreground mt-1">
                Report date: {new Date(reportDate).toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <input
              ref={importInputRef}
              type="file"
              accept=".json"
              onChange={handleImportReport}
              className="hidden"
            />
            <Button variant="outline" size="sm" onClick={() => importInputRef.current?.click()}>
              <FileUp className="h-4 w-4 mr-2" />Import Report
            </Button>
            {Object.keys(results).length > 0 && (
              <Button variant="outline" size="sm" onClick={exportAuditJSON}>
                <Download className="h-4 w-4 mr-2" />Export JSON
              </Button>
            )}
          </div>
        </div>

        {/* Run Audit */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium">Store: <code className="bg-muted px-2 py-0.5 rounded text-xs">{storeDomain}</code></p>
                <p className="text-xs text-muted-foreground">API Key: {apiKey.substring(0, 8)}...{apiKey.substring(apiKey.length - 4)}</p>
              </div>
              <Button onClick={runFullAudit} disabled={loading} size="lg">
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                {loading ? `Auditing ${currentEntity}...` : "Run Full API Audit"}
              </Button>
            </div>
            {loading && (
              <div className="mt-3 space-y-1">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground">Fetching {currentEntity}... ({progress}%)</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Critical Findings Alert */}
        {Object.keys(results).length > 0 && getCriticalFindings().length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-bold mb-2">🚨 {getCriticalFindings().length} Critical Issues Found</p>
              <div className="space-y-2">
                {getCriticalFindings().map((f, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-semibold">{f.entity} → {f.field}:</span>{" "}
                    <span>{f.issue}</span>
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        {Object.keys(results).length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{Object.keys(results).length}</p>
                <p className="text-xs text-muted-foreground">Endpoints</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{totalFields}</p>
                <p className="text-xs text-muted-foreground">Total Fields</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{mappedFields}</p>
                <p className="text-xs text-muted-foreground">Mapped ✓</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-yellow-600">{totalFields - mappedFields - missingFields - criticalFields}</p>
                <p className="text-xs text-muted-foreground">Partial</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-destructive">{missingFields}</p>
                <p className="text-xs text-muted-foreground">Missing ✗</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-orange-600">{criticalFields}</p>
                <p className="text-xs text-muted-foreground">Critical ⚠</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        {Object.keys(results).length > 0 && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              {ENTITY_CONFIG.map(e => (
                results[e.key] && (
                  <TabsTrigger key={e.key} value={e.key} className="gap-1">
                    {e.icon}{e.label}
                    {results[e.key]?.error && <XCircle className="h-3 w-3 text-destructive" />}
                  </TabsTrigger>
                )
              ))}
              <TabsTrigger value="theme" className="gap-1"><Palette className="h-4 w-4" />Theme</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Entity Summary</CardTitle>
                  <CardDescription>Quick view of all API endpoints and their field mapping coverage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Entity</TableHead>
                          <TableHead>Records</TableHead>
                          <TableHead>Fields</TableHead>
                          <TableHead>Mapped</TableHead>
                          <TableHead>Missing</TableHead>
                          <TableHead>Coverage</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ENTITY_CONFIG.map(e => {
                          const r = results[e.key];
                          if (!r) return null;
                          const mapped = r.fields.filter(f => getFieldStatus(e.key, f).status === "mapped").length;
                          const missing = r.fields.filter(f => getFieldStatus(e.key, f).status === "missing").length;
                          const critical = r.fields.filter(f => getFieldStatus(e.key, f).status === "critical").length;
                          const coverage = r.fields.length > 0 ? Math.round((mapped / r.fields.length) * 100) : 0;
                          return (
                            <TableRow key={e.key} className="cursor-pointer hover:bg-muted/50" onClick={() => setActiveTab(e.key)}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">{e.icon}{e.label}</div>
                              </TableCell>
                              <TableCell>{r.error ? <span className="text-destructive text-xs">{r.error}</span> : r.count}</TableCell>
                              <TableCell>{r.fields.length}</TableCell>
                              <TableCell className="text-green-600">{mapped}</TableCell>
                              <TableCell className="text-destructive">{missing}{critical > 0 && <span className="text-orange-600 ml-1">({critical} ⚠)</span>}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Progress value={coverage} className="h-2 w-20" />
                                  <span className="text-xs">{coverage}%</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {r.error ? (
                                  <Badge variant="destructive" className="text-xs">Error</Badge>
                                ) : critical > 0 ? (
                                  <Badge className="bg-orange-600 text-xs">Critical</Badge>
                                ) : coverage >= 80 ? (
                                  <Badge className="bg-green-600 text-xs">Good</Badge>
                                ) : coverage >= 50 ? (
                                  <Badge variant="secondary" className="text-xs">Partial</Badge>
                                ) : (
                                  <Badge variant="destructive" className="text-xs">Low</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Entity Detail Tabs */}
            {ENTITY_CONFIG.map(e => {
              const r = results[e.key];
              if (!r) return null;
              return (
                <TabsContent key={e.key} value={e.key}>
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">{e.icon}{e.label} — Field Mapping Audit</CardTitle>
                        <CardDescription>
                          {r.count} sample records fetched, {r.fields.length} unique fields detected
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {r.error ? (
                          <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{r.error}</AlertDescription>
                          </Alert>
                        ) : r.rawData?.Ack === "Error" ? (
                          <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              <p className="font-bold">API Error</p>
                              <p className="text-sm mt-1">{r.rawData?.Messages?.Error?.Description || "Unknown error"}</p>
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <div className="rounded-lg border overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-8">Status</TableHead>
                                  <TableHead>Maropost API Field</TableHead>
                                  <TableHead><ArrowRight className="h-4 w-4 inline" /></TableHead>
                                  <TableHead>Our DB Field</TableHead>
                                  <TableHead>Sample Value</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {r.fields.filter(f => !f.includes("[0]") || f.split("[0]").length <= 2).map(field => {
                                  const { status, target } = getFieldStatus(e.key, field);
                                  const sampleVal = r.sampleItem ? getNestedValue(r.sampleItem, field) : undefined;
                                  return (
                                    <TableRow key={field} className={
                                      status === "critical" ? "bg-orange-50/50 dark:bg-orange-900/10" :
                                      status === "missing" ? "bg-destructive/5" :
                                      status === "partial" ? "bg-yellow-50/50 dark:bg-yellow-900/10" : ""
                                    }>
                                      <TableCell>
                                        {status === "mapped" ? <CheckCircle className="h-4 w-4 text-green-500" /> :
                                         status === "partial" ? <AlertTriangle className="h-4 w-4 text-yellow-500" /> :
                                         status === "critical" ? <AlertTriangle className="h-4 w-4 text-orange-500" /> :
                                         <XCircle className="h-4 w-4 text-destructive" />}
                                      </TableCell>
                                      <TableCell className="font-mono text-xs">{field}</TableCell>
                                      <TableCell><ArrowRight className="h-3 w-3 text-muted-foreground" /></TableCell>
                                      <TableCell>
                                        <span className={`font-mono text-xs ${
                                          status === "mapped" ? "text-green-700 dark:text-green-400" :
                                          status === "partial" ? "text-yellow-700 dark:text-yellow-400" :
                                          status === "critical" ? "text-orange-700 dark:text-orange-400 font-bold" :
                                          "text-destructive font-bold"
                                        }`}>
                                          {target}
                                        </span>
                                      </TableCell>
                                      <TableCell className="max-w-[300px] truncate text-xs text-muted-foreground font-mono">
                                        {renderValue(sampleVal)}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Raw JSON */}
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm flex items-center gap-2"><Terminal className="h-4 w-4" />Raw API Response (Sample)</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <ScrollArea className="h-64">
                          <pre className="p-4 text-xs font-mono bg-muted/30 whitespace-pre-wrap break-all">
                            {JSON.stringify(r.sampleItem, null, 2) || "No data"}
                          </pre>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              );
            })}

            {/* Theme Tab */}
            <TabsContent value="theme">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FolderArchive className="h-5 w-5" />Theme ZIP Upload & Audit</CardTitle>
                    <CardDescription>
                      Upload your Maropost theme ZIP file to audit template compatibility, B@SE tags, and asset coverage
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        Export your theme from Maropost: <strong>Settings → Design → Themes → Export</strong>. Upload the ZIP file here for a full compatibility audit.
                      </AlertDescription>
                    </Alert>

                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label htmlFor="theme-zip">Theme ZIP File</Label>
                        <Input
                          id="theme-zip"
                          type="file"
                          accept=".zip"
                          onChange={handleThemeUpload}
                          disabled={themeUploading}
                          className="mt-1"
                        />
                      </div>
                      {themeUploading && <Loader2 className="h-5 w-5 animate-spin text-primary mt-6" />}
                    </div>
                  </CardContent>
                </Card>

                {themeAudit && (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                      {[
                        { label: "Total Files", count: themeAudit.totalFiles, color: "text-foreground" },
                        { label: "Templates", count: themeAudit.templates.length, color: "text-blue-600" },
                        { label: "CSS Files", count: themeAudit.css.length, color: "text-purple-600" },
                        { label: "JS Files", count: themeAudit.js.length, color: "text-yellow-600" },
                        { label: "Images", count: themeAudit.images.length, color: "text-green-600" },
                        { label: "Fonts", count: themeAudit.fonts.length, color: "text-pink-600" },
                      ].map(item => (
                        <Card key={item.label}>
                          <CardContent className="p-3 text-center">
                            <p className={`text-xl font-bold ${item.color}`}>{item.count}</p>
                            <p className="text-xs text-muted-foreground">{item.label}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm">B@SE Template Tags Detected ({themeAudit.baseTags.length})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-1">
                          {themeAudit.baseTags.map((tag, i) => (
                            <Badge key={i} variant="secondary" className="font-mono text-xs">{tag}</Badge>
                          ))}
                          {themeAudit.baseTags.length === 0 && (
                            <p className="text-sm text-muted-foreground">No B@SE tags found — this may not be a Maropost theme</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {(themeAudit.unsupportedTags.length > 0 || themeAudit.customScripts.length > 0) && (
                      <Card className="border-yellow-200">
                        <CardHeader className="py-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />Compatibility Warnings
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {themeAudit.unsupportedTags.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-destructive mb-1">Unsupported API Calls:</p>
                              <div className="flex flex-wrap gap-1">
                                {themeAudit.unsupportedTags.map((tag, i) => (
                                  <Badge key={i} variant="destructive" className="font-mono text-xs">{tag}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {themeAudit.customScripts.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-yellow-700 mb-1">Custom JS Dependencies:</p>
                              <div className="flex flex-wrap gap-1">
                                {themeAudit.customScripts.map((s, i) => (
                                  <Badge key={i} variant="secondary" className="font-mono text-xs">{s}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm">All Theme Files</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <ScrollArea className="h-64">
                          <div className="rounded-lg border overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>File Path</TableHead>
                                  <TableHead>Type</TableHead>
                                  <TableHead>Size</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {themeFiles.map((f, i) => (
                                  <TableRow key={i}>
                                    <TableCell className="font-mono text-xs max-w-[400px] truncate">{f.path}</TableCell>
                                    <TableCell>
                                      <Badge variant="secondary" className="text-xs capitalize">{f.type}</Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                      {f.size > 1024 * 1024 ? `${(f.size / 1024 / 1024).toFixed(1)}MB` : `${Math.round(f.size / 1024)}KB`}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Log Console */}
        {logs.length > 0 && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2"><Terminal className="h-4 w-4" />Audit Log</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-36 rounded-b-lg">
                <div className="p-4 font-mono text-xs space-y-0.5 bg-muted/30">
                  {logs.map((log, i) => (
                    <div key={i} className={`${log.includes("✗") ? "text-destructive" : log.includes("✓") ? "text-green-600" : log.includes("═══") ? "font-bold text-foreground" : log.includes("⚠") ? "text-yellow-600" : log.includes("🚨") ? "text-orange-600 font-bold" : "text-muted-foreground"}`}>
                      {log}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}

function getNestedValue(obj: any, path: string): any {
  const parts = path.replace(/\[\d+\]/g, ".0").split(".");
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
}
