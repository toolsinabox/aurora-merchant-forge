import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  CheckCircle2, Circle, AlertTriangle, Rocket, Store, CreditCard, Truck,
  Mail, Shield, Globe, Package, FileText, ExternalLink,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { getSubdomainSlug } from "@/lib/subdomain";

const prefix = getSubdomainSlug() ? "/_cpanel" : "";

interface CheckItem {
  id: string;
  label: string;
  description: string;
  category: string;
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

  const checks: CheckItem[] = [
    {
      id: "has_products",
      label: "Add at least one product",
      description: "Your store needs products to sell",
      category: "Catalog",
      icon: <Package className="h-4 w-4" />,
      check: async () => {
        const { count } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("store_id", currentStore!.id).eq("status", "active");
        return (count ?? 0) > 0;
      },
      actionUrl: `${prefix}/products/new`,
      actionLabel: "Add product",
    },
    {
      id: "has_categories",
      label: "Create product categories",
      description: "Organize products for easy navigation",
      category: "Catalog",
      icon: <Package className="h-4 w-4" />,
      check: async () => {
        const { count } = await supabase.from("categories").select("id", { count: "exact", head: true }).eq("store_id", currentStore!.id);
        return (count ?? 0) > 0;
      },
      actionUrl: `${prefix}/categories`,
      actionLabel: "Add category",
    },
    {
      id: "has_payment",
      label: "Configure a payment gateway",
      description: "Accept payments from customers",
      category: "Payments",
      icon: <CreditCard className="h-4 w-4" />,
      check: async () => {
        const { count } = await supabase.from("payment_gateways" as any).select("id", { count: "exact", head: true }).eq("store_id", currentStore!.id).eq("is_active", true);
        return (count ?? 0) > 0;
      },
      actionUrl: `${prefix}/settings`,
      actionLabel: "Setup payments",
    },
    {
      id: "has_shipping",
      label: "Set up shipping zones",
      description: "Define where and how you ship",
      category: "Shipping",
      icon: <Truck className="h-4 w-4" />,
      check: async () => {
        const { count } = await supabase.from("shipping_zones").select("id", { count: "exact", head: true }).eq("store_id", currentStore!.id);
        return (count ?? 0) > 0;
      },
      actionUrl: `${prefix}/shipping-zones`,
      actionLabel: "Add zone",
    },
    {
      id: "has_tax",
      label: "Configure tax rates",
      description: "Set up tax collection for your region",
      category: "Tax",
      icon: <FileText className="h-4 w-4" />,
      check: async () => {
        const { count } = await supabase.from("tax_rates").select("id", { count: "exact", head: true }).eq("store_id", currentStore!.id);
        return (count ?? 0) > 0;
      },
      actionUrl: `${prefix}/tax-rates`,
      actionLabel: "Add tax rate",
    },
    {
      id: "has_email_template",
      label: "Customize email templates",
      description: "Brand your order confirmation and shipping emails",
      category: "Communications",
      icon: <Mail className="h-4 w-4" />,
      check: async () => {
        const { count } = await supabase.from("email_templates").select("id", { count: "exact", head: true }).eq("store_id", currentStore!.id);
        return (count ?? 0) > 0;
      },
      actionUrl: `${prefix}/email-templates`,
      actionLabel: "Edit templates",
    },
    {
      id: "has_content_page",
      label: "Create essential pages",
      description: "Add About, Contact, Privacy Policy, and Terms pages",
      category: "Content",
      icon: <FileText className="h-4 w-4" />,
      check: async () => {
        const { count } = await supabase.from("content_pages").select("id", { count: "exact", head: true }).eq("store_id", currentStore!.id).eq("is_published", true);
        return (count ?? 0) >= 2;
      },
      actionUrl: `${prefix}/content-pages`,
      actionLabel: "Add pages",
    },
    {
      id: "store_name_set",
      label: "Set your store name and logo",
      description: "Brand your storefront with a name and logo",
      category: "Branding",
      icon: <Store className="h-4 w-4" />,
      check: async () => {
        return !!(currentStore?.name && currentStore.name !== "My Store");
      },
      actionUrl: `${prefix}/settings`,
      actionLabel: "Edit settings",
    },
    {
      id: "has_domain",
      label: "Configure custom domain (optional)",
      description: "Use your own domain name for the storefront",
      category: "Launch",
      icon: <Globe className="h-4 w-4" />,
      check: async () => {
        return !!(currentStore as any)?.custom_domain;
      },
    },
    {
      id: "ssl_ready",
      label: "SSL certificate active",
      description: "Secure your store with HTTPS",
      category: "Security",
      icon: <Shield className="h-4 w-4" />,
      check: async () => true, // Always true on platform
    },
  ];

  useEffect(() => {
    if (!currentStore) return;
    const runChecks = async () => {
      setLoading(true);
      const r: Record<string, boolean | null> = {};
      await Promise.all(
        checks.map(async (c) => {
          try {
            r[c.id] = await c.check();
          } catch {
            r[c.id] = null;
          }
        })
      );
      setResults(r);
      setLoading(false);
    };
    runChecks();
  }, [currentStore]);

  const total = checks.length;
  const passed = Object.values(results).filter((v) => v === true).length;
  const percent = total > 0 ? Math.round((passed / total) * 100) : 0;

  const categories = [...new Set(checks.map((c) => c.category))];

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Rocket className="h-6 w-6 text-primary" /> Go-Live Checklist
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Complete these steps before launching your store
            </p>
          </div>
          <Badge variant={percent === 100 ? "default" : "secondary"} className="text-sm px-3 py-1">
            {passed}/{total} complete
          </Badge>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-2">
              <Progress value={percent} className="flex-1" />
              <span className="text-sm font-medium text-muted-foreground w-12 text-right">{percent}%</span>
            </div>
            {percent === 100 && (
              <p className="text-sm text-primary font-medium mt-2">
                🎉 Your store is ready to launch!
              </p>
            )}
          </CardContent>
        </Card>

        {categories.map((cat) => (
          <Card key={cat}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{cat}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0 divide-y">
              {checks
                .filter((c) => c.category === cat)
                .map((check) => {
                  const status = results[check.id];
                  return (
                    <div key={check.id} className="flex items-center gap-3 py-3">
                      {loading ? (
                        <Circle className="h-5 w-5 text-muted-foreground/30 animate-pulse" />
                      ) : status === true ? (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      ) : status === false ? (
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground/40" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${status === true ? "line-through text-muted-foreground" : ""}`}>
                          {check.label}
                        </p>
                        <p className="text-xs text-muted-foreground">{check.description}</p>
                      </div>
                      {status === false && check.actionUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0 gap-1 text-xs"
                          onClick={() => navigate(check.actionUrl!)}
                        >
                          {check.actionLabel} <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
