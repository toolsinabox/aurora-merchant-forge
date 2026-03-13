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
      { name: "P.O.A / Special Order Products", description: "Price On Application — hide price, show 'Contact for Price'", status: "not_started", notes: "Neto supports POA products where pricing is hidden" },
      { name: "Multi-Currency Pricing", description: "Display/sell in multiple currencies with conversion rules", status: "not_started", notes: "Neto Currency API supports multiple currencies" },
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
      { name: "Free Shipping Override", description: "Per-product free shipping flag", status: "not_started" },
      { name: "Dangerous Goods Flag", description: "Hazmat/dangerous goods shipping restrictions", status: "not_started" },
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
      { name: "Child Products", description: "Parent-child product hierarchy (non-variant children)", status: "partial", notes: "Variants exist but not full child-product hierarchy" },
      { name: "Editable Kit Components", description: "Components within an editable bundle that customers configure", status: "partial" },
      { name: "Product Addons / Custom Options", description: "Customizable fields (text engraving, color picker, file upload)", status: "not_started", notes: "Maropost Commerce Product Options add-on" },
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
      { name: "Canonical URL", description: "Set canonical URL to prevent duplicate content", status: "not_started" },
      { name: "Open Graph Tags", description: "OG title/description/image for social sharing", status: "done", notes: "SEOHead component sets OG meta tags dynamically on product detail pages" },
      { name: "Structured Data (JSON-LD Product)", description: "Schema.org Product markup for rich results", status: "not_started" },
      { name: "XML Sitemap Generation", description: "Auto-generated sitemap.xml for products/categories", status: "not_started" },
      { name: "301 Redirect Manager", description: "Manage URL redirects when slugs change", status: "not_started" },
      { name: "Google Shopping Feed", description: "Product data feed for Google Merchant Center", status: "not_started", notes: "Neto has built-in Google Shopping integration" },
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
      { name: "Purchase Order Receiving", description: "Receive stock against purchase orders, partial receipts", status: "partial", notes: "Status workflow exists, item-level receiving not yet" },
      { name: "Purchase Order Status Workflow", description: "Draft → Sent → Partial → Received → Closed", status: "done" },
      { name: "Stock Count / Stocktake", description: "Physical stock count reconciliation", status: "not_started" },
      { name: "Backorder Management", description: "Manage products on backorder, auto-allocate when stock arrives", status: "not_started" },
      { name: "Preorder Management", description: "Accept preorders before stock arrives", status: "not_started" },
      { name: "Batch / Lot Tracking", description: "Track products by batch or lot number", status: "not_started" },
      { name: "Serial Number Tracking", description: "Track individual units by serial number", status: "not_started" },
      { name: "Expiry Date Tracking", description: "Track expiry dates for perishable goods", status: "not_started" },
      { name: "Bin Location Management", description: "Assign bin/shelf locations within warehouses", status: "not_started" },
      { name: "Inventory Valuation Reports", description: "FIFO/LIFO/Average cost valuation", status: "not_started" },
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
      { name: "Billing Address", description: "Separate billing address", status: "partial", notes: "Single address field currently" },
      { name: "Order Subtotal / Tax / Shipping / Discount / Total", description: "Full order financial breakdown", status: "done" },
      { name: "Coupon Application to Orders", description: "Apply discount coupons to orders", status: "done" },
      { name: "Order Shipments (Partial Shipments)", description: "Multiple shipments per order with tracking", status: "done" },
      { name: "Shipment Items (Line-level Fulfillment)", description: "Track which items are in which shipment", status: "done" },
      { name: "Tracking Number / URL / Carrier", description: "Carrier, tracking number, tracking URL per shipment", status: "done" },
      { name: "Manual Order Creation (Admin)", description: "Staff can create orders from the admin panel", status: "done" },
      { name: "Order Quotes", description: "Create and send quotes that customers can approve/reject", status: "not_started", notes: "Neto has full quote workflow (approve_quote templates)" },
      { name: "Quote to Order Conversion", description: "Convert approved quote into a live order", status: "not_started" },
      { name: "Invoice Generation (PDF)", description: "Generate printable PDF invoices", status: "not_started", notes: "Neto has invoice.template.html" },
      { name: "Packing Slip Generation (PDF)", description: "Generate printable packing slips", status: "not_started", notes: "Neto system documents: packing slip" },
      { name: "Pick List Generation", description: "Generate warehouse pick lists from orders", status: "not_started" },
      { name: "Credit Notes", description: "Issue credit notes against orders", status: "not_started" },
      { name: "Order Splitting", description: "Split single order into multiple orders", status: "not_started" },
      { name: "Order Merging", description: "Merge multiple orders from same customer", status: "not_started" },
      { name: "Order Duplication / Reorder", description: "Clone an existing order as new", status: "done", notes: "Duplicate action on orders list" },
      { name: "Multi-Address Checkout / Split Shipping", description: "Ship different items to different addresses in one order", status: "not_started", notes: "Neto has address.template.html for multi-address" },
      { name: "Order Export (CSV/XML)", description: "Bulk export orders in various formats", status: "partial", notes: "Export wizard exists" },
      { name: "Order Import", description: "Bulk import orders from CSV/XML", status: "not_started" },
      { name: "Order Tags / Flags", description: "Tag or flag orders for internal workflows", status: "not_started" },
      { name: "Batch Order Processing", description: "Bulk update status, print labels for multiple orders", status: "partial", notes: "Bulk status update implemented" },
      { name: "Order Fraud Detection Flags", description: "Automated fraud scoring and risk flags on orders", status: "not_started" },
    ],
  },

  // ═══════ 8. PAYMENTS ═══════
  {
    category: "Payments",
    icon: <CreditCard className="h-5 w-5" />,
    features: [
      { name: "Payment Recording (GetPayment / AddPayment)", description: "Record and retrieve payments against orders", status: "partial", notes: "Payment status tracked but no gateway integration" },
      { name: "Stripe Integration", description: "Accept credit card payments via Stripe", status: "not_started" },
      { name: "PayPal Integration", description: "PayPal checkout / express checkout", status: "not_started" },
      { name: "Afterpay / Zip Pay (BNPL)", description: "Buy Now Pay Later integrations", status: "not_started" },
      { name: "Square Payment Integration", description: "Square payment processing", status: "not_started" },
      { name: "eWAY Payment Gateway", description: "eWAY (Australia) payment gateway", status: "not_started" },
      { name: "Braintree Integration", description: "Braintree (PayPal) payment processing", status: "not_started" },
      { name: "Manual / Offline Payments", description: "Record manual payments (bank transfer, check, cash)", status: "not_started" },
      { name: "Payment Refunds", description: "Process full or partial refunds", status: "not_started" },
      { name: "Payment Receipts / Confirmation", description: "Generate payment receipts", status: "not_started" },
      { name: "Saved Payment Methods", description: "Store card details for repeat purchases (tokenized)", status: "not_started" },
      { name: "Pay Order from Account", description: "Customer can pay outstanding orders from their account page", status: "not_started", notes: "Neto has pay_order templates" },
      { name: "Layby / Lay-Away", description: "Installment payment plans managed in-platform", status: "not_started" },
      { name: "Account Credit / Store Credit", description: "Customer account credit balance for future purchases", status: "not_started" },
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
      { name: "Return Shipping Labels", description: "Generate prepaid return shipping labels", status: "not_started" },
      { name: "Exchange / Replacement Orders", description: "Create replacement orders linked to returns", status: "not_started" },
      { name: "Warranty Claims (Disputes)", description: "Customer warranty dispute system with status workflow", status: "not_started", notes: "Neto has full warranty/dispute templates" },
      { name: "Dispute Types (Refund/Repair/Replace)", description: "Different dispute resolution types", status: "not_started" },
      { name: "Dispute Reason Selection", description: "Pre-defined dispute reasons for customers to choose from", status: "not_started" },
      { name: "Dispute Email Notifications", description: "Automated emails when disputes are raised, updated, closed", status: "not_started" },
      { name: "RMA Report", description: "Reporting on return rates, reasons, costs", status: "not_started" },
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
      { name: "Customer Groups (Retail / Wholesale / VIP)", description: "Assign customers to groups for pricing/access control", status: "not_started", notes: "Neto has user groups tied to pricing tiers" },
      { name: "Customer Credit Terms / Limits", description: "B2B credit limits, payment terms (Net 30, etc.)", status: "not_started" },
      { name: "Customer Statements", description: "Generate and email customer account statements", status: "not_started", notes: "Neto has customer_statement_email" },
      { name: "Multiple Shipping Addresses", description: "Customers save multiple delivery addresses", status: "done", notes: "Customer addresses CRUD with default billing/shipping" },
      { name: "Customer Files / Documents", description: "Upload contracts/documents to customer records", status: "not_started", notes: "Neto has customer/files templates" },
      { name: "Customer Logo Upload (Dropship)", description: "B2B customers upload their logo for dropship labels", status: "not_started", notes: "Neto has logos templates" },
      { name: "Wholesale Registration", description: "Separate wholesale registration form with approval workflow", status: "not_started", notes: "Neto has wholesaleregister templates" },
      { name: "Customer Auto-Registration on Purchase", description: "Automatically create customer account on first purchase", status: "not_started" },
      { name: "Customer Merge", description: "Merge duplicate customer records", status: "not_started" },
      { name: "Customer Export", description: "Export customers to CSV", status: "not_started" },
      { name: "Customer Import", description: "Bulk import customers from CSV", status: "not_started" },
      { name: "Customer Lifetime Value (CLV)", description: "Calculated CLV metric per customer", status: "not_started" },
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
      { name: "Checkout — Address Form", description: "Multi-address checkout support (address.template.html)", status: "partial" },
      { name: "Checkout — Cart Items Summary", description: "Order summary sidebar in checkout (cart_items.template.html)", status: "done" },
      { name: "Checkout — Voucher/Coupon Redemption", description: "Coupon code entry (redeem_vouchers.template.html)", status: "done", notes: "Coupon apply/remove at checkout" },
      { name: "Checkout — Gift Voucher Message", description: "Gift voucher message entry (voucher_msg.template.html)", status: "not_started" },
      { name: "Checkout — Upsell Page", description: "Pre-checkout upsells (upsell.template.html)", status: "not_started" },
      { name: "Checkout — Error Handling", description: "Cart error display (cart.error.html)", status: "not_started" },
      { name: "Invoice / Thank You Page", description: "Post-checkout success page (invoice.template.html)", status: "done", notes: "Enhanced thank you page with order number, total, and View Orders link" },
      { name: "Quote Invoice Page", description: "Post-quote success page (quote_invoice.template.html)", status: "not_started" },
      { name: "Empty Cart Page", description: "Display when cart is empty (empty.template.html)", status: "done", notes: "Empty state with icon and continue shopping link" },
      { name: "404 Page", description: "Custom 404 not found page (404.template.html)", status: "done" },
      { name: "Content Pages (CMS)", description: "Generic content pages (default.template.html)", status: "done", notes: "Storefront CMS page route with slug-based rendering" },
      { name: "Blog Pages", description: "Blog listing and blog post pages", status: "done", notes: "Storefront /blog route listing blog-type content pages with featured images and dates" },
      { name: "Store Finder / Stockist Page", description: "Store locator with map (store_finder.template.html)", status: "not_started" },
      { name: "Modal / Popup Template", description: "Modal wrapper template (modal.template.html)", status: "not_started" },
      { name: "Add-to-Cart Popup (nPopup)", description: "Ajax add-to-cart confirmation popup (npopup.template.html)", status: "not_started" },
      { name: "Sidebar Template", description: "Reusable sidebar includes (sidebar.template.html)", status: "not_started" },
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
      { name: "View Quote Detail", description: "View quote details (quote.template.html)", status: "not_started" },
      { name: "Print Order / Invoice", description: "Print-friendly order view (customer/print/)", status: "not_started" },
      { name: "Track Order", description: "Order tracking page (track_order/)", status: "done", notes: "Public /track-order page with order number search and shipment details" },
      { name: "Pay Outstanding Order", description: "Pay unpaid orders from account (pay_order/)", status: "not_started" },
      { name: "Edit Account Details", description: "Edit billing/contact info (edit_account/)", status: "done", notes: "Inline edit name/phone on account profile card" },
      { name: "Edit Shipping Addresses", description: "Manage multiple addresses (edit_address/)", status: "done", notes: "CRUD on storefront account" },
      { name: "Change Password", description: "Password change form (edit_pwd/)", status: "done" },
      { name: "Forgot Password", description: "Password reset flow (forgotpwd/)", status: "done" },
      { name: "Forgot Username", description: "Username recovery flow (forgotusr/)", status: "not_started" },
      { name: "Reset Password (Post-Purchase)", description: "Set password after auto-registration (resetpwd/)", status: "done" },
      { name: "Wishlist (Favourites)", description: "Save/view/reorder wishlist items (favourites/ & wishlist/)", status: "done" },
      { name: "View Customer Vouchers", description: "View gift vouchers on account (vouchers/)", status: "not_started" },
      { name: "View Customer Files", description: "View/download uploaded documents (files/)", status: "not_started" },
      { name: "Approve/Reject Quotes", description: "Customer approves or deletes quotes (approve_quote/)", status: "not_started" },
      { name: "My Store / Stockist Management", description: "Customers manage their stockist listing (mystore/)", status: "not_started" },
      { name: "Write Product Review", description: "Submit product review from account (write_review/)", status: "not_started" },
      { name: "Write Content Review", description: "Submit content/page review (write_contentreview/)", status: "not_started" },
      { name: "Submit Warranty Dispute", description: "Open/view warranty disputes (warranty/)", status: "not_started" },
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
      { name: "Child Products Display", description: "Non-variant child product listing (child_products.template.html)", status: "not_started" },
      { name: "Editable Kit Components UI", description: "Kit component configuration (components.template.html)", status: "not_started" },
      { name: "Product Thumbnails (Grid/List/Box)", description: "Product card layouts (thumbs/product/)", status: "done" },
      { name: "Content Thumbnails", description: "Content page card layout (thumbs/content/)", status: "not_started" },
      { name: "Advert Thumbnails (Banner/Carousel/Scroll/Text)", description: "Promotional ad placements (thumbs/advert/)", status: "not_started" },
      { name: "Product Reviews Display", description: "Star ratings and review text on product page", status: "done" },
      { name: "Product Compare", description: "Side-by-side product comparison", status: "done" },
      { name: "Notify Me (Back in Stock)", description: "Email notification when out-of-stock item returns", status: "not_started", notes: "Neto has notify_me system email" },
      { name: "Recently Viewed Products", description: "Track and display recently viewed items", status: "done", notes: "localStorage-based tracking on product detail page" },
      { name: "Product Quick View", description: "Quick view popup without navigating away", status: "done", notes: "Eye icon on product card hover opens modal with image, price, add-to-cart, wishlist, and view details" },
      { name: "Shipping Calculator on Product Page", description: "Estimate shipping cost on product page", status: "not_started" },
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
      { name: "Smart / Automated Categories", description: "Auto-populate categories based on product rules", status: "not_started" },
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
      { name: "Auto-Apply Coupons", description: "Automatically apply coupon based on cart rules", status: "not_started" },
      { name: "Gift Vouchers (GetVoucher / AddVoucher / UpdateVoucher)", description: "Create, sell, and redeem gift vouchers/certificates", status: "done", notes: "Full gift voucher CRUD admin" },
      { name: "Gift Voucher Purchase (Storefront)", description: "Customers purchase gift vouchers with custom value/message", status: "not_started" },
      { name: "Gift Voucher Email Delivery", description: "Send gift voucher to recipient by email on scheduled date", status: "not_started", notes: "Neto has gift_voucher system email" },
      { name: "Gift Voucher Balance Tracking", description: "Track remaining balance on vouchers", status: "done" },
      { name: "Gift Voucher Redemption at Checkout", description: "Apply voucher balance as payment", status: "not_started" },
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
      { name: "Shipping Methods (GetShippingMethods / AddShippingQuote)", description: "Dynamic shipping method management via API", status: "not_started" },
      { name: "Weight-Based Shipping Rates", description: "Calculate shipping based on order weight", status: "not_started" },
      { name: "Volumetric/Cubic Shipping Rates", description: "Calculate using dimensional weight", status: "not_started" },
      { name: "Real-Time Carrier Rates (Australia Post)", description: "Live rates from Australia Post API", status: "not_started" },
      { name: "Real-Time Carrier Rates (Sendle)", description: "Live rates from Sendle courier API", status: "not_started" },
      { name: "Real-Time Carrier Rates (StarTrack)", description: "Live rates from StarTrack", status: "not_started" },
      { name: "Real-Time Carrier Rates (Fastway/Aramex)", description: "Live courier rates from Aramex/Fastway", status: "not_started" },
      { name: "Real-Time Carrier Rates (UPS/FedEx/DHL)", description: "International carrier rate integration", status: "not_started" },
      { name: "Shipping Label Printing", description: "Print carrier-specific shipping labels", status: "not_started" },
      { name: "Shipping Tracking Emails", description: "Automated tracking notification emails to customers", status: "not_started" },
      { name: "Click & Collect / Pickup in Store", description: "In-store pickup option at checkout", status: "not_started" },
      { name: "Dropship Routing", description: "Auto-route orders to dropship suppliers", status: "not_started", notes: "Neto has dropship system with emails" },
      { name: "Dropship Notifications", description: "Automated dropship supplier email notifications", status: "not_started" },
      { name: "Delivery Date Estimation", description: "Estimated delivery date on checkout", status: "not_started" },
      { name: "Shipping Rules / Restrictions", description: "Restrict shipping methods by product, location, weight", status: "not_started" },
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
      { name: "Tax-Exclusive Pricing", description: "Display prices exclusive of tax, add at checkout", status: "partial" },
      { name: "GST / VAT Handling", description: "Australian GST or European VAT calculation", status: "not_started" },
      { name: "Tax-Exempt Customers", description: "Mark B2B customers as tax exempt", status: "not_started" },
      { name: "Tax Reporting / BAS Report", description: "Tax summary reports for accounting", status: "not_started" },
      { name: "Auto Tax Calculation by Address", description: "Calculate tax based on shipping destination", status: "not_started" },
      { name: "Multi-Tax (State + County)", description: "Compound tax rates for US states", status: "not_started" },
    ],
  },

  // ═══════ 18. SUPPLIERS ═══════
  {
    category: "Suppliers",
    icon: <Building className="h-5 w-5" />,
    features: [
      { name: "Supplier CRUD (GetSupplier / AddSupplier / UpdateSupplier)", description: "Manage supplier records via API", status: "done" },
      { name: "Supplier Contact Details", description: "Store supplier name, email, phone, address", status: "done" },
      { name: "Supplier Product Assignments", description: "Assign products/SKUs to specific suppliers", status: "not_started" },
      { name: "Supplier Pricing / Cost", description: "Supplier-specific cost price per product", status: "partial", notes: "cost_price field exists but not supplier-linked" },
      { name: "Purchase Orders to Suppliers", description: "Generate and send POs to suppliers", status: "done", notes: "PO CRUD with supplier linking" },
      { name: "Supplier Lead Times", description: "Expected delivery timeframes per supplier", status: "done" },
      { name: "Supplier Performance Tracking", description: "Track on-time delivery and quality metrics", status: "not_started" },
      { name: "Dropship Supplier Management", description: "Configure suppliers as dropship sources", status: "done" },
    ],
  },

  // ═══════ 19. CURRENCY ═══════
  {
    category: "Currency & Localization",
    icon: <DollarSign className="h-5 w-5" />,
    features: [
      { name: "Store Default Currency", description: "Configure store base currency", status: "done" },
      { name: "Currency Display Format", description: "Format currency symbol and decimals", status: "partial" },
      { name: "Multi-Currency Support (GetCurrency / AddCurrency)", description: "Add/manage multiple currencies via API", status: "not_started", notes: "Neto has full Currency API" },
      { name: "Exchange Rate Management", description: "Set or auto-update exchange rates", status: "not_started" },
      { name: "Currency Switcher (Storefront)", description: "Customer can switch display currency on storefront", status: "not_started" },
      { name: "Currency-Specific Pricing", description: "Set prices in each supported currency", status: "not_started" },
      { name: "Multi-Language Support", description: "Translate storefront content into multiple languages", status: "not_started" },
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
      { name: "Contact Page with Form", description: "Contact form page with email notification", status: "partial", notes: "CMS page exists, contact form email not implemented" },
      { name: "FAQ Page", description: "Frequently asked questions page", status: "done", notes: "Via CMS page type: faq" },
      { name: "Blog / News Articles", description: "Blog listing and post pages", status: "done", notes: "Via CMS page type: blog" },
      { name: "Banner / Announcement Management", description: "Create and schedule banner ads on storefront", status: "partial", notes: "Banner text field exists" },
      { name: "Static Blocks / Widgets", description: "Reusable content blocks embeddable on any page", status: "not_started" },
      { name: "WYSIWYG Content Editor", description: "Rich text editor for content pages", status: "not_started" },
      { name: "Content Reviews", description: "Reviews on content pages (not just products)", status: "not_started" },
      { name: "Media Library / Asset Management", description: "Central repository for images, files, and media", status: "not_started" },
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
      { name: "Review Response (Admin Reply)", description: "Admin can reply to customer reviews", status: "not_started" },
      { name: "Review Photos", description: "Customers upload photos with reviews", status: "not_started" },
      { name: "Verified Purchase Badge", description: "Mark reviews from verified buyers", status: "not_started" },
      { name: "Review Aggregation / Average Rating", description: "Calculate and display average rating per product", status: "partial" },
      { name: "Review Reminders (Post-Purchase)", description: "Automated email asking for review after delivery", status: "not_started", notes: "Neto has order_follow_up email" },
      { name: "Review Import/Export", description: "Bulk import reviews from CSV/other platforms", status: "not_started" },
    ],
  },

  // ═══════ 22. MARKETING & CAMPAIGNS ═══════
  {
    category: "Marketing & Campaigns",
    icon: <Megaphone className="h-5 w-5" />,
    features: [
      { name: "Marketing Campaign CRUD", description: "Create and manage marketing campaigns", status: "done" },
      { name: "Email Campaigns", description: "Email campaign type with subject/content", status: "done" },
      { name: "SMS Campaigns", description: "SMS campaign type", status: "partial", notes: "Campaign type exists, no SMS gateway" },
      { name: "Audience Segmentation", description: "Target campaigns by customer segment/tags", status: "done" },
      { name: "Campaign Scheduling", description: "Schedule campaigns for future send", status: "done" },
      { name: "Campaign Statistics (Open/Click/Revenue)", description: "Track campaign performance metrics", status: "partial" },
      { name: "Abandoned Cart Recovery", description: "Automated emails for abandoned carts", status: "partial", notes: "Abandoned cart admin page with recovery status tracking, email sent marking" },
      { name: "Abandoned Cart Email Template", description: "Customizable abandoned cart email", status: "not_started", notes: "Neto has abandoned_cart_email template" },
      { name: "Wishlist Reminder Emails", description: "Remind customers about wishlist items", status: "not_started", notes: "Neto has wishlist system email" },
      { name: "Order Follow-Up Email", description: "Automated post-purchase follow-up email", status: "not_started", notes: "Neto has order_follow_up email" },
      { name: "Newsletter Subscription", description: "Newsletter signup form and mailing list", status: "done", notes: "Email signup in storefront footer with newsletter_subscribers table" },
      { name: "Popup / Slide-In Promotions", description: "On-site promotional popups", status: "not_started" },
      { name: "Referral / Loyalty Program", description: "Points-based loyalty or referral rewards", status: "not_started" },
      { name: "Google Ads Integration", description: "Conversion tracking and remarketing for Google Ads", status: "not_started" },
      { name: "Facebook Pixel Integration", description: "Meta/Facebook pixel for conversion tracking", status: "not_started" },
      { name: "Affiliate Program", description: "Affiliate tracking with commission management", status: "not_started" },
    ],
  },

  // ═══════ 23. SYSTEM EMAILS & NOTIFICATIONS ═══════
  {
    category: "System Emails & Notifications",
    icon: <Mail className="h-5 w-5" />,
    features: [
      { name: "Order Confirmation Email", description: "Automated email on order placement", status: "not_started" },
      { name: "Order Shipped / Tracking Email", description: "Email with tracking info when order ships", status: "not_started" },
      { name: "Order Delivered Email", description: "Email when order is marked delivered", status: "not_started" },
      { name: "Order Follow-Up Email", description: "Post-delivery follow-up / review request", status: "not_started" },
      { name: "Payment Confirmation Email", description: "Receipt email on successful payment", status: "not_started" },
      { name: "Customer Registration Email", description: "Welcome email on customer signup", status: "not_started", notes: "Neto has customer_registration_emails" },
      { name: "Customer Auto-Registration Email", description: "Auto-created account credentials email", status: "not_started" },
      { name: "Password Reset Email", description: "Password reset link email", status: "partial" },
      { name: "Abandoned Cart Email", description: "Reminder email for abandoned carts", status: "not_started" },
      { name: "Wishlist Reminder Email", description: "Periodic wishlist item reminder", status: "not_started" },
      { name: "Gift Voucher Email", description: "Gift voucher delivery to recipient", status: "not_started" },
      { name: "Back in Stock / Notify Me Email", description: "Notification when product is restocked", status: "not_started" },
      { name: "Customer Statement Email", description: "Account statement with transaction history", status: "not_started" },
      { name: "Dispute/Warranty Emails", description: "Emails for dispute raised, updated, resolved", status: "not_started" },
      { name: "Dropship Notification Email", description: "Emails to dropship suppliers for new orders", status: "not_started" },
      { name: "Import Notification Email", description: "Email with login details on customer import", status: "not_started" },
      { name: "Contact Form Email", description: "Email sent to admin when contact form submitted", status: "not_started" },
      { name: "eBay Notification Emails", description: "eBay listing/sale event notifications", status: "not_started" },
      { name: "Batch Job Error Email", description: "Notification when automated batch jobs fail", status: "not_started" },
      { name: "Low Stock Alert Email", description: "Alert admin when stock falls below threshold", status: "not_started" },
      { name: "New Order Admin Notification", description: "Admin email on new order received", status: "not_started" },
    ],
  },

  // ═══════ 24. PRINTABLE DOCUMENTS ═══════
  {
    category: "Printable Documents",
    icon: <Printer className="h-5 w-5" />,
    features: [
      { name: "Invoice PDF", description: "Printable tax invoice document", status: "not_started" },
      { name: "Packing Slip PDF", description: "Printable packing slip for warehouse", status: "not_started" },
      { name: "Pick List PDF", description: "Warehouse pick list document", status: "not_started" },
      { name: "Shipping Label", description: "Printable shipping labels", status: "not_started" },
      { name: "Quote Document PDF", description: "Printable quote/estimate document", status: "not_started" },
      { name: "Credit Note PDF", description: "Printable credit note document", status: "not_started" },
      { name: "Purchase Order PDF", description: "Printable PO for suppliers", status: "not_started" },
      { name: "Customer Statement PDF", description: "Printable account statement", status: "not_started" },
      { name: "Gift Voucher Print", description: "Printable gift voucher/card", status: "not_started" },
      { name: "Barcode Labels", description: "Print barcode/SKU labels for products", status: "not_started" },
    ],
  },

  // ═══════ 25. ACCOUNTING INTEGRATION ═══════
  {
    category: "Accounting Integration",
    icon: <Receipt className="h-5 w-5" />,
    features: [
      { name: "Accounting System CRUD (GetAccountingSystem)", description: "Manage accounting system connections via API", status: "not_started" },
      { name: "Xero Integration", description: "Sync invoices, payments, and contacts to Xero", status: "not_started" },
      { name: "MYOB Integration", description: "Sync orders and payments to MYOB", status: "not_started" },
      { name: "QuickBooks Integration", description: "Sync to QuickBooks Online", status: "not_started" },
      { name: "Reckon Integration", description: "Sync to Reckon Accounts", status: "not_started" },
      { name: "Chart of Accounts Mapping", description: "Map sales categories to accounting chart of accounts", status: "not_started" },
      { name: "Auto-Post Invoices", description: "Automatically post invoices to accounting software", status: "not_started" },
      { name: "Payment Reconciliation", description: "Match payments between ecommerce and accounting", status: "not_started" },
    ],
  },

  // ═══════ 26. MARKETPLACE INTEGRATIONS ═══════
  {
    category: "Marketplace Integrations",
    icon: <Share2 className="h-5 w-5" />,
    features: [
      { name: "eBay Listing Sync", description: "Publish products to eBay and sync orders/stock", status: "not_started", notes: "Neto has full eBay integration with templates" },
      { name: "eBay Order Import", description: "Import eBay orders into platform", status: "not_started" },
      { name: "eBay Stock Sync", description: "Real-time stock sync between platform and eBay", status: "not_started" },
      { name: "eBay Category Mapping", description: "Map product categories to eBay categories", status: "not_started" },
      { name: "Amazon Integration", description: "List products on Amazon marketplace", status: "not_started" },
      { name: "Amazon Order Import", description: "Import Amazon orders", status: "not_started" },
      { name: "Google Shopping Feed", description: "Product data feed for Google Merchant Center", status: "not_started" },
      { name: "Facebook / Instagram Shop", description: "Sync catalog to Facebook/Instagram Shop", status: "not_started" },
      { name: "Catch.com.au Integration", description: "Australian marketplace integration", status: "not_started" },
      { name: "Kogan Integration", description: "Kogan marketplace listing and sync", status: "not_started" },
      { name: "TradeMe Integration", description: "NZ marketplace integration", status: "not_started" },
      { name: "MyDeal Integration", description: "MyDeal marketplace listing", status: "not_started" },
    ],
  },

  // ═══════ 27. WAREHOUSE / PICK-PACK-SHIP ═══════
  {
    category: "Warehouse / Pick-Pack-Ship",
    icon: <Warehouse className="h-5 w-5" />,
    features: [
      { name: "Warehouse API (GetWarehouse / AddWarehouse / UpdateWarehouse)", description: "Full warehouse management via API", status: "partial", notes: "Location CRUD exists, not full warehouse API" },
      { name: "Pick & Pack Workflow", description: "Guided pick → pack → ship workflow in admin", status: "not_started" },
      { name: "Barcode Scanning (Pick)", description: "Scan product barcodes during pick process", status: "not_started" },
      { name: "Barcode Scanning (Receive)", description: "Scan barcodes when receiving stock", status: "not_started" },
      { name: "Batch Printing (Labels + Slips)", description: "Print multiple shipping labels and packing slips", status: "not_started" },
      { name: "Warehouse Dashboard", description: "Overview of pending picks, packs, and dispatches", status: "not_started" },
      { name: "Multi-Warehouse Order Routing", description: "Route order items to nearest/best warehouse", status: "not_started" },
      { name: "Stock Count / Stocktake Mode", description: "In-warehouse stock counting with barcode scanning", status: "not_started" },
      { name: "Goods Receipt / Inbound", description: "Receive inventory shipments against POs", status: "not_started" },
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
      { name: "Abandoned Cart Recovery Email", description: "Automated recovery email with cart contents", status: "not_started" },
      { name: "Abandoned Cart Recovery Status", description: "Track whether cart was recovered or lost", status: "done" },
      { name: "Abandoned Cart Recovery Stats", description: "Dashboard metrics: recovery rate, revenue recovered", status: "done", notes: "KPI cards: total carts, potential revenue, pending, recovery rate" },
      { name: "Multi-Step Recovery Sequences", description: "Send multiple follow-up emails over time", status: "not_started" },
      { name: "Abandoned Cart with Coupon Incentive", description: "Include discount coupon in recovery email", status: "not_started" },
    ],
  },

  // ═══════ 29. WEBHOOKS / NOTIFICATION EVENTS ═══════
  {
    category: "Webhooks / Notification Events",
    icon: <Bell className="h-5 w-5" />,
    features: [
      { name: "Webhook Registration", description: "Register webhooks for events via API", status: "not_started", notes: "Neto has Notification Events API" },
      { name: "Order Created Webhook", description: "Trigger on new order placed", status: "not_started" },
      { name: "Order Updated Webhook", description: "Trigger on order status change", status: "not_started" },
      { name: "Product Updated Webhook", description: "Trigger on product creation/update", status: "not_started" },
      { name: "Customer Created Webhook", description: "Trigger on new customer registration", status: "not_started" },
      { name: "Payment Received Webhook", description: "Trigger on payment event", status: "not_started" },
      { name: "Stock Level Changed Webhook", description: "Trigger when stock levels change", status: "not_started" },
      { name: "Shipment Dispatched Webhook", description: "Trigger when shipment is dispatched", status: "not_started" },
      { name: "RMA Created Webhook", description: "Trigger on return/RMA creation", status: "not_started" },
    ],
  },

  // ═══════ 30. B2B / WHOLESALE ═══════
  {
    category: "B2B / Wholesale",
    icon: <Building className="h-5 w-5" />,
    features: [
      { name: "Customer Groups (Wholesale/Retail/VIP)", description: "Assign customers to price-tier groups", status: "not_started" },
      { name: "Group-Based Pricing", description: "Show different prices per customer group", status: "done", notes: "Pricing tiers with user_group exist" },
      { name: "Wholesale Registration Form", description: "Separate wholesale signup with admin approval", status: "not_started" },
      { name: "Wholesale Approval Workflow", description: "Admin reviews and approves wholesale applicants", status: "not_started" },
      { name: "Credit Terms (Net 7/14/30/60/90)", description: "Allow B2B customers to order on credit", status: "not_started" },
      { name: "Credit Limit per Customer", description: "Set maximum credit balance per customer", status: "not_started" },
      { name: "Order Minimum for Wholesale", description: "Minimum order value/quantity for wholesale customers", status: "not_started" },
      { name: "Tax-Exempt B2B Customers", description: "Exclude tax for registered wholesale customers", status: "not_started" },
      { name: "ABN/Tax ID Validation", description: "Validate Australian Business Number or Tax ID", status: "not_started" },
      { name: "Quote / RFQ Workflow", description: "Request for quote → Admin pricing → Customer approval → Order", status: "not_started" },
      { name: "Bulk/Quick Order Form", description: "Enter multiple SKUs and quantities on single form", status: "not_started" },
      { name: "Restricted Product Visibility", description: "Show/hide products or categories by customer group", status: "not_started" },
      { name: "Account Payment (Pay on Account)", description: "Allow B2B customers to pay on their account balance", status: "not_started" },
    ],
  },

  // ═══════ 31. POS (POINT OF SALE) ═══════
  {
    category: "POS (Point of Sale)",
    icon: <Monitor className="h-5 w-5" />,
    features: [
      { name: "POS Interface", description: "In-store point of sale touchscreen interface", status: "not_started" },
      { name: "POS Product Search / Barcode Scan", description: "Search products or scan barcodes in POS", status: "not_started" },
      { name: "POS Payment Processing", description: "Accept card, cash, split payments in POS", status: "not_started" },
      { name: "POS Gift Voucher Redemption", description: "Redeem gift vouchers at POS", status: "not_started" },
      { name: "POS Receipts", description: "Print or email POS receipts", status: "not_started" },
      { name: "POS Cash Drawer Integration", description: "Open cash drawer from POS", status: "not_started" },
      { name: "POS Offline Mode", description: "Operate POS without internet connection", status: "not_started" },
      { name: "POS Multi-Register", description: "Multiple POS registers per store location", status: "not_started" },
      { name: "POS End-of-Day Reconciliation", description: "Cash up and reconcile POS at end of day", status: "not_started" },
      { name: "POS Customer Lookup", description: "Search and attach customer to POS sale", status: "not_started" },
      { name: "POS Layby/Deposit", description: "Take deposits and manage layby from POS", status: "not_started" },
    ],
  },

  // ═══════ 32. ANALYTICS & REPORTING ═══════
  {
    category: "Analytics & Reporting",
    icon: <BarChart3 className="h-5 w-5" />,
    features: [
      { name: "Dashboard Overview (KPIs)", description: "Summary cards for revenue, orders, customers", status: "done" },
      { name: "Revenue Over Time Chart", description: "Line/bar chart of revenue by day/week/month", status: "partial" },
      { name: "Orders Over Time Chart", description: "Order count trend chart", status: "partial" },
      { name: "Top Selling Products Report", description: "Products ranked by units sold / revenue", status: "not_started" },
      { name: "Top Customers Report", description: "Customers ranked by total spent", status: "not_started" },
      { name: "Sales by Category Report", description: "Revenue breakdown by product category", status: "not_started" },
      { name: "Sales by Channel Report", description: "Revenue by channel (web, eBay, POS, etc.)", status: "not_started" },
      { name: "Customer Acquisition Report", description: "New vs returning customer metrics", status: "not_started" },
      { name: "Conversion Rate / Funnel Analytics", description: "Visitor → Cart → Checkout → Purchase funnel", status: "not_started" },
      { name: "Average Order Value (AOV) Trend", description: "Track AOV over time", status: "not_started" },
      { name: "Profit Margin Report", description: "Revenue minus cost analysis", status: "not_started" },
      { name: "Inventory Value Report", description: "Total stock value across all locations", status: "not_started" },
      { name: "Slow-Moving Stock Report", description: "Products with low sales velocity", status: "not_started" },
      { name: "Stock Turnover Report", description: "Inventory turnover rate analysis", status: "not_started" },
      { name: "Abandoned Cart Report", description: "Abandoned cart stats and recovery metrics", status: "not_started" },
      { name: "Tax Report / BAS Summary", description: "Tax collected summary for accounting", status: "not_started" },
      { name: "Coupon Usage Report", description: "Coupon redemption and revenue impact", status: "not_started" },
      { name: "Google Analytics Integration", description: "GA4 tracking code integration", status: "not_started" },
      { name: "Custom Report Builder", description: "Build custom reports with filters and date ranges", status: "not_started" },
      { name: "Scheduled Report Emails", description: "Auto-send reports by email on schedule", status: "not_started" },
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
      { name: "Customer Import (CSV)", description: "Bulk import customers from CSV", status: "not_started" },
      { name: "Customer Export (CSV)", description: "Bulk export customers to CSV", status: "done", notes: "Export button on customers page with filtered CSV download" },
      { name: "Order Export (CSV/XML)", description: "Export orders for accounting/analytics", status: "partial" },
      { name: "Category Import / Export", description: "Bulk manage categories via CSV", status: "not_started" },
      { name: "Image Bulk Upload (ZIP)", description: "Upload multiple product images via ZIP file", status: "not_started" },
      { name: "Scheduled Auto-Exports", description: "Automated exports on schedule (e.g., nightly order export)", status: "not_started" },
      { name: "Data Transformations on Import", description: "Transform data during import (case, math, concatenate)", status: "partial" },
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
      { name: "Template Includes", description: "Include sub-templates within templates", status: "partial" },
      { name: "Thumblist Tags", description: "Product/content listing thumbnails", status: "not_started" },
      { name: "Advert Tags", description: "Promotional advertisement placement tags", status: "not_started" },
      { name: "AJAX Partial Rendering", description: "Reload template includes without full page refresh", status: "not_started" },
      { name: "Custom CSS per Template", description: "Template-specific CSS injection", status: "not_started" },
      { name: "Theme System (Multiple Themes)", description: "Install and switch between different themes", status: "not_started" },
      { name: "Theme Info File (netothemeinfo.txt)", description: "Theme metadata: name, version, description", status: "not_started" },
    ],
  },

  // ═══════ 35. STOREFRONT — DESIGN & THEMES ═══════
  {
    category: "Storefront — Design & Themes",
    icon: <Palette className="h-5 w-5" />,
    features: [
      { name: "Store Theme Configuration", description: "Primary/secondary/accent colors, fonts, button radius", status: "done" },
      { name: "Header Template", description: "Customizable header (headers/template.html)", status: "partial" },
      { name: "Footer Template", description: "Customizable footer (footers/template.html)", status: "partial" },
      { name: "Custom CSS", description: "Custom CSS injection field per store", status: "done" },
      { name: "Hero Style Selection", description: "Hero section layout choice", status: "done" },
      { name: "Product Card Style Selection", description: "Product card layout variant", status: "done" },
      { name: "Layout Style (Wide/Boxed)", description: "Overall layout width setting", status: "done" },
      { name: "Heading Font / Body Font", description: "Font family selection", status: "done" },
      { name: "Responsive / Mobile Design", description: "Mobile-responsive storefront", status: "done" },
      { name: "Favicon Upload", description: "Custom favicon per store", status: "not_started" },
      { name: "Logo Upload", description: "Store logo upload and display", status: "done" },
      { name: "Mega Menu Navigation", description: "Category-based mega dropdown menu", status: "not_started" },
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
      { name: "Role-Based Permissions", description: "Granular permissions per role (view/edit/delete)", status: "partial" },
      { name: "Multi-Store Staff Access", description: "Staff can access multiple stores", status: "partial" },
      { name: "Activity Log / Audit Trail", description: "Track who did what and when", status: "done" },
      { name: "Two-Factor Authentication (2FA)", description: "TOTP/SMS 2FA for admin accounts", status: "not_started" },
      { name: "API Key Management", description: "Generate and manage API keys per store", status: "not_started" },
      { name: "Session Management", description: "View and revoke active sessions", status: "not_started" },
      { name: "Staff Activity Dashboard", description: "See staff login times, actions taken", status: "not_started" },
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
      { name: "Custom Domain per Store", description: "Map custom domains (www.mybrand.com)", status: "not_started" },
      { name: "Store Settings (Name, Description, Contact)", description: "Basic store configuration", status: "done" },
      { name: "Store Logo / Branding", description: "Per-store logo and primary color", status: "done" },
      { name: "Store Banner Text", description: "Announcement banner per store", status: "done" },
      { name: "Platform Merchant Directory", description: "Admin view of all merchants on platform", status: "done" },
      { name: "Platform-Level Analytics", description: "Cross-store metrics for platform admin", status: "not_started" },
      { name: "Store Suspension / Deactivation", description: "Admin can suspend a merchant store", status: "not_started" },
      { name: "Store Plan / Subscription Management", description: "SaaS plan tiers and billing", status: "not_started" },
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
      { name: "Payment Gateway Configuration", description: "Configure and enable payment providers", status: "not_started" },
      { name: "Email / SMTP Configuration", description: "Configure outgoing email settings", status: "not_started" },
      { name: "Notification Preferences", description: "Configure which notifications to receive", status: "not_started" },
      { name: "Checkout Settings", description: "Guest checkout, minimum order, checkout fields", status: "not_started" },
      { name: "Inventory Settings", description: "Default low stock threshold, backorder rules", status: "partial" },
      { name: "SEO Settings (Global)", description: "Site-wide meta tags, sitemap settings", status: "not_started" },
      { name: "Social Media Links", description: "Store social media profile links", status: "done", notes: "social_links JSONB field on stores table, displayed in storefront footer" },
      { name: "Cookie/Privacy Consent Banner", description: "GDPR/Privacy cookie consent management", status: "done", notes: "Cookie consent banner with Accept/Decline, localStorage persistence" },
      { name: "Terms & Conditions / Privacy Policy", description: "Store-level legal pages", status: "not_started" },
    ],
  },

  // ═══════ 39. API & DEVELOPER ═══════
  {
    category: "API & Developer Tools",
    icon: <Code className="h-5 w-5" />,
    features: [
      { name: "RESTful API (Products, Orders, Customers)", description: "CRUD API for core entities", status: "partial", notes: "Internal Supabase SDK, not public REST API" },
      { name: "API Authentication (API Keys)", description: "Authenticate API requests with store keys", status: "not_started" },
      { name: "API Rate Limiting", description: "Throttle API requests per key", status: "not_started" },
      { name: "Webhook API", description: "Register and manage webhooks", status: "not_started" },
      { name: "Add-On / Plugin System", description: "Install third-party add-ons to extend functionality", status: "not_started", notes: "Neto has full add-on framework" },
      { name: "Add-On Types (Custom Panel / Shipping / Payment)", description: "Different add-on types for different integration points", status: "not_started" },
      { name: "Developer Sandbox / Test Mode", description: "Test environment for development", status: "not_started" },
      { name: "API Documentation (Auto-Generated)", description: "Public API docs for developers", status: "not_started" },
      { name: "Batch API Requests", description: "Execute multiple API calls in single request", status: "not_started" },
    ],
  },

  // ═══════ 40. THIRD-PARTY INTEGRATIONS ═══════
  {
    category: "Third-Party Integrations",
    icon: <Link className="h-5 w-5" />,
    features: [
      { name: "Xero Accounting", description: "Auto-sync invoices and payments to Xero", status: "not_started" },
      { name: "MYOB Accounting", description: "Sync to MYOB AccountRight", status: "not_started" },
      { name: "QuickBooks Online", description: "Sync to QuickBooks", status: "not_started" },
      { name: "Unleashed Inventory", description: "Advanced inventory management via Unleashed", status: "not_started", notes: "Maropost has Unleashed integration" },
      { name: "ShipStation", description: "Shipping label and order management", status: "not_started" },
      { name: "Starshipit", description: "AU/NZ shipping automation", status: "not_started" },
      { name: "Mailchimp", description: "Email marketing list sync", status: "not_started" },
      { name: "Klaviyo", description: "Advanced email marketing sync", status: "not_started" },
      { name: "Google Analytics 4", description: "GA4 tracking and ecommerce events", status: "not_started" },
      { name: "Google Tag Manager", description: "GTM container integration", status: "not_started" },
      { name: "Facebook / Meta Pixel", description: "Conversion tracking and audiences", status: "not_started" },
      { name: "Zapier Integration", description: "Connect to 5000+ apps via Zapier", status: "not_started" },
      { name: "Make (Integromat)", description: "Workflow automation via Make", status: "not_started" },
      { name: "Maropost Marketing Cloud", description: "Native integration with Maropost Marketing", status: "not_started" },
      { name: "Maropost Service Cloud", description: "Customer service/helpdesk integration", status: "not_started" },
      { name: "Retail Express POS", description: "Maropost's own POS system integration", status: "not_started" },
      { name: "LiveChat / Zendesk / Tidio", description: "Customer support chat widget", status: "not_started" },
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Maropost Feature Audit</h1>
          <p className="text-muted-foreground">Comprehensive parity tracker — {stats.total} features across {featureData.length} modules</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-sm text-muted-foreground">Total Features</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-sm text-muted-foreground">Done</p>
              <p className="text-2xl font-bold text-primary">{stats.done}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-sm text-muted-foreground">Partial</p>
              <p className="text-2xl font-bold text-accent-foreground">{stats.partial}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-sm text-muted-foreground">Not Started</p>
              <p className="text-2xl font-bold text-muted-foreground">{stats.not_started}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-sm text-muted-foreground">Progress</p>
              <p className="text-2xl font-bold">{stats.pct}%</p>
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
                            <TableHead className="w-8"></TableHead>
                            <TableHead>Feature</TableHead>
                            <TableHead className="hidden md:table-cell">Description</TableHead>
                            <TableHead className="w-28">Status</TableHead>
                            <TableHead className="hidden lg:table-cell">Notes</TableHead>
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
