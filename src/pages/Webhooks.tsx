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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Webhook, Zap, ExternalLink, AlertTriangle, RefreshCw } from "lucide-react";
import { format } from "date-fns";

const WEBHOOK_EVENTS = [
  "order.created", "order.updated", "order.cancelled",
  "product.created", "product.updated", "product.deleted",
  "customer.created", "customer.updated",
  "payment.received",
  "stock.changed",
  "shipment.dispatched",
  "rma.created",
];

export default function Webhooks() {
  const { currentStore } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", url: "", secret: "", events: [] as string[] });

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
      events: f.events.includes(event)
        ? f.events.filter(e => e !== event)
        : [...f.events, event],
    }));
  };

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
            <DialogContent className="max-w-lg">
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
                  <Label className="text-xs">Events *</Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {WEBHOOK_EVENTS.map(event => (
                      <label key={event} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/50 rounded px-2 py-1">
                        <Checkbox
                          checked={form.events.includes(event)}
                          onCheckedChange={() => toggleEvent(event)}
                        />
                        {event}
                      </label>
                    ))}
                  </div>
                </div>
                <Button size="sm" className="w-full text-xs" onClick={() => create.mutate()} disabled={create.isPending}>
                  {create.isPending ? "Creating..." : "Create Webhook"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

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
                  <TableHead className="text-xs h-8 w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-4 w-full" /></TableCell></TableRow>)
                ) : (webhooks as any[]).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">
                      <Webhook className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                      No webhooks configured. Add one to receive real-time event notifications.
                    </TableCell>
                  </TableRow>
                ) : (
                  (webhooks as any[]).map((wh: any) => (
                    <TableRow key={wh.id} className="text-xs">
                      <TableCell className="py-2 font-medium">{wh.name || "—"}</TableCell>
                      <TableCell className="py-2 font-mono text-[10px] max-w-[200px] truncate">{wh.url}</TableCell>
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
                          <Badge variant={wh.last_status < 300 ? "default" : "destructive"} className="text-[10px]">
                            {wh.last_status}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2">
                        {(wh.failure_count || 0) > 0 ? (
                          <Badge variant="destructive" className="text-[10px] gap-0.5">
                            <AlertTriangle className="h-2.5 w-2.5" /> {wh.failure_count} failures
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">0</span>
                        )}
                      </TableCell>
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2 text-muted-foreground">
                        {wh.last_triggered_at ? format(new Date(wh.last_triggered_at), "MMM d, HH:mm") : "Never"}
                      </TableCell>
                      <TableCell className="py-2">
                        <Switch
                          checked={wh.is_active}
                          onCheckedChange={(v) => toggle.mutate({ id: wh.id, active: v })}
                        />
                      </TableCell>
                      <TableCell className="py-2">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => remove.mutate(wh.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
