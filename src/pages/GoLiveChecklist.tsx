import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  CheckCircle2, Circle, AlertTriangle, Rocket, Store, CreditCard, Truck,
  Mail, Shield, Globe, Package, FileText, ExternalLink, RefreshCw, Users,
  Palette, Settings2, BarChart3, Bell, Search, Zap, Lock, Eye, Image,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getSubdomainSlug } from "@/lib/subdomain";
import { toast } from "sonner";

const prefix = getSubdomainSlug() ? "/_cpanel" : "";

interface CheckItem {
  id: string;
  label: string;
  description: string;
  category: string;
  priority: "critical" | "recommended" | "optional";
  icon: React.ReactNode;
  check: () => Promise<boolean>;
  actionUrl?: string;
  actionLabel?: string;
}

export default function GoLiveChecklist() {
  const { currentStore } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState<Record<string, boolean | null>>({});
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("golive_dismissed") || "[]")); } catch { return new Set(); }
  });

  const checks: CheckItem[] = [
    // Catalog
    { id: "has_products", label: "Add at least one product", description: "Your store needs products to sell", category: "Catalog", priority: "critical", icon: <Package className="h-4 w-4" />,
      check: async () => { const { count } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("store_id", currentStore!.id).eq("status", "active"); return (count ?? 0) > 0; },
      actionUrl: `${prefix}/products/new`, actionLabel: "Add product" },
    { id: "has_categories", label: "Create product categories", description: "Organize products for easy navigation", category: "Catalog", priority: "critical", icon: <Package className="h-4 w-4" />,
      check: async () => { const { count } = await supabase.from("categories").select("id", { count: "exact", head: true }).eq("store_id", currentStore!.id); return (count ?? 0) > 0; },
      actionUrl: `${prefix}/categories`, actionLabel: "Add category" },
    { id: "has_product_images", label: "Add product images", description: "Products with images convert 3× better", category: "Catalog", priority: "recommended", icon: <Image className="h-4 w-4" />,
      check: async () => { const { data } = await supabase.from("products").select("images").eq("store_id", currentStore!.id).eq("status", "active").limit(5); return (data || []).some((p: any) => p.images && (p.images as any[]).length > 0); },
      actionUrl: `${prefix}/products`, actionLabel: "Edit products" },
    { id: "has_descriptions", label: "Write product descriptions", description: "SEO-friendly descriptions improve search ranking", category: "Catalog", priority: "recommended", icon: <FileText className="h-4 w-4" />,
      check: async () => { const { data } = await supabase.from("products").select("description").eq("store_id", currentStore!.id).eq("status", "active").limit(5); return (data || []).some((p: any) => p.description && p.description.length > 20); },
      actionUrl: `${prefix}/products`, actionLabel: "Edit products" },

    // Payments
    { id: "has_payment", label: "Configure a payment gateway", description: "Accept payments from customers", category: "Payments", priority: "critical", icon: <CreditCard className="h-4 w-4" />,
      check: async () => { const { count } = await supabase.from("payment_gateways" as any).select("id", { count: "exact", head: true }).eq("store_id", currentStore!.id).eq("is_active", true); return (count ?? 0) > 0; },
      actionUrl: `${prefix}/settings`, actionLabel: "Setup payments" },

    // Shipping
    { id: "has_shipping", label: "Set up shipping zones", description: "Define where and how you ship", category: "Shipping", priority: "critical", icon: <Truck className="h-4 w-4" />,
      check: async () => { const { count } = await supabase.from("shipping_zones").select("id", { count: "exact", head: true }).eq("store_id", currentStore!.id); return (count ?? 0) > 0; },
      actionUrl: `${prefix}/shipping-zones`, actionLabel: "Add zone" },
    { id: "has_shipping_rates", label: "Configure shipping rates", description: "Set pricing for each shipping zone", category: "Shipping", priority: "critical", icon: <Truck className="h-4 w-4" />,
      check: async () => { const { count } = await supabase.from("shipping_rates" as any).select("id", { count: "exact", head: true }).eq("store_id", currentStore!.id); return (count ?? 0) > 0; },
      actionUrl: `${prefix}/shipping-zones`, actionLabel: "Add rates" },

    // Tax
    { id: "has_tax", label: "Configure tax rates", description: "Set up tax collection for your region", category: "Tax & Legal", priority: "critical", icon: <FileText className="h-4 w-4" />,
      check: async () => { const { count } = await supabase.from("tax_rates").select("id", { count: "exact", head: true }).eq("store_id", currentStore!.id); return (count ?? 0) > 0; },
      actionUrl: `${prefix}/tax-rates`, actionLabel: "Add tax rate" },

    // Communications
    { id: "has_email_template", label: "Customize email templates", description: "Brand your order confirmation and shipping emails", category: "Communications", priority: "recommended", icon: <Mail className="h-4 w-4" />,
      check: async () => { const { count } = await supabase.from("email_templates").select("id", { count: "exact", head: true }).eq("store_id", currentStore!.id); return (count ?? 0) > 0; },
      actionUrl: `${prefix}/email-templates`, actionLabel: "Edit templates" },
    { id: "has_automation", label: "Set up email automations", description: "Automate abandoned cart recovery and follow-ups", category: "Communications", priority: "optional", icon: <Zap className="h-4 w-4" />,
      check: async () => { const { count } = await supabase.from("email_automations").select("id", { count: "exact", head: true }).eq("store_id", currentStore!.id).eq("is_active", true); return (count ?? 0) > 0; },
      actionUrl: `${prefix}/email-automations`, actionLabel: "Setup automations" },

    // Content
    { id: "has_content_pages", label: "Create essential pages", description: "Add About, Contact, Privacy Policy, and Terms pages", category: "Content", priority: "critical", icon: <FileText className="h-4 w-4" />,
      check: async () => { const { count } = await supabase.from("content_pages").select("id", { count: "exact", head: true }).eq("store_id", currentStore!.id).eq("is_published", true); return (count ?? 0) >= 2; },
      actionUrl: `${prefix}/content-pages`, actionLabel: "Add pages" },
    { id: "has_contact_page", label: "Set up contact form", description: "Allow customers to reach you easily", category: "Content", priority: "recommended", icon: <Mail className="h-4 w-4" />,
      check: async () => { const { count } = await supabase.from("content_pages").select("id", { count: "exact", head: true }).eq("store_id", currentStore!.id).eq("slug", "contact"); return (count ?? 0) > 0; },
      actionUrl: `${prefix}/content-pages`, actionLabel: "Add contact page" },

    // Branding
    { id: "store_name_set", label: "Set your store name and logo", description: "Brand your storefront with a name and logo", category: "Branding", priority: "critical", icon: <Store className="h-4 w-4" />,
      check: async () => !!(currentStore?.name && currentStore.name !== "My Store"),
      actionUrl: `${prefix}/settings`, actionLabel: "Edit settings" },
    { id: "has_theme", label: "Customize storefront theme", description: "Apply a theme or customize colors and layout", category: "Branding", priority: "recommended", icon: <Palette className="h-4 w-4" />,
      check: async () => { const { count } = await supabase.from("theme_packages" as any).select("id", { count: "exact", head: true }).eq("store_id", currentStore!.id).eq("is_active", true); return (count ?? 0) > 0; },
      actionUrl: `${prefix}/theme-files`, actionLabel: "Edit theme" },

    // Operations
    { id: "has_inventory_location", label: "Set up inventory locations", description: "Track stock across warehouses", category: "Operations", priority: "recommended", icon: <Package className="h-4 w-4" />,
      check: async () => { const { count } = await supabase.from("inventory_locations").select("id", { count: "exact", head: true }).eq("store_id", currentStore!.id); return (count ?? 0) > 0; },
      actionUrl: `${prefix}/inventory`, actionLabel: "Setup inventory" },
    { id: "has_staff", label: "Invite team members", description: "Add staff with appropriate role permissions", category: "Operations", priority: "optional", icon: <Users className="h-4 w-4" />,
      check: async () => { const { count } = await supabase.from("store_members" as any).select("id", { count: "exact", head: true }).eq("store_id", currentStore!.id); return (count ?? 0) > 1; },
      actionUrl: `${prefix}/role-permissions`, actionLabel: "Manage team" },
    { id: "has_notifications", label: "Configure admin notifications", description: "Get alerted on new orders and low stock", category: "Operations", priority: "optional", icon: <Bell className="h-4 w-4" />,
      check: async () => { const { count } = await supabase.from("store_addons" as any).select("id", { count: "exact", head: true }).eq("store_id", currentStore!.id).eq("is_active", true); return (count ?? 0) > 0; },
      actionUrl: `${prefix}/settings`, actionLabel: "Configure" },

    // Security & Launch
    { id: "ssl_ready", label: "SSL certificate active", description: "Secure your store with HTTPS", category: "Security & Launch", priority: "critical", icon: <Lock className="h-4 w-4" />,
      check: async () => true },
    { id: "has_domain", label: "Configure custom domain (optional)", description: "Use your own domain name for the storefront", category: "Security & Launch", priority: "optional", icon: <Globe className="h-4 w-4" />,
      check: async () => !!(currentStore as any)?.custom_domain },
    { id: "test_order", label: "Place a test order", description: "Verify the complete checkout flow works", category: "Security & Launch", priority: "recommended", icon: <Eye className="h-4 w-4" />,
      check: async () => { const { count } = await supabase.from("orders").select("id", { count: "exact", head: true }).eq("store_id", currentStore!.id); return (count ?? 0) > 0; } },
  ];

  const runChecks = async () => {
    if (!currentStore) return;
    setLoading(true);
    const r: Record<string, boolean | null> = {};
    await Promise.all(checks.map(async (c) => { try { r[c.id] = await c.check(); } catch { r[c.id] = null; } }));
    setResults(r);
    setLoading(false);
  };

  useEffect(() => { runChecks(); }, [currentStore]);

  const dismiss = (id: string) => {
    const next = new Set(dismissed); next.add(id); setDismissed(next);
    localStorage.setItem("golive_dismissed", JSON.stringify([...next]));
  };

  const activeChecks = checks.filter(c => !dismissed.has(c.id));
  const total = activeChecks.length;
  const passed = activeChecks.filter(c => results[c.id] === true).length;
  const failed = activeChecks.filter(c => results[c.id] === false).length;
  const percent = total > 0 ? Math.round((passed / total) * 100) : 0;

  const critical = activeChecks.filter(c => c.priority === "critical");
  const criticalPassed = critical.filter(c => results[c.id] === true).length;
  const recommended = activeChecks.filter(c => c.priority === "recommended");
  const recPassed = recommended.filter(c => results[c.id] === true).length;
  const optional = activeChecks.filter(c => c.priority === "optional");
  const optPassed = optional.filter(c => results[c.id] === true).length;

  const categories = [...new Set(activeChecks.map(c => c.category))];

  const renderCheck = (check: CheckItem) => {
    const status = results[check.id];
    return (
      <div key={check.id} className="flex items-center gap-3 py-3">
        {loading ? (
          <Circle className="h-5 w-5 text-muted-foreground/30 animate-pulse shrink-0" />
        ) : status === true ? (
          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
        ) : status === false ? (
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-medium ${status === true ? "line-through text-muted-foreground" : ""}`}>{check.label}</p>
            <Badge variant={check.priority === "critical" ? "destructive" : check.priority === "recommended" ? "default" : "secondary"} className="text-[9px] h-4">
              {check.priority}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{check.description}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {status === false && check.actionUrl && (
            <Button variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={() => navigate(check.actionUrl!)}>
              {check.actionLabel} <ExternalLink className="h-3 w-3" />
            </Button>
          )}
          {status === true && (
            <Button variant="ghost" size="sm" className="text-[10px] h-6 text-muted-foreground" onClick={() => dismiss(check.id)}>Dismiss</Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2"><Rocket className="h-5 w-5 text-primary" /> Go-Live Checklist</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Complete these steps before launching your store</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1 text-xs h-8" onClick={runChecks} disabled={loading}>
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Re-check
            </Button>
            <Badge variant={percent === 100 ? "default" : "secondary"} className="text-xs px-3 py-1">{passed}/{total}</Badge>
          </div>
        </div>

        {/* Progress */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-4 mb-3">
              <Progress value={percent} className="flex-1" />
              <span className="text-sm font-bold w-12 text-right">{percent}%</span>
            </div>
            {percent === 100 ? (
              <p className="text-sm text-primary font-medium">🎉 Your store is ready to launch!</p>
            ) : (
              <div className="flex gap-4 text-xs">
                <span className="flex items-center gap-1"><Badge variant="destructive" className="text-[9px] h-4">critical</Badge> {criticalPassed}/{critical.length}</span>
                <span className="flex items-center gap-1"><Badge variant="default" className="text-[9px] h-4">recommended</Badge> {recPassed}/{recommended.length}</span>
                <span className="flex items-center gap-1"><Badge variant="secondary" className="text-[9px] h-4">optional</Badge> {optPassed}/{optional.length}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="all">
          <TabsList className="h-8">
            <TabsTrigger value="all" className="text-xs h-7">All ({total})</TabsTrigger>
            <TabsTrigger value="todo" className="text-xs h-7">To Do ({failed})</TabsTrigger>
            <TabsTrigger value="critical" className="text-xs h-7">Critical ({critical.length})</TabsTrigger>
            <TabsTrigger value="done" className="text-xs h-7">Done ({passed})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-3 space-y-3">
            {categories.map(cat => {
              const catChecks = activeChecks.filter(c => c.category === cat);
              return (
                <Card key={cat}>
                  <CardHeader className="pb-0 pt-3"><CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{cat}</CardTitle></CardHeader>
                  <CardContent className="divide-y">{catChecks.map(renderCheck)}</CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="todo" className="mt-3">
            <Card>
              <CardContent className="divide-y pt-3">
                {activeChecks.filter(c => results[c.id] === false).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">All checks passed! 🎉</p>
                ) : activeChecks.filter(c => results[c.id] === false).map(renderCheck)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="critical" className="mt-3">
            <Card>
              <CardContent className="divide-y pt-3">
                {critical.map(renderCheck)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="done" className="mt-3">
            <Card>
              <CardContent className="divide-y pt-3">
                {activeChecks.filter(c => results[c.id] === true).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No checks passed yet.</p>
                ) : activeChecks.filter(c => results[c.id] === true).map(renderCheck)}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
