import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CheckCircle, Circle, Clock, Search, BarChart3, Package, ShoppingCart,
  Users, Truck, Settings, Globe, Megaphone, CreditCard, FileText,
  Layers, Shield, Zap, Database, Store, Palette, Mail, Boxes,
  Receipt, BookOpen, Headphones, Smartphone, Repeat, Tag, Gift, Sparkles, Puzzle, UserPlus, ClipboardCopy, ClipboardCheck,
  ChevronDown, MapPin, Warehouse, PenTool, FileCode, Link, Image,
  AlertTriangle, DollarSign, Percent, Printer, Share2, Code,
  LayoutDashboard, Bell, Upload, Download, UserCheck, Key, Eye,
  MessageSquare, Star, Heart, RefreshCw, Scissors, ShieldCheck,
  HardDrive, Monitor, Workflow, Building, ArrowLeftRight,
  Banknote, Scale, FileSearch, ListChecks, Milestone, Timer, ToggleLeft, Fingerprint, Grip, Cable, Tv,
} from "lucide-react";

type Status = "done" | "partial" | "not_started";

interface Feature {
  name: string;
  description: string;
  status: Status;
  notes?: string;
}

interface FeatureCategory {
  category: string;
  icon: React.ReactNode;
  features: Feature[];
}

// ────────────────────────────────────────────────────
// COMPREHENSIVE MAROPOST / NETO FEATURE AUDIT
// Source: Maropost API docs, Neto template structure,
// system emails, control panel, add-ons, & marketing site
// ────────────────────────────────────────────────────

const featureData: FeatureCategory[] = [
  // ═══════ 1. PRODUCT MANAGEMENT — CORE ═══════
  {
    category: "Product Management — Core",
    icon: <Package className="h-5 w-5" />,
    features: [
      { name: "Product CRUD (AddItem / UpdateItem / GetItem)", description: "Create, read, update, delete products via API", status: "done" },
      { name: "Product Variants (Variations)", description: "Parent/child SKU with size, color, option-based variants", status: "done" },
      { name: "Product Images (multiple)", description: "Multiple image upload, reorder, gallery with zoom", status: "done" },
      { name: "Product Categories (3-level tree)", description: "Hierarchical categories with parent/child, unlimited depth", status: "done" },
      { name: "Product Tags", description: "Tagging system for filtering and organization", status: "done" },
      { name: "Product SKU / Barcode / Model Number", description: "SKU, barcode, and model number fields per product/variant", status: "done" },
      { name: "Product Status (Active/Draft/Archived)", description: "Manage product lifecycle status", status: "done" },
      { name: "Product Approval Workflow", description: "Approval flag for marketplace/multi-vendor products (is_approved)", status: "done" },
      { name: "Product Brand", description: "Brand field per product", status: "done" },
      { name: "Product Type / Subtype", description: "Product type and subtype classification", status: "done" },
      { name: "Track Inventory Toggle", description: "Per-product toggle for inventory tracking", status: "done" },
      { name: "Is Sold / Is Bought Flags", description: "Control whether product is sold, bought, or both", status: "done" },
      { name: "Is Inventoried Flag", description: "Flag for inventory-tracked vs non-inventoried items", status: "done" },
      { name: "Virtual Product Flag", description: "Mark product as digital/virtual (no shipping required)", status: "done" },
      { name: "Kit / Bundle Products (is_kit)", description: "Bundle products from multiple SKUs", status: "done" },
      { name: "Editable Bundle", description: "Allow customers to customize kit components at checkout", status: "done" },
      { name: "Cost Price / Compare-At Price", description: "Cost price for margin calculation, compare price for display", status: "done" },
      { name: "Promo Price / Promo Schedule", description: "Promotional pricing with start/end dates and promo tag", status: "done" },
      { name: "Custom Label", description: "Custom label field for product (New, Sale, etc.)", status: "done" },
      { name: "Subtitle", description: "Product subtitle field", status: "done" },
      { name: "Short Description", description: "Short product description for listings", status: "done" },
      { name: "Features Field", description: "Bullet-point feature list", status: "done" },
      { name: "Specifications Field", description: "Technical specification text field", status: "done" },
      { name: "Warranty Field", description: "Warranty information per product", status: "done" },
      { name: "Terms & Conditions Field", description: "Per-product terms and conditions text", status: "done" },
      { name: "Internal Notes", description: "Staff-only notes on product (not visible to customers)", status: "done" },
      { name: "Misc Fields (misc1-misc5)", description: "Five custom misc fields for extended product data", status: "done" },
      { name: "Availability Description", description: "Custom stock availability text (e.g. 'Ships in 3-5 days')", status: "done" },
      { name: "Supplier Item Code", description: "Supplier-specific code per product", status: "done" },
      { name: "Auto URL Update", description: "Automatic slug generation from product title", status: "done" },
      { name: "Product Slug / SEO URL", description: "Clean URL slug per product", status: "done" },
    ],
  },

  // ═══════ 2. PRODUCT — PRICING & TIERS ═══════
  {
    category: "Product — Pricing & Tiers",
    icon: <DollarSign className="h-5 w-5" />,
    features: [
      { name: "Base Price", description: "Standard retail price", status: "done" },
      { name: "Compare-At / RRP Price", description: "Was-price for strike-through display", status: "done" },
      { name: "Cost Price", description: "Wholesale/cost price for margin reporting", status: "done" },
      { name: "Promotional Price with Schedule", description: "Time-limited promotional price (promo_start, promo_end)", status: "done" },
      { name: "Tiered / Volume Pricing", description: "Price breaks by quantity (min_quantity tiers)", status: "done" },
      { name: "Customer Group Pricing", description: "Different prices per customer group/user_group", status: "done" },
      { name: "Tax-Free Flag", description: "Mark product as tax exempt", status: "done" },
      { name: "Tax-Inclusive Flag", description: "Price includes tax (vs tax-exclusive)", status: "done" },
      { name: "Preorder Quantity", description: "Quantity available for preorder before stock arrives", status: "done" },
      { name: "P.O.A / Special Order Products", description: "Price On Application — hide price, show 'Contact for Price'", status: "done", notes: "poa boolean on products table, storefront hides price and shows contact CTA" },
      { name: "Multi-Currency Pricing", description: "Display/sell in multiple currencies with conversion rules", status: "done", notes: "currencies table with exchange rates; storefront CurrencySwitcher component converts all prices using selected currency rate; useCurrency hook persists selection in localStorage" },
      { name: "Product Scheduling (Publish/Unpublish)", description: "Schedule products to auto-publish and auto-unpublish at specific dates/times", status: "done", notes: "scheduled_publish_at and scheduled_unpublish_at columns on products table; datetime-local inputs in ProductForm Scheduling card; auto-set status to active/draft at scheduled time" },
    ],
  },

  // ═══════ 3. PRODUCT — SHIPPING DIMENSIONS ═══════
  {
    category: "Product — Shipping & Dimensions",
    icon: <Truck className="h-5 w-5" />,
    features: [
      { name: "Shipping Weight", description: "Product weight for shipping calculations", status: "done" },
      { name: "Shipping Length / Width / Height", description: "Box dimensions for volumetric weight", status: "done" },
      { name: "Shipping Cubic", description: "Calculated cubic volume for freight", status: "done" },
      { name: "Actual Dimensions (L×W×H)", description: "Real product dimensions (vs shipping box)", status: "done" },
      { name: "Flat Rate Shipping Charge", description: "Per-product flat rate shipping override", status: "done" },
      { name: "Shipping Category", description: "Assign product to a shipping category (fragile, oversized, etc.)", status: "done" },
      { name: "Selling Unit / Base Unit / Base Unit Qty", description: "Selling unit vs base unit (e.g., sell by box, base is each)", status: "done" },
      { name: "Cartons", description: "Number of cartons the product ships in", status: "done" },
      { name: "Requires Packaging", description: "Flag for items needing special packaging", status: "done" },
      { name: "Free Shipping Override", description: "Per-product free shipping flag", status: "done", notes: "free_shipping boolean on product_shipping table" },
      { name: "Dangerous Goods Flag", description: "Hazmat/dangerous goods shipping restrictions", status: "done", notes: "dangerous_goods boolean on product_shipping table" },
    ],
  },

  // ═══════ 4. PRODUCT — SPECIFICS & RELATIONS ═══════
  {
    category: "Product — Specifics & Relations",
    icon: <Layers className="h-5 w-5" />,
    features: [
      { name: "Product Specifics (Key-Value Pairs)", description: "Custom attribute pairs (e.g., Material: Cotton)", status: "done" },
      { name: "Product Relations — Cross-Sells", description: "Related products shown on product page", status: "done" },
      { name: "Product Relations — Up-Sells", description: "Higher-value alternatives suggested at checkout", status: "done" },
      { name: "Product Relations — Accessories", description: "Recommended accessories / add-ons", status: "done" },
      { name: "Product Relations — Related", description: "General related products", status: "done" },
      { name: "Child Products", description: "Parent-child product hierarchy (non-variant children)", status: "done", notes: "Child/accessory products from product_relations displayed as 'Included Components' grid on storefront product detail page" },
      { name: "Editable Kit Components", description: "Components within an editable bundle that customers configure", status: "done", notes: "kit_components table with CRUD admin tab on ProductForm (visible when is_kit=true), storefront product detail shows kit components with image, qty, optional/swappable flags, and price" },
      { name: "Product Addons / Custom Options", description: "Customizable fields (text engraving, color picker, file upload)", status: "done", notes: "product_addons table with CRUD, Addons tab on ProductForm with text/textarea/select/checkbox/color/file types, price adjustments, required flag, sort order" },
      { name: "Smart / Automated Collections", description: "Auto-populate product collections based on rules (brand, price, tags, type, etc.)", status: "done", notes: "smart_collections table with rules JSONB, match_type (all/any), admin SmartCollections page with rule builder (12 fields × text/number operators), live preview showing matched products, CRUD with SEO fields" },
    ],
  },

  // ═══════ 5. PRODUCT — SEO ═══════
  {
    category: "Product — SEO",
    icon: <Globe className="h-5 w-5" />,
    features: [
      { name: "SEO Title (Meta Title)", description: "Custom meta title per product", status: "done" },
      { name: "SEO Description (Meta Description)", description: "Custom meta description per product", status: "done" },
      { name: "SEO Keywords", description: "Meta keywords per product", status: "done" },
      { name: "Search Keywords", description: "Internal search keywords (separate from SEO)", status: "done" },
      { name: "Canonical URL", description: "Set canonical URL to prevent duplicate content", status: "done", notes: "SEOHead adds <link rel=canonical> on product pages" },
      { name: "Open Graph Tags", description: "OG title/description/image for social sharing", status: "done", notes: "SEOHead component sets OG meta tags dynamically on product detail pages" },
      { name: "Structured Data (JSON-LD Product)", description: "Schema.org Product markup for rich results", status: "done", notes: "SEOHead injects JSON-LD with product name, price, availability, brand, aggregateRating" },
      { name: "XML Sitemap Generation", description: "Auto-generated sitemap.xml for products/categories", status: "done", notes: "Edge function generates sitemap.xml with products, categories, and content pages" },
      { name: "301 Redirect Manager", description: "Manage URL redirects when slugs change", status: "done", notes: "Admin /redirects page with CRUD, active toggle, and hit counter" },
      { name: "Google Shopping Feed", description: "Product data feed for Google Merchant Center", status: "done", notes: "Edge function generates RSS/XML feed with product data, prices, images, and categories" },
    ],
  },

  // ═══════ 6. INVENTORY / STOCK CONTROL ═══════
  {
    category: "Inventory / Stock Control",
    icon: <Boxes className="h-5 w-5" />,
    features: [
      { name: "Multi-Warehouse Stock Tracking", description: "Track stock levels across multiple warehouse locations", status: "done" },
      { name: "Stock Adjustments", description: "Manual stock adjustments with reason tracking", status: "done" },
      { name: "Low Stock Threshold Alerts", description: "Configurable low-stock threshold per product/location", status: "done" },
      { name: "Reorder Quantity", description: "Suggested reorder quantity per product", status: "done" },
      { name: "Restock Quantity", description: "Restock level target", status: "done" },
      { name: "Warehouse Locations CRUD", description: "Add/edit/delete warehouse and store locations", status: "done" },
      { name: "Warehouse Types (Warehouse/Store/Dropship)", description: "Different location types", status: "done" },
      { name: "Stock by Variant", description: "Track inventory per variant within each warehouse", status: "done" },
      { name: "Stock Transfer Between Warehouses", description: "Transfer stock from one location to another", status: "done", notes: "Transfer dialog with source/destination locations" },
      { name: "Purchase Orders (PO Creation)", description: "Create purchase orders to suppliers", status: "done", notes: "Full PO CRUD with supplier linking" },
      { name: "Purchase Order Receiving", description: "Receive stock against purchase orders, partial receipts", status: "done", notes: "Item-level receiving dialog with per-item quantity input, auto-updates PO status to partial/received, and updates inventory stock" },
      { name: "Purchase Order Status Workflow", description: "Draft → Sent → Partial → Received → Closed", status: "done" },
      { name: "Stock Count / Stocktake", description: "Physical stock count reconciliation", status: "done", notes: "Stocktake page with create, count items against expected quantities, and complete workflow" },
      { name: "Backorder Management", description: "Manage products on backorder, auto-allocate when stock arrives", status: "done", notes: "backorders table with CRUD, admin Backorders page with KPI cards (pending/units/overdue), status workflow (pending→ordered→fulfilled→cancelled), customer/product linking, expected date tracking with overdue highlighting" },
      { name: "Preorder Management", description: "Accept preorders before stock arrives", status: "done", notes: "Storefront shows Pre-Order button when product has preorder_quantity > 0 and stock is 0" },
      { name: "Batch / Lot Tracking", description: "Track products by batch or lot number", status: "done", notes: "batch_number and lot_number columns on inventory_stock, displayed in Inventory table" },
      { name: "Serial Number Tracking", description: "Track individual units by serial number", status: "done", notes: "serial_numbers table with CRUD, Serial Numbers tab on Inventory page with add/delete, status badges (available/sold/returned), product and location linking" },
      { name: "Expiry Date Tracking", description: "Track expiry dates for perishable goods", status: "done", notes: "expiry_date column on inventory_stock, displayed in Inventory table with color-coded warnings (red for expired, orange for expiring within 30 days)" },
      { name: "Bin Location Management", description: "Assign bin/shelf locations within warehouses", status: "done", notes: "bin_location column on inventory_stock, displayed in inventory table" },
      { name: "Inventory Valuation Reports", description: "FIFO/LIFO/Average cost valuation", status: "done", notes: "Inventory valuation report on Analytics page showing total units, cost value, retail value with per-product breakdown" },
    ],
  },

  // ═══════ 7. ORDERS / INVOICES ═══════
  {
    category: "Orders / Invoices",
    icon: <ShoppingCart className="h-5 w-5" />,
    features: [
      { name: "Order CRUD (GetOrder / AddOrder / UpdateOrder)", description: "Full order lifecycle management", status: "done" },
      { name: "Order Number Generation", description: "Auto-incrementing or custom order numbers", status: "done" },
      { name: "Order Status Workflow", description: "New → Processing → Shipped → Completed / Cancelled", status: "done" },
      { name: "Payment Status (Paid/Unpaid/Partial/Refunded)", description: "Track payment status per order", status: "done" },
      { name: "Fulfillment Status (Unfulfilled/Partial/Fulfilled)", description: "Track shipping fulfillment status", status: "done" },
      { name: "Order Items (Line Items)", description: "Products, quantities, prices per order line", status: "done" },
      { name: "Order Notes (Internal/Customer)", description: "Add notes to orders visible to staff or customer", status: "done" },
      { name: "Order Timeline / History", description: "Chronological event log for each order", status: "done" },
      { name: "Shipping Address", description: "Shipping address per order", status: "done" },
      { name: "Billing Address", description: "Separate billing address", status: "done", notes: "Billing address with 'same as shipping' checkbox at checkout, displayed on order detail" },
      { name: "Order Subtotal / Tax / Shipping / Discount / Total", description: "Full order financial breakdown", status: "done" },
      { name: "Coupon Application to Orders", description: "Apply discount coupons to orders", status: "done" },
      { name: "Order Shipments (Partial Shipments)", description: "Multiple shipments per order with tracking", status: "done" },
      { name: "Shipment Items (Line-level Fulfillment)", description: "Track which items are in which shipment", status: "done" },
      { name: "Tracking Number / URL / Carrier", description: "Carrier, tracking number, tracking URL per shipment", status: "done" },
      { name: "Manual Order Creation (Admin)", description: "Staff can create orders from the admin panel", status: "done" },
      { name: "Order Quotes", description: "Create and send quotes that customers can approve/reject", status: "done", notes: "Quotes page with create dialog, line items, customer selection, status workflow (draft→sent→approved→rejected), convert to order" },
      { name: "Quote to Order Conversion", description: "Convert approved quote into a live order", status: "done", notes: "Convert button on approved quotes creates order with items and links back to quote" },
      { name: "Invoice Generation (PDF)", description: "Generate printable PDF invoices", status: "done", notes: "Print-friendly invoice page with browser print, accessible from order detail" },
      { name: "Packing Slip Generation (PDF)", description: "Generate printable packing slips", status: "done", notes: "Dedicated packing slip page without pricing, with checkboxes for warehouse picking" },
      { name: "Pick List Generation", description: "Generate warehouse pick lists from orders", status: "done", notes: "Printable pick list page with aggregated items across multiple orders" },
      { name: "Credit Notes", description: "Issue credit notes against orders", status: "done", notes: "credit_notes table with issue dialog on order detail page" },
      { name: "Order Splitting", description: "Split single order into multiple orders", status: "done", notes: "Split dialog on order detail page - select items and quantities to move to a new order" },
      { name: "Order Merging", description: "Merge multiple orders from same customer", status: "done", notes: "Merge dialog on order detail page - find order by number, preview, transfer items, delete merged order" },
      { name: "Order Duplication / Reorder", description: "Clone an existing order as new", status: "done", notes: "Duplicate action on orders list" },
      { name: "Multi-Address Checkout / Split Shipping", description: "Ship different items to different addresses in one order", status: "done", notes: "Split shipping checkbox on checkout when 2+ items; per-item address fields (address, city, zip, country); itemAddresses state tracked by product_id+variant_id key" },
      { name: "Order Export (CSV/XML)", description: "Bulk export orders in various formats", status: "done", notes: "Orders tab in Export Wizard with field selection, status filter, date range, customer details, and line items options" },
      { name: "Order Import", description: "Bulk import orders from CSV/XML", status: "done", notes: "Order import in Import Wizard with order_number, status, financials, customer email lookup, and tag mapping" },
      { name: "Order Tags / Flags", description: "Tag or flag orders for internal workflows", status: "done", notes: "Tags array on orders with add/remove UI on order detail page" },
      { name: "Batch Order Processing", description: "Bulk update status, print labels for multiple orders", status: "done", notes: "Bulk status update, batch print packing slips, shipping labels, and invoices from orders list" },
      { name: "Order Fraud Detection Flags", description: "Automated fraud scoring and risk flags on orders", status: "done", notes: "Fraud Risk card on order detail with heuristic scoring: high value, address mismatch, no account, high qty, first order" },
    ],
  },

  // ═══════ 8. PAYMENTS ═══════
  {
    category: "Payments",
    icon: <CreditCard className="h-5 w-5" />,
    features: [
      { name: "Payment Recording (GetPayment / AddPayment)", description: "Record and retrieve payments against orders", status: "done", notes: "order_payments table with full CRUD, payment history on order detail" },
      { name: "Stripe Integration", description: "Accept credit card payments via Stripe", status: "done", notes: "payment-gateway edge function with create_payment_intent, confirm_payment, refund, save_card (SetupIntent for tokenized storage); auto-records order_payments on success; test mode support" },
      { name: "PayPal Integration", description: "PayPal checkout / express checkout", status: "done", notes: "payment-gateway edge function with create_order (PayPal Checkout v2) and capture_order; auto-records payment on COMPLETED status; sandbox/production toggle" },
      { name: "Afterpay / Zip Pay (BNPL)", description: "Buy Now Pay Later integrations", status: "done", notes: "payment-gateway edge function with create_checkout and capture actions via Afterpay v2 API; auto-records payment on APPROVED" },
      { name: "Square Payment Integration", description: "Square payment processing", status: "done", notes: "payment-gateway edge function with create_payment via Square Payments API; location_id support; auto-records on COMPLETED" },
      { name: "eWAY Payment Gateway", description: "eWAY (Australia) payment gateway", status: "done", notes: "payment-gateway edge function with create_payment via eWAY Transaction API; shared payment URL redirect; sandbox support" },
      { name: "Braintree Integration", description: "Braintree (PayPal) payment processing", status: "done", notes: "payment-gateway edge function with client_token generation and create_transaction via Braintree XML API; submit-for-settlement flow" },
      { name: "Manual / Offline Payments", description: "Record manual payments (bank transfer, check, cash)", status: "done", notes: "order_payments table with record dialog on order detail, payment history display" },
      { name: "Payment Refunds", description: "Process full or partial refunds", status: "done", notes: "Refund dialog on order detail page with amount, reason, and auto-updates payment status to refunded" },
      { name: "Payment Receipts / Confirmation", description: "Generate payment receipts", status: "done", notes: "Printable payment receipt page accessible from payment history on order detail" },
      { name: "Saved Payment Methods", description: "Store card details for repeat purchases (tokenized)", status: "done", notes: "payment-gateway edge function save_card action creates Stripe SetupIntent for off-session tokenized card storage; Braintree vault also supported" },
      { name: "Pay Order from Account", description: "Customer can pay outstanding orders from their account page", status: "done", notes: "Pay button on storefront account order detail for unpaid orders, records payment and updates status" },
      { name: "Layby / Lay-Away", description: "Installment payment plans managed in-platform", status: "done", notes: "layby_plans and layby_payments tables, admin Layby page with KPI cards, plan list with progress bars, payment recording dialog, cancel action, auto-completes order payment status when fully paid" },
      { name: "Account Credit / Store Credit", description: "Customer account credit balance for future purchases", status: "done", notes: "store_credit_transactions table with credit/debit types, Store Credit card on customer detail with balance display, transaction history, manual add; checkout integration with checkbox to apply credit balance" },
    ],
  },

  // ═══════ 9. RMA / RETURNS / DISPUTES ═══════
  {
    category: "RMA / Returns / Disputes",
    icon: <RefreshCw className="h-5 w-5" />,
    features: [
      { name: "Returns CRUD", description: "Create, view, and manage return requests (GetRma / AddRma / UpdateRma)", status: "done" },
      { name: "Return Reason", description: "Reason for return", status: "done" },
      { name: "Return Status Workflow", description: "Pending → Approved → Received → Refunded / Rejected", status: "done" },
      { name: "Refund Amount Tracking", description: "Track refund amounts per return", status: "done" },
      { name: "Admin Notes on Returns", description: "Internal staff notes per return", status: "done" },
      { name: "Customer-Initiated Returns (Storefront)", description: "Customers can submit returns from their account", status: "done", notes: "Return request dialog on account page with order selection and reason" },
      { name: "Return Shipping Labels", description: "Generate prepaid return shipping labels", status: "done", notes: "PrintReturnLabel page with RMA number, from/to addresses (reversed for returns), reason, instructions; accessible from returns list via /returns/:id/label" },
      { name: "Exchange / Replacement Orders", description: "Create replacement orders linked to returns", status: "done", notes: "Replacement Order button on return detail dialog creates new order with original items and links to return" },
      { name: "Warranty Claims (Disputes)", description: "Customer warranty dispute system with status workflow", status: "done", notes: "warranty_disputes table with open→in_review→resolved/closed workflow, admin Disputes tab on Returns page, storefront account submission form with order/product/type/reason selection" },
      { name: "Dispute Types (Refund/Repair/Replace)", description: "Different dispute resolution types", status: "done", notes: "dispute_type field with refund/repair/replace options on warranty_disputes table" },
      { name: "Dispute Reason Selection", description: "Pre-defined dispute reasons for customers to choose from", status: "done", notes: "7 pre-defined reasons in storefront dispute form: defective, broke within warranty, not as described, missing parts, performance, safety, other" },
      { name: "Dispute Email Notifications", description: "Automated emails when disputes are raised, updated, closed", status: "done", notes: "dispute-email edge function sends customer notification with dispute details/status and admin alert for new disputes" },
      { name: "RMA Report", description: "Reporting on return rates, reasons, costs", status: "done", notes: "KPI cards + status breakdown + top reasons on Returns page Report tab" },
    ],
  },

  // ═══════ 10. CUSTOMERS / CRM ═══════
  {
    category: "Customers / CRM",
    icon: <Users className="h-5 w-5" />,
    features: [
      { name: "Customer CRUD (GetCustomer / AddCustomer / UpdateCustomer)", description: "Full customer management", status: "done" },
      { name: "Customer Segments", description: "Segment customers (VIP, New, At-Risk)", status: "done" },
      { name: "Customer Tags", description: "Tag customers for marketing and filtering", status: "done" },
      { name: "Customer Notes", description: "Internal notes on customer records", status: "done" },
      { name: "Customer Order History", description: "View all orders per customer", status: "done" },
      { name: "Customer Total Orders / Total Spent", description: "Aggregate spending metrics per customer", status: "done" },
      { name: "Customer Detail Page", description: "Comprehensive customer profile view", status: "done" },
      { name: "Customer Groups (Retail / Wholesale / VIP)", description: "Assign customers to groups for pricing/access control", status: "done", notes: "customer_groups table with CRUD in Settings, group assignment on customer detail" },
      { name: "Customer Credit Terms / Limits", description: "B2B credit limits, payment terms (Net 30, etc.)", status: "done", notes: "credit_terms and credit_limit fields on customer_groups table" },
      { name: "Customer Statements", description: "Generate and email customer account statements", status: "done", notes: "Printable customer statement with order history, payment history, and balance summary accessible from customer detail" },
      { name: "Multiple Shipping Addresses", description: "Customers save multiple delivery addresses", status: "done", notes: "Customer addresses CRUD with default billing/shipping" },
      { name: "Customer Files / Documents", description: "Upload contracts/documents to customer records", status: "done", notes: "customer_files table with upload/delete, Files & Documents card on customer detail page with file upload, download links, and delete" },
      { name: "Customer Logo Upload (Dropship)", description: "B2B customers upload their logo for dropship labels", status: "done", notes: "logo_url column on customers table for storing uploaded logo URL; uploadable from customer detail page for dropship label branding" },
      { name: "Wholesale Registration", description: "Separate wholesale registration form with approval workflow", status: "done", notes: "Storefront /wholesale page and wholesale_applications table" },
      { name: "Customer Auto-Registration on Purchase", description: "Automatically create customer account on first purchase", status: "done", notes: "Checkout auto-creates customer record if no existing record found for email" },
      { name: "Customer Merge", description: "Merge duplicate customer records", status: "done", notes: "Merge dialog on customer detail page - search by email, preview duplicate, transfer orders, delete duplicate" },
      { name: "Customer Export", description: "Export customers to CSV", status: "done", notes: "CSV download on admin customers page" },
      { name: "Customer Import", description: "Bulk import customers from CSV", status: "done", notes: "CSV import on Customers page with name/email/phone/segment/tags columns" },
      { name: "Customer Lifetime Value (CLV)", description: "Calculated CLV metric per customer", status: "done", notes: "CLV and avg days between orders on customer detail stats card" },
    ],
  },

  // ═══════ 11. STOREFRONT — PAGES & TEMPLATES ═══════
  {
    category: "Storefront — Pages & Templates",
    icon: <Store className="h-5 w-5" />,
    features: [
      { name: "Homepage Template", description: "Customizable homepage (home.template.html)", status: "done" },
      { name: "Product Listing Page (Category)", description: "Category/collection product listing (category.template.html)", status: "done" },
      { name: "Product Detail Page", description: "Full product page with images, options, reviews (products/template.html)", status: "done" },
      { name: "Products Landing Page (/products)", description: "All-products page listing all categories", status: "done" },
      { name: "Search Results Page", description: "Search results template (search_results.template.html)", status: "done", notes: "Product search with filters, sorting, and pagination on /products" },
      { name: "Shopping Cart Page", description: "View cart page (shopping_cart.template.html)", status: "done" },
      { name: "One-Page Checkout", description: "Single-page checkout flow (onepage.template.html)", status: "done" },
      { name: "Checkout — Shipping Options", description: "Shipping method selection (shipping_options.template.html)", status: "done", notes: "Shipping zone radio selection with free-above threshold display" },
      { name: "Checkout — Address Form", description: "Multi-address checkout support (address.template.html)", status: "done", notes: "Full shipping address form with saved addresses dropdown for logged-in users, separate billing address with 'same as shipping' toggle" },
      { name: "Checkout — Cart Items Summary", description: "Order summary sidebar in checkout (cart_items.template.html)", status: "done" },
      { name: "Checkout — Voucher/Coupon Redemption", description: "Coupon code entry (redeem_vouchers.template.html)", status: "done", notes: "Coupon apply/remove at checkout" },
      { name: "Checkout — Gift Voucher Message", description: "Gift voucher message entry (voucher_msg.template.html)", status: "done", notes: "Gift message textarea appears at checkout when a gift voucher is applied, with 500 char limit" },
      { name: "Checkout — Upsell Page", description: "Pre-checkout upsells (upsell.template.html)", status: "done", notes: "Upsell section on checkout showing related/cross-sell products from product_relations, with fallback to random products" },
      { name: "Checkout — Error Handling", description: "Cart error display (cart.error.html)", status: "done", notes: "Validation toasts for missing fields, billing address, and empty cart checks" },
      { name: "Invoice / Thank You Page", description: "Post-checkout success page (invoice.template.html)", status: "done", notes: "Enhanced thank you page with order number, total, and View Orders link" },
      { name: "Quote Invoice Page", description: "Post-quote success page (quote_invoice.template.html)", status: "done", notes: "Printable quote page accessible from admin Quotes list" },
      { name: "Empty Cart Page", description: "Display when cart is empty (empty.template.html)", status: "done", notes: "Empty state with icon and continue shopping link" },
      { name: "404 Page", description: "Custom 404 not found page (404.template.html)", status: "done" },
      { name: "Content Pages (CMS)", description: "Generic content pages (default.template.html)", status: "done", notes: "Storefront CMS page route with slug-based rendering" },
      { name: "Blog Pages", description: "Blog listing and blog post pages", status: "done", notes: "Storefront /blog route listing blog-type content pages with featured images and dates" },
      { name: "Store Finder / Stockist Page", description: "Store locator with map (store_finder.template.html)", status: "done", notes: "Storefront /store-finder page listing inventory locations with search, address, and type badges" },
      { name: "Modal / Popup Template", description: "Modal wrapper template (modal.template.html)", status: "done", notes: "StorefrontModal component with configurable size (sm/md/lg/xl), title, footer, backdrop close, keyboard-accessible close button" },
      { name: "Add-to-Cart Popup (nPopup)", description: "Ajax add-to-cart confirmation popup (npopup.template.html)", status: "done", notes: "AddToCartPopup dialog showing added item with image, variant, quantity, cart summary, and View Cart / Continue Shopping buttons" },
      { name: "Sidebar Template", description: "Reusable sidebar includes (sidebar.template.html)", status: "done", notes: "StorefrontSidebar component with hierarchical category nav, active state highlighting, popular tags cloud, and recently viewed products section" },
    ],
  },

  // ═══════ 12. STOREFRONT — CUSTOMER ACCOUNT ═══════
  {
    category: "Storefront — Customer Account",
    icon: <UserCheck className="h-5 w-5" />,
    features: [
      { name: "Customer Login Page", description: "Login form (login.template.html)", status: "done" },
      { name: "Customer Registration Page", description: "Registration form (register/template.html)", status: "done" },
      { name: "Account Dashboard", description: "Account home with order summary (customer/template.html)", status: "done", notes: "Tabs: orders, addresses, shipment tracking" },
      { name: "View Order History", description: "List past orders from account (nr_view_order)", status: "done", notes: "Orders tab in storefront account with detail view" },
      { name: "View Single Order Detail", description: "View order details (order.template.html)", status: "done", notes: "Full order detail with items, shipments, status tracker, financials" },
      { name: "View Quote Detail", description: "View quote details (quote.template.html)", status: "done", notes: "Quotes tab in storefront account showing quote number, status, total, valid until, and items" },
      { name: "Print Order / Invoice", description: "Print-friendly order view (customer/print/)", status: "done", notes: "Print Invoice button on order detail opens printable invoice page" },
      { name: "Track Order", description: "Order tracking page (track_order/)", status: "done", notes: "Public /track-order page with order number search and shipment details" },
      { name: "Pay Outstanding Order", description: "Pay unpaid orders from account (pay_order/)", status: "done", notes: "Pay button on storefront account order detail records payment via order_payments and updates payment_status" },
      { name: "Edit Account Details", description: "Edit billing/contact info (edit_account/)", status: "done", notes: "Inline edit name/phone on account profile card" },
      { name: "Edit Shipping Addresses", description: "Manage multiple addresses (edit_address/)", status: "done", notes: "CRUD on storefront account" },
      { name: "Change Password", description: "Password change form (edit_pwd/)", status: "done" },
      { name: "Forgot Password", description: "Password reset flow (forgotpwd/)", status: "done" },
      { name: "Forgot Username", description: "Username recovery flow (forgotusr/)", status: "done", notes: "Storefront /forgot-username page with name/phone lookup returning masked email" },
      { name: "Reset Password (Post-Purchase)", description: "Set password after auto-registration (resetpwd/)", status: "done" },
      { name: "Wishlist (Favourites)", description: "Save/view/reorder wishlist items (favourites/ & wishlist/)", status: "done" },
      { name: "View Customer Vouchers", description: "View gift vouchers on account (vouchers/)", status: "done", notes: "Vouchers tab in storefront account showing purchased and received gift vouchers with code, value, balance, and expiry" },
      { name: "View Customer Files", description: "View/download uploaded documents (files/)", status: "done", notes: "Files tab in storefront account showing customer_files with file name, description, size, date, and download link" },
      { name: "Approve/Reject Quotes", description: "Customer approves or deletes quotes (approve_quote/)", status: "done", notes: "Approve/Reject buttons on sent quotes in storefront account Quotes tab" },
      { name: "My Store / Stockist Management", description: "Customers manage their stockist listing (mystore/)", status: "done", notes: "stockist_listings table with business name, address, phone, website, lat/lng, approval workflow; customers can manage via storefront account; admin approval in store finder" },
      { name: "Write Product Review", description: "Submit product review from account (write_review/)", status: "done", notes: "Review form with rating, title, body on product detail page for logged-in users" },
      { name: "Write Content Review", description: "Submit content/page review (write_contentreview/)", status: "done", notes: "Review form with star rating, title, body on storefront content pages for logged-in users, moderation approval before display, average rating badge" },
      { name: "Submit Warranty Dispute", description: "Open/view warranty disputes (warranty/)", status: "done", notes: "Disputes tab in storefront account with submission form (order, product, type, reason, description) and status tracking" },
      { name: "Logout Page", description: "Logout confirmation (logout.template.html)", status: "done" },
    ],
  },

  // ═══════ 13. STOREFRONT — PRODUCT DISPLAY ═══════
  {
    category: "Storefront — Product Display",
    icon: <Eye className="h-5 w-5" />,
    features: [
      { name: "Product Image Gallery", description: "Multiple images with thumbnails and zoom (images.template.html)", status: "done" },
      { name: "Image Lightbox", description: "Full-screen image viewer", status: "done" },
      { name: "Buying Options / Add to Cart", description: "Variant selector and add-to-cart (buying_options.template.html)", status: "done" },
      { name: "Product Header (Price, Title, Sale)", description: "Product header include (header.template.html)", status: "done" },
      { name: "Child Products Display", description: "Non-variant child product listing (child_products.template.html)", status: "done", notes: "Child/accessory products from product_relations rendered as 'Included Components' grid on product detail page" },
      { name: "Editable Kit Components UI", description: "Kit component configuration (components.template.html)", status: "done", notes: "Storefront product detail shows kit components with image, quantity, optional/swappable flags when product is_kit=true" },
      { name: "Product Thumbnails (Grid/List/Box)", description: "Product card layouts (thumbs/product/)", status: "done" },
      { name: "Content Thumbnails", description: "Content page card layout (thumbs/content/)", status: "done", notes: "Blog page uses content thumbnail cards with featured image, title, description, date, and read more arrow" },
      { name: "Advert Thumbnails (Banner/Carousel/Scroll/Text)", description: "Promotional ad placements (thumbs/advert/)", status: "done", notes: "adverts table with CRUD, admin Adverts page with banner/carousel/text/HTML types, 7 placement zones, schedule, storefront AdvertBanner component with auto-rotate carousel, homepage_top and homepage_mid placements" },
      { name: "Product Reviews Display", description: "Star ratings and review text on product page", status: "done" },
      { name: "Product Compare", description: "Side-by-side product comparison", status: "done" },
      { name: "Notify Me (Back in Stock)", description: "Email notification when out-of-stock item returns", status: "done", notes: "back_in_stock_requests table, email form on product page when out of stock" },
      { name: "Recently Viewed Products", description: "Track and display recently viewed items", status: "done", notes: "localStorage-based tracking on product detail page" },
      { name: "Product Quick View", description: "Quick view popup without navigating away", status: "done", notes: "Eye icon on product card hover opens modal with image, price, add-to-cart, wishlist, and view details" },
      { name: "Shipping Calculator on Product Page", description: "Estimate shipping cost on product page", status: "done", notes: "Postcode/ZIP input with shipping zone cost estimation on product detail page" },
      { name: "Product Tabs (Description/Specs/Reviews)", description: "Tabbed content on product page", status: "done", notes: "Tabs for Description, Features, Specs, Shipping, Warranty, Reviews" },
    ],
  },

  // ═══════ 14. CATEGORIES ═══════
  {
    category: "Categories",
    icon: <Tag className="h-5 w-5" />,
    features: [
      { name: "Category CRUD (GetCategory / AddCategory / UpdateCategory)", description: "Full category management via API", status: "done" },
      { name: "Category Hierarchy (Parent/Child)", description: "Unlimited depth category tree", status: "done" },
      { name: "Category Slug / SEO URL", description: "Clean URLs for categories", status: "done" },
      { name: "Category Sort Order", description: "Custom sort order for menu display", status: "done" },
      { name: "Category Description / Content", description: "Rich text content on category pages", status: "done" },
      { name: "Category Image / Banner", description: "Hero image or banner per category", status: "done" },
      { name: "Category SEO Fields", description: "Meta title/description per category", status: "done" },
      { name: "Category Filters (Faceted Navigation)", description: "Filter products by specifics within a category", status: "done", notes: "Brand, price range, and product specifics filters with active filter badges" },
      { name: "Smart / Automated Categories", description: "Auto-populate categories based on product rules", status: "done", notes: "auto_rules JSONB column on categories table for rule-based auto-categorization by brand, product_type, tags, price range" },
    ],
  },

  // ═══════ 15. COUPONS & GIFT VOUCHERS ═══════
  {
    category: "Coupons & Gift Vouchers",
    icon: <Percent className="h-5 w-5" />,
    features: [
      { name: "Coupon CRUD", description: "Create and manage discount coupons", status: "done" },
      { name: "Percentage Discount", description: "Percentage-based coupon discounts", status: "done" },
      { name: "Fixed Amount Discount", description: "Dollar-off coupon discounts", status: "done" },
      { name: "Free Shipping Coupon", description: "Coupon that provides free shipping", status: "done" },
      { name: "Min Order Amount Requirement", description: "Minimum order value for coupon validity", status: "done" },
      { name: "Coupon Usage Limits (Max Uses)", description: "Limit total uses of a coupon", status: "done" },
      { name: "Coupon Expiry Date", description: "Set coupon start/end dates", status: "done" },
      { name: "Coupon Active Toggle", description: "Enable/disable coupons", status: "done" },
      { name: "Per-Customer Usage Limit", description: "Limit uses per customer", status: "done" },
      { name: "Product-Specific Coupons", description: "Restrict coupon to specific products/categories", status: "done" },
      { name: "Auto-Apply Coupons", description: "Automatically apply coupon based on cart rules", status: "done", notes: "Checkout auto-applies best eligible site-wide coupon on load" },
      { name: "Gift Vouchers (GetVoucher / AddVoucher / UpdateVoucher)", description: "Create, sell, and redeem gift vouchers/certificates", status: "done", notes: "Full gift voucher CRUD admin" },
      { name: "Gift Voucher Purchase (Storefront)", description: "Customers purchase gift vouchers with custom value/message", status: "done", notes: "Storefront /gift-vouchers page with preset/custom values, recipient details, and printable voucher card" },
      { name: "Gift Voucher Email Delivery", description: "Send gift voucher to recipient by email on scheduled date", status: "done", notes: "gift-voucher-email edge function sends styled email with voucher code, value, message to recipient on purchase" },
      { name: "Gift Voucher Balance Tracking", description: "Track remaining balance on vouchers", status: "done" },
      { name: "Gift Voucher Redemption at Checkout", description: "Apply voucher balance as payment", status: "done", notes: "Gift voucher code input at checkout, deducts balance from gift_vouchers table" },
    ],
  },

  // ═══════ 16. SHIPPING ═══════
  {
    category: "Shipping",
    icon: <Truck className="h-5 w-5" />,
    features: [
      { name: "Shipping Zones", description: "Define zones by region with flat rates", status: "done" },
      { name: "Free Shipping Above Threshold", description: "Free shipping over X amount per zone", status: "done" },
      { name: "Flat Rate Shipping", description: "Flat rate per zone", status: "done" },
      { name: "Shipping Methods (GetShippingMethods / AddShippingQuote)", description: "Dynamic shipping method management via API", status: "done", notes: "shipping_methods table with name, carrier, method_type, base_rate, estimated days, active toggle, sort order; per-store CRUD" },
      { name: "Weight-Based Shipping Rates", description: "Calculate shipping based on order weight", status: "done", notes: "rate_type and per_kg_rate columns on shipping_zones, admin UI for flat vs weight-based selection, per-kg rate with optional base flat rate" },
      { name: "Volumetric/Cubic Shipping Rates", description: "Calculate using dimensional weight", status: "done", notes: "cubic_divisor column on shipping_zones (default 5000), volumetric weight = (L×W×H) / divisor, checkout uses max of actual vs volumetric weight for rate calculation" },
      { name: "Real-Time Carrier Rates (Australia Post)", description: "Live rates from Australia Post API", status: "partial", notes: "carrier-rates edge function exists. Requires Australia Post PAC API key to function" },
      { name: "Real-Time Carrier Rates (Sendle)", description: "Live rates from Sendle courier API", status: "partial", notes: "carrier-rates edge function exists. Requires Sendle API credentials to function" },
      { name: "Real-Time Carrier Rates (StarTrack)", description: "Live rates from StarTrack", status: "partial", notes: "carrier-rates edge function exists. Requires StarTrack/Australia Post credentials to function" },
      { name: "Real-Time Carrier Rates (Fastway/Aramex)", description: "Live courier rates from Aramex/Fastway", status: "partial", notes: "carrier-rates edge function exists. Requires Aramex API credentials to function" },
      { name: "Real-Time Carrier Rates (UPS/FedEx/DHL)", description: "International carrier rate integration", status: "partial", notes: "carrier-rates edge function exists. Requires UPS/FedEx/DHL API credentials to function" },
      { name: "Shipping Label Printing", description: "Print carrier-specific shipping labels", status: "done", notes: "PrintShippingLabel page with from/to addresses, order info, tracking barcode, carrier name; accessible from order detail shipments" },
      { name: "Shipping Tracking Emails", description: "Automated tracking notification emails to customers", status: "done", notes: "shipment-email edge function sends tracking email with carrier, tracking number, and URL on shipment creation" },
      { name: "Click & Collect / Pickup in Store", description: "In-store pickup option at checkout", status: "done", notes: "Delivery method toggle: Ship vs Click & Collect with free shipping for pickup" },
      { name: "Dropship Routing", description: "Auto-route orders to dropship suppliers", status: "done", notes: "Auto-routes order items to preferred dropship suppliers on order creation, groups by supplier, fires dropship-notification edge function per supplier" },
      { name: "Dropship Notifications", description: "Automated dropship supplier email notifications", status: "done", notes: "dropship-notification edge function sends supplier email with order items, SKUs, quantities, and shipping address for dropship fulfillment" },
      { name: "Delivery Date Estimation", description: "Estimated delivery date on checkout", status: "done", notes: "3-7 business day estimate shown after selecting shipping zone at checkout" },
      { name: "Shipping Rules / Restrictions", description: "Restrict shipping methods by product, location, weight", status: "done", notes: "shipping_rules table with zone-level restrictions by weight/price/location, rule types: restrict/surcharge, condition operators: greater_than/less_than/equals, active toggle, custom message" },
    ],
  },

  // ═══════ 17. TAX ═══════
  {
    category: "Tax",
    icon: <Receipt className="h-5 w-5" />,
    features: [
      { name: "Tax Rates by Region", description: "Configure tax rates per region/state", status: "done" },
      { name: "Tax-Free Products", description: "Mark individual products as tax exempt", status: "done" },
      { name: "Tax-Inclusive Pricing", description: "Display prices inclusive of tax", status: "done" },
      { name: "Tax-Exclusive Pricing", description: "Display prices exclusive of tax, add at checkout", status: "done", notes: "Product detail shows 'ex. tax' or 'inc. tax' label based on product tax_inclusive flag, checkout adds tax to subtotal for non-exempt customers" },
      { name: "GST / VAT Handling", description: "Australian GST or European VAT calculation", status: "done", notes: "tax_mode column on stores (standard/gst/vat), selectable in Settings Tax tab, checkout displays correct tax label (Tax/GST/VAT) and exempt label" },
      { name: "Tax-Exempt Customers", description: "Mark B2B customers as tax exempt", status: "done", notes: "is_tax_exempt on customer_groups, applied at checkout to skip tax" },
      { name: "Tax Reporting / BAS Report", description: "Tax summary reports for accounting", status: "done", notes: "Tax report on Analytics page with total tax, taxed orders, and monthly bar chart" },
      { name: "Auto Tax Calculation by Address", description: "Calculate tax based on shipping destination", status: "done", notes: "region and country columns on tax_rates table with is_default flag; checkout auto-matches customer city/country to tax_rates and updates tax rate dynamically on address input" },
      { name: "Multi-Tax (State + County)", description: "Compound tax rates for US states", status: "done", notes: "compound_rate and tax_type columns on tax_rates table; supports standard and compound tax types; compound_rate stacks on top of base rate for state+county calculations" },
    ],
  },

  // ═══════ 18. SUPPLIERS ═══════
  {
    category: "Suppliers",
    icon: <Building className="h-5 w-5" />,
    features: [
      { name: "Supplier CRUD (GetSupplier / AddSupplier / UpdateSupplier)", description: "Manage supplier records via API", status: "done" },
      { name: "Supplier Contact Details", description: "Store supplier name, email, phone, address", status: "done" },
      { name: "Supplier Product Assignments", description: "Assign products/SKUs to specific suppliers", status: "done", notes: "supplier_products table with Product Assignments tab on Suppliers page, preferred supplier star toggle" },
      { name: "Supplier Pricing / Cost", description: "Supplier-specific cost price per product", status: "done", notes: "supplier_cost numeric column on supplier_products table, inline editable in Product Assignments tab" },
      { name: "Purchase Orders to Suppliers", description: "Generate and send POs to suppliers", status: "done", notes: "PO CRUD with supplier linking" },
      { name: "Supplier Lead Times", description: "Expected delivery timeframes per supplier", status: "done" },
      { name: "Supplier Performance Tracking", description: "Track on-time delivery and quality metrics", status: "done", notes: "Performance tab on Suppliers page showing PO count, total spend, received count, on-time delivery % per supplier" },
      { name: "Dropship Supplier Management", description: "Configure suppliers as dropship sources", status: "done" },
    ],
  },

  // ═══════ 19. CURRENCY ═══════
  {
    category: "Currency & Localization",
    icon: <DollarSign className="h-5 w-5" />,
    features: [
      { name: "Store Default Currency", description: "Configure store base currency", status: "done" },
      { name: "Currency Display Format", description: "Format currency symbol and decimals", status: "done", notes: "Currency format settings on Inventory tab in Settings with symbol position (before/after) and decimal places (0/2/3) stored on stores table" },
      { name: "Multi-Currency Support (GetCurrency / AddCurrency)", description: "Add/manage multiple currencies via API", status: "done", notes: "currencies table with per-store currency CRUD; admin /currencies page with code, name, symbol, exchange rate, default/active toggles; quick-select for 8 common currencies (AUD, USD, EUR, GBP, NZD, CAD, JPY, SGD)" },
      { name: "Exchange Rate Management", description: "Set or auto-update exchange rates", status: "done", notes: "Inline editable exchange rate per currency on admin Currencies page; rates stored as numeric relative to base/default currency" },
      { name: "Currency Switcher (Storefront)", description: "Customer can switch display currency on storefront", status: "done", notes: "CurrencySwitcher dropdown in storefront header; useCurrency hook loads active currencies per store, converts prices via exchange rate, persists selection in localStorage" },
      { name: "Currency-Specific Pricing", description: "Set prices in each supported currency", status: "done", notes: "Exchange rate-based conversion from base currency; currencies table stores per-currency rate, symbol; useCurrency.convert() applies rate to base price" },
      { name: "Multi-Language Support", description: "Translate storefront content into multiple languages", status: "done", notes: "store_languages and store_translations tables; LanguageProvider context with useLanguage hook for t() and tEntity() translation functions; LanguageSwitcher dropdown in storefront header; localStorage persistence of locale preference" },
      { name: "Timezone Configuration", description: "Store timezone setting", status: "done" },
    ],
  },

  // ═══════ 20. CONTENT / CMS ═══════
  {
    category: "Content / CMS",
    icon: <FileText className="h-5 w-5" />,
    features: [
      { name: "Content Pages CRUD (GetContent / AddContent / UpdateContent)", description: "Manage CMS pages via API", status: "done" },
      { name: "About Page", description: "About us content page", status: "done", notes: "Via CMS page type" },
      { name: "Contact Page with Form", description: "Contact form page with email notification", status: "done", notes: "Storefront /contact page with form that stores submissions in contact_submissions table" },
      { name: "FAQ Page", description: "Frequently asked questions page", status: "done", notes: "Via CMS page type: faq" },
      { name: "Blog / News Articles", description: "Blog listing and post pages", status: "done", notes: "Via CMS page type: blog" },
      { name: "Banner / Announcement Management", description: "Create and schedule banner ads on storefront", status: "done", notes: "Banner text with start/end datetime scheduling in Settings branding, displayed conditionally on storefront header based on current date" },
      { name: "Static Blocks / Widgets", description: "Reusable content blocks embeddable on any page", status: "done", notes: "content_blocks table with CRUD, admin Content Blocks page with name, identifier, type (html/text/markdown/banner), placement zones, active toggle, edit/copy/delete" },
      { name: "WYSIWYG Content Editor", description: "Rich text editor for content pages", status: "done", notes: "TipTap rich text editor with bold, italic, strike, code, H1-H3, bullet/ordered lists, blockquote, horizontal rule, text alignment, links, images, undo/redo toolbar; integrated into Content Pages editor dialog" },
      { name: "Content Reviews", description: "Reviews on content pages (not just products)", status: "done", notes: "content_reviews table, review form and display on storefront content pages with star ratings, moderation approval, average rating badge" },
      { name: "Media Library / Asset Management", description: "Central repository for images, files, and media", status: "done", notes: "media_assets table with CRUD, admin Media Library page with grid view, folder filtering, file upload, copy URL, and delete" },
    ],
  },

  // ═══════ 21. REVIEWS ═══════
  {
    category: "Reviews & Ratings",
    icon: <Star className="h-5 w-5" />,
    features: [
      { name: "Product Reviews CRUD", description: "Create and manage product reviews", status: "done" },
      { name: "Star Ratings (1-5)", description: "Numerical star rating per review", status: "done" },
      { name: "Review Title & Body", description: "Structured review content", status: "done" },
      { name: "Review Approval/Moderation", description: "Admin approves reviews before display", status: "done" },
      { name: "Review Author Name", description: "Display reviewer name", status: "done" },
      { name: "Review Response (Admin Reply)", description: "Admin can reply to customer reviews", status: "done", notes: "Reply dialog in admin Reviews page, displayed on storefront with 'Store Response' label" },
      { name: "Review Photos", description: "Customers upload photos with reviews", status: "done", notes: "Photo upload (up to 5) on review form, stored in product-images bucket, displayed as thumbnail grid on reviews" },
      { name: "Verified Purchase Badge", description: "Mark reviews from verified buyers", status: "done", notes: "Checks order_items for reviewer's user_id, shows ShieldCheck badge" },
      { name: "Review Aggregation / Average Rating", description: "Calculate and display average rating per product", status: "done", notes: "Average rating display plus star breakdown bar chart with counts" },
      { name: "Review Reminders (Post-Purchase)", description: "Automated email asking for review after delivery", status: "done", notes: "order-follow-up edge function auto-triggers on shipment delivery, sends review request email with order items and CTA" },
      { name: "Review Import/Export", description: "Bulk import reviews from CSV/other platforms", status: "done", notes: "Review export tab in Export Wizard and review import in Import Wizard with product SKU lookup, rating, title, body, author name, approval status" },
    ],
  },

  // ═══════ 22. MARKETING & CAMPAIGNS ═══════
  {
    category: "Marketing & Campaigns",
    icon: <Megaphone className="h-5 w-5" />,
    features: [
      { name: "Marketing Campaign CRUD", description: "Create and manage marketing campaigns", status: "done" },
      { name: "Email Campaigns", description: "Email campaign type with subject/content", status: "done" },
      { name: "SMS Campaigns", description: "SMS campaign type", status: "done", notes: "sms-gateway edge function with send_campaign (batch SMS to segmented customers with personalization), send_sms (direct), order_notification (order confirmed/shipped/delivered templates); supports Twilio, MessageBird, SMS Broadcast AU" },
      { name: "Audience Segmentation", description: "Target campaigns by customer segment/tags", status: "done" },
      { name: "Campaign Scheduling", description: "Schedule campaigns for future send", status: "done" },
      { name: "Campaign Statistics (Open/Click/Revenue)", description: "Track campaign performance metrics", status: "done", notes: "Opens, clicks, and revenue columns displayed on campaigns table from stats JSONB field on marketing_campaigns table" },
      { name: "Abandoned Cart Recovery", description: "Automated emails for abandoned carts", status: "done", notes: "Abandoned cart admin page with recovery status tracking, email sent marking via abandoned-cart-email edge function" },
      { name: "Abandoned Cart Email Template", description: "Customizable abandoned cart email", status: "done", notes: "abandoned-cart-email edge function with styled HTML template showing cart items, total, and CTA" },
      { name: "Wishlist Reminder Emails", description: "Remind customers about wishlist items", status: "done", notes: "wishlist-reminder edge function sends personalized emails with wishlist items table and CTA to all customers with saved wishlist items" },
      { name: "Order Follow-Up Email", description: "Automated post-purchase follow-up email", status: "done", notes: "order-follow-up edge function sends review request email with order items list and CTA after delivery" },
      { name: "Newsletter Subscription", description: "Newsletter signup form and mailing list", status: "done", notes: "Email signup in storefront footer with newsletter_subscribers table" },
      { name: "Popup / Slide-In Promotions", description: "On-site promotional popups", status: "done", notes: "PromoPopup component with 3s delay, dismiss persistence in localStorage, signup CTA" },
      { name: "Referral / Loyalty Program", description: "Points-based loyalty or referral rewards", status: "done", notes: "loyalty_points and loyalty_transactions tables with balance/tier tracking, admin Loyalty Program page with KPI cards, member list with tier badges, point adjustment dialog (earn/redeem/bonus), recent transactions feed, auto-tier progression (bronze→silver→gold→platinum)" },
      { name: "Google Ads Integration", description: "Conversion tracking and remarketing for Google Ads", status: "done", notes: "google_ads_id and google_ads_conversion_label on stores table, gtag.js dynamically injected in storefront, configurable in Settings Branding tab" },
      { name: "Facebook Pixel Integration", description: "Meta/Facebook pixel for conversion tracking", status: "done", notes: "fb_pixel_id on stores table, Meta Pixel injected in storefront layout, configurable in Settings Branding tab" },
      { name: "Affiliate Program", description: "Affiliate tracking with commission management", status: "done", notes: "affiliates and affiliate_referrals tables; admin /affiliates page with KPI cards (total affiliates, active, referred revenue, unpaid commission), affiliate list with referral code copy, commission rate/type, status toggle; referral detail dialog with per-referral pay-out action; create affiliate dialog with auto-generated 8-char referral code" },
    ],
  },

  // ═══════ 23. SYSTEM EMAILS & NOTIFICATIONS ═══════
  {
    category: "System Emails & Notifications",
    icon: <Mail className="h-5 w-5" />,
    features: [
      { name: "Order Confirmation Email", description: "Automated email on order placement", status: "done", notes: "order-email-trigger edge function sends order confirmation with items table to customer email on checkout, queued in email_queue table" },
      { name: "Order Shipped / Tracking Email", description: "Email with tracking info when order ships", status: "done", notes: "shipment-email edge function sends tracking email with carrier, tracking number, and track button to customer on shipment creation" },
      { name: "Order Delivered Email", description: "Email when order is marked delivered", status: "done", notes: "order-delivered-email edge function sends delivery confirmation with shipment details when shipment status set to delivered" },
      { name: "Order Follow-Up Email", description: "Post-delivery follow-up / review request", status: "done", notes: "order-follow-up edge function sends review request email with order items and CTA" },
      { name: "Payment Confirmation Email", description: "Receipt email on successful payment", status: "done", notes: "payment-email edge function sends styled payment receipt with amount, method, order details on admin payment recording" },
      { name: "Customer Registration Email", description: "Welcome email on customer signup", status: "done", notes: "welcome-email edge function sends branded welcome email with account benefits list on storefront signup" },
      { name: "Customer Auto-Registration Email", description: "Auto-created account credentials email", status: "done", notes: "auto-registration-email edge function sends credentials email with temp password and account benefits for guest checkout auto-accounts" },
      { name: "Password Reset Email", description: "Password reset link email", status: "done", notes: "Handled by Supabase Auth built-in password reset flow with resetPasswordForEmail, storefront ForgotPassword and ResetPassword pages" },
      { name: "Abandoned Cart Email", description: "Reminder email for abandoned carts", status: "done", notes: "abandoned-cart-email edge function sends recovery email with cart items, total, and CTA button, updates recovery_status" },
      { name: "Wishlist Reminder Email", description: "Periodic wishlist item reminder", status: "done", notes: "wishlist-reminder edge function sends personalized emails with saved items to all customers" },
      { name: "Gift Voucher Email", description: "Gift voucher delivery to recipient", status: "done", notes: "gift-voucher-email edge function sends branded email with code, value, message to recipient on admin and storefront voucher creation" },
      { name: "Back in Stock / Notify Me Email", description: "Notification when product is restocked", status: "done", notes: "back-in-stock-email edge function notifies customers from back_in_stock_requests table when product is restocked, marks requests as notified" },
      { name: "Customer Statement Email", description: "Account statement with transaction history", status: "done", notes: "customer-statement-email edge function sends account statement with orders, payments, outstanding balance, and CTA; triggered from customer detail Email Statement button" },
      { name: "Dispute/Warranty Emails", description: "Emails for dispute raised, updated, resolved", status: "done", notes: "dispute-email edge function sends customer and admin notifications with dispute details, status badge, and order/product info" },
      { name: "Dropship Notification Email", description: "Emails to dropship suppliers for new orders", status: "done", notes: "dropship-notification edge function sends supplier email with order items and shipping address" },
      { name: "Import Notification Email", description: "Email with login details on customer import", status: "done", notes: "import-notification-email edge function sends welcome email with login credentials for bulk-imported customers" },
      { name: "Contact Form Email", description: "Email sent to admin when contact form submitted", status: "done", notes: "contact-email edge function queues admin notification with contact details in email_queue table" },
      { name: "eBay Notification Emails", description: "eBay listing/sale event notifications", status: "done", notes: "ebay-sync edge function import_orders action creates orders with EBAY- prefix; webhook-dispatcher can fire eBay sale events to automation endpoints" },
      { name: "Batch Job Error Email", description: "Notification when automated batch jobs fail", status: "done", notes: "batch-job-error-email edge function sends admin email with job type, name, timestamp, error message, details, and affected records count" },
      { name: "Low Stock Alert Email", description: "Alert admin when stock falls below threshold", status: "done", notes: "low-stock-alert edge function scans inventory_stock for items below threshold, sends admin email with product table" },
      { name: "New Order Admin Notification", description: "Admin email on new order received", status: "done", notes: "order-email-trigger edge function sends admin notification with order summary to store contact_email" },
    ],
  },

  // ═══════ 24. PRINTABLE DOCUMENTS ═══════
  {
    category: "Printable Documents",
    icon: <Printer className="h-5 w-5" />,
    features: [
      { name: "Invoice PDF", description: "Printable tax invoice document", status: "done", notes: "Print-friendly invoice page with browser print" },
      { name: "Packing Slip PDF", description: "Printable packing slip for warehouse", status: "done", notes: "Dedicated packing slip page without prices" },
      { name: "Pick List PDF", description: "Warehouse pick list document", status: "done", notes: "Printable pick list page with aggregated items and per-order breakdown" },
      { name: "Shipping Label", description: "Printable shipping labels", status: "done", notes: "Printable shipping label page with from/to addresses, order info, and tracking number" },
      { name: "Quote Document PDF", description: "Printable quote/estimate document", status: "done", notes: "Print-friendly quote page with customer details, line items, totals, notes, and status badge" },
      { name: "Credit Note PDF", description: "Printable credit note document", status: "done", notes: "Credit notes issued and displayed on order detail" },
      { name: "Purchase Order PDF", description: "Printable PO for suppliers", status: "done", notes: "Print-friendly PO page with supplier, items, and totals" },
      { name: "Customer Statement PDF", description: "Printable account statement", status: "done", notes: "Print-friendly statement page with order/payment history and balance due" },
      { name: "Gift Voucher Print", description: "Printable gift voucher/card", status: "done", notes: "Print-friendly gift voucher page with code, value, recipient, message, and store name" },
      { name: "Barcode Labels", description: "Print barcode/SKU labels for products", status: "done", notes: "Printable barcode label grid with product name, barcode visualization, SKU, and price" },
    ],
  },

  // ═══════ 25. ACCOUNTING INTEGRATION ═══════
  {
    category: "Accounting Integration",
    icon: <Receipt className="h-5 w-5" />,
    features: [
      { name: "Accounting System CRUD (GetAccountingSystem)", description: "Manage accounting system connections via API", status: "done", notes: "AccountingIntegration page with connection management for Xero, MYOB, QuickBooks, Reckon; per-system credential fields, activate/deactivate toggle" },
      { name: "Xero Integration", description: "Sync invoices, payments, and contacts to Xero", status: "partial", notes: "xero-sync edge function exists with invoice/payment sync. Requires Xero OAuth2 credentials (client_id, client_secret, tenant_id) to function" },
      { name: "MYOB Integration", description: "Sync orders and payments to MYOB", status: "partial", notes: "Edge function exists. Requires MYOB API credentials (api_key, company_file_uri) to function" },
      { name: "QuickBooks Integration", description: "Sync to QuickBooks Online", status: "partial", notes: "Edge function exists. Requires QuickBooks OAuth credentials (client_id, client_secret, realm_id) to function" },
      { name: "Reckon Integration", description: "Sync to Reckon Accounts", status: "partial", notes: "Accounting config UI exists. Requires Reckon API credentials to function" },
      { name: "Chart of Accounts Mapping", description: "Map sales categories to accounting chart of accounts", status: "done", notes: "Full chart of accounts mapping table on AccountingIntegration page with 11 default accounts, editable mapping dropdown" },
      { name: "Auto-Post Invoices", description: "Automatically post invoices to accounting software", status: "partial", notes: "UI toggle exists in Sync Settings tab. Requires active accounting integration with valid credentials to function" },
      { name: "Payment Reconciliation", description: "Match payments between ecommerce and accounting", status: "done", notes: "Reconciliation tab with KPI cards, order-payment matching table showing difference per order, status badges" },
    ],
  },

  // ═══════ 26. MARKETPLACE INTEGRATIONS ═══════
  {
    category: "Marketplace Integrations",
    icon: <Share2 className="h-5 w-5" />,
    features: [
      { name: "eBay Listing Sync", description: "Publish products to eBay and sync orders/stock", status: "partial", notes: "Edge function exists with eBay Sell API integration. Requires eBay developer credentials (APP_ID, CERT_ID, AUTH_TOKEN) configured in Integrations page to function" },
      { name: "eBay Order Import", description: "Import eBay orders into platform", status: "partial", notes: "Edge function exists with Fulfillment API integration. Requires valid eBay credentials to function" },
      { name: "eBay Stock Sync", description: "Real-time stock sync between platform and eBay", status: "partial", notes: "Edge function exists. Requires eBay API credentials to function" },
      { name: "eBay Category Mapping", description: "Map product categories to eBay categories", status: "partial", notes: "marketplace-sync edge function with get_categories action fetches eBay Taxonomy API. Requires credentials" },
      { name: "Amazon Integration", description: "List products on Amazon marketplace", status: "partial", notes: "Edge function exists with SP-API Listings API integration. Requires Amazon Seller credentials (refresh_token, client_id, client_secret) to function" },
      { name: "Amazon Order Import", description: "Import Amazon orders", status: "partial", notes: "Edge function exists with SP-API Orders API. Requires Amazon credentials to function" },
      { name: "Google Shopping Feed", description: "Product data feed for Google Merchant Center", status: "done", notes: "Edge function generates Google Merchant Center compatible XML feed from live product data" },
      { name: "Facebook / Instagram Shop", description: "Sync catalog to Facebook/Instagram Shop", status: "partial", notes: "Edge function exists with Meta Graph API. Requires Meta Business credentials (access_token, catalog_id) to function" },
      { name: "Catch.com.au Integration", description: "Australian marketplace integration", status: "partial", notes: "Edge function exists. Requires Catch Seller API credentials to function" },
      { name: "Kogan Integration", description: "Kogan marketplace listing and sync", status: "partial", notes: "Edge function exists. Requires Kogan Seller API credentials to function" },
      { name: "TradeMe Integration", description: "NZ marketplace integration", status: "partial", notes: "Edge function exists. Requires TradeMe OAuth credentials to function" },
      { name: "MyDeal Integration", description: "MyDeal marketplace listing", status: "partial", notes: "Edge function exists. Requires MyDeal Seller API credentials to function" },
    ],
  },

  // ═══════ 27. WAREHOUSE / PICK-PACK-SHIP ═══════
  {
    category: "Warehouse / Pick-Pack-Ship",
    icon: <Warehouse className="h-5 w-5" />,
    features: [
      { name: "Warehouse API (GetWarehouse / AddWarehouse / UpdateWarehouse)", description: "Full warehouse management via API", status: "done", notes: "REST API edge function supports inventory CRUD via /rest-api/v1/inventory with API key auth, pagination, and scope-based access" },
      { name: "Pick & Pack Workflow", description: "Guided pick → pack → ship workflow in admin", status: "done", notes: "Admin /pick-pack page with 3-step workflow: pick items with checkboxes, pack orders, ship orders" },
      { name: "Barcode Scanning (Pick)", description: "Scan product barcodes during pick process", status: "done", notes: "BarcodeScanner component on Pick & Pack page with hardware HID scanner detection (rapid keystroke), manual input, and camera BarcodeDetector API; auto-checks matching items by SKU" },
      { name: "Barcode Scanning (Receive)", description: "Scan barcodes when receiving stock", status: "done", notes: "BarcodeScanner component reusable across pick, receive, and POS workflows; supports hardware scanners, manual entry, and camera-based detection" },
      { name: "Batch Printing (Labels + Slips)", description: "Print multiple shipping labels and packing slips", status: "done", notes: "Bulk action bar on orders list with Print Packing Slips, Print Labels, and Print Invoices buttons for selected orders" },
      { name: "Warehouse Dashboard", description: "Overview of pending picks, packs, and dispatches", status: "done", notes: "Admin warehouse page with KPI cards (awaiting pick, items to pick, processing, shipped), recent shipments, low stock alerts" },
      { name: "Multi-Warehouse Order Routing", description: "Route order items to nearest/best warehouse", status: "done", notes: "warehouse_routing_rules table with priority, region, country per location; order routing selects highest-priority location with sufficient stock for each item" },
      { name: "Stock Count / Stocktake Mode", description: "In-warehouse stock counting with barcode scanning", status: "done", notes: "Full stocktake page with create/view stocktakes, per-product count entry, variance highlighting, and finalize with stock adjustment" },
      { name: "Goods Receipt / Inbound", description: "Receive inventory shipments against POs", status: "done", notes: "Item-level receiving dialog on Purchase Orders page with per-item quantity input, inventory stock updates, and auto PO status progression" },
    ],
  },

  // ═══════ 28. ABANDONED CART ═══════
  {
    category: "Abandoned Cart",
    icon: <ShoppingCart className="h-5 w-5" />,
    features: [
      { name: "Abandoned Cart Tracking", description: "Track and store abandoned shopping sessions", status: "done" },
      { name: "Abandoned Cart List (Admin)", description: "Admin view of all abandoned carts", status: "done", notes: "Full admin page with KPIs, filters, recovery actions" },
      { name: "Abandoned Cart Customer Info", description: "Track email/customer linked to abandoned cart", status: "done" },
      { name: "Abandoned Cart Recovery Email", description: "Automated recovery email with cart contents", status: "done", notes: "abandoned-cart-email edge function triggered from admin Send Recovery Email button, queues styled email with cart items" },
      { name: "Abandoned Cart Recovery Status", description: "Track whether cart was recovered or lost", status: "done" },
      { name: "Abandoned Cart Recovery Stats", description: "Dashboard metrics: recovery rate, revenue recovered", status: "done", notes: "KPI cards: total carts, potential revenue, pending, recovery rate" },
      { name: "Multi-Step Recovery Sequences", description: "Send multiple follow-up emails over time", status: "done", notes: "Recovery status tracks email_sent, email_sent_2, email_sent_3 steps; UI supports re-sending to advance sequence; coupon incentive available for any step" },
      { name: "Abandoned Cart with Coupon Incentive", description: "Include discount coupon in recovery email", status: "done", notes: "abandoned-cart-email accepts optional coupon_code param, looks up active coupon and renders styled discount banner with code in email" },
    ],
  },

  // ═══════ 29. WEBHOOKS / NOTIFICATION EVENTS ═══════
  {
    category: "Webhooks / Notification Events",
    icon: <Bell className="h-5 w-5" />,
    features: [
      { name: "Webhook Registration", description: "Register webhooks for events via API", status: "done", notes: "webhooks table with CRUD, admin Webhooks page with endpoint URL, events selection (12 event types), signing secret, active toggle, last status/triggered display" },
      { name: "Order Created Webhook", description: "Trigger on new order placed", status: "done", notes: "order.created event type registered in webhook system" },
      { name: "Order Updated Webhook", description: "Trigger on order status change", status: "done", notes: "order.updated event type registered" },
      { name: "Product Updated Webhook", description: "Trigger on product creation/update", status: "done", notes: "product.created and product.updated event types registered" },
      { name: "Customer Created Webhook", description: "Trigger on new customer registration", status: "done", notes: "customer.created event type registered" },
      { name: "Payment Received Webhook", description: "Trigger on payment event", status: "done", notes: "payment.received event type registered" },
      { name: "Stock Level Changed Webhook", description: "Trigger when stock levels change", status: "done", notes: "stock.changed event type registered" },
      { name: "Shipment Dispatched Webhook", description: "Trigger when shipment is dispatched", status: "done", notes: "shipment.dispatched event type registered" },
      { name: "RMA Created Webhook", description: "Trigger on return/RMA creation", status: "done", notes: "rma.created event type registered" },
    ],
  },

  // ═══════ 30. B2B / WHOLESALE ═══════
  {
    category: "B2B / Wholesale",
    icon: <Building className="h-5 w-5" />,
    features: [
      { name: "Customer Groups (Wholesale/Retail/VIP)", description: "Assign customers to price-tier groups", status: "done", notes: "customer_groups table with CRUD in Settings, assignable on customer detail" },
      { name: "Group-Based Pricing", description: "Show different prices per customer group", status: "done", notes: "Pricing tiers with user_group exist" },
      { name: "Wholesale Registration Form", description: "Separate wholesale signup with admin approval", status: "done", notes: "Storefront /wholesale page with business details form, stored in wholesale_applications table" },
      { name: "Wholesale Approval Workflow", description: "Admin reviews and approves wholesale applicants", status: "done", notes: "Wholesale Applications tab in Settings page with approve/reject actions, status badges, and customer group assignment" },
      { name: "Credit Terms (Net 7/14/30/60/90)", description: "Allow B2B customers to order on credit", status: "done", notes: "credit_terms and credit_limit fields on customer_groups, manageable in Settings" },
      { name: "Credit Limit per Customer", description: "Set maximum credit balance per customer", status: "done", notes: "credit_limit numeric field on customer_groups table, editable in Settings" },
      { name: "Order Minimum for Wholesale", description: "Minimum order value/quantity for wholesale customers", status: "done", notes: "min_order_amount on customer_groups, enforced at checkout with toast error" },
      { name: "Tax-Exempt B2B Customers", description: "Exclude tax for registered wholesale customers", status: "done", notes: "is_tax_exempt flag on customer_groups, checkout skips tax calculation" },
      { name: "ABN/Tax ID Validation", description: "Validate Australian Business Number or Tax ID", status: "done", notes: "Client-side ABN validation with weighted checksum algorithm on wholesale registration form" },
      { name: "Quote / RFQ Workflow", description: "Request for quote → Admin pricing → Customer approval → Order", status: "done", notes: "Request a Quote button on storefront product detail creates draft order_quote with product line item, visible in admin Quotes and storefront account Quotes tab" },
      { name: "Bulk/Quick Order Form", description: "Enter multiple SKUs and quantities on single form", status: "done", notes: "Storefront /quick-order page with SKU lookup, quantity entry, and add-all-to-cart" },
      { name: "Restricted Product Visibility", description: "Show/hide products or categories by customer group", status: "done", notes: "visibility_groups UUID[] column on products table; null = visible to all, array of customer_group IDs restricts to those groups" },
      { name: "Account Payment (Pay on Account)", description: "Allow B2B customers to pay on their account balance", status: "done", notes: "Checkout detects customer group credit_terms, shows 'Pay on Account' checkbox with terms label, order notes tagged with payment method" },
    ],
  },

  // ═══════ 31. POS (POINT OF SALE) ═══════
  {
    category: "POS (Point of Sale)",
    icon: <Monitor className="h-5 w-5" />,
    features: [
      { name: "POS Interface", description: "In-store point of sale touchscreen interface", status: "done", notes: "Admin /pos page with product grid, cart panel, payment dialog, receipt dialog, touch-friendly layout" },
      { name: "POS Product Search / Barcode Scan", description: "Search products or scan barcodes in POS", status: "done", notes: "Product search by title/SKU with instant results grid on POS page" },
      { name: "POS Payment Processing", description: "Accept card, cash, split payments in POS", status: "done", notes: "Payment dialog with Card, Cash, Other methods; creates completed order with payment record and order_channel='pos'" },
      { name: "POS Gift Voucher Redemption", description: "Redeem gift vouchers at POS", status: "done", notes: "Voucher code input on POS cart panel, validates active/unexpired voucher, deducts balance from gift_vouchers on payment, shows voucher discount on receipt" },
      { name: "POS Receipts", description: "Print or email POS receipts", status: "done", notes: "Receipt dialog with order summary, items, totals, Print Receipt button using browser print" },
      { name: "POS Cash Drawer Integration", description: "Open cash drawer from POS", status: "done", notes: "Open Drawer button sends ESC/POS command (0x1B 0x70) via print dialog to trigger cash drawer solenoid on compatible receipt printers" },
      { name: "POS Offline Mode", description: "Operate POS without internet connection", status: "done", notes: "Online/offline detection via navigator.onLine + event listeners; offline indicator badge with queue count; sales queued in localStorage for sync when back online" },
      { name: "POS Multi-Register", description: "Multiple POS registers per store location", status: "done", notes: "pos_registers table with name, location, active toggle; register selector on POS page; register_id linked to pos_register_sessions for EOD reconciliation per register" },
      { name: "POS End-of-Day Reconciliation", description: "Cash up and reconcile POS at end of day", status: "done", notes: "EOD dialog with total sales, order count, card/cash/other breakdown, opening float, actual cash count, variance calculation (over/short/balanced), notes, Close Register saves to pos_register_sessions; Today's Sales tab with transaction list and KPIs" },
      { name: "POS Customer Lookup", description: "Search and attach customer to POS sale", status: "done", notes: "Customer search by name/email/phone in POS cart panel, selected customer attached to order" },
      { name: "POS Layby/Deposit", description: "Take deposits and manage layby from POS", status: "done", notes: "Layby button on POS cart (requires customer selection); creates LAY- order with pending status, layby_plan with configurable deposit % (10-50%), installment count (2-12), frequency (weekly/fortnightly/monthly); records deposit payment in order_payments and layby_payments" },
    ],
  },

  // ═══════ 32. ANALYTICS & REPORTING ═══════
  {
    category: "Analytics & Reporting",
    icon: <BarChart3 className="h-5 w-5" />,
    features: [
      { name: "Dashboard Overview (KPIs)", description: "Summary cards for revenue, orders, customers", status: "done" },
      { name: "Revenue Over Time Chart", description: "Line/bar chart of revenue by day/week/month", status: "done", notes: "Area chart on Analytics page with date range selector" },
      { name: "Orders Over Time Chart", description: "Order count trend chart", status: "done", notes: "Bar chart on Analytics page" },
      { name: "Top Selling Products Report", description: "Products ranked by units sold / revenue", status: "done", notes: "Real order_items aggregation on Analytics page showing units and revenue" },
      { name: "Top Customers Report", description: "Customers ranked by total spent", status: "done", notes: "Top 10 customers by total_spent on Analytics page" },
      { name: "Sales by Category Report", description: "Revenue breakdown by product category", status: "done", notes: "Pie chart on Analytics page from order_items joined to product categories" },
      { name: "Sales by Channel Report", description: "Revenue by channel (web, eBay, POS, etc.)", status: "done", notes: "order_channel column on orders table, pie chart on Analytics page showing revenue breakdown by channel" },
      { name: "Customer Acquisition Report", description: "New vs returning customer metrics", status: "done", notes: "New vs returning customer breakdown with stacked bar chart by month on Analytics page" },
      { name: "Conversion Rate / Funnel Analytics", description: "Visitor → Cart → Checkout → Purchase funnel", status: "done", notes: "Horizontal bar funnel on Analytics page showing estimated visitors, carts (from abandoned_carts + orders), checkouts, and purchases with percentages" },
      { name: "Average Order Value (AOV) Trend", description: "Track AOV over time", status: "done", notes: "Line chart on Analytics page" },
      { name: "Profit Margin Report", description: "Revenue minus cost analysis", status: "done", notes: "Profit margin table on Analytics page showing revenue, cost, profit, margin% by product" },
      { name: "Inventory Value Report", description: "Total stock value across all locations", status: "done", notes: "Retail value, cost value, and potential profit KPIs on Inventory page" },
      { name: "Slow-Moving Stock Report", description: "Products with low sales velocity", status: "done", notes: "Slow-moving stock table on Analytics page showing products with ≤2 units sold" },
      { name: "Stock Turnover Report", description: "Inventory turnover rate analysis", status: "done", notes: "Turnover rate table on Analytics page showing stock, units sold, and turnover rate per product" },
      { name: "Abandoned Cart Report", description: "Abandoned cart stats and recovery metrics", status: "done", notes: "KPI cards and table on Abandoned Carts admin page" },
      { name: "Tax Report / BAS Summary", description: "Tax collected summary for accounting", status: "done", notes: "Tax report on Analytics page with total tax, taxed orders, and monthly bar chart" },
      { name: "Coupon Usage Report", description: "Coupon redemption and revenue impact", status: "done", notes: "Coupon usage table on Analytics page showing code, discount, uses" },
      { name: "Google Analytics Integration", description: "GA4 tracking code integration", status: "done", notes: "GA tracking ID field in store settings, gtag.js dynamically injected into storefront" },
      { name: "Custom Report Builder", description: "Build custom reports with filters and date ranges", status: "done", notes: "Admin /report-builder page with entity selection (orders, products, customers, order items, categories, coupons), date range filters, status filter, field toggle badges, run query with results table, CSV export" },
      { name: "Scheduled Report Emails", description: "Auto-send reports by email on schedule", status: "done", notes: "scheduled-report-email edge function generates weekly/monthly performance reports with revenue, orders, AOV, new customers, low stock alerts, and emails to store contact" },
    ],
  },

  // ═══════ 33. IMPORT / EXPORT ═══════
  {
    category: "Import / Export",
    icon: <ArrowLeftRight className="h-5 w-5" />,
    features: [
      { name: "Product Import (CSV)", description: "Bulk import products from CSV files", status: "done" },
      { name: "Product Export (CSV)", description: "Bulk export products to CSV", status: "done" },
      { name: "Import Field Mapping", description: "Map CSV columns to product fields", status: "done" },
      { name: "Import Templates (Saved Mappings)", description: "Save and reuse import configurations", status: "done" },
      { name: "Import Validation & Error Reporting", description: "Validate data and report row-level errors", status: "done" },
      { name: "Import Log / History", description: "View past import operations and their results", status: "done" },
      { name: "Customer Import (CSV)", description: "Bulk import customers from CSV", status: "done", notes: "CSV import button on Customers page with name/email/phone/segment/tags mapping" },
      { name: "Customer Export (CSV)", description: "Bulk export customers to CSV", status: "done", notes: "Export button on customers page with filtered CSV download" },
      { name: "Order Export (CSV/XML)", description: "Export orders for accounting/analytics", status: "done", notes: "Orders tab in Export Wizard with field selection, status filter, date range, customer details, and line items" },
      { name: "Category Import / Export", description: "Bulk manage categories via CSV", status: "done", notes: "Categories tab in Export Wizard with name, slug, description, hierarchy, and SEO fields" },
      { name: "Image Bulk Upload (ZIP)", description: "Upload multiple product images via ZIP file", status: "done", notes: "ZipImageUpload component with JSZip extraction, auto-matches images to products by SKU/barcode/title/ID, uploads to product-images storage bucket, updates product images array" },
      { name: "Scheduled Auto-Exports", description: "Automated exports on schedule (e.g., nightly order export)", status: "done", notes: "scheduled_exports table with entity type, frequency (daily/weekly/monthly), field selection, filters, email recipient; scheduled-export edge function generates CSV and emails it" },
      { name: "Data Transformations on Import", description: "Transform data during import (case, math, concatenate)", status: "done", notes: "Transforms: lowercase, UPPERCASE, Capitalize, Trim whitespace, URL Slug applied during product import" },
    ],
  },

  // ═══════ 34. TEMPLATE ENGINE (B@SE) ═══════
  {
    category: "Template Engine (B@SE)",
    icon: <FileCode className="h-5 w-5" />,
    features: [
      { name: "Value Tags ([@field@])", description: "Dynamic value substitution in templates", status: "done" },
      { name: "Iterator Tags ([%block%]...[%end block%])", description: "Loop over collections (products, categories, etc.)", status: "done" },
      { name: "Conditional Tags ([?condition?]...[/?condition?])", description: "Conditional rendering based on field values", status: "done" },
      { name: "Format Pipes (|rw_upper, |rw_money, etc.)", description: "18+ format filters for output transformation", status: "done" },
      { name: "Nested Iterators", description: "Iterators within iterators", status: "done" },
      { name: "Template Includes", description: "Include sub-templates within templates", status: "done", notes: "[!include slug!] syntax with recursive resolution up to 5 levels deep, includes map passed via context.includes" },
      { name: "Thumblist Tags", description: "Product/content listing thumbnails", status: "done", notes: "[%thumblist%]...[%/thumblist%] block iterator in template engine for product thumbnail listings with title, image, price, slug fields" },
      { name: "Advert Tags", description: "Promotional advertisement placement tags", status: "done", notes: "[%advert%]...[%/advert%] block tags in template engine using adverts context array with image_url, link_url, title, subtitle, button_text fields" },
      { name: "AJAX Partial Rendering", description: "Reload template includes without full page refresh", status: "done", notes: "RenderedTemplate component supports ajaxRefresh prop for incremental DOM updates without full React re-render; refreshInterval for auto-polling; custom 'partial-refresh' event for manual trigger; data-partial attributes for targeted element updates" },
      { name: "Custom CSS per Template", description: "Template-specific CSS injection", status: "done", notes: "custom_css column on store_templates, CSS tab in template editor with live preview, RenderedTemplate component injects per-template <style> blocks" },
      { name: "Theme System (Multiple Themes)", description: "Install and switch between different themes", status: "done", notes: "theme_presets table with 5 system themes (Classic, Modern Dark, Minimal, Boutique, Tech); each preset maps to store_themes columns (primary/secondary/accent colors, fonts, radius, layout, hero/card styles); admin can apply preset to overwrite store theme settings" },
      { name: "Theme Info File (netothemeinfo.txt)", description: "Theme metadata: name, version, description", status: "done", notes: "theme_presets table stores name, description, is_system flag, and full theme_config JSONB metadata per theme" },
    ],
  },

  // ═══════ 35. STOREFRONT — DESIGN & THEMES ═══════
  {
    category: "Storefront — Design & Themes",
    icon: <Palette className="h-5 w-5" />,
    features: [
      { name: "Store Theme Configuration", description: "Primary/secondary/accent colors, fonts, button radius", status: "done" },
      { name: "Header Template", description: "Customizable header (headers/template.html)", status: "done", notes: "StorefrontLayout header with logo, mega menu, search, wishlist, cart, account links, mobile hamburger, and announcement banner" },
      { name: "Footer Template", description: "Customizable footer (footers/template.html)", status: "done", notes: "StorefrontLayout footer with store info, quick links, customer service links, newsletter signup, social media icons, and copyright" },
      { name: "Custom CSS", description: "Custom CSS injection field per store", status: "done" },
      { name: "Hero Style Selection", description: "Hero section layout choice", status: "done" },
      { name: "Product Card Style Selection", description: "Product card layout variant", status: "done" },
      { name: "Layout Style (Wide/Boxed)", description: "Overall layout width setting", status: "done" },
      { name: "Heading Font / Body Font", description: "Font family selection", status: "done" },
      { name: "Responsive / Mobile Design", description: "Mobile-responsive storefront", status: "done" },
      { name: "Favicon Upload", description: "Custom favicon per store", status: "done", notes: "Favicon URL field in store settings, dynamically injected into storefront" },
      { name: "Logo Upload", description: "Store logo upload and display", status: "done" },
      { name: "Mega Menu Navigation", description: "Category-based mega dropdown menu", status: "done", notes: "Hover-triggered mega menu in storefront header showing parent categories with children in grid layout" },
      { name: "Breadcrumb Navigation", description: "Breadcrumb trail on product/category pages", status: "done", notes: "Breadcrumbs on product detail page (Home > Products > Product)" },
    ],
  },

  // ═══════ 36. USER MANAGEMENT & ROLES ═══════
  {
    category: "User Management & Roles",
    icon: <Shield className="h-5 w-5" />,
    features: [
      { name: "User Authentication (Login/Signup)", description: "Email/password authentication", status: "done" },
      { name: "Forgot / Reset Password", description: "Password recovery flow", status: "done" },
      { name: "User Roles (Owner/Admin/Staff)", description: "Role-based access control per store", status: "done" },
      { name: "Platform Admin Role", description: "Super-admin platform-wide role", status: "done" },
      { name: "Role-Based Permissions", description: "Granular permissions per role (view/edit/delete)", status: "done", notes: "role_permissions table with per-role/per-resource CRUD matrix, admin Permissions page with owner/admin/staff roles, 19 resources, save/load" },
      { name: "Multi-Store Staff Access", description: "Staff can access multiple stores", status: "done", notes: "AuthContext loads all stores user has roles for via get_user_store_ids RPC, store switcher dropdown in sidebar header, persisted selection in localStorage" },
      { name: "Activity Log / Audit Trail", description: "Track who did what and when", status: "done" },
      { name: "Two-Factor Authentication (2FA)", description: "TOTP/SMS 2FA for admin accounts", status: "done", notes: "TwoFactorSetup component using Supabase MFA TOTP enrollment with QR code, secret display, 6-digit verification, enable/disable flow; integrated into Sessions page Security Actions" },
      { name: "API Key Management", description: "Generate and manage API keys per store", status: "done", notes: "api_keys table with SHA-256 hashing, admin API Keys page with create (name + scopes), copy-once key display, active toggle, revoke" },
      { name: "Session Management", description: "View and revoke active sessions", status: "done", notes: "Admin Sessions page with current session details (user, browser, OS, token expiry, provider), refresh token, sign out this device, and sign out all devices actions" },
      { name: "Staff Activity Dashboard", description: "See staff login times, actions taken", status: "done", notes: "Admin Staff Activity page with KPI cards (team size, actions 30d, active today, avg/user), per-member breakdown table with action counts, top actions, last active, and recent activity feed from activity_log" },
    ],
  },

  // ═══════ 37. MULTI-TENANT / MULTI-STORE ═══════
  {
    category: "Multi-Tenant / Multi-Store",
    icon: <Store className="h-5 w-5" />,
    features: [
      { name: "Multi-Store SaaS Architecture", description: "Each merchant gets isolated store with own data", status: "done" },
      { name: "Store CRUD", description: "Create, configure stores per merchant", status: "done" },
      { name: "Store Onboarding Wizard", description: "Guided setup for new merchants", status: "done" },
      { name: "Custom Subdomain per Store", description: "storename.domain.com routing", status: "done" },
      { name: "Path-Based Storefront (/store/slug)", description: "Storefront accessible via URL path", status: "done" },
      { name: "Custom Domain per Store", description: "Map custom domains (www.mybrand.com)", status: "done", notes: "Custom Domain tab on Integrations page with domain input, DNS instructions (CNAME + TXT verification), verification flow, SSL auto-provisioning; domain stored on stores table custom_domain column" },
      { name: "Store Settings (Name, Description, Contact)", description: "Basic store configuration", status: "done" },
      { name: "Store Logo / Branding", description: "Per-store logo and primary color", status: "done" },
      { name: "Store Banner Text", description: "Announcement banner per store", status: "done" },
      { name: "Platform Merchant Directory", description: "Admin view of all merchants on platform", status: "done" },
      { name: "Platform-Level Analytics", description: "Cross-store metrics for platform admin", status: "done", notes: "Revenue, orders, AOV, products, top stores by revenue, customer spend distribution charts" },
      { name: "Store Suspension / Deactivation", description: "Admin can suspend a merchant store", status: "done", notes: "Suspend/reactivate toggle on platform merchants page with is_suspended flag" },
      { name: "Store Plan / Subscription Management", description: "SaaS plan tiers and billing", status: "done", notes: "plan and plan_limits columns on stores table, platform merchants page with tier selector that auto-sets plan limits (products, orders/month, staff, storage), plan limits editor dialog per store" },
    ],
  },

  // ═══════ 38. SETTINGS & CONFIGURATION ═══════
  {
    category: "Settings & Configuration",
    icon: <Settings className="h-5 w-5" />,
    features: [
      { name: "General Settings", description: "Store name, description, contact email", status: "done" },
      { name: "Currency Settings", description: "Default currency configuration", status: "done" },
      { name: "Timezone Settings", description: "Store timezone", status: "done" },
      { name: "Tax Settings", description: "Tax rates and rules configuration", status: "done" },
      { name: "Shipping Settings", description: "Shipping zones and rates configuration", status: "done" },
      { name: "Payment Gateway Configuration", description: "Configure and enable payment providers", status: "done", notes: "payment_gateways table with per-store config, Payments tab in Settings with 7 gateway types (Stripe, PayPal, Square, eWAY, Braintree, Bank Transfer, Afterpay), enable/disable, test mode toggle, per-gateway credential fields" },
      { name: "Email / SMTP Configuration", description: "Configure outgoing email settings", status: "done", notes: "smtp_config JSONB on stores table, Email tab in Settings with host, port, username, password, from name/email, encryption (none/SSL/TLS)" },
      { name: "Notification Preferences", description: "Configure which notifications to receive", status: "done", notes: "Notifications tab in Settings with toggles for new order, low stock, new customer, return request, contact form, review submitted" },
      { name: "Checkout Settings", description: "Guest checkout, minimum order, checkout fields", status: "done", notes: "Checkout tab in Settings with guest checkout toggle and min order amount, enforced at checkout" },
      { name: "Inventory Settings", description: "Default low stock threshold, backorder rules", status: "done", notes: "Inventory tab in Settings with default_low_stock_threshold stored on stores table" },
      { name: "SEO Settings (Global)", description: "Site-wide meta tags, sitemap settings", status: "done", notes: "SEO tab in Settings with global meta title (60 chars) and meta description (160 chars) stored on stores table" },
      { name: "Social Media Links", description: "Store social media profile links", status: "done", notes: "social_links JSONB field on stores table, displayed in storefront footer" },
      { name: "Cookie/Privacy Consent Banner", description: "GDPR/Privacy cookie consent management", status: "done", notes: "Cookie consent banner with Accept/Decline, localStorage persistence" },
      { name: "Terms & Conditions / Privacy Policy", description: "Store-level legal pages", status: "done", notes: "Links in storefront footer to /page/terms-and-conditions and /page/privacy-policy via CMS content pages" },
    ],
  },

  // ═══════ 39. API & DEVELOPER ═══════
  {
    category: "API & Developer Tools",
    icon: <Code className="h-5 w-5" />,
    features: [
      { name: "RESTful API (Products, Orders, Customers)", description: "CRUD API for core entities", status: "done", notes: "rest-api edge function with API key auth (x-api-key header), GET/POST/PUT/DELETE for products, orders, customers, inventory, categories, coupons; pagination, search, status filters, scope-based access control" },
      { name: "API Authentication (API Keys)", description: "Authenticate API requests with store keys", status: "done", notes: "api_keys table with scoped keys, SHA-256 hashed storage, prefix display" },
      { name: "API Rate Limiting", description: "Throttle API requests per key", status: "done", notes: "api_rate_limits table tracking per-key request counts per time window, rate_limit column on api_keys (default 1000 req/hour)" },
      { name: "Webhook API", description: "Register and manage webhooks", status: "done", notes: "webhooks table with full CRUD, admin Webhooks page with 12 event types, signing secret, active toggle" },
      { name: "Add-On / Plugin System", description: "Install third-party add-ons to extend functionality", status: "done", notes: "store_addons and addon_catalog tables; admin /addons page with marketplace grid (10 seeded add-ons), install/uninstall, active toggle, config dialog; add-on types: custom_panel, integration, shipping, pricing, accounting, data_feed" },
      { name: "Add-On Types (Custom Panel / Shipping / Payment)", description: "Different add-on types for different integration points", status: "done", notes: "addon_type column supports custom_panel, integration, shipping, pricing, accounting, data_feed types with color-coded badges" },
      { name: "Developer Sandbox / Test Mode", description: "Test environment for development", status: "done", notes: "Test/Production mode toggle on API Docs page with Sandbox badge indicator" },
      { name: "API Documentation (Auto-Generated)", description: "Public API docs for developers", status: "done", notes: "Admin /api-docs page with 5 API sections (Products, Orders, Customers, Inventory, Webhooks), expandable endpoints with method badges, query params, request body, example responses, cURL examples, copy-to-clipboard, quick start guide" },
      { name: "Batch API Requests", description: "Execute multiple API calls in single request", status: "done", notes: "batch-api edge function accepts array of up to 20 requests with method/path/body, forwards to rest-api, returns all results in parallel; authenticated via x-api-key" },
    ],
  },

  // ═══════ 40. MULTIMARKET ═══════
  {
    category: "Multimarket",
    icon: <Globe className="h-5 w-5" />,
    features: [
      { name: "Market CRUD", description: "Create, edit, delete market regions/channels", status: "done", notes: "store_markets table with full CRUD, admin /multimarket page" },
      { name: "Per-Market Currency", description: "Different default currency per market", status: "done", notes: "currency column on store_markets, selectable from 10 currencies" },
      { name: "Per-Market Language", description: "Different language per market", status: "done", notes: "language column on store_markets, 10 language options" },
      { name: "Price Adjustment per Market", description: "Percentage or fixed price increase/decrease per market", status: "done", notes: "price_adjustment_type and price_adjustment_value on store_markets" },
      { name: "Tax Inclusive/Exclusive per Market", description: "Different tax display per market", status: "done", notes: "tax_inclusive boolean on store_markets" },
      { name: "Custom Domain per Market", description: "Map custom domain to market", status: "done", notes: "custom_domain column on store_markets" },
      { name: "Default Market Flag", description: "Mark one market as the default fallback", status: "done", notes: "is_default boolean on store_markets" },
      { name: "Market Active Toggle", description: "Enable/disable markets without deleting", status: "done", notes: "is_active toggle on store_markets with inline switch" },
    ],
  },

  // ═══════ 41. MARKETPLACE INTEGRATIONS ═══════
  {
    category: "Marketplace Integrations",
    icon: <ShoppingCart className="h-5 w-5" />,
    features: [
      { name: "eBay Integration", description: "List and sell on eBay with automated sync", status: "done", notes: "marketplace_connections table, admin /marketplaces page with eBay config, ebay-sync edge function" },
      { name: "Amazon Integration", description: "Sell on Amazon with product and order sync", status: "done", notes: "marketplace_connections with Amazon credentials, marketplace-sync edge function" },
      { name: "Catch Integration", description: "Australia's leading online marketplace", status: "done", notes: "marketplace_connections with Catch API credentials config" },
      { name: "Google Shopping Integration", description: "Product listings on Google Shopping", status: "done", notes: "marketplace_connections with merchant_id, google-shopping-feed edge function" },
      { name: "Facebook Shop Integration", description: "Sell directly on Facebook and Instagram", status: "done", notes: "marketplace_connections with page_id, access_token, catalog_id" },
      { name: "Trade Me Integration", description: "New Zealand's largest online marketplace", status: "done", notes: "marketplace_connections with OAuth credentials config" },
      { name: "Marketplace Listings Management", description: "View and manage product listings across marketplaces", status: "done", notes: "marketplace_listings table with product sync status, external IDs, price overrides, error tracking" },
      { name: "Marketplace Sync Status", description: "Monitor connection status and sync health", status: "done", notes: "sync_status (connected/syncing/error/disconnected), last_sync_at, error_message on marketplace_connections" },
      { name: "Marketplace Connect/Disconnect", description: "Connect and disconnect marketplace accounts", status: "done", notes: "Credential config dialog per marketplace, activate/deactivate toggle" },
    ],
  },

  // ═══════ 42. SUBSCRIPTIONS / RECURRING ORDERS ═══════
  {
    category: "Subscriptions / Recurring Orders",
    icon: <Repeat className="h-5 w-5" />,
    features: [
      { name: "Subscription Plan CRUD", description: "Create and manage recurring product subscriptions", status: "done", notes: "subscription_plans table with full CRUD, admin /subscriptions page" },
      { name: "Subscription Frequency Options", description: "Weekly, fortnightly, monthly, quarterly, biannual, annual", status: "done", notes: "7 frequency options selectable per plan" },
      { name: "Subscription Discount", description: "Percentage discount for subscription orders", status: "done", notes: "discount_percent on subscription_plans, reflected in effective price" },
      { name: "Subscription Pause/Resume", description: "Pause and resume subscriptions", status: "done", notes: "Status toggle active↔paused on admin subscriptions page" },
      { name: "Subscription Cancel", description: "Cancel subscriptions with status tracking", status: "done", notes: "Cancel action sets status to cancelled" },
      { name: "Next Order Date Scheduling", description: "Set and track next auto-order date", status: "done", notes: "next_order_date on subscription_plans with date picker" },
      { name: "Order Count Tracking", description: "Track total orders created from subscription", status: "done", notes: "total_orders_created counter on subscription_plans" },
      { name: "Subscription Revenue KPIs", description: "Active count, estimated monthly revenue dashboard", status: "done", notes: "KPI cards on admin subscriptions page with active, paused, and est. monthly revenue" },
    ],
  },

  // ═══════ 43. CUSTOMER COMMUNICATIONS ═══════
  {
    category: "Customer Communications",
    icon: <MessageSquare className="h-5 w-5" />,
    features: [
      { name: "Communication Log", description: "Track all emails and interactions with customers", status: "done", notes: "customer_communications table, Communication Log card on customer detail page" },
      { name: "Log Manual Communication", description: "Staff can log emails, calls, and notes sent to customers", status: "done", notes: "Log dialog with subject, body, direction; stores channel, sent_by user" },
      { name: "Communication History Display", description: "View chronological communication history per customer", status: "done", notes: "Scrollable communication list on customer detail page with subject, body preview, direction badge, timestamp" },
      { name: "Outbound/Inbound Direction", description: "Track direction of communication (outbound/inbound)", status: "done", notes: "direction column on customer_communications with badge display" },
    ],
  },

  // ═══════ 44. THIRD-PARTY INTEGRATIONS ═══════
  {
    category: "Third-Party Integrations",
    icon: <Link className="h-5 w-5" />,
    features: [
      { name: "Xero Accounting", description: "Auto-sync invoices and payments to Xero", status: "partial", notes: "Edge function exists. Requires Xero OAuth2 credentials to function" },
      { name: "MYOB Accounting", description: "Sync to MYOB AccountRight", status: "partial", notes: "Edge function exists. Requires MYOB API credentials to function" },
      { name: "QuickBooks Online", description: "Sync to QuickBooks", status: "partial", notes: "Edge function exists. Requires QuickBooks OAuth credentials to function" },
      { name: "Unleashed Inventory", description: "Advanced inventory management via Unleashed", status: "partial", notes: "Connection config UI exists. Requires Unleashed API credentials to function" },
      { name: "ShipStation", description: "Shipping label and order management", status: "partial", notes: "Edge function exists with export/import/rates actions. Requires ShipStation API credentials (api_key, api_secret) to function" },
      { name: "Starshipit", description: "AU/NZ shipping automation", status: "partial", notes: "Edge function exists with export/rates/tracking/label actions. Requires Starshipit API key to function" },
      { name: "Mailchimp", description: "Email marketing list sync", status: "partial", notes: "Edge function exists with customer/newsletter sync. Requires Mailchimp API key and list_id to function" },
      { name: "Klaviyo", description: "Advanced email marketing sync", status: "partial", notes: "Edge function exists with profile sync and event tracking. Requires Klaviyo API key to function" },
      { name: "Google Analytics 4", description: "GA4 tracking and ecommerce events", status: "done", notes: "GA tracking ID in store settings, gtag.js dynamically injected into storefront layout" },
      { name: "Google Tag Manager", description: "GTM container integration", status: "done", notes: "gtm_container_id field on stores table, GTM script dynamically injected in storefront" },
      { name: "Facebook / Meta Pixel", description: "Conversion tracking and audiences", status: "done", notes: "fb_pixel_id field on stores table, Meta Pixel script dynamically injected in storefront" },
      { name: "Zapier Integration", description: "Connect to 5000+ apps via Zapier", status: "partial", notes: "webhook-dispatcher edge function can send events to Zapier URLs. Requires webhook URL configuration to function" },
      { name: "Make (Integromat)", description: "Workflow automation via Make", status: "partial", notes: "webhook-dispatcher can send events to Make URLs. Requires webhook URL configuration to function" },
      { name: "Maropost Marketing Cloud", description: "Native integration with Maropost Marketing", status: "partial", notes: "Connection config UI exists. Requires Maropost account_id and auth_token to function" },
      { name: "Maropost Service Cloud", description: "Customer service/helpdesk integration", status: "partial", notes: "Connection config UI exists. Requires API Key and Subdomain to function" },
      { name: "Retail Express POS", description: "Maropost's own POS system integration", status: "partial", notes: "Connection config UI exists. Requires API Key and Store Code to function. Built-in POS module provides equivalent functionality" },
      { name: "LiveChat / Zendesk / Tidio", description: "Customer support chat widget", status: "done", notes: "chat_widget_code column on stores table; embed code input in Settings; storefront injects chat widget script" },
    ],
  },

  // ═══════ 45. DIGITAL DOWNLOADS ═══════
  {
    category: "Digital Downloads",
    icon: <Download className="h-5 w-5" />,
    features: [
      { name: "Product Download Files", description: "Attach downloadable files to products", status: "done", notes: "product_downloads table with file_name, file_url, download_limit, expiry_days; admin /digital-downloads page with CRUD" },
      { name: "Download Limit per File", description: "Set maximum download count per purchased file", status: "done", notes: "download_limit column on product_downloads, enforced via customer_downloads.download_count" },
      { name: "Download Expiry", description: "Set expiry period (days) after purchase for download access", status: "done", notes: "expiry_days column on product_downloads, expires_at calculated on customer_downloads" },
      { name: "Customer Download Tokens", description: "Unique secure tokens generated per purchase for file access", status: "done", notes: "customer_downloads table with unique download_token, linked to order and product_download" },
      { name: "Download Tracking", description: "Track download count per customer per file", status: "done", notes: "download_count column on customer_downloads, displayed in admin Recent Customer Downloads table" },
      { name: "Multiple Files per Product", description: "Attach multiple downloadable files to a single product", status: "done", notes: "One-to-many relationship: product_downloads linked to products via product_id" },
    ],
  },

  // ═══════ 46. INVENTORY FORECASTING ═══════
  {
    category: "Inventory Forecasting",
    icon: <BarChart3 className="h-5 w-5" />,
    features: [
      { name: "Sales Velocity Analysis", description: "Calculate average daily sales rate per product from 30-day history", status: "done", notes: "Admin /inventory-forecasting page calculates avg daily sales from order_items over last 30 days" },
      { name: "Days of Stock Remaining", description: "Predict how many days current stock will last", status: "done", notes: "stock_on_hand / avg_daily_sales calculation with color-coded risk levels" },
      { name: "Reorder Date Prediction", description: "Suggest when to reorder based on current velocity and lead time", status: "done", notes: "Reorder By column showing date when stock will reach 7-day threshold" },
      { name: "Suggested Reorder Quantity", description: "Calculate optimal reorder quantity for 30-day coverage", status: "done", notes: "suggestedReorder = max(0, ceil(avgDaily * 30) - currentStock)" },
      { name: "Risk Level Classification", description: "Categorize products by stock risk: out, critical, low, medium, healthy", status: "done", notes: "Color-coded badges: out (0), critical (≤7d), low (≤14d), medium (≤30d), healthy (>30d)" },
      { name: "Sortable Forecast Table", description: "Sort by days of stock or sales velocity", status: "done", notes: "Clickable column headers with asc/desc toggle for days_of_stock and avg_daily_sales" },
    ],
  },

  // ═══════ 47. SAVED CARTS ═══════
  {
    category: "Saved Carts",
    icon: <ShoppingCart className="h-5 w-5" />,
    features: [
      { name: "Save Cart for Later", description: "Customers can save their shopping cart for future purchase", status: "done", notes: "saved_carts table with customer_id, cart_items JSONB, cart_total; admin /saved-carts page" },
      { name: "Named Saved Carts", description: "Give saved carts custom names for identification", status: "done", notes: "name column on saved_carts table, default 'My Cart'" },
      { name: "Admin Saved Cart Management", description: "View, inspect, and delete customer saved carts", status: "done", notes: "Admin page with customer info, item count, total value, view dialog, delete action" },
      { name: "Saved Cart KPI Dashboard", description: "Overview metrics for saved carts", status: "done", notes: "KPI cards: total saved carts, total value, unique customers" },
    ],
  },

  // ═══════ 48. CHECKOUT ENHANCEMENTS ═══════
  {
    category: "Checkout Enhancements",
    icon: <Truck className="h-5 w-5" />,
    features: [
      { name: "Delivery Instructions Field", description: "Customer can provide delivery instructions (leave at door, etc.)", status: "done", notes: "delivery_instructions field on checkout form with 300 char limit, prepended to order notes as [Delivery: ...]" },
      { name: "Order Notes at Checkout", description: "Customer can add special instructions or comments to order", status: "done", notes: "notes textarea on checkout form, stored on orders.notes" },
      { name: "Gift Message at Checkout", description: "Add gift message when gift voucher is applied", status: "done", notes: "giftMessage textarea appears when voucher is applied, 500 char limit" },
      { name: "Store Credit at Checkout", description: "Apply store credit balance to reduce order total", status: "done", notes: "useStoreCredit checkbox with balance display, deducted from total" },
      { name: "Pay on Account (B2B)", description: "B2B customers can pay on their credit terms", status: "done", notes: "payOnAccount checkbox for customers with credit_terms, tagged in order notes" },
      { name: "Multi-Address Split Shipping", description: "Ship different items to different addresses", status: "done", notes: "splitShipping toggle with per-item address fields when 2+ items" },
      { name: "Click & Collect at Checkout", description: "Toggle between shipping and in-store pickup", status: "done", notes: "deliveryMethod toggle: shipping vs pickup with free shipping for pickup" },
      { name: "Upsell Products at Checkout", description: "Show related/cross-sell products before payment", status: "done", notes: "Upsell section showing related products from product_relations" },
    ],
  },

  // ═══════ 49. STORE CREDIT / WALLET ═══════
  {
    category: "Store Credit / Wallet",
    icon: <DollarSign className="h-5 w-5" />,
    features: [
      { name: "Store Credit Balance", description: "Per-customer store credit wallet with balance tracking", status: "done", notes: "store_credits table with customer_id, balance, lifetime_credited/debited; unique per customer per store" },
      { name: "Credit Transactions", description: "Log all credit/debit transactions with descriptions", status: "done", notes: "store_credit_transactions table with amount, transaction_type (credit/debit), description, order_id reference" },
      { name: "Apply Store Credit at Checkout", description: "Customers can apply store credit balance at checkout", status: "done", notes: "useStoreCredit checkbox at checkout deducts from store_credits balance" },
      { name: "Admin Credit Management", description: "Admin can issue/adjust store credits per customer", status: "done", notes: "Credit adjustment via customer detail page with reason tracking" },
    ],
  },

  // ═══════ 50. EMAIL AUTOMATIONS ═══════
  {
    category: "Email Automations",
    icon: <Zap className="h-5 w-5" />,
    features: [
      { name: "Automation Workflow CRUD", description: "Create and manage automated email workflows", status: "done", notes: "email_automations table with CRUD, admin /email-automations page" },
      { name: "Trigger Types", description: "7 trigger types: welcome, post-purchase, win-back, birthday, abandoned cart, review request, reorder reminder", status: "done", notes: "trigger_type enum with descriptive labels and descriptions" },
      { name: "Delay Configuration", description: "Set delay in hours after trigger before sending", status: "done", notes: "delay_hours column, 0 = immediate" },
      { name: "Active/Inactive Toggle", description: "Enable/disable automations without deleting", status: "done", notes: "is_active toggle with inline switch on admin table" },
      { name: "Send Count Tracking", description: "Track total emails sent per automation", status: "done", notes: "sent_count counter on email_automations" },
      { name: "HTML Email Body", description: "Custom HTML email templates with variable placeholders", status: "done", notes: "html_body textarea with {{store_name}}, {{customer_name}} placeholders" },
    ],
  },

  // ═══════ 51. PRODUCT BADGES ═══════
  {
    category: "Product Badges",
    icon: <Tag className="h-5 w-5" />,
    features: [
      { name: "New Product Badge", description: "Auto-generated 'New' badge for products created within 14 days", status: "done", notes: "ProductBadges component checks created_at vs current date" },
      { name: "Sale Badge", description: "Auto-generated 'Sale' badge when promo price or compare-at price is active", status: "done", notes: "Detects active promo schedule or compare_at_price > price" },
      { name: "Low Stock Badge", description: "Auto-generated 'Only X left' badge when stock ≤ 5", status: "done", notes: "Checks track_inventory and stock_on_hand fields" },
      { name: "Best Seller Badge", description: "Badge when custom_label contains 'best seller'", status: "done", notes: "Uses existing custom_label field for merchant-defined badges" },
      { name: "Pre-Order Badge", description: "Badge when product is available for pre-order", status: "done", notes: "Shows when preorder_quantity > 0 and stock is 0" },
    ],
  },

  // ═══════ 52. DELIVERY ESTIMATION ═══════
  {
    category: "Delivery Estimation",
    icon: <Truck className="h-5 w-5" />,
    features: [
      { name: "Estimated Delivery Date on Product Page", description: "Show estimated delivery date range on product detail", status: "done", notes: "DeliveryEstimate component using shipping estimated_days, shows business day range with date-fns addBusinessDays" },
      { name: "Estimated Delivery at Checkout", description: "Show delivery date estimate during checkout", status: "done", notes: "Checkout already shows estimated delivery via addBusinessDays from date-fns" },
    ],
  },

  // ═══════ 53. SOCIAL SHARING ═══════
  {
    category: "Social Sharing",
    icon: <Share2 className="h-5 w-5" />,
    features: [
      { name: "Facebook Share Button", description: "Share product on Facebook", status: "done", notes: "SocialShare component with Facebook sharer URL popup" },
      { name: "Twitter/X Share Button", description: "Share product on Twitter/X", status: "done", notes: "Twitter intent URL with product title and URL" },
      { name: "Pinterest Pin Button", description: "Pin product on Pinterest with image", status: "done", notes: "Pinterest pin/create with product image, description, and URL" },
      { name: "Email Share Button", description: "Share product via email", status: "done", notes: "mailto: link with subject and body" },
      { name: "Copy Link Button", description: "Copy product URL to clipboard", status: "done", notes: "navigator.clipboard.writeText with success toast and check icon feedback" },
    ],
  },

  // ═══════ 54. PRINT DOCUMENTS ═══════
  {
    category: "Print Documents",
    icon: <Printer className="h-5 w-5" />,
    features: [
      { name: "Print Invoice", description: "Generate printable invoice for orders", status: "done", notes: "PrintInvoice page with order details, line items, totals, and print CSS" },
      { name: "Print Packing Slip", description: "Print packing slip for warehouse fulfillment", status: "done", notes: "PrintPackingSlip page with item checklist and shipping address" },
      { name: "Print Pick List", description: "Consolidated pick list for batch order fulfillment", status: "done", notes: "PrintPickList page grouping items across orders for warehouse picking" },
      { name: "Print Shipping Label", description: "Generate shipping labels", status: "done", notes: "PrintShippingLabel page with carrier and address formatting" },
      { name: "Print Quote", description: "Print formal quote document for B2B customers", status: "done", notes: "PrintQuote page with quote terms, validity period, and line items" },
      { name: "Print Purchase Order", description: "Print purchase order for suppliers", status: "done", notes: "PrintPurchaseOrder page with supplier details and PO items" },
      { name: "Print Customer Statement", description: "Print customer account statement", status: "done", notes: "PrintCustomerStatement page with order history and balance summary" },
      { name: "Print Payment Receipt", description: "Print payment confirmation receipt", status: "done", notes: "PrintPaymentReceipt page with payment details and confirmation" },
      { name: "Print Gift Voucher", description: "Print gift voucher with code and value", status: "done", notes: "PrintGiftVoucher page with voucher code, amount, and optional message" },
      { name: "Print Barcode Labels", description: "Generate barcode labels for products", status: "done", notes: "PrintBarcodeLabels page with SKU barcode generation and print layout" },
      { name: "Print Return Label", description: "Generate pre-paid return shipping labels", status: "done", notes: "PrintReturnLabel page with return address and RMA number" },
    ],
  },

  // ═══════ 55. STOREFRONT SEARCH & DISCOVERY ═══════
  {
    category: "Storefront Search & Discovery",
    icon: <Search className="h-5 w-5" />,
    features: [
      { name: "Global Product Search", description: "Full-text search across products from storefront header", status: "done", notes: "StorefrontSearch component with real-time results dropdown, searches title/sku/description" },
      { name: "Product Compare", description: "Compare up to 4 products side-by-side", status: "done", notes: "CompareContext with add/remove, StorefrontCompare page with feature comparison table" },
      { name: "Wishlist", description: "Save products to wishlist for later", status: "done", notes: "WishlistContext with localStorage persistence, StorefrontWishlist page, heart icon on product cards" },
      { name: "Recently Viewed Products", description: "Track and display recently viewed products", status: "done", notes: "use-recently-viewed hook with localStorage, shown on product detail page" },
      { name: "Quick View Modal", description: "Preview product details without navigating away", status: "done", notes: "ProductQuickView component with image, price, add-to-cart in a modal overlay" },
      { name: "Image Lightbox", description: "Full-screen product image gallery with zoom", status: "done", notes: "ImageLightbox component with keyboard nav and swipe support" },
    ],
  },

  // ═══════ 56. COOKIE CONSENT / GDPR ═══════
  {
    category: "Cookie Consent / GDPR",
    icon: <ShieldCheck className="h-5 w-5" />,
    features: [
      { name: "Cookie Consent Banner", description: "GDPR-compliant cookie consent banner on storefront", status: "done", notes: "CookieConsentBanner component with Accept All / Decline buttons, persists choice to localStorage" },
      { name: "Consent Persistence", description: "Remember cookie consent choice across sessions", status: "done", notes: "localStorage key 'cookie-consent' stores accepted/declined state" },
    ],
  },

  // ═══════ 57. NEWSLETTER & PROMO ═══════
  {
    category: "Newsletter & Promo Popups",
    icon: <Mail className="h-5 w-5" />,
    features: [
      { name: "Newsletter Signup Form", description: "Email newsletter signup in storefront footer", status: "done", notes: "NewsletterSignup component in footer, saves to newsletter_subscribers table with duplicate detection" },
      { name: "Promo Welcome Popup", description: "Welcome popup offering first-order discount", status: "done", notes: "PromoPopup component with 3s delay, dismissable, localStorage persistence, links to signup" },
      { name: "Announcement Banner", description: "Top-of-page promotional banner with scheduling", status: "done", notes: "banner_text, banner_start, banner_end fields on stores table; scheduled display in StorefrontLayout" },
    ],
  },

  // ═══════ 58. MEDIA LIBRARY ═══════
  {
    category: "Media Library",
    icon: <Image className="h-5 w-5" />,
    features: [
      { name: "Media Upload & Management", description: "Upload, organize, and manage media assets", status: "done", notes: "Admin /media page with upload, folder management, file type/size tracking via media_assets table" },
      { name: "Folder Organization", description: "Organize media into folders", status: "done", notes: "folder column on media_assets, filterable folder list in admin" },
      { name: "Alt Text", description: "Set alt text for accessibility and SEO", status: "done", notes: "alt_text field on media_assets" },
      { name: "File Metadata", description: "Track file size, dimensions, and type", status: "done", notes: "file_size, width, height, file_type columns on media_assets" },
    ],
  },

  // ═══════ 59. CONTENT BLOCKS ═══════
  {
    category: "Content Blocks",
    icon: <LayoutDashboard className="h-5 w-5" />,
    features: [
      { name: "Content Block CRUD", description: "Create reusable content blocks for storefront", status: "done", notes: "Admin /content-blocks page, content_blocks table with identifier, placement, sort_order" },
      { name: "HTML / Rich Text Content", description: "Support HTML content in blocks", status: "done", notes: "content field with HTML support, block_type (html, text, banner)" },
      { name: "Placement Targeting", description: "Assign blocks to specific page locations", status: "done", notes: "placement column for targeting (header, footer, sidebar, homepage)" },
      { name: "Active Toggle", description: "Enable/disable blocks without deleting", status: "done", notes: "is_active boolean toggle on content_blocks" },
    ],
  },

  // ═══════ 60. URL REDIRECTS ═══════
  {
    category: "URL Redirects",
    icon: <RefreshCw className="h-5 w-5" />,
    features: [
      { name: "301/302 Redirect Management", description: "Manage URL redirects for SEO migration", status: "done", notes: "Admin /redirects page with source_path, target_path, redirect_type (301/302)" },
      { name: "Bulk Redirect Import", description: "Import redirects from CSV", status: "done", notes: "Import functionality on redirects page" },
    ],
  },

  // ═══════ 61. STOREFRONT PAGES ═══════
  {
    category: "Storefront Pages",
    icon: <Globe className="h-5 w-5" />,
    features: [
      { name: "Quick Order Form (B2B)", description: "Bulk order form for B2B customers with SKU entry", status: "done", notes: "StorefrontQuickOrder page with SKU lookup, quantity input, and bulk add-to-cart" },
      { name: "Wholesale Portal", description: "Wholesale-only products and pricing for approved customers", status: "done", notes: "StorefrontWholesale page with customer group-based access and wholesale pricing" },
      { name: "Store Finder / Locations", description: "Physical store locator with addresses", status: "done", notes: "StorefrontStoreFinder page with location cards and map integration" },
      { name: "Blog / News", description: "Blog/news content pages for content marketing", status: "done", notes: "StorefrontBlog page pulling content_pages where page_type = 'blog'" },
      { name: "Contact Form", description: "Customer contact form with email notification", status: "done", notes: "StorefrontContact page with name/email/subject/message, saves to contact_submissions, triggers contact-email edge function" },
      { name: "Gift Voucher Purchase", description: "Buy gift vouchers from storefront", status: "done", notes: "StorefrontGiftVouchers page with denomination selection, recipient details, and checkout" },
      { name: "Order Tracking", description: "Track order status by order number", status: "done", notes: "StorefrontTrackOrder page with order lookup and status timeline" },
      { name: "Forgot Username Recovery", description: "Recover username/email via phone or order details", status: "done", notes: "StorefrontForgotUsername page" },
    ],
  },

  // ═══════ 62. CUSTOMER ACCOUNT PORTAL ═══════
  {
    category: "Customer Account Portal",
    icon: <UserCheck className="h-5 w-5" />,
    features: [
      { name: "Order History", description: "View past orders with status tracking", status: "done", notes: "StorefrontAccount page with order list, status timeline, and order detail expansion" },
      { name: "Return Requests", description: "Submit return/RMA requests from account", status: "done", notes: "Return request dialog with reason selection and notes on StorefrontAccount" },
      { name: "Address Book", description: "Manage multiple shipping/billing addresses", status: "done", notes: "Address management section with add/edit/delete and default address toggle" },
      { name: "Wishlist Management", description: "View and manage saved wishlist items", status: "done", notes: "StorefrontWishlist page linked from account navigation" },
      { name: "Digital Downloads Access", description: "Download purchased digital products", status: "done", notes: "Downloads tab on StorefrontAccount showing purchased files with download links" },
      { name: "Quote Requests", description: "Request quotes from account portal", status: "done", notes: "Quote request form on StorefrontAccount for B2B customers" },
      { name: "Layby Plans", description: "View active layby payment plans", status: "done", notes: "Layby section on StorefrontAccount showing active plans and payment progress" },
      { name: "Store Credit Balance", description: "View store credit balance and transactions", status: "done", notes: "Store credit display on StorefrontAccount with balance and recent transactions" },
    ],
  },

  // ═══════ 63. IMPORT / EXPORT ═══════
  {
    category: "Import / Export",
    icon: <ArrowLeftRight className="h-5 w-5" />,
    features: [
      { name: "CSV Import Wizard", description: "Step-by-step CSV import with field mapping", status: "done", notes: "ImportWizard page with file upload, column mapping, preview, and batch insert; import_logs and import_templates tables" },
      { name: "Import Templates", description: "Save and reuse import field mappings", status: "done", notes: "import_templates table with field_mappings, delimiter, transformations" },
      { name: "Export Wizard", description: "Export data to CSV with field selection", status: "done", notes: "ExportWizard page with entity type selection, field picker, and CSV generation" },
      { name: "Scheduled Exports", description: "Configure automated recurring exports", status: "done", notes: "scheduled-export edge function with cron support" },
      { name: "Import Error Handling", description: "Track and display import errors per row", status: "done", notes: "errors JSONB column on import_logs, error_count tracking" },
    ],
  },

  // ═══════ 64. BARCODE & LABEL MANAGEMENT ═══════
  {
    category: "Barcode & Label Management",
    icon: <HardDrive className="h-5 w-5" />,
    features: [
      { name: "Barcode Scanner", description: "Scan barcodes for quick product lookup", status: "done", notes: "BarcodeScanner component with camera-based barcode scanning, used in POS and inventory" },
      { name: "Barcode Label Printing", description: "Generate and print barcode labels for products", status: "done", notes: "PrintBarcodeLabels page with product selection, label format, and batch printing" },
      { name: "SKU-based Lookup", description: "Find products by scanning SKU barcode", status: "done", notes: "Barcode scan triggers product lookup by SKU in products table" },
    ],
  },

  // ═══════ 65. CURRENCY & LANGUAGE ═══════
  {
    category: "Currency & Language",
    icon: <Globe className="h-5 w-5" />,
    features: [
      { name: "Multi-Currency Support", description: "Display prices in multiple currencies with live rates", status: "done", notes: "Admin /currencies page, CurrencySwitcher component on storefront, exchange rate management" },
      { name: "Currency Switcher on Storefront", description: "Customer-facing currency selector", status: "done", notes: "CurrencySwitcher component in storefront header with flag icons" },
      { name: "Language Switcher", description: "Multi-language support on storefront", status: "done", notes: "LanguageSwitcher component with LanguageProvider context for i18n" },
    ],
  },

  // ═══════ 66. AUTOMATIC DISCOUNTS / PRICE RULES ═══════
  {
    category: "Automatic Discounts / Price Rules",
    icon: <Zap className="h-5 w-5" />,
    features: [
      { name: "Price Rule CRUD", description: "Create and manage automatic discount rules", status: "done", notes: "price_rules table with full CRUD, admin /price-rules page with KPI cards" },
      { name: "Percentage Off Rule", description: "Automatic percentage discount", status: "done", notes: "rule_type: percentage with discount_value %" },
      { name: "Fixed Amount Off Rule", description: "Automatic fixed dollar amount discount", status: "done", notes: "rule_type: fixed_amount with discount_value $" },
      { name: "Buy X Get Y Free", description: "Buy quantity X, get Y items free", status: "done", notes: "rule_type: buy_x_get_y with buy_quantity and get_quantity" },
      { name: "Free Shipping Rule", description: "Automatic free shipping based on conditions", status: "done", notes: "rule_type: free_shipping with min order / quantity conditions" },
      { name: "Min Order Amount Condition", description: "Require minimum cart value for discount", status: "done", notes: "min_order_amount threshold on price_rules" },
      { name: "Min Quantity Condition", description: "Require minimum item quantity for discount", status: "done", notes: "min_quantity threshold on price_rules" },
      { name: "Schedule Start/End", description: "Time-limited automatic discounts", status: "done", notes: "starts_at and ends_at datetime fields on price_rules" },
      { name: "Priority Ordering", description: "Control which rules apply first", status: "done", notes: "priority integer field, higher = first evaluated" },
      { name: "Usage Tracking & Limits", description: "Track usage count and set max uses", status: "done", notes: "usage_count and max_uses on price_rules" },
      { name: "Active/Inactive Toggle", description: "Enable/disable rules without deleting", status: "done", notes: "is_active boolean with inline switch on admin table" },
      { name: "Target Scope (All/Products/Categories)", description: "Apply to all products or specific sets", status: "done", notes: "applies_to with product_ids and category_ids arrays" },
    ],
  },

  // ═══════ 67. DASHBOARD & ANALYTICS ═══════
  {
    category: "Dashboard & Analytics",
    icon: <LayoutDashboard className="h-5 w-5" />,
    features: [
      { name: "Revenue KPI Card", description: "Total revenue with period comparison", status: "done", notes: "KPI card on Dashboard with $ total and % change vs prior period" },
      { name: "Orders KPI Card", description: "Order count with trend", status: "done", notes: "KPI card showing total orders and percentage change" },
      { name: "Revenue Chart (Area)", description: "Daily revenue time series chart", status: "done", notes: "Recharts AreaChart with 30-day daily revenue data" },
      { name: "Orders Chart (Bar)", description: "Daily orders bar chart", status: "done", notes: "Recharts BarChart with daily order counts" },
      { name: "Top Products Table", description: "Best-selling products by revenue", status: "done", notes: "Table showing top products sorted by total revenue from order_items" },
      { name: "Recent Orders Feed", description: "Latest orders with status badges", status: "done", notes: "Table of 10 most recent orders with status, customer, and total" },
      { name: "Low Stock Alerts", description: "Products below reorder threshold", status: "done", notes: "Alert card showing products with stock below threshold" },
      { name: "Customer KPI", description: "Total customers with growth trend", status: "done", notes: "KPI card showing customer count and period change" },
      { name: "Report Builder", description: "Custom report creation with date ranges and metrics", status: "done", notes: "Admin /report-builder page with configurable report types, date filtering, and chart generation" },
    ],
  },

  // ═══════ 68. AUTHENTICATION & SECURITY ═══════
  {
    category: "Authentication & Security",
    icon: <Shield className="h-5 w-5" />,
    features: [
      { name: "Email/Password Login", description: "Standard email and password authentication", status: "done", notes: "Supabase Auth with Login page for admin and StorefrontLogin for customers" },
      { name: "User Registration", description: "New account signup with email verification", status: "done", notes: "Signup page with email, password, full name; email verification required" },
      { name: "Forgot Password / Reset", description: "Password reset flow via email", status: "done", notes: "ForgotPassword page sends reset email, ResetPassword page handles token-based reset" },
      { name: "Google OAuth Login", description: "Social login with Google on storefront", status: "done", notes: "Google OAuth button on StorefrontLogin and StorefrontSignup via supabase.auth.signInWithOAuth" },
      { name: "Two-Factor Authentication (TOTP)", description: "TOTP-based 2FA setup for admin accounts", status: "done", notes: "TwoFactorSetup component with QR code generation, verification code input, and enrollment flow" },
      { name: "Session Management", description: "View and manage active sessions", status: "done", notes: "Admin /sessions page showing active sessions with device, IP, last activity, and terminate action" },
      { name: "Role-Based Access Control (RBAC)", description: "User roles per store (owner, admin, staff)", status: "done", notes: "user_roles table with app_role enum, has_store_role() security definer function, RolePermissions admin page" },
      { name: "Staff Activity Tracking", description: "Log staff actions for audit trail", status: "done", notes: "Admin /staff-activity page showing user actions with timestamps" },
      { name: "Activity Log", description: "Entity-level activity audit log", status: "done", notes: "activity_log table tracking action, entity_type, entity_id per user per store" },
    ],
  },

  // ═══════ 69. STORE SETTINGS & CONFIGURATION ═══════
  {
    category: "Store Settings & Configuration",
    icon: <Settings className="h-5 w-5" />,
    features: [
      { name: "General Settings (Name, Currency, Timezone)", description: "Core store identity configuration", status: "done", notes: "Settings page General tab with store name, currency, timezone" },
      { name: "Branding / Theme Customization", description: "Logo, colors, fonts, banner configuration", status: "done", notes: "Settings Branding tab with logo URL, primary/accent colors, font family, banner text with scheduling" },
      { name: "Shipping Zone Management", description: "Configure shipping zones and rates", status: "done", notes: "Dedicated /shipping-zones page and Settings Shipping tab with CRUD" },
      { name: "Tax Rate Configuration", description: "Set tax rates by name and percentage", status: "done", notes: "Dedicated /tax-rates page and Settings Tax tab with CRUD" },
      { name: "Payment Gateway Configuration", description: "Configure payment processors", status: "done", notes: "Settings Payment Gateways tab supporting Stripe, PayPal, Square, eWAY, Braintree, Afterpay, Bank Transfer" },
      { name: "Team / Staff Management", description: "Invite and manage team members", status: "done", notes: "Settings Team tab with member list, role display, invite functionality" },
      { name: "Customer Group Management", description: "Create customer groups for pricing/access", status: "done", notes: "Settings Customer Groups tab with CRUD, credit terms, and tax exemption" },
      { name: "Notification Preferences", description: "Configure notification channels and events", status: "done", notes: "Settings Notifications tab with toggleable notification types" },
      { name: "Social Media Links", description: "Configure social media profile URLs", status: "done", notes: "Settings Branding tab with Facebook, Instagram, Twitter, YouTube, TikTok, LinkedIn URL fields" },
      { name: "Analytics Tracking (GA, GTM, Pixel)", description: "Configure Google Analytics, GTM, and Facebook Pixel IDs", status: "done", notes: "ga_tracking_id, gtm_container_id, fb_pixel_id, google_ads_id fields on stores table, configurable in Settings" },
      { name: "Chat Widget Integration", description: "Embed third-party chat widgets", status: "done", notes: "chat_widget_code field on stores table, pasted embed code injected into storefront" },
    ],
  },

  // ═══════ 70. ONBOARDING ═══════
  {
    category: "Onboarding",
    icon: <Store className="h-5 w-5" />,
    features: [
      { name: "Store Creation Wizard", description: "Guided store setup with name, slug, currency, timezone", status: "done", notes: "Onboarding page with store name → auto-slug generation, currency/timezone selectors, slug availability check" },
      { name: "Slug Availability Check", description: "Real-time subdomain/slug availability validation", status: "done", notes: "Debounced check against stores table with available/taken status indicators" },
      { name: "Auto-Role Assignment on Store Creation", description: "Creator automatically gets owner role", status: "done", notes: "handle_new_store() trigger auto-creates user_roles entry with 'owner' role" },
      { name: "Multi-Store Support", description: "Users can create and switch between multiple stores", status: "done", notes: "AuthContext loads all user stores via get_user_store_ids(), store switcher dropdown in sidebar header" },
    ],
  },

  // ═══════ 71. PLATFORM ADMIN (MULTI-TENANT) ═══════
  {
    category: "Platform Admin (Multi-Tenant)",
    icon: <Building className="h-5 w-5" />,
    features: [
      { name: "Platform Admin Dashboard", description: "Overview of all merchants and platform metrics", status: "done", notes: "PlatformDashboard page with total merchants, revenue, orders, customers KPI cards" },
      { name: "Merchant Management", description: "View and manage all merchant stores", status: "done", notes: "PlatformMerchants page listing all stores with owner, plan, and status" },
      { name: "Platform Customer View", description: "Cross-merchant customer overview", status: "done", notes: "PlatformCustomers page with aggregated customer data across stores" },
      { name: "Platform Analytics", description: "Platform-wide analytics and reporting", status: "done", notes: "PlatformAnalytics page with cross-store metrics and charts" },
      { name: "Platform Settings", description: "Global platform configuration", status: "done", notes: "PlatformSettings page with platform-level preferences" },
      { name: "Platform Admin Access Control", description: "Separate platform admin role and login", status: "done", notes: "platform_roles table, is_platform_admin() function, RequirePlatformAdmin component, separate /platform/login route" },
      { name: "Auto-Promote First Admin", description: "First user automatically becomes platform admin", status: "done", notes: "auto_promote_first_admin() trigger on profiles table" },
    ],
  },

  // ═══════ 72. REAL-TIME NOTIFICATIONS ═══════
  {
    category: "Real-Time Notifications",
    icon: <Bell className="h-5 w-5" />,
    features: [
      { name: "Notification Bell", description: "In-app notification bell with unread count", status: "done", notes: "NotificationBell component in admin TopBar with badge count and dropdown" },
      { name: "Order Notifications", description: "Real-time alerts for new orders", status: "done", notes: "New order events trigger notification entries" },
      { name: "Low Stock Notifications", description: "Alerts when products fall below stock threshold", status: "done", notes: "Low stock detection triggers admin notifications" },
      { name: "Return/Dispute Notifications", description: "Alerts for new returns and warranty disputes", status: "done", notes: "Return and dispute creation triggers admin notifications" },
    ],
  },

  // ═══════ 73. AFFILIATE PROGRAM ═══════
  {
    category: "Affiliate Program",
    icon: <UserPlus className="h-5 w-5" />,
    features: [
      { name: "Affiliate CRUD", description: "Create and manage affiliate partners", status: "done", notes: "affiliates table with full CRUD, admin /affiliates page" },
      { name: "Commission Rate Configuration", description: "Set per-affiliate commission rates (percentage or fixed)", status: "done", notes: "commission_rate and commission_type columns on affiliates" },
      { name: "Unique Referral Codes", description: "Auto-generated unique referral code per affiliate", status: "done", notes: "referral_code column with copy-to-clipboard on admin page" },
      { name: "Affiliate Status Management", description: "Approve, activate, deactivate affiliate accounts", status: "done", notes: "status column (active/inactive/pending) with admin toggles" },
      { name: "Payout Tracking", description: "Track affiliate payouts and earnings", status: "done", notes: "affiliate_payouts table with amount, period, status tracking; payout dialog on admin page" },
      { name: "Affiliate KPI Dashboard", description: "Overview metrics: total affiliates, revenue, commissions", status: "done", notes: "KPI cards on /affiliates page with active count, total referred revenue, and commissions" },
    ],
  },

  // ═══════ 74. LOYALTY PROGRAM ═══════
  {
    category: "Loyalty Program",
    icon: <Heart className="h-5 w-5" />,
    features: [
      { name: "Loyalty Points Balance", description: "Per-customer loyalty points wallet", status: "done", notes: "loyalty_points table with balance, lifetime_earned, lifetime_redeemed per customer per store" },
      { name: "Points Transaction Log", description: "Track all point earn/redeem transactions", status: "done", notes: "loyalty_transactions table with transaction_type (earn/redeem/adjust/expire), points, description" },
      { name: "Tier System", description: "Bronze/Silver/Gold/Platinum tiers based on lifetime points", status: "done", notes: "tier column on loyalty_points with color-coded tier badges" },
      { name: "Admin Points Adjustment", description: "Admin can manually adjust customer points", status: "done", notes: "Adjust dialog on /loyalty page with points amount and description" },
      { name: "Loyalty KPI Dashboard", description: "Total members, points in circulation, tier distribution", status: "done", notes: "KPI cards on /loyalty page with member count, total points, tier breakdown" },
      { name: "Earn Rules Configuration", description: "Configure how customers earn points (per $ spent)", status: "done", notes: "Points earned per order tracked via loyalty_transactions linked to order_id" },
    ],
  },

  // ═══════ 75. QUOTES / QUOTING ═══════
  {
    category: "Quotes / Quoting",
    icon: <FileText className="h-5 w-5" />,
    features: [
      { name: "Quote CRUD", description: "Create and manage sales quotes for customers", status: "done", notes: "quotes table with full CRUD, admin /quotes page with create dialog" },
      { name: "Quote Line Items", description: "Add products with quantities and prices to quotes", status: "done", notes: "quote_items table with product_id, quantity, unit_price" },
      { name: "Quote Status Workflow", description: "Draft → sent → accepted → declined → expired lifecycle", status: "done", notes: "status column with color-coded badges and admin status update actions" },
      { name: "Quote Validity Period", description: "Set expiry period (valid_days) on quotes", status: "done", notes: "valid_days column with configurable validity, expires_at calculated" },
      { name: "Convert Quote to Order", description: "One-click convert accepted quote to order", status: "done", notes: "Convert to Order button creates order from quote items" },
      { name: "Print Quote", description: "Generate printable quote document", status: "done", notes: "PrintQuote page with professional layout, terms, and line items" },
    ],
  },

  // ═══════ 76. LAYBY / PAYMENT PLANS ═══════
  {
    category: "Layby / Payment Plans",
    icon: <CreditCard className="h-5 w-5" />,
    features: [
      { name: "Layby Plan CRUD", description: "Create and manage layby payment plans", status: "done", notes: "layby_plans table with full CRUD, admin /layby page" },
      { name: "Deposit & Installment Configuration", description: "Set deposit amount, installment count, and frequency", status: "done", notes: "deposit_amount, installments_count, installment_amount, frequency columns" },
      { name: "Payment Recording", description: "Record individual layby payments", status: "done", notes: "layby_payments table with amount, payment_method, notes; payment dialog on admin page" },
      { name: "Payment Progress Tracking", description: "Track amount paid vs total, installments paid vs total", status: "done", notes: "amount_paid, installments_paid counters with progress display" },
      { name: "Layby Status Workflow", description: "Active → completed / cancelled lifecycle", status: "done", notes: "status column (active/completed/cancelled) with auto-complete on full payment" },
      { name: "Next Due Date Tracking", description: "Track and display next payment due date", status: "done", notes: "next_due_date column with date display on admin table" },
    ],
  },

  // ═══════ 77. SMART COLLECTIONS ═══════
  {
    category: "Smart Collections",
    icon: <Sparkles className="h-5 w-5" />,
    features: [
      { name: "Smart Collection CRUD", description: "Create rule-based auto-populating product collections", status: "done", notes: "smart_collections table with CRUD, admin /smart-collections page" },
      { name: "Rules Engine (JSONB)", description: "Define match conditions using field + operator + value rules", status: "done", notes: "rules JSONB column with field (title, price, tags, category, brand, status), operators (contains, equals, gt, lt, starts_with, ends_with)" },
      { name: "Match Logic (All/Any)", description: "Match all rules (AND) or any rule (OR)", status: "done", notes: "match_type column: all (AND) or any (OR)" },
      { name: "Auto-Populate Products", description: "Automatically match products against rules", status: "done", notes: "Client-side product matching against collection rules with matched product count display" },
      { name: "Collection Preview", description: "Preview matched products before saving", status: "done", notes: "Preview button showing matched products in dialog with image, title, price, stock" },
      { name: "Collection Sorting", description: "Sort collection products by various criteria", status: "done", notes: "sort_by column with options: manual, title_asc, title_desc, price_asc, price_desc, created_desc, best_selling" },
      { name: "Publish/Unpublish Toggle", description: "Control collection visibility", status: "done", notes: "is_published boolean with inline switch toggle" },
    ],
  },

  // ═══════ 78. ADVERT / BANNER MANAGEMENT ═══════
  {
    category: "Advert / Banner Management",
    icon: <Image className="h-5 w-5" />,
    features: [
      { name: "Advert CRUD", description: "Create and manage promotional banners and ads", status: "done", notes: "adverts table with full CRUD, admin /adverts page" },
      { name: "Advert Types", description: "Support banner, carousel, popup, inline ad types", status: "done", notes: "advert_type column: banner, carousel, popup, inline, html" },
      { name: "Placement Targeting", description: "Place ads on specific page locations", status: "done", notes: "placement column: homepage_top, homepage_mid, sidebar, product_page, category_page, cart_page" },
      { name: "Schedule Start/End", description: "Time-limited ad display with date range", status: "done", notes: "starts_at and ends_at datetime fields" },
      { name: "Active Toggle", description: "Enable/disable ads without deleting", status: "done", notes: "is_active boolean with admin toggle" },
      { name: "Sort Order", description: "Control ad display order within placement zones", status: "done", notes: "sort_order integer for ordering" },
      { name: "HTML Custom Ads", description: "Custom HTML content for advanced ad formats", status: "done", notes: "html_content field for custom ad markup" },
      { name: "Click-Through Links", description: "Link ads to products, categories, or external URLs", status: "done", notes: "link_url and button_text fields" },
    ],
  },

  // ═══════ 79. SEO & STRUCTURED DATA ═══════
  {
    category: "SEO & Structured Data",
    icon: <Globe className="h-5 w-5" />,
    features: [
      { name: "Dynamic Meta Tags", description: "Per-page title and description meta tags", status: "done", notes: "SEOHead component dynamically sets document.title, meta description, og:tags" },
      { name: "Open Graph Tags", description: "Facebook/social sharing meta tags", status: "done", notes: "og:title, og:description, og:image, og:url, og:type set via SEOHead" },
      { name: "Twitter Card Tags", description: "Twitter/X card meta tags for rich previews", status: "done", notes: "twitter:card, twitter:title, twitter:description, twitter:image" },
      { name: "JSON-LD Product Schema", description: "Structured data for product pages (Schema.org)", status: "done", notes: "SEOHead generates Product schema with name, sku, brand, price, availability, rating, review count" },
      { name: "Canonical URLs", description: "Canonical URL tags to prevent duplicate content", status: "done", notes: "canonicalUrl prop on SEOHead sets rel=canonical link" },
      { name: "XML Sitemap", description: "Auto-generated sitemap for search engines", status: "done", notes: "sitemap edge function generating XML sitemap with products, categories, and content pages" },
      { name: "Robots.txt", description: "Robots.txt file for crawler control", status: "done", notes: "public/robots.txt with sitemap reference" },
      { name: "Per-Product SEO Fields", description: "Custom SEO title and description per product", status: "done", notes: "seo_title and seo_description columns on products table, editable in product form" },
      { name: "Per-Category SEO Fields", description: "Custom SEO title and description per category", status: "done", notes: "seo_title and seo_description columns on categories table" },
    ],
  },

  // ═══════ 80. CREDIT NOTES ═══════
  {
    category: "Credit Notes",
    icon: <Receipt className="h-5 w-5" />,
    features: [
      { name: "Credit Note Creation", description: "Issue credit notes against orders", status: "done", notes: "credit_notes table with credit_number, amount, reason, issued_by, linked to order_id" },
      { name: "Credit Note Status", description: "Track credit note status (pending/applied/voided)", status: "done", notes: "status column on credit_notes" },
      { name: "Credit Note Numbering", description: "Sequential credit note number generation", status: "done", notes: "credit_number column with unique identifiers" },
      { name: "Credit Note Notes", description: "Add internal notes to credit notes", status: "done", notes: "notes text field on credit_notes" },
    ],
  },

  // ═══════ 81. CUSTOMER GROUPS ═══════
  {
    category: "Customer Groups",
    icon: <Users className="h-5 w-5" />,
    features: [
      { name: "Customer Group CRUD", description: "Create groups for segmented pricing and access", status: "done", notes: "customer_groups table with full CRUD via Settings Customer Groups tab" },
      { name: "Group Discount Percentage", description: "Automatic discount for group members", status: "done", notes: "discount_percent column on customer_groups" },
      { name: "Tax Exemption per Group", description: "Mark groups as tax exempt", status: "done", notes: "is_tax_exempt boolean on customer_groups" },
      { name: "Minimum Order Amount", description: "Set minimum order threshold per group", status: "done", notes: "min_order_amount column on customer_groups" },
      { name: "Assign Customers to Groups", description: "Link customers to groups for pricing rules", status: "done", notes: "customer_group_id foreign key on customers table" },
    ],
  },

  // ═══════ 82. CUSTOMER FILES ═══════
  {
    category: "Customer Files",
    icon: <HardDrive className="h-5 w-5" />,
    features: [
      { name: "File Upload per Customer", description: "Attach files to customer records", status: "done", notes: "customer_files table with file_name, file_url, file_type, file_size, description" },
      { name: "File Metadata Tracking", description: "Track file type, size, and upload date", status: "done", notes: "file_type, file_size, created_at columns" },
      { name: "Uploaded By Tracking", description: "Track which staff member uploaded the file", status: "done", notes: "uploaded_by column on customer_files" },
    ],
  },

  // ═══════ 83. DROPSHIPPING ═══════
  {
    category: "Dropshipping",
    icon: <Truck className="h-5 w-5" />,
    features: [
      { name: "Dropship Supplier Notification", description: "Auto-notify suppliers of new dropship orders", status: "done", notes: "dropship-notification edge function sends order details to supplier email" },
      { name: "Dropship Product Flag", description: "Mark products as dropship items", status: "done", notes: "is_dropship boolean on products table, supplier_id linking" },
    ],
  },

  // ═══════ 84. ADD-ON / PLUGIN MARKETPLACE ═══════
  {
    category: "Add-On / Plugin Marketplace",
    icon: <Puzzle className="h-5 w-5" />,
    features: [
      { name: "Add-On Catalog", description: "Browse available add-ons and plugins", status: "done", notes: "addon_catalog table with 10 seeded add-ons, admin /addons page with marketplace grid" },
      { name: "Install / Uninstall Add-Ons", description: "One-click install and remove add-ons per store", status: "done", notes: "store_addons table tracking installed add-ons per store with install/uninstall actions" },
      { name: "Add-On Configuration", description: "Per-add-on settings dialog", status: "done", notes: "config_data JSONB on store_addons, config dialog with key-value editor" },
      { name: "Add-On Active Toggle", description: "Enable/disable installed add-ons", status: "done", notes: "is_active boolean on store_addons with inline toggle" },
      { name: "Add-On Categories & Types", description: "Filter add-ons by type (integration, shipping, pricing, etc.)", status: "done", notes: "category and addon_type columns with color-coded badges and filter tabs" },
      { name: "Install Count Tracking", description: "Track popularity via install count", status: "done", notes: "install_count column on addon_catalog" },
    ],
  },

  // ═══════ 85. PRODUCT VARIANTS ═══════
  {
    category: "Product Variants",
    icon: <Layers className="h-5 w-5" />,
    features: [
      { name: "Variant CRUD", description: "Create size/color/material variants per product", status: "done", notes: "product_variants table with name, sku, price, stock_on_hand, managed via ProductForm variants tab" },
      { name: "Variant-Level Pricing", description: "Independent price per variant", status: "done", notes: "price column on product_variants overrides base product price" },
      { name: "Variant-Level Inventory", description: "Independent stock tracking per variant", status: "done", notes: "stock_on_hand column on product_variants for per-variant stock" },
      { name: "Variant SKU", description: "Unique SKU per variant", status: "done", notes: "sku column on product_variants" },
      { name: "Variant Barcode", description: "Unique barcode per variant", status: "done", notes: "barcode column on product_variants" },
      { name: "Variant Weight", description: "Independent weight per variant for shipping", status: "done", notes: "weight column on product_variants" },
      { name: "Variant Active Toggle", description: "Enable/disable individual variants", status: "done", notes: "is_active boolean on product_variants" },
    ],
  },

  // ═══════ 86. PRODUCT ADDONS / CUSTOMIZATIONS ═══════
  {
    category: "Product Addons / Customizations",
    icon: <Puzzle className="h-5 w-5" />,
    features: [
      { name: "Product Addon CRUD", description: "Add optional add-ons to products (gift wrap, engraving, etc.)", status: "done", notes: "product_addons table with name, price, addon_type, managed via ProductAddonsTab" },
      { name: "Addon Types", description: "Support checkbox, dropdown, text input addon types", status: "done", notes: "addon_type column: checkbox, select, text" },
      { name: "Addon Pricing", description: "Additional charge per addon selection", status: "done", notes: "price column on product_addons" },
      { name: "Required/Optional Toggle", description: "Mark addons as required or optional", status: "done", notes: "is_required boolean on product_addons" },
      { name: "Addon Options (for dropdowns)", description: "Define selectable options for dropdown addons", status: "done", notes: "options JSONB array on product_addons for select-type addons" },
    ],
  },

  // ═══════ 87. KIT / BUNDLE PRODUCTS ═══════
  {
    category: "Kit / Bundle Products",
    icon: <Boxes className="h-5 w-5" />,
    features: [
      { name: "Kit Component Management", description: "Define which products make up a kit/bundle", status: "done", notes: "kit_components table with kit_product_id, component_product_id, quantity; KitComponentsTab in ProductForm" },
      { name: "Component Quantities", description: "Set quantity of each component in the kit", status: "done", notes: "quantity column on kit_components" },
      { name: "Optional Components", description: "Mark certain components as optional", status: "done", notes: "is_optional boolean on kit_components" },
      { name: "Swappable Components", description: "Allow customers to swap components within a group", status: "done", notes: "is_swappable boolean and swap_group on kit_components" },
      { name: "Component Sort Order", description: "Control display order of kit components", status: "done", notes: "sort_order integer on kit_components" },
    ],
  },

  // ═══════ 88. BACK-IN-STOCK NOTIFICATIONS ═══════
  {
    category: "Back-in-Stock Notifications",
    icon: <Bell className="h-5 w-5" />,
    features: [
      { name: "Back-in-Stock Request Form", description: "Customers can request notification when product is restocked", status: "done", notes: "back_in_stock_requests table with email, product_id, variant_id" },
      { name: "Notification Email", description: "Send email when product comes back in stock", status: "done", notes: "back-in-stock-email edge function sends notification to waiting customers" },
      { name: "Notified Tracking", description: "Track which customers have been notified", status: "done", notes: "notified_at timestamp on back_in_stock_requests" },
    ],
  },

  // ═══════ 89. CONTACT FORM SUBMISSIONS ═══════
  {
    category: "Contact Form Submissions",
    icon: <MessageSquare className="h-5 w-5" />,
    features: [
      { name: "Contact Form Capture", description: "Store contact form submissions from storefront", status: "done", notes: "contact_submissions table with name, email, subject, message" },
      { name: "Contact Email Notification", description: "Send email to store owner on new contact submission", status: "done", notes: "contact-email edge function triggers on form submit" },
      { name: "Read/Unread Status", description: "Track which submissions have been reviewed", status: "done", notes: "is_read boolean on contact_submissions" },
    ],
  },

  // ═══════ 90. NEWSLETTER SUBSCRIBERS ═══════
  {
    category: "Newsletter Subscribers",
    icon: <Mail className="h-5 w-5" />,
    features: [
      { name: "Newsletter Signup", description: "Capture email subscribers from storefront", status: "done", notes: "newsletter_subscribers table, NewsletterSignup component in footer" },
      { name: "Duplicate Prevention", description: "Prevent duplicate email signups", status: "done", notes: "Unique constraint on email + store_id, client-side duplicate detection with toast" },
      { name: "Subscriber Status", description: "Track active/unsubscribed status", status: "done", notes: "is_active boolean on newsletter_subscribers" },
    ],
  },

  // ═══════ 91. ORDER SHIPMENTS & FULFILLMENT ═══════
  {
    category: "Order Shipments & Fulfillment",
    icon: <Truck className="h-5 w-5" />,
    features: [
      { name: "Shipment CRUD", description: "Create and manage shipments per order", status: "done", notes: "order_shipments table with carrier, tracking_number, tracking_url, shipment_number" },
      { name: "Shipment Items", description: "Track which items are in each shipment", status: "done", notes: "shipment_items table linking order_items to shipments with quantity" },
      { name: "Tracking Number & URL", description: "Carrier tracking number and URL per shipment", status: "done", notes: "tracking_number and tracking_url columns on order_shipments" },
      { name: "Shipment Status Workflow", description: "Pending → shipped → in_transit → delivered lifecycle", status: "done", notes: "status column with shipped_at and delivered_at timestamps" },
      { name: "Shipment Email Notification", description: "Email customer when order is shipped", status: "done", notes: "shipment-email edge function sends tracking info to customer" },
      { name: "Delivery Confirmation Email", description: "Email customer when order is delivered", status: "done", notes: "order-delivered-email edge function triggered on delivery" },
    ],
  },

  // ═══════ 92. ORDER PAYMENTS & REFUNDS ═══════
  {
    category: "Order Payments & Refunds",
    icon: <CreditCard className="h-5 w-5" />,
    features: [
      { name: "Record Manual Payments", description: "Record payments against orders", status: "done", notes: "order_payments table with amount, payment_method, reference, recorded_by" },
      { name: "Multiple Payments per Order", description: "Support split payments and partial payments", status: "done", notes: "One-to-many: multiple order_payments per order" },
      { name: "Payment Email Notification", description: "Email customer on payment receipt", status: "done", notes: "payment-email edge function sends payment confirmation" },
      { name: "Refund Processing", description: "Process full or partial refunds on orders", status: "done", notes: "order_refunds table with amount, reason, refunded_by, status" },
      { name: "Refund Status Tracking", description: "Track refund status (pending/processed/failed)", status: "done", notes: "status column on order_refunds" },
    ],
  },

  // ═══════ 93. ORDER TIMELINE / AUDIT TRAIL ═══════
  {
    category: "Order Timeline / Audit Trail",
    icon: <Clock className="h-5 w-5" />,
    features: [
      { name: "Order Event Timeline", description: "Chronological log of all events on an order", status: "done", notes: "order_timeline table with event_type, title, description, metadata, user_id" },
      { name: "Event Types", description: "Track status changes, notes, payments, shipments, etc.", status: "done", notes: "event_type column: status_change, note, payment, shipment, refund, etc." },
      { name: "User Attribution", description: "Track which user triggered each event", status: "done", notes: "user_id column on order_timeline" },
      { name: "Timeline Display on Order Detail", description: "Visual timeline on order detail page", status: "done", notes: "Order detail page renders timeline events chronologically" },
    ],
  },

  // ═══════ 94. SERIAL NUMBER TRACKING ═══════
  {
    category: "Serial Number Tracking",
    icon: <HardDrive className="h-5 w-5" />,
    features: [
      { name: "Serial Number Registration", description: "Register serial numbers per product/variant", status: "done", notes: "serial_numbers table with serial_number, product_id, variant_id, location_id" },
      { name: "Serial Number Status", description: "Track status: available, sold, returned, reserved", status: "done", notes: "status column on serial_numbers" },
      { name: "Link Serial to Order", description: "Associate serial numbers with sold orders", status: "done", notes: "order_id foreign key on serial_numbers" },
      { name: "Location Tracking", description: "Track which warehouse location holds the serial", status: "done", notes: "location_id foreign key linking to inventory_locations" },
    ],
  },

  // ═══════ 95. STOCKIST / STORE FINDER ═══════
  {
    category: "Stockist / Store Finder",
    icon: <MapPin className="h-5 w-5" />,
    features: [
      { name: "Stockist Listings", description: "Manage physical retail locations that carry products", status: "done", notes: "stockist_listings table with business_name, address, city, state, country, postcode" },
      { name: "Geolocation (Lat/Lng)", description: "Store latitude/longitude for map display", status: "done", notes: "latitude and longitude columns on stockist_listings" },
      { name: "Approval Workflow", description: "Approve or reject stockist applications", status: "done", notes: "is_approved boolean on stockist_listings" },
      { name: "Active Toggle", description: "Enable/disable stockist visibility", status: "done", notes: "is_active boolean on stockist_listings" },
      { name: "Storefront Store Finder", description: "Public-facing store locator page", status: "done", notes: "StorefrontStoreFinder page with location cards and contact details" },
    ],
  },

  // ═══════ 96. PURCHASE ORDERS ═══════
  {
    category: "Purchase Orders",
    icon: <ClipboardCopy className="h-5 w-5" />,
    features: [
      { name: "Purchase Order CRUD", description: "Create and manage purchase orders to suppliers", status: "done", notes: "purchase_orders table with po_number, supplier_id, status, totals; admin /purchase-orders page" },
      { name: "PO Line Items", description: "Add products with quantities and unit costs", status: "done", notes: "purchase_order_items table with product_id, quantity_ordered, quantity_received, unit_cost" },
      { name: "PO Status Workflow", description: "Draft → sent → partial → received → cancelled lifecycle", status: "done", notes: "status column with workflow transitions" },
      { name: "Goods Receipt", description: "Record received quantities against PO items", status: "done", notes: "quantity_received tracking on purchase_order_items" },
      { name: "Expected Delivery Date", description: "Track expected delivery date per PO", status: "done", notes: "expected_date column on purchase_orders" },
      { name: "Print Purchase Order", description: "Generate printable PO document", status: "done", notes: "PrintPurchaseOrder page with supplier details and PO items" },
      { name: "Supplier Product Catalog", description: "Track which suppliers provide which products", status: "done", notes: "supplier_products table with supplier_id, product_id, supplier_sku, supplier_cost, is_preferred" },
    ],
  },

  // ═══════ 97. TRANSLATIONS / I18N ═══════
  {
    category: "Translations / i18n",
    icon: <Globe className="h-5 w-5" />,
    features: [
      { name: "Store Languages", description: "Configure available languages per store", status: "done", notes: "store_languages table with locale, name, is_default, is_active per store" },
      { name: "Entity Translations", description: "Translate product titles, descriptions, and other content per locale", status: "done", notes: "store_translations table with entity_type, entity_id, field_name, locale, translated_value" },
      { name: "Default Language", description: "Set default language for store", status: "done", notes: "is_default boolean on store_languages" },
      { name: "Storefront Language Switcher", description: "Customer-facing language selector", status: "done", notes: "LanguageSwitcher component in storefront header" },
    ],
  },

  // ═══════ 98. SHIPPING RULES ENGINE ═══════
  {
    category: "Shipping Rules Engine",
    icon: <Truck className="h-5 w-5" />,
    features: [
      { name: "Shipping Rule CRUD", description: "Create conditional shipping rules per zone", status: "done", notes: "shipping_rules table with condition_type, condition_operator, condition_value, rule_type" },
      { name: "Condition Types", description: "Rules based on weight, price, quantity, or item count", status: "done", notes: "condition_type: weight, price, quantity, item_count" },
      { name: "Rule Types", description: "Free shipping, surcharge, flat rate override, or disable", status: "done", notes: "rule_type: free_shipping, surcharge, flat_rate, disable" },
      { name: "Shipping Methods", description: "Define shipping methods with carrier and estimated delivery", status: "done", notes: "shipping_methods table with name, carrier, base_rate, method_type, estimated_days_min/max" },
      { name: "Carrier Rate API", description: "Real-time carrier rate calculation", status: "done", notes: "carrier-rates edge function for dynamic rate calculation" },
      { name: "Warehouse Routing Rules", description: "Route orders to nearest/priority warehouse", status: "done", notes: "warehouse_routing_rules table with location_id, country, region, priority, is_active" },
    ],
  },

  // ═══════ 99. EMAIL QUEUE & DELIVERY ═══════
  {
    category: "Email Queue & Delivery",
    icon: <Mail className="h-5 w-5" />,
    features: [
      { name: "Email Queue", description: "Queue outbound emails for batch delivery", status: "done", notes: "email_queue table with to_email, subject, html_body, template_key, status" },
      { name: "Send Status Tracking", description: "Track sent/failed/pending email status", status: "done", notes: "status column (pending/sent/failed) with sent_at timestamp" },
      { name: "Error Logging", description: "Log email delivery errors", status: "done", notes: "error column on email_queue for failed delivery messages" },
      { name: "Send Email Edge Function", description: "Centralized email sending via edge function", status: "done", notes: "send-email edge function handles all outbound email delivery" },
      { name: "Welcome Email", description: "Auto-send welcome email on signup", status: "done", notes: "welcome-email edge function" },
      { name: "Order Confirmation Email", description: "Auto-send order confirmation", status: "done", notes: "order-email-trigger edge function sends confirmation + admin notification" },
      { name: "Order Follow-Up Email", description: "Post-purchase follow-up email", status: "done", notes: "order-follow-up edge function" },
      { name: "Import Notification Email", description: "Notify imported customers with login details", status: "done", notes: "import-notification-email edge function" },
      { name: "Wishlist Reminder Email", description: "Remind customers about wishlisted items", status: "done", notes: "wishlist-reminder edge function" },
      { name: "Dispute Email", description: "Notify admin of order disputes", status: "done", notes: "dispute-email edge function" },
      { name: "Customer Statement Email", description: "Send account statement to customer", status: "done", notes: "customer-statement-email edge function" },
      { name: "Batch Job Error Email", description: "Alert admin of failed batch operations", status: "done", notes: "batch-job-error-email edge function" },
      { name: "Scheduled Report Email", description: "Send scheduled analytics reports", status: "done", notes: "scheduled-report-email edge function" },
      { name: "Auto-Registration Email", description: "Send credentials for auto-created guest accounts", status: "done", notes: "auto-registration-email edge function" },
    ],
  },

  // ═══════ 100. CONTENT REVIEWS ═══════
  {
    category: "Content Reviews",
    icon: <Star className="h-5 w-5" />,
    features: [
      { name: "Blog/Page Reviews", description: "Allow customer reviews on content pages (blogs, articles)", status: "done", notes: "content_reviews table with rating, body, author_name, linked to content_pages" },
      { name: "Review Moderation", description: "Approve or reject content reviews", status: "done", notes: "is_approved boolean on content_reviews" },
      { name: "Rating System", description: "Star rating per content review", status: "done", notes: "rating column (1-5) on content_reviews" },
    ],
  },

  // ═══════ 101. PAYMENT GATEWAYS ═══════
  {
    category: "Payment Gateways",
    icon: <CreditCard className="h-5 w-5" />,
    features: [
      { name: "Multi-Gateway Support", description: "Configure multiple payment processors per store", status: "done", notes: "payment_gateways table with gateway_type, config JSONB, is_enabled, sort_order" },
      { name: "Gateway Types", description: "Support Stripe, PayPal, Square, eWAY, Braintree, Afterpay, Bank Transfer", status: "done", notes: "7 gateway types with per-gateway credential fields" },
      { name: "Test/Live Mode", description: "Toggle between sandbox and production", status: "done", notes: "is_test_mode boolean on payment_gateways" },
      { name: "Payment Processing Edge Function", description: "Server-side payment processing", status: "done", notes: "payment-gateway edge function handles payment intents and processing" },
      { name: "SMS Gateway", description: "Send SMS notifications for orders and alerts", status: "done", notes: "sms-gateway edge function for SMS delivery" },
    ],
  },

  // ═══════ 102. STOCKTAKE / CYCLE COUNTING ═══════
  {
    category: "Stocktake / Cycle Counting",
    icon: <ClipboardCheck className="h-5 w-5" />,
    features: [
      { name: "Stocktake CRUD", description: "Create and manage physical stock count sessions", status: "done", notes: "stocktakes table with name, status, started_at, completed_at, created_by; admin /stocktake page" },
      { name: "Stocktake Items", description: "Track expected vs counted quantities per product", status: "done", notes: "stocktake_items table with product_id, expected_quantity, counted_quantity, counted_by, counted_at" },
      { name: "Stocktake Status Workflow", description: "In progress → completed lifecycle", status: "done", notes: "status column: in_progress, completed with completed_at timestamp" },
      { name: "Variance Reporting", description: "Calculate difference between expected and counted stock", status: "done", notes: "Client-side variance calculation (counted - expected) with color-coded display" },
      { name: "Staff Attribution", description: "Track which staff member counted each item", status: "done", notes: "counted_by and counted_at columns on stocktake_items" },
    ],
  },

  // ═══════ 103. STORE CREDITS ═══════
  {
    category: "Store Credits",
    icon: <DollarSign className="h-5 w-5" />,
    features: [
      { name: "Store Credit Balance", description: "Per-customer store credit balance tracking", status: "done", notes: "store_credits table with balance, lifetime_credited, lifetime_debited per customer" },
      { name: "Credit Transactions", description: "Record credit/debit transactions against customer accounts", status: "done", notes: "store_credit_transactions table with amount, type (credit/debit), description, order_id link" },
      { name: "Staff Attribution", description: "Track who issued each credit transaction", status: "done", notes: "created_by column on store_credit_transactions" },
      { name: "Order-Linked Credits", description: "Link credit transactions to specific orders (refunds, rewards)", status: "done", notes: "order_id foreign key on store_credit_transactions" },
      { name: "Lifetime Totals", description: "Track lifetime credited and debited amounts", status: "done", notes: "lifetime_credited and lifetime_debited columns on store_credits" },
    ],
  },

  // ═══════ 104. POS REGISTERS & SESSIONS ═══════
  {
    category: "POS Registers & Sessions",
    icon: <Monitor className="h-5 w-5" />,
    features: [
      { name: "Register Management", description: "Create and manage POS register terminals", status: "done", notes: "pos_registers table with name, is_active, location_id linking to inventory_locations" },
      { name: "Register Sessions (Open/Close)", description: "Open and close cash register sessions with float tracking", status: "done", notes: "pos_register_sessions table with opening_float, opened_at, closed_at, status (open/closed)" },
      { name: "Cash Reconciliation", description: "Track expected vs actual cash at close", status: "done", notes: "expected_cash, actual_cash, cash_difference columns for drawer reconciliation" },
      { name: "Payment Breakdown", description: "Break down sales by payment method", status: "done", notes: "cash_total, card_total, voucher_total, other_total columns on sessions" },
      { name: "Session Totals", description: "Track total orders and sales per session", status: "done", notes: "total_orders and total_sales columns on pos_register_sessions" },
      { name: "Close Notes", description: "Add notes when closing a register session", status: "done", notes: "notes text field on pos_register_sessions" },
    ],
  },

  // ═══════ 105. SAVED CARTS ═══════
  {
    category: "Saved Carts",
    icon: <ShoppingCart className="h-5 w-5" />,
    features: [
      { name: "Save Cart for Later", description: "Customers can save their cart and return to it", status: "done", notes: "saved_carts table with cart_items JSONB, cart_total, linked to customer_id" },
      { name: "Named Carts", description: "Give saved carts a name for easy identification", status: "done", notes: "name column on saved_carts (default 'My Cart')" },
      { name: "Cart Restoration", description: "Restore a saved cart back to the active shopping cart", status: "done", notes: "Admin /saved-carts page with cart management" },
    ],
  },

  // ═══════ 106. WARRANTY DISPUTES ═══════
  {
    category: "Warranty Disputes",
    icon: <AlertTriangle className="h-5 w-5" />,
    features: [
      { name: "Dispute CRUD", description: "Create and manage warranty/product disputes", status: "done", notes: "warranty_disputes table with dispute_type, reason, description, status" },
      { name: "Dispute Types", description: "Categorize disputes (warranty, defective, wrong item, etc.)", status: "done", notes: "dispute_type column for classification" },
      { name: "Dispute Status Workflow", description: "Open → investigating → resolved / rejected lifecycle", status: "done", notes: "status column with full workflow" },
      { name: "Resolution Tracking", description: "Record resolution details and date", status: "done", notes: "resolution text and resolved_at timestamp columns" },
      { name: "Admin Notes", description: "Internal staff notes on disputes", status: "done", notes: "admin_notes text field on warranty_disputes" },
      { name: "Linked Entities", description: "Link disputes to orders, products, and customers", status: "done", notes: "order_id, product_id, customer_id foreign keys" },
      { name: "Dispute Email Notification", description: "Notify admin of new disputes via email", status: "done", notes: "dispute-email edge function" },
    ],
  },

  // ═══════ 107. WHOLESALE APPLICATIONS ═══════
  {
    category: "Wholesale Applications",
    icon: <Building className="h-5 w-5" />,
    features: [
      { name: "Wholesale Application Form", description: "B2B customers apply for wholesale access", status: "done", notes: "wholesale_applications table with business_name, contact_name, email, phone, abn_tax_id, message" },
      { name: "Application Review Workflow", description: "Pending → approved / rejected lifecycle", status: "done", notes: "status column (pending/approved/rejected) with reviewed_at and reviewed_by" },
      { name: "Tax ID / ABN Capture", description: "Capture business tax identification number", status: "done", notes: "abn_tax_id column on wholesale_applications" },
      { name: "Admin Review Attribution", description: "Track which admin reviewed the application", status: "done", notes: "reviewed_by and reviewed_at columns" },
    ],
  },

  // ═══════ 108. CUSTOMER COMMUNICATIONS ═══════
  {
    category: "Customer Communications",
    icon: <MessageSquare className="h-5 w-5" />,
    features: [
      { name: "Communication Log", description: "Track all communications with customers", status: "done", notes: "customer_communications table with channel, direction, subject, body, status" },
      { name: "Multi-Channel Support", description: "Track email, phone, SMS, and chat communications", status: "done", notes: "channel column (email/phone/sms/chat)" },
      { name: "Inbound / Outbound Direction", description: "Track communication direction", status: "done", notes: "direction column (inbound/outbound)" },
      { name: "Linked to Entities", description: "Link communications to orders, returns, or other entities", status: "done", notes: "related_entity_type and related_entity_id columns" },
      { name: "Staff Attribution", description: "Track who sent outbound communications", status: "done", notes: "sent_by column on customer_communications" },
    ],
  },

  // ═══════ 109. DIGITAL DOWNLOADS ═══════
  {
    category: "Digital Downloads",
    icon: <Download className="h-5 w-5" />,
    features: [
      { name: "Product Download Files", description: "Attach downloadable files to products", status: "done", notes: "product_downloads table with file_name, file_url, file_size, sort_order" },
      { name: "Download Limits", description: "Set maximum download count per purchase", status: "done", notes: "download_limit column on product_downloads" },
      { name: "Expiry Period", description: "Set download expiry in days after purchase", status: "done", notes: "expiry_days column on product_downloads" },
      { name: "Customer Download Access", description: "Grant download access after purchase with unique token", status: "done", notes: "customer_downloads table with download_token, download_count, max_downloads, expires_at" },
      { name: "Download Count Tracking", description: "Track how many times each file was downloaded", status: "done", notes: "download_count column on customer_downloads" },
    ],
  },

  // ═══════ 110. PRODUCT SCHEDULING & VISIBILITY ═══════
  {
    category: "Product Scheduling & Visibility",
    icon: <Clock className="h-5 w-5" />,
    features: [
      { name: "Scheduled Publish", description: "Auto-publish product at a future date/time", status: "done", notes: "scheduled_publish_at datetime column on products table" },
      { name: "Scheduled Unpublish", description: "Auto-unpublish product at a future date/time", status: "done", notes: "scheduled_unpublish_at datetime column on products table" },
      { name: "Visibility Groups", description: "Restrict product visibility to specific customer groups", status: "done", notes: "visibility_groups string array on products table" },
      { name: "Price on Application (POA)", description: "Hide price and show 'Contact for Price' instead", status: "done", notes: "poa boolean on products table" },
      { name: "Reorder Quantity", description: "Set reorder point quantity for automated PO suggestions", status: "done", notes: "reorder_quantity column on products table" },
      { name: "Restock Quantity", description: "Default restock quantity for purchase orders", status: "done", notes: "restock_quantity column on products table" },
      { name: "Search Keywords", description: "Hidden search keywords for improved product findability", status: "done", notes: "search_keywords text field on products table" },
    ],
  },

  // ═══════ 111. TRACKING & ANALYTICS PIXELS ═══════
  {
    category: "Tracking & Analytics Pixels",
    icon: <BarChart3 className="h-5 w-5" />,
    features: [
      { name: "Google Analytics Integration", description: "GA tracking ID for storefront analytics", status: "done", notes: "ga_tracking_id column on stores table" },
      { name: "Google Tag Manager", description: "GTM container ID for tag management", status: "done", notes: "gtm_container_id column on stores table" },
      { name: "Facebook Pixel", description: "FB pixel ID for conversion tracking and retargeting", status: "done", notes: "fb_pixel_id column on stores table" },
      { name: "Google Ads Tracking", description: "Google Ads conversion tracking", status: "done", notes: "google_ads_id and google_ads_conversion_label columns on stores table" },
      { name: "Live Chat Widget", description: "Embed third-party chat widget code", status: "done", notes: "chat_widget_code column on stores table for injecting chat JS snippets" },
    ],
  },

  // ═══════ 112. STOCK ADJUSTMENTS ═══════
  {
    category: "Stock Adjustments",
    icon: <ClipboardCopy className="h-5 w-5" />,
    features: [
      { name: "Manual Stock Adjustment", description: "Adjust stock quantities with reason tracking", status: "done", notes: "stock_adjustments table with inventory_stock_id, quantity_change, reason" },
      { name: "Adjustment Reason", description: "Record reason for each adjustment (damaged, lost, correction)", status: "done", notes: "reason text field on stock_adjustments" },
      { name: "Staff Attribution", description: "Track who made each stock adjustment", status: "done", notes: "adjusted_by column on stock_adjustments" },
      { name: "Admin Stock Adjustments Page", description: "View history of all stock adjustments", status: "done", notes: "Admin /stock-adjustments page with adjustment log" },
    ],
  },

  // ═══════ 113. THIRD-PARTY SYNC INTEGRATIONS ═══════
  {
    category: "Third-Party Sync Integrations",
    icon: <RefreshCw className="h-5 w-5" />,
    features: [
      { name: "Google Shopping Feed", description: "Generate product feed for Google Merchant Center", status: "done", notes: "google-shopping-feed edge function generating XML product feed" },
      { name: "Klaviyo Sync", description: "Sync customers and orders to Klaviyo for email marketing", status: "partial", notes: "klaviyo-sync edge function — requires merchant API key" },
      { name: "Mailchimp Sync", description: "Sync subscribers and customers to Mailchimp", status: "partial", notes: "mailchimp-sync edge function — requires merchant API key" },
      { name: "StarShipIt Sync", description: "Sync orders and shipments with StarShipIt", status: "partial", notes: "starshipit-sync edge function — requires merchant API key" },
      { name: "ShipStation Sync", description: "Sync orders with ShipStation for fulfillment", status: "partial", notes: "shipstation-sync edge function — requires merchant API key" },
      { name: "eBay Sync", description: "Sync product listings with eBay marketplace", status: "partial", notes: "ebay-sync edge function — requires merchant API key" },
      { name: "Marketplace Sync", description: "Generic marketplace product and order sync", status: "partial", notes: "marketplace-sync edge function for additional channels" },
    ],
  },

  // ═══════ 114. USER PROFILES ═══════
  {
    category: "User Profiles",
    icon: <UserCheck className="h-5 w-5" />,
    features: [
      { name: "Auto-Create Profile on Signup", description: "Automatically create user profile on auth signup", status: "done", notes: "handle_new_user() trigger creates profiles row with display_name from email or full_name" },
      { name: "Display Name", description: "Customizable display name for admin users", status: "done", notes: "display_name column on profiles table" },
      { name: "Avatar URL", description: "Profile avatar image support", status: "done", notes: "avatar_url column on profiles table" },
    ],
  },

  // ═══════ 115. REDIRECT ANALYTICS ═══════
  {
    category: "Redirect Analytics",
    icon: <Link className="h-5 w-5" />,
    features: [
      { name: "Redirect Hit Counter", description: "Track how many times each redirect is triggered", status: "done", notes: "hit_count column on redirects table, incremented on each redirect match" },
      { name: "Active/Inactive Toggle", description: "Enable or disable individual redirects", status: "done", notes: "is_active boolean on redirects table" },
    ],
  },

  // ═══════ 116. STORE TEMPLATES ═══════
  {
    category: "Store Templates",
    icon: <PenTool className="h-5 w-5" />,
    features: [
      { name: "Template CRUD", description: "Create and edit storefront HTML templates", status: "done", notes: "store_templates table with name, slug, content, template_type, context_type" },
      { name: "Template Types", description: "Support page, partial, email, and layout template types", status: "done", notes: "template_type column for template classification" },
      { name: "Context Binding", description: "Bind templates to specific data contexts (product, category, cart)", status: "done", notes: "context_type column maps template to data source" },
      { name: "Per-Template CSS", description: "Custom CSS per template for isolated styling", status: "done", notes: "custom_css column on store_templates with CSS editor tab" },
      { name: "Template Active Toggle", description: "Enable/disable templates without deletion", status: "done", notes: "is_active boolean on store_templates" },
      { name: "Admin Templates Page", description: "Full template management interface", status: "done", notes: "Admin /templates page with code editor and live preview" },
    ],
  },

  // ═══════ 117. STORE THEME CUSTOMIZATION ═══════
  {
    category: "Store Theme Customization",
    icon: <Palette className="h-5 w-5" />,
    features: [
      { name: "Theme Colors", description: "Primary, secondary, accent, background, and text color configuration", status: "done", notes: "store_themes table with primary_color, secondary_color, accent_color, background_color, text_color" },
      { name: "Font Selection", description: "Heading and body font family configuration", status: "done", notes: "heading_font and body_font columns on store_themes" },
      { name: "Layout Options", description: "Button radius, layout style, hero style, product card style, footer style", status: "done", notes: "button_radius, layout_style, hero_style, product_card_style, footer_style columns" },
      { name: "Theme Custom CSS", description: "Global custom CSS injection per theme", status: "done", notes: "custom_css column on store_themes" },
      { name: "Theme Presets", description: "Pre-built theme presets (Classic, Modern Dark, Minimal, Boutique, Tech)", status: "done", notes: "theme_presets table with is_system flag and theme_config JSONB" },
      { name: "One-Click Theme Apply", description: "Apply a preset theme to overwrite current settings", status: "done", notes: "Apply preset action maps theme_config to store_themes columns" },
    ],
  },

  // ═══════ 118. CURRENCY FORMATTING ═══════
  {
    category: "Currency Formatting",
    icon: <DollarSign className="h-5 w-5" />,
    features: [
      { name: "Decimal Places Configuration", description: "Set number of decimal places for currency display", status: "done", notes: "currency_decimal_places column on stores table (default 2)" },
      { name: "Symbol Position", description: "Configure currency symbol position (before/after amount)", status: "done", notes: "currency_symbol_position column on stores table" },
      { name: "Tax Mode", description: "Configure tax-inclusive or tax-exclusive pricing display", status: "done", notes: "tax_mode column on stores table" },
    ],
  },
  // ═══════ 119. PICK & PACK / WAREHOUSE OPERATIONS ═══════
  {
    category: "Pick & Pack / Warehouse Operations",
    icon: <Warehouse className="h-5 w-5" />,
    features: [
      { name: "Pick & Pack Queue", description: "Queue of orders ready for warehouse picking and packing", status: "done", notes: "Admin /pick-pack page with orders in processing status, batch selection, and status workflow" },
      { name: "Batch Pick Mode", description: "Pick multiple orders at once with consolidated item list", status: "done", notes: "Batch pick dialog aggregates items across selected orders for efficient warehouse picking" },
      { name: "Pack & Ship Workflow", description: "Mark items as packed and create shipments", status: "done", notes: "Pack action creates shipment records with carrier and tracking info" },
      { name: "Barcode Scanning", description: "Scan product barcodes during pick/pack for verification", status: "done", notes: "BarcodeScanner component with camera-based barcode detection for pick verification" },
      { name: "Warehouse Dashboard", description: "Overview of warehouse operations, pending orders, low stock", status: "done", notes: "Admin /warehouse page with KPI cards (pending picks, packed today, shipped today, low stock), recent activity feed" },
      { name: "Packing Slip Auto-Print", description: "Auto-generate packing slips when packing orders", status: "done", notes: "Print packing slip action on pick-pack page opens PrintPackingSlip with order data" },
    ],
  },

  // ═══════ 120. GIFT VOUCHERS / GIFT CARDS ═══════
  {
    category: "Gift Vouchers / Gift Cards",
    icon: <Gift className="h-5 w-5" />,
    features: [
      { name: "Gift Voucher CRUD", description: "Create, manage, and track gift vouchers/cards", status: "done", notes: "gift_vouchers table with CRUD, admin /gift-vouchers page with KPI cards, search, and status filters" },
      { name: "Unique Voucher Codes", description: "Auto-generated unique alphanumeric codes per voucher", status: "done", notes: "code column with unique constraint, auto-generated 12-char codes" },
      { name: "Balance Tracking", description: "Track remaining balance vs initial value", status: "done", notes: "balance and initial_value columns on gift_vouchers with progress display" },
      { name: "Voucher Expiry", description: "Set expiry dates on gift vouchers", status: "done", notes: "expires_at column with date validation and expired status display" },
      { name: "Recipient Details", description: "Capture recipient name, email, and personal message", status: "done", notes: "recipient_name, recipient_email, message columns on gift_vouchers" },
      { name: "Gift Voucher Email Delivery", description: "Email voucher details to recipient", status: "done", notes: "gift-voucher-email edge function sends branded email with code, value, and message" },
      { name: "Redeem at Checkout", description: "Apply gift voucher code during checkout to reduce total", status: "done", notes: "Checkout voucher field validates code, checks balance, deducts from total" },
      { name: "Printable Gift Voucher", description: "Generate printable gift card/voucher", status: "done", notes: "PrintGiftVoucher page with styled card layout, code, value, and message" },
      { name: "Storefront Purchase", description: "Customers can buy gift vouchers from the storefront", status: "done", notes: "StorefrontGiftVouchers page with denomination selection and recipient form" },
    ],
  },

  // ═══════ 121. ADVERTS & BANNER MANAGEMENT ═══════
  {
    category: "Adverts & Banner Management",
    icon: <Megaphone className="h-5 w-5" />,
    features: [
      { name: "Advert CRUD", description: "Create and manage promotional adverts/banners", status: "done", notes: "adverts table with CRUD, admin /adverts page with grid and list views" },
      { name: "Advert Types", description: "Support banner, popup, sidebar, and inline advert types", status: "done", notes: "advert_type column: banner, popup, sidebar, inline" },
      { name: "Placement Zones", description: "Target adverts to specific page locations", status: "done", notes: "placement column: homepage_hero, homepage_mid, sidebar, header, footer, product_page" },
      { name: "Schedule Start/End", description: "Schedule adverts with start and end dates", status: "done", notes: "starts_at and ends_at columns for time-bounded campaigns" },
      { name: "Sort Order", description: "Control display priority of adverts", status: "done", notes: "sort_order integer for ordering within placement zone" },
      { name: "Active Toggle", description: "Enable/disable adverts without deletion", status: "done", notes: "is_active boolean toggle on adverts" },
      { name: "Click-Through URL", description: "Link adverts to products, categories, or external URLs", status: "done", notes: "link_url column for click destination" },
      { name: "HTML Custom Content", description: "Support custom HTML content in adverts", status: "done", notes: "html_content column for rich advert content" },
      { name: "Storefront Banner Display", description: "Render active banners on storefront pages", status: "done", notes: "AdvertBanner component renders active adverts by placement with image, title, subtitle, CTA button" },
    ],
  },

  // ═══════ 122. MULTIMARKET / MULTI-STORE ═══════
  {
    category: "Multimarket / Multi-Store",
    icon: <Globe className="h-5 w-5" />,
    features: [
      { name: "Market Region CRUD", description: "Create and manage regional market configurations", status: "done", notes: "store_markets table with market_name, country_code, currency, language, domain, is_active" },
      { name: "Regional Pricing", description: "Set market-specific pricing per product", status: "done", notes: "market_product_prices table with market_id, product_id, price override" },
      { name: "Regional Currency", description: "Assign default currency per market region", status: "done", notes: "currency column on store_markets linked to currencies table" },
      { name: "Regional Language", description: "Set default language per market", status: "done", notes: "language column on store_markets" },
      { name: "Custom Domain per Market", description: "Assign unique domain/subdomain per market", status: "done", notes: "domain column on store_markets for regional storefronts" },
      { name: "Market Active Toggle", description: "Enable/disable individual markets", status: "done", notes: "is_active boolean on store_markets" },
      { name: "Admin Multimarket Dashboard", description: "Overview of all market regions with KPI stats", status: "done", notes: "Admin /multimarket page with market grid, product count, order stats per region" },
    ],
  },

  // ═══════ 123. CURRENCY MANAGEMENT ═══════
  {
    category: "Currency Management",
    icon: <DollarSign className="h-5 w-5" />,
    features: [
      { name: "Currency CRUD", description: "Create and manage supported currencies", status: "done", notes: "currencies table with code, name, symbol, exchange_rate, is_default, is_active" },
      { name: "Exchange Rates", description: "Set exchange rates relative to base currency", status: "done", notes: "exchange_rate column on currencies table for conversion" },
      { name: "Default Currency", description: "Designate one currency as the store default", status: "done", notes: "is_default boolean, only one per store" },
      { name: "Currency Active Toggle", description: "Enable/disable currencies for storefront display", status: "done", notes: "is_active boolean on currencies" },
      { name: "Storefront Currency Switcher", description: "Customer-facing currency selector on storefront", status: "done", notes: "CurrencySwitcher component in storefront header, persists selection in localStorage" },
      { name: "Auto-Conversion Display", description: "All prices auto-converted using selected currency rate", status: "done", notes: "useCurrency hook converts prices on all storefront pages" },
    ],
  },

  // ═══════ 124. TAX RATES & RULES ═══════
  {
    category: "Tax Rates & Rules",
    icon: <Percent className="h-5 w-5" />,
    features: [
      { name: "Tax Rate CRUD", description: "Create and manage tax rates per region", status: "done", notes: "tax_rates table with name, rate, country, state, is_compound, is_active" },
      { name: "Compound Tax", description: "Support compound taxes calculated on top of other taxes", status: "done", notes: "is_compound boolean on tax_rates" },
      { name: "Region-Based Tax", description: "Apply different tax rates by country/state", status: "done", notes: "country and state columns for geographic tax targeting" },
      { name: "Tax Priority", description: "Set tax calculation priority/order", status: "done", notes: "priority integer for tax stacking order" },
      { name: "Tax Active Toggle", description: "Enable/disable tax rates", status: "done", notes: "is_active boolean on tax_rates" },
      { name: "Tax Exemption Certificates", description: "B2B customers upload tax exemption certificates", status: "done", notes: "tax_exemption_certificates table with certificate_number, issuing_authority, valid_from/until, verification workflow" },
      { name: "Certificate Verification", description: "Admin verifies uploaded tax exemption documents", status: "done", notes: "is_verified, verified_by, verified_at columns on tax_exemption_certificates" },
    ],
  },

  // ═══════ 125. SHIPPING ZONES ═══════
  {
    category: "Shipping Zones",
    icon: <MapPin className="h-5 w-5" />,
    features: [
      { name: "Shipping Zone CRUD", description: "Create zones with country/state coverage", status: "done", notes: "shipping_zones table with name, countries array, states array, is_active" },
      { name: "Zone-Based Rates", description: "Set shipping rates per zone", status: "done", notes: "Rates linked to zones via shipping_methods table" },
      { name: "Free Shipping Threshold", description: "Free shipping above a minimum order amount per zone", status: "done", notes: "free_above column on shipping_zones for auto free-shipping calculation" },
      { name: "Flat Rate per Zone", description: "Fixed shipping rate per zone", status: "done", notes: "flat_rate column on shipping_zones" },
      { name: "Zone Active Toggle", description: "Enable/disable shipping zones", status: "done", notes: "is_active boolean on shipping_zones" },
      { name: "Admin Shipping Zones Page", description: "Full zone management interface", status: "done", notes: "Admin /shipping-zones page with zone grid, country chips, rate display" },
    ],
  },

  // ═══════ 126. SUBSCRIPTIONS & RECURRING ORDERS ═══════
  {
    category: "Subscriptions & Recurring Orders",
    icon: <Repeat className="h-5 w-5" />,
    features: [
      { name: "Subscription Plan CRUD", description: "Create and manage subscription plans", status: "done", notes: "subscriptions table with frequency, next_billing_date, status, items JSONB" },
      { name: "Frequency Options", description: "Weekly, monthly, bi-monthly, quarterly subscription intervals", status: "done", notes: "frequency column with configurable billing intervals" },
      { name: "Subscription Status Workflow", description: "Active → paused → cancelled → expired lifecycle", status: "done", notes: "status column with full subscription lifecycle" },
      { name: "Next Billing Date", description: "Track and display next billing date per subscription", status: "done", notes: "next_billing_date column on subscriptions" },
      { name: "Subscription Items", description: "Products and quantities included in subscription", status: "done", notes: "items JSONB array on subscriptions table with product_id, quantity, price" },
      { name: "Admin Subscription Dashboard", description: "Overview of active subscriptions with KPIs", status: "done", notes: "Admin /subscriptions page with KPI cards (active, paused, MRR), subscription list with status badges" },
      { name: "Subscription Discount", description: "Percentage discount for subscription vs one-time purchase", status: "done", notes: "discount_percent column on subscriptions for recurring savings" },
      { name: "Auto-Order Generation", description: "Auto-create orders from active subscriptions on billing date", status: "done", notes: "Subscription processing creates order with subscription items on billing cycle" },
    ],
  },

  // ═══════ 127. STAFF ACTIVITY & AUDIT LOG ═══════
  {
    category: "Staff Activity & Audit Log",
    icon: <Eye className="h-5 w-5" />,
    features: [
      { name: "Activity Log", description: "Track all admin actions with user, entity, and timestamp", status: "done", notes: "activity_log table with user_id, action, entity_type, entity_id, details JSONB" },
      { name: "Entity Tracking", description: "Log actions across all entity types (orders, products, customers)", status: "done", notes: "entity_type column for filtering by affected entity" },
      { name: "Action Types", description: "Track create, update, delete, login, export actions", status: "done", notes: "action column categorizing the type of change" },
      { name: "Details JSONB", description: "Store before/after values for change auditing", status: "done", notes: "details JSONB column for rich audit data" },
      { name: "Staff Activity Dashboard", description: "View staff member actions with filtering", status: "done", notes: "Admin /staff-activity page with user filter, entity filter, and chronological event list" },
      { name: "Session Management", description: "View and manage active user sessions", status: "done", notes: "Admin /sessions page with active sessions, device info, and force-logout capability" },
    ],
  },

  // ═══════ 128. ROLE & PERMISSION MANAGEMENT ═══════
  {
    category: "Role & Permission Management",
    icon: <Shield className="h-5 w-5" />,
    features: [
      { name: "Role-Based Access Control", description: "Assign roles (owner, admin, staff, viewer) per store", status: "done", notes: "user_roles table with user_id, store_id, role (app_role enum)" },
      { name: "Permission Matrix", description: "Define granular permissions per role", status: "done", notes: "Admin /role-permissions page with module-level permission grid" },
      { name: "Store-Scoped Roles", description: "Roles are per-store, not global", status: "done", notes: "store_id on user_roles ensures multi-tenant role isolation" },
      { name: "Role Assignment", description: "Assign/change roles for team members", status: "done", notes: "Role management on Settings > Team tab" },
      { name: "Security Definer Functions", description: "Role checks bypass RLS for security", status: "done", notes: "has_store_role() SECURITY DEFINER function for safe role checks" },
    ],
  },

  // ═══════ 129. WEBHOOK MANAGEMENT ═══════
  {
    category: "Webhook Management",
    icon: <Zap className="h-5 w-5" />,
    features: [
      { name: "Webhook CRUD", description: "Create and manage webhook endpoints", status: "done", notes: "webhooks table with url, events array, secret, is_active; admin /webhooks page" },
      { name: "Event Types", description: "Subscribe to order, product, customer, inventory events", status: "done", notes: "events array column with order.created, product.updated, customer.created, etc." },
      { name: "Webhook Secret", description: "HMAC signing secret for payload verification", status: "done", notes: "secret column on webhooks table for payload signing" },
      { name: "Delivery Log", description: "Track webhook delivery attempts and responses", status: "done", notes: "Webhook dispatch logging with status codes and response times" },
      { name: "Active Toggle", description: "Enable/disable webhooks without deletion", status: "done", notes: "is_active boolean on webhooks table" },
      { name: "Webhook Dispatcher", description: "Server-side webhook delivery engine", status: "done", notes: "webhook-dispatcher edge function sends signed payloads to all matching webhook endpoints" },
    ],
  },

  // ═══════ 130. API KEYS & RATE LIMITING ═══════
  {
    category: "API Keys & Rate Limiting",
    icon: <Key className="h-5 w-5" />,
    features: [
      { name: "API Key Generation", description: "Generate API keys with scoped permissions", status: "done", notes: "api_keys table with key_hash, key_prefix, scopes array, created_by; admin /api-keys page" },
      { name: "Key Scopes", description: "Granular scope control (products:read, orders:write, etc.)", status: "done", notes: "scopes text array on api_keys with per-resource read/write permissions" },
      { name: "Key Expiry", description: "Set expiration dates on API keys", status: "done", notes: "expires_at column on api_keys" },
      { name: "Rate Limiting", description: "Per-key request rate limits", status: "done", notes: "api_rate_limits table tracking request counts per time window per key" },
      { name: "Last Used Tracking", description: "Track when each key was last used", status: "done", notes: "last_used_at column on api_keys" },
      { name: "Key Active Toggle", description: "Revoke or re-enable API keys", status: "done", notes: "is_active boolean on api_keys" },
      { name: "REST API Edge Function", description: "Full REST API for products, orders, customers", status: "done", notes: "rest-api edge function with CRUD endpoints authenticated via API keys" },
      { name: "Batch API", description: "Batch multiple API operations in a single request", status: "done", notes: "batch-api edge function for bulk operations with atomic commit support" },
      { name: "API Documentation", description: "Interactive API documentation page", status: "done", notes: "Admin /api-docs page with endpoint reference, request/response examples, and authentication guide" },
    ],
  },

  // ═══════ 131. REPORT BUILDER ═══════
  {
    category: "Report Builder",
    icon: <BarChart3 className="h-5 w-5" />,
    features: [
      { name: "Custom Report Creation", description: "Build custom reports with selected metrics and dimensions", status: "done", notes: "Admin /report-builder page with report type selection, date range, grouping, and metric configuration" },
      { name: "Report Types", description: "Sales, products, customers, inventory, marketing report categories", status: "done", notes: "5 report categories with category-specific metric options" },
      { name: "Date Range Filtering", description: "Filter reports by custom date ranges", status: "done", notes: "Date range picker with preset options (today, 7d, 30d, 90d, custom)" },
      { name: "Report Export", description: "Export reports to CSV", status: "done", notes: "CSV export button on generated reports" },
      { name: "Scheduled Reports", description: "Schedule automated report delivery via email", status: "done", notes: "scheduled-report-email edge function sends reports on configured schedule" },
    ],
  },

  // ═══════ 132. IMPORT & EXPORT WIZARD ═══════
  {
    category: "Import & Export Wizard",
    icon: <ArrowLeftRight className="h-5 w-5" />,
    features: [
      { name: "Product Import", description: "Bulk import products from CSV with field mapping", status: "done", notes: "Import Wizard with CSV upload, column mapping, preview, and validation" },
      { name: "Customer Import", description: "Bulk import customers with email duplicate detection", status: "done", notes: "Customer import with name, email, phone, segment, tags mapping" },
      { name: "Order Import", description: "Bulk import historical orders", status: "done", notes: "Order import with order number, status, financials, customer lookup" },
      { name: "Import Templates", description: "Save reusable field mapping templates", status: "done", notes: "import_templates table with saved field_mappings JSONB, template selection on import" },
      { name: "Import Logging", description: "Track import history with success/error counts", status: "done", notes: "import_logs table with entity_type, total_rows, success_count, error_count, errors JSONB" },
      { name: "Product Export", description: "Export products with field selection", status: "done", notes: "Export Wizard with entity type, field checkboxes, date range filters" },
      { name: "Customer Export", description: "Export customer data to CSV", status: "done", notes: "Customer export with segment and tag filtering" },
      { name: "Order Export", description: "Export orders with status and date filtering", status: "done", notes: "Order export with line items, customer details, and financial breakdown" },
      { name: "Review Export", description: "Export product reviews", status: "done", notes: "Review export with product, rating, and approval status" },
      { name: "Scheduled Exports", description: "Automated recurring data exports", status: "done", notes: "scheduled-export edge function with configurable entity type and schedule" },
    ],
  },

  // ═══════ 133. ONBOARDING WIZARD ═══════
  {
    category: "Onboarding Wizard",
    icon: <Sparkles className="h-5 w-5" />,
    features: [
      { name: "Step-by-Step Setup", description: "Guided onboarding flow for new store setup", status: "done", notes: "Admin /onboarding page with multi-step wizard (store info, products, shipping, payments, launch)" },
      { name: "Store Info Collection", description: "Collect store name, contact email, currency, timezone", status: "done", notes: "Step 1 with store_name, contact_email, currency, timezone fields" },
      { name: "First Product Setup", description: "Guide merchant to create their first product", status: "done", notes: "Step 2 with basic product creation (title, price, description, image)" },
      { name: "Shipping Configuration", description: "Set up first shipping zone and rates", status: "done", notes: "Step 3 with shipping zone creation and rate configuration" },
      { name: "Payment Gateway Setup", description: "Configure first payment method", status: "done", notes: "Step 4 with payment gateway selection and credential input" },
      { name: "Launch Checklist", description: "Pre-launch checklist with completion tracking", status: "done", notes: "Step 5 with store readiness checks and publish action" },
    ],
  },

  // ═══════ 134. ORDER HOLD & RELEASE ═══════
  {
    category: "Order Hold & Release",
    icon: <AlertTriangle className="h-5 w-5" />,
    features: [
      { name: "Place Order on Hold", description: "Prevent order from proceeding through fulfillment", status: "done", notes: "order_holds table with hold_reason, held_by, held_at, is_active; hold action on order detail page" },
      { name: "Hold Reason Tracking", description: "Record reason for holding an order", status: "done", notes: "hold_reason column (fraud_review, payment_pending, stock_issue, customer_request, manual)" },
      { name: "Release from Hold", description: "Remove hold and resume order processing", status: "done", notes: "released_at and released_by columns, release action sets is_active=false" },
      { name: "Hold Notes", description: "Internal notes for hold context", status: "done", notes: "notes text field on order_holds" },
      { name: "Hold History", description: "Track all holds/releases per order", status: "done", notes: "Multiple order_holds records per order for full hold history" },
    ],
  },

  // ═══════ 135. SHIPPING MANIFESTS ═══════
  {
    category: "Shipping Manifests",
    icon: <ClipboardCheck className="h-5 w-5" />,
    features: [
      { name: "Manifest CRUD", description: "Create shipping manifests grouping multiple shipments", status: "done", notes: "shipping_manifests table with manifest_number, carrier, status, shipment_count" },
      { name: "Add Shipments to Manifest", description: "Group shipments into a manifest for carrier pickup", status: "done", notes: "shipping_manifest_items linking shipments to manifests" },
      { name: "Manifest Status Workflow", description: "Open → closed → collected lifecycle", status: "done", notes: "status column: open, closed, collected" },
      { name: "Total Weight Tracking", description: "Sum weight of all shipments in manifest", status: "done", notes: "total_weight column calculated from shipment weights" },
      { name: "Close & Print Manifest", description: "Close manifest and generate printable manifest document", status: "done", notes: "closed_at and closed_by columns, print action" },
    ],
  },

  // ═══════ 136. CUSTOMER SEGMENTATION RULES ═══════
  {
    category: "Customer Segmentation Rules",
    icon: <Users className="h-5 w-5" />,
    features: [
      { name: "Segmentation Rule CRUD", description: "Define automatic customer segmentation rules", status: "done", notes: "customer_segmentation_rules table with name, segment, rules JSONB, match_type" },
      { name: "Rule Conditions", description: "Segment by total_spent, total_orders, last_order_date, tags, created_at", status: "done", notes: "rules JSONB array with field, operator, value conditions" },
      { name: "Match Type (All/Any)", description: "Require all conditions or any condition to match", status: "done", notes: "match_type column: all (AND) or any (OR)" },
      { name: "Auto-Run Segmentation", description: "Automatically apply segment labels to matching customers", status: "done", notes: "last_run_at and matched_count columns for tracking execution" },
      { name: "Active Toggle", description: "Enable/disable segmentation rules", status: "done", notes: "is_active boolean on customer_segmentation_rules" },
    ],
  },

  // ═══════ 137. INVENTORY ALERTS ═══════
  {
    category: "Inventory Alerts",
    icon: <Bell className="h-5 w-5" />,
    features: [
      { name: "Low Stock Alerts", description: "Alert when product stock falls below threshold", status: "done", notes: "inventory_alerts table with alert_type, threshold, current_quantity" },
      { name: "Out of Stock Alerts", description: "Alert when product reaches zero stock", status: "done", notes: "alert_type: out_of_stock for zero-quantity alerts" },
      { name: "Overstock Alerts", description: "Alert when stock exceeds maximum threshold", status: "done", notes: "alert_type: overstock for excess inventory detection" },
      { name: "Expiry Alerts", description: "Alert when perishable stock is nearing expiry", status: "done", notes: "alert_type: expiring for date-based alerts" },
      { name: "Alert Resolution", description: "Mark alerts as resolved with attribution", status: "done", notes: "is_resolved, resolved_at, resolved_by columns" },
      { name: "Email Notifications", description: "Send email alerts for critical inventory issues", status: "done", notes: "low-stock-alert edge function sends email digest of low stock items" },
    ],
  },

  // ═══════ 138. PRODUCT FEED MANAGEMENT ═══════
  {
    category: "Product Feed Management",
    icon: <FileCode className="h-5 w-5" />,
    features: [
      { name: "Feed CRUD", description: "Create and manage product data feeds", status: "done", notes: "product_feeds table with name, feed_type, format, schedule, filters JSONB" },
      { name: "Feed Types", description: "Google Shopping, Facebook Catalog, Amazon, Bing Shopping feeds", status: "done", notes: "feed_type column: google_shopping, facebook, amazon, bing, custom" },
      { name: "Feed Formats", description: "XML, CSV, and JSON feed output formats", status: "done", notes: "format column: xml, csv, json" },
      { name: "Feed Scheduling", description: "Daily, hourly, or manual feed generation", status: "done", notes: "schedule column: daily, hourly, manual" },
      { name: "Product Filtering", description: "Filter which products are included in each feed", status: "done", notes: "filters JSONB for category, brand, price range, stock status filtering" },
      { name: "Feed URL", description: "Public URL for feed consumption by channels", status: "done", notes: "feed_url column for external access to generated feed" },
      { name: "Product Count", description: "Track number of products in each feed", status: "done", notes: "product_count column updated on feed generation" },
    ],
  },

  // ═══════ 139. RETURN POLICY MANAGEMENT ═══════
  {
    category: "Return Policy Management",
    icon: <RefreshCw className="h-5 w-5" />,
    features: [
      { name: "Return Policy CRUD", description: "Define store return policies", status: "done", notes: "return_policies table with name, description, return_window_days, restocking_fee_percent" },
      { name: "Return Window", description: "Configurable return window in days", status: "done", notes: "return_window_days column (default 30)" },
      { name: "Restocking Fee", description: "Percentage restocking fee on returns", status: "done", notes: "restocking_fee_percent column (default 0%)" },
      { name: "Receipt Requirements", description: "Toggle whether receipt is required for returns", status: "done", notes: "requires_receipt boolean on return_policies" },
      { name: "Packaging Requirements", description: "Require original packaging for returns", status: "done", notes: "requires_original_packaging boolean on return_policies" },
      { name: "Sale Item Exclusions", description: "Optionally exclude sale items from returns", status: "done", notes: "applies_to_sale_items boolean on return_policies" },
      { name: "Default Policy", description: "Set one policy as the store default", status: "done", notes: "is_default boolean on return_policies" },
    ],
  },

  // ═══════ 140. PRICE LISTS (B2B CONTRACT PRICING) ═══════
  {
    category: "Price Lists (B2B Contract Pricing)",
    icon: <DollarSign className="h-5 w-5" />,
    features: [
      { name: "Price List CRUD", description: "Create customer group-specific price lists", status: "done", notes: "price_lists table with name, customer_group_id, currency, valid_from/until" },
      { name: "Per-Product Pricing", description: "Set specific prices per product per price list", status: "done", notes: "price_list_items table with product_id, variant_id, price, min_quantity" },
      { name: "Customer Group Linking", description: "Associate price lists with customer groups", status: "done", notes: "customer_group_id foreign key on price_lists" },
      { name: "Validity Period", description: "Set start and end dates for price list validity", status: "done", notes: "valid_from and valid_until columns" },
      { name: "Currency Support", description: "Price lists can be in different currencies", status: "done", notes: "currency column on price_lists" },
      { name: "Volume-Based Pricing", description: "Different prices based on minimum order quantity", status: "done", notes: "min_quantity column on price_list_items" },
    ],
  },

  // ═══════ 141. INVENTORY TRANSFERS ═══════
  {
    category: "Inventory Transfers",
    icon: <ArrowLeftRight className="h-5 w-5" />,
    features: [
      { name: "Transfer Request CRUD", description: "Create stock transfer requests between warehouses", status: "done", notes: "inventory_transfers table with transfer_number, source/destination location, status" },
      { name: "Transfer Status Workflow", description: "Pending → approved → shipped → received lifecycle", status: "done", notes: "status column: pending, approved, shipped, received, cancelled" },
      { name: "Transfer Items", description: "Track products and quantities per transfer", status: "done", notes: "inventory_transfer_items table with quantity_requested, quantity_shipped, quantity_received" },
      { name: "Source & Destination", description: "Select source and destination warehouse locations", status: "done", notes: "source_location_id and destination_location_id foreign keys to inventory_locations" },
      { name: "Approval Workflow", description: "Require approval before shipping transfers", status: "done", notes: "approved_by column for transfer authorization tracking" },
      { name: "Ship & Receive Tracking", description: "Track shipped and received dates per transfer", status: "done", notes: "shipped_at and received_at timestamps" },
    ],
  },

  // ═══════ 142. POS SYSTEM ═══════
  {
    category: "Point of Sale (POS)",
    icon: <Monitor className="h-5 w-5" />,
    features: [
      { name: "POS Terminal Interface", description: "Full point-of-sale interface for in-store transactions", status: "done", notes: "Admin /pos page with product search, barcode scan, cart management, and payment processing" },
      { name: "Product Search & Barcode Scan", description: "Find products by name, SKU, or barcode scan", status: "done", notes: "Search input with barcode scanner integration for quick product lookup" },
      { name: "Cart Management", description: "Add/remove items, adjust quantities, apply discounts", status: "done", notes: "POS cart with inline quantity editing, remove items, and subtotal calculation" },
      { name: "Multiple Payment Methods", description: "Accept cash, card, voucher, and mixed payments", status: "done", notes: "Payment method selection with split payment support" },
      { name: "Receipt Printing", description: "Generate printable POS receipts", status: "done", notes: "Print receipt action generates PrintPaymentReceipt page" },
      { name: "Customer Lookup", description: "Find and assign customers to POS transactions", status: "done", notes: "Customer search by name/email with recent customers list" },
      { name: "Held Orders", description: "Hold/park orders for later completion", status: "done", notes: "Hold action saves POS cart state, retrievable from held orders list" },
      { name: "Cash Drawer Management", description: "Open/close register with float tracking", status: "done", notes: "pos_register_sessions with opening_float, cash reconciliation on close" },
    ],
  },

  // ═══════ 143. PRODUCT BULK OPERATIONS ═══════
  {
    category: "Product Bulk Operations",
    icon: <Layers className="h-5 w-5" />,
    features: [
      { name: "Bulk Price Update", description: "Update prices for multiple products at once", status: "done", notes: "BulkEditDialog with percentage or fixed amount price adjustments across selected products" },
      { name: "Bulk Status Change", description: "Change status (active/draft/archived) for multiple products", status: "done", notes: "Bulk status update action on products list" },
      { name: "Bulk Category Assignment", description: "Assign/remove categories for multiple products", status: "done", notes: "Bulk category assignment in BulkEditDialog" },
      { name: "Bulk Tag Management", description: "Add/remove tags across multiple products", status: "done", notes: "Bulk tag add/remove in BulkEditDialog" },
      { name: "Bulk Delete", description: "Delete multiple products with confirmation", status: "done", notes: "Bulk delete action with confirmation dialog" },
      { name: "Bulk Stock Adjustment", description: "Adjust stock for multiple products simultaneously", status: "done", notes: "Bulk stock adjustment option in BulkEditDialog" },
      { name: "Bulk Image Upload (ZIP)", description: "Upload product images via ZIP file with SKU matching", status: "done", notes: "ZipImageUpload component matches image filenames to product SKUs" },
    ],
  },

  // ═══════ 144. DELIVERY ESTIMATES ═══════
  {
    category: "Delivery Estimates",
    icon: <Truck className="h-5 w-5" />,
    features: [
      { name: "Estimated Delivery Display", description: "Show estimated delivery dates on product and cart pages", status: "done", notes: "DeliveryEstimate component calculates estimated delivery from shipping method estimated_days_min/max" },
      { name: "Cut-Off Time Logic", description: "Orders before cut-off ship same day, after ship next day", status: "done", notes: "Configurable cut-off time per shipping method for same-day dispatch" },
      { name: "Weekend/Holiday Exclusion", description: "Skip weekends and holidays in delivery date calculation", status: "done", notes: "Business day calculation excluding weekends" },
      { name: "Per-Product Lead Time", description: "Add product-specific lead time to delivery estimate", status: "done", notes: "lead_time_days on product_shipping adds to zone delivery estimate" },
    ],
  },

  // ═══════ 145. ORDER HOLDS & FRAUD REVIEW ═══════
  {
    category: "Order Holds & Fraud Review",
    icon: <AlertTriangle className="h-5 w-5" />,
    features: [
      { name: "Order Hold CRUD", description: "Place orders on hold for review before processing", status: "done", notes: "order_holds table with hold_reason, hold_type, placed_by, released_by" },
      { name: "Hold Types", description: "Fraud review, payment verification, stock check, manual holds", status: "done", notes: "hold_type column: fraud_review, payment_verify, stock_check, manual" },
      { name: "Auto-Hold Rules", description: "Automatically hold orders matching fraud criteria", status: "done", notes: "High-value orders, address mismatch, first-time customers auto-flagged" },
      { name: "Release Workflow", description: "Admin releases hold after review, order resumes processing", status: "done", notes: "released_by and released_at columns, status transitions from held to processing" },
      { name: "Hold Notes", description: "Add review notes explaining hold/release decisions", status: "done", notes: "notes text field on order_holds for audit trail" },
    ],
  },

  // ═══════ 146. SHIPPING MANIFESTS ═══════
  {
    category: "Shipping Manifests",
    icon: <FileText className="h-5 w-5" />,
    features: [
      { name: "Manifest CRUD", description: "Create shipping manifests grouping multiple shipments", status: "done", notes: "shipping_manifests table with manifest_number, carrier, status, manifest_date" },
      { name: "Manifest Items", description: "Add shipments/orders to a manifest for batch handoff", status: "done", notes: "shipping_manifest_items table linking manifests to order shipments" },
      { name: "Manifest Status Workflow", description: "Open → closed → dispatched lifecycle", status: "done", notes: "status column with full manifest lifecycle" },
      { name: "Carrier Assignment", description: "Assign manifest to specific carrier for pickup", status: "done", notes: "carrier column on shipping_manifests" },
      { name: "Manifest Print/Export", description: "Print or export manifest for carrier handover", status: "done", notes: "Printable manifest page with shipment details, tracking numbers, and totals" },
    ],
  },

  // ═══════ 147. CUSTOMER SEGMENTATION RULES ═══════
  {
    category: "Customer Segmentation Rules",
    icon: <Users className="h-5 w-5" />,
    features: [
      { name: "Segmentation Rule CRUD", description: "Create automated customer segmentation rules", status: "done", notes: "customer_segmentation_rules table with name, segment, rules JSONB, match_type" },
      { name: "Rule Conditions", description: "Segment by total spent, order count, last order date, location, tags", status: "done", notes: "rules JSONB with field, operator, value structure supporting multiple conditions" },
      { name: "Match Type (All/Any)", description: "Require all or any conditions to match", status: "done", notes: "match_type column: all (AND) or any (OR) logic" },
      { name: "Auto-Segment Assignment", description: "Automatically assign customers to segments when rules match", status: "done", notes: "Matched customers auto-tagged with segment value" },
      { name: "Segment Analytics", description: "Track matched customer count per segmentation rule", status: "done", notes: "matched_count and last_run_at columns for rule performance tracking" },
    ],
  },

  // ═══════ 148. PRODUCT FEEDS & CHANNELS ═══════
  {
    category: "Product Feeds & Channels",
    icon: <Share2 className="h-5 w-5" />,
    features: [
      { name: "Product Feed CRUD", description: "Create and manage product data feeds for external channels", status: "done", notes: "product_feeds table with feed_name, feed_type, feed_url, format, last_generated_at" },
      { name: "Feed Formats", description: "Support XML, CSV, JSON, and RSS feed formats", status: "done", notes: "format column: xml, csv, json, rss" },
      { name: "Feed Types", description: "Google Shopping, Facebook Catalog, Bing Shopping, Custom feeds", status: "done", notes: "feed_type column for channel-specific formatting" },
      { name: "Feed Scheduling", description: "Auto-regenerate feeds on schedule", status: "done", notes: "schedule column for cron-based feed regeneration" },
      { name: "Feed Field Mapping", description: "Map product fields to channel-specific feed fields", status: "done", notes: "field_mappings JSONB for custom field mapping per feed" },
      { name: "Feed Filters", description: "Include/exclude products by status, category, stock level", status: "done", notes: "filters JSONB for product selection criteria" },
    ],
  },

  // ═══════ 149. RETURN POLICIES ═══════
  {
    category: "Return Policies",
    icon: <RefreshCw className="h-5 w-5" />,
    features: [
      { name: "Return Policy CRUD", description: "Create and manage return policies per product or category", status: "done", notes: "return_policies table with name, days_to_return, conditions, restocking_fee_percent" },
      { name: "Return Window", description: "Configurable days for return eligibility", status: "done", notes: "days_to_return column defining return period" },
      { name: "Restocking Fee", description: "Apply percentage restocking fee on returns", status: "done", notes: "restocking_fee_percent column for fee calculation" },
      { name: "Non-Returnable Flag", description: "Mark specific products as non-returnable", status: "done", notes: "is_final_sale boolean prevents return requests for specific items" },
      { name: "Policy Conditions", description: "Define conditions for return eligibility (unused, original packaging, etc.)", status: "done", notes: "conditions text field describing return requirements" },
    ],
  },

  // ═══════ 150. PRICE LISTS / CONTRACT PRICING ═══════
  {
    category: "Price Lists / Contract Pricing",
    icon: <DollarSign className="h-5 w-5" />,
    features: [
      { name: "Price List CRUD", description: "Create named price lists for B2B contract pricing", status: "done", notes: "price_lists table with name, description, currency, is_active, valid_from/until" },
      { name: "Price List Items", description: "Set custom prices per product within a price list", status: "done", notes: "price_list_items table with product_id, custom_price, min_quantity" },
      { name: "Customer Group Assignment", description: "Assign price lists to specific customer groups", status: "done", notes: "customer_group_id on price_lists for group-based pricing" },
      { name: "Validity Period", description: "Set start and end dates for price list validity", status: "done", notes: "valid_from and valid_until date columns" },
      { name: "Currency Support", description: "Price lists can be in different currencies", status: "done", notes: "currency column on price_lists" },
      { name: "Volume-Based Pricing", description: "Different prices based on minimum order quantity", status: "done", notes: "min_quantity column on price_list_items" },
    ],
  },

  // ═══════ 151. INVENTORY TRANSFERS ═══════
  {
    category: "Inventory Transfers",
    icon: <ArrowLeftRight className="h-5 w-5" />,
    features: [
      { name: "Transfer Request CRUD", description: "Create stock transfer requests between warehouses", status: "done", notes: "inventory_transfers table with transfer_number, source/destination location, status" },
      { name: "Transfer Status Workflow", description: "Pending → approved → shipped → received lifecycle", status: "done", notes: "status column: pending, approved, shipped, received, cancelled" },
      { name: "Transfer Items", description: "Track products and quantities per transfer", status: "done", notes: "inventory_transfer_items table with quantity_requested, quantity_shipped, quantity_received" },
      { name: "Source & Destination", description: "Select source and destination warehouse locations", status: "done", notes: "source_location_id and destination_location_id foreign keys to inventory_locations" },
      { name: "Approval Workflow", description: "Require approval before shipping transfers", status: "done", notes: "approved_by column for transfer authorization tracking" },
      { name: "Ship & Receive Tracking", description: "Track shipped and received dates per transfer", status: "done", notes: "shipped_at and received_at timestamps" },
    ],
  },

  // ═══════ 152. POS SYSTEM ═══════
  {
    category: "Point of Sale (POS)",
    icon: <Monitor className="h-5 w-5" />,
    features: [
      { name: "POS Terminal Interface", description: "Full point-of-sale interface for in-store transactions", status: "done", notes: "Admin /pos page with product search, barcode scan, cart management, and payment processing" },
      { name: "Product Search & Barcode Scan", description: "Find products by name, SKU, or barcode scan", status: "done", notes: "Search input with barcode scanner integration for quick product lookup" },
      { name: "Cart Management", description: "Add/remove items, adjust quantities, apply discounts", status: "done", notes: "POS cart with inline quantity editing, remove items, and subtotal calculation" },
      { name: "Multiple Payment Methods", description: "Accept cash, card, voucher, and mixed payments", status: "done", notes: "Payment method selection with split payment support" },
      { name: "Receipt Printing", description: "Generate printable POS receipts", status: "done", notes: "Print receipt action generates PrintPaymentReceipt page" },
      { name: "Customer Lookup", description: "Find and assign customers to POS transactions", status: "done", notes: "Customer search by name/email with recent customers list" },
      { name: "Held Orders", description: "Hold/park orders for later completion", status: "done", notes: "Hold action saves POS cart state, retrievable from held orders list" },
      { name: "Cash Drawer Management", description: "Open/close register with float tracking", status: "done", notes: "pos_register_sessions with opening_float, cash reconciliation on close" },
    ],
  },

  // ═══════ 153. PRODUCT BULK OPERATIONS (EXTENDED) ═══════
  {
    category: "Product Bulk Operations (Extended)",
    icon: <Layers className="h-5 w-5" />,
    features: [
      { name: "Bulk Supplier Assignment", description: "Assign supplier to multiple products at once", status: "done", notes: "Bulk supplier_id update in BulkEditDialog" },
      { name: "Bulk Brand Update", description: "Update brand for multiple products", status: "done", notes: "Bulk brand update action in BulkEditDialog" },
      { name: "Bulk Weight/Dimension Update", description: "Update shipping dimensions for multiple products", status: "done", notes: "Bulk weight and dimensions update in BulkEditDialog" },
      { name: "Bulk Visibility Group Assignment", description: "Restrict/unrestrict multiple products to customer groups", status: "done", notes: "Bulk visibility_groups update in BulkEditDialog" },
      { name: "Bulk Export Selected", description: "Export only selected products to CSV", status: "done", notes: "Export selected action on products list toolbar" },
    ],
  },

  // ═══════ 154. ORDER COMMUNICATIONS ═══════
  {
    category: "Order Communications",
    icon: <Mail className="h-5 w-5" />,
    features: [
      { name: "Order Confirmation Email", description: "Auto-send confirmation when order is placed", status: "done", notes: "order-email-trigger edge function sends confirmation with order details" },
      { name: "Shipment Notification Email", description: "Auto-notify customer when order ships", status: "done", notes: "shipment-email edge function with tracking info and carrier details" },
      { name: "Delivery Confirmation Email", description: "Notify customer when order is delivered", status: "done", notes: "order-delivered-email edge function" },
      { name: "Payment Confirmation Email", description: "Send receipt when payment is recorded", status: "done", notes: "payment-email edge function with payment details" },
      { name: "Order Follow-Up Email", description: "Post-purchase follow-up for reviews/feedback", status: "done", notes: "order-follow-up edge function with configurable delay" },
      { name: "Back-in-Stock Notification", description: "Notify customers when wishlisted/requested items are restocked", status: "done", notes: "back-in-stock-email edge function processes back_in_stock_requests" },
      { name: "Low Stock Alert Email", description: "Notify admin when products fall below threshold", status: "done", notes: "low-stock-alert edge function for inventory monitoring" },
    ],
  },

  // ═══════ 155. DROPSHIP MANAGEMENT ═══════
  {
    category: "Dropship Management",
    icon: <Truck className="h-5 w-5" />,
    features: [
      { name: "Dropship Supplier Setup", description: "Configure suppliers as dropship vendors", status: "done", notes: "Suppliers with type 'dropship' flagged for auto-forwarding" },
      { name: "Dropship Order Notification", description: "Auto-notify supplier when dropship order placed", status: "done", notes: "dropship-notification edge function sends order details to supplier email" },
      { name: "Supplier PO Auto-Generation", description: "Auto-create purchase order to supplier for dropship items", status: "done", notes: "PO created with dropship flag linking to customer order" },
      { name: "Dropship Tracking Integration", description: "Supplier updates tracking which flows to customer", status: "done", notes: "Tracking updates on supplier PO auto-update customer order shipment" },
      { name: "Branded Packing Slips", description: "Packing slips with merchant branding for supplier to include", status: "done", notes: "PrintPackingSlip uses store name/logo, not supplier, for branded unboxing" },
    ],
  },

  // ═══════ 156. INVENTORY FORECASTING ═══════
  {
    category: "Inventory Forecasting",
    icon: <BarChart3 className="h-5 w-5" />,
    features: [
      { name: "Average Daily Sales", description: "Calculate avg daily sales velocity per product", status: "done", notes: "avg_daily_sales column on inventory_forecasts calculated from order history" },
      { name: "Days of Stock Remaining", description: "Estimate days until stockout based on sales velocity", status: "done", notes: "days_of_stock calculated from current stock / avg_daily_sales" },
      { name: "Reorder Date Prediction", description: "Predict when to reorder based on lead time and velocity", status: "done", notes: "reorder_date calculated from days_of_stock minus lead_time_days" },
      { name: "Safety Stock Calculation", description: "Recommended safety stock buffer based on variability", status: "done", notes: "safety_stock column on inventory_forecasts" },
      { name: "Suggested Reorder Quantity", description: "Recommended order quantity based on demand and lead time", status: "done", notes: "suggested_reorder_qty on inventory_forecasts" },
      { name: "Lead Time Tracking", description: "Track supplier lead time per product", status: "done", notes: "lead_time_days column on inventory_forecasts" },
      { name: "Forecasting Dashboard", description: "Visual dashboard of stock forecasts with risk indicators", status: "done", notes: "Admin /inventory-forecasting page with KPI cards and color-coded risk table" },
    ],
  },

  // ═══════ 157. PRODUCT REVIEWS & RATINGS ═══════
  {
    category: "Product Reviews & Ratings",
    icon: <Star className="h-5 w-5" />,
    features: [
      { name: "Customer Reviews", description: "Customers submit reviews with star rating and text", status: "done", notes: "product_reviews table with rating, title, body, author_name, is_verified_purchase" },
      { name: "Review Moderation", description: "Admin approves or rejects reviews before display", status: "done", notes: "is_approved boolean, admin Reviews page with moderation queue" },
      { name: "Verified Purchase Badge", description: "Mark reviews from verified purchasers", status: "done", notes: "is_verified_purchase boolean checked against order_items" },
      { name: "Helpful Votes", description: "Customers can mark reviews as helpful", status: "done", notes: "helpful_count column on product_reviews" },
      { name: "Review Reply (Admin)", description: "Admin can reply to customer reviews", status: "done", notes: "admin_reply and admin_reply_at columns for public merchant responses" },
      { name: "Aggregate Rating Display", description: "Show average rating and distribution on product page", status: "done", notes: "ProductReviews component with star distribution bar chart and average rating" },
      { name: "Review Sorting & Filtering", description: "Sort by newest, highest, lowest, most helpful", status: "done", notes: "Sort controls on ProductReviews storefront component" },
    ],
  },

  // ═══════ 158. AFFILIATE / REFERRAL PROGRAM ═══════
  {
    category: "Affiliate / Referral Program",
    icon: <UserPlus className="h-5 w-5" />,
    features: [
      { name: "Affiliate Registration", description: "Users apply to become affiliates", status: "done", notes: "affiliates table with user_id, referral_code, commission_rate, status" },
      { name: "Unique Referral Codes", description: "Each affiliate gets a unique tracking code", status: "done", notes: "referral_code column with unique constraint" },
      { name: "Commission Tracking", description: "Track commissions earned per referral sale", status: "done", notes: "affiliate_commissions table with order_id, amount, status (pending/approved/paid)" },
      { name: "Commission Rates", description: "Configurable commission percentage per affiliate", status: "done", notes: "commission_rate column on affiliates table" },
      { name: "Payout Management", description: "Track and manage affiliate payouts", status: "done", notes: "total_earned, total_paid, pending_balance columns on affiliates" },
      { name: "Affiliate Dashboard", description: "Admin view of all affiliates with performance metrics", status: "done", notes: "Admin /affiliates page with KPI cards, affiliate list, commission history" },
      { name: "Referral Link Tracking", description: "Track clicks and conversions from referral links", status: "done", notes: "Click and conversion tracking via referral_code parameter on storefront URLs" },
    ],
  },

  // ═══════ 159. LOYALTY PROGRAM ═══════
  {
    category: "Loyalty Program",
    icon: <Heart className="h-5 w-5" />,
    features: [
      { name: "Points Earning", description: "Earn points per dollar spent", status: "done", notes: "loyalty_points table with balance, lifetime_earned per customer" },
      { name: "Points Redemption", description: "Redeem points for discounts at checkout", status: "done", notes: "Points redemption at checkout with configurable points-to-dollar ratio" },
      { name: "Tier System", description: "Bronze, Silver, Gold, Platinum loyalty tiers", status: "done", notes: "tier column on loyalty_points with tier-based multipliers" },
      { name: "Transaction History", description: "Track all point earn/redeem transactions", status: "done", notes: "loyalty_transactions table with type (earn/redeem), points, description" },
      { name: "Bonus Point Events", description: "Award bonus points for actions (signup, review, birthday)", status: "done", notes: "Manual bonus point actions with description tracking" },
      { name: "Points Expiry", description: "Set expiry period for earned points", status: "done", notes: "expires_at column on loyalty_transactions for time-limited points" },
      { name: "Loyalty Dashboard", description: "Admin overview of program metrics and member tiers", status: "done", notes: "Admin /loyalty page with KPI cards, tier breakdown, and member list" },
    ],
  },

  // ═══════ 160. COUPONS & DISCOUNT CODES ═══════
  {
    category: "Coupons & Discount Codes",
    icon: <Tag className="h-5 w-5" />,
    features: [
      { name: "Coupon CRUD", description: "Create and manage discount coupon codes", status: "done", notes: "coupons table with code, discount_type, discount_value, is_active" },
      { name: "Percentage Discount", description: "Coupon for percentage off order", status: "done", notes: "discount_type: percentage" },
      { name: "Fixed Amount Discount", description: "Coupon for fixed dollar amount off", status: "done", notes: "discount_type: fixed_amount" },
      { name: "Free Shipping Coupon", description: "Coupon that grants free shipping", status: "done", notes: "free_shipping boolean on coupons" },
      { name: "Minimum Order Requirement", description: "Require minimum cart value to use coupon", status: "done", notes: "min_order_amount column on coupons" },
      { name: "Usage Limits", description: "Set max total uses and per-customer limits", status: "done", notes: "max_uses and per_customer_limit columns" },
      { name: "Coupon Scheduling", description: "Set valid date range for coupons", status: "done", notes: "starts_at and expires_at columns" },
      { name: "Product/Category Scope", description: "Apply coupon to specific products or categories only", status: "done", notes: "applies_to, product_ids, and category_ids columns for targeting" },
      { name: "Used Count Tracking", description: "Track how many times each coupon has been used", status: "done", notes: "used_count column auto-incremented on redemption" },
    ],
  },

  // ═══════ 161. CONTACT SUBMISSIONS ═══════
  {
    category: "Contact Submissions",
    icon: <MessageSquare className="h-5 w-5" />,
    features: [
      { name: "Contact Form Submissions", description: "Store and manage contact form submissions", status: "done", notes: "contact_submissions table with name, email, subject, message, is_read" },
      { name: "Read/Unread Status", description: "Track which submissions have been reviewed", status: "done", notes: "is_read boolean toggle on contact_submissions" },
      { name: "Email Notification", description: "Notify admin of new contact submissions", status: "done", notes: "contact-email edge function sends admin notification" },
      { name: "Reply from Admin", description: "Reply to contact submissions from admin panel", status: "done", notes: "Reply action opens email compose with customer email pre-filled" },
    ],
  },

  // ═══════ 162. NEWSLETTER SUBSCRIBERS ═══════
  {
    category: "Newsletter Subscribers",
    icon: <Mail className="h-5 w-5" />,
    features: [
      { name: "Newsletter Signup", description: "Capture email signups from storefront", status: "done", notes: "newsletter_subscribers table with email, subscribed_at, is_active" },
      { name: "Duplicate Prevention", description: "Prevent duplicate email subscriptions", status: "done", notes: "Unique constraint on email + store_id" },
      { name: "Unsubscribe Support", description: "Allow subscribers to opt out", status: "done", notes: "is_active toggle for soft unsubscribe" },
      { name: "Subscriber Export", description: "Export subscriber list for email marketing platforms", status: "done", notes: "CSV export of subscriber emails from admin" },
      { name: "Klaviyo/Mailchimp Sync", description: "Sync subscribers to email marketing platforms", status: "partial", notes: "klaviyo-sync and mailchimp-sync edge functions — require merchant API keys" },
    ],
  },

  // ═══════ 163. STORE SETTINGS & CONFIGURATION ═══════
  {
    category: "Store Settings & Configuration",
    icon: <Settings className="h-5 w-5" />,
    features: [
      { name: "General Store Settings", description: "Store name, contact email, phone, timezone", status: "done", notes: "stores table with name, contact_email, phone, timezone" },
      { name: "SMTP Email Configuration", description: "Configure custom SMTP for outbound emails", status: "done", notes: "smtp_config JSONB on stores with host, port, username, password, from_email" },
      { name: "Tax Configuration", description: "Tax-inclusive/exclusive, default tax rate", status: "done", notes: "tax_mode, default_tax_rate columns on stores" },
      { name: "Currency Configuration", description: "Default currency and decimal precision", status: "done", notes: "default_currency, currency_decimal_places, currency_symbol_position on stores" },
      { name: "Order Number Format", description: "Customize order number prefix and format", status: "done", notes: "order_number_prefix column on stores" },
      { name: "Checkout Settings", description: "Guest checkout toggle, account required toggle", status: "done", notes: "allow_guest_checkout and require_account_for_checkout booleans on stores" },
      { name: "Inventory Settings", description: "Low stock threshold, track inventory toggle", status: "done", notes: "default_low_stock_threshold on stores" },
      { name: "Social Media Links", description: "Store social media profile URLs", status: "done", notes: "social_links JSONB on stores for facebook, instagram, twitter, etc." },
      { name: "Store Logo & Branding", description: "Upload store logo and favicon", status: "done", notes: "logo_url and favicon_url columns on stores" },
    ],
  },

  // ═══════ 164. ROLE-BASED ACCESS CONTROL ═══════
  {
    category: "Role-Based Access Control",
    icon: <Shield className="h-5 w-5" />,
    features: [
      { name: "User Roles (Owner/Admin/Staff)", description: "Assign roles to users per store", status: "done", notes: "user_roles table with user_id, store_id, role (owner/admin/manager/staff)" },
      { name: "Role Permissions", description: "Configure granular permissions per role", status: "done", notes: "Admin /role-permissions page with permission matrix" },
      { name: "Multi-Store Roles", description: "Users can have different roles across stores", status: "done", notes: "user_roles is per store_id, allowing different access per store" },
      { name: "Platform Admin Role", description: "Super-admin role for multi-tenant platform management", status: "done", notes: "platform_roles table with platform_admin role, RequirePlatformAdmin guard" },
      { name: "Auto-First-Admin Promotion", description: "First user automatically becomes platform admin", status: "done", notes: "auto_promote_first_admin() trigger on profiles table" },
      { name: "Staff Activity Tracking", description: "Track admin user actions and logins", status: "done", notes: "activity_log table with action, entity_type, entity_id, user_id tracking" },
    ],
  },

  // ═══════ 165. PLATFORM ADMIN (MULTI-TENANT) ═══════
  {
    category: "Platform Admin (Multi-Tenant)",
    icon: <Building className="h-5 w-5" />,
    features: [
      { name: "Platform Dashboard", description: "Overview of all merchants and platform KPIs", status: "done", notes: "PlatformDashboard page with total merchants, total orders, total revenue, recent activity" },
      { name: "Merchant Management", description: "View and manage all merchant stores", status: "done", notes: "PlatformMerchants page with store list, status badges, owner info" },
      { name: "Platform Analytics", description: "Cross-merchant analytics and reporting", status: "done", notes: "PlatformAnalytics page with aggregate metrics across all stores" },
      { name: "Platform Customer View", description: "View customers across all stores", status: "done", notes: "PlatformCustomers page aggregating customer data" },
      { name: "Platform Settings", description: "Global platform configuration", status: "done", notes: "PlatformSettings page for platform-wide settings" },
      { name: "Platform Login", description: "Separate login flow for platform admins", status: "done", notes: "PlatformLogin page with admin-specific auth flow" },
    ],
  },

  // ═══════ 166. API & DEVELOPER TOOLS ═══════
  {
    category: "API & Developer Tools",
    icon: <Code className="h-5 w-5" />,
    features: [
      { name: "REST API", description: "Full REST API for external integrations", status: "done", notes: "rest-api edge function with GET/POST/PUT/DELETE for products, orders, customers, inventory" },
      { name: "API Key Management", description: "Create and manage API keys with scopes", status: "done", notes: "api_keys table with key_hash, key_prefix, scopes, rate_limit, expiry" },
      { name: "API Rate Limiting", description: "Rate limit API requests per key", status: "done", notes: "api_rate_limits table with request_count per 15-min window" },
      { name: "Batch API Requests", description: "Send multiple API requests in a single call", status: "done", notes: "batch-api edge function accepting array of {method, path, body} requests" },
      { name: "API Documentation", description: "Interactive API documentation for developers", status: "done", notes: "Admin /api-docs page with endpoint docs, try-it sandbox, code examples" },
      { name: "Webhook Testing", description: "Test webhook endpoints from admin panel", status: "done", notes: "Test button on Webhooks page sends sample payload to endpoint" },
    ],
  },

  // ═══════ 167. SUPPLIER MANAGEMENT ═══════
  {
    category: "Supplier Management",
    icon: <Boxes className="h-5 w-5" />,
    features: [
      { name: "Supplier CRUD", description: "Create and manage supplier records", status: "done", notes: "suppliers table with name, email, phone, address, contact_person, payment_terms" },
      { name: "Supplier Products", description: "Link products to their suppliers", status: "done", notes: "supplier_id foreign key on products table" },
      { name: "Supplier Lead Time", description: "Track average delivery lead time per supplier", status: "done", notes: "lead_time_days column on suppliers" },
      { name: "Purchase Order to Supplier", description: "Create POs addressed to specific suppliers", status: "done", notes: "supplier_id on purchase_orders with supplier details on printed PO" },
      { name: "Supplier Notes", description: "Internal notes per supplier", status: "done", notes: "notes column on suppliers table" },
      { name: "Supplier Active Toggle", description: "Enable/disable suppliers", status: "done", notes: "is_active boolean on suppliers" },
    ],
  },

  // ═══════ 168. STOREFRONT CHECKOUT FEATURES ═══════
  {
    category: "Storefront Checkout Features",
    icon: <ShoppingCart className="h-5 w-5" />,
    features: [
      { name: "Guest Checkout", description: "Allow checkout without account creation", status: "done", notes: "Guest checkout flow with email capture, configurable via store settings" },
      { name: "Saved Addresses", description: "Select from previously saved addresses at checkout", status: "done", notes: "Address dropdown for logged-in users with saved customer_addresses" },
      { name: "Order Notes", description: "Customer can add notes to their order", status: "done", notes: "Order notes textarea on checkout page" },
      { name: "Gift Message", description: "Add gift message to order", status: "done", notes: "Gift message textarea appears when gift checkbox is selected" },
      { name: "Shipping Method Selection", description: "Choose from available shipping methods based on zone", status: "done", notes: "Radio buttons for applicable shipping zones/methods with rate display" },
      { name: "Coupon Application", description: "Apply discount coupon codes at checkout", status: "done", notes: "Coupon code input with validate, apply, and remove functionality" },
      { name: "Store Credit Application", description: "Apply store credit balance to reduce total", status: "done", notes: "Use Store Credit checkbox at checkout deducts from customer balance" },
      { name: "Order Summary", description: "Real-time order summary with subtotal, tax, shipping, discounts", status: "done", notes: "Dynamic order summary sidebar updating on every cart/coupon/shipping change" },
    ],
  },

  // ═══════ 169. STOREFRONT NAVIGATION ═══════
  {
    category: "Storefront Navigation",
    icon: <Globe className="h-5 w-5" />,
    features: [
      { name: "Header Navigation", description: "Main navigation with category links and dropdowns", status: "done", notes: "StorefrontLayout header with category navigation, search, cart, and account links" },
      { name: "Mobile Menu (Hamburger)", description: "Responsive mobile navigation drawer", status: "done", notes: "Sheet-based mobile menu with category tree and account links" },
      { name: "Footer Navigation", description: "Footer with links, newsletter signup, and social icons", status: "done", notes: "StorefrontLayout footer with link columns, newsletter form, and social links" },
      { name: "Breadcrumb Navigation", description: "Category breadcrumb trail on product pages", status: "done", notes: "Breadcrumb component on product detail and category pages" },
      { name: "Sidebar Navigation", description: "Category sidebar for browsing on product listing pages", status: "done", notes: "StorefrontSidebar component with category tree and filter options" },
      { name: "Cart Icon with Count", description: "Shopping cart icon showing item count in header", status: "done", notes: "Cart badge in header showing real-time cart item count" },
    ],
  },

  // ═══════ 170. PRODUCT FILTERING & SORTING ═══════
  {
    category: "Product Filtering & Sorting",
    icon: <Search className="h-5 w-5" />,
    features: [
      { name: "Price Range Filter", description: "Filter products by min/max price", status: "done", notes: "Price slider filter on products listing page" },
      { name: "Category Filter", description: "Filter by product category", status: "done", notes: "Category selection in sidebar with product count per category" },
      { name: "Brand Filter", description: "Filter products by brand", status: "done", notes: "Brand filter with available brands list" },
      { name: "In-Stock Filter", description: "Show only in-stock products", status: "done", notes: "Stock availability toggle filter" },
      { name: "Sort by Price", description: "Sort products by price ascending/descending", status: "done", notes: "Sort dropdown with price low-high and high-low options" },
      { name: "Sort by Name", description: "Sort products alphabetically", status: "done", notes: "Sort by name A-Z and Z-A options" },
      { name: "Sort by Newest", description: "Sort by most recently added products", status: "done", notes: "Sort by date created descending" },
      { name: "Sort by Best Selling", description: "Sort by sales volume", status: "done", notes: "Sort by total_sold descending" },
      { name: "Grid/List View Toggle", description: "Switch between grid and list product display", status: "done", notes: "View toggle button switching between grid and list layouts" },
    ],
  },

  // ═══════ 171. ORDER CHANNEL TRACKING ═══════
  {
    category: "Order Channel Tracking",
    icon: <Layers className="h-5 w-5" />,
    features: [
      { name: "Order Source Channel", description: "Track where each order originated (web, POS, API, marketplace)", status: "done", notes: "order_channel column on orders: web, pos, api, ebay, amazon, phone, manual" },
      { name: "Channel-Based Reporting", description: "Filter and report on orders by sales channel", status: "done", notes: "Channel filter on orders list, channel breakdown in analytics" },
      { name: "Marketplace Order Tagging", description: "Auto-tag orders from marketplace integrations", status: "done", notes: "marketplace_order_id and marketplace_name columns on orders" },
      { name: "POS Order Identification", description: "Identify POS transactions vs online orders", status: "done", notes: "order_channel='pos' with register_id linking for POS orders" },
    ],
  },

  // ═══════ 172. PRODUCT WEIGHT TIERS ═══════
  {
    category: "Product Weight & Packaging",
    icon: <Package className="h-5 w-5" />,
    features: [
      { name: "Actual Weight vs Shipping Weight", description: "Separate actual and shipping weights", status: "done", notes: "weight on products vs shipping_weight on product_shipping" },
      { name: "Volumetric Weight Calculation", description: "Calculate volumetric weight from dimensions", status: "done", notes: "Cubic volume from L×W×H on product_shipping used for volumetric weight" },
      { name: "Packaging Type", description: "Define packaging requirements per product", status: "done", notes: "shipping_category on product_shipping (standard, fragile, oversized, hazmat)" },
      { name: "Multi-Carton Products", description: "Products that ship in multiple cartons", status: "done", notes: "cartons column on product_shipping for multi-package shipments" },
    ],
  },

  // ═══════ 173. CUSTOMER ADDRESSES ═══════
  {
    category: "Customer Addresses",
    icon: <MapPin className="h-5 w-5" />,
    features: [
      { name: "Multiple Addresses per Customer", description: "Store multiple shipping/billing addresses", status: "done", notes: "customer_addresses table with address_type, is_default, full address fields" },
      { name: "Default Address Selection", description: "Set default shipping and billing addresses", status: "done", notes: "is_default boolean per address type" },
      { name: "Address Label", description: "Name/label for each saved address (Home, Office, etc.)", status: "done", notes: "label column on customer_addresses" },
      { name: "Address at Checkout", description: "Select from saved addresses during checkout", status: "done", notes: "Dropdown selection of saved addresses on checkout page" },
      { name: "Address Validation", description: "Validate required fields (city, state, zip, country)", status: "done", notes: "Client-side validation for required address fields" },
    ],
  },

  // ═══════ 174. ORDER PAYMENTS ═══════
  {
    category: "Order Payments",
    icon: <CreditCard className="h-5 w-5" />,
    features: [
      { name: "Payment Recording", description: "Record payments against orders with method and amount", status: "done", notes: "order_payments table with amount, payment_method, transaction_id" },
      { name: "Partial Payments", description: "Accept partial payments against an order balance", status: "done", notes: "Multiple payment records per order, status auto-updates to partial_paid" },
      { name: "Payment Methods", description: "Support card, cash, bank transfer, voucher, store credit", status: "done", notes: "payment_method column with multiple supported methods" },
      { name: "Transaction Reference", description: "Store payment gateway transaction IDs", status: "done", notes: "transaction_id column for gateway reference tracking" },
      { name: "Refund Processing", description: "Issue full or partial refunds against payments", status: "done", notes: "Refund dialog on order detail with amount and reason" },
      { name: "Payment History", description: "View all payments for an order in chronological order", status: "done", notes: "Payment history card on order detail page" },
    ],
  },

  // ═══════ 175. ORDER SHIPMENTS ═══════
  {
    category: "Order Shipments",
    icon: <Truck className="h-5 w-5" />,
    features: [
      { name: "Multi-Shipment per Order", description: "Ship an order in multiple packages/shipments", status: "done", notes: "order_shipments table with multiple records per order_id" },
      { name: "Shipment Items", description: "Track which items are in each shipment", status: "done", notes: "order_shipment_items table linking shipment to order items with quantity" },
      { name: "Carrier & Tracking", description: "Record carrier name and tracking number per shipment", status: "done", notes: "carrier and tracking_number columns on order_shipments" },
      { name: "Tracking URL", description: "Auto-generate or manual tracking URL for customer", status: "done", notes: "tracking_url column on order_shipments" },
      { name: "Shipment Status", description: "Track shipment status (pending, shipped, in_transit, delivered)", status: "done", notes: "status column on order_shipments with full lifecycle" },
      { name: "Shipment Email Notification", description: "Auto-email customer with tracking details", status: "done", notes: "shipment-email edge function triggered on shipment creation" },
      { name: "Partial Fulfillment", description: "Ship some items while others remain unfulfilled", status: "done", notes: "Order fulfillment_status updates to partial when some items shipped" },
    ],
  },

  // ═══════ 176. PRODUCT IMAGES & GALLERY ═══════
  {
    category: "Product Images & Gallery",
    icon: <Image className="h-5 w-5" />,
    features: [
      { name: "Multiple Product Images", description: "Upload multiple images per product", status: "done", notes: "product_images table with product_id, url, sort_order, alt_text" },
      { name: "Image Reordering", description: "Drag or sort-order images for display priority", status: "done", notes: "sort_order column on product_images for custom ordering" },
      { name: "Alt Text per Image", description: "SEO-friendly alt text on each product image", status: "done", notes: "alt_text column on product_images" },
      { name: "Primary Image Selection", description: "Set primary/featured image for product", status: "done", notes: "is_primary boolean or first by sort_order" },
      { name: "Image Zoom on Hover", description: "Zoom into product images on storefront", status: "done", notes: "ImageLightbox component with zoom support" },
      { name: "Gallery Lightbox", description: "Full-screen image gallery with keyboard navigation", status: "done", notes: "ImageLightbox with arrow keys, swipe, and close on ESC" },
      { name: "Bulk ZIP Upload", description: "Upload images in ZIP matched by SKU filename", status: "done", notes: "ZipImageUpload component for batch image upload" },
    ],
  },

  // ═══════ 177. PURCHASE ORDERS ═══════
  {
    category: "Purchase Orders",
    icon: <FileText className="h-5 w-5" />,
    features: [
      { name: "PO CRUD", description: "Create, edit, and manage purchase orders", status: "done", notes: "purchase_orders table with po_number, supplier, status, totals" },
      { name: "PO Status Workflow", description: "Draft → sent → partial → received → closed lifecycle", status: "done", notes: "status column with full PO lifecycle management" },
      { name: "PO Line Items", description: "Add products with quantities and unit costs to POs", status: "done", notes: "purchase_order_items table with product_id, quantity, unit_cost" },
      { name: "Supplier Assignment", description: "Assign PO to a specific supplier", status: "done", notes: "supplier_id on purchase_orders" },
      { name: "Expected Delivery Date", description: "Set expected delivery date on POs", status: "done", notes: "expected_date column on purchase_orders" },
      { name: "Receiving Against PO", description: "Receive stock item-by-item against PO", status: "done", notes: "Receiving dialog with per-item quantity input, auto-updates inventory" },
      { name: "PO Print/PDF", description: "Generate printable purchase order document", status: "done", notes: "PrintPurchaseOrder page with supplier details and line items" },
      { name: "PO Notes", description: "Internal notes and supplier instructions on POs", status: "done", notes: "notes column on purchase_orders" },
    ],
  },

  // ═══════ 178. ADDON / APP MARKETPLACE ═══════
  {
    category: "Addon / App Marketplace",
    icon: <Puzzle className="h-5 w-5" />,
    features: [
      { name: "Addon Catalog", description: "Browse available addons/apps for the store", status: "done", notes: "addon_catalog table with name, description, category, version, price" },
      { name: "Addon Categories", description: "Organize addons by category (shipping, marketing, payments, etc.)", status: "done", notes: "category column on addon_catalog" },
      { name: "Addon Install/Uninstall", description: "Install or remove addons from a store", status: "done", notes: "store_addons table linking stores to installed addons with config JSONB" },
      { name: "Addon Configuration", description: "Per-store addon configuration and settings", status: "done", notes: "config JSONB on store_addons for addon-specific settings" },
      { name: "Active Toggle", description: "Enable/disable installed addons", status: "done", notes: "is_active boolean on store_addons" },
      { name: "Install Count Tracking", description: "Track popularity via install counts", status: "done", notes: "install_count on addon_catalog" },
      { name: "Free vs Paid Addons", description: "Support both free and paid addon pricing", status: "done", notes: "is_free and price columns on addon_catalog" },
    ],
  },

  // ═══════ 179. NOTIFICATION SYSTEM ═══════
  {
    category: "Notification System",
    icon: <Bell className="h-5 w-5" />,
    features: [
      { name: "In-App Notifications", description: "Real-time notification bell for admin users", status: "done", notes: "NotificationBell component in TopBar with unread count badge" },
      { name: "Notification Types", description: "Order, stock, payment, and system notification categories", status: "done", notes: "Multiple notification categories with icons and priority levels" },
      { name: "Mark as Read", description: "Mark individual or all notifications as read", status: "done", notes: "Mark read action on notification items" },
      { name: "Email Notifications", description: "Email alerts for critical events", status: "done", notes: "Edge functions trigger email notifications for orders, stock alerts, disputes" },
      { name: "SMS Notifications", description: "SMS alerts for order updates", status: "done", notes: "sms-gateway edge function for SMS delivery" },
    ],
  },

  // ═══════ 180. DATA VALIDATION & INTEGRITY ═══════
  {
    category: "Data Validation & Integrity",
    icon: <ShieldCheck className="h-5 w-5" />,
    features: [
      { name: "Required Field Validation", description: "Enforce required fields on all forms", status: "done", notes: "Client-side validation with react-hook-form and zod schemas" },
      { name: "Email Format Validation", description: "Validate email addresses on all forms", status: "done", notes: "Email regex validation on signup, checkout, customer forms" },
      { name: "Phone Format Validation", description: "Validate phone number formats", status: "done", notes: "Phone input validation with format hints" },
      { name: "SKU Uniqueness", description: "Prevent duplicate SKUs within a store", status: "done", notes: "Unique constraint on (sku, store_id) in products table" },
      { name: "Slug Uniqueness", description: "Prevent duplicate URL slugs", status: "done", notes: "Unique constraint on slugs per store" },
      { name: "Cascade Deletes", description: "Properly cascade deletions to related records", status: "done", notes: "ON DELETE CASCADE foreign keys on all child tables" },
      { name: "Updated-At Auto-Timestamps", description: "Auto-update updated_at on record changes", status: "done", notes: "update_updated_at_column() trigger function on all tables with updated_at" },
    ],
  },

  // ═══════ 181. STOREFRONT ACCOUNT FEATURES ═══════
  {
    category: "Storefront Account Features",
    icon: <UserCheck className="h-5 w-5" />,
    features: [
      { name: "Account Dashboard", description: "Customer account overview with recent orders", status: "done", notes: "StorefrontAccount page with tabs for orders, addresses, downloads, profile" },
      { name: "Profile Editing", description: "Update name, email, phone from account", status: "done", notes: "Profile edit form on account page" },
      { name: "Password Change", description: "Change password from account settings", status: "done", notes: "Password change form with current/new password fields" },
      { name: "Order History with Reorder", description: "View past orders and reorder with one click", status: "done", notes: "Reorder button on order history adds all items back to cart" },
      { name: "Download History", description: "Access purchased digital downloads", status: "done", notes: "Downloads tab showing purchased files with download links" },
      { name: "Subscription Management", description: "View, pause, or cancel subscriptions", status: "done", notes: "Subscription management section on account page" },
      { name: "Loyalty Points View", description: "View loyalty points balance and transaction history", status: "done", notes: "Loyalty section showing balance, tier, and recent transactions" },
    ],
  },

  // ═══════ 182. TEMPLATE ENGINE (B@SE) ═══════
  {
    category: "Template Engine (B@SE)",
    icon: <FileCode className="h-5 w-5" />,
    features: [
      { name: "Variable Interpolation", description: "Replace [@variable@] placeholders with data", status: "done", notes: "B@SE template engine processes [@field@] syntax with product/category/store context" },
      { name: "Conditional Blocks", description: "[%if condition%]...[%/if%] conditional rendering", status: "done", notes: "If/else conditional blocks in template engine" },
      { name: "Iterator Blocks", description: "[%thumblist%]...[%/thumblist%] loop rendering for product lists", status: "done", notes: "Thumblist iterator renders product grids from filtered data" },
      { name: "Include Partials", description: "[!include file!] for reusable template fragments", status: "done", notes: "Recursive include system loading sub-templates by slug" },
      { name: "AJAX Partial Rendering", description: "Load template sections dynamically via AJAX", status: "done", notes: "Partial rendering endpoint for dynamic page segment updates" },
      { name: "Context Binding", description: "Templates bound to product, category, cart, or page context", status: "done", notes: "context_type column determines data injection" },
      { name: "Custom CSS per Template", description: "Scoped CSS per template for isolated styling", status: "done", notes: "custom_css column on store_templates with dedicated CSS editor" },
    ],
  },

  // ═══════ 183. IMPORT TEMPLATES ═══════
  {
    category: "Import Templates",
    icon: <Upload className="h-5 w-5" />,
    features: [
      { name: "Template CRUD", description: "Create and save import field mapping templates", status: "done", notes: "import_templates table with name, entity_type, field_mappings JSONB" },
      { name: "Field Mapping", description: "Map CSV columns to database fields", status: "done", notes: "field_mappings JSONB storing source→target column mappings" },
      { name: "Static Values", description: "Set static default values for unmapped fields", status: "done", notes: "static_values JSONB on import_templates" },
      { name: "Transformations", description: "Apply transformations during import (uppercase, trim, etc.)", status: "done", notes: "transformations JSONB for per-field data transformations" },
      { name: "Custom Delimiter", description: "Support custom CSV delimiters (comma, tab, pipe)", status: "done", notes: "delimiter column on import_templates" },
      { name: "Entity Types", description: "Import products, customers, orders, inventory", status: "done", notes: "entity_type column: products, customers, orders, inventory" },
    ],
  },

  // ═══════ 184. EXPORT CONFIGURATION ═══════
  {
    category: "Export Configuration",
    icon: <Download className="h-5 w-5" />,
    features: [
      { name: "Entity Export", description: "Export products, orders, customers to CSV", status: "done", notes: "ExportWizard page with entity type selection" },
      { name: "Field Selection", description: "Choose which fields to include in export", status: "done", notes: "Field picker with checkboxes for selective export" },
      { name: "Date Range Filter", description: "Filter exported data by date range", status: "done", notes: "Date range selector on export wizard" },
      { name: "Status Filter", description: "Filter exports by record status", status: "done", notes: "Status dropdown filter on export wizard" },
      { name: "Scheduled Exports", description: "Configure automatic recurring exports", status: "done", notes: "scheduled-export edge function with cron support" },
      { name: "Export Formats", description: "Support CSV and XML export formats", status: "done", notes: "Format selector on export wizard" },
    ],
  },

  // ═══════ 185. MULTI-LANGUAGE SUPPORT ═══════
  {
    category: "Multi-Language Support",
    icon: <Globe className="h-5 w-5" />,
    features: [
      { name: "Language Configuration", description: "Configure supported languages for the store", status: "done", notes: "store_languages table with code, name, is_default, is_active" },
      { name: "Language Switcher", description: "Customer-facing language selector on storefront", status: "done", notes: "LanguageSwitcher component in storefront header" },
      { name: "Translation Keys", description: "Store translated strings for UI elements", status: "done", notes: "LanguageProvider context with translation key lookup" },
      { name: "Default Language", description: "Set fallback language for untranslated content", status: "done", notes: "is_default boolean on store_languages" },
      { name: "RTL Support", description: "Right-to-left layout for Arabic/Hebrew languages", status: "done", notes: "Direction-aware CSS for RTL languages" },
    ],
  },

  // ═══════ 186. SHIPPING INTEGRATIONS ═══════
  {
    category: "Shipping Integrations",
    icon: <Truck className="h-5 w-5" />,
    features: [
      { name: "StarShipIt Integration", description: "Sync orders and print labels via StarShipIt", status: "partial", notes: "starshipit-sync edge function — requires merchant API key" },
      { name: "ShipStation Integration", description: "Sync orders to ShipStation for fulfillment", status: "partial", notes: "shipstation-sync edge function — requires merchant API key" },
      { name: "Australia Post Integration", description: "Calculate Australia Post shipping rates", status: "partial", notes: "carrier-rates edge function with AusPost rate calculation" },
      { name: "Carrier Rate API", description: "Real-time shipping rate calculation from carriers", status: "done", notes: "carrier-rates edge function handling dynamic rate requests" },
      { name: "Tracking Number Import", description: "Bulk import tracking numbers against orders", status: "done", notes: "Import tracking via CSV or API with auto-notification" },
    ],
  },

  // ═══════ 187. MARKETING CAMPAIGNS ═══════
  {
    category: "Marketing Campaigns",
    icon: <Megaphone className="h-5 w-5" />,
    features: [
      { name: "Campaign Dashboard", description: "Overview of active marketing campaigns", status: "done", notes: "Admin /marketing page with KPI cards and campaign list" },
      { name: "Email Campaign Triggers", description: "Trigger-based email campaigns (welcome, win-back, etc.)", status: "done", notes: "email_automations table with 7 trigger types and configurable delays" },
      { name: "Abandoned Cart Recovery", description: "Multi-step cart recovery email sequences", status: "done", notes: "abandoned-cart-email edge function with multi-step recovery and coupon incentive" },
      { name: "Product Recommendation Emails", description: "Send personalized product recommendations", status: "done", notes: "order-follow-up edge function with cross-sell recommendations" },
      { name: "Promotional Banners", description: "Create and schedule promotional banners", status: "done", notes: "adverts table with scheduling, placement targeting, and active toggle" },
      { name: "Social Media Sharing", description: "Share products to social platforms from storefront", status: "done", notes: "SocialShare component with Facebook, Twitter, Pinterest, Email, Copy Link" },
    ],
  },

  // ═══════ 188. SEO MANAGEMENT ═══════
  {
    category: "SEO Management",
    icon: <Globe className="h-5 w-5" />,
    features: [
      { name: "Page-Level Meta Tags", description: "Custom title, description, keywords per page", status: "done", notes: "SEOHead component sets meta tags dynamically per page type" },
      { name: "Robots.txt", description: "Configurable robots.txt for search engine crawling", status: "done", notes: "public/robots.txt with standard directives" },
      { name: "XML Sitemap", description: "Auto-generated sitemap for search engines", status: "done", notes: "sitemap edge function generating XML sitemap" },
      { name: "Structured Data (JSON-LD)", description: "Schema.org markup for products, organizations", status: "done", notes: "SEOHead injects JSON-LD for product pages with price, availability, rating" },
      { name: "Open Graph Tags", description: "OG tags for social media sharing previews", status: "done", notes: "OG title, description, image meta tags on product and content pages" },
      { name: "Canonical URLs", description: "Prevent duplicate content with canonical tags", status: "done", notes: "Canonical link tag on all pages" },
      { name: "URL Redirect Manager", description: "Manage 301/302 redirects for URL changes", status: "done", notes: "Redirects page with source/target, type, hit counter" },
    ],
  },

  // ═══════ 189. PRODUCT BADGES & LABELS ═══════
  {
    category: "Product Badges & Labels",
    icon: <Tag className="h-5 w-5" />,
    features: [
      { name: "Sale Badge", description: "Automatic sale badge when promo price is set", status: "done", notes: "ProductBadges component shows Sale badge on promo-priced items" },
      { name: "New Badge", description: "Badge for recently added products", status: "done", notes: "New badge for products created within configurable days" },
      { name: "Low Stock Badge", description: "Badge when stock is below threshold", status: "done", notes: "Low Stock badge when quantity below threshold" },
      { name: "Out of Stock Badge", description: "Badge when product has zero stock", status: "done", notes: "Out of Stock overlay on product cards" },
      { name: "Pre-Order Badge", description: "Badge for pre-orderable products", status: "done", notes: "Pre-Order badge when preorder_quantity > 0 and stock = 0" },
      { name: "Custom Label Badge", description: "Merchant-defined custom label badge", status: "done", notes: "custom_label field on products displayed as badge" },
      { name: "Free Shipping Badge", description: "Badge for products with free shipping", status: "done", notes: "Free Shipping badge when free_shipping flag is true" },
    ],
  },

  // ═══════ 190. STOREFRONT PRODUCT DETAIL ═══════
  {
    category: "Storefront Product Detail",
    icon: <Eye className="h-5 w-5" />,
    features: [
      { name: "Image Gallery", description: "Product image gallery with thumbnails and zoom", status: "done", notes: "Image gallery with thumbnail strip, click to enlarge, lightbox zoom" },
      { name: "Variant Selector", description: "Select product variants (size, color, etc.)", status: "done", notes: "Variant dropdown/buttons updating price and stock display" },
      { name: "Quantity Selector", description: "Adjust quantity before adding to cart", status: "done", notes: "Quantity input with +/- buttons, min 1, max stock" },
      { name: "Add to Cart", description: "Add product to shopping cart", status: "done", notes: "Add to Cart button with AddToCartPopup confirmation" },
      { name: "Add to Wishlist", description: "Save product to wishlist", status: "done", notes: "Heart icon toggle using WishlistContext" },
      { name: "Product Tabs", description: "Description, specifications, reviews in tabbed layout", status: "done", notes: "Tabs component with description, specs, features, warranty, reviews" },
      { name: "Related Products", description: "Show related/cross-sell products below main content", status: "done", notes: "Related products grid from product_relations" },
      { name: "Social Share Buttons", description: "Share product on social media", status: "done", notes: "SocialShare component with multiple platforms" },
      { name: "Delivery Estimate", description: "Estimated delivery date based on shipping zone", status: "done", notes: "DeliveryEstimate component showing estimated delivery range" },
      { name: "Stock Availability", description: "Show in-stock/out-of-stock status", status: "done", notes: "Stock status badge with quantity display when low" },
    ],
  },

  // ═══════ 191. CART MANAGEMENT ═══════
  {
    category: "Cart Management",
    icon: <ShoppingCart className="h-5 w-5" />,
    features: [
      { name: "Add to Cart (AJAX)", description: "Add products without page reload", status: "done", notes: "CartContext with addItem action, toast confirmation" },
      { name: "Cart Quantity Update", description: "Update item quantities in cart", status: "done", notes: "Inline quantity +/- on cart page and mini-cart" },
      { name: "Remove Item", description: "Remove individual items from cart", status: "done", notes: "Remove button per item with confirmation" },
      { name: "Cart Persistence", description: "Cart survives browser refresh", status: "done", notes: "CartContext persists to localStorage" },
      { name: "Cart Totals", description: "Real-time subtotal, tax, shipping, grand total", status: "done", notes: "Dynamic total calculation in CartContext" },
      { name: "Mini Cart Preview", description: "Quick cart preview in header", status: "done", notes: "Cart icon with dropdown showing items and total" },
      { name: "Empty Cart State", description: "Display when cart has no items", status: "done", notes: "Empty cart illustration with continue shopping link" },
    ],
  },

  // ═══════ 192. PRODUCT VARIANT MANAGEMENT ═══════
  {
    category: "Product Variant Management",
    icon: <Layers className="h-5 w-5" />,
    features: [
      { name: "Variant CRUD", description: "Create and manage product variants", status: "done", notes: "product_variants table with name, sku, price, stock_quantity" },
      { name: "Variant Options", description: "Define option names and values (size, color)", status: "done", notes: "option_name and option_value columns on product_variants" },
      { name: "Variant-Level Pricing", description: "Different prices per variant", status: "done", notes: "price column overrides parent product price" },
      { name: "Variant-Level Stock", description: "Track stock per variant independently", status: "done", notes: "stock_quantity column on product_variants" },
      { name: "Variant SKU & Barcode", description: "Unique SKU and barcode per variant", status: "done", notes: "sku and barcode columns on product_variants" },
      { name: "Variant Weight", description: "Different weight per variant for shipping", status: "done", notes: "weight column on product_variants" },
      { name: "Variant Images", description: "Associate specific images with variants", status: "done", notes: "image_url column on product_variants" },
    ],
  },

  // ═══════ 193. ORDER TIMELINE & AUDIT ═══════
  {
    category: "Order Timeline & Audit",
    icon: <Clock className="h-5 w-5" />,
    features: [
      { name: "Order Event Timeline", description: "Chronological log of all order events", status: "done", notes: "order_timeline table with event_type, description, user_id" },
      { name: "Status Change Logging", description: "Log every status change with user attribution", status: "done", notes: "Auto-log entries on status, payment, and fulfillment changes" },
      { name: "Shipment Events", description: "Log shipment creation, dispatch, delivery", status: "done", notes: "shipment_created, shipment_dispatched events in timeline" },
      { name: "Payment Events", description: "Log payment received, refund issued events", status: "done", notes: "payment_received, refund_issued events in timeline" },
      { name: "Staff Attribution", description: "Track which staff performed each action", status: "done", notes: "user_id on order_timeline for attribution" },
    ],
  },

  // ═══════ 194. CUSTOMER WISHLIST ═══════
  {
    category: "Customer Wishlist",
    icon: <Heart className="h-5 w-5" />,
    features: [
      { name: "Add to Wishlist", description: "Save products to personal wishlist", status: "done", notes: "WishlistContext with add/remove, heart icon on product cards" },
      { name: "Wishlist Page", description: "View all wishlisted products", status: "done", notes: "StorefrontWishlist page with product grid and remove" },
      { name: "Move to Cart", description: "Move wishlist items directly to cart", status: "done", notes: "Add to Cart button on wishlist items" },
      { name: "Wishlist Reminder Email", description: "Email reminders about wishlisted items", status: "done", notes: "wishlist-reminder edge function" },
      { name: "Share Wishlist", description: "Share wishlist via link", status: "done", notes: "Copy link action on wishlist page" },
    ],
  },

  // ═══════ 195. PRODUCT COMPARE ═══════
  {
    category: "Product Compare",
    icon: <ArrowLeftRight className="h-5 w-5" />,
    features: [
      { name: "Add to Compare", description: "Add products to comparison (max 4)", status: "done", notes: "CompareContext with add/remove, max 4" },
      { name: "Compare Page", description: "Side-by-side comparison table", status: "done", notes: "StorefrontCompare page with attribute grid" },
      { name: "Feature Comparison", description: "Compare price, brand, specs, stock, rating", status: "done", notes: "All product attributes shown side by side" },
      { name: "Compare Floating Bar", description: "Floating bar showing compare count", status: "done", notes: "Floating compare indicator when products selected" },
    ],
  },

  // ═══════ 196. BACK IN STOCK NOTIFICATIONS ═══════
  {
    category: "Back in Stock Notifications",
    icon: <Bell className="h-5 w-5" />,
    features: [
      { name: "Request Notification", description: "Sign up for back-in-stock alerts", status: "done", notes: "back_in_stock_requests table with email, product_id" },
      { name: "Email When Restocked", description: "Auto-email when product restocked", status: "done", notes: "back-in-stock-email edge function" },
      { name: "Notified Tracking", description: "Track which requests were fulfilled", status: "done", notes: "notified_at timestamp on requests" },
    ],
  },

  // ═══════ 197. STORE ONBOARDING ═══════
  {
    category: "Store Onboarding",
    icon: <Sparkles className="h-5 w-5" />,
    features: [
      { name: "Onboarding Wizard", description: "Guided store setup for new merchants", status: "done", notes: "Admin /onboarding page with step-by-step flow" },
      { name: "Store Details Step", description: "Name, email, phone, timezone", status: "done", notes: "General settings form in onboarding" },
      { name: "First Product Step", description: "Guide to create first product", status: "done", notes: "Product creation guidance" },
      { name: "Shipping Setup Step", description: "Configure shipping zones and rates", status: "done", notes: "Shipping zone configuration" },
      { name: "Payment Setup Step", description: "Connect first payment gateway", status: "done", notes: "Payment gateway selection" },
      { name: "Theme Selection Step", description: "Choose initial store theme", status: "done", notes: "Theme preset selection with preview" },
    ],
  },

  // ═══════ 198. SESSION & SECURITY ═══════
  {
    category: "Session & Security",
    icon: <Shield className="h-5 w-5" />,
    features: [
      { name: "Active Sessions View", description: "View and manage active login sessions", status: "done", notes: "Admin /sessions page" },
      { name: "Two-Factor Authentication", description: "TOTP-based 2FA for admin accounts", status: "done", notes: "TwoFactorSetup component with QR code" },
      { name: "Password Reset Flow", description: "Secure reset via email link", status: "done", notes: "ForgotPassword and ResetPassword pages" },
      { name: "Row-Level Security", description: "Database-level access control per store", status: "done", notes: "RLS policies on all tables" },
      { name: "API Key Hashing", description: "SHA-256 hashed API keys", status: "done", notes: "key_hash column, only prefix stored in plaintext" },
      { name: "HMAC Webhook Signatures", description: "Sign payloads with HMAC-SHA256", status: "done", notes: "webhook-dispatcher uses per-webhook signing_secret" },
      { name: "CORS Configuration", description: "Proper CORS headers on all edge functions", status: "done", notes: "corsHeaders on all functions" },
    ],
  },

  // ═══════ 199. REPORTING & ANALYTICS (EXTENDED) ═══════
  {
    category: "Reporting & Analytics (Extended)",
    icon: <BarChart3 className="h-5 w-5" />,
    features: [
      { name: "Sales Report", description: "Revenue and orders with date filtering", status: "done", notes: "Analytics page with charts and date range" },
      { name: "Product Performance", description: "Top products by revenue and units", status: "done", notes: "Top products table on analytics" },
      { name: "Customer Report", description: "Acquisition and retention metrics", status: "done", notes: "Customer KPIs with growth trend" },
      { name: "Inventory Report", description: "Stock levels, valuation, turnover", status: "done", notes: "Inventory valuation report" },
      { name: "Custom Report Builder", description: "Build custom reports with metrics", status: "done", notes: "Admin /report-builder page" },
      { name: "Scheduled Reports", description: "Auto-email reports on schedule", status: "done", notes: "scheduled-report-email edge function" },
      { name: "Export to CSV", description: "Download report data as CSV", status: "done", notes: "CSV export on analytics pages" },
    ],
  },

  // ═══════ 200. SMART COLLECTIONS (EXTENDED) ═══════
  {
    category: "Smart Collections (Extended)",
    icon: <Sparkles className="h-5 w-5" />,
    features: [
      { name: "Rule-Based Collections", description: "Auto-populate based on product rules", status: "done", notes: "smart_collections with rules JSONB, match_type" },
      { name: "12 Rule Fields", description: "Brand, price, tags, type, status, category, stock, etc.", status: "done", notes: "Comprehensive rule field and operator set" },
      { name: "Live Preview", description: "Preview matched products before saving", status: "done", notes: "Live product preview in admin" },
      { name: "SEO Fields", description: "Meta title and description per collection", status: "done", notes: "seo_title, seo_description columns" },
    ],
  },

  // ═══════ 201. ACTIVITY LOG (EXTENDED) ═══════
  {
    category: "Activity Log (Extended)",
    icon: <Eye className="h-5 w-5" />,
    features: [
      { name: "Action Logging", description: "Log all admin actions for audit", status: "done", notes: "activity_log table with action, entity_type, entity_id" },
      { name: "Entity Tracking", description: "Track affected entity per action", status: "done", notes: "entity_type and entity_id columns" },
      { name: "User Attribution", description: "Track which user performed action", status: "done", notes: "user_id column on activity_log" },
      { name: "Activity Details", description: "Store additional action details", status: "done", notes: "details JSONB column" },
      { name: "Staff Activity Report", description: "Per-user action breakdown", status: "done", notes: "Admin /staff-activity page" },
    ],
  },

  // ═══════ 202. INTEGRATION HUB ═══════
  {
    category: "Integration Hub",
    icon: <Puzzle className="h-5 w-5" />,
    features: [
      { name: "Centralized Integrations Page", description: "Manage all connections from one place", status: "done", notes: "Admin /integrations page with 16+ cards" },
      { name: "Integration Categories", description: "Organize by shipping, marketing, accounting", status: "done", notes: "Category tabs for filtering" },
      { name: "Connection Status", description: "Show connected/disconnected per integration", status: "done", notes: "Status badges showing state" },
      { name: "Zapier Integration", description: "Connect to 5000+ apps via Zapier", status: "done", notes: "Zapier webhook URL in store_addons" },
      { name: "Make Integration", description: "Connect to Make automation workflows", status: "done", notes: "Make webhook URL in store_addons" },
      { name: "Webhook Dispatcher", description: "Centralized webhook delivery", status: "done", notes: "webhook-dispatcher edge function" },
    ],
  },

  // ═══════ 203. STORE THEME PRESETS ═══════
  {
    category: "Store Theme Presets",
    icon: <Palette className="h-5 w-5" />,
    features: [
      { name: "Built-In Presets", description: "5 pre-built theme presets", status: "done", notes: "theme_presets table with system presets" },
      { name: "One-Click Apply", description: "Apply preset with single click", status: "done", notes: "Apply maps theme_config to store_themes" },
      { name: "Custom Preset Creation", description: "Save current theme as preset", status: "done", notes: "Save as Preset action" },
      { name: "Preset Preview", description: "Preview before applying", status: "done", notes: "Preview card with colors and layout" },
    ],
  },

  // ═══════ 204. CATEGORIES (EXTENDED) ═══════
  {
    category: "Product Categories (Extended)",
    icon: <Layers className="h-5 w-5" />,
    features: [
      { name: "Unlimited Nesting", description: "Nested categories with parent/child", status: "done", notes: "parent_id self-reference for unlimited depth" },
      { name: "Category Image", description: "Image per category for navigation", status: "done", notes: "image_url column on categories" },
      { name: "Category SEO", description: "SEO title and description per category", status: "done", notes: "seo_title and seo_description" },
      { name: "Auto-Populate Rules", description: "Auto-assign products via rules", status: "done", notes: "auto_rules JSONB column" },
      { name: "Category Slug", description: "URL-friendly slug per category", status: "done", notes: "slug with unique constraint" },
    ],
  },

  // ═══════ 205. LANDING PAGE ═══════
  {
    category: "Landing Page",
    icon: <Globe className="h-5 w-5" />,
    features: [
      { name: "Platform Landing Page", description: "Marketing page for the platform", status: "done", notes: "LandingPage with hero, features, pricing, CTA" },
      { name: "Feature Highlights", description: "Showcase platform capabilities", status: "done", notes: "Feature cards grid" },
      { name: "Pricing Section", description: "Display pricing plans", status: "done", notes: "Pricing cards with comparison" },
      { name: "CTA / Signup Flow", description: "Direct to merchant signup", status: "done", notes: "CTA buttons linking to signup" },
      { name: "Responsive Design", description: "Mobile-optimized layout", status: "done", notes: "Fully responsive mobile-first" },
    ],
  },

  // ═══════ 206. RBAC & PERMISSIONS ═══════
  {
    category: "RBAC & Permissions",
    icon: <Shield className="h-5 w-5" />,
    features: [
      { name: "User Roles", description: "Owner, admin, manager, staff roles per store", status: "done", notes: "user_roles table with role column" },
      { name: "Role Permissions", description: "Granular permissions per role", status: "done", notes: "Admin /role-permissions page" },
      { name: "Multi-Store Roles", description: "Different roles across stores", status: "done", notes: "Per store_id role assignment" },
      { name: "Platform Admin", description: "Super-admin for multi-tenant management", status: "done", notes: "platform_roles table with RequirePlatformAdmin guard" },
      { name: "Auto-First-Admin", description: "First user becomes platform admin", status: "done", notes: "auto_promote_first_admin() trigger" },
    ],
  },

  // ═══════ 207. PLATFORM ADMIN ═══════
  {
    category: "Platform Admin (Multi-Tenant)",
    icon: <Building className="h-5 w-5" />,
    features: [
      { name: "Platform Dashboard", description: "Overview of all merchants and KPIs", status: "done", notes: "PlatformDashboard with aggregate metrics" },
      { name: "Merchant Management", description: "View and manage merchant stores", status: "done", notes: "PlatformMerchants page" },
      { name: "Platform Analytics", description: "Cross-merchant analytics", status: "done", notes: "PlatformAnalytics page" },
      { name: "Platform Customers", description: "View customers across stores", status: "done", notes: "PlatformCustomers page" },
      { name: "Platform Settings", description: "Global platform configuration", status: "done", notes: "PlatformSettings page" },
    ],
  },

  // ═══════ 208. DROPSHIP MANAGEMENT ═══════
  {
    category: "Dropship Management",
    icon: <Truck className="h-5 w-5" />,
    features: [
      { name: "Dropship Supplier Setup", description: "Configure suppliers as dropship vendors", status: "done", notes: "Suppliers with type 'dropship'" },
      { name: "Dropship Order Notification", description: "Auto-notify supplier on dropship order", status: "done", notes: "dropship-notification edge function" },
      { name: "Supplier PO Auto-Generation", description: "Auto-create PO for dropship items", status: "done", notes: "PO with dropship flag linking to customer order" },
      { name: "Tracking Integration", description: "Supplier tracking flows to customer", status: "done", notes: "Tracking updates from supplier PO to customer order" },
      { name: "Branded Packing Slips", description: "Packing slips with merchant branding", status: "done", notes: "PrintPackingSlip uses store name/logo" },
    ],
  },

  // ═══════ 209. API & DEVELOPER TOOLS ═══════
  {
    category: "API & Developer Tools",
    icon: <Code className="h-5 w-5" />,
    features: [
      { name: "REST API", description: "Full REST API for products, orders, customers, inventory", status: "done", notes: "rest-api edge function with CRUD endpoints" },
      { name: "API Key Management", description: "Create keys with scopes and rate limits", status: "done", notes: "api_keys table with key_hash, scopes, rate_limit" },
      { name: "API Rate Limiting", description: "Rate limit requests per key", status: "done", notes: "api_rate_limits table with 15-min windows" },
      { name: "Batch API", description: "Multiple requests in single call", status: "done", notes: "batch-api edge function" },
      { name: "API Documentation", description: "Interactive docs with try-it sandbox", status: "done", notes: "Admin /api-docs page" },
      { name: "Webhook Testing", description: "Test endpoints from admin panel", status: "done", notes: "Test button on Webhooks page" },
    ],
  },

  // ═══════ 210. DATA VALIDATION ═══════
  {
    category: "Data Validation & Integrity",
    icon: <ShieldCheck className="h-5 w-5" />,
    features: [
      { name: "Required Field Validation", description: "Enforce required fields on all forms", status: "done", notes: "react-hook-form with zod schemas" },
      { name: "Email Validation", description: "Validate email format across forms", status: "done", notes: "Email regex on signup, checkout, customer forms" },
      { name: "SKU Uniqueness", description: "Prevent duplicate SKUs per store", status: "done", notes: "Unique constraint on (sku, store_id)" },
      { name: "Slug Uniqueness", description: "Prevent duplicate URL slugs", status: "done", notes: "Unique constraint on slugs per store" },
      { name: "Cascade Deletes", description: "Properly cascade deletions", status: "done", notes: "ON DELETE CASCADE on all child tables" },
      { name: "Auto-Timestamps", description: "Auto-update updated_at on changes", status: "done", notes: "update_updated_at_column() trigger" },
    ],
  },

  // ═══════ 211. PROMO POPUPS ═══════
  {
    category: "Promo Popups",
    icon: <Sparkles className="h-5 w-5" />,
    features: [
      { name: "Timed Popup", description: "Show popup after delay on storefront", status: "done", notes: "PromoPopup with PROMO_DELAY_MS (3s default)" },
      { name: "Dismissal Persistence", description: "Remember dismissed state in localStorage", status: "done", notes: "PROMO_DISMISSED_KEY in localStorage" },
      { name: "Customizable CTA", description: "Link to signup with discount offer", status: "done", notes: "10% off first order CTA with signup link" },
      { name: "Backdrop Overlay", description: "Semi-transparent overlay behind popup", status: "done", notes: "bg-black/40 backdrop with fade-in animation" },
    ],
  },

  // ═══════ 212. SAVED CARTS ═══════
  {
    category: "Saved Carts",
    icon: <ShoppingCart className="h-5 w-5" />,
    features: [
      { name: "Save Cart", description: "Save current cart for later", status: "done", notes: "saved_carts table with cart_items JSONB" },
      { name: "Load Saved Cart", description: "Restore a previously saved cart", status: "done", notes: "Load action replaces current cart with saved items" },
      { name: "Named Carts", description: "Give carts a name for reference", status: "done", notes: "name column on saved_carts" },
      { name: "Saved Carts List", description: "Admin view of all saved carts", status: "done", notes: "Admin /saved-carts page" },
    ],
  },

  // ═══════ 213. STOCKTAKE ═══════
  {
    category: "Stocktake",
    icon: <ClipboardCheck className="h-5 w-5" />,
    features: [
      { name: "Create Stocktake", description: "Initiate a physical stock count", status: "done", notes: "stocktakes table with status, location_id" },
      { name: "Count Items", description: "Record counted quantities per product", status: "done", notes: "stocktake_items with expected_qty and counted_qty" },
      { name: "Variance Report", description: "Show difference between expected and counted", status: "done", notes: "Variance calculated as counted - expected" },
      { name: "Apply Adjustments", description: "Apply counted quantities to inventory", status: "done", notes: "Finalize stocktake updates inventory_stock" },
      { name: "Stocktake History", description: "View past stocktakes with results", status: "done", notes: "Completed stocktakes with variance summary" },
    ],
  },

  // ═══════ 214. STOCK ADJUSTMENTS ═══════
  {
    category: "Stock Adjustments",
    icon: <RefreshCw className="h-5 w-5" />,
    features: [
      { name: "Manual Adjustment", description: "Add or remove stock manually", status: "done", notes: "stock_adjustments table with quantity_change, reason" },
      { name: "Adjustment Reasons", description: "Predefined reasons (damaged, lost, received)", status: "done", notes: "Reason dropdown with common adjustment reasons" },
      { name: "Reference Tracking", description: "Link adjustment to reference document", status: "done", notes: "reference_number column for traceability" },
      { name: "Adjustment History", description: "View all past adjustments with filters", status: "done", notes: "Admin /stock-adjustments page with date and product filters" },
    ],
  },

  // ═══════ 215. INVENTORY TRANSFERS ═══════
  {
    category: "Inventory Transfers",
    icon: <ArrowLeftRight className="h-5 w-5" />,
    features: [
      { name: "Create Transfer", description: "Transfer stock between locations", status: "done", notes: "inventory_transfers table with source/destination location" },
      { name: "Transfer Items", description: "Specify products and quantities", status: "done", notes: "inventory_transfer_items with quantity_requested/shipped/received" },
      { name: "Transfer Workflow", description: "Requested → Shipped → Received status flow", status: "done", notes: "Status workflow with shipped_at and received_at timestamps" },
      { name: "Transfer Number", description: "Auto-generated transfer reference number", status: "done", notes: "transfer_number column with unique constraint" },
      { name: "Approval Flow", description: "Approve transfers before shipping", status: "done", notes: "approved_by column with user attribution" },
    ],
  },

  // ═══════ 216. CREDIT NOTES ═══════
  {
    category: "Credit Notes",
    icon: <Receipt className="h-5 w-5" />,
    features: [
      { name: "Issue Credit Note", description: "Create credit note against an order", status: "done", notes: "credit_notes table with amount, reason, order_id" },
      { name: "Credit Number", description: "Unique credit note number", status: "done", notes: "credit_number column with unique constraint" },
      { name: "Credit Status", description: "Track issued/applied/void status", status: "done", notes: "status column with workflow" },
      { name: "Apply to Order", description: "Apply credit to future orders", status: "done", notes: "Store credit application at checkout" },
    ],
  },

  // ═══════ 217. CUSTOMER COMMUNICATIONS ═══════
  {
    category: "Customer Communications",
    icon: <MessageSquare className="h-5 w-5" />,
    features: [
      { name: "Communication Log", description: "Log all customer communications", status: "done", notes: "customer_communications table with channel, direction, status" },
      { name: "Email Channel", description: "Track email communications", status: "done", notes: "channel='email' with subject and body" },
      { name: "SMS Channel", description: "Track SMS communications", status: "done", notes: "channel='sms' with body content" },
      { name: "Related Entity Linking", description: "Link communications to orders/returns", status: "done", notes: "related_entity_type and related_entity_id columns" },
      { name: "Direction Tracking", description: "Track inbound vs outbound messages", status: "done", notes: "direction column (inbound/outbound)" },
    ],
  },

  // ═══════ 218. CUSTOMER FILES ═══════
  {
    category: "Customer Files",
    icon: <Upload className="h-5 w-5" />,
    features: [
      { name: "Upload Files", description: "Upload files to customer record", status: "done", notes: "customer_files table with file_url, file_type, file_size" },
      { name: "File Description", description: "Add description to uploaded files", status: "done", notes: "description column on customer_files" },
      { name: "File Type Tracking", description: "Track file MIME type", status: "done", notes: "file_type column for content type" },
      { name: "Upload Attribution", description: "Track who uploaded each file", status: "done", notes: "uploaded_by column with user_id" },
    ],
  },

  // ═══════ 219. CUSTOMER GROUPS ═══════
  {
    category: "Customer Groups",
    icon: <Users className="h-5 w-5" />,
    features: [
      { name: "Group CRUD", description: "Create and manage customer groups", status: "done", notes: "customer_groups table with name, description" },
      { name: "Group Discount", description: "Percentage discount per group", status: "done", notes: "discount_percent column on customer_groups" },
      { name: "Tax Exemption", description: "Tax-exempt flag per group", status: "done", notes: "is_tax_exempt column on customer_groups" },
      { name: "Minimum Order", description: "Minimum order amount per group", status: "done", notes: "min_order_amount column" },
      { name: "Assign Customers", description: "Assign customers to groups", status: "done", notes: "customer_group_id on customers table" },
    ],
  },

  // ═══════ 220. EMAIL QUEUE ═══════
  {
    category: "Email Queue",
    icon: <Mail className="h-5 w-5" />,
    features: [
      { name: "Queue Emails", description: "Queue emails for batch sending", status: "done", notes: "email_queue table with to_email, subject, html_body" },
      { name: "Queue Status", description: "Track pending/sent/failed status", status: "done", notes: "status column with pending/sent/failed" },
      { name: "Error Tracking", description: "Store error messages on failure", status: "done", notes: "error column for failed email details" },
      { name: "Template Reference", description: "Link to email template used", status: "done", notes: "template_key column for template tracking" },
      { name: "Sent Timestamp", description: "Record when email was sent", status: "done", notes: "sent_at timestamp on email_queue" },
    ],
  },

  // ═══════ 221. IMPORT TEMPLATES ═══════
  {
    category: "Import Templates",
    icon: <Download className="h-5 w-5" />,
    features: [
      { name: "Create Template", description: "Save import field mappings as template", status: "done", notes: "import_templates table with field_mappings JSONB" },
      { name: "Field Mapping", description: "Map CSV columns to database fields", status: "done", notes: "field_mappings JSONB with source → target mapping" },
      { name: "Static Values", description: "Set static values for unmapped fields", status: "done", notes: "static_values JSONB for default values" },
      { name: "Transformations", description: "Apply transformations during import", status: "done", notes: "transformations JSONB for data transforms" },
      { name: "Custom Delimiter", description: "Support different CSV delimiters", status: "done", notes: "delimiter column (comma, tab, semicolon)" },
    ],
  },

  // ═══════ 222. IMPORT LOGS ═══════
  {
    category: "Import Logs",
    icon: <FileText className="h-5 w-5" />,
    features: [
      { name: "Import History", description: "View all past imports with status", status: "done", notes: "import_logs table with status, entity_type, file_name" },
      { name: "Row Counts", description: "Track total, success, and error counts", status: "done", notes: "total_rows, success_count, error_count columns" },
      { name: "Error Details", description: "Store detailed error info per row", status: "done", notes: "errors JSONB with per-row error details" },
      { name: "Template Link", description: "Link import to template used", status: "done", notes: "template_id foreign key to import_templates" },
      { name: "Notification Email", description: "Email notification on import complete", status: "done", notes: "import-notification-email edge function" },
    ],
  },

  // ═══════ 223. CONTENT REVIEWS ═══════
  {
    category: "Content Reviews",
    icon: <Star className="h-5 w-5" />,
    features: [
      { name: "Review Submission", description: "Submit reviews on content pages (blog)", status: "done", notes: "content_reviews table with rating, title, body" },
      { name: "Review Moderation", description: "Approve/reject reviews before publishing", status: "done", notes: "is_approved column for moderation" },
      { name: "Star Ratings", description: "1-5 star rating system", status: "done", notes: "rating column (1-5)" },
      { name: "Author Attribution", description: "Track review author name and user", status: "done", notes: "author_name and user_id columns" },
    ],
  },

  // ═══════ 224. CONTACT SUBMISSIONS ═══════
  {
    category: "Contact Submissions",
    icon: <Headphones className="h-5 w-5" />,
    features: [
      { name: "Contact Form", description: "Storefront contact form submissions", status: "done", notes: "contact_submissions table with name, email, message" },
      { name: "Read Status", description: "Mark submissions as read/unread", status: "done", notes: "is_read column for tracking" },
      { name: "Subject Field", description: "Optional subject line", status: "done", notes: "subject column on contact_submissions" },
      { name: "Email Notification", description: "Email merchant on new submission", status: "done", notes: "contact-email edge function" },
    ],
  },

  // ═══════ 225. DISPUTES ═══════
  {
    category: "Disputes",
    icon: <AlertTriangle className="h-5 w-5" />,
    features: [
      { name: "Dispute Filing", description: "File dispute against an order", status: "done", notes: "disputes table with reason, status, order_id" },
      { name: "Dispute Status", description: "Track open/under_review/resolved/closed", status: "done", notes: "status workflow column" },
      { name: "Resolution Tracking", description: "Record dispute resolution and outcome", status: "done", notes: "resolution and resolved_at columns" },
      { name: "Evidence Uploads", description: "Attach evidence to disputes", status: "done", notes: "evidence_urls array column" },
      { name: "Dispute Notifications", description: "Email notifications on dispute events", status: "done", notes: "dispute-email edge function" },
    ],
  },

  // ═══════ 226. NEWSLETTER SUBSCRIBERS ═══════
  {
    category: "Newsletter Subscribers",
    icon: <Mail className="h-5 w-5" />,
    features: [
      { name: "Subscribe Form", description: "Email signup form on storefront", status: "done", notes: "NewsletterSignup component in footer" },
      { name: "Subscriber Storage", description: "Store subscriber emails", status: "done", notes: "newsletter_subscribers table with email, subscribed_at" },
      { name: "Unsubscribe", description: "Allow subscribers to unsubscribe", status: "done", notes: "unsubscribed_at timestamp for opt-out" },
      { name: "Source Tracking", description: "Track where signup came from", status: "done", notes: "source column (footer, popup, checkout)" },
    ],
  },

  // ═══════ 227. SOCIAL SHARE ═══════
  {
    category: "Social Share",
    icon: <Share2 className="h-5 w-5" />,
    features: [
      { name: "Share Buttons", description: "Social share buttons on products", status: "done", notes: "SocialShare component with Facebook, Twitter, Pinterest, WhatsApp" },
      { name: "Copy Link", description: "Copy product URL to clipboard", status: "done", notes: "Copy link button with toast confirmation" },
      { name: "Email Share", description: "Share via email", status: "done", notes: "mailto: link with pre-filled subject and body" },
      { name: "Open Graph Tags", description: "OG meta tags for rich previews", status: "done", notes: "SEOHead component with og:title, og:image, og:description" },
    ],
  },

  // ═══════ 228. COOKIE CONSENT ═══════
  {
    category: "Cookie Consent",
    icon: <Shield className="h-5 w-5" />,
    features: [
      { name: "Cookie Banner", description: "GDPR-compliant cookie consent banner", status: "done", notes: "CookieConsentBanner component on storefront" },
      { name: "Accept/Decline", description: "Accept or decline cookies", status: "done", notes: "Accept and decline buttons with localStorage persistence" },
      { name: "Persistence", description: "Remember consent decision", status: "done", notes: "localStorage key for consent state" },
      { name: "Privacy Link", description: "Link to privacy policy", status: "done", notes: "Link to privacy/cookie policy page" },
    ],
  },

  // ═══════ 229. STORE FINDER ═══════
  {
    category: "Store Finder",
    icon: <MapPin className="h-5 w-5" />,
    features: [
      { name: "Store Locator Page", description: "Find physical store locations", status: "done", notes: "StorefrontStoreFinder page" },
      { name: "Location List", description: "Display all store locations", status: "done", notes: "List view with address, phone, hours" },
      { name: "Search by Area", description: "Filter locations by city/region", status: "done", notes: "Search input filtering locations" },
    ],
  },

  // ═══════ 230. QUICK ORDER ═══════
  {
    category: "Quick Order",
    icon: <Zap className="h-5 w-5" />,
    features: [
      { name: "Quick Order Page", description: "Rapid order entry by SKU", status: "done", notes: "StorefrontQuickOrder page for B2B rapid ordering" },
      { name: "SKU Lookup", description: "Find products by SKU", status: "done", notes: "SKU search with auto-complete" },
      { name: "Bulk Add to Cart", description: "Add multiple items at once", status: "done", notes: "Multi-line order form with quantity inputs" },
      { name: "CSV Upload", description: "Upload CSV for bulk ordering", status: "done", notes: "CSV file upload with SKU and quantity mapping" },
    ],
  },
];

// ═══════ 231–250: ADVANCED COMMERCE FEATURES ═══════
const advancedFeatures: FeatureCategory[] = [
  {
    category: "Product Scheduling",
    icon: <Clock className="h-5 w-5" />,
    features: [
      { name: "Publish Date", description: "Schedule product to go live at future date", status: "done", notes: "publish_at column on products" },
      { name: "Unpublish Date", description: "Auto-hide product after date", status: "done", notes: "unpublish_at for timed visibility" },
      { name: "Status Toggle", description: "Manual active/inactive toggle", status: "done", notes: "status column (active/draft/archived)" },
      { name: "Scheduled Visibility", description: "Products visible within date window only", status: "done", notes: "Storefront filters by publish_at/unpublish_at" },
    ],
  },
  {
    category: "Subscriptions & Recurring Orders",
    icon: <Repeat className="h-5 w-5" />,
    features: [
      { name: "Subscription Plans", description: "Recurring delivery plans", status: "done", notes: "subscriptions table with frequency, next_delivery_date" },
      { name: "Frequency Options", description: "Weekly, biweekly, monthly, quarterly", status: "done", notes: "frequency column" },
      { name: "Subscription Status", description: "Active/paused/cancelled workflow", status: "done", notes: "status with pause/resume/cancel" },
      { name: "Auto-Renewal", description: "Auto order creation on schedule", status: "done", notes: "next_delivery_date triggers order" },
      { name: "Subscription Discount", description: "Discount for subscribers", status: "done", notes: "discount_percent column" },
      { name: "Skip Delivery", description: "Skip next without cancelling", status: "done", notes: "Skip advances next_delivery_date" },
    ],
  },
  {
    category: "Multimarket Management",
    icon: <Globe className="h-5 w-5" />,
    features: [
      { name: "Market Regions", description: "Configure regional markets", status: "done", notes: "markets table with name, currency, language, domain" },
      { name: "Regional Pricing", description: "Different prices per market", status: "done", notes: "market_prices with product_id, market_id, price" },
      { name: "Market-Specific Content", description: "Localized content per market", status: "done", notes: "Content pages with market_id filtering" },
      { name: "Currency Per Market", description: "Default currency per region", status: "done", notes: "currency column on markets" },
      { name: "Domain Per Market", description: "Separate domain per market", status: "done", notes: "domain column for routing" },
      { name: "Admin Market Switcher", description: "Switch markets in admin", status: "done", notes: "Admin /multimarket page" },
    ],
  },
  {
    category: "Price Lists & Contract Pricing",
    icon: <DollarSign className="h-5 w-5" />,
    features: [
      { name: "Price List CRUD", description: "Create named price lists", status: "done", notes: "price_lists table" },
      { name: "Customer Group Assignment", description: "Assign lists to groups", status: "done", notes: "customer_group_id on price_lists" },
      { name: "Price List Items", description: "Per-product pricing", status: "done", notes: "price_list_items with product_id, price, min_quantity" },
      { name: "Quantity Breaks", description: "Tiered pricing by quantity", status: "done", notes: "min_quantity for volume pricing" },
      { name: "Date Range", description: "Valid from/to dates", status: "done", notes: "valid_from and valid_to columns" },
    ],
  },
  {
    category: "Shipping Manifests",
    icon: <Truck className="h-5 w-5" />,
    features: [
      { name: "Create Manifest", description: "Group shipments into carrier manifests", status: "done", notes: "shipping_manifests table" },
      { name: "Add Shipments", description: "Add order shipments to manifest", status: "done", notes: "shipping_manifest_items" },
      { name: "Close & Submit", description: "Close and submit to carrier", status: "done", notes: "Status: open → closed → submitted" },
      { name: "Manifest Tracking", description: "Track submission status", status: "done", notes: "submitted_at and carrier_reference" },
    ],
  },
  {
    category: "Tax Certificates",
    icon: <FileText className="h-5 w-5" />,
    features: [
      { name: "Certificate Upload", description: "Upload tax exemption certificates", status: "done", notes: "tax_certificates table" },
      { name: "Expiry Tracking", description: "Track expiry dates", status: "done", notes: "expires_at column" },
      { name: "Auto-Exemption", description: "Auto-apply exemption for valid certs", status: "done", notes: "Valid cert triggers exemption at checkout" },
      { name: "Verification Status", description: "Pending/verified/expired/rejected", status: "done", notes: "status column" },
    ],
  },
  {
    category: "B@SE Template Engine (Extended)",
    icon: <Code className="h-5 w-5" />,
    features: [
      { name: "Recursive Includes", description: "[!include!] for nested composition", status: "done", notes: "processIncludes() with depth limit" },
      { name: "Thumblist Iterator", description: "[%thumblist%] for image gallery loops", status: "done", notes: "processThumblist()" },
      { name: "Conditional Blocks", description: "[%if%][%else%][%endif%]", status: "done", notes: "processConditionals() with nesting" },
      { name: "Loop Blocks", description: "[%loop%][%endloop%] for repeating data", status: "done", notes: "processLoops()" },
      { name: "Variable Substitution", description: "[@variable@] replacement", status: "done", notes: "processVariables() with nested access" },
      { name: "AJAX Partial Rendering", description: "Dynamic page segment updates", status: "done", notes: "Partial rendering for AJAX" },
      { name: "Advert Blocks", description: "Scheduled promo blocks", status: "done", notes: "Advert blocks with date-range filtering" },
    ],
  },
  {
    category: "Product Relations",
    icon: <Link className="h-5 w-5" />,
    features: [
      { name: "Related Products", description: "Link related products", status: "done", notes: "product_relations table" },
      { name: "Cross-Sells", description: "Complementary products", status: "done", notes: "relation_type='cross_sell'" },
      { name: "Up-Sells", description: "Premium alternatives", status: "done", notes: "relation_type='up_sell'" },
      { name: "Accessories", description: "Link accessories", status: "done", notes: "relation_type='accessory'" },
      { name: "Bidirectional", description: "Relations work both ways", status: "done", notes: "is_bidirectional flag" },
    ],
  },
  {
    category: "Product Specifics (Custom Fields)",
    icon: <Database className="h-5 w-5" />,
    features: [
      { name: "Custom Field Definition", description: "Define fields per product type", status: "done", notes: "product_specifics table" },
      { name: "Field Types", description: "Text, number, dropdown, boolean", status: "done", notes: "field_type column" },
      { name: "Storefront Display", description: "Show specifics on detail page", status: "done", notes: "Specifics section on product detail" },
      { name: "Filterable Specifics", description: "Use as filter criteria", status: "done", notes: "Faceted filtering by values" },
    ],
  },
  {
    category: "Pricing Tiers (Volume Pricing)",
    icon: <Percent className="h-5 w-5" />,
    features: [
      { name: "Tier Setup", description: "Quantity-based pricing tiers", status: "done", notes: "product_pricing_tiers" },
      { name: "Per-Product Tiers", description: "Different tiers per product", status: "done", notes: "product_id FK" },
      { name: "Customer Group Tiers", description: "Group-specific tiers", status: "done", notes: "customer_group_id" },
      { name: "Storefront Display", description: "Show tier pricing on page", status: "done", notes: "Quantity price table" },
      { name: "Auto-Apply", description: "Apply best tier at checkout", status: "done", notes: "Cart calculates by quantity" },
    ],
  },
  {
    category: "Product Downloads (Digital)",
    icon: <Download className="h-5 w-5" />,
    features: [
      { name: "File Attachment", description: "Attach downloadable files", status: "done", notes: "product_downloads table" },
      { name: "Download Limits", description: "Limit downloads per purchase", status: "done", notes: "max_downloads column" },
      { name: "Expiry", description: "Downloads expire after period", status: "done", notes: "expires_at column" },
      { name: "Secure Token Links", description: "Unique download tokens", status: "done", notes: "download_token for secure access" },
      { name: "Download Tracking", description: "Track count per customer", status: "done", notes: "download_count incremented" },
    ],
  },
  {
    category: "Gift Vouchers (Extended)",
    icon: <Gift className="h-5 w-5" />,
    features: [
      { name: "Voucher Creation", description: "Create with value and code", status: "done", notes: "gift_vouchers table" },
      { name: "Recipient Details", description: "Name and email", status: "done", notes: "recipient_name, recipient_email" },
      { name: "Custom Message", description: "Personal message", status: "done", notes: "message column" },
      { name: "Balance Tracking", description: "Track remaining balance", status: "done", notes: "balance decremented" },
      { name: "Voucher Email", description: "Email to recipient", status: "done", notes: "gift-voucher-email edge function" },
      { name: "Print Voucher", description: "Printable PDF", status: "done", notes: "PrintGiftVoucher page" },
      { name: "Expiry Date", description: "Set expiration", status: "done", notes: "expires_at with auto-deactivation" },
    ],
  },
  {
    category: "Loyalty Program (Extended)",
    icon: <Star className="h-5 w-5" />,
    features: [
      { name: "Points Balance", description: "Customer points balance", status: "done", notes: "loyalty_points table" },
      { name: "Earn on Purchase", description: "Award points on orders", status: "done", notes: "Points based on order total" },
      { name: "Redeem at Checkout", description: "Redeem as payment", status: "done", notes: "Points redemption discount" },
      { name: "Tier System", description: "Bronze/Silver/Gold/Platinum", status: "done", notes: "tier with auto-promotion" },
      { name: "Transaction History", description: "All points transactions", status: "done", notes: "loyalty_transactions table" },
      { name: "Points Expiry", description: "Expire unused points", status: "done", notes: "expires_at on transactions" },
    ],
  },
  {
    category: "Affiliate Program",
    icon: <UserPlus className="h-5 w-5" />,
    features: [
      { name: "Affiliate Registration", description: "Sign up with referral code", status: "done", notes: "affiliates table" },
      { name: "Commission Tracking", description: "Per-sale commissions", status: "done", notes: "affiliate_commissions" },
      { name: "Payout Management", description: "Pending/approved/paid", status: "done", notes: "status on commissions" },
      { name: "Referral Link", description: "Unique referral URL", status: "done", notes: "referral_code" },
      { name: "Performance Dashboard", description: "Clicks, conversions, earnings", status: "done", notes: "Admin /affiliates page" },
    ],
  },
  {
    category: "Order Holds & Fraud Review",
    icon: <AlertTriangle className="h-5 w-5" />,
    features: [
      { name: "Hold Order", description: "Place on hold for review", status: "done", notes: "order_holds table" },
      { name: "Fraud Flags", description: "Flag for potential fraud", status: "done", notes: "hold_type='fraud'" },
      { name: "Review Workflow", description: "Review and release/cancel", status: "done", notes: "released_at, released_by" },
      { name: "Auto-Hold Rules", description: "Auto hold matching orders", status: "done", notes: "Rules on value, location, payment" },
    ],
  },
  {
    category: "Print Documents",
    icon: <Printer className="h-5 w-5" />,
    features: [
      { name: "Print Invoice", description: "Printable invoice", status: "done", notes: "PrintInvoice page" },
      { name: "Print Packing Slip", description: "Packing slip", status: "done", notes: "PrintPackingSlip page" },
      { name: "Print Shipping Label", description: "Shipping label", status: "done", notes: "PrintShippingLabel page" },
      { name: "Print Pick List", description: "Pick list", status: "done", notes: "PrintPickList page" },
      { name: "Print Quote", description: "Printable quote", status: "done", notes: "PrintQuote page" },
      { name: "Print Purchase Order", description: "Printable PO", status: "done", notes: "PrintPurchaseOrder page" },
      { name: "Print Return Label", description: "Return label", status: "done", notes: "PrintReturnLabel page" },
      { name: "Print Payment Receipt", description: "Payment receipt", status: "done", notes: "PrintPaymentReceipt page" },
      { name: "Print Customer Statement", description: "Account statement", status: "done", notes: "PrintCustomerStatement page" },
      { name: "Print Barcode Labels", description: "Barcode labels", status: "done", notes: "PrintBarcodeLabels page" },
      { name: "Print Gift Voucher", description: "Printable voucher", status: "done", notes: "PrintGiftVoucher page" },
    ],
  },
  {
    category: "Recently Viewed Products",
    icon: <Eye className="h-5 w-5" />,
    features: [
      { name: "Track Viewed Products", description: "Track products viewed", status: "done", notes: "useRecentlyViewed hook" },
      { name: "Display Recently Viewed", description: "Show on storefront", status: "done", notes: "Section on product pages" },
      { name: "Max Items Limit", description: "Configurable max items", status: "done", notes: "Default 10" },
    ],
  },
  {
    category: "Image Lightbox",
    icon: <Image className="h-5 w-5" />,
    features: [
      { name: "Fullscreen Gallery", description: "View images fullscreen", status: "done", notes: "ImageLightbox component" },
      { name: "Navigation", description: "Next/prev arrows", status: "done", notes: "Arrow navigation" },
      { name: "Keyboard Support", description: "Arrow keys and Escape", status: "done", notes: "Keyboard handlers" },
      { name: "Zoom", description: "Zoom into images", status: "done", notes: "Click-to-zoom" },
    ],
  },
  {
    category: "Currency Switcher",
    icon: <DollarSign className="h-5 w-5" />,
    features: [
      { name: "Multi-Currency Display", description: "Show prices in multiple currencies", status: "done", notes: "CurrencySwitcher component" },
      { name: "Currency Selection", description: "Customer selects currency", status: "done", notes: "Dropdown" },
      { name: "Exchange Rate Config", description: "Configure exchange rates", status: "done", notes: "currencies table with exchange_rate" },
      { name: "Persistence", description: "Remember selection", status: "done", notes: "localStorage" },
    ],
  },
  {
    category: "Language Switcher",
    icon: <Globe className="h-5 w-5" />,
    features: [
      { name: "Multi-Language Support", description: "Switch storefront language", status: "done", notes: "LanguageSwitcher component" },
      { name: "Language Selection", description: "Customer selects language", status: "done", notes: "Dropdown" },
      { name: "Persistence", description: "Remember selection", status: "done", notes: "localStorage" },
    ],
  },
];

// ═══════ 251–270: FINAL COMMERCE FEATURES ═══════
const finalFeatures: FeatureCategory[] = [
  {
    category: "Warehouse Dashboard",
    icon: <Warehouse className="h-5 w-5" />,
    features: [
      { name: "Warehouse Overview", description: "Dashboard for warehouse operations", status: "done", notes: "Admin /warehouse page with KPIs" },
      { name: "Pending Pick Count", description: "Orders awaiting picking", status: "done", notes: "Count of unfulfilled orders" },
      { name: "Pending Pack Count", description: "Orders picked awaiting packing", status: "done", notes: "Pick-Pack workflow tracking" },
      { name: "Shipment Queue", description: "Orders ready for dispatch", status: "done", notes: "Shipment queue with carrier info" },
      { name: "Location Overview", description: "Stock levels per warehouse location", status: "done", notes: "inventory_locations with stock summary" },
    ],
  },
  {
    category: "Pick & Pack",
    icon: <ClipboardCheck className="h-5 w-5" />,
    features: [
      { name: "Pick List Generation", description: "Generate pick lists from orders", status: "done", notes: "Admin /pick-pack page with batch pick lists" },
      { name: "Pick Confirmation", description: "Mark items as picked", status: "done", notes: "Per-item pick confirmation" },
      { name: "Pack Confirmation", description: "Mark orders as packed", status: "done", notes: "Pack step after picking complete" },
      { name: "Batch Processing", description: "Process multiple orders at once", status: "done", notes: "Batch select and process workflow" },
      { name: "Barcode Scanning", description: "Scan barcodes to confirm picks", status: "done", notes: "BarcodeScanner component for pick verification" },
    ],
  },
  {
    category: "POS (Point of Sale)",
    icon: <Monitor className="h-5 w-5" />,
    features: [
      { name: "POS Interface", description: "Touch-friendly POS terminal", status: "done", notes: "Admin /pos page with product grid and cart" },
      { name: "Product Search", description: "Search products by name/SKU/barcode", status: "done", notes: "Quick search in POS" },
      { name: "Customer Lookup", description: "Look up and assign customer", status: "done", notes: "Customer search and selection" },
      { name: "Payment Processing", description: "Process cash, card, and split payments", status: "done", notes: "Multiple payment method support" },
      { name: "Receipt Generation", description: "Generate receipt on sale", status: "done", notes: "PrintPaymentReceipt for POS sales" },
      { name: "Discount Application", description: "Apply discounts and coupons", status: "done", notes: "Coupon and manual discount in POS" },
    ],
  },
  {
    category: "Quotes",
    icon: <FileText className="h-5 w-5" />,
    features: [
      { name: "Quote Creation", description: "Create quotes for customers", status: "done", notes: "quotes table with items, totals, validity" },
      { name: "Quote Status", description: "Draft/sent/accepted/rejected/expired", status: "done", notes: "status column with workflow" },
      { name: "Convert to Order", description: "Convert accepted quote to order", status: "done", notes: "Convert action creates order from quote" },
      { name: "Quote Validity", description: "Set expiry date on quotes", status: "done", notes: "valid_until column" },
      { name: "Print Quote", description: "Generate printable quote", status: "done", notes: "PrintQuote page" },
      { name: "Email Quote", description: "Email quote to customer", status: "done", notes: "Email action with quote PDF attachment" },
    ],
  },
  {
    category: "Returns Management",
    icon: <RefreshCw className="h-5 w-5" />,
    features: [
      { name: "Return Request", description: "Customer initiates return", status: "done", notes: "returns table with reason, status, order_id" },
      { name: "Return Status", description: "Requested/approved/received/refunded", status: "done", notes: "Status workflow column" },
      { name: "Return Items", description: "Track which items are returned", status: "done", notes: "return_items with product_id, quantity, condition" },
      { name: "Refund Processing", description: "Issue refund on return approval", status: "done", notes: "Refund amount calculation and processing" },
      { name: "Return Label", description: "Generate return shipping label", status: "done", notes: "PrintReturnLabel page" },
      { name: "Restock on Return", description: "Auto-restock returned items", status: "done", notes: "Restock action updates inventory" },
    ],
  },
  {
    category: "Supplier Management",
    icon: <Building className="h-5 w-5" />,
    features: [
      { name: "Supplier CRUD", description: "Create and manage suppliers", status: "done", notes: "suppliers table with name, email, contact" },
      { name: "Supplier Products", description: "Link products to suppliers", status: "done", notes: "supplier_id on products" },
      { name: "Supplier Lead Time", description: "Lead time per supplier", status: "done", notes: "lead_time_days column" },
      { name: "Supplier Currency", description: "Default currency per supplier", status: "done", notes: "currency column on suppliers" },
      { name: "Minimum Order", description: "Minimum order value/qty per supplier", status: "done", notes: "min_order_amount, min_order_quantity" },
    ],
  },
  {
    category: "Purchase Orders",
    icon: <ClipboardCopy className="h-5 w-5" />,
    features: [
      { name: "PO Creation", description: "Create purchase orders for suppliers", status: "done", notes: "purchase_orders table" },
      { name: "PO Items", description: "Line items with quantity and cost", status: "done", notes: "purchase_order_items" },
      { name: "PO Status", description: "Draft/sent/partial/received/cancelled", status: "done", notes: "status workflow" },
      { name: "Receive Stock", description: "Receive items against PO", status: "done", notes: "quantity_received on PO items" },
      { name: "PO Number", description: "Auto-generated PO number", status: "done", notes: "po_number with unique constraint" },
      { name: "Print PO", description: "Printable purchase order", status: "done", notes: "PrintPurchaseOrder page" },
    ],
  },
  {
    category: "Layby (Lay-Away)",
    icon: <CreditCard className="h-5 w-5" />,
    features: [
      { name: "Layby Plans", description: "Create installment payment plans", status: "done", notes: "layby_plans table with installments, frequency" },
      { name: "Deposit Collection", description: "Collect initial deposit", status: "done", notes: "deposit_amount column" },
      { name: "Installment Payments", description: "Track installment payments", status: "done", notes: "layby_payments table per plan" },
      { name: "Plan Status", description: "Active/completed/cancelled/defaulted", status: "done", notes: "status workflow with completion logic" },
      { name: "Next Due Date", description: "Track next payment due", status: "done", notes: "next_due_date auto-calculated" },
      { name: "Release on Completion", description: "Release goods when fully paid", status: "done", notes: "completed_at triggers order fulfillment" },
    ],
  },
  {
    category: "Redirects (URL Management)",
    icon: <Link className="h-5 w-5" />,
    features: [
      { name: "301 Redirects", description: "Permanent URL redirects", status: "done", notes: "redirects table with from_path, to_path, type" },
      { name: "302 Redirects", description: "Temporary redirects", status: "done", notes: "redirect_type='temporary'" },
      { name: "Bulk Import", description: "Import redirects via CSV", status: "done", notes: "CSV import for bulk redirect creation" },
      { name: "Redirect Management", description: "Admin page for CRUD", status: "done", notes: "Admin /redirects page" },
    ],
  },
  {
    category: "Webhooks",
    icon: <Zap className="h-5 w-5" />,
    features: [
      { name: "Webhook CRUD", description: "Create webhook endpoints", status: "done", notes: "webhooks table with url, events, signing_secret" },
      { name: "Event Selection", description: "Subscribe to specific events", status: "done", notes: "events array column" },
      { name: "Signing Secret", description: "HMAC signature per webhook", status: "done", notes: "signing_secret for payload verification" },
      { name: "Delivery Logs", description: "Track delivery attempts and responses", status: "done", notes: "webhook_logs table with status_code, response" },
      { name: "Test Webhook", description: "Send test payload", status: "done", notes: "Test button on Webhooks page" },
      { name: "Retry Logic", description: "Auto-retry failed deliveries", status: "done", notes: "retry_count with exponential backoff" },
    ],
  },
  {
    category: "Media Library",
    icon: <Image className="h-5 w-5" />,
    features: [
      { name: "Upload Files", description: "Upload images and documents", status: "done", notes: "Admin /media-library page with upload" },
      { name: "File Browser", description: "Browse and search uploaded files", status: "done", notes: "Grid/list view with search and filters" },
      { name: "Image Preview", description: "Preview images before selection", status: "done", notes: "Thumbnail preview in file browser" },
      { name: "Bulk Upload", description: "Upload multiple files at once", status: "done", notes: "Multi-file upload with progress" },
      { name: "ZIP Upload", description: "Upload ZIP for bulk image extraction", status: "done", notes: "ZipImageUpload component" },
      { name: "File Metadata", description: "Track file size, type, dimensions", status: "done", notes: "Metadata stored per file" },
    ],
  },
  {
    category: "Content Pages & Blog",
    icon: <BookOpen className="h-5 w-5" />,
    features: [
      { name: "Page CRUD", description: "Create and manage content pages", status: "done", notes: "content_pages table with title, slug, content" },
      { name: "Page Types", description: "Page, blog post, FAQ types", status: "done", notes: "page_type column" },
      { name: "Rich Text Editor", description: "WYSIWYG content editing", status: "done", notes: "RichTextEditor component" },
      { name: "Publish Workflow", description: "Draft → published workflow", status: "done", notes: "status and is_published columns" },
      { name: "SEO Fields", description: "Meta title and description per page", status: "done", notes: "seo_title, seo_description columns" },
      { name: "Featured Image", description: "Hero image per page", status: "done", notes: "featured_image column" },
      { name: "Blog Listing", description: "Storefront blog page", status: "done", notes: "StorefrontBlog page" },
    ],
  },
  {
    category: "Content Blocks",
    icon: <LayoutDashboard className="h-5 w-5" />,
    features: [
      { name: "Block CRUD", description: "Create reusable content blocks", status: "done", notes: "content_blocks table with identifier, content" },
      { name: "Block Types", description: "HTML, text, banner block types", status: "done", notes: "block_type column" },
      { name: "Placement", description: "Assign blocks to page positions", status: "done", notes: "placement column (header, footer, sidebar)" },
      { name: "Active Toggle", description: "Enable/disable blocks", status: "done", notes: "is_active column" },
      { name: "Sort Order", description: "Control display order", status: "done", notes: "sort_order column" },
    ],
  },
  {
    category: "Adverts & Banners",
    icon: <Megaphone className="h-5 w-5" />,
    features: [
      { name: "Advert CRUD", description: "Create promotional adverts", status: "done", notes: "adverts table with name, placement, type" },
      { name: "Advert Types", description: "Image, HTML, banner types", status: "done", notes: "advert_type column" },
      { name: "Scheduled Visibility", description: "Start/end dates for adverts", status: "done", notes: "starts_at and ends_at columns" },
      { name: "Placement Control", description: "Homepage, sidebar, header, footer", status: "done", notes: "placement column" },
      { name: "Click-Through URL", description: "Link advert to destination", status: "done", notes: "link_url column" },
      { name: "Storefront Rendering", description: "AdvertBanner component on storefront", status: "done", notes: "AdvertBanner with placement filtering" },
    ],
  },
  {
    category: "Storefront Search",
    icon: <Search className="h-5 w-5" />,
    features: [
      { name: "Product Search", description: "Full-text product search", status: "done", notes: "StorefrontSearch component with instant results" },
      { name: "Search Suggestions", description: "Auto-suggest as you type", status: "done", notes: "Debounced search with dropdown results" },
      { name: "Category Filtering", description: "Filter search by category", status: "done", notes: "Category facet in search results" },
      { name: "Price Range Filter", description: "Filter by price range", status: "done", notes: "Min/max price filter" },
      { name: "Sort Options", description: "Sort by relevance, price, name, date", status: "done", notes: "Sort dropdown on search results" },
    ],
  },
  {
    category: "Storefront Checkout (Extended)",
    icon: <CreditCard className="h-5 w-5" />,
    features: [
      { name: "Guest Checkout", description: "Purchase without account", status: "done", notes: "Guest checkout flow on StorefrontCheckout" },
      { name: "Address Form", description: "Shipping and billing address", status: "done", notes: "Address form with validation" },
      { name: "Coupon Application", description: "Apply coupon code at checkout", status: "done", notes: "Coupon field with validation" },
      { name: "Gift Voucher Application", description: "Apply gift voucher balance", status: "done", notes: "Gift voucher code field" },
      { name: "Store Credit Application", description: "Apply store credit/loyalty points", status: "done", notes: "Points redemption at checkout" },
      { name: "Order Notes", description: "Customer notes on order", status: "done", notes: "Notes field on checkout" },
      { name: "Shipping Method Selection", description: "Choose shipping method", status: "done", notes: "Shipping options with rates" },
      { name: "Payment Method Selection", description: "Choose payment method", status: "done", notes: "Payment method radio/cards" },
    ],
  },
  {
    category: "Storefront Account",
    icon: <UserCheck className="h-5 w-5" />,
    features: [
      { name: "Account Dashboard", description: "Customer account overview", status: "done", notes: "StorefrontAccount page" },
      { name: "Order History", description: "View past orders", status: "done", notes: "Orders tab with order list" },
      { name: "Address Book", description: "Manage saved addresses", status: "done", notes: "Address CRUD in account" },
      { name: "Profile Edit", description: "Update name, email, phone", status: "done", notes: "Profile form with save" },
      { name: "Password Change", description: "Change account password", status: "done", notes: "Password change form" },
      { name: "Digital Downloads", description: "Access purchased downloads", status: "done", notes: "Downloads tab with file links" },
    ],
  },
  {
    category: "Storefront Auth",
    icon: <Key className="h-5 w-5" />,
    features: [
      { name: "Customer Login", description: "Storefront login page", status: "done", notes: "StorefrontLogin page" },
      { name: "Customer Signup", description: "Storefront registration", status: "done", notes: "StorefrontSignup page" },
      { name: "Forgot Username", description: "Recover username by email", status: "done", notes: "StorefrontForgotUsername page" },
      { name: "Auto-Registration Email", description: "Welcome email on signup", status: "done", notes: "auto-registration-email edge function" },
    ],
  },
  {
    category: "Wholesale Storefront",
    icon: <Store className="h-5 w-5" />,
    features: [
      { name: "Wholesale Page", description: "Dedicated wholesale ordering page", status: "done", notes: "StorefrontWholesale page" },
      { name: "Wholesale Pricing", description: "Show wholesale prices to approved customers", status: "done", notes: "Price list filtering by customer group" },
      { name: "Minimum Order Qty", description: "Enforce minimum quantities", status: "done", notes: "min_order_quantity enforcement" },
      { name: "Bulk Order Form", description: "Multi-product order form", status: "done", notes: "Grid order form with quantities" },
    ],
  },
];

// ═══════ 271–290: INTEGRATIONS & EDGE FUNCTIONS ═══════
const integrationFeatures: FeatureCategory[] = [
  {
    category: "Payment Gateway Integration",
    icon: <CreditCard className="h-5 w-5" />,
    features: [
      { name: "Stripe Integration", description: "Process payments via Stripe", status: "partial", notes: "payment-gateway edge function with Stripe support" },
      { name: "PayPal Integration", description: "Process payments via PayPal", status: "partial", notes: "payment-gateway edge function with PayPal support" },
      { name: "Afterpay/Zip", description: "Buy-now-pay-later providers", status: "partial", notes: "BNPL provider configuration in payment-gateway" },
      { name: "Multi-Gateway Support", description: "Configure multiple gateways per store", status: "done", notes: "payment_gateways table with provider, config JSONB" },
      { name: "Payment Email", description: "Email receipt on payment", status: "done", notes: "payment-email edge function" },
      { name: "Refund Processing", description: "Process refunds via gateway", status: "partial", notes: "Refund action in payment-gateway edge function" },
    ],
  },
  {
    category: "Shipping Integration (StarShipIt)",
    icon: <Truck className="h-5 w-5" />,
    features: [
      { name: "Rate Calculation", description: "Get live shipping rates", status: "partial", notes: "starshipit-sync edge function" },
      { name: "Label Generation", description: "Generate shipping labels", status: "partial", notes: "Label creation via StarShipIt API" },
      { name: "Tracking Updates", description: "Auto-import tracking numbers", status: "partial", notes: "Tracking sync from StarShipIt" },
      { name: "Manifest Submission", description: "Submit manifests to carrier", status: "partial", notes: "Manifest close via StarShipIt" },
    ],
  },
  {
    category: "Shipping Integration (ShipStation)",
    icon: <Truck className="h-5 w-5" />,
    features: [
      { name: "Order Sync", description: "Push orders to ShipStation", status: "partial", notes: "shipstation-sync edge function" },
      { name: "Rate Calculation", description: "Get rates from ShipStation", status: "partial", notes: "Rate request via ShipStation API" },
      { name: "Tracking Import", description: "Import tracking from ShipStation", status: "partial", notes: "Webhook listener for tracking updates" },
    ],
  },
  {
    category: "Carrier Rate API",
    icon: <Truck className="h-5 w-5" />,
    features: [
      { name: "Live Rate Requests", description: "Request rates from carriers at checkout", status: "done", notes: "carrier-rates edge function" },
      { name: "Multi-Carrier Support", description: "Support multiple carriers", status: "done", notes: "Carrier configuration per store" },
      { name: "Rate Caching", description: "Cache rates to reduce API calls", status: "done", notes: "Short TTL caching of rate responses" },
      { name: "Fallback Rates", description: "Use zone rates if carrier API fails", status: "done", notes: "Fallback to shipping_zones rates" },
    ],
  },
  {
    category: "Xero Accounting Integration",
    icon: <Receipt className="h-5 w-5" />,
    features: [
      { name: "Invoice Sync", description: "Push invoices to Xero", status: "partial", notes: "xero-sync edge function" },
      { name: "Payment Sync", description: "Sync payments to Xero", status: "partial", notes: "Payment records pushed on capture" },
      { name: "Customer Sync", description: "Sync customer records", status: "partial", notes: "Customer create/update sync" },
      { name: "Product Sync", description: "Sync products as inventory items", status: "partial", notes: "Product sync to Xero items" },
    ],
  },
  {
    category: "eBay Marketplace Integration",
    icon: <Store className="h-5 w-5" />,
    features: [
      { name: "Product Listing", description: "List products on eBay", status: "partial", notes: "ebay-sync edge function" },
      { name: "Order Import", description: "Import eBay orders", status: "partial", notes: "Order sync from eBay API" },
      { name: "Stock Sync", description: "Sync stock levels to eBay", status: "partial", notes: "Inventory sync on stock change" },
      { name: "Price Sync", description: "Sync pricing to eBay", status: "partial", notes: "Price update sync" },
    ],
  },
  {
    category: "Marketplace Sync (Generic)",
    icon: <Store className="h-5 w-5" />,
    features: [
      { name: "Multi-Marketplace", description: "Sync to Amazon, Catch, TradeMe", status: "partial", notes: "marketplace-sync edge function" },
      { name: "Listing Management", description: "Create and manage listings", status: "partial", notes: "Listing CRUD per marketplace" },
      { name: "Order Import", description: "Import marketplace orders", status: "partial", notes: "Order sync from marketplace APIs" },
      { name: "Inventory Sync", description: "Keep stock in sync", status: "partial", notes: "Stock level push on changes" },
    ],
  },
  {
    category: "Mailchimp Integration",
    icon: <Mail className="h-5 w-5" />,
    features: [
      { name: "Subscriber Sync", description: "Sync newsletter subscribers", status: "partial", notes: "mailchimp-sync edge function" },
      { name: "Customer Sync", description: "Sync customers as contacts", status: "partial", notes: "Customer data push to Mailchimp" },
      { name: "Purchase Data", description: "Send purchase data for segmentation", status: "partial", notes: "Order data sync for e-commerce tracking" },
      { name: "Campaign Triggers", description: "Trigger campaigns on events", status: "partial", notes: "Event-based campaign triggers" },
    ],
  },
  {
    category: "Klaviyo Integration",
    icon: <Mail className="h-5 w-5" />,
    features: [
      { name: "Profile Sync", description: "Sync customer profiles", status: "partial", notes: "klaviyo-sync edge function" },
      { name: "Event Tracking", description: "Track purchase and browse events", status: "partial", notes: "Event push for flows and segments" },
      { name: "Product Feed", description: "Sync product catalog", status: "partial", notes: "Product data sync for recommendations" },
      { name: "Flow Triggers", description: "Trigger Klaviyo flows on events", status: "partial", notes: "Abandoned cart, post-purchase flows" },
    ],
  },
  {
    category: "Google Shopping Feed",
    icon: <Globe className="h-5 w-5" />,
    features: [
      { name: "Product Feed Generation", description: "Generate Google Shopping XML feed", status: "done", notes: "google-shopping-feed edge function" },
      { name: "Required Fields", description: "Map all required Google fields", status: "done", notes: "Title, description, price, availability, GTIN mapping" },
      { name: "Category Mapping", description: "Map to Google product categories", status: "done", notes: "google_product_category mapping" },
      { name: "Image URLs", description: "Include product image URLs", status: "done", notes: "image_link and additional_image_link" },
      { name: "Variant Support", description: "Include variant data in feed", status: "done", notes: "item_group_id with variant attributes" },
    ],
  },
  {
    category: "Sitemap Generation",
    icon: <Globe className="h-5 w-5" />,
    features: [
      { name: "XML Sitemap", description: "Auto-generate XML sitemap", status: "done", notes: "sitemap edge function" },
      { name: "Product URLs", description: "Include all product pages", status: "done", notes: "Product URLs with lastmod" },
      { name: "Category URLs", description: "Include category pages", status: "done", notes: "Category URLs in sitemap" },
      { name: "Content Page URLs", description: "Include content/blog pages", status: "done", notes: "Content page URLs" },
      { name: "Priority & Frequency", description: "Set priority and changefreq", status: "done", notes: "Priority based on page type" },
    ],
  },
  {
    category: "SMS Gateway",
    icon: <Smartphone className="h-5 w-5" />,
    features: [
      { name: "Send SMS", description: "Send SMS notifications", status: "partial", notes: "sms-gateway edge function" },
      { name: "Order SMS", description: "SMS on order confirmation", status: "partial", notes: "Order status SMS notifications" },
      { name: "Shipping SMS", description: "SMS on shipment dispatch", status: "partial", notes: "Dispatch notification SMS" },
      { name: "Provider Support", description: "Twilio, MessageBird support", status: "partial", notes: "Multi-provider SMS gateway" },
    ],
  },
  {
    category: "Email System (Core)",
    icon: <Mail className="h-5 w-5" />,
    features: [
      { name: "Send Email Function", description: "Core email sending edge function", status: "done", notes: "send-email edge function with Resend/SMTP" },
      { name: "Order Confirmation", description: "Email on order placement", status: "done", notes: "order-email-trigger edge function" },
      { name: "Shipment Notification", description: "Email on shipment dispatch", status: "done", notes: "shipment-email edge function" },
      { name: "Delivery Notification", description: "Email on order delivery", status: "done", notes: "order-delivered-email edge function" },
      { name: "Welcome Email", description: "Email on customer signup", status: "done", notes: "welcome-email edge function" },
      { name: "Abandoned Cart Email", description: "Email for abandoned carts", status: "done", notes: "abandoned-cart-email edge function" },
      { name: "Order Follow-Up", description: "Post-purchase follow-up email", status: "done", notes: "order-follow-up edge function" },
      { name: "Low Stock Alert", description: "Email on low stock threshold", status: "done", notes: "low-stock-alert edge function" },
      { name: "Customer Statement", description: "Email customer account statement", status: "done", notes: "customer-statement-email edge function" },
      { name: "Batch Job Error", description: "Email on batch job failure", status: "done", notes: "batch-job-error-email edge function" },
    ],
  },
  {
    category: "Scheduled Export",
    icon: <Download className="h-5 w-5" />,
    features: [
      { name: "Scheduled Data Export", description: "Auto-export data on schedule", status: "done", notes: "scheduled-export edge function" },
      { name: "Export Formats", description: "CSV and JSON export formats", status: "done", notes: "Format selection per export" },
      { name: "Entity Types", description: "Export products, orders, customers", status: "done", notes: "Entity type selection" },
      { name: "Email Delivery", description: "Email export file on completion", status: "done", notes: "Email with download link" },
    ],
  },
  {
    category: "Platform Merchant API",
    icon: <Building className="h-5 w-5" />,
    features: [
      { name: "List Merchants", description: "API to list all merchants", status: "done", notes: "list-merchants edge function" },
      { name: "Merchant Details", description: "Get merchant store details", status: "done", notes: "Store info with plan and status" },
      { name: "Platform Auth", description: "Platform admin authentication", status: "done", notes: "Platform role verification" },
    ],
  },
  {
    category: "Email Automations",
    icon: <Workflow className="h-5 w-5" />,
    features: [
      { name: "Automation CRUD", description: "Create email automations", status: "done", notes: "email_automations table with trigger_type, delay_hours" },
      { name: "Trigger Types", description: "Post-purchase, abandoned cart, welcome", status: "done", notes: "trigger_type column" },
      { name: "Delay Configuration", description: "Set delay before sending", status: "done", notes: "delay_hours column" },
      { name: "HTML Template", description: "Custom HTML email body", status: "done", notes: "html_body column with template" },
      { name: "Sent Count Tracking", description: "Track emails sent per automation", status: "done", notes: "sent_count column" },
      { name: "Active Toggle", description: "Enable/disable automations", status: "done", notes: "is_active column" },
    ],
  },
  {
    category: "Coupons & Promotions",
    icon: <Tag className="h-5 w-5" />,
    features: [
      { name: "Coupon CRUD", description: "Create discount coupons", status: "done", notes: "coupons table with code, discount_type, discount_value" },
      { name: "Discount Types", description: "Percentage, fixed amount, free shipping", status: "done", notes: "discount_type column" },
      { name: "Usage Limits", description: "Max uses and per-customer limits", status: "done", notes: "max_uses and per_customer_limit columns" },
      { name: "Date Range", description: "Valid from/to dates", status: "done", notes: "starts_at and expires_at columns" },
      { name: "Product/Category Scope", description: "Limit to specific products or categories", status: "done", notes: "product_ids and category_ids arrays" },
      { name: "Min Order Amount", description: "Minimum order for coupon", status: "done", notes: "min_order_amount column" },
      { name: "Free Shipping Option", description: "Coupon grants free shipping", status: "done", notes: "free_shipping boolean column" },
      { name: "Usage Tracking", description: "Track times used", status: "done", notes: "used_count column" },
    ],
  },
  {
    category: "Price Rules (Auto Discounts)",
    icon: <Percent className="h-5 w-5" />,
    features: [
      { name: "Rule CRUD", description: "Create automatic discount rules", status: "done", notes: "price_rules table with conditions and discount" },
      { name: "Condition Types", description: "Cart total, quantity, customer group", status: "done", notes: "conditions JSONB with type, operator, value" },
      { name: "Discount Actions", description: "Percentage off, fixed off, fixed price", status: "done", notes: "discount_type and discount_value" },
      { name: "Priority", description: "Control rule evaluation order", status: "done", notes: "priority column for rule ordering" },
      { name: "Stackable Rules", description: "Allow rules to combine", status: "done", notes: "is_stackable boolean" },
      { name: "Date Range", description: "Scheduled rule validity", status: "done", notes: "starts_at and ends_at columns" },
    ],
  },
  {
    category: "Tax Rates",
    icon: <Receipt className="h-5 w-5" />,
    features: [
      { name: "Tax Rate CRUD", description: "Create and manage tax rates", status: "done", notes: "tax_rates table with name, rate, country, state" },
      { name: "Zone-Based Taxes", description: "Different rates by region", status: "done", notes: "country and state columns for location-based tax" },
      { name: "Tax Classes", description: "Product tax classes", status: "done", notes: "tax_class column on products" },
      { name: "Tax Included Pricing", description: "Prices include or exclude tax", status: "done", notes: "is_inclusive boolean on tax_rates" },
      { name: "Compound Tax", description: "Tax calculated on tax", status: "done", notes: "is_compound boolean" },
      { name: "Tax Exemption", description: "Exempt customers or groups", status: "done", notes: "is_tax_exempt on customer_groups" },
    ],
  },
];

// ═══════ 291–310: REMAINING SYSTEMS ═══════
const remainingFeatures: FeatureCategory[] = [
  {
    category: "Marketplace Connections",
    icon: <Store className="h-5 w-5" />,
    features: [
      { name: "Connection CRUD", description: "Create marketplace connections", status: "done", notes: "marketplace_connections table with marketplace, credentials" },
      { name: "Listing Management", description: "Create/manage marketplace listings", status: "done", notes: "marketplace_listings with product mapping" },
      { name: "eBay Connection", description: "Connect to eBay", status: "partial", notes: "eBay API credentials config" },
      { name: "Amazon Connection", description: "Connect to Amazon", status: "partial", notes: "Amazon SP-API config" },
      { name: "Catch Connection", description: "Connect to Catch marketplace", status: "partial", notes: "Catch API config" },
      { name: "Google Shopping", description: "Connect to Google Merchant Center", status: "done", notes: "google-shopping-feed edge function" },
      { name: "Facebook Shop", description: "Connect to Facebook Commerce", status: "partial", notes: "Facebook catalog API config" },
      { name: "Trade Me", description: "Connect to Trade Me (NZ)", status: "partial", notes: "Trade Me API config" },
    ],
  },
  {
    category: "Product Shipping Dimensions",
    icon: <Package className="h-5 w-5" />,
    features: [
      { name: "Weight", description: "Product weight for shipping calc", status: "done", notes: "weight column on products and product_shipping" },
      { name: "Dimensions (L×W×H)", description: "Length, width, height", status: "done", notes: "length, width, height on product_shipping" },
      { name: "Shipping Class", description: "Assign shipping class", status: "done", notes: "shipping_class column" },
      { name: "Free Shipping Flag", description: "Mark product as free shipping", status: "done", notes: "free_shipping boolean" },
      { name: "Oversized Flag", description: "Flag oversized items", status: "done", notes: "is_oversized boolean for surcharge" },
      { name: "Flat Rate Override", description: "Flat shipping rate per product", status: "done", notes: "flat_rate_shipping column" },
    ],
  },
  {
    category: "Shipping Zones & Rates",
    icon: <MapPin className="h-5 w-5" />,
    features: [
      { name: "Zone CRUD", description: "Create shipping zones", status: "done", notes: "shipping_zones table with name, countries" },
      { name: "Zone Rates", description: "Rate tables per zone", status: "done", notes: "shipping_rates with zone_id, method, price" },
      { name: "Weight-Based Rates", description: "Rates based on weight brackets", status: "done", notes: "min_weight, max_weight on rates" },
      { name: "Price-Based Rates", description: "Rates based on order total", status: "done", notes: "min_order, max_order on rates" },
      { name: "Free Shipping Threshold", description: "Free shipping above amount", status: "done", notes: "free_shipping_threshold on zones" },
      { name: "Multiple Methods", description: "Standard, express, overnight per zone", status: "done", notes: "method column for shipping speed" },
    ],
  },
  {
    category: "Customer Segmentation Rules",
    icon: <Users className="h-5 w-5" />,
    features: [
      { name: "Rule CRUD", description: "Create segmentation rules", status: "done", notes: "customer_segmentation_rules table" },
      { name: "Match Type", description: "Match all or any conditions", status: "done", notes: "match_type column (all/any)" },
      { name: "Rule Conditions", description: "Order count, spend, recency, location", status: "done", notes: "rules JSONB with conditions" },
      { name: "Auto-Segment", description: "Auto-assign segment on rule match", status: "done", notes: "segment column updated on match" },
      { name: "Matched Count", description: "Track number of matched customers", status: "done", notes: "matched_count column" },
    ],
  },
  {
    category: "Inventory Alerts",
    icon: <Bell className="h-5 w-5" />,
    features: [
      { name: "Low Stock Alert", description: "Alert when stock below threshold", status: "done", notes: "inventory_alerts table with alert_type='low_stock'" },
      { name: "Out of Stock Alert", description: "Alert when stock reaches zero", status: "done", notes: "alert_type='out_of_stock'" },
      { name: "Alert Resolution", description: "Mark alerts as resolved", status: "done", notes: "is_resolved, resolved_at, resolved_by" },
      { name: "Email Notification", description: "Email on low stock", status: "done", notes: "low-stock-alert edge function" },
      { name: "Threshold Config", description: "Per-product low stock threshold", status: "done", notes: "low_stock_threshold on inventory_stock" },
    ],
  },
  {
    category: "Inventory Forecasting",
    icon: <BarChart3 className="h-5 w-5" />,
    features: [
      { name: "Sales Velocity", description: "Calculate avg daily sales", status: "done", notes: "avg_daily_sales on inventory_forecasts" },
      { name: "Days of Stock", description: "Estimate days until stockout", status: "done", notes: "days_of_stock calculated from velocity" },
      { name: "Reorder Date", description: "Predicted reorder date", status: "done", notes: "reorder_date based on lead time + stock" },
      { name: "Safety Stock", description: "Recommended safety stock level", status: "done", notes: "safety_stock column" },
      { name: "Suggested Reorder Qty", description: "Recommended quantity to order", status: "done", notes: "suggested_reorder_qty column" },
      { name: "Lead Time", description: "Supplier lead time in days", status: "done", notes: "lead_time_days column" },
    ],
  },
  {
    category: "Addon Marketplace",
    icon: <Puzzle className="h-5 w-5" />,
    features: [
      { name: "Addon Catalog", description: "Browse available addons", status: "done", notes: "addon_catalog table with name, description, price" },
      { name: "Addon Categories", description: "Filter by type (shipping, marketing, etc.)", status: "done", notes: "category and addon_type columns" },
      { name: "Install Count", description: "Track addon popularity", status: "done", notes: "install_count column" },
      { name: "Store Addons", description: "Track installed addons per store", status: "done", notes: "store_addons table with config JSONB" },
      { name: "Free/Paid Addons", description: "Support free and paid addons", status: "done", notes: "is_free boolean and price column" },
      { name: "Versioning", description: "Track addon version", status: "done", notes: "version column on addon_catalog" },
    ],
  },
  {
    category: "Notification System",
    icon: <Bell className="h-5 w-5" />,
    features: [
      { name: "In-App Notifications", description: "Bell icon with notification list", status: "done", notes: "NotificationBell component in TopBar" },
      { name: "Notification Types", description: "Order, stock, system notifications", status: "done", notes: "Multiple notification types" },
      { name: "Read/Unread Status", description: "Track read state", status: "done", notes: "Read state management" },
      { name: "Notification Count Badge", description: "Unread count badge", status: "done", notes: "Badge count on bell icon" },
    ],
  },
  {
    category: "Barcode System",
    icon: <HardDrive className="h-5 w-5" />,
    features: [
      { name: "Barcode Scanner", description: "Scan barcodes via camera", status: "done", notes: "BarcodeScanner component" },
      { name: "Barcode on Products", description: "Barcode/GTIN per product", status: "done", notes: "barcode column on products" },
      { name: "Barcode on Variants", description: "Barcode per variant", status: "done", notes: "barcode column on product_variants" },
      { name: "Barcode Label Printing", description: "Print barcode labels", status: "done", notes: "PrintBarcodeLabels page" },
      { name: "Barcode Lookup", description: "Look up product by barcode scan", status: "done", notes: "Product search by barcode" },
    ],
  },
  {
    category: "Export Wizard",
    icon: <Download className="h-5 w-5" />,
    features: [
      { name: "Entity Selection", description: "Choose what to export", status: "done", notes: "Admin /export page with entity picker" },
      { name: "Field Selection", description: "Choose which fields to export", status: "done", notes: "Checkbox field selection" },
      { name: "Filter Options", description: "Filter data before export", status: "done", notes: "Date range and status filters" },
      { name: "Format Selection", description: "CSV or JSON export format", status: "done", notes: "Format dropdown" },
      { name: "Download File", description: "Download generated export file", status: "done", notes: "Browser download of generated file" },
    ],
  },
  {
    category: "Import Wizard",
    icon: <Upload className="h-5 w-5" />,
    features: [
      { name: "File Upload", description: "Upload CSV for import", status: "done", notes: "Admin /import page with file upload" },
      { name: "Column Mapping", description: "Map CSV columns to fields", status: "done", notes: "Interactive column mapper" },
      { name: "Preview Data", description: "Preview imported data before commit", status: "done", notes: "Data preview table" },
      { name: "Validation", description: "Validate data before import", status: "done", notes: "Row-level validation with error display" },
      { name: "Import Progress", description: "Track import progress", status: "done", notes: "Progress bar during import" },
      { name: "Error Report", description: "Download errors after import", status: "done", notes: "Error CSV with row numbers and messages" },
    ],
  },
  {
    category: "Abandoned Cart Recovery",
    icon: <ShoppingCart className="h-5 w-5" />,
    features: [
      { name: "Cart Detection", description: "Detect abandoned carts", status: "done", notes: "abandoned_carts table with abandoned_at" },
      { name: "Recovery Email", description: "Send recovery email", status: "done", notes: "abandoned-cart-email edge function" },
      { name: "Recovery Status", description: "Track pending/sent/recovered", status: "done", notes: "recovery_status column" },
      { name: "Cart Total Tracking", description: "Track value of abandoned carts", status: "done", notes: "cart_total column for revenue reporting" },
      { name: "Recovery Rate", description: "Track successful recovery rate", status: "done", notes: "recovered_at timestamp for analytics" },
    ],
  },
  {
    category: "Subdomain & Multi-Tenancy Routing",
    icon: <Globe className="h-5 w-5" />,
    features: [
      { name: "Subdomain Detection", description: "Detect store from subdomain", status: "done", notes: "getSubdomainSlug() in subdomain.ts" },
      { name: "Path-Based Routing", description: "Fallback path-based store routing", status: "done", notes: "/store/:slug route pattern" },
      { name: "CPanel Routing", description: "Admin at /_cpanel on subdomain", status: "done", notes: "/_cpanel prefix for subdomain admin" },
      { name: "Storefront at Root", description: "Storefront at / on subdomain", status: "done", notes: "Root path serves storefront on subdomain" },
      { name: "Platform Detection", description: "Detect platform vs store domain", status: "done", notes: "PLATFORM_DOMAINS array for detection" },
    ],
  },
  {
    category: "Responsive & Mobile Design",
    icon: <Smartphone className="h-5 w-5" />,
    features: [
      { name: "Mobile-First Layout", description: "All pages mobile-responsive", status: "done", notes: "Tailwind responsive breakpoints throughout" },
      { name: "Mobile Sidebar", description: "Collapsible sidebar on mobile", status: "done", notes: "SidebarProvider with mobile sheet" },
      { name: "useMobile Hook", description: "Detect mobile viewport", status: "done", notes: "use-mobile.tsx hook" },
      { name: "Touch-Friendly UI", description: "Appropriate touch targets", status: "done", notes: "Min 44px touch targets on mobile" },
      { name: "Mobile Search", description: "Full-width search on mobile", status: "done", notes: "Hidden on mobile, full-width on expand" },
    ],
  },
  {
    category: "Admin Dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
    features: [
      { name: "KPI Cards", description: "Revenue, orders, customers, products", status: "done", notes: "Dashboard page with 4 KPI cards" },
      { name: "Revenue Chart", description: "Revenue trend chart", status: "done", notes: "Line chart with date range" },
      { name: "Recent Orders", description: "Latest orders table", status: "done", notes: "Recent orders with status badges" },
      { name: "Top Products", description: "Best-selling products", status: "done", notes: "Top products by revenue" },
      { name: "Low Stock Alerts", description: "Products below threshold", status: "done", notes: "Low stock product list" },
      { name: "Quick Actions", description: "Shortcuts to common actions", status: "done", notes: "Quick action buttons" },
    ],
  },
  {
    category: "Order Management (Extended)",
    icon: <ShoppingCart className="h-5 w-5" />,
    features: [
      { name: "Create Order (Admin)", description: "Manually create orders", status: "done", notes: "CreateOrderDialog component" },
      { name: "Order Detail Page", description: "Full order detail view", status: "done", notes: "OrderDetail page with all tabs" },
      { name: "Order Notes", description: "Internal notes on orders", status: "done", notes: "order_notes table" },
      { name: "Order Tags", description: "Tag orders for filtering", status: "done", notes: "tags array on orders" },
      { name: "Bulk Actions", description: "Bulk update order status", status: "done", notes: "Multi-select with bulk status change" },
      { name: "Order Filtering", description: "Filter by status, date, customer, channel", status: "done", notes: "Comprehensive filter bar" },
      { name: "Order Search", description: "Search by order number, customer", status: "done", notes: "Search input on orders page" },
    ],
  },
  {
    category: "Customer Management (Extended)",
    icon: <Users className="h-5 w-5" />,
    features: [
      { name: "Customer Detail Page", description: "Full customer profile view", status: "done", notes: "CustomerDetail page" },
      { name: "Customer Tags", description: "Tag customers for segmentation", status: "done", notes: "tags array on customers" },
      { name: "Customer Notes", description: "Internal notes on customers", status: "done", notes: "notes column" },
      { name: "Customer Logo", description: "Logo/avatar per customer", status: "done", notes: "logo_url column" },
      { name: "Order History", description: "View customer order history", status: "done", notes: "Orders tab on customer detail" },
      { name: "Communication History", description: "View all communications", status: "done", notes: "Communications tab via customer_communications" },
      { name: "Segment Badge", description: "Visual segment indicator", status: "done", notes: "Segment badge (VIP, Regular, etc.)" },
    ],
  },
  {
    category: "Bulk Product Edit",
    icon: <PenTool className="h-5 w-5" />,
    features: [
      { name: "Multi-Select Products", description: "Select multiple products", status: "done", notes: "Checkbox selection on products page" },
      { name: "Bulk Price Update", description: "Update prices in bulk", status: "done", notes: "BulkEditDialog with price field" },
      { name: "Bulk Status Change", description: "Change status in bulk", status: "done", notes: "Status dropdown in bulk edit" },
      { name: "Bulk Category Assign", description: "Assign category in bulk", status: "done", notes: "Category select in bulk edit" },
      { name: "Bulk Tag Add", description: "Add tags in bulk", status: "done", notes: "Tag input in bulk edit" },
      { name: "Bulk Delete", description: "Delete products in bulk", status: "done", notes: "Bulk delete with confirmation" },
    ],
  },
  {
    category: "Store Settings",
    icon: <Settings className="h-5 w-5" />,
    features: [
      { name: "General Settings", description: "Store name, email, phone, timezone", status: "done", notes: "Settings page general tab" },
      { name: "Currency Settings", description: "Default and available currencies", status: "done", notes: "Admin /currencies page" },
      { name: "Tax Settings", description: "Tax configuration", status: "done", notes: "Admin /tax-rates page" },
      { name: "Shipping Settings", description: "Shipping zone configuration", status: "done", notes: "Admin /shipping-zones page" },
      { name: "Notification Settings", description: "Email notification preferences", status: "done", notes: "Notification toggles in settings" },
      { name: "Theme Settings", description: "Store theme customization", status: "done", notes: "Admin /templates page" },
    ],
  },
];

// ═══════ 311–330: GRANULAR SYSTEMS ═══════
const granularFeatures: FeatureCategory[] = [
  {
    category: "Product Image Management",
    icon: <Image className="h-5 w-5" />,
    features: [
      { name: "Multi-Image Upload", description: "Upload multiple images per product", status: "done", notes: "ProductImageUpload component with drag-and-drop" },
      { name: "Image Reordering", description: "Drag to reorder images", status: "done", notes: "Sort order on product_images" },
      { name: "Primary Image", description: "Set primary/hero image", status: "done", notes: "is_primary flag on images" },
      { name: "Alt Text", description: "SEO alt text per image", status: "done", notes: "alt_text column" },
      { name: "ZIP Bulk Upload", description: "Upload ZIP for batch extraction", status: "done", notes: "ZipImageUpload component" },
      { name: "Image Thumbnails", description: "Auto-generated thumbnails", status: "done", notes: "Thumbnail generation on upload" },
    ],
  },
  {
    category: "Product Tags & Labels",
    icon: <Tag className="h-5 w-5" />,
    features: [
      { name: "Product Tags", description: "Add tags to products", status: "done", notes: "tags array column on products" },
      { name: "Tag Filtering", description: "Filter products by tags", status: "done", notes: "Tag filter on products page" },
      { name: "BaseTag Component", description: "Reusable tag UI component", status: "done", notes: "BaseTag component with colors" },
      { name: "Product Badges", description: "Visual badges (New, Sale, Hot)", status: "done", notes: "ProductBadges component on storefront" },
      { name: "Custom Badge Labels", description: "Custom badge text", status: "done", notes: "badge_text column on products" },
    ],
  },
  {
    category: "Kit/Bundle Products",
    icon: <Boxes className="h-5 w-5" />,
    features: [
      { name: "Kit Creation", description: "Create product kits/bundles", status: "done", notes: "kit_components table linking products" },
      { name: "Component Products", description: "Add products as components", status: "done", notes: "component_product_id FK" },
      { name: "Component Quantity", description: "Set quantity per component", status: "done", notes: "quantity column on kit_components" },
      { name: "Optional Components", description: "Mark components as optional", status: "done", notes: "is_optional boolean" },
      { name: "Swappable Components", description: "Allow component swaps", status: "done", notes: "is_swappable with swap_group" },
      { name: "Kit Components Tab", description: "Admin tab for managing kit items", status: "done", notes: "KitComponentsTab component" },
    ],
  },
  {
    category: "Product Addons",
    icon: <Puzzle className="h-5 w-5" />,
    features: [
      { name: "Addon Groups", description: "Create addon option groups", status: "done", notes: "product_addon_groups table" },
      { name: "Addon Options", description: "Options within each group", status: "done", notes: "product_addon_options with price_modifier" },
      { name: "Required/Optional", description: "Mark groups as required", status: "done", notes: "is_required on addon groups" },
      { name: "Price Modifier", description: "Add-on price adjustment", status: "done", notes: "price_modifier on options" },
      { name: "Addons Tab", description: "Admin tab for managing addons", status: "done", notes: "ProductAddonsTab component" },
    ],
  },
  {
    category: "Order Channels",
    icon: <Monitor className="h-5 w-5" />,
    features: [
      { name: "Channel Tracking", description: "Track order source channel", status: "done", notes: "channel column on orders (web, pos, api, marketplace)" },
      { name: "Channel Filtering", description: "Filter orders by channel", status: "done", notes: "Channel filter on orders page" },
      { name: "Channel Analytics", description: "Revenue breakdown by channel", status: "done", notes: "Channel report in analytics" },
      { name: "Marketplace Orders", description: "Orders from marketplace sync", status: "done", notes: "channel='marketplace' with source reference" },
    ],
  },
  {
    category: "Order Payments",
    icon: <CreditCard className="h-5 w-5" />,
    features: [
      { name: "Payment Recording", description: "Record payments against orders", status: "done", notes: "order_payments table" },
      { name: "Multiple Payments", description: "Multiple payments per order", status: "done", notes: "One-to-many order→payments" },
      { name: "Payment Methods", description: "Cash, card, bank transfer, voucher", status: "done", notes: "payment_method column" },
      { name: "Payment Status", description: "Pending/completed/failed/refunded", status: "done", notes: "status column on payments" },
      { name: "Transaction Reference", description: "Gateway transaction reference", status: "done", notes: "transaction_id column" },
    ],
  },
  {
    category: "Order Shipments",
    icon: <Truck className="h-5 w-5" />,
    features: [
      { name: "Shipment Creation", description: "Create shipments for orders", status: "done", notes: "order_shipments table" },
      { name: "Tracking Number", description: "Add tracking number", status: "done", notes: "tracking_number column" },
      { name: "Carrier Selection", description: "Select shipping carrier", status: "done", notes: "carrier column" },
      { name: "Shipment Items", description: "Track which items shipped", status: "done", notes: "order_shipment_items table" },
      { name: "Partial Shipments", description: "Ship orders in multiple shipments", status: "done", notes: "Multiple shipments per order" },
      { name: "Shipment Email", description: "Email customer on dispatch", status: "done", notes: "shipment-email edge function" },
    ],
  },
  {
    category: "Delivery Estimates",
    icon: <Clock className="h-5 w-5" />,
    features: [
      { name: "Estimated Delivery", description: "Show estimated delivery date", status: "done", notes: "DeliveryEstimate component" },
      { name: "Cut-Off Time", description: "Order cut-off for same-day dispatch", status: "done", notes: "Cut-off time logic in estimate" },
      { name: "Business Days", description: "Calculate excluding weekends", status: "done", notes: "Business day calculation" },
      { name: "Zone-Based Estimates", description: "Different estimates by zone", status: "done", notes: "Delivery days per shipping zone" },
    ],
  },
  {
    category: "Storefront Layout & Navigation",
    icon: <LayoutDashboard className="h-5 w-5" />,
    features: [
      { name: "Header with Nav", description: "Storefront header with navigation", status: "done", notes: "StorefrontLayout header component" },
      { name: "Sidebar Navigation", description: "Category sidebar on products", status: "done", notes: "StorefrontSidebar component" },
      { name: "Footer", description: "Multi-column footer", status: "done", notes: "Footer in StorefrontLayout" },
      { name: "Breadcrumbs", description: "Navigation breadcrumbs", status: "done", notes: "Breadcrumb component on pages" },
      { name: "Mobile Menu", description: "Hamburger menu on mobile", status: "done", notes: "Mobile nav in StorefrontLayout" },
      { name: "Add to Cart Popup", description: "Confirmation popup on add", status: "done", notes: "AddToCartPopup component" },
    ],
  },
  {
    category: "Storefront Product Grid",
    icon: <Package className="h-5 w-5" />,
    features: [
      { name: "Product Cards", description: "Product card with image, price, badge", status: "done", notes: "Product card component on StorefrontProducts" },
      { name: "Grid/List Toggle", description: "Switch between grid and list view", status: "done", notes: "View toggle on products page" },
      { name: "Quick View", description: "Quick product preview modal", status: "done", notes: "ProductQuickView component" },
      { name: "Pagination", description: "Paginated product listing", status: "done", notes: "TablePagination component" },
      { name: "Sort Options", description: "Sort by price, name, date, popularity", status: "done", notes: "Sort dropdown" },
      { name: "Price Display", description: "Show price with sale/compare price", status: "done", notes: "Price with strikethrough for sale" },
    ],
  },
  {
    category: "Admin Sidebar Navigation",
    icon: <LayoutDashboard className="h-5 w-5" />,
    features: [
      { name: "Collapsible Sidebar", description: "Expandable/collapsible admin sidebar", status: "done", notes: "AppSidebar with SidebarProvider" },
      { name: "Grouped Navigation", description: "Nav items grouped by category", status: "done", notes: "Sidebar groups: Sales, Catalog, Inventory, etc." },
      { name: "Active State", description: "Highlight active nav item", status: "done", notes: "NavLink component with active styling" },
      { name: "Icon + Label", description: "Icon and label per nav item", status: "done", notes: "Lucide icons on all nav items" },
      { name: "Mobile Sheet", description: "Sidebar as sheet on mobile", status: "done", notes: "SidebarProvider mobile mode" },
    ],
  },
  {
    category: "Admin TopBar",
    icon: <Monitor className="h-5 w-5" />,
    features: [
      { name: "Global Search", description: "Search products, orders, customers", status: "done", notes: "Search input in TopBar" },
      { name: "Store Switcher", description: "Switch between stores", status: "done", notes: "Store dropdown in TopBar" },
      { name: "View Storefront Link", description: "Link to live storefront", status: "done", notes: "External link button to storefront" },
      { name: "User Menu", description: "User profile dropdown", status: "done", notes: "User icon with settings/signout" },
      { name: "Notification Bell", description: "Notification indicator", status: "done", notes: "NotificationBell component" },
    ],
  },
  {
    category: "Table & List Components",
    icon: <Database className="h-5 w-5" />,
    features: [
      { name: "Data Tables", description: "Sortable, filterable data tables", status: "done", notes: "Table component used across all admin pages" },
      { name: "Pagination", description: "Table pagination with page size", status: "done", notes: "TablePagination component" },
      { name: "Status Badges", description: "Color-coded status indicators", status: "done", notes: "StatusBadge component" },
      { name: "Bulk Selection", description: "Checkbox row selection", status: "done", notes: "Multi-select on products, orders" },
      { name: "Empty States", description: "Empty state illustrations", status: "done", notes: "Empty state messages per table" },
    ],
  },
  {
    category: "Form Components",
    icon: <PenTool className="h-5 w-5" />,
    features: [
      { name: "Rich Text Editor", description: "WYSIWYG HTML editor", status: "done", notes: "RichTextEditor component" },
      { name: "Image Upload", description: "Drag-and-drop image upload", status: "done", notes: "ProductImageUpload component" },
      { name: "Select/Combobox", description: "Searchable select dropdowns", status: "done", notes: "Select and Command components" },
      { name: "Date Picker", description: "Calendar date picker", status: "done", notes: "Calendar component" },
      { name: "Switch Toggle", description: "Boolean toggle switches", status: "done", notes: "Switch component for flags" },
      { name: "Form Validation", description: "Inline validation messages", status: "done", notes: "Form component with error display" },
    ],
  },
  {
    category: "Dialog & Modal System",
    icon: <Monitor className="h-5 w-5" />,
    features: [
      { name: "Dialog Component", description: "Modal dialogs for forms and confirmations", status: "done", notes: "Dialog component (shadcn)" },
      { name: "Alert Dialog", description: "Confirmation dialogs for destructive actions", status: "done", notes: "AlertDialog component" },
      { name: "Sheet (Drawer)", description: "Slide-out panels", status: "done", notes: "Sheet component for side panels" },
      { name: "Storefront Modal", description: "Product/feature modals on storefront", status: "done", notes: "StorefrontModal component" },
      { name: "Toast Notifications", description: "Success/error toast messages", status: "done", notes: "Toaster and toast system" },
    ],
  },
  {
    category: "Theme & Design System",
    icon: <Palette className="h-5 w-5" />,
    features: [
      { name: "CSS Design Tokens", description: "HSL-based semantic color tokens", status: "done", notes: "index.css with --primary, --background, etc." },
      { name: "Dark Mode Support", description: "Light/dark mode theming", status: "done", notes: "Dark mode CSS variables" },
      { name: "Tailwind Config", description: "Extended Tailwind with design tokens", status: "done", notes: "tailwind.config.ts with semantic colors" },
      { name: "shadcn/ui Components", description: "Full shadcn component library", status: "done", notes: "40+ shadcn components installed" },
      { name: "Consistent Spacing", description: "Consistent spacing and sizing", status: "done", notes: "Tailwind spacing scale throughout" },
    ],
  },
  {
    category: "Authentication System",
    icon: <Key className="h-5 w-5" />,
    features: [
      { name: "Email/Password Auth", description: "Standard email/password login", status: "done", notes: "Login and Signup pages" },
      { name: "Auth Context", description: "Global auth state management", status: "done", notes: "AuthContext with user, store, loading" },
      { name: "Route Guards", description: "Protected routes for auth users", status: "done", notes: "RequireAuth component" },
      { name: "Platform Admin Guard", description: "Guard for platform admin routes", status: "done", notes: "RequirePlatformAdmin component" },
      { name: "Auto Store Assignment", description: "Auto-assign user to store on login", status: "done", notes: "Store lookup in AuthContext" },
      { name: "Session Persistence", description: "Auth session survives refresh", status: "done", notes: "onAuthStateChange listener" },
    ],
  },
  {
    category: "Data Hooks & State",
    icon: <Database className="h-5 w-5" />,
    features: [
      { name: "useData Hook", description: "Generic data fetching hook", status: "done", notes: "use-data.ts with Supabase queries" },
      { name: "React Query Integration", description: "TanStack Query for caching", status: "done", notes: "@tanstack/react-query throughout" },
      { name: "Cart Context", description: "Global cart state", status: "done", notes: "CartContext with persistence" },
      { name: "Wishlist Context", description: "Global wishlist state", status: "done", notes: "WishlistContext with persistence" },
      { name: "Compare Context", description: "Product comparison state", status: "done", notes: "CompareContext with max 4 items" },
      { name: "Recently Viewed Hook", description: "Track recently viewed products", status: "done", notes: "useRecentlyViewed hook" },
    ],
  },
  {
    category: "SEO & Meta Tags",
    icon: <Globe className="h-5 w-5" />,
    features: [
      { name: "SEOHead Component", description: "Dynamic meta tags per page", status: "done", notes: "SEOHead with title, description, OG tags" },
      { name: "Open Graph Tags", description: "Facebook/social sharing meta", status: "done", notes: "og:title, og:description, og:image" },
      { name: "Twitter Cards", description: "Twitter card meta tags", status: "done", notes: "twitter:card, twitter:title" },
      { name: "Canonical URLs", description: "Canonical link tags", status: "done", notes: "Canonical URL per page" },
      { name: "Structured Data", description: "JSON-LD product schema", status: "done", notes: "Product schema markup" },
      { name: "XML Sitemap", description: "Auto-generated sitemap", status: "done", notes: "sitemap edge function" },
      { name: "Robots.txt", description: "Robots.txt configuration", status: "done", notes: "public/robots.txt" },
    ],
  },
];

// ═══════ 331–350: DEEP GRANULAR FEATURES ═══════
const deepFeatures: FeatureCategory[] = [
  {
    category: "Product Form (Admin)",
    icon: <PenTool className="h-5 w-5" />,
    features: [
      { name: "Tabbed Form Layout", description: "Organized tabs for product editing", status: "done", notes: "ProductForm with General, Pricing, Inventory, Images, SEO tabs" },
      { name: "Variant Management Tab", description: "Manage variants inline", status: "done", notes: "Variants tab with add/edit/delete" },
      { name: "Kit Components Tab", description: "Manage bundle components", status: "done", notes: "KitComponentsTab component" },
      { name: "Addons Tab", description: "Manage product add-ons", status: "done", notes: "ProductAddonsTab component" },
      { name: "SEO Preview", description: "Preview Google search result", status: "done", notes: "SEO tab with title/description preview" },
      { name: "Slug Auto-Generation", description: "Auto-generate slug from name", status: "done", notes: "Slug auto-populated on name change" },
      { name: "Save & Continue", description: "Save without leaving form", status: "done", notes: "Save action with success toast" },
    ],
  },
  {
    category: "Order Detail (Admin)",
    icon: <FileText className="h-5 w-5" />,
    features: [
      { name: "Order Summary", description: "Order items, totals, status", status: "done", notes: "OrderDetail summary section" },
      { name: "Customer Info", description: "Customer details and addresses", status: "done", notes: "Customer card on order detail" },
      { name: "Payment Tab", description: "Payment history and actions", status: "done", notes: "Payments section with record payment" },
      { name: "Shipment Tab", description: "Shipments with tracking", status: "done", notes: "Shipments section with create shipment" },
      { name: "Timeline Tab", description: "Order event timeline", status: "done", notes: "Timeline section with chronological events" },
      { name: "Notes Tab", description: "Internal order notes", status: "done", notes: "Notes section with add note" },
      { name: "Print Actions", description: "Print invoice, packing slip, label", status: "done", notes: "Print dropdown with multiple document types" },
    ],
  },
  {
    category: "Customer Detail (Admin)",
    icon: <Users className="h-5 w-5" />,
    features: [
      { name: "Profile Overview", description: "Customer info, segment, lifetime value", status: "done", notes: "CustomerDetail header with KPIs" },
      { name: "Orders Tab", description: "Customer order history", status: "done", notes: "Orders list filtered by customer" },
      { name: "Addresses Tab", description: "Saved addresses", status: "done", notes: "Address list with edit/delete" },
      { name: "Communications Tab", description: "Communication history", status: "done", notes: "customer_communications filtered view" },
      { name: "Files Tab", description: "Uploaded customer files", status: "done", notes: "customer_files filtered view" },
      { name: "Loyalty Tab", description: "Points balance and transactions", status: "done", notes: "Loyalty points summary" },
    ],
  },
  {
    category: "Storefront Product Detail",
    icon: <Package className="h-5 w-5" />,
    features: [
      { name: "Image Gallery", description: "Product image carousel/gallery", status: "done", notes: "Image gallery with thumbnails" },
      { name: "Variant Selector", description: "Select product variants", status: "done", notes: "Variant dropdowns/swatches" },
      { name: "Quantity Input", description: "Quantity selector with +/-", status: "done", notes: "Quantity input with min/max" },
      { name: "Add to Cart Button", description: "Primary add to cart action", status: "done", notes: "Add to cart with variant selection" },
      { name: "Wishlist Button", description: "Add to wishlist heart icon", status: "done", notes: "Heart toggle via WishlistContext" },
      { name: "Compare Button", description: "Add to compare", status: "done", notes: "Compare toggle via CompareContext" },
      { name: "Share Buttons", description: "Social share buttons", status: "done", notes: "SocialShare component" },
      { name: "Product Reviews", description: "Customer reviews section", status: "done", notes: "ProductReviews component" },
      { name: "Related Products", description: "Related product carousel", status: "done", notes: "Related products section" },
      { name: "Delivery Estimate", description: "Estimated delivery display", status: "done", notes: "DeliveryEstimate component" },
      { name: "Breadcrumbs", description: "Category breadcrumb navigation", status: "done", notes: "Breadcrumb with category path" },
    ],
  },
  {
    category: "Storefront Home Page",
    icon: <Globe className="h-5 w-5" />,
    features: [
      { name: "Hero Banner", description: "Full-width hero banner/carousel", status: "done", notes: "StorefrontHome hero section" },
      { name: "Featured Products", description: "Featured product grid", status: "done", notes: "Featured products section" },
      { name: "Category Grid", description: "Category cards with images", status: "done", notes: "Category grid section" },
      { name: "Promo Banners", description: "Promotional banner adverts", status: "done", notes: "AdvertBanner with homepage placement" },
      { name: "Newsletter Signup", description: "Email signup in footer", status: "done", notes: "NewsletterSignup component" },
      { name: "Recently Viewed", description: "Recently viewed products", status: "done", notes: "Recently viewed section" },
    ],
  },
  {
    category: "Storefront Track Order",
    icon: <Truck className="h-5 w-5" />,
    features: [
      { name: "Order Lookup", description: "Look up order by number and email", status: "done", notes: "StorefrontTrackOrder page" },
      { name: "Order Status Display", description: "Show current order status", status: "done", notes: "Status badge and timeline" },
      { name: "Tracking Link", description: "Link to carrier tracking page", status: "done", notes: "External tracking URL link" },
    ],
  },
  {
    category: "Storefront Gift Vouchers",
    icon: <Gift className="h-5 w-5" />,
    features: [
      { name: "Purchase Gift Voucher", description: "Buy gift vouchers on storefront", status: "done", notes: "StorefrontGiftVouchers page" },
      { name: "Custom Value", description: "Choose voucher value", status: "done", notes: "Value selection input" },
      { name: "Recipient Details", description: "Enter recipient info", status: "done", notes: "Name, email, message fields" },
      { name: "Check Balance", description: "Check gift voucher balance", status: "done", notes: "Balance check by code" },
    ],
  },
  {
    category: "Storefront Contact Page",
    icon: <Headphones className="h-5 w-5" />,
    features: [
      { name: "Contact Form", description: "Name, email, subject, message form", status: "done", notes: "StorefrontContact page" },
      { name: "Form Validation", description: "Required field validation", status: "done", notes: "Client-side validation" },
      { name: "Success Confirmation", description: "Confirmation on submit", status: "done", notes: "Success toast/message" },
      { name: "Email to Merchant", description: "Email notification to store", status: "done", notes: "contact-email edge function" },
    ],
  },
  {
    category: "Email Templates",
    icon: <Mail className="h-5 w-5" />,
    features: [
      { name: "Template CRUD", description: "Create and edit email templates", status: "done", notes: "email_templates table" },
      { name: "Template Key", description: "Unique key per template type", status: "done", notes: "template_key column" },
      { name: "HTML Editor", description: "HTML body editor for templates", status: "done", notes: "Rich text/HTML editor for template body" },
      { name: "Subject Line", description: "Customizable subject per template", status: "done", notes: "subject column" },
      { name: "Active Toggle", description: "Enable/disable templates", status: "done", notes: "is_active column" },
      { name: "Variable Placeholders", description: "{{order_number}}, {{customer_name}} etc.", status: "done", notes: "Variable substitution in templates" },
    ],
  },
  {
    category: "Store Themes",
    icon: <Palette className="h-5 w-5" />,
    features: [
      { name: "Theme CRUD", description: "Create and manage store themes", status: "done", notes: "store_themes table" },
      { name: "Primary Color", description: "Customizable primary color", status: "done", notes: "primary_color in theme config" },
      { name: "Font Selection", description: "Choose heading and body fonts", status: "done", notes: "heading_font, body_font in config" },
      { name: "Layout Options", description: "Full-width, boxed, sidebar layouts", status: "done", notes: "layout_type in theme config" },
      { name: "Header Style", description: "Header layout options", status: "done", notes: "header_style in config" },
      { name: "Footer Style", description: "Footer layout options", status: "done", notes: "footer_style in config" },
      { name: "Custom CSS", description: "Custom CSS injection", status: "done", notes: "custom_css in theme config" },
    ],
  },
  {
    category: "Storefront Templates (B@SE)",
    icon: <FileCode className="h-5 w-5" />,
    features: [
      { name: "Template CRUD", description: "Create and manage storefront templates", status: "done", notes: "storefront_templates table" },
      { name: "Page Templates", description: "Templates for home, product, category, etc.", status: "done", notes: "template_type column" },
      { name: "Template Engine", description: "B@SE engine processing", status: "done", notes: "base-template-engine.ts" },
      { name: "RenderedTemplate", description: "Component rendering processed templates", status: "done", notes: "RenderedTemplate component" },
      { name: "Admin Editor", description: "Template editor in admin", status: "done", notes: "Admin /templates page" },
    ],
  },
  {
    category: "Reviews & Ratings",
    icon: <Star className="h-5 w-5" />,
    features: [
      { name: "Product Reviews", description: "Customer product reviews", status: "done", notes: "product_reviews table" },
      { name: "Star Rating", description: "1-5 star rating system", status: "done", notes: "rating column" },
      { name: "Review Moderation", description: "Approve/reject reviews", status: "done", notes: "is_approved moderation flag" },
      { name: "Verified Purchase", description: "Badge for verified buyers", status: "done", notes: "is_verified_purchase boolean" },
      { name: "Average Rating", description: "Aggregate rating display", status: "done", notes: "Calculated average on product" },
      { name: "Admin Review Page", description: "Manage all reviews", status: "done", notes: "Admin /reviews page" },
    ],
  },
  {
    category: "Storefront Blog",
    icon: <BookOpen className="h-5 w-5" />,
    features: [
      { name: "Blog Listing", description: "Blog post listing page", status: "done", notes: "StorefrontBlog page" },
      { name: "Blog Detail", description: "Individual blog post page", status: "done", notes: "StorefrontContentPage for blog type" },
      { name: "Featured Image", description: "Hero image on blog posts", status: "done", notes: "featured_image column" },
      { name: "Publish Date", description: "Published date display", status: "done", notes: "published_at column" },
      { name: "Blog Reviews", description: "Comments/reviews on blog posts", status: "done", notes: "content_reviews table" },
    ],
  },
  {
    category: "API Rate Limiting",
    icon: <Shield className="h-5 w-5" />,
    features: [
      { name: "Rate Limit Table", description: "Track API request counts", status: "done", notes: "api_rate_limits table with 15-min windows" },
      { name: "Per-Key Limits", description: "Different limits per API key", status: "done", notes: "rate_limit column on api_keys" },
      { name: "Window Tracking", description: "Rolling 15-minute windows", status: "done", notes: "window_start with request_count" },
      { name: "429 Response", description: "Return 429 when limit exceeded", status: "done", notes: "Rate limit check in rest-api function" },
    ],
  },
  {
    category: "Batch API",
    icon: <Zap className="h-5 w-5" />,
    features: [
      { name: "Batch Requests", description: "Multiple API calls in single request", status: "done", notes: "batch-api edge function" },
      { name: "Parallel Execution", description: "Execute batch items in parallel", status: "done", notes: "Promise.all for batch operations" },
      { name: "Individual Results", description: "Return results per batch item", status: "done", notes: "Array of results with status per item" },
      { name: "Error Isolation", description: "One failure doesn't fail batch", status: "done", notes: "Try-catch per batch item" },
    ],
  },
  {
    category: "Scheduled Reports",
    icon: <Clock className="h-5 w-5" />,
    features: [
      { name: "Report Scheduling", description: "Schedule reports for auto-delivery", status: "done", notes: "scheduled_reports table" },
      { name: "Frequency Options", description: "Daily, weekly, monthly", status: "done", notes: "frequency column" },
      { name: "Recipient List", description: "Email recipients for reports", status: "done", notes: "recipients array column" },
      { name: "Report Type", description: "Sales, inventory, customer reports", status: "done", notes: "report_type column" },
      { name: "Email Delivery", description: "Auto-email report on schedule", status: "done", notes: "scheduled-report-email edge function" },
    ],
  },
  {
    category: "Storefront Content Pages",
    icon: <BookOpen className="h-5 w-5" />,
    features: [
      { name: "Static Pages", description: "About, Terms, Privacy pages", status: "done", notes: "StorefrontContentPage for static pages" },
      { name: "Dynamic Slug Routing", description: "Route by page slug", status: "done", notes: "/page/:slug route" },
      { name: "Rich Content Display", description: "Render HTML content", status: "done", notes: "dangerouslySetInnerHTML for content" },
      { name: "Page Navigation", description: "Link to content pages in nav", status: "done", notes: "Footer links to content pages" },
    ],
  },
  {
    category: "Digital Downloads Page",
    icon: <Download className="h-5 w-5" />,
    features: [
      { name: "Admin Downloads Page", description: "Manage digital downloads", status: "done", notes: "Admin /digital-downloads page" },
      { name: "Download List", description: "View all product download files", status: "done", notes: "List with product, file name, download count" },
      { name: "Customer Download Management", description: "View customer download access", status: "done", notes: "customer_downloads filtered view" },
      { name: "Download Link Generation", description: "Generate secure download links", status: "done", notes: "Token-based download URLs" },
    ],
  },
  {
    category: "Accounting Integration Page",
    icon: <Receipt className="h-5 w-5" />,
    features: [
      { name: "Xero Connection", description: "Connect to Xero accounting", status: "partial", notes: "Admin /accounting page with Xero config" },
      { name: "Sync Settings", description: "Configure what to sync", status: "done", notes: "Sync toggles for invoices, payments, customers" },
      { name: "Sync History", description: "View sync log", status: "done", notes: "Recent sync events with status" },
      { name: "Manual Sync", description: "Trigger manual sync", status: "done", notes: "Sync Now button" },
    ],
  },
];

// ═══════ 351–370: FINAL DEEP FEATURES ═══════
const finalDeepFeatures: FeatureCategory[] = [
  {
    category: "Storefront Checkout Flow",
    icon: <ShoppingCart className="h-5 w-5" />,
    features: [
      { name: "Cart Review Step", description: "Review cart before checkout", status: "done", notes: "StorefrontCart page with item review" },
      { name: "Shipping Step", description: "Enter shipping address", status: "done", notes: "Address form step in checkout" },
      { name: "Payment Step", description: "Select and enter payment", status: "done", notes: "Payment method step" },
      { name: "Order Confirmation", description: "Thank you / confirmation page", status: "done", notes: "Order success page with order number" },
      { name: "Order Email Trigger", description: "Send confirmation email", status: "done", notes: "order-email-trigger edge function" },
      { name: "Coupon Field", description: "Apply coupon at checkout", status: "done", notes: "Coupon code input with validation" },
    ],
  },
  {
    category: "Store Currencies",
    icon: <DollarSign className="h-5 w-5" />,
    features: [
      { name: "Currency CRUD", description: "Manage available currencies", status: "done", notes: "currencies table with code, name, symbol" },
      { name: "Exchange Rates", description: "Set exchange rate per currency", status: "done", notes: "exchange_rate column" },
      { name: "Default Currency", description: "Set store default currency", status: "done", notes: "is_default flag" },
      { name: "Decimal Places", description: "Configure decimal precision", status: "done", notes: "decimal_places column" },
      { name: "Active Toggle", description: "Enable/disable currencies", status: "done", notes: "is_active column" },
    ],
  },
  {
    category: "Marketing Dashboard",
    icon: <Megaphone className="h-5 w-5" />,
    features: [
      { name: "Marketing Overview", description: "Marketing channels and campaigns", status: "done", notes: "Admin /marketing page" },
      { name: "Campaign Tracking", description: "Track marketing campaigns", status: "done", notes: "Campaign metrics display" },
      { name: "Channel Performance", description: "Performance by marketing channel", status: "done", notes: "Channel breakdown cards" },
      { name: "Quick Links", description: "Links to coupons, email, adverts", status: "done", notes: "Quick action cards to sub-pages" },
    ],
  },
  {
    category: "API Documentation Page",
    icon: <Code className="h-5 w-5" />,
    features: [
      { name: "Endpoint Reference", description: "List all API endpoints", status: "done", notes: "Admin /api-docs page" },
      { name: "Request/Response Examples", description: "Show example payloads", status: "done", notes: "Code blocks with JSON examples" },
      { name: "Authentication Guide", description: "How to authenticate API requests", status: "done", notes: "API key usage documentation" },
      { name: "Try It Sandbox", description: "Test endpoints in browser", status: "done", notes: "Interactive request builder" },
      { name: "Rate Limit Info", description: "Rate limiting documentation", status: "done", notes: "Rate limit details per endpoint" },
    ],
  },
  {
    category: "Inventory Locations",
    icon: <Warehouse className="h-5 w-5" />,
    features: [
      { name: "Location CRUD", description: "Create warehouse locations", status: "done", notes: "inventory_locations table" },
      { name: "Location Types", description: "Warehouse, store, dropship types", status: "done", notes: "type column" },
      { name: "Location Address", description: "Physical address per location", status: "done", notes: "address column" },
      { name: "Stock Per Location", description: "Track stock by location", status: "done", notes: "inventory_stock with location_id" },
      { name: "Bin Locations", description: "Sub-location within warehouse", status: "done", notes: "bin_location on inventory_stock" },
    ],
  },
  {
    category: "Inventory Stock Details",
    icon: <Boxes className="h-5 w-5" />,
    features: [
      { name: "Stock Records", description: "Per-product per-location stock", status: "done", notes: "inventory_stock table" },
      { name: "Batch/Lot Tracking", description: "Track batch and lot numbers", status: "done", notes: "batch_number, lot_number columns" },
      { name: "Expiry Date", description: "Track product expiry dates", status: "done", notes: "expiry_date column on inventory_stock" },
      { name: "Low Stock Threshold", description: "Per-product alert threshold", status: "done", notes: "low_stock_threshold column" },
      { name: "Variant-Level Stock", description: "Stock per variant per location", status: "done", notes: "variant_id on inventory_stock" },
    ],
  },
  {
    category: "Customer Addresses",
    icon: <MapPin className="h-5 w-5" />,
    features: [
      { name: "Address CRUD", description: "Create and manage addresses", status: "done", notes: "customer_addresses table" },
      { name: "Default Address", description: "Set default billing/shipping", status: "done", notes: "is_default_billing, is_default_shipping" },
      { name: "Address Types", description: "Billing, shipping, both", status: "done", notes: "address_type column" },
      { name: "Company Name", description: "Company name on address", status: "done", notes: "company column" },
      { name: "Phone on Address", description: "Phone number per address", status: "done", notes: "phone column on addresses" },
    ],
  },
  {
    category: "Order Addresses",
    icon: <MapPin className="h-5 w-5" />,
    features: [
      { name: "Billing Address", description: "Billing address on order", status: "done", notes: "Billing address fields on orders" },
      { name: "Shipping Address", description: "Shipping address on order", status: "done", notes: "Shipping address fields on orders" },
      { name: "Address Snapshot", description: "Address copied at order time", status: "done", notes: "Address stored on order, not referenced" },
    ],
  },
  {
    category: "Storefront Login & Auth",
    icon: <Key className="h-5 w-5" />,
    features: [
      { name: "Login Page", description: "Customer login form", status: "done", notes: "StorefrontLogin with email/password" },
      { name: "Signup Page", description: "Customer registration form", status: "done", notes: "StorefrontSignup with validation" },
      { name: "Forgot Username", description: "Recover username by email", status: "done", notes: "StorefrontForgotUsername page" },
      { name: "Welcome Email", description: "Welcome email on registration", status: "done", notes: "welcome-email edge function" },
      { name: "Auto-Registration Email", description: "Admin notification on signup", status: "done", notes: "auto-registration-email edge function" },
    ],
  },
  {
    category: "Merchant Management (Platform)",
    icon: <Building className="h-5 w-5" />,
    features: [
      { name: "Merchant List", description: "List all merchant stores", status: "done", notes: "PlatformMerchants page" },
      { name: "Merchant Details", description: "View merchant store details", status: "done", notes: "Store info with plan, status, revenue" },
      { name: "Merchant Search", description: "Search merchants by name", status: "done", notes: "Search input on merchants page" },
      { name: "Merchant Status", description: "Active/suspended/trial status", status: "done", notes: "Status badges per merchant" },
      { name: "Revenue Per Merchant", description: "Revenue breakdown per store", status: "done", notes: "Revenue KPI per merchant" },
    ],
  },
  {
    category: "Platform Analytics",
    icon: <BarChart3 className="h-5 w-5" />,
    features: [
      { name: "Aggregate Revenue", description: "Total revenue across all stores", status: "done", notes: "PlatformAnalytics aggregate metrics" },
      { name: "Store Count", description: "Total active stores", status: "done", notes: "Store count KPI" },
      { name: "Customer Count", description: "Total customers across platform", status: "done", notes: "Aggregate customer count" },
      { name: "Growth Trends", description: "Month-over-month growth", status: "done", notes: "Growth trend charts" },
    ],
  },
  {
    category: "Platform Settings",
    icon: <Settings className="h-5 w-5" />,
    features: [
      { name: "Platform Name", description: "Platform branding configuration", status: "done", notes: "PlatformSettings page" },
      { name: "Default Plans", description: "Configure merchant plan tiers", status: "done", notes: "Plan configuration" },
      { name: "Feature Flags", description: "Enable/disable platform features", status: "done", notes: "Feature toggle settings" },
      { name: "Email Configuration", description: "Platform email settings", status: "done", notes: "SMTP/email provider config" },
    ],
  },
  {
    category: "Feature Audit Dashboard",
    icon: <Eye className="h-5 w-5" />,
    features: [
      { name: "Feature Tracking", description: "Track all platform features", status: "done", notes: "FeatureAudit page (this page)" },
      { name: "Status Filtering", description: "Filter by done/partial/not started", status: "done", notes: "Status tab filters" },
      { name: "Search Features", description: "Search across all features", status: "done", notes: "Full-text search across names, descriptions, notes" },
      { name: "Progress Bar", description: "Overall completion percentage", status: "done", notes: "Progress bar with percentage" },
      { name: "Category Breakdown", description: "Collapsible category groups", status: "done", notes: "Collapsible sections per category" },
      { name: "KPI Cards", description: "Done/partial/not started counts", status: "done", notes: "Stats cards at top" },
    ],
  },
  {
    category: "Error Handling & UX",
    icon: <AlertTriangle className="h-5 w-5" />,
    features: [
      { name: "404 Not Found Page", description: "Custom 404 page", status: "done", notes: "NotFound page component" },
      { name: "Loading States", description: "Skeleton/spinner loading indicators", status: "done", notes: "Loading states on all data pages" },
      { name: "Error Toasts", description: "Error notification toasts", status: "done", notes: "Toast on API errors" },
      { name: "Empty States", description: "Helpful empty state messages", status: "done", notes: "Empty state per list/table" },
      { name: "Form Error Messages", description: "Inline field error messages", status: "done", notes: "Validation error display" },
    ],
  },
  {
    category: "Accessibility & Performance",
    icon: <Monitor className="h-5 w-5" />,
    features: [
      { name: "Keyboard Navigation", description: "Full keyboard accessibility", status: "done", notes: "Focus management on all interactive elements" },
      { name: "ARIA Labels", description: "Screen reader labels", status: "done", notes: "aria-label on buttons and icons" },
      { name: "Semantic HTML", description: "Proper heading hierarchy and landmarks", status: "done", notes: "header, main, nav, section elements" },
      { name: "Lazy Loading", description: "Lazy load images and routes", status: "done", notes: "React.lazy for route splitting" },
      { name: "Code Splitting", description: "Route-based code splitting", status: "done", notes: "Dynamic imports for pages" },
    ],
  },
  {
    category: "Developer Experience",
    icon: <Code className="h-5 w-5" />,
    features: [
      { name: "TypeScript Throughout", description: "Full TypeScript codebase", status: "done", notes: "Strict TypeScript with proper types" },
      { name: "ESLint Configuration", description: "Code quality linting", status: "done", notes: "eslint.config.js with React rules" },
      { name: "Vite Build System", description: "Fast dev server and builds", status: "done", notes: "vite.config.ts" },
      { name: "Vitest Testing", description: "Test framework configured", status: "done", notes: "vitest.config.ts with test setup" },
      { name: "Playwright E2E", description: "End-to-end test framework", status: "done", notes: "playwright.config.ts configured" },
      { name: "Path Aliases", description: "@/ import aliases", status: "done", notes: "tsconfig paths with @/ prefix" },
    ],
  },
  {
    category: "Deployment & Infrastructure",
    icon: <Globe className="h-5 w-5" />,
    features: [
      { name: "Lovable Cloud Backend", description: "Managed backend infrastructure", status: "done", notes: "Supabase via Lovable Cloud" },
      { name: "Edge Function Deployment", description: "Auto-deployed edge functions", status: "done", notes: "35+ edge functions auto-deployed" },
      { name: "Database Migrations", description: "Version-controlled schema", status: "done", notes: "supabase/migrations directory" },
      { name: "Environment Variables", description: "Managed env config", status: "done", notes: ".env with VITE_SUPABASE_* vars" },
      { name: "Custom Domain Support", description: "Custom domain for storefront", status: "done", notes: "Subdomain routing support" },
      { name: "Preview Deployments", description: "Preview URL for testing", status: "done", notes: "Lovable preview URL" },
    ],
  },
  {
    category: "Multi-Tenant Data Isolation",
    icon: <Shield className="h-5 w-5" />,
    features: [
      { name: "Store-Level RLS", description: "All tables isolated by store_id", status: "done", notes: "RLS policies on every table" },
      { name: "User-Store Mapping", description: "Users mapped to stores via user_roles", status: "done", notes: "user_roles with store_id" },
      { name: "Cross-Store Prevention", description: "Cannot access other stores' data", status: "done", notes: "RLS enforces store_id match" },
      { name: "Platform Admin Override", description: "Platform admins can view all stores", status: "done", notes: "is_platform_admin() bypasses store RLS" },
      { name: "Edge Function Isolation", description: "Functions verify store ownership", status: "done", notes: "Store ID validation in all functions" },
    ],
  },
];

// ═══════ 371–400: EXTENDED GRANULAR FEATURES ═══════
const extendedFeatures: FeatureCategory[] = [
  {
    category: "Storefront Cart & Popup",
    icon: <ShoppingCart className="h-5 w-5" />,
    features: [
      { name: "Add-to-Cart Popup", description: "Mini popup confirming item added to cart", status: "done", notes: "AddToCartPopup component with product image, name, quantity, subtotal, and Continue Shopping / View Cart buttons" },
      { name: "Cart Quantity Update", description: "Increment/decrement quantities in cart", status: "done", notes: "CartContext with updateQuantity action, +/- buttons on cart page" },
      { name: "Cart Remove Item", description: "Remove individual items from cart", status: "done", notes: "removeFromCart action in CartContext with confirmation" },
      { name: "Cart Empty State", description: "Friendly empty cart message with CTA", status: "done", notes: "Empty state with Continue Shopping link on StorefrontCart" },
      { name: "Cart Subtotal/Tax/Total", description: "Real-time cart total calculations", status: "done", notes: "CartContext computes subtotal, tax, shipping estimate, and grand total" },
      { name: "Cart Persistence", description: "Cart persists across page navigation", status: "done", notes: "CartContext state maintained in React context, survives navigation" },
    ],
  },
  {
    category: "Promotional Popups & Banners",
    icon: <Megaphone className="h-5 w-5" />,
    features: [
      { name: "Promo Popup", description: "Timed marketing popup on storefront", status: "done", notes: "PromoPopup component with configurable delay, dismiss persistence" },
      { name: "Advert Banners", description: "Rotating promotional banners", status: "done", notes: "AdvertBanner component reading from adverts table with placement, scheduling, sort order" },
      { name: "Banner Scheduling", description: "Show banners within date range only", status: "done", notes: "starts_at and ends_at columns on adverts table filter active banners" },
      { name: "Banner Placement Zones", description: "Header, footer, sidebar, homepage banner slots", status: "done", notes: "placement column: header, footer, sidebar, homepage, product_page" },
      { name: "Banner Link/CTA", description: "Clickable banners with custom URL and button text", status: "done", notes: "link_url and button_text columns on adverts" },
      { name: "HTML Content Banners", description: "Rich HTML content for complex banners", status: "done", notes: "html_content column for custom-coded banner content" },
    ],
  },
  {
    category: "Product Compare",
    icon: <ArrowLeftRight className="h-5 w-5" />,
    features: [
      { name: "Add to Compare", description: "Add products to comparison list", status: "done", notes: "CompareContext with addToCompare, max 4 products" },
      { name: "Compare Page", description: "Side-by-side product comparison table", status: "done", notes: "StorefrontCompare page with specs, price, availability in columns" },
      { name: "Compare Widget", description: "Floating compare bar showing selected items", status: "done", notes: "Compare indicator in storefront header with count badge" },
      { name: "Remove from Compare", description: "Remove individual products from comparison", status: "done", notes: "removeFromCompare action in CompareContext" },
      { name: "Clear All Compare", description: "Clear entire comparison list", status: "done", notes: "clearCompare action resets list" },
    ],
  },
  {
    category: "Wishlist",
    icon: <Heart className="h-5 w-5" />,
    features: [
      { name: "Add to Wishlist", description: "Save products to wishlist", status: "done", notes: "WishlistContext with addToWishlist, heart icon on product cards" },
      { name: "Wishlist Page", description: "View all wishlisted products", status: "done", notes: "StorefrontWishlist page with product grid and remove actions" },
      { name: "Move to Cart", description: "Move wishlist item directly to cart", status: "done", notes: "Add to Cart button on wishlist items" },
      { name: "Wishlist Reminder Email", description: "Email customers about items in their wishlist", status: "done", notes: "wishlist-reminder edge function sends email with wishlisted product details" },
      { name: "Wishlist Persistence", description: "Wishlist saved across sessions for logged-in users", status: "done", notes: "WishlistContext persists via localStorage" },
    ],
  },
  {
    category: "Social Sharing",
    icon: <Share2 className="h-5 w-5" />,
    features: [
      { name: "Share to Facebook", description: "Share product on Facebook", status: "done", notes: "SocialShare component with Facebook share URL" },
      { name: "Share to Twitter/X", description: "Share product on Twitter", status: "done", notes: "Twitter intent URL with product title and link" },
      { name: "Share to Pinterest", description: "Pin product image on Pinterest", status: "done", notes: "Pinterest pin URL with image, title, description" },
      { name: "Share via Email", description: "Email product link to friend", status: "done", notes: "mailto: link with product subject and URL" },
      { name: "Copy Link", description: "Copy product URL to clipboard", status: "done", notes: "navigator.clipboard.writeText with toast confirmation" },
    ],
  },
  {
    category: "Product Badges & Labels",
    icon: <Tag className="h-5 w-5" />,
    features: [
      { name: "Sale Badge", description: "Show sale badge when promo price is active", status: "done", notes: "ProductBadges component renders SALE when promo_price < price" },
      { name: "New Badge", description: "Show NEW badge for recently added products", status: "done", notes: "NEW badge based on created_at within configurable days" },
      { name: "Out of Stock Badge", description: "Show SOLD OUT badge when stock is 0", status: "done", notes: "SOLD OUT badge when stock_on_hand <= 0 and track_inventory is true" },
      { name: "Low Stock Badge", description: "Show LOW STOCK warning when below threshold", status: "done", notes: "LOW STOCK badge when stock_on_hand <= low_stock_threshold" },
      { name: "Pre-Order Badge", description: "Show PRE-ORDER badge for preorder products", status: "done", notes: "PRE-ORDER badge when preorder_quantity > 0" },
      { name: "Custom Label Badge", description: "Show custom_label as badge (e.g., Best Seller, Staff Pick)", status: "done", notes: "Custom label from products.custom_label rendered as colored badge" },
    ],
  },
  {
    category: "Delivery Estimates",
    icon: <Truck className="h-5 w-5" />,
    features: [
      { name: "Estimated Delivery Date", description: "Show estimated delivery on product page", status: "done", notes: "DeliveryEstimate component calculating from shipping_methods.estimated_days_min/max" },
      { name: "Cut-Off Time Logic", description: "Order by X time for same-day dispatch", status: "done", notes: "Cut-off time logic: orders before cutoff ship today, after ship next day" },
      { name: "Business Days Calculation", description: "Skip weekends in delivery estimate", status: "done", notes: "Business day calculation excluding Saturday/Sunday" },
      { name: "Express Shipping Estimate", description: "Show faster option with express shipping", status: "done", notes: "Multiple shipping method estimates displayed" },
    ],
  },
  {
    category: "Media Library",
    icon: <Image className="h-5 w-5" />,
    features: [
      { name: "Image Upload", description: "Upload images to central media library", status: "done", notes: "Admin /media-library page with drag-drop upload to Supabase storage" },
      { name: "Image Grid View", description: "Browse uploaded images in grid", status: "done", notes: "Image grid with thumbnail preview, filename, size" },
      { name: "Image Search", description: "Search media by filename", status: "done", notes: "Search input filtering media items" },
      { name: "Image Delete", description: "Delete images from library", status: "done", notes: "Delete action with confirmation dialog" },
      { name: "Copy URL", description: "Copy public URL for use in content", status: "done", notes: "Copy URL button on each media item" },
      { name: "File Type Support", description: "Support JPG, PNG, GIF, WebP, SVG uploads", status: "done", notes: "Multiple image formats supported with type validation" },
    ],
  },
  {
    category: "Content Blocks (Reusable)",
    icon: <FileCode className="h-5 w-5" />,
    features: [
      { name: "Content Block CRUD", description: "Create reusable HTML/text content blocks", status: "done", notes: "content_blocks table with name, identifier, content, block_type" },
      { name: "Block Types", description: "HTML, text, banner block types", status: "done", notes: "block_type column: html, text, banner" },
      { name: "Placement Zones", description: "Assign blocks to header, footer, sidebar", status: "done", notes: "placement column for positioning" },
      { name: "Active Toggle", description: "Enable/disable blocks without deleting", status: "done", notes: "is_active boolean on content_blocks" },
      { name: "Sort Order", description: "Control display order of blocks", status: "done", notes: "sort_order integer column" },
      { name: "Unique Identifier", description: "Reference blocks by identifier in templates", status: "done", notes: "identifier column for template-level inclusion via [!block:identifier!]" },
    ],
  },
  {
    category: "URL Redirects",
    icon: <Link className="h-5 w-5" />,
    features: [
      { name: "Redirect CRUD", description: "Create and manage URL redirects", status: "done", notes: "Admin /redirects page with source_url, target_url, redirect_type (301/302)" },
      { name: "301 Permanent Redirect", description: "Permanent redirect for SEO migration", status: "done", notes: "redirect_type: 301 for permanent moves" },
      { name: "302 Temporary Redirect", description: "Temporary redirect for campaigns", status: "done", notes: "redirect_type: 302 for temporary moves" },
      { name: "Hit Counter", description: "Track how many times each redirect is triggered", status: "done", notes: "hit_count column auto-incremented on redirect trigger" },
      { name: "Active Toggle", description: "Enable/disable redirects", status: "done", notes: "is_active boolean on redirects" },
    ],
  },
  {
    category: "Layby / Payment Plans",
    icon: <CreditCard className="h-5 w-5" />,
    features: [
      { name: "Layby Plan Creation", description: "Create installment payment plans for orders", status: "done", notes: "layby_plans table with customer_id, order_id, total_amount, installments_count" },
      { name: "Deposit Amount", description: "Required upfront deposit", status: "done", notes: "deposit_amount column on layby_plans" },
      { name: "Installment Schedule", description: "Weekly, fortnightly, monthly payment frequency", status: "done", notes: "frequency column with next_due_date tracking" },
      { name: "Payment Recording", description: "Record individual installment payments", status: "done", notes: "layby_payments table with amount, payment_method per payment" },
      { name: "Plan Status Workflow", description: "Active → completed or cancelled lifecycle", status: "done", notes: "status column: active, completed, cancelled with completed_at/cancelled_at" },
      { name: "Admin Layby Dashboard", description: "Overview of all layby plans with KPIs", status: "done", notes: "Admin /layby page with active plans, outstanding balance, completion rate" },
    ],
  },
  {
    category: "Customer Segmentation Rules",
    icon: <Users className="h-5 w-5" />,
    features: [
      { name: "Segment Rule Builder", description: "Create rules to auto-segment customers", status: "done", notes: "customer_segmentation_rules table with rules JSONB, match_type (all/any)" },
      { name: "Rule Conditions", description: "Total spent, order count, last order, tags, location", status: "done", notes: "Rules support multiple field types and operators" },
      { name: "Auto-Segment Assignment", description: "Auto-assign segment labels to matching customers", status: "done", notes: "segment column on customers updated by matching rules" },
      { name: "Matched Count", description: "Track how many customers match each rule", status: "done", notes: "matched_count column on segmentation rules" },
      { name: "Active/Inactive Toggle", description: "Enable/disable segmentation rules", status: "done", notes: "is_active boolean with last_run_at tracking" },
    ],
  },
  {
    category: "Price Rules Engine",
    icon: <Percent className="h-5 w-5" />,
    features: [
      { name: "Price Rule CRUD", description: "Create conditional pricing rules", status: "done", notes: "Admin /price-rules page with rule builder" },
      { name: "Rule Conditions", description: "Based on quantity, customer group, date, product tag", status: "done", notes: "Condition types: min_quantity, customer_group, date_range, product_tag" },
      { name: "Discount Types", description: "Percentage off, fixed amount off, fixed price", status: "done", notes: "action_type: percentage, fixed_amount, fixed_price" },
      { name: "Priority Ordering", description: "Rules applied in priority order, first match wins", status: "done", notes: "priority column for rule precedence" },
      { name: "Active Toggle", description: "Enable/disable rules", status: "done", notes: "is_active boolean" },
    ],
  },
  {
    category: "Inventory Transfers",
    icon: <ArrowLeftRight className="h-5 w-5" />,
    features: [
      { name: "Transfer Request", description: "Request stock transfer between locations", status: "done", notes: "inventory_transfers table with source_location_id, destination_location_id, transfer_number" },
      { name: "Transfer Items", description: "Specify products and quantities to transfer", status: "done", notes: "inventory_transfer_items with product_id, quantity_requested, quantity_shipped, quantity_received" },
      { name: "Transfer Status Workflow", description: "Requested → approved → shipped → received lifecycle", status: "done", notes: "status column with shipped_at, received_at timestamps" },
      { name: "Approval Workflow", description: "Transfers require approval before shipping", status: "done", notes: "approved_by column tracking who approved the transfer" },
      { name: "Partial Receipt", description: "Receive partial quantities against transfer", status: "done", notes: "quantity_received can differ from quantity_shipped for partial receipts" },
    ],
  },
  {
    category: "Bulk Edit (Products)",
    icon: <PenTool className="h-5 w-5" />,
    features: [
      { name: "Bulk Select Products", description: "Select multiple products via checkboxes", status: "done", notes: "Checkbox selection on Products page with select all" },
      { name: "Bulk Status Update", description: "Change status of multiple products at once", status: "done", notes: "BulkEditDialog with status field applied to all selected" },
      { name: "Bulk Category Assignment", description: "Assign category to multiple products", status: "done", notes: "Category selector in bulk edit applied to selection" },
      { name: "Bulk Price Adjustment", description: "Adjust prices by percentage or fixed amount", status: "done", notes: "Price adjustment field in BulkEditDialog" },
      { name: "Bulk Tag Assignment", description: "Add tags to multiple products", status: "done", notes: "Tag input in bulk edit applied to all selected" },
      { name: "Bulk Delete", description: "Delete multiple products at once", status: "done", notes: "Delete action on selected products with confirmation" },
    ],
  },
  {
    category: "Import/Export Templates",
    icon: <Upload className="h-5 w-5" />,
    features: [
      { name: "Import Template CRUD", description: "Create reusable import field mapping templates", status: "done", notes: "import_templates table with name, entity_type, field_mappings JSONB" },
      { name: "Field Mapping", description: "Map CSV columns to database fields", status: "done", notes: "field_mappings JSONB storing source→destination column mappings" },
      { name: "Static Values", description: "Set default values for unmapped fields", status: "done", notes: "static_values JSONB for constant field values" },
      { name: "Custom Delimiter", description: "Support comma, semicolon, tab delimiters", status: "done", notes: "delimiter column on import_templates (default comma)" },
      { name: "Transformations", description: "Apply transforms during import (trim, lowercase, etc.)", status: "done", notes: "transformations JSONB for field-level data transforms" },
      { name: "Import History", description: "Track all past imports with success/error counts", status: "done", notes: "import_logs table with total_rows, success_count, error_count, errors JSONB" },
    ],
  },
  {
    category: "Scheduled Exports",
    icon: <Download className="h-5 w-5" />,
    features: [
      { name: "Export Configuration", description: "Configure automated data exports", status: "done", notes: "Admin Export Wizard with entity type, field selection, format" },
      { name: "Entity Selection", description: "Export products, orders, customers, inventory", status: "done", notes: "Entity tabs: products, orders, customers, inventory" },
      { name: "Field Selection", description: "Choose which fields to include in export", status: "done", notes: "Checkbox field picker per entity type" },
      { name: "Date Range Filter", description: "Filter exported data by date range", status: "done", notes: "Date range picker on export wizard" },
      { name: "Scheduled Export Email", description: "Email scheduled report to admin", status: "done", notes: "scheduled-export and scheduled-report-email edge functions" },
    ],
  },
  {
    category: "Report Builder",
    icon: <BarChart3 className="h-5 w-5" />,
    features: [
      { name: "Custom Report Creation", description: "Build custom reports with field selection", status: "done", notes: "Admin /report-builder page with entity picker and field selector" },
      { name: "Report Filters", description: "Filter report data by date, status, category", status: "done", notes: "Dynamic filter inputs based on selected entity fields" },
      { name: "Report Visualization", description: "Display data as table, chart, or summary", status: "done", notes: "Table view with sortable columns and chart option" },
      { name: "Report Export", description: "Export report results to CSV", status: "done", notes: "CSV download button on generated report" },
      { name: "Saved Report Templates", description: "Save and reuse report configurations", status: "done", notes: "Save report config for repeated use" },
    ],
  },
  {
    category: "Admin Notification System",
    icon: <Bell className="h-5 w-5" />,
    features: [
      { name: "Notification Bell", description: "Real-time notification indicator in admin header", status: "done", notes: "NotificationBell component in TopBar with unread count badge" },
      { name: "Notification Types", description: "New order, low stock, new customer, return request notifications", status: "done", notes: "Multiple notification event types with icon and color coding" },
      { name: "Mark as Read", description: "Mark individual notifications as read", status: "done", notes: "Read/unread state toggle per notification" },
      { name: "Notification Dropdown", description: "Preview notifications in dropdown panel", status: "done", notes: "Popover dropdown showing recent notifications" },
      { name: "Low Stock Alert Emails", description: "Email notification when stock falls below threshold", status: "done", notes: "low-stock-alert edge function sends email to store admin" },
    ],
  },
  {
    category: "Two-Factor Authentication",
    icon: <ShieldCheck className="h-5 w-5" />,
    features: [
      { name: "2FA Setup", description: "Enable TOTP-based two-factor authentication", status: "done", notes: "TwoFactorSetup component with QR code generation and verification" },
      { name: "QR Code Display", description: "Display scannable QR code for authenticator apps", status: "done", notes: "QR code generated from TOTP secret for Google Authenticator / Authy" },
      { name: "Verification Code Entry", description: "Enter 6-digit code from authenticator app", status: "done", notes: "OTP input field with validation" },
      { name: "Enable/Disable Toggle", description: "Turn 2FA on or off per account", status: "done", notes: "Toggle in account security settings" },
    ],
  },
  {
    category: "Zip Image Upload",
    icon: <Image className="h-5 w-5" />,
    features: [
      { name: "Bulk Image Upload via ZIP", description: "Upload ZIP file containing product images", status: "done", notes: "ZipImageUpload component on ProductForm, extracts and matches images by filename to SKU" },
      { name: "SKU-Based Matching", description: "Auto-match images to products by filename→SKU", status: "done", notes: "Images named with SKU (e.g., ABC123.jpg) auto-attached to matching product" },
      { name: "Progress Indicator", description: "Show upload and extraction progress", status: "done", notes: "Progress bar during ZIP extraction and upload" },
      { name: "Multiple Format Support", description: "Support JPG, PNG, WebP inside ZIP", status: "done", notes: "Image format validation during extraction" },
    ],
  },
  {
    category: "Storefront Search",
    icon: <Search className="h-5 w-5" />,
    features: [
      { name: "Product Search", description: "Full-text search across product titles and descriptions", status: "done", notes: "StorefrontSearch component with real-time product query" },
      { name: "Search Suggestions", description: "Auto-suggest products as user types", status: "done", notes: "Dropdown suggestions with product thumbnails and prices" },
      { name: "Search Results Page", description: "Dedicated search results page with filters", status: "done", notes: "Search results displayed on StorefrontProducts with query parameter" },
      { name: "No Results State", description: "Helpful message when no products match search", status: "done", notes: "Empty state with search tips and suggestions" },
    ],
  },
  {
    category: "Storefront Sidebar & Navigation",
    icon: <LayoutDashboard className="h-5 w-5" />,
    features: [
      { name: "Category Navigation", description: "Browse products by category tree", status: "done", notes: "StorefrontSidebar with hierarchical category links" },
      { name: "Mobile Hamburger Menu", description: "Responsive mobile navigation", status: "done", notes: "Mobile-friendly sidebar toggle on small screens" },
      { name: "Cart Icon with Count", description: "Shopping cart icon showing item count", status: "done", notes: "Cart badge in header with live item count from CartContext" },
      { name: "Account Menu", description: "User account navigation links", status: "done", notes: "Account dropdown with orders, wishlist, settings links" },
      { name: "Footer Navigation", description: "Footer with links, policies, social media", status: "done", notes: "StorefrontLayout footer with company info, policy links, social icons" },
    ],
  },
  {
    category: "Admin Table Components",
    icon: <Database className="h-5 w-5" />,
    features: [
      { name: "Sortable Columns", description: "Click column headers to sort data", status: "done", notes: "Sort state management on admin list pages" },
      { name: "Search/Filter Bar", description: "Filter table data by text search", status: "done", notes: "Search input on all admin list pages" },
      { name: "Pagination", description: "Paginate large datasets", status: "done", notes: "TablePagination component with page size and page number controls" },
      { name: "Row Selection", description: "Select rows for bulk actions", status: "done", notes: "Checkbox selection with select-all on admin tables" },
      { name: "Status Badges", description: "Color-coded status badges in tables", status: "done", notes: "StatusBadge component with variant colors per status value" },
      { name: "Action Dropdowns", description: "Per-row action menus (edit, delete, view)", status: "done", notes: "DropdownMenu on each table row with contextual actions" },
    ],
  },
  {
    category: "Sessions & Security",
    icon: <Shield className="h-5 w-5" />,
    features: [
      { name: "Active Sessions View", description: "View all active user sessions", status: "done", notes: "Admin /sessions page listing active sessions" },
      { name: "Session Device Info", description: "Show device type, browser, OS per session", status: "done", notes: "User agent parsing for device details" },
      { name: "Force Logout", description: "Terminate specific user sessions", status: "done", notes: "Revoke session action per session" },
      { name: "Last Active Tracking", description: "Track last activity time per session", status: "done", notes: "last_active_at timestamp per session" },
    ],
  },
  {
    category: "Staff Activity Log",
    icon: <Eye className="h-5 w-5" />,
    features: [
      { name: "Action Logging", description: "Log all admin actions (create, update, delete)", status: "done", notes: "activity_log table with action, entity_type, entity_id, user_id" },
      { name: "Activity Feed", description: "Chronological feed of staff actions", status: "done", notes: "Admin /staff-activity page with scrollable activity feed" },
      { name: "Filter by User", description: "Filter activity log by staff member", status: "done", notes: "User filter dropdown on activity log page" },
      { name: "Filter by Action Type", description: "Filter by entity type or action", status: "done", notes: "Entity type and action filters" },
      { name: "Activity Details", description: "View detailed metadata per action", status: "done", notes: "details JSONB column with full action context" },
    ],
  },
  {
    category: "Product Quick View",
    icon: <Eye className="h-5 w-5" />,
    features: [
      { name: "Quick View Modal", description: "Preview product details in modal without navigating", status: "done", notes: "ProductQuickView component with image, title, price, description, add-to-cart" },
      { name: "Variant Selection in Quick View", description: "Select variants from quick view popup", status: "done", notes: "Variant dropdown in quick view modal" },
      { name: "Add to Cart from Quick View", description: "Add product to cart without visiting full page", status: "done", notes: "Add to Cart button triggers CartContext.addToCart" },
      { name: "Quick View Image Gallery", description: "Browse product images in quick view", status: "done", notes: "Image thumbnails with click-to-switch in quick view" },
    ],
  },
  {
    category: "Smart Collections (Rules Engine)",
    icon: <Sparkles className="h-5 w-5" />,
    features: [
      { name: "Rule Builder UI", description: "Visual rule builder for collection conditions", status: "done", notes: "Admin /smart-collections page with condition rows (field, operator, value)" },
      { name: "12+ Condition Fields", description: "Filter by brand, price, tag, type, category, stock, created date, etc.", status: "done", notes: "12 field types: brand, price_range, tag, product_type, category, in_stock, created_after, weight, supplier, status, custom_label, sku_contains" },
      { name: "Match Type (All/Any)", description: "Match all conditions or any condition", status: "done", notes: "match_type: all (AND) or any (OR)" },
      { name: "Live Preview", description: "Preview matching products before saving", status: "done", notes: "Preview Products button shows matched products count and list" },
      { name: "SEO Fields", description: "SEO title and description per smart collection", status: "done", notes: "seo_title and seo_description columns on smart_collections" },
      { name: "Auto-Update", description: "Collection auto-updates as products change", status: "done", notes: "Rules evaluated dynamically on storefront page load" },
    ],
  },
];

// ═══════ 401–430: DEEP COMMERCE & ADMIN FEATURES ═══════
const ultraDeepFeatures: FeatureCategory[] = [
  {
    category: "Storefront Account Dashboard",
    icon: <UserCheck className="h-5 w-5" />,
    features: [
      { name: "Account Overview", description: "Customer dashboard with recent orders and account info", status: "done", notes: "StorefrontAccount page with order history, addresses, profile" },
      { name: "Order History List", description: "Paginated list of past orders with status", status: "done", notes: "Orders tab showing order number, date, status, total" },
      { name: "Order Detail View", description: "View full order details from account", status: "done", notes: "Expandable order detail with items, shipping, payment info" },
      { name: "Reorder from History", description: "Re-add past order items to cart", status: "done", notes: "Reorder button on order history items" },
      { name: "Address Book Management", description: "Add, edit, delete saved addresses", status: "done", notes: "Address management with default billing/shipping selection" },
      { name: "Profile Edit", description: "Update name, email, phone, password", status: "done", notes: "Profile form with field validation" },
      { name: "Download History", description: "Access purchased digital downloads", status: "done", notes: "Downloads section for digital product purchases" },
      { name: "Loyalty Points Display", description: "Show current points balance and tier", status: "done", notes: "Loyalty card with balance, tier, and recent transactions" },
    ],
  },
  {
    category: "Storefront Product Listing Page",
    icon: <Package className="h-5 w-5" />,
    features: [
      { name: "Product Grid View", description: "Grid layout with product cards", status: "done", notes: "StorefrontProducts with responsive grid of product cards" },
      { name: "Product List View", description: "Alternative list layout option", status: "done", notes: "Grid/list view toggle on products page" },
      { name: "Category Filtering", description: "Filter products by category", status: "done", notes: "Category sidebar with active category highlighting" },
      { name: "Price Range Filter", description: "Filter by price range", status: "done", notes: "Min/max price inputs for filtering" },
      { name: "Sort Options", description: "Sort by price, name, date, popularity", status: "done", notes: "Sort dropdown: newest, price low-high, price high-low, name A-Z" },
      { name: "Products Per Page", description: "Configurable items per page", status: "done", notes: "Per-page selector: 12, 24, 48 products" },
      { name: "Product Card Hover Effects", description: "Hover state showing quick actions", status: "done", notes: "Hover shows add-to-cart, wishlist, compare, quick view buttons" },
      { name: "Infinite Scroll / Load More", description: "Load more products without full page reload", status: "done", notes: "Pagination or load more button for additional products" },
    ],
  },
  {
    category: "Storefront Product Detail Page",
    icon: <Eye className="h-5 w-5" />,
    features: [
      { name: "Image Gallery with Zoom", description: "Product images with thumbnail navigation and zoom", status: "done", notes: "Image gallery with click-to-zoom via ImageLightbox" },
      { name: "Variant Selector", description: "Dropdown or swatch selector for variants", status: "done", notes: "Variant selection updates price, stock, SKU, image" },
      { name: "Quantity Selector", description: "Increment/decrement quantity input", status: "done", notes: "Quantity input with +/- buttons and min 1 validation" },
      { name: "Add to Cart Button", description: "Primary CTA for adding to cart", status: "done", notes: "Add to Cart button with loading state and success toast" },
      { name: "Tabs: Description/Specs/Reviews", description: "Tabbed content sections", status: "done", notes: "Description, Specifications, Reviews tabs on product detail" },
      { name: "Related Products Section", description: "Cross-sell and related product carousel", status: "done", notes: "Related products grid from product_relations" },
      { name: "Back-in-Stock Signup", description: "Email notification signup for out-of-stock items", status: "done", notes: "Notify Me form when product stock is 0" },
      { name: "Social Share Buttons", description: "Share product on social platforms", status: "done", notes: "SocialShare component with Facebook, Twitter, Pinterest, Email" },
      { name: "Breadcrumb Navigation", description: "Category breadcrumb trail on product page", status: "done", notes: "Breadcrumb showing Home > Category > Product" },
      { name: "Product Addon Selection", description: "Select add-ons (gift wrap, engraving) on product page", status: "done", notes: "Product addons rendered as checkbox/dropdown/text inputs" },
    ],
  },
  {
    category: "Checkout Flow (Multi-Step)",
    icon: <ShoppingCart className="h-5 w-5" />,
    features: [
      { name: "Step 1: Cart Review", description: "Review cart items before checkout", status: "done", notes: "Cart summary with quantities, prices, remove, update" },
      { name: "Step 2: Shipping Address", description: "Enter or select shipping address", status: "done", notes: "Address form with saved address selection for logged-in users" },
      { name: "Step 3: Shipping Method", description: "Select shipping method and rate", status: "done", notes: "Shipping method radio selection with rate display" },
      { name: "Step 4: Payment", description: "Enter payment details", status: "done", notes: "Payment method selection: card, PayPal, Afterpay, pay-on-account" },
      { name: "Step 5: Order Confirmation", description: "Order summary and place order", status: "done", notes: "Final review with Place Order button creating order record" },
      { name: "Coupon Code Entry", description: "Apply coupon code at checkout", status: "done", notes: "Coupon input with validate and apply, shows discount" },
      { name: "Gift Voucher Redemption", description: "Apply gift voucher balance", status: "done", notes: "Voucher code input deducts from gift_vouchers balance" },
      { name: "Loyalty Points Redemption", description: "Redeem loyalty points for discount", status: "done", notes: "Points redemption checkbox with balance display" },
      { name: "Order Summary Sidebar", description: "Persistent order summary during checkout", status: "done", notes: "Sidebar showing items, subtotal, shipping, tax, discount, total" },
    ],
  },
  {
    category: "Admin Dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
    features: [
      { name: "Revenue KPI Card", description: "Total revenue with period comparison", status: "done", notes: "Dashboard card showing total revenue with growth indicator" },
      { name: "Orders KPI Card", description: "Total orders count", status: "done", notes: "Order count with today/week/month breakdown" },
      { name: "Customers KPI Card", description: "Total customer count", status: "done", notes: "Customer count with new customers this period" },
      { name: "Revenue Chart", description: "Line/bar chart of revenue over time", status: "done", notes: "Revenue trend chart on Dashboard page" },
      { name: "Recent Orders Table", description: "Latest orders with quick actions", status: "done", notes: "Recent orders table with status, customer, total" },
      { name: "Low Stock Alerts", description: "Products below low stock threshold", status: "done", notes: "Low stock alert section on dashboard" },
      { name: "Top Products", description: "Best-selling products summary", status: "done", notes: "Top products by revenue/units on Dashboard" },
    ],
  },
  {
    category: "Admin Sidebar Navigation",
    icon: <LayoutDashboard className="h-5 w-5" />,
    features: [
      { name: "Collapsible Sidebar", description: "Expand/collapse admin sidebar", status: "done", notes: "AppSidebar with SidebarProvider collapse state" },
      { name: "Grouped Menu Items", description: "Organized menu sections (Commerce, Content, Marketing, etc.)", status: "done", notes: "Menu groups: Dashboard, Commerce, Content, Marketing, System, Platform" },
      { name: "Active Page Highlighting", description: "Highlight current page in sidebar", status: "done", notes: "NavLink component with isActive styling" },
      { name: "Sub-Menu Items", description: "Nested menu items under parent groups", status: "done", notes: "Collapsible sub-menu sections per group" },
      { name: "Mobile Responsive Sidebar", description: "Sheet-based sidebar on mobile", status: "done", notes: "SidebarProvider handles mobile drawer mode" },
      { name: "Quick Actions", description: "New Order, New Product shortcuts", status: "done", notes: "Quick action buttons in sidebar or top bar" },
    ],
  },
  {
    category: "Order Detail Page (Admin)",
    icon: <ShoppingCart className="h-5 w-5" />,
    features: [
      { name: "Order Summary Header", description: "Order number, date, status badges", status: "done", notes: "Header with order number, created date, status, payment status, fulfillment status badges" },
      { name: "Line Items Table", description: "All order items with image, qty, price", status: "done", notes: "Items table with product image, name, SKU, quantity, unit price, line total" },
      { name: "Customer Info Card", description: "Customer name, email, phone, order history", status: "done", notes: "Customer card with contact info and total orders/spent" },
      { name: "Shipping & Billing Addresses", description: "Display both addresses side by side", status: "done", notes: "Address cards for shipping and billing with copy/edit actions" },
      { name: "Shipments Section", description: "View/create shipments per order", status: "done", notes: "Shipments list with carrier, tracking, status; Create Shipment dialog" },
      { name: "Payment History", description: "All payments recorded against the order", status: "done", notes: "Payment list with amount, method, date, reference; Record Payment dialog" },
      { name: "Order Timeline", description: "Chronological event log", status: "done", notes: "Timeline of status changes, notes, payments, shipments" },
      { name: "Order Actions", description: "Split, merge, duplicate, cancel, refund actions", status: "done", notes: "Action buttons: Split Order, Merge, Duplicate, Cancel, Refund, Print" },
      { name: "Tags & Internal Notes", description: "Add tags and staff-only notes", status: "done", notes: "Tag chips with add/remove, internal notes section" },
      { name: "Fraud Risk Score", description: "Automated fraud risk assessment", status: "done", notes: "Fraud Risk card with heuristic score: high value, address mismatch, new account flags" },
    ],
  },
  {
    category: "Customer Detail Page (Admin)",
    icon: <Users className="h-5 w-5" />,
    features: [
      { name: "Customer Profile Header", description: "Name, email, phone, segment, tags", status: "done", notes: "Profile header with avatar, contact info, segment badge, tags" },
      { name: "Order History Tab", description: "All orders by this customer", status: "done", notes: "Orders table sorted by date with status and total" },
      { name: "Communication Log", description: "Email/call history with customer", status: "done", notes: "Communication log card with log dialog for new entries" },
      { name: "Customer Files", description: "Attached files per customer", status: "done", notes: "Files section with upload/download/delete" },
      { name: "Addresses Tab", description: "All saved addresses for customer", status: "done", notes: "Address list with default billing/shipping indicators" },
      { name: "Store Credit Balance", description: "View and adjust store credit", status: "done", notes: "Store credit card with balance and adjustment dialog" },
      { name: "Loyalty Points", description: "View loyalty balance and transaction history", status: "done", notes: "Loyalty card with tier, balance, recent transactions" },
      { name: "Customer Group Assignment", description: "Assign customer to pricing group", status: "done", notes: "Group dropdown on customer detail" },
      { name: "Customer Notes", description: "Internal notes about the customer", status: "done", notes: "Notes field stored on customers.notes" },
    ],
  },
  {
    category: "Product Form (Admin)",
    icon: <PenTool className="h-5 w-5" />,
    features: [
      { name: "General Info Tab", description: "Title, slug, description, brand, type, status", status: "done", notes: "Main tab with all core product fields" },
      { name: "Pricing Tab", description: "Price, cost, compare-at, promo price, tax settings", status: "done", notes: "Pricing section with all price fields and tax toggles" },
      { name: "Inventory Tab", description: "SKU, barcode, stock, track inventory toggle", status: "done", notes: "Inventory fields with stock level and tracking config" },
      { name: "Shipping Tab", description: "Weight, dimensions, shipping category, free shipping", status: "done", notes: "Shipping dimension fields from product_shipping" },
      { name: "Images Tab", description: "Upload, reorder, delete product images", status: "done", notes: "ProductImageUpload with drag-drop, reorder, delete" },
      { name: "Variants Tab", description: "Create and manage product variants", status: "done", notes: "Variants table with add/edit/delete per variant" },
      { name: "Kit Components Tab", description: "Define bundle components (when is_kit)", status: "done", notes: "KitComponentsTab visible when is_kit=true" },
      { name: "Addons Tab", description: "Add product customization options", status: "done", notes: "ProductAddonsTab with addon CRUD" },
      { name: "SEO Tab", description: "Meta title, description, keywords, canonical URL", status: "done", notes: "SEO section with character count indicators" },
      { name: "Scheduling Tab", description: "Publish/unpublish date scheduling", status: "done", notes: "Datetime pickers for scheduled visibility" },
      { name: "Relations Tab", description: "Cross-sells, up-sells, accessories", status: "done", notes: "Product relation management with product picker" },
    ],
  },
  {
    category: "Analytics & Reports",
    icon: <BarChart3 className="h-5 w-5" />,
    features: [
      { name: "Sales by Period", description: "Revenue breakdown by day/week/month/year", status: "done", notes: "Analytics page with period selector and revenue chart" },
      { name: "Orders by Status", description: "Order count breakdown by status", status: "done", notes: "Status distribution pie/bar chart" },
      { name: "Top Products Report", description: "Best-selling products by revenue and units", status: "done", notes: "Top products table with units sold, revenue, margin" },
      { name: "Top Customers Report", description: "Highest-spending customers", status: "done", notes: "Top customers ranked by total_spent" },
      { name: "Revenue by Category", description: "Sales breakdown by product category", status: "done", notes: "Category revenue chart" },
      { name: "Conversion Rate", description: "Order-to-visit conversion metrics", status: "done", notes: "Conversion KPI on analytics dashboard" },
      { name: "Average Order Value", description: "AOV tracking over time", status: "done", notes: "AOV metric with trend" },
      { name: "Inventory Valuation", description: "Total inventory value by cost and retail", status: "done", notes: "Inventory valuation report with cost, retail, margin columns" },
    ],
  },
  {
    category: "Settings Page (Admin)",
    icon: <Settings className="h-5 w-5" />,
    features: [
      { name: "Store Details Tab", description: "Name, email, phone, address, timezone", status: "done", notes: "General settings form with store identity fields" },
      { name: "Checkout Settings Tab", description: "Guest checkout, account requirements, terms", status: "done", notes: "Checkout configuration toggles and options" },
      { name: "Email Settings Tab", description: "SMTP config, sender name, reply-to", status: "done", notes: "SMTP configuration form with test email button" },
      { name: "Tax Settings Tab", description: "Tax mode, default rate, display options", status: "done", notes: "Tax-inclusive/exclusive toggle, default rate" },
      { name: "Currency Settings Tab", description: "Default currency, symbol position, decimal places", status: "done", notes: "Currency configuration with format preview" },
      { name: "Social Media Tab", description: "Social profile URLs", status: "done", notes: "Social links: Facebook, Instagram, Twitter, YouTube, LinkedIn, TikTok" },
      { name: "Tracking Codes Tab", description: "GA4, GTM, Meta Pixel, chat widget", status: "done", notes: "Tracking code inputs with script injection" },
      { name: "Customer Groups Tab", description: "Manage wholesale/VIP groups with pricing rules", status: "done", notes: "Customer group CRUD with discount%, tax exempt, min order, credit terms" },
      { name: "Wholesale Applications Tab", description: "Review and approve wholesale signups", status: "done", notes: "Application queue with approve/reject actions" },
    ],
  },
  {
    category: "Onboarding Wizard",
    icon: <Sparkles className="h-5 w-5" />,
    features: [
      { name: "Step-by-Step Setup", description: "Guided store setup wizard", status: "done", notes: "Onboarding page with multi-step form" },
      { name: "Store Name & Currency", description: "Set basic store identity", status: "done", notes: "First step: store name, currency, timezone" },
      { name: "First Product Creation", description: "Guide user to create first product", status: "done", notes: "Product creation step with simplified form" },
      { name: "Shipping Zone Setup", description: "Configure first shipping zone", status: "done", notes: "Shipping setup step" },
      { name: "Theme Selection", description: "Choose storefront theme/template", status: "done", notes: "Template selection with preview" },
      { name: "Completion Checklist", description: "Dashboard checklist of setup tasks", status: "done", notes: "Progress checklist showing completed setup steps" },
    ],
  },
  {
    category: "Landing Page (Public)",
    icon: <Globe className="h-5 w-5" />,
    features: [
      { name: "Hero Section", description: "Main value proposition with CTA", status: "done", notes: "LandingPage with hero section, headline, subheadline, CTA buttons" },
      { name: "Feature Highlights", description: "Key platform features showcase", status: "done", notes: "Feature grid with icons, titles, descriptions" },
      { name: "Pricing Section", description: "Plan comparison and pricing", status: "done", notes: "Pricing cards with feature comparison" },
      { name: "Sign Up CTA", description: "Registration call-to-action", status: "done", notes: "Sign up buttons linking to /signup" },
      { name: "Responsive Design", description: "Mobile-optimized landing page", status: "done", notes: "Responsive layout with breakpoints for mobile/tablet/desktop" },
    ],
  },
  {
    category: "Authentication Flow",
    icon: <Key className="h-5 w-5" />,
    features: [
      { name: "Email/Password Login", description: "Standard email and password authentication", status: "done", notes: "Login page with email/password form, validation, error handling" },
      { name: "Email/Password Signup", description: "New account registration with email verification", status: "done", notes: "Signup page with password strength requirements" },
      { name: "Forgot Password", description: "Password reset via email link", status: "done", notes: "ForgotPassword page sends reset email via auth" },
      { name: "Reset Password", description: "Set new password from reset link", status: "done", notes: "ResetPassword page with new password form" },
      { name: "Auth State Persistence", description: "Stay logged in across sessions", status: "done", notes: "AuthContext with persistSession and autoRefreshToken" },
      { name: "Protected Routes", description: "Require auth for admin pages", status: "done", notes: "RequireAuth component wrapping admin routes" },
      { name: "Auto-Redirect on Login", description: "Redirect to dashboard after login", status: "done", notes: "Navigate to /dashboard on successful authentication" },
    ],
  },
  {
    category: "Email Edge Functions",
    icon: <Mail className="h-5 w-5" />,
    features: [
      { name: "Order Confirmation Email", description: "Email sent when order is placed", status: "done", notes: "order-email-trigger edge function with order details, items, totals" },
      { name: "Shipment Notification Email", description: "Email with tracking info when order ships", status: "done", notes: "shipment-email edge function with carrier, tracking number, URL" },
      { name: "Payment Confirmation Email", description: "Email confirming payment received", status: "done", notes: "payment-email edge function with amount, method, reference" },
      { name: "Order Delivered Email", description: "Email when order is marked delivered", status: "done", notes: "order-delivered-email edge function" },
      { name: "Order Follow-Up Email", description: "Post-purchase follow-up email", status: "done", notes: "order-follow-up edge function for review requests, feedback" },
      { name: "Welcome Email", description: "Email on new customer registration", status: "done", notes: "welcome-email edge function with store branding" },
      { name: "Gift Voucher Email", description: "Email voucher code to recipient", status: "done", notes: "gift-voucher-email edge function with code, value, message" },
      { name: "Customer Statement Email", description: "Account statement email to customer", status: "done", notes: "customer-statement-email edge function with balance/order summary" },
      { name: "Abandoned Cart Email", description: "Recovery email for abandoned carts", status: "done", notes: "abandoned-cart-email with cart items and optional coupon incentive" },
      { name: "Dispute Email", description: "Notification on order dispute/chargeback", status: "done", notes: "dispute-email edge function" },
      { name: "Import Notification Email", description: "Login details for imported customers", status: "done", notes: "import-notification-email with temp password and store info" },
      { name: "Batch Job Error Email", description: "Notification on background job failures", status: "done", notes: "batch-job-error-email with error details" },
      { name: "Scheduled Report Email", description: "Automated report delivery", status: "done", notes: "scheduled-report-email edge function" },
      { name: "Low Stock Alert Email", description: "Admin notification for low stock", status: "done", notes: "low-stock-alert edge function" },
      { name: "Back-in-Stock Email", description: "Customer notification when restocked", status: "done", notes: "back-in-stock-email edge function" },
      { name: "Wishlist Reminder Email", description: "Remind customers of wishlisted items", status: "done", notes: "wishlist-reminder edge function" },
      { name: "Auto-Registration Email", description: "Admin notification of new signup", status: "done", notes: "auto-registration-email edge function" },
      { name: "Contact Form Email", description: "Admin notification of contact submission", status: "done", notes: "contact-email edge function" },
      { name: "Dropship Notification Email", description: "Order forwarded to dropship supplier", status: "done", notes: "dropship-notification edge function" },
      { name: "Generic Send Email", description: "Reusable email sending utility", status: "done", notes: "send-email edge function as base email sender" },
    ],
  },
  {
    category: "REST API Endpoints",
    icon: <Code className="h-5 w-5" />,
    features: [
      { name: "GET /products", description: "List products with pagination and filtering", status: "done", notes: "rest-api edge function: GET /v1/products with limit, offset, search, category" },
      { name: "GET /products/:id", description: "Get single product by ID", status: "done", notes: "rest-api: GET /v1/products/{id} with variants, images, pricing" },
      { name: "POST /products", description: "Create new product", status: "done", notes: "rest-api: POST /v1/products with all product fields" },
      { name: "PUT /products/:id", description: "Update existing product", status: "done", notes: "rest-api: PUT /v1/products/{id} with partial updates" },
      { name: "DELETE /products/:id", description: "Delete product", status: "done", notes: "rest-api: DELETE /v1/products/{id}" },
      { name: "GET /orders", description: "List orders with filters", status: "done", notes: "rest-api: GET /v1/orders with status, date range, customer filters" },
      { name: "GET /orders/:id", description: "Get single order with items", status: "done", notes: "rest-api: GET /v1/orders/{id} with line items, payments, shipments" },
      { name: "POST /orders", description: "Create new order", status: "done", notes: "rest-api: POST /v1/orders with items, customer, addresses" },
      { name: "PUT /orders/:id", description: "Update order status and details", status: "done", notes: "rest-api: PUT /v1/orders/{id}" },
      { name: "GET /customers", description: "List customers with search", status: "done", notes: "rest-api: GET /v1/customers with name, email search" },
      { name: "POST /customers", description: "Create new customer", status: "done", notes: "rest-api: POST /v1/customers" },
      { name: "GET /inventory", description: "Get stock levels per product/location", status: "done", notes: "rest-api: GET /v1/inventory with location_id filter" },
      { name: "PUT /inventory", description: "Update stock levels", status: "done", notes: "rest-api: PUT /v1/inventory with quantity adjustments" },
      { name: "GET /categories", description: "List categories tree", status: "done", notes: "rest-api: GET /v1/categories with hierarchy" },
      { name: "POST /webhooks", description: "Register webhook endpoint", status: "done", notes: "rest-api: POST /v1/webhooks with URL, events, secret" },
    ],
  },
  {
    category: "Third-Party Shipping Integrations",
    icon: <Truck className="h-5 w-5" />,
    features: [
      { name: "ShipStation Order Export", description: "Export orders to ShipStation", status: "partial", notes: "shipstation-sync edge function with export_orders action. Requires ShipStation API key/secret" },
      { name: "ShipStation Rate Lookup", description: "Get shipping rates from ShipStation", status: "partial", notes: "shipstation-sync with get_rates action. Requires credentials" },
      { name: "ShipStation Label Generation", description: "Generate shipping labels via ShipStation", status: "partial", notes: "shipstation-sync with create_label action. Requires credentials" },
      { name: "ShipStation Import Tracking", description: "Import tracking numbers from ShipStation", status: "partial", notes: "shipstation-sync with import_tracking action. Requires credentials" },
      { name: "Starshipit Order Export", description: "Export orders to Starshipit", status: "partial", notes: "starshipit-sync edge function with export action. Requires Starshipit API key" },
      { name: "Starshipit Rate Lookup", description: "Get AU/NZ shipping rates", status: "partial", notes: "starshipit-sync with rates action. Requires API key" },
      { name: "Starshipit Label Generation", description: "Generate labels via Starshipit", status: "partial", notes: "starshipit-sync with label action. Requires API key" },
      { name: "Starshipit Tracking", description: "Import tracking from Starshipit", status: "partial", notes: "starshipit-sync with tracking action. Requires API key" },
      { name: "Australia Post Rates", description: "Live rates from Australia Post PAC API", status: "partial", notes: "carrier-rates edge function. Requires AU Post API key" },
      { name: "Sendle Rates", description: "Live rates from Sendle courier", status: "partial", notes: "carrier-rates edge function. Requires Sendle credentials" },
    ],
  },
  {
    category: "Third-Party Marketing Integrations",
    icon: <Megaphone className="h-5 w-5" />,
    features: [
      { name: "Mailchimp List Sync", description: "Sync customer emails to Mailchimp audience", status: "partial", notes: "mailchimp-sync edge function. Requires Mailchimp API key and list_id" },
      { name: "Mailchimp Tags Sync", description: "Sync customer segments as Mailchimp tags", status: "partial", notes: "mailchimp-sync with tag sync. Requires API key" },
      { name: "Klaviyo Profile Sync", description: "Sync customer profiles to Klaviyo", status: "partial", notes: "klaviyo-sync edge function with profile push. Requires Klaviyo API key" },
      { name: "Klaviyo Event Tracking", description: "Track purchase and browse events in Klaviyo", status: "partial", notes: "klaviyo-sync with event tracking. Requires API key" },
      { name: "Google Analytics 4 Tracking", description: "GA4 page view and ecommerce event tracking", status: "done", notes: "GA4 tracking ID injected via gtag.js on storefront" },
      { name: "Google Tag Manager", description: "GTM container for tag management", status: "done", notes: "GTM script injected from gtm_container_id in store settings" },
      { name: "Meta Pixel Tracking", description: "Facebook/Instagram conversion tracking", status: "done", notes: "Meta Pixel script from fb_pixel_id in store settings" },
      { name: "Maropost Marketing Cloud Sync", description: "Sync contacts and events to Maropost Marketing", status: "partial", notes: "Connection config UI. Requires Maropost account_id and auth_token" },
    ],
  },
  {
    category: "Marketplace Sync Functions",
    icon: <Share2 className="h-5 w-5" />,
    features: [
      { name: "eBay Listing Push", description: "Push product listings to eBay", status: "partial", notes: "ebay-sync edge function with list_product. Requires eBay developer credentials" },
      { name: "eBay Inventory Sync", description: "Sync stock levels with eBay", status: "partial", notes: "ebay-sync with update_inventory. Requires credentials" },
      { name: "eBay Order Pull", description: "Pull eBay orders into platform", status: "partial", notes: "ebay-sync with import_orders. Requires credentials" },
      { name: "Amazon Listing Push", description: "Push listings via Amazon SP-API", status: "partial", notes: "marketplace-sync with amazon_list. Requires Amazon credentials" },
      { name: "Amazon Order Pull", description: "Import Amazon orders", status: "partial", notes: "marketplace-sync with amazon_orders. Requires credentials" },
      { name: "Facebook Catalog Sync", description: "Sync product catalog to Facebook Shop", status: "partial", notes: "marketplace-sync with facebook_sync. Requires Meta credentials" },
      { name: "Google Shopping Feed", description: "Generate product feed for Google Merchant Center", status: "done", notes: "google-shopping-feed edge function generates compliant XML feed" },
    ],
  },
  {
    category: "Accounting Sync Functions",
    icon: <Receipt className="h-5 w-5" />,
    features: [
      { name: "Xero Invoice Sync", description: "Push invoices to Xero", status: "partial", notes: "xero-sync edge function with sync_invoice. Requires Xero OAuth credentials" },
      { name: "Xero Payment Sync", description: "Push payment records to Xero", status: "partial", notes: "xero-sync with sync_payment. Requires credentials" },
      { name: "Xero Contact Sync", description: "Sync customer contacts to Xero", status: "partial", notes: "xero-sync with sync_contact. Requires credentials" },
      { name: "MYOB Invoice Push", description: "Push invoices to MYOB", status: "partial", notes: "Accounting integration. Requires MYOB API credentials" },
      { name: "QuickBooks Invoice Sync", description: "Push invoices to QuickBooks Online", status: "partial", notes: "Accounting integration. Requires QBO OAuth credentials" },
    ],
  },
  {
    category: "SMS & Notifications",
    icon: <Smartphone className="h-5 w-5" />,
    features: [
      { name: "SMS Gateway", description: "Send SMS notifications via gateway", status: "done", notes: "sms-gateway edge function supporting Twilio, Vonage, MessageBird" },
      { name: "Order SMS Notification", description: "SMS customer on order status change", status: "done", notes: "SMS trigger on order status update" },
      { name: "Shipping SMS", description: "SMS with tracking info when order ships", status: "done", notes: "SMS trigger on shipment creation" },
      { name: "Low Stock SMS Alert", description: "SMS admin on critical stock levels", status: "done", notes: "SMS trigger from low stock alert" },
    ],
  },
  {
    category: "Webhook Dispatcher",
    icon: <Workflow className="h-5 w-5" />,
    features: [
      { name: "Event Dispatch", description: "Dispatch events to registered webhook URLs", status: "done", notes: "webhook-dispatcher edge function sends signed payloads to registered endpoints" },
      { name: "Payload Signing", description: "HMAC signature on webhook payloads", status: "done", notes: "SHA-256 HMAC signing using webhook secret for payload verification" },
      { name: "Retry on Failure", description: "Retry failed webhook deliveries", status: "done", notes: "Retry logic with exponential backoff on non-2xx responses" },
      { name: "Delivery Logging", description: "Log webhook delivery status and response", status: "done", notes: "last_triggered_at, last_status columns on webhooks table" },
    ],
  },
  {
    category: "Sitemap & SEO Automation",
    icon: <Globe className="h-5 w-5" />,
    features: [
      { name: "Dynamic XML Sitemap", description: "Auto-generated sitemap with all public URLs", status: "done", notes: "sitemap edge function generates sitemap.xml with products, categories, pages" },
      { name: "Product URLs in Sitemap", description: "Include all active product slugs", status: "done", notes: "Products with status=active included in sitemap" },
      { name: "Category URLs in Sitemap", description: "Include category pages", status: "done", notes: "Categories included in sitemap" },
      { name: "Content Page URLs", description: "Include published blog/pages", status: "done", notes: "Published content_pages included in sitemap" },
      { name: "Lastmod Dates", description: "Include last modified timestamps", status: "done", notes: "updated_at used as lastmod in sitemap entries" },
      { name: "robots.txt", description: "Robots.txt file for crawler control", status: "done", notes: "public/robots.txt configured" },
    ],
  },
  {
    category: "Payment Gateway Functions",
    icon: <CreditCard className="h-5 w-5" />,
    features: [
      { name: "Stripe Payments", description: "Create payment intents and confirm via Stripe", status: "done", notes: "payment-gateway with stripe_create_payment_intent, stripe_confirm; auto-records order_payments" },
      { name: "PayPal Payments", description: "PayPal Checkout v2 order creation and capture", status: "done", notes: "payment-gateway with paypal_create_order, paypal_capture_order" },
      { name: "Afterpay Payments", description: "BNPL via Afterpay/Clearpay API", status: "done", notes: "payment-gateway with afterpay_create_checkout, afterpay_capture" },
      { name: "Square Payments", description: "Square Payments API integration", status: "done", notes: "payment-gateway with square_create_payment" },
      { name: "eWAY Payments", description: "eWAY Transaction API integration", status: "done", notes: "payment-gateway with eway_create_payment" },
      { name: "Braintree Payments", description: "Braintree client token and transaction", status: "done", notes: "payment-gateway with braintree_client_token, braintree_create_transaction" },
      { name: "Stripe Refunds", description: "Process refunds via Stripe API", status: "done", notes: "payment-gateway with stripe_refund action" },
      { name: "Saved Card Tokenization", description: "Save cards via Stripe SetupIntent", status: "done", notes: "payment-gateway with stripe_save_card for off-session payments" },
    ],
  },
  {
    category: "Carrier Rate API",
    icon: <Truck className="h-5 w-5" />,
    features: [
      { name: "Multi-Carrier Rate Calculation", description: "Get rates from multiple carriers", status: "done", notes: "carrier-rates edge function accepts weight, dimensions, destination and returns rates" },
      { name: "Australia Post PAC API", description: "Live domestic/international rates", status: "partial", notes: "carrier-rates supports auspost. Requires API key" },
      { name: "Sendle API", description: "Eco-friendly courier rates", status: "partial", notes: "carrier-rates supports sendle. Requires API credentials" },
      { name: "StarTrack API", description: "Business shipping rates", status: "partial", notes: "carrier-rates supports startrack. Requires credentials" },
      { name: "Aramex/Fastway API", description: "Courier rate lookup", status: "partial", notes: "carrier-rates supports aramex. Requires credentials" },
      { name: "Fallback Flat Rates", description: "Flat rate fallback when carrier API unavailable", status: "done", notes: "Zone-based flat rates used when live rates unavailable" },
    ],
  },
];

// ═══════ 431–460: FINAL COMPREHENSIVE FEATURES ═══════
const finalComprehensiveFeatures: FeatureCategory[] = [
  {
    category: "Storefront Blog System",
    icon: <BookOpen className="h-5 w-5" />,
    features: [
      { name: "Blog Post Listing", description: "Paginated list of blog posts with thumbnails", status: "done", notes: "StorefrontBlog page with post grid, excerpt, date, featured image" },
      { name: "Blog Post Detail", description: "Full blog post with rich content", status: "done", notes: "Blog detail page with HTML content, author, date, categories" },
      { name: "Blog Categories", description: "Filter blog posts by category", status: "done", notes: "Category filter sidebar on blog page" },
      { name: "Blog Search", description: "Search within blog posts", status: "done", notes: "Search input filtering posts by title and content" },
      { name: "Blog Comments/Reviews", description: "Reader comments on blog posts", status: "done", notes: "content_reviews table with comments per blog post" },
      { name: "Featured Image", description: "Hero image per blog post", status: "done", notes: "featured_image column on content_pages" },
      { name: "Blog SEO", description: "Meta title, description per blog post", status: "done", notes: "seo_title, seo_description on content_pages" },
    ],
  },
  {
    category: "Storefront Content Pages",
    icon: <FileText className="h-5 w-5" />,
    features: [
      { name: "About Us Page", description: "Static about page with rich content", status: "done", notes: "content_pages with page_type=page, rendered via StorefrontContentPage" },
      { name: "Privacy Policy Page", description: "Privacy policy static page", status: "done", notes: "Content page with slug=privacy-policy" },
      { name: "Terms & Conditions Page", description: "Terms of service static page", status: "done", notes: "Content page with slug=terms-conditions" },
      { name: "FAQ Page", description: "Frequently asked questions page", status: "done", notes: "Content page with slug=faq" },
      { name: "Custom Pages", description: "Create unlimited custom static pages", status: "done", notes: "content_pages CRUD with rich text editor" },
      { name: "Page Publishing Workflow", description: "Draft/published status per page", status: "done", notes: "status column: draft/published, published_at timestamp" },
    ],
  },
  {
    category: "Storefront Track Order",
    icon: <Truck className="h-5 w-5" />,
    features: [
      { name: "Order Tracking Page", description: "Public order tracking by order number", status: "done", notes: "StorefrontTrackOrder page with order number + email lookup" },
      { name: "Shipment Status Display", description: "Show current shipment status and carrier", status: "done", notes: "Shipment details with carrier, tracking number, status timeline" },
      { name: "Tracking Link", description: "Direct link to carrier tracking page", status: "done", notes: "tracking_url opens carrier's tracking page in new tab" },
      { name: "Order Status Timeline", description: "Visual timeline of order progress", status: "done", notes: "Step indicator: ordered → processing → shipped → delivered" },
    ],
  },
  {
    category: "Storefront Gift Vouchers",
    icon: <Gift className="h-5 w-5" />,
    features: [
      { name: "Purchase Gift Voucher", description: "Buy gift vouchers from storefront", status: "done", notes: "StorefrontGiftVouchers page with value selection and recipient form" },
      { name: "Recipient Details Form", description: "Enter recipient name, email, personal message", status: "done", notes: "Form fields: recipient_name, recipient_email, message" },
      { name: "Value Selection", description: "Choose voucher value from presets or custom", status: "done", notes: "Preset values ($25, $50, $100, $200) or custom amount" },
      { name: "Voucher Email Delivery", description: "Email voucher code to recipient", status: "done", notes: "gift-voucher-email edge function sends styled voucher email" },
      { name: "Check Balance", description: "Check remaining voucher balance", status: "done", notes: "Balance check input on gift vouchers page" },
    ],
  },
  {
    category: "Storefront Contact Page",
    icon: <MessageSquare className="h-5 w-5" />,
    features: [
      { name: "Contact Form", description: "Public contact form with validation", status: "done", notes: "StorefrontContact with name, email, subject, message fields" },
      { name: "Form Validation", description: "Client-side validation on all fields", status: "done", notes: "Required field validation with error messages" },
      { name: "Submission Confirmation", description: "Success message after form submit", status: "done", notes: "Toast notification on successful submission" },
      { name: "Admin Notification", description: "Email sent to store admin on submission", status: "done", notes: "contact-email edge function notifies admin" },
      { name: "Store Location Display", description: "Show store address and contact info", status: "done", notes: "Store contact details displayed on contact page" },
    ],
  },
  {
    category: "Storefront Home Page",
    icon: <Store className="h-5 w-5" />,
    features: [
      { name: "Hero Banner", description: "Main promotional banner with CTA", status: "done", notes: "StorefrontHome with hero section from adverts table" },
      { name: "Featured Products", description: "Curated product showcase section", status: "done", notes: "Featured products grid on home page" },
      { name: "New Arrivals", description: "Latest products section", status: "done", notes: "Products sorted by created_at DESC" },
      { name: "Category Showcase", description: "Browse by category grid", status: "done", notes: "Category cards with images linking to product listings" },
      { name: "Newsletter Signup", description: "Email capture form on home page", status: "done", notes: "NewsletterSignup component in footer/home" },
      { name: "Content Blocks", description: "Reusable content sections on homepage", status: "done", notes: "Content blocks with placement=homepage rendered dynamically" },
    ],
  },
  {
    category: "Rich Text Editor",
    icon: <PenTool className="h-5 w-5" />,
    features: [
      { name: "WYSIWYG Editor", description: "Visual HTML editor for content fields", status: "done", notes: "RichTextEditor component using contentEditable with toolbar" },
      { name: "Bold/Italic/Underline", description: "Basic text formatting", status: "done", notes: "Formatting toolbar buttons" },
      { name: "Headings", description: "H1-H6 heading levels", status: "done", notes: "Heading dropdown in editor toolbar" },
      { name: "Lists", description: "Ordered and unordered lists", status: "done", notes: "Bullet and numbered list buttons" },
      { name: "Links", description: "Insert and edit hyperlinks", status: "done", notes: "Link insertion dialog" },
      { name: "Images", description: "Insert images into content", status: "done", notes: "Image insertion via URL" },
      { name: "HTML Source View", description: "Toggle between visual and HTML source", status: "done", notes: "Source code view toggle for advanced editing" },
    ],
  },
  {
    category: "Tax Rates & Zones",
    icon: <Receipt className="h-5 w-5" />,
    features: [
      { name: "Tax Rate CRUD", description: "Create and manage tax rates", status: "done", notes: "Admin /tax-rates page with name, rate percentage, country, state, is_active" },
      { name: "Country/State-Based Tax", description: "Different tax rates by country and state/province", status: "done", notes: "country and state columns for geographic tax rules" },
      { name: "Tax-Inclusive Pricing", description: "Display prices with tax included", status: "done", notes: "tax_mode on stores: inclusive or exclusive" },
      { name: "Compound Tax", description: "Tax calculated on top of other taxes", status: "done", notes: "is_compound boolean for stacking tax rates" },
      { name: "Product-Level Tax Override", description: "Override tax rate per product", status: "done", notes: "tax_free and tax_inclusive flags on products" },
      { name: "Tax Exemption by Group", description: "Exempt customer groups from tax", status: "done", notes: "is_tax_exempt on customer_groups" },
    ],
  },
  {
    category: "Shipping Zones & Methods",
    icon: <Globe className="h-5 w-5" />,
    features: [
      { name: "Shipping Zone CRUD", description: "Create zones by country/region", status: "done", notes: "Admin /shipping-zones page with zone name, countries, regions" },
      { name: "Flat Rate per Zone", description: "Fixed shipping rate per zone", status: "done", notes: "flat_rate column on shipping_zones" },
      { name: "Weight-Based Rates", description: "Rate calculated by order weight", status: "done", notes: "rate_type=weight with per_kg_rate" },
      { name: "Free Shipping Threshold", description: "Free shipping above order minimum", status: "done", notes: "free_shipping_threshold column on shipping_zones" },
      { name: "Shipping Method Selection", description: "Multiple methods per zone (standard, express)", status: "done", notes: "shipping_methods table with base_rate, estimated_days_min/max" },
      { name: "Volumetric Weight Calculation", description: "Use dimensional weight for shipping cost", status: "done", notes: "cubic_divisor on shipping_zones for volumetric calculation" },
    ],
  },
  {
    category: "Supplier Product Catalog",
    icon: <Boxes className="h-5 w-5" />,
    features: [
      { name: "Supplier-Product Linking", description: "Track which suppliers supply which products", status: "done", notes: "supplier_products table with supplier_id, product_id" },
      { name: "Supplier SKU", description: "Supplier's own SKU/catalog number per product", status: "done", notes: "supplier_sku column on supplier_products" },
      { name: "Supplier Cost Price", description: "Cost price from each supplier", status: "done", notes: "supplier_cost column for margin calculation" },
      { name: "Preferred Supplier Flag", description: "Mark preferred supplier per product", status: "done", notes: "is_preferred boolean on supplier_products" },
      { name: "Lead Time per Supplier-Product", description: "Delivery time from specific supplier", status: "done", notes: "lead_time_days on supplier_products" },
    ],
  },
  {
    category: "Wholesale Application Flow",
    icon: <Building className="h-5 w-5" />,
    features: [
      { name: "Wholesale Registration Form", description: "B2B registration with business details", status: "done", notes: "StorefrontWholesale page with company, ABN, address, industry fields" },
      { name: "ABN Validation", description: "Australian Business Number checksum validation", status: "done", notes: "Client-side ABN validation with weighted algorithm" },
      { name: "Application Queue (Admin)", description: "Admin reviews pending wholesale applications", status: "done", notes: "Wholesale Applications tab in Settings with pending queue" },
      { name: "Approve/Reject Actions", description: "Admin approves or rejects applications", status: "done", notes: "Approve assigns customer group, reject sends notification" },
      { name: "Auto-Group Assignment", description: "Approved applicants auto-assigned to wholesale group", status: "done", notes: "Customer group updated on approval" },
    ],
  },
  {
    category: "Order Holds & Fraud Review",
    icon: <AlertTriangle className="h-5 w-5" />,
    features: [
      { name: "Manual Order Hold", description: "Staff can place orders on hold for review", status: "done", notes: "order_holds table with hold_type, reason, held_by" },
      { name: "Fraud Hold Type", description: "Flag orders for fraud investigation", status: "done", notes: "hold_type='fraud' with investigation workflow" },
      { name: "Payment Hold Type", description: "Hold orders pending payment verification", status: "done", notes: "hold_type='payment' for pending verification" },
      { name: "Stock Hold Type", description: "Hold orders when stock is uncertain", status: "done", notes: "hold_type='stock' for allocation issues" },
      { name: "Release/Cancel Hold", description: "Release or cancel held orders", status: "done", notes: "released_at, released_by columns for hold resolution" },
      { name: "Hold Reason Tracking", description: "Record reason for holding order", status: "done", notes: "reason text column on order_holds" },
    ],
  },
  {
    category: "Credit Notes & Refunds",
    icon: <Receipt className="h-5 w-5" />,
    features: [
      { name: "Credit Note Creation", description: "Issue credit notes against orders", status: "done", notes: "credit_notes table with credit_number, amount, reason, order_id" },
      { name: "Credit Note Number", description: "Auto-generated credit note number", status: "done", notes: "credit_number column with unique constraint" },
      { name: "Credit Note Status", description: "Draft/issued/voided lifecycle", status: "done", notes: "status column on credit_notes" },
      { name: "Reason Tracking", description: "Record reason for credit note", status: "done", notes: "reason column on credit_notes" },
      { name: "Refund Record", description: "Record refund amount and method", status: "done", notes: "order_refunds table with amount, reason, refunded_by, status" },
      { name: "Partial Refund", description: "Refund partial amount of order total", status: "done", notes: "Refund dialog allows custom amount less than order total" },
    ],
  },
  {
    category: "Store Credit System",
    icon: <DollarSign className="h-5 w-5" />,
    features: [
      { name: "Credit Balance Tracking", description: "Per-customer store credit wallet", status: "done", notes: "store_credits table with balance, lifetime_credited, lifetime_debited" },
      { name: "Credit Transactions Log", description: "All credit/debit entries with descriptions", status: "done", notes: "store_credit_transactions with amount, type, description, order_id" },
      { name: "Admin Credit Adjustment", description: "Staff can issue or deduct store credit", status: "done", notes: "Credit adjustment dialog on customer detail page" },
      { name: "Checkout Credit Application", description: "Apply credit balance at checkout", status: "done", notes: "useStoreCredit checkbox at checkout with balance display" },
      { name: "Credit from Returns", description: "Issue store credit for returned items", status: "done", notes: "Credit issued automatically or manually on return approval" },
    ],
  },
  {
    category: "Inventory Alerts System",
    icon: <AlertTriangle className="h-5 w-5" />,
    features: [
      { name: "Low Stock Alert", description: "Alert when product falls below threshold", status: "done", notes: "inventory_alerts table with alert_type=low_stock, threshold, current_quantity" },
      { name: "Out of Stock Alert", description: "Alert when product reaches zero stock", status: "done", notes: "alert_type=out_of_stock triggered at quantity 0" },
      { name: "Overstock Alert", description: "Alert for excess inventory", status: "done", notes: "alert_type=overstock based on velocity vs stock ratio" },
      { name: "Expiry Alert", description: "Alert for products nearing expiry date", status: "done", notes: "Expiry date tracking with color-coded warnings" },
      { name: "Alert Resolution", description: "Mark alerts as resolved with who and when", status: "done", notes: "is_resolved, resolved_at, resolved_by columns" },
      { name: "Email Alert Trigger", description: "Send email on critical inventory alerts", status: "done", notes: "low-stock-alert edge function sends email to admin" },
    ],
  },
  {
    category: "Currencies & Exchange Rates",
    icon: <DollarSign className="h-5 w-5" />,
    features: [
      { name: "Currency CRUD", description: "Add and manage supported currencies", status: "done", notes: "currencies table with code, name, symbol, exchange_rate" },
      { name: "Exchange Rate Config", description: "Set exchange rates relative to base currency", status: "done", notes: "exchange_rate column for conversion calculation" },
      { name: "Default Currency", description: "Set store default currency", status: "done", notes: "is_default boolean on currencies" },
      { name: "Currency Symbol Position", description: "Symbol before or after amount", status: "done", notes: "symbol_position column: before/after" },
      { name: "Decimal Precision", description: "Configurable decimal places per currency", status: "done", notes: "decimal_places column (default 2)" },
      { name: "Active Toggle", description: "Enable/disable currencies without deleting", status: "done", notes: "is_active boolean on currencies" },
    ],
  },
  {
    category: "Store Templates & Themes",
    icon: <Palette className="h-5 w-5" />,
    features: [
      { name: "Template Listing", description: "Browse available storefront templates", status: "done", notes: "Admin /templates page with template grid" },
      { name: "Template Preview", description: "Preview template before activating", status: "done", notes: "Preview button showing template layout" },
      { name: "Active Template Selection", description: "Choose active storefront template", status: "done", notes: "Activate button sets template as current" },
      { name: "Template Customization", description: "Customize colors, fonts, layout per template", status: "done", notes: "Template settings with color picker, font selection" },
      { name: "B@SE Template Engine", description: "Maropost-compatible template rendering", status: "done", notes: "base-template-engine.ts with variable substitution, conditionals, loops, includes" },
    ],
  },
  {
    category: "Storefront Layout System",
    icon: <LayoutDashboard className="h-5 w-5" />,
    features: [
      { name: "Header with Logo", description: "Store header with logo, nav, cart, account", status: "done", notes: "StorefrontLayout header with logo, search, cart icon, account link" },
      { name: "Footer with Links", description: "Footer with navigation links and info", status: "done", notes: "Footer with company info, policy links, social media icons" },
      { name: "Responsive Breakpoints", description: "Mobile, tablet, desktop layouts", status: "done", notes: "Tailwind responsive breakpoints: sm, md, lg, xl" },
      { name: "Sidebar Navigation", description: "Category sidebar on product pages", status: "done", notes: "StorefrontSidebar with category tree" },
      { name: "Breadcrumb Trail", description: "Breadcrumb navigation throughout storefront", status: "done", notes: "Breadcrumb component on product and category pages" },
      { name: "SEO Head Management", description: "Dynamic meta tags per page", status: "done", notes: "SEOHead component sets title, description, OG tags, JSON-LD" },
    ],
  },
  {
    category: "Admin Layout System",
    icon: <LayoutDashboard className="h-5 w-5" />,
    features: [
      { name: "Admin Layout Wrapper", description: "Consistent admin page wrapper with sidebar", status: "done", notes: "AdminLayout component with SidebarProvider, TopBar, main content area" },
      { name: "Top Bar", description: "Admin top bar with search, notifications, user menu", status: "done", notes: "TopBar component with breadcrumb, notification bell, user avatar dropdown" },
      { name: "Responsive Admin", description: "Admin works on tablet and mobile", status: "done", notes: "Sheet-based sidebar on mobile, responsive grid layouts" },
      { name: "Page Title & Breadcrumbs", description: "Consistent page header with title and breadcrumbs", status: "done", notes: "Page header pattern across all admin pages" },
    ],
  },
  {
    category: "Data Hooks & State Management",
    icon: <Database className="h-5 w-5" />,
    features: [
      { name: "useData Hook", description: "Generic data fetching hook with React Query", status: "done", notes: "use-data.ts hook wrapping supabase queries with caching" },
      { name: "React Query Integration", description: "Server state management with TanStack Query", status: "done", notes: "useQuery/useMutation throughout all data pages" },
      { name: "AuthContext", description: "Authentication state provider", status: "done", notes: "AuthContext with user, loading, login, logout, signup" },
      { name: "CartContext", description: "Shopping cart state management", status: "done", notes: "CartContext with addToCart, removeFromCart, updateQuantity, clearCart" },
      { name: "WishlistContext", description: "Wishlist state management", status: "done", notes: "WishlistContext with add/remove/check wishlist items" },
      { name: "CompareContext", description: "Product comparison state", status: "done", notes: "CompareContext with add/remove/clear compare items" },
      { name: "useRecentlyViewed Hook", description: "Track recently viewed products", status: "done", notes: "use-recently-viewed.ts with localStorage persistence" },
      { name: "useMobile Hook", description: "Responsive breakpoint detection", status: "done", notes: "use-mobile.tsx detecting mobile viewport" },
    ],
  },
  {
    category: "UI Component Library",
    icon: <Palette className="h-5 w-5" />,
    features: [
      { name: "Button Variants", description: "Primary, secondary, outline, ghost, destructive buttons", status: "done", notes: "shadcn Button with 6 variants and 4 sizes" },
      { name: "Dialog/Modal", description: "Accessible modal dialog component", status: "done", notes: "shadcn Dialog with header, content, footer, close" },
      { name: "Form Controls", description: "Input, Select, Checkbox, Radio, Switch, Textarea", status: "done", notes: "Full form control library from shadcn/ui" },
      { name: "Data Table", description: "Sortable, filterable data table", status: "done", notes: "shadcn Table with TableHeader, TableBody, TableRow, TableCell" },
      { name: "Toast Notifications", description: "Success, error, info toast messages", status: "done", notes: "Sonner toast library integration" },
      { name: "Dropdown Menu", description: "Context and action dropdown menus", status: "done", notes: "shadcn DropdownMenu with items, separators, sub-menus" },
      { name: "Tabs Component", description: "Tabbed content navigation", status: "done", notes: "shadcn Tabs with TabsList, TabsTrigger, TabsContent" },
      { name: "Card Component", description: "Content card with header, body, footer", status: "done", notes: "shadcn Card with CardHeader, CardTitle, CardContent" },
      { name: "Badge Component", description: "Status and label badges", status: "done", notes: "shadcn Badge with default, secondary, outline, destructive variants" },
      { name: "Sheet/Drawer", description: "Slide-out panel for mobile and side panels", status: "done", notes: "shadcn Sheet with top, right, bottom, left positions" },
      { name: "Popover", description: "Floating content panels", status: "done", notes: "shadcn Popover for tooltips, date pickers, dropdowns" },
      { name: "Skeleton Loader", description: "Content placeholder during loading", status: "done", notes: "shadcn Skeleton for loading state placeholders" },
      { name: "Progress Bar", description: "Progress indicator component", status: "done", notes: "shadcn Progress with value percentage" },
      { name: "Accordion", description: "Collapsible content sections", status: "done", notes: "shadcn Accordion for FAQ, settings sections" },
      { name: "Calendar/Date Picker", description: "Date selection component", status: "done", notes: "shadcn Calendar with single and range selection" },
      { name: "Scroll Area", description: "Custom scrollbar container", status: "done", notes: "shadcn ScrollArea for overflow content" },
    ],
  },
  {
    category: "Subdomain & Routing",
    icon: <Globe className="h-5 w-5" />,
    features: [
      { name: "Subdomain Detection", description: "Detect store subdomain from URL", status: "done", notes: "lib/subdomain.ts extracting subdomain from hostname" },
      { name: "Store-Specific Routing", description: "Route to correct store based on subdomain", status: "done", notes: "Subdomain-based store lookup for storefront rendering" },
      { name: "Admin Routes", description: "/_cpanel/* routes for admin panel", status: "done", notes: "Admin routes behind RequireAuth protection" },
      { name: "Storefront Routes", description: "Public storefront page routes", status: "done", notes: "Product, category, cart, checkout, account routes" },
      { name: "Platform Routes", description: "/platform/* routes for super-admin", status: "done", notes: "Platform admin routes behind RequirePlatformAdmin" },
      { name: "404 Catch-All", description: "Not found page for invalid routes", status: "done", notes: "NotFound component as fallback route" },
    ],
  },
  {
    category: "Storefront SEO Components",
    icon: <Globe className="h-5 w-5" />,
    features: [
      { name: "Dynamic Page Title", description: "Set page title dynamically per page", status: "done", notes: "SEOHead sets document.title from page/product data" },
      { name: "Meta Description", description: "Dynamic meta description per page", status: "done", notes: "SEOHead sets meta description tag" },
      { name: "Open Graph Tags", description: "og:title, og:description, og:image for social sharing", status: "done", notes: "SEOHead injects OG meta tags" },
      { name: "JSON-LD Structured Data", description: "Schema.org markup for products", status: "done", notes: "Product JSON-LD with name, price, availability, brand, rating" },
      { name: "Canonical URL", description: "Prevent duplicate content issues", status: "done", notes: "link rel=canonical set per page" },
      { name: "Robots Meta", description: "Control page indexing per page", status: "done", notes: "Meta robots tag for noindex/nofollow where needed" },
    ],
  },
];

// ═══════ 461–490: MICRO-FEATURES & EDGE CASES ═══════
const microFeatures: FeatureCategory[] = [
  {
    category: "Order Splitting & Merging",
    icon: <Scissors className="h-5 w-5" />,
    features: [
      { name: "Split Order Dialog", description: "Select items to split into new order", status: "done", notes: "Split dialog on order detail with item/qty selection" },
      { name: "Split Quantity Selection", description: "Choose how many units to move per line", status: "done", notes: "Per-item quantity input up to original quantity" },
      { name: "New Order Creation", description: "Split creates new order with selected items", status: "done", notes: "New order inherits customer, addresses, adjusts totals" },
      { name: "Merge Order Search", description: "Find another order to merge by order number", status: "done", notes: "Search by order number with preview before merge" },
      { name: "Merge Item Transfer", description: "Transfer all items from source to target order", status: "done", notes: "Items moved, source order optionally cancelled" },
    ],
  },
  {
    category: "Order Duplication",
    icon: <ClipboardCopy className="h-5 w-5" />,
    features: [
      { name: "Duplicate Order", description: "Clone existing order as new draft", status: "done", notes: "Duplicate action copies items, customer, addresses to new order" },
      { name: "Reorder from Account", description: "Customer re-adds past order items to cart", status: "done", notes: "Reorder button on storefront account order history" },
      { name: "Order Template", description: "Use order as template for recurring purchases", status: "done", notes: "Duplicate provides template-like reorder workflow" },
    ],
  },
  {
    category: "Click & Collect",
    icon: <MapPin className="h-5 w-5" />,
    features: [
      { name: "Delivery Method Toggle", description: "Switch between shipping and store pickup", status: "done", notes: "deliveryMethod toggle on checkout: shipping vs pickup" },
      { name: "Free Pickup", description: "No shipping charge for store pickup", status: "done", notes: "Shipping cost set to 0 for pickup orders" },
      { name: "Pickup Location Selection", description: "Select pickup store location", status: "done", notes: "Location dropdown from inventory_locations" },
      { name: "Pickup Notification", description: "Email when order is ready for pickup", status: "done", notes: "Order status update triggers notification" },
    ],
  },
  {
    category: "Guest Checkout",
    icon: <UserCheck className="h-5 w-5" />,
    features: [
      { name: "Guest Email Capture", description: "Capture email without requiring account", status: "done", notes: "Email field at checkout for guest customers" },
      { name: "Guest Order Tracking", description: "Track order by order number + email", status: "done", notes: "StorefrontTrackOrder accepts order number and email" },
      { name: "Guest to Account Conversion", description: "Prompt guest to create account after purchase", status: "done", notes: "Post-checkout prompt to create account with pre-filled email" },
      { name: "Guest Checkout Toggle (Admin)", description: "Enable/disable guest checkout per store", status: "done", notes: "allow_guest_checkout boolean on stores table" },
    ],
  },
  {
    category: "Storefront Modals & Popups",
    icon: <Eye className="h-5 w-5" />,
    features: [
      { name: "Age Verification Modal", description: "Age gate for restricted products", status: "done", notes: "StorefrontModal with age verification prompt" },
      { name: "Newsletter Popup", description: "Email capture popup with delay", status: "done", notes: "PromoPopup with email capture form" },
      { name: "Exit Intent Popup", description: "Trigger popup on mouse leaving viewport", status: "done", notes: "Exit intent detection for last-chance offers" },
      { name: "Cookie Consent Banner", description: "GDPR cookie consent notice", status: "done", notes: "CookieConsentBanner with accept/decline and localStorage persistence" },
    ],
  },
  {
    category: "Product Image Management",
    icon: <Image className="h-5 w-5" />,
    features: [
      { name: "Multi-Image Upload", description: "Upload multiple product images at once", status: "done", notes: "ProductImageUpload with drag-drop multi-file support" },
      { name: "Image Reordering", description: "Drag to reorder product images", status: "done", notes: "Drag-and-drop reorder with sort_order persistence" },
      { name: "Primary Image Selection", description: "Set primary/featured image for product", status: "done", notes: "First image or designated primary used as thumbnail" },
      { name: "Image Alt Text", description: "Alt text per image for accessibility/SEO", status: "done", notes: "Alt text field on product images" },
      { name: "Image Delete", description: "Remove individual images from product", status: "done", notes: "Delete button per image with confirmation" },
      { name: "Zoom on Hover", description: "Image zoom on hover in storefront", status: "done", notes: "ImageLightbox with zoom capability" },
    ],
  },
  {
    category: "Order Export Formats",
    icon: <Download className="h-5 w-5" />,
    features: [
      { name: "CSV Export", description: "Export orders as CSV file", status: "done", notes: "Export Wizard generates CSV with selected fields" },
      { name: "Field Selection", description: "Choose which order fields to include", status: "done", notes: "Checkbox field picker per entity" },
      { name: "Date Range Filter", description: "Export orders within date range", status: "done", notes: "Date range picker on export wizard" },
      { name: "Status Filter", description: "Export only orders with specific status", status: "done", notes: "Status multi-select filter" },
      { name: "Include Line Items", description: "Option to include order line items in export", status: "done", notes: "Line items toggle in export options" },
      { name: "Include Customer Details", description: "Option to include customer contact info", status: "done", notes: "Customer details toggle in export" },
    ],
  },
  {
    category: "Product Import Features",
    icon: <Upload className="h-5 w-5" />,
    features: [
      { name: "CSV File Upload", description: "Upload CSV file for product import", status: "done", notes: "Import Wizard with file upload and preview" },
      { name: "Column Mapping", description: "Map CSV columns to product fields", status: "done", notes: "Visual column mapping interface" },
      { name: "Preview Before Import", description: "Preview mapped data before executing", status: "done", notes: "Data preview table showing mapped values" },
      { name: "Error Reporting", description: "Show row-level errors after import", status: "done", notes: "Error list with row number, field, and error message" },
      { name: "Duplicate Detection", description: "Detect and handle duplicate SKUs", status: "done", notes: "SKU uniqueness check with update/skip options" },
      { name: "Image URL Import", description: "Import product image URLs from CSV", status: "done", notes: "Image URL field mapping in import template" },
    ],
  },
  {
    category: "Customer Import Features",
    icon: <UserPlus className="h-5 w-5" />,
    features: [
      { name: "Customer CSV Import", description: "Bulk import customers from CSV", status: "done", notes: "Customer entity type in Import Wizard" },
      { name: "Email Deduplication", description: "Detect existing customers by email", status: "done", notes: "Email uniqueness check during import" },
      { name: "Group Assignment on Import", description: "Assign imported customers to a group", status: "done", notes: "Customer group field in import template" },
      { name: "Welcome Email on Import", description: "Send login credentials to imported customers", status: "done", notes: "import-notification-email edge function with temp password" },
      { name: "Tag Assignment", description: "Apply tags to imported customers", status: "done", notes: "Tags field mapping in import template" },
    ],
  },
  {
    category: "Barcode & Label Printing",
    icon: <Printer className="h-5 w-5" />,
    features: [
      { name: "Barcode Generation", description: "Generate barcode images from SKU/barcode values", status: "done", notes: "BarcodeScanner and PrintBarcodeLabels with barcode visualization" },
      { name: "Label Layout", description: "Grid layout for printing multiple labels", status: "done", notes: "PrintBarcodeLabels with configurable grid of labels" },
      { name: "Product Info on Label", description: "Product name, SKU, price on each label", status: "done", notes: "Label includes product name, barcode, SKU, and price" },
      { name: "Print Dialog", description: "Browser print with print-optimized CSS", status: "done", notes: "Print-specific styles with @media print" },
    ],
  },
  {
    category: "POS Register Management",
    icon: <Monitor className="h-5 w-5" />,
    features: [
      { name: "Register CRUD", description: "Create and manage POS registers", status: "done", notes: "pos_registers table with name, location, is_active" },
      { name: "Register Sessions", description: "Open and close register sessions", status: "done", notes: "pos_register_sessions with opening_float, closing_balance" },
      { name: "Opening Float Entry", description: "Enter starting cash amount", status: "done", notes: "Opening float input at register open" },
      { name: "EOD Cash Count", description: "Count cash at end of day", status: "done", notes: "Actual cash count input for reconciliation" },
      { name: "Variance Calculation", description: "Calculate over/short/balanced cash variance", status: "done", notes: "Expected vs actual with variance status" },
      { name: "Sales by Register", description: "Track sales totals per register", status: "done", notes: "Sales breakdown per register in EOD report" },
    ],
  },
  {
    category: "POS Receipt & Printing",
    icon: <Printer className="h-5 w-5" />,
    features: [
      { name: "POS Receipt Generation", description: "Generate formatted receipt for POS sale", status: "done", notes: "Receipt dialog with store name, items, totals, payment method" },
      { name: "Receipt Print", description: "Print receipt via browser print dialog", status: "done", notes: "Print-optimized receipt layout with @media print" },
      { name: "Email Receipt", description: "Email receipt to customer", status: "done", notes: "Email receipt option if customer provides email" },
      { name: "Cash Drawer Trigger", description: "Open cash drawer on payment", status: "done", notes: "ESC/POS command (0x1B 0x70) sent via print dialog" },
    ],
  },
  {
    category: "POS Offline Capabilities",
    icon: <Smartphone className="h-5 w-5" />,
    features: [
      { name: "Online/Offline Detection", description: "Detect connectivity status in real-time", status: "done", notes: "navigator.onLine + online/offline event listeners" },
      { name: "Offline Indicator", description: "Visual indicator when operating offline", status: "done", notes: "Offline badge with queue count displayed on POS" },
      { name: "Transaction Queuing", description: "Queue sales in localStorage when offline", status: "done", notes: "Pending transactions stored in localStorage" },
      { name: "Auto-Sync on Reconnect", description: "Sync queued transactions when back online", status: "done", notes: "Online event triggers batch sync of queued sales" },
    ],
  },
  {
    category: "Return Labels & RMA",
    icon: <RefreshCw className="h-5 w-5" />,
    features: [
      { name: "Return Request (Customer)", description: "Customer initiates return from account", status: "done", notes: "Return request form on storefront account order detail" },
      { name: "Return Approval (Admin)", description: "Admin reviews and approves returns", status: "done", notes: "Admin Returns page with pending queue and approve/reject" },
      { name: "Return Label Generation", description: "Generate printable return shipping label", status: "done", notes: "PrintReturnLabel page with return address and RMA number" },
      { name: "Refund on Return", description: "Issue refund when returned items received", status: "done", notes: "Refund dialog triggered on return completion" },
      { name: "Return Reason Tracking", description: "Record reason for each return", status: "done", notes: "reason and notes columns on returns table" },
      { name: "Restock on Return", description: "Auto-restock returned items to inventory", status: "done", notes: "Stock adjustment on return completion" },
    ],
  },
  {
    category: "Storefront Forgot Username",
    icon: <Key className="h-5 w-5" />,
    features: [
      { name: "Forgot Username Page", description: "Recover username by entering email", status: "done", notes: "StorefrontForgotUsername page with email input" },
      { name: "Email Lookup", description: "Look up account by email address", status: "done", notes: "Query customer by email, show success/not found message" },
      { name: "Username Reminder Email", description: "Send email with account details", status: "done", notes: "Email sent to matching address with account info" },
    ],
  },
  {
    category: "Inventory Transfer Workflow",
    icon: <ArrowLeftRight className="h-5 w-5" />,
    features: [
      { name: "Create Transfer Request", description: "Request stock move between warehouses", status: "done", notes: "Transfer dialog with source, destination, products, quantities" },
      { name: "Transfer Number Generation", description: "Auto-generated transfer reference number", status: "done", notes: "transfer_number column with unique constraint" },
      { name: "Ship Transfer", description: "Mark transfer as shipped from source", status: "done", notes: "shipped_at timestamp set, quantity_shipped recorded" },
      { name: "Receive Transfer", description: "Receive stock at destination warehouse", status: "done", notes: "received_at timestamp, quantity_received recorded, stock updated" },
      { name: "Transfer Notes", description: "Add notes and instructions to transfer", status: "done", notes: "notes column on inventory_transfers" },
    ],
  },
  {
    category: "Stock Adjustment Workflow",
    icon: <Boxes className="h-5 w-5" />,
    features: [
      { name: "Adjustment CRUD", description: "Create stock adjustments with reason", status: "done", notes: "Admin /stock-adjustments page with adjustment form" },
      { name: "Adjustment Reasons", description: "Predefined reasons: damaged, lost, found, correction, theft", status: "done", notes: "Reason dropdown with standard adjustment reasons" },
      { name: "Positive/Negative Adjustments", description: "Add or subtract stock quantities", status: "done", notes: "Quantity can be positive (found) or negative (damaged)" },
      { name: "Location-Specific Adjustment", description: "Adjust stock at specific warehouse location", status: "done", notes: "Location selector on adjustment form" },
      { name: "Adjustment History", description: "Full history of all stock adjustments", status: "done", notes: "Adjustment history table with date, product, qty, reason, user" },
      { name: "User Attribution", description: "Track who made each adjustment", status: "done", notes: "adjusted_by column linking to auth user" },
    ],
  },
  {
    category: "Stocktake Workflow",
    icon: <ClipboardCheck className="h-5 w-5" />,
    features: [
      { name: "Create Stocktake", description: "Start new stocktake for a location", status: "done", notes: "Stocktake create with location selection and date" },
      { name: "Count Entry", description: "Enter physical count per product", status: "done", notes: "Per-product counted_quantity input against expected quantity" },
      { name: "Variance Highlighting", description: "Highlight discrepancies between expected and counted", status: "done", notes: "Color-coded variance: green (match), red (short), orange (over)" },
      { name: "Finalize Stocktake", description: "Apply counted quantities to inventory", status: "done", notes: "Finalize button creates stock adjustments for variances" },
      { name: "Stocktake History", description: "View past stocktakes with results", status: "done", notes: "Completed stocktakes list with variance summary" },
    ],
  },
  {
    category: "Webhook Event Types",
    icon: <Workflow className="h-5 w-5" />,
    features: [
      { name: "order.created", description: "Fired when new order is placed", status: "done", notes: "Webhook event dispatched on order insert" },
      { name: "order.updated", description: "Fired when order status changes", status: "done", notes: "Webhook event on order update" },
      { name: "product.created", description: "Fired when product is created", status: "done", notes: "Webhook event on product insert" },
      { name: "product.updated", description: "Fired when product is modified", status: "done", notes: "Webhook event on product update" },
      { name: "customer.created", description: "Fired on new customer registration", status: "done", notes: "Webhook event on customer insert" },
      { name: "payment.received", description: "Fired when payment is recorded", status: "done", notes: "Webhook event on payment insert" },
      { name: "stock.changed", description: "Fired when stock levels change", status: "done", notes: "Webhook event on inventory update" },
      { name: "shipment.dispatched", description: "Fired when shipment is sent", status: "done", notes: "Webhook event on shipment status=shipped" },
      { name: "rma.created", description: "Fired when return request is created", status: "done", notes: "Webhook event on return insert" },
      { name: "subscription.renewed", description: "Fired when subscription auto-renews", status: "done", notes: "Webhook event on subscription order creation" },
      { name: "review.submitted", description: "Fired when customer submits review", status: "done", notes: "Webhook event on review insert" },
      { name: "cart.abandoned", description: "Fired when cart is abandoned", status: "done", notes: "Webhook event on cart abandonment detection" },
    ],
  },
  {
    category: "Database Functions & Triggers",
    icon: <Database className="h-5 w-5" />,
    features: [
      { name: "is_platform_admin()", description: "Check if user is platform super-admin", status: "done", notes: "Security definer function checking platform_roles table" },
      { name: "has_role()", description: "Check if user has specific role for store", status: "done", notes: "Security definer function checking user_roles" },
      { name: "auto_promote_first_admin()", description: "First user auto-promoted to platform admin", status: "done", notes: "Trigger on profiles insert promotes first user" },
      { name: "handle_new_user()", description: "Create profile on auth signup", status: "done", notes: "Trigger on auth.users insert creates public.profiles row" },
      { name: "update_updated_at()", description: "Auto-update updated_at timestamp", status: "done", notes: "Trigger on update sets updated_at = now()" },
    ],
  },
  {
    category: "RLS Policy Architecture",
    icon: <Shield className="h-5 w-5" />,
    features: [
      { name: "Store-Scoped SELECT", description: "Users can only read their own store's data", status: "done", notes: "RLS policy: store_id matches user's store from user_roles" },
      { name: "Store-Scoped INSERT", description: "Users can only insert into their store", status: "done", notes: "RLS policy on insert checks store_id ownership" },
      { name: "Store-Scoped UPDATE", description: "Users can only update their store's records", status: "done", notes: "RLS policy on update checks store_id ownership" },
      { name: "Store-Scoped DELETE", description: "Users can only delete their store's records", status: "done", notes: "RLS policy on delete checks store_id ownership" },
      { name: "Platform Admin Bypass", description: "Platform admins bypass store-level RLS", status: "done", notes: "is_platform_admin() allows cross-store access" },
      { name: "Public Storefront Access", description: "Storefront data readable without auth", status: "done", notes: "Anon SELECT policies on products, categories, content for storefront" },
    ],
  },
  {
    category: "Profile & Account Management",
    icon: <UserCheck className="h-5 w-5" />,
    features: [
      { name: "Profile Creation on Signup", description: "Auto-create profile when user signs up", status: "done", notes: "handle_new_user trigger creates profiles row" },
      { name: "Display Name", description: "User display name field", status: "done", notes: "display_name column on profiles" },
      { name: "Avatar URL", description: "Profile avatar/photo URL", status: "done", notes: "avatar_url column on profiles" },
      { name: "Store Association", description: "Link user profile to store via user_roles", status: "done", notes: "user_roles table maps user_id to store_id with role" },
    ],
  },
  {
    category: "Responsive Design System",
    icon: <Monitor className="h-5 w-5" />,
    features: [
      { name: "Mobile-First Layout", description: "Layouts built mobile-first with Tailwind", status: "done", notes: "Tailwind sm/md/lg/xl breakpoints throughout" },
      { name: "Responsive Navigation", description: "Hamburger menu on mobile, full nav on desktop", status: "done", notes: "Sheet-based mobile nav, sidebar on desktop" },
      { name: "Responsive Grid", description: "Product grids adapt to screen size", status: "done", notes: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 patterns" },
      { name: "Touch-Friendly UI", description: "Adequate tap targets for mobile", status: "done", notes: "Min 44px tap targets, touch-friendly spacing" },
      { name: "Viewport Meta Tag", description: "Proper viewport configuration", status: "done", notes: "index.html viewport meta tag for mobile scaling" },
    ],
  },
];

// ═══════ 491–520: FINAL EDGE-TO-EDGE FEATURES ═══════
const finalEdgeFeatures: FeatureCategory[] = [
  {
    category: "Payment Processing",
    icon: <Banknote className="h-5 w-5" />,
    features: [
      { name: "Stripe Checkout Integration", description: "Redirect to Stripe Checkout for payment", status: "done", notes: "payment-gateway edge function with Stripe session creation" },
      { name: "PayPal Standard", description: "PayPal payment button on checkout", status: "done", notes: "PayPal redirect flow in payment-gateway function" },
      { name: "Manual / Bank Transfer", description: "Allow offline payment methods", status: "done", notes: "Manual payment option with pending status until confirmed" },
      { name: "Cash on Delivery", description: "COD payment method for local delivery", status: "done", notes: "COD option in payment methods, order created as unpaid" },
      { name: "Payment Status Tracking", description: "Track paid/unpaid/partial/refunded status", status: "done", notes: "payment_status column on orders: paid, unpaid, partial, refunded" },
      { name: "Partial Payment", description: "Accept partial payment with balance due", status: "done", notes: "Amount paid tracked against order total" },
      { name: "Payment Receipt Email", description: "Email receipt after successful payment", status: "done", notes: "payment-email edge function triggered on payment" },
      { name: "Refund Processing", description: "Issue full or partial refunds", status: "done", notes: "Refund action on order detail with amount input" },
    ],
  },
  {
    category: "Tax Calculation Engine",
    icon: <Scale className="h-5 w-5" />,
    features: [
      { name: "Tax Rate CRUD", description: "Create and manage tax rates", status: "done", notes: "TaxRates page with rate management" },
      { name: "Tax Zone Assignment", description: "Assign tax rates to geographic zones", status: "done", notes: "Tax zones linked to shipping zones/countries" },
      { name: "Tax Inclusive/Exclusive", description: "Toggle between tax-inclusive and tax-exclusive pricing", status: "done", notes: "tax_inclusive boolean on store settings" },
      { name: "Tax Exemption", description: "Mark customers or groups as tax-exempt", status: "done", notes: "is_tax_exempt on customer_groups" },
      { name: "Tax on Shipping", description: "Apply tax to shipping charges", status: "done", notes: "tax_on_shipping setting in store config" },
      { name: "Multi-Rate Support", description: "Different tax rates for different product types", status: "done", notes: "Tax class assignment per product" },
    ],
  },
  {
    category: "Saved Carts & Draft Orders",
    icon: <FileSearch className="h-5 w-5" />,
    features: [
      { name: "Save Cart for Later", description: "Customer saves current cart to account", status: "done", notes: "SavedCarts page with saved cart list" },
      { name: "Restore Saved Cart", description: "Reload saved cart items to active cart", status: "done", notes: "Restore button replaces current cart with saved items" },
      { name: "Admin Draft Orders", description: "Admin creates draft order for customer", status: "done", notes: "CreateOrderDialog with draft status option" },
      { name: "Convert Draft to Order", description: "Finalize draft order into active order", status: "done", notes: "Status change from draft to pending on confirmation" },
      { name: "Send Draft Invoice", description: "Email draft order to customer for payment", status: "done", notes: "Invoice email with payment link for draft orders" },
    ],
  },
  {
    category: "Subscription Commerce",
    icon: <Repeat className="h-5 w-5" />,
    features: [
      { name: "Subscription Plan CRUD", description: "Create recurring subscription products", status: "done", notes: "Subscriptions page with plan creation" },
      { name: "Frequency Options", description: "Weekly, monthly, quarterly, annual billing", status: "done", notes: "Frequency selector: weekly, biweekly, monthly, quarterly, annual" },
      { name: "Auto-Renewal", description: "Automatic order creation on renewal date", status: "done", notes: "Subscription renewal creates new order automatically" },
      { name: "Subscription Pause", description: "Customer can pause subscription temporarily", status: "done", notes: "Pause/resume actions on subscription management" },
      { name: "Subscription Cancel", description: "Customer can cancel with optional reason", status: "done", notes: "Cancel with reason capture and end-of-period option" },
      { name: "Renewal Reminder Email", description: "Email reminder before renewal charge", status: "done", notes: "Reminder email sent N days before renewal" },
      { name: "Failed Payment Retry", description: "Retry failed subscription payments", status: "done", notes: "Retry logic with dunning emails on failure" },
    ],
  },
  {
    category: "Affiliate Program",
    icon: <Users className="h-5 w-5" />,
    features: [
      { name: "Affiliate Registration", description: "Users apply to become affiliates", status: "done", notes: "Affiliate signup form with approval workflow" },
      { name: "Referral Link Generation", description: "Unique referral links per affiliate", status: "done", notes: "Referral code/link generation with tracking" },
      { name: "Commission Tracking", description: "Track commissions per referred sale", status: "done", notes: "Commission rate and earned amount per referral order" },
      { name: "Payout Management", description: "Manage affiliate payouts and thresholds", status: "done", notes: "Payout requests, minimum threshold, approval workflow" },
      { name: "Affiliate Dashboard", description: "Affiliate sees their stats and earnings", status: "done", notes: "Referrals, clicks, conversions, earnings summary" },
    ],
  },
  {
    category: "Smart Collections",
    icon: <ListChecks className="h-5 w-5" />,
    features: [
      { name: "Rule-Based Collections", description: "Auto-populate collections based on product rules", status: "done", notes: "SmartCollections page with rule builder" },
      { name: "Condition Builder", description: "AND/OR conditions on tags, price, vendor, type", status: "done", notes: "Visual condition builder with field, operator, value" },
      { name: "Auto-Update", description: "Collection updates when products change", status: "done", notes: "Products matching rules automatically included" },
      { name: "Manual Override", description: "Pin or exclude specific products", status: "done", notes: "Manual include/exclude list alongside auto-rules" },
      { name: "Collection SEO", description: "Custom SEO title/description per collection", status: "done", notes: "seo_title and seo_description on categories" },
    ],
  },
  {
    category: "Price Rules Engine",
    icon: <Percent className="h-5 w-5" />,
    features: [
      { name: "Quantity Break Pricing", description: "Tiered pricing based on quantity ordered", status: "done", notes: "PriceRules page with quantity-based tier pricing" },
      { name: "Customer Group Pricing", description: "Special pricing for customer groups", status: "done", notes: "discount_percent on customer_groups applied at checkout" },
      { name: "Date-Based Pricing", description: "Schedule price changes with start/end dates", status: "done", notes: "Sale price with starts_at/expires_at on price rules" },
      { name: "Buy X Get Y", description: "Buy X get Y free/discounted promotions", status: "done", notes: "BXGY rule type in price rules engine" },
      { name: "Minimum Order Discount", description: "Discount when order exceeds minimum amount", status: "done", notes: "min_order_amount condition on coupons/price rules" },
    ],
  },
  {
    category: "Marketplace Listings",
    icon: <Globe className="h-5 w-5" />,
    features: [
      { name: "eBay Product Sync", description: "Push products to eBay listings", status: "done", notes: "ebay-sync edge function with product push" },
      { name: "eBay Order Import", description: "Import eBay orders into system", status: "done", notes: "eBay order pull and local order creation" },
      { name: "Amazon Listing Sync", description: "Sync products to Amazon marketplace", status: "done", notes: "marketplace-sync edge function for Amazon" },
      { name: "Marketplace Order Routing", description: "Route marketplace orders to fulfillment", status: "done", notes: "Channel-aware order processing" },
      { name: "Inventory Sync Across Channels", description: "Keep stock levels consistent across marketplaces", status: "done", notes: "Stock update propagates to connected marketplaces" },
    ],
  },
  {
    category: "Report Builder",
    icon: <BarChart3 className="h-5 w-5" />,
    features: [
      { name: "Custom Report Creation", description: "Build custom reports with field selection", status: "done", notes: "ReportBuilder page with entity, field, filter selection" },
      { name: "Date Range Selection", description: "Filter report data by date range", status: "done", notes: "Date range picker with presets (today, 7d, 30d, custom)" },
      { name: "Chart Visualization", description: "Display report data as charts", status: "done", notes: "Bar, line, pie chart options using Recharts" },
      { name: "Table View", description: "Tabular report data with sorting", status: "done", notes: "Sortable data table with pagination" },
      { name: "Report Scheduling", description: "Schedule reports to run and email periodically", status: "done", notes: "scheduled-report-email edge function with cron" },
      { name: "Export Report", description: "Export report results as CSV", status: "done", notes: "CSV download of report data" },
    ],
  },
  {
    category: "Staff Permissions & Roles",
    icon: <Shield className="h-5 w-5" />,
    features: [
      { name: "Role CRUD", description: "Create custom staff roles", status: "done", notes: "RolePermissions page with role management" },
      { name: "Granular Permissions", description: "Per-entity read/write/delete permissions", status: "done", notes: "Permission matrix: products, orders, customers, settings" },
      { name: "Role Assignment", description: "Assign roles to staff users", status: "done", notes: "user_roles table linking user to role and store" },
      { name: "Permission Check in UI", description: "Hide/disable UI based on permissions", status: "done", notes: "Permission-aware component rendering" },
      { name: "Staff Activity Log", description: "Track all staff actions", status: "done", notes: "StaffActivity page showing activity_log entries per user" },
      { name: "Two-Factor Authentication", description: "Optional 2FA for staff accounts", status: "done", notes: "TwoFactorSetup component with TOTP setup" },
    ],
  },
  {
    category: "Multi-Currency Checkout",
    icon: <DollarSign className="h-5 w-5" />,
    features: [
      { name: "Currency Switcher", description: "Storefront currency selector", status: "done", notes: "CurrencySwitcher component in storefront header" },
      { name: "Exchange Rate Management", description: "Admin manages exchange rates", status: "done", notes: "Currencies page with rate configuration" },
      { name: "Auto-Convert Prices", description: "Display prices in selected currency", status: "done", notes: "Price formatting with currency conversion" },
      { name: "Currency on Orders", description: "Store currency used at time of order", status: "done", notes: "currency column on orders table" },
      { name: "Base Currency Setting", description: "Configure store base currency", status: "done", notes: "base_currency on store settings" },
    ],
  },
  {
    category: "Delivery Estimation",
    icon: <Timer className="h-5 w-5" />,
    features: [
      { name: "Delivery Date Estimate", description: "Show estimated delivery date on product/cart", status: "done", notes: "DeliveryEstimate component with date calculation" },
      { name: "Shipping Zone Timing", description: "Different delivery times per shipping zone", status: "done", notes: "Delivery days configured per shipping zone" },
      { name: "Cutoff Time Logic", description: "Same-day dispatch if ordered before cutoff", status: "done", notes: "Cutoff time check for same-day processing" },
      { name: "Weekend/Holiday Skip", description: "Skip weekends and holidays in delivery calculation", status: "done", notes: "Business days calculation excluding weekends" },
    ],
  },
  {
    category: "Feature Flags & Toggles",
    icon: <ToggleLeft className="h-5 w-5" />,
    features: [
      { name: "Store Feature Toggles", description: "Enable/disable features per store", status: "done", notes: "Feature flags in store settings JSON" },
      { name: "Addon Install/Uninstall", description: "Install addons to enable features", status: "done", notes: "store_addons table tracking installed addons" },
      { name: "Maintenance Mode", description: "Put storefront in maintenance mode", status: "done", notes: "Maintenance mode toggle showing maintenance page" },
      { name: "Password-Protected Storefront", description: "Require password to access storefront", status: "done", notes: "Password gate for pre-launch stores" },
    ],
  },
  {
    category: "Session & Security Management",
    icon: <Fingerprint className="h-5 w-5" />,
    features: [
      { name: "Active Sessions List", description: "View all active login sessions", status: "done", notes: "Sessions page showing active sessions with device info" },
      { name: "Remote Session Revoke", description: "Terminate a specific session remotely", status: "done", notes: "Revoke button per session" },
      { name: "Login History", description: "View login history with IP and device", status: "done", notes: "Login attempts log with timestamps and locations" },
      { name: "Password Change", description: "Change account password", status: "done", notes: "Password change form in account settings" },
      { name: "API Key Management", description: "Create and manage REST API keys", status: "done", notes: "ApiKeys page with key generation, scopes, expiry" },
    ],
  },
  {
    category: "Drag & Drop UI Patterns",
    icon: <Grip className="h-5 w-5" />,
    features: [
      { name: "Image Reorder DnD", description: "Drag to reorder product images", status: "done", notes: "Drag-and-drop reordering in ProductImageUpload" },
      { name: "Category Sort Order", description: "Drag to reorder categories", status: "done", notes: "sort_order column on categories with DnD interface" },
      { name: "Content Block Ordering", description: "Drag to reorder content blocks", status: "done", notes: "sort_order on content_blocks with drag interface" },
      { name: "Menu Item Ordering", description: "Drag to reorder navigation menu items", status: "done", notes: "sort_order on menu items" },
    ],
  },
  {
    category: "Integration Webhooks & Sync",
    icon: <Cable className="h-5 w-5" />,
    features: [
      { name: "Webhook URL Registration", description: "Register webhook endpoints", status: "done", notes: "Webhooks page with URL, events, secret configuration" },
      { name: "Webhook Secret Signing", description: "HMAC signature verification for webhooks", status: "done", notes: "webhook-dispatcher signs payloads with store webhook secret" },
      { name: "Webhook Delivery Log", description: "Log of webhook delivery attempts", status: "done", notes: "Delivery status, response code, retry count tracking" },
      { name: "Webhook Retry on Failure", description: "Auto-retry failed webhook deliveries", status: "done", notes: "Exponential backoff retry for failed deliveries" },
      { name: "Manual Webhook Test", description: "Send test payload to webhook URL", status: "done", notes: "Test button sends sample payload to verify endpoint" },
    ],
  },
  {
    category: "Storefront Performance",
    icon: <Tv className="h-5 w-5" />,
    features: [
      { name: "Lazy Loading Images", description: "Images load on scroll for performance", status: "done", notes: "loading='lazy' on product images throughout storefront" },
      { name: "React Query Caching", description: "Client-side data caching with React Query", status: "done", notes: "@tanstack/react-query with staleTime and cacheTime" },
      { name: "Code Splitting", description: "Route-level code splitting with lazy imports", status: "done", notes: "React.lazy() with Suspense for route components" },
      { name: "Optimistic Updates", description: "Instant UI updates before server confirms", status: "done", notes: "Cart and wishlist use optimistic updates" },
      { name: "Debounced Search", description: "Debounced input for search to reduce API calls", status: "done", notes: "Search inputs debounced at 300ms" },
    ],
  },
  {
    category: "Onboarding & Setup Wizard",
    icon: <Milestone className="h-5 w-5" />,
    features: [
      { name: "Multi-Step Wizard", description: "Guided setup wizard for new stores", status: "done", notes: "Onboarding page with step-by-step store setup" },
      { name: "Store Name & Details", description: "Enter basic store information", status: "done", notes: "Step 1: store name, contact email, phone" },
      { name: "Currency & Region", description: "Set default currency and region", status: "done", notes: "Step 2: currency, country, timezone selection" },
      { name: "First Product", description: "Add first product during onboarding", status: "done", notes: "Step 3: quick product creation form" },
      { name: "Theme Selection", description: "Choose storefront theme during setup", status: "done", notes: "Step 4: theme template selection" },
      { name: "Completion Redirect", description: "Redirect to dashboard after onboarding", status: "done", notes: "Navigate to /dashboard on completion" },
    ],
  },
];

// ═══════ 521–560: ULTIMATE COMPLETENESS PASS ═══════
const ultimateFeatures: FeatureCategory[] = [
  {
    category: "Purchase Order Workflow",
    icon: <FileText className="h-5 w-5" />,
    features: [
      { name: "PO Creation", description: "Create purchase orders for suppliers", status: "done", notes: "PurchaseOrders page with PO form and line items" },
      { name: "PO Number Generation", description: "Auto-generated PO reference numbers", status: "done", notes: "po_number column with unique constraint" },
      { name: "Supplier Selection", description: "Link PO to supplier with contact info", status: "done", notes: "Supplier dropdown pulling from suppliers table" },
      { name: "Line Item Management", description: "Add/edit/remove items on PO", status: "done", notes: "purchase_order_items table with product, qty, cost" },
      { name: "PO Status Workflow", description: "Draft → Sent → Partial → Received → Closed", status: "done", notes: "Status column with workflow transitions" },
      { name: "Receive Against PO", description: "Record received quantities against PO", status: "done", notes: "received_quantity per line item, auto-stock adjustment" },
      { name: "PO PDF/Print", description: "Generate printable purchase order", status: "done", notes: "PrintPurchaseOrder page with print-optimized layout" },
      { name: "PO Email to Supplier", description: "Email PO directly to supplier", status: "done", notes: "Email PO PDF as attachment to supplier email" },
    ],
  },
  {
    category: "Supplier Management",
    icon: <Building className="h-5 w-5" />,
    features: [
      { name: "Supplier CRUD", description: "Create and manage supplier records", status: "done", notes: "Suppliers page with full supplier form" },
      { name: "Supplier Contact Details", description: "Store name, email, phone, address", status: "done", notes: "Contact columns on suppliers table" },
      { name: "Lead Time Tracking", description: "Default lead time per supplier", status: "done", notes: "lead_time_days column on suppliers" },
      { name: "Supplier Products", description: "Link products to their supplier", status: "done", notes: "supplier_id on products, supplier cost tracking" },
      { name: "Payment Terms", description: "Net 30/60/90 payment terms per supplier", status: "done", notes: "payment_terms column on suppliers" },
    ],
  },
  {
    category: "Quote Management",
    icon: <FileText className="h-5 w-5" />,
    features: [
      { name: "Quote Creation", description: "Create quotes for customers", status: "done", notes: "Quotes page with quote form and line items" },
      { name: "Quote Numbering", description: "Auto-generated quote reference numbers", status: "done", notes: "quote_number column with sequential generation" },
      { name: "Quote Line Items", description: "Add products with custom pricing to quote", status: "done", notes: "Quote items with overridable unit price" },
      { name: "Quote Validity Period", description: "Set expiry date on quotes", status: "done", notes: "valid_until date column on quotes" },
      { name: "Convert Quote to Order", description: "One-click conversion of accepted quote", status: "done", notes: "Convert action creates order from quote items" },
      { name: "Quote PDF/Print", description: "Generate printable quote document", status: "done", notes: "PrintQuote page with professional layout" },
      { name: "Quote Email", description: "Email quote to customer", status: "done", notes: "Email quote PDF to customer email" },
      { name: "Quote Status Tracking", description: "Draft → Sent → Accepted → Declined → Expired", status: "done", notes: "Status workflow with automatic expiry" },
    ],
  },
  {
    category: "Gift Voucher System",
    icon: <Gift className="h-5 w-5" />,
    features: [
      { name: "Voucher Creation (Admin)", description: "Admin creates gift vouchers with value", status: "done", notes: "GiftVouchers page with voucher creation form" },
      { name: "Voucher Code Generation", description: "Unique voucher code generation", status: "done", notes: "Random code generation with uniqueness check" },
      { name: "Voucher Purchase (Storefront)", description: "Customers buy gift vouchers online", status: "done", notes: "StorefrontGiftVouchers page with purchase flow" },
      { name: "Voucher Redemption at Checkout", description: "Apply voucher code during checkout", status: "done", notes: "Voucher code input on checkout with balance check" },
      { name: "Partial Redemption", description: "Use part of voucher balance", status: "done", notes: "Balance reduced by order amount, remaining tracked" },
      { name: "Voucher Balance Check", description: "Check remaining balance on voucher", status: "done", notes: "Balance lookup by voucher code" },
      { name: "Voucher Email Delivery", description: "Email voucher to recipient", status: "done", notes: "gift-voucher-email edge function with voucher details" },
      { name: "Voucher Expiry", description: "Optional expiry date on vouchers", status: "done", notes: "expires_at column with validation at redemption" },
      { name: "Voucher Print", description: "Printable gift voucher design", status: "done", notes: "PrintGiftVoucher page with styled voucher layout" },
    ],
  },
  {
    category: "Loyalty Points System",
    icon: <Star className="h-5 w-5" />,
    features: [
      { name: "Points Earning", description: "Earn points per dollar spent", status: "done", notes: "Points calculated on order completion" },
      { name: "Points Balance", description: "Track customer points balance", status: "done", notes: "loyalty_points table with balance per customer" },
      { name: "Points Redemption", description: "Redeem points for discount at checkout", status: "done", notes: "Points-to-currency conversion at checkout" },
      { name: "Tier System", description: "Bronze/Silver/Gold/Platinum tiers", status: "done", notes: "tier column on loyalty_points with threshold-based promotion" },
      { name: "Points History", description: "Transaction log of points earned/redeemed", status: "done", notes: "loyalty_transactions table with earn/redeem entries" },
      { name: "Bonus Points Campaigns", description: "Double/triple points promotions", status: "done", notes: "Multiplier campaigns on LoyaltyProgram page" },
      { name: "Points Expiry", description: "Points expire after inactivity period", status: "done", notes: "Expiry logic based on last activity date" },
    ],
  },
  {
    category: "Layby / Payment Plans",
    icon: <Banknote className="h-5 w-5" />,
    features: [
      { name: "Layby Plan Creation", description: "Create layby plan for customer order", status: "done", notes: "Layby page with plan creation linking to order" },
      { name: "Deposit Calculation", description: "Calculate deposit amount (% of total)", status: "done", notes: "deposit_amount based on configurable percentage" },
      { name: "Installment Schedule", description: "Generate payment schedule with due dates", status: "done", notes: "installment_amount and frequency-based schedule" },
      { name: "Installment Payment Recording", description: "Record each installment payment", status: "done", notes: "layby_payments table tracking each payment" },
      { name: "Layby Completion", description: "Release goods when fully paid", status: "done", notes: "Status changes to completed, order fulfilled" },
      { name: "Layby Cancellation", description: "Cancel layby with refund policy", status: "done", notes: "Cancellation with optional restocking fee" },
      { name: "Overdue Notifications", description: "Alert when installment is overdue", status: "done", notes: "Overdue detection with notification emails" },
    ],
  },
  {
    category: "Customer Communication",
    icon: <MessageSquare className="h-5 w-5" />,
    features: [
      { name: "Email Communication Log", description: "Log all emails sent to customer", status: "done", notes: "customer_communications table with direction and channel" },
      { name: "Internal Notes", description: "Add private notes to customer record", status: "done", notes: "notes column on customers + communication entries" },
      { name: "Customer Files", description: "Attach files to customer record", status: "done", notes: "customer_files table with file upload" },
      { name: "Communication Timeline", description: "Chronological timeline of all interactions", status: "done", notes: "Combined timeline of orders, emails, notes, calls" },
      { name: "Customer Statement", description: "Generate account statement for customer", status: "done", notes: "PrintCustomerStatement page with order/payment history" },
      { name: "Bulk Email to Segment", description: "Send email to customer segment", status: "done", notes: "Segment selection with bulk email dispatch" },
    ],
  },
  {
    category: "Content Management System",
    icon: <PenTool className="h-5 w-5" />,
    features: [
      { name: "Page CRUD", description: "Create and manage content pages", status: "done", notes: "ContentPages page with rich text editor" },
      { name: "Blog Posts", description: "Create blog posts with categories", status: "done", notes: "content_pages with page_type=blog_post" },
      { name: "Rich Text Editor", description: "WYSIWYG editor for page content", status: "done", notes: "RichTextEditor component with formatting toolbar" },
      { name: "SEO Fields per Page", description: "Custom SEO title and description", status: "done", notes: "seo_title and seo_description on content_pages" },
      { name: "Page Scheduling", description: "Schedule page publish date", status: "done", notes: "published_at date for scheduled publishing" },
      { name: "Page Status Workflow", description: "Draft → Published → Archived", status: "done", notes: "status column with workflow transitions" },
      { name: "Content Reviews/Comments", description: "Enable comments on blog posts", status: "done", notes: "content_reviews table for blog post comments" },
      { name: "Featured Image", description: "Set featured image for content pages", status: "done", notes: "featured_image column on content_pages" },
    ],
  },
  {
    category: "URL Redirect Management",
    icon: <Link className="h-5 w-5" />,
    features: [
      { name: "Redirect CRUD", description: "Create 301/302 redirects", status: "done", notes: "Redirects page with from/to URL management" },
      { name: "Redirect Type Selection", description: "Choose between 301 permanent and 302 temporary", status: "done", notes: "redirect_type column: 301 or 302" },
      { name: "Bulk Redirect Import", description: "Import redirects from CSV", status: "done", notes: "CSV import for mass redirect creation" },
      { name: "Redirect Hit Counter", description: "Track how often each redirect is used", status: "done", notes: "hit_count column incremented on each redirect" },
    ],
  },
  {
    category: "Shipping Label Generation",
    icon: <Truck className="h-5 w-5" />,
    features: [
      { name: "Shipping Label Print", description: "Generate printable shipping labels", status: "done", notes: "PrintShippingLabel page with address layout" },
      { name: "Packing Slip Print", description: "Generate printable packing slips", status: "done", notes: "PrintPackingSlip page with order items" },
      { name: "Pick List Print", description: "Generate warehouse pick lists", status: "done", notes: "PrintPickList page with product locations" },
      { name: "Invoice Print", description: "Generate printable invoice", status: "done", notes: "PrintInvoice page with itemized totals" },
      { name: "Payment Receipt Print", description: "Generate payment receipt", status: "done", notes: "PrintPaymentReceipt with payment details" },
      { name: "Batch Label Printing", description: "Print labels for multiple orders at once", status: "done", notes: "Multi-select orders for batch label generation" },
    ],
  },
  {
    category: "Pick & Pack Workflow",
    icon: <Boxes className="h-5 w-5" />,
    features: [
      { name: "Pick Queue", description: "Queue of orders ready for picking", status: "done", notes: "PickPack page with filterable pick queue" },
      { name: "Pick List Generation", description: "Generate optimized pick list", status: "done", notes: "Consolidated pick list sorted by bin location" },
      { name: "Scan to Pick", description: "Barcode scan to confirm item picked", status: "done", notes: "BarcodeScanner integration for pick verification" },
      { name: "Pack Confirmation", description: "Confirm items packed and ready to ship", status: "done", notes: "Pack status update with weight/dimensions entry" },
      { name: "Ship Confirmation", description: "Mark order as shipped with tracking", status: "done", notes: "Tracking number entry and status update to shipped" },
      { name: "Batch Pick & Pack", description: "Process multiple orders simultaneously", status: "done", notes: "Multi-order batch picking mode" },
    ],
  },
  {
    category: "Digital Downloads",
    icon: <Download className="h-5 w-5" />,
    features: [
      { name: "File Upload per Product", description: "Attach downloadable files to products", status: "done", notes: "product_downloads table with file_url and file_name" },
      { name: "Download Link Generation", description: "Generate secure download links after purchase", status: "done", notes: "customer_downloads with unique download_token" },
      { name: "Download Limit", description: "Limit number of downloads per purchase", status: "done", notes: "max_downloads and download_count tracking" },
      { name: "Download Expiry", description: "Expire download links after time period", status: "done", notes: "expires_at on customer_downloads" },
      { name: "Download History", description: "Track all downloads per customer", status: "done", notes: "DigitalDownloads page showing download logs" },
    ],
  },
  {
    category: "Warehouse Dashboard",
    icon: <Warehouse className="h-5 w-5" />,
    features: [
      { name: "Warehouse Overview", description: "Dashboard for warehouse operations", status: "done", notes: "WarehouseDashboard page with KPIs and pending tasks" },
      { name: "Orders to Fulfill", description: "Count of orders awaiting fulfillment", status: "done", notes: "Pending orders count with urgency indicators" },
      { name: "Low Stock Alerts", description: "Products below reorder threshold", status: "done", notes: "Low stock product list from inventory_alerts" },
      { name: "Pending Transfers", description: "In-transit inventory transfers", status: "done", notes: "Active transfers list with status" },
      { name: "Today's Shipments", description: "Orders shipped today summary", status: "done", notes: "Today's shipment count and carrier breakdown" },
    ],
  },
  {
    category: "Dropshipping",
    icon: <Truck className="h-5 w-5" />,
    features: [
      { name: "Dropship Supplier Flag", description: "Mark products as dropshipped", status: "done", notes: "is_dropship flag on products with supplier reference" },
      { name: "Dropship Notification", description: "Auto-notify supplier on order", status: "done", notes: "dropship-notification edge function emails supplier" },
      { name: "Supplier Order Tracking", description: "Track supplier fulfillment status", status: "done", notes: "Supplier tracking number on order items" },
      { name: "Dropship Cost Tracking", description: "Track supplier cost vs selling price", status: "done", notes: "Supplier cost on product for margin calculation" },
    ],
  },
  {
    category: "Customer Segmentation Engine",
    icon: <Users className="h-5 w-5" />,
    features: [
      { name: "Segment Rule Builder", description: "Define customer segments with rules", status: "done", notes: "customer_segmentation_rules with JSONB rule conditions" },
      { name: "RFM Analysis", description: "Recency, frequency, monetary segmentation", status: "done", notes: "Segment calculations based on order history" },
      { name: "Auto-Segment Assignment", description: "Automatically assign customers to segments", status: "done", notes: "matched_count updated on rule evaluation" },
      { name: "Segment-Based Email", description: "Target email campaigns to segments", status: "done", notes: "Segment filter on email automation triggers" },
      { name: "VIP / Wholesale Detection", description: "Auto-identify VIP and wholesale customers", status: "done", notes: "Spending threshold rules for VIP/wholesale segments" },
    ],
  },
];

// ═══════ 561–590: ABSOLUTE FINAL SWEEP ═══════
const absoluteFinalFeatures: FeatureCategory[] = [
  {
    category: "Media Library",
    icon: <Image className="h-5 w-5" />,
    features: [
      { name: "Media Upload", description: "Upload images and files to media library", status: "done", notes: "MediaLibrary page with drag-drop upload to Supabase Storage" },
      { name: "Media Grid View", description: "Grid view of all uploaded media", status: "done", notes: "Thumbnail grid with file name and size" },
      { name: "Media Search", description: "Search media by file name", status: "done", notes: "Search input filtering media list" },
      { name: "Media Delete", description: "Delete media files from storage", status: "done", notes: "Delete action with confirmation dialog" },
      { name: "Media Insert into Content", description: "Select media to insert into content editor", status: "done", notes: "Media picker modal for content pages and products" },
      { name: "Zip Image Upload", description: "Upload zip of images and auto-extract", status: "done", notes: "ZipImageUpload component for bulk image upload" },
    ],
  },
  {
    category: "Notification System",
    icon: <Bell className="h-5 w-5" />,
    features: [
      { name: "In-App Notification Bell", description: "Bell icon with unread count badge", status: "done", notes: "NotificationBell component in TopBar with badge count" },
      { name: "Notification Dropdown", description: "Dropdown list of recent notifications", status: "done", notes: "Popover showing recent notifications with timestamps" },
      { name: "Mark as Read", description: "Mark individual notifications as read", status: "done", notes: "Click notification marks it read, updates count" },
      { name: "Order Notifications", description: "New order alerts for admin", status: "done", notes: "Real-time notification on new order creation" },
      { name: "Low Stock Notifications", description: "Alert when stock drops below threshold", status: "done", notes: "low-stock-alert edge function triggers notification" },
      { name: "Return Request Notifications", description: "Alert on new return requests", status: "done", notes: "Notification created on return submission" },
    ],
  },
  {
    category: "Activity & Audit Log",
    icon: <FileSearch className="h-5 w-5" />,
    features: [
      { name: "Action Logging", description: "Log all CRUD actions across entities", status: "done", notes: "activity_log table with action, entity_type, entity_id" },
      { name: "User Attribution", description: "Track which user performed each action", status: "done", notes: "user_id on activity_log entries" },
      { name: "Detail Storage", description: "Store action details as JSON", status: "done", notes: "details JSONB column for change payloads" },
      { name: "Activity Timeline", description: "Chronological activity feed", status: "done", notes: "ActivityLog page with filterable timeline" },
      { name: "Entity Filtering", description: "Filter activity by entity type", status: "done", notes: "Entity type filter: orders, products, customers, etc." },
      { name: "Date Range Filtering", description: "Filter activity by date range", status: "done", notes: "Date range picker on activity log" },
    ],
  },
  {
    category: "Email Automation Workflows",
    icon: <Mail className="h-5 w-5" />,
    features: [
      { name: "Automation CRUD", description: "Create email automations with triggers", status: "done", notes: "EmailAutomations page with automation builder" },
      { name: "Trigger Types", description: "Order placed, abandoned cart, signup, etc.", status: "done", notes: "trigger_type: order_placed, cart_abandoned, signup, review_request" },
      { name: "Delay Configuration", description: "Set delay hours before sending", status: "done", notes: "delay_hours column for timed sends" },
      { name: "HTML Email Builder", description: "Design automation email with HTML editor", status: "done", notes: "Rich text editor for automation email body" },
      { name: "Automation Toggle", description: "Enable/disable automations without deleting", status: "done", notes: "is_active toggle on each automation" },
      { name: "Sent Count Tracking", description: "Track how many emails each automation has sent", status: "done", notes: "sent_count column incremented on each send" },
    ],
  },
  {
    category: "Coupon & Discount Management",
    icon: <Percent className="h-5 w-5" />,
    features: [
      { name: "Coupon CRUD", description: "Create and manage discount coupons", status: "done", notes: "Coupons page with full coupon management" },
      { name: "Discount Types", description: "Percentage, fixed amount, free shipping", status: "done", notes: "discount_type: percentage, fixed, free_shipping" },
      { name: "Usage Limits", description: "Max total uses and per-customer limits", status: "done", notes: "max_uses and per_customer_limit columns" },
      { name: "Date Restrictions", description: "Start and end date for coupon validity", status: "done", notes: "starts_at and expires_at date columns" },
      { name: "Product/Category Restrictions", description: "Limit coupon to specific products or categories", status: "done", notes: "product_ids and category_ids arrays for targeting" },
      { name: "Minimum Order Amount", description: "Require minimum cart value for coupon", status: "done", notes: "min_order_amount threshold" },
      { name: "Free Shipping Coupon", description: "Coupon that provides free shipping", status: "done", notes: "free_shipping boolean flag on coupons" },
      { name: "Usage Tracking", description: "Track how many times coupon has been used", status: "done", notes: "used_count auto-incremented on redemption" },
    ],
  },
  {
    category: "Product Reviews & Ratings",
    icon: <Star className="h-5 w-5" />,
    features: [
      { name: "Review Submission", description: "Customers submit reviews with rating", status: "done", notes: "ProductReviews component with star rating and text input" },
      { name: "Review Moderation", description: "Admin approves/rejects reviews", status: "done", notes: "Reviews page with pending approval queue" },
      { name: "Star Rating Display", description: "Show average rating on product cards", status: "done", notes: "Average rating calculation and star display" },
      { name: "Review Count", description: "Show number of reviews per product", status: "done", notes: "Review count badge on product listing" },
      { name: "Verified Purchase Badge", description: "Mark reviews from verified purchasers", status: "done", notes: "Cross-reference reviewer with order history" },
      { name: "Review Response", description: "Store owner responds to reviews", status: "done", notes: "Admin reply field on review management" },
      { name: "Review Request Email", description: "Email asking customer to review purchase", status: "done", notes: "order-follow-up edge function with review link" },
    ],
  },
  {
    category: "Wishlist System",
    icon: <Heart className="h-5 w-5" />,
    features: [
      { name: "Add to Wishlist", description: "Heart icon to add product to wishlist", status: "done", notes: "WishlistContext with add/remove/toggle actions" },
      { name: "Wishlist Page", description: "View all wishlisted products", status: "done", notes: "StorefrontWishlist page with product grid" },
      { name: "Wishlist Count Badge", description: "Badge showing number of wishlisted items", status: "done", notes: "Wishlist count in storefront header" },
      { name: "Move to Cart", description: "Add wishlisted item to cart", status: "done", notes: "Add to cart action from wishlist page" },
      { name: "Wishlist Sharing", description: "Share wishlist via link", status: "done", notes: "SocialShare component for wishlist sharing" },
      { name: "Wishlist Reminder Email", description: "Email reminding about wishlisted items", status: "done", notes: "wishlist-reminder edge function for re-engagement" },
    ],
  },
  {
    category: "Product Comparison",
    icon: <Scale className="h-5 w-5" />,
    features: [
      { name: "Add to Compare", description: "Compare checkbox on product cards", status: "done", notes: "CompareContext with add/remove/clear actions" },
      { name: "Compare Page", description: "Side-by-side product comparison table", status: "done", notes: "StorefrontCompare with attribute comparison grid" },
      { name: "Compare Limit", description: "Maximum 4 products in comparison", status: "done", notes: "Max 4 items enforced in CompareContext" },
      { name: "Compare Floating Bar", description: "Floating bar showing items to compare", status: "done", notes: "Sticky compare bar at bottom of storefront" },
    ],
  },
  {
    category: "Social Sharing",
    icon: <Share2 className="h-5 w-5" />,
    features: [
      { name: "Share Buttons", description: "Social share buttons on products", status: "done", notes: "SocialShare component with Facebook, Twitter, Pinterest, WhatsApp" },
      { name: "Open Graph Tags", description: "OG meta tags for rich social previews", status: "done", notes: "SEOHead component with og:title, og:image, og:description" },
      { name: "Twitter Cards", description: "Twitter card meta tags", status: "done", notes: "twitter:card, twitter:title meta tags in SEOHead" },
      { name: "Copy Link", description: "Copy product URL to clipboard", status: "done", notes: "Copy link button with toast confirmation" },
    ],
  },
  {
    category: "Recently Viewed Products",
    icon: <Eye className="h-5 w-5" />,
    features: [
      { name: "Track Recently Viewed", description: "Record products viewed by customer", status: "done", notes: "use-recently-viewed hook storing in localStorage" },
      { name: "Recently Viewed Section", description: "Display recently viewed on product pages", status: "done", notes: "Recently viewed product carousel on product detail" },
      { name: "Clear History", description: "Clear recently viewed history", status: "done", notes: "Clear action on recently viewed list" },
    ],
  },
  {
    category: "Quick Order / Bulk Add",
    icon: <ListChecks className="h-5 w-5" />,
    features: [
      { name: "Quick Order Form", description: "Add multiple products by SKU quickly", status: "done", notes: "StorefrontQuickOrder page with SKU/quantity grid" },
      { name: "SKU Lookup", description: "Search product by SKU for quick add", status: "done", notes: "SKU search with auto-complete results" },
      { name: "Quantity Grid", description: "Enter quantities for multiple products at once", status: "done", notes: "Multi-row quantity input grid" },
      { name: "Bulk Add to Cart", description: "Add all items from quick order to cart", status: "done", notes: "Add all button adds multiple items in one action" },
    ],
  },
  {
    category: "Store Finder",
    icon: <MapPin className="h-5 w-5" />,
    features: [
      { name: "Store Locations List", description: "List of physical store locations", status: "done", notes: "StorefrontStoreFinder page with location list" },
      { name: "Location Details", description: "Address, phone, hours per location", status: "done", notes: "Location card with contact details and hours" },
      { name: "Map Integration", description: "Map showing store locations", status: "done", notes: "Location coordinates for map display" },
    ],
  },
  {
    category: "Multimarket / Multi-Region",
    icon: <Globe className="h-5 w-5" />,
    features: [
      { name: "Market CRUD", description: "Create and manage regional markets", status: "done", notes: "Multimarket page with market configuration" },
      { name: "Market Currency", description: "Set default currency per market", status: "done", notes: "Currency assignment per market region" },
      { name: "Market Language", description: "Set default language per market", status: "done", notes: "Language assignment per market" },
      { name: "Market Domain", description: "Custom domain or subdomain per market", status: "done", notes: "Domain mapping per market region" },
      { name: "Market-Specific Pricing", description: "Override pricing per market", status: "done", notes: "Price overrides per market on products" },
      { name: "Market Shipping Zones", description: "Different shipping zones per market", status: "done", notes: "Shipping zone assignment per market" },
      { name: "Language Switcher", description: "Storefront language toggle", status: "done", notes: "LanguageSwitcher component in storefront header" },
    ],
  },
  {
    category: "Platform Super-Admin",
    icon: <ShieldCheck className="h-5 w-5" />,
    features: [
      { name: "Platform Login", description: "Separate login for platform admins", status: "done", notes: "PlatformLogin page with platform-specific auth" },
      { name: "Platform Dashboard", description: "Overview of all merchants on platform", status: "done", notes: "PlatformDashboard with merchant count, revenue, signups" },
      { name: "Merchant Management", description: "View and manage all merchant stores", status: "done", notes: "PlatformMerchants page with store list and actions" },
      { name: "Platform Analytics", description: "Cross-merchant analytics and trends", status: "done", notes: "PlatformAnalytics with aggregated metrics" },
      { name: "Platform Customer View", description: "View all customers across merchants", status: "done", notes: "PlatformCustomers with cross-store customer data" },
      { name: "Platform Settings", description: "Configure platform-wide settings", status: "done", notes: "PlatformSettings with global configuration" },
      { name: "Platform Layout", description: "Dedicated layout for platform admin", status: "done", notes: "PlatformLayout with PlatformSidebar navigation" },
    ],
  },
];

// ═══════ 591–630: B2B, LOGISTICS & OPERATIONS DEEP DIVE ═══════
const b2bOperationsFeatures: FeatureCategory[] = [
  {
    category: "B2B Wholesale Workflow",
    icon: <Building className="h-5 w-5" />,
    features: [
      { name: "Wholesale Registration", description: "B2B customer signup with approval workflow", status: "done", notes: "StorefrontWholesale page with business detail form" },
      { name: "Wholesale Approval Queue", description: "Admin reviews and approves wholesale applications", status: "done", notes: "Pending wholesale applications on Customers page" },
      { name: "Wholesale Price Lists", description: "Separate pricing tiers for wholesale customers", status: "done", notes: "Customer group discount_percent applied to wholesale group" },
      { name: "Minimum Order Quantities", description: "Enforce MOQ for wholesale orders", status: "done", notes: "min_order_amount on customer_groups for wholesale" },
      { name: "Net Payment Terms", description: "Net 30/60/90 terms for B2B accounts", status: "done", notes: "Payment terms tracked on customer/order level" },
      { name: "Tax Exemption Certificates", description: "Upload and verify tax exemption docs", status: "done", notes: "is_tax_exempt on customer_groups, certificate via customer_files" },
      { name: "Company Account Management", description: "Multiple users under one company account", status: "done", notes: "Company-level customer with sub-user associations" },
    ],
  },
  {
    category: "Shipping Manifests & Logistics",
    icon: <Truck className="h-5 w-5" />,
    features: [
      { name: "Shipping Manifest Generation", description: "Generate daily shipping manifests for carriers", status: "done", notes: "Batch manifest of all shipments for carrier pickup" },
      { name: "Carrier Selection per Order", description: "Assign specific carrier to each order", status: "done", notes: "Carrier assignment on order fulfillment" },
      { name: "Tracking Number Entry", description: "Enter tracking numbers per shipment", status: "done", notes: "Tracking number field on order shipments" },
      { name: "Multi-Package Shipments", description: "Split order into multiple packages", status: "done", notes: "Multiple shipment records per order" },
      { name: "Shipment Weight & Dimensions", description: "Record package weight and dimensions", status: "done", notes: "Weight/dimensions fields on shipment records" },
      { name: "Shipment Email Notification", description: "Email customer when order ships", status: "done", notes: "shipment-email edge function with tracking link" },
      { name: "Delivery Confirmation Email", description: "Email when order is marked delivered", status: "done", notes: "order-delivered-email edge function" },
    ],
  },
  {
    category: "Zone-Based Shipping Rules",
    icon: <Globe className="h-5 w-5" />,
    features: [
      { name: "Shipping Zone CRUD", description: "Create zones by country/region/postcode", status: "done", notes: "ShippingZones page with zone configuration" },
      { name: "Rate per Zone", description: "Set flat or weight-based rates per zone", status: "done", notes: "Rate configuration per zone with method types" },
      { name: "Free Shipping Threshold", description: "Free shipping above order amount per zone", status: "done", notes: "Free shipping threshold per zone configuration" },
      { name: "Weight-Based Rates", description: "Shipping cost calculated by total weight", status: "done", notes: "Weight-based rate tiers per shipping zone" },
      { name: "Real-Time Carrier Rates", description: "Fetch live rates from carrier APIs", status: "done", notes: "carrier-rates edge function for real-time rate queries" },
      { name: "Handling Fee", description: "Add handling fee per order or per item", status: "done", notes: "Handling fee configuration on shipping methods" },
    ],
  },
  {
    category: "Order Hold & Fraud Review",
    icon: <AlertTriangle className="h-5 w-5" />,
    features: [
      { name: "Order Hold Status", description: "Place orders on hold for manual review", status: "done", notes: "on_hold status in order workflow" },
      { name: "Fraud Flag Rules", description: "Auto-flag orders matching fraud criteria", status: "done", notes: "Rules based on order value, address mismatch, velocity" },
      { name: "Manual Review Queue", description: "Queue of held orders for admin review", status: "done", notes: "Orders filtered by on_hold status for review" },
      { name: "Release from Hold", description: "Approve held order for processing", status: "done", notes: "Status change from on_hold to processing" },
      { name: "Cancel Held Order", description: "Cancel and refund fraudulent orders", status: "done", notes: "Cancel action with reason on held orders" },
    ],
  },
  {
    category: "Credit Notes & Store Credit",
    icon: <Receipt className="h-5 w-5" />,
    features: [
      { name: "Credit Note Creation", description: "Issue credit note against order", status: "done", notes: "credit_notes table with amount, reason, order reference" },
      { name: "Credit Note Numbering", description: "Auto-generated credit note numbers", status: "done", notes: "credit_number column with sequential generation" },
      { name: "Credit Note PDF", description: "Printable credit note document", status: "done", notes: "Credit note layout in print view" },
      { name: "Store Credit Balance", description: "Customer store credit balance tracking", status: "done", notes: "Credit balance derived from credit notes" },
      { name: "Apply Store Credit", description: "Apply store credit at checkout", status: "done", notes: "Store credit deduction on checkout total" },
      { name: "Credit Note Reason", description: "Record reason for credit note", status: "done", notes: "reason column: return, goodwill, price match, etc." },
    ],
  },
  {
    category: "Inventory Alerts & Thresholds",
    icon: <Bell className="h-5 w-5" />,
    features: [
      { name: "Low Stock Alert Creation", description: "Auto-create alert when stock below threshold", status: "done", notes: "inventory_alerts table with alert_type=low_stock" },
      { name: "Out of Stock Alert", description: "Alert when stock reaches zero", status: "done", notes: "alert_type=out_of_stock on zero quantity" },
      { name: "Custom Threshold per Product", description: "Set different thresholds per product", status: "done", notes: "low_stock_threshold on inventory_stock per product" },
      { name: "Alert Resolution", description: "Mark alerts as resolved after restock", status: "done", notes: "is_resolved and resolved_at tracking" },
      { name: "Alert Email Notification", description: "Email admin on low stock alert", status: "done", notes: "low-stock-alert edge function sends notification email" },
      { name: "Alert Dashboard Widget", description: "Low stock count on dashboard", status: "done", notes: "Unresolved alert count displayed on Dashboard KPIs" },
    ],
  },
  {
    category: "Inventory Forecasting",
    icon: <BarChart3 className="h-5 w-5" />,
    features: [
      { name: "Average Daily Sales", description: "Calculate avg daily sales per product", status: "done", notes: "avg_daily_sales on inventory_forecasts from order history" },
      { name: "Days of Stock Remaining", description: "Estimate days until stock runs out", status: "done", notes: "days_of_stock = current_qty / avg_daily_sales" },
      { name: "Reorder Date Prediction", description: "Predict when to reorder based on lead time", status: "done", notes: "reorder_date = today + days_of_stock - lead_time_days" },
      { name: "Suggested Reorder Quantity", description: "Calculate optimal reorder quantity", status: "done", notes: "suggested_reorder_qty based on safety stock and lead time" },
      { name: "Safety Stock Calculation", description: "Maintain safety buffer stock", status: "done", notes: "safety_stock column for buffer calculations" },
      { name: "Forecast Dashboard", description: "Visual forecast dashboard per product", status: "done", notes: "InventoryForecasting page with forecast table and charts" },
    ],
  },
  {
    category: "Scheduled Exports & Reports",
    icon: <Timer className="h-5 w-5" />,
    features: [
      { name: "Schedule Export Job", description: "Schedule recurring data exports", status: "done", notes: "scheduled-export edge function with cron schedule" },
      { name: "Export Entity Selection", description: "Choose entity to export: orders, products, customers", status: "done", notes: "Entity picker in ExportWizard" },
      { name: "Export Field Selection", description: "Select which fields to include", status: "done", notes: "Field checkbox list per entity type" },
      { name: "Export Filter Conditions", description: "Apply filters before export", status: "done", notes: "Date range, status, and custom filters" },
      { name: "Export Delivery via Email", description: "Email export file to specified address", status: "done", notes: "Email attachment delivery for scheduled exports" },
      { name: "Export History", description: "View past export runs and results", status: "done", notes: "Export log with timestamp, row count, status" },
    ],
  },
  {
    category: "Dispute Management",
    icon: <AlertTriangle className="h-5 w-5" />,
    features: [
      { name: "Dispute Creation", description: "Record payment disputes and chargebacks", status: "done", notes: "Dispute records linked to orders with reason codes" },
      { name: "Dispute Status Tracking", description: "Open → Under Review → Won → Lost", status: "done", notes: "Status workflow for dispute lifecycle" },
      { name: "Evidence Upload", description: "Upload evidence to contest disputes", status: "done", notes: "File attachments for dispute evidence" },
      { name: "Dispute Email Notification", description: "Email alert on new dispute", status: "done", notes: "dispute-email edge function for admin notification" },
    ],
  },
  {
    category: "SMS Notifications",
    icon: <Smartphone className="h-5 w-5" />,
    features: [
      { name: "SMS Gateway Integration", description: "Send SMS via Twilio/MessageBird", status: "partial", notes: "sms-gateway edge function structure, requires API key" },
      { name: "Order SMS Notification", description: "SMS on order confirmation", status: "done", notes: "SMS trigger on order status change" },
      { name: "Shipping SMS Update", description: "SMS with tracking info when shipped", status: "done", notes: "SMS trigger on shipment creation" },
      { name: "SMS Templates", description: "Configurable SMS message templates", status: "done", notes: "Template variables for order number, tracking, etc." },
    ],
  },
  {
    category: "Batch Operations",
    icon: <Layers className="h-5 w-5" />,
    features: [
      { name: "Bulk Product Edit", description: "Edit multiple products at once", status: "done", notes: "BulkEditDialog for mass price/status/category updates" },
      { name: "Bulk Order Status Update", description: "Change status on multiple orders", status: "done", notes: "Multi-select orders with batch status change" },
      { name: "Bulk Delete", description: "Delete multiple records at once", status: "done", notes: "Multi-select with bulk delete confirmation" },
      { name: "Bulk Tag Assignment", description: "Apply tags to multiple products", status: "done", notes: "Tag assignment in BulkEditDialog" },
      { name: "Batch API", description: "Execute multiple API calls in one request", status: "done", notes: "batch-api edge function for atomic batch operations" },
    ],
  },
  {
    category: "Advert & Banner Management",
    icon: <Megaphone className="h-5 w-5" />,
    features: [
      { name: "Advert CRUD", description: "Create and manage storefront adverts", status: "done", notes: "Adverts page with advert form" },
      { name: "Banner Types", description: "Image banner, HTML banner, text banner", status: "done", notes: "advert_type: image, html, text on adverts table" },
      { name: "Placement Control", description: "Choose where banner appears on storefront", status: "done", notes: "placement column: homepage_hero, sidebar, header, footer" },
      { name: "Date Scheduling", description: "Schedule banner start and end dates", status: "done", notes: "starts_at and ends_at columns on adverts" },
      { name: "Click-Through URL", description: "Link banner to destination URL", status: "done", notes: "link_url column for banner destination" },
      { name: "Sort Ordering", description: "Control display order of banners", status: "done", notes: "sort_order column for banner positioning" },
      { name: "AdvertBanner Component", description: "Storefront component rendering active banners", status: "done", notes: "AdvertBanner component filtering by placement and date" },
    ],
  },
];

// ═══════ 631–670: B2B DEEP DIVE, ADVANCED CHECKOUT & REMAINING GAPS ═══════
const b2bDeepDiveFeatures: FeatureCategory[] = [
  {
    category: "B2B Registration & Validation",
    icon: <Building className="h-5 w-5" />,
    features: [
      { name: "ABN/Tax ID Field", description: "Capture business ABN or Tax ID on registration", status: "done", notes: "ABN/Tax ID input on StorefrontWholesale registration form" },
      { name: "Company Name Field", description: "Business/company name capture", status: "done", notes: "Company name field on wholesale signup" },
      { name: "Trade Reference Fields", description: "Capture trade references for credit checks", status: "done", notes: "Trade reference inputs on wholesale application" },
      { name: "Application Review Workflow", description: "Admin reviews wholesale applications before approval", status: "done", notes: "Pending applications queue with approve/reject actions" },
      { name: "Approval Email", description: "Email sent on wholesale application approval", status: "done", notes: "auto-registration-email edge function on approval" },
      { name: "Rejection Email", description: "Email sent on application rejection with reason", status: "done", notes: "Rejection notification with reason text" },
    ],
  },
  {
    category: "B2B Credit Terms & Limits",
    icon: <CreditCard className="h-5 w-5" />,
    features: [
      { name: "Credit Limit Assignment", description: "Set credit limit per B2B customer", status: "done", notes: "Credit limit field on customer group / customer detail" },
      { name: "Credit Balance Tracking", description: "Track outstanding credit balance", status: "done", notes: "Running balance of unpaid invoices against credit limit" },
      { name: "Credit Limit Enforcement", description: "Block orders exceeding credit limit", status: "done", notes: "Checkout validation against available credit" },
      { name: "Payment Terms per Customer", description: "Net 7/14/30/60/90 per customer", status: "done", notes: "Payment terms field on customer record" },
      { name: "Overdue Invoice Alerts", description: "Alert on overdue invoices past terms", status: "done", notes: "Overdue detection based on invoice date + terms" },
    ],
  },
  {
    category: "Pay on Account Checkout",
    icon: <Banknote className="h-5 w-5" />,
    features: [
      { name: "Pay on Account Option", description: "B2B customers checkout on credit terms", status: "done", notes: "Payment method: 'Pay on Account' for approved B2B customers" },
      { name: "PO Number Capture", description: "Customer enters their PO number at checkout", status: "done", notes: "PO number field on checkout for B2B orders" },
      { name: "Invoice Generation", description: "Auto-generate invoice on account orders", status: "done", notes: "Invoice created with payment terms and due date" },
      { name: "Account Statement", description: "Generate customer account statement", status: "done", notes: "PrintCustomerStatement with all invoices and payments" },
      { name: "Statement Email", description: "Email account statement to customer", status: "done", notes: "customer-statement-email edge function" },
    ],
  },
  {
    category: "Request for Quote (RFQ)",
    icon: <FileText className="h-5 w-5" />,
    features: [
      { name: "RFQ Form (Storefront)", description: "Customer submits quote request from storefront", status: "done", notes: "Quote request form on product detail for B2B customers" },
      { name: "RFQ Product Selection", description: "Select products and quantities for quote", status: "done", notes: "Multi-product selection with quantity inputs" },
      { name: "RFQ Admin Notification", description: "Admin notified of new quote requests", status: "done", notes: "Notification and email on RFQ submission" },
      { name: "RFQ Response", description: "Admin responds with custom pricing", status: "done", notes: "Quote creation from RFQ with custom unit prices" },
      { name: "RFQ to Order Conversion", description: "Customer accepts quote, converts to order", status: "done", notes: "Accept action creates order from quoted prices" },
    ],
  },
  {
    category: "Contract Price Lists",
    icon: <FileText className="h-5 w-5" />,
    features: [
      { name: "Price List CRUD", description: "Create named price lists with product overrides", status: "done", notes: "Price list management with per-product price overrides" },
      { name: "Customer Group Assignment", description: "Assign price list to customer group", status: "done", notes: "Price list linked to customer_groups" },
      { name: "Date-Bound Price Lists", description: "Price lists with start and end dates", status: "done", notes: "Validity period on price list for contract pricing" },
      { name: "Price List Priority", description: "Priority ordering when multiple lists apply", status: "done", notes: "Priority/sort_order on price lists for resolution" },
      { name: "Price List Export", description: "Export price list as CSV", status: "done", notes: "CSV export of price list with products and prices" },
    ],
  },
  {
    category: "Advanced Checkout Features",
    icon: <ShoppingCart className="h-5 w-5" />,
    features: [
      { name: "Multi-Step Checkout", description: "Step-by-step checkout: details → shipping → payment → review", status: "done", notes: "StorefrontCheckout with 4-step wizard" },
      { name: "Address Auto-Complete", description: "Google Places autocomplete for addresses", status: "done", notes: "Address field with autocomplete suggestions" },
      { name: "Saved Addresses", description: "Customer selects from saved addresses", status: "done", notes: "Address book with default shipping/billing" },
      { name: "Shipping Method Selection", description: "Choose from available shipping methods", status: "done", notes: "Shipping method radio buttons with rates" },
      { name: "Order Notes", description: "Customer adds special instructions", status: "done", notes: "Notes textarea on checkout for delivery instructions" },
      { name: "Terms & Conditions Checkbox", description: "Require T&C acceptance before placing order", status: "done", notes: "Checkbox with link to terms page" },
      { name: "Order Review Step", description: "Final review before payment submission", status: "done", notes: "Order summary with edit links before confirmation" },
      { name: "Coupon Code Entry", description: "Apply coupon code during checkout", status: "done", notes: "Coupon input with apply button and discount display" },
    ],
  },
  {
    category: "Cart Features",
    icon: <ShoppingCart className="h-5 w-5" />,
    features: [
      { name: "Add to Cart", description: "Add product with quantity to cart", status: "done", notes: "CartContext with addItem action" },
      { name: "Cart Sidebar/Popup", description: "Slide-out cart drawer", status: "done", notes: "AddToCartPopup with cart summary" },
      { name: "Quantity Update", description: "Change item quantity in cart", status: "done", notes: "Increment/decrement controls per cart item" },
      { name: "Remove from Cart", description: "Remove individual items from cart", status: "done", notes: "Remove button per cart item" },
      { name: "Cart Persistence", description: "Cart persists across sessions", status: "done", notes: "CartContext with localStorage persistence" },
      { name: "Cart Totals Calculation", description: "Subtotal, tax, shipping, discount, grand total", status: "done", notes: "Real-time totals calculation in CartContext" },
      { name: "Empty Cart State", description: "Friendly empty cart message with CTA", status: "done", notes: "Empty state with 'Continue Shopping' link" },
      { name: "Cart Page", description: "Full-page cart view with detailed item list", status: "done", notes: "StorefrontCart page with editable cart table" },
    ],
  },
  {
    category: "Product Variants & Options",
    icon: <Layers className="h-5 w-5" />,
    features: [
      { name: "Variant Creation", description: "Create size/color/material variants", status: "done", notes: "product_variants table with option values" },
      { name: "Variant SKU", description: "Unique SKU per variant", status: "done", notes: "sku column on product_variants" },
      { name: "Variant Pricing", description: "Different price per variant", status: "done", notes: "price_adjustment or override price per variant" },
      { name: "Variant Stock", description: "Independent stock tracking per variant", status: "done", notes: "variant_id on inventory_stock for per-variant quantity" },
      { name: "Variant Images", description: "Different images per variant", status: "done", notes: "Variant-specific image assignment" },
      { name: "Option Selection UI", description: "Dropdown/swatch selector on storefront", status: "done", notes: "Variant selector on StorefrontProductDetail" },
      { name: "Out of Stock Variants", description: "Disable selection of out-of-stock variants", status: "done", notes: "Variant availability check against inventory" },
    ],
  },
  {
    category: "Product Addons & Customisation",
    icon: <Puzzle className="h-5 w-5" />,
    features: [
      { name: "Addon Group CRUD", description: "Create addon groups for products", status: "done", notes: "ProductAddonsTab with addon group management" },
      { name: "Addon Options", description: "Options within groups: checkbox, radio, text", status: "done", notes: "Addon options with type: checkbox, radio, text, dropdown" },
      { name: "Addon Pricing", description: "Additional cost per addon selection", status: "done", notes: "Price adjustment per addon option" },
      { name: "Required Addons", description: "Mark addon groups as required", status: "done", notes: "is_required flag on addon groups" },
      { name: "Addon Display on Storefront", description: "Addon options shown on product detail", status: "done", notes: "Addon selection UI on StorefrontProductDetail" },
    ],
  },
  {
    category: "Product Kit / Bundle System",
    icon: <Package className="h-5 w-5" />,
    features: [
      { name: "Kit Product Type", description: "Mark products as kit/bundle type", status: "done", notes: "product_type = 'kit' on products table" },
      { name: "Kit Components", description: "Define component products and quantities", status: "done", notes: "kit_components table linking kit to component products" },
      { name: "Optional Components", description: "Some components optional in kit", status: "done", notes: "is_optional flag on kit_components" },
      { name: "Swappable Components", description: "Allow swapping components within a group", status: "done", notes: "is_swappable and swap_group on kit_components" },
      { name: "Kit Stock Calculation", description: "Kit stock = min(component stocks / qty)", status: "done", notes: "Available quantity derived from component availability" },
      { name: "Kit Components Tab", description: "Admin UI for managing kit components", status: "done", notes: "KitComponentsTab on product edit form" },
    ],
  },
];

// ═══════ 671–710: TEMPLATE ENGINE, STOREFRONT CHROME & FINAL SYSTEMS ═══════
const templateAndChromeFeatures: FeatureCategory[] = [
  {
    category: "B@SE Template Engine",
    icon: <Code className="h-5 w-5" />,
    features: [
      { name: "Template Rendering", description: "Parse and render B@SE template syntax", status: "done", notes: "base-template-engine.ts with variable interpolation" },
      { name: "Conditional Blocks", description: "IF/ELSE logic in templates", status: "done", notes: "{% if condition %}...{% endif %} support" },
      { name: "Loop Blocks", description: "FOR loops in templates for collections", status: "done", notes: "{% for item in collection %}...{% endfor %}" },
      { name: "Variable Interpolation", description: "{{ variable }} replacement in templates", status: "done", notes: "Double-curly variable substitution with dot notation" },
      { name: "Filter Functions", description: "{{ value | filter }} for formatting", status: "done", notes: "Filters: money, date, truncate, upcase, downcase" },
      { name: "Template Inheritance", description: "Base/child template pattern", status: "done", notes: "Layout templates with content block insertion" },
      { name: "RenderedTemplate Component", description: "React component that renders B@SE templates", status: "done", notes: "RenderedTemplate component with context data binding" },
    ],
  },
  {
    category: "Theme / Template Management",
    icon: <Palette className="h-5 w-5" />,
    features: [
      { name: "Template CRUD", description: "Create and edit storefront templates", status: "done", notes: "Templates page with template editor" },
      { name: "Template Types", description: "Header, footer, product, collection, page templates", status: "done", notes: "Template types for different storefront sections" },
      { name: "Template Preview", description: "Preview template rendering before publish", status: "done", notes: "Live preview with sample data" },
      { name: "Default Templates", description: "Fallback templates for each section", status: "done", notes: "Default template seeding for new stores" },
      { name: "CSS Customisation", description: "Custom CSS per store/theme", status: "done", notes: "Custom CSS field in store settings" },
    ],
  },
  {
    category: "Storefront Header & Navigation",
    icon: <LayoutDashboard className="h-5 w-5" />,
    features: [
      { name: "Logo Display", description: "Store logo in header", status: "done", notes: "Logo from store settings displayed in StorefrontLayout" },
      { name: "Main Navigation Menu", description: "Category-based navigation menu", status: "done", notes: "Dynamic menu from categories with nested dropdowns" },
      { name: "Search Bar", description: "Product search in header", status: "done", notes: "StorefrontSearch with instant results dropdown" },
      { name: "Cart Icon with Count", description: "Shopping cart icon with item count badge", status: "done", notes: "Cart icon in header with CartContext item count" },
      { name: "Account Link", description: "Login/Account link in header", status: "done", notes: "Conditional login vs account link based on auth state" },
      { name: "Wishlist Link", description: "Heart icon linking to wishlist", status: "done", notes: "Wishlist icon with count in header" },
      { name: "Currency Switcher in Header", description: "Currency selector in header", status: "done", notes: "CurrencySwitcher component in header bar" },
      { name: "Language Switcher in Header", description: "Language selector in header", status: "done", notes: "LanguageSwitcher component in header bar" },
      { name: "Mobile Hamburger Menu", description: "Responsive mobile navigation drawer", status: "done", notes: "StorefrontSidebar sheet on mobile breakpoints" },
    ],
  },
  {
    category: "Storefront Footer",
    icon: <LayoutDashboard className="h-5 w-5" />,
    features: [
      { name: "Footer Links", description: "Configurable footer link columns", status: "done", notes: "Footer sections with policy, info, and account links" },
      { name: "Newsletter Signup", description: "Email capture form in footer", status: "done", notes: "NewsletterSignup component in footer" },
      { name: "Social Media Links", description: "Social media icon links", status: "done", notes: "Facebook, Instagram, Twitter icons in footer" },
      { name: "Payment Method Icons", description: "Accepted payment method badges", status: "done", notes: "Visa, Mastercard, PayPal icons in footer" },
      { name: "Copyright Notice", description: "Dynamic year copyright text", status: "done", notes: "© {year} {store_name} in footer" },
    ],
  },
  {
    category: "Product Listing Page",
    icon: <Package className="h-5 w-5" />,
    features: [
      { name: "Product Grid", description: "Responsive product card grid", status: "done", notes: "StorefrontProducts with grid-cols responsive layout" },
      { name: "Category Filtering", description: "Filter products by category", status: "done", notes: "Category sidebar filter with nested categories" },
      { name: "Price Range Filter", description: "Filter by min/max price", status: "done", notes: "Price range slider/inputs" },
      { name: "Sort Options", description: "Sort by price, name, newest, popularity", status: "done", notes: "Sort dropdown with multiple sort fields" },
      { name: "Pagination", description: "Page navigation for product listing", status: "done", notes: "TablePagination with page numbers and prev/next" },
      { name: "Product Card", description: "Card with image, title, price, rating", status: "done", notes: "Product card with hover effects and quick actions" },
      { name: "Quick View", description: "Quick view modal on product hover", status: "done", notes: "ProductQuickView modal with key product details" },
      { name: "Add to Cart from Listing", description: "Add to cart button on product cards", status: "done", notes: "Quick add-to-cart on product card hover" },
      { name: "Product Badges", description: "Sale, New, Out of Stock badges on cards", status: "done", notes: "ProductBadges component with conditional badges" },
    ],
  },
  {
    category: "Product Detail Page",
    icon: <Package className="h-5 w-5" />,
    features: [
      { name: "Image Gallery", description: "Multiple product images with thumbnail nav", status: "done", notes: "Image gallery with thumbnail strip on StorefrontProductDetail" },
      { name: "Image Lightbox", description: "Full-screen image zoom on click", status: "done", notes: "ImageLightbox component with zoom and navigation" },
      { name: "Price Display", description: "Current price with optional compare-at price", status: "done", notes: "Sale price with strikethrough original price" },
      { name: "Variant Selector", description: "Size/color/option selector", status: "done", notes: "Variant dropdown/swatch on product detail" },
      { name: "Quantity Selector", description: "Quantity input with +/- controls", status: "done", notes: "Quantity stepper before add-to-cart" },
      { name: "Add to Cart Button", description: "Primary CTA to add product to cart", status: "done", notes: "Add to Cart button with loading state" },
      { name: "Product Description", description: "Rich HTML product description", status: "done", notes: "Full description with HTML rendering" },
      { name: "Product Specifications", description: "Specification table/list", status: "done", notes: "Product specifics displayed as attribute table" },
      { name: "Related Products", description: "Related products carousel", status: "done", notes: "Related products section based on category/tags" },
      { name: "Breadcrumb Navigation", description: "Category breadcrumb trail", status: "done", notes: "Breadcrumb showing Home > Category > Product" },
    ],
  },
  {
    category: "Customer Account Pages",
    icon: <UserCheck className="h-5 w-5" />,
    features: [
      { name: "Account Dashboard", description: "Overview with recent orders and details", status: "done", notes: "StorefrontAccount with order history and profile" },
      { name: "Order History", description: "List of past orders with status", status: "done", notes: "Order list with order number, date, status, total" },
      { name: "Order Detail View", description: "Detailed view of single order", status: "done", notes: "Order detail with items, totals, tracking, status" },
      { name: "Address Book", description: "Manage saved addresses", status: "done", notes: "Address list with add/edit/delete and default selection" },
      { name: "Profile Edit", description: "Edit name, email, phone", status: "done", notes: "Profile form with save action" },
      { name: "Password Change", description: "Change password from account", status: "done", notes: "Password change form with current/new password" },
      { name: "Digital Downloads", description: "Access purchased digital products", status: "done", notes: "Download links for purchased digital items" },
      { name: "Subscription Management", description: "View and manage active subscriptions", status: "done", notes: "Subscription list with pause/cancel actions" },
    ],
  },
  {
    category: "Storefront Auth Pages",
    icon: <Key className="h-5 w-5" />,
    features: [
      { name: "Storefront Login", description: "Customer login page", status: "done", notes: "StorefrontLogin with email/password form" },
      { name: "Storefront Signup", description: "Customer registration page", status: "done", notes: "StorefrontSignup with registration form" },
      { name: "Forgot Password", description: "Password reset request page", status: "done", notes: "ForgotPassword with email input and reset link" },
      { name: "Reset Password", description: "Set new password from reset link", status: "done", notes: "ResetPassword with new password form" },
      { name: "Forgot Username", description: "Recover username by email", status: "done", notes: "StorefrontForgotUsername with email lookup" },
    ],
  },
  {
    category: "SEO & Meta Tags",
    icon: <Globe className="h-5 w-5" />,
    features: [
      { name: "Dynamic Page Title", description: "Unique title tag per page", status: "done", notes: "SEOHead sets document.title dynamically" },
      { name: "Meta Description", description: "Custom meta description per page", status: "done", notes: "Meta description tag in SEOHead" },
      { name: "Open Graph Tags", description: "OG tags for social sharing", status: "done", notes: "og:title, og:description, og:image in SEOHead" },
      { name: "Canonical URL", description: "Canonical tag to prevent duplicate content", status: "done", notes: "Canonical link tag in SEOHead" },
      { name: "JSON-LD Schema", description: "Structured data for products and pages", status: "done", notes: "Product schema markup for Google rich results" },
      { name: "Robots.txt", description: "Robots.txt for crawler directives", status: "done", notes: "public/robots.txt with sitemap reference" },
      { name: "XML Sitemap", description: "Auto-generated sitemap for search engines", status: "done", notes: "sitemap edge function generating product/page URLs" },
      { name: "Alt Text on Images", description: "Alt attributes on all product images", status: "done", notes: "Alt text from product title or custom alt field" },
    ],
  },
  {
    category: "Error Handling & Edge Cases",
    icon: <AlertTriangle className="h-5 w-5" />,
    features: [
      { name: "404 Not Found Page", description: "Custom 404 page for missing routes", status: "done", notes: "NotFound page with search and navigation links" },
      { name: "Loading States", description: "Skeleton/spinner loading states throughout", status: "done", notes: "Skeleton components and loading spinners on data fetch" },
      { name: "Empty States", description: "Friendly empty state messages", status: "done", notes: "Empty state illustrations with CTAs on all list pages" },
      { name: "Toast Notifications", description: "Success/error toast messages", status: "done", notes: "Sonner toasts for all CRUD operations" },
      { name: "Form Validation", description: "Client-side form validation", status: "done", notes: "Required fields, email format, min/max validation" },
      { name: "Error Boundaries", description: "React error boundaries for crash recovery", status: "done", notes: "Error boundary wrapping route components" },
    ],
  },
];

// ═══════ 711–750: TEMPLATE ENGINE DEEP, ADVANCED PRODUCT, & REMAINING SYSTEMS ═══════
const templateDeepFeatures: FeatureCategory[] = [
  {
    category: "B@SE Template Engine — Advanced",
    icon: <Code className="h-5 w-5" />,
    features: [
      { name: "Include Tags", description: "[!include!] for recursive template inclusion", status: "done", notes: "Recursive include resolution in base-template-engine" },
      { name: "Thumblist Iterator", description: "[%thumblist%] for image thumbnail loops", status: "done", notes: "Thumblist block rendering product image galleries" },
      { name: "Thumb Block", description: "Individual thumb rendering within thumblist", status: "done", notes: "Thumb block with image URL, alt, and index context" },
      { name: "Scheduled Blocks", description: "Template blocks visible only within date range", status: "done", notes: "Date-aware block rendering for promotions" },
      { name: "AJAX Partial Rendering", description: "Fetch and render template partials via AJAX", status: "done", notes: "Dynamic partial loading for page segment updates" },
      { name: "Context-Aware Data Injection", description: "Inject product/variant/tier data into templates", status: "done", notes: "Context object with product, variants, specifics, pricing tiers" },
      { name: "Nested Variable Access", description: "Dot notation for nested objects: product.category.name", status: "done", notes: "Recursive dot-path resolution in variable interpolation" },
      { name: "Default Value Fallback", description: "{{ var | default: 'fallback' }} syntax", status: "done", notes: "Default filter for undefined variables" },
    ],
  },
  {
    category: "Template Data Contexts",
    icon: <Database className="h-5 w-5" />,
    features: [
      { name: "Product Context", description: "Product data available in templates", status: "done", notes: "title, price, description, images, SKU, status" },
      { name: "Variant Context", description: "Variant data injected into templates", status: "done", notes: "variant.name, variant.sku, variant.price, variant.stock" },
      { name: "Specifics Context", description: "Product specifics/attributes in templates", status: "done", notes: "Specifics as key-value pairs for spec tables" },
      { name: "Pricing Tier Context", description: "Quantity-break pricing tiers in templates", status: "done", notes: "Tier array with qty, price for bulk pricing display" },
      { name: "Category Context", description: "Category data for collection pages", status: "done", notes: "category.name, category.description, category.image" },
      { name: "Store Context", description: "Store-level data: name, logo, currency", status: "done", notes: "Global store context available in all templates" },
      { name: "Cart Context", description: "Current cart data in templates", status: "done", notes: "cart.items, cart.total, cart.item_count" },
      { name: "Customer Context", description: "Logged-in customer data in templates", status: "done", notes: "customer.name, customer.email, customer.group" },
    ],
  },
  {
    category: "Product Scheduling & Visibility",
    icon: <Timer className="h-5 w-5" />,
    features: [
      { name: "Publish Date", description: "Schedule product to go live at future date", status: "done", notes: "published_at date on products for timed visibility" },
      { name: "Unpublish Date", description: "Auto-hide product after end date", status: "done", notes: "End date for automatic product removal from storefront" },
      { name: "Draft Status", description: "Keep product as draft until ready", status: "done", notes: "status=draft hides product from storefront" },
      { name: "Visibility Toggle", description: "Manual show/hide product toggle", status: "done", notes: "is_active toggle on products" },
      { name: "Channel Visibility", description: "Show product on specific channels only", status: "done", notes: "Channel flags: storefront, POS, marketplace visibility" },
    ],
  },
  {
    category: "Product Pricing — Advanced",
    icon: <DollarSign className="h-5 w-5" />,
    features: [
      { name: "Cost Price Tracking", description: "Track cost price for margin calculation", status: "done", notes: "cost_price column on products" },
      { name: "Compare-At Price", description: "Original price for sale display", status: "done", notes: "compare_at_price for strikethrough pricing" },
      { name: "Sale Price with Dates", description: "Scheduled sale pricing", status: "done", notes: "Sale price with starts_at and expires_at" },
      { name: "Margin Calculation", description: "Auto-calculate profit margin", status: "done", notes: "Margin = (price - cost_price) / price × 100" },
      { name: "Price per Unit", description: "Unit pricing for bulk/weight products", status: "done", notes: "Price per kg/litre/unit display" },
      { name: "Tax-Inclusive Toggle", description: "Display prices including or excluding tax", status: "done", notes: "Tax-inclusive pricing display based on store setting" },
    ],
  },
  {
    category: "Product SEO & Metadata",
    icon: <Globe className="h-5 w-5" />,
    features: [
      { name: "SEO Title per Product", description: "Custom SEO title override", status: "done", notes: "seo_title column on products" },
      { name: "SEO Description per Product", description: "Custom meta description override", status: "done", notes: "seo_description column on products" },
      { name: "URL Slug", description: "SEO-friendly URL slug per product", status: "done", notes: "slug column with auto-generation from title" },
      { name: "Canonical URL", description: "Prevent duplicate content for variants", status: "done", notes: "Canonical URL pointing to main product page" },
      { name: "Product Schema Markup", description: "JSON-LD Product schema for rich results", status: "done", notes: "Structured data with name, price, availability, reviews" },
    ],
  },
  {
    category: "Product Relations & Cross-Sell",
    icon: <Link className="h-5 w-5" />,
    features: [
      { name: "Related Products", description: "Manually linked related products", status: "done", notes: "product_relations table with relation_type=related" },
      { name: "Cross-Sell Products", description: "Suggested add-ons at checkout", status: "done", notes: "relation_type=cross_sell for checkout suggestions" },
      { name: "Up-Sell Products", description: "Higher-value alternatives on product page", status: "done", notes: "relation_type=up_sell for premium alternatives" },
      { name: "Also Bought Together", description: "Products frequently purchased together", status: "done", notes: "Algorithmic or manual 'bought together' associations" },
      { name: "Accessory Products", description: "Compatible accessories linkage", status: "done", notes: "relation_type=accessory for compatible items" },
    ],
  },
  {
    category: "Product Tags & Badges",
    icon: <Tag className="h-5 w-5" />,
    features: [
      { name: "Product Tagging", description: "Apply tags for filtering and grouping", status: "done", notes: "tags array column on products" },
      { name: "Tag-Based Filtering", description: "Filter products by tags on storefront", status: "done", notes: "Tag filter in storefront product listing" },
      { name: "BaseTag Component", description: "Reusable tag display component", status: "done", notes: "BaseTag component with color-coded tag display" },
      { name: "New Badge", description: "Auto 'New' badge for recent products", status: "done", notes: "ProductBadges shows 'New' for recently created items" },
      { name: "Sale Badge", description: "Sale badge when compare-at price is set", status: "done", notes: "ProductBadges shows 'Sale' with discount percentage" },
      { name: "Out of Stock Badge", description: "Badge when product is unavailable", status: "done", notes: "ProductBadges shows 'Out of Stock' on zero inventory" },
      { name: "Custom Badges", description: "Admin-defined custom product badges", status: "done", notes: "Custom badge text and color via product metadata" },
    ],
  },
  {
    category: "Accounting Integration Details",
    icon: <Receipt className="h-5 w-5" />,
    features: [
      { name: "Xero Invoice Sync", description: "Push invoices to Xero", status: "partial", notes: "xero-sync edge function, requires Xero API credentials" },
      { name: "Xero Payment Sync", description: "Sync payments to Xero invoices", status: "partial", notes: "Payment reconciliation with Xero" },
      { name: "Xero Contact Sync", description: "Sync customers as Xero contacts", status: "partial", notes: "Customer-to-contact mapping" },
      { name: "MYOB Integration", description: "Sync orders and invoices to MYOB", status: "partial", notes: "MYOB sync structure, requires MYOB API key" },
      { name: "Chart of Accounts Mapping", description: "Map store accounts to accounting software", status: "done", notes: "Account code mapping configuration" },
      { name: "Tax Code Mapping", description: "Map store tax rates to accounting tax codes", status: "done", notes: "Tax code mapping for accounting sync" },
    ],
  },
  {
    category: "Google Shopping Feed",
    icon: <Globe className="h-5 w-5" />,
    features: [
      { name: "Feed Generation", description: "Generate Google Merchant Center feed", status: "done", notes: "google-shopping-feed edge function generating XML feed" },
      { name: "Feed Product Mapping", description: "Map product fields to Google attributes", status: "done", notes: "Title, description, price, image, availability mapping" },
      { name: "Feed Category Mapping", description: "Map categories to Google product taxonomy", status: "done", notes: "Google product category assignment" },
      { name: "Feed Filtering", description: "Include/exclude products from feed", status: "done", notes: "Active, in-stock products included by default" },
      { name: "Feed URL Endpoint", description: "Public URL for Google Merchant to fetch", status: "done", notes: "Edge function URL as feed endpoint" },
    ],
  },
  {
    category: "Sitemap & Crawlability",
    icon: <Globe className="h-5 w-5" />,
    features: [
      { name: "Dynamic Sitemap Generation", description: "Auto-generate XML sitemap from live data", status: "done", notes: "sitemap edge function querying products, categories, pages" },
      { name: "Product URLs in Sitemap", description: "All active product URLs included", status: "done", notes: "Product slug-based URLs with lastmod dates" },
      { name: "Category URLs in Sitemap", description: "Category page URLs included", status: "done", notes: "Category slug-based URLs" },
      { name: "Content Page URLs", description: "CMS page URLs in sitemap", status: "done", notes: "Published content page URLs" },
      { name: "Sitemap Index", description: "Sitemap index for large sites", status: "done", notes: "Index sitemap referencing sub-sitemaps" },
    ],
  },
];

// ═══════ 751–800: ADMIN UI PATTERNS, DATA HOOKS & FINAL INFRASTRUCTURE ═══════
const adminInfraFeatures: FeatureCategory[] = [
  {
    category: "Admin Table Patterns",
    icon: <LayoutDashboard className="h-5 w-5" />,
    features: [
      { name: "Sortable Columns", description: "Click column headers to sort", status: "done", notes: "Sortable table headers across all admin list pages" },
      { name: "Search / Filter Bar", description: "Search input filtering table rows", status: "done", notes: "Debounced search on all entity list pages" },
      { name: "Status Filter Tabs", description: "Tab bar filtering by status (All, Active, Draft)", status: "done", notes: "Tab-based status filter on Products, Orders, etc." },
      { name: "Bulk Selection Checkboxes", description: "Select multiple rows for bulk actions", status: "done", notes: "Checkbox column with select-all header checkbox" },
      { name: "Pagination Controls", description: "Page navigation with page size options", status: "done", notes: "TablePagination component with prev/next and page numbers" },
      { name: "Row Actions Menu", description: "Dropdown menu per row: edit, delete, duplicate", status: "done", notes: "DropdownMenu with entity-specific actions" },
      { name: "Column Visibility", description: "Toggle visible columns on tables", status: "done", notes: "Column visibility options on wider tables" },
      { name: "Responsive Table", description: "Tables scroll horizontally on mobile", status: "done", notes: "Overflow-x-auto wrapper on admin tables" },
    ],
  },
  {
    category: "Admin Form Patterns",
    icon: <PenTool className="h-5 w-5" />,
    features: [
      { name: "Create/Edit Forms", description: "Consistent form layout for all entities", status: "done", notes: "Card-based form sections with labels and descriptions" },
      { name: "Form Validation", description: "Required field validation with error messages", status: "done", notes: "Client-side validation with inline error display" },
      { name: "Success/Error Toasts", description: "Toast notification on save/delete", status: "done", notes: "Sonner toast on all form submissions" },
      { name: "Unsaved Changes Warning", description: "Warn before navigating away from dirty form", status: "done", notes: "Dirty state tracking on form modifications" },
      { name: "Delete Confirmation Dialog", description: "Confirm before destructive actions", status: "done", notes: "AlertDialog confirmation on all delete actions" },
      { name: "Rich Text Fields", description: "WYSIWYG editor for description fields", status: "done", notes: "RichTextEditor component on content/product forms" },
      { name: "Date Picker Fields", description: "Calendar date picker for date inputs", status: "done", notes: "Calendar component for date selection" },
      { name: "Select / Combobox", description: "Searchable dropdown for entity selection", status: "done", notes: "Select and Command-based combobox components" },
    ],
  },
  {
    category: "Data Fetching & State (use-data hook)",
    icon: <Database className="h-5 w-5" />,
    features: [
      { name: "useData Hook", description: "Generic data fetching hook for all entities", status: "done", notes: "use-data.ts with useQuery wrapping Supabase queries" },
      { name: "Store-Scoped Queries", description: "All queries filtered by current store", status: "done", notes: "store_id filter applied in useData hook" },
      { name: "Automatic Refetch", description: "Refetch on window focus and mutation", status: "done", notes: "React Query refetchOnWindowFocus and invalidation" },
      { name: "Optimistic Mutations", description: "Instant UI update before server confirms", status: "done", notes: "useMutation with optimistic update pattern" },
      { name: "Error State Handling", description: "Error display on failed queries", status: "done", notes: "Error state with retry option" },
      { name: "Loading Skeletons", description: "Skeleton UI during data loading", status: "done", notes: "Skeleton components matching layout shape" },
    ],
  },
  {
    category: "Admin Dashboard KPIs",
    icon: <BarChart3 className="h-5 w-5" />,
    features: [
      { name: "Revenue Today", description: "Today's total revenue card", status: "done", notes: "Sum of today's paid orders" },
      { name: "Orders Today", description: "Number of orders placed today", status: "done", notes: "Count of today's orders" },
      { name: "New Customers", description: "New customer signups this period", status: "done", notes: "Customer count with date filter" },
      { name: "Conversion Rate", description: "Checkout conversion rate metric", status: "done", notes: "Orders / sessions calculation" },
      { name: "Revenue Chart", description: "Revenue trend chart (7/30/90 days)", status: "done", notes: "Recharts line/bar chart with date range toggle" },
      { name: "Top Products", description: "Best-selling products list", status: "done", notes: "Top products by revenue or quantity" },
      { name: "Recent Orders", description: "Latest orders quick list", status: "done", notes: "Recent orders table on dashboard" },
      { name: "Low Stock Warnings", description: "Products below reorder threshold", status: "done", notes: "Low stock product list widget" },
    ],
  },
  {
    category: "Admin Sidebar Navigation",
    icon: <LayoutDashboard className="h-5 w-5" />,
    features: [
      { name: "Collapsible Sidebar", description: "Sidebar collapses to icons on desktop", status: "done", notes: "SidebarProvider with collapsible state" },
      { name: "Nested Menu Groups", description: "Grouped menu items with collapsible sections", status: "done", notes: "Collapsible menu groups: Catalog, Sales, Marketing, etc." },
      { name: "Active Route Highlighting", description: "Current page highlighted in sidebar", status: "done", notes: "NavLink with active class based on route match" },
      { name: "Badge Counts", description: "Notification badges on menu items", status: "done", notes: "Badge count on Orders, Returns menu items" },
      { name: "Store Switcher", description: "Switch between multiple stores", status: "done", notes: "Store selector dropdown in sidebar header" },
      { name: "User Profile Menu", description: "User avatar with logout/settings in sidebar", status: "done", notes: "User section at bottom of sidebar" },
    ],
  },
  {
    category: "Print Document System",
    icon: <Printer className="h-5 w-5" />,
    features: [
      { name: "Invoice Template", description: "Professional invoice layout", status: "done", notes: "PrintInvoice with store branding, line items, totals" },
      { name: "Packing Slip Template", description: "Packing slip with items and addresses", status: "done", notes: "PrintPackingSlip with pick list and shipping info" },
      { name: "Shipping Label Template", description: "Shipping label with barcode", status: "done", notes: "PrintShippingLabel with address blocks and barcode" },
      { name: "Quote Template", description: "Professional quote document", status: "done", notes: "PrintQuote with line items, terms, validity" },
      { name: "Purchase Order Template", description: "PO document for suppliers", status: "done", notes: "PrintPurchaseOrder with supplier details and items" },
      { name: "Return Label Template", description: "Return shipping label with RMA", status: "done", notes: "PrintReturnLabel with return address and RMA number" },
      { name: "Customer Statement Template", description: "Account statement document", status: "done", notes: "PrintCustomerStatement with transactions and balance" },
      { name: "Gift Voucher Template", description: "Printable gift voucher design", status: "done", notes: "PrintGiftVoucher with code, value, and message" },
      { name: "Barcode Label Template", description: "Product barcode label sheet", status: "done", notes: "PrintBarcodeLabels with configurable label grid" },
      { name: "Payment Receipt Template", description: "Payment confirmation receipt", status: "done", notes: "PrintPaymentReceipt with payment details" },
      { name: "Pick List Template", description: "Warehouse pick list document", status: "done", notes: "PrintPickList with products sorted by bin location" },
      { name: "@media print CSS", description: "Print-optimized stylesheets", status: "done", notes: "Print-specific CSS hiding nav, buttons, adjusting layout" },
    ],
  },
  {
    category: "Subdomain & Multi-Tenant Routing",
    icon: <Globe className="h-5 w-5" />,
    features: [
      { name: "Subdomain Detection", description: "Detect store slug from subdomain", status: "done", notes: "getSubdomainSlug() in subdomain.ts" },
      { name: "Subdomain-Based Routing", description: "Route to storefront vs admin based on subdomain", status: "done", notes: "App.tsx routing logic checks subdomain presence" },
      { name: "Store Lookup by Slug", description: "Fetch store data by subdomain slug", status: "done", notes: "Supabase query on stores.slug matching subdomain" },
      { name: "Admin Panel on Subdomain", description: "/_cpanel routes for admin on subdomain", status: "done", notes: "/_cpanel prefix for admin routes under subdomain" },
      { name: "Storefront on Root", description: "Storefront pages served at root on subdomain", status: "done", notes: "/ routes serve storefront when subdomain detected" },
    ],
  },
  {
    category: "Authentication Flow",
    icon: <Key className="h-5 w-5" />,
    features: [
      { name: "Email/Password Login", description: "Standard email and password authentication", status: "done", notes: "Login page with signInWithPassword" },
      { name: "Email/Password Signup", description: "User registration with email verification", status: "done", notes: "Signup page with signUp and email confirmation" },
      { name: "Password Reset Flow", description: "Forgot password → email → reset", status: "done", notes: "ForgotPassword → email link → ResetPassword" },
      { name: "Session Persistence", description: "Auth session persists across tabs/refresh", status: "done", notes: "localStorage session with autoRefreshToken" },
      { name: "Auth State Context", description: "Global auth state via React context", status: "done", notes: "AuthContext providing user, loading, signOut" },
      { name: "Protected Routes", description: "RequireAuth wrapper redirects to login", status: "done", notes: "RequireAuth component checking auth state" },
      { name: "Platform Admin Guard", description: "RequirePlatformAdmin checks platform role", status: "done", notes: "RequirePlatformAdmin with is_platform_admin RPC check" },
      { name: "Auto-Redirect on Auth", description: "Redirect to dashboard after login", status: "done", notes: "Login success navigates to /dashboard or /_cpanel" },
    ],
  },
  {
    category: "Addon / Plugin System",
    icon: <Puzzle className="h-5 w-5" />,
    features: [
      { name: "Addon Catalog", description: "Browse available addons/plugins", status: "done", notes: "Addons page with addon_catalog browsing" },
      { name: "Addon Categories", description: "Filter addons by category", status: "done", notes: "Category filter: shipping, payment, marketing, analytics" },
      { name: "Addon Install", description: "One-click addon installation", status: "done", notes: "Install action creates store_addons record" },
      { name: "Addon Uninstall", description: "Remove addon from store", status: "done", notes: "Uninstall action deletes store_addons record" },
      { name: "Addon Configuration", description: "Per-addon settings after install", status: "done", notes: "Configuration form per addon with settings JSON" },
      { name: "Free vs Paid Addons", description: "Distinguish free and paid addons", status: "done", notes: "is_free flag and price on addon_catalog" },
      { name: "Install Count", description: "Show how many stores use each addon", status: "done", notes: "install_count column on addon_catalog" },
    ],
  },
  {
    category: "Settings Page Sections",
    icon: <Settings className="h-5 w-5" />,
    features: [
      { name: "General Settings", description: "Store name, email, phone, address", status: "done", notes: "General tab on Settings page" },
      { name: "Checkout Settings", description: "Guest checkout, terms, payment options", status: "done", notes: "Checkout configuration tab" },
      { name: "Notification Settings", description: "Email notification preferences", status: "done", notes: "Notification toggle per event type" },
      { name: "Tax Settings", description: "Tax display and calculation preferences", status: "done", notes: "Tax configuration: inclusive/exclusive, rates" },
      { name: "Shipping Settings", description: "Default shipping and handling config", status: "done", notes: "Shipping defaults tab" },
      { name: "SMTP Configuration", description: "Email server settings for transactional email", status: "done", notes: "SMTP host, port, username, password, encryption" },
      { name: "Store Logo Upload", description: "Upload store logo for branding", status: "done", notes: "Logo upload with preview" },
      { name: "Custom CSS", description: "Custom CSS for storefront appearance", status: "done", notes: "CSS textarea for storefront customization" },
    ],
  },
];

// Merge all feature data and deduplicate
function deduplicateFeatures(categories: FeatureCategory[]): FeatureCategory[] {
  const categoryMap = new Map<string, FeatureCategory>();
  for (const cat of categories) {
    const existing = categoryMap.get(cat.category);
    if (existing) {
      // Merge features, dedup by name (keep first occurrence)
      const seenNames = new Set(existing.features.map(f => f.name));
      for (const f of cat.features) {
        if (!seenNames.has(f.name)) {
          existing.features.push(f);
          seenNames.add(f.name);
        }
      }
    } else {
      categoryMap.set(cat.category, { ...cat, features: [...cat.features] });
    }
  }
  return Array.from(categoryMap.values());
}

// ═══════ REMAINING MAROPOST FEATURES — WAREHOUSE, B2B, SHIPPING, PAYMENTS, MARKETPLACE, REPORTING, EMAIL, RETURNS, POS, ADMIN UX ═══════

const warehouseDeepFeatures: FeatureCategory[] = [
  {
    category: "Warehouse Management — Advanced",
    icon: <Warehouse className="h-5 w-5" />,
    features: [
      { name: "Wave Picking", description: "Group multiple orders into pick waves for efficient warehouse walks", status: "done", notes: "PickPack Waves tab with wave creation, order selection, status management, localStorage persistence" },
      { name: "Zone-Based Picking", description: "Divide warehouse into zones; assign pickers per zone", status: "done", notes: "PickPack Zones tab with zone CRUD, picker assignment, bin prefix mapping, localStorage persistence" },
      { name: "Batch Picking", description: "Pick identical SKUs across multiple orders simultaneously", status: "done", notes: "PickPack Batch Pick tab groups identical SKUs across orders with total qty, order count, and order numbers" },
      { name: "Pick Path Optimization", description: "Suggest optimal walking route through warehouse aisles", status: "done", notes: "PickPack 'Optimize Path' button sorts pick items by bin location/SKU for optimal warehouse walking route" },
      { name: "Packing Station UI", description: "Dedicated packing interface with order verification and weight check", status: "done", notes: "Enhanced pack step on PickPack page with barcode scan verification per item, carton type selection, package weight entry with max-weight validation, per-order verified item count, KPI cards (to pack, total items, verified, carton)" },
      { name: "Pack Slip Auto-Print", description: "Automatically print packing slip when order is scanned at station", status: "not_started" },
      { name: "Shipping Label Auto-Print", description: "Auto-generate and print carrier label at pack station", status: "not_started" },
      { name: "Carton Management", description: "Track carton sizes, auto-suggest best carton for items", status: "done", notes: "PickPack Cartons tab with carton type CRUD, dimensions, volume calc, max weight, localStorage persistence" },
      { name: "Multi-Carton Shipments", description: "Split single order across multiple cartons/packages", status: "done", notes: "PickPack pack step with per-order multi-carton UI: add/remove cartons, assign carton type and weight per carton, assign items to specific cartons via toggle badges, weight validation against carton max weight" },
      { name: "Bin Location Management", description: "Assign and manage bin/shelf locations per SKU", status: "done", notes: "bin_location field on inventory_stock" },
      { name: "Putaway Rules", description: "Auto-suggest bin locations for incoming inventory", status: "not_started" },
      { name: "Cycle Count Scheduling", description: "Schedule regular cycle counts by zone/category", status: "done", notes: "Stocktake Cycle Count Schedules tab with CRUD: name, frequency (daily/weekly/biweekly/monthly/quarterly), zone, category, next run date, active/paused toggle, Run Now creates pre-populated stocktake, localStorage persistence" },
      { name: "Cycle Count Variance Report", description: "Report showing discrepancies between expected and counted stock", status: "done", notes: "Stocktake detail page with 5 KPI cards (counted, match, over, under, net variance), clickable cards filter table by variance type, color-coded net variance display" },
      { name: "Receiving / Goods-In", description: "Receive purchase orders with barcode scanning and quantity verification", status: "partial", notes: "PO receiving exists" },
      { name: "Quality Check on Receive", description: "Flag items for QC inspection during goods-in process", status: "not_started" },
      { name: "Cross-Docking", description: "Route incoming goods directly to outbound without shelving", status: "not_started" },
      { name: "Warehouse Dashboard KPIs", description: "Real-time metrics: orders to pick, pack rate, shipping SLA", status: "done", notes: "WarehouseDashboard page" },
      { name: "Pick List PDF Generation", description: "Generate printable pick lists grouped by wave/zone", status: "done", notes: "PrintPickList page" },
      { name: "Barcode Scanner Integration", description: "Support USB/Bluetooth barcode scanners for pick/pack/receive", status: "done", notes: "BarcodeScanner component" },
      { name: "Mobile Warehouse App", description: "Responsive mobile UI for warehouse operations", status: "partial", notes: "Responsive but not native" },
      { name: "Carrier Manifest Generation", description: "Generate end-of-day carrier manifest for pickups", status: "done", notes: "CarrierManifest page with date picker, carrier filter, summary cards, printable manifest" },
      { name: "Carrier Pickup Scheduling", description: "Schedule carrier pickups from warehouse", status: "not_started" },
      { name: "Returns Receiving", description: "Scan and receive returned items back into inventory", status: "done", notes: "Returns Receiving tab with order number scan/entry, approved returns queue, scanned items with condition selection (good/damaged/defective/opened), per-item notes, Process button marks as refunded with receiving details in admin_notes" },
      { name: "Damaged Goods Processing", description: "Flag and quarantine damaged items during receiving", status: "not_started" },
      { name: "Warehouse User Roles", description: "Restrict warehouse staff to pick/pack only (no admin access)", status: "partial", notes: "Role system exists" },
    ],
  },
  {
    category: "Warehouse — Automation & Rules",
    icon: <Workflow className="h-5 w-5" />,
    features: [
      { name: "Auto-Assign Warehouse", description: "Route orders to nearest/best warehouse based on rules", status: "not_started" },
      { name: "Fulfillment Priority Rules", description: "Prioritize orders by shipping speed, VIP status, or age", status: "done", notes: "Settings Fulfillment tab with criteria-based rules (express shipping, VIP, order age, high value, backorder) and actions (priority levels, warehouse assignment, hold, split)" },
      { name: "Split Shipment Rules", description: "Auto-split orders when items are in different warehouses", status: "not_started" },
      { name: "Backorder Auto-Creation", description: "Auto-create backorder when stock insufficient at pick time", status: "done", notes: "Backorders table" },
      { name: "Low Stock Auto-Reorder", description: "Trigger purchase order when stock hits reorder point", status: "done", notes: "Inventory page Auto-Generate POs button creates draft POs for low-stock products" },
      { name: "Dropship Auto-Routing", description: "Route out-of-stock items to supplier for direct shipping", status: "done", notes: "dropship-notification function" },
      { name: "Dangerous Goods Flag", description: "Flag products as hazardous; restrict shipping methods", status: "done", notes: "ProductForm Handling Flags section with dangerous_goods toggle" },
      { name: "Oversized Item Flag", description: "Flag oversized items for special handling/shipping rates", status: "done", notes: "ProductForm Handling Flags section with oversized_item toggle" },
      { name: "Temperature-Sensitive Flag", description: "Mark items requiring cold chain handling", status: "done", notes: "ProductForm Handling Flags section with temperature_sensitive toggle" },
      { name: "Serial Number Tracking", description: "Track individual serial numbers per unit sold", status: "done", notes: "serial_numbers table with full CRUD in Inventory page, status tracking (available/sold/returned)" },
      { name: "Lot/Batch Tracking", description: "Track lot and batch numbers for traceability", status: "done", notes: "lot_number, batch_number on inventory_stock" },
      { name: "Expiry Date Tracking", description: "Track expiry dates; FEFO (First Expired, First Out) picking", status: "done", notes: "expiry_date on inventory_stock" },
    ],
  },
];

const shippingDeepFeatures: FeatureCategory[] = [
  {
    category: "Shipping — Carrier Integrations",
    icon: <Truck className="h-5 w-5" />,
    features: [
      { name: "Australia Post API (eParcel)", description: "Live rates, label generation, tracking for AusPost domestic", status: "partial", notes: "carrier-rates edge function stub" },
      { name: "Australia Post International", description: "International shipping via AusPost with customs declarations", status: "not_started" },
      { name: "StarTrack Integration", description: "StarTrack carrier rates and label generation", status: "partial", notes: "starshipit-sync function" },
      { name: "Aramex (Fastway) Integration", description: "Aramex/Fastway courier rates and consignment creation", status: "not_started" },
      { name: "DHL Express Integration", description: "DHL Express international shipping with duties/taxes", status: "not_started" },
      { name: "FedEx Integration", description: "FedEx domestic and international rates and labels", status: "not_started" },
      { name: "UPS Integration", description: "UPS shipping rates, labels, and tracking", status: "not_started" },
      { name: "TNT/FedEx Integration", description: "TNT Express (now FedEx) for AU/NZ", status: "not_started" },
      { name: "Sendle Integration", description: "Sendle eco-friendly parcel delivery rates", status: "not_started" },
      { name: "Couriers Please Integration", description: "Couriers Please domestic rates and booking", status: "not_started" },
      { name: "ShipStation Sync", description: "Bi-directional sync with ShipStation for multi-carrier", status: "done", notes: "shipstation-sync edge function" },
      { name: "Starshipit Sync", description: "Sync orders to Starshipit for AU/NZ carrier management", status: "done", notes: "starshipit-sync edge function" },
      { name: "Click & Collect", description: "In-store pickup option with location selection", status: "partial", notes: "Store finder + locations exist" },
      { name: "Click & Collect Notification", description: "Email/SMS when order ready for collection", status: "not_started" },
      { name: "Same-Day Delivery Option", description: "Offer same-day delivery with cutoff time configuration", status: "not_started" },
      { name: "Shipping Insurance Option", description: "Optional shipping insurance at checkout", status: "not_started" },
    ],
  },
  {
    category: "Shipping — Rates & Rules",
    icon: <Scale className="h-5 w-5" />,
    features: [
      { name: "Flat Rate Shipping", description: "Fixed shipping cost per order/item", status: "done", notes: "Shipping zones with flat rates" },
      { name: "Weight-Based Rates", description: "Shipping cost calculated by total weight", status: "done" },
      { name: "Price-Based Rates", description: "Shipping tiers based on order subtotal", status: "done" },
      { name: "Quantity-Based Rates", description: "Shipping cost based on number of items", status: "partial" },
      { name: "Dimension-Based Rates", description: "Shipping calculated from product dimensions (cubic weight)", status: "not_started" },
      { name: "Free Shipping Threshold", description: "Free shipping when order exceeds minimum amount", status: "done" },
      { name: "Free Shipping Coupon", description: "Coupon code that grants free shipping", status: "done", notes: "free_shipping field on coupons" },
      { name: "Shipping Zones (Country/State/Postcode)", description: "Define zones by country, state, or postcode range", status: "done", notes: "ShippingZones page" },
      { name: "Postcode Range Restrictions", description: "Block or surcharge specific postcode ranges", status: "partial" },
      { name: "Rural Delivery Surcharge", description: "Extra charge for rural/remote delivery postcodes", status: "not_started" },
      { name: "Per-Product Shipping Override", description: "Override shipping rules per product (e.g., always free)", status: "partial" },
      { name: "Shipping Method Display Order", description: "Control sort order of shipping options at checkout", status: "done" },
      { name: "Estimated Delivery Date Display", description: "Show estimated delivery date on product/cart pages", status: "done", notes: "DeliveryEstimate component" },
      { name: "Shipping Tracking Auto-Email", description: "Auto-send tracking number email when shipment created", status: "done", notes: "shipment-email edge function" },
      { name: "Delivery Signature Required Toggle", description: "Require signature on delivery per order/product", status: "not_started" },
      { name: "Authority to Leave Toggle", description: "Allow ATL (authority to leave) option at checkout", status: "not_started" },
      { name: "Customs Declaration Auto-Fill", description: "Auto-populate customs forms for international orders", status: "not_started" },
      { name: "HS/Tariff Code per Product", description: "Harmonized System code for customs classification", status: "not_started" },
      { name: "Country of Origin per Product", description: "Track country of manufacture for customs", status: "not_started" },
    ],
  },
];

const paymentDeepFeatures: FeatureCategory[] = [
  {
    category: "Payment Gateways — Deep",
    icon: <CreditCard className="h-5 w-5" />,
    features: [
      { name: "Stripe Connect", description: "Marketplace payments with connected accounts", status: "not_started" },
      { name: "Stripe Payment Element", description: "Unified payment form supporting cards, wallets, BNPL", status: "partial", notes: "payment-gateway edge function" },
      { name: "PayPal Standard", description: "PayPal redirect checkout flow", status: "not_started" },
      { name: "PayPal Express Checkout", description: "PayPal button on cart/product pages", status: "not_started" },
      { name: "Afterpay/Clearpay Integration", description: "Buy-now-pay-later with Afterpay widget", status: "not_started" },
      { name: "Zip (Zip Pay / Zip Money)", description: "Zip BNPL integration with installment display", status: "not_started" },
      { name: "Klarna Integration", description: "Klarna pay-later and installment options", status: "not_started" },
      { name: "eWAY Gateway", description: "eWAY payment processing for AU/NZ", status: "not_started" },
      { name: "Braintree Gateway", description: "Braintree payments with vault and PayPal", status: "not_started" },
      { name: "Square Payments", description: "Square online payment processing", status: "not_started" },
      { name: "Apple Pay", description: "Apple Pay at checkout via payment gateway", status: "not_started" },
      { name: "Google Pay", description: "Google Pay at checkout via payment gateway", status: "not_started" },
      { name: "Bank Transfer / Direct Deposit", description: "Offline payment with bank details shown", status: "partial" },
      { name: "Cash on Delivery", description: "COD payment option", status: "done", notes: "StorefrontCheckout payment method radio with card/COD options, COD note added to order" },
      { name: "Store Credit / Account Balance", description: "Allow customers to pay from store credit balance", status: "partial", notes: "Credit notes exist" },
      { name: "Gift Voucher as Payment", description: "Redeem gift voucher at checkout to reduce balance", status: "done", notes: "Gift vouchers system" },
      { name: "Loyalty Points as Payment", description: "Redeem loyalty points as partial/full payment", status: "partial", notes: "Loyalty system exists" },
      { name: "Multiple Payment Methods", description: "Split payment across multiple methods (e.g., card + gift card)", status: "not_started" },
      { name: "Saved Cards (Tokenization)", description: "Save customer card tokens for faster checkout", status: "not_started" },
      { name: "3D Secure / SCA Compliance", description: "Strong Customer Authentication for European payments", status: "not_started" },
      { name: "PCI-DSS Compliance Scope", description: "Ensure payment flow meets PCI-DSS requirements", status: "partial", notes: "Using redirect/iframe flows" },
      { name: "Refund via Gateway", description: "Issue refunds back through payment gateway automatically", status: "not_started" },
      { name: "Partial Refunds", description: "Refund partial amount of an order", status: "partial" },
      { name: "Payment Retry Logic", description: "Retry failed payments (subscriptions/layby)", status: "not_started" },
      { name: "Invoice Payment Link", description: "Send payment link via email for outstanding invoices", status: "not_started" },
    ],
  },
];

const b2bWholesaleDeepFeatures: FeatureCategory[] = [
  {
    category: "B2B & Wholesale — Advanced",
    icon: <Building className="h-5 w-5" />,
    features: [
      { name: "Trade Application Form", description: "Online wholesale account application with approval workflow", status: "partial", notes: "Customer groups exist" },
      { name: "ABN/Tax ID Validation", description: "Validate Australian Business Number on trade signup", status: "partial", notes: "abn_vat_number field on customers, validation not yet automated" },
      { name: "Wholesale Price Lists", description: "Separate price lists visible only to approved wholesale customers", status: "done", notes: "Customer group pricing" },
      { name: "Minimum Order Quantity (MOQ)", description: "Enforce minimum quantity per product for wholesale", status: "partial" },
      { name: "Minimum Order Value", description: "Enforce minimum cart total for wholesale orders", status: "done", notes: "min_order_amount on customer_groups" },
      { name: "Quote Request (RFQ)", description: "Allow B2B customers to request quotes on products", status: "done", notes: "Quotes page" },
      { name: "Quote Negotiation Workflow", description: "Back-and-forth quote editing between staff and customer", status: "partial" },
      { name: "Quote to Order Conversion", description: "Convert accepted quote directly into an order", status: "partial" },
      { name: "Quote Expiry", description: "Auto-expire quotes after configurable period", status: "partial" },
      { name: "Net Payment Terms (Net-30/60/90)", description: "Allow wholesale customers to pay on terms", status: "done", notes: "payment_terms column on customers table with Net-30/60/90 options in CustomerDetail" },
      { name: "Credit Limit per Customer", description: "Set maximum outstanding credit per wholesale account", status: "done", notes: "credit_limit column on customers table, displayed in CustomerDetail" },
      { name: "Customer Statement Generation", description: "Generate and send account statements", status: "done", notes: "PrintCustomerStatement + email function" },
      { name: "Purchase Order Number Field", description: "Allow customers to enter their PO number at checkout", status: "partial" },
      { name: "Quick Order Pad", description: "Bulk order entry by SKU and quantity", status: "done", notes: "StorefrontQuickOrder page" },
      { name: "CSV Order Upload", description: "Upload CSV of SKU/quantity pairs to create order", status: "done", notes: "StorefrontQuickOrder CSV upload with auto-SKU lookup, supports comma/tab/semicolon delimiters" },
      { name: "Reorder from Previous Order", description: "One-click reorder of previous order items", status: "done", notes: "Reorder button on storefront order list (delivered/shipped orders) and order detail view, adds all order items to cart via addToCart" },
      { name: "Sales Rep Assignment", description: "Assign sales reps to wholesale accounts", status: "done", notes: "sales_rep column on customers table, editable in CustomerDetail form with display in read-only view" },
      { name: "Sales Rep Commission Tracking", description: "Track commissions per sales rep on orders", status: "not_started" },
      { name: "Company Account with Sub-Users", description: "Company accounts with multiple buyers and permissions", status: "not_started" },
      { name: "Tax Exemption Certificate Upload", description: "Allow B2B customers to upload tax exemption docs", status: "done", notes: "tax_exempt_cert_url column on customers, URL input in CustomerDetail form with View link in read-only mode" },
      { name: "Volume Discount Tiers (Automatic)", description: "Auto-apply discounts based on order volume", status: "done", notes: "Price rules engine" },
      { name: "Contract Pricing", description: "Fixed pricing agreements per customer for specified period", status: "not_started" },
    ],
  },
];

const marketplaceDeepFeatures: FeatureCategory[] = [
  {
    category: "Marketplace Integrations — Deep",
    icon: <Globe className="h-5 w-5" />,
    features: [
      { name: "eBay Listing Templates", description: "Custom HTML listing templates for eBay products", status: "not_started" },
      { name: "eBay Category Mapping", description: "Map internal categories to eBay category tree", status: "not_started" },
      { name: "eBay Item Specifics Mapping", description: "Map product attributes to eBay required item specifics", status: "not_started" },
      { name: "eBay Inventory Sync", description: "Real-time inventory sync between store and eBay", status: "done", notes: "ebay-sync edge function" },
      { name: "eBay Order Import", description: "Import eBay orders into central order management", status: "partial" },
      { name: "eBay Price Sync", description: "Sync price changes to eBay listings", status: "partial" },
      { name: "eBay Promotion Manager", description: "Create and manage eBay promotions from admin", status: "not_started" },
      { name: "Amazon Listing Sync", description: "Sync products to Amazon marketplace", status: "not_started" },
      { name: "Amazon A+ Content", description: "Enhanced brand content for Amazon listings", status: "not_started" },
      { name: "Amazon FBA Integration", description: "Fulfillment by Amazon inventory and order sync", status: "not_started" },
      { name: "Amazon Buy Box Repricing", description: "Automated pricing to win the Buy Box", status: "not_started" },
      { name: "Catch.com.au Integration", description: "Sync products and orders with Catch marketplace", status: "not_started" },
      { name: "Kogan Integration", description: "Product and order sync with Kogan marketplace", status: "not_started" },
      { name: "MyDeal Integration", description: "Sync with MyDeal marketplace", status: "not_started" },
      { name: "Google Merchant Center Feed", description: "Product feed for Google Shopping", status: "done", notes: "google-shopping-feed edge function" },
      { name: "Google Shopping Annotations", description: "Sale price, shipping, availability annotations", status: "partial" },
      { name: "Facebook / Meta Commerce", description: "Sync products to Facebook and Instagram shops", status: "not_started" },
      { name: "TikTok Shop Integration", description: "Sync products to TikTok Shop", status: "not_started" },
      { name: "Marketplace Order Routing", description: "Route marketplace orders to correct warehouse", status: "not_started" },
      { name: "Marketplace Fee Tracking", description: "Track marketplace fees per order for profitability", status: "not_started" },
    ],
  },
];

const reportingDeepFeatures: FeatureCategory[] = [
  {
    category: "Reporting & Analytics — Advanced",
    icon: <BarChart3 className="h-5 w-5" />,
    features: [
      { name: "COGS Report", description: "Cost of Goods Sold report using product cost prices", status: "done", notes: "Analytics page Profit Margin by Product section shows COGS per product using cost_price × quantity" },
      { name: "Gross Profit Report", description: "Revenue minus COGS per product/category/period", status: "done", notes: "Analytics page Profit Margin table with revenue, cost, profit, and margin % per product" },
      { name: "Sell-Through Rate Report", description: "Percentage of inventory sold in a period", status: "done", notes: "InventoryReports sell-through tab with units sold ÷ (sold + on hand)" },
      { name: "ABC Analysis (Inventory)", description: "Classify products by revenue contribution (A/B/C tiers)", status: "done", notes: "InventoryReports ABC tab" },
      { name: "Dead Stock Report", description: "Products with zero sales in configurable period", status: "done", notes: "InventoryReports dead stock tab" },
      { name: "Customer Lifetime Value (CLV)", description: "Calculate and display customer LTV", status: "done", notes: "Predictive CLV on CustomerDetail: avg order value × purchase frequency/yr × estimated lifespan, historic CLV, avg days between orders, frequency metric" },
      { name: "Customer Cohort Analysis", description: "Retention and spend analysis by signup cohort", status: "done", notes: "Analytics page cohort table showing signup month vs order month with heat-mapped retention percentages" },
      { name: "Customer RFM Segmentation", description: "Recency/Frequency/Monetary segmentation scoring", status: "partial", notes: "Segmentation rules exist" },
      { name: "Sales by Channel Report", description: "Revenue breakdown by sales channel (web, POS, marketplace)", status: "done", notes: "Analytics page Sales by Channel table with orders, revenue, and AOV per channel" },
      { name: "Sales by Staff Report", description: "Revenue attributed to each staff member", status: "done", notes: "Analytics page Sales by Staff table using order_payments.recorded_by joined with profiles" },
      { name: "Sales by Region/State Report", description: "Geographic breakdown of revenue", status: "done", notes: "Analytics page Sales by Region table parsed from shipping_address" },
      { name: "Tax Report / BAS Report", description: "Tax collected summary for BAS/GST reporting", status: "done", notes: "Analytics page Tax Report card with total collected, taxed orders, and monthly bar chart" },
      { name: "Payment Method Report", description: "Revenue breakdown by payment method", status: "done", notes: "Analytics page Payment Status pie chart" },
      { name: "Discount Usage Report", description: "How often each coupon/discount is used and revenue impact", status: "done", notes: "Analytics page Discount/Coupon Usage table with times used, revenue generated, and discount given per coupon" },
      { name: "Conversion Funnel Report", description: "Visitor → Cart → Checkout → Purchase funnel analysis", status: "done", notes: "Analytics page Conversion Funnel visualization" },
      { name: "Product Performance Dashboard", description: "Per-product views, conversion, revenue, margin dashboard", status: "partial" },
      { name: "Inventory Valuation Report", description: "Total inventory value at cost and retail", status: "done", notes: "Analytics page Inventory Valuation card + InventoryReports valuation tab" },
      { name: "Custom Report Builder Formulas", description: "User-defined calculated columns in report builder", status: "partial", notes: "ReportBuilder page exists" },
      { name: "Scheduled Report Email", description: "Auto-email reports on schedule (daily/weekly/monthly)", status: "done", notes: "scheduled-report-email function" },
      { name: "Report Export (CSV/PDF)", description: "Export any report to CSV or PDF", status: "done", notes: "ExportWizard page" },
      { name: "Real-Time Dashboard", description: "Live updating dashboard with current day metrics", status: "done", notes: "Dashboard page" },
      { name: "Comparison Period (YoY, MoM)", description: "Compare metrics against previous period", status: "partial" },
    ],
  },
];

const emailAutomationDeepFeatures: FeatureCategory[] = [
  {
    category: "Email & Automation — Advanced",
    icon: <Mail className="h-5 w-5" />,
    features: [
      { name: "Visual Email Flow Builder", description: "Drag-and-drop automation workflow editor", status: "not_started" },
      { name: "Conditional Flow Splits", description: "Branch automation based on customer attributes/actions", status: "not_started" },
      { name: "A/B Subject Line Testing", description: "Test multiple subject lines and auto-select winner", status: "not_started" },
      { name: "Dynamic Coupon Insertion", description: "Auto-generate unique coupon codes in emails", status: "not_started" },
      { name: "Product Recommendation Block", description: "AI-powered product recommendations in emails", status: "not_started" },
      { name: "Browse Abandonment Email", description: "Email triggered by product page views without purchase", status: "done", notes: "EmailAutomations browse_abandon trigger type" },
      { name: "Cart Abandonment Series", description: "Multi-email sequence for abandoned carts", status: "done", notes: "abandoned-cart-email function" },
      { name: "Post-Purchase Follow-Up Series", description: "Review request and cross-sell emails after purchase", status: "done", notes: "order-follow-up function" },
      { name: "Win-Back Campaign", description: "Re-engage inactive customers after configurable period", status: "done", notes: "EmailAutomations winback trigger type for 30+ days inactive customers" },
      { name: "Birthday/Anniversary Email", description: "Automated email on customer birthday with offer", status: "done", notes: "EmailAutomations birthday trigger type using customer birthday field" },
      { name: "Welcome Series (Multi-Step)", description: "Multi-email onboarding sequence for new signups", status: "partial", notes: "Single welcome email exists" },
      { name: "VIP Tier Upgrade Email", description: "Notify customer when they reach new loyalty tier", status: "done", notes: "EmailAutomations vip_upgrade trigger type" },
      { name: "Subscription Renewal Reminder", description: "Remind customers before subscription renewal charge", status: "done", notes: "Subscriptions page Send Renewal Reminder button per active subscription, emails via send-email function with product, frequency, amount, and next order date" },
      { name: "Email Engagement Tracking", description: "Track opens, clicks, and conversions per email", status: "not_started" },
      { name: "Unsubscribe Management", description: "Global and per-type email unsubscribe preferences", status: "not_started" },
      { name: "SMS Automation", description: "SMS notifications for order updates and marketing", status: "done", notes: "sms-gateway edge function" },
      { name: "SMS Templates", description: "Configurable SMS message templates", status: "partial" },
      { name: "Mailchimp Deep Sync", description: "Bi-directional customer and order sync with Mailchimp", status: "done", notes: "mailchimp-sync function" },
      { name: "Klaviyo Deep Sync", description: "Event and profile sync with Klaviyo", status: "done", notes: "klaviyo-sync function" },
      { name: "Transactional Email Logs", description: "Log all sent transactional emails with status", status: "done", notes: "email_queue table" },
    ],
  },
];

const returnsRmaFeatures: FeatureCategory[] = [
  {
    category: "Returns & RMA",
    icon: <RefreshCw className="h-5 w-5" />,
    features: [
      { name: "Return Request Form (Customer)", description: "Customer-facing return request submission", status: "partial", notes: "Returns page exists" },
      { name: "Return Reason Codes", description: "Configurable return reason dropdown", status: "partial" },
      { name: "Return Authorization Workflow", description: "Staff approve/reject return requests with notes", status: "partial" },
      { name: "Return Shipping Label Generation", description: "Auto-generate prepaid return shipping label", status: "done", notes: "PrintReturnLabel page" },
      { name: "Return Tracking", description: "Track return shipment status", status: "done", notes: "StorefrontAccount Returns tab shows return progress bar (requested → approved → processing → refunded) with visual step indicator" },
      { name: "Refund to Original Payment", description: "Process refund back to original payment method", status: "not_started" },
      { name: "Refund to Store Credit", description: "Issue return refund as store credit instead of cash", status: "partial", notes: "Credit notes exist" },
      { name: "Exchange Workflow", description: "Exchange returned item for different size/color", status: "done", notes: "Allow Exchanges toggle in Settings Returns tab + replacement order creation on Returns page" },
      { name: "Restocking Fee", description: "Apply configurable restocking fee on returns", status: "done", notes: "Configurable restocking fee percentage in Settings Returns tab" },
      { name: "Return Window Configuration", description: "Set days allowed for returns per category/product", status: "done", notes: "Settings Returns tab with return window days, restocking fee %, require reason, allow exchanges, auto-approve, non-returnable categories" },
      { name: "Non-Returnable Flag", description: "Mark specific products as non-returnable", status: "done", notes: "Non-returnable categories list in Settings Returns tab" },
      { name: "Return Analytics", description: "Report on return rates by product/category/reason", status: "done", notes: "Analytics page Return Analytics table with reason breakdown, counts, refund amounts" },
      { name: "Warranty Claim Processing", description: "Separate workflow for warranty claims vs returns", status: "done", notes: "Returns page Warranty Claims tab with dedicated create dialog, claim type (repair/replace), purchase date, warranty expiry, reason codes, and description fields" },
      { name: "Credit Note Generation", description: "Auto-generate credit note on approved return", status: "done", notes: "credit_notes table" },
      { name: "Return Portal (Self-Service)", description: "Customer self-service portal for initiating returns", status: "done", notes: "StorefrontAccount Returns tab with return request dialog, order selection, reason codes, notes field, and return tracking progress bar" },
    ],
  },
];

const posDeepFeatures: FeatureCategory[] = [
  {
    category: "Point of Sale — Deep",
    icon: <Monitor className="h-5 w-5" />,
    features: [
      { name: "POS Product Grid", description: "Touch-friendly product grid with categories and search", status: "done", notes: "POS page" },
      { name: "POS Barcode Scanning", description: "Scan barcodes to add products to POS cart", status: "done" },
      { name: "POS Customer Lookup", description: "Search and attach customer to POS sale", status: "done", notes: "Customer search by name/email/phone in POS cart panel with dropdown results, selected customer displayed with clear button, attached to order on sale completion" },
      { name: "POS Discount Application", description: "Apply line-item or cart-level discounts in POS", status: "done", notes: "Per-item discount button with percent/fixed toggle, discount dialog, applied discount badge with remove, total discount shown in cart summary" },
      { name: "POS Cash Drawer Integration", description: "Open cash drawer on cash payment via hardware API", status: "not_started" },
      { name: "POS Receipt Printer", description: "Print receipts to thermal receipt printer", status: "not_started" },
      { name: "POS Card Terminal Integration", description: "Connect to EFTPOS/card terminal for tap-to-pay", status: "not_started" },
      { name: "POS Offline Mode", description: "Continue selling when internet is down, sync later", status: "not_started" },
      { name: "POS End-of-Day Report", description: "Cash up and reconciliation at end of shift", status: "done", notes: "POS page End of Day dialog with cash reconciliation" },
      { name: "POS Multi-Register Support", description: "Multiple registers with separate cash drawers", status: "not_started" },
      { name: "POS Gift Card Sell/Redeem", description: "Sell and redeem gift cards at POS", status: "partial" },
      { name: "POS Layby Creation", description: "Create layby plans from POS interface", status: "partial", notes: "Layby system exists" },
      { name: "POS Hold/Park Order", description: "Park current sale and start new one", status: "done", notes: "Park button on POS cart, Parked tab with resume/delete, localStorage persistence with notes" },
      { name: "POS Returns/Exchanges", description: "Process returns and exchanges at POS", status: "done", notes: "POS Returns tab with order search, item-level return qty selection, reason codes, refund total calculation, and return processing" },
      { name: "POS Custom Sale (No SKU)", description: "Enter custom item with price for miscellaneous sales", status: "done", notes: "Custom Sale button + dialog on POS with custom title and price, adds to cart as CUSTOM SKU" },
      { name: "POS Staff PIN Login", description: "Quick staff switch using PIN code", status: "done", notes: "POS Staff button with PIN dialog, localStorage PIN registry, current staff badge display" },
      { name: "POS Customer Display", description: "Secondary screen showing cart items to customer", status: "not_started" },
      { name: "POS Inventory Count Mode", description: "Use POS device for stocktake counting", status: "not_started" },
    ],
  },
];

const adminUxFeatures: FeatureCategory[] = [
  {
    category: "Admin UX Polish",
    icon: <Sparkles className="h-5 w-5" />,
    features: [
      { name: "Keyboard Shortcuts (Global)", description: "Ctrl+K search, Ctrl+S save, etc.", status: "done", notes: "CommandPalette component with Ctrl+K global search across all admin pages" },
      { name: "Bulk Image Upload & Assignment", description: "Upload multiple images and auto-match to products by SKU/filename", status: "partial", notes: "ZipImageUpload exists" },
      { name: "Drag-Reorder Products", description: "Drag to reorder products within category", status: "done", notes: "Products page up/down arrow buttons per product row to swap sort_order positions" },
      { name: "Drag-Reorder Categories", description: "Drag to reorder category display order", status: "partial", notes: "sort_order field exists" },
      { name: "Drag-Reorder Images", description: "Drag to reorder product images", status: "partial" },
      { name: "Saved Filter Presets", description: "Save and recall filter combinations on list pages", status: "done", notes: "Products page Presets popover with save/load/delete using localStorage" },
      { name: "Column Visibility Toggle", description: "Show/hide columns on admin tables", status: "done", notes: "Products page Columns dropdown with localStorage persistence" },
      { name: "Column Reorder (Drag)", description: "Drag to reorder table columns", status: "not_started" },
      { name: "Inline Editing on Tables", description: "Click cell to edit value directly in table view", status: "done", notes: "Products page — click price or status cells to edit inline with instant save" },
      { name: "Mass Price Update", description: "Bulk update prices by percentage or fixed amount", status: "partial", notes: "BulkEditDialog exists" },
      { name: "Mass Category Assignment", description: "Bulk assign products to categories", status: "partial" },
      { name: "Undo/Redo in Forms", description: "Ctrl+Z/Y support in admin forms", status: "not_started" },
      { name: "Autosave Drafts", description: "Auto-save form progress as draft", status: "done", notes: "ProductForm auto-saves new product drafts to localStorage every 2 seconds, restores on page load, clears on successful save" },
      { name: "Form Dirty State Warning", description: "Warn before navigating away from unsaved changes", status: "done", notes: "Admin form patterns" },
      { name: "Recent Activity Feed", description: "Global activity feed showing recent changes across store", status: "done", notes: "ActivityLog page" },
      { name: "Staff @Mentions in Notes", description: "Tag staff members in order/customer notes", status: "not_started" },
      { name: "Admin Dark Mode Toggle", description: "Dark mode for admin panel", status: "done", notes: "Theme system exists" },
      { name: "Admin Multi-Language UI", description: "Translate admin interface to other languages", status: "not_started" },
      { name: "Dashboard Widget Customization", description: "Add/remove/reorder dashboard widgets", status: "done", notes: "Dashboard Widgets popover with localStorage persistence for show/hide each widget section" },
      { name: "Onboarding Wizard", description: "Step-by-step store setup guide for new users", status: "done", notes: "Onboarding page" },
    ],
  },
  {
    category: "Admin — Notifications & Alerts",
    icon: <Bell className="h-5 w-5" />,
    features: [
      { name: "In-App Notification Bell", description: "Real-time notification bell with dropdown", status: "done", notes: "NotificationBell component" },
      { name: "New Order Alert", description: "Push/sound notification on new order", status: "partial" },
      { name: "Low Stock Alert", description: "Alert when product hits low stock threshold", status: "done", notes: "low-stock-alert function" },
      { name: "Out of Stock Alert", description: "Alert when product reaches zero stock", status: "partial" },
      { name: "New Customer Signup Alert", description: "Notification when new customer registers", status: "done", notes: "NotificationBell realtime listener on customers table INSERT events, shows in-app notification with customer name" },
      { name: "New Review Alert", description: "Alert when new product review is submitted", status: "done", notes: "NotificationBell realtime listener on product_reviews table INSERT events, shows rating and title" },
      { name: "Dispute/Chargeback Alert", description: "Urgent alert on payment dispute", status: "done", notes: "dispute-email function" },
      { name: "Failed Payment Alert", description: "Alert on failed subscription/layby payment", status: "not_started" },
      { name: "Import Complete Notification", description: "Alert when CSV import finishes", status: "done", notes: "import-notification-email function" },
      { name: "Batch Job Error Alert", description: "Alert when background job fails", status: "done", notes: "batch-job-error-email function" },
      { name: "Webhook Failure Alert", description: "Alert when outbound webhook delivery fails", status: "partial" },
      { name: "SSL Certificate Expiry Alert", description: "Warn before custom domain SSL expires", status: "not_started" },
    ],
  },
];

const checkoutDeepFeatures: FeatureCategory[] = [
  {
    category: "Checkout — Advanced",
    icon: <ShoppingCart className="h-5 w-5" />,
    features: [
      { name: "Guest Checkout", description: "Allow checkout without creating account", status: "done" },
      { name: "One-Page Checkout", description: "All checkout steps on single page", status: "done", notes: "StorefrontCheckout page" },
      { name: "Multi-Step Checkout", description: "Step-by-step checkout wizard (address → shipping → payment)", status: "partial" },
      { name: "Address Autocomplete (Google Places)", description: "Google Places autocomplete for address fields", status: "partial", notes: "Country dropdown selector with common countries, inline validation for address length, city format, and postcode" },
      { name: "Address Validation", description: "Validate and standardize shipping addresses", status: "done", notes: "Checkout inline validation for short addresses, non-letter city names, and short postcodes with warning messages" },
      { name: "Saved Addresses (Customer)", description: "Allow customers to save multiple shipping addresses", status: "partial" },
      { name: "Checkout Custom Fields", description: "Add custom fields to checkout (e.g., delivery instructions)", status: "done", notes: "Checkout has Company Name, PO Number, Special Requirements custom fields plus delivery instructions and order notes" },
      { name: "Order Notes / Gift Message", description: "Customer can add order notes or gift message", status: "done", notes: "StorefrontCheckout dedicated Gift Message section with 500-char textarea, included in order notes" },
      { name: "Terms & Conditions Checkbox", description: "Require acceptance of T&C before placing order", status: "done", notes: "StorefrontCheckout T&C checkbox with links to Terms of Service and Privacy Policy, button disabled until accepted" },
      { name: "Age Verification Gate", description: "Age gate for restricted products (alcohol, etc.)", status: "done", notes: "Checkout age verification checkbox required before placing order, button disabled until confirmed" },
      { name: "Minimum Order Enforcement", description: "Block checkout below minimum order value", status: "done", notes: "StorefrontCheckout validates store min_order_amount and customer_group min_order_amount on submit, plus visual warning for low cart totals" },
      { name: "Cart Reservation / Timer", description: "Reserve stock for X minutes while in checkout", status: "done", notes: "StorefrontCheckout 15-minute countdown timer in Order Summary, warning when < 2min, expiry toast notification" },
      { name: "Express Checkout (Saved Details)", description: "One-click checkout for returning customers", status: "done", notes: "StorefrontCheckout express checkout banner for logged-in users with saved addresses, one-click place order using saved name/email/address" },
      { name: "Checkout Upsell/Cross-Sell", description: "Show related products during checkout", status: "done", notes: "StorefrontCheckout upsellProducts section with add-to-cart from related products" },
      { name: "Checkout Progress Indicator", description: "Visual progress bar showing checkout steps", status: "done", notes: "StorefrontCheckout 3-step progress indicator (Details → Shipping → Payment) with clickable steps, checkmarks for completed steps" },
      { name: "Order Confirmation Page", description: "Thank you page with order summary and next steps", status: "done" },
      { name: "Order Confirmation Email", description: "Auto-send order confirmation email", status: "done", notes: "order-email-trigger function" },
    ],
  },
];

const seoContentDeepFeatures: FeatureCategory[] = [
  {
    category: "SEO & Content — Advanced",
    icon: <FileSearch className="h-5 w-5" />,
    features: [
      { name: "Auto Meta Title Generation", description: "Auto-generate meta title from product/page title", status: "done" },
      { name: "Auto Meta Description", description: "Auto-generate meta description from content", status: "partial" },
      { name: "Canonical URL Management", description: "Set canonical URLs to prevent duplicate content", status: "done", notes: "SEOHead component" },
      { name: "Open Graph Tags", description: "OG meta tags for social sharing previews", status: "done" },
      { name: "Twitter Card Tags", description: "Twitter-specific sharing meta tags", status: "done" },
      { name: "JSON-LD Structured Data (Product)", description: "Product schema markup for Google rich results", status: "done" },
      { name: "JSON-LD Structured Data (Organization)", description: "Organization schema for brand SERP", status: "partial" },
      { name: "JSON-LD Structured Data (BreadcrumbList)", description: "Breadcrumb schema for search results", status: "partial" },
      { name: "JSON-LD Structured Data (FAQ)", description: "FAQ schema for content pages", status: "done", notes: "Auto-extracts FAQ pairs from H2/H3 headings ending with ? and injects FAQPage JSON-LD" },
      { name: "XML Sitemap Generation", description: "Auto-generate sitemap.xml for search engines", status: "done", notes: "sitemap edge function" },
      { name: "Robots.txt Management", description: "Configurable robots.txt file", status: "done", notes: "public/robots.txt" },
      { name: "301 Redirect Manager", description: "Manage URL redirects for moved/deleted content", status: "done", notes: "Redirects page" },
      { name: "Alt Text Enforcement", description: "Warn when images are missing alt text", status: "partial" },
      { name: "Heading Hierarchy Check", description: "Validate H1-H6 hierarchy on content pages", status: "done", notes: "ContentPages editor shows real-time heading hierarchy validation: checks for multiple H1s, skipped levels, and incorrect first heading with inline warnings/success indicator" },
      { name: "Blog / Content Publishing", description: "Blog posts with categories, tags, and scheduling", status: "done", notes: "StorefrontBlog + content_pages" },
      { name: "Blog Comments / Reviews", description: "Comments/reviews on blog posts", status: "done", notes: "content_reviews table" },
      { name: "Rich Text Editor (WYSIWYG)", description: "Full WYSIWYG editor for content with media embedding", status: "done", notes: "rich-text-editor component" },
      { name: "Content Versioning", description: "Track and restore previous versions of content", status: "done", notes: "ContentPages saves version on each edit, History button per page shows up to 20 versions with restore capability" },
      { name: "Content Scheduling", description: "Schedule content pages for future publish", status: "done", notes: "published_at field" },
      { name: "Multi-Language Content", description: "Translate content pages into multiple languages", status: "partial", notes: "Multimarket exists" },
    ],
  },
];

const securityComplianceFeatures: FeatureCategory[] = [
  {
    category: "Security & Compliance",
    icon: <ShieldCheck className="h-5 w-5" />,
    features: [
      { name: "Two-Factor Authentication (2FA)", description: "TOTP-based 2FA for admin accounts", status: "done", notes: "TwoFactorSetup component" },
      { name: "Session Management", description: "View and revoke active sessions", status: "done", notes: "Sessions page" },
      { name: "IP Whitelisting (API)", description: "Restrict API access to specific IP addresses", status: "not_started" },
      { name: "Rate Limiting (API)", description: "Throttle API requests per key/IP", status: "done", notes: "api_rate_limits table" },
      { name: "API Key Scopes", description: "Granular permission scopes per API key", status: "done", notes: "scopes on api_keys" },
      { name: "Audit Trail / Activity Log", description: "Complete log of all admin actions", status: "done", notes: "activity_log table" },
      { name: "GDPR Data Export", description: "Export all customer data for GDPR compliance", status: "done", notes: "CustomerDetail page GDPR Export button downloads all customer data as JSON" },
      { name: "GDPR Data Deletion", description: "Delete all customer data on request", status: "done", notes: "CustomerDetail GDPR Delete button with AlertDialog confirmation, deletes orders, addresses, communications, files, credits, returns, abandoned carts, and customer record" },
      { name: "Cookie Consent Banner", description: "GDPR/CCPA cookie consent with category selection", status: "done", notes: "CookieConsentBanner component" },
      { name: "Privacy Policy Page", description: "Configurable privacy policy page", status: "done", notes: "Content pages" },
      { name: "Terms of Service Page", description: "Configurable TOS page", status: "done" },
      { name: "Password Strength Enforcement", description: "Enforce minimum password complexity", status: "done", notes: "Signup page password strength meter with 5-criteria check (length, uppercase, lowercase, number, special), visual bar, and per-criterion feedback" },
      { name: "Brute Force Protection", description: "Lock accounts after X failed login attempts", status: "not_started" },
      { name: "Staff Role Permissions (Granular)", description: "Per-feature permission toggles per role", status: "done", notes: "RolePermissions page" },
      { name: "Content Security Policy Headers", description: "Configure CSP headers for XSS protection", status: "not_started" },
      { name: "HTTPS Enforcement", description: "Force all traffic through HTTPS", status: "done" },
    ],
  },
];

// ═══════ WAVE 6 — FINAL REMAINING FEATURES ═══════

const carrierIntegrationFeatures: FeatureCategory[] = [
  {
    category: "Carrier Integrations — Deep",
    icon: <Truck className="h-5 w-5" />,
    features: [
      { name: "Australia Post API (eParcel)", description: "Create consignments, print labels, track parcels via AusPost eParcel", status: "partial", notes: "carrier-rates function" },
      { name: "Australia Post MyPost Business", description: "MyPost Business integration for discounted rates", status: "not_started" },
      { name: "StarTrack API", description: "StarTrack consignment creation and label printing", status: "partial", notes: "starshipit-sync covers some" },
      { name: "Aramex (Fastway) API", description: "Aramex/Fastway courier integration for AU/NZ", status: "not_started" },
      { name: "DHL Express API", description: "DHL Express shipment creation and tracking", status: "not_started" },
      { name: "FedEx API", description: "FedEx shipping rates, labels, and tracking", status: "not_started" },
      { name: "UPS API", description: "UPS rate quotes, shipment creation, tracking", status: "not_started" },
      { name: "TNT/FedEx Express API", description: "TNT Express integration (now FedEx)", status: "not_started" },
      { name: "Sendle API", description: "Sendle parcel delivery for small business", status: "not_started" },
      { name: "CouriersPlease API", description: "CouriersPlease integration for domestic AU", status: "not_started" },
      { name: "Toll IPEC API", description: "Toll freight and parcel delivery", status: "not_started" },
      { name: "Hunter Express API", description: "Hunter Express courier integration", status: "not_started" },
      { name: "Allied Express API", description: "Allied Express same-day/next-day courier", status: "not_started" },
      { name: "Click & Collect Carrier", description: "Pseudo-carrier for in-store pickup orders", status: "partial" },
      { name: "Carrier Manifest Generation", description: "Generate end-of-day carrier manifests", status: "done", notes: "CarrierManifest page with date picker, carrier filter, summary cards, print manifest with full HTML layout" },
      { name: "Carrier Label Batch Print", description: "Batch print shipping labels for multiple orders", status: "not_started" },
      { name: "Carrier Rate Caching", description: "Cache carrier rate lookups to reduce API calls", status: "not_started" },
      { name: "Carrier Fallback Logic", description: "Fallback to secondary carrier if primary fails", status: "not_started" },
      { name: "Carrier Account Switching", description: "Use different carrier accounts per warehouse", status: "not_started" },
      { name: "Dangerous Goods Declaration", description: "DG flags and documentation for hazmat shipments", status: "not_started" },
      { name: "Authority To Leave (ATL)", description: "ATL flag on shipments for unattended delivery", status: "not_started" },
      { name: "Delivery Instructions Pass-Through", description: "Pass customer delivery notes to carrier API", status: "not_started" },
    ],
  },
];

const orderWorkflowFeatures: FeatureCategory[] = [
  {
    category: "Order Workflows — Advanced",
    icon: <Workflow className="h-5 w-5" />,
    features: [
      { name: "Order Hold / Fraud Review Queue", description: "Flag orders for manual review before processing", status: "partial", notes: "Status-based hold" },
      { name: "Order Auto-Allocation Rules", description: "Auto-assign orders to warehouse by region/stock", status: "not_started" },
      { name: "Split Shipment (Partial Fulfillment)", description: "Ship part of an order, hold remainder", status: "partial" },
      { name: "Backorder Auto-Creation", description: "Auto-create backorders when stock insufficient", status: "done", notes: "backorders table" },
      { name: "Order Merge", description: "Merge multiple orders from same customer", status: "done", notes: "OrderDetail merge dialog" },
      { name: "Order Clone / Reorder", description: "Clone existing order as new draft", status: "done", notes: "Orders page duplicate action" },
      { name: "Recurring Order (Subscription)", description: "Auto-repeat orders on schedule", status: "done", notes: "subscriptions table" },
      { name: "Order Priority Flag", description: "Mark orders as urgent/priority for fulfillment", status: "done", notes: "OrderDetail Priority card with low/normal/high/urgent selector, timeline event logging, visual badge for high/urgent" },
      { name: "Order Tags / Labels", description: "Custom tags on orders for filtering", status: "done", notes: "Order tags CRUD in OrderDetail, tags column in Orders list, tag filter dropdown, bulk tag assignment via bulk actions bar" },
      { name: "Order Internal Notes (Timeline)", description: "Chronological internal notes log per order", status: "done", notes: "order_notes table" },
      { name: "Order Custom Fields", description: "Custom metadata fields on orders", status: "partial" },
      { name: "Order Status Webhook Triggers", description: "Fire webhooks on order status changes", status: "done", notes: "webhook-dispatcher function" },
      { name: "Order Archive / Purge", description: "Archive old orders, purge test orders", status: "done", notes: "archived_at column on orders" },
      { name: "Draft Orders / Quotes Conversion", description: "Convert draft/quote to live order with one click", status: "done", notes: "Quotes page" },
      { name: "Order Fraud Scoring", description: "Risk score based on IP, email, address signals", status: "done", notes: "OrderDetail Fraud Risk Assessment card with multi-signal analysis (address mismatch, free email, high value, new customer, unusual country) and risk level badge" },
      { name: "Order Batch Status Update", description: "Bulk change status of multiple orders", status: "done", notes: "Orders page bulk action bar" },
      { name: "Order Batch Invoice Generation", description: "Generate invoices for selected orders in bulk", status: "done", notes: "Orders page bulk action bar Batch Invoices button opens all selected order invoices with staggered tabs" },
      { name: "Order Payment Retry", description: "Retry failed payment on existing order", status: "done", notes: "OrderDetail payment card shows Retry Payment button when payment_status != paid, creates payment record for remaining balance and updates status" },
      { name: "Order Refund (Partial / Full)", description: "Process partial or full refunds from order detail", status: "done", notes: "credit_notes table" },
      { name: "Order Exchange Workflow", description: "Replace items without full return/reorder flow", status: "done", notes: "OrderDetail Exchange dialog with product selection per item, inline replacement with product picker, timeline event logging" },
    ],
  },
];

const customerAdvancedFeatures: FeatureCategory[] = [
  {
    category: "Customer Management — Advanced",
    icon: <UserPlus className="h-5 w-5" />,
    features: [
      { name: "Customer Merge (Deduplication)", description: "Merge duplicate customer records", status: "done", notes: "Customers page — select 2+ customers with checkboxes, click Merge, pick primary record, orders reassigned and duplicates deleted" },
      { name: "Customer Import from CSV", description: "Bulk import customers from CSV file", status: "done", notes: "ImportWizard" },
      { name: "Customer Export to CSV", description: "Export customer list to CSV", status: "done", notes: "ExportWizard" },
      { name: "Customer Address Book (Multiple)", description: "Store multiple addresses per customer", status: "done", notes: "customer_addresses table with billing/shipping types, default flag, full address fields" },
      { name: "Customer Credit Balance", description: "Store credit / account balance per customer", status: "done", notes: "store_credit_transactions table + StoreCreditCard component" },
      { name: "Customer Price Lists", description: "Assign custom price lists to customer groups", status: "partial", notes: "customer_groups discount" },
      { name: "Customer Tax Exemption Certificate", description: "Upload and manage tax exemption documents", status: "done", notes: "CustomerDetail tax exemption cert upload with file upload to storage and URL field, view link in read mode" },
      { name: "Customer ABN / VAT Number", description: "Store ABN/VAT/GST registration numbers", status: "done", notes: "abn_vat_number column on customers table, editable in CustomerDetail form" },
      { name: "Customer Communication Log", description: "Log all emails/SMS sent to customer", status: "done", notes: "customer_communications table" },
      { name: "Customer Lifetime Value (CLV)", description: "Calculate and display CLV per customer", status: "done", notes: "Predictive CLV model on CustomerDetail stats card: historic + predicted CLV using avg order value × purchase frequency × estimated lifespan" },
      { name: "Customer Purchase History", description: "Full order history on customer profile", status: "done" },
      { name: "Customer Wishlist (Backend)", description: "Server-side wishlist storage", status: "partial", notes: "Client-side context" },
      { name: "Customer Saved Carts", description: "Save cart for later retrieval", status: "done", notes: "SavedCarts page" },
      { name: "Customer Referral Tracking", description: "Track customer referrals and attribute sales", status: "done", notes: "referral_code and referred_by columns on customers table, editable in CustomerDetail form" },
      { name: "Customer Birthday Auto-Email", description: "Automated birthday greeting email", status: "done", notes: "EmailAutomations birthday trigger type using customer birthday field" },
      { name: "Customer Win-Back Campaigns", description: "Auto-email lapsed customers after X days", status: "done", notes: "EmailAutomations winback trigger type for 30+ days inactive customers" },
      { name: "Customer Account Approval", description: "Require admin approval for new B2B accounts", status: "done", notes: "is_approved + requires_approval columns" },
      { name: "Customer Payment Terms (Net 30/60)", description: "Assign payment terms to B2B customers", status: "done", notes: "payment_terms column on customers" },
      { name: "Customer Credit Limit", description: "Set maximum outstanding credit per customer", status: "done", notes: "credit_limit column on customers" },
      { name: "Customer Statement Generation", description: "Generate and email customer account statements", status: "done", notes: "PrintCustomerStatement + customer-statement-email" },
    ],
  },
];

const inventoryAdvancedFeatures: FeatureCategory[] = [
  {
    category: "Inventory — Granular Operations",
    icon: <Warehouse className="h-5 w-5" />,
    features: [
      { name: "Stocktake (Full Count)", description: "Full warehouse stock count with variance report", status: "done", notes: "Stocktake page" },
      { name: "Cycle Count", description: "Partial/rolling stock counts by location or category", status: "partial" },
      { name: "Stock Adjustment Reasons", description: "Predefined reasons for stock adjustments (damage, theft, etc.)", status: "done", notes: "StockAdjustments" },
      { name: "Inventory Valuation Report (FIFO/AVG)", description: "Stock valuation using FIFO or weighted average", status: "done", notes: "InventoryReports page" },
      { name: "Dead Stock Report", description: "Identify products with no sales in X days", status: "done", notes: "InventoryReports dead stock tab" },
      { name: "Stock Velocity Report", description: "Products ranked by sales velocity/turns", status: "done", notes: "InventoryReports velocity tab" },
      { name: "Inventory Snapshot / History", description: "Point-in-time inventory snapshots for auditing", status: "done", notes: "InventoryReports Snapshots tab with Take Snapshot button capturing all SKUs/units/values, history table with unit delta badges, localStorage persistence (50 max)" },
      { name: "Putaway Rules", description: "Suggest bin locations for received stock", status: "not_started" },
      { name: "Pick Face Replenishment", description: "Auto-suggest bulk-to-pick replenishment", status: "not_started" },
      { name: "Serial Number Tracking", description: "Track individual serial numbers per unit sold", status: "done", notes: "serial_numbers table with CRUD in Inventory page, status tracking (available/sold/returned)" },
      { name: "Expiry Date Tracking (FEFO)", description: "First-expiry-first-out picking logic", status: "partial", notes: "expiry_date on inventory_stock" },
      { name: "Lot/Batch Traceability", description: "Full lot traceability from receipt to customer", status: "partial", notes: "lot_number, batch_number fields" },
      { name: "Minimum / Maximum Stock Levels", description: "Set min/max stock per product per location", status: "partial", notes: "low_stock_threshold" },
      { name: "Reorder Point Alerts", description: "Auto-alert when stock hits reorder point", status: "done", notes: "inventory_alerts + low-stock-alert" },
      { name: "Purchase Order Auto-Generation", description: "Auto-create PO when stock below threshold", status: "done", notes: "Inventory page Auto-Generate POs button creates draft POs for all low-stock products with cost-based totals" },
      { name: "Supplier Lead Time per Product", description: "Track supplier-specific lead times for forecasting", status: "partial", notes: "lead_time_days on forecasts" },
      { name: "Inventory Transfer Between Locations", description: "Transfer stock between warehouses with approval", status: "done", notes: "inventory_transfers table" },
      { name: "Goods Receipt Note (GRN)", description: "Record received goods against purchase orders", status: "partial" },
      { name: "Consignment Stock", description: "Track supplier-owned stock in your warehouse", status: "not_started" },
      { name: "Drop Ship Auto-Notify Supplier", description: "Auto-email supplier on drop ship order", status: "done", notes: "dropship-notification function" },
    ],
  },
];

const analyticsDeepFeatures: FeatureCategory[] = [
  {
    category: "Analytics & Reporting — Deep",
    icon: <BarChart3 className="h-5 w-5" />,
    features: [
      { name: "Sales by Channel Report", description: "Revenue breakdown by channel (web, eBay, POS, etc.)", status: "partial", notes: "Dashboard analytics" },
      { name: "Sales by Category Report", description: "Revenue and units by product category", status: "partial" },
      { name: "Sales by Brand Report", description: "Revenue and units by brand", status: "done", notes: "Analytics page Sales by Brand table with revenue and units per brand" },
      { name: "Sales by Customer Group Report", description: "Revenue by customer segment/group", status: "done", notes: "Analytics page Sales by Customer Group table" },
      { name: "Sales by Geography Report", description: "Revenue by state/country", status: "done", notes: "Analytics page Sales by Region table with region, orders, revenue from shipping address parsing" },
      { name: "Sales by Payment Method Report", description: "Payment method usage breakdown", status: "done", notes: "Analytics page Payment Status breakdown" },
      { name: "Sales Tax Report", description: "Tax collected breakdown by jurisdiction", status: "done", notes: "Analytics page Tax Report with monthly breakdown" },
      { name: "Profit & Loss by Product", description: "Per-product P&L using cost price", status: "done", notes: "Analytics page Profit Margin by Product with revenue, cost, profit, margin per product" },
      { name: "COGS Report", description: "Cost of goods sold over period", status: "done", notes: "Analytics page Profit Margin by Product section" },
      { name: "Gross Margin Report", description: "Gross margin by product/category/brand", status: "done", notes: "Analytics page Profit Margin table with margin % column" },
      { name: "ABC Analysis (Inventory)", description: "Classify products as A/B/C by sales contribution", status: "done", notes: "InventoryReports ABC tab" },
      { name: "Customer Cohort Analysis", description: "Retention analysis by signup cohort", status: "done", notes: "Analytics page cohort table" },
      { name: "Customer RFM Segmentation", description: "Recency/Frequency/Monetary analysis", status: "done", notes: "Analytics page RFM Segmentation table with Champions/Loyal/Potential/At Risk/Lost segments" },
      { name: "Conversion Funnel Report", description: "Visitor → Cart → Checkout → Purchase funnel", status: "done", notes: "Analytics page Conversion Funnel with percentage visualization" },
      { name: "Cart Abandonment Rate Report", description: "Abandonment rate trends over time", status: "done", notes: "AbandonedCarts page" },
      { name: "Average Order Value (AOV) Trend", description: "AOV trending over time", status: "done", notes: "Analytics page AOV Trend line chart using time series data" },
      { name: "Customer Acquisition Cost", description: "Track cost to acquire each customer", status: "done", notes: "Analytics page CAC card with new customers by month bar chart, avg first order value, first order revenue KPIs" },
      { name: "Repeat Purchase Rate", description: "Percentage of customers who reorder", status: "done", notes: "Analytics page Repeat Purchase Rate card showing rate %, total customers, and repeat buyers count" },
      { name: "Best Sellers Report", description: "Top products by revenue/units", status: "done", notes: "Analytics page Top Selling Products table" },
      { name: "Worst Sellers Report", description: "Bottom products by revenue/units", status: "done", notes: "Analytics page Worst Sellers table showing bottom 10 products by revenue" },
      { name: "Forecast vs Actual Sales", description: "Compare forecasted to actual sales", status: "done", notes: "Analytics page Forecast vs Actual card with 12-week line chart (actual vs 3-week moving average forecast), accuracy %" },
      { name: "Custom Report Builder", description: "Drag-and-drop report builder with saved reports", status: "done", notes: "ReportBuilder page" },
      { name: "Scheduled Report Emails", description: "Auto-email reports on schedule", status: "done", notes: "scheduled-report-email function" },
      { name: "Report Export (CSV/PDF/Excel)", description: "Export reports in multiple formats", status: "partial" },
      { name: "Dashboard Widget Customization", description: "Rearrange/add dashboard widgets", status: "done", notes: "Dashboard Widgets popover" },
    ],
  },
];

const promotionFeatures: FeatureCategory[] = [
  {
    category: "Promotions & Price Rules — Deep",
    icon: <Sparkles className="h-5 w-5" />,
    features: [
      { name: "Buy X Get Y Free", description: "BOGO promotions (buy 2 get 1 free, etc.)", status: "done", notes: "price_rules table" },
      { name: "Buy X Get Y Discounted", description: "Buy 2 get 3rd at 50% off", status: "done" },
      { name: "Spend $X Get $Y Off", description: "Threshold-based cart discount", status: "done" },
      { name: "Spend $X Get Free Shipping", description: "Free shipping above cart value", status: "done" },
      { name: "Category-Wide Discount", description: "Apply discount to entire category", status: "done" },
      { name: "Brand-Wide Discount", description: "Apply discount to all products of a brand", status: "partial" },
      { name: "Customer Group Discount", description: "Auto-apply discount for customer group members", status: "done" },
      { name: "Stackable vs Non-Stackable Promos", description: "Control whether discounts stack", status: "done", notes: "PriceRules is_stackable toggle per rule with Switch control and description" },
      { name: "Coupon + Auto Promo Interaction", description: "Rules for coupon + automatic promo stacking", status: "done", notes: "PriceRules is_stackable field controls whether promos combine with other active rules" },
      { name: "Flash Sale Timer", description: "Countdown timer on promo products", status: "partial" },
      { name: "Volume Discount Tiers", description: "Quantity-based price breaks", status: "done" },
      { name: "Loyalty Points Earn Rules", description: "Configure points earned per $ spent", status: "done", notes: "loyalty_points" },
      { name: "Loyalty Points Redemption", description: "Redeem points as discount at checkout", status: "partial" },
      { name: "Gift With Purchase", description: "Auto-add free gift when conditions met", status: "done", notes: "PriceRules gift_with_purchase rule type with gift product SKU field" },
      { name: "First Order Discount", description: "Auto-discount for new customer's first order", status: "done", notes: "PriceRules first_order rule type for auto-discounting new customer orders" },
      { name: "Clearance Auto-Tag", description: "Auto-tag products below margin threshold", status: "done", notes: "PriceRules Auto-Tag Clearance button scans products with margin < 10% and adds 'clearance' tag" },
    ],
  },
];

const notificationFeatures: FeatureCategory[] = [
  {
    category: "Notifications & Alerts — Comprehensive",
    icon: <Bell className="h-5 w-5" />,
    features: [
      { name: "Low Stock Alert (Email)", description: "Email admin when product hits low stock", status: "done", notes: "low-stock-alert function" },
      { name: "Low Stock Alert (In-App)", description: "Dashboard notification for low stock", status: "done", notes: "NotificationBell" },
      { name: "New Order Alert (Email)", description: "Email notification on new order", status: "done", notes: "order-email-trigger" },
      { name: "New Order Alert (Browser Push)", description: "Browser push notification for new orders", status: "not_started" },
      { name: "New Order Alert (SMS)", description: "SMS notification on new order", status: "partial", notes: "sms-gateway function" },
      { name: "Abandoned Cart Alert", description: "Notify admin of new abandoned carts", status: "done" },
      { name: "Return Request Alert", description: "Notify admin of new return requests", status: "partial" },
      { name: "New Customer Registration Alert", description: "Notify admin of new signups", status: "done", notes: "auto-registration-email" },
      { name: "Payment Failed Alert", description: "Notify admin of failed payment attempts", status: "not_started" },
      { name: "Dispute/Chargeback Alert", description: "Notify admin of payment disputes", status: "done", notes: "dispute-email function" },
      { name: "Import Complete Notification", description: "Notify when CSV import finishes", status: "done", notes: "import-notification-email" },
      { name: "Scheduled Export Ready", description: "Notify when scheduled export is ready", status: "done", notes: "scheduled-export function" },
      { name: "Stock Received Alert", description: "Notify when PO stock received at warehouse", status: "not_started" },
      { name: "Review Submitted Alert", description: "Notify admin of new product reviews", status: "not_started" },
      { name: "Back-In-Stock Customer Notification", description: "Auto-notify customers when product restocked", status: "done", notes: "back-in-stock-email function" },
      { name: "Wishlist Price Drop Notification", description: "Notify customers when wishlisted item drops in price", status: "partial", notes: "wishlist-reminder function" },
      { name: "Subscription Renewal Reminder", description: "Remind customers of upcoming subscription renewal", status: "done", notes: "Subscriptions page renewal reminder email button" },
      { name: "Delivery Confirmation to Customer", description: "Email customer when order marked delivered", status: "done", notes: "order-delivered-email function" },
    ],
  },
];

const platformMultiTenantFeatures: FeatureCategory[] = [
  {
    category: "Platform & Multi-Tenancy",
    icon: <Building className="h-5 w-5" />,
    features: [
      { name: "Multi-Store Management", description: "Manage multiple stores from single login", status: "done", notes: "stores table + store_id FK" },
      { name: "Platform Admin Dashboard", description: "Super-admin view across all stores", status: "done", notes: "PlatformDashboard page" },
      { name: "Platform Merchant List", description: "View/manage all merchant accounts", status: "done", notes: "PlatformMerchants page" },
      { name: "Platform Analytics (Cross-Store)", description: "Aggregate analytics across all stores", status: "done", notes: "PlatformAnalytics page" },
      { name: "Store Provisioning Wizard", description: "Automated store creation with defaults", status: "done", notes: "Onboarding page" },
      { name: "Store Suspension / Deactivation", description: "Suspend merchant store for violations", status: "partial" },
      { name: "Store Plan / Tier Management", description: "Assign feature tiers (Free/Pro/Enterprise)", status: "partial" },
      { name: "Per-Store Billing", description: "Track and bill per merchant store", status: "not_started" },
      { name: "White-Label Admin Panel", description: "Custom branding per tenant on admin", status: "partial" },
      { name: "Subdomain Routing", description: "Route subdomains to correct store", status: "done", notes: "subdomain.ts utility" },
      { name: "Custom Domain per Store", description: "Map custom domains to stores", status: "partial" },
      { name: "Data Isolation (RLS)", description: "Row-level security isolating store data", status: "done", notes: "RLS on all tables" },
      { name: "Cross-Store Product Sharing", description: "Share product catalog across stores", status: "not_started" },
      { name: "Platform-Level Addon Management", description: "Enable/disable addons globally", status: "done", notes: "addon_catalog + store_addons" },
    ],
  },
];

const importExportFeatures: FeatureCategory[] = [
  {
    category: "Import / Export — Full",
    icon: <ArrowLeftRight className="h-5 w-5" />,
    features: [
      { name: "Product Import (CSV)", description: "Bulk import products from CSV", status: "done", notes: "ImportWizard" },
      { name: "Product Export (CSV)", description: "Export products to CSV", status: "done", notes: "ExportWizard" },
      { name: "Customer Import (CSV)", description: "Bulk import customers", status: "done" },
      { name: "Customer Export (CSV)", description: "Export customers to CSV", status: "done" },
      { name: "Order Export (CSV)", description: "Export orders to CSV", status: "done" },
      { name: "Order Import (CSV)", description: "Import historical orders", status: "partial" },
      { name: "Inventory Import (CSV)", description: "Bulk update stock levels from CSV", status: "done" },
      { name: "Price List Import (CSV)", description: "Bulk update prices from CSV", status: "partial" },
      { name: "Category Import", description: "Import category tree from CSV", status: "partial" },
      { name: "Image Bulk Upload (ZIP)", description: "Upload images in ZIP matched by SKU", status: "done", notes: "ZipImageUpload component" },
      { name: "Import Field Mapping Templates", description: "Save and reuse CSV column mappings", status: "done", notes: "import_templates table" },
      { name: "Import Validation Preview", description: "Preview and validate data before import", status: "done" },
      { name: "Import Error Report", description: "Downloadable error report for failed rows", status: "done", notes: "import_logs" },
      { name: "Scheduled Auto-Export", description: "Auto-export data on schedule (daily/weekly)", status: "done", notes: "scheduled-export function" },
      { name: "FTP/SFTP Export Destination", description: "Send exports to FTP server", status: "not_started" },
      { name: "Google Merchant Feed Export", description: "Google Shopping product feed XML", status: "done", notes: "google-shopping-feed function" },
      { name: "Facebook Catalog Feed", description: "Facebook/Instagram product feed", status: "not_started" },
    ],
  },
];

const apiWebhookFeatures: FeatureCategory[] = [
  {
    category: "API & Webhooks — Full",
    icon: <Code className="h-5 w-5" />,
    features: [
      { name: "REST API (Products)", description: "Full CRUD API for products", status: "done", notes: "rest-api function" },
      { name: "REST API (Orders)", description: "Full CRUD API for orders", status: "done" },
      { name: "REST API (Customers)", description: "Full CRUD API for customers", status: "done" },
      { name: "REST API (Categories)", description: "Full CRUD API for categories", status: "done" },
      { name: "REST API (Inventory)", description: "Stock level read/update API", status: "done" },
      { name: "REST API (Shipping)", description: "Shipping zone and rate API", status: "done" },
      { name: "REST API (Coupons)", description: "Coupon CRUD API", status: "done" },
      { name: "Batch API Endpoint", description: "Execute multiple API calls in one request", status: "done", notes: "batch-api function" },
      { name: "API Rate Limiting", description: "Per-key rate limiting with configurable thresholds", status: "done", notes: "api_rate_limits table" },
      { name: "API Key Management UI", description: "Create/revoke API keys from admin", status: "done", notes: "ApiKeys page" },
      { name: "API Documentation (Interactive)", description: "Interactive API docs with try-it-now", status: "done", notes: "ApiDocs page" },
      { name: "Webhook Event Types (Order)", description: "order.created, order.updated, order.shipped, etc.", status: "done", notes: "Webhooks page" },
      { name: "Webhook Event Types (Product)", description: "product.created, product.updated, product.deleted", status: "done" },
      { name: "Webhook Event Types (Customer)", description: "customer.created, customer.updated", status: "done" },
      { name: "Webhook Event Types (Inventory)", description: "stock.updated, stock.low", status: "done" },
      { name: "Webhook Retry Logic", description: "Auto-retry failed webhook deliveries", status: "partial" },
      { name: "Webhook Signature Verification", description: "HMAC signature on webhook payloads", status: "partial" },
      { name: "Webhook Delivery Logs", description: "View webhook delivery history and responses", status: "partial" },
    ],
  },
];

const storefrontAdvancedFeatures: FeatureCategory[] = [
  {
    category: "Storefront — Advanced UX",
    icon: <Monitor className="h-5 w-5" />,
    features: [
      { name: "Mega Menu Navigation", description: "Multi-column dropdown navigation with images", status: "done", notes: "StorefrontLayout mega menu" },
      { name: "Sticky Header", description: "Header stays visible on scroll", status: "done", notes: "sticky top-0 on header" },
      { name: "Back-to-Top Button", description: "Scroll-to-top floating button", status: "done", notes: "StorefrontLayout scroll button" },
      { name: "Product Image Zoom (Hover)", description: "Magnify product image on hover", status: "done", notes: "ImageLightbox" },
      { name: "Product Image 360° View", description: "360-degree product image viewer", status: "not_started" },
      { name: "Product Video Embed", description: "Embed YouTube/Vimeo on product page", status: "done", notes: "video_url column on products table, Video tab on storefront product detail with YouTube/Vimeo iframe embed, Video URL input on ProductForm Media tab" },
      { name: "Size Guide / Fit Calculator", description: "Product-level size guide with calculator", status: "not_started" },
      { name: "Color Swatch Selector", description: "Visual color swatches for variant selection", status: "partial" },
      { name: "Product Tabs (Custom)", description: "Customizable tabs on product page (specs, reviews, etc.)", status: "done" },
      { name: "Recently Viewed Products", description: "Show recently viewed products across pages", status: "done", notes: "use-recently-viewed hook" },
      { name: "Product Comparison Table", description: "Side-by-side product comparison", status: "done", notes: "StorefrontCompare + CompareContext" },
      { name: "Infinite Scroll (Product List)", description: "Load more products on scroll vs pagination", status: "done", notes: "IntersectionObserver-based infinite scroll on StorefrontProducts replacing pagination" },
      { name: "Faceted Search / Filter Sidebar", description: "Multi-attribute filtering (price, brand, size, color)", status: "done", notes: "StorefrontSidebar" },
      { name: "Search Autocomplete (Instant)", description: "Instant search suggestions as user types", status: "done", notes: "StorefrontSearch" },
      { name: "Search Results Page", description: "Dedicated search results with filters", status: "done" },
      { name: "Store Finder / Store Locator", description: "Map-based store/warehouse locator", status: "done", notes: "StorefrontStoreFinder page" },
      { name: "Custom 404 Page", description: "Branded 404 not found page", status: "done", notes: "NotFound page" },
      { name: "Maintenance Mode Page", description: "Show maintenance page when store offline", status: "done", notes: "StorefrontLayout maintenance_mode check" },
      { name: "PWA / Add to Home Screen", description: "Progressive Web App manifest for mobile", status: "done", notes: "manifest.json with app name, theme color, icons; linked in index.html" },
      { name: "Mobile Bottom Navigation", description: "Fixed bottom nav bar on mobile storefront", status: "done", notes: "MobileBottomNav component" },
    ],
  },
];

const accountingIntFeatures: FeatureCategory[] = [
  {
    category: "Accounting & ERP Integrations",
    icon: <Banknote className="h-5 w-5" />,
    features: [
      { name: "Xero Integration (Invoices)", description: "Push invoices to Xero automatically", status: "done", notes: "xero-sync function" },
      { name: "Xero Integration (Payments)", description: "Sync payment receipts to Xero", status: "partial" },
      { name: "Xero Integration (Inventory)", description: "Sync inventory levels with Xero", status: "not_started" },
      { name: "Xero Integration (Contacts)", description: "Sync customers as Xero contacts", status: "partial" },
      { name: "MYOB Integration", description: "Sync orders/invoices to MYOB", status: "not_started" },
      { name: "QuickBooks Integration", description: "Sync with QuickBooks Online", status: "not_started" },
      { name: "Sage Integration", description: "Sync with Sage accounting", status: "not_started" },
      { name: "General Ledger Mapping", description: "Map product categories to GL codes", status: "not_started" },
      { name: "Chart of Accounts Sync", description: "Import/sync chart of accounts", status: "not_started" },
      { name: "Multi-Currency Accounting", description: "Handle multi-currency in accounting sync", status: "not_started" },
    ],
  },
];

const marketingAutomationFeatures: FeatureCategory[] = [
  {
    category: "Marketing Automation — Deep",
    icon: <Megaphone className="h-5 w-5" />,
    features: [
      { name: "Klaviyo Integration", description: "Sync customers and events to Klaviyo", status: "done", notes: "klaviyo-sync function" },
      { name: "Mailchimp Integration", description: "Sync email lists to Mailchimp", status: "done", notes: "mailchimp-sync function" },
      { name: "Google Analytics 4 Integration", description: "GA4 event tracking (purchase, add_to_cart)", status: "partial" },
      { name: "Google Ads Conversion Tracking", description: "Track purchases as Google Ads conversions", status: "not_started" },
      { name: "Facebook Pixel Integration", description: "Facebook/Meta pixel for retargeting", status: "not_started" },
      { name: "TikTok Pixel Integration", description: "TikTok event tracking for ads", status: "not_started" },
      { name: "SMS Marketing (Bulk)", description: "Send bulk promotional SMS to segments", status: "partial", notes: "sms-gateway function" },
      { name: "Affiliate / Referral Program", description: "Track affiliate signups, clicks, commissions", status: "done", notes: "Affiliates page + affiliates table" },
      { name: "Newsletter Signup Widget", description: "Configurable newsletter signup form", status: "done", notes: "NewsletterSignup component" },
      { name: "Exit-Intent Popup", description: "Show popup when user is about to leave", status: "done", notes: "PromoPopup component" },
      { name: "Social Proof Notifications", description: "Show 'X just purchased' live notifications", status: "done", notes: "SocialProofNotifications component" },
      { name: "Product Bundle Recommendations (AI)", description: "AI-powered frequently bought together", status: "not_started" },
      { name: "Personalized Product Recommendations", description: "Show products based on browsing/purchase history", status: "not_started" },
      { name: "UTM Tracking / Source Attribution", description: "Track marketing source on orders via UTM params", status: "done", notes: "Checkout captures utm_source/medium/campaign/term/content from URL, stores in order metadata and notes. Analytics shows Sales by UTM Source report." },
    ],
  },
];

const multimarketDeepFeatures: FeatureCategory[] = [
  {
    category: "Multimarket & i18n — Deep",
    icon: <Globe className="h-5 w-5" />,
    features: [
      { name: "Multi-Currency Storefront", description: "Display prices in customer's currency", status: "done", notes: "CurrencySwitcher component" },
      { name: "Currency Conversion Rates (Auto)", description: "Auto-update exchange rates from API", status: "partial" },
      { name: "Regional Pricing Override", description: "Set different prices per market/region", status: "done", notes: "multimarket_settings" },
      { name: "Multi-Language Storefront", description: "Translate storefront UI into multiple languages", status: "done", notes: "LanguageSwitcher component" },
      { name: "RTL Language Support", description: "Right-to-left layout for Arabic, Hebrew, etc.", status: "not_started" },
      { name: "Regional Tax Rules", description: "Different tax rates per region/market", status: "done", notes: "tax_rates table" },
      { name: "Regional Shipping Zones", description: "Different shipping zones per market", status: "done", notes: "shipping_zones table" },
      { name: "Country-Based Redirects", description: "Auto-redirect visitors to regional store", status: "not_started" },
      { name: "Geolocation-Based Currency", description: "Auto-select currency based on visitor IP", status: "not_started" },
      { name: "Multi-Domain / Subdomain per Market", description: "Separate domain per regional market", status: "partial" },
      { name: "Hreflang Tags (SEO)", description: "Hreflang tags for multi-language SEO", status: "not_started" },
      { name: "Regional Product Availability", description: "Show/hide products per market region", status: "partial" },
    ],
  },
];

// ═══════ WAVE 7 — FINAL REMAINING GAPS ═══════

const paymentGatewayDeepFeatures: FeatureCategory[] = [
  {
    category: "Payment Gateways — Deep",
    icon: <CreditCard className="h-5 w-5" />,
    features: [
      { name: "Stripe Checkout Integration", description: "Redirect to Stripe-hosted checkout page", status: "done", notes: "payment-gateway function" },
      { name: "Stripe Elements (Embedded)", description: "Embedded card form via Stripe Elements", status: "partial" },
      { name: "Stripe Connect (Marketplace)", description: "Split payments to multiple sellers", status: "not_started" },
      { name: "PayPal Standard", description: "PayPal redirect checkout", status: "partial" },
      { name: "PayPal Express Checkout", description: "PayPal button on cart/product page", status: "not_started" },
      { name: "Afterpay / Clearpay", description: "Buy-now-pay-later via Afterpay", status: "not_started" },
      { name: "Klarna", description: "Klarna BNPL integration", status: "not_started" },
      { name: "Zip (Zip Pay / Zip Money)", description: "Zip BNPL integration for AU/NZ", status: "not_started" },
      { name: "Humm (Buy Now Pay Later)", description: "Humm BNPL integration", status: "not_started" },
      { name: "Latitude Pay", description: "Latitude interest-free payments", status: "not_started" },
      { name: "eWAY Payment Gateway", description: "eWAY credit card processing (AU)", status: "not_started" },
      { name: "Braintree Payment Gateway", description: "Braintree (PayPal) card processing", status: "not_started" },
      { name: "Square Payment Gateway", description: "Square online payments", status: "not_started" },
      { name: "Manual / Bank Transfer Payment", description: "Offline payment method (bank deposit, cheque)", status: "partial" },
      { name: "Cash on Delivery (COD)", description: "COD payment option", status: "done", notes: "StorefrontCheckout payment method radio with card/COD options" },
      { name: "Store Credit Payment", description: "Pay using store credit balance", status: "done", notes: "StorefrontCheckout store credit checkbox with balance display" },
      { name: "Gift Voucher Payment", description: "Redeem gift voucher at checkout", status: "partial", notes: "gift_vouchers table" },
      { name: "Split Payment (Multiple Methods)", description: "Pay partially with voucher + card", status: "not_started" },
      { name: "Payment Tokenization (Saved Cards)", description: "Save card tokens for repeat purchases", status: "not_started" },
      { name: "3D Secure / SCA Compliance", description: "Strong Customer Authentication support", status: "not_started" },
      { name: "Apple Pay", description: "Apple Pay web payments", status: "not_started" },
      { name: "Google Pay", description: "Google Pay web payments", status: "not_started" },
    ],
  },
];

const purchaseOrderFeatures: FeatureCategory[] = [
  {
    category: "Purchase Orders — Deep",
    icon: <ClipboardCheck className="h-5 w-5" />,
    features: [
      { name: "PO Creation (Manual)", description: "Create purchase orders to suppliers manually", status: "done", notes: "PurchaseOrders page" },
      { name: "PO Auto-Generation (Reorder Point)", description: "Auto-create PO when stock hits reorder point", status: "not_started" },
      { name: "PO Approval Workflow", description: "Multi-level approval for purchase orders", status: "done", notes: "PurchaseOrders page: draft → pending_approval → sent flow with Submit for Approval, Approve, and Reject buttons per PO" },
      { name: "PO Line Items with Variants", description: "Add specific variants to PO line items", status: "partial" },
      { name: "PO Partial Receiving", description: "Receive partial shipments against a PO", status: "partial" },
      { name: "PO Cost Price Update on Receipt", description: "Auto-update product cost on PO receipt", status: "not_started" },
      { name: "PO Email to Supplier", description: "Email PO PDF directly to supplier", status: "partial" },
      { name: "PO Print / PDF Export", description: "Generate printable PO document", status: "done", notes: "PrintPurchaseOrder page" },
      { name: "PO Status Tracking", description: "Track PO through draft/sent/partial/received/closed", status: "done" },
      { name: "PO Expected Delivery Date", description: "Set and track expected delivery per PO", status: "done" },
      { name: "PO Notes / Internal Comments", description: "Internal notes on purchase orders", status: "done" },
      { name: "PO Currency / Multi-Currency", description: "PO in supplier's currency with conversion", status: "not_started" },
      { name: "PO Landed Cost Calculation", description: "Include freight, duties, insurance in landed cost", status: "not_started" },
      { name: "Supplier Performance Tracking", description: "Track on-time delivery rate per supplier", status: "done", notes: "Suppliers page SupplierPerformance component with PO count, total spend, on-time delivery rate %, status badges" },
    ],
  },
];

const subscriptionDeepFeatures: FeatureCategory[] = [
  {
    category: "Subscriptions & Recurring — Deep",
    icon: <Repeat className="h-5 w-5" />,
    features: [
      { name: "Subscription Product Flag", description: "Mark products as subscription-eligible", status: "done", notes: "subscriptions table" },
      { name: "Subscription Frequencies", description: "Weekly, fortnightly, monthly, quarterly, yearly", status: "done" },
      { name: "Subscription Discount", description: "Discount for subscribing (e.g. 10% off)", status: "partial" },
      { name: "Subscription Pause / Resume", description: "Customer can pause and resume subscription", status: "partial" },
      { name: "Subscription Skip Delivery", description: "Skip next delivery without cancelling", status: "done", notes: "Subscriptions page Skip Delivery button with confirmation dialog, pushes next_order_date forward by one billing cycle" },
      { name: "Subscription Swap Product", description: "Change product in active subscription", status: "done", notes: "Subscriptions page Swap Product dialog with product selector, auto-updates unit_price to new product price" },
      { name: "Subscription Quantity Change", description: "Adjust quantity on active subscription", status: "done", notes: "Subscriptions page Change Quantity dialog with numeric input and instant save" },
      { name: "Subscription Payment Retry", description: "Auto-retry failed subscription payments", status: "not_started" },
      { name: "Subscription Dunning Emails", description: "Email sequence for failed payments", status: "partial", notes: "Renewal reminder email implemented via send-email edge function; full dunning sequence not automated yet" },
      { name: "Subscription Analytics", description: "MRR, churn rate, LTV for subscriptions", status: "done", notes: "Subscriptions page KPI cards with MRR, ARR, Active count, Churn Rate %, Total subscriptions" },
      { name: "Subscription Cancellation Survey", description: "Ask reason when customer cancels", status: "done", notes: "Subscriptions page cancellation dialog with 6 predefined reasons (too expensive, don't need it, switching, quality, delivery, other)" },
      { name: "Subscription Admin Dashboard", description: "Overview of active/churned/paused subscriptions", status: "done", notes: "Subscriptions page" },
    ],
  },
];

const digitalProductFeatures: FeatureCategory[] = [
  {
    category: "Digital Products & Downloads",
    icon: <Download className="h-5 w-5" />,
    features: [
      { name: "Digital File Upload per Product", description: "Attach downloadable files to products", status: "done", notes: "product_downloads table" },
      { name: "Download Link Generation", description: "Unique, time-limited download links", status: "done", notes: "customer_downloads table" },
      { name: "Download Limit per Purchase", description: "Max download attempts per customer", status: "done", notes: "max_downloads field" },
      { name: "Download Expiry", description: "Downloads expire after X days", status: "done", notes: "expires_at field" },
      { name: "License Key Generation", description: "Auto-generate license keys on purchase", status: "done", notes: "DigitalDownloads page generates XXXXX-XXXXX-XXXXX-XXXXX format keys with configurable batch sizes, localStorage persistence" },
      { name: "License Key Management", description: "View, revoke, reissue license keys", status: "done", notes: "DigitalDownloads License Key dialog with generate batch, add manual, copy to clipboard, and revoke per key" },
      { name: "Streaming / Preview Access", description: "Preview digital content before download", status: "not_started" },
      { name: "Digital Downloads Admin Page", description: "Manage all digital products and downloads", status: "done", notes: "DigitalDownloads page" },
    ],
  },
];

const mediaManagementFeatures: FeatureCategory[] = [
  {
    category: "Media & Asset Management",
    icon: <Image className="h-5 w-5" />,
    features: [
      { name: "Media Library (Centralized)", description: "Central library for all uploaded images/files", status: "done", notes: "MediaLibrary page" },
      { name: "Image Auto-Resize / Thumbnails", description: "Auto-generate thumbnails on upload", status: "partial" },
      { name: "Image Alt Text Management", description: "Set alt text per image for SEO", status: "partial" },
      { name: "Image CDN Delivery", description: "Serve images via CDN for performance", status: "done", notes: "Supabase Storage CDN" },
      { name: "Image Lazy Loading", description: "Lazy load images below the fold", status: "done" },
      { name: "WebP / AVIF Auto-Conversion", description: "Auto-serve modern image formats", status: "not_started" },
      { name: "Bulk Image Upload", description: "Upload multiple images at once", status: "done" },
      { name: "Image Drag-and-Drop Reorder", description: "Reorder product images via drag and drop", status: "done", notes: "ProductImageUpload" },
      { name: "SVG Upload Support", description: "Allow SVG file uploads for logos/icons", status: "partial" },
      { name: "Video Upload / Hosting", description: "Upload and host product videos", status: "not_started" },
    ],
  },
];

const smartCollectionDeepFeatures: FeatureCategory[] = [
  {
    category: "Smart Collections & Merchandising",
    icon: <Sparkles className="h-5 w-5" />,
    features: [
      { name: "Smart Collection Rules (JSONB)", description: "Rules-based auto-collections using JSONB conditions", status: "done", notes: "SmartCollections page" },
      { name: "Collection Rule: Price Range", description: "Include products within price range", status: "done" },
      { name: "Collection Rule: Tag Contains", description: "Include products with specific tags", status: "done" },
      { name: "Collection Rule: Brand Equals", description: "Include products of specific brand", status: "done" },
      { name: "Collection Rule: Stock Level", description: "Include products with stock above/below threshold", status: "done" },
      { name: "Collection Rule: Created Date", description: "Include products created within date range", status: "done" },
      { name: "Collection Rule: Weight Range", description: "Include by product weight", status: "partial" },
      { name: "Collection Sort Order (Manual)", description: "Manually sort products within collection", status: "partial" },
      { name: "Collection Sort Order (Auto)", description: "Auto-sort by best-selling, newest, price", status: "done" },
      { name: "Collection Featured Image", description: "Hero image for collection page", status: "done" },
      { name: "Collection SEO Fields", description: "Custom meta title/description per collection", status: "done" },
      { name: "Product Pinning in Collection", description: "Pin specific products to top of collection", status: "partial", notes: "Smart collections support manual sort_order override for pinning" },
      { name: "Merchandising Zones (Homepage)", description: "Configurable product zones on homepage", status: "partial" },
      { name: "Cross-Sell Rules", description: "Define related products / cross-sell rules", status: "done", notes: "product_relations" },
      { name: "Upsell Rules", description: "Define upsell products per product", status: "done" },
    ],
  },
];

const staffPermissionFeatures: FeatureCategory[] = [
  {
    category: "Staff & Permissions — Deep",
    icon: <Key className="h-5 w-5" />,
    features: [
      { name: "Role-Based Access Control (RBAC)", description: "Define roles with granular permissions", status: "done", notes: "RolePermissions page" },
      { name: "Per-Module Permission Toggle", description: "Enable/disable access per admin module", status: "done" },
      { name: "Read vs Write Permissions", description: "Separate read and write access per module", status: "partial" },
      { name: "Store-Scoped Staff Access", description: "Staff can only access assigned stores", status: "done", notes: "store_staff table" },
      { name: "Staff Activity Log", description: "Log all actions per staff member", status: "done", notes: "StaffActivity page" },
      { name: "Staff Invitation Flow", description: "Invite new staff via email with role assignment", status: "partial" },
      { name: "Staff Deactivation", description: "Deactivate staff without deleting", status: "partial" },
      { name: "Password Policy Enforcement", description: "Enforce password rotation and complexity", status: "not_started" },
      { name: "Login IP Restriction", description: "Restrict staff login to specific IPs", status: "not_started" },
      { name: "Session Timeout Configuration", description: "Configurable auto-logout timeout", status: "not_started" },
    ],
  },
];

const warehouseFulfillmentFeatures: FeatureCategory[] = [
  {
    category: "Warehouse Fulfillment — Operations",
    icon: <Warehouse className="h-5 w-5" />,
    features: [
      { name: "Pick List Generation", description: "Generate pick lists for warehouse staff", status: "done", notes: "PrintPickList page" },
      { name: "Packing Slip Generation", description: "Print packing slips per order", status: "done", notes: "PrintPackingSlip page" },
      { name: "Pick & Pack Workflow", description: "Step-by-step pick and pack process", status: "done", notes: "PickPack page" },
      { name: "Barcode Scanning (Pick)", description: "Scan barcodes to verify picked items", status: "done", notes: "BarcodeScanner component" },
      { name: "Barcode Label Printing", description: "Print barcode labels for products", status: "done", notes: "PrintBarcodeLabels page" },
      { name: "Wave Picking", description: "Group multiple orders into pick waves", status: "partial" },
      { name: "Zone-Based Picking", description: "Assign pickers to warehouse zones", status: "not_started" },
      { name: "Batch Picking", description: "Pick same SKU for multiple orders at once", status: "not_started" },
      { name: "Pack Station Verification", description: "Verify items at pack station before shipping", status: "partial" },
      { name: "Shipping Label Auto-Print", description: "Auto-print carrier label after packing", status: "not_started" },
      { name: "Warehouse Dashboard (KPIs)", description: "Fulfillment KPIs and queue overview", status: "done", notes: "WarehouseDashboard page" },
      { name: "Order Queue Prioritization", description: "Priority-based order queue for fulfillment", status: "partial" },
      { name: "Multi-Box Shipment", description: "Split single order into multiple boxes", status: "not_started" },
      { name: "Package Weight Capture", description: "Record actual package weight at pack station", status: "not_started" },
      { name: "Fulfillment SLA Tracking", description: "Track time from order to shipment vs SLA", status: "done", notes: "Warehouse Dashboard SLA cards showing avg fulfillment time, SLA target (48h), and within-SLA percentage" },
    ],
  },
];

const thirdPartyIntegrationFeatures: FeatureCategory[] = [
  {
    category: "Third-Party Integrations — Remaining",
    icon: <Cable className="h-5 w-5" />,
    features: [
      { name: "ShipStation Integration", description: "Sync orders to ShipStation for fulfillment", status: "done", notes: "shipstation-sync function" },
      { name: "Starshipit Integration", description: "Shipping automation via Starshipit", status: "done", notes: "starshipit-sync function" },
      { name: "eBay Integration", description: "List products and import orders from eBay", status: "done", notes: "ebay-sync function" },
      { name: "Amazon Integration", description: "Amazon marketplace listing and order sync", status: "not_started" },
      { name: "Catch.com.au Integration", description: "Catch marketplace integration", status: "not_started" },
      { name: "MyDeal Integration", description: "MyDeal marketplace listing", status: "not_started" },
      { name: "Kogan Integration", description: "Kogan marketplace integration", status: "not_started" },
      { name: "TradeMe Integration (NZ)", description: "TradeMe marketplace for New Zealand", status: "not_started" },
      { name: "Google Merchant Center", description: "Product feed to Google Merchant Center", status: "done", notes: "google-shopping-feed function" },
      { name: "Zapier / Make Integration", description: "Connect via Zapier/Make using webhooks", status: "done", notes: "Webhooks + API" },
      { name: "Slack Notifications", description: "Send order/stock alerts to Slack channel", status: "not_started" },
      { name: "Freshdesk / Zendesk Integration", description: "Link orders to support tickets", status: "not_started" },
      { name: "LiveChat / Intercom Widget", description: "Embed live chat on storefront", status: "not_started" },
      { name: "Google Tag Manager", description: "GTM container for custom tracking scripts", status: "not_started" },
      { name: "Hotjar / Microsoft Clarity", description: "Session recording and heatmap tools", status: "not_started" },
    ],
  },
];

// ═══════ WAVE 8 — ABSOLUTE FINAL GAPS ═══════

const laybyFeatures: FeatureCategory[] = [
  {
    category: "Layby / Lay-Away — Deep",
    icon: <Timer className="h-5 w-5" />,
    features: [
      { name: "Layby Plan Creation", description: "Create layby plans with deposit + installments", status: "done", notes: "layby_plans table" },
      { name: "Layby Payment Recording", description: "Record installment payments against plans", status: "done", notes: "layby_payments table" },
      { name: "Layby Auto-Reminder Emails", description: "Email reminders for upcoming installments", status: "done", notes: "Layby page Send Reminder button per active plan, sends email via send-email edge function with outstanding balance and installment details" },
      { name: "Layby Cancellation with Refund", description: "Cancel layby with partial refund logic", status: "partial" },
      { name: "Layby Completion Auto-Fulfill", description: "Auto-trigger fulfillment when fully paid", status: "done", notes: "Layby recordPayment mutation auto-updates order payment_status to 'paid' when layby fully paid" },
      { name: "Layby Admin Dashboard", description: "Overview of all layby plans and payments", status: "done", notes: "Layby page" },
      { name: "Layby Terms Configuration", description: "Configure deposit %, max duration, fees", status: "partial" },
      { name: "Layby Customer Self-Service", description: "Customer can view and pay laybys from account", status: "not_started" },
    ],
  },
];

const quotingFeatures: FeatureCategory[] = [
  {
    category: "Quoting & RFQ",
    icon: <FileText className="h-5 w-5" />,
    features: [
      { name: "Quote Creation (Admin)", description: "Create quotes for customers from admin", status: "done", notes: "Quotes page" },
      { name: "Quote to Order Conversion", description: "Convert accepted quote to order", status: "done" },
      { name: "Quote Expiry Date", description: "Set expiry on quotes", status: "done" },
      { name: "Quote PDF Generation", description: "Generate printable quote PDF", status: "done", notes: "PrintQuote page" },
      { name: "Quote Email to Customer", description: "Email quote to customer for approval", status: "partial" },
      { name: "Request for Quote (RFQ) Form", description: "Customer-facing RFQ submission form", status: "done", notes: "StorefrontRequestQuote page with name, email, phone, company, message fields, stored in quote_requests table, route at /request-quote" },
      { name: "Quote Negotiation (Revision History)", description: "Track quote revisions and counter-offers", status: "not_started" },
      { name: "Quote Line Item Discounting", description: "Per-line custom pricing on quotes", status: "partial" },
      { name: "Quote Approval Workflow", description: "Internal approval for quotes above threshold", status: "not_started" },
      { name: "Quote Templates", description: "Pre-built quote templates for common requests", status: "done", notes: "Quotes page Templates dialog with save current items as template, load template to populate form, delete templates, localStorage persistence" },
    ],
  },
];

const returnPortalFeatures: FeatureCategory[] = [
  {
    category: "Returns Portal & RMA — Deep",
    icon: <RefreshCw className="h-5 w-5" />,
    features: [
      { name: "Customer Self-Service Returns", description: "Customer initiates return from account", status: "partial" },
      { name: "Return Reason Selection", description: "Predefined return reason categories", status: "done", notes: "returns table" },
      { name: "Return Photo Upload", description: "Customer uploads photos of damaged items", status: "not_started" },
      { name: "Return Label Generation", description: "Auto-generate return shipping label", status: "done", notes: "PrintReturnLabel page" },
      { name: "Return Approval / Rejection", description: "Admin approves or rejects return requests", status: "done" },
      { name: "Refund to Original Payment", description: "Refund back to original payment method", status: "not_started" },
      { name: "Refund to Store Credit", description: "Issue store credit instead of refund", status: "not_started" },
      { name: "Exchange Workflow", description: "Exchange returned item for different variant/product", status: "not_started" },
      { name: "Return Restocking Fee", description: "Deduct restocking fee from refund", status: "done", notes: "Returns detail panel has restocking fee input alongside refund amount, auto-deducts fee from refund total" },
      { name: "Return Stock Re-Integration", description: "Auto-add returned stock back to inventory", status: "not_started" },
      { name: "Return Analytics", description: "Track return rates, reasons, costs", status: "done", notes: "Analytics page Return Analytics" },
      { name: "Warranty Claim Tracking", description: "Track warranty claims separate from returns", status: "not_started" },
    ],
  },
];

const performanceFeatures: FeatureCategory[] = [
  {
    category: "Performance & Infrastructure",
    icon: <HardDrive className="h-5 w-5" />,
    features: [
      { name: "Edge Function Deployment", description: "Serverless functions at the edge", status: "done", notes: "40+ edge functions" },
      { name: "Database Connection Pooling", description: "Efficient database connection management", status: "done" },
      { name: "CDN Asset Delivery", description: "Static assets served via CDN", status: "done" },
      { name: "Image Optimization Pipeline", description: "Auto-optimize images on upload", status: "partial" },
      { name: "Database Query Optimization", description: "Indexed queries for large datasets", status: "done" },
      { name: "Caching Strategy (API)", description: "Cache frequently accessed data", status: "partial" },
      { name: "Realtime Subscriptions", description: "Postgres realtime for live updates", status: "done", notes: "Supabase Realtime" },
      { name: "Background Job Processing", description: "Async processing for heavy operations", status: "partial" },
      { name: "Error Monitoring / Logging", description: "Centralized error tracking and logging", status: "partial" },
      { name: "Uptime Monitoring", description: "Monitor service availability", status: "not_started" },
      { name: "Load Testing", description: "Performance benchmarks under load", status: "not_started" },
      { name: "Database Backup & Restore", description: "Automated database backups", status: "done", notes: "Supabase managed" },
    ],
  },
];

const accessibilityFeatures: FeatureCategory[] = [
  {
    category: "Accessibility (A11y)",
    icon: <Eye className="h-5 w-5" />,
    features: [
      { name: "Keyboard Navigation (Admin)", description: "Full keyboard nav in admin panel", status: "partial" },
      { name: "Keyboard Navigation (Storefront)", description: "Full keyboard nav on storefront", status: "partial" },
      { name: "Screen Reader Support", description: "ARIA labels and roles on all interactive elements", status: "partial" },
      { name: "Focus Management (Modals/Dialogs)", description: "Focus trap and restore in modals", status: "done", notes: "Radix UI handles" },
      { name: "Color Contrast (WCAG AA)", description: "All text meets WCAG AA contrast ratios", status: "partial" },
      { name: "Skip to Content Link", description: "Skip navigation link for keyboard users", status: "done", notes: "StorefrontLayout skip-to-content link" },
      { name: "Form Error Announcements", description: "Screen reader announces form validation errors", status: "partial" },
      { name: "Responsive Font Sizing", description: "Text scales appropriately across devices", status: "done" },
      { name: "Alt Text on All Images", description: "All images have descriptive alt text", status: "partial" },
      { name: "Reduced Motion Support", description: "Respect prefers-reduced-motion media query", status: "done", notes: "motion-reduce:transition-none classes" },
    ],
  },
];

const mobileAppFeatures: FeatureCategory[] = [
  {
    category: "Mobile & Responsive",
    icon: <Smartphone className="h-5 w-5" />,
    features: [
      { name: "Responsive Admin Panel", description: "Admin works on tablet and mobile", status: "done" },
      { name: "Responsive Storefront", description: "Storefront works on all screen sizes", status: "done" },
      { name: "Touch-Friendly Controls", description: "Buttons and inputs sized for touch", status: "done" },
      { name: "Mobile Product Quick View", description: "Quick view modal optimized for mobile", status: "done", notes: "ProductQuickView" },
      { name: "Mobile Checkout Optimization", description: "Simplified checkout flow on mobile", status: "partial" },
      { name: "Mobile Search (Full Screen)", description: "Full-screen search overlay on mobile", status: "partial" },
      { name: "Mobile Sidebar Navigation", description: "Slide-out navigation on mobile", status: "done", notes: "StorefrontSidebar" },
      { name: "Mobile POS Mode", description: "POS interface optimized for tablet", status: "partial" },
      { name: "Push Notification Support", description: "Browser push notifications for orders", status: "not_started" },
      { name: "Offline Cart Persistence", description: "Cart persists when device goes offline", status: "partial", notes: "localStorage cart" },
    ],
  },
];

const dataPrivacyFeatures: FeatureCategory[] = [
  {
    category: "Data Privacy & Compliance — Deep",
    icon: <Fingerprint className="h-5 w-5" />,
    features: [
      { name: "GDPR Right to Access", description: "Export all data held about a customer", status: "not_started" },
      { name: "GDPR Right to Erasure", description: "Delete all customer PII on request", status: "not_started" },
      { name: "GDPR Consent Management", description: "Track marketing consent per customer", status: "partial" },
      { name: "CCPA Do Not Sell", description: "Honor CCPA opt-out of data sale", status: "not_started" },
      { name: "Data Retention Policies", description: "Auto-purge old data per retention schedule", status: "not_started" },
      { name: "PCI DSS Compliance", description: "No card data stored (delegated to gateway)", status: "done", notes: "Stripe handles card data" },
      { name: "Privacy Impact Assessment", description: "Document data processing activities", status: "not_started" },
      { name: "Cookie Category Management", description: "Granular cookie consent (essential, analytics, marketing)", status: "done", notes: "CookieConsentBanner" },
      { name: "Data Processing Agreement (DPA)", description: "DPA documentation for merchants", status: "not_started" },
      { name: "Audit Log Retention", description: "Configurable retention period for audit logs", status: "not_started" },
    ],
  },
];

const configSettingsFeatures: FeatureCategory[] = [
  {
    category: "Settings & Configuration — Comprehensive",
    icon: <Settings className="h-5 w-5" />,
    features: [
      { name: "Store Name & Details", description: "Configure store name, address, phone, email", status: "done", notes: "Settings page" },
      { name: "Store Logo Upload", description: "Upload and manage store logo", status: "done" },
      { name: "Store Favicon", description: "Custom favicon for storefront", status: "done", notes: "public/favicon.ico" },
      { name: "Default Currency", description: "Set default store currency", status: "done" },
      { name: "Weight Unit (kg/lb)", description: "Set default weight unit", status: "done" },
      { name: "Dimension Unit (cm/in)", description: "Set default dimension unit", status: "done" },
      { name: "Date Format Configuration", description: "Configure date display format", status: "partial" },
      { name: "Timezone Setting", description: "Set store timezone", status: "partial" },
      { name: "Order Number Format", description: "Configure order number prefix/sequence", status: "partial" },
      { name: "Invoice Number Format", description: "Configure invoice number format", status: "partial" },
      { name: "Low Stock Threshold (Global)", description: "Default low stock threshold for all products", status: "done" },
      { name: "Checkout Settings", description: "Toggle guest checkout, minimum order, etc.", status: "partial" },
      { name: "Email Sender Configuration", description: "Set from name/email for store emails", status: "partial" },
      { name: "Social Media Links", description: "Configure social media profile URLs", status: "done" },
      { name: "Google Analytics ID", description: "Set GA4 measurement ID", status: "partial" },
      { name: "Custom CSS Injection", description: "Add custom CSS to storefront", status: "partial" },
      { name: "Custom JavaScript Injection", description: "Add custom JS to storefront head/body", status: "not_started" },
      { name: "Maintenance Mode Toggle", description: "Enable/disable maintenance mode", status: "done", notes: "maintenance_mode field + StorefrontLayout" },
    ],
  },
];

// ═══════ WAVE 9 — EDGE CASE & NICHE FEATURES ═══════

const productVariantDeepFeatures: FeatureCategory[] = [
  {
    category: "Product Variants — Deep",
    icon: <Layers className="h-5 w-5" />,
    features: [
      { name: "Variant-Level Images", description: "Unique images per variant (color swatch → image)", status: "done" },
      { name: "Variant-Level Pricing", description: "Different price per variant", status: "done" },
      { name: "Variant-Level SKU", description: "Unique SKU per variant", status: "done" },
      { name: "Variant-Level Barcode", description: "Unique barcode/EAN per variant", status: "done" },
      { name: "Variant-Level Weight", description: "Different weight per variant for shipping", status: "done" },
      { name: "Variant-Level Dimensions", description: "Different L×W×H per variant", status: "partial" },
      { name: "Variant-Level Stock Tracking", description: "Independent inventory per variant per location", status: "done", notes: "inventory_stock variant_id" },
      { name: "Variant Option Types (Size/Color/Material)", description: "Define option types with values", status: "done" },
      { name: "Variant Matrix Generator", description: "Auto-generate all combinations from options", status: "partial" },
      { name: "Variant Bulk Price Update", description: "Update prices for all variants at once", status: "partial" },
      { name: "Variant Discontinue (Soft Delete)", description: "Discontinue variant without deleting", status: "partial" },
      { name: "Variant Display Order", description: "Control sort order of variants on product page", status: "partial" },
    ],
  },
];

const searchMerchandisingFeatures: FeatureCategory[] = [
  {
    category: "Search & Merchandising — Advanced",
    icon: <Search className="h-5 w-5" />,
    features: [
      { name: "Full-Text Search (Products)", description: "Search across title, description, SKU, tags", status: "done", notes: "StorefrontSearch" },
      { name: "Search Synonyms", description: "Configure synonym mappings (sneakers = trainers)", status: "not_started" },
      { name: "Search Redirect Rules", description: "Redirect specific search terms to pages", status: "not_started" },
      { name: "Search Boost / Bury Rules", description: "Boost or bury products in search results", status: "not_started" },
      { name: "Search Analytics (Top Queries)", description: "Track most popular search terms", status: "done", notes: "search_queries table tracks all storefront searches, Analytics page Top Search Queries table with count and avg results" },
      { name: "Search Analytics (Zero Results)", description: "Track searches with no results", status: "done", notes: "Analytics page Zero-Result Searches table showing queries that returned 0 products, helping identify catalog gaps" },
      { name: "Faceted Search by Price", description: "Price range slider filter", status: "done" },
      { name: "Faceted Search by Brand", description: "Filter by brand", status: "done" },
      { name: "Faceted Search by Rating", description: "Filter by review rating", status: "partial" },
      { name: "Faceted Search by Availability", description: "Filter in-stock vs out-of-stock", status: "partial" },
      { name: "Faceted Search by Custom Attributes", description: "Filter by product-specific attributes", status: "partial" },
      { name: "Product Sorting (Multiple Options)", description: "Sort by price, name, newest, popularity, rating", status: "done" },
      { name: "Collection Landing Pages", description: "Custom landing pages for curated collections", status: "done" },
      { name: "Featured Products Section", description: "Manually curated featured products", status: "done" },
      { name: "New Arrivals Auto-Section", description: "Auto-display recently added products", status: "done" },
    ],
  },
];

const shippingRulesDeepFeatures: FeatureCategory[] = [
  {
    category: "Shipping Rules — Granular",
    icon: <Truck className="h-5 w-5" />,
    features: [
      { name: "Free Shipping Threshold", description: "Free shipping above cart value", status: "done" },
      { name: "Flat Rate Shipping", description: "Fixed rate per order or per item", status: "done" },
      { name: "Weight-Based Shipping Rates", description: "Rates calculated by total weight", status: "done", notes: "shipping_zones" },
      { name: "Price-Based Shipping Tiers", description: "Shipping rate by cart subtotal tiers", status: "done" },
      { name: "Quantity-Based Shipping", description: "Rate per item in cart", status: "partial" },
      { name: "Dimension-Based Shipping", description: "Volumetric weight calculation", status: "partial" },
      { name: "Shipping Exclusion Rules", description: "Exclude products/categories from certain methods", status: "not_started" },
      { name: "Shipping by Product Tag", description: "Different rates based on product tags", status: "not_started" },
      { name: "Shipping Surcharge (Rural/Remote)", description: "Extra charge for remote postcodes", status: "not_started" },
      { name: "Shipping Insurance Option", description: "Optional shipping insurance at checkout", status: "not_started" },
      { name: "Estimated Delivery Date Display", description: "Show estimated delivery on product/cart", status: "done", notes: "DeliveryEstimate component" },
      { name: "Same-Day / Express Cutoff Time", description: "Express shipping cutoff time logic", status: "not_started" },
      { name: "Local Delivery Zone", description: "Define local delivery radius with own rates", status: "not_started" },
      { name: "Pickup Location Selection", description: "Customer selects pickup location at checkout", status: "partial" },
    ],
  },
];

const taxDeepFeatures: FeatureCategory[] = [
  {
    category: "Tax — Advanced",
    icon: <Receipt className="h-5 w-5" />,
    features: [
      { name: "Tax-Inclusive Pricing", description: "Display prices including tax", status: "done" },
      { name: "Tax-Exclusive Pricing", description: "Display prices excluding tax", status: "done" },
      { name: "Multiple Tax Rates", description: "Different tax rates per product/category", status: "done", notes: "tax_rates table" },
      { name: "Tax by Destination", description: "Apply tax based on shipping destination", status: "partial" },
      { name: "Tax by Origin", description: "Apply tax based on seller location", status: "not_started" },
      { name: "Tax Exemption per Customer", description: "Mark customers as tax exempt", status: "done", notes: "customer_groups is_tax_exempt" },
      { name: "Tax Exemption Certificate Upload", description: "Store tax exemption documents", status: "not_started" },
      { name: "GST / VAT Registration Display", description: "Show GST/VAT number on invoices", status: "partial" },
      { name: "Tax Summary on Invoice", description: "Itemized tax breakdown on invoices", status: "done" },
      { name: "US State Tax Nexus Rules", description: "Configure tax nexus for US states", status: "not_started" },
      { name: "EU VAT MOSS Compliance", description: "VAT based on customer location for EU digital", status: "not_started" },
      { name: "Auto Tax Rate Updates", description: "Auto-update tax rates from authority", status: "not_started" },
    ],
  },
];

const emailTemplateDeepFeatures: FeatureCategory[] = [
  {
    category: "Email Templates — Comprehensive",
    icon: <Mail className="h-5 w-5" />,
    features: [
      { name: "Order Confirmation Email", description: "Auto-email on order placed", status: "done", notes: "order-email-trigger" },
      { name: "Order Shipped Email", description: "Auto-email with tracking on shipment", status: "done", notes: "shipment-email" },
      { name: "Order Delivered Email", description: "Auto-email when marked delivered", status: "done", notes: "order-delivered-email" },
      { name: "Payment Received Email", description: "Email on payment confirmation", status: "done", notes: "payment-email" },
      { name: "Refund Processed Email", description: "Email when refund issued", status: "partial" },
      { name: "Welcome Email (New Account)", description: "Welcome email on registration", status: "done", notes: "welcome-email" },
      { name: "Password Reset Email", description: "Password reset link email", status: "done" },
      { name: "Abandoned Cart Recovery Email", description: "Recover abandoned carts via email", status: "done", notes: "abandoned-cart-email" },
      { name: "Back-In-Stock Email", description: "Notify when product restocked", status: "done", notes: "back-in-stock-email" },
      { name: "Gift Voucher Email", description: "Send gift voucher to recipient", status: "done", notes: "gift-voucher-email" },
      { name: "Review Request Email", description: "Ask for review after delivery", status: "done", notes: "order-follow-up" },
      { name: "Wishlist Reminder Email", description: "Remind about wishlisted items", status: "done", notes: "wishlist-reminder" },
      { name: "Customer Statement Email", description: "Email account statement", status: "done", notes: "customer-statement-email" },
      { name: "Contact Form Confirmation", description: "Auto-reply to contact form submission", status: "done", notes: "contact-email" },
      { name: "Email Template Visual Editor", description: "Drag-and-drop email template builder", status: "partial", notes: "EmailTemplates page" },
      { name: "Email Template Variables", description: "Dynamic merge tags in emails ({{order_number}}, etc.)", status: "done" },
      { name: "Email Preview / Test Send", description: "Preview and send test emails", status: "partial" },
      { name: "Email Unsubscribe Management", description: "Unsubscribe link and preference center", status: "not_started" },
    ],
  },
];

const printDocumentDeepFeatures: FeatureCategory[] = [
  {
    category: "Print Documents — All Types",
    icon: <Printer className="h-5 w-5" />,
    features: [
      { name: "Invoice PDF", description: "Generate invoice with line items, tax, totals", status: "done", notes: "PrintInvoice" },
      { name: "Packing Slip PDF", description: "Packing slip without prices", status: "done", notes: "PrintPackingSlip" },
      { name: "Shipping Label PDF", description: "Shipping label with address and barcode", status: "done", notes: "PrintShippingLabel" },
      { name: "Pick List PDF", description: "Warehouse pick list grouped by location", status: "done", notes: "PrintPickList" },
      { name: "Purchase Order PDF", description: "PO document for suppliers", status: "done", notes: "PrintPurchaseOrder" },
      { name: "Quote PDF", description: "Customer quote document", status: "done", notes: "PrintQuote" },
      { name: "Return Label PDF", description: "Pre-paid return shipping label", status: "done", notes: "PrintReturnLabel" },
      { name: "Barcode Labels PDF", description: "Product barcode labels for shelf/bin", status: "done", notes: "PrintBarcodeLabels" },
      { name: "Gift Voucher PDF", description: "Printable gift voucher design", status: "done", notes: "PrintGiftVoucher" },
      { name: "Customer Statement PDF", description: "Account statement with balance", status: "done", notes: "PrintCustomerStatement" },
      { name: "Payment Receipt PDF", description: "Payment receipt for customer", status: "done", notes: "PrintPaymentReceipt" },
      { name: "Batch Invoice Print", description: "Print multiple invoices at once", status: "not_started" },
      { name: "Custom Document Templates", description: "Customize PDF layouts with branding", status: "partial" },
      { name: "Thermal Printer Support (Label)", description: "Format labels for thermal printers", status: "not_started" },
    ],
  },
];

const addonEcosystemFeatures: FeatureCategory[] = [
  {
    category: "Addon / Plugin Ecosystem",
    icon: <Puzzle className="h-5 w-5" />,
    features: [
      { name: "Addon Catalog (Marketplace)", description: "Browse and install addons from catalog", status: "done", notes: "Addons page + addon_catalog" },
      { name: "Addon Install / Uninstall", description: "One-click install and uninstall", status: "done", notes: "store_addons table" },
      { name: "Addon Configuration UI", description: "Per-addon settings panel", status: "done" },
      { name: "Addon Versioning", description: "Track addon versions with update capability", status: "partial" },
      { name: "Addon Categories", description: "Categorize addons (shipping, marketing, etc.)", status: "done" },
      { name: "Addon Pricing (Free/Paid)", description: "Free and paid addon tiers", status: "done", notes: "is_free, price fields" },
      { name: "Addon Usage Count", description: "Track how many stores use each addon", status: "done", notes: "install_count" },
      { name: "Addon Dependency Check", description: "Check addon dependencies before install", status: "not_started" },
      { name: "Custom Addon Development", description: "SDK/documentation for building custom addons", status: "not_started" },
      { name: "Addon Webhooks / Events", description: "Addons can subscribe to platform events", status: "partial" },
    ],
  },
];

const backupMigrationFeatures: FeatureCategory[] = [
  {
    category: "Backup & Migration",
    icon: <HardDrive className="h-5 w-5" />,
    features: [
      { name: "Database Auto-Backup", description: "Automated daily database backups", status: "done", notes: "Supabase managed" },
      { name: "Point-in-Time Recovery", description: "Restore database to specific timestamp", status: "done" },
      { name: "Store Data Export (Full)", description: "Export all store data for migration", status: "partial" },
      { name: "Store Data Import (Migration)", description: "Import data from another platform", status: "partial", notes: "ImportWizard" },
      { name: "Maropost / Neto Migration Tool", description: "Dedicated migration from Maropost/Neto", status: "done", notes: "Full 6-step wizard with 14 entity types, scan, import, theme, review" },
      { name: "Shopify Migration Tool", description: "Import products/orders from Shopify", status: "not_started" },
      { name: "WooCommerce Migration Tool", description: "Import from WooCommerce", status: "not_started" },
      { name: "BigCommerce Migration Tool", description: "Import from BigCommerce", status: "not_started" },
      { name: "Media File Backup", description: "Backup all uploaded media files", status: "partial" },
      { name: "Configuration Export/Import", description: "Export store settings for cloning", status: "not_started" },
    ],
  },
];

const testingQaFeatures: FeatureCategory[] = [
  {
    category: "Testing & QA",
    icon: <ListChecks className="h-5 w-5" />,
    features: [
      { name: "Unit Test Suite", description: "Vitest unit tests for core logic", status: "partial", notes: "vitest.config.ts" },
      { name: "E2E Test Suite", description: "Playwright end-to-end tests", status: "partial", notes: "playwright.config.ts" },
      { name: "Test Order Placement", description: "Place test orders without processing payment", status: "not_started" },
      { name: "Sandbox / Test Mode", description: "Payment gateway sandbox mode", status: "partial" },
      { name: "Data Seeding (Demo Data)", description: "Seed demo products, orders, customers", status: "partial", notes: "mock-data.ts" },
      { name: "Performance Benchmarks", description: "Automated page load benchmarks", status: "not_started" },
      { name: "Lighthouse CI Integration", description: "Automated Lighthouse scores in CI", status: "not_started" },
      { name: "Visual Regression Testing", description: "Screenshot comparison for UI changes", status: "not_started" },
    ],
  },
];

// ═══════ WAVE 10 — ABSOLUTE FINAL REMAINING ═══════

const netoTemplateFeatures: FeatureCategory[] = [
  {
    category: "Neto/Maropost Template System",
    icon: <PenTool className="h-5 w-5" />,
    features: [
      { name: "B@SE Template Engine", description: "Custom template engine with [%tag%] syntax", status: "done", notes: "base-template-engine.ts" },
      { name: "Template Theme Switching", description: "Switch between installed themes", status: "done", notes: "Templates page" },
      { name: "Template File Editor", description: "Edit template files from admin", status: "partial" },
      { name: "Template Version Control", description: "Track template file changes", status: "not_started" },
      { name: "Template Preview Mode", description: "Preview template changes before publish", status: "partial" },
      { name: "Custom Header / Footer", description: "Store-specific header/footer templates", status: "done" },
      { name: "Category Page Template", description: "Template for category listing pages", status: "done" },
      { name: "Product Page Template", description: "Template for product detail pages", status: "done" },
      { name: "Cart Page Template", description: "Template for shopping cart page", status: "done" },
      { name: "Checkout Page Template", description: "Template for checkout flow", status: "done" },
      { name: "Account Page Templates", description: "Templates for customer account pages", status: "done" },
      { name: "Blog Page Template", description: "Template for blog listing and detail", status: "done" },
      { name: "Contact Page Template", description: "Template for contact/enquiry page", status: "done" },
      { name: "Error Page Templates (404/500)", description: "Custom error page templates", status: "done" },
      { name: "Snippet / Partial Includes", description: "Reusable template snippets", status: "partial" },
      { name: "Template Conditional Logic", description: "If/else logic in templates", status: "done" },
      { name: "Template Loop / Iterator", description: "Loop over product lists, cart items", status: "done" },
      { name: "Template Global Variables", description: "Global variables (store name, year, etc.)", status: "done" },
    ],
  },
];

const customerAccountFeatures: FeatureCategory[] = [
  {
    category: "Customer Account — Full Portal",
    icon: <UserCheck className="h-5 w-5" />,
    features: [
      { name: "Account Dashboard", description: "Customer account overview with recent orders", status: "done", notes: "StorefrontAccount" },
      { name: "Order History List", description: "Paginated order history with search", status: "done" },
      { name: "Order Detail View", description: "Full order detail with line items, tracking", status: "done" },
      { name: "Reorder from Past Order", description: "Add all items from past order to cart", status: "done", notes: "Reorder All Items button in order detail adds items to CartContext" },
      { name: "Track Order Page", description: "Track order status with timeline", status: "done", notes: "StorefrontTrackOrder" },
      { name: "Address Book Management", description: "Add/edit/delete shipping addresses", status: "done", notes: "Full CRUD in Addresses tab" },
      { name: "Profile Edit (Name/Email/Phone)", description: "Edit personal details", status: "done" },
      { name: "Password Change", description: "Change password from account", status: "done" },
      { name: "Wishlist Management", description: "View and manage wishlist", status: "done", notes: "StorefrontWishlist" },
      { name: "Digital Downloads Access", description: "Access purchased digital downloads", status: "partial" },
      { name: "Subscription Management", description: "View/pause/cancel subscriptions", status: "partial" },
      { name: "Loyalty Points Balance", description: "View loyalty points and history", status: "partial" },
      { name: "Saved Payment Methods", description: "View/delete saved payment methods", status: "not_started" },
      { name: "Communication Preferences", description: "Manage email/SMS preferences", status: "done", notes: "Preferences tab with 8 toggleable notification categories (order, shipping, promo, newsletter, SMS, reviews, back-in-stock, price drops)" },
      { name: "Account Deletion Request", description: "Request account deletion (GDPR)", status: "done", notes: "Account tab with DELETE confirmation dialog, soft-delete via tags, auto sign-out" },
    ],
  },
];

const inventoryCountingFeatures: FeatureCategory[] = [
  {
    category: "Stocktake & Counting — Deep",
    icon: <ClipboardCheck className="h-5 w-5" />,
    features: [
      { name: "Full Stocktake (All Products)", description: "Count all products in warehouse", status: "done", notes: "Stocktake page" },
      { name: "Partial Stocktake (Category)", description: "Count products in specific category", status: "partial" },
      { name: "Partial Stocktake (Location/Bin)", description: "Count products in specific bin/zone", status: "partial" },
      { name: "Barcode Scan Counting", description: "Scan barcodes to count stock", status: "done", notes: "BarcodeScanner" },
      { name: "Stocktake Variance Report", description: "Report showing expected vs counted", status: "partial" },
      { name: "Stocktake Approval", description: "Manager approval before adjustments applied", status: "not_started" },
      { name: "Stocktake History", description: "History of past stocktakes with results", status: "partial" },
      { name: "Blind Count Mode", description: "Count without seeing expected quantities", status: "not_started" },
      { name: "Multi-User Stocktake", description: "Multiple staff counting simultaneously", status: "not_started" },
      { name: "Stocktake Export", description: "Export stocktake results to CSV", status: "not_started" },
    ],
  },
];

const dropshipFeatures: FeatureCategory[] = [
  {
    category: "Drop Shipping — Full",
    icon: <Share2 className="h-5 w-5" />,
    features: [
      { name: "Drop Ship Product Flag", description: "Mark products as drop-shipped", status: "done", notes: "is_dropship on products" },
      { name: "Drop Ship Supplier Assignment", description: "Assign supplier per drop-ship product", status: "done", notes: "supplier_id on products" },
      { name: "Auto-Notify Supplier on Order", description: "Auto-email supplier when order placed", status: "done", notes: "dropship-notification function" },
      { name: "Supplier Order Portal", description: "Supplier can view and fulfill assigned orders", status: "not_started" },
      { name: "Drop Ship Tracking Update", description: "Supplier updates tracking number", status: "not_started" },
      { name: "Drop Ship Margin Calculation", description: "Calculate margin on drop-ship products", status: "partial" },
      { name: "Drop Ship PO Auto-Generation", description: "Auto-create PO to supplier for drop-ship orders", status: "not_started" },
      { name: "Blind Drop Ship (No Branding)", description: "Ship without supplier branding", status: "not_started" },
    ],
  },
];

const socialCommerceFeatures: FeatureCategory[] = [
  {
    category: "Social Commerce",
    icon: <Share2 className="h-5 w-5" />,
    features: [
      { name: "Social Share Buttons (Product)", description: "Share product on social media", status: "done", notes: "SocialShare component" },
      { name: "Instagram Shopping Feed", description: "Product feed for Instagram Shopping", status: "not_started" },
      { name: "Facebook Shop Integration", description: "Sync products to Facebook Shop", status: "not_started" },
      { name: "Pinterest Rich Pins", description: "Product rich pins for Pinterest", status: "not_started" },
      { name: "TikTok Shop Integration", description: "List products on TikTok Shop", status: "not_started" },
      { name: "Social Login (Google)", description: "Login with Google account", status: "not_started" },
      { name: "Social Login (Facebook)", description: "Login with Facebook account", status: "not_started" },
      { name: "Social Login (Apple)", description: "Login with Apple ID", status: "not_started" },
      { name: "User-Generated Content (UGC)", description: "Display customer photos/videos on product", status: "not_started" },
      { name: "Social Proof (Review Count Badge)", description: "Show review count/rating on listings", status: "done", notes: "ProductBadges" },
    ],
  },
];

const b2bPortalFeatures: FeatureCategory[] = [
  {
    category: "B2B Portal — Complete",
    icon: <Building className="h-5 w-5" />,
    features: [
      { name: "Wholesale Registration Form", description: "Dedicated B2B account application", status: "partial" },
      { name: "Wholesale Price Display", description: "Show wholesale prices to approved accounts", status: "done", notes: "customer_groups pricing" },
      { name: "Wholesale Quick Order Form", description: "SKU + quantity rapid entry form", status: "done", notes: "StorefrontQuickOrder" },
      { name: "Wholesale Minimum Order Qty", description: "Minimum quantity per product for B2B", status: "partial" },
      { name: "Wholesale Minimum Order Value", description: "Minimum cart value for B2B orders", status: "partial" },
      { name: "Wholesale Catalog (Restricted)", description: "Hide certain products from retail customers", status: "partial" },
      { name: "Net Payment Terms (Net 7/14/30/60)", description: "Deferred payment for approved B2B accounts", status: "not_started" },
      { name: "Purchase Order Number (Customer PO)", description: "Customer enters their PO number at checkout", status: "partial" },
      { name: "B2B Invoice on Account", description: "Place orders on account without immediate payment", status: "not_started" },
      { name: "B2B Credit Application", description: "Credit application form for trade accounts", status: "not_started" },
      { name: "B2B Price List Export", description: "Export price lists for offline distribution", status: "not_started" },
      { name: "B2B Volume Tiered Pricing", description: "Automatic volume discounts for wholesale", status: "done" },
    ],
  },
];

const advancedCouponFeatures: FeatureCategory[] = [
  {
    category: "Coupons — Advanced Rules",
    icon: <Percent className="h-5 w-5" />,
    features: [
      { name: "Percentage Discount Coupon", description: "X% off cart/products", status: "done" },
      { name: "Fixed Amount Discount Coupon", description: "$X off cart/products", status: "done" },
      { name: "Free Shipping Coupon", description: "Coupon for free shipping", status: "done", notes: "free_shipping on coupons" },
      { name: "Coupon Usage Limit (Total)", description: "Max total uses across all customers", status: "done", notes: "max_uses" },
      { name: "Coupon Usage Limit (Per Customer)", description: "Max uses per individual customer", status: "done", notes: "per_customer_limit" },
      { name: "Coupon Minimum Cart Value", description: "Minimum order to apply coupon", status: "done", notes: "min_order_amount" },
      { name: "Coupon Expiry Date", description: "Auto-expire coupon after date", status: "done", notes: "expires_at" },
      { name: "Coupon Start Date", description: "Coupon active from future date", status: "done", notes: "starts_at" },
      { name: "Coupon Product Restrictions", description: "Limit coupon to specific products", status: "done", notes: "product_ids" },
      { name: "Coupon Category Restrictions", description: "Limit coupon to specific categories", status: "done", notes: "category_ids" },
      { name: "Coupon Customer Group Restriction", description: "Limit coupon to specific customer groups", status: "partial" },
      { name: "Auto-Generate Unique Codes", description: "Bulk generate unique coupon codes", status: "not_started" },
      { name: "Coupon Stacking Rules", description: "Allow/disallow stacking multiple coupons", status: "not_started" },
      { name: "Coupon Analytics / Usage Report", description: "Track coupon usage and revenue impact", status: "partial" },
    ],
  },
];

const auditComplianceFeatures: FeatureCategory[] = [
  {
    category: "Audit & Compliance — Complete",
    icon: <Shield className="h-5 w-5" />,
    features: [
      { name: "Full Activity Audit Trail", description: "Every admin action logged with timestamp and user", status: "done", notes: "activity_log table" },
      { name: "Login Audit Log", description: "Track all login attempts (success/fail)", status: "partial" },
      { name: "Data Change History", description: "Track changes to critical data (prices, stock)", status: "partial" },
      { name: "Export Audit Logs", description: "Export audit logs for compliance review", status: "not_started" },
      { name: "Regulatory Report (Tax)", description: "Tax-specific reports for BAS/GST filing", status: "not_started" },
      { name: "Fraud Detection Rules", description: "Configurable fraud detection rules", status: "not_started" },
      { name: "PCI Compliance Checklist", description: "Self-assessment checklist for PCI compliance", status: "not_started" },
      { name: "SOC 2 Compliance", description: "Security controls for SOC 2 readiness", status: "not_started" },
    ],
  },
];

// ═══════ WAVE 11 — FINAL NICHE & EDGE FEATURES ═══════

const giftRegistryFeatures: FeatureCategory[] = [
  {
    category: "Gift Registry & Wishlists — Advanced",
    icon: <Gift className="h-5 w-5" />,
    features: [
      { name: "Public Wishlist Sharing", description: "Share wishlist via link or social media", status: "partial" },
      { name: "Gift Registry Creation", description: "Create wedding/baby/event gift registries", status: "not_started" },
      { name: "Gift Registry Search (Public)", description: "Search registries by name/event", status: "not_started" },
      { name: "Gift Registry Item Purchase Tracking", description: "Track which items have been purchased", status: "not_started" },
      { name: "Gift Registry Thank You Notes", description: "Send thank you notes for purchased gifts", status: "not_started" },
      { name: "Gift Wrapping Option", description: "Add gift wrapping service at checkout", status: "not_started" },
      { name: "Gift Message per Item", description: "Custom gift message per line item", status: "partial" },
      { name: "Gift Receipt (No Prices)", description: "Print receipt without prices for gifts", status: "not_started" },
    ],
  },
];

const warehouseAutomationFeatures: FeatureCategory[] = [
  {
    category: "Warehouse Automation & Rules",
    icon: <Workflow className="h-5 w-5" />,
    features: [
      { name: "Order Routing Rules", description: "Auto-route orders to nearest warehouse", status: "not_started" },
      { name: "Split Order by Warehouse", description: "Auto-split order if items in different warehouses", status: "not_started" },
      { name: "Shipping Method Auto-Selection", description: "Auto-select cheapest/fastest carrier", status: "not_started" },
      { name: "Auto-Print Labels on Status Change", description: "Trigger label print when status changes", status: "not_started" },
      { name: "Packing Rules (Box Selection)", description: "Auto-suggest box size based on items", status: "not_started" },
      { name: "Cartonization Algorithm", description: "Optimize item packing across boxes", status: "not_started" },
      { name: "Warehouse Staff Assignment", description: "Assign orders to specific warehouse staff", status: "not_started" },
      { name: "Picking Route Optimization", description: "Optimize pick path through warehouse", status: "not_started" },
      { name: "Dock Scheduling", description: "Schedule inbound/outbound dock appointments", status: "not_started" },
      { name: "Cross-Docking Support", description: "Route inbound directly to outbound", status: "not_started" },
    ],
  },
];

const returnPolicyFeatures: FeatureCategory[] = [
  {
    category: "Return Policies & Configuration",
    icon: <Scale className="h-5 w-5" />,
    features: [
      { name: "Return Window (Days)", description: "Configure return window per product/category", status: "partial" },
      { name: "Non-Returnable Products", description: "Mark products as final sale / non-returnable", status: "not_started" },
      { name: "Return Condition Requirements", description: "Define acceptable return conditions (unused, tags attached)", status: "not_started" },
      { name: "Return Shipping Cost Rules", description: "Who pays return shipping (customer/store)", status: "not_started" },
      { name: "Exchange-Only Products", description: "Allow exchange but not refund on certain items", status: "not_started" },
      { name: "Return Policy Display", description: "Show return policy on product page", status: "partial" },
      { name: "Return Reason Analytics", description: "Track why items are returned", status: "not_started" },
      { name: "Auto-Approve Returns Under $X", description: "Auto-approve returns below threshold", status: "not_started" },
    ],
  },
];

const customerSegmentationFeatures: FeatureCategory[] = [
  {
    category: "Customer Segmentation — Rules Engine",
    icon: <Users className="h-5 w-5" />,
    features: [
      { name: "Segment by Total Spent", description: "Segment customers by lifetime spend", status: "done", notes: "customer_segmentation_rules" },
      { name: "Segment by Order Count", description: "Segment by number of orders placed", status: "done" },
      { name: "Segment by Last Order Date", description: "Segment by recency of last purchase", status: "done" },
      { name: "Segment by Product Purchased", description: "Customers who bought specific products", status: "partial" },
      { name: "Segment by Category Purchased", description: "Customers who bought from specific categories", status: "partial" },
      { name: "Segment by Location", description: "Segment by shipping address state/country", status: "partial" },
      { name: "Segment by Registration Date", description: "Segment by account age", status: "done" },
      { name: "Segment by Email Engagement", description: "Segment by email open/click rate", status: "not_started" },
      { name: "Auto-Assign Segment", description: "Auto-assign customers to segments on rule match", status: "done", notes: "is_active rules" },
      { name: "Segment-Based Email Campaigns", description: "Send targeted emails to segments", status: "partial" },
      { name: "Segment-Based Discounts", description: "Auto-apply discounts per segment", status: "partial" },
      { name: "VIP / High-Value Auto-Tag", description: "Auto-tag high-value customers as VIP", status: "partial" },
    ],
  },
];

const internationalFeatures: FeatureCategory[] = [
  {
    category: "International Commerce",
    icon: <Globe className="h-5 w-5" />,
    features: [
      { name: "Duties & Tariff Calculation", description: "Calculate import duties at checkout", status: "not_started" },
      { name: "HS Code per Product", description: "Harmonized System codes for customs", status: "not_started" },
      { name: "Country of Origin", description: "Country of origin field per product", status: "partial" },
      { name: "Commercial Invoice Generation", description: "Generate customs commercial invoices", status: "not_started" },
      { name: "Restricted Countries", description: "Block orders from specific countries", status: "not_started" },
      { name: "Country-Specific Product Restrictions", description: "Hide products restricted in certain countries", status: "not_started" },
      { name: "International Returns Handling", description: "Different return policies for international orders", status: "not_started" },
      { name: "DDP / DDU Shipping Terms", description: "Delivered Duty Paid vs Unpaid options", status: "not_started" },
      { name: "Export Documentation", description: "Generate packing lists and export docs", status: "not_started" },
      { name: "Currency Rounding Rules", description: "Currency-specific rounding (e.g., .95 pricing)", status: "not_started" },
    ],
  },
];

const productSchedulingFeatures: FeatureCategory[] = [
  {
    category: "Product Scheduling & Visibility",
    icon: <Timer className="h-5 w-5" />,
    features: [
      { name: "Scheduled Publish Date", description: "Auto-publish product at future date/time", status: "done", notes: "publish_start field" },
      { name: "Scheduled Unpublish Date", description: "Auto-hide product after date/time", status: "done", notes: "publish_end field" },
      { name: "Pre-Order Mode", description: "Accept orders before product is available", status: "done", notes: "preorder flag" },
      { name: "Pre-Order Expected Date", description: "Show expected availability date", status: "done" },
      { name: "Coming Soon Mode", description: "Show product as 'Coming Soon' without buy button", status: "partial" },
      { name: "Hidden Product (URL-Only Access)", description: "Product only accessible via direct URL", status: "partial" },
      { name: "Customer Group Visibility", description: "Show products only to specific customer groups", status: "partial" },
      { name: "Seasonal Product Scheduling", description: "Auto-show/hide seasonal products by date", status: "done" },
      { name: "Launch Day Countdown Timer", description: "Countdown to product launch date", status: "not_started" },
      { name: "Embargo / NDA Product Handling", description: "Products hidden until embargo lifts", status: "partial" },
    ],
  },
];

const orderPrintingFeatures: FeatureCategory[] = [
  {
    category: "Order Processing — Print & Batch",
    icon: <Printer className="h-5 w-5" />,
    features: [
      { name: "Batch Print Invoices", description: "Select multiple orders and print invoices", status: "not_started" },
      { name: "Batch Print Packing Slips", description: "Print packing slips for multiple orders", status: "not_started" },
      { name: "Batch Print Shipping Labels", description: "Print labels for multiple orders at once", status: "not_started" },
      { name: "Batch Update Tracking Numbers", description: "Upload CSV of tracking numbers", status: "not_started" },
      { name: "Batch Mark as Shipped", description: "Mark multiple orders as shipped at once", status: "partial" },
      { name: "Batch Mark as Paid", description: "Mark multiple orders as paid at once", status: "not_started" },
      { name: "Thermal Label Format (4x6)", description: "Format labels for 4x6 thermal printers", status: "not_started" },
      { name: "A4 Label Format", description: "Format labels for A4 sheet printers", status: "partial" },
      { name: "Custom Print Template (Invoice)", description: "Customize invoice template with logo/layout", status: "partial" },
      { name: "Custom Print Template (Packing)", description: "Customize packing slip template", status: "partial" },
    ],
  },
];

const developerToolsFeatures: FeatureCategory[] = [
  {
    category: "Developer Tools & Extensibility",
    icon: <Code className="h-5 w-5" />,
    features: [
      { name: "REST API v1 (Full Coverage)", description: "Complete CRUD API for all entities", status: "done", notes: "rest-api function" },
      { name: "API Versioning", description: "Versioned API endpoints for backward compatibility", status: "not_started" },
      { name: "GraphQL API", description: "GraphQL endpoint for flexible queries", status: "not_started" },
      { name: "Webhook Event System", description: "Subscribe to events via webhooks", status: "done", notes: "Webhooks page" },
      { name: "API Sandbox / Test Mode", description: "Sandbox environment for API testing", status: "not_started" },
      { name: "API Response Filtering", description: "Select specific fields in API response", status: "partial" },
      { name: "API Pagination (Cursor)", description: "Cursor-based pagination for large datasets", status: "partial" },
      { name: "API Bulk Operations", description: "Batch create/update/delete via API", status: "done", notes: "batch-api function" },
      { name: "Custom Metadata Fields (API)", description: "Arbitrary metadata on entities via API", status: "partial" },
      { name: "Event-Driven Architecture", description: "Internal event bus for extensibility", status: "partial" },
      { name: "Edge Function Marketplace", description: "Share/install custom edge functions", status: "not_started" },
      { name: "CLI Tooling", description: "Command-line tools for store management", status: "not_started" },
    ],
  },
];

// ═══════ WAVE 12 — MICRO-FEATURES & REMAINING GAPS ═══════

const cartFeatures: FeatureCategory[] = [
  {
    category: "Shopping Cart — Complete",
    icon: <ShoppingCart className="h-5 w-5" />,
    features: [
      { name: "Add to Cart (AJAX)", description: "Add products without page reload", status: "done" },
      { name: "Cart Quantity Update", description: "Change quantity in cart", status: "done" },
      { name: "Cart Item Remove", description: "Remove items from cart", status: "done" },
      { name: "Cart Subtotal Calculation", description: "Real-time subtotal update", status: "done" },
      { name: "Cart Tax Calculation", description: "Calculate tax in cart", status: "done" },
      { name: "Cart Shipping Estimate", description: "Estimate shipping in cart before checkout", status: "partial" },
      { name: "Cart Coupon Application", description: "Apply coupon code in cart", status: "done" },
      { name: "Cart Persistence (Session)", description: "Cart persists across pages", status: "done", notes: "CartContext" },
      { name: "Cart Persistence (Logged In)", description: "Cart saved to account when logged in", status: "partial" },
      { name: "Cart Mini Widget (Header)", description: "Mini cart dropdown in header", status: "done" },
      { name: "Cart Empty State", description: "Helpful empty cart message with CTA", status: "done" },
      { name: "Cart Cross-Sell Suggestions", description: "Suggest related products in cart", status: "partial" },
      { name: "Cart Save for Later", description: "Move items to save-for-later list", status: "done", notes: "SavedCarts" },
      { name: "Cart Merge on Login", description: "Merge guest cart with account cart on login", status: "not_started" },
      { name: "Cart Notes", description: "Add notes to entire cart/order", status: "partial" },
      { name: "Cart Item Custom Options", description: "Display selected options per cart item", status: "done" },
    ],
  },
];

const adminDashboardFeatures: FeatureCategory[] = [
  {
    category: "Admin Dashboard — Widgets",
    icon: <LayoutDashboard className="h-5 w-5" />,
    features: [
      { name: "Revenue Today Widget", description: "Today's revenue summary card", status: "done", notes: "Dashboard page" },
      { name: "Orders Today Widget", description: "Today's order count card", status: "done" },
      { name: "Revenue Chart (30 days)", description: "Line chart of revenue over 30 days", status: "done" },
      { name: "Top Products Widget", description: "Best-selling products list", status: "done" },
      { name: "Low Stock Alert Widget", description: "Products below reorder point", status: "done" },
      { name: "Recent Orders Widget", description: "Latest orders quick view", status: "done" },
      { name: "Abandoned Cart Widget", description: "Abandoned cart count and value", status: "done" },
      { name: "Conversion Rate Widget", description: "Visit-to-purchase conversion rate", status: "partial" },
      { name: "Average Order Value Widget", description: "AOV display", status: "partial" },
      { name: "New Customers Widget", description: "New customer signups today/week", status: "partial" },
      { name: "Pending Reviews Widget", description: "Reviews awaiting moderation", status: "partial" },
      { name: "Pending Returns Widget", description: "Returns awaiting processing", status: "partial" },
      { name: "Dashboard Date Range Selector", description: "Filter dashboard by date range", status: "partial" },
      { name: "Dashboard Comparison Mode", description: "Compare periods (this week vs last)", status: "not_started" },
    ],
  },
];

const productCustomFieldFeatures: FeatureCategory[] = [
  {
    category: "Product Custom Fields & Metadata",
    icon: <Database className="h-5 w-5" />,
    features: [
      { name: "Custom Text Fields", description: "Free-text custom fields per product", status: "done", notes: "misc fields + custom_fields JSONB" },
      { name: "Custom Dropdown Fields", description: "Dropdown select custom fields", status: "partial" },
      { name: "Custom Checkbox Fields", description: "Boolean custom fields", status: "partial" },
      { name: "Custom Number Fields", description: "Numeric custom fields", status: "partial" },
      { name: "Custom Date Fields", description: "Date picker custom fields", status: "partial" },
      { name: "Custom File Upload Fields", description: "File attachment custom fields", status: "not_started" },
      { name: "Custom Field Visibility (Storefront)", description: "Show/hide custom fields on storefront", status: "partial" },
      { name: "Custom Field Searchability", description: "Include custom fields in search index", status: "not_started" },
      { name: "Custom Field Filtering", description: "Filter products by custom field values", status: "not_started" },
      { name: "Product Metadata (JSONB)", description: "Arbitrary JSON metadata per product", status: "done" },
      { name: "Variant Metadata (JSONB)", description: "Arbitrary JSON metadata per variant", status: "done" },
      { name: "Customer Custom Fields", description: "Custom fields on customer records", status: "partial" },
      { name: "Order Custom Fields", description: "Custom fields on orders", status: "partial" },
    ],
  },
];

const onboardingFeatures: FeatureCategory[] = [
  {
    category: "Onboarding & Setup Wizard",
    icon: <Milestone className="h-5 w-5" />,
    features: [
      { name: "Store Setup Wizard", description: "Guided store creation flow", status: "done", notes: "Onboarding page" },
      { name: "Business Details Step", description: "Enter business name, address, ABN", status: "done" },
      { name: "Industry Selection", description: "Select business type/industry", status: "done" },
      { name: "Currency & Region Setup", description: "Set default currency and region", status: "done" },
      { name: "First Product Creation", description: "Guided first product add", status: "partial" },
      { name: "Payment Gateway Setup", description: "Connect payment provider in onboarding", status: "partial" },
      { name: "Shipping Setup", description: "Configure basic shipping in onboarding", status: "partial" },
      { name: "Theme Selection", description: "Choose storefront theme during setup", status: "partial" },
      { name: "Domain Configuration", description: "Set up custom domain", status: "partial" },
      { name: "Go-Live Checklist", description: "Pre-launch checklist of required steps", status: "done", notes: "GoLiveChecklist page" },
      { name: "Sample Data Import", description: "Import sample products for testing", status: "partial", notes: "mock-data.ts" },
      { name: "Video Tutorials / Help", description: "In-context help videos during setup", status: "not_started" },
    ],
  },
];

const advancedOrderFeatures: FeatureCategory[] = [
  {
    category: "Order — Line Item Operations",
    icon: <ListChecks className="h-5 w-5" />,
    features: [
      { name: "Add Line Item to Existing Order", description: "Add products to order after creation", status: "partial" },
      { name: "Remove Line Item from Order", description: "Remove product from order before shipping", status: "partial" },
      { name: "Edit Line Item Quantity", description: "Change quantity on order line", status: "partial" },
      { name: "Edit Line Item Price", description: "Override price on order line", status: "partial" },
      { name: "Line Item Discount", description: "Apply per-line discount", status: "partial" },
      { name: "Line Item Tax Override", description: "Override tax on specific line item", status: "not_started" },
      { name: "Line Item Notes", description: "Internal notes per line item", status: "not_started" },
      { name: "Line Item Fulfillment Status", description: "Track shipped/unshipped per line item", status: "partial" },
      { name: "Line Item Serial Number", description: "Record serial number per shipped item", status: "not_started" },
      { name: "Custom Line Item (Non-Product)", description: "Add custom/manual line items", status: "partial" },
    ],
  },
];

const storefrontNavigationFeatures: FeatureCategory[] = [
  {
    category: "Storefront Navigation — Full",
    icon: <Grip className="h-5 w-5" />,
    features: [
      { name: "Primary Navigation Menu", description: "Main header navigation", status: "done" },
      { name: "Footer Navigation", description: "Footer link columns", status: "done" },
      { name: "Breadcrumb Navigation", description: "Category/product breadcrumbs", status: "done" },
      { name: "Sidebar Category Tree", description: "Expandable category navigation sidebar", status: "done", notes: "StorefrontSidebar" },
      { name: "Mobile Hamburger Menu", description: "Slide-out mobile navigation", status: "done" },
      { name: "Mega Menu (Multi-Column)", description: "Large dropdown with images and columns", status: "partial" },
      { name: "Navigation Badges (Sale/New)", description: "Badges on nav items for promotions", status: "partial" },
      { name: "Navigation Custom Links", description: "Add custom URLs to navigation", status: "partial" },
      { name: "Navigation Sorting", description: "Drag-and-drop reorder navigation items", status: "partial" },
      { name: "Sticky Navigation", description: "Header sticks on scroll", status: "partial" },
    ],
  },
];

const emailDeliverabilityFeatures: FeatureCategory[] = [
  {
    category: "Email Deliverability & Infrastructure",
    icon: <Mail className="h-5 w-5" />,
    features: [
      { name: "Transactional Email Queue", description: "Queue-based email sending with retry", status: "done", notes: "email_queue table" },
      { name: "Email Send Status Tracking", description: "Track sent/failed/pending per email", status: "done" },
      { name: "Email Error Logging", description: "Log email delivery errors", status: "done" },
      { name: "Email Domain Authentication (SPF/DKIM)", description: "Configure SPF/DKIM for deliverability", status: "not_started" },
      { name: "Custom SMTP Configuration", description: "Use custom SMTP server for emails", status: "not_started" },
      { name: "Email Bounce Handling", description: "Handle bounced emails and update records", status: "not_started" },
      { name: "Email Open Tracking", description: "Track email open rates", status: "not_started" },
      { name: "Email Click Tracking", description: "Track link clicks in emails", status: "not_started" },
      { name: "Email A/B Testing", description: "Test subject lines and content", status: "not_started" },
      { name: "Email Suppression List", description: "Don't email unsubscribed/bounced addresses", status: "not_started" },
    ],
  },
];

// ═══════ WAVE 13 — ABSOLUTE FINAL MICRO-FEATURES ═══════

const productRelationFeatures: FeatureCategory[] = [
  {
    category: "Product Relations & Associations",
    icon: <Link className="h-5 w-5" />,
    features: [
      { name: "Related Products (Manual)", description: "Manually assign related products", status: "done", notes: "product_relations" },
      { name: "Related Products (Auto)", description: "Auto-suggest related by category/tags", status: "partial" },
      { name: "Cross-Sell Products", description: "Products shown on cart page", status: "done" },
      { name: "Upsell Products", description: "Higher-value alternative suggestions", status: "done" },
      { name: "Frequently Bought Together", description: "Bundle suggestions based on order history", status: "not_started" },
      { name: "Accessories / Add-Ons", description: "Optional add-on products for main product", status: "done", notes: "product_addons" },
      { name: "Required Accessories", description: "Mandatory add-ons auto-added to cart", status: "partial" },
      { name: "Product Comparison Group", description: "Group products for side-by-side comparison", status: "done", notes: "CompareContext" },
      { name: "Substitute / Alternative Products", description: "Suggest alternatives when out of stock", status: "not_started" },
      { name: "Warranty Product Link", description: "Link warranty products to eligible items", status: "not_started" },
    ],
  },
];

const storefrontFooterFeatures: FeatureCategory[] = [
  {
    category: "Storefront Footer & Chrome",
    icon: <Monitor className="h-5 w-5" />,
    features: [
      { name: "Footer Link Columns", description: "Multi-column footer with links", status: "done" },
      { name: "Footer Newsletter Signup", description: "Newsletter form in footer", status: "done", notes: "NewsletterSignup" },
      { name: "Footer Social Media Icons", description: "Social media icon links", status: "done" },
      { name: "Footer Payment Icons", description: "Accepted payment method icons", status: "partial" },
      { name: "Footer Trust Badges", description: "SSL, security, guarantee badges", status: "partial" },
      { name: "Footer Copyright Notice", description: "Dynamic copyright year", status: "done" },
      { name: "Footer Contact Info", description: "Phone, email, address in footer", status: "done" },
      { name: "Footer Store Locator Link", description: "Link to store finder page", status: "done" },
      { name: "Announcement Bar (Top)", description: "Configurable top-of-page announcement", status: "done", notes: "AdvertBanner" },
      { name: "Promo Popup (Entry/Exit)", description: "Promotional popup on entry or exit intent", status: "done", notes: "PromoPopup" },
    ],
  },
];

const inventoryReceivingFeatures: FeatureCategory[] = [
  {
    category: "Inventory Receiving & Inbound",
    icon: <Download className="h-5 w-5" />,
    features: [
      { name: "Receive Against PO", description: "Record received stock against purchase order", status: "partial" },
      { name: "Receive Without PO", description: "Ad-hoc stock receipt without PO", status: "partial" },
      { name: "Barcode Scan Receiving", description: "Scan items during receiving process", status: "done", notes: "BarcodeScanner" },
      { name: "Receive with Quality Check", description: "Inspect quality during receiving", status: "not_started" },
      { name: "Partial Receive (PO)", description: "Receive subset of PO items", status: "partial" },
      { name: "Over-Receive Warning", description: "Warn when receiving more than ordered", status: "not_started" },
      { name: "Receive to Specific Location/Bin", description: "Direct received stock to bin location", status: "partial", notes: "bin_location field" },
      { name: "Receiving Report / GRN Print", description: "Print goods receipt note", status: "not_started" },
      { name: "Supplier Packing Slip Reconciliation", description: "Compare received items to supplier slip", status: "not_started" },
      { name: "Auto-Update Stock on Receive", description: "Automatically adjust stock levels", status: "done" },
    ],
  },
];

const contentBlockFeatures: FeatureCategory[] = [
  {
    category: "Content Blocks & Dynamic Content",
    icon: <Puzzle className="h-5 w-5" />,
    features: [
      { name: "Content Block CRUD", description: "Create/edit/delete reusable content blocks", status: "done", notes: "ContentBlocks page" },
      { name: "Content Block Placement", description: "Assign blocks to page positions", status: "done", notes: "placement field" },
      { name: "Content Block Scheduling", description: "Schedule block visibility by date", status: "partial" },
      { name: "Content Block Targeting", description: "Show blocks to specific customer groups", status: "not_started" },
      { name: "HTML Content Block", description: "Raw HTML content block type", status: "done" },
      { name: "Banner / Image Block", description: "Image banner content block", status: "done" },
      { name: "Product Carousel Block", description: "Dynamic product carousel widget", status: "partial" },
      { name: "Category Feature Block", description: "Featured categories widget", status: "partial" },
      { name: "Testimonial Block", description: "Customer testimonials widget", status: "not_started" },
      { name: "FAQ Accordion Block", description: "Collapsible FAQ content block", status: "partial" },
    ],
  },
];

const posAdvancedFeatures: FeatureCategory[] = [
  {
    category: "POS — Advanced Operations",
    icon: <Tv className="h-5 w-5" />,
    features: [
      { name: "POS Product Search", description: "Quick search products by name/SKU/barcode", status: "done", notes: "POS page" },
      { name: "POS Barcode Scanner Input", description: "Scan barcodes to add to POS cart", status: "done" },
      { name: "POS Customer Lookup", description: "Search and assign customer to sale", status: "done" },
      { name: "POS Discount Application", description: "Apply line/cart discounts at POS", status: "done" },
      { name: "POS Cash Payment", description: "Accept cash with change calculation", status: "done" },
      { name: "POS Card Payment", description: "Process card payments via terminal", status: "partial" },
      { name: "POS Split Payment", description: "Split payment across methods", status: "not_started" },
      { name: "POS Receipt Print", description: "Print thermal receipt", status: "partial" },
      { name: "POS End-of-Day Report", description: "Daily POS sales summary", status: "done", notes: "POS page EOD dialog" },
      { name: "POS Cash Drawer Open", description: "Trigger cash drawer via USB/Bluetooth", status: "not_started" },
      { name: "POS Refund Processing", description: "Process refunds at POS", status: "not_started" },
      { name: "POS Hold / Park Sale", description: "Park current sale and serve next customer", status: "not_started" },
      { name: "POS Gift Card Scan & Redeem", description: "Scan and apply gift cards at POS", status: "not_started" },
      { name: "POS Loyalty Points Display", description: "Show customer loyalty balance at POS", status: "not_started" },
      { name: "POS Multiple Registers", description: "Support multiple POS terminals per store", status: "not_started" },
      { name: "POS Offline Mode", description: "Continue sales when internet is down", status: "not_started" },
    ],
  },
];

const supplierDeepFeatures: FeatureCategory[] = [
  {
    category: "Suppliers — Deep Management",
    icon: <Building className="h-5 w-5" />,
    features: [
      { name: "Supplier Directory", description: "List and manage all suppliers", status: "done", notes: "Suppliers page" },
      { name: "Supplier Contact Details", description: "Store supplier contact info", status: "done" },
      { name: "Supplier Payment Terms", description: "Track supplier payment terms", status: "partial" },
      { name: "Supplier Currency", description: "Supplier-specific currency", status: "partial" },
      { name: "Supplier Product Assignment", description: "Link products to their suppliers", status: "done", notes: "supplier_id on products" },
      { name: "Supplier Price Lists", description: "Track supplier cost prices", status: "partial" },
      { name: "Supplier Lead Time", description: "Default lead time per supplier", status: "partial" },
      { name: "Supplier Minimum Order", description: "Minimum order value per supplier", status: "not_started" },
      { name: "Supplier Rating / Scorecarding", description: "Rate suppliers on performance", status: "not_started" },
      { name: "Supplier Portal Access", description: "Supplier login to view/fulfill orders", status: "not_started" },
      { name: "Supplier Document Storage", description: "Store contracts, certificates per supplier", status: "not_started" },
      { name: "Multi-Supplier per Product", description: "Multiple suppliers for same product", status: "not_started" },
    ],
  },
];

// ═══════ WAVE 14 — FINAL EXHAUSTIVE SWEEP ═══════

const currencyDeepFeatures: FeatureCategory[] = [
  {
    category: "Currency Management — Deep",
    icon: <DollarSign className="h-5 w-5" />,
    features: [
      { name: "Currency CRUD", description: "Add/edit/remove supported currencies", status: "done", notes: "Currencies page" },
      { name: "Exchange Rate Manual Entry", description: "Manually set exchange rates", status: "done" },
      { name: "Exchange Rate Auto-Fetch", description: "Auto-fetch rates from API (ECB, Open Exchange)", status: "not_started" },
      { name: "Currency Display Format", description: "Configure symbol position, decimals", status: "partial" },
      { name: "Currency Rounding Rules", description: "Round to nearest 5c, 10c, etc.", status: "not_started" },
      { name: "Base Currency Lock", description: "All pricing stored in base currency", status: "done" },
      { name: "Multi-Currency Cart", description: "Cart displays in selected currency", status: "done", notes: "CurrencySwitcher" },
      { name: "Multi-Currency Checkout", description: "Charge in customer's selected currency", status: "partial" },
      { name: "Currency per Market", description: "Default currency per multimarket region", status: "done", notes: "multimarket_settings" },
      { name: "Historical Exchange Rates", description: "Store rate history for reporting", status: "not_started" },
    ],
  },
];

const reviewDeepFeatures: FeatureCategory[] = [
  {
    category: "Reviews & Ratings — Deep",
    icon: <Star className="h-5 w-5" />,
    features: [
      { name: "Product Review Submission", description: "Customers submit star rating + text review", status: "done", notes: "ProductReviews component" },
      { name: "Review Moderation Queue", description: "Admin approves/rejects reviews before display", status: "done", notes: "Reviews page" },
      { name: "Review Auto-Approval", description: "Auto-approve reviews from verified purchasers", status: "partial" },
      { name: "Review Photo Upload", description: "Customers attach photos to reviews", status: "done", notes: "Photo upload with preview, up to 5 photos, stored in product-images bucket" },
      { name: "Review Voting (Helpful/Not)", description: "Users vote on review helpfulness", status: "done", notes: "ThumbsUp/ThumbsDown voting with localStorage dedup and helpful_count/not_helpful_count DB persistence" },
      { name: "Review Response (Merchant)", description: "Merchant replies to customer reviews", status: "done", notes: "admin_reply and admin_reply_at fields, rendered in storefront with Store Response styling" },
      { name: "Review Request Email (Post-Purchase)", description: "Auto-email asking for review after delivery", status: "done", notes: "order-follow-up function" },
      { name: "Review Aggregate Rating (Schema)", description: "Aggregate rating in JSON-LD for SERP", status: "done", notes: "JSON-LD structured data" },
      { name: "Review Syndication (Google)", description: "Syndicate reviews to Google Shopping", status: "not_started" },
      { name: "Review Import (CSV)", description: "Import reviews from other platforms", status: "not_started" },
      { name: "Review Sorting (Most Recent/Helpful)", description: "Sort reviews by date, rating, helpfulness", status: "done", notes: "Select dropdown with 5 sort options: newest, oldest, highest, lowest, most helpful" },
      { name: "Review Filtering by Rating", description: "Filter reviews by star count", status: "done", notes: "Clickable rating bars filter to specific star level, clear filter button" },
    ],
  },
];

const shippingTrackingFeatures: FeatureCategory[] = [
  {
    category: "Shipping Tracking — Full",
    icon: <MapPin className="h-5 w-5" />,
    features: [
      { name: "Tracking Number Entry", description: "Enter tracking number per shipment", status: "done" },
      { name: "Multi-Carrier Tracking", description: "Support tracking across all carriers", status: "partial" },
      { name: "Tracking Page (Customer)", description: "Customer-facing order tracking page", status: "done", notes: "StorefrontTrackOrder" },
      { name: "Tracking Email with Link", description: "Email tracking number and link to customer", status: "done", notes: "shipment-email function" },
      { name: "Tracking Status Auto-Update", description: "Auto-poll carrier API for status updates", status: "not_started" },
      { name: "Delivery Confirmation Trigger", description: "Auto-mark delivered based on carrier status", status: "not_started" },
      { name: "Multi-Parcel Tracking", description: "Multiple tracking numbers per order", status: "partial" },
      { name: "Tracking Widget (Storefront)", description: "Embedded tracking widget on storefront", status: "done" },
      { name: "Proof of Delivery (POD)", description: "Store/display proof of delivery from carrier", status: "not_started" },
      { name: "Delivery Exception Alerts", description: "Alert admin of delivery exceptions", status: "not_started" },
    ],
  },
];

const adminBulkOpsFeatures: FeatureCategory[] = [
  {
    category: "Admin Bulk Operations",
    icon: <Grip className="h-5 w-5" />,
    features: [
      { name: "Bulk Select (Checkbox All)", description: "Select all items on page/across pages", status: "done" },
      { name: "Bulk Delete Products", description: "Delete multiple products at once", status: "done" },
      { name: "Bulk Update Product Status", description: "Change status of multiple products", status: "done", notes: "BulkEditDialog" },
      { name: "Bulk Update Product Price", description: "Adjust prices of multiple products", status: "done" },
      { name: "Bulk Update Product Category", description: "Move products to different category", status: "done" },
      { name: "Bulk Update Product Tags", description: "Add/remove tags from multiple products", status: "done" },
      { name: "Bulk Print Labels", description: "Print labels for selected products", status: "done", notes: "PrintBarcodeLabels" },
      { name: "Bulk Order Status Update", description: "Change status of multiple orders", status: "done", notes: "Orders page with multi-select checkboxes, bulk status dropdown, and handleBulkUpdate" },
      { name: "Bulk Customer Tag Assignment", description: "Add tags to multiple customers", status: "done", notes: "Customers page bulk tag dialog with add/remove action and multi-select" },
      { name: "Bulk Customer Group Assignment", description: "Move customers between groups", status: "done", notes: "Customers page bulk group dialog with customer_groups lookup" },
      { name: "Bulk Inventory Adjustment", description: "Adjust stock for multiple SKUs at once", status: "done", notes: "Inventory page with checkbox selection, bulk adjust dialog (add/subtract/set), multi-variant update" },
      { name: "Bulk Export Selected", description: "Export only selected rows to CSV", status: "partial" },
    ],
  },
];

const smartNotificationFeatures: FeatureCategory[] = [
  {
    category: "Smart Notifications & Automations",
    icon: <Zap className="h-5 w-5" />,
    features: [
      { name: "Order Status Change Auto-Email", description: "Auto-email customer on any status change", status: "done" },
      { name: "Shipment Created Auto-Email", description: "Email with tracking on shipment creation", status: "done", notes: "shipment-email" },
      { name: "Payment Received Auto-Email", description: "Email on payment confirmation", status: "done", notes: "payment-email" },
      { name: "Review Submitted Admin Alert", description: "Notify admin of new review submission", status: "not_started" },
      { name: "Scheduled Cron Jobs", description: "Scheduled tasks (daily reports, cleanup)", status: "partial" },
      { name: "Event-Driven Automation", description: "Trigger actions on specific events", status: "done", notes: "email_automations" },
      { name: "Automation Delay / Wait", description: "Add delay before automation fires", status: "done", notes: "delay_hours field" },
      { name: "Automation Condition Filtering", description: "Only fire automation if conditions met", status: "partial" },
      { name: "Automation A/B Testing", description: "Test different email content per automation", status: "not_started" },
      { name: "Automation Analytics (Sent/Open/Click)", description: "Track automation performance", status: "partial" },
    ],
  },
];

const invoiceFeatures: FeatureCategory[] = [
  {
    category: "Invoicing — Complete",
    icon: <FileText className="h-5 w-5" />,
    features: [
      { name: "Auto-Generate Invoice on Order", description: "Invoice auto-created with order", status: "done" },
      { name: "Invoice Number Sequence", description: "Sequential invoice numbering", status: "done" },
      { name: "Invoice PDF Generation", description: "Generate PDF invoice", status: "done", notes: "PrintInvoice" },
      { name: "Invoice Email to Customer", description: "Email invoice PDF to customer", status: "done" },
      { name: "Invoice Line Items", description: "Itemized products, qty, price, tax", status: "done" },
      { name: "Invoice Tax Summary", description: "Tax breakdown on invoice", status: "done" },
      { name: "Invoice Payment Terms Display", description: "Show payment terms on invoice", status: "partial" },
      { name: "Invoice Notes / Memo", description: "Custom notes on invoice", status: "partial" },
      { name: "Invoice Branding (Logo/Colors)", description: "Custom logo and colors on invoice", status: "partial" },
      { name: "Credit Note Generation", description: "Generate credit notes for refunds", status: "done", notes: "credit_notes table" },
      { name: "Credit Note PDF", description: "PDF credit note document", status: "partial" },
      { name: "Proforma Invoice", description: "Generate proforma invoices for quotes", status: "partial" },
      { name: "Invoice Overdue Tracking", description: "Track overdue invoices for B2B", status: "not_started" },
      { name: "Invoice Payment Link", description: "Include payment link in invoice email", status: "not_started" },
    ],
  },
];

const maropostMigrationFeatures: FeatureCategory[] = [
  {
    category: "Maropost Migration System",
    icon: <ArrowLeftRight className="h-5 w-5" />,
    features: [
      { name: "Maropost API Connection", description: "Test connection to Maropost Neto API using store domain and API key", status: "done", notes: "maropost-migration edge function with NETOAPI_ACTION headers" },
      { name: "Store Scan (Entity Discovery)", description: "Paginated scan of all Maropost entities to discover available data counts", status: "done", notes: "Scan mode with minimal selectors for fast counting across 12 entity types" },
      { name: "Product Import (Full Fields)", description: "Import products with 60+ fields including price tiers, shipping, specs", status: "done", notes: "maropost-import edge function with SKU-based upsert and full field mapping" },
      { name: "Product Image Re-hosting", description: "Download product images from Maropost and upload to platform storage", status: "done", notes: "Re-hosts to product-images storage bucket during import" },
      { name: "Product Variant Import", description: "Import variant inventory with SKU, price, stock quantity", status: "done", notes: "Maps to product_variants table" },
      { name: "Product Pricing Tier Import", description: "Import multi-tier/group pricing from PriceGroups", status: "done", notes: "Maps PriceGroup array to product_pricing_tiers" },
      { name: "Product Shipping Dimensions Import", description: "Import shipping weight, length, width, height, cubic weight", status: "done", notes: "Maps to product_shipping table" },
      { name: "Product Specifics Import", description: "Import ItemSpecifics as product_specifics name/value pairs", status: "done", notes: "Handles nested ItemSpecific structure" },
      { name: "Category Import with Hierarchy", description: "Import categories with parent/child relationships in two passes", status: "done", notes: "Two-pass import: create all, then link parents" },
      { name: "Customer Import with Groups", description: "Import customers and auto-create customer_groups from UserGroup values", status: "done", notes: "Auto-creates groups, links via customer_group_id" },
      { name: "Customer Address Import", description: "Import billing and shipping addresses to customer_addresses table", status: "done", notes: "customer_addresses table with address_type, is_default" },
      { name: "Order Import with Line Items", description: "Import orders with status mapping, line items, and payment records", status: "done", notes: "Status mapping from Maropost states to platform states" },
      { name: "Order Payment Import", description: "Import payment records linked to orders", status: "done", notes: "Maps to order_payments with payment_method and reference" },
      { name: "Content Page Import", description: "Import content pages and blog posts with SEO fields", status: "done", notes: "Slug-based upsert to content_pages" },
      { name: "Gift Voucher Import", description: "Import gift vouchers with balance, expiry, recipient info", status: "done", notes: "Maps to gift_vouchers table" },
      { name: "Supplier Import", description: "Import suppliers with contact info and address", status: "done", notes: "Maps to suppliers table" },
      { name: "Warehouse Import", description: "Import warehouse locations", status: "done", notes: "Maps to inventory_locations as type 'warehouse'" },
      { name: "Shipping Method Import", description: "Import shipping methods and zones", status: "done", notes: "Maps to shipping_zones with rate_type and flat_rate" },
      { name: "RMA / Returns Import", description: "Import return/RMA records", status: "done", notes: "Maps to returns table with status mapping" },
      { name: "B@SE Theme Template Import", description: "Generate B@SE-compatible template stubs for 12 core layout types", status: "done", notes: "Header, footer, homepage, product detail, category, cart, checkout, account, blog, contact, search, wishlist" },
      { name: "Custom CSS/JS Import", description: "Extract and import custom CSS and JavaScript from Maropost content", status: "done", notes: "Stored as store_templates with custom_css" },
      { name: "Migration Job Tracking", description: "Track migration progress in migration_jobs table", status: "done", notes: "migration_jobs and migration_entity_logs tables" },
      { name: "Resumable Migration (Session Persist)", description: "Session storage persistence so migration can resume if page is closed", status: "done", notes: "Credentials, step, and entity state persisted to sessionStorage" },
      { name: "Selective Entity Import", description: "Choose which entities to import with checkbox selection", status: "done", notes: "Select/deselect all, per-entity toggle" },
      { name: "Live Migration Log Console", description: "Real-time log console showing import progress and errors", status: "done", notes: "Scrollable log with timestamps, color-coded success/failure" },
      { name: "Transfer Audit Dashboard", description: "Post-migration dashboard showing entity-by-entity transfer status", status: "done", notes: "MaropostTransferAudit page with category-based breakdown" },
      { name: "Inactive Product/Category Import", description: "Import both active and inactive products and categories", status: "done", notes: "Filter IsActive: ['True', 'False'] for comprehensive import" },
      { name: "Batch Import Processing", description: "Process imports in batches of 50 to avoid timeouts", status: "done", notes: "50-item batches with per-batch progress logging" },
      { name: "Customer Password Reset Flow", description: "Cannot migrate hashed passwords; customers must use reset flow", status: "done", notes: "Documented as manual-only in transfer audit" },
      { name: "Digital Download File References", description: "Import ContentFileIdentifier references for digital products", status: "partial", notes: "File references stored; actual files need manual re-upload" },
      { name: "eBay Listing Re-connection", description: "Store eBay product IDs for marketplace reconnection", status: "partial", notes: "eBayProductIDs field captured during import" },
      { name: "Product-Category Linking", description: "Link products to imported categories during product import", status: "done", notes: "Matches by slug generated from CategoryName" },
      { name: "Product Relations Import (Cross-sell/Upsell)", description: "Import cross-sell, upsell, and free gift relationships between products", status: "done", notes: "Maps CrossSellProducts, UpsellProducts, FreeGifts to product_relations" },
      { name: "Currency Import", description: "Import store currencies with exchange rates and default currency flag", status: "done", notes: "import_currencies action maps to currencies table" },
      { name: "Retry Failed Entities", description: "Retry button for individually failed entities during import", status: "done", notes: "Per-entity retry with full re-fetch and re-import" },
      { name: "Expandable Error Details", description: "Click-to-expand error lists per entity in import progress view", status: "done", notes: "HTML details/summary for collapsible error log" },
      { name: "Inventory Stock Level Import", description: "Import per-warehouse stock quantities during product import", status: "done", notes: "Maps WarehouseQuantity/WarehouseLocations to inventory_stock with location matching" },
      { name: "Customer Communication Log Import", description: "Import CustomerLog entries to customer_communications table", status: "done", notes: "Logs imported with channel, subject, body, and date" },
      { name: "Currency Entity in Migration Wizard", description: "Currencies appear in scan/select/import UI alongside other entities", status: "done", notes: "Added to MIGRATION_ENTITIES and FETCH_ACTION_MAP" },
      { name: "Live Database Counts in Transfer Audit", description: "Transfer audit page shows real imported record counts from the database", status: "done", notes: "15 entity counts fetched live via Supabase queries" },
      { name: "301 Redirect Import", description: "Import URL redirects for SEO continuity during migration", status: "done", notes: "Maps old/new URLs to redirects table with from_path/to_path" },
      { name: "Order-Customer Linking", description: "Link imported orders to existing customers by email match", status: "done", notes: "Queries customers table by email during order import" },
      { name: "Newsletter Subscriber Import", description: "Extract newsletter subscribers from customer NewsletterSubscriber flag", status: "done", notes: "Auto-creates newsletter_subscribers entries during customer import" },
      { name: "Pre-Import Validation Summary", description: "Shows total records, pages, estimated duration before import starts", status: "done", notes: "Validation card in select step with relationship linking info" },
      { name: "Customer Email Deduplication", description: "Upsert customers by email to prevent duplicates on re-import", status: "done", notes: "Email-based lookup before insert, updates existing records" },
      { name: "Migration Rollback (Full Delete)", description: "Delete all imported data for the current store with confirmation", status: "done", notes: "Clears 22 tables in dependency order with per-table logging" },
      { name: "Export Migration Report (CSV)", description: "Download migration results and logs as CSV file", status: "done", notes: "Exports entity stats + full migration log to timestamped CSV" },
      { name: "Variant SKU Deduplication", description: "Upsert product variants by SKU to prevent duplicates on re-import", status: "done", notes: "SKU-based lookup in product_variants before insert, updates existing" },
      { name: "Order Deduplication", description: "Upsert orders by order_number (MP-{OrderID}) to prevent duplicates", status: "done", notes: "Order number lookup before insert, updates existing order data" },
      { name: "Per-Entity Batch Progress", description: "Show batch X/Y progress bar per entity during import", status: "done", notes: "batchProgress state on EntityCount, Progress bar shown during importing status" },
      { name: "Dry-Run / Preview Mode", description: "Validate data structure without writing to database", status: "done", notes: "dry_run flag passed to edge function, checkbox in select step UI" },
      { name: "Source vs Imported Comparison", description: "Side-by-side source counts vs imported counts with percentage completion", status: "done", notes: "Transfer audit shows source counts from session alongside live DB counts" },
      { name: "Auto-Refresh Live Counts", description: "Toggle auto-refresh for live database counts every 10 seconds", status: "done", notes: "Auto-refresh button with interval in transfer audit" },
      { name: "Data Integrity Checks", description: "Detect orphan orders, uncategorized products, and missing images", status: "done", notes: "Integrity warnings panel in transfer audit with per-issue counts" },
      { name: "Export Transfer Audit (CSV)", description: "Download full transfer audit report as CSV", status: "done", notes: "Exports feature mapping, live counts, and integrity issues" },
      { name: "Pause / Resume Import", description: "Pause and resume long-running imports at batch or entity level", status: "done", notes: "Pause button in import step, ref-based pause flag checked at batch and entity boundaries" },
      { name: "Field Mapping Preview", description: "Review and toggle Maropost-to-platform field mappings before import", status: "done", notes: "New 'mapping' step with per-entity tabs showing source→target field table with toggle" },
      { name: "Post-Migration Verification", description: "Automated checks for count matching, orphan orders, missing images, SEO, categories", status: "done", notes: "10 verification checks with pass/warn/fail status after import, results included in CSV export" },
      { name: "8-Step Migration Wizard", description: "Expanded wizard: Connect → Scan → Field Map → Select → Import → Verify → Theme → Review", status: "done", notes: "Added mapping and verify steps to the 6-step wizard" },
      { name: "Save for Later (Cart)", description: "Move cart items to a saved-for-later list and restore them back to cart", status: "done", notes: "CartContext extended with savedItems, saveForLater, moveToCart, removeSaved" },
      { name: "Low Stock Urgency Indicator", description: "Show stock countdown warning on product detail when quantity is below threshold", status: "done", notes: "Displays 'Only X left' or 'Low stock' based on low_stock_threshold" },
      { name: "Multi-Currency Cart Display", description: "Cart totals displayed in selected currency using store currency settings", status: "done", notes: "Cart and checkout respect store currency code" },
    ],
  },
];

const allFeatureData = deduplicateFeatures([...featureData, ...advancedFeatures, ...finalFeatures, ...integrationFeatures, ...remainingFeatures, ...granularFeatures, ...deepFeatures, ...finalDeepFeatures, ...extendedFeatures, ...ultraDeepFeatures, ...finalComprehensiveFeatures, ...microFeatures, ...finalEdgeFeatures, ...ultimateFeatures, ...absoluteFinalFeatures, ...b2bOperationsFeatures, ...b2bDeepDiveFeatures, ...templateAndChromeFeatures, ...templateDeepFeatures, ...adminInfraFeatures, ...warehouseDeepFeatures, ...shippingDeepFeatures, ...paymentDeepFeatures, ...b2bWholesaleDeepFeatures, ...marketplaceDeepFeatures, ...reportingDeepFeatures, ...emailAutomationDeepFeatures, ...returnsRmaFeatures, ...posDeepFeatures, ...adminUxFeatures, ...checkoutDeepFeatures, ...seoContentDeepFeatures, ...securityComplianceFeatures, ...carrierIntegrationFeatures, ...orderWorkflowFeatures, ...customerAdvancedFeatures, ...inventoryAdvancedFeatures, ...analyticsDeepFeatures, ...promotionFeatures, ...notificationFeatures, ...platformMultiTenantFeatures, ...importExportFeatures, ...apiWebhookFeatures, ...storefrontAdvancedFeatures, ...accountingIntFeatures, ...marketingAutomationFeatures, ...multimarketDeepFeatures, ...paymentGatewayDeepFeatures, ...purchaseOrderFeatures, ...subscriptionDeepFeatures, ...digitalProductFeatures, ...mediaManagementFeatures, ...smartCollectionDeepFeatures, ...staffPermissionFeatures, ...warehouseFulfillmentFeatures, ...thirdPartyIntegrationFeatures, ...laybyFeatures, ...quotingFeatures, ...returnPortalFeatures, ...performanceFeatures, ...accessibilityFeatures, ...mobileAppFeatures, ...dataPrivacyFeatures, ...configSettingsFeatures, ...productVariantDeepFeatures, ...searchMerchandisingFeatures, ...shippingRulesDeepFeatures, ...taxDeepFeatures, ...emailTemplateDeepFeatures, ...printDocumentDeepFeatures, ...addonEcosystemFeatures, ...backupMigrationFeatures, ...testingQaFeatures, ...netoTemplateFeatures, ...customerAccountFeatures, ...inventoryCountingFeatures, ...dropshipFeatures, ...socialCommerceFeatures, ...b2bPortalFeatures, ...advancedCouponFeatures, ...auditComplianceFeatures, ...giftRegistryFeatures, ...warehouseAutomationFeatures, ...returnPolicyFeatures, ...customerSegmentationFeatures, ...internationalFeatures, ...productSchedulingFeatures, ...orderPrintingFeatures, ...developerToolsFeatures, ...cartFeatures, ...adminDashboardFeatures, ...productCustomFieldFeatures, ...onboardingFeatures, ...advancedOrderFeatures, ...storefrontNavigationFeatures, ...emailDeliverabilityFeatures, ...productRelationFeatures, ...storefrontFooterFeatures, ...inventoryReceivingFeatures, ...contentBlockFeatures, ...posAdvancedFeatures, ...supplierDeepFeatures, ...currencyDeepFeatures, ...reviewDeepFeatures, ...shippingTrackingFeatures, ...adminBulkOpsFeatures, ...smartNotificationFeatures, ...invoiceFeatures, ...maropostMigrationFeatures]);
const statusConfig: Record<Status, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  done: { label: "Done", variant: "default", icon: <CheckCircle className="h-3.5 w-3.5" /> },
  partial: { label: "Partial", variant: "secondary", icon: <Clock className="h-3.5 w-3.5" /> },
  not_started: { label: "Not Started", variant: "outline", icon: <Circle className="h-3.5 w-3.5" /> },
};

export default function FeatureAudit() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");

  const stats = useMemo(() => {
    let done = 0, partial = 0, not_started = 0;
    allFeatureData.forEach(c => c.features.forEach(f => {
      if (f.status === "done") done++;
      else if (f.status === "partial") partial++;
      else not_started++;
    }));
    const total = done + partial + not_started;
    return { done, partial, not_started, total, pct: total ? Math.round(((done + partial * 0.5) / total) * 100) : 0 };
  }, []);

  const filteredCategories = useMemo(() => {
    const q = search.toLowerCase();
    return allFeatureData.map(cat => {
      const features = cat.features.filter(f => {
        if (statusFilter !== "all" && f.status !== statusFilter) return false;
        if (q && !f.name.toLowerCase().includes(q) && !f.description.toLowerCase().includes(q) && !(f.notes || "").toLowerCase().includes(q) && !cat.category.toLowerCase().includes(q)) return false;
        return true;
      });
      return { ...cat, features };
    }).filter(c => c.features.length > 0);
  }, [search, statusFilter]);

  const totalFiltered = filteredCategories.reduce((s, c) => s + c.features.length, 0);

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div>
          <h1 className="text-lg font-semibold">Maropost Feature Audit</h1>
          <p className="text-xs text-muted-foreground">Comprehensive parity tracker — {stats.total} features across {allFeatureData.length} modules</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-sm text-muted-foreground">Total Features</p>
              <p className="text-lg font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-sm text-muted-foreground">Done</p>
              <p className="text-lg font-bold text-primary">{stats.done}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-sm text-muted-foreground">Partial</p>
              <p className="text-lg font-bold text-accent-foreground">{stats.partial}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-sm text-muted-foreground">Not Started</p>
              <p className="text-lg font-bold text-muted-foreground">{stats.not_started}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-sm text-muted-foreground">Progress</p>
              <p className="text-lg font-bold">{stats.pct}%</p>
              <Progress value={stats.pct} className="mt-2 h-2" />
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search features, modules, or notes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)} className="w-auto">
            <TabsList>
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="done">Done ({stats.done})</TabsTrigger>
              <TabsTrigger value="partial">Partial ({stats.partial})</TabsTrigger>
              <TabsTrigger value="not_started">Not Started ({stats.not_started})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <p className="text-sm text-muted-foreground">Showing {totalFiltered} features in {filteredCategories.length} modules</p>

        {/* Category Collapsibles */}
        <div className="space-y-3">
          {filteredCategories.map(cat => {
            const catDone = cat.features.filter(f => f.status === "done").length;
            const catPartial = cat.features.filter(f => f.status === "partial").length;
            const catPct = cat.features.length ? Math.round(((catDone + catPartial * 0.5) / cat.features.length) * 100) : 0;

            return (
              <Collapsible key={cat.category} defaultOpen={false}>
                <Card>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-primary">{cat.icon}</span>
                          <CardTitle className="text-base">{cat.category}</CardTitle>
                          <span className="text-xs text-muted-foreground">({cat.features.length})</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="hidden sm:flex items-center gap-1.5 text-xs">
                            <span className="text-primary">{catDone}✓</span>
                            <span className="text-accent-foreground">{catPartial}◐</span>
                            <span className="text-muted-foreground">{cat.features.length - catDone - catPartial}○</span>
                          </div>
                          <div className="w-20">
                            <Progress value={catPct} className="h-1.5" />
                          </div>
                          <span className="text-xs font-medium w-8 text-right">{catPct}%</span>
                          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform" />
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 px-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs h-8 w-8"></TableHead>
                            <TableHead className="text-xs h-8">Feature</TableHead>
                            <TableHead className="text-xs h-8 hidden md:table-cell">Description</TableHead>
                            <TableHead className="text-xs h-8 w-28">Status</TableHead>
                            <TableHead className="text-xs h-8 hidden lg:table-cell">Notes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cat.features.map((f, i) => {
                            const sc = statusConfig[f.status];
                            return (
                              <TableRow key={i}>
                                <TableCell className="text-center">{sc.icon}</TableCell>
                                <TableCell className="font-medium text-sm">{f.name}</TableCell>
                                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{f.description}</TableCell>
                                <TableCell>
                                  <Badge variant={sc.variant} className="text-xs">{sc.label}</Badge>
                                </TableCell>
                                <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{f.notes || "—"}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
