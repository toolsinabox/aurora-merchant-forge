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
];
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
