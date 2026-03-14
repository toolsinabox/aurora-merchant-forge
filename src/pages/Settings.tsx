import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
  useUpdateStore, useTaxRates, useCreateTaxRate, useDeleteTaxRate,
  useShippingZones, useCreateShippingZone, useDeleteShippingZone, useTeamMembers,
  useCustomerGroups, useCreateCustomerGroup, useDeleteCustomerGroup,
} from "@/hooks/use-data";
import { Save, Plus, Trash2, Mail, Palette, Type, Layout, Paintbrush, Users, Globe, Bell, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

const GATEWAY_TYPES = [
  { type: "stripe", name: "Stripe", fields: ["publishable_key", "secret_key"] },
  { type: "paypal", name: "PayPal", fields: ["client_id", "client_secret"] },
  { type: "square", name: "Square", fields: ["application_id", "access_token"] },
  { type: "eway", name: "eWAY", fields: ["api_key", "password"] },
  { type: "braintree", name: "Braintree", fields: ["merchant_id", "public_key", "private_key"] },
  { type: "bank_transfer", name: "Bank Transfer", fields: ["bank_name", "account_name", "bsb", "account_number"] },
  { type: "afterpay", name: "Afterpay / Zip Pay", fields: ["merchant_id", "secret_key"] },
];

function PaymentGatewaysTab() {
  const { currentStore } = useAuth();
  const [gateways, setGateways] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentStore) return;
    supabase.from("payment_gateways" as any).select("*").eq("store_id", currentStore.id).order("sort_order")
      .then(({ data }) => { setGateways(data || []); setLoading(false); });
  }, [currentStore]);

  const initGateway = async (gt: typeof GATEWAY_TYPES[0]) => {
    if (!currentStore) return;
    const config: Record<string, string> = {};
    gt.fields.forEach(f => { config[f] = ""; });
    const { data, error } = await supabase.from("payment_gateways" as any).insert({
      store_id: currentStore.id, gateway_type: gt.type, display_name: gt.name, config,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setGateways([...gateways, data]);
    toast.success(`${gt.name} added`);
  };

  const updateGateway = async (id: string, updates: any) => {
    await supabase.from("payment_gateways" as any).update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
    setGateways(gateways.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const removeGateway = async (id: string) => {
    await supabase.from("payment_gateways" as any).delete().eq("id", id);
    setGateways(gateways.filter(g => g.id !== id));
    toast.success("Gateway removed");
  };

  const configured = gateways.map(g => g.gateway_type);
  const available = GATEWAY_TYPES.filter(gt => !configured.includes(gt.type));

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><CreditCard className="h-4 w-4" /> Payment Gateways</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? <Skeleton className="h-20 w-full" /> : gateways.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No payment gateways configured. Add one below.</p>
          ) : gateways.map((gw: any) => {
            const gtDef = GATEWAY_TYPES.find(g => g.type === gw.gateway_type);
            return (
              <Card key={gw.id} className="border">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{gw.display_name}</span>
                      <Badge variant={gw.is_enabled ? "default" : "outline"} className="text-[10px]">{gw.is_enabled ? "Enabled" : "Disabled"}</Badge>
                      {gw.is_test_mode && <Badge variant="secondary" className="text-[10px]">Test Mode</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={gw.is_enabled} onCheckedChange={(v) => updateGateway(gw.id, { is_enabled: v })} />
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeGateway(gw.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-[10px] text-muted-foreground">Test Mode</Label>
                    <Switch checked={gw.is_test_mode} onCheckedChange={(v) => updateGateway(gw.id, { is_test_mode: v })} />
                  </div>
                  {gtDef && (
                    <div className="grid grid-cols-2 gap-2">
                      {gtDef.fields.map(field => (
                        <div key={field} className="space-y-0.5">
                          <Label className="text-[10px] capitalize">{field.replace(/_/g, " ")}</Label>
                          <Input
                            className="h-7 text-xs font-mono"
                            type={field.includes("secret") || field.includes("private") || field.includes("password") ? "password" : "text"}
                            value={(gw.config as any)?.[field] || ""}
                            onChange={(e) => {
                              const newConfig = { ...gw.config, [field]: e.target.value };
                              updateGateway(gw.id, { config: newConfig });
                            }}
                            placeholder={`Enter ${field.replace(/_/g, " ")}`}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {available.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Add a payment gateway:</p>
              <div className="flex flex-wrap gap-1.5">
                {available.map(gt => (
                  <Button key={gt.type} variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => initGateway(gt)}>
                    <Plus className="h-3 w-3" /> {gt.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function WholesaleApplicationsTab() {
  const { currentStore } = useAuth();
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentStore) return;
    supabase.from("wholesale_applications" as any).select("*").eq("store_id", currentStore.id).order("created_at", { ascending: false })
      .then(({ data }) => { setApps(data || []); setLoading(false); });
  }, [currentStore]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("wholesale_applications" as any).update({ status }).eq("id", id);
    setApps(apps.map(a => a.id === id ? { ...a, status } : a));
    toast.success(`Application ${status}`);
  };

  if (loading) return <Skeleton className="h-32 w-full" />;

  return (
    <Card>
      <CardContent className="p-0">
        {apps.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">No wholesale applications yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Business</TableHead>
                <TableHead className="text-xs">Contact</TableHead>
                <TableHead className="text-xs">Email</TableHead>
                <TableHead className="text-xs">ABN</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apps.map((a: any) => (
                <TableRow key={a.id} className="text-xs">
                  <TableCell className="font-medium">{a.business_name}</TableCell>
                  <TableCell>{a.contact_name}</TableCell>
                  <TableCell>{a.email}</TableCell>
                  <TableCell className="font-mono">{a.abn_tax_id || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={a.status === "approved" ? "default" : a.status === "rejected" ? "destructive" : "secondary"} className="text-[10px] capitalize">{a.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {a.status === "pending" && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => updateStatus(a.id, "approved")}>Approve</Button>
                        <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => updateStatus(a.id, "rejected")}>Reject</Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function SEOSettings() {
  const { currentStore } = useAuth();
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentStore) return;
    supabase.from("stores").select("seo_title_global, seo_description_global").eq("id", currentStore.id).single().then(({ data }) => {
      if (data) {
        setSeoTitle((data as any).seo_title_global || "");
        setSeoDesc((data as any).seo_description_global || "");
      }
    });
  }, [currentStore]);

  const handleSave = async () => {
    if (!currentStore) return;
    setSaving(true);
    await supabase.from("stores").update({ seo_title_global: seoTitle || null, seo_description_global: seoDesc || null } as any).eq("id", currentStore.id);
    setSaving(false);
    toast.success("SEO settings saved");
  };

  return (
    <Card>
      <CardHeader className="p-4 pb-2"><CardTitle className="text-sm flex items-center gap-2"><Globe className="h-4 w-4" /> Global SEO Settings</CardTitle></CardHeader>
      <CardContent className="p-4 pt-2 space-y-4">
        <div className="space-y-1">
          <Label className="text-xs">Default Meta Title</Label>
          <Input className="h-8 text-xs" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="My Store — Best Products Online" maxLength={60} />
          <p className="text-2xs text-muted-foreground">{seoTitle.length}/60 characters — used as default title when pages don't specify their own</p>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Default Meta Description</Label>
          <Textarea className="text-xs min-h-[60px]" value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} placeholder="Shop the best products at great prices..." maxLength={160} />
          <p className="text-2xs text-muted-foreground">{seoDesc.length}/160 characters</p>
        </div>
        <Button size="sm" className="h-8 text-xs gap-1" onClick={handleSave} disabled={saving}>
          <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save SEO Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}

const NOTIFICATION_KEYS = [
  { key: "new_order", label: "New Order", desc: "When a new order is placed" },
  { key: "low_stock", label: "Low Stock Alert", desc: "When stock falls below threshold" },
  { key: "new_customer", label: "New Customer", desc: "When a new customer registers" },
  { key: "return_request", label: "Return Request", desc: "When a customer requests a return" },
  { key: "contact_form", label: "Contact Form", desc: "When a contact form is submitted" },
  { key: "review_submitted", label: "Review Submitted", desc: "When a product review is submitted" },
];

function NotificationSettings() {
  const { currentStore } = useAuth();
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    new_order: true, low_stock: true, new_customer: true, return_request: true, contact_form: true, review_submitted: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentStore) return;
    supabase.from("stores").select("notification_prefs").eq("id", currentStore.id).single().then(({ data }) => {
      if (data && (data as any).notification_prefs) {
        setPrefs({ ...prefs, ...(data as any).notification_prefs });
      }
    });
  }, [currentStore]);

  const handleSave = async () => {
    if (!currentStore) return;
    setSaving(true);
    await supabase.from("stores").update({ notification_prefs: prefs } as any).eq("id", currentStore.id);
    setSaving(false);
    toast.success("Notification preferences saved");
  };

  return (
    <Card>
      <CardHeader className="p-4 pb-2"><CardTitle className="text-sm flex items-center gap-2"><Bell className="h-4 w-4" /> Notification Preferences</CardTitle></CardHeader>
      <CardContent className="p-4 pt-2 space-y-4">
        {NOTIFICATION_KEYS.map((n) => (
          <div key={n.key} className="flex items-center justify-between">
            <div>
              <Label className="text-xs font-medium">{n.label}</Label>
              <p className="text-2xs text-muted-foreground">{n.desc}</p>
            </div>
            <Switch checked={prefs[n.key] ?? true} onCheckedChange={(v) => setPrefs({ ...prefs, [n.key]: v })} />
          </div>
        ))}
        <Button size="sm" className="h-8 text-xs gap-1" onClick={handleSave} disabled={saving}>
          <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save Preferences"}
        </Button>
      </CardContent>
    </Card>
  );
}

function CheckoutSettings() {
  const { currentStore } = useAuth();
  const [guestCheckout, setGuestCheckout] = useState(true);
  const [minOrder, setMinOrder] = useState("0");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentStore) return;
    supabase
      .from("stores")
      .select("guest_checkout_enabled, min_order_amount")
      .eq("id", currentStore.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setGuestCheckout((data as any).guest_checkout_enabled ?? true);
          setMinOrder(String((data as any).min_order_amount ?? 0));
        }
      });
  }, [currentStore]);

  const handleSave = async () => {
    if (!currentStore) return;
    setSaving(true);
    await supabase.from("stores").update({
      guest_checkout_enabled: guestCheckout,
      min_order_amount: Number(minOrder) || 0,
    } as any).eq("id", currentStore.id);
    setSaving(false);
    toast.success("Checkout settings saved");
  };

  return (
    <Card>
      <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Checkout Settings</CardTitle></CardHeader>
      <CardContent className="p-4 pt-2 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-xs font-medium">Allow Guest Checkout</Label>
            <p className="text-2xs text-muted-foreground">Let customers checkout without creating an account</p>
          </div>
          <Switch checked={guestCheckout} onCheckedChange={setGuestCheckout} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Minimum Order Amount</Label>
          <Input className="h-8 text-xs w-40" type="number" step="0.01" min="0" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} placeholder="0.00" />
          <p className="text-2xs text-muted-foreground">Set to 0 for no minimum</p>
        </div>
        <Button size="sm" className="h-8 text-xs gap-1" onClick={handleSave} disabled={saving}>
          <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save Checkout Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}

function InventorySettingsTab() {
  const { currentStore } = useAuth();
  const [threshold, setThreshold] = useState("10");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentStore) return;
    supabase.from("stores").select("default_low_stock_threshold").eq("id", currentStore.id).single().then(({ data }) => {
      if (data) setThreshold(String((data as any).default_low_stock_threshold ?? 10));
    });
  }, [currentStore]);

  const handleSave = async () => {
    if (!currentStore) return;
    setSaving(true);
    await supabase.from("stores").update({ default_low_stock_threshold: Number(threshold) || 10 } as any).eq("id", currentStore.id);
    setSaving(false);
    toast.success("Inventory settings saved");
  };

  return (
    <Card>
      <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Inventory Settings</CardTitle></CardHeader>
      <CardContent className="p-4 pt-2 space-y-4">
        <div className="space-y-1">
          <Label className="text-xs">Default Low Stock Threshold</Label>
          <Input className="h-8 text-xs w-40" type="number" min="0" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
          <p className="text-2xs text-muted-foreground">Products with stock at or below this level will trigger low stock alerts</p>
        </div>
        <Button size="sm" className="h-8 text-xs gap-1" onClick={handleSave} disabled={saving}>
          <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save Inventory Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}

function CurrencyFormatTab() {
  const { currentStore } = useAuth();
  const [symbolPosition, setSymbolPosition] = useState("before");
  const [decimalPlaces, setDecimalPlaces] = useState("2");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentStore) return;
    supabase.from("stores").select("currency_symbol_position, currency_decimal_places").eq("id", currentStore.id).single().then(({ data }) => {
      if (data) {
        setSymbolPosition((data as any).currency_symbol_position || "before");
        setDecimalPlaces(String((data as any).currency_decimal_places ?? 2));
      }
    });
  }, [currentStore]);

  const handleSave = async () => {
    if (!currentStore) return;
    setSaving(true);
    await supabase.from("stores").update({
      currency_symbol_position: symbolPosition,
      currency_decimal_places: Number(decimalPlaces) || 2,
    } as any).eq("id", currentStore.id);
    setSaving(false);
    toast.success("Currency format saved");
  };

  const preview = symbolPosition === "before" ? `$1,234.${decimalPlaces === "0" ? "" : "56".slice(0, Number(decimalPlaces))}` : `1,234.${decimalPlaces === "0" ? "" : "56".slice(0, Number(decimalPlaces))}$`;

  return (
    <Card>
      <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Currency Display Format</CardTitle></CardHeader>
      <CardContent className="p-4 pt-2 space-y-4">
        <div className="space-y-1">
          <Label className="text-xs">Symbol Position</Label>
          <Select value={symbolPosition} onValueChange={setSymbolPosition}>
            <SelectTrigger className="h-8 text-xs w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="before" className="text-xs">Before ($100)</SelectItem>
              <SelectItem value="after" className="text-xs">After (100$)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Decimal Places</Label>
          <Select value={decimalPlaces} onValueChange={setDecimalPlaces}>
            <SelectTrigger className="h-8 text-xs w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0" className="text-xs">0 ($100)</SelectItem>
              <SelectItem value="2" className="text-xs">2 ($100.00)</SelectItem>
              <SelectItem value="3" className="text-xs">3 ($100.000)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="p-3 rounded-md border bg-muted/30 text-sm">
          <span className="text-xs text-muted-foreground">Preview: </span>
          <span className="font-medium">{preview}</span>
        </div>
        <Button size="sm" className="h-8 text-xs gap-1" onClick={handleSave} disabled={saving}>
          <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save Currency Format"}
        </Button>
      </CardContent>
    </Card>
  );
}
function ReturnsPolicyTab() {
  const { currentStore } = useAuth();
  const [returnWindowDays, setReturnWindowDays] = useState("30");
  const [restockingFeePercent, setRestockingFeePercent] = useState("0");
  const [requireReason, setRequireReason] = useState(true);
  const [allowExchanges, setAllowExchanges] = useState(true);
  const [autoApprove, setAutoApprove] = useState(false);
  const [nonReturnableCategories, setNonReturnableCategories] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentStore) return;
    const saved = localStorage.getItem(`returns_policy_${currentStore.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setReturnWindowDays(parsed.returnWindowDays || "30");
        setRestockingFeePercent(parsed.restockingFeePercent || "0");
        setRequireReason(parsed.requireReason ?? true);
        setAllowExchanges(parsed.allowExchanges ?? true);
        setAutoApprove(parsed.autoApprove ?? false);
        setNonReturnableCategories(parsed.nonReturnableCategories || "");
      } catch {}
    }
  }, [currentStore]);

  const handleSave = () => {
    if (!currentStore) return;
    setSaving(true);
    const policy = { returnWindowDays, restockingFeePercent, requireReason, allowExchanges, autoApprove, nonReturnableCategories };
    localStorage.setItem(`returns_policy_${currentStore.id}`, JSON.stringify(policy));
    setTimeout(() => { setSaving(false); toast.success("Returns policy saved"); }, 300);
  };

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm">Returns & Refunds Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Return Window (days)</Label>
              <Input type="number" min="0" max="365" value={returnWindowDays} onChange={e => setReturnWindowDays(e.target.value)} className="h-8 text-sm" />
              <p className="text-[10px] text-muted-foreground mt-1">How many days after purchase a customer can request a return. Set to 0 to disable returns.</p>
            </div>
            <div>
              <Label className="text-xs">Restocking Fee (%)</Label>
              <Input type="number" min="0" max="100" value={restockingFeePercent} onChange={e => setRestockingFeePercent(e.target.value)} className="h-8 text-sm" />
              <p className="text-[10px] text-muted-foreground mt-1">Percentage deducted from refund amount as a restocking fee.</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">Require Return Reason</Label>
                <p className="text-[10px] text-muted-foreground">Customer must select a reason for return</p>
              </div>
              <Switch checked={requireReason} onCheckedChange={setRequireReason} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">Allow Exchanges</Label>
                <p className="text-[10px] text-muted-foreground">Allow customers to exchange for different size/color</p>
              </div>
              <Switch checked={allowExchanges} onCheckedChange={setAllowExchanges} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">Auto-Approve Returns</Label>
                <p className="text-[10px] text-muted-foreground">Automatically approve return requests (not recommended)</p>
              </div>
              <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-xs">Non-Returnable Categories</Label>
            <Textarea placeholder="Enter category names, one per line (e.g. Clearance, Underwear, Food)" value={nonReturnableCategories} onChange={e => setNonReturnableCategories(e.target.value)} className="text-sm min-h-[60px]" />
            <p className="text-[10px] text-muted-foreground mt-1">Products in these categories will be marked as non-returnable.</p>
          </div>

          <Button size="sm" className="h-8 text-xs gap-1" onClick={handleSave} disabled={saving}>
            <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save Returns Policy"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function FulfillmentRulesTab() {
  const { currentStore } = useAuth();
  const [rules, setRules] = useState<Array<{ id: string; name: string; priority: number; criteria: string; action: string }>>([]);
  const [form, setForm] = useState({ name: "", criteria: "express_shipping", action: "priority_high" });

  useEffect(() => {
    if (!currentStore) return;
    try { setRules(JSON.parse(localStorage.getItem(`fulfillment_rules_${currentStore.id}`) || "[]")); } catch {}
  }, [currentStore]);

  const saveRules = (updated: typeof rules) => {
    setRules(updated);
    if (currentStore) localStorage.setItem(`fulfillment_rules_${currentStore.id}`, JSON.stringify(updated));
  };

  const addRule = () => {
    if (!form.name.trim()) { toast.error("Rule name required"); return; }
    saveRules([...rules, { id: crypto.randomUUID(), name: form.name, priority: rules.length + 1, criteria: form.criteria, action: form.action }]);
    setForm({ name: "", criteria: "express_shipping", action: "priority_high" });
    toast.success("Fulfillment rule added");
  };

  const criteriaLabels: Record<string, string> = { express_shipping: "Express shipping", vip_customer: "VIP customer", order_age_24h: "Order > 24h old", high_value: "High value order (>$500)", backorder: "Contains backorder items" };
  const actionLabels: Record<string, string> = { priority_high: "High priority", priority_medium: "Medium priority", assign_warehouse_1: "Assign primary warehouse", hold_for_review: "Hold for review", split_shipment: "Auto-split shipment" };

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Fulfillment Priority Rules</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Define rules to prioritize or route orders automatically based on conditions.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input placeholder="Rule name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="h-8 text-sm" />
            <Select value={form.criteria} onValueChange={v => setForm({ ...form, criteria: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(criteriaLabels).map(([k, v]) => <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.action} onValueChange={v => setForm({ ...form, action: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(actionLabels).map(([k, v]) => <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" className="text-xs h-7" onClick={addRule}><Plus className="h-3 w-3 mr-1" /> Add Rule</Button>

          {rules.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-8">#</TableHead>
                  <TableHead className="text-xs h-8">Name</TableHead>
                  <TableHead className="text-xs h-8">When</TableHead>
                  <TableHead className="text-xs h-8">Then</TableHead>
                  <TableHead className="text-xs h-8 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((r, i) => (
                  <TableRow key={r.id} className="text-xs">
                    <TableCell className="py-1.5">{i + 1}</TableCell>
                    <TableCell className="py-1.5 font-medium">{r.name}</TableCell>
                    <TableCell className="py-1.5"><Badge variant="outline" className="text-[10px]">{criteriaLabels[r.criteria] || r.criteria}</Badge></TableCell>
                    <TableCell className="py-1.5"><Badge variant="secondary" className="text-[10px]">{actionLabels[r.action] || r.action}</Badge></TableCell>
                    <TableCell className="py-1.5 text-right">
                      <Button size="sm" variant="ghost" className="text-xs h-6 text-destructive" onClick={() => saveRules(rules.filter(x => x.id !== r.id))}><Trash2 className="h-3 w-3" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  const { currentStore, user } = useAuth();
  const updateStore = useUpdateStore();
  const { data: taxRates = [], isLoading: loadingTax } = useTaxRates();
  const createTaxRate = useCreateTaxRate();
  const deleteTaxRate = useDeleteTaxRate();
  const { data: shippingZones = [], isLoading: loadingShipping } = useShippingZones();
  const createShippingZone = useCreateShippingZone();
  const deleteShippingZone = useDeleteShippingZone();
  const { data: team = [], isLoading: loadingTeam } = useTeamMembers();
  const { data: customerGroups = [], isLoading: loadingGroups } = useCustomerGroups();
  const createCustomerGroup = useCreateCustomerGroup();
  const deleteCustomerGroup = useDeleteCustomerGroup();

  const [storeForm, setStoreForm] = useState({
    name: currentStore?.name || "",
    contact_email: user?.email || "",
    currency: currentStore?.currency || "USD",
    timezone: currentStore?.timezone || "America/New_York",
  });

  // Branding state
  const [brandForm, setBrandForm] = useState({
    primary_color: "#2563eb",
    banner_text: "",
    banner_start: "",
    banner_end: "",
    description: "",
    logo_url: "",
    favicon_url: "",
    ga_tracking_id: "",
    gtm_container_id: "",
    fb_pixel_id: "",
    google_ads_id: "",
    google_ads_conversion_label: "",
    chat_widget_code: "",
  });
  const [brandLoading, setBrandLoading] = useState(false);
  const [brandSaving, setBrandSaving] = useState(false);

  // Theme builder state
  const [themeForm, setThemeForm] = useState({
    primary_color: "#2563eb",
    secondary_color: "#64748b",
    accent_color: "#f59e0b",
    background_color: "#ffffff",
    text_color: "#0f172a",
    heading_font: "Inter",
    body_font: "Inter",
    button_radius: "md",
    layout_style: "standard",
    hero_style: "banner",
    product_card_style: "minimal",
    footer_style: "standard",
    custom_css: "",
  });
  const [themeSaving, setThemeSaving] = useState(false);

  // Load branding + theme data
  useEffect(() => {
    if (!currentStore) return;
    supabase
      .from("stores")
      .select("primary_color, banner_text, banner_start, banner_end, description, logo_url, favicon_url, ga_tracking_id, gtm_container_id, fb_pixel_id, google_ads_id, google_ads_conversion_label, chat_widget_code, smtp_config")
      .eq("id", currentStore.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setBrandForm({
            primary_color: (data as any).primary_color || "#2563eb",
            banner_text: (data as any).banner_text || "",
            banner_start: (data as any).banner_start ? (data as any).banner_start.slice(0, 16) : "",
            banner_end: (data as any).banner_end ? (data as any).banner_end.slice(0, 16) : "",
            description: (data as any).description || "",
            logo_url: (data as any).logo_url || "",
            favicon_url: (data as any).favicon_url || "",
            ga_tracking_id: (data as any).ga_tracking_id || "",
            gtm_container_id: (data as any).gtm_container_id || "",
            fb_pixel_id: (data as any).fb_pixel_id || "",
            google_ads_id: (data as any).google_ads_id || "",
            google_ads_conversion_label: (data as any).google_ads_conversion_label || "",
            chat_widget_code: (data as any).chat_widget_code || "",
          });
          if ((data as any).smtp_config) {
            setSmtpForm({ ...(data as any).smtp_config });
          }
        }
      });

    supabase
      .from("store_themes")
      .select("*")
      .eq("store_id", currentStore.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setThemeForm({
            primary_color: (data as any).primary_color || "#2563eb",
            secondary_color: (data as any).secondary_color || "#64748b",
            accent_color: (data as any).accent_color || "#f59e0b",
            background_color: (data as any).background_color || "#ffffff",
            text_color: (data as any).text_color || "#0f172a",
            heading_font: (data as any).heading_font || "Inter",
            body_font: (data as any).body_font || "Inter",
            button_radius: (data as any).button_radius || "md",
            layout_style: (data as any).layout_style || "standard",
            hero_style: (data as any).hero_style || "banner",
            product_card_style: (data as any).product_card_style || "minimal",
            footer_style: (data as any).footer_style || "standard",
            custom_css: (data as any).custom_css || "",
          });
        }
      });
  }, [currentStore]);

  const handleSaveBranding = async () => {
    if (!currentStore) return;
    setBrandSaving(true);
    const { error } = await supabase
      .from("stores")
      .update({
        primary_color: brandForm.primary_color,
        banner_text: brandForm.banner_text || null,
        banner_start: brandForm.banner_start ? new Date(brandForm.banner_start).toISOString() : null,
        banner_end: brandForm.banner_end ? new Date(brandForm.banner_end).toISOString() : null,
        description: brandForm.description || null,
        logo_url: brandForm.logo_url || null,
        favicon_url: brandForm.favicon_url || null,
        ga_tracking_id: brandForm.ga_tracking_id || null,
        gtm_container_id: brandForm.gtm_container_id || null,
        fb_pixel_id: brandForm.fb_pixel_id || null,
        google_ads_id: brandForm.google_ads_id || null,
        google_ads_conversion_label: brandForm.google_ads_conversion_label || null,
        chat_widget_code: brandForm.chat_widget_code || null,
      } as any)
      .eq("id", currentStore.id);
    setBrandSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Branding saved");
  };

  // SMTP / Email configuration
  const [smtpForm, setSmtpForm] = useState<any>({
    host: "", port: "587", username: "", password: "", from_name: "", from_email: "", encryption: "tls",
  });
  const [smtpSaving, setSmtpSaving] = useState(false);

  const handleSaveSmtp = async () => {
    if (!currentStore) return;
    setSmtpSaving(true);
    const { error } = await supabase
      .from("stores")
      .update({ smtp_config: smtpForm } as any)
      .eq("id", currentStore.id);
    setSmtpSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Email settings saved");
  };

  const [taxOpen, setTaxOpen] = useState(false);
  const [newTax, setNewTax] = useState({ name: "", region: "", rate: "" });
  const [shipOpen, setShipOpen] = useState(false);
  const [newShip, setNewShip] = useState({ name: "", regions: "", flat_rate: "", free_above: "" });

  const handleSaveStore = () => {
    updateStore.mutate(storeForm);
  };

          const handleSaveTheme = async () => {
    if (!currentStore) return;
    setThemeSaving(true);
    const { data: existing } = await supabase
      .from("store_themes")
      .select("id")
      .eq("store_id", currentStore.id)
      .single();
    if (existing) {
      await supabase.from("store_themes").update(themeForm as any).eq("store_id", currentStore.id);
    } else {
      await supabase.from("store_themes").insert({ ...themeForm, store_id: currentStore.id } as any);
    }
    setThemeSaving(false);
    toast.success("Theme saved");
  };

  const FONT_OPTIONS = [
    "Inter", "System UI", "Georgia", "Merriweather", "Playfair Display",
    "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins", "Raleway",
  ];

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div>
          <h1 className="text-lg font-semibold">Settings</h1>
          <p className="text-xs text-muted-foreground">Manage your store configuration</p>
        </div>

        <Tabs defaultValue="store">
          <TabsList className="h-auto flex-wrap gap-1 p-1">
            <TabsTrigger value="store" className="text-xs h-7">Store</TabsTrigger>
            <TabsTrigger value="branding" className="text-xs h-7">Branding</TabsTrigger>
            <TabsTrigger value="theme" className="text-xs h-7">Theme Builder</TabsTrigger>
            <TabsTrigger value="seo" className="text-xs h-7">SEO</TabsTrigger>
            <TabsTrigger value="checkout" className="text-xs h-7">Checkout</TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs h-7">Notifications</TabsTrigger>
            <TabsTrigger value="team" className="text-xs h-7">Team</TabsTrigger>
            <TabsTrigger value="tax" className="text-xs h-7">Tax</TabsTrigger>
            <TabsTrigger value="shipping" className="text-xs h-7">Shipping</TabsTrigger>
            <TabsTrigger value="groups" className="text-xs h-7">Customer Groups</TabsTrigger>
            <TabsTrigger value="wholesale" className="text-xs h-7">Wholesale</TabsTrigger>
            <TabsTrigger value="inventory" className="text-xs h-7">Inventory</TabsTrigger>
            <TabsTrigger value="payments" className="text-xs h-7">Payments</TabsTrigger>
            <TabsTrigger value="email" className="text-xs h-7">Email</TabsTrigger>
            <TabsTrigger value="returns" className="text-xs h-7">Returns</TabsTrigger>
            <TabsTrigger value="fulfillment" className="text-xs h-7">Fulfillment</TabsTrigger>
            <TabsTrigger value="scripts" className="text-xs h-7">Scripts</TabsTrigger>
          </TabsList>

          <TabsContent value="store" className="space-y-3">
            <Card>
              <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Store Details</CardTitle></CardHeader>
              <CardContent className="p-4 pt-2 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Store Name</Label>
                    <Input className="h-8 text-xs" value={storeForm.name} onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Contact Email</Label>
                    <Input className="h-8 text-xs" value={storeForm.contact_email} onChange={(e) => setStoreForm({ ...storeForm, contact_email: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Currency</Label>
                    <Select value={storeForm.currency} onValueChange={(v) => setStoreForm({ ...storeForm, currency: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD" className="text-xs">USD ($)</SelectItem>
                        <SelectItem value="EUR" className="text-xs">EUR (€)</SelectItem>
                        <SelectItem value="GBP" className="text-xs">GBP (£)</SelectItem>
                        <SelectItem value="CAD" className="text-xs">CAD (C$)</SelectItem>
                        <SelectItem value="AUD" className="text-xs">AUD (A$)</SelectItem>
                        <SelectItem value="NZD" className="text-xs">NZD (NZ$)</SelectItem>
                        <SelectItem value="ZAR" className="text-xs">ZAR (R)</SelectItem>
                        <SelectItem value="SGD" className="text-xs">SGD (S$)</SelectItem>
                        <SelectItem value="JPY" className="text-xs">JPY (¥)</SelectItem>
                        <SelectItem value="INR" className="text-xs">INR (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Timezone</Label>
                    <Select value={storeForm.timezone} onValueChange={(v) => setStoreForm({ ...storeForm, timezone: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York" className="text-xs">Eastern (US)</SelectItem>
                        <SelectItem value="America/Chicago" className="text-xs">Central (US)</SelectItem>
                        <SelectItem value="America/Denver" className="text-xs">Mountain (US)</SelectItem>
                        <SelectItem value="America/Los_Angeles" className="text-xs">Pacific (US)</SelectItem>
                        <SelectItem value="Europe/London" className="text-xs">London (GMT)</SelectItem>
                        <SelectItem value="Europe/Berlin" className="text-xs">Berlin (CET)</SelectItem>
                        <SelectItem value="Australia/Sydney" className="text-xs">Sydney (AEST)</SelectItem>
                        <SelectItem value="Pacific/Auckland" className="text-xs">Auckland (NZST)</SelectItem>
                        <SelectItem value="Africa/Johannesburg" className="text-xs">Johannesburg (SAST)</SelectItem>
                        <SelectItem value="Asia/Singapore" className="text-xs">Singapore (SGT)</SelectItem>
                        <SelectItem value="Asia/Tokyo" className="text-xs">Tokyo (JST)</SelectItem>
                        <SelectItem value="Asia/Kolkata" className="text-xs">India (IST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button size="sm" className="h-8 text-xs gap-1" onClick={handleSaveStore} disabled={updateStore.isPending}>
                  <Save className="h-3.5 w-3.5" /> {updateStore.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding" className="space-y-3">
            <Card>
              <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Store Branding</CardTitle></CardHeader>
              <CardContent className="p-4 pt-2 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Primary Color</Label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={brandForm.primary_color}
                        onChange={(e) => setBrandForm({ ...brandForm, primary_color: e.target.value })}
                        className="h-8 w-12 rounded border cursor-pointer"
                      />
                      <Input className="h-8 text-xs flex-1" value={brandForm.primary_color} onChange={(e) => setBrandForm({ ...brandForm, primary_color: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Logo URL</Label>
                    <Input className="h-8 text-xs" value={brandForm.logo_url} onChange={(e) => setBrandForm({ ...brandForm, logo_url: e.target.value })} placeholder="https://..." />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Favicon URL</Label>
                    <Input className="h-8 text-xs" value={brandForm.favicon_url} onChange={(e) => setBrandForm({ ...brandForm, favicon_url: e.target.value })} placeholder="https://example.com/favicon.ico" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Google Analytics Tracking ID</Label>
                    <Input className="h-8 text-xs" value={brandForm.ga_tracking_id} onChange={(e) => setBrandForm({ ...brandForm, ga_tracking_id: e.target.value })} placeholder="G-XXXXXXXXXX" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Google Tag Manager Container ID</Label>
                    <Input className="h-8 text-xs" value={brandForm.gtm_container_id} onChange={(e) => setBrandForm({ ...brandForm, gtm_container_id: e.target.value })} placeholder="GTM-XXXXXXX" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Facebook / Meta Pixel ID</Label>
                    <Input className="h-8 text-xs" value={brandForm.fb_pixel_id} onChange={(e) => setBrandForm({ ...brandForm, fb_pixel_id: e.target.value })} placeholder="1234567890" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Google Ads Conversion ID</Label>
                    <Input className="h-8 text-xs" value={brandForm.google_ads_id} onChange={(e) => setBrandForm({ ...brandForm, google_ads_id: e.target.value })} placeholder="AW-XXXXXXXXX" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Google Ads Conversion Label</Label>
                    <Input className="h-8 text-xs" value={brandForm.google_ads_conversion_label} onChange={(e) => setBrandForm({ ...brandForm, google_ads_conversion_label: e.target.value })} placeholder="AbCdEfGhIjK" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Banner Text</Label>
                  <Input className="h-8 text-xs" value={brandForm.banner_text} onChange={(e) => setBrandForm({ ...brandForm, banner_text: e.target.value })} placeholder="Free shipping on orders over $50!" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Banner Start</Label>
                    <Input type="datetime-local" className="h-8 text-xs" value={brandForm.banner_start} onChange={(e) => setBrandForm({ ...brandForm, banner_start: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Banner End</Label>
                    <Input type="datetime-local" className="h-8 text-xs" value={brandForm.banner_end} onChange={(e) => setBrandForm({ ...brandForm, banner_end: e.target.value })} />
                  </div>
                </div>
                <p className="text-2xs text-muted-foreground">Leave dates empty to show banner always. Set dates to schedule the banner for a specific time window.</p>
                <div className="space-y-1">
                  <Label className="text-xs">Store Description</Label>
                  <Input className="h-8 text-xs" value={brandForm.description} onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })} placeholder="A short description of your store..." />
                </div>
                <Separator />
                <div className="space-y-1">
                  <Label className="text-xs">LiveChat / Support Widget Code</Label>
                  <Textarea className="text-xs font-mono min-h-[60px]" value={brandForm.chat_widget_code} onChange={(e) => setBrandForm({ ...brandForm, chat_widget_code: e.target.value })} placeholder="Paste your chat widget embed code (Tidio, LiveChat, Zendesk, Intercom, etc.)" />
                  <p className="text-2xs text-muted-foreground">Paste the full &lt;script&gt; embed code from your chat provider. It will be injected on your storefront.</p>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-md border bg-muted/30">
                  <div className="h-10 w-10 rounded-lg" style={{ backgroundColor: brandForm.primary_color }} />
                  <div>
                    <p className="text-xs font-medium">Preview</p>
                    <p className="text-2xs text-muted-foreground">This color will be used as your store's accent color</p>
                  </div>
                </div>
                <Button size="sm" className="h-8 text-xs gap-1" onClick={handleSaveBranding} disabled={brandSaving}>
                  <Palette className="h-3.5 w-3.5" /> {brandSaving ? "Saving..." : "Save Branding"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seo" className="space-y-3">
            <SEOSettings />
          </TabsContent>

          <TabsContent value="checkout" className="space-y-3">
            <CheckoutSettings />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-3">
            <NotificationSettings />
          </TabsContent>

          <TabsContent value="theme" className="space-y-3">
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Paintbrush className="h-4 w-4" /> Theme Builder</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-4">
                {/* Colors */}
                <div>
                  <p className="text-xs font-semibold mb-2 flex items-center gap-1.5"><Palette className="h-3.5 w-3.5" /> Colors</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {[
                      { key: "primary_color", label: "Primary" },
                      { key: "secondary_color", label: "Secondary" },
                      { key: "accent_color", label: "Accent" },
                      { key: "background_color", label: "Background" },
                      { key: "text_color", label: "Text" },
                    ].map(({ key, label }) => (
                      <div key={key} className="space-y-1">
                        <Label className="text-2xs">{label}</Label>
                        <div className="flex gap-1.5 items-center">
                          <input
                            type="color"
                            value={(themeForm as any)[key]}
                            onChange={(e) => setThemeForm({ ...themeForm, [key]: e.target.value })}
                            className="h-8 w-10 rounded border cursor-pointer"
                          />
                          <Input className="h-8 text-2xs flex-1" value={(themeForm as any)[key]} onChange={(e) => setThemeForm({ ...themeForm, [key]: e.target.value })} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Typography */}
                <div>
                  <p className="text-xs font-semibold mb-2 flex items-center gap-1.5"><Type className="h-3.5 w-3.5" /> Typography</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Heading Font</Label>
                      <Select value={themeForm.heading_font} onValueChange={(v) => setThemeForm({ ...themeForm, heading_font: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {FONT_OPTIONS.map((f) => <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Body Font</Label>
                      <Select value={themeForm.body_font} onValueChange={(v) => setThemeForm({ ...themeForm, body_font: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {FONT_OPTIONS.map((f) => <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Layout */}
                <div>
                  <p className="text-xs font-semibold mb-2 flex items-center gap-1.5"><Layout className="h-3.5 w-3.5" /> Layout & Style</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Button Radius</Label>
                      <Select value={themeForm.button_radius} onValueChange={(v) => setThemeForm({ ...themeForm, button_radius: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" className="text-xs">Square</SelectItem>
                          <SelectItem value="sm" className="text-xs">Small</SelectItem>
                          <SelectItem value="md" className="text-xs">Medium</SelectItem>
                          <SelectItem value="lg" className="text-xs">Large</SelectItem>
                          <SelectItem value="full" className="text-xs">Pill</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Layout Style</Label>
                      <Select value={themeForm.layout_style} onValueChange={(v) => setThemeForm({ ...themeForm, layout_style: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard" className="text-xs">Standard</SelectItem>
                          <SelectItem value="wide" className="text-xs">Wide</SelectItem>
                          <SelectItem value="compact" className="text-xs">Compact</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Hero Style</Label>
                      <Select value={themeForm.hero_style} onValueChange={(v) => setThemeForm({ ...themeForm, hero_style: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="banner" className="text-xs">Banner</SelectItem>
                          <SelectItem value="slider" className="text-xs">Slider</SelectItem>
                          <SelectItem value="minimal" className="text-xs">Minimal</SelectItem>
                          <SelectItem value="split" className="text-xs">Split</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Product Cards</Label>
                      <Select value={themeForm.product_card_style} onValueChange={(v) => setThemeForm({ ...themeForm, product_card_style: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minimal" className="text-xs">Minimal</SelectItem>
                          <SelectItem value="card" className="text-xs">Card</SelectItem>
                          <SelectItem value="overlay" className="text-xs">Overlay</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Custom CSS */}
                <div className="space-y-1">
                  <Label className="text-xs">Custom CSS (advanced)</Label>
                  <Textarea
                    className="text-xs font-mono h-24"
                    value={themeForm.custom_css}
                    onChange={(e) => setThemeForm({ ...themeForm, custom_css: e.target.value })}
                    placeholder=".storefront-header { ... }"
                  />
                </div>

                {/* Preview */}
                <div className="p-4 rounded-lg border space-y-3">
                  <p className="text-xs font-medium">Live Preview</p>
                  <div className="flex items-center gap-3">
                    {[themeForm.primary_color, themeForm.secondary_color, themeForm.accent_color].map((c, i) => (
                      <div key={i} className="h-10 w-10 rounded-lg border" style={{ backgroundColor: c }} />
                    ))}
                    <div className="flex-1 p-2 rounded-lg" style={{ backgroundColor: themeForm.background_color, color: themeForm.text_color }}>
                      <p className="text-xs" style={{ fontFamily: themeForm.heading_font }}>Heading Preview</p>
                      <p className="text-2xs" style={{ fontFamily: themeForm.body_font }}>Body text preview</p>
                    </div>
                    <button
                      className="px-3 py-1.5 text-xs text-white"
                      style={{
                        backgroundColor: themeForm.primary_color,
                        borderRadius: themeForm.button_radius === "none" ? 0 : themeForm.button_radius === "full" ? 9999 : themeForm.button_radius === "sm" ? 4 : themeForm.button_radius === "lg" ? 12 : 6,
                      }}
                    >
                      Button Preview
                    </button>
                  </div>
                </div>

                <Button size="sm" className="h-8 text-xs gap-1" onClick={handleSaveTheme} disabled={themeSaving}>
                  <Paintbrush className="h-3.5 w-3.5" /> {themeSaving ? "Saving..." : "Save Theme"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-3">
            <Card>
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Team Members</CardTitle>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1"><Mail className="h-3 w-3" /> Invite</Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs h-8">Name</TableHead>
                      <TableHead className="text-xs h-8">Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingTeam ? (
                      <TableRow><TableCell colSpan={2}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
                    ) : team.length === 0 ? (
                      <TableRow><TableCell colSpan={2} className="text-center text-xs text-muted-foreground py-6">No team members</TableCell></TableRow>
                    ) : (
                      team.map((m: any) => (
                        <TableRow key={m.id} className="text-xs">
                          <TableCell className="py-2 font-medium">{m.profiles?.display_name || "Unknown"}</TableCell>
                          <TableCell className="py-2"><Badge variant="outline" className="text-2xs capitalize">{m.role}</Badge></TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tax" className="space-y-3">
            {/* Tax Mode */}
            <Card>
              <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Tax Mode</CardTitle></CardHeader>
              <CardContent className="p-4 pt-2 space-y-2">
                <p className="text-xs text-muted-foreground">Choose how tax is labeled and calculated across your store.</p>
                <div className="flex items-center gap-2">
                  <Select
                    defaultValue="standard"
                    onValueChange={async (v) => {
                      if (!currentStore) return;
                      await supabase.from("stores").update({ tax_mode: v } as any).eq("id", currentStore.id);
                      toast.success(`Tax mode set to ${v.toUpperCase()}`);
                    }}
                  >
                    <SelectTrigger className="h-8 w-48 text-xs"><SelectValue placeholder="Select tax mode" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard" className="text-xs">Standard (Tax)</SelectItem>
                      <SelectItem value="gst" className="text-xs">GST (Goods & Services Tax)</SelectItem>
                      <SelectItem value="vat" className="text-xs">VAT (Value Added Tax)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Tax Rates</CardTitle>
                <Dialog open={taxOpen} onOpenChange={setTaxOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1"><Plus className="h-3 w-3" /> Add Rate</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle className="text-sm">New Tax Rate</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div className="space-y-1"><Label className="text-xs">Name</Label><Input className="h-8 text-xs" value={newTax.name} onChange={(e) => setNewTax({ ...newTax, name: e.target.value })} placeholder="US Standard" /></div>
                      <div className="space-y-1"><Label className="text-xs">Region</Label><Input className="h-8 text-xs" value={newTax.region} onChange={(e) => setNewTax({ ...newTax, region: e.target.value })} placeholder="United States" /></div>
                      <div className="space-y-1"><Label className="text-xs">Rate (%)</Label><Input className="h-8 text-xs" type="number" step="0.001" value={newTax.rate} onChange={(e) => setNewTax({ ...newTax, rate: e.target.value })} placeholder="8.875" /></div>
                      <Button size="sm" className="h-8 text-xs w-full" onClick={() => {
                        createTaxRate.mutate({ name: newTax.name, region: newTax.region, rate: parseFloat(newTax.rate) || 0 },
                          { onSuccess: () => { setTaxOpen(false); setNewTax({ name: "", region: "", rate: "" }); } });
                      }} disabled={createTaxRate.isPending}>{createTaxRate.isPending ? "Creating..." : "Create"}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="text-xs h-8">Name</TableHead>
                    <TableHead className="text-xs h-8">Region</TableHead>
                    <TableHead className="text-xs h-8 text-right">Rate</TableHead>
                    <TableHead className="text-xs h-8 w-10"></TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {loadingTax ? (
                      <TableRow><TableCell colSpan={4}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
                    ) : taxRates.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-6">No tax rates configured</TableCell></TableRow>
                    ) : (
                      taxRates.map((t) => (
                        <TableRow key={t.id} className="text-xs">
                          <TableCell className="py-2 font-medium">{t.name}</TableCell>
                          <TableCell className="py-2 text-muted-foreground">{t.region}</TableCell>
                          <TableCell className="py-2 text-right">{Number(t.rate)}%</TableCell>
                          <TableCell className="py-2"><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteTaxRate.mutate(t.id)}><Trash2 className="h-3 w-3" /></Button></TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shipping" className="space-y-3">
            <Card>
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Shipping Zones</CardTitle>
                <Dialog open={shipOpen} onOpenChange={setShipOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1"><Plus className="h-3 w-3" /> Add Zone</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle className="text-sm">New Shipping Zone</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div className="space-y-1"><Label className="text-xs">Zone Name</Label><Input className="h-8 text-xs" value={newShip.name} onChange={(e) => setNewShip({ ...newShip, name: e.target.value })} placeholder="Domestic" /></div>
                      <div className="space-y-1"><Label className="text-xs">Regions</Label><Input className="h-8 text-xs" value={newShip.regions} onChange={(e) => setNewShip({ ...newShip, regions: e.target.value })} placeholder="United States" /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1"><Label className="text-xs">Flat Rate</Label><Input className="h-8 text-xs" type="number" step="0.01" value={newShip.flat_rate} onChange={(e) => setNewShip({ ...newShip, flat_rate: e.target.value })} placeholder="5.99" /></div>
                        <div className="space-y-1"><Label className="text-xs">Free Above</Label><Input className="h-8 text-xs" type="number" step="0.01" value={newShip.free_above} onChange={(e) => setNewShip({ ...newShip, free_above: e.target.value })} placeholder="50.00" /></div>
                      </div>
                      <Button size="sm" className="h-8 text-xs w-full" onClick={() => {
                        createShippingZone.mutate(
                          { name: newShip.name, regions: newShip.regions, flat_rate: parseFloat(newShip.flat_rate) || 0, free_above: newShip.free_above ? parseFloat(newShip.free_above) : null },
                          { onSuccess: () => { setShipOpen(false); setNewShip({ name: "", regions: "", flat_rate: "", free_above: "" }); } }
                        );
                      }} disabled={createShippingZone.isPending}>{createShippingZone.isPending ? "Creating..." : "Create"}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="text-xs h-8">Zone</TableHead>
                    <TableHead className="text-xs h-8">Regions</TableHead>
                    <TableHead className="text-xs h-8 text-right">Flat Rate</TableHead>
                    <TableHead className="text-xs h-8 text-right">Free Above</TableHead>
                    <TableHead className="text-xs h-8 w-10"></TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {loadingShipping ? (
                      <TableRow><TableCell colSpan={5}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
                    ) : shippingZones.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-6">No shipping zones configured</TableCell></TableRow>
                    ) : (
                      shippingZones.map((sz) => (
                        <TableRow key={sz.id} className="text-xs">
                          <TableCell className="py-2 font-medium">{sz.name}</TableCell>
                          <TableCell className="py-2 text-muted-foreground">{sz.regions}</TableCell>
                          <TableCell className="py-2 text-right">${Number(sz.flat_rate).toFixed(2)}</TableCell>
                          <TableCell className="py-2 text-right">{sz.free_above ? `$${Number(sz.free_above).toFixed(2)}` : "—"}</TableCell>
                          <TableCell className="py-2"><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteShippingZone.mutate(sz.id)}><Trash2 className="h-3 w-3" /></Button></TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customer Groups Tab */}
          <TabsContent value="groups" className="space-y-3">
            <Card>
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Customer Groups</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" className="text-xs h-7"><Plus className="h-3 w-3 mr-1" />Add Group</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle className="text-sm">New Customer Group</DialogTitle></DialogHeader>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      createCustomerGroup.mutate({
                        name: fd.get("name") as string,
                        discount_percent: parseFloat(fd.get("discount") as string) || 0,
                        description: fd.get("description") as string || undefined,
                      });
                      (e.target as HTMLFormElement).reset();
                    }} className="space-y-3">
                      <div><Label className="text-xs">Name</Label><Input name="name" required className="h-8 text-xs" placeholder="e.g. Wholesale" /></div>
                      <div><Label className="text-xs">Discount %</Label><Input name="discount" type="number" step="0.01" className="h-8 text-xs" placeholder="0" /></div>
                      <div><Label className="text-xs">Credit Terms</Label><Input name="credit_terms" className="h-8 text-xs" placeholder="e.g. Net 30" /></div>
                      <div><Label className="text-xs">Credit Limit ($)</Label><Input name="credit_limit" type="number" step="0.01" className="h-8 text-xs" placeholder="0" /></div>
                      <div><Label className="text-xs">Description</Label><Input name="description" className="h-8 text-xs" /></div>
                      <Button type="submit" size="sm" className="w-full text-xs" disabled={createCustomerGroup.isPending}>Create Group</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {loadingGroups ? <Skeleton className="h-20 w-full" /> : (customerGroups as any[]).length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">No customer groups yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                         <TableHead className="text-xs h-8">Name</TableHead>
                         <TableHead className="text-xs h-8">Discount</TableHead>
                         <TableHead className="text-xs h-8">Credit Terms</TableHead>
                         <TableHead className="text-xs h-8">Credit Limit</TableHead>
                         <TableHead className="text-xs h-8">Tax Exempt</TableHead>
                         <TableHead className="text-xs h-8 w-8"></TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       {(customerGroups as any[]).map((g: any) => (
                         <TableRow key={g.id} className="text-xs">
                           <TableCell className="py-2 font-medium">{g.name}</TableCell>
                           <TableCell className="py-2">{g.discount_percent > 0 ? `${g.discount_percent}%` : "—"}</TableCell>
                           <TableCell className="py-2">{g.credit_terms || "—"}</TableCell>
                           <TableCell className="py-2">{g.credit_limit > 0 ? `$${Number(g.credit_limit).toFixed(2)}` : "—"}</TableCell>
                           <TableCell className="py-2">{g.is_tax_exempt ? <Badge variant="secondary" className="text-[10px]">Yes</Badge> : "No"}</TableCell>
                          <TableCell className="py-2">
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteCustomerGroup.mutate(g.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wholesale" className="space-y-3">
            <WholesaleApplicationsTab />
          </TabsContent>

          <TabsContent value="inventory" className="space-y-3">
            <InventorySettingsTab />
            <CurrencyFormatTab />
          </TabsContent>

          <TabsContent value="payments" className="space-y-3">
            <PaymentGatewaysTab />
          </TabsContent>

          <TabsContent value="email" className="space-y-3">
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">Email / SMTP Configuration</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-3">
                <p className="text-xs text-muted-foreground">Configure outgoing email settings for order confirmations, notifications, and marketing emails.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">SMTP Host</Label>
                    <Input className="h-8 text-xs" value={smtpForm.host} onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })} placeholder="smtp.gmail.com" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Port</Label>
                    <Select value={smtpForm.port} onValueChange={(v) => setSmtpForm({ ...smtpForm, port: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25" className="text-xs">25 (SMTP)</SelectItem>
                        <SelectItem value="465" className="text-xs">465 (SSL)</SelectItem>
                        <SelectItem value="587" className="text-xs">587 (TLS)</SelectItem>
                        <SelectItem value="2525" className="text-xs">2525 (Alt)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Username</Label>
                    <Input className="h-8 text-xs" value={smtpForm.username} onChange={(e) => setSmtpForm({ ...smtpForm, username: e.target.value })} placeholder="your@email.com" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Password</Label>
                    <Input type="password" className="h-8 text-xs" value={smtpForm.password} onChange={(e) => setSmtpForm({ ...smtpForm, password: e.target.value })} placeholder="••••••••" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">From Name</Label>
                    <Input className="h-8 text-xs" value={smtpForm.from_name} onChange={(e) => setSmtpForm({ ...smtpForm, from_name: e.target.value })} placeholder="My Store" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">From Email</Label>
                    <Input className="h-8 text-xs" value={smtpForm.from_email} onChange={(e) => setSmtpForm({ ...smtpForm, from_email: e.target.value })} placeholder="noreply@mystore.com" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Encryption</Label>
                  <Select value={smtpForm.encryption} onValueChange={(v) => setSmtpForm({ ...smtpForm, encryption: v })}>
                    <SelectTrigger className="h-8 text-xs w-48"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-xs">None</SelectItem>
                      <SelectItem value="ssl" className="text-xs">SSL</SelectItem>
                      <SelectItem value="tls" className="text-xs">TLS (Recommended)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button size="sm" className="h-8 text-xs gap-1" onClick={handleSaveSmtp} disabled={smtpSaving}>
                  <Save className="h-3.5 w-3.5" /> {smtpSaving ? "Saving..." : "Save Email Settings"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Returns Policy Tab */}
          <TabsContent value="returns">
            <ReturnsPolicyTab />
          </TabsContent>

          {/* Fulfillment Rules Tab */}
          <TabsContent value="fulfillment">
            <FulfillmentRulesTab />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
