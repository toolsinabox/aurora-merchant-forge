import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Layers, Pencil, Copy, Code } from "lucide-react";

const PLACEMENTS = ["custom", "header", "footer", "sidebar", "homepage", "product-page", "category-page", "checkout", "cart"];

export default function ContentZones() {
  const { currentStore } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", zone_key: "", content: "", block_type: "html", placement: "custom", description: "" });

  const { data: zones = [], isLoading } = useQuery({
    queryKey: ["content_zones", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data, error } = await supabase
        .from("content_zones" as any)
        .select("*")
        .eq("store_id", currentStore.id)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentStore,
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!currentStore || !form.name || !form.zone_key) throw new Error("Name and zone key required");
      const payload = {
        name: form.name,
        zone_key: form.zone_key,
        content: form.content,
        block_type: form.block_type,
        placement: form.placement,
        description: form.description,
      };
      if (editId) {
        const { error } = await supabase.from("content_zones" as any)
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("content_zones" as any).insert({
          store_id: currentStore.id,
          ...payload,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["content_zones"] });
      toast.success(editId ? "Zone updated" : "Zone created");
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("content_zones" as any).update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["content_zones"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("content_zones" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["content_zones"] });
      toast.success("Zone deleted");
    },
  });

  const resetForm = () => {
    setForm({ name: "", zone_key: "", content: "", block_type: "html", placement: "custom", description: "" });
    setEditId(null);
    setOpen(false);
  };

  const startEdit = (z: any) => {
    setForm({ name: z.name, zone_key: z.zone_key, content: z.content || "", block_type: z.block_type, placement: z.placement || "custom", description: z.description || "" });
    setEditId(z.id);
    setOpen(true);
  };

  const copyTag = (key: string) => {
    navigator.clipboard.writeText(`[%content_zone id:'${key}'%][%end content_zone%]`);
    toast.success("Template tag copied");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Content Zones</h1>
            <p className="text-muted-foreground">Define named zones for your templates. Use <code className="bg-muted px-1 rounded text-xs">[%content_zone id:'key'%]</code> in themes.</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Add Zone</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editId ? "Edit Zone" : "New Content Zone"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Hero Banner" />
                  </div>
                  <div>
                    <Label>Zone Key</Label>
                    <Input value={form.zone_key} onChange={e => setForm(f => ({ ...f, zone_key: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "-") }))} placeholder="hero-banner" />
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select value={form.block_type} onValueChange={v => setForm(f => ({ ...f, block_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="html">HTML</SelectItem>
                        <SelectItem value="text">Plain Text</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Placement</Label>
                    <Select value={form.placement} onValueChange={v => setForm(f => ({ ...f, placement: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PLACEMENTS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Content</Label>
                  <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={10} className="font-mono text-sm" placeholder="<div>Your HTML content here</div>" />
                </div>
                <Button onClick={() => save.mutate()} disabled={save.isPending} className="w-full">
                  {save.isPending ? "Saving…" : editId ? "Update Zone" : "Create Zone"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Layers className="h-5 w-5" />All Zones</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : zones.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No content zones yet. Create one to get started.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Placement</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(zones as any[]).map((z: any) => (
                    <TableRow key={z.id}>
                      <TableCell className="font-medium">{z.name}</TableCell>
                      <TableCell>
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{z.zone_key}</code>
                      </TableCell>
                      <TableCell><Badge variant="outline">{z.placement}</Badge></TableCell>
                      <TableCell><Badge variant="secondary">{z.block_type}</Badge></TableCell>
                      <TableCell>
                        <Switch checked={z.is_active} onCheckedChange={v => toggle.mutate({ id: z.id, is_active: v })} />
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button size="icon" variant="ghost" onClick={() => copyTag(z.zone_key)} title="Copy template tag">
                          <Code className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => startEdit(z)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => remove.mutate(z.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
