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
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Products from "./pages/Products.tsx";
import ProductForm from "./pages/ProductForm.tsx";
import Categories from "./pages/Categories.tsx";
import SmartCollections from "./pages/SmartCollections.tsx";
import Inventory from "./pages/Inventory.tsx";
import Orders from "./pages/Orders.tsx";
import OrderDetail from "./pages/OrderDetail.tsx";
import PrintInvoice from "./pages/PrintInvoice.tsx";
import PrintPickList from "./pages/PrintPickList.tsx";
import PrintPurchaseOrder from "./pages/PrintPurchaseOrder.tsx";
import PrintPackingSlip from "./pages/PrintPackingSlip.tsx";
import Customers from "./pages/Customers.tsx";
import CustomerDetail from "./pages/CustomerDetail.tsx";
import Marketing from "./pages/Marketing.tsx";
import Analytics from "./pages/Analytics.tsx";
import SettingsPage from "./pages/Settings.tsx";
import Coupons from "./pages/Coupons.tsx";
import Returns from "./pages/Returns.tsx";
import Reviews from "./pages/Reviews.tsx";
import LandingPage from "./pages/LandingPage.tsx";
import ActivityLog from "./pages/ActivityLog.tsx";
import ImportWizard from "./pages/ImportWizard.tsx";
import ExportWizard from "./pages/ExportWizard.tsx";
import Templates from "./pages/Templates.tsx";
import FeatureAudit from "./pages/FeatureAudit.tsx";
import Suppliers from "./pages/Suppliers.tsx";
import GiftVouchers from "./pages/GiftVouchers.tsx";
import ContentPages from "./pages/ContentPages.tsx";
import PurchaseOrders from "./pages/PurchaseOrders.tsx";
import ShippingZones from "./pages/ShippingZones.tsx";
import TaxRates from "./pages/TaxRates.tsx";
import StockAdjustments from "./pages/StockAdjustments.tsx";
import Stocktake from "./pages/Stocktake.tsx";
import AbandonedCarts from "./pages/AbandonedCarts.tsx";
import StorefrontWishlist from "./pages/storefront/StorefrontWishlist.tsx";
import StorefrontHome from "./pages/storefront/StorefrontHome.tsx";
import StorefrontProducts from "./pages/storefront/StorefrontProducts.tsx";
import StorefrontProductDetail from "./pages/storefront/StorefrontProductDetail.tsx";
import StorefrontCart from "./pages/storefront/StorefrontCart.tsx";
import StorefrontCheckout from "./pages/storefront/StorefrontCheckout.tsx";
import StorefrontLogin from "./pages/storefront/StorefrontLogin.tsx";
import StorefrontSignup from "./pages/storefront/StorefrontSignup.tsx";
import StorefrontAccount from "./pages/storefront/StorefrontAccount.tsx";
import StorefrontCompare from "./pages/storefront/StorefrontCompare.tsx";
import StorefrontContentPage from "./pages/storefront/StorefrontContentPage.tsx";
import StorefrontTrackOrder from "./pages/storefront/StorefrontTrackOrder.tsx";
import StorefrontBlog from "./pages/storefront/StorefrontBlog.tsx";
import StorefrontGiftVouchers from "./pages/storefront/StorefrontGiftVouchers.tsx";
import PrintGiftVoucher from "./pages/PrintGiftVoucher.tsx";
import WarehouseDashboard from "./pages/WarehouseDashboard.tsx";
import PrintCustomerStatement from "./pages/PrintCustomerStatement.tsx";
import Redirects from "./pages/Redirects.tsx";
import PrintBarcodeLabels from "./pages/PrintBarcodeLabels.tsx";
import PickPack from "./pages/PickPack.tsx";
import StorefrontContact from "./pages/storefront/StorefrontContact.tsx";
import StorefrontRequestQuote from "./pages/storefront/StorefrontRequestQuote.tsx";
import StorefrontQuickOrder from "./pages/storefront/StorefrontQuickOrder.tsx";
import StorefrontWholesale from "./pages/storefront/StorefrontWholesale.tsx";
import StorefrontStoreFinder from "./pages/storefront/StorefrontStoreFinder.tsx";
import StorefrontForgotUsername from "./pages/storefront/StorefrontForgotUsername.tsx";
import PrintPaymentReceipt from "./pages/PrintPaymentReceipt.tsx";
import PrintShippingLabel from "./pages/PrintShippingLabel.tsx";
import Quotes from "./pages/Quotes.tsx";
import PrintQuote from "./pages/PrintQuote.tsx";
import Layby from "./pages/Layby.tsx";
import Webhooks from "./pages/Webhooks.tsx";
import MediaLibrary from "./pages/MediaLibrary.tsx";
import ContentBlocks from "./pages/ContentBlocks.tsx";
import Backorders from "./pages/Backorders.tsx";
import StaffActivity from "./pages/StaffActivity.tsx";
import ApiKeys from "./pages/ApiKeys.tsx";
import RolePermissions from "./pages/RolePermissions.tsx";
import Adverts from "./pages/Adverts.tsx";
import Sessions from "./pages/Sessions.tsx";
import EmailTemplates from "./pages/EmailTemplates.tsx";
import LoyaltyProgram from "./pages/LoyaltyProgram.tsx";
import ReportBuilder from "./pages/ReportBuilder.tsx";
import POS from "./pages/POS.tsx";
import Affiliates from "./pages/Affiliates.tsx";
import Currencies from "./pages/Currencies.tsx";
import Addons from "./pages/Addons.tsx";
import ApiDocs from "./pages/ApiDocs.tsx";
import PrintReturnLabel from "./pages/PrintReturnLabel.tsx";
import AccountingIntegration from "./pages/AccountingIntegration.tsx";
import Integrations from "./pages/Integrations.tsx";
import Multimarket from "./pages/Multimarket.tsx";
import Marketplaces from "./pages/Marketplaces.tsx";
import Subscriptions from "./pages/Subscriptions.tsx";
import DigitalDownloads from "./pages/DigitalDownloads.tsx";
import InventoryForecasting from "./pages/InventoryForecasting.tsx";
import SavedCarts from "./pages/SavedCarts.tsx";
import EmailAutomations from "./pages/EmailAutomations.tsx";
import PriceRules from "./pages/PriceRules.tsx";
import GoLiveChecklist from "./pages/GoLiveChecklist.tsx";
import InventoryReports from "./pages/InventoryReports.tsx";
import CarrierManifest from "./pages/CarrierManifest.tsx";
import PriceLists from "./pages/PriceLists.tsx";
import StoreLocator from "./pages/StoreLocator.tsx";
import Notifications from "./pages/Notifications.tsx";
import CreditNotes from "./pages/CreditNotes.tsx";
import BatchInvoicePrint from "./pages/BatchInvoicePrint.tsx";
import OrderHolds from "./pages/OrderHolds.tsx";
import CustomerSegments from "./pages/CustomerSegments.tsx";
import CustomFields from "./pages/CustomFields.tsx";
import Refunds from "./pages/Refunds.tsx";
import SalesChannels from "./pages/SalesChannels.tsx";
import MaropostMigration from "./pages/MaropostMigration.tsx";
import MaropostTransferAudit from "./pages/MaropostTransferAudit.tsx";
// Platform admin pages
import PlatformLogin from "./pages/platform/PlatformLogin.tsx";
import PlatformDashboard from "./pages/platform/PlatformDashboard.tsx";
import PlatformMerchants from "./pages/platform/PlatformMerchants.tsx";
import PlatformSettings from "./pages/platform/PlatformSettings.tsx";
import PlatformCustomers from "./pages/platform/PlatformCustomers.tsx";
import PlatformAnalytics from "./pages/platform/PlatformAnalytics.tsx";
const queryClient = new QueryClient();

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
                  <Route path="/_cpanel/feature-audit" element={<RequireAuth><FeatureAudit /></RequireAuth>} />
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
                  <Route path="/_cpanel/quotes" element={<RequireAuth><Quotes /></RequireAuth>} />
                  <Route path="/_cpanel/quotes/:id/print" element={<RequireAuth><PrintQuote /></RequireAuth>} />
                  <Route path="/_cpanel/redirects" element={<RequireAuth><Redirects /></RequireAuth>} />
                  <Route path="/_cpanel/webhooks" element={<RequireAuth><Webhooks /></RequireAuth>} />
                  <Route path="/_cpanel/media" element={<RequireAuth><MediaLibrary /></RequireAuth>} />
                  <Route path="/_cpanel/content-blocks" element={<RequireAuth><ContentBlocks /></RequireAuth>} />
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
                  <Route path="/feature-audit" element={<RequireAuth><FeatureAudit /></RequireAuth>} />
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
                  <Route path="/quotes" element={<RequireAuth><Quotes /></RequireAuth>} />
                  <Route path="/quotes/:id/print" element={<RequireAuth><PrintQuote /></RequireAuth>} />
                  <Route path="/redirects" element={<RequireAuth><Redirects /></RequireAuth>} />
                  <Route path="/webhooks" element={<RequireAuth><Webhooks /></RequireAuth>} />
                  <Route path="/media" element={<RequireAuth><MediaLibrary /></RequireAuth>} />
                  <Route path="/content-blocks" element={<RequireAuth><ContentBlocks /></RequireAuth>} />
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
          </CompareProvider>
          </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
