import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Code, Copy, Play, Lock, Unlock, ChevronDown, ChevronRight, Terminal, Book, Zap } from "lucide-react";
import { toast } from "sonner";

interface Endpoint {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  description: string;
  auth: boolean;
  params?: { name: string; type: string; required: boolean; description: string }[];
  body?: { name: string; type: string; required: boolean; description: string }[];
  response?: string;
}

interface ApiSection {
  name: string;
  description: string;
  endpoints: Endpoint[];
}

const apiSections: ApiSection[] = [
  {
    name: "Products",
    description: "Manage product catalog",
    endpoints: [
      { method: "GET", path: "/rest/v1/products", description: "List all products with pagination", auth: true,
        params: [
          { name: "select", type: "string", required: false, description: "Fields to return (comma-separated)" },
          { name: "store_id", type: "uuid", required: true, description: "Filter by store" },
          { name: "status", type: "string", required: false, description: "Filter by status (active, draft, archived)" },
          { name: "limit", type: "integer", required: false, description: "Max rows (default 1000)" },
          { name: "offset", type: "integer", required: false, description: "Pagination offset" },
        ],
        response: `[{ "id": "uuid", "title": "string", "sku": "string", "price": 0, "stock_quantity": 0, "status": "active" }]`,
      },
      { method: "GET", path: "/rest/v1/products?id=eq.{id}", description: "Get a single product by ID", auth: true,
        params: [{ name: "id", type: "uuid", required: true, description: "Product ID" }],
        response: `{ "id": "uuid", "title": "string", "sku": "string", "price": 0, "description": "string", "images": [] }`,
      },
      { method: "POST", path: "/rest/v1/products", description: "Create a new product", auth: true,
        body: [
          { name: "title", type: "string", required: true, description: "Product name" },
          { name: "sku", type: "string", required: false, description: "Stock Keeping Unit" },
          { name: "price", type: "number", required: true, description: "Selling price" },
          { name: "store_id", type: "uuid", required: true, description: "Store ID" },
        ],
      },
      { method: "PATCH", path: "/rest/v1/products?id=eq.{id}", description: "Update a product", auth: true,
        body: [
          { name: "title", type: "string", required: false, description: "Product name" },
          { name: "price", type: "number", required: false, description: "Selling price" },
          { name: "status", type: "string", required: false, description: "active | draft | archived" },
        ],
      },
      { method: "DELETE", path: "/rest/v1/products?id=eq.{id}", description: "Delete a product", auth: true },
    ],
  },
  {
    name: "Orders",
    description: "Manage orders and fulfillment",
    endpoints: [
      { method: "GET", path: "/rest/v1/orders", description: "List orders with filters", auth: true,
        params: [
          { name: "store_id", type: "uuid", required: true, description: "Store ID" },
          { name: "status", type: "string", required: false, description: "Filter by order status" },
          { name: "order", type: "string", required: false, description: "Sort: created_at.desc" },
        ],
        response: `[{ "id": "uuid", "order_number": "string", "status": "string", "total": 0, "created_at": "timestamp" }]`,
      },
      { method: "POST", path: "/rest/v1/orders", description: "Create a new order", auth: true,
        body: [
          { name: "store_id", type: "uuid", required: true, description: "Store ID" },
          { name: "customer_id", type: "uuid", required: false, description: "Customer ID" },
          { name: "status", type: "string", required: false, description: "Order status (default: pending)" },
        ],
      },
      { method: "PATCH", path: "/rest/v1/orders?id=eq.{id}", description: "Update order status or details", auth: true },
    ],
  },
  {
    name: "Customers",
    description: "Customer management",
    endpoints: [
      { method: "GET", path: "/rest/v1/customers", description: "List customers", auth: true,
        params: [
          { name: "store_id", type: "uuid", required: true, description: "Store ID" },
          { name: "email", type: "string", required: false, description: "Filter by email" },
        ],
      },
      { method: "POST", path: "/rest/v1/customers", description: "Create a customer", auth: true,
        body: [
          { name: "name", type: "string", required: true, description: "Customer name" },
          { name: "email", type: "string", required: false, description: "Email address" },
          { name: "store_id", type: "uuid", required: true, description: "Store ID" },
        ],
      },
      { method: "PATCH", path: "/rest/v1/customers?id=eq.{id}", description: "Update a customer", auth: true },
      { method: "DELETE", path: "/rest/v1/customers?id=eq.{id}", description: "Delete a customer", auth: true },
    ],
  },
  {
    name: "Inventory",
    description: "Stock and inventory management",
    endpoints: [
      { method: "GET", path: "/rest/v1/inventory_stock", description: "List stock levels across locations", auth: true },
      { method: "PATCH", path: "/rest/v1/inventory_stock?id=eq.{id}", description: "Update stock quantity", auth: true,
        body: [{ name: "quantity", type: "integer", required: true, description: "New stock quantity" }],
      },
    ],
  },
  {
    name: "Webhooks",
    description: "Manage event webhooks",
    endpoints: [
      { method: "GET", path: "/rest/v1/webhooks", description: "List registered webhooks", auth: true },
      { method: "POST", path: "/rest/v1/webhooks", description: "Register a new webhook", auth: true,
        body: [
          { name: "url", type: "string", required: true, description: "Callback URL" },
          { name: "event_type", type: "string", required: true, description: "Event to listen for" },
          { name: "store_id", type: "uuid", required: true, description: "Store ID" },
        ],
      },
      { method: "DELETE", path: "/rest/v1/webhooks?id=eq.{id}", description: "Remove a webhook", auth: true },
    ],
  },
];

const methodColors: Record<string, string> = {
  GET: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  POST: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  PATCH: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  DELETE: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function ApiDocs() {
  const { currentStore } = useAuth();
  const [search, setSearch] = useState("");
  const [testMode, setTestMode] = useState(false);
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set());
  const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}`;

  const toggleEndpoint = (key: string) => {
    setExpandedEndpoints(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const filteredSections = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return apiSections;
    return apiSections.map(s => ({
      ...s,
      endpoints: s.endpoints.filter(e => e.path.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)),
    })).filter(s => s.endpoints.length > 0);
  }, [search]);

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">API Documentation</h1>
            <p className="text-xs text-muted-foreground">REST API reference for your store</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="testmode" className="text-xs">Test Mode</Label>
              <Switch id="testmode" checked={testMode} onCheckedChange={setTestMode} />
            </div>
            <Badge variant={testMode ? "secondary" : "default"} className="gap-1">
              {testMode ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              {testMode ? "Sandbox" : "Production"}
            </Badge>
          </div>
        </div>

        {/* Quick Start */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Terminal className="h-4 w-4" /> Quick Start</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg p-4 font-mono text-xs space-y-2">
              <p className="text-muted-foreground"># Authentication: Include your API key in the header</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-foreground">
                  curl -H "apikey: YOUR_API_KEY" \<br />
                  &nbsp;&nbsp;&nbsp;&nbsp; -H "Authorization: Bearer YOUR_API_KEY" \<br />
                  &nbsp;&nbsp;&nbsp;&nbsp; {baseUrl}/rest/v1/products?store_id=eq.{currentStore?.id || "STORE_ID"}&limit=10
                </code>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => copyCode(`curl -H "apikey: YOUR_API_KEY" -H "Authorization: Bearer YOUR_API_KEY" ${baseUrl}/rest/v1/products?store_id=eq.${currentStore?.id || "STORE_ID"}&limit=10`)}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> Rate limit: 1000 req/hour</span>
              <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> All endpoints require API key auth</span>
              <span className="flex items-center gap-1"><Book className="h-3 w-3" /> Responses are JSON</span>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search endpoints..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        {/* API Sections */}
        {filteredSections.map(section => (
          <Card key={section.name}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{section.name}</CardTitle>
              <p className="text-xs text-muted-foreground">{section.description}</p>
            </CardHeader>
            <CardContent className="space-y-1">
              {section.endpoints.map((ep, idx) => {
                const key = `${section.name}-${idx}`;
                const isExpanded = expandedEndpoints.has(key);
                return (
                  <div key={key} className="border rounded-lg">
                    <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors" onClick={() => toggleEndpoint(key)}>
                      {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                      <Badge variant="outline" className={`font-mono text-[10px] px-2 ${methodColors[ep.method]}`}>{ep.method}</Badge>
                      <code className="text-xs font-mono flex-1">{ep.path}</code>
                      <span className="text-xs text-muted-foreground">{ep.description}</span>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-0 border-t space-y-3">
                        {ep.params && ep.params.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold mb-1 text-muted-foreground">Query Parameters</p>
                            <div className="space-y-1">
                              {ep.params.map(p => (
                                <div key={p.name} className="flex items-center gap-2 text-xs">
                                  <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[11px]">{p.name}</code>
                                  <span className="text-muted-foreground">{p.type}</span>
                                  {p.required && <Badge variant="destructive" className="text-[9px] h-4">required</Badge>}
                                  <span className="text-muted-foreground">— {p.description}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {ep.body && ep.body.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold mb-1 text-muted-foreground">Request Body</p>
                            <div className="space-y-1">
                              {ep.body.map(b => (
                                <div key={b.name} className="flex items-center gap-2 text-xs">
                                  <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[11px]">{b.name}</code>
                                  <span className="text-muted-foreground">{b.type}</span>
                                  {b.required && <Badge variant="destructive" className="text-[9px] h-4">required</Badge>}
                                  <span className="text-muted-foreground">— {b.description}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {ep.response && (
                          <div>
                            <p className="text-xs font-semibold mb-1 text-muted-foreground">Example Response</p>
                            <div className="bg-muted rounded p-3 relative">
                              <pre className="text-[11px] font-mono overflow-x-auto">{ep.response}</pre>
                              <Button size="sm" variant="ghost" className="absolute top-1 right-1 h-6 w-6 p-0" onClick={() => copyCode(ep.response!)}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}

                        <div>
                          <p className="text-xs font-semibold mb-1 text-muted-foreground">cURL Example</p>
                          <div className="bg-muted rounded p-3 relative">
                            <pre className="text-[11px] font-mono overflow-x-auto">
                              {`curl -X ${ep.method} \\\n  "${baseUrl}${ep.path}" \\\n  -H "apikey: YOUR_API_KEY" \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json"`}
                            </pre>
                            <Button size="sm" variant="ghost" className="absolute top-1 right-1 h-6 w-6 p-0" onClick={() => copyCode(`curl -X ${ep.method} "${baseUrl}${ep.path}" -H "apikey: YOUR_API_KEY" -H "Authorization: Bearer YOUR_API_KEY" -H "Content-Type: application/json"`)}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
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
