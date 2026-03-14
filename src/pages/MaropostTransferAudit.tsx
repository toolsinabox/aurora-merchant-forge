import { useState, useMemo, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, CheckCircle, XCircle, AlertTriangle, Clock, ArrowRight,
  Package, Users, ShoppingCart, Layers, FileText, Palette, Globe,
  Truck, Gift, CreditCard, Warehouse, Star, Settings, Shield,
  RefreshCw, Code2, Mail, BarChart3, Puzzle, Smartphone, Image,
  Zap, Heart, DollarSign, Key, Percent, Navigation, MapPin,
  Calculator, Repeat, Archive, Boxes, Bell, List, Monitor, Activity,
} from "lucide-react";

type TransferStatus = "supported" | "partial" | "planned" | "not_available";

interface TransferItem {
  feature: string;
  maropostName: string;
  celoraEquivalent: string;
  status: TransferStatus;
  apiEndpoint: string;
  notes: string;
  category: string;
}

const STATUS_CONFIG: Record<TransferStatus, { label: string; color: string; icon: React.ReactNode }> = {
  supported: { label: "Full Transfer", color: "bg-green-500/10 text-green-700 border-green-200", icon: <CheckCircle className="h-3.5 w-3.5" /> },
  partial: { label: "Partial Transfer", color: "bg-yellow-500/10 text-yellow-700 border-yellow-200", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  planned: { label: "Planned", color: "bg-blue-500/10 text-blue-700 border-blue-200", icon: <Clock className="h-3.5 w-3.5" /> },
  not_available: { label: "Manual Only", color: "bg-red-500/10 text-red-700 border-red-200", icon: <XCircle className="h-3.5 w-3.5" /> },
};

const TRANSFER_ITEMS: TransferItem[] = [
  // Products & Catalog
  { feature: "Products (Simple)", maropostName: "GetItem / AddItem", celoraEquivalent: "products", status: "supported", apiEndpoint: "GetItem", notes: "Full field mapping including SKU, name, description, price, cost, weight, dimensions", category: "Catalog" },
  { feature: "Product Variants", maropostName: "GetItem (VariantInventory)", celoraEquivalent: "product_variants", status: "supported", apiEndpoint: "GetItem", notes: "Variant SKUs, prices, stock quantities transferred", category: "Catalog" },
  { feature: "Product Images", maropostName: "GetItem (Images)", celoraEquivalent: "product_images", status: "supported", apiEndpoint: "GetItem", notes: "All product images downloaded and re-hosted", category: "Catalog" },
  { feature: "Product Specifics", maropostName: "GetItem (ItemSpecifics)", celoraEquivalent: "product_specifics", status: "supported", apiEndpoint: "GetItem", notes: "Custom attributes/specifications mapped to our specifics system", category: "Catalog" },
  { feature: "Product SEO Fields", maropostName: "SEOPageTitle, SEOMetaDescription", celoraEquivalent: "products (seo_*)", status: "supported", apiEndpoint: "GetItem", notes: "SEO title, description, page heading, URL slug", category: "Catalog" },
  { feature: "Product Pricing Tiers", maropostName: "PriceGroups", celoraEquivalent: "product_pricing_tiers", status: "supported", apiEndpoint: "GetItem", notes: "Multi-tier pricing and group-based pricing transferred", category: "Catalog" },
  { feature: "Product Relations", maropostName: "CrossSellProducts, UpsellProducts", celoraEquivalent: "product_relations", status: "supported", apiEndpoint: "GetItem", notes: "Cross-sell and up-sell product links", category: "Catalog" },
  { feature: "Product Shipping Dimensions", maropostName: "ShippingLength/Width/Height/Weight", celoraEquivalent: "product_shipping", status: "supported", apiEndpoint: "GetItem", notes: "Physical dimensions, cubic weight, shipping weight", category: "Catalog" },
  { feature: "Product Scheduling", maropostName: "DateAdded, Approved, IsActive", celoraEquivalent: "products (schedule_*)", status: "supported", apiEndpoint: "GetItem", notes: "Active/inactive status and visibility scheduling", category: "Catalog" },
  { feature: "Product Tags", maropostName: "Tags, SearchKeywords", celoraEquivalent: "products (tags)", status: "supported", apiEndpoint: "GetItem", notes: "Tags and search keywords mapped", category: "Catalog" },
  { feature: "Digital Downloads", maropostName: "ContentFileIdentifier", celoraEquivalent: "product_downloads", status: "partial", apiEndpoint: "GetItem", notes: "File references transferred; files need manual re-upload", category: "Catalog" },
  { feature: "eBay Product IDs", maropostName: "eBayProductIDs", celoraEquivalent: "marketplace_listings", status: "partial", apiEndpoint: "GetItem", notes: "eBay listing references stored for reconnection", category: "Catalog" },

  // Categories
  { feature: "Categories", maropostName: "GetCategory", celoraEquivalent: "categories", status: "supported", apiEndpoint: "GetCategory", notes: "Full hierarchy with parent/child relationships preserved", category: "Categories" },
  { feature: "Category SEO", maropostName: "SEOPageTitle, SEOMetaDescription", celoraEquivalent: "categories (seo_*)", status: "supported", apiEndpoint: "GetCategory", notes: "SEO fields mapped 1:1", category: "Categories" },
  { feature: "Category Sorting", maropostName: "SortOrder", celoraEquivalent: "categories (sort_order)", status: "supported", apiEndpoint: "GetCategory", notes: "Sort order preserved", category: "Categories" },
  { feature: "Category Filtering", maropostName: "AllowFiltering", celoraEquivalent: "categories (auto_rules)", status: "supported", apiEndpoint: "GetCategory", notes: "Filter settings converted to auto-rules", category: "Categories" },

  // Orders
  { feature: "Orders / Invoices", maropostName: "GetOrder", celoraEquivalent: "orders", status: "supported", apiEndpoint: "GetOrder", notes: "Order header, line items, addresses, totals, dates", category: "Orders" },
  { feature: "Order Line Items", maropostName: "GetOrder (OrderLine)", celoraEquivalent: "order_items", status: "supported", apiEndpoint: "GetOrder", notes: "All line items with quantities, prices, tax", category: "Orders" },
  { feature: "Order Payments", maropostName: "GetPayment / OrderPayment", celoraEquivalent: "order_payments", status: "supported", apiEndpoint: "GetPayment", notes: "Payment records linked to orders", category: "Orders" },
  { feature: "Order Statuses", maropostName: "Status field", celoraEquivalent: "orders (status)", status: "supported", apiEndpoint: "GetOrder", notes: "Status mapping: New→pending, Pick→processing, Pack→processing, Ship→shipped, etc.", category: "Orders" },
  { feature: "Order Notes", maropostName: "InternalOrderNotes", celoraEquivalent: "order_notes", status: "supported", apiEndpoint: "GetOrder", notes: "Internal notes preserved", category: "Orders" },
  { feature: "Shipping Addresses", maropostName: "ShipAddress", celoraEquivalent: "customer_addresses", status: "supported", apiEndpoint: "GetOrder", notes: "Ship-to addresses from orders", category: "Orders" },
  { feature: "Billing Addresses", maropostName: "BillAddress", celoraEquivalent: "customer_addresses", status: "supported", apiEndpoint: "GetOrder", notes: "Bill-to addresses from orders", category: "Orders" },
  { feature: "Sales Channel Attribution", maropostName: "SalesChannel", celoraEquivalent: "sales_channels", status: "supported", apiEndpoint: "GetOrder", notes: "Channel origin (web, POS, eBay, etc.) preserved", category: "Orders" },

  // Customers
  { feature: "Customers", maropostName: "GetCustomer", celoraEquivalent: "customers", status: "supported", apiEndpoint: "GetCustomer", notes: "Name, email, phone, company, ABN, type, newsletter status", category: "Customers" },
  { feature: "Customer Addresses", maropostName: "BillingAddress, ShippingAddress", celoraEquivalent: "customer_addresses", status: "supported", apiEndpoint: "GetCustomer", notes: "All stored addresses transferred", category: "Customers" },
  { feature: "Customer Groups", maropostName: "UserGroup", celoraEquivalent: "customer_groups", status: "supported", apiEndpoint: "GetCustomer", notes: "Group memberships and pricing tiers", category: "Customers" },
  { feature: "Customer Communication Logs", maropostName: "CustomerLog", celoraEquivalent: "customer_communications", status: "supported", apiEndpoint: "GetCustomer", notes: "Communication history preserved", category: "Customers" },
  { feature: "Account Balances", maropostName: "AccountBalance, AvailableCredit", celoraEquivalent: "customers (credit_limit)", status: "supported", apiEndpoint: "GetCustomer", notes: "Credit limits and balances transferred", category: "Customers" },
  { feature: "Customer Passwords", maropostName: "N/A (hashed)", celoraEquivalent: "N/A", status: "not_available", apiEndpoint: "N/A", notes: "Passwords cannot be migrated; customers must reset via email", category: "Customers" },

  // Content
  { feature: "Content Pages", maropostName: "GetContent", celoraEquivalent: "content_pages", status: "supported", apiEndpoint: "GetContent", notes: "Pages, blogs, custom content with HTML body", category: "Content" },
  { feature: "Content SEO", maropostName: "SEOPageTitle, SEOMetaDescription", celoraEquivalent: "content_pages (seo_*)", status: "supported", apiEndpoint: "GetContent", notes: "All SEO metadata transferred", category: "Content" },
  { feature: "Content Hierarchy", maropostName: "ParentContentID", celoraEquivalent: "content_pages", status: "supported", apiEndpoint: "GetContent", notes: "Parent/child page structure preserved", category: "Content" },
  { feature: "Blog Posts", maropostName: "GetContent (ContentType=blog)", celoraEquivalent: "content_pages (page_type=blog)", status: "supported", apiEndpoint: "GetContent", notes: "Blog entries with author, dates, content", category: "Content" },

  // Templates & Theme
  { feature: "B@SE Templates", maropostName: "Template files", celoraEquivalent: "store_templates", status: "partial", apiEndpoint: "Manual/FTP", notes: "B@SE tags auto-converted; complex logic may need review", category: "Theme" },
  { feature: "Header Template", maropostName: "header.template.html", celoraEquivalent: "header template", status: "supported", apiEndpoint: "Template Export", notes: "Navigation, logo, search bar structure preserved", category: "Theme" },
  { feature: "Footer Template", maropostName: "footer.template.html", celoraEquivalent: "footer template", status: "supported", apiEndpoint: "Template Export", notes: "Footer links, copyright, newsletter signup", category: "Theme" },
  { feature: "Product Page Template", maropostName: "product.template.html", celoraEquivalent: "product template", status: "supported", apiEndpoint: "Template Export", notes: "Product layout, gallery, add-to-cart, tabs", category: "Theme" },
  { feature: "Category Page Template", maropostName: "category.template.html", celoraEquivalent: "category template", status: "supported", apiEndpoint: "Template Export", notes: "Product grid, filters, sorting, pagination", category: "Theme" },
  { feature: "Cart Template", maropostName: "cart.template.html", celoraEquivalent: "cart template", status: "supported", apiEndpoint: "Template Export", notes: "Cart layout, line items, totals", category: "Theme" },
  { feature: "Checkout Template", maropostName: "checkout.template.html", celoraEquivalent: "checkout template", status: "supported", apiEndpoint: "Template Export", notes: "Multi-step checkout flow", category: "Theme" },
  { feature: "Custom CSS", maropostName: "style.css / custom.css", celoraEquivalent: "store_settings (custom_css)", status: "supported", apiEndpoint: "Template Export", notes: "CSS preserved and applied as custom overrides", category: "Theme" },
  { feature: "Custom JavaScript", maropostName: "scripts.js", celoraEquivalent: "store_settings (custom_js)", status: "partial", apiEndpoint: "Template Export", notes: "Scripts included; Neto-specific JS may need adaptation", category: "Theme" },
  { feature: "Email Templates", maropostName: "Email printable files", celoraEquivalent: "email_templates", status: "partial", apiEndpoint: "Manual", notes: "HTML email templates converted; merge tags remapped", category: "Theme" },
  { feature: "Invoice/Printable Templates", maropostName: "Printable templates", celoraEquivalent: "print templates", status: "partial", apiEndpoint: "Manual", notes: "Print layouts adapted to our print system", category: "Theme" },
  { feature: "Design Tweaks", maropostName: "Tweak settings", celoraEquivalent: "store_settings", status: "partial", apiEndpoint: "Manual", notes: "Colors, fonts, layout settings mapped to theme builder", category: "Theme" },

  // Shipping & Tax
  { feature: "Shipping Methods", maropostName: "GetShippingMethods", celoraEquivalent: "shipping_zones", status: "supported", apiEndpoint: "GetShippingMethods", notes: "Flat rate, weight-based, zone-based rules", category: "Shipping & Tax" },
  { feature: "Shipping Zones", maropostName: "Zone configuration", celoraEquivalent: "shipping_zones", status: "partial", apiEndpoint: "Manual", notes: "Zone definitions; complex rate tables need review", category: "Shipping & Tax" },
  { feature: "Tax Settings", maropostName: "TaxCategory, TaxFreeItem", celoraEquivalent: "tax_rates", status: "supported", apiEndpoint: "GetItem", notes: "GST/tax categories and exemptions", category: "Shipping & Tax" },

  // Gift Vouchers & Coupons
  { feature: "Gift Vouchers", maropostName: "GetVoucher", celoraEquivalent: "gift_vouchers", status: "supported", apiEndpoint: "GetVoucher", notes: "Voucher codes, balances, expiry dates", category: "Marketing" },
  { feature: "Coupon Codes", maropostName: "Coupon system", celoraEquivalent: "coupons", status: "partial", apiEndpoint: "Manual", notes: "Active coupons transferred; expired ones optional", category: "Marketing" },

  // Returns
  { feature: "RMA / Returns", maropostName: "GetRma", celoraEquivalent: "returns", status: "supported", apiEndpoint: "GetRma", notes: "Return requests, statuses, refund info", category: "Returns" },

  // Suppliers & Purchasing
  { feature: "Suppliers", maropostName: "GetSupplier", celoraEquivalent: "suppliers", status: "supported", apiEndpoint: "GetSupplier", notes: "Supplier details, lead times, contact info", category: "Purchasing" },
  { feature: "Purchase Orders", maropostName: "PO system", celoraEquivalent: "purchase_orders", status: "partial", apiEndpoint: "Manual", notes: "Open POs transferred; historical optional", category: "Purchasing" },

  // Warehouses
  { feature: "Warehouses", maropostName: "GetWarehouse", celoraEquivalent: "inventory_locations", status: "supported", apiEndpoint: "GetWarehouse", notes: "Warehouse names, addresses, stock levels per location", category: "Inventory" },
  { feature: "Stock Levels", maropostName: "WarehouseQuantity", celoraEquivalent: "inventory_stock", status: "supported", apiEndpoint: "GetItem", notes: "Per-warehouse stock quantities", category: "Inventory" },

  // System & Config
  { feature: "Currency Settings", maropostName: "GetCurrency", celoraEquivalent: "currencies", status: "supported", apiEndpoint: "GetCurrency", notes: "Active currencies and exchange rates", category: "System" },
  { feature: "Webhook Subscriptions", maropostName: "Notification Events", celoraEquivalent: "webhooks", status: "partial", apiEndpoint: "Manual", notes: "Webhook URLs documented for re-registration", category: "System" },
  { feature: "301 Redirects", maropostName: "URL redirects", celoraEquivalent: "redirects", status: "supported", apiEndpoint: "Manual/Export", notes: "All redirects preserved for SEO continuity", category: "System" },
  { feature: "Staff Users", maropostName: "Staff accounts", celoraEquivalent: "user_roles", status: "not_available", apiEndpoint: "N/A", notes: "Staff must be re-invited; passwords cannot be migrated", category: "System" },
  { feature: "Add-on Configurations", maropostName: "Installed add-ons", celoraEquivalent: "addon_catalog", status: "not_available", apiEndpoint: "N/A", notes: "Third-party add-ons must be reconfigured", category: "System" },
  { feature: "Accounting Integration", maropostName: "Xero/MYOB config", celoraEquivalent: "accounting integration", status: "not_available", apiEndpoint: "N/A", notes: "Must reconnect accounting software with new credentials", category: "System" },
];

const CATEGORIES = [...new Set(TRANSFER_ITEMS.map(i => i.category))];

export default function MaropostTransferAudit() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return TRANSFER_ITEMS.filter(item => {
      const matchSearch = !search || 
        item.feature.toLowerCase().includes(search.toLowerCase()) ||
        item.maropostName.toLowerCase().includes(search.toLowerCase()) ||
        item.notes.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || item.status === statusFilter;
      const matchCategory = categoryFilter === "all" || item.category === categoryFilter;
      return matchSearch && matchStatus && matchCategory;
    });
  }, [search, statusFilter, categoryFilter]);

  const stats = useMemo(() => ({
    total: TRANSFER_ITEMS.length,
    supported: TRANSFER_ITEMS.filter(i => i.status === "supported").length,
    partial: TRANSFER_ITEMS.filter(i => i.status === "partial").length,
    planned: TRANSFER_ITEMS.filter(i => i.status === "planned").length,
    not_available: TRANSFER_ITEMS.filter(i => i.status === "not_available").length,
  }), []);

  const coveragePercent = Math.round(((stats.supported + stats.partial * 0.5) / stats.total) * 100);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Maropost Transfer Audit</h1>
            <p className="text-sm text-muted-foreground">
              Complete mapping of Maropost Commerce Cloud features and their transfer status to our platform
            </p>
          </div>
          <Button onClick={() => window.location.href = window.location.pathname.replace("maropost-transfer-audit", "maropost-migration")}>
            <ArrowRight className="h-4 w-4 mr-2" />
            Start Migration
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-foreground">{stats.total}</p>
              <p className="text-2xs text-muted-foreground">Total Features</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{stats.supported}</p>
              <p className="text-2xs text-muted-foreground">Full Transfer</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-yellow-600">{stats.partial}</p>
              <p className="text-2xs text-muted-foreground">Partial Transfer</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.planned}</p>
              <p className="text-2xs text-muted-foreground">Planned</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{stats.not_available}</p>
              <p className="text-2xs text-muted-foreground">Manual Only</p>
            </CardContent>
          </Card>
        </div>

        {/* Coverage Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Migration Coverage</span>
              <span className="text-lg font-bold text-primary">{coveragePercent}%</span>
            </div>
            <Progress value={coveragePercent} className="h-3" />
            <p className="text-2xs text-muted-foreground mt-2">
              {stats.supported} fully supported + {stats.partial} partially supported out of {stats.total} total Maropost features
            </p>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search features…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground">{filtered.length} features shown</p>

        {/* Feature List by Category */}
        {CATEGORIES.filter(cat => categoryFilter === "all" || cat === categoryFilter).map(category => {
          const catItems = filtered.filter(i => i.category === category);
          if (catItems.length === 0) return null;

          return (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{category}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {catItems.map((item, idx) => {
                    const sc = STATUS_CONFIG[item.status];
                    return (
                      <div key={idx} className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors">
                        <div className="mt-0.5">{sc.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{item.feature}</span>
                            <Badge variant="outline" className={`text-2xs ${sc.color}`}>{sc.label}</Badge>
                          </div>
                          <div className="flex gap-4 mt-1 text-2xs text-muted-foreground">
                            <span>Maropost: <code className="bg-muted px-1 rounded">{item.maropostName}</code></span>
                            <span>→ Celora: <code className="bg-muted px-1 rounded">{item.celoraEquivalent}</code></span>
                            {item.apiEndpoint !== "N/A" && item.apiEndpoint !== "Manual" && (
                              <span>API: <code className="bg-muted px-1 rounded">{item.apiEndpoint}</code></span>
                            )}
                          </div>
                          <p className="text-2xs text-muted-foreground mt-1">{item.notes}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AdminLayout>
  );
}
