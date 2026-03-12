import { useState, useEffect } from "react";
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
import { useProduct, useCreateProduct, useUpdateProduct, useCategories, useDeleteVariant } from "@/hooks/use-data";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductImageUpload } from "@/components/products/ProductImageUpload";

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id && id !== "new";
  const { data: existing, isLoading } = useProduct(isEdit ? id : undefined);
  const { data: categories = [] } = useCategories();
  const { currentStore } = useAuth();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteVariant = useDeleteVariant();
  const [productImages, setProductImages] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: "", description: "", sku: "", barcode: "",
    price: "", compare_at_price: "", cost_price: "",
    status: "draft" as "draft" | "active" | "archived",
    category_id: "" as string,
    tags: "", seo_title: "", seo_description: "", slug: "",
    track_inventory: true,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title || "",
        description: existing.description || "",
        sku: existing.sku || "",
        barcode: existing.barcode || "",
        price: existing.price?.toString() || "",
        compare_at_price: existing.compare_at_price?.toString() || "",
        cost_price: existing.cost_price?.toString() || "",
        status: (existing.status as "draft" | "active" | "archived") || "draft",
        category_id: existing.category_id || "",
        tags: existing.tags?.join(", ") || "",
        seo_title: existing.seo_title || "",
        seo_description: existing.seo_description || "",
        slug: existing.slug || "",
        track_inventory: existing.track_inventory ?? true,
      });
      setProductImages(existing.images || []);
    }
  }, [existing]);

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "title" && !isEdit) {
      setForm((prev) => ({ ...prev, slug: value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") }));
    }
  };

  const handleSave = () => {
    const payload = {
      title: form.title,
      description: form.description || undefined,
      sku: form.sku || undefined,
      barcode: form.barcode || undefined,
      price: parseFloat(form.price) || 0,
      compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
      cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
      status: form.status,
      category_id: form.category_id || null,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      seo_title: form.seo_title || undefined,
      seo_description: form.seo_description || undefined,
      slug: form.slug || undefined,
      track_inventory: form.track_inventory,
      images: productImages,
    };

    if (isEdit) {
      updateProduct.mutate({ id: id!, ...payload }, { onSuccess: () => navigate("/products") });
    } else {
      createProduct.mutate(payload, { onSuccess: () => navigate("/products") });
    }
  };

  if (isEdit && isLoading) {
    return <AdminLayout><div className="space-y-3"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div></AdminLayout>;
  }

  const variants = existing?.product_variants || [];

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
            <Button size="sm" className="h-8 text-xs gap-1" onClick={handleSave} disabled={createProduct.isPending || updateProduct.isPending}>
              <Save className="h-3.5 w-3.5" /> {createProduct.isPending || updateProduct.isPending ? "Saving..." : "Save Product"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-3">
          <TabsList className="h-8">
            <TabsTrigger value="general" className="text-xs h-7">General</TabsTrigger>
            <TabsTrigger value="pricing" className="text-xs h-7">Pricing</TabsTrigger>
            <TabsTrigger value="media" className="text-xs h-7">Media</TabsTrigger>
            <TabsTrigger value="variants" className="text-xs h-7">Variants ({variants.length})</TabsTrigger>
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
                        <Input className="h-8 text-xs" type="number" step="0.01" value={form.compare_at_price} onChange={(e) => update("compare_at_price", e.target.value)} placeholder="0.00" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Cost Price</Label>
                        <Input className="h-8 text-xs" type="number" step="0.01" value={form.cost_price} onChange={(e) => update("cost_price", e.target.value)} placeholder="0.00" />
                      </div>
                    </div>
                    {form.price && form.cost_price && (
                      <p className="text-2xs text-muted-foreground">
                        Margin: {((1 - parseFloat(form.cost_price) / parseFloat(form.price)) * 100).toFixed(1)}% · Profit: ${(parseFloat(form.price) - parseFloat(form.cost_price)).toFixed(2)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="media" className="mt-0 space-y-3">
                <Card>
                  <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Media</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-2">
                    <ProductImageUpload
                      storeId={currentStore?.id || ""}
                      productId={isEdit ? id : undefined}
                      images={productImages}
                      onImagesChange={setProductImages}
                    />
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
                          {variants.map((v: any) => (
                            <TableRow key={v.id} className="text-xs">
                              <TableCell className="py-2">{v.name}</TableCell>
                              <TableCell className="py-2 font-mono text-muted-foreground">{v.sku || "—"}</TableCell>
                              <TableCell className="py-2 text-right">${Number(v.price).toFixed(2)}</TableCell>
                              <TableCell className="py-2 text-right">{v.stock}</TableCell>
                              <TableCell className="py-2">
                                <Button variant="ghost" size="icon" className="h-6 w-6"
                                  onClick={() => deleteVariant.mutate({ id: v.id, productId: id! })}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
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

              <TabsContent value="seo" className="mt-0 space-y-3">
                <Card>
                  <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">SEO</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-2 space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Page Title</Label>
                      <Input className="h-8 text-xs" value={form.seo_title} onChange={(e) => update("seo_title", e.target.value)} placeholder="SEO page title" />
                      <p className="text-2xs text-muted-foreground">{form.seo_title.length}/60 characters</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Meta Description</Label>
                      <Textarea className="text-xs min-h-[60px]" value={form.seo_description} onChange={(e) => update("seo_description", e.target.value)} placeholder="SEO description" />
                      <p className="text-2xs text-muted-foreground">{form.seo_description.length}/160 characters</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">URL Slug</Label>
                      <Input className="h-8 text-xs font-mono" value={form.slug} onChange={(e) => update("slug", e.target.value)} />
                    </div>
                    <div className="rounded-md bg-muted p-3 space-y-0.5">
                      <p className="text-xs text-primary">{form.seo_title || form.title || "Page Title"}</p>
                      <p className="text-2xs text-success">store.com/products/{form.slug || "product-slug"}</p>
                      <p className="text-2xs text-muted-foreground">{form.seo_description || "Meta description preview..."}</p>
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
                  <Select value={form.status} onValueChange={(v: string) => setForm((prev) => ({ ...prev, status: v as "draft" | "active" | "archived" }))}>
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
                    <Select value={form.category_id} onValueChange={(v) => setForm((prev) => ({ ...prev, category_id: v }))}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>
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

              <Card>
                <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Inventory</CardTitle></CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Track inventory</Label>
                    <Switch checked={form.track_inventory} onCheckedChange={(v) => setForm((prev) => ({ ...prev, track_inventory: v }))} />
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
