import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, FileText, Trash2, Pencil, Search, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";

interface PageForm {
  title: string;
  slug: string;
  content: string;
  page_type: string;
  seo_title: string;
  seo_description: string;
  is_published: boolean;
}

const emptyForm: PageForm = {
  title: "", slug: "", content: "", page_type: "page",
  seo_title: "", seo_description: "", is_published: false,
};

const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function ContentPages() {
  const { currentStore } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PageForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ["content_pages", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data, error } = await supabase
        .from("content_pages")
        .select("*")
        .eq("store_id", currentStore.id)
        .order("sort_order")
        .order("title");
      if (error) throw error;
      return data;
    },
    enabled: !!currentStore,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!currentStore) throw new Error("No store");
      const payload = {
        store_id: currentStore.id,
        title: form.title,
        slug: form.slug || slugify(form.title),
        content: form.content,
        page_type: form.page_type,
        seo_title: form.seo_title || null,
        seo_description: form.seo_description || null,
        is_published: form.is_published,
        status: form.is_published ? "published" : "draft",
        published_at: form.is_published ? new Date().toISOString() : null,
      };
      if (editId) {
        const { error } = await supabase.from("content_pages").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("content_pages").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content_pages"] });
      toast.success(editId ? "Page updated" : "Page created");
      setOpen(false);
      setForm(emptyForm);
      setEditId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("content_pages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content_pages"] });
      toast.success("Page deleted");
    },
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, pub }: { id: string; pub: boolean }) => {
      const { error } = await supabase.from("content_pages").update({
        is_published: pub,
        status: pub ? "published" : "draft",
        published_at: pub ? new Date().toISOString() : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["content_pages"] }),
  });

  const openEdit = (p: any) => {
    setEditId(p.id);
    setForm({
      title: p.title, slug: p.slug, content: p.content || "",
      page_type: p.page_type, seo_title: p.seo_title || "",
      seo_description: p.seo_description || "", is_published: p.is_published,
    });
    setOpen(true);
  };

  const filtered = pages.filter((p: any) => {
    if (typeFilter !== "all" && p.page_type !== typeFilter) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.slug.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const pageTypes = [
    { value: "page", label: "Page" },
    { value: "blog", label: "Blog Post" },
    { value: "faq", label: "FAQ" },
    { value: "policy", label: "Policy" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Content Pages</h1>
            <p className="text-sm text-muted-foreground">{pages.length} pages · {pages.filter((p: any) => p.is_published).length} published</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(emptyForm); setEditId(null); } }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />Create Page</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editId ? "Edit" : "New"} Content Page</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Title *</Label>
                    <Input value={form.title} onChange={e => {
                      const title = e.target.value;
                      setForm({ ...form, title, slug: editId ? form.slug : slugify(title) });
                    }} />
                  </div>
                  <div>
                    <Label>Slug</Label>
                    <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className="font-mono text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Page Type</Label>
                    <Select value={form.page_type} onValueChange={v => setForm({ ...form, page_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {pageTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end gap-2 pb-1">
                    <Button variant={form.is_published ? "default" : "outline"} size="sm"
                      onClick={() => setForm({ ...form, is_published: !form.is_published })}>
                      {form.is_published ? <><Eye className="h-3.5 w-3.5 mr-1" />Published</> : <><EyeOff className="h-3.5 w-3.5 mr-1" />Draft</>}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Content</Label>
                  <Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={10} placeholder="Page content (HTML or Markdown)" />
                </div>
                <div className="border-t pt-3 space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">SEO</p>
                  <div><Label>SEO Title</Label><Input value={form.seo_title} onChange={e => setForm({ ...form, seo_title: e.target.value })} placeholder={form.title} /></div>
                  <div><Label>SEO Description</Label><Textarea value={form.seo_description} onChange={e => setForm({ ...form, seo_description: e.target.value })} rows={2} /></div>
                </div>
                <Button onClick={() => saveMutation.mutate()} disabled={!form.title || saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : editId ? "Update Page" : "Create Page"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search pages..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Tabs value={typeFilter} onValueChange={setTypeFilter}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              {pageTypes.map(t => <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>)}
            </TabsList>
          </Tabs>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No pages found</TableCell></TableRow>
                ) : filtered.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">/{p.slug}</TableCell>
                    <TableCell><Badge variant="outline">{pageTypes.find(t => t.value === p.page_type)?.label || p.page_type}</Badge></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => togglePublish.mutate({ id: p.id, pub: !p.is_published })}>
                        {p.is_published ? <Badge variant="default">Published</Badge> : <Badge variant="secondary">Draft</Badge>}
                      </Button>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(p.updated_at), "dd MMM yyyy")}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
