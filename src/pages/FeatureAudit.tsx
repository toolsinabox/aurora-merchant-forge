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
  Layers, Shield, Zap, Database, Store, Palette, Mail,
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
    category: "Product Management",
    icon: <Package className="h-5 w-5" />,
    features: [
      { name: "Product CRUD", description: "Create, read, update, delete products", status: "done" },
      { name: "Product Variants", description: "Size, color, option-based variants with individual pricing/stock", status: "done" },
      { name: "Product Images", description: "Multiple image upload, reorder, gallery", status: "done" },
      { name: "Product Categories", description: "Hierarchical categories with parent/child", status: "done" },
      { name: "Product Tags", description: "Tagging system for filtering and organization", status: "done" },
      { name: "Product SKU/Barcode", description: "SKU and barcode fields per product/variant", status: "done" },
      { name: "Product SEO", description: "SEO title, description, keywords, slug per product", status: "done" },
      { name: "Product Specifics", description: "Custom attribute key-value pairs (size, color, material)", status: "done" },
      { name: "Product Relations", description: "Related, cross-sell, up-sell product linking", status: "done" },
      { name: "Pricing Tiers", description: "Volume/user-group based tiered pricing", status: "done" },
      { name: "Promo Pricing", description: "Promotional price with start/end date scheduling", status: "done" },
      { name: "Compare at Price", description: "Strike-through pricing / was-now pricing", status: "done" },
      { name: "Cost Price", description: "Track cost price for margin calculations", status: "done" },
      { name: "Product Shipping Dimensions", description: "Weight, length, width, height, cubic for shipping calc", status: "done" },
      { name: "Kits / Bundles", description: "Kit/bundle flag with editable bundle support", status: "done" },
      { name: "Virtual Products", description: "Digital/virtual product flag (no shipping)", status: "done" },
      { name: "Product Status", description: "Active/draft/archived status management", status: "done" },
      { name: "Product Approval", description: "Approval workflow for marketplace products", status: "done" },
      { name: "Bulk Edit Products", description: "Multi-select bulk price/status/category editing", status: "done" },
      { name: "Product Import (CSV)", description: "CSV import with field mapping and templates", status: "done" },
      { name: "Product Export (CSV)", description: "Export products to CSV with field selection", status: "done" },
      { name: "Product Search Keywords", description: "Additional search keywords for internal search", status: "done" },
      { name: "Product Features / Specs", description: "Rich text features and specifications fields", status: "done" },
      { name: "Internal Notes", description: "Private notes for staff on product records", status: "done" },
      { name: "Custom Labels / Misc Fields", description: "Misc1-5 custom fields, custom label", status: "done" },
      { name: "Supplier Item Code", description: "Supplier/vendor item code tracking", status: "done" },
      { name: "Model Number", description: "Model number field for manufacturer reference", status: "done" },
      { name: "Warranty Info", description: "Warranty terms per product", status: "done" },
      { name: "Terms & Conditions", description: "Per-product terms and conditions", status: "done" },
      { name: "Auto URL Update", description: "Toggle automatic slug generation from title", status: "done" },
      { name: "Tax Settings per Product", description: "Tax-free and tax-inclusive flags per product", status: "done" },
      { name: "Product Finder / Fitment", description: "Dynamic product finder (e.g. car parts by make/model)", status: "not_started", notes: "Complex feature requiring dedicated UI" },
      { name: "Product Videos", description: "Embedded video support on product pages", status: "not_started" },
      { name: "Product Subscriptions", description: "Recurring subscription product type", status: "not_started" },
      { name: "Digital Downloads", description: "Downloadable file management for digital products", status: "not_started" },
      { name: "Product Cloning", description: "Duplicate a product with all its data", status: "not_started" },
      { name: "Drag-and-Drop Product Sorting", description: "Manual sort order via drag and drop in category", status: "not_started" },
    ],
  },
  {
    category: "Inventory Management",
    icon: <Database className="h-5 w-5" />,
    features: [
      { name: "Multi-Warehouse Inventory", description: "Track stock across multiple warehouse locations", status: "done" },
      { name: "Stock Levels per Location", description: "Individual quantity per product per warehouse", status: "done" },
      { name: "Low Stock Alerts", description: "Configurable low-stock threshold warnings", status: "done" },
      { name: "Stock Adjustments", description: "Manual stock adjustments with reason tracking", status: "done" },
      { name: "Inventory Locations CRUD", description: "Create and manage warehouse/store locations", status: "done" },
      { name: "Reorder Quantity", description: "Suggested reorder quantity per product", status: "done" },
      { name: "Preorder Quantity", description: "Track preorder/backorder quantities", status: "done" },
      { name: "Variant-Level Inventory", description: "Stock tracking per variant per location", status: "done" },
      { name: "Inventory History / Audit Log", description: "Full history of stock changes with user attribution", status: "done" },
      { name: "Inventory Transfer", description: "Transfer stock between warehouse locations", status: "not_started" },
      { name: "Purchase Orders", description: "Create POs to suppliers, receive stock", status: "not_started", notes: "Maropost has full PO workflow" },
      { name: "Stock Take / Cycle Count", description: "Physical stock count reconciliation", status: "not_started" },
      { name: "Inventory Forecasting", description: "AI/rule-based demand forecasting", status: "not_started" },
      { name: "Batch / Serial Tracking", description: "Track inventory by batch or serial number", status: "not_started" },
      { name: "Supplier Management", description: "Supplier directory with contact info and lead times", status: "not_started" },
      { name: "Goods Received Notes (GRN)", description: "Record goods received against purchase orders", status: "not_started" },
    ],
  },
  {
    category: "Order Management",
    icon: <ShoppingCart className="h-5 w-5" />,
    features: [
      { name: "Order List & Filtering", description: "View all orders with status, date, customer filters", status: "done" },
      { name: "Order Detail View", description: "Detailed order view with line items, totals, history", status: "done" },
      { name: "Order Status Management", description: "Pending, confirmed, processing, shipped, delivered, cancelled", status: "done" },
      { name: "Payment Status", description: "Track payment status (pending, paid, refunded)", status: "done" },
      { name: "Fulfillment Status", description: "Separate fulfillment tracking (unfulfilled, partial, fulfilled)", status: "done" },
      { name: "Order Timeline", description: "Chronological event log per order", status: "done" },
      { name: "Order Notes", description: "Internal staff notes on orders", status: "done" },
      { name: "Manual Order Creation", description: "Create orders manually from admin panel", status: "done" },
      { name: "Shipping Address", description: "Capture and display shipping address", status: "done" },
      { name: "Shipment Tracking", description: "Multiple shipments per order with tracking numbers", status: "done" },
      { name: "Split Shipments", description: "Ship different line items in separate packages", status: "done" },
      { name: "Shipment Items", description: "Link specific order items to specific shipments", status: "done" },
      { name: "Order Search", description: "Search by order number, customer, email", status: "done" },
      { name: "Coupon / Discount on Order", description: "Apply coupon codes with calculated discounts", status: "done" },
      { name: "Tax Calculation", description: "Tax amount on orders", status: "partial", notes: "Field exists; no automatic tax engine" },
      { name: "Shipping Cost", description: "Shipping charge on orders", status: "partial", notes: "Field exists; no real-time carrier rates" },
      { name: "Order Invoices / PDF", description: "Generate printable invoice PDF per order", status: "not_started" },
      { name: "Packing Slips", description: "Generate packing slip for warehouse fulfillment", status: "not_started" },
      { name: "Bulk Order Actions", description: "Bulk update status, print labels for multiple orders", status: "not_started" },
      { name: "Order Email Notifications", description: "Automated emails on confirm, ship, deliver", status: "not_started", notes: "Backend edge function needed" },
      { name: "Backorders", description: "Accept orders on out-of-stock items", status: "not_started" },
      { name: "Order Editing", description: "Edit order items/quantities after placement", status: "not_started" },
      { name: "Dropship Orders", description: "Route orders to dropship suppliers automatically", status: "not_started" },
      { name: "Pick Lists", description: "Generate pick lists for warehouse staff", status: "not_started" },
    ],
  },
  {
    category: "Returns & Refunds (RMA)",
    icon: <Truck className="h-5 w-5" />,
    features: [
      { name: "Return Requests", description: "Create and manage return merchandise authorizations", status: "done" },
      { name: "Return Reasons", description: "Capture reason for return", status: "done" },
      { name: "Return Status Workflow", description: "Pending, approved, rejected, completed status flow", status: "done" },
      { name: "Refund Amount Tracking", description: "Track refund amount per return", status: "done" },
      { name: "Admin Notes on Returns", description: "Internal staff notes per return", status: "done" },
      { name: "Return-to-Order Linking", description: "Link returns to original orders", status: "done" },
      { name: "Customer-Initiated Returns", description: "Self-service return portal for customers", status: "not_started" },
      { name: "Return Shipping Labels", description: "Generate and send return shipping labels", status: "not_started" },
      { name: "Restocking on Return", description: "Automatically restock items upon return completion", status: "not_started" },
      { name: "Exchange Processing", description: "Process exchanges (return + new order) in one flow", status: "not_started" },
      { name: "Credit Notes", description: "Issue store credit instead of monetary refund", status: "not_started" },
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
      { name: "Customer Notes", description: "Internal notes per customer", status: "done" },
      { name: "Customer Order History", description: "View all orders for a customer", status: "done" },
      { name: "Customer Spend Tracking", description: "Total orders and total spent metrics", status: "done" },
      { name: "Customer Import (CSV)", description: "Bulk import customers via CSV", status: "not_started" },
      { name: "Customer Groups / Pricing", description: "Assign customers to groups for tiered pricing", status: "not_started", notes: "Pricing tiers exist but no customer group assignment" },
      { name: "Customer Addresses", description: "Multiple saved addresses per customer", status: "not_started" },
      { name: "Customer Account Portal", description: "Self-service account management for customers", status: "partial", notes: "Basic storefront account page exists" },
      { name: "Customer Wishlists", description: "Save products to wishlist from storefront", status: "done" },
      { name: "Customer Reviews", description: "Leave and manage product reviews", status: "done" },
      { name: "Customer Communication Log", description: "Log of all emails/messages sent to customer", status: "not_started" },
    ],
  },
  {
    category: "Storefront / Online Store",
    icon: <Store className="h-5 w-5" />,
    features: [
      { name: "Multi-Store Support", description: "Multiple storefronts from one admin", status: "done" },
      { name: "Storefront Home Page", description: "Public-facing store home page", status: "done" },
      { name: "Product Listing Page", description: "Browse all products with grid view", status: "done" },
      { name: "Product Detail Page", description: "Full product page with images, description, variants", status: "done" },
      { name: "Shopping Cart", description: "Add to cart, update quantities, remove items", status: "done" },
      { name: "Checkout Flow", description: "Checkout with address and order placement", status: "done" },
      { name: "Customer Auth (Login/Signup)", description: "Customer registration and login on storefront", status: "done" },
      { name: "Product Search", description: "Search products by keyword on storefront", status: "done" },
      { name: "Product Comparison", description: "Compare multiple products side by side", status: "done" },
      { name: "Wishlist", description: "Save products for later", status: "done" },
      { name: "Product Reviews Display", description: "Show customer reviews on product pages", status: "done" },
      { name: "Image Lightbox", description: "Full-screen image viewer on product pages", status: "done" },
      { name: "Subdomain Storefronts", description: "Each store accessible via subdomain", status: "done" },
      { name: "Path-based Storefronts", description: "Store accessible via /store/:slug path", status: "done" },
      { name: "Responsive Design", description: "Mobile-friendly storefront layout", status: "done" },
      { name: "Category Navigation", description: "Browse products by category on storefront", status: "partial", notes: "Categories exist but no storefront nav filter" },
      { name: "Product Filters (Specifics)", description: "Filter by size, color, brand etc on listing page", status: "not_started", notes: "Maropost has faceted filtering by specifics" },
      { name: "Drag-and-Drop Page Builder", description: "Visual WYSIWYG store page builder", status: "not_started", notes: "Major feature in Maropost" },
      { name: "CMS / Content Pages", description: "About, contact, FAQ, blog content pages", status: "not_started" },
      { name: "Blog", description: "Built-in blog / content marketing", status: "not_started" },
      { name: "Forms Builder", description: "Custom forms (contact, inquiry, feedback)", status: "not_started" },
      { name: "Banner / Announcement Bar", description: "Configurable top banner with custom message", status: "partial", notes: "Banner text field exists on store settings" },
      { name: "Navigation Menu Builder", description: "Custom header/footer menu management", status: "not_started" },
      { name: "Product Quick View", description: "Quick view popup from product grid", status: "not_started" },
      { name: "Recently Viewed Products", description: "Track and display recently viewed items", status: "not_started" },
      { name: "Related Products Display", description: "Show related/cross-sell on product page", status: "not_started", notes: "Data exists in product_relations but not rendered" },
      { name: "Store Locator", description: "Map-based physical store locator", status: "not_started" },
      { name: "Gift Cards", description: "Purchase and redeem digital gift cards", status: "not_started" },
      { name: "Loyalty Points", description: "Earn and redeem loyalty points", status: "not_started" },
    ],
  },
  {
    category: "Themes & Templates",
    icon: <Palette className="h-5 w-5" />,
    features: [
      { name: "Store Theme Settings", description: "Colors, fonts, button radius, layout style per store", status: "done" },
      { name: "B@SE Template Engine", description: "Custom template engine with value tags, iterators, conditionals", status: "done" },
      { name: "Template Management", description: "CRUD for store templates (header, footer, product, home)", status: "done" },
      { name: "Template Types", description: "Header, footer, product, category, home, email templates", status: "done" },
      { name: "Custom CSS", description: "Custom CSS per store theme", status: "done" },
      { name: "Format Pipes", description: "18+ format pipes (currency, date, truncate, etc)", status: "done" },
      { name: "Template Preview", description: "Live preview of template rendering", status: "done" },
      { name: "Pre-built Theme Library", description: "Selectable pre-designed themes", status: "not_started", notes: "Maropost offers multiple starter themes" },
      { name: "Theme Versioning", description: "Version history for theme changes", status: "not_started" },
      { name: "Email Templates", description: "Customizable email templates for transactional emails", status: "not_started" },
    ],
  },
  {
    category: "Marketing & Promotions",
    icon: <Megaphone className="h-5 w-5" />,
    features: [
      { name: "Campaign Manager", description: "Create and manage email/SMS/push campaigns", status: "done" },
      { name: "Campaign Types", description: "Email, SMS, push notification campaign types", status: "done" },
      { name: "Campaign Status Workflow", description: "Draft, scheduled, sent, archived status", status: "done" },
      { name: "Audience Segmentation", description: "Target campaigns by customer segment", status: "done" },
      { name: "Audience Tags", description: "Target campaigns by customer tags", status: "done" },
      { name: "Abandoned Cart Tracking", description: "Track and monitor abandoned carts", status: "done" },
      { name: "Campaign Statistics", description: "Sent, opened, clicked metrics per campaign", status: "done" },
      { name: "Coupon Codes", description: "Create discount codes (percentage, fixed amount)", status: "done" },
      { name: "Coupon Usage Limits", description: "Max uses and minimum order amount", status: "done" },
      { name: "Coupon Date Ranges", description: "Start and expiry dates for coupons", status: "done" },
      { name: "Abandoned Cart Recovery Emails", description: "Automated recovery emails for abandoned carts", status: "not_started", notes: "Tracking exists; automation not yet built" },
      { name: "A/B Testing", description: "Test email subject lines and content variations", status: "not_started" },
      { name: "Marketing Automation Workflows", description: "Trigger-based automated email sequences", status: "not_started" },
      { name: "Product Recommendations Engine", description: "AI-powered product recommendations", status: "not_started", notes: "Maropost Merchandising Cloud feature" },
      { name: "Social Media Integration", description: "Publish products to Facebook, Instagram", status: "not_started" },
      { name: "Google Shopping Feed", description: "Product feed for Google Shopping / Merchant Center", status: "not_started" },
      { name: "SEO Tools", description: "Sitemap generation, meta tags, canonical URLs", status: "partial", notes: "Per-product SEO fields exist" },
      { name: "Popups & Banners", description: "Exit-intent popups, promo banners", status: "not_started" },
      { name: "Affiliate Program", description: "Affiliate tracking and commission management", status: "not_started" },
      { name: "Customer Referrals", description: "Referral program with reward tracking", status: "not_started" },
    ],
  },
  {
    category: "Payments & Checkout",
    icon: <CreditCard className="h-5 w-5" />,
    features: [
      { name: "Checkout Page", description: "Customer checkout flow on storefront", status: "done" },
      { name: "Order Summary at Checkout", description: "Display cart items and totals at checkout", status: "done" },
      { name: "Coupon Application", description: "Apply coupon codes at checkout", status: "partial", notes: "Coupons exist but checkout integration is basic" },
      { name: "Stripe Integration", description: "Accept credit card payments via Stripe", status: "not_started", notes: "Available via platform connector" },
      { name: "PayPal Integration", description: "PayPal payment gateway", status: "not_started" },
      { name: "Afterpay / Buy Now Pay Later", description: "BNPL payment options", status: "not_started" },
      { name: "Multiple Payment Methods", description: "Support multiple payment gateways simultaneously", status: "not_started" },
      { name: "Saved Payment Methods", description: "Save cards for returning customers", status: "not_started" },
      { name: "Partial Payments / Deposits", description: "Accept deposits or layby payments", status: "not_started" },
      { name: "Store Credit / Gift Card Redemption", description: "Apply store credit or gift cards at checkout", status: "not_started" },
      { name: "Guest Checkout", description: "Allow checkout without creating an account", status: "not_started" },
      { name: "Multi-Currency", description: "Display prices and accept payment in multiple currencies", status: "not_started", notes: "Currency field exists on store but no conversion" },
    ],
  },
  {
    category: "Shipping & Fulfillment",
    icon: <Truck className="h-5 w-5" />,
    features: [
      { name: "Shipping Zones", description: "Define shipping regions with flat-rate pricing", status: "done" },
      { name: "Free Shipping Threshold", description: "Free shipping above configurable amount", status: "done" },
      { name: "Flat Rate Shipping", description: "Fixed shipping cost per zone", status: "done" },
      { name: "Product Shipping Dimensions", description: "Weight and dimensional data per product", status: "done" },
      { name: "Flat Rate per Product", description: "Per-product flat rate shipping charge", status: "done" },
      { name: "Shipment Creation", description: "Create shipments with carrier and tracking", status: "done" },
      { name: "Multiple Shipments per Order", description: "Split orders into multiple shipments", status: "done" },
      { name: "Real-Time Carrier Rates", description: "Live rates from carriers (Australia Post, FedEx, etc)", status: "not_started", notes: "Major Maropost feature" },
      { name: "Shipping Label Printing", description: "Generate and print shipping labels", status: "not_started" },
      { name: "ShipStation Integration", description: "Sync orders to ShipStation for fulfillment", status: "not_started" },
      { name: "Click & Collect", description: "Buy online, pick up in store", status: "not_started" },
      { name: "Delivery Date Selection", description: "Let customers choose delivery date", status: "not_started" },
      { name: "Shipping Rules Engine", description: "Complex rules (weight-based, item-count, etc)", status: "not_started" },
    ],
  },
  {
    category: "Analytics & Reporting",
    icon: <BarChart3 className="h-5 w-5" />,
    features: [
      { name: "Dashboard Overview", description: "Summary stats on dashboard (revenue, orders, customers)", status: "done" },
      { name: "Analytics Page", description: "Dedicated analytics page with charts", status: "done" },
      { name: "Revenue Reports", description: "Revenue over time, by product, by category", status: "partial", notes: "Page exists but uses mock data" },
      { name: "Order Reports", description: "Order volume, average value, fulfillment metrics", status: "partial", notes: "Basic stats shown" },
      { name: "Customer Reports", description: "New vs returning, lifetime value, segments", status: "partial" },
      { name: "Product Performance", description: "Best sellers, low performers, margin analysis", status: "not_started" },
      { name: "Inventory Reports", description: "Stock levels, turnover, dead stock identification", status: "not_started" },
      { name: "Google Analytics Integration", description: "GA4 tracking and ecommerce events", status: "not_started" },
      { name: "Conversion Funnel", description: "Track visitors through browse > cart > checkout > purchase", status: "not_started" },
      { name: "Sales by Channel", description: "Break down revenue by sales channel", status: "not_started" },
      { name: "Custom Report Builder", description: "Build custom reports with filters and date ranges", status: "not_started" },
      { name: "Scheduled Report Emails", description: "Email reports on a schedule", status: "not_started" },
      { name: "Real-Time Dashboard", description: "Live sales and visitor metrics", status: "not_started" },
      { name: "Glew Analytics Integration", description: "Deep ecommerce analytics via Glew", status: "not_started" },
    ],
  },
  {
    category: "Marketplace & Channels",
    icon: <Globe className="h-5 w-5" />,
    features: [
      { name: "Multi-Store Management", description: "Manage multiple stores from one admin", status: "done" },
      { name: "Store Slug / URL", description: "Unique URL per store", status: "done" },
      { name: "eBay Integration", description: "List and sync products to eBay", status: "not_started", notes: "Core Maropost feature" },
      { name: "Amazon Integration", description: "List and sync products to Amazon", status: "not_started" },
      { name: "Google Shopping", description: "Product feed for Google Shopping", status: "not_started" },
      { name: "Facebook / Instagram Shop", description: "Sync catalog to Meta commerce", status: "not_started" },
      { name: "Catch / Kogan Marketplace", description: "Australian marketplace integrations", status: "not_started" },
      { name: "Data Feeds", description: "Custom product/order data feed generator", status: "not_started", notes: "Maropost has powerful feed builder" },
      { name: "Marketplace Order Sync", description: "Sync marketplace orders back to platform", status: "not_started" },
      { name: "Channel-Specific Pricing", description: "Different pricing per marketplace/channel", status: "not_started" },
    ],
  },
  {
    category: "User Management & Security",
    icon: <Shield className="h-5 w-5" />,
    features: [
      { name: "User Authentication", description: "Email/password login and registration", status: "done" },
      { name: "Role-Based Access (RBAC)", description: "Owner, admin, staff roles per store", status: "done" },
      { name: "Store-Level Permissions", description: "Roles scoped to individual stores", status: "done" },
      { name: "Platform Admin Role", description: "Super admin for platform-level management", status: "done" },
      { name: "Row Level Security", description: "Database-level tenant isolation (RLS)", status: "done" },
      { name: "User Profiles", description: "Display name, avatar per user", status: "done" },
      { name: "Password Reset", description: "Forgot password and reset flow", status: "done" },
      { name: "Activity Log", description: "Audit trail of admin actions", status: "done" },
      { name: "Two-Factor Authentication", description: "2FA for admin accounts", status: "not_started" },
      { name: "SSO / Social Login", description: "Login with Google, Facebook, Apple", status: "not_started" },
      { name: "IP Whitelisting", description: "Restrict admin access by IP", status: "not_started" },
      { name: "API Key Management", description: "Generate and manage API keys per store", status: "not_started" },
    ],
  },
  {
    category: "Tax Configuration",
    icon: <FileText className="h-5 w-5" />,
    features: [
      { name: "Tax Rates", description: "Define tax rates per region", status: "done" },
      { name: "Tax-Free Products", description: "Flag products as tax exempt", status: "done" },
      { name: "Tax-Inclusive Pricing", description: "Prices include or exclude tax", status: "done" },
      { name: "Automatic Tax Calculation", description: "Calculate tax based on shipping address", status: "not_started", notes: "Tax rates exist but no auto-calc engine" },
      { name: "Tax Reports", description: "Tax collected reports for compliance", status: "not_started" },
      { name: "GST / VAT Support", description: "Australian GST and international VAT", status: "not_started" },
    ],
  },
  {
    category: "Store Settings & Configuration",
    icon: <Settings className="h-5 w-5" />,
    features: [
      { name: "Store Settings Page", description: "General store settings (name, email, currency, timezone)", status: "done" },
      { name: "Store Logo", description: "Upload and display store logo", status: "done" },
      { name: "Store Currency", description: "Set default currency per store", status: "done" },
      { name: "Store Timezone", description: "Set timezone for date/time display", status: "done" },
      { name: "Contact Email", description: "Store contact email configuration", status: "done" },
      { name: "Store Description", description: "Store description for SEO and about", status: "done" },
      { name: "Notification Preferences", description: "Configure which notifications to receive", status: "not_started" },
      { name: "Webhook Configuration", description: "Set up webhooks for external integrations", status: "not_started" },
      { name: "Custom Domain", description: "Use custom domain for storefront", status: "not_started" },
      { name: "SSL Certificate", description: "Automatic SSL for custom domains", status: "not_started" },
    ],
  },
  {
    category: "Platform & Infrastructure",
    icon: <Layers className="h-5 w-5" />,
    features: [
      { name: "Multi-Tenant Architecture", description: "Full tenant isolation with store-scoped data", status: "done" },
      { name: "Onboarding Flow", description: "Guided store setup wizard", status: "done" },
      { name: "Landing Page", description: "Platform marketing / landing page", status: "done" },
      { name: "Merchant Management", description: "Platform admin view of all merchants/stores", status: "done" },
      { name: "Responsive Admin UI", description: "Mobile-friendly admin dashboard", status: "done" },
      { name: "Sidebar Navigation", description: "Collapsible sidebar with all admin sections", status: "done" },
      { name: "Notification System", description: "In-app notification bell", status: "done" },
      { name: "Toast Notifications", description: "Success/error feedback toasts", status: "done" },
      { name: "Search in Admin", description: "Global search across admin sections", status: "not_started" },
      { name: "Keyboard Shortcuts", description: "Power-user keyboard shortcuts", status: "not_started" },
      { name: "Dark Mode", description: "Dark mode theme support", status: "not_started" },
      { name: "Localization / i18n", description: "Multi-language admin and storefront", status: "not_started" },
      { name: "Audit Log Export", description: "Export activity logs for compliance", status: "not_started" },
    ],
  },
  {
    category: "Integrations & API",
    icon: <Zap className="h-5 w-5" />,
    features: [
      { name: "REST API", description: "Full REST API for products, orders, customers", status: "not_started", notes: "Maropost provides comprehensive API" },
      { name: "Webhooks", description: "Event-based webhooks for order/product changes", status: "not_started" },
      { name: "Xero Accounting", description: "Sync orders and invoices to Xero", status: "not_started" },
      { name: "MYOB Integration", description: "Sync with MYOB accounting", status: "not_started" },
      { name: "Zapier / Make Integration", description: "Connect to 1000s of apps via Zapier/Make", status: "not_started" },
      { name: "Mailchimp Integration", description: "Sync customers to Mailchimp lists", status: "not_started" },
      { name: "Klaviyo Integration", description: "Advanced email marketing integration", status: "not_started" },
      { name: "Google Analytics", description: "GA4 enhanced ecommerce tracking", status: "not_started" },
      { name: "Facebook Pixel", description: "Conversion tracking for Meta ads", status: "not_started" },
      { name: "POS Integration", description: "Point of sale system integration", status: "not_started", notes: "Maropost has Neto POS" },
    ],
  },
  {
    category: "Email & Notifications",
    icon: <Mail className="h-5 w-5" />,
    features: [
      { name: "Order Confirmation Email", description: "Automated email when order is placed", status: "not_started" },
      { name: "Shipping Confirmation Email", description: "Email with tracking when order ships", status: "not_started" },
      { name: "Delivery Confirmation Email", description: "Email when order is delivered", status: "not_started" },
      { name: "Welcome Email", description: "Email sent on new customer registration", status: "not_started" },
      { name: "Password Reset Email", description: "Password reset link via email", status: "done" },
      { name: "Abandoned Cart Email", description: "Automated reminder for abandoned carts", status: "not_started" },
      { name: "Review Request Email", description: "Email asking for product review after delivery", status: "not_started" },
      { name: "Low Stock Alert Email", description: "Notify admin when stock is low", status: "not_started" },
      { name: "Return Confirmation Email", description: "Email when return is initiated/approved", status: "not_started" },
      { name: "Custom Transactional Emails", description: "Fully customizable email templates", status: "not_started" },
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
            Comprehensive feature parity audit against Maropost Commerce Cloud
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
            <CardTitle className="text-lg">Progress by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {featureData.map((cat) => {
                const done = cat.features.filter((f) => f.status === "done").length;
                const partial = cat.features.filter((f) => f.status === "partial").length;
                const total = cat.features.length;
                const catPct = Math.round(((done + partial * 0.5) / total) * 100);
                return (
                  <div key={cat.category} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="shrink-0 text-muted-foreground">{cat.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{cat.category}</div>
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
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="done">Done</TabsTrigger>
              <TabsTrigger value="partial">Partial</TabsTrigger>
              <TabsTrigger value="not_started">Not Started</TabsTrigger>
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
