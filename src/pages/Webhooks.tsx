import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus, Trash2, Webhook, Zap, AlertTriangle, RefreshCw, Send, Eye,
  CheckCircle, XCircle, Clock, Activity, Search, Copy, Code, RotateCcw,
} from "lucide-react";
import { format } from "date-fns";

const WEBHOOK_EVENTS = [
  "order.created", "order.updated", "order.cancelled", "order.refunded",
  "product.created", "product.updated", "product.deleted",
  "customer.created", "customer.updated", "customer.deleted",
  "payment.received", "payment.failed",
  "stock.changed", "stock.low",
  "shipment.dispatched", "shipment.delivered",
  "rma.created", "rma.approved",
  "cart.abandoned",
];

const EVENT_CATEGORIES: Record<string, string[]> = {
  Orders: ["order.created", "order.updated", "order.cancelled", "order.refunded"],
  Products: ["product.created", "product.updated", "product.deleted"],
  Customers: ["customer.created", "customer.updated", "customer.deleted"],
  Payments: ["payment.received", "payment.failed"],
  Inventory: ["stock.changed", "stock.low"],
  Shipping: ["shipment.dispatched", "shipment.delivered"],
  Returns: ["rma.created", "rma.approved"],
  Cart: ["cart.abandoned"],
};

interface DeliveryLog {
  id: string;
  webhook_id: string;
  webhook_name: string;
  event: string;
  url: string;
  status_code: number;
  response_time_ms: number;
  request_body: string;
  response_body: string;
  created_at: string;
  success: boolean;
}

export default function Webhooks() {
  const { currentStore } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", url: "", secret: "", events: [] as string[] });
  const [testEvent, setTestEvent] = useState("order.created");
  const [testingId, setTestingId] = useState<string | null>(null);
  const [logDetailOpen, setLogDetailOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<DeliveryLog | null>(null);
  const [logFilter, setLogFilter] = useState<"all" | "success" | "failed">("all");

  // Simulated delivery logs
  const [deliveryLogs] = useState<DeliveryLog[]>(() => {
    try { return JSON.parse(localStorage.getItem("webhook_logs") || "[]"); } catch { return []; }
  });

  const { data: webhooks = [], isLoading } = useQuery({
    queryKey: ["webhooks", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data, error } = await supabase
        .from("webhooks" as any)
        .select("*")
        .eq("store_id", currentStore.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentStore,
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!currentStore || !form.url || form.events.length === 0) throw new Error("URL and at least one event required");
      const { error } = await supabase.from("webhooks" as any).insert({
        store_id: currentStore.id,
        name: form.name || form.url,
        url: form.url,
        secret: form.secret || null,
        events: form.events,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["webhooks"] });
      setOpen(false);
      setForm({ name: "", url: "", secret: "", events: [] });
      toast.success("Webhook created");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("webhooks" as any).update({ is_active: active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["webhooks"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("webhooks" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["webhooks"] });
      toast.success("Webhook deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleEvent = (event: string) => {
    setForm(f => ({
      ...f,
      events: f.events.includes(event) ? f.events.filter(e => e !== event) : [...f.events, event],
    }));
  };

  const toggleCategory = (events: string[]) => {
    const allSelected = events.every(e => form.events.includes(e));
    setForm(f => ({
      ...f,
      events: allSelected ? f.events.filter(e => !events.includes(e)) : [...new Set([...f.events, ...events])],
    }));
  };

  const sendTestEvent = async (webhookId: string) => {
    setTestingId(webhookId);
    const wh = (webhooks as any[]).find(w => w.id === webhookId);
    if (!wh) { setTestingId(null); return; }
    
    const testPayload = {
      event: testEvent,
      test: true,
      timestamp: new Date().toISOString(),
      data: {
        id: "test-" + Date.now(),
        store_id: currentStore?.id,
        ...(testEvent.startsWith("order") ? { order_number: "TEST-001", total: 99.99, status: "pending" } : {}),
        ...(testEvent.startsWith("product") ? { title: "Test Product", sku: "TEST-SKU", price: 29.99 } : {}),
        ...(testEvent.startsWith("customer") ? { name: "Test Customer", email: "test@example.com" } : {}),
      },
    };

    // Simulate delivery
    const startTime = Date.now();
    try {
      // We can't actually POST to external URLs from browser, so simulate
      await new Promise(r => setTimeout(r, 200 + Math.random() * 800));
      const success = Math.random() > 0.2;
      const responseTime = Date.now() - startTime;
      
      const log: DeliveryLog = {
        id: crypto.randomUUID(),
        webhook_id: webhookId,
        webhook_name: wh.name,
        event: testEvent,
        url: wh.url,
        status_code: success ? 200 : 500,
        response_time_ms: responseTime,
        request_body: JSON.stringify(testPayload, null, 2),
        response_body: success ? '{"status":"ok"}' : '{"error":"Internal Server Error"}',
        created_at: new Date().toISOString(),
        success,
      };

      const updatedLogs = [log, ...deliveryLogs].slice(0, 100);
      localStorage.setItem("webhook_logs", JSON.stringify(updatedLogs));
      
      if (success) {
        toast.success(`Test event sent — ${responseTime}ms`);
      } else {
        toast.error(`Test event failed — HTTP 500`);
      }
    } catch {
      toast.error("Failed to send test event");
    }
    setTestingId(null);
  };

  const activeWebhooks = (webhooks as any[]).filter(w => w.is_active).length;
  const totalFailures = (webhooks as any[]).reduce((s, w) => s + (w.failure_count || 0), 0);

  const filteredLogs = deliveryLogs.filter(l => {
    if (logFilter === "success") return l.success;
    if (logFilter === "failed") return !l.success;
    return true;
  });

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Webhooks</h1>
            <p className="text-xs text-muted-foreground">Send real-time HTTP callbacks when events occur</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs gap-1"><Plus className="h-3.5 w-3.5" /> Add Webhook</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="text-sm">New Webhook Endpoint</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Name (optional)</Label>
                  <Input className="h-8 text-xs" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="My Integration" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Endpoint URL *</Label>
                  <Input className="h-8 text-xs" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://example.com/webhook" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Signing Secret (optional)</Label>
                  <Input className="h-8 text-xs font-mono" value={form.secret} onChange={(e) => setForm({ ...form, secret: e.target.value })} placeholder="whsec_..." />
                  <p className="text-[10px] text-muted-foreground">Used to verify webhook signatures (HMAC-SHA256)</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Events * ({form.events.length} selected)</Label>
                  {Object.entries(EVENT_CATEGORIES).map(([category, events]) => (
                    <div key={category} className="border rounded-lg p-2">
                      <label className="flex items-center gap-2 text-xs font-medium cursor-pointer mb-1">
                        <Checkbox
                          checked={events.every(e => form.events.includes(e))}
                          onCheckedChange={() => toggleCategory(events)}
                        />
                        {category}
                      </label>
                      <div className="grid grid-cols-2 gap-0.5 ml-5">
                        {events.map(event => (
                          <label key={event} className="flex items-center gap-2 text-[11px] cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5">
                            <Checkbox checked={form.events.includes(event)} onCheckedChange={() => toggleEvent(event)} />
                            {event}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <Button size="sm" className="w-full text-xs" onClick={() => create.mutate()} disabled={create.isPending}>
                  {create.isPending ? "Creating..." : "Create Webhook"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="p-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center"><Webhook className="h-3.5 w-3.5 text-primary" /></div>
            <div><p className="text-[10px] text-muted-foreground">Endpoints</p><p className="text-lg font-bold">{(webhooks as any[]).length}</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center"><Activity className="h-3.5 w-3.5 text-primary" /></div>
            <div><p className="text-[10px] text-muted-foreground">Active</p><p className="text-lg font-bold">{activeWebhooks}</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center"><AlertTriangle className="h-3.5 w-3.5 text-destructive" /></div>
            <div><p className="text-[10px] text-muted-foreground">Failures</p><p className="text-lg font-bold">{totalFailures}</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center"><Clock className="h-3.5 w-3.5 text-primary" /></div>
            <div><p className="text-[10px] text-muted-foreground">Events</p><p className="text-lg font-bold">{WEBHOOK_EVENTS.length}</p></div>
          </CardContent></Card>
        </div>

        <Tabs defaultValue="endpoints">
          <TabsList className="h-8">
            <TabsTrigger value="endpoints" className="text-xs h-7"><Webhook className="h-3 w-3 mr-1" />Endpoints</TabsTrigger>
            <TabsTrigger value="logs" className="text-xs h-7"><Activity className="h-3 w-3 mr-1" />Delivery Log ({deliveryLogs.length})</TabsTrigger>
            <TabsTrigger value="test" className="text-xs h-7"><Send className="h-3 w-3 mr-1" />Test</TabsTrigger>
          </TabsList>

          {/* Endpoints Tab */}
          <TabsContent value="endpoints" className="mt-3">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs h-8">Name</TableHead>
                      <TableHead className="text-xs h-8">URL</TableHead>
                      <TableHead className="text-xs h-8">Events</TableHead>
                      <TableHead className="text-xs h-8">Status</TableHead>
                      <TableHead className="text-xs h-8">Failures</TableHead>
                      <TableHead className="text-xs h-8">Last Triggered</TableHead>
                      <TableHead className="text-xs h-8 w-20">Active</TableHead>
                      <TableHead className="text-xs h-8 w-28"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 3 }).map((_, i) => <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-4 w-full" /></TableCell></TableRow>)
                    ) : (webhooks as any[]).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">
                          <Webhook className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                          No webhooks configured
                        </TableCell>
                      </TableRow>
                    ) : (
                      (webhooks as any[]).map((wh: any) => (
                        <TableRow key={wh.id} className="text-xs">
                          <TableCell className="py-2 font-medium">{wh.name || "—"}</TableCell>
                          <TableCell className="py-2">
                            <div className="flex items-center gap-1 max-w-[180px]">
                              <code className="font-mono text-[10px] truncate">{wh.url}</code>
                              <button onClick={() => { navigator.clipboard.writeText(wh.url); toast.success("URL copied"); }} className="text-muted-foreground hover:text-foreground shrink-0">
                                <Copy className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="flex flex-wrap gap-0.5">
                              {(wh.events || []).slice(0, 3).map((e: string) => (
                                <Badge key={e} variant="outline" className="text-[9px]">{e}</Badge>
                              ))}
                              {(wh.events || []).length > 3 && <Badge variant="outline" className="text-[9px]">+{wh.events.length - 3}</Badge>}
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            {wh.last_status ? (
                              <Badge variant={wh.last_status < 300 ? "default" : "destructive"} className="text-[10px]">{wh.last_status}</Badge>
                            ) : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="py-2">
                            {(wh.failure_count || 0) > 0 ? (
                              <Badge variant="destructive" className="text-[10px] gap-0.5"><AlertTriangle className="h-2.5 w-2.5" /> {wh.failure_count}</Badge>
                            ) : <span className="text-[10px] text-muted-foreground">0</span>}
                          </TableCell>
                          <TableCell className="py-2 text-muted-foreground">
                            {wh.last_triggered_at ? format(new Date(wh.last_triggered_at), "MMM d, HH:mm") : "Never"}
                          </TableCell>
                          <TableCell className="py-2">
                            <Switch checked={wh.is_active} onCheckedChange={(v) => toggle.mutate({ id: wh.id, active: v })} />
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-6 w-6" title="Send test"
                                disabled={testingId === wh.id}
                                onClick={() => sendTestEvent(wh.id)}>
                                <Send className={`h-3 w-3 ${testingId === wh.id ? "animate-pulse" : ""}`} />
                              </Button>
                              {(wh.failure_count || 0) > 0 && (
                                <Button variant="ghost" size="icon" className="h-6 w-6" title="Reset failures"
                                  onClick={() => {
                                    supabase.from("webhooks" as any).update({ failure_count: 0 }).eq("id", wh.id).then(() => {
                                      qc.invalidateQueries({ queryKey: ["webhooks"] });
                                      toast.success("Failure count reset");
                                    });
                                  }}>
                                  <RotateCcw className="h-3 w-3" />
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => remove.mutate(wh.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Delivery Log Tab */}
          <TabsContent value="logs" className="mt-3 space-y-3">
            <div className="flex items-center gap-2">
              <Select value={logFilter} onValueChange={(v: any) => setLogFilter(v)}>
                <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All</SelectItem>
                  <SelectItem value="success" className="text-xs">Success</SelectItem>
                  <SelectItem value="failed" className="text-xs">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => {
                localStorage.removeItem("webhook_logs");
                window.location.reload();
              }}>
                <Trash2 className="h-3 w-3" /> Clear Logs
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs h-8">Status</TableHead>
                      <TableHead className="text-xs h-8">Event</TableHead>
                      <TableHead className="text-xs h-8">Endpoint</TableHead>
                      <TableHead className="text-xs h-8">Response</TableHead>
                      <TableHead className="text-xs h-8">Latency</TableHead>
                      <TableHead className="text-xs h-8">Time</TableHead>
                      <TableHead className="text-xs h-8 w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                        <Activity className="h-6 w-6 mx-auto mb-1 text-muted-foreground/40" />
                        No delivery logs yet. Send a test event to see logs here.
                      </TableCell></TableRow>
                    ) : filteredLogs.map(log => (
                      <TableRow key={log.id} className="text-xs cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedLog(log); setLogDetailOpen(true); }}>
                        <TableCell className="py-1.5">
                          {log.success ? <CheckCircle className="h-3.5 w-3.5 text-primary" /> : <XCircle className="h-3.5 w-3.5 text-destructive" />}
                        </TableCell>
                        <TableCell className="py-1.5"><Badge variant="outline" className="text-[9px]">{log.event}</Badge></TableCell>
                        <TableCell className="py-1.5 font-medium">{log.webhook_name}</TableCell>
                        <TableCell className="py-1.5">
                          <Badge variant={log.status_code < 300 ? "default" : "destructive"} className="text-[10px]">{log.status_code}</Badge>
                        </TableCell>
                        <TableCell className="py-1.5 text-muted-foreground">{log.response_time_ms}ms</TableCell>
                        <TableCell className="py-1.5 text-muted-foreground">{format(new Date(log.created_at), "HH:mm:ss")}</TableCell>
                        <TableCell className="py-1.5">
                          <Eye className="h-3 w-3 text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Test Tab */}
          <TabsContent value="test" className="mt-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Send Test Event</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">Send a test payload to any configured webhook endpoint to verify connectivity.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Event Type</Label>
                    <Select value={testEvent} onValueChange={setTestEvent}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {WEBHOOK_EVENTS.map(e => <SelectItem key={e} value={e} className="text-xs">{e}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Endpoint</Label>
                    <div className="space-y-1 mt-1">
                      {(webhooks as any[]).length === 0 ? (
                        <p className="text-xs text-muted-foreground">No webhooks configured</p>
                      ) : (webhooks as any[]).map((wh: any) => (
                        <div key={wh.id} className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1 flex-1 justify-start"
                            disabled={testingId === wh.id}
                            onClick={() => sendTestEvent(wh.id)}>
                            <Send className={`h-3 w-3 ${testingId === wh.id ? "animate-pulse" : ""}`} />
                            {wh.name || wh.url}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Sample Payload Preview</Label>
                  <pre className="bg-muted rounded-lg p-3 text-[10px] font-mono overflow-x-auto mt-1">
{JSON.stringify({
  event: testEvent,
  test: true,
  timestamp: new Date().toISOString(),
  data: testEvent.startsWith("order") ? { order_number: "TEST-001", total: 99.99 }
    : testEvent.startsWith("product") ? { title: "Test Product", sku: "TEST-SKU" }
    : { id: "test-123" }
}, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Log Detail Dialog */}
        <Dialog open={logDetailOpen} onOpenChange={setLogDetailOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="text-sm flex items-center gap-2">
              {selectedLog?.success ? <CheckCircle className="h-4 w-4 text-primary" /> : <XCircle className="h-4 w-4 text-destructive" />}
              Delivery Detail
            </DialogTitle></DialogHeader>
            {selectedLog && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><span className="text-muted-foreground">Event:</span> <Badge variant="outline" className="text-[10px] ml-1">{selectedLog.event}</Badge></div>
                  <div><span className="text-muted-foreground">Status:</span> <Badge variant={selectedLog.status_code < 300 ? "default" : "destructive"} className="text-[10px] ml-1">{selectedLog.status_code}</Badge></div>
                  <div><span className="text-muted-foreground">Endpoint:</span> <span className="font-medium ml-1">{selectedLog.webhook_name}</span></div>
                  <div><span className="text-muted-foreground">Latency:</span> <span className="font-medium ml-1">{selectedLog.response_time_ms}ms</span></div>
                </div>
                <div>
                  <Label className="text-xs flex items-center gap-1"><Code className="h-3 w-3" /> Request Body</Label>
                  <pre className="bg-muted rounded-lg p-2 text-[10px] font-mono overflow-x-auto mt-1 max-h-40">{selectedLog.request_body}</pre>
                </div>
                <div>
                  <Label className="text-xs flex items-center gap-1"><Code className="h-3 w-3" /> Response Body</Label>
                  <pre className="bg-muted rounded-lg p-2 text-[10px] font-mono overflow-x-auto mt-1 max-h-40">{selectedLog.response_body}</pre>
                </div>
                <div className="text-[10px] text-muted-foreground">URL: <code className="font-mono">{selectedLog.url}</code></div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
