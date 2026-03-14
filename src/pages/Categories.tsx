import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCategories, useCreateCategory, useDeleteCategory } from "@/hooks/use-data";
import { Plus, ChevronRight, Folder, FolderOpen, Trash2, Edit, Save, ArrowUp, ArrowDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

type Cat = {
  id: string; name: string; slug: string; parent_id: string | null; sort_order: number; store_id: string;
  description?: string | null; image_url?: string | null; seo_title?: string | null; seo_description?: string | null;
};

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

  if (!hasChildren) {
    return (
      <div className="flex items-center justify-between py-2 px-3 text-xs hover:bg-muted/50 rounded-md group">
        <div className="flex items-center gap-2">
          <Folder className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{category.name}</span>
          <span className="text-2xs text-muted-foreground">/{category.slug}</span>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100">
          {onMoveUp && !isFirst && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMoveUp}><ArrowUp className="h-3 w-3" /></Button>}
          {onMoveDown && !isLast && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMoveDown}><ArrowDown className="h-3 w-3" /></Button>}
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(category)}><Edit className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDelete(category.id)}><Trash2 className="h-3 w-3" /></Button>
        </div>
      </div>
    );
  }

  return (
    <Collapsible defaultOpen>
      <div className="flex items-center justify-between group">
        <CollapsibleTrigger className="flex-1">
          <div className="flex items-center gap-2 py-2 px-3 text-xs hover:bg-muted/50 rounded-md cursor-pointer">
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <FolderOpen className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium">{category.name}</span>
            <span className="text-2xs text-muted-foreground">/{category.slug}</span>
          </div>
        </CollapsibleTrigger>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 pr-2">
          {onMoveUp && !isFirst && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMoveUp}><ArrowUp className="h-3 w-3" /></Button>}
          {onMoveDown && !isLast && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMoveDown}><ArrowDown className="h-3 w-3" /></Button>}
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(category)}><Edit className="h-3 w-3" /></Button>
        </div>
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

export default function Categories() {
  const { data: categories = [], isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editCat, setEditCat] = useState<Cat | null>(null);
  const [form, setForm] = useState({
    name: "", slug: "", parent_id: "", description: "", image_url: "", seo_title: "", seo_description: "",
  });

  const tree = buildTree(categories as Cat[]);

  const swapSortOrder = async (catA: Cat, catB: Cat) => {
    const tmpA = catA.sort_order;
    const tmpB = catB.sort_order;
    await supabase.from("categories").update({ sort_order: tmpB } as any).eq("id", catA.id);
    await supabase.from("categories").update({ sort_order: tmpA } as any).eq("id", catB.id);
    qc.invalidateQueries({ queryKey: ["categories"] });
    toast.success("Order updated");
  };

  const resetForm = () => setForm({ name: "", slug: "", parent_id: "", description: "", image_url: "", seo_title: "", seo_description: "" });

  const handleCreate = () => {
    if (!form.name || !form.slug) { toast.error("Name and slug required"); return; }
    createCategory.mutate(
      {
        name: form.name,
        slug: form.slug,
        parent_id: form.parent_id || null,
        description: form.description || null,
        image_url: form.image_url || null,
        seo_title: form.seo_title || null,
        seo_description: form.seo_description || null,
      } as any,
      { onSuccess: () => { setOpen(false); resetForm(); } }
    );
  };

  const openEdit = (cat: Cat) => {
    setForm({
      name: cat.name,
      slug: cat.slug,
      parent_id: cat.parent_id || "",
      description: cat.description || "",
      image_url: cat.image_url || "",
      seo_title: cat.seo_title || "",
      seo_description: cat.seo_description || "",
    });
    setEditCat(cat);
  };

  const handleUpdate = async () => {
    if (!editCat) return;
    const { error } = await supabase.from("categories").update({
      name: form.name,
      slug: form.slug,
      parent_id: form.parent_id || null,
      description: form.description || null,
      image_url: form.image_url || null,
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
    <div className="space-y-3">
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
        <Textarea className="text-xs min-h-[60px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Category description" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Image URL</Label>
        <Input className="h-8 text-xs" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">SEO Title</Label>
          <Input className="h-8 text-xs" value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} placeholder="Page title for search engines" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">SEO Description</Label>
          <Input className="h-8 text-xs" value={form.seo_description} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} placeholder="Meta description" />
        </div>
      </div>
      <Button size="sm" className="h-8 text-xs w-full" onClick={onSubmit}>
        {submitLabel}
      </Button>
    </div>
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
            <DialogContent>
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
              tree.map((cat) => (
                <CategoryItem key={cat.id} category={cat} children={cat.children} onDelete={(id) => deleteCategory.mutate(id)} onEdit={openEdit} />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editCat} onOpenChange={(o) => { if (!o) { setEditCat(null); resetForm(); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-sm">Edit Category</DialogTitle></DialogHeader>
          <CategoryForm onSubmit={handleUpdate} submitLabel="Save Changes" />
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}