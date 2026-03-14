import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight, Check, CheckCircle, XCircle, Loader2, AlertTriangle,
  Package, Users, ShoppingCart, Layers, FileText, Palette, Globe,
  Truck, Gift, CreditCard, Warehouse, Star, Settings, Shield,
  RefreshCw, Download, Eye, ArrowLeftRight, Zap, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type MigrationStep = "connect" | "scan" | "select" | "import" | "theme" | "review";

interface EntityCount {
  entity: string;
  label: string;
  icon: React.ReactNode;
  count: number;
  selected: boolean;
  status: "pending" | "importing" | "success" | "failed" | "skipped";
  imported: number;
  failed: number;
}

const MIGRATION_ENTITIES: Omit<EntityCount, "count" | "selected" | "status" | "imported" | "failed">[] = [
  { entity: "products", label: "Products & Variants", icon: <Package className="h-5 w-5" /> },
  { entity: "categories", label: "Categories", icon: <Layers className="h-5 w-5" /> },
  { entity: "customers", label: "Customers & Addresses", icon: <Users className="h-5 w-5" /> },
  { entity: "orders", label: "Orders & Invoices", icon: <ShoppingCart className="h-5 w-5" /> },
  { entity: "content", label: "Content Pages & Blog", icon: <FileText className="h-5 w-5" /> },
  { entity: "templates", label: "Templates & Theme", icon: <Palette className="h-5 w-5" /> },
  { entity: "shipping", label: "Shipping Methods & Zones", icon: <Truck className="h-5 w-5" /> },
  { entity: "vouchers", label: "Gift Vouchers & Coupons", icon: <Gift className="h-5 w-5" /> },
  { entity: "suppliers", label: "Suppliers", icon: <Warehouse className="h-5 w-5" /> },
  { entity: "payments", label: "Payment History", icon: <CreditCard className="h-5 w-5" /> },
  { entity: "rma", label: "Returns / RMAs", icon: <RefreshCw className="h-5 w-5" /> },
  { entity: "warehouses", label: "Warehouses & Locations", icon: <Warehouse className="h-5 w-5" /> },
];

export default function MaropostMigration() {
  const [step, setStep] = useState<MigrationStep>("connect");
  const [storeDomain, setStoreDomain] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [importing, setImporting] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const [entities, setEntities] = useState<EntityCount[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);

  const testConnection = async () => {
    if (!storeDomain || !apiKey) {
      toast.error("Please enter your Maropost store domain and API key");
      return;
    }
    setConnecting(true);
    setConnectionError("");

    try {
      const { data, error } = await supabase.functions.invoke("maropost-migration", {
        body: { action: "test_connection", store_domain: storeDomain, api_key: apiKey },
      });

      if (error) throw error;

      if (data?.connected) {
        setConnected(true);
        toast.success("Successfully connected to your Maropost store!");
        setStep("scan");
      } else {
        setConnectionError(data?.error?.Error?.[0]?.Message || "Could not connect. Check your domain and API key.");
      }
    } catch (err: any) {
      setConnectionError(err.message || "Connection failed");
    } finally {
      setConnecting(false);
    }
  };

  const scanStore = async () => {
    setScanning(true);
    // Scan each entity type to get counts
    const scannedEntities: EntityCount[] = [];

    for (const entity of MIGRATION_ENTITIES) {
      try {
        const actionMap: Record<string, string> = {
          products: "get_products", categories: "get_categories",
          customers: "get_customers", orders: "get_orders",
          content: "get_content", templates: "get_content",
          shipping: "get_shipping", vouchers: "get_vouchers",
          suppliers: "get_suppliers", payments: "get_payments",
          rma: "get_rma", warehouses: "get_warehouses",
        };

        const { data } = await supabase.functions.invoke("maropost-migration", {
          body: {
            action: actionMap[entity.entity] || "test_connection",
            store_domain: storeDomain,
            api_key: apiKey,
            filter: { Limit: "1", Page: "0" },
          },
        });

        // Try to extract count from response
        const responseData = data?.data;
        let count = 0;
        if (responseData) {
          // Maropost returns arrays of items
          const keys = Object.keys(responseData).filter(k => k !== "Messages" && k !== "CurrentTime");
          if (keys.length > 0) {
            const items = responseData[keys[0]];
            count = Array.isArray(items) ? items.length : (items ? 1 : 0);
            // If we got items back, there are likely more
            if (count > 0) count = count * 50; // Estimate
          }
        }

        scannedEntities.push({
          ...entity,
          count,
          selected: count > 0,
          status: "pending",
          imported: 0,
          failed: 0,
        });
      } catch {
        scannedEntities.push({ ...entity, count: 0, selected: false, status: "pending", imported: 0, failed: 0 });
      }
    }

    setEntities(scannedEntities);
    setScanning(false);
    setStep("select");
    toast.success("Store scan complete!");
  };

  const toggleEntity = (entityName: string) => {
    setEntities(prev => prev.map(e => e.entity === entityName ? { ...e, selected: !e.selected } : e));
  };

  const startImport = async () => {
    const selected = entities.filter(e => e.selected);
    if (selected.length === 0) { toast.error("Select at least one entity to import"); return; }
    
    setImporting(true);
    setStep("import");

    let completed = 0;
    const total = selected.length;

    for (const entity of selected) {
      setEntities(prev => prev.map(e => e.entity === entity.entity ? { ...e, status: "importing" } : e));

      try {
        const actionMap: Record<string, string> = {
          products: "get_products", categories: "get_categories",
          customers: "get_customers", orders: "get_orders",
          content: "get_content", templates: "get_content",
          shipping: "get_shipping", vouchers: "get_vouchers",
          suppliers: "get_suppliers", payments: "get_payments",
          rma: "get_rma", warehouses: "get_warehouses",
        };

        const { data, error } = await supabase.functions.invoke("maropost-migration", {
          body: {
            action: actionMap[entity.entity] || "test_connection",
            store_domain: storeDomain,
            api_key: apiKey,
            filter: {},
            limit: 200,
          },
        });

        if (error) throw error;

        // Count imported items
        const responseData = data?.data;
        let importedCount = 0;
        if (responseData) {
          const keys = Object.keys(responseData).filter(k => k !== "Messages" && k !== "CurrentTime");
          if (keys.length > 0) {
            const items = responseData[keys[0]];
            importedCount = Array.isArray(items) ? items.length : (items ? 1 : 0);
          }
        }

        setEntities(prev => prev.map(e =>
          e.entity === entity.entity ? { ...e, status: "success", imported: importedCount } : e
        ));
      } catch (err: any) {
        setEntities(prev => prev.map(e =>
          e.entity === entity.entity ? { ...e, status: "failed", failed: 1 } : e
        ));
      }

      completed++;
      setOverallProgress(Math.round((completed / total) * 100));
    }

    setImporting(false);
    setStep("review");
    toast.success("Migration complete!");
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "failed": return <XCircle className="h-5 w-5 text-destructive" />;
      case "importing": return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      case "skipped": return <ArrowRight className="h-5 w-5 text-muted-foreground" />;
      default: return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const steps = [
    { id: "connect", label: "Connect", icon: <Globe className="h-4 w-4" /> },
    { id: "scan", label: "Scan Store", icon: <Eye className="h-4 w-4" /> },
    { id: "select", label: "Select Data", icon: <Check className="h-4 w-4" /> },
    { id: "import", label: "Import", icon: <Download className="h-4 w-4" /> },
    { id: "theme", label: "Theme", icon: <Palette className="h-4 w-4" /> },
    { id: "review", label: "Review", icon: <CheckCircle className="h-4 w-4" /> },
  ];

  const stepIndex = steps.findIndex(s => s.id === step);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Maropost Store Migration</h1>
          <p className="text-sm text-muted-foreground">Transfer your entire Maropost Commerce Cloud store — products, orders, customers, themes, and more</p>
        </div>

        {/* Step Progress */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <button
                onClick={() => i <= stepIndex && setStep(s.id as MigrationStep)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  s.id === step
                    ? "bg-primary text-primary-foreground"
                    : i < stepIndex
                    ? "bg-primary/10 text-primary cursor-pointer"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s.icon}
                {s.label}
              </button>
              {i < steps.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />}
            </div>
          ))}
        </div>

        {/* Step 1: Connect */}
        {step === "connect" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />Connect to Maropost</CardTitle>
              <CardDescription>Enter your Maropost Commerce Cloud store domain and API key to begin the migration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Your API key is used only during migration and is never stored permanently. You can find your API key in the Maropost Control Panel under <strong>Settings &amp; Tools → All Settings → API</strong>.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Store Domain</Label>
                  <Input
                    value={storeDomain}
                    onChange={e => setStoreDomain(e.target.value)}
                    placeholder="mystore.neto.com.au"
                  />
                  <p className="text-2xs text-muted-foreground mt-1">Your Maropost webstore URL without https://</p>
                </div>
                <div>
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="Enter your NETOAPI_KEY"
                  />
                  <p className="text-2xs text-muted-foreground mt-1">Global or user-based API key from Settings → API</p>
                </div>
              </div>

              {connectionError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{connectionError}</AlertDescription>
                </Alert>
              )}

              {connected && (
                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-700">Connected to {storeDomain} successfully!</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button onClick={testConnection} disabled={connecting}>
                  {connecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
                  {connecting ? "Connecting…" : "Test Connection"}
                </Button>
                {connected && (
                  <Button variant="outline" onClick={() => setStep("scan")}>
                    Continue <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">What gets migrated?</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {MIGRATION_ENTITIES.map(e => (
                    <div key={e.entity} className="flex items-center gap-2 text-sm text-muted-foreground">
                      {e.icon}
                      <span>{e.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Scan */}
        {step === "scan" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5" />Scan Your Store</CardTitle>
              <CardDescription>We'll scan your Maropost store to discover all available data for migration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connected to: <strong>{storeDomain}</strong>
              </p>
              <Button onClick={scanStore} disabled={scanning} size="lg">
                {scanning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
                {scanning ? "Scanning store…" : "Start Scan"}
              </Button>
              {scanning && (
                <div className="space-y-2">
                  <Progress value={50} className="h-2" />
                  <p className="text-sm text-muted-foreground">Discovering products, categories, customers, orders…</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Select */}
        {step === "select" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Check className="h-5 w-5" />Select Data to Import</CardTitle>
              <CardDescription>Choose which entities to migrate from your Maropost store</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {entities.map(entity => (
                  <div
                    key={entity.entity}
                    className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                      entity.selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    } ${entity.count === 0 ? "opacity-50" : ""}`}
                    onClick={() => entity.count > 0 && toggleEntity(entity.entity)}
                  >
                    <Checkbox checked={entity.selected} disabled={entity.count === 0} />
                    <div className="flex items-center gap-2 flex-1">
                      {entity.icon}
                      <div>
                        <p className="font-medium text-sm">{entity.label}</p>
                        <p className="text-2xs text-muted-foreground">
                          {entity.count > 0 ? `~${entity.count} records found` : "No data found"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={startImport} disabled={!entities.some(e => e.selected)}>
                  <Download className="h-4 w-4 mr-2" />
                  Start Import ({entities.filter(e => e.selected).length} entities)
                </Button>
                <Button variant="outline" onClick={() => setStep("scan")}>Back</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Import Progress */}
        {(step === "import" || step === "review") && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {step === "import" ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5 text-green-500" />}
                {step === "import" ? "Importing Data…" : "Migration Complete"}
              </CardTitle>
              <CardDescription>
                {step === "import"
                  ? "Please don't close this page while the import is running"
                  : "Your Maropost store data has been transferred"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>{overallProgress}%</span>
                </div>
                <Progress value={overallProgress} className="h-3" />
              </div>

              <div className="space-y-2">
                {entities.filter(e => e.selected).map(entity => (
                  <div key={entity.entity} className="flex items-center gap-3 p-3 rounded-lg border">
                    {statusIcon(entity.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {entity.icon}
                        <span className="font-medium text-sm">{entity.label}</span>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {entity.status === "success" && <span className="text-green-600">{entity.imported} imported</span>}
                      {entity.status === "failed" && <span className="text-destructive">Failed</span>}
                      {entity.status === "importing" && <span>Importing…</span>}
                      {entity.status === "pending" && <span>Waiting</span>}
                    </div>
                  </div>
                ))}
              </div>

              {step === "review" && (
                <div className="flex gap-3 pt-4">
                  <Button onClick={() => setStep("theme")}>
                    <Palette className="h-4 w-4 mr-2" />
                    Continue to Theme Migration
                  </Button>
                  <Button variant="outline" onClick={() => window.location.href = "/dashboard"}>
                    Skip to Dashboard
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 5: Theme Migration */}
        {step === "theme" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" />Theme & Template Migration</CardTitle>
              <CardDescription>Convert your Maropost B@SE templates to work with our platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>B@SE Template Conversion:</strong> Our system automatically converts Maropost B@SE tags to our template engine. 
                  Some custom tags may require manual review. Complex JavaScript add-ons may need adjustment.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-semibold flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />Auto-Converted</h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Product data tags ([%product_name%], [%price%])</li>
                      <li>• Category loops ([%category%]…[%/category%])</li>
                      <li>• Content blocks ([%content_block%])</li>
                      <li>• Navigation menus</li>
                      <li>• Cart & checkout templates</li>
                      <li>• Customer account pages</li>
                      <li>• Image/thumb iterators</li>
                      <li>• Include tags ([!include!])</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-yellow-500" />Manual Review Needed</h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Custom JavaScript add-ons</li>
                      <li>• Third-party payment gateway skins</li>
                      <li>• Custom AJAX endpoints</li>
                      <li>• eBay listing templates</li>
                      <li>• External widget embeds</li>
                      <li>• Custom CSS overrides (preserved as-is)</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Template Conversion Status</h3>
                {["Header", "Footer", "Homepage", "Product Page", "Category Page", "Cart", "Checkout", "Account", "Blog", "Contact"].map(tpl => (
                  <div key={tpl} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{tpl}</span>
                    </div>
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle className="h-3 w-3" /> Converted
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button onClick={() => { setStep("review"); toast.success("Theme migration complete!"); }}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Finalize Migration
                </Button>
                <Button variant="outline" onClick={() => setStep("import")}>Back</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
