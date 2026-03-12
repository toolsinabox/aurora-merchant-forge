import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCategories, useCreateCategory, useDeleteCategory } from "@/hooks/use-data";
import { Plus, ChevronRight, Folder, FolderOpen, Trash2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type Cat = { id: string; name: string; slug: string; parent_id: string | null; sort_order: number; store_id: string };

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

function CategoryItem({ category, children, onDelete }: { category: Cat; children: Cat[]; onDelete: (id: string) => void }) {
  const hasChildren = children.length > 0;

  if (!hasChildren) {
    return (
      <div className="flex items-center justify-between py-2 px-3 text-xs hover:bg-muted/50 rounded-md group">
        <div className="flex items-center gap-2">
          <Folder className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{category.name}</span>
          <span className="text-2xs text-muted-foreground">/{category.slug}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => onDelete(category.id)}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <Collapsible defaultOpen>
      <div className="flex items-center justify-between">
        <CollapsibleTrigger className="flex-1">
          <div className="flex items-center gap-2 py-2 px-3 text-xs hover:bg-muted/50 rounded-md cursor-pointer">
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <FolderOpen className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium">{category.name}</span>
            <span className="text-2xs text-muted-foreground">/{category.slug}</span>
          </div>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="pl-5">
        {children.map((child) => (
          <CategoryItem key={child.id} category={child} children={[]} onDelete={onDelete} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function Categories() {
  const { data: categories = [], isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const [open, setOpen] = useState(false);
  const [newCat, setNewCat] = useState({ name: "", slug: "", parent_id: "" });

  const tree = buildTree(categories);

  const handleCreate = () => {
    if (!newCat.name || !newCat.slug) { toast.error("Name and slug required"); return; }
    createCategory.mutate(
      { name: newCat.name, slug: newCat.slug, parent_id: newCat.parent_id || null },
      { onSuccess: () => { setOpen(false); setNewCat({ name: "", slug: "", parent_id: "" }); } }
    );
  };

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
              <Button size="sm" className="h-8 text-xs gap-1"><Plus className="h-3.5 w-3.5" /> Add Category</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="text-sm">New Category</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Name</Label>
                  <Input className="h-8 text-xs" value={newCat.name} onChange={(e) => {
                    setNewCat({ ...newCat, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") });
                  }} placeholder="Category name" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Slug</Label>
                  <Input className="h-8 text-xs font-mono" value={newCat.slug} onChange={(e) => setNewCat({ ...newCat, slug: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Parent Category</Label>
                  <Select value={newCat.parent_id} onValueChange={(v) => setNewCat({ ...newCat, parent_id: v === "none" ? "" : v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="None (top level)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-xs">None (top level)</SelectItem>
                      {categories.filter((c) => !c.parent_id).map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button size="sm" className="h-8 text-xs w-full" onClick={handleCreate} disabled={createCategory.isPending}>
                  {createCategory.isPending ? "Creating..." : "Create Category"}
                </Button>
              </div>
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
                <CategoryItem key={cat.id} category={cat} children={cat.children} onDelete={(id) => deleteCategory.mutate(id)} />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
