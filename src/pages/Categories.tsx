import { useState, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCategories, useCreateCategory, useDeleteCategory } from "@/hooks/use-data";
import { Plus, ChevronRight, Folder, FolderOpen, Trash2, Edit, Save, ArrowUp, ArrowDown, Upload, X, Copy, Image } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

type Cat = {
  id: string; name: string; slug: string; parent_id: string | null; sort_order: number; store_id: string;
  description?: string | null; image_url?: string | null; secondary_image_url?: string | null;
  seo_title?: string | null; seo_description?: string | null;
};

/* ── B@SE Tag definitions per field group ── */
const BASE_TAGS: Record<string, { tag: string; desc: string }[]> = {
  general: [
    { tag: "[%category_name%]", desc: "Category name" },
    { tag: "[%category_id%]", desc: "Category ID" },
    { tag: "[%category_reference%]", desc: "Category reference/slug" },
    { tag: "[%parent_category_name%]", desc: "Parent category name" },
    { tag: "[%parent_category_id%]", desc: "Parent category ID" },
    { tag: "[%category_url%]", desc: "Full category URL" },
    { tag: "[%sort_order%]", desc: "Sort order position" },
    { tag: "[%is_active%]", desc: "Whether category is active" },
  ],
  description: [
    { tag: "[%category_description%]", desc: "Full description HTML" },
    { tag: "[%category_short_description%]", desc: "Short description" },
  ],
  images: [
    { tag: "[%category_image%]", desc: "Primary category image URL" },
    { tag: "[%category_image_secondary%]", desc: "Secondary category image URL" },
    { tag: "[%thumb src=[%category_image%] w=300 h=300%]", desc: "Thumbnail (300×300)" },
    { tag: "[%thumb src=[%category_image_secondary%] w=300 h=300%]", desc: "Secondary thumb (300×300)" },
  ],
  seo: [
    { tag: "[%seo_title%]", desc: "SEO page title" },
    { tag: "[%seo_description%]", desc: "SEO meta description" },
    { tag: "[%seo_heading%]", desc: "SEO page heading" },
    { tag: "[%seo_keywords%]", desc: "SEO meta keywords" },
    { tag: "[%canonical_url%]", desc: "Canonical URL" },
  ],
  navigation: [
    { tag: "[%category_breadcrumb%]", desc: "Breadcrumb trail" },
    { tag: "[%subcategory_list%]", desc: "List of subcategories" },
    { tag: "[%category_menu%]", desc: "Category navigation menu" },
    { tag: "[%on_sitemap%]", desc: "Show on sitemap flag" },
    { tag: "[%on_menu%]", desc: "Show on menu flag" },
  ],
  filtering: [
    { tag: "[%allow_filtering%]", desc: "Allow attribute filtering" },
    { tag: "[%category_product_count%]", desc: "Number of products" },
    { tag: "[%category_filter_options%]", desc: "Available filter options" },
  ],
  external: [
    { tag: "[%external_source%]", desc: "External source identifier" },
    { tag: "[%external_reference1%]", desc: "External reference 1" },
    { tag: "[%external_reference2%]", desc: "External reference 2" },
    { tag: "[%external_reference3%]", desc: "External reference 3" },
  ],
};

function BaseTagGroup({ group }: { group: string }) {
  const tags = BASE_TAGS[group] || [];
  if (!tags.length) return null;

  const copyTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    toast.success(`Copied: ${tag}`);
  };

  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {tags.map((t) => (
        <button
          key={t.tag}
          type="button"
          onClick={() => copyTag(t.tag)}
          title={`${t.desc} — Click to copy`}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted hover:bg-primary/10 hover:text-primary border border-border/50 transition-colors cursor-pointer"
        >
          <Copy className="h-2.5 w-2.5 opacity-50" />
          {t.tag}
        </button>
      ))}
    </div>
  );
}

/* ── Image upload component ── */
function ImageUploadField({ label, value, onChange, storeId }: {
  label: string; value: string; onChange: (url: string) => void; storeId?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!storeId) { toast.error("No store context"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${storeId}/categories/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
    onChange(pub.publicUrl);
    setUploading(false);
  };

  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {value ? (
        <div className="relative group w-full">
          <img src={value} alt={label} className="w-full h-28 object-cover rounded-md border border-border" />
          <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
            onClick={() => onChange("")}><X className="h-3 w-3" /></Button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-border rounded-md cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
        >
          {uploading ? (
            <span className="text-xs text-muted-foreground animate-pulse">Uploading...</span>
          ) : (
            <>
              <Upload className="h-5 w-5 text-muted-foreground mb-1" />
              <span className="text-[10px] text-muted-foreground">Click to upload</span>
            </>
          )}
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
    </div>
  );
}

/* ── Tree helpers ── */
function buildTree(cats: Cat[]): (Cat & { children: Cat[] })[] {
  const map = new Map<string | null, Cat[]>();
  cats.forEach((c) => {
    const pid = c.parent_id || null;
    if (!map.has(pid)) map.set(pid, []);
    map.get(pid)!.push(c);
  });
  return (map.get(null) || []).map((c) => ({
    ...c,
    children: map.get(c.id) || [],
  }));
}

function CategoryItem({ category, children, onDelete, onEdit, onMoveUp, onMoveDown, isFirst, isLast }: {
  category: Cat; children: Cat[]; onDelete: (id: string) => void; onEdit: (cat: Cat) => void;
  onMoveUp?: () => void; onMoveDown?: () => void; isFirst?: boolean; isLast?: boolean;
}) {
  const hasChildren = children.length > 0;

  const thumb = category.image_url;
  const ItemContent = () => (
    <div className="flex items-center gap-2">
      {thumb ? (
        <img src={thumb} className="h-5 w-5 rounded object-cover flex-shrink-0" alt="" />
      ) : hasChildren ? (
        <FolderOpen className="h-3.5 w-3.5 text-primary" />
      ) : (
        <Folder className="h-3.5 w-3.5 text-muted-foreground" />
      )}
      <span className={hasChildren ? "font-medium" : ""}>{category.name}</span>
      <span className="text-2xs text-muted-foreground">/{category.slug}</span>
    </div>
  );

  const Actions = () => (
    <div className="flex gap-1 opacity-0 group-hover:opacity-100">
      {onMoveUp && !isFirst && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMoveUp}><ArrowUp className="h-3 w-3" /></Button>}
      {onMoveDown && !isLast && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMoveDown}><ArrowDown className="h-3 w-3" /></Button>}
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(category)}><Edit className="h-3 w-3" /></Button>
      {!hasChildren && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDelete(category.id)}><Trash2 className="h-3 w-3" /></Button>}
    </div>
  );

  if (!hasChildren) {
    return (
      <div className="flex items-center justify-between py-2 px-3 text-xs hover:bg-muted/50 rounded-md group">
        <ItemContent />
        <Actions />
      </div>
    );
  }

  return (
    <Collapsible defaultOpen>
      <div className="flex items-center justify-between group">
        <CollapsibleTrigger className="flex-1">
          <div className="flex items-center gap-2 py-2 px-3 text-xs hover:bg-muted/50 rounded-md cursor-pointer">
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <ItemContent />
          </div>
        </CollapsibleTrigger>
        <div className="pr-2"><Actions /></div>
      </div>
      <CollapsibleContent className="pl-5">
        {children.map((child, idx) => (
          <CategoryItem key={child.id} category={child} children={[]} onDelete={onDelete} onEdit={onEdit}
            isFirst={idx === 0} isLast={idx === children.length - 1}
            onMoveUp={() => onEdit(child)} onMoveDown={() => onEdit(child)} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

/* ── Main page ── */
export default function Categories() {
  const { data: categories = [], isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editCat, setEditCat] = useState<Cat | null>(null);
  const [form, setForm] = useState({
    name: "", slug: "", parent_id: "", description: "",
    image_url: "", secondary_image_url: "",
    seo_title: "", seo_description: "",
  });

  // Get store_id from first category or empty
  const storeId = (categories as Cat[])[0]?.store_id;

  const tree = buildTree(categories as Cat[]);

  const swapSortOrder = async (catA: Cat, catB: Cat) => {
    const tmpA = catA.sort_order;
    const tmpB = catB.sort_order;
    await supabase.from("categories").update({ sort_order: tmpB } as any).eq("id", catA.id);
    await supabase.from("categories").update({ sort_order: tmpA } as any).eq("id", catB.id);
    qc.invalidateQueries({ queryKey: ["categories"] });
    toast.success("Order updated");
  };

  const resetForm = () => setForm({
    name: "", slug: "", parent_id: "", description: "",
    image_url: "", secondary_image_url: "",
    seo_title: "", seo_description: "",
  });

  const handleCreate = () => {
    if (!form.name || !form.slug) { toast.error("Name and slug required"); return; }
    createCategory.mutate(
      {
        name: form.name, slug: form.slug,
        parent_id: form.parent_id || null,
        description: form.description || null,
        image_url: form.image_url || null,
        secondary_image_url: form.secondary_image_url || null,
        seo_title: form.seo_title || null,
        seo_description: form.seo_description || null,
      } as any,
      { onSuccess: () => { setOpen(false); resetForm(); } }
    );
  };

  const openEdit = (cat: Cat) => {
    setForm({
      name: cat.name, slug: cat.slug,
      parent_id: cat.parent_id || "",
      description: cat.description || "",
      image_url: cat.image_url || "",
      secondary_image_url: (cat as any).secondary_image_url || "",
      seo_title: cat.seo_title || "",
      seo_description: cat.seo_description || "",
    });
    setEditCat(cat);
  };

  const handleUpdate = async () => {
    if (!editCat) return;
    const { error } = await supabase.from("categories").update({
      name: form.name, slug: form.slug,
      parent_id: form.parent_id || null,
      description: form.description || null,
      image_url: form.image_url || null,
      secondary_image_url: form.secondary_image_url || null,
      seo_title: form.seo_title || null,
      seo_description: form.seo_description || null,
    } as any).eq("id", editCat.id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["categories"] });
    toast.success("Category updated");
    setEditCat(null);
    resetForm();
  };

  const CategoryForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="w-full grid grid-cols-4 h-8 text-[10px]">
        <TabsTrigger value="general" className="text-[10px]">General</TabsTrigger>
        <TabsTrigger value="images" className="text-[10px]">Images</TabsTrigger>
        <TabsTrigger value="seo" className="text-[10px]">SEO</TabsTrigger>
        <TabsTrigger value="tags" className="text-[10px]">B@SE Tags</TabsTrigger>
      </TabsList>

      {/* General */}
      <TabsContent value="general" className="space-y-3 mt-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Name *</Label>
            <Input className="h-8 text-xs" value={form.name} onChange={(e) => {
              const slug = e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
              setForm({ ...form, name: e.target.value, ...(editCat ? {} : { slug }) });
            }} placeholder="Category name" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Slug *</Label>
            <Input className="h-8 text-xs font-mono" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Parent Category</Label>
          <Select value={form.parent_id || "none"} onValueChange={(v) => setForm({ ...form, parent_id: v === "none" ? "" : v })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="None (top level)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-xs">None (top level)</SelectItem>
              {(categories as Cat[]).filter((c) => !c.parent_id && c.id !== editCat?.id).map((c) => (
                <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Description</Label>
          <Textarea className="text-xs min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Category description" />
          <BaseTagGroup group="description" />
        </div>
        <BaseTagGroup group="general" />
        <Button size="sm" className="h-8 text-xs w-full" onClick={onSubmit}>{submitLabel}</Button>
      </TabsContent>

      {/* Images */}
      <TabsContent value="images" className="space-y-3 mt-3">
        <div className="grid grid-cols-2 gap-3">
          <ImageUploadField label="Primary Image" value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} storeId={storeId} />
          <ImageUploadField label="Secondary Image" value={form.secondary_image_url} onChange={(url) => setForm({ ...form, secondary_image_url: url })} storeId={storeId} />
        </div>
        <BaseTagGroup group="images" />
        <Button size="sm" className="h-8 text-xs w-full" onClick={onSubmit}>{submitLabel}</Button>
      </TabsContent>

      {/* SEO */}
      <TabsContent value="seo" className="space-y-3 mt-3">
        <div className="space-y-1">
          <Label className="text-xs">SEO Title</Label>
          <Input className="h-8 text-xs" value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} placeholder="Page title for search engines" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">SEO Description</Label>
          <Textarea className="text-xs min-h-[60px]" value={form.seo_description} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} placeholder="Meta description" />
        </div>
        <BaseTagGroup group="seo" />
        <Button size="sm" className="h-8 text-xs w-full" onClick={onSubmit}>{submitLabel}</Button>
      </TabsContent>

      {/* All B@SE Tags Reference */}
      <TabsContent value="tags" className="space-y-3 mt-3">
        <p className="text-[10px] text-muted-foreground">Click any tag to copy it to your clipboard for use in templates.</p>
        {Object.entries(BASE_TAGS).map(([group, tags]) => (
          <div key={group}>
            <h4 className="text-xs font-medium capitalize mb-1">{group}</h4>
            <div className="flex flex-wrap gap-1">
              {tags.map((t) => (
                <button key={t.tag} type="button"
                  onClick={() => { navigator.clipboard.writeText(t.tag); toast.success(`Copied: ${t.tag}`); }}
                  title={t.desc}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted hover:bg-primary/10 hover:text-primary border border-border/50 transition-colors cursor-pointer"
                >
                  <Copy className="h-2.5 w-2.5 opacity-50" />
                  {t.tag}
                </button>
              ))}
            </div>
          </div>
        ))}
      </TabsContent>
    </Tabs>
  );

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Categories</h1>
            <p className="text-xs text-muted-foreground">{categories.length} categories</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs gap-1" onClick={resetForm}><Plus className="h-3.5 w-3.5" /> Add Category</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle className="text-sm">New Category</DialogTitle></DialogHeader>
              <CategoryForm onSubmit={handleCreate} submitLabel={createCategory.isPending ? "Creating..." : "Create Category"} />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Category Tree</CardTitle></CardHeader>
          <CardContent className="p-2">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full mb-1" />)
            ) : categories.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No categories yet. Create your first category.</p>
            ) : (
              tree.map((cat, idx) => (
                <CategoryItem key={cat.id} category={cat} children={cat.children}
                  onDelete={(id) => deleteCategory.mutate(id)} onEdit={openEdit}
                  isFirst={idx === 0} isLast={idx === tree.length - 1}
                  onMoveUp={idx > 0 ? () => swapSortOrder(cat, tree[idx - 1]) : undefined}
                  onMoveDown={idx < tree.length - 1 ? () => swapSortOrder(cat, tree[idx + 1]) : undefined}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editCat} onOpenChange={(o) => { if (!o) { setEditCat(null); resetForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="text-sm">Edit Category</DialogTitle></DialogHeader>
          <CategoryForm onSubmit={handleUpdate} submitLabel="Save Changes" />
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
