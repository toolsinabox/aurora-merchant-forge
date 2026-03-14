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
import { Plus, Trash2, Key, Copy, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";

const SCOPES = [
  "products:read", "products:write",
  "orders:read", "orders:write",
  "customers:read", "customers:write",
  "inventory:read", "inventory:write",
  "webhooks:manage",
];

function generateKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "sk_live_";
  for (let i = 0; i < 40; i++) key += chars.charAt(Math.floor(Math.random() * chars.length));
  return key;
}

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export default function ApiKeys() {
  const { currentStore, user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", scopes: [] as string[], ip_whitelist: "" });

  const { data: keys = [], isLoading } = useQuery({
    queryKey: ["api_keys", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data, error } = await supabase
        .from("api_keys" as any)
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
      if (!currentStore || !user || !form.name) throw new Error("Name required");
      const key = generateKey();
      const keyHash = await hashKey(key);
      const prefix = key.slice(0, 12) + "...";
      const { error } = await supabase.from("api_keys" as any).insert({
        store_id: currentStore.id,
        name: form.name,
        key_prefix: prefix,
        key_hash: keyHash,
        scopes: form.scopes,
        created_by: user.id,
      });
      if (error) throw error;
      setNewKey(key);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api_keys"] });
      setForm({ name: "", scopes: [], ip_whitelist: "" });
      toast.success("API key created — copy it now, it won't be shown again");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("api_keys" as any).update({ is_active: active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api_keys"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("api_keys" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api_keys"] });
      toast.success("API key revoked");
    },
  });

  const toggleScope = (scope: string) => {
    setForm(f => ({
      ...f,
      scopes: f.scopes.includes(scope) ? f.scopes.filter(s => s !== scope) : [...f.scopes, scope],
    }));
  };

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">API Keys</h1>
            <p className="text-xs text-muted-foreground">Manage API keys for programmatic access to your store</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setNewKey(null); setForm({ name: "", scopes: [] }); } }}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs gap-1"><Plus className="h-3.5 w-3.5" /> Create API Key</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle className="text-sm">{newKey ? "API Key Created" : "New API Key"}</DialogTitle></DialogHeader>
              {newKey ? (
                <div className="space-y-3">
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-[10px] text-muted-foreground mb-1">Copy this key now — it won't be shown again</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono break-all flex-1">{newKey}</code>
                      <Button variant="outline" size="icon" className="h-7 w-7 shrink-0" onClick={() => { navigator.clipboard.writeText(newKey); toast.success("Copied"); }}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <Button size="sm" className="w-full text-xs" onClick={() => { setNewKey(null); setOpen(false); }}>Done</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Key Name *</Label>
                    <Input className="h-8 text-xs" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="My Integration" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Scopes</Label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {SCOPES.map(scope => (
                        <label key={scope} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/50 rounded px-2 py-1">
                          <Checkbox checked={form.scopes.includes(scope)} onCheckedChange={() => toggleScope(scope)} />
                          {scope}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">IP Whitelist <span className="text-muted-foreground">(optional)</span></Label>
                    <Input className="h-8 text-xs" value={form.ip_whitelist} onChange={(e) => setForm({ ...form, ip_whitelist: e.target.value })} placeholder="1.2.3.4, 10.0.0.0/24 (comma-separated)" />
                    <p className="text-[10px] text-muted-foreground">Leave empty to allow all IPs. Supports CIDR notation.</p>
                  </div>
                  <Button size="sm" className="w-full text-xs" onClick={() => create.mutate()} disabled={create.isPending}>
                    {create.isPending ? "Creating..." : "Create Key"}
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-8">Name</TableHead>
                  <TableHead className="text-xs h-8">Key</TableHead>
                  <TableHead className="text-xs h-8">Scopes</TableHead>
                  <TableHead className="text-xs h-8">Last Used</TableHead>
                  <TableHead className="text-xs h-8">Created</TableHead>
                  <TableHead className="text-xs h-8 w-20">Active</TableHead>
                  <TableHead className="text-xs h-8 w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-4 w-full" /></TableCell></TableRow>)
                ) : (keys as any[]).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">
                      <Key className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                      No API keys. Create one to enable programmatic access.
                    </TableCell>
                  </TableRow>
                ) : (
                  (keys as any[]).map((k: any) => (
                    <TableRow key={k.id} className="text-xs">
                      <TableCell className="py-2 font-medium">{k.name}</TableCell>
                      <TableCell className="py-2 font-mono text-[10px] text-muted-foreground">{k.key_prefix}</TableCell>
                      <TableCell className="py-2">
                        <div className="flex flex-wrap gap-0.5">
                          {(k.scopes || []).slice(0, 3).map((s: string) => (
                            <Badge key={s} variant="outline" className="text-[9px]">{s}</Badge>
                          ))}
                          {(k.scopes || []).length > 3 && <Badge variant="outline" className="text-[9px]">+{k.scopes.length - 3}</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-muted-foreground">
                        {k.last_used_at ? format(new Date(k.last_used_at), "MMM d, HH:mm") : "Never"}
                      </TableCell>
                      <TableCell className="py-2 text-muted-foreground">{format(new Date(k.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell className="py-2">
                        <Switch checked={k.is_active} onCheckedChange={(v) => toggle.mutate({ id: k.id, active: v })} />
                      </TableCell>
                      <TableCell className="py-2">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => remove.mutate(k.id)}>
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
