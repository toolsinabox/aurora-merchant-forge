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
  CheckCircle, Circle, Clock, Search, BarChart3, Package, ShoppingCart,
  Users, Truck, Settings, Globe, Megaphone, CreditCard, FileText,
  Layers, Shield, Zap, Database, Store, Palette, Mail, Boxes,
  Receipt, BookOpen, Headphones, Smartphone, Repeat, Tag, Gift,
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

const featureData: FeatureCategory[] = [
  {
    category: "Product Management — Core",
    icon: <Package className="h-5 w-5" />,
    features: [
      { name: "Product CRUD", description: "Create, read, update, delete products", status: "done" },
      { name: "Product Variants (Variations)", description: "Parent/child SKU with size, color, option-based variants", status: "done" },
      { name: "Product Images", description: "Multiple image upload, reorder, gallery with zoom", status: "done" },
      { name: "Product Categories (3-level tree)", description: "Hierarchical categories with parent/child, unlimited depth", status: "done" },
      { name: "Product Tags", description: "Tagging system for filtering and organization", status: "done" },
      { name: "Product SKU / Barcode", description: "SKU and barcode fields per product/variant", status: "done" },
      { name: "Product Status (Active/Draft/Archived)", description: "Manage product lifecycle status", status: "done" },
      { name: "Product Approval Workflow", description: "Approval flag for marketplace/multi-vendor products", status: "done" },
      { name: "Product Brand", description: "Brand field per product", status: "done" },
      { name: "Product Type / Subtype", description: "Product type and subtype classification", status: "done" },
      { name: "Track Inventory Toggle", description: "Per-product toggle for inventory tracking", status: "done" },
      { name: "Is Sold / Is Bought Flags", description: "Control whether product is sold, bought, or both", status: "done" },
      { name: "Is Inventoried Flag", description: "Flag for inventory-tracked vs non-inventoried items", status: "done" },
    ],
  },
  {
    category: "Product Management — Descriptions & Content",
    icon: <BookOpen className="h-5 w-5" />,
    features: [
      { name: "Product Title", description: "Main product name/title", status: "done" },
      { name: "Product Subtitle", description: "Secondary title/tagline", status: "done" },
      { name: "Short Description", description: "Brief product summary for listings", status: "done" },
      { name: "Full Description (Rich Text)", description: "HTML-capable full product description", status: "done" },
      { name: "Features Field", description: "Dedicated features/bullet points field", status: "done" },
      { name: "Specifications Field", description: "Technical specifications text", status: "done" },
      { name: "Terms & Conditions", description: "Per-product terms and conditions text", status: "done" },
      { name: "Warranty Info", description: "Warranty terms per product", status: "done" },
      { name: "Availability Description", description: "Custom availability/lead time text", status: "done" },
      { name: "Internal Notes", description: "Private staff-only notes", status: "done" },
      { name: "Search Keywords", description: "Additional keywords for search indexing", status: "done" },
      { name: "Product Videos", description: "Embedded video on product pages (YouTube/Vimeo)", status: "not_started" },
      { name: "PDF Brochure Upload", description: "Upload downloadable PDF brochures per product", status: "not_started", notes: "Maropost add-on feature" },
      { name: "Advanced Product Descriptions", description: "Multiple description tabs/sections on storefront", status: "not_started" },
    ],
  },
  {
    category: "Product Management — Pricing",
    icon: <Tag className="h-5 w-5" />,
    features: [
      { name: "Sell Price", description: "Main product price", status: "done" },
      { name: "Cost Price (COGS)", description: "Cost of goods sold for margin tracking", status: "done" },
      { name: "Compare at Price (RRP)", description: "Recommended retail / was price for strikethrough", status: "done" },
      { name: "Promo Price with Schedule", description: "Promotional price with start and end date", status: "done" },
      { name: "Promo Tag", description: "Custom promotional label/badge", status: "done" },
      { name: "Multilevel / Volume Pricing", description: "Tiered pricing based on quantity purchased", status: "done" },
      { name: "User-Group Pricing", description: "Different prices per customer group (wholesale, VIP)", status: "done", notes: "Pricing tiers exist with user_group field" },
      { name: "Tax-Free Flag", description: "Mark product as tax exempt", status: "done" },
      { name: "Tax-Inclusive Flag", description: "Prices include or exclude tax", status: "done" },
      { name: "Variant-Level Pricing", description: "Individual price per variant", status: "done" },
      { name: "Price Groups (Customer Groups)", description: "Assign different price lists per customer group", status: "partial", notes: "Pricing tiers exist but no customer group assignment UI" },
      { name: "Wholesale Ex-GST Pricing", description: "Show ex-GST prices for wholesale customer groups", status: "not_started" },
      { name: "Maximum Discount Rule", description: "Prevent product from being discounted beyond a limit", status: "not_started" },
      { name: "Web Price (Separate)", description: "Different price for online store vs in-store/POS", status: "not_started" },
      { name: "Outlet-Specific Pricing", description: "Different prices per store location/outlet", status: "not_started" },
      { name: "Currency-Specific Pricing", description: "Set prices in multiple currencies", status: "not_started" },
      { name: "Supplier Buy Price (Ex Tax)", description: "Supplier's native currency buy price", status: "not_started", notes: "Maropost Retail Express feature" },
      { name: "Direct Costs / Landed Cost", description: "Freight, duties, handling costs added to COGS", status: "not_started" },
      { name: "Markup Target % Calculator", description: "Calculate sell price from cost + markup %", status: "not_started" },
    ],
  },
  {
    category: "Product Management — Specifics & Attributes",
    icon: <Layers className="h-5 w-5" />,
    features: [
      { name: "Product Specifics (Key-Value)", description: "Custom attributes like Color, Material, Size as filterable specs", status: "done" },
      { name: "Specifics Sort Order", description: "Control display order of specifics", status: "done" },
      { name: "Product Relations (Related)", description: "Related product linking", status: "done" },
      { name: "Product Relations (Cross-Sell)", description: "Cross-sell product suggestions", status: "done" },
      { name: "Product Relations (Up-Sell)", description: "Up-sell product recommendations", status: "done" },
      { name: "Custom Fields (Misc 1-5)", description: "Five generic custom text fields", status: "done" },
      { name: "Custom Label", description: "Custom label field for internal use", status: "done" },
      { name: "Supplier Item Code", description: "Supplier/vendor code tracking", status: "done" },
      { name: "Model Number", description: "Manufacturer model number", status: "done" },
      { name: "Product Options (Non-Inventoried)", description: "Extra options like gift wrapping, engraving, gift messages", status: "not_started", notes: "Major Maropost add-on" },
      { name: "Custom Attributes (Unlimited)", description: "Create unlimited custom attributes beyond defaults", status: "not_started", notes: "Maropost Retail Express supports custom attributes" },
      { name: "Season Attribute", description: "Season classification for fashion/retail", status: "not_started" },
      { name: "Product Finder / Fitment Guide", description: "Dynamic product finder (car parts by make/model/year)", status: "not_started", notes: "Complex feature requiring dedicated UI" },
    ],
  },
  {
    category: "Product Management — Shipping & Dimensions",
    icon: <Boxes className="h-5 w-5" />,
    features: [
      { name: "Shipping Weight", description: "Product weight for shipping calculations", status: "done" },
      { name: "Shipping Dimensions (L×W×H)", description: "Length, width, height for dimensional weight", status: "done" },
      { name: "Actual Dimensions (L×W×H)", description: "Actual product dimensions (vs shipping box)", status: "done" },
      { name: "Shipping Cubic Measurement", description: "Cubic size of shipping box(es)", status: "done" },
      { name: "Flat Rate Charge per Product", description: "Per-product flat-rate shipping override", status: "done" },
      { name: "Shipping Category", description: "Classify products for shipping rule matching", status: "done" },
      { name: "Selling Unit / Base Unit", description: "Selling unit (each, pack, carton) with base unit qty", status: "done" },
      { name: "Number of Cartons", description: "How many cartons the product ships in", status: "done" },
      { name: "Requires Packaging Flag", description: "Whether product needs packaging/assembly", status: "done" },
      { name: "Virtual Product Flag", description: "Digital/virtual product (no shipping)", status: "done" },
    ],
  },
  {
    category: "Product Management — SEO",
    icon: <Globe className="h-5 w-5" />,
    features: [
      { name: "SEO Title (Meta Title)", description: "Custom page title for search engines", status: "done" },
      { name: "SEO Description (Meta Desc)", description: "Custom meta description for SERP", status: "done" },
      { name: "SEO Keywords", description: "Meta keywords field", status: "done" },
      { name: "Product Slug / URL", description: "Custom URL slug per product", status: "done" },
      { name: "Auto URL Update Toggle", description: "Toggle automatic slug generation from title", status: "done" },
      { name: "Canonical URLs", description: "Canonical tags to prevent duplicate content", status: "not_started" },
      { name: "Sitemap Generation", description: "Automatic XML sitemap for products", status: "not_started" },
      { name: "Structured Data (JSON-LD)", description: "Product schema markup for rich snippets", status: "not_started" },
      { name: "301 Redirect Management", description: "Manage URL redirects when slugs change", status: "not_started" },
    ],
  },
  {
    category: "Product Management — Bulk Operations",
    icon: <Database className="h-5 w-5" />,
    features: [
      { name: "Bulk Edit (Multi-Select)", description: "Select multiple products and edit price/status/category", status: "done" },
      { name: "Product Import (CSV)", description: "CSV import with column mapping and templates", status: "done" },
      { name: "Product Export (CSV)", description: "Export products to CSV with field selection", status: "done" },
      { name: "Import Templates (Saved Mappings)", description: "Save and reuse import field mappings", status: "done" },
      { name: "Import Log / History", description: "Track import history with success/error counts", status: "done" },
      { name: "Product Cloning / Duplicate", description: "Duplicate a product with all its data", status: "not_started" },
      { name: "Bulk Image Upload", description: "Upload images for multiple products at once", status: "not_started" },
      { name: "Scheduled Price Updates", description: "Schedule price changes for future dates", status: "not_started" },
      { name: "Mass Upload via FTP", description: "Automated product feed via FTP/SFTP", status: "not_started" },
      { name: "Saved Product Filters", description: "Save custom product search/filter combinations", status: "not_started" },
    ],
  },
  {
    category: "Product Types — Special",
    icon: <Gift className="h-5 w-5" />,
    features: [
      { name: "Regular Products", description: "Standard standalone products", status: "done" },
      { name: "Variation Products (Parent/Child)", description: "Products differentiated by specific feature (size, color)", status: "done" },
      { name: "Kit / Bundle Products", description: "Standard kits (fixed components)", status: "done" },
      { name: "Editable Bundle Products", description: "Customizable kits where customer picks components", status: "done", notes: "editable_bundle flag exists" },
      { name: "Electronic Gift Vouchers / Gift Cards", description: "Digital gift vouchers purchasable online, redeemable in-store/online", status: "not_started", notes: "Core Maropost product type" },
      { name: "Subscription Products", description: "Recurring subscription/auto-order products", status: "not_started" },
      { name: "Digital Download Products", description: "Downloadable files (software, music, ebooks)", status: "not_started" },
      { name: "Service Products", description: "Non-physical service bookings", status: "not_started" },
      { name: "Package Products (Retail Express)", description: "Grouped packages for POS retail", status: "not_started" },
    ],
  },
  {
    category: "Inventory Management",
    icon: <Database className="h-5 w-5" />,
    features: [
      { name: "Multi-Warehouse Inventory", description: "Track stock across multiple warehouse locations", status: "done" },
      { name: "Stock Levels per Location", description: "Individual quantity per product per warehouse", status: "done" },
      { name: "Low Stock Threshold Alerts", description: "Configurable low-stock threshold per product", status: "done" },
      { name: "Stock Adjustments with Reason", description: "Manual stock adjustments with reason tracking", status: "done" },
      { name: "Inventory Locations CRUD", description: "Create and manage warehouse/store locations with type/address", status: "done" },
      { name: "Reorder Quantity", description: "Suggested reorder quantity per product", status: "done" },
      { name: "Preorder / Backorder Quantity", description: "Track preorder/incoming quantities", status: "done" },
      { name: "Restock Quantity", description: "Restock level tracking per product", status: "done" },
      { name: "Variant-Level Inventory", description: "Stock tracking per variant per location", status: "done" },
      { name: "Inventory History / Audit Log", description: "Full history of stock changes with user attribution", status: "done" },
      { name: "Stock Transfers Between Locations", description: "Transfer stock between warehouses with tracking", status: "not_started", notes: "Maropost has full stock transfer workflow" },
      { name: "Purchase Orders (POs)", description: "Create POs to suppliers, track incoming stock", status: "not_started", notes: "Core Maropost feature with full PO workflow" },
      { name: "Purchase Order Receiving (GRN)", description: "Receive goods against POs with quantity verification", status: "not_started" },
      { name: "Supplier Management", description: "Supplier directory with contacts, lead times, default supplier per product", status: "not_started" },
      { name: "Supplier Returns", description: "Return goods to suppliers with tracking", status: "not_started" },
      { name: "Stock Take / Cycle Count", description: "Physical stock count reconciliation per location", status: "not_started" },
      { name: "Auto Replenishment Rules", description: "Auto-generate POs when stock drops below threshold", status: "not_started", notes: "Maropost has never/always/out-of-stock replenish modes" },
      { name: "Stock Replenishment Wizard", description: "Guided stock reorder suggestions based on sales velocity", status: "not_started" },
      { name: "Batch / Lot Tracking", description: "Track inventory by batch or lot number", status: "not_started" },
      { name: "Serial Number Tracking", description: "Track individual serial numbers per unit", status: "not_started" },
      { name: "Inventory Forecasting", description: "Demand forecasting based on sales history", status: "not_started" },
      { name: "Multi-Channel Stock Sync", description: "Auto-sync stock across website, eBay, Amazon, POS", status: "not_started" },
      { name: "Core Product Flag", description: "Mark products as core/staple items", status: "not_started" },
    ],
  },
  {
    category: "Order Management",
    icon: <ShoppingCart className="h-5 w-5" />,
    features: [
      { name: "Order List & Advanced Filtering", description: "View all orders with status, date, customer, amount filters", status: "done" },
      { name: "Order Detail View", description: "Detailed order view with line items, totals, timeline", status: "done" },
      { name: "Order Status Management", description: "Pending → Confirmed → Processing → Shipped → Delivered → Cancelled", status: "done" },
      { name: "Payment Status Tracking", description: "Pending, paid, partially paid, refunded", status: "done" },
      { name: "Fulfillment Status", description: "Unfulfilled, partial, fulfilled tracking separate from order status", status: "done" },
      { name: "Order Timeline / Event Log", description: "Chronological audit trail of all order events", status: "done" },
      { name: "Order Notes (Internal)", description: "Staff-only internal notes on orders", status: "done" },
      { name: "Manual Order Creation", description: "Create orders manually from admin panel", status: "done" },
      { name: "Shipping Address Capture", description: "Capture and display shipping address", status: "done" },
      { name: "Shipment Creation with Tracking", description: "Create shipments with carrier, tracking number, tracking URL", status: "done" },
      { name: "Split Shipments", description: "Ship different line items in separate packages", status: "done" },
      { name: "Shipment Items Linking", description: "Link specific order items to specific shipments with quantities", status: "done" },
      { name: "Order Number Search", description: "Search by order number, customer, email", status: "done" },
      { name: "Coupon / Discount Application", description: "Apply coupon codes with calculated discounts", status: "done" },
      { name: "Tax on Orders", description: "Tax amount on orders", status: "partial", notes: "Field exists; no automatic tax calculation engine" },
      { name: "Shipping Cost on Orders", description: "Shipping charge on orders", status: "partial", notes: "Field exists; no real-time carrier rate integration" },
      { name: "Order Invoices / PDF Generation", description: "Generate printable invoice PDF per order", status: "not_started" },
      { name: "Packing Slips", description: "Generate packing slips for warehouse fulfillment", status: "not_started" },
      { name: "Consignment Notes", description: "Generate consignment notes for shipping", status: "not_started" },
      { name: "Bulk Order Actions", description: "Bulk update status, bulk print labels/invoices", status: "not_started" },
      { name: "Order Email Notifications", description: "Automated emails on confirm, ship, deliver", status: "not_started" },
      { name: "Backorders / Pre-Orders", description: "Accept orders on out-of-stock items, track separately", status: "not_started" },
      { name: "Order Editing (Post-Placement)", description: "Edit order items, quantities, addresses after placement", status: "not_started" },
      { name: "Order Holds", description: "Place orders on hold pending review/verification", status: "not_started" },
      { name: "Dropship Order Routing", description: "Automatically route orders to dropship suppliers", status: "not_started", notes: "Maropost has full dropship workflow" },
      { name: "Pick Lists Generation", description: "Generate pick lists for warehouse staff", status: "not_started" },
      { name: "Custom Order Labels", description: "Custom label system for order organization", status: "not_started" },
      { name: "Customer PO Number Capture", description: "Capture customer's purchase order number at checkout", status: "not_started", notes: "B2B feature" },
      { name: "Order Splitting", description: "Split a single order into multiple orders", status: "not_started" },
      { name: "Order Merging", description: "Merge multiple orders from same customer", status: "not_started" },
    ],
  },
  {
    category: "Pick, Pack & Ship (Warehouse Operations)",
    icon: <Boxes className="h-5 w-5" />,
    features: [
      { name: "Pick'n'Pack Mobile App", description: "Mobile barcode scanning for order picking and packing", status: "not_started", notes: "Maropost Commerce Pick'n'Pack add-on" },
      { name: "Barcode Scanning", description: "Scan product barcodes during pick/pack for verification", status: "not_started" },
      { name: "Pick Verification", description: "Verify picked items match order before packing", status: "not_started" },
      { name: "Pack Verification", description: "Verify packed items before shipping label generation", status: "not_started" },
      { name: "Batch Picking", description: "Pick multiple orders simultaneously in warehouse", status: "not_started" },
      { name: "Wireless Printer Support", description: "Print labels/slips from mobile scanner device", status: "not_started" },
      { name: "Bin Location Management", description: "Assign and track bin locations for products in warehouse", status: "not_started" },
    ],
  },
  {
    category: "Returns & Refunds (RMA)",
    icon: <Repeat className="h-5 w-5" />,
    features: [
      { name: "Return Request Creation", description: "Create return merchandise authorizations (RMAs)", status: "done" },
      { name: "Return Reasons", description: "Capture reason for return from configurable list", status: "done" },
      { name: "Return Status Workflow", description: "Pending → Approved → Received → Completed status flow", status: "done" },
      { name: "Refund Amount Tracking", description: "Track refund amount per return", status: "done" },
      { name: "Admin Notes on Returns", description: "Internal staff notes per return", status: "done" },
      { name: "Return-to-Order Linking", description: "Link returns to original orders and customers", status: "done" },
      { name: "Custom RMA Reasons", description: "Create custom return reason types", status: "not_started", notes: "Maropost allows custom reasons/statuses/outcomes" },
      { name: "Custom RMA Statuses", description: "Create custom return status types", status: "not_started" },
      { name: "RMA Outcomes (Return to Stock/Write Off/Credit)", description: "Configurable outcomes: return to stock, write off, issue credit, replacement", status: "not_started", notes: "Core Maropost RMA feature" },
      { name: "Automatic Stock Adjustment on Return", description: "Auto-restock items when return outcome is 'return to stock'", status: "not_started" },
      { name: "Customer-Initiated Returns Portal", description: "Self-service return portal for customers", status: "not_started" },
      { name: "Return Shipping Labels", description: "Generate and send return shipping labels", status: "not_started" },
      { name: "Exchange Processing", description: "Process exchanges (return + new order) in one flow", status: "not_started" },
      { name: "Credit Notes / Store Credit", description: "Issue store credit instead of monetary refund", status: "not_started", notes: "Maropost adds credit to customer account" },
      { name: "RMA Line Items", description: "Return specific line items, not entire order", status: "not_started" },
      { name: "Adjustment Notes Generation", description: "Auto-generate adjustment notes for accounting", status: "not_started" },
    ],
  },
  {
    category: "Customer Management",
    icon: <Users className="h-5 w-5" />,
    features: [
      { name: "Customer List & Search", description: "View, search, filter all customers", status: "done" },
      { name: "Customer Detail View", description: "Individual customer profile with order history", status: "done" },
      { name: "Customer Segments", description: "New, returning, VIP segment classification", status: "done" },
      { name: "Customer Tags", description: "Custom tags for segmentation and filtering", status: "done" },
      { name: "Customer Notes (Internal)", description: "Internal notes per customer", status: "done" },
      { name: "Customer Order History", description: "View all orders for a customer", status: "done" },
      { name: "Customer Spend Tracking", description: "Total orders and total spent lifetime metrics", status: "done" },
      { name: "Customer Wishlists", description: "Save products to wishlist from storefront", status: "done" },
      { name: "Customer Reviews", description: "Leave and manage product reviews with ratings", status: "done" },
      { name: "Customer Account Portal", description: "Self-service account management for customers", status: "partial", notes: "Basic storefront account page exists" },
      { name: "Customer Groups (Wholesale/Retail/VIP)", description: "Assign customers to groups for pricing, visibility, payment terms", status: "not_started", notes: "Major Maropost add-on feature" },
      { name: "Customer Import (CSV)", description: "Bulk import customers via CSV", status: "not_started" },
      { name: "Customer Export (CSV)", description: "Export customer data to CSV", status: "not_started" },
      { name: "Multiple Saved Addresses", description: "Multiple shipping/billing addresses per customer", status: "not_started" },
      { name: "Customer Communication Log", description: "Log of all emails/messages sent to customer", status: "not_started" },
      { name: "Customer Payment Terms", description: "Set payment schedules (30/60/90 day terms) per customer", status: "not_started", notes: "B2B wholesale feature" },
      { name: "Customer Credit Limits", description: "Set maximum credit limit per customer account", status: "not_started" },
      { name: "Manual Account Approval", description: "Require admin approval for new customer registrations", status: "not_started" },
      { name: "Customer-Specific Invoices", description: "Different invoice template per customer/group", status: "not_started" },
      { name: "Automatic Payment Reminders", description: "Auto-send payment reminders for outstanding invoices", status: "not_started" },
      { name: "Customer Loyalty Points", description: "Earn and redeem loyalty points with configurable ratios", status: "not_started", notes: "Maropost supports per-product loyalty ratios" },
      { name: "Wholesale Registration Form", description: "Separate wholesale customer registration with extra fields", status: "not_started" },
      { name: "eRFM Customer Analysis", description: "Recency, Frequency, Monetary + Engagement scoring", status: "not_started", notes: "Maropost Marketing Cloud feature" },
    ],
  },
  {
    category: "Storefront / Online Store",
    icon: <Store className="h-5 w-5" />,
    features: [
      { name: "Multi-Store Support", description: "Multiple storefronts from one admin", status: "done" },
      { name: "Storefront Home Page", description: "Public-facing store home page", status: "done" },
      { name: "Product Listing Page (Grid)", description: "Browse all products with grid view", status: "done" },
      { name: "Product Detail Page", description: "Full product page with images, description, variants, reviews", status: "done" },
      { name: "Shopping Cart", description: "Add to cart, update quantities, remove items", status: "done" },
      { name: "Checkout Flow", description: "Checkout with address and order placement", status: "done" },
      { name: "Customer Auth (Login/Signup)", description: "Customer registration and login on storefront", status: "done" },
      { name: "Product Search", description: "Keyword search across products", status: "done" },
      { name: "Product Comparison", description: "Compare multiple products side by side", status: "done" },
      { name: "Wishlist", description: "Save products for later from storefront", status: "done" },
      { name: "Product Reviews Display", description: "Show customer reviews and ratings on product pages", status: "done" },
      { name: "Image Lightbox / Zoom", description: "Full-screen image viewer with zoom", status: "done" },
      { name: "Subdomain Storefronts", description: "Each store accessible via subdomain", status: "done" },
      { name: "Path-based Storefronts", description: "Store accessible via /store/:slug path", status: "done" },
      { name: "Responsive Mobile Design", description: "Mobile-friendly storefront layout", status: "done" },
      { name: "Category Navigation / Browsing", description: "Browse and filter products by category on storefront", status: "partial", notes: "Categories exist but no storefront nav filter UI" },
      { name: "Banner / Announcement Bar", description: "Configurable top banner with custom message", status: "partial", notes: "Banner text field exists on store" },
      { name: "Product Filters (Specifics-Based)", description: "Filter by size, color, brand, etc using product specifics", status: "not_started", notes: "Core Maropost feature — faceted filtering" },
      { name: "Sort Options (Price/Popular/New)", description: "Sort product listings by various criteria", status: "not_started" },
      { name: "Pagination / Infinite Scroll", description: "Paginate product listings for large catalogs", status: "not_started" },
      { name: "Drag-and-Drop Page Builder", description: "Visual WYSIWYG store page builder", status: "not_started", notes: "Major Maropost feature" },
      { name: "CMS / Content Pages", description: "Static pages: About, Contact, FAQ, Policies", status: "not_started" },
      { name: "Blog / Articles", description: "Built-in blog for content marketing", status: "not_started" },
      { name: "Buying Guides", description: "Educational content pages to help customers choose", status: "not_started" },
      { name: "Custom Forms", description: "Custom forms (contact, inquiry, feedback, quote request)", status: "not_started" },
      { name: "Navigation Menu Builder", description: "Custom header/footer menu management", status: "not_started" },
      { name: "Product Quick View", description: "Quick view popup from product grid", status: "not_started" },
      { name: "Recently Viewed Products", description: "Track and display recently viewed items", status: "not_started" },
      { name: "Related Products Display", description: "Show related/cross-sell on product page", status: "not_started", notes: "Data exists in product_relations, not rendered on storefront" },
      { name: "Popular / Trending Products", description: "Auto-ranked products by sales velocity (7-day/all-time)", status: "not_started", notes: "Maropost has Most Popular, Trending, Top Sellers" },
      { name: "Breadcrumb Navigation", description: "Breadcrumb trail showing category hierarchy", status: "not_started" },
      { name: "Store Locator", description: "Map-based physical store/pickup location locator", status: "not_started" },
      { name: "Gift Cards Purchase/Redeem", description: "Buy and redeem digital gift cards on storefront", status: "not_started" },
      { name: "Hide Prices (Login Required)", description: "Hide pricing until customer logs in (wholesale)", status: "not_started", notes: "Key B2B/wholesale feature" },
      { name: "Mini Cart / Cart Drawer", description: "Slide-out cart panel without leaving current page", status: "not_started" },
      { name: "Sticky Add to Cart", description: "Fixed add-to-cart bar on scroll", status: "not_started" },
      { name: "Product Tabs (Description/Specs/Reviews)", description: "Tabbed content on product page", status: "not_started" },
    ],
  },
  {
    category: "Themes & Templates",
    icon: <Palette className="h-5 w-5" />,
    features: [
      { name: "Store Theme Settings", description: "Colors, fonts, button radius, layout style per store", status: "done" },
      { name: "B@SE Template Engine", description: "Custom template engine with value tags, iterators, conditionals", status: "done" },
      { name: "Template Management (CRUD)", description: "Create/edit/delete templates per store", status: "done" },
      { name: "Template Types", description: "Header, footer, product, category, home, email template types", status: "done" },
      { name: "Custom CSS per Store", description: "Custom CSS injection per store theme", status: "done" },
      { name: "Format Pipes (18+)", description: "Template pipes: currency, date, truncate, uppercase, etc", status: "done" },
      { name: "Template Preview", description: "Live preview of template rendering with sample data", status: "done" },
      { name: "Context Types (Product/Category/Global)", description: "Templates scoped to different data contexts", status: "done" },
      { name: "Pre-Built Theme Library", description: "Selectable pre-designed themes (Premium themes)", status: "not_started", notes: "Maropost has multiple starter/premium themes" },
      { name: "Theme Import/Export", description: "Export and import theme packages", status: "not_started" },
      { name: "Theme Versioning / History", description: "Version history for theme changes with rollback", status: "not_started" },
      { name: "Email Templates (Transactional)", description: "Customizable email templates for all transactional emails", status: "not_started" },
      { name: "Invoice Templates", description: "Customizable print/PDF invoice layouts", status: "not_started" },
      { name: "Template Sets per Customer", description: "Assign different template sets to different customers", status: "not_started" },
    ],
  },
  {
    category: "Marketing & Promotions",
    icon: <Megaphone className="h-5 w-5" />,
    features: [
      { name: "Campaign Manager", description: "Create and manage email/SMS/push campaigns", status: "done" },
      { name: "Campaign Types (Email/SMS/Push)", description: "Multiple campaign channel types", status: "done" },
      { name: "Campaign Status Workflow", description: "Draft, scheduled, sent, archived status flow", status: "done" },
      { name: "Audience Segmentation", description: "Target campaigns by customer segment", status: "done" },
      { name: "Audience Tags Targeting", description: "Target campaigns by customer tags", status: "done" },
      { name: "Abandoned Cart Tracking", description: "Track and monitor abandoned carts in real-time", status: "done" },
      { name: "Campaign Statistics (Sent/Opened/Clicked)", description: "Track delivery, open, and click metrics per campaign", status: "done" },
      { name: "Coupon Codes (% and Fixed)", description: "Create discount codes with percentage or fixed amount", status: "done" },
      { name: "Coupon Usage Limits", description: "Max uses and minimum order amount restrictions", status: "done" },
      { name: "Coupon Date Ranges", description: "Start and expiry dates for coupon validity", status: "done" },
      { name: "Abandoned Cart Recovery Emails", description: "Automated recovery emails for abandoned carts", status: "not_started", notes: "Tracking exists; automation edge function needed" },
      { name: "A/B Testing (Campaigns)", description: "Test email subject lines, content, send times", status: "not_started", notes: "Maropost Marketing Cloud feature" },
      { name: "Marketing Automation Journeys", description: "Multi-step trigger-based automated email/SMS sequences", status: "not_started", notes: "Maropost Journey builder" },
      { name: "Transactional Campaigns", description: "Trigger-based emails (order confirm, ship, etc)", status: "not_started" },
      { name: "Recurring Campaigns", description: "Auto-recurring campaigns on schedule", status: "not_started" },
      { name: "AI Product Recommendations", description: "AI-powered product recommendations engine", status: "not_started", notes: "Maropost Merchandising Cloud" },
      { name: "AI-Powered Site Search", description: "Intelligent search with auto-complete, synonyms, typo tolerance", status: "not_started", notes: "Maropost Merchandising Cloud (Findify)" },
      { name: "Personalization Engine", description: "Personalized content/products per customer behavior", status: "not_started" },
      { name: "Social Media Integration", description: "Publish products to Facebook, Instagram", status: "not_started" },
      { name: "Google Shopping Feed", description: "Product feed for Google Shopping / Merchant Center", status: "not_started" },
      { name: "Pricing Promotions", description: "Quantity-based, bundle, BOGO discount rules", status: "not_started", notes: "Maropost Pricing Promotions module" },
      { name: "Popups & Exit-Intent", description: "Exit-intent popups, promo banners, email capture", status: "not_started" },
      { name: "Affiliate Program", description: "Affiliate tracking, referral links, commission management", status: "not_started" },
      { name: "Customer Referral Program", description: "Referral program with reward tracking", status: "not_started" },
      { name: "Web Tracking / Behavior Analytics", description: "Track page views, product views, customer behavior on site", status: "not_started", notes: "Maropost Marketing Cloud web tracking" },
      { name: "ISP Deliverability Reports", description: "Email deliverability analysis by ISP", status: "not_started" },
    ],
  },
  {
    category: "Payments & Checkout",
    icon: <CreditCard className="h-5 w-5" />,
    features: [
      { name: "Checkout Page", description: "Customer checkout flow on storefront", status: "done" },
      { name: "Order Summary at Checkout", description: "Display cart items and totals at checkout", status: "done" },
      { name: "Coupon Application at Checkout", description: "Apply coupon codes during checkout", status: "partial", notes: "Coupons exist but checkout coupon UI is basic" },
      { name: "Stripe Integration", description: "Stripe credit card, Apple Pay, Google Pay", status: "not_started", notes: "Primary Maropost payment gateway" },
      { name: "PayPal Integration", description: "PayPal standard + advanced payments", status: "not_started" },
      { name: "Afterpay (BNPL)", description: "Afterpay buy now pay later", status: "not_started" },
      { name: "ZipPay / ZipMoney (BNPL)", description: "Zip payment installment options", status: "not_started" },
      { name: "eWAY Gateway", description: "eWAY credit card processing (AU/NZ)", status: "not_started" },
      { name: "Apple Pay / Google Pay", description: "Web payment methods via Stripe", status: "not_started" },
      { name: "Saved/Stored Cards", description: "Save credit cards for returning customers", status: "not_started" },
      { name: "3D Secure Authentication", description: "3D Secure verification for fraud prevention", status: "not_started" },
      { name: "Multiple Payment Methods", description: "Offer multiple payment gateways simultaneously", status: "not_started" },
      { name: "Group-Specific Payment Methods", description: "Show different payment options per customer group", status: "not_started", notes: "B2B feature" },
      { name: "Payment Terms (30/60/90 Day)", description: "Invoice-based payment terms for wholesale/B2B", status: "not_started" },
      { name: "Partial Payments / Deposits / Layby", description: "Accept deposits or layby payments", status: "not_started" },
      { name: "Gift Card Redemption", description: "Apply gift card balance at checkout", status: "not_started" },
      { name: "Store Credit Redemption", description: "Apply store credit at checkout", status: "not_started" },
      { name: "Guest Checkout", description: "Allow checkout without creating an account", status: "not_started" },
      { name: "Multi-Currency Support", description: "Display prices and accept payment in multiple currencies", status: "not_started", notes: "Currency field exists on store but no conversion engine" },
      { name: "Managed Checkout (Hosted)", description: "Maropost-hosted secure checkout page", status: "not_started" },
      { name: "Checkout Settings (Configurable)", description: "Configure required fields, guest checkout, PO capture, etc", status: "not_started" },
    ],
  },
  {
    category: "Shipping & Fulfillment",
    icon: <Truck className="h-5 w-5" />,
    features: [
      { name: "Shipping Zones", description: "Define shipping regions with flat-rate pricing", status: "done" },
      { name: "Free Shipping Threshold", description: "Free shipping above configurable amount per zone", status: "done" },
      { name: "Flat Rate Shipping per Zone", description: "Fixed shipping cost per zone", status: "done" },
      { name: "Product Shipping Dimensions", description: "Weight and dimensional data per product for calculation", status: "done" },
      { name: "Flat Rate per Product Override", description: "Per-product flat rate shipping charge", status: "done" },
      { name: "Shipment Creation", description: "Create shipments with carrier and tracking number", status: "done" },
      { name: "Multiple Shipments per Order", description: "Split orders into multiple shipments", status: "done" },
      { name: "Australia Post eParcel (Live Rates)", description: "Real-time shipping rates from Australia Post", status: "not_started", notes: "Major Maropost carrier integration" },
      { name: "Australia Post MyPost Business", description: "Self-serve label configuration for MyPost Business", status: "not_started" },
      { name: "Couriers Please Integration", description: "Live rates and labels for Couriers Please", status: "not_started" },
      { name: "Sendle Integration", description: "Sendle shipping labels and rates", status: "not_started" },
      { name: "StarTrack Integration", description: "StarTrack labels and tracking", status: "not_started" },
      { name: "TNT Integration", description: "TNT shipping integration", status: "not_started" },
      { name: "Aramex (Fastway) Integration", description: "Aramex/Fastway courier integration", status: "not_started" },
      { name: "FedEx Integration", description: "FedEx rates and label printing", status: "not_started" },
      { name: "DHL Integration", description: "DHL shipping integration", status: "not_started" },
      { name: "Allied Express Integration", description: "Allied Express labels and rates", status: "not_started" },
      { name: "Neto Commerce Ship Module", description: "Built-in shipping label generation across carriers", status: "not_started", notes: "Maropost Commerce Ship add-on" },
      { name: "ShipStation Integration", description: "Sync orders to ShipStation for fulfillment", status: "not_started" },
      { name: "Real-Time Carrier Rate Calculator", description: "Live rates from multiple carriers at checkout", status: "not_started" },
      { name: "Shipping Label Printing", description: "Generate and print shipping labels from admin", status: "not_started" },
      { name: "Click & Collect", description: "Buy online, pick up in store", status: "not_started" },
      { name: "Delivery Date/Time Selection", description: "Let customers choose delivery date and time window", status: "not_started" },
      { name: "Shipping Rules Engine", description: "Complex rules: weight-based, item-count, value-based, dimensions", status: "not_started" },
      { name: "Import Carrier Rates (CSV)", description: "Upload custom rate tables for carriers", status: "not_started" },
      { name: "Carrier Booking / Pickup Request", description: "Book pickup with carrier from admin panel", status: "not_started" },
    ],
  },
  {
    category: "Analytics & Reporting",
    icon: <BarChart3 className="h-5 w-5" />,
    features: [
      { name: "Dashboard Overview Widgets", description: "Summary stats: revenue, orders, customers on dashboard", status: "done" },
      { name: "Analytics Page", description: "Dedicated analytics page with charts", status: "done" },
      { name: "Revenue Reports", description: "Revenue over time, by product, by category", status: "partial", notes: "Page exists, needs real data queries" },
      { name: "Order Reports", description: "Order volume, average value, fulfillment metrics", status: "partial" },
      { name: "Customer Reports", description: "New vs returning, lifetime value, segments", status: "partial" },
      { name: "Product Performance (Best Sellers)", description: "Top-selling products, low performers, margin analysis", status: "not_started" },
      { name: "Inventory Reports", description: "Stock levels, turnover, dead stock, reorder suggestions", status: "not_started" },
      { name: "Campaign Reports (Email)", description: "Campaign delivery, open, click, bounce, revenue metrics", status: "not_started", notes: "Campaign stats field exists but no detailed reports" },
      { name: "Campaign Reports (SMS)", description: "SMS campaign delivery and engagement reports", status: "not_started" },
      { name: "A/B Test Results", description: "Comparative results for A/B tested campaigns", status: "not_started" },
      { name: "Journey Reports", description: "Performance metrics for automation journeys", status: "not_started" },
      { name: "Custom Report Builder", description: "Build custom reports with filters, date ranges, metrics", status: "not_started" },
      { name: "Scheduled Report Emails", description: "Email reports on recurring schedule", status: "not_started" },
      { name: "Google Analytics Integration (GA4)", description: "GA4 tracking and ecommerce events", status: "not_started" },
      { name: "Conversion Funnel Analysis", description: "Track visitors: browse → cart → checkout → purchase", status: "not_started" },
      { name: "Sales by Channel Report", description: "Revenue breakdown by web, eBay, Amazon, POS, etc", status: "not_started" },
      { name: "Real-Time Sales Dashboard", description: "Live sales and visitor metrics", status: "not_started" },
      { name: "Website Traffic Reports", description: "Page views, sessions, referral sources", status: "not_started" },
      { name: "Growth & Attrition Reports", description: "Customer growth and churn analysis", status: "not_started" },
      { name: "eRFM Heatmap & Scoring", description: "Visual RFM analysis with customer movement flow", status: "not_started" },
      { name: "Glew Analytics Integration", description: "Deep ecommerce analytics via Glew add-on", status: "not_started" },
      { name: "Style Performance Reports", description: "Sales performance by product style/group (Manufacturer SKU)", status: "not_started" },
    ],
  },
  {
    category: "Marketplace & Channels",
    icon: <Globe className="h-5 w-5" />,
    features: [
      { name: "Multi-Store Management", description: "Manage multiple stores from one admin", status: "done" },
      { name: "Store Slug / URL", description: "Unique URL per store", status: "done" },
      { name: "eBay Integration", description: "List products, sync orders, manage listings on eBay", status: "not_started", notes: "Core Maropost integration with Marketplace Maximizer" },
      { name: "eBay Template Management", description: "Custom eBay listing templates", status: "not_started" },
      { name: "Amazon Integration", description: "List and sync products/orders with Amazon", status: "not_started" },
      { name: "Google Shopping Feed", description: "Product data feed for Google Merchant Center", status: "not_started" },
      { name: "Facebook / Instagram Shop", description: "Sync product catalog to Meta commerce", status: "not_started" },
      { name: "Catch Marketplace", description: "Australian Catch marketplace integration", status: "not_started" },
      { name: "Kogan Marketplace", description: "Kogan marketplace integration", status: "not_started" },
      { name: "Custom Data Feeds (Product)", description: "Build custom product feeds with field mapping, rules, filters", status: "not_started", notes: "Maropost's powerful feed builder" },
      { name: "Custom Data Feeds (Order)", description: "Push order data to 3PL/logistics providers", status: "not_started" },
      { name: "Marketplace Order Sync", description: "Sync marketplace orders back to platform automatically", status: "not_started" },
      { name: "Channel-Specific Pricing", description: "Different pricing per marketplace/channel", status: "not_started" },
      { name: "Multi-Store Import/Export Sync", description: "Sync data between multiple Neto stores via feeds", status: "not_started" },
      { name: "Shopify Publish/Sync", description: "Publish products to connected Shopify stores", status: "not_started", notes: "Retail Express feature" },
    ],
  },
  {
    category: "Drop Shipping",
    icon: <Truck className="h-5 w-5" />,
    features: [
      { name: "Dropship Supplier Management", description: "Register and manage dropship supplier partners", status: "not_started", notes: "Core Maropost feature" },
      { name: "Auto-Send Supplier Notifications", description: "Automatically email suppliers when order is placed", status: "not_started" },
      { name: "Supplier Order Portal", description: "Secure login portal for suppliers to process orders", status: "not_started" },
      { name: "Supplier Order Upload (FTP/CSV)", description: "Suppliers bulk upload tracking/status updates", status: "not_started" },
      { name: "Supplier Inventory Feeds", description: "Real-time inventory feeds from suppliers", status: "not_started" },
      { name: "Supplier Branding on Packing Slips", description: "Display supplier's logo on packing slips/labels", status: "not_started" },
      { name: "Dropship as Supplier Setup", description: "Configure your store as a dropship supplier for other sellers", status: "not_started" },
    ],
  },
  {
    category: "User Management & Security",
    icon: <Shield className="h-5 w-5" />,
    features: [
      { name: "User Authentication (Email/Password)", description: "Email/password login and registration", status: "done" },
      { name: "Role-Based Access (Owner/Admin/Staff)", description: "Granular roles per store", status: "done" },
      { name: "Store-Level Permissions", description: "Roles scoped to individual stores", status: "done" },
      { name: "Platform Admin (Super Admin)", description: "Super admin for platform-level management", status: "done" },
      { name: "Row Level Security (RLS)", description: "Database-level tenant isolation via Postgres RLS", status: "done" },
      { name: "User Profiles (Name/Avatar)", description: "Display name and avatar per user", status: "done" },
      { name: "Password Reset Flow", description: "Forgot password and reset via email link", status: "done" },
      { name: "Activity / Audit Log", description: "Audit trail of all admin actions", status: "done" },
      { name: "Two-Factor Authentication (2FA)", description: "2FA for admin accounts", status: "not_started" },
      { name: "SSO / Social Login (Google, Facebook)", description: "Login with social providers", status: "not_started" },
      { name: "IP Whitelisting", description: "Restrict admin access by IP address", status: "not_started" },
      { name: "API Key Management", description: "Generate and manage API keys per store", status: "not_started" },
      { name: "Staff Permissions (Granular)", description: "Fine-grained permissions per feature area per staff member", status: "not_started" },
      { name: "Session Management", description: "View and revoke active sessions", status: "not_started" },
    ],
  },
  {
    category: "Tax Configuration",
    icon: <Receipt className="h-5 w-5" />,
    features: [
      { name: "Tax Rates per Region", description: "Define tax rates per region/country", status: "done" },
      { name: "Tax-Free Products", description: "Flag individual products as tax exempt", status: "done" },
      { name: "Tax-Inclusive Pricing", description: "Toggle prices include or exclude tax", status: "done" },
      { name: "Automatic Tax Calculation", description: "Calculate tax based on customer location and product rules", status: "not_started" },
      { name: "GST Configuration (Australia)", description: "Australian GST (10%) with BAS reporting", status: "not_started" },
      { name: "VAT Support (International)", description: "International VAT with multiple rates", status: "not_started" },
      { name: "Tax Reports", description: "Tax collected reports for compliance/BAS", status: "not_started" },
      { name: "Tax-Exempt Customer Groups", description: "Automatically exempt wholesale customers from tax", status: "not_started" },
    ],
  },
  {
    category: "Store Settings & Configuration",
    icon: <Settings className="h-5 w-5" />,
    features: [
      { name: "General Store Settings", description: "Store name, email, currency, timezone", status: "done" },
      { name: "Store Logo Upload", description: "Upload and display store logo", status: "done" },
      { name: "Store Currency", description: "Set default currency per store", status: "done" },
      { name: "Store Timezone", description: "Set timezone for date/time display", status: "done" },
      { name: "Contact Email", description: "Store contact email configuration", status: "done" },
      { name: "Store Description", description: "Store description for SEO and about page", status: "done" },
      { name: "Primary Color / Branding", description: "Primary brand color configuration", status: "done" },
      { name: "Notification Preferences", description: "Configure which admin notifications to receive", status: "not_started" },
      { name: "Webhook Configuration", description: "Set up webhooks for external system notifications", status: "not_started" },
      { name: "Custom Domain", description: "Use custom domain for storefront", status: "not_started" },
      { name: "SSL Certificate", description: "Automatic SSL for custom domains", status: "not_started" },
      { name: "Checkout Settings", description: "Configure checkout fields, guest checkout, PO capture", status: "not_started" },
      { name: "Email Sender Settings", description: "Configure from name and email for transactional emails", status: "not_started" },
      { name: "Order Settings", description: "Auto order numbering, prefix, default statuses", status: "not_started" },
      { name: "Inventory Settings", description: "Global inventory behavior settings", status: "not_started" },
    ],
  },
  {
    category: "Platform & Infrastructure",
    icon: <Layers className="h-5 w-5" />,
    features: [
      { name: "Multi-Tenant Architecture", description: "Full tenant isolation with store-scoped data", status: "done" },
      { name: "Onboarding Flow (Store Setup Wizard)", description: "Guided store setup wizard", status: "done" },
      { name: "Landing Page / Marketing Site", description: "Platform marketing landing page", status: "done" },
      { name: "Merchant Management (Admin)", description: "Platform admin view of all merchants/stores", status: "done" },
      { name: "Responsive Admin UI", description: "Mobile-friendly admin dashboard", status: "done" },
      { name: "Collapsible Sidebar Navigation", description: "Collapsible sidebar with grouped sections", status: "done" },
      { name: "In-App Notification Bell", description: "Notification system in admin header", status: "done" },
      { name: "Toast Notifications", description: "Success/error feedback toasts", status: "done" },
      { name: "Global Admin Search", description: "Search across all admin sections (products, orders, customers)", status: "not_started" },
      { name: "Keyboard Shortcuts", description: "Power-user keyboard shortcuts for common actions", status: "not_started" },
      { name: "Dark Mode", description: "Dark mode theme support for admin", status: "not_started" },
      { name: "Localization / Multi-Language (i18n)", description: "Multi-language admin and storefront", status: "not_started" },
      { name: "Audit Log Export", description: "Export activity logs for compliance", status: "not_started" },
      { name: "Add-On Store / Marketplace", description: "Install add-ons to extend functionality", status: "not_started", notes: "Maropost has an add-on store for modules" },
      { name: "Franchise Connect", description: "Multi-franchise management with global product IDs", status: "not_started", notes: "Maropost Retail Express feature" },
    ],
  },
  {
    category: "Point of Sale (POS)",
    icon: <Smartphone className="h-5 w-5" />,
    features: [
      { name: "POS Terminal", description: "In-store point of sale register interface", status: "not_started", notes: "Maropost Neto POS (AU/NZ only)" },
      { name: "POS Product Search / Scan", description: "Search or barcode scan products at POS", status: "not_started" },
      { name: "POS Sales Processing", description: "Process sales, apply discounts, take payment in-store", status: "not_started" },
      { name: "POS Receipts", description: "Print/email receipts at POS", status: "not_started" },
      { name: "POS Cash Management", description: "Open/close register, float, cash counts", status: "not_started" },
      { name: "POS Returns / Refunds", description: "Process returns and refunds at POS", status: "not_started" },
      { name: "POS Layby", description: "Process layby/deposit payments at POS", status: "not_started" },
      { name: "POS Customer Lookup", description: "Look up customer accounts and order history at POS", status: "not_started" },
      { name: "POS Loyalty Points", description: "Earn and redeem loyalty points at POS", status: "not_started" },
      { name: "POS Gift Card Redemption", description: "Redeem gift vouchers at POS", status: "not_started" },
      { name: "POS Multi-Outlet", description: "Multiple POS outlets synced to one backend", status: "not_started" },
      { name: "POS Hardware Integration", description: "Receipt printers, cash drawers, barcode scanners", status: "not_started" },
    ],
  },
  {
    category: "Integrations & API",
    icon: <Zap className="h-5 w-5" />,
    features: [
      { name: "REST API (Products)", description: "Full CRUD API for products", status: "not_started", notes: "Maropost provides comprehensive API" },
      { name: "REST API (Orders)", description: "Full CRUD API for orders", status: "not_started" },
      { name: "REST API (Customers)", description: "Full CRUD API for customers", status: "not_started" },
      { name: "REST API (Inventory/Stock)", description: "API for stock levels and adjustments", status: "not_started" },
      { name: "REST API (Content/CMS)", description: "API for content pages and CMS", status: "not_started" },
      { name: "REST API (Payments)", description: "API for payment processing", status: "not_started" },
      { name: "REST API (RMA/Returns)", description: "API for returns and credit management", status: "not_started" },
      { name: "Webhooks (Event Notifications)", description: "Event-based webhooks for order/product/stock changes", status: "not_started" },
      { name: "Xero Accounting Integration", description: "Auto-sync orders, invoices, credits to Xero", status: "not_started" },
      { name: "MYOB Integration", description: "Sync with MYOB accounting software", status: "not_started" },
      { name: "Zapier / Make (Ibexa Connect)", description: "Connect to 1000s of apps via Zapier/Make", status: "not_started" },
      { name: "Mailchimp Integration", description: "Sync customers and segments to Mailchimp", status: "not_started" },
      { name: "Klaviyo Integration", description: "Advanced email marketing integration", status: "not_started" },
      { name: "Google Analytics (GA4)", description: "GA4 enhanced ecommerce tracking events", status: "not_started" },
      { name: "Facebook Pixel", description: "Conversion tracking for Meta ads", status: "not_started" },
      { name: "Google Tag Manager", description: "GTM container for tracking scripts", status: "not_started" },
    ],
  },
  {
    category: "Email & Notifications",
    icon: <Mail className="h-5 w-5" />,
    features: [
      { name: "Password Reset Email", description: "Password reset link via email", status: "done" },
      { name: "Order Confirmation Email", description: "Automated email when order is placed", status: "not_started" },
      { name: "Shipping Confirmation Email", description: "Email with tracking number when order ships", status: "not_started" },
      { name: "Delivery Confirmation Email", description: "Email when order is delivered", status: "not_started" },
      { name: "Welcome Email (New Customer)", description: "Email sent on new customer registration", status: "not_started" },
      { name: "Abandoned Cart Recovery Email", description: "Automated reminder for abandoned carts", status: "not_started" },
      { name: "Review Request Email", description: "Email asking for product review after delivery", status: "not_started" },
      { name: "Low Stock Alert Email (Admin)", description: "Notify admin when product stock is low", status: "not_started" },
      { name: "Return Initiated Email", description: "Email when return is initiated", status: "not_started" },
      { name: "Return Approved/Completed Email", description: "Email when return is approved or completed", status: "not_started" },
      { name: "Payment Reminder Emails (B2B)", description: "Automated payment reminders for outstanding invoices", status: "not_started", notes: "Maropost supports up to 3 automatic reminders" },
      { name: "Supplier Order Notification Email", description: "Auto-email to dropship suppliers with order details", status: "not_started" },
      { name: "Custom Transactional Email Templates", description: "Fully customizable HTML email templates per event", status: "not_started" },
      { name: "Email Queue / Delivery Tracking", description: "Track sent emails, delivery status, bounces", status: "not_started" },
    ],
  },
  {
    category: "Service & Support",
    icon: <Headphones className="h-5 w-5" />,
    features: [
      { name: "Helpdesk / Ticketing System", description: "Customer support ticket management", status: "not_started", notes: "Maropost Service Cloud" },
      { name: "Live Chat Widget", description: "Real-time chat support on storefront", status: "not_started" },
      { name: "Customer 360 View (Unified)", description: "Unified customer view across sales, marketing, service", status: "not_started", notes: "Key Maropost unified platform feature" },
      { name: "Knowledge Base / FAQ", description: "Self-service knowledge base for customers", status: "not_started" },
      { name: "Contact Form", description: "Built-in contact form on storefront", status: "not_started" },
    ],
  },
];

const statusConfig: Record<Status, { label: string; color: string; icon: React.ReactNode }> = {
  done: { label: "Done", color: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30", icon: <CheckCircle className="h-4 w-4 text-emerald-600" /> },
  partial: { label: "Partial", color: "bg-amber-500/15 text-amber-700 border-amber-500/30", icon: <Clock className="h-4 w-4 text-amber-600" /> },
  not_started: { label: "Not Started", color: "bg-muted text-muted-foreground border-border", icon: <Circle className="h-4 w-4 text-muted-foreground" /> },
};

export default function FeatureAudit() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | Status>("all");

  const filtered = useMemo(() => {
    return featureData.map((cat) => ({
      ...cat,
      features: cat.features.filter((f) => {
        const matchesSearch =
          !search ||
          f.name.toLowerCase().includes(search.toLowerCase()) ||
          f.description.toLowerCase().includes(search.toLowerCase()) ||
          cat.category.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = filterStatus === "all" || f.status === filterStatus;
        return matchesSearch && matchesStatus;
      }),
    })).filter((cat) => cat.features.length > 0);
  }, [search, filterStatus]);

  const totals = useMemo(() => {
    const all = featureData.flatMap((c) => c.features);
    return {
      total: all.length,
      done: all.filter((f) => f.status === "done").length,
      partial: all.filter((f) => f.status === "partial").length,
      not_started: all.filter((f) => f.status === "not_started").length,
    };
  }, []);

  const pct = Math.round(((totals.done + totals.partial * 0.5) / totals.total) * 100);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Maropost Feature Audit</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive feature parity audit against Maropost Commerce Cloud (Neto), Marketing Cloud, Merchandising Cloud, Retail Express & Service Cloud
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold">{totals.total}</div>
              <div className="text-xs text-muted-foreground mt-1">Total Features</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-emerald-600">{totals.done}</div>
              <div className="text-xs text-muted-foreground mt-1">Implemented</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-amber-600">{totals.partial}</div>
              <div className="text-xs text-muted-foreground mt-1">Partial</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-muted-foreground">{totals.not_started}</div>
              <div className="text-xs text-muted-foreground mt-1">Not Started</div>
            </CardContent>
          </Card>
          <Card className="col-span-2 md:col-span-1">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold">{pct}%</div>
              <Progress value={pct} className="mt-2 h-2" />
              <div className="text-xs text-muted-foreground mt-1">Overall Progress</div>
            </CardContent>
          </Card>
        </div>

        {/* Category breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Progress by Category ({featureData.length} categories)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {featureData.map((cat) => {
                const done = cat.features.filter((f) => f.status === "done").length;
                const partial = cat.features.filter((f) => f.status === "partial").length;
                const total = cat.features.length;
                const catPct = Math.round(((done + partial * 0.5) / total) * 100);
                return (
                  <div key={cat.category} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="shrink-0 text-muted-foreground">{cat.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{cat.category}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={catPct} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{done}/{total}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search features..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
            <TabsList>
              <TabsTrigger value="all">All ({totals.total})</TabsTrigger>
              <TabsTrigger value="done">Done ({totals.done})</TabsTrigger>
              <TabsTrigger value="partial">Partial ({totals.partial})</TabsTrigger>
              <TabsTrigger value="not_started">Not Started ({totals.not_started})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Feature Tables */}
        {filtered.map((cat) => (
          <Card key={cat.category}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                {cat.icon}
                {cat.category}
                <Badge variant="secondary" className="ml-auto font-normal">
                  {cat.features.filter((f) => f.status === "done").length}/{cat.features.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
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
                  {cat.features.map((feature) => {
                    const st = statusConfig[feature.status];
                    return (
                      <TableRow key={feature.name}>
                        <TableCell className="pr-0">{st.icon}</TableCell>
                        <TableCell className="font-medium">
                          {feature.name}
                          <span className="block md:hidden text-xs text-muted-foreground mt-0.5">
                            {feature.description}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                          {feature.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={st.color}>
                            {st.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                          {feature.notes || "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
