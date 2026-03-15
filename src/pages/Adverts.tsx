import { useState, useEffect, useCallback, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Image, GripVertical, Monitor, Tablet, Smartphone, Loader2, ImagePlus, X, ArrowUp, ArrowDown, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const PLACEMENTS = [
  { value: "homepage_top", label: "Homepage – Top Banner" },
  { value: "homepage_mid", label: "Homepage – Mid Section" },
  { value: "homepage_bottom", label: "Homepage – Bottom" },
  { value: "sidebar", label: "Sidebar" },
  { value: "product_page", label: "Product Page" },
  { value: "category_page", label: "Category Page" },
  { value: "cart_page", label: "Cart Page" },
  { value: "checkout_page", label: "Checkout Page" },
  { value: "header_strip", label: "Header Announcement Strip" },
];

const ADVERT_TYPES = [
  { value: "banner", label: "Banner Image" },
  { value: "carousel", label: "Carousel Slide" },
  { value: "text", label: "Text Promo" },
  { value: "html", label: "Custom HTML" },
];

const emptyForm = {
  name: "", advert_type: "banner", image_url: "", image_url_tablet: "", image_url_mobile: "",
  link_url: "", title: "", subtitle: "", button_text: "", html_content: "",
  placement: "homepage_top", is_active: true, starts_at: "", ends_at: "", sort_order: 0,
  show_on_desktop: true, show_on_tablet: true, show_on_mobile: true,
};

const getPublicUrl = (path: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;
};

/* ── Single-image upload zone ── */
function BannerImageUpload({ storeId, label, value, onChange }: {
  storeId: string; label: string; value: string; onChange: (v: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const upload = useCallback(async (file: File) => {
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      toast.error("Only JPEG, PNG, WebP, GIF allowed"); return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${storeId}/banners/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) toast.error(error.message);
    else { onChange(path); toast.success("Image uploaded"); }
    setUploading(false);
  }, [storeId, onChange]);

  const remove = useCallback(async () => {
    if (value && !value.startsWith("http")) {
      await supabase.storage.from("product-images").remove([value]);
    }
    onChange("");
  }, [value, onChange]);

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {value ? (
        <div className="relative group rounded-lg overflow-hidden border bg-muted">
          <img src={getPublicUrl(value)} alt="" className="w-full h-32 object-cover" />
          <button onClick={remove} className="absolute top-1.5 right-1.5 bg-background/80 backdrop-blur-sm rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground">
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer",
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50",
            uploading && "pointer-events-none opacity-60"
          )}
          onClick={() => ref.current?.click()}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) upload(e.dataTransfer.files[0]); }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
        >
          <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
          ) : (
            <div className="flex flex-col items-center gap-1">
              <ImagePlus className="h-5 w-5 text-muted-foreground" />
              <p className="text-2xs text-muted-foreground">Drop or click to upload</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Device preview component ── */
function DevicePreview({ form }: { form: typeof emptyForm }) {
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const widths = { desktop: "100%", tablet: "768px", mobile: "375px" };
  const heights = { desktop: "200px", tablet: "160px", mobile: "140px" };

  const imgSrc = previewDevice === "mobile" && form.image_url_mobile
    ? getPublicUrl(form.image_url_mobile)
    : previewDevice === "tablet" && form.image_url_tablet
    ? getPublicUrl(form.image_url_tablet)
    : getPublicUrl(form.image_url);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className="text-xs font-medium">Preview</Label>
        <div className="flex gap-1 ml-auto">
          {(["desktop", "tablet", "mobile"] as const).map((d) => (
            <Button key={d} variant={previewDevice === d ? "default" : "outline"} size="icon" className="h-6 w-6"
              onClick={() => setPreviewDevice(d)}>
              {d === "desktop" ? <Monitor className="h-3 w-3" /> : d === "tablet" ? <Tablet className="h-3 w-3" /> : <Smartphone className="h-3 w-3" />}
            </Button>
          ))}
        </div>
      </div>
      <div className="flex justify-center bg-muted/50 rounded-lg p-3 border">
        <div style={{ width: widths[previewDevice], maxWidth: "100%", height: heights[previewDevice], transition: "all 0.3s" }}
          className="rounded-lg overflow-hidden border bg-background relative">
          {imgSrc ? (
            <>
              <img src={imgSrc} alt="Preview" className="w-full h-full object-cover" />
              {(form.title || form.subtitle || form.button_text) && (
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-center">
                  <div className="px-4 py-3 max-w-[60%]">
                    {form.title && <h3 className={cn("font-bold text-white", previewDevice === "mobile" ? "text-sm" : "text-lg")}>{form.title}</h3>}
                    {form.subtitle && <p className="text-white/80 text-xs mt-0.5">{form.subtitle}</p>}
                    {form.button_text && <span className="inline-block mt-2 bg-white text-black text-xs px-3 py-1 rounded font-medium">{form.button_text}</span>}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Image className="h-6 w-6 mx-auto mb-1" />
                <p className="text-2xs">No image uploaded</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Adverts() {
  const { currentStore } = useAuth();
  const [adverts, setAdverts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterPlacement, setFilterPlacement] = useState<string>("all");

  const storeId = currentStore?.id || "";

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
      ...form, store_id: currentStore.id,
      starts_at: form.starts_at || null, ends_at: form.ends_at || null,
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
    setDialogOpen(false); setEditId(null); setForm(emptyForm); load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this advert?")) return;
    await supabase.from("adverts" as any).delete().eq("id", id);
    toast.success("Advert deleted"); load();
  };

  const handleReorder = async (id: string, direction: "up" | "down") => {
    const idx = adverts.findIndex((a) => a.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= adverts.length) return;
    const updates = [
      { id: adverts[idx].id, sort_order: adverts[swapIdx].sort_order },
      { id: adverts[swapIdx].id, sort_order: adverts[idx].sort_order },
    ];
    for (const u of updates) {
      await supabase.from("adverts" as any).update({ sort_order: u.sort_order }).eq("id", u.id);
    }
    load();
  };

  const openEdit = (ad: any) => {
    setEditId(ad.id);
    setForm({
      name: ad.name, advert_type: ad.advert_type, image_url: ad.image_url || "",
      image_url_tablet: ad.image_url_tablet || "", image_url_mobile: ad.image_url_mobile || "",
      link_url: ad.link_url || "", title: ad.title || "", subtitle: ad.subtitle || "",
      button_text: ad.button_text || "", html_content: ad.html_content || "",
      placement: ad.placement, is_active: ad.is_active, starts_at: ad.starts_at?.slice(0, 16) || "",
      ends_at: ad.ends_at?.slice(0, 16) || "", sort_order: ad.sort_order,
      show_on_desktop: ad.show_on_desktop ?? true,
      show_on_tablet: ad.show_on_tablet ?? true,
      show_on_mobile: ad.show_on_mobile ?? true,
    });
    setDialogOpen(true);
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("adverts" as any).update({ is_active: active }).eq("id", id);
    load();
  };

  const filtered = filterPlacement === "all" ? adverts : adverts.filter((a) => a.placement === filterPlacement);

  return (
    <AdminLayout>
      <div className="space-y-3">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="text-lg font-semibold">Adverts & Banners</h1>
            <p className="text-xs text-muted-foreground">Upload banners with device-specific images, control placement & visibility</p>
          </div>
          <div className="page-header-actions">
            <Select value={filterPlacement} onValueChange={setFilterPlacement}>
              <SelectTrigger className="h-8 text-xs w-[180px]">
                <SelectValue placeholder="All Placements" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Placements</SelectItem>
                {PLACEMENTS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditId(null); setForm(emptyForm); } }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /><span className="btn-label">New Banner</span></Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editId ? "Edit Banner" : "New Banner"}</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="general" className="w-full">
                  <TabsList className="w-full grid grid-cols-3 h-8">
                    <TabsTrigger value="general" className="text-xs">General</TabsTrigger>
                    <TabsTrigger value="images" className="text-xs">Images & Preview</TabsTrigger>
                    <TabsTrigger value="scheduling" className="text-xs">Scheduling & Visibility</TabsTrigger>
                  </TabsList>

                  {/* General Tab */}
                  <TabsContent value="general" className="space-y-3 mt-3">
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
                    <div className="space-y-1">
                      <Label className="text-xs">Link URL</Label>
                      <Input className="h-8 text-xs" value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="/products or https://..." />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Title (overlay)</Label>
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
                  </TabsContent>

                  {/* Images & Preview Tab */}
                  <TabsContent value="images" className="space-y-4 mt-3">
                    {(form.advert_type === "banner" || form.advert_type === "carousel") && storeId && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <BannerImageUpload storeId={storeId} label="Desktop Image (1920×600)" value={form.image_url}
                            onChange={(v) => setForm({ ...form, image_url: v })} />
                          <BannerImageUpload storeId={storeId} label="Tablet Image (1024×400)" value={form.image_url_tablet}
                            onChange={(v) => setForm({ ...form, image_url_tablet: v })} />
                          <BannerImageUpload storeId={storeId} label="Mobile Image (640×320)" value={form.image_url_mobile}
                            onChange={(v) => setForm({ ...form, image_url_mobile: v })} />
                        </div>
                        <p className="text-2xs text-muted-foreground">
                          Tablet and mobile images are optional — the desktop image will be used as fallback.
                        </p>
                      </>
                    )}
                    <DevicePreview form={form} />
                  </TabsContent>

                  {/* Scheduling & Visibility Tab */}
                  <TabsContent value="scheduling" className="space-y-4 mt-3">
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
                    <div className="space-y-1">
                      <Label className="text-xs">Sort Order</Label>
                      <Input type="number" className="h-8 text-xs w-24" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
                    </div>

                    <div className="space-y-3 pt-2">
                      <Label className="text-xs font-semibold">Display On Devices</Label>
                      <div className="flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Switch checked={form.show_on_desktop} onCheckedChange={(v) => setForm({ ...form, show_on_desktop: v })} />
                          <Monitor className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs">Desktop</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Switch checked={form.show_on_tablet} onCheckedChange={(v) => setForm({ ...form, show_on_tablet: v })} />
                          <Tablet className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs">Tablet</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Switch checked={form.show_on_mobile} onCheckedChange={(v) => setForm({ ...form, show_on_mobile: v })} />
                          <Smartphone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs">Mobile</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                      <Label className="text-xs">Active</Label>
                    </div>
                  </TabsContent>
                </Tabs>

                <Button onClick={handleSave} className="w-full mt-2">{editId ? "Update" : "Create"} Banner</Button>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-8 w-8"></TableHead>
                  <TableHead className="text-xs h-8">Banner</TableHead>
                  <TableHead className="text-xs h-8">Placement</TableHead>
                  <TableHead className="text-xs h-8">Devices</TableHead>
                  <TableHead className="text-xs h-8">Status</TableHead>
                  <TableHead className="text-xs h-8">Schedule</TableHead>
                  <TableHead className="text-xs h-8 w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                    <Image className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                    No banners found. Create your first one.
                  </TableCell></TableRow>
                ) : filtered.map((ad: any, idx: number) => (
                  <TableRow key={ad.id} className="text-xs">
                    {/* Reorder */}
                    <TableCell className="py-2 px-1">
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => handleReorder(ad.id, "up")} disabled={idx === 0}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-20">
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button onClick={() => handleReorder(ad.id, "down")} disabled={idx === filtered.length - 1}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-20">
                          <ArrowDown className="h-3 w-3" />
                        </button>
                      </div>
                    </TableCell>
                    {/* Banner info */}
                    <TableCell className="py-2">
                      <div className="flex items-center gap-2">
                        {ad.image_url ? (
                          <img src={getPublicUrl(ad.image_url)} alt="" className="h-8 w-14 object-cover rounded" />
                        ) : (
                          <div className="h-8 w-14 bg-muted rounded flex items-center justify-center"><Image className="h-3 w-3 text-muted-foreground" /></div>
                        )}
                        <div>
                          <span className="font-medium block">{ad.name}</span>
                          <Badge variant="outline" className="text-[10px] capitalize mt-0.5">{ad.advert_type}</Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-2 text-muted-foreground">{PLACEMENTS.find(p => p.value === ad.placement)?.label || ad.placement}</TableCell>
                    {/* Device badges */}
                    <TableCell className="py-2">
                      <div className="flex gap-1">
                        {(ad.show_on_desktop ?? true) && <Monitor className="h-3.5 w-3.5 text-muted-foreground" />}
                        {(ad.show_on_tablet ?? true) && <Tablet className="h-3.5 w-3.5 text-muted-foreground" />}
                        {(ad.show_on_mobile ?? true) && <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />}
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <Switch checked={ad.is_active} onCheckedChange={(v) => toggleActive(ad.id, v)} />
                    </TableCell>
                    <TableCell className="py-2 text-muted-foreground">
                      {ad.starts_at ? new Date(ad.starts_at).toLocaleDateString() : "Always"}
                      {ad.ends_at ? ` → ${new Date(ad.ends_at).toLocaleDateString()}` : ""}
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(ad)}><Pencil className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDelete(ad.id)}><Trash2 className="h-3 w-3" /></Button>
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
