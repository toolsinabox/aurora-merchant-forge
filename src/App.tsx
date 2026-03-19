import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { CompareProvider } from "@/contexts/CompareContext";
import { MigrationProvider } from "@/contexts/MigrationContext";
import { MigrationProgressWidget } from "@/components/admin/MigrationProgressWidget";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RequirePlatformAdmin } from "@/components/auth/RequirePlatformAdmin";
import { getSubdomainSlug } from "@/lib/subdomain";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";

// Eagerly loaded — critical path pages
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/Login.tsx";
import LandingPage from "./pages/LandingPage.tsx";

// Lazy loaded — all other pages
const Signup = lazy(() => import("./pages/Signup.tsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));
const Onboarding = lazy(() => import("./pages/Onboarding.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Products = lazy(() => import("./pages/Products.tsx"));
const ProductForm = lazy(() => import("./pages/ProductForm.tsx"));
const Categories = lazy(() => import("./pages/Categories.tsx"));
const SmartCollections = lazy(() => import("./pages/SmartCollections.tsx"));
const Inventory = lazy(() => import("./pages/Inventory.tsx"));
const Orders = lazy(() => import("./pages/Orders.tsx"));
const OrderDetail = lazy(() => import("./pages/OrderDetail.tsx"));
const PrintInvoice = lazy(() => import("./pages/PrintInvoice.tsx"));
const PrintPickList = lazy(() => import("./pages/PrintPickList.tsx"));
const PrintPurchaseOrder = lazy(() => import("./pages/PrintPurchaseOrder.tsx"));
const PrintPackingSlip = lazy(() => import("./pages/PrintPackingSlip.tsx"));
const Customers = lazy(() => import("./pages/Customers.tsx"));
const CustomerDetail = lazy(() => import("./pages/CustomerDetail.tsx"));
const Marketing = lazy(() => import("./pages/Marketing.tsx"));
const Analytics = lazy(() => import("./pages/Analytics.tsx"));
const SettingsPage = lazy(() => import("./pages/Settings.tsx"));
const Coupons = lazy(() => import("./pages/Coupons.tsx"));
const Returns = lazy(() => import("./pages/Returns.tsx"));
const Reviews = lazy(() => import("./pages/Reviews.tsx"));
const ActivityLog = lazy(() => import("./pages/ActivityLog.tsx"));
const ImportWizard = lazy(() => import("./pages/ImportWizard.tsx"));
const ExportWizard = lazy(() => import("./pages/ExportWizard.tsx"));
const Templates = lazy(() => import("./pages/Templates.tsx"));
const ThemeFiles = lazy(() => import("./pages/ThemeFiles.tsx"));
const FeatureAudit = lazy(() => import("./pages/FeatureAudit.tsx"));
const StorefrontAudit = lazy(() => import("./pages/StorefrontAudit.tsx"));
const TemplateReference = lazy(() => import("./pages/TemplateReference.tsx"));
const OrderWorkflows = lazy(() => import("./pages/OrderWorkflows.tsx"));
const Suppliers = lazy(() => import("./pages/Suppliers.tsx"));
const GiftVouchers = lazy(() => import("./pages/GiftVouchers.tsx"));
const ContentPages = lazy(() => import("./pages/ContentPages.tsx"));
const PurchaseOrders = lazy(() => import("./pages/PurchaseOrders.tsx"));
const ShippingZones = lazy(() => import("./pages/ShippingZones.tsx"));
const TaxRates = lazy(() => import("./pages/TaxRates.tsx"));
const StockAdjustments = lazy(() => import("./pages/StockAdjustments.tsx"));
const Stocktake = lazy(() => import("./pages/Stocktake.tsx"));
const AbandonedCarts = lazy(() => import("./pages/AbandonedCarts.tsx"));
const StorefrontWishlist = lazy(() => import("./pages/storefront/StorefrontWishlist.tsx"));
const StorefrontHome = lazy(() => import("./pages/storefront/StorefrontHome.tsx"));
const StorefrontProducts = lazy(() => import("./pages/storefront/StorefrontProducts.tsx"));
const StorefrontProductDetail = lazy(() => import("./pages/storefront/StorefrontProductDetail.tsx"));
const StorefrontCart = lazy(() => import("./pages/storefront/StorefrontCart.tsx"));
const StorefrontCheckout = lazy(() => import("./pages/storefront/StorefrontCheckout.tsx"));
const StorefrontLogin = lazy(() => import("./pages/storefront/StorefrontLogin.tsx"));
const StorefrontSignup = lazy(() => import("./pages/storefront/StorefrontSignup.tsx"));
const StorefrontAccount = lazy(() => import("./pages/storefront/StorefrontAccount.tsx"));
const StorefrontCompare = lazy(() => import("./pages/storefront/StorefrontCompare.tsx"));
const StorefrontContentPage = lazy(() => import("./pages/storefront/StorefrontContentPage.tsx"));
const StorefrontTrackOrder = lazy(() => import("./pages/storefront/StorefrontTrackOrder.tsx"));
const StorefrontBlog = lazy(() => import("./pages/storefront/StorefrontBlog.tsx"));
const StorefrontGiftVouchers = lazy(() => import("./pages/storefront/StorefrontGiftVouchers.tsx"));
const PrintGiftVoucher = lazy(() => import("./pages/PrintGiftVoucher.tsx"));
const WarehouseDashboard = lazy(() => import("./pages/WarehouseDashboard.tsx"));
const InventoryTransfers = lazy(() => import("./pages/InventoryTransfers.tsx"));
const ScheduledPriceChanges = lazy(() => import("./pages/ScheduledPriceChanges.tsx"));
const PrintCustomerStatement = lazy(() => import("./pages/PrintCustomerStatement.tsx"));
const Redirects = lazy(() => import("./pages/Redirects.tsx"));
const PrintBarcodeLabels = lazy(() => import("./pages/PrintBarcodeLabels.tsx"));
const PickPack = lazy(() => import("./pages/PickPack.tsx"));
const StorefrontContact = lazy(() => import("./pages/storefront/StorefrontContact.tsx"));
const StorefrontRequestQuote = lazy(() => import("./pages/storefront/StorefrontRequestQuote.tsx"));
const StorefrontQuickOrder = lazy(() => import("./pages/storefront/StorefrontQuickOrder.tsx"));
const StorefrontWholesale = lazy(() => import("./pages/storefront/StorefrontWholesale.tsx"));
const StorefrontStoreFinder = lazy(() => import("./pages/storefront/StorefrontStoreFinder.tsx"));
const StorefrontForgotUsername = lazy(() => import("./pages/storefront/StorefrontForgotUsername.tsx"));
const PrintPaymentReceipt = lazy(() => import("./pages/PrintPaymentReceipt.tsx"));
const PrintShippingLabel = lazy(() => import("./pages/PrintShippingLabel.tsx"));
const Quotes = lazy(() => import("./pages/Quotes.tsx"));
const PrintQuote = lazy(() => import("./pages/PrintQuote.tsx"));
const Layby = lazy(() => import("./pages/Layby.tsx"));
const Webhooks = lazy(() => import("./pages/Webhooks.tsx"));
const MediaLibrary = lazy(() => import("./pages/MediaLibrary.tsx"));
const ContentBlocks = lazy(() => import("./pages/ContentBlocks.tsx"));
const ContentZones = lazy(() => import("./pages/ContentZones.tsx"));
const Backorders = lazy(() => import("./pages/Backorders.tsx"));
const StaffActivity = lazy(() => import("./pages/StaffActivity.tsx"));
const ApiKeys = lazy(() => import("./pages/ApiKeys.tsx"));
const RolePermissions = lazy(() => import("./pages/RolePermissions.tsx"));
const Adverts = lazy(() => import("./pages/Adverts.tsx"));
const Sessions = lazy(() => import("./pages/Sessions.tsx"));
const EmailTemplates = lazy(() => import("./pages/EmailTemplates.tsx"));
const LoyaltyProgram = lazy(() => import("./pages/LoyaltyProgram.tsx"));
const ReportBuilder = lazy(() => import("./pages/ReportBuilder.tsx"));
const POS = lazy(() => import("./pages/POS.tsx"));
const Affiliates = lazy(() => import("./pages/Affiliates.tsx"));
const Currencies = lazy(() => import("./pages/Currencies.tsx"));
const Addons = lazy(() => import("./pages/Addons.tsx"));
const ApiDocs = lazy(() => import("./pages/ApiDocs.tsx"));
const PrintReturnLabel = lazy(() => import("./pages/PrintReturnLabel.tsx"));
const AccountingIntegration = lazy(() => import("./pages/AccountingIntegration.tsx"));
const Integrations = lazy(() => import("./pages/Integrations.tsx"));
const Multimarket = lazy(() => import("./pages/Multimarket.tsx"));
const Marketplaces = lazy(() => import("./pages/Marketplaces.tsx"));
const Subscriptions = lazy(() => import("./pages/Subscriptions.tsx"));
const DigitalDownloads = lazy(() => import("./pages/DigitalDownloads.tsx"));
const InventoryForecasting = lazy(() => import("./pages/InventoryForecasting.tsx"));
const SavedCarts = lazy(() => import("./pages/SavedCarts.tsx"));
const EmailAutomations = lazy(() => import("./pages/EmailAutomations.tsx"));
const PriceRules = lazy(() => import("./pages/PriceRules.tsx"));
const GoLiveChecklist = lazy(() => import("./pages/GoLiveChecklist.tsx"));
const InventoryReports = lazy(() => import("./pages/InventoryReports.tsx"));
const CarrierManifest = lazy(() => import("./pages/CarrierManifest.tsx"));
const PriceLists = lazy(() => import("./pages/PriceLists.tsx"));
const StoreLocator = lazy(() => import("./pages/StoreLocator.tsx"));
const Notifications = lazy(() => import("./pages/Notifications.tsx"));
const CreditNotes = lazy(() => import("./pages/CreditNotes.tsx"));
const BatchInvoicePrint = lazy(() => import("./pages/BatchInvoicePrint.tsx"));
const OrderHolds = lazy(() => import("./pages/OrderHolds.tsx"));
const CustomerSegments = lazy(() => import("./pages/CustomerSegments.tsx"));
const CustomFields = lazy(() => import("./pages/CustomFields.tsx"));
const Refunds = lazy(() => import("./pages/Refunds.tsx"));
const SalesChannels = lazy(() => import("./pages/SalesChannels.tsx"));
const MaropostMigration = lazy(() => import("./pages/MaropostMigration.tsx"));
const MaropostTransferAudit = lazy(() => import("./pages/MaropostTransferAudit.tsx"));
const MaropostApiLog = lazy(() => import("./pages/MaropostApiLog.tsx"));
const MaropostLearning = lazy(() => import("./pages/MaropostLearning.tsx"));
const MaropostThemeLearning = lazy(() => import("./pages/MaropostThemeLearning.tsx"));
// Platform admin pages
const PlatformLogin = lazy(() => import("./pages/platform/PlatformLogin.tsx"));
const PlatformDashboard = lazy(() => import("./pages/platform/PlatformDashboard.tsx"));
const PlatformMerchants = lazy(() => import("./pages/platform/PlatformMerchants.tsx"));
const PlatformSettings = lazy(() => import("./pages/platform/PlatformSettings.tsx"));
const PlatformCustomers = lazy(() => import("./pages/platform/PlatformCustomers.tsx"));
const PlatformAnalytics = lazy(() => import("./pages/platform/PlatformAnalytics.tsx"));

// Suspense fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="space-y-4 w-full max-w-md px-4">
      <Skeleton className="h-8 w-48 mx-auto" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Check if we're on a store subdomain
const isSubdomainMode = !!getSubdomainSlug();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <MigrationProvider>
          <CartProvider>
          <WishlistProvider>
          <CompareProvider>
            <MigrationProgressWidget />
            <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
            <Routes>
              {isSubdomainMode ? (
                <>
                  {/* Subdomain mode: root serves the storefront */}
                  <Route path="/" element={<StorefrontHome />} />
                  <Route path="/products" element={<StorefrontProducts />} />
                  <Route path="/product/:productId" element={<StorefrontProductDetail />} />
                  <Route path="/cart" element={<StorefrontCart />} />
                  <Route path="/compare" element={<StorefrontCompare />} />
                  <Route path="/checkout" element={<StorefrontCheckout />} />
                  <Route path="/login" element={<StorefrontLogin />} />
                  <Route path="/signup" element={<StorefrontSignup />} />
                  <Route path="/wishlist" element={<StorefrontWishlist />} />
                  <Route path="/account" element={<StorefrontAccount />} />
                  <Route path="/page/:pageSlug" element={<StorefrontContentPage />} />
                  <Route path="/blog" element={<StorefrontBlog />} />
                  <Route path="/track-order" element={<StorefrontTrackOrder />} />
                  <Route path="/gift-vouchers" element={<StorefrontGiftVouchers />} />
                  <Route path="/gift-vouchers/print/:code" element={<PrintGiftVoucher />} />
                  <Route path="/contact" element={<StorefrontContact />} />
                  <Route path="/request-quote" element={<StorefrontRequestQuote />} />
                  <Route path="/quick-order" element={<StorefrontQuickOrder />} />
                  <Route path="/wholesale" element={<StorefrontWholesale />} />
                  <Route path="/store-finder" element={<StorefrontStoreFinder />} />
                  <Route path="/forgot-username" element={<StorefrontForgotUsername />} />

                  {/* Merchant Control Panel (/_cpanel) */}
                  <Route path="/_cpanel" element={<Login />} />
                  <Route path="/_cpanel/forgot-password" element={<ForgotPassword />} />
                  <Route path="/_cpanel/reset-password" element={<ResetPassword />} />
                  <Route path="/_cpanel/signup" element={<Signup />} />
                  <Route path="/_cpanel/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
                  <Route path="/_cpanel/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
                  <Route path="/_cpanel/products" element={<RequireAuth><Products /></RequireAuth>} />
                  <Route path="/_cpanel/products/new" element={<RequireAuth><ProductForm /></RequireAuth>} />
                  <Route path="/_cpanel/products/:id" element={<RequireAuth><ProductForm /></RequireAuth>} />
                  <Route path="/_cpanel/categories" element={<RequireAuth><Categories /></RequireAuth>} />
                  <Route path="/_cpanel/smart-collections" element={<RequireAuth><SmartCollections /></RequireAuth>} />
                  <Route path="/_cpanel/inventory" element={<RequireAuth><Inventory /></RequireAuth>} />
                  <Route path="/_cpanel/orders" element={<RequireAuth><Orders /></RequireAuth>} />
                  <Route path="/_cpanel/orders/:id" element={<RequireAuth><OrderDetail /></RequireAuth>} />
                  <Route path="/_cpanel/orders/:id/print" element={<RequireAuth><PrintInvoice /></RequireAuth>} />
                  <Route path="/_cpanel/orders/:id/receipt/:paymentId" element={<RequireAuth><PrintPaymentReceipt /></RequireAuth>} />
                  <Route path="/_cpanel/orders/:id/shipping-label" element={<RequireAuth><PrintShippingLabel /></RequireAuth>} />
                  <Route path="/_cpanel/orders/:id/shipping-label/:shipmentId" element={<RequireAuth><PrintShippingLabel /></RequireAuth>} />
                  <Route path="/_cpanel/orders/:id/packing-slip" element={<RequireAuth><PrintPackingSlip /></RequireAuth>} />
                  <Route path="/_cpanel/pick-list" element={<RequireAuth><PrintPickList /></RequireAuth>} />
                  <Route path="/_cpanel/purchase-orders/:id/print" element={<RequireAuth><PrintPurchaseOrder /></RequireAuth>} />
                  <Route path="/_cpanel/customers" element={<RequireAuth><Customers /></RequireAuth>} />
                  <Route path="/_cpanel/customers/:id" element={<RequireAuth><CustomerDetail /></RequireAuth>} />
                  <Route path="/_cpanel/customers/:id/statement" element={<RequireAuth><PrintCustomerStatement /></RequireAuth>} />
                  <Route path="/_cpanel/barcode-labels" element={<RequireAuth><PrintBarcodeLabels /></RequireAuth>} />
                  <Route path="/_cpanel/marketing" element={<RequireAuth><Marketing /></RequireAuth>} />
                  <Route path="/_cpanel/coupons" element={<RequireAuth><Coupons /></RequireAuth>} />
                  <Route path="/_cpanel/returns" element={<RequireAuth><Returns /></RequireAuth>} />
                  <Route path="/_cpanel/reviews" element={<RequireAuth><Reviews /></RequireAuth>} />
                  <Route path="/_cpanel/analytics" element={<RequireAuth><Analytics /></RequireAuth>} />
                  <Route path="/_cpanel/activity-log" element={<RequireAuth><ActivityLog /></RequireAuth>} />
                  <Route path="/_cpanel/products/import" element={<RequireAuth><ImportWizard /></RequireAuth>} />
                  <Route path="/_cpanel/products/export" element={<RequireAuth><ExportWizard /></RequireAuth>} />
                  <Route path="/_cpanel/templates" element={<RequireAuth><Templates /></RequireAuth>} />
                  <Route path="/_cpanel/theme-files" element={<RequireAuth><ThemeFiles /></RequireAuth>} />
                  <Route path="/_cpanel/feature-audit" element={<RequireAuth><FeatureAudit /></RequireAuth>} />
                   <Route path="/_cpanel/template-reference" element={<RequireAuth><TemplateReference /></RequireAuth>} />
                  <Route path="/_cpanel/suppliers" element={<RequireAuth><Suppliers /></RequireAuth>} />
                  <Route path="/_cpanel/gift-vouchers" element={<RequireAuth><GiftVouchers /></RequireAuth>} />
                  <Route path="/_cpanel/content-pages" element={<RequireAuth><ContentPages /></RequireAuth>} />
                  <Route path="/_cpanel/purchase-orders" element={<RequireAuth><PurchaseOrders /></RequireAuth>} />
                  <Route path="/_cpanel/shipping-zones" element={<RequireAuth><ShippingZones /></RequireAuth>} />
                  <Route path="/_cpanel/layby" element={<RequireAuth><Layby /></RequireAuth>} />
                  <Route path="/_cpanel/tax-rates" element={<RequireAuth><TaxRates /></RequireAuth>} />
                  <Route path="/_cpanel/stock-adjustments" element={<RequireAuth><StockAdjustments /></RequireAuth>} />
                  <Route path="/_cpanel/stocktake" element={<RequireAuth><Stocktake /></RequireAuth>} />
                  <Route path="/_cpanel/abandoned-carts" element={<RequireAuth><AbandonedCarts /></RequireAuth>} />
                   <Route path="/_cpanel/warehouse" element={<RequireAuth><WarehouseDashboard /></RequireAuth>} />
                   <Route path="/_cpanel/inventory-transfers" element={<RequireAuth><InventoryTransfers /></RequireAuth>} />
                   <Route path="/_cpanel/scheduled-prices" element={<RequireAuth><ScheduledPriceChanges /></RequireAuth>} />
                  <Route path="/_cpanel/quotes" element={<RequireAuth><Quotes /></RequireAuth>} />
                  <Route path="/_cpanel/quotes/:id/print" element={<RequireAuth><PrintQuote /></RequireAuth>} />
                  <Route path="/_cpanel/redirects" element={<RequireAuth><Redirects /></RequireAuth>} />
                  <Route path="/_cpanel/webhooks" element={<RequireAuth><Webhooks /></RequireAuth>} />
                  <Route path="/_cpanel/media" element={<RequireAuth><MediaLibrary /></RequireAuth>} />
                  <Route path="/_cpanel/content-blocks" element={<RequireAuth><ContentBlocks /></RequireAuth>} />
                  <Route path="/_cpanel/content-zones" element={<RequireAuth><ContentZones /></RequireAuth>} />
                  <Route path="/_cpanel/backorders" element={<RequireAuth><Backorders /></RequireAuth>} />
                  <Route path="/_cpanel/staff-activity" element={<RequireAuth><StaffActivity /></RequireAuth>} />
                  <Route path="/_cpanel/api-keys" element={<RequireAuth><ApiKeys /></RequireAuth>} />
                  <Route path="/_cpanel/permissions" element={<RequireAuth><RolePermissions /></RequireAuth>} />
                  <Route path="/_cpanel/pick-pack" element={<RequireAuth><PickPack /></RequireAuth>} />
                  <Route path="/_cpanel/adverts" element={<RequireAuth><Adverts /></RequireAuth>} />
                  <Route path="/_cpanel/carrier-manifest" element={<RequireAuth><CarrierManifest /></RequireAuth>} />
                  <Route path="/_cpanel/sessions" element={<RequireAuth><Sessions /></RequireAuth>} />
                   <Route path="/_cpanel/email-templates" element={<RequireAuth><EmailTemplates /></RequireAuth>} />
                   <Route path="/_cpanel/loyalty" element={<RequireAuth><LoyaltyProgram /></RequireAuth>} />
                   <Route path="/_cpanel/report-builder" element={<RequireAuth><ReportBuilder /></RequireAuth>} />
                   <Route path="/_cpanel/pos" element={<RequireAuth><POS /></RequireAuth>} />
                   <Route path="/_cpanel/affiliates" element={<RequireAuth><Affiliates /></RequireAuth>} />
                   <Route path="/_cpanel/currencies" element={<RequireAuth><Currencies /></RequireAuth>} />
                   <Route path="/_cpanel/addons" element={<RequireAuth><Addons /></RequireAuth>} />
                   <Route path="/_cpanel/api-docs" element={<RequireAuth><ApiDocs /></RequireAuth>} />
                   <Route path="/_cpanel/accounting" element={<RequireAuth><AccountingIntegration /></RequireAuth>} />
                   <Route path="/_cpanel/returns/:returnId/label" element={<RequireAuth><PrintReturnLabel /></RequireAuth>} />
                   <Route path="/_cpanel/multimarket" element={<RequireAuth><Multimarket /></RequireAuth>} />
                   <Route path="/_cpanel/marketplaces" element={<RequireAuth><Marketplaces /></RequireAuth>} />
                   <Route path="/_cpanel/subscriptions" element={<RequireAuth><Subscriptions /></RequireAuth>} />
                   <Route path="/_cpanel/digital-downloads" element={<RequireAuth><DigitalDownloads /></RequireAuth>} />
                   <Route path="/_cpanel/inventory-forecasting" element={<RequireAuth><InventoryForecasting /></RequireAuth>} />
                   <Route path="/_cpanel/saved-carts" element={<RequireAuth><SavedCarts /></RequireAuth>} />
                   <Route path="/_cpanel/email-automations" element={<RequireAuth><EmailAutomations /></RequireAuth>} />
                   <Route path="/_cpanel/order-workflows" element={<RequireAuth><OrderWorkflows /></RequireAuth>} />
                   <Route path="/_cpanel/price-rules" element={<RequireAuth><PriceRules /></RequireAuth>} />
                   <Route path="/_cpanel/go-live" element={<RequireAuth><GoLiveChecklist /></RequireAuth>} />
                   <Route path="/_cpanel/inventory-reports" element={<RequireAuth><InventoryReports /></RequireAuth>} />
                   <Route path="/_cpanel/integrations" element={<RequireAuth><Integrations /></RequireAuth>} />
                   <Route path="/_cpanel/price-lists" element={<RequireAuth><PriceLists /></RequireAuth>} />
                   <Route path="/_cpanel/store-locator" element={<RequireAuth><StoreLocator /></RequireAuth>} />
                   <Route path="/_cpanel/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
                   <Route path="/_cpanel/credit-notes" element={<RequireAuth><CreditNotes /></RequireAuth>} />
                   <Route path="/_cpanel/batch-invoices" element={<RequireAuth><BatchInvoicePrint /></RequireAuth>} />
                   <Route path="/_cpanel/order-holds" element={<RequireAuth><OrderHolds /></RequireAuth>} />
                   <Route path="/_cpanel/customer-segments" element={<RequireAuth><CustomerSegments /></RequireAuth>} />
                   <Route path="/_cpanel/custom-fields" element={<RequireAuth><CustomFields /></RequireAuth>} />
                   <Route path="/_cpanel/refunds" element={<RequireAuth><Refunds /></RequireAuth>} />
                   <Route path="/_cpanel/sales-channels" element={<RequireAuth><SalesChannels /></RequireAuth>} />
                   <Route path="/_cpanel/maropost-migration" element={<RequireAuth><MaropostMigration /></RequireAuth>} />
                   <Route path="/_cpanel/maropost-transfer-audit" element={<RequireAuth><MaropostTransferAudit /></RequireAuth>} />
                   <Route path="/_cpanel/maropost-api-log" element={<RequireAuth><MaropostApiLog /></RequireAuth>} />
                   <Route path="/_cpanel/maropost-learning" element={<RequireAuth><MaropostLearning /></RequireAuth>} />
                   <Route path="/_cpanel/maropost-theme-learning" element={<RequireAuth><MaropostThemeLearning /></RequireAuth>} />
                   <Route path="/_cpanel/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />

                  <Route path="*" element={<NotFound />} />
                </>
              ) : (
                <>
                  {/* Platform mode: getcelora.com */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  {/* Platform Admin Routes (/platform/*) */}
                  <Route path="/platform" element={<PlatformLogin />} />
                  <Route path="/platform/dashboard" element={<RequirePlatformAdmin><PlatformDashboard /></RequirePlatformAdmin>} />
                  <Route path="/platform/merchants" element={<RequirePlatformAdmin><PlatformMerchants /></RequirePlatformAdmin>} />
                  <Route path="/platform/settings" element={<RequirePlatformAdmin><PlatformSettings /></RequirePlatformAdmin>} />
                  <Route path="/platform/customers" element={<RequirePlatformAdmin><PlatformCustomers /></RequirePlatformAdmin>} />
                  <Route path="/platform/analytics" element={<RequirePlatformAdmin><PlatformAnalytics /></RequirePlatformAdmin>} />

                  {/* Merchant Routes (dev/preview fallback) */}
                  <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
                  <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
                  <Route path="/products" element={<RequireAuth><Products /></RequireAuth>} />
                  <Route path="/products/new" element={<RequireAuth><ProductForm /></RequireAuth>} />
                  <Route path="/products/:id" element={<RequireAuth><ProductForm /></RequireAuth>} />
                  <Route path="/categories" element={<RequireAuth><Categories /></RequireAuth>} />
                  <Route path="/smart-collections" element={<RequireAuth><SmartCollections /></RequireAuth>} />
                  <Route path="/inventory" element={<RequireAuth><Inventory /></RequireAuth>} />
                  <Route path="/orders" element={<RequireAuth><Orders /></RequireAuth>} />
                  <Route path="/orders/:id" element={<RequireAuth><OrderDetail /></RequireAuth>} />
                  <Route path="/orders/:id/print" element={<RequireAuth><PrintInvoice /></RequireAuth>} />
                  <Route path="/orders/:id/receipt/:paymentId" element={<RequireAuth><PrintPaymentReceipt /></RequireAuth>} />
                  <Route path="/orders/:id/shipping-label" element={<RequireAuth><PrintShippingLabel /></RequireAuth>} />
                  <Route path="/orders/:id/shipping-label/:shipmentId" element={<RequireAuth><PrintShippingLabel /></RequireAuth>} />
                  <Route path="/orders/:id/packing-slip" element={<RequireAuth><PrintPackingSlip /></RequireAuth>} />
                  <Route path="/pick-list" element={<RequireAuth><PrintPickList /></RequireAuth>} />
                  <Route path="/purchase-orders/:id/print" element={<RequireAuth><PrintPurchaseOrder /></RequireAuth>} />
                  <Route path="/customers" element={<RequireAuth><Customers /></RequireAuth>} />
                  <Route path="/customers/:id" element={<RequireAuth><CustomerDetail /></RequireAuth>} />
                  <Route path="/customers/:id/statement" element={<RequireAuth><PrintCustomerStatement /></RequireAuth>} />
                  <Route path="/barcode-labels" element={<RequireAuth><PrintBarcodeLabels /></RequireAuth>} />
                  <Route path="/marketing" element={<RequireAuth><Marketing /></RequireAuth>} />
                  <Route path="/coupons" element={<RequireAuth><Coupons /></RequireAuth>} />
                  <Route path="/returns" element={<RequireAuth><Returns /></RequireAuth>} />
                  <Route path="/reviews" element={<RequireAuth><Reviews /></RequireAuth>} />
                  <Route path="/analytics" element={<RequireAuth><Analytics /></RequireAuth>} />
                  <Route path="/activity-log" element={<RequireAuth><ActivityLog /></RequireAuth>} />
                  <Route path="/products/import" element={<RequireAuth><ImportWizard /></RequireAuth>} />
                  <Route path="/products/export" element={<RequireAuth><ExportWizard /></RequireAuth>} />
                  <Route path="/templates" element={<RequireAuth><Templates /></RequireAuth>} />
                  <Route path="/theme-files" element={<RequireAuth><ThemeFiles /></RequireAuth>} />
                   <Route path="/feature-audit" element={<RequireAuth><FeatureAudit /></RequireAuth>} />
                   <Route path="/template-reference" element={<RequireAuth><TemplateReference /></RequireAuth>} />
                  <Route path="/suppliers" element={<RequireAuth><Suppliers /></RequireAuth>} />
                  <Route path="/gift-vouchers" element={<RequireAuth><GiftVouchers /></RequireAuth>} />
                  <Route path="/content-pages" element={<RequireAuth><ContentPages /></RequireAuth>} />
                  <Route path="/purchase-orders" element={<RequireAuth><PurchaseOrders /></RequireAuth>} />
                  <Route path="/shipping-zones" element={<RequireAuth><ShippingZones /></RequireAuth>} />
                  <Route path="/layby" element={<RequireAuth><Layby /></RequireAuth>} />
                  <Route path="/tax-rates" element={<RequireAuth><TaxRates /></RequireAuth>} />
                  <Route path="/stock-adjustments" element={<RequireAuth><StockAdjustments /></RequireAuth>} />
                  <Route path="/stocktake" element={<RequireAuth><Stocktake /></RequireAuth>} />
                  <Route path="/abandoned-carts" element={<RequireAuth><AbandonedCarts /></RequireAuth>} />
                   <Route path="/warehouse" element={<RequireAuth><WarehouseDashboard /></RequireAuth>} />
                   <Route path="/inventory-transfers" element={<RequireAuth><InventoryTransfers /></RequireAuth>} />
                   <Route path="/scheduled-prices" element={<RequireAuth><ScheduledPriceChanges /></RequireAuth>} />
                  <Route path="/quotes" element={<RequireAuth><Quotes /></RequireAuth>} />
                  <Route path="/quotes/:id/print" element={<RequireAuth><PrintQuote /></RequireAuth>} />
                  <Route path="/redirects" element={<RequireAuth><Redirects /></RequireAuth>} />
                  <Route path="/webhooks" element={<RequireAuth><Webhooks /></RequireAuth>} />
                  <Route path="/media" element={<RequireAuth><MediaLibrary /></RequireAuth>} />
                  <Route path="/content-blocks" element={<RequireAuth><ContentBlocks /></RequireAuth>} />
                  <Route path="/content-zones" element={<RequireAuth><ContentZones /></RequireAuth>} />
                  <Route path="/backorders" element={<RequireAuth><Backorders /></RequireAuth>} />
                  <Route path="/staff-activity" element={<RequireAuth><StaffActivity /></RequireAuth>} />
                  <Route path="/api-keys" element={<RequireAuth><ApiKeys /></RequireAuth>} />
                  <Route path="/permissions" element={<RequireAuth><RolePermissions /></RequireAuth>} />
                  <Route path="/pick-pack" element={<RequireAuth><PickPack /></RequireAuth>} />
                  <Route path="/adverts" element={<RequireAuth><Adverts /></RequireAuth>} />
                  <Route path="/carrier-manifest" element={<RequireAuth><CarrierManifest /></RequireAuth>} />
                  <Route path="/sessions" element={<RequireAuth><Sessions /></RequireAuth>} />
                  <Route path="/email-templates" element={<RequireAuth><EmailTemplates /></RequireAuth>} />
                  <Route path="/loyalty" element={<RequireAuth><LoyaltyProgram /></RequireAuth>} />
                  <Route path="/report-builder" element={<RequireAuth><ReportBuilder /></RequireAuth>} />
                  <Route path="/pos" element={<RequireAuth><POS /></RequireAuth>} />
                  <Route path="/affiliates" element={<RequireAuth><Affiliates /></RequireAuth>} />
                  <Route path="/currencies" element={<RequireAuth><Currencies /></RequireAuth>} />
                  <Route path="/addons" element={<RequireAuth><Addons /></RequireAuth>} />
                   <Route path="/api-docs" element={<RequireAuth><ApiDocs /></RequireAuth>} />
                   <Route path="/accounting" element={<RequireAuth><AccountingIntegration /></RequireAuth>} />
                   <Route path="/returns/:returnId/label" element={<RequireAuth><PrintReturnLabel /></RequireAuth>} />
                   <Route path="/integrations" element={<RequireAuth><Integrations /></RequireAuth>} />
                   <Route path="/multimarket" element={<RequireAuth><Multimarket /></RequireAuth>} />
                   <Route path="/marketplaces" element={<RequireAuth><Marketplaces /></RequireAuth>} />
                   <Route path="/subscriptions" element={<RequireAuth><Subscriptions /></RequireAuth>} />
                   <Route path="/digital-downloads" element={<RequireAuth><DigitalDownloads /></RequireAuth>} />
                   <Route path="/inventory-forecasting" element={<RequireAuth><InventoryForecasting /></RequireAuth>} />
                   <Route path="/saved-carts" element={<RequireAuth><SavedCarts /></RequireAuth>} />
                   <Route path="/email-automations" element={<RequireAuth><EmailAutomations /></RequireAuth>} />
                   <Route path="/order-workflows" element={<RequireAuth><OrderWorkflows /></RequireAuth>} />
                   <Route path="/price-rules" element={<RequireAuth><PriceRules /></RequireAuth>} />
                   <Route path="/go-live" element={<RequireAuth><GoLiveChecklist /></RequireAuth>} />
                   <Route path="/inventory-reports" element={<RequireAuth><InventoryReports /></RequireAuth>} />
                   <Route path="/price-lists" element={<RequireAuth><PriceLists /></RequireAuth>} />
                   <Route path="/store-locator" element={<RequireAuth><StoreLocator /></RequireAuth>} />
                   <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
                   <Route path="/credit-notes" element={<RequireAuth><CreditNotes /></RequireAuth>} />
                   <Route path="/batch-invoices" element={<RequireAuth><BatchInvoicePrint /></RequireAuth>} />
                   <Route path="/order-holds" element={<RequireAuth><OrderHolds /></RequireAuth>} />
                   <Route path="/customer-segments" element={<RequireAuth><CustomerSegments /></RequireAuth>} />
                   <Route path="/custom-fields" element={<RequireAuth><CustomFields /></RequireAuth>} />
                   <Route path="/refunds" element={<RequireAuth><Refunds /></RequireAuth>} />
                   <Route path="/sales-channels" element={<RequireAuth><SalesChannels /></RequireAuth>} />
                   <Route path="/maropost-migration" element={<RequireAuth><MaropostMigration /></RequireAuth>} />
                   <Route path="/maropost-transfer-audit" element={<RequireAuth><MaropostTransferAudit /></RequireAuth>} />
                   <Route path="/maropost-api-log" element={<RequireAuth><MaropostApiLog /></RequireAuth>} />
                   <Route path="/maropost-learning" element={<RequireAuth><MaropostLearning /></RequireAuth>} />
                   <Route path="/maropost-theme-learning" element={<RequireAuth><MaropostThemeLearning /></RequireAuth>} />
                   <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />

                  {/* Public Storefront (path-based for dev/preview) */}
                  <Route path="/store/:storeSlug" element={<StorefrontHome />} />
                  <Route path="/store/:storeSlug/products" element={<StorefrontProducts />} />
                  <Route path="/store/:storeSlug/product/:productId" element={<StorefrontProductDetail />} />
                  <Route path="/store/:storeSlug/cart" element={<StorefrontCart />} />
                  <Route path="/store/:storeSlug/compare" element={<StorefrontCompare />} />
                  <Route path="/store/:storeSlug/checkout" element={<StorefrontCheckout />} />
                  <Route path="/store/:storeSlug/login" element={<StorefrontLogin />} />
                  <Route path="/store/:storeSlug/signup" element={<StorefrontSignup />} />
                  <Route path="/store/:storeSlug/wishlist" element={<StorefrontWishlist />} />
                  <Route path="/store/:storeSlug/account" element={<StorefrontAccount />} />
                  <Route path="/store/:storeSlug/page/:pageSlug" element={<StorefrontContentPage />} />
                  <Route path="/store/:storeSlug/blog" element={<StorefrontBlog />} />
                  <Route path="/store/:storeSlug/track-order" element={<StorefrontTrackOrder />} />
                  <Route path="/store/:storeSlug/gift-vouchers" element={<StorefrontGiftVouchers />} />
                  <Route path="/store/:storeSlug/gift-vouchers/print/:code" element={<PrintGiftVoucher />} />
                  <Route path="/store/:storeSlug/contact" element={<StorefrontContact />} />
                  <Route path="/store/:storeSlug/request-quote" element={<StorefrontRequestQuote />} />
                  <Route path="/store/:storeSlug/quick-order" element={<StorefrontQuickOrder />} />
                  <Route path="/store/:storeSlug/wholesale" element={<StorefrontWholesale />} />
                  <Route path="/store/:storeSlug/store-finder" element={<StorefrontStoreFinder />} />
                  <Route path="/store/:storeSlug/forgot-username" element={<StorefrontForgotUsername />} />
                  <Route path="*" element={<NotFound />} />
                </>
              )}
            </Routes>
            </Suspense>
            </ErrorBoundary>
          </CompareProvider>
          </WishlistProvider>
          </CartProvider>
          </MigrationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
