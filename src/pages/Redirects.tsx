import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, ArrowRight, ExternalLink } from "lucide-react";

export default function Redirects() {
  const { currentStore } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ from_path: "", to_path: "" });

  const { data: redirects = [], isLoading } = useQuery({
    queryKey: ["redirects", currentStore?.id],
    enabled: !!currentStore,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("redirects")
        .select("*")
        .eq("store_id", currentStore!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleCreate = async () => {
    if (!currentStore || !form.from_path || !form.to_path) return;
    const { error } = await supabase.from("redirects").insert({
      store_id: currentStore.id,
      from_path: form.from_path.startsWith("/") ? form.from_path : `/${form.from_path}`,
      to_path: form.to_path.startsWith("/") ? form.to_path : `/${form.to_path}`,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Redirect created");
    setOpen(false);
    setForm({ from_path: "", to_path: "" });
    qc.invalidateQueries({ queryKey: ["redirects"] });
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await supabase.from("redirects").update({ is_active: !isActive } as any).eq("id", id);
    qc.invalidateQueries({ queryKey: ["redirects"] });
  };

  const handleDelete = async (id: string) => {
    await supabase.from("redirects").delete().eq("id", id);
    toast.success("Redirect deleted");
    qc.invalidateQueries({ queryKey: ["redirects"] });
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">301 Redirects</h1>
            <p className="text-xs text-muted-foreground">Manage URL redirects when slugs change</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Add Redirect</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Redirect</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>From Path</Label>
                  <Input placeholder="/old-product-url" value={form.from_path}
                    onChange={e => setForm(prev => ({ ...prev, from_path: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>To Path</Label>
                  <Input placeholder="/new-product-url" value={form.to_path}
                    onChange={e => setForm(prev => ({ ...prev, to_path: e.target.value }))} />
                </div>
                <Button onClick={handleCreate} className="w-full">Create Redirect</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-8">From</TableHead>
                  <TableHead className="text-xs h-8"></TableHead>
                  <TableHead className="text-xs h-8">To</TableHead>
                  <TableHead className="text-xs h-8 text-right">Hits</TableHead>
                  <TableHead className="text-xs h-8">Active</TableHead>
                  <TableHead className="text-xs h-8 w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
                  ))
                ) : redirects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">
                      <ExternalLink className="h-6 w-6 mx-auto mb-1 text-muted-foreground/40" />
                      No redirects configured
                    </TableCell>
                  </TableRow>
                ) : (
                  redirects.map((r: any) => (
                    <TableRow key={r.id} className="text-xs">
                      <TableCell className="py-1.5 font-mono">{r.from_path}</TableCell>
                      <TableCell className="py-1.5"><ArrowRight className="h-3 w-3 text-muted-foreground" /></TableCell>
                      <TableCell className="py-1.5 font-mono">{r.to_path}</TableCell>
                      <TableCell className="py-1.5 text-right">{r.hit_count}</TableCell>
                      <TableCell className="py-1.5">
                        <Switch checked={r.is_active} onCheckedChange={() => toggleActive(r.id, r.is_active)} />
                      </TableCell>
                      <TableCell className="py-1.5">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(r.id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
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
