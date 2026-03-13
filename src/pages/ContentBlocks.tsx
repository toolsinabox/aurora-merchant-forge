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
import { Plus, Trash2, LayoutGrid, Copy, Pencil } from "lucide-react";

const PLACEMENTS = ["custom", "header", "footer", "sidebar", "product-page", "homepage", "checkout"];

export default function ContentBlocks() {
  const { currentStore } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", identifier: "", content: "", block_type: "html", placement: "custom" });

  const { data: blocks = [], isLoading } = useQuery({
    queryKey: ["content_blocks", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data, error } = await supabase
        .from("content_blocks" as any)
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
      if (!currentStore || !form.name || !form.identifier) throw new Error("Name and identifier required");
      if (editId) {
        const { error } = await supabase.from("content_blocks" as any)
          .update({ name: form.name, identifier: form.identifier, content: form.content, block_type: form.block_type, placement: form.placement, updated_at: new Date().toISOString() })
          .eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("content_blocks" as any).insert({
          store_id: currentStore.id, name: form.name, identifier: form.identifier,
          content: form.content, block_type: form.block_type, placement: form.placement,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["content_blocks"] });
      setOpen(false);
      setEditId(null);
      setForm({ name: "", identifier: "", content: "", block_type: "html", placement: "custom" });
      toast.success(editId ? "Block updated" : "Block created");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("content_blocks" as any).update({ is_active: active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["content_blocks"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("content_blocks" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["content_blocks"] }); toast.success("Block deleted"); },
  });

  const editBlock = (b: any) => {
    setEditId(b.id);
    setForm({ name: b.name, identifier: b.identifier, content: b.content || "", block_type: b.block_type, placement: b.placement || "custom" });
    setOpen(true);
  };

  const autoId = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Content Blocks</h1>
            <p className="text-xs text-muted-foreground">Reusable content widgets for embedding on storefront pages</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditId(null); setForm({ name: "", identifier: "", content: "", block_type: "html", placement: "custom" }); } }}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs gap-1"><Plus className="h-3.5 w-3.5" /> Add Block</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle className="text-sm">{editId ? "Edit" : "New"} Content Block</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Name *</Label>
                    <Input className="h-8 text-xs" value={form.name} onChange={(e) => {
                      setForm({ ...form, name: e.target.value, identifier: editId ? form.identifier : autoId(e.target.value) });
                    }} placeholder="Homepage Banner" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Identifier *</Label>
                    <Input className="h-8 text-xs font-mono" value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} placeholder="homepage-banner" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Type</Label>
                    <Select value={form.block_type} onValueChange={(v) => setForm({ ...form, block_type: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="html" className="text-xs">HTML</SelectItem>
                        <SelectItem value="text" className="text-xs">Plain Text</SelectItem>
                        <SelectItem value="markdown" className="text-xs">Markdown</SelectItem>
                        <SelectItem value="banner" className="text-xs">Banner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Placement</Label>
                    <Select value={form.placement} onValueChange={(v) => setForm({ ...form, placement: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PLACEMENTS.map(p => <SelectItem key={p} value={p} className="text-xs capitalize">{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Content</Label>
                  <Textarea className="text-xs min-h-[120px] font-mono" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="<div>Your content here...</div>" />
                </div>
                <Button size="sm" className="w-full text-xs" onClick={() => save.mutate()} disabled={save.isPending}>
                  {save.isPending ? "Saving..." : editId ? "Update Block" : "Create Block"}
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
                  <TableHead className="text-xs h-8">Identifier</TableHead>
                  <TableHead className="text-xs h-8">Type</TableHead>
                  <TableHead className="text-xs h-8">Placement</TableHead>
                  <TableHead className="text-xs h-8 w-20">Active</TableHead>
                  <TableHead className="text-xs h-8 w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-4 w-full" /></TableCell></TableRow>)
                ) : (blocks as any[]).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">
                      <LayoutGrid className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                      No content blocks yet. Create reusable widgets for your storefront.
                    </TableCell>
                  </TableRow>
                ) : (
                  (blocks as any[]).map((b: any) => (
                    <TableRow key={b.id} className="text-xs">
                      <TableCell className="py-2 font-medium">{b.name}</TableCell>
                      <TableCell className="py-2 font-mono text-[10px] text-muted-foreground">{b.identifier}</TableCell>
                      <TableCell className="py-2"><Badge variant="outline" className="text-[10px] capitalize">{b.block_type}</Badge></TableCell>
                      <TableCell className="py-2"><Badge variant="secondary" className="text-[10px] capitalize">{b.placement}</Badge></TableCell>
                      <TableCell className="py-2">
                        <Switch checked={b.is_active} onCheckedChange={(v) => toggle.mutate({ id: b.id, active: v })} />
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex gap-0.5">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(b.identifier); toast.success("Identifier copied"); }}>
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => editBlock(b)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => remove.mutate(b.id)}>
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
      </div>
    </AdminLayout>
  );
}
