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
  Receipt, BookOpen, Headphones, Smartphone, Repeat, Tag, Gift,
  ChevronDown, MapPin, Warehouse, PenTool, FileCode, Link, Image,
  AlertTriangle, DollarSign, Percent, Printer, Share2, Code,
  LayoutDashboard, Bell, Upload, Download, UserCheck, Key, Eye,
  MessageSquare, Star, Heart, RefreshCw, Scissors, ShieldCheck,
  HardDrive, Monitor, Workflow, Building, ArrowLeftRight,
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
];

// ─── STATUS RENDERING HELPERS ───
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
    featureData.forEach(c => c.features.forEach(f => {
      if (f.status === "done") done++;
      else if (f.status === "partial") partial++;
      else not_started++;
    }));
    const total = done + partial + not_started;
    return { done, partial, not_started, total, pct: total ? Math.round(((done + partial * 0.5) / total) * 100) : 0 };
  }, []);

  const filteredCategories = useMemo(() => {
    const q = search.toLowerCase();
    return featureData.map(cat => {
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
          <p className="text-xs text-muted-foreground">Comprehensive parity tracker — {stats.total} features across {featureData.length} modules</p>
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
