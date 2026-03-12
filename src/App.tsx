import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { RequireAuth } from "@/components/auth/RequireAuth";
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
import Inventory from "./pages/Inventory.tsx";
import Orders from "./pages/Orders.tsx";
import OrderDetail from "./pages/OrderDetail.tsx";
import Customers from "./pages/Customers.tsx";
import CustomerDetail from "./pages/CustomerDetail.tsx";
import Marketing from "./pages/Marketing.tsx";
import Analytics from "./pages/Analytics.tsx";
import SettingsPage from "./pages/Settings.tsx";
import Coupons from "./pages/Coupons.tsx";
import Returns from "./pages/Returns.tsx";
import Reviews from "./pages/Reviews.tsx";
import Merchants from "./pages/Merchants.tsx";
import StorefrontHome from "./pages/storefront/StorefrontHome.tsx";
import StorefrontProducts from "./pages/storefront/StorefrontProducts.tsx";
import StorefrontProductDetail from "./pages/storefront/StorefrontProductDetail.tsx";
import StorefrontCart from "./pages/storefront/StorefrontCart.tsx";
import StorefrontCheckout from "./pages/storefront/StorefrontCheckout.tsx";
import StorefrontLogin from "./pages/storefront/StorefrontLogin.tsx";
import StorefrontSignup from "./pages/storefront/StorefrontSignup.tsx";
import StorefrontAccount from "./pages/storefront/StorefrontAccount.tsx";

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
          <CartProvider>
            <Routes>
              {isSubdomainMode ? (
                <>
                  {/* Subdomain mode: root serves the storefront */}
                  <Route path="/" element={<StorefrontHome />} />
                  <Route path="/products" element={<StorefrontProducts />} />
                  <Route path="/product/:productId" element={<StorefrontProductDetail />} />
                  <Route path="/cart" element={<StorefrontCart />} />
                  <Route path="/checkout" element={<StorefrontCheckout />} />
                  <Route path="/login" element={<StorefrontLogin />} />
                  <Route path="/signup" element={<StorefrontSignup />} />
                  <Route path="/account" element={<StorefrontAccount />} />
                  <Route path="*" element={<NotFound />} />
                </>
              ) : (
                <>
                  {/* Platform mode: admin + path-based storefronts */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
                  <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
                  <Route path="/products" element={<RequireAuth><Products /></RequireAuth>} />
                  <Route path="/products/new" element={<RequireAuth><ProductForm /></RequireAuth>} />
                  <Route path="/products/:id" element={<RequireAuth><ProductForm /></RequireAuth>} />
                  <Route path="/categories" element={<RequireAuth><Categories /></RequireAuth>} />
                  <Route path="/inventory" element={<RequireAuth><Inventory /></RequireAuth>} />
                  <Route path="/orders" element={<RequireAuth><Orders /></RequireAuth>} />
                  <Route path="/orders/:id" element={<RequireAuth><OrderDetail /></RequireAuth>} />
                  <Route path="/customers" element={<RequireAuth><Customers /></RequireAuth>} />
                  <Route path="/customers/:id" element={<RequireAuth><CustomerDetail /></RequireAuth>} />
                  <Route path="/marketing" element={<RequireAuth><Marketing /></RequireAuth>} />
                  <Route path="/coupons" element={<RequireAuth><Coupons /></RequireAuth>} />
                  <Route path="/returns" element={<RequireAuth><Returns /></RequireAuth>} />
                  <Route path="/reviews" element={<RequireAuth><Reviews /></RequireAuth>} />
                  <Route path="/analytics" element={<RequireAuth><Analytics /></RequireAuth>} />
                  <Route path="/merchants" element={<RequireAuth><Merchants /></RequireAuth>} />
                  <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
                  {/* Public Storefront (path-based) */}
                  <Route path="/store/:storeSlug" element={<StorefrontHome />} />
                  <Route path="/store/:storeSlug/products" element={<StorefrontProducts />} />
                  <Route path="/store/:storeSlug/product/:productId" element={<StorefrontProductDetail />} />
                  <Route path="/store/:storeSlug/cart" element={<StorefrontCart />} />
                  <Route path="/store/:storeSlug/checkout" element={<StorefrontCheckout />} />
                  <Route path="/store/:storeSlug/login" element={<StorefrontLogin />} />
                  <Route path="/store/:storeSlug/signup" element={<StorefrontSignup />} />
                  <Route path="/store/:storeSlug/account" element={<StorefrontAccount />} />
                  <Route path="*" element={<NotFound />} />
                </>
              )}
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
