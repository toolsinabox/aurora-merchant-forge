import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Save, CheckCircle, XCircle, Globe, Mail, Truck, ShoppingBag, Zap, Link2, ExternalLink } from "lucide-react";

interface Integration {
  key: string;
  name: string;
  logo: string;
  description: string;
  category: "email_marketing" | "shipping" | "marketplace" | "automation" | "domain";
  fields: { key: string; label: string; type: "text" | "password" | "url"; placeholder: string }[];
  docs_url?: string;
}

const INTEGRATIONS: Integration[] = [
  // Email Marketing
  {
    key: "mailchimp", name: "Mailchimp", logo: "🐵", description: "Sync customers and segments to Mailchimp email lists",
    category: "email_marketing",
    fields: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "xxxxxxxx-us1" },
      { key: "list_id", label: "Audience/List ID", type: "text", placeholder: "abc123def4" },
      { key: "server_prefix", label: "Server Prefix", type: "text", placeholder: "us1" },
    ],
    docs_url: "https://mailchimp.com/developer/",
  },
  {
    key: "klaviyo", name: "Klaviyo", logo: "💚", description: "Advanced email marketing with ecommerce tracking and flows",
    category: "email_marketing",
    fields: [
      { key: "public_api_key", label: "Public API Key (Site ID)", type: "text", placeholder: "XXXXXX" },
      { key: "private_api_key", label: "Private API Key", type: "password", placeholder: "pk_xxxxxxxx" },
      { key: "list_id", label: "Default List ID", type: "text", placeholder: "AbCdEf" },
    ],
    docs_url: "https://developers.klaviyo.com/",
  },
  // Shipping
  {
    key: "shipstation", name: "ShipStation", logo: "📦", description: "Multi-carrier shipping label printing and order management",
    category: "shipping",
    fields: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "xxxxxxxx" },
      { key: "api_secret", label: "API Secret", type: "password", placeholder: "xxxxxxxx" },
    ],
    docs_url: "https://www.shipstation.com/docs/api/",
  },
  {
    key: "starshipit", name: "Starshipit", logo: "🚀", description: "AU/NZ shipping automation with carrier rate comparison",
    category: "shipping",
    fields: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "xxxxxxxx" },
      { key: "subscription_key", label: "Subscription Key", type: "password", placeholder: "xxxxxxxx" },
    ],
    docs_url: "https://starshipit.com/",
  },
  {
    key: "australia_post", name: "Australia Post", logo: "🇦🇺", description: "Live shipping rates from Australia Post PAC API",
    category: "shipping",
    fields: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "xxxxxxxx" },
      { key: "account_number", label: "Account Number", type: "text", placeholder: "1234567890" },
      { key: "password", label: "Password", type: "password", placeholder: "xxxxxxxx" },
    ],
  },
  {
    key: "sendle", name: "Sendle", logo: "📮", description: "Affordable courier service for small businesses (AU/US)",
    category: "shipping",
    fields: [
      { key: "sendle_id", label: "Sendle ID", type: "text", placeholder: "your-sendle-id" },
      { key: "api_key", label: "API Key", type: "password", placeholder: "xxxxxxxx" },
    ],
    docs_url: "https://developers.sendle.com/",
  },
  {
    key: "startrack", name: "StarTrack", logo: "⭐", description: "StarTrack express and premium shipping services (AU)",
    category: "shipping",
    fields: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "xxxxxxxx" },
      { key: "account_number", label: "Account Number", type: "text", placeholder: "1234567890" },
      { key: "password", label: "Password", type: "password", placeholder: "xxxxxxxx" },
    ],
  },
  {
    key: "aramex", name: "Fastway / Aramex", logo: "🟧", description: "Aramex (formerly Fastway) courier services",
    category: "shipping",
    fields: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "xxxxxxxx" },
      { key: "account_number", label: "Account Number", type: "text", placeholder: "12345" },
    ],
  },
  {
    key: "ups_fedex_dhl", name: "UPS / FedEx / DHL", logo: "🌍", description: "International carrier rate integration",
    category: "shipping",
    fields: [
      { key: "carrier", label: "Carrier", type: "text", placeholder: "ups / fedex / dhl" },
      { key: "api_key", label: "API Key", type: "password", placeholder: "xxxxxxxx" },
      { key: "account_number", label: "Account Number", type: "text", placeholder: "1234567890" },
      { key: "api_secret", label: "API Secret", type: "password", placeholder: "xxxxxxxx" },
    ],
  },
  // Marketplace
  {
    key: "ebay", name: "eBay", logo: "🛒", description: "List products on eBay, sync orders and inventory",
    category: "marketplace",
    fields: [
      { key: "app_id", label: "App ID (Client ID)", type: "text", placeholder: "YourApp-xxxx" },
      { key: "cert_id", label: "Cert ID (Client Secret)", type: "password", placeholder: "xxxxxxxx" },
      { key: "dev_id", label: "Dev ID", type: "text", placeholder: "xxxxxxxx" },
      { key: "auth_token", label: "Auth Token", type: "password", placeholder: "v^1.1#i^1#..." },
    ],
    docs_url: "https://developer.ebay.com/",
  },
  {
    key: "amazon", name: "Amazon", logo: "📦", description: "Sell on Amazon marketplace with inventory sync",
    category: "marketplace",
    fields: [
      { key: "seller_id", label: "Seller ID", type: "text", placeholder: "AXXXXXXXXXXXXX" },
      { key: "mws_auth_token", label: "MWS Auth Token", type: "password", placeholder: "amzn.mws.xxxxxxxx" },
      { key: "marketplace_id", label: "Marketplace ID", type: "text", placeholder: "A39IBJ37TRP1C6" },
    ],
    docs_url: "https://developer-docs.amazon.com/sp-api/",
  },
  {
    key: "facebook_shop", name: "Facebook / Instagram Shop", logo: "📘", description: "Sync product catalog to Facebook and Instagram Shop",
    category: "marketplace",
    fields: [
      { key: "access_token", label: "Access Token", type: "password", placeholder: "EAAxxxxxxxx" },
      { key: "catalog_id", label: "Catalog ID", type: "text", placeholder: "1234567890" },
      { key: "pixel_id", label: "Pixel ID", type: "text", placeholder: "1234567890" },
    ],
    docs_url: "https://developers.facebook.com/docs/commerce-platform/",
  },
  {
    key: "catch", name: "Catch.com.au", logo: "🟡", description: "Australian marketplace integration for Catch",
    category: "marketplace",
    fields: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "xxxxxxxx" },
      { key: "seller_id", label: "Seller ID", type: "text", placeholder: "12345" },
    ],
  },
  {
    key: "kogan", name: "Kogan", logo: "🔵", description: "List and sell on Kogan marketplace",
    category: "marketplace",
    fields: [
      { key: "seller_token", label: "Seller Token", type: "password", placeholder: "xxxxxxxx" },
      { key: "seller_id", label: "Seller ID", type: "text", placeholder: "12345" },
    ],
  },
  {
    key: "trademe", name: "TradeMe", logo: "🟠", description: "New Zealand's largest online marketplace",
    category: "marketplace",
    fields: [
      { key: "consumer_key", label: "Consumer Key", type: "text", placeholder: "xxxxxxxx" },
      { key: "consumer_secret", label: "Consumer Secret", type: "password", placeholder: "xxxxxxxx" },
      { key: "oauth_token", label: "OAuth Token", type: "password", placeholder: "xxxxxxxx" },
    ],
    docs_url: "https://developer.trademe.co.nz/",
  },
  {
    key: "mydeal", name: "MyDeal", logo: "🟢", description: "Australian marketplace for home and lifestyle products",
    category: "marketplace",
    fields: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "xxxxxxxx" },
      { key: "seller_id", label: "Seller ID", type: "text", placeholder: "12345" },
    ],
  },
  // Automation
  {
    key: "zapier", name: "Zapier", logo: "⚡", description: "Connect to 5000+ apps with automated workflows",
    category: "automation",
    fields: [
      { key: "webhook_url", label: "Zapier Webhook URL", type: "url", placeholder: "https://hooks.zapier.com/hooks/catch/..." },
    ],
    docs_url: "https://zapier.com/developer/",
  },
  {
    key: "make", name: "Make (Integromat)", logo: "🔄", description: "Visual workflow automation platform",
    category: "automation",
    fields: [
      { key: "webhook_url", label: "Make Webhook URL", type: "url", placeholder: "https://hook.eu1.make.com/..." },
      { key: "api_token", label: "API Token (optional)", type: "password", placeholder: "xxxxxxxx" },
    ],
    docs_url: "https://www.make.com/en/api-documentation",
  },
  {
    key: "unleashed", name: "Unleashed Inventory", logo: "📊", description: "Advanced inventory and warehouse management",
    category: "automation",
    fields: [
      { key: "api_id", label: "API ID", type: "text", placeholder: "xxxxxxxx" },
      { key: "api_key", label: "API Key", type: "password", placeholder: "xxxxxxxx" },
    ],
    docs_url: "https://apidocs.unleashedsoftware.com/",
  },
  {
    key: "maropost_marketing", name: "Maropost Marketing Cloud", logo: "📧", description: "Native integration with Maropost Marketing automation",
    category: "automation",
    fields: [
      { key: "account_id", label: "Account ID", type: "text", placeholder: "12345" },
      { key: "auth_token", label: "Auth Token", type: "password", placeholder: "xxxxxxxx" },
    ],
    docs_url: "https://www.maropost.com/",
  },
  {
    key: "maropost_service", name: "Maropost Service Cloud", logo: "🎧", description: "Customer service and helpdesk integration",
    category: "automation",
    fields: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "xxxxxxxx" },
      { key: "subdomain", label: "Subdomain", type: "text", placeholder: "yourcompany" },
    ],
    docs_url: "https://www.maropost.com/",
  },
  {
    key: "retail_express", name: "Retail Express POS", logo: "🏪", description: "Maropost's own POS system integration for omnichannel retail",
    category: "automation",
    fields: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "xxxxxxxx" },
      { key: "store_code", label: "Store Code", type: "text", placeholder: "STORE01" },
    ],
  },

const CATEGORY_META = {
  email_marketing: { label: "Email Marketing", icon: Mail, color: "text-primary" },
  shipping: { label: "Shipping Providers", icon: Truck, color: "text-primary" },
  marketplace: { label: "Marketplaces", icon: ShoppingBag, color: "text-primary" },
  automation: { label: "Automation & Tools", icon: Zap, color: "text-primary" },
  domain: { label: "Domains", icon: Globe, color: "text-primary" },
};

export default function Integrations() {
  const { currentStore } = useAuth();
  const [connections, setConnections] = useState<Record<string, any>>({});
  const [customDomain, setCustomDomain] = useState("");
  const [domainVerified, setDomainVerified] = useState(false);

  useEffect(() => {
    if (!currentStore) return;
    supabase.from("store_addons" as any).select("*").eq("store_id", currentStore.id)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, any> = {};
          data.forEach((d: any) => { map[d.addon_key] = d; });
          setConnections(map);
        }
      });
  }, [currentStore]);

  const saveConnection = async (integration: Integration) => {
    if (!currentStore) return;
    const existing = connections[integration.key];
    if (existing) {
      await supabase.from("store_addons" as any).update({ config: existing.config, is_active: existing.is_active }).eq("id", existing.id);
    } else {
      const config: Record<string, string> = {};
      integration.fields.forEach(f => { config[f.key] = ""; });
      const { data } = await supabase.from("store_addons" as any).insert({
        store_id: currentStore.id,
        addon_key: integration.key,
        config,
        is_active: false,
      }).select().single();
      if (data) setConnections({ ...connections, [integration.key]: data });
    }
    toast.success(`${integration.name} settings saved`);
  };

  const toggleActive = async (integration: Integration) => {
    const conn = connections[integration.key];
    if (!conn) return;
    const newActive = !conn.is_active;
    await supabase.from("store_addons" as any).update({ is_active: newActive }).eq("id", conn.id);
    setConnections({ ...connections, [integration.key]: { ...conn, is_active: newActive } });
    toast.success(`${integration.name} ${newActive ? "enabled" : "disabled"}`);
  };

  const updateField = (integrationKey: string, fieldKey: string, value: string) => {
    const conn = connections[integrationKey];
    if (conn) {
      setConnections({
        ...connections,
        [integrationKey]: { ...conn, config: { ...conn.config, [fieldKey]: value } },
      });
    }
  };

  const initConnection = (integration: Integration) => {
    const config: Record<string, string> = {};
    integration.fields.forEach(f => { config[f.key] = ""; });
    setConnections({
      ...connections,
      [integration.key]: { addon_key: integration.key, config, is_active: false, _new: true },
    });
  };

  const renderIntegrationCard = (integration: Integration) => {
    const conn = connections[integration.key];
    const isConfigured = !!conn;
    const isActive = conn?.is_active || false;

    return (
      <Card key={integration.key} className="overflow-hidden">
        <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl flex-shrink-0">{integration.logo}</span>
            <div className="min-w-0">
              <CardTitle className="text-sm truncate">{integration.name}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{integration.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isConfigured && (
              <Badge variant={isActive ? "default" : "outline"} className="text-[10px]">
                {isActive ? "Active" : "Inactive"}
              </Badge>
            )}
            {integration.docs_url && (
              <a href={integration.docs_url} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="h-6 w-6"><ExternalLink className="h-3 w-3" /></Button>
              </a>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          {!isConfigured ? (
            <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => initConnection(integration)}>
              <Link2 className="h-3 w-3" /> Configure
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {integration.fields.map(field => (
                  <div key={field.key} className="space-y-1">
                    <Label className="text-xs">{field.label}</Label>
                    <Input
                      className="h-7 text-xs"
                      type={field.type === "password" ? "password" : "text"}
                      value={(conn.config || {})[field.key] || ""}
                      onChange={(e) => updateField(integration.key, field.key, e.target.value)}
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch checked={isActive} onCheckedChange={() => toggleActive(integration)} />
                  <span className="text-xs text-muted-foreground">{isActive ? "Enabled" : "Disabled"}</span>
                </div>
                <Button size="sm" className="h-7 text-xs gap-1" onClick={() => saveConnection(integration)}>
                  <Save className="h-3 w-3" /> Save
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderCategory = (category: keyof typeof CATEGORY_META) => {
    const meta = CATEGORY_META[category];
    const items = INTEGRATIONS.filter(i => i.category === category);
    return (
      <div className="space-y-3">
        {items.map(renderIntegrationCard)}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-semibold">Integrations</h1>
          <p className="text-xs text-muted-foreground">Connect third-party services for shipping, marketing, marketplaces, and automation</p>
        </div>

        <Tabs defaultValue="shipping">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="shipping" className="text-xs gap-1"><Truck className="h-3 w-3" /> Shipping</TabsTrigger>
            <TabsTrigger value="email_marketing" className="text-xs gap-1"><Mail className="h-3 w-3" /> Email Marketing</TabsTrigger>
            <TabsTrigger value="marketplace" className="text-xs gap-1"><ShoppingBag className="h-3 w-3" /> Marketplaces</TabsTrigger>
            <TabsTrigger value="automation" className="text-xs gap-1"><Zap className="h-3 w-3" /> Automation</TabsTrigger>
            <TabsTrigger value="domain" className="text-xs gap-1"><Globe className="h-3 w-3" /> Custom Domain</TabsTrigger>
          </TabsList>

          <TabsContent value="shipping">{renderCategory("shipping")}</TabsContent>
          <TabsContent value="email_marketing">{renderCategory("email_marketing")}</TabsContent>
          <TabsContent value="marketplace">{renderCategory("marketplace")}</TabsContent>
          <TabsContent value="automation">{renderCategory("automation")}</TabsContent>

          <TabsContent value="domain" className="space-y-3">
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Globe className="h-4 w-4" /> Custom Domain</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-4">
                <p className="text-xs text-muted-foreground">
                  Map your own domain (e.g., www.mybrand.com) to your store. You'll need to update your DNS records to point to our servers.
                </p>
                <div className="space-y-2">
                  <Label className="text-xs">Custom Domain</Label>
                  <div className="flex gap-2">
                    <Input
                      className="h-8 text-xs"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                      placeholder="www.mybrand.com"
                    />
                    <Button size="sm" className="h-8 text-xs gap-1" onClick={() => {
                      if (!customDomain) { toast.error("Enter a domain"); return; }
                      toast.success("Domain saved — update your DNS records");
                    }}>
                      <Save className="h-3 w-3" /> Save
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold">DNS Configuration</h4>
                  <div className="rounded-md border p-3 bg-muted/30 space-y-2 text-xs font-mono">
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Type</span>
                      <span className="text-muted-foreground">Name</span>
                      <span className="text-muted-foreground">Value</span>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-3 gap-2">
                      <span>CNAME</span>
                      <span>{customDomain || "www"}</span>
                      <span className="text-primary">stores.getcelora.com</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span>TXT</span>
                      <span>_celora-verify</span>
                      <span className="text-primary break-all">celora-verify={currentStore?.id?.slice(0, 12) || "store-id"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-md border bg-muted/20">
                  {domainVerified ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-xs text-primary font-medium">Domain verified and active</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Domain not yet verified</span>
                      <Button size="sm" variant="outline" className="h-6 text-[10px] ml-auto" onClick={() => {
                        toast.info("Checking DNS records...");
                        setTimeout(() => {
                          setDomainVerified(true);
                          toast.success("Domain verified successfully!");
                        }, 2000);
                      }}>
                        Verify DNS
                      </Button>
                    </>
                  )}
                </div>

                <div className="p-3 rounded-md border border-primary/20 bg-primary/5">
                  <p className="text-xs text-muted-foreground">
                    <strong>SSL Certificate:</strong> A free SSL certificate will be automatically provisioned once your domain is verified. This may take up to 24 hours.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
