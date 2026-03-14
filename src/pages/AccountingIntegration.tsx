import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Save, Plus, Trash2, Link, RefreshCw, CheckCircle, XCircle, ArrowRightLeft, Receipt } from "lucide-react";

const ACCOUNTING_SYSTEMS = [
  { key: "xero", name: "Xero", logo: "🔵", fields: ["client_id", "client_secret", "tenant_id"] },
  { key: "myob", name: "MYOB", logo: "🟣", fields: ["api_key", "company_file_uri", "username", "password"] },
  { key: "quickbooks", name: "QuickBooks Online", logo: "🟢", fields: ["client_id", "client_secret", "realm_id"] },
  { key: "reckon", name: "Reckon", logo: "🟠", fields: ["api_key", "book_id"] },
];

const DEFAULT_CHART = [
  { code: "4000", name: "Sales Revenue", type: "revenue", mapping: "product_sales" },
  { code: "4100", name: "Shipping Revenue", type: "revenue", mapping: "shipping_income" },
  { code: "4200", name: "Gift Voucher Revenue", type: "revenue", mapping: "voucher_sales" },
  { code: "5000", name: "Cost of Goods Sold", type: "expense", mapping: "cogs" },
  { code: "5100", name: "Shipping Expense", type: "expense", mapping: "shipping_expense" },
  { code: "2100", name: "GST/VAT Collected", type: "liability", mapping: "tax_collected" },
  { code: "2200", name: "GST/VAT Paid", type: "liability", mapping: "tax_paid" },
  { code: "1100", name: "Accounts Receivable", type: "asset", mapping: "accounts_receivable" },
  { code: "1200", name: "Inventory Asset", type: "asset", mapping: "inventory" },
  { code: "4300", name: "Discount Given", type: "expense", mapping: "discounts" },
  { code: "4400", name: "Refunds Issued", type: "expense", mapping: "refunds" },
];

const MAPPING_OPTIONS = [
  "product_sales", "shipping_income", "voucher_sales", "cogs", "shipping_expense",
  "tax_collected", "tax_paid", "accounts_receivable", "inventory", "discounts", "refunds",
  "payment_fees", "layby_deposits", "credit_notes",
];

export default function AccountingIntegration() {
  const { currentStore } = useAuth();
  const [connections, setConnections] = useState<any[]>([]);
  const [chartOfAccounts, setChartOfAccounts] = useState(DEFAULT_CHART);
  const [newAccount, setNewAccount] = useState({ code: "", name: "", type: "revenue", mapping: "product_sales" });
  const [syncSettings, setSyncSettings] = useState({
    auto_post_invoices: false,
    sync_payments: true,
    sync_refunds: true,
    sync_on_order_complete: true,
    sync_inventory_adjustments: false,
  });

  useEffect(() => {
    if (!currentStore) return;
    // Load connections from store_addons
    supabase.from("store_addons" as any).select("*").eq("store_id", currentStore.id)
      .in("addon_key", ["xero", "myob", "quickbooks", "reckon"])
      .then(({ data }) => {
        if (data) setConnections(data);
      });
  }, [currentStore]);

  const connectSystem = async (sys: typeof ACCOUNTING_SYSTEMS[0]) => {
    if (!currentStore) return;
    const config: Record<string, string> = {};
    sys.fields.forEach(f => { config[f] = ""; });
    const { data, error } = await supabase.from("store_addons" as any).insert({
      store_id: currentStore.id,
      addon_key: sys.key,
      config,
      is_active: false,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setConnections([...connections, data]);
    toast.success(`${sys.name} connection added — enter credentials to activate`);
  };

  const updateConnection = async (id: string, updates: any) => {
    await supabase.from("store_addons" as any).update(updates).eq("id", id);
    setConnections(connections.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const removeConnection = async (id: string) => {
    await supabase.from("store_addons" as any).delete().eq("id", id);
    setConnections(connections.filter(c => c.id !== id));
    toast.success("Connection removed");
  };

  const addAccountRow = () => {
    if (!newAccount.code || !newAccount.name) { toast.error("Code and name required"); return; }
    setChartOfAccounts([...chartOfAccounts, newAccount]);
    setNewAccount({ code: "", name: "", type: "revenue", mapping: "product_sales" });
    toast.success("Account added");
  };

  const removeAccountRow = (i: number) => {
    setChartOfAccounts(chartOfAccounts.filter((_, idx) => idx !== i));
  };

  const connectedKeys = connections.map(c => c.addon_key);
  const availableSystems = ACCOUNTING_SYSTEMS.filter(s => !connectedKeys.includes(s.key));

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div>
          <h1 className="text-lg font-semibold">Accounting Integration</h1>
          <p className="text-xs text-muted-foreground">Connect your accounting software and configure chart of accounts mapping</p>
        </div>

        <Tabs defaultValue="connections">
          <TabsList>
            <TabsTrigger value="connections" className="text-xs">Connections</TabsTrigger>
            <TabsTrigger value="chart" className="text-xs">Chart of Accounts</TabsTrigger>
            <TabsTrigger value="sync" className="text-xs">Sync Settings</TabsTrigger>
            <TabsTrigger value="reconciliation" className="text-xs">Reconciliation</TabsTrigger>
          </TabsList>

          <TabsContent value="connections" className="space-y-3">
            {/* Connected systems */}
            {connections.map(conn => {
              const sys = ACCOUNTING_SYSTEMS.find(s => s.key === conn.addon_key);
              if (!sys) return null;
              return (
                <Card key={conn.id}>
                  <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{sys.logo}</span>
                      <CardTitle className="text-sm">{sys.name}</CardTitle>
                      <Badge variant={conn.is_active ? "default" : "outline"} className="text-[10px]">
                        {conn.is_active ? "Connected" : "Not Connected"}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => updateConnection(conn.id, { is_active: !conn.is_active })}>
                        {conn.is_active ? <XCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                        {conn.is_active ? "Disconnect" : "Activate"}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => removeConnection(conn.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      {sys.fields.map(field => (
                        <div key={field} className="space-y-1">
                          <Label className="text-xs capitalize">{field.replace(/_/g, " ")}</Label>
                          <Input
                            className="h-8 text-xs"
                            type={field.includes("secret") || field.includes("password") || field.includes("key") ? "password" : "text"}
                            value={(conn.config || {})[field] || ""}
                            onChange={(e) => {
                              const newConfig = { ...conn.config, [field]: e.target.value };
                              updateConnection(conn.id, { config: newConfig });
                            }}
                            placeholder={field}
                          />
                        </div>
                      ))}
                    </div>
                    <Button size="sm" className="mt-3 h-7 text-xs gap-1" onClick={() => toast.success(`${sys.name} credentials saved`)}>
                      <Save className="h-3 w-3" /> Save Credentials
                    </Button>
                  </CardContent>
                </Card>
              );
            })}

            {/* Add new connection */}
            {availableSystems.length > 0 && (
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm">Add Accounting System</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {availableSystems.map(sys => (
                      <Button key={sys.key} variant="outline" size="sm" className="h-12 text-xs flex-col gap-1" onClick={() => connectSystem(sys)}>
                        <span className="text-lg">{sys.logo}</span>
                        {sys.name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="chart" className="space-y-3">
            <Card>
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2"><Receipt className="h-4 w-4" /> Chart of Accounts Mapping</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs h-8">Code</TableHead>
                      <TableHead className="text-xs h-8">Account Name</TableHead>
                      <TableHead className="text-xs h-8">Type</TableHead>
                      <TableHead className="text-xs h-8">Maps To</TableHead>
                      <TableHead className="text-xs h-8 w-8"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chartOfAccounts.map((acc, i) => (
                      <TableRow key={i} className="text-xs">
                        <TableCell className="py-1.5 font-mono">{acc.code}</TableCell>
                        <TableCell className="py-1.5">{acc.name}</TableCell>
                        <TableCell className="py-1.5">
                          <Badge variant="secondary" className="text-[10px] capitalize">{acc.type}</Badge>
                        </TableCell>
                        <TableCell className="py-1.5">
                          <Select value={acc.mapping} onValueChange={(v) => {
                            const updated = [...chartOfAccounts];
                            updated[i] = { ...updated[i], mapping: v };
                            setChartOfAccounts(updated);
                          }}>
                            <SelectTrigger className="h-7 text-xs w-40"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {MAPPING_OPTIONS.map(opt => (
                                <SelectItem key={opt} value={opt} className="text-xs capitalize">{opt.replace(/_/g, " ")}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="py-1.5">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeAccountRow(i)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Add row */}
                    <TableRow className="text-xs bg-muted/30">
                      <TableCell className="py-1.5">
                        <Input className="h-7 text-xs w-16" value={newAccount.code} onChange={(e) => setNewAccount({ ...newAccount, code: e.target.value })} placeholder="Code" />
                      </TableCell>
                      <TableCell className="py-1.5">
                        <Input className="h-7 text-xs" value={newAccount.name} onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })} placeholder="Account name" />
                      </TableCell>
                      <TableCell className="py-1.5">
                        <Select value={newAccount.type} onValueChange={(v) => setNewAccount({ ...newAccount, type: v })}>
                          <SelectTrigger className="h-7 text-xs w-24"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="revenue" className="text-xs">Revenue</SelectItem>
                            <SelectItem value="expense" className="text-xs">Expense</SelectItem>
                            <SelectItem value="asset" className="text-xs">Asset</SelectItem>
                            <SelectItem value="liability" className="text-xs">Liability</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <Select value={newAccount.mapping} onValueChange={(v) => setNewAccount({ ...newAccount, mapping: v })}>
                          <SelectTrigger className="h-7 text-xs w-40"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {MAPPING_OPTIONS.map(opt => (
                              <SelectItem key={opt} value={opt} className="text-xs capitalize">{opt.replace(/_/g, " ")}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={addAccountRow}><Plus className="h-3 w-3" /></Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sync" className="space-y-3">
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Sync Settings</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-4">
                {[
                  { key: "auto_post_invoices", label: "Auto-Post Invoices", desc: "Automatically post invoices to accounting when orders are completed" },
                  { key: "sync_payments", label: "Sync Payments", desc: "Sync payment records to accounting system" },
                  { key: "sync_refunds", label: "Sync Refunds", desc: "Sync refund transactions to accounting" },
                  { key: "sync_on_order_complete", label: "Sync on Order Complete", desc: "Trigger sync when order status changes to completed" },
                  { key: "sync_inventory_adjustments", label: "Sync Inventory Adjustments", desc: "Sync stock adjustments to inventory asset account" },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <Switch
                      checked={(syncSettings as any)[key]}
                      onCheckedChange={(v) => setSyncSettings({ ...syncSettings, [key]: v })}
                    />
                  </div>
                ))}
                <Separator />
                <Button size="sm" className="text-xs gap-1" onClick={async () => {
                  if (!currentStore) return;
                  const { error } = await supabase.from("store_addons").upsert({
                    store_id: currentStore.id, addon_key: "accounting_sync_settings", name: "Accounting Sync Settings", config: syncSettings as any, is_enabled: true, is_active: true, is_installed: true
                  }, { onConflict: "store_id,addon_key" });
                  if (error) toast.error(error.message);
                  else toast.success("Sync settings saved");
                }}><Save className="h-3.5 w-3.5" /> Save Sync Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reconciliation" className="space-y-3">
            <PaymentReconciliation />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

function PaymentReconciliation() {
  const { currentStore } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentStore) return;
    Promise.all([
      supabase.from("orders").select("id, order_number, total, payment_status, created_at")
        .eq("store_id", currentStore.id).order("created_at", { ascending: false }).limit(100),
      supabase.from("order_payments").select("id, order_id, amount, payment_method, created_at")
        .eq("store_id", currentStore.id).order("created_at", { ascending: false }).limit(500),
    ]).then(([ordersRes, paymentsRes]) => {
      setOrders(ordersRes.data || []);
      setPayments(paymentsRes.data || []);
      setLoading(false);
    });
  }, [currentStore]);

  // Calculate reconciliation
  const reconciled = orders.map(order => {
    const orderPayments = payments.filter(p => p.order_id === order.id);
    const totalPaid = orderPayments.reduce((s, p) => s + Number(p.amount), 0);
    const orderTotal = Number(order.total);
    const difference = totalPaid - orderTotal;
    const status = Math.abs(difference) < 0.01 ? "balanced" : difference > 0 ? "overpaid" : "underpaid";
    return { ...order, totalPaid, difference, status, paymentCount: orderPayments.length };
  });

  const balanced = reconciled.filter(r => r.status === "balanced").length;
  const underpaid = reconciled.filter(r => r.status === "underpaid").length;
  const overpaid = reconciled.filter(r => r.status === "overpaid").length;
  const totalDiscrepancy = reconciled.reduce((s, r) => s + Math.abs(r.difference), 0);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-3">
        <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Balanced</p><p className="text-lg font-bold text-primary">{balanced}</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Underpaid</p><p className="text-lg font-bold text-destructive">{underpaid}</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Overpaid</p><p className="text-lg font-bold text-accent-foreground">{overpaid}</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Total Discrepancy</p><p className="text-lg font-bold">${totalDiscrepancy.toFixed(2)}</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><ArrowRightLeft className="h-4 w-4" /> Payment Reconciliation</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs h-8">Order</TableHead>
                <TableHead className="text-xs h-8 text-right">Order Total</TableHead>
                <TableHead className="text-xs h-8 text-right">Payments</TableHead>
                <TableHead className="text-xs h-8 text-right">Total Paid</TableHead>
                <TableHead className="text-xs h-8 text-right">Difference</TableHead>
                <TableHead className="text-xs h-8">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center text-xs py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : reconciled.filter(r => r.status !== "balanced").length === 0 && reconciled.length > 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-xs py-8 text-muted-foreground">✅ All orders are fully reconciled</TableCell></TableRow>
              ) : (
                reconciled.filter(r => r.status !== "balanced").slice(0, 50).map(r => (
                  <TableRow key={r.id} className="text-xs">
                    <TableCell className="py-1.5 font-mono">{r.order_number}</TableCell>
                    <TableCell className="py-1.5 text-right">${Number(r.total).toFixed(2)}</TableCell>
                    <TableCell className="py-1.5 text-right">{r.paymentCount}</TableCell>
                    <TableCell className="py-1.5 text-right">${r.totalPaid.toFixed(2)}</TableCell>
                    <TableCell className={`py-1.5 text-right font-medium ${r.status === "underpaid" ? "text-destructive" : "text-accent-foreground"}`}>
                      {r.difference > 0 ? "+" : ""}${r.difference.toFixed(2)}
                    </TableCell>
                    <TableCell className="py-1.5">
                      <Badge variant={r.status === "underpaid" ? "destructive" : "secondary"} className="text-[10px] capitalize">{r.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
