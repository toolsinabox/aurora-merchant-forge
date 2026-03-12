import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { mockProducts, mockCategories, type Product } from "@/lib/mock-data";
import { ArrowLeft, Save, Plus, Trash2, ImagePlus } from "lucide-react";
import { toast } from "sonner";

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = id && id !== "new";
  const existing = isEdit ? mockProducts.find((p) => p.id === id) : null;

  const [form, setForm] = useState({
    title: existing?.title || "",
    description: existing?.description || "",
    sku: existing?.sku || "",
    barcode: existing?.barcode || "",
    price: existing?.price?.toString() || "",
    compareAtPrice: existing?.compareAtPrice?.toString() || "",
    costPrice: existing?.costPrice?.toString() || "",
    status: existing?.status || "draft",
    category: existing?.category || "",
    tags: existing?.tags?.join(", ") || "",
    seoTitle: existing?.seoTitle || "",
    seoDescription: existing?.seoDescription || "",
    slug: existing?.slug || "",
    trackInventory: true,
    stock: existing?.stock?.toString() || "0",
  });

  const [variants, setVariants] = useState(existing?.variants || []);

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "title" && !isEdit) {
      setForm((prev) => ({ ...prev, slug: value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") }));
    }
  };

  const handleSave = () => {
    toast.success(isEdit ? "Product updated" : "Product created");
    navigate("/products");
  };

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/products")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{isEdit ? "Edit Product" : "New Product"}</h1>
              {isEdit && <p className="text-xs text-muted-foreground">ID: {id}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => navigate("/products")}>Cancel</Button>
            <Button size="sm" className="h-8 text-xs gap-1" onClick={handleSave}>
              <Save className="h-3.5 w-3.5" /> Save Product
            </Button>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-3">
          <TabsList className="h-8">
            <TabsTrigger value="general" className="text-xs h-7">General</TabsTrigger>
            <TabsTrigger value="pricing" className="text-xs h-7">Pricing</TabsTrigger>
            <TabsTrigger value="media" className="text-xs h-7">Media</TabsTrigger>
            <TabsTrigger value="variants" className="text-xs h-7">Variants</TabsTrigger>
            <TabsTrigger value="inventory" className="text-xs h-7">Inventory</TabsTrigger>
            <TabsTrigger value="seo" className="text-xs h-7">SEO</TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2 space-y-3">
              <TabsContent value="general" className="mt-0 space-y-3">
                <Card>
                  <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Basic Information</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-2 space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Title</Label>
                      <Input className="h-8 text-xs" value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Product title" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Description</Label>
                      <Textarea className="text-xs min-h-[100px]" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Product description" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">SKU</Label>
                        <Input className="h-8 text-xs font-mono" value={form.sku} onChange={(e) => update("sku", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Barcode</Label>
                        <Input className="h-8 text-xs font-mono" value={form.barcode} onChange={(e) => update("barcode", e.target.value)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pricing" className="mt-0 space-y-3">
                <Card>
                  <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Pricing</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-2 space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Price</Label>
                        <Input className="h-8 text-xs" type="number" step="0.01" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="0.00" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Compare at Price</Label>
                        <Input className="h-8 text-xs" type="number" step="0.01" value={form.compareAtPrice} onChange={(e) => update("compareAtPrice", e.target.value)} placeholder="0.00" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Cost Price</Label>
                        <Input className="h-8 text-xs" type="number" step="0.01" value={form.costPrice} onChange={(e) => update("costPrice", e.target.value)} placeholder="0.00" />
                      </div>
                    </div>
                    {form.price && form.costPrice && (
                      <p className="text-2xs text-muted-foreground">
                        Margin: {((1 - parseFloat(form.costPrice) / parseFloat(form.price)) * 100).toFixed(1)}% · Profit: ${(parseFloat(form.price) - parseFloat(form.costPrice)).toFixed(2)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="media" className="mt-0 space-y-3">
                <Card>
                  <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Media</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <ImagePlus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground">Drag and drop images here, or click to browse</p>
                      <Button variant="outline" size="sm" className="h-7 text-xs mt-3">Upload Images</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="variants" className="mt-0 space-y-3">
                <Card>
                  <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm">Variants</CardTitle>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                      <Plus className="h-3 w-3" /> Add Variant
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    {variants.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs h-8">Name</TableHead>
                            <TableHead className="text-xs h-8">SKU</TableHead>
                            <TableHead className="text-xs h-8 text-right">Price</TableHead>
                            <TableHead className="text-xs h-8 text-right">Stock</TableHead>
                            <TableHead className="text-xs h-8 w-10"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {variants.map((v) => (
                            <TableRow key={v.id} className="text-xs">
                              <TableCell className="py-2">{v.name}</TableCell>
                              <TableCell className="py-2 font-mono text-muted-foreground">{v.sku}</TableCell>
                              <TableCell className="py-2 text-right">${v.price.toFixed(2)}</TableCell>
                              <TableCell className="py-2 text-right">{v.stock}</TableCell>
                              <TableCell className="py-2">
                                <Button variant="ghost" size="icon" className="h-6 w-6"><Trash2 className="h-3 w-3" /></Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="p-6 text-center text-xs text-muted-foreground">
                        No variants. Add variants for different sizes, colors, etc.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="inventory" className="mt-0 space-y-3">
                <Card>
                  <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Inventory</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Track inventory</Label>
                      <Switch checked={form.trackInventory} onCheckedChange={(v) => setForm((prev) => ({ ...prev, trackInventory: v }))} />
                    </div>
                    {form.trackInventory && (
                      <div className="space-y-1">
                        <Label className="text-xs">Stock quantity</Label>
                        <Input className="h-8 text-xs w-32" type="number" value={form.stock} onChange={(e) => update("stock", e.target.value)} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="seo" className="mt-0 space-y-3">
                <Card>
                  <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">SEO</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-2 space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Page Title</Label>
                      <Input className="h-8 text-xs" value={form.seoTitle} onChange={(e) => update("seoTitle", e.target.value)} placeholder="SEO page title" />
                      <p className="text-2xs text-muted-foreground">{form.seoTitle.length}/60 characters</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Meta Description</Label>
                      <Textarea className="text-xs min-h-[60px]" value={form.seoDescription} onChange={(e) => update("seoDescription", e.target.value)} placeholder="SEO description" />
                      <p className="text-2xs text-muted-foreground">{form.seoDescription.length}/160 characters</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">URL Slug</Label>
                      <Input className="h-8 text-xs font-mono" value={form.slug} onChange={(e) => update("slug", e.target.value)} />
                    </div>
                    {/* Preview */}
                    <div className="rounded-md bg-muted p-3 space-y-0.5">
                      <p className="text-xs text-primary">{form.seoTitle || form.title || "Page Title"}</p>
                      <p className="text-2xs text-success">store.com/products/{form.slug || "product-slug"}</p>
                      <p className="text-2xs text-muted-foreground">{form.seoDescription || "Meta description preview..."}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>

            {/* Right sidebar */}
            <div className="space-y-3">
              <Card>
                <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Status</CardTitle></CardHeader>
                <CardContent className="p-4 pt-2">
                  <Select value={form.status} onValueChange={(v) => setForm((prev) => ({ ...prev, status: v }))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft" className="text-xs">Draft</SelectItem>
                      <SelectItem value="active" className="text-xs">Active</SelectItem>
                      <SelectItem value="archived" className="text-xs">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Organization</CardTitle></CardHeader>
                <CardContent className="p-4 pt-2 space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm((prev) => ({ ...prev, category: v }))}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {mockCategories.map((c) => (
                          <SelectItem key={c.id} value={c.name} className="text-xs">{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tags</Label>
                    <Input className="h-8 text-xs" value={form.tags} onChange={(e) => update("tags", e.target.value)} placeholder="Comma separated tags" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
