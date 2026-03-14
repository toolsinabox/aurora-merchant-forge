import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProducts } from "@/hooks/use-data";
import { toast } from "sonner";
import { Plus, Trash2, Sparkles, Eye, Pencil, Search, FolderOpen, Layers } from "lucide-react";

interface Rule {
  field: string;
  operator: string;
  value: string;
}

interface CollectionForm {
  name: string;
  slug: string;
  description: string;
  match_type: "all" | "any";
  rules: Rule[];
  is_active: boolean;
  image_url: string;
  seo_title: string;
  seo_description: string;
}

const RULE_FIELDS = [
  { value: "brand", label: "Brand" },
  { value: "product_type", label: "Product Type" },
  { value: "price", label: "Price" },
  { value: "compare_at_price", label: "Compare At Price" },
  { value: "tags", label: "Tags" },
  { value: "status", label: "Status" },
  { value: "stock_quantity", label: "Stock Quantity" },
  { value: "title", label: "Title" },
  { value: "sku", label: "SKU" },
  { value: "vendor", label: "Vendor" },
  { value: "cost_price", label: "Cost Price" },
  { value: "weight", label: "Weight" },
];

const TEXT_OPERATORS = [
  { value: "equals", label: "equals" },
  { value: "not_equals", label: "does not equal" },
  { value: "contains", label: "contains" },
  { value: "not_contains", label: "does not contain" },
  { value: "starts_with", label: "starts with" },
  { value: "ends_with", label: "ends with" },
];

const NUMBER_OPERATORS = [
  { value: "equals", label: "equals" },
  { value: "not_equals", label: "does not equal" },
  { value: "greater_than", label: "greater than" },
  { value: "less_than", label: "less than" },
  { value: "between", label: "between" },
];

const isNumericField = (field: string) => ["price", "compare_at_price", "cost_price", "stock_quantity", "weight"].includes(field);

const generateSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 48);

const emptyForm: CollectionForm = {
  name: "", slug: "", description: "", match_type: "all",
  rules: [{ field: "brand", operator: "equals", value: "" }],
  is_active: true, image_url: "", seo_title: "", seo_description: "",
};

function matchesRule(product: any, rule: Rule): boolean {
  const val = product[rule.field];
  const ruleVal = rule.value;

  if (isNumericField(rule.field)) {
    const numVal = Number(val) || 0;
    const numRule = Number(ruleVal) || 0;
    switch (rule.operator) {
      case "equals": return numVal === numRule;
      case "not_equals": return numVal !== numRule;
      case "greater_than": return numVal > numRule;
      case "less_than": return numVal < numRule;
      case "between": {
        const [min, max] = ruleVal.split("-").map(Number);
        return numVal >= (min || 0) && numVal <= (max || Infinity);
      }
      default: return false;
    }
  }

  const strVal = String(val || "").toLowerCase();
  const strRule = ruleVal.toLowerCase();
  switch (rule.operator) {
    case "equals": return strVal === strRule;
    case "not_equals": return strVal !== strRule;
    case "contains": return strVal.includes(strRule);
    case "not_contains": return !strVal.includes(strRule);
    case "starts_with": return strVal.startsWith(strRule);
    case "ends_with": return strVal.endsWith(strRule);
    default: return false;
  }
}

function getMatchingProducts(products: any[], rules: Rule[], matchType: "all" | "any"): any[] {
  if (!rules.length || rules.every(r => !r.value)) return [];
  return products.filter(p => {
    const validRules = rules.filter(r => r.value);
    if (!validRules.length) return false;
    return matchType === "all"
      ? validRules.every(r => matchesRule(p, r))
      : validRules.some(r => matchesRule(p, r));
  });
}

export default function SmartCollections() {
  const { currentStore } = useAuth();
  const qc = useQueryClient();
  const { data: products = [] } = useProducts();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CollectionForm>({ ...emptyForm });
  const [search, setSearch] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewCollection, setPreviewCollection] = useState<any>(null);

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ["smart_collections", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data, error } = await supabase
        .from("smart_collections")
        .select("*")
        .eq("store_id", currentStore.id)
        .order("sort_order");
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
        name: form.name,
        slug: form.slug || generateSlug(form.name),
        description: form.description || null,
        match_type: form.match_type,
        rules: form.rules as any,
        is_active: form.is_active,
        image_url: form.image_url || null,
        seo_title: form.seo_title || null,
        seo_description: form.seo_description || null,
      };
      if (editId) {
        const { error } = await supabase.from("smart_collections").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("smart_collections").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["smart_collections"] });
      toast.success(editId ? "Collection updated" : "Collection created");
      setOpen(false);
      setEditId(null);
      setForm({ ...emptyForm });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("smart_collections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["smart_collections"] });
      toast.success("Collection deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const openEdit = (c: any) => {
    setEditId(c.id);
    setForm({
      name: c.name, slug: c.slug, description: c.description || "",
      match_type: c.match_type, rules: c.rules || [{ field: "brand", operator: "equals", value: "" }],
      is_active: c.is_active, image_url: c.image_url || "",
      seo_title: c.seo_title || "", seo_description: c.seo_description || "",
    });
    setOpen(true);
  };

  const addRule = () => setForm(f => ({ ...f, rules: [...f.rules, { field: "brand", operator: "equals", value: "" }] }));
  const removeRule = (idx: number) => setForm(f => ({ ...f, rules: f.rules.filter((_, i) => i !== idx) }));
  const updateRule = (idx: number, key: keyof Rule, val: string) => {
    setForm(f => {
      const rules = [...f.rules];
      rules[idx] = { ...rules[idx], [key]: val };
      if (key === "field") {
        rules[idx].operator = isNumericField(val) ? "equals" : "equals";
      }
      return { ...f, rules };
    });
  };

  const previewProducts = getMatchingProducts(products as any[], form.rules, form.match_type);

  const filtered = (collections as any[]).filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Smart Collections</h1>
            <p className="text-xs text-muted-foreground">Auto-populate product collections based on rules</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditId(null); setForm({ ...emptyForm }); } }}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs gap-1"><Plus className="h-3.5 w-3.5" /> Create Collection</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-sm">{editId ? "Edit" : "Create"} Smart Collection</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Name *</Label><Input className="h-8 text-xs" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: editId ? f.slug : generateSlug(e.target.value) }))} placeholder="e.g. Summer Sale" /></div>
                  <div><Label className="text-xs">Slug</Label><Input className="h-8 text-xs font-mono" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="summer-sale" /></div>
                </div>
                <div><Label className="text-xs">Description</Label><Textarea className="text-xs min-h-[60px]" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>

                {/* Rules */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Rules</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Products must match</span>
                      <Select value={form.match_type} onValueChange={v => setForm(f => ({ ...f, match_type: v as "all" | "any" }))}>
                        <SelectTrigger className="h-7 w-20 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" className="text-xs">ALL</SelectItem>
                          <SelectItem value="any" className="text-xs">ANY</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-xs text-muted-foreground">rules</span>
                    </div>
                  </div>

                  {form.rules.map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
                      <Select value={rule.field} onValueChange={v => updateRule(idx, "field", v)}>
                        <SelectTrigger className="h-7 w-36 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{RULE_FIELDS.map(f => <SelectItem key={f.value} value={f.value} className="text-xs">{f.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={rule.operator} onValueChange={v => updateRule(idx, "operator", v)}>
                        <SelectTrigger className="h-7 w-36 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(isNumericField(rule.field) ? NUMBER_OPERATORS : TEXT_OPERATORS).map(o =>
                            <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <Input className="h-7 text-xs flex-1" value={rule.value} onChange={e => updateRule(idx, "value", e.target.value)} placeholder={rule.operator === "between" ? "min-max" : "value"} />
                      {form.rules.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeRule(idx)}><Trash2 className="h-3 w-3" /></Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="text-xs h-7" onClick={addRule}><Plus className="h-3 w-3 mr-1" /> Add Rule</Button>
                </div>

                {/* Preview */}
                <div className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold flex items-center gap-1"><Eye className="h-3 w-3" /> Preview</p>
                    <Badge variant="secondary" className="text-2xs">{previewProducts.length} products matched</Badge>
                  </div>
                  {previewProducts.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                      {previewProducts.slice(0, 12).map((p: any) => (
                        <div key={p.id} className="text-2xs bg-muted/50 rounded p-1.5 truncate">{p.title}</div>
                      ))}
                      {previewProducts.length > 12 && <div className="text-2xs text-muted-foreground p-1.5">+{previewProducts.length - 12} more</div>}
                    </div>
                  ) : (
                    <p className="text-2xs text-muted-foreground">No products match current rules. Add or adjust rules above.</p>
                  )}
                </div>

                {/* SEO */}
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">SEO Title</Label><Input className="h-8 text-xs" value={form.seo_title} onChange={e => setForm(f => ({ ...f, seo_title: e.target.value }))} /></div>
                  <div><Label className="text-xs">SEO Description</Label><Input className="h-8 text-xs" value={form.seo_description} onChange={e => setForm(f => ({ ...f, seo_description: e.target.value }))} /></div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                  <Label className="text-xs">Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => { setOpen(false); setEditId(null); setForm({ ...emptyForm }); }}>Cancel</Button>
                <Button size="sm" disabled={!form.name || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
                  {saveMutation.isPending ? "Saving..." : editId ? "Update" : "Create"} Collection
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Total Collections</p><p className="text-lg font-bold">{collections.length}</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Active</p><p className="text-lg font-bold text-primary">{(collections as any[]).filter(c => c.is_active).length}</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Total Products</p><p className="text-lg font-bold">{(products as any[]).length}</p></CardContent></Card>
        </div>

        {/* List */}
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center gap-2 p-3 border-b">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search collections..." value={search} onChange={e => setSearch(e.target.value)} className="h-8 pl-8 text-xs" />
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-8">Name</TableHead>
                  <TableHead className="text-xs h-8">Rules</TableHead>
                  <TableHead className="text-xs h-8">Match</TableHead>
                  <TableHead className="text-xs h-8 text-right">Products</TableHead>
                  <TableHead className="text-xs h-8">Status</TableHead>
                  <TableHead className="text-xs h-8 w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">No smart collections yet. Create one to auto-group products.</TableCell></TableRow>
                ) : (
                  filtered.map((c: any) => {
                    const matchCount = getMatchingProducts(products as any[], c.rules || [], c.match_type).length;
                    return (
                      <TableRow key={c.id} className="text-xs">
                        <TableCell className="py-2">
                          <div>
                            <p className="font-medium">{c.name}</p>
                            <p className="text-muted-foreground text-2xs font-mono">/{c.slug}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex flex-wrap gap-1">
                            {(c.rules || []).slice(0, 3).map((r: Rule, i: number) => (
                              <Badge key={i} variant="outline" className="text-2xs">{r.field} {r.operator} {r.value}</Badge>
                            ))}
                            {(c.rules || []).length > 3 && <Badge variant="outline" className="text-2xs">+{c.rules.length - 3}</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="py-2"><Badge variant="secondary" className="text-2xs">{c.match_type.toUpperCase()}</Badge></TableCell>
                        <TableCell className="py-2 text-right font-medium">{matchCount}</TableCell>
                        <TableCell className="py-2">
                          <Badge variant={c.is_active ? "default" : "outline"} className="text-2xs">{c.is_active ? "Active" : "Inactive"}</Badge>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(c)}><Pencil className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                              setPreviewCollection(c);
                              setPreviewOpen(true);
                            }}><Eye className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteMutation.mutate(c.id)}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-sm flex items-center gap-2"><FolderOpen className="h-4 w-4" /> {previewCollection?.name}</DialogTitle>
            </DialogHeader>
            {previewCollection && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {(previewCollection.rules || []).map((r: Rule, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">{r.field} {r.operator} "{r.value}"</Badge>
                  ))}
                  <Badge variant="secondary" className="text-xs">Match: {previewCollection.match_type}</Badge>
                </div>
                <div className="space-y-1">
                  {getMatchingProducts(products as any[], previewCollection.rules || [], previewCollection.match_type).map((p: any) => (
                    <div key={p.id} className="flex items-center gap-2 p-2 rounded bg-muted/50 text-xs">
                      <span className="font-medium flex-1 truncate">{p.title}</span>
                      <span className="text-muted-foreground font-mono">{p.sku || "—"}</span>
                      <span className="font-medium">${Number(p.price).toFixed(2)}</span>
                    </div>
                  ))}
                  {getMatchingProducts(products as any[], previewCollection.rules || [], previewCollection.match_type).length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No products match.</p>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
