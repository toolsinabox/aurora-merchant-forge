import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Image, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const PLACEMENTS = [
  { value: "homepage_top", label: "Homepage – Top Banner" },
  { value: "homepage_mid", label: "Homepage – Mid Section" },
  { value: "homepage_bottom", label: "Homepage – Bottom" },
  { value: "sidebar", label: "Sidebar" },
  { value: "product_page", label: "Product Page" },
  { value: "category_page", label: "Category Page" },
  { value: "cart_page", label: "Cart Page" },
];

const ADVERT_TYPES = [
  { value: "banner", label: "Banner Image" },
  { value: "carousel", label: "Carousel Slide" },
  { value: "text", label: "Text Promo" },
  { value: "html", label: "Custom HTML" },
];

const emptyForm = {
  name: "", advert_type: "banner", image_url: "", link_url: "", title: "", subtitle: "",
  button_text: "", html_content: "", placement: "homepage_top", is_active: true,
  starts_at: "", ends_at: "", sort_order: 0,
};

export default function Adverts() {
  const { currentStore } = useAuth();
  const [adverts, setAdverts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    if (!currentStore) return;
    const { data } = await supabase
      .from("adverts" as any)
      .select("*")
      .eq("store_id", currentStore.id)
      .order("sort_order");
    setAdverts(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentStore]);

  const handleSave = async () => {
    if (!currentStore || !form.name) { toast.error("Name is required"); return; }
    const payload: any = {
      ...form,
      store_id: currentStore.id,
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
    };

    if (editId) {
      const { error } = await supabase.from("adverts" as any).update(payload).eq("id", editId);
      if (error) { toast.error(error.message); return; }
      toast.success("Advert updated");
    } else {
      const { error } = await supabase.from("adverts" as any).insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Advert created");
    }
    setDialogOpen(false);
    setEditId(null);
    setForm(emptyForm);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this advert?")) return;
    await supabase.from("adverts" as any).delete().eq("id", id);
    toast.success("Advert deleted");
    load();
  };

  const openEdit = (ad: any) => {
    setEditId(ad.id);
    setForm({
      name: ad.name, advert_type: ad.advert_type, image_url: ad.image_url || "",
      link_url: ad.link_url || "", title: ad.title || "", subtitle: ad.subtitle || "",
      button_text: ad.button_text || "", html_content: ad.html_content || "",
      placement: ad.placement, is_active: ad.is_active, starts_at: ad.starts_at?.slice(0, 16) || "",
      ends_at: ad.ends_at?.slice(0, 16) || "", sort_order: ad.sort_order,
    });
    setDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Adverts & Promotions</h1>
            <p className="text-muted-foreground">Manage banner ads, carousel slides, and promotional placements</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditId(null); setForm(emptyForm); } }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> New Advert</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editId ? "Edit Advert" : "New Advert"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Name *</Label>
                  <Input className="h-8 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Summer Sale Banner" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Type</Label>
                    <Select value={form.advert_type} onValueChange={(v) => setForm({ ...form, advert_type: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ADVERT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Placement</Label>
                    <Select value={form.placement} onValueChange={(v) => setForm({ ...form, placement: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PLACEMENTS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {(form.advert_type === "banner" || form.advert_type === "carousel") && (
                  <div className="space-y-1">
                    <Label className="text-xs">Image URL</Label>
                    <Input className="h-8 text-xs" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
                  </div>
                )}
                <div className="space-y-1">
                  <Label className="text-xs">Link URL</Label>
                  <Input className="h-8 text-xs" value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="/products or https://..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Title</Label>
                    <Input className="h-8 text-xs" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Subtitle</Label>
                    <Input className="h-8 text-xs" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Button Text</Label>
                  <Input className="h-8 text-xs" value={form.button_text} onChange={(e) => setForm({ ...form, button_text: e.target.value })} placeholder="Shop Now" />
                </div>
                {form.advert_type === "html" && (
                  <div className="space-y-1">
                    <Label className="text-xs">HTML Content</Label>
                    <Textarea className="text-xs min-h-[80px] font-mono" value={form.html_content} onChange={(e) => setForm({ ...form, html_content: e.target.value })} />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Starts At</Label>
                    <Input type="datetime-local" className="h-8 text-xs" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Ends At</Label>
                    <Input type="datetime-local" className="h-8 text-xs" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Sort Order</Label>
                    <Input type="number" className="h-8 text-xs" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
                  </div>
                  <div className="flex items-center gap-2 pt-4">
                    <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                    <Label className="text-xs">Active</Label>
                  </div>
                </div>
                <Button onClick={handleSave} className="w-full">{editId ? "Update" : "Create"} Advert</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Placement</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : adverts.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No adverts yet. Create your first promotional banner.</TableCell></TableRow>
                ) : adverts.map((ad: any) => (
                  <TableRow key={ad.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {ad.image_url ? (
                          <img src={ad.image_url} alt="" className="h-8 w-12 object-cover rounded" />
                        ) : (
                          <div className="h-8 w-12 bg-muted rounded flex items-center justify-center"><Image className="h-3 w-3 text-muted-foreground" /></div>
                        )}
                        <span className="font-medium text-sm">{ad.name}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-xs capitalize">{ad.advert_type}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{PLACEMENTS.find(p => p.value === ad.placement)?.label || ad.placement}</TableCell>
                    <TableCell><Badge variant={ad.is_active ? "default" : "secondary"} className="text-xs">{ad.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {ad.starts_at ? new Date(ad.starts_at).toLocaleDateString() : "—"}
                      {ad.ends_at ? ` → ${new Date(ad.ends_at).toLocaleDateString()}` : ""}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(ad)}><Pencil className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(ad.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
