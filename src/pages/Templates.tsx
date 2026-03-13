import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Plus, Code2, Eye, Save, Trash2, Copy, BookOpen,
  Tag, Braces, HelpCircle, FileCode2,
} from "lucide-react";
import { toast } from "sonner";
import {
  renderTemplate, extractTags,
  SUPPORTED_TAGS, SUPPORTED_FORMATS, SUPPORTED_BLOCKS, SUPPORTED_CONDITIONALS,
  EXAMPLE_TEMPLATES, type TemplateContext,
} from "@/lib/base-template-engine";
import { useStoreTemplates, useCreateStoreTemplate, useUpdateStoreTemplate, useDeleteStoreTemplate } from "@/hooks/use-data";
import { useProducts } from "@/hooks/use-data";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Mock context for preview when no product is selected
const MOCK_CONTEXT: TemplateContext = {
  product: {
    title: "Premium Wireless Headphones",
    sku: "WH-PRO-100",
    price: 149.99,
    compare_at_price: 199.99,
    cost_price: 65.00,
    description: "Experience crystal-clear audio with our flagship wireless headphones. Featuring active noise cancellation and 30-hour battery life.",
    short_description: "Premium wireless headphones with ANC and 30hr battery.",
    brand: "AudioTech",
    barcode: "9781234567890",
    model_number: "WH-PRO-100X",
    status: "active",
    slug: "premium-wireless-headphones",
    subtitle: "Studio-Grade Audio",
    features: "Active Noise Cancellation\n30-hour battery\nBluetooth 5.3",
    warranty: "2 Year Manufacturer Warranty",
    promo_price: 129.99,
    promo_tag: "Summer Sale",
    promo_start: new Date(Date.now() - 86400000).toISOString(),
    promo_end: new Date(Date.now() + 86400000 * 7).toISOString(),
    images: ["/placeholder.svg", "/placeholder.svg"],
    tags: ["wireless", "headphones", "premium"],
    is_active: true,
    tax_free: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    misc1: "Custom Field 1",
  },
  variants: [
    { id: "v1", name: "Black", sku: "WH-PRO-100-BLK", price: 149.99, stock: 25, option1: "Black" },
    { id: "v2", name: "White", sku: "WH-PRO-100-WHT", price: 149.99, stock: 12, option1: "White" },
  ],
  specifics: [
    { name: "Driver Size", value: "40mm" },
    { name: "Frequency Response", value: "20Hz - 20kHz" },
    { name: "Impedance", value: "32 Ohm" },
  ],
  pricing_tiers: [
    { tier_name: "Wholesale", min_quantity: 10, price: 129.99 },
    { tier_name: "Bulk", min_quantity: 50, price: 109.99 },
  ],
  cross_sells: [
    { title: "Headphone Case", price: 29.99, sku: "HC-100" },
    { title: "Replacement Ear Pads", price: 19.99, sku: "EP-100" },
  ],
  shipping: {
    shipping_weight: 0.35,
    shipping_length: 22,
    shipping_width: 18,
    shipping_height: 8,
  },
  store: { name: "Demo Store", currency: "USD", contact_email: "hello@demo.com" },
};

export default function Templates() {
  const { data: templates = [], isLoading } = useStoreTemplates();
  const { data: products = [] } = useProducts();
  const createTemplate = useCreateStoreTemplate();
  const updateTemplate = useUpdateStoreTemplate();
  const deleteTemplate = useDeleteStoreTemplate();

  const [editing, setEditing] = useState<any>(null);
  const [editorTab, setEditorTab] = useState("edit");
  const [showDocs, setShowDocs] = useState(false);
  const [previewProduct, setPreviewProduct] = useState<string>("mock");

  // Editor form state
  const [form, setForm] = useState({
    name: "",
    slug: "",
    template_type: "content_block",
    context_type: "product",
    content: "",
    is_active: true,
  });

  const openEditor = (template?: any) => {
    if (template) {
      setForm({
        name: template.name,
        slug: template.slug || "",
        template_type: template.template_type || "content_block",
        context_type: template.context_type || "product",
        content: template.content || "",
        is_active: template.is_active !== false,
      });
      setEditing(template);
    } else {
      setForm({ name: "", slug: "", template_type: "content_block", context_type: "product", content: "", is_active: true });
      setEditing("new");
    }
    setEditorTab("edit");
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Template name is required"); return; }
    if (editing && editing !== "new") {
      await updateTemplate.mutateAsync({ id: editing.id, ...form });
    } else {
      await createTemplate.mutateAsync(form);
    }
    setEditing(null);
  };

  const loadExample = (key: keyof typeof EXAMPLE_TEMPLATES) => {
    setForm((prev) => ({ ...prev, content: EXAMPLE_TEMPLATES[key], name: prev.name || key.replace(/_/g, " ") }));
  };

  // Build preview context
  const getPreviewContext = (): TemplateContext => {
    if (previewProduct === "mock") return MOCK_CONTEXT;
    const product = (products as any[]).find((p: any) => p.id === previewProduct);
    if (!product) return MOCK_CONTEXT;
    return {
      product,
      variants: product.product_variants || [],
      specifics: [],
      pricing_tiers: [],
      cross_sells: [],
      store: MOCK_CONTEXT.store,
    };
  };

  const previewHtml = form.content ? renderTemplate(form.content, getPreviewContext()) : "";
  const tags = form.content ? extractTags(form.content) : { valueTags: [], blocks: [], conditionals: [] };

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">B@SE Templates</h1>
            <p className="text-xs text-muted-foreground">Dynamic content blocks using Maropost-compatible data tags</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => setShowDocs(true)}>
              <BookOpen className="h-3.5 w-3.5" /> Tag Reference
            </Button>
            <Button size="sm" className="text-xs gap-1" onClick={() => openEditor()}>
              <Plus className="h-3.5 w-3.5" /> New Template
            </Button>
          </div>
        </div>

        {/* Template List */}
        {!editing && (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs h-8">Name</TableHead>
                    <TableHead className="text-xs h-8">Type</TableHead>
                    <TableHead className="text-xs h-8">Context</TableHead>
                    <TableHead className="text-xs h-8">Tags Used</TableHead>
                    <TableHead className="text-xs h-8">Status</TableHead>
                    <TableHead className="text-xs h-8 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
                    ))
                  ) : (templates as any[]).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">
                        No templates yet. Create one to start using B@SE data tags.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (templates as any[]).map((t: any) => {
                      const tTags = extractTags(t.content || "");
                      return (
                        <TableRow key={t.id} className="text-xs">
                          <TableCell className="py-2 font-medium">{t.name}</TableCell>
                          <TableCell className="py-2"><Badge variant="outline" className="text-[10px]">{t.template_type}</Badge></TableCell>
                          <TableCell className="py-2 capitalize">{t.context_type}</TableCell>
                          <TableCell className="py-2">{tTags.valueTags.length + tTags.blocks.length}</TableCell>
                          <TableCell className="py-2">
                            <Badge variant={t.is_active ? "default" : "secondary"} className="text-[10px]">
                              {t.is_active ? "Active" : "Draft"}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2 text-right">
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openEditor(t)}>
                                <Code2 className="h-3.5 w-3.5" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete template?</AlertDialogTitle>
                                    <AlertDialogDescription>This will permanently delete "{t.name}".</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => deleteTemplate.mutate(t.id)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
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
        )}

        {/* Editor */}
        {editing && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setEditing(null)}>
                ← Back to list
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => { navigator.clipboard.writeText(form.content); toast.success("Copied!"); }}>
                  <Copy className="h-3.5 w-3.5" /> Copy
                </Button>
                <Button size="sm" className="text-xs gap-1" onClick={handleSave} disabled={createTemplate.isPending || updateTemplate.isPending}>
                  <Save className="h-3.5 w-3.5" /> {editing === "new" ? "Create" : "Save"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
              {/* Settings sidebar */}
              <Card className="lg:col-span-1">
                <CardHeader className="py-3 px-4"><CardTitle className="text-sm">Settings</CardTitle></CardHeader>
                <CardContent className="px-4 pb-4 pt-0 space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Name</Label>
                    <Input className="h-8 text-xs" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Product Card" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Slug</Label>
                    <Input className="h-8 text-xs" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} placeholder="product-card" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Type</Label>
                    <Select value={form.template_type} onValueChange={(v) => setForm((p) => ({ ...p, template_type: v }))}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="content_block" className="text-xs">Content Block</SelectItem>
                        <SelectItem value="email" className="text-xs">Email</SelectItem>
                        <SelectItem value="page" className="text-xs">Page</SelectItem>
                        <SelectItem value="snippet" className="text-xs">Snippet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Context</Label>
                    <Select value={form.context_type} onValueChange={(v) => setForm((p) => ({ ...p, context_type: v }))}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="product" className="text-xs">Product</SelectItem>
                        <SelectItem value="order" className="text-xs">Order</SelectItem>
                        <SelectItem value="customer" className="text-xs">Customer</SelectItem>
                        <SelectItem value="store" className="text-xs">Store</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Active</Label>
                    <Switch checked={form.is_active} onCheckedChange={(v) => setForm((p) => ({ ...p, is_active: v }))} />
                  </div>

                  <Separator />

                  {/* Quick examples */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Quick Start Templates</Label>
                    <div className="space-y-1">
                      {Object.keys(EXAMPLE_TEMPLATES).map((key) => (
                        <Button key={key} variant="outline" size="sm" className="w-full text-xs justify-start gap-1 h-7" onClick={() => loadExample(key as any)}>
                          <FileCode2 className="h-3 w-3" /> {key.replace(/_/g, " ")}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Tags used */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium flex items-center gap-1"><Tag className="h-3 w-3" /> Tags Used</Label>
                    <div className="flex flex-wrap gap-1">
                      {tags.valueTags.map((t) => (
                        <Badge key={t} variant="secondary" className="text-[10px] font-mono">[@{t}@]</Badge>
                      ))}
                      {tags.blocks.map((b) => (
                        <Badge key={b} variant="outline" className="text-[10px] font-mono text-primary">[%{b}%]</Badge>
                      ))}
                      {tags.conditionals.map((c) => (
                        <Badge key={c} variant="outline" className="text-[10px] font-mono text-accent-foreground">[?{c}?]</Badge>
                      ))}
                      {tags.valueTags.length === 0 && tags.blocks.length === 0 && tags.conditionals.length === 0 && (
                        <span className="text-[10px] text-muted-foreground">No tags detected</span>
                      )}
                    </div>
                  </div>

                  {/* Preview product selector */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Preview Data</Label>
                    <Select value={previewProduct} onValueChange={setPreviewProduct}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mock" className="text-xs">Mock Product</SelectItem>
                        {(products as any[]).slice(0, 20).map((p: any) => (
                          <SelectItem key={p.id} value={p.id} className="text-xs">{p.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Editor + Preview */}
              <Card className="lg:col-span-3">
                <CardContent className="p-0">
                  <Tabs value={editorTab} onValueChange={setEditorTab}>
                    <div className="flex items-center justify-between border-b px-4 py-2">
                      <TabsList className="h-8">
                        <TabsTrigger value="edit" className="text-xs gap-1 h-7 px-3"><Code2 className="h-3 w-3" /> Editor</TabsTrigger>
                        <TabsTrigger value="preview" className="text-xs gap-1 h-7 px-3"><Eye className="h-3 w-3" /> Preview</TabsTrigger>
                        <TabsTrigger value="output" className="text-xs gap-1 h-7 px-3"><Braces className="h-3 w-3" /> HTML Output</TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="edit" className="m-0 p-0">
                      <Textarea
                        className="min-h-[500px] border-0 rounded-none font-mono text-xs leading-relaxed resize-none focus-visible:ring-0"
                        placeholder={`Enter your B@SE template here...\n\nExample:\n<h1>[@title@]</h1>\n<p>[@price|currency@]</p>\n\n[?has_variants?]\n  <p>Available in [@variant_count@] variants</p>\n[?/has_variants?]`}
                        value={form.content}
                        onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                      />
                    </TabsContent>

                    <TabsContent value="preview" className="m-0 p-4">
                      {previewHtml ? (
                        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-12">Enter template content to see a preview.</p>
                      )}
                    </TabsContent>

                    <TabsContent value="output" className="m-0 p-0">
                      <pre className="p-4 text-xs font-mono whitespace-pre-wrap text-muted-foreground bg-muted/30 min-h-[500px]">
                        {previewHtml || "No output yet."}
                      </pre>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Tag Reference Dialog */}
        <Dialog open={showDocs} onOpenChange={setShowDocs}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="text-base flex items-center gap-2"><HelpCircle className="h-4 w-4" /> B@SE Tag Reference</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2 text-xs">
              <div>
                <h3 className="font-semibold text-sm mb-2">Value Tags</h3>
                <p className="text-muted-foreground mb-2">Syntax: <code className="bg-muted px-1 rounded">[@field@]</code> or <code className="bg-muted px-1 rounded">[@field|format@]</code></p>
                <div className="flex flex-wrap gap-1">
                  {SUPPORTED_TAGS.map((tag) => (
                    <Badge key={tag} variant="secondary" className="font-mono text-[10px]">{tag}</Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold text-sm mb-2">Format Pipes</h3>
                <p className="text-muted-foreground mb-2">Syntax: <code className="bg-muted px-1 rounded">[@price|currency@]</code></p>
                <div className="flex flex-wrap gap-1">
                  {SUPPORTED_FORMATS.map((fmt) => (
                    <Badge key={fmt} variant="outline" className="font-mono text-[10px]">{fmt}</Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold text-sm mb-2">Block Tags (Iterators)</h3>
                <p className="text-muted-foreground mb-2">Syntax: <code className="bg-muted px-1 rounded">[%block%]...content...[%/block%]</code></p>
                <div className="flex flex-wrap gap-1">
                  {SUPPORTED_BLOCKS.map((blk) => (
                    <Badge key={blk} variant="outline" className="font-mono text-[10px] text-primary">{blk}</Badge>
                  ))}
                </div>
                <p className="text-muted-foreground mt-2">Inside blocks, use <code className="bg-muted px-1 rounded">[@index@]</code>, <code className="bg-muted px-1 rounded">[@count@]</code>, <code className="bg-muted px-1 rounded">[@first@]</code>, <code className="bg-muted px-1 rounded">[@last@]</code></p>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold text-sm mb-2">Conditional Tags</h3>
                <p className="text-muted-foreground mb-2">Syntax: <code className="bg-muted px-1 rounded">[?condition?]...show if true...[?/condition?]</code></p>
                <div className="flex flex-wrap gap-1">
                  {SUPPORTED_CONDITIONALS.map((cond) => (
                    <Badge key={cond} variant="outline" className="font-mono text-[10px] text-amber-600">{cond}</Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold text-sm mb-2">Comments</h3>
                <p className="text-muted-foreground">Syntax: <code className="bg-muted px-1 rounded">[#This is a comment and will be stripped#]</code></p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
