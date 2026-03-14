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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useProduct, useCreateProduct, useUpdateProduct, useCategories, useDeleteVariant, useCreateVariant, useProductShipping, useUpsertProductShipping, useProductSpecifics, useCreateProductSpecific, useDeleteProductSpecific, useProductPricingTiers, useCreatePricingTier, useDeletePricingTier, useProductRelations, useCreateProductRelation, useDeleteProductRelation, useProducts } from "@/hooks/use-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ArrowLeft, Save, Plus, Trash2, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductImageUpload } from "@/components/products/ProductImageUpload";
import { FieldLabel } from "@/components/products/BaseTag";
import { ProductAddonsTab } from "@/components/products/ProductAddonsTab";
import { KitComponentsTab } from "@/components/products/KitComponentsTab";

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id && id !== "new";
  const { data: existing, isLoading } = useProduct(isEdit ? id : undefined);
  const { data: categories = [] } = useCategories();
  const { data: allProducts = [] } = useProducts();
  const { currentStore } = useAuth();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteVariant = useDeleteVariant();
  const createVariant = useCreateVariant();
  const [productImages, setProductImages] = useState<string[]>([]);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [newVariant, setNewVariant] = useState({ name: "", sku: "", price: "0", stock: "0" });

  // Shipping
  const { data: shippingData } = useProductShipping(isEdit ? id : undefined);
  const upsertShipping = useUpsertProductShipping();

  // Specifics
  const { data: specifics = [] } = useProductSpecifics(isEdit ? id : undefined);
  const createSpecific = useCreateProductSpecific();
  const deleteSpecific = useDeleteProductSpecific();
  const [newSpecName, setNewSpecName] = useState("");
  const [newSpecValue, setNewSpecValue] = useState("");

  // Pricing tiers
  const { data: pricingTiers = [] } = useProductPricingTiers(isEdit ? id : undefined);
  const createTier = useCreatePricingTier();
  const deleteTier = useDeletePricingTier();
  const [newTier, setNewTier] = useState({ tier_name: "", min_quantity: "1", price: "", user_group: "" });

  // Relations
  const { data: relations = [] } = useProductRelations(isEdit ? id : undefined);
  const createRelation = useCreateProductRelation();
  const deleteRelation = useDeleteProductRelation();

  const [form, setForm] = useState({
    title: "", subtitle: "", description: "", short_description: "",
    features: "", specifications: "", terms_conditions: "", internal_notes: "",
    sku: "", barcode: "", brand: "", model_number: "", custom_label: "",
    product_type: "regular", product_subtype: "", supplier_item_code: "",
    price: "", compare_at_price: "", cost_price: "",
    promo_price: "", promo_start: "", promo_end: "", promo_tag: "",
    status: "draft" as string,
    category_id: "" as string,
    tags: "", search_keywords: "",
    seo_title: "", seo_description: "", seo_keywords: "", slug: "",
    track_inventory: true,
    is_active: true, is_approved: true,
    is_bought: false, is_sold: true, is_inventoried: true,
    tax_free: false, tax_inclusive: false,
    is_kit: false, editable_bundle: false, virtual_product: false,
    dangerous_goods: false, oversized_item: false, temperature_sensitive: false,
    auto_url_update: true,
    warranty: "", availability_description: "",
    reorder_quantity: "0", restock_quantity: "0", preorder_quantity: "0",
    misc1: "", misc2: "", misc3: "", misc4: "", misc5: "",
    scheduled_publish_at: "", scheduled_unpublish_at: "",
    video_url: "",
  });

  const [shipping, setShipping] = useState({
    shipping_weight: "0", shipping_cubic: "0",
    shipping_length: "0", shipping_width: "0", shipping_height: "0",
    actual_length: "0", actual_width: "0", actual_height: "0",
    requires_packaging: false, shipping_category: "",
    flat_rate_charge: "", selling_unit: "", base_unit: "", base_unit_qty: "1", cartons: "0",
  });

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title || "", subtitle: (existing as any).subtitle || "",
        description: existing.description || "", short_description: (existing as any).short_description || "",
        features: (existing as any).features || "", specifications: (existing as any).specifications || "",
        terms_conditions: (existing as any).terms_conditions || "", internal_notes: (existing as any).internal_notes || "",
        sku: existing.sku || "", barcode: existing.barcode || "",
        brand: (existing as any).brand || "", model_number: (existing as any).model_number || "",
        custom_label: (existing as any).custom_label || "",
        product_type: (existing as any).product_type || "regular",
        product_subtype: (existing as any).product_subtype || "",
        supplier_item_code: (existing as any).supplier_item_code || "",
        price: existing.price?.toString() || "",
        compare_at_price: existing.compare_at_price?.toString() || "",
        cost_price: existing.cost_price?.toString() || "",
        promo_price: (existing as any).promo_price?.toString() || "",
        promo_start: (existing as any).promo_start ? new Date(existing.promo_start).toISOString().slice(0, 16) : "",
        promo_end: (existing as any).promo_end ? new Date(existing.promo_end).toISOString().slice(0, 16) : "",
        promo_tag: (existing as any).promo_tag || "",
        status: existing.status || "draft",
        category_id: existing.category_id || "",
        tags: existing.tags?.join(", ") || "",
        search_keywords: (existing as any).search_keywords || "",
        seo_title: existing.seo_title || "", seo_description: existing.seo_description || "",
        seo_keywords: (existing as any).seo_keywords || "", slug: existing.slug || "",
        track_inventory: existing.track_inventory ?? true,
        is_active: (existing as any).is_active ?? true, is_approved: (existing as any).is_approved ?? true,
        is_bought: (existing as any).is_bought ?? false, is_sold: (existing as any).is_sold ?? true,
        is_inventoried: (existing as any).is_inventoried ?? true,
        tax_free: (existing as any).tax_free ?? false, tax_inclusive: (existing as any).tax_inclusive ?? false,
        is_kit: (existing as any).is_kit ?? false, editable_bundle: (existing as any).editable_bundle ?? false,
        virtual_product: (existing as any).virtual_product ?? false,
        dangerous_goods: (existing as any).dangerous_goods ?? false,
        oversized_item: (existing as any).oversized_item ?? false,
        temperature_sensitive: (existing as any).temperature_sensitive ?? false,
        auto_url_update: (existing as any).auto_url_update ?? true,
        warranty: (existing as any).warranty || "", availability_description: (existing as any).availability_description || "",
        reorder_quantity: (existing as any).reorder_quantity?.toString() || "0",
        restock_quantity: (existing as any).restock_quantity?.toString() || "0",
        preorder_quantity: (existing as any).preorder_quantity?.toString() || "0",
        misc1: (existing as any).misc1 || "", misc2: (existing as any).misc2 || "",
        misc3: (existing as any).misc3 || "", misc4: (existing as any).misc4 || "",
        misc5: (existing as any).misc5 || "",
        scheduled_publish_at: (existing as any).scheduled_publish_at ? new Date((existing as any).scheduled_publish_at).toISOString().slice(0, 16) : "",
        scheduled_unpublish_at: (existing as any).scheduled_unpublish_at ? new Date((existing as any).scheduled_unpublish_at).toISOString().slice(0, 16) : "",
        video_url: (existing as any).video_url || "",
      });
      setProductImages(existing.images || []);
    }
  }, [existing]);

  // Autosave draft to localStorage for new products
  const draftKey = `product-draft-${currentStore?.id || "default"}`;
  useEffect(() => {
    if (!isEdit && !existing) {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.title || parsed.sku || parsed.description) {
            setForm((prev) => ({ ...prev, ...parsed }));
            toast.info("Draft restored from autosave");
          }
        } catch {}
      }
    }
  }, [isEdit, existing, draftKey]);

  useEffect(() => {
    if (!isEdit && (form.title || form.sku || form.description)) {
      const timer = setTimeout(() => {
        localStorage.setItem(draftKey, JSON.stringify(form));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [form, isEdit, draftKey]);

  useEffect(() => {
    if (shippingData) {
      const sd = shippingData as any;
      setShipping({
        shipping_weight: sd.shipping_weight?.toString() || "0",
        shipping_cubic: sd.shipping_cubic?.toString() || "0",
        shipping_length: sd.shipping_length?.toString() || "0",
        shipping_width: sd.shipping_width?.toString() || "0",
        shipping_height: sd.shipping_height?.toString() || "0",
        actual_length: sd.actual_length?.toString() || "0",
        actual_width: sd.actual_width?.toString() || "0",
        actual_height: sd.actual_height?.toString() || "0",
        requires_packaging: sd.requires_packaging ?? false,
        shipping_category: sd.shipping_category || "",
        flat_rate_charge: sd.flat_rate_charge?.toString() || "",
        selling_unit: sd.selling_unit || "",
        base_unit: sd.base_unit || "",
        base_unit_qty: sd.base_unit_qty?.toString() || "1",
        cartons: sd.cartons?.toString() || "0",
      });
    }
  }, [shippingData]);

  const update = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "title" && !isEdit && form.auto_url_update) {
      setForm((prev) => ({ ...prev, slug: (value as string).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") }));
    }
  };

  const handleSave = async () => {
    const payload: any = {
      title: form.title,
      subtitle: form.subtitle || null,
      description: form.description || null,
      short_description: form.short_description || null,
      features: form.features || null,
      specifications: form.specifications || null,
      terms_conditions: form.terms_conditions || null,
      internal_notes: form.internal_notes || null,
      sku: form.sku || null,
      barcode: form.barcode || null,
      brand: form.brand || null,
      model_number: form.model_number || null,
      custom_label: form.custom_label || null,
      product_type: form.product_type,
      product_subtype: form.product_subtype || null,
      supplier_item_code: form.supplier_item_code || null,
      price: parseFloat(form.price) || 0,
      compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
      cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
      promo_price: form.promo_price ? parseFloat(form.promo_price) : null,
      promo_start: form.promo_start || null,
      promo_end: form.promo_end || null,
      promo_tag: form.promo_tag || null,
      status: form.status,
      category_id: form.category_id || null,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      search_keywords: form.search_keywords || null,
      seo_title: form.seo_title || null,
      seo_description: form.seo_description || null,
      seo_keywords: form.seo_keywords || null,
      slug: form.slug || null,
      track_inventory: form.track_inventory,
      is_active: form.is_active,
      is_approved: form.is_approved,
      is_bought: form.is_bought,
      is_sold: form.is_sold,
      is_inventoried: form.is_inventoried,
      tax_free: form.tax_free,
      tax_inclusive: form.tax_inclusive,
      is_kit: form.is_kit,
      editable_bundle: form.editable_bundle,
      virtual_product: form.virtual_product,
      dangerous_goods: form.dangerous_goods,
      oversized_item: form.oversized_item,
      temperature_sensitive: form.temperature_sensitive,
      auto_url_update: form.auto_url_update,
      warranty: form.warranty || null,
      availability_description: form.availability_description || null,
      reorder_quantity: parseInt(form.reorder_quantity) || 0,
      restock_quantity: parseInt(form.restock_quantity) || 0,
      preorder_quantity: parseInt(form.preorder_quantity) || 0,
      misc1: form.misc1 || null, misc2: form.misc2 || null, misc3: form.misc3 || null,
      misc4: form.misc4 || null, misc5: form.misc5 || null,
      scheduled_publish_at: form.scheduled_publish_at || null,
      scheduled_unpublish_at: form.scheduled_unpublish_at || null,
      video_url: form.video_url || null,
      images: productImages,
    };

    const onSuccess = (data: any) => {
      // Save shipping data
      const productId = data.id || id;
      if (productId && currentStore) {
        upsertShipping.mutate({
          product_id: productId,
          store_id: currentStore.id,
          shipping_weight: parseFloat(shipping.shipping_weight) || 0,
          shipping_cubic: parseFloat(shipping.shipping_cubic) || 0,
          shipping_length: parseFloat(shipping.shipping_length) || 0,
          shipping_width: parseFloat(shipping.shipping_width) || 0,
          shipping_height: parseFloat(shipping.shipping_height) || 0,
          actual_length: parseFloat(shipping.actual_length) || 0,
          actual_width: parseFloat(shipping.actual_width) || 0,
          actual_height: parseFloat(shipping.actual_height) || 0,
          requires_packaging: shipping.requires_packaging,
          shipping_category: shipping.shipping_category || null,
          flat_rate_charge: shipping.flat_rate_charge ? parseFloat(shipping.flat_rate_charge) : null,
          selling_unit: shipping.selling_unit || null,
          base_unit: shipping.base_unit || null,
          base_unit_qty: parseFloat(shipping.base_unit_qty) || 1,
          cartons: parseInt(shipping.cartons) || 0,
        });
      }
      navigate("/products");
    };

    if (isEdit) {
      updateProduct.mutate({ id: id!, ...payload }, { onSuccess });
    } else {
      createProduct.mutate(payload, { onSuccess });
    }
  };

  if (isEdit && isLoading) {
    return <AdminLayout><div className="space-y-3"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div></AdminLayout>;
  }

  const variants = existing?.product_variants || [];
  const otherProducts = allProducts.filter((p: any) => p.id !== id);

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
          <TabsList className="h-auto flex-wrap gap-1 p-1">
            <TabsTrigger value="general" className="text-xs h-7">General</TabsTrigger>
            <TabsTrigger value="content" className="text-xs h-7">Content</TabsTrigger>
            <TabsTrigger value="pricing" className="text-xs h-7">Pricing</TabsTrigger>
            <TabsTrigger value="inventory" className="text-xs h-7">Inventory</TabsTrigger>
            <TabsTrigger value="shipping" className="text-xs h-7">Shipping</TabsTrigger>
            <TabsTrigger value="media" className="text-xs h-7">Media</TabsTrigger>
            <TabsTrigger value="variants" className="text-xs h-7">Variants ({variants.length})</TabsTrigger>
            <TabsTrigger value="specifics" className="text-xs h-7">Specifics</TabsTrigger>
            <TabsTrigger value="addons" className="text-xs h-7">Addons</TabsTrigger>
            {form.is_kit && <TabsTrigger value="kit" className="text-xs h-7">Kit Components</TabsTrigger>}
            <TabsTrigger value="merchandising" className="text-xs h-7">Merchandising</TabsTrigger>
            <TabsTrigger value="seo" className="text-xs h-7">SEO</TabsTrigger>
            <TabsTrigger value="advanced" className="text-xs h-7">Advanced</TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2 space-y-3">
              {/* GENERAL TAB */}
              <TabsContent value="general" className="mt-0 space-y-3">
                <Card>
                  <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Basic Information</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-2 space-y-3">
                    <div className="space-y-1">
                      <FieldLabel label="Title *" field="title" />
                      <Input className="h-8 text-xs" value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Product title" />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel label="Subtitle" field="subtitle" />
                      <Input className="h-8 text-xs" value={form.subtitle} onChange={(e) => update("subtitle", e.target.value)} placeholder="Product subtitle" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <FieldLabel label="SKU" field="sku" />
                        <Input className="h-8 text-xs font-mono" value={form.sku} onChange={(e) => update("sku", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <FieldLabel label="Barcode / UPC / EAN" field="barcode" />
                        <Input className="h-8 text-xs font-mono" value={form.barcode} onChange={(e) => update("barcode", e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <FieldLabel label="Brand" field="brand" />
                        <Input className="h-8 text-xs" value={form.brand} onChange={(e) => update("brand", e.target.value)} placeholder="Brand name" />
                      </div>
                      <div className="space-y-1">
                        <FieldLabel label="Model #" field="model_number" />
                        <Input className="h-8 text-xs" value={form.model_number} onChange={(e) => update("model_number", e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <FieldLabel label="Product Type" field="product_type" />
                        <Select value={form.product_type} onValueChange={(v) => update("product_type", v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="regular" className="text-xs">Regular</SelectItem>
                            <SelectItem value="variation" className="text-xs">Variation</SelectItem>
                            <SelectItem value="kit" className="text-xs">Kit / Bundle</SelectItem>
                            <SelectItem value="gift_voucher" className="text-xs">Gift Voucher</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <FieldLabel label="Custom Label" field="custom_label" />
                        <Input className="h-8 text-xs" value={form.custom_label} onChange={(e) => update("custom_label", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <FieldLabel label="Supplier Code" field="supplier_item_code" />
                        <Input className="h-8 text-xs" value={form.supplier_item_code} onChange={(e) => update("supplier_item_code", e.target.value)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* CONTENT TAB */}
              <TabsContent value="content" className="mt-0 space-y-3">
                <Card>
                  <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Descriptions & Content</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-2 space-y-3">
                    <div className="space-y-1">
                      <FieldLabel label="Description" field="description" />
                      <Textarea className="text-xs min-h-[100px]" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Full product description" />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel label="Short Description" field="short_description" />
                      <Textarea className="text-xs min-h-[60px]" value={form.short_description} onChange={(e) => update("short_description", e.target.value)} placeholder="Brief summary for listings" />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel label="Features" field="features" />
                      <Textarea className="text-xs min-h-[80px]" value={form.features} onChange={(e) => update("features", e.target.value)} placeholder="Key features (one per line)" />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel label="Specifications" field="specifications" />
                      <Textarea className="text-xs min-h-[80px]" value={form.specifications} onChange={(e) => update("specifications", e.target.value)} placeholder="Technical specifications" />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel label="Terms & Conditions" field="terms_conditions" />
                      <Textarea className="text-xs min-h-[60px]" value={form.terms_conditions} onChange={(e) => update("terms_conditions", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel label="Warranty" field="warranty" />
                      <Input className="h-8 text-xs" value={form.warranty} onChange={(e) => update("warranty", e.target.value)} placeholder="e.g. 2 Year Manufacturer Warranty" />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel label="Availability Description" field="availability_description" />
                      <Input className="h-8 text-xs" value={form.availability_description} onChange={(e) => update("availability_description", e.target.value)} placeholder="e.g. Usually ships in 2-3 days" />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel label="Internal Notes" field="internal_notes" />
                      <Textarea className="text-xs min-h-[60px]" value={form.internal_notes} onChange={(e) => update("internal_notes", e.target.value)} placeholder="Internal notes (not visible to customers)" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* PRICING TAB */}
              <TabsContent value="pricing" className="mt-0 space-y-3">
                <Card>
                  <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Pricing</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-2 space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <FieldLabel label="Price (Default)" field="price" />
                        <Input className="h-8 text-xs" type="number" step="0.01" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="0.00" />
                      </div>
                      <div className="space-y-1">
                        <FieldLabel label="RRP / Compare At" field="compare_at_price" />
                        <Input className="h-8 text-xs" type="number" step="0.01" value={form.compare_at_price} onChange={(e) => update("compare_at_price", e.target.value)} placeholder="0.00" />
                      </div>
                      <div className="space-y-1">
                        <FieldLabel label="Cost Price" field="cost_price" />
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

                <Card>
                  <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Promotion Pricing</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-2 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <FieldLabel label="Promo Price" field="promo_price" />
                        <Input className="h-8 text-xs" type="number" step="0.01" value={form.promo_price} onChange={(e) => update("promo_price", e.target.value)} placeholder="0.00" />
                      </div>
                      <div className="space-y-1">
                        <FieldLabel label="Promo Tag" field="promo_tag" />
                        <Input className="h-8 text-xs" value={form.promo_tag} onChange={(e) => update("promo_tag", e.target.value)} placeholder="e.g. SALE, CLEARANCE" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <FieldLabel label="Promo Start" field="promo_start" />
                        <Input className="h-8 text-xs" type="datetime-local" value={form.promo_start} onChange={(e) => update("promo_start", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <FieldLabel label="Promo End" field="promo_end" />
                        <Input className="h-8 text-xs" type="datetime-local" value={form.promo_end} onChange={(e) => update("promo_end", e.target.value)} />
                      </div>
                    </div>
                    {form.price && form.promo_price && (
                      <p className="text-2xs text-muted-foreground">
                        Save: ${(parseFloat(form.price) - parseFloat(form.promo_price)).toFixed(2)} ({((1 - parseFloat(form.promo_price) / parseFloat(form.price)) * 100).toFixed(0)}% off)
                      </p>
                    )}
                  </CardContent>
                </Card>

                {isEdit && (
                  <Card>
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                      <CardTitle className="text-sm">Multi-Level Pricing</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 space-y-3">
                      {pricingTiers.length > 0 && (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs h-8">Tier</TableHead>
                              <TableHead className="text-xs h-8">Min Qty</TableHead>
                              <TableHead className="text-xs h-8">Price</TableHead>
                              <TableHead className="text-xs h-8">User Group</TableHead>
                              <TableHead className="text-xs h-8 w-10"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pricingTiers.map((t: any) => (
                              <TableRow key={t.id} className="text-xs">
                                <TableCell className="py-1">{t.tier_name}</TableCell>
                                <TableCell className="py-1">{t.min_quantity}</TableCell>
                                <TableCell className="py-1">${Number(t.price).toFixed(2)}</TableCell>
                                <TableCell className="py-1">{t.user_group || "—"}</TableCell>
                                <TableCell className="py-1">
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteTier.mutate({ id: t.id, productId: id! })}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                      <div className="grid grid-cols-5 gap-2 items-end">
                        <div className="space-y-1">
                          <Label className="text-xs">Tier Name</Label>
                          <Input className="h-7 text-xs" value={newTier.tier_name} onChange={(e) => setNewTier(p => ({ ...p, tier_name: e.target.value }))} placeholder="Wholesale" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Min Qty</Label>
                          <Input className="h-7 text-xs" type="number" value={newTier.min_quantity} onChange={(e) => setNewTier(p => ({ ...p, min_quantity: e.target.value }))} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Price</Label>
                          <Input className="h-7 text-xs" type="number" step="0.01" value={newTier.price} onChange={(e) => setNewTier(p => ({ ...p, price: e.target.value }))} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">User Group</Label>
                          <Input className="h-7 text-xs" value={newTier.user_group} onChange={(e) => setNewTier(p => ({ ...p, user_group: e.target.value }))} placeholder="Optional" />
                        </div>
                        <Button size="sm" className="h-7 text-xs" onClick={() => {
                          if (!newTier.tier_name || !newTier.price) return;
                          createTier.mutate({
                            product_id: id!,
                            tier_name: newTier.tier_name,
                            min_quantity: parseInt(newTier.min_quantity) || 1,
                            price: parseFloat(newTier.price),
                            user_group: newTier.user_group || null,
                          });
                          setNewTier({ tier_name: "", min_quantity: "1", price: "", user_group: "" });
                        }}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Tax Settings</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <FieldLabel label="Tax Free Item" field="tax_free" />
                      <Switch checked={form.tax_free} onCheckedChange={(v) => update("tax_free", v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <FieldLabel label="Price is Tax Inclusive" field="tax_inclusive" />
                      <Switch checked={form.tax_inclusive} onCheckedChange={(v) => update("tax_inclusive", v)} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* INVENTORY TAB */}
              <TabsContent value="inventory" className="mt-0 space-y-3">
                <Card>
                  <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Inventory Control</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <FieldLabel label="Track Inventory" field="track_inventory" />
                      <Switch checked={form.track_inventory} onCheckedChange={(v) => update("track_inventory", v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Item is Bought</Label>
                      <Switch checked={form.is_bought} onCheckedChange={(v) => update("is_bought", v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Item is Sold</Label>
                      <Switch checked={form.is_sold} onCheckedChange={(v) => update("is_sold", v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Item is Inventoried</Label>
                      <Switch checked={form.is_inventoried} onCheckedChange={(v) => update("is_inventoried", v)} />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <FieldLabel label="Reorder Qty" field="reorder_quantity" />
                        <Input className="h-8 text-xs" type="number" value={form.reorder_quantity} onChange={(e) => update("reorder_quantity", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <FieldLabel label="Restock Qty" field="restock_quantity" />
                        <Input className="h-8 text-xs" type="number" value={form.restock_quantity} onChange={(e) => update("restock_quantity", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <FieldLabel label="Preorder Qty" field="preorder_quantity" />
                        <Input className="h-8 text-xs" type="number" value={form.preorder_quantity} onChange={(e) => update("preorder_quantity", e.target.value)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SHIPPING TAB */}
              <TabsContent value="shipping" className="mt-0 space-y-3">
                <Card>
                  <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Shipping Dimensions</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-2 space-y-3">
                    <div className="grid grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <FieldLabel label="Weight (kg)" field="shipping_weight" />
                        <Input className="h-8 text-xs" type="number" step="0.01" value={shipping.shipping_weight} onChange={(e) => setShipping(p => ({ ...p, shipping_weight: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <FieldLabel label="Length (m)" field="shipping_length" />
                        <Input className="h-8 text-xs" type="number" step="0.01" value={shipping.shipping_length} onChange={(e) => setShipping(p => ({ ...p, shipping_length: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <FieldLabel label="Width (m)" field="shipping_width" />
                        <Input className="h-8 text-xs" type="number" step="0.01" value={shipping.shipping_width} onChange={(e) => setShipping(p => ({ ...p, shipping_width: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <FieldLabel label="Height (m)" field="shipping_height" />
                        <Input className="h-8 text-xs" type="number" step="0.01" value={shipping.shipping_height} onChange={(e) => setShipping(p => ({ ...p, shipping_height: e.target.value }))} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <FieldLabel label="Cubic (m³)" field="shipping_cubic" />
                      <Input className="h-8 text-xs" type="number" step="0.001" value={shipping.shipping_cubic} onChange={(e) => setShipping(p => ({ ...p, shipping_cubic: e.target.value }))} />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Actual Dimensions</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-2 space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Actual Length (m)</Label>
                        <Input className="h-8 text-xs" type="number" step="0.01" value={shipping.actual_length} onChange={(e) => setShipping(p => ({ ...p, actual_length: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Actual Width (m)</Label>
                        <Input className="h-8 text-xs" type="number" step="0.01" value={shipping.actual_width} onChange={(e) => setShipping(p => ({ ...p, actual_width: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Actual Height (m)</Label>
                        <Input className="h-8 text-xs" type="number" step="0.01" value={shipping.actual_height} onChange={(e) => setShipping(p => ({ ...p, actual_height: e.target.value }))} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Packing & Units</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Requires Packaging</Label>
                      <Switch checked={shipping.requires_packaging} onCheckedChange={(v) => setShipping(p => ({ ...p, requires_packaging: v }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Shipping Category</Label>
                        <Input className="h-8 text-xs" value={shipping.shipping_category} onChange={(e) => setShipping(p => ({ ...p, shipping_category: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <FieldLabel label="Flat Rate Charge" field="flat_rate_charge" />
                        <Input className="h-8 text-xs" type="number" step="0.01" value={shipping.flat_rate_charge} onChange={(e) => setShipping(p => ({ ...p, flat_rate_charge: e.target.value }))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <FieldLabel label="Selling Unit" field="selling_unit" />
                        <Input className="h-8 text-xs" value={shipping.selling_unit} onChange={(e) => setShipping(p => ({ ...p, selling_unit: e.target.value }))} placeholder="e.g. Each, Pack" />
                      </div>
                      <div className="space-y-1">
                        <FieldLabel label="Base Unit" field="base_unit" />
                        <Input className="h-8 text-xs" value={shipping.base_unit} onChange={(e) => setShipping(p => ({ ...p, base_unit: e.target.value }))} placeholder="e.g. Kg, L" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Base Unit Qty</Label>
                        <Input className="h-8 text-xs" type="number" value={shipping.base_unit_qty} onChange={(e) => setShipping(p => ({ ...p, base_unit_qty: e.target.value }))} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Cartons</Label>
                      <Input className="h-8 text-xs" type="number" value={shipping.cartons} onChange={(e) => setShipping(p => ({ ...p, cartons: e.target.value }))} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* MEDIA TAB */}
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
                    <div className="mt-3 space-y-1">
                      <FieldLabel label="Video URL" field="video_url" />
                      <Input className="h-8 text-xs" value={form.video_url} onChange={(e) => update("video_url", e.target.value)} placeholder="YouTube or Vimeo URL (e.g. https://youtube.com/watch?v=...)" />
                      <p className="text-2xs text-muted-foreground">Paste a YouTube or Vimeo video URL to embed on the product page</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* VARIANTS TAB */}
              <TabsContent value="variants" className="mt-0 space-y-3">
                <Card>
                  <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm">Variants</CardTitle>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => { if (!isEdit) { toast.error("Save the product first"); return; } setVariantDialogOpen(true); }}><Plus className="h-3 w-3" /> Add Variant</Button>
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
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteVariant.mutate({ id: v.id, productId: id! })}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="p-6 text-center text-xs text-muted-foreground">No variants. Add variants for sizes, colors, etc.</div>
                    )}
                  </CardContent>
                </Card>

                <Dialog open={variantDialogOpen} onOpenChange={setVariantDialogOpen}>
                  <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle className="text-sm">Add Variant</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div><Label className="text-xs">Name *</Label><Input className="h-8 text-xs" value={newVariant.name} onChange={e => setNewVariant(v => ({ ...v, name: e.target.value }))} placeholder="e.g. Large / Red" /></div>
                      <div><Label className="text-xs">SKU</Label><Input className="h-8 text-xs" value={newVariant.sku} onChange={e => setNewVariant(v => ({ ...v, sku: e.target.value }))} placeholder="SKU-001" /></div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><Label className="text-xs">Price</Label><Input className="h-8 text-xs" type="number" step="0.01" value={newVariant.price} onChange={e => setNewVariant(v => ({ ...v, price: e.target.value }))} /></div>
                        <div><Label className="text-xs">Stock</Label><Input className="h-8 text-xs" type="number" value={newVariant.stock} onChange={e => setNewVariant(v => ({ ...v, stock: e.target.value }))} /></div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" size="sm" onClick={() => setVariantDialogOpen(false)}>Cancel</Button>
                      <Button size="sm" disabled={!newVariant.name || createVariant.isPending} onClick={() => {
                        createVariant.mutate({ product_id: id!, name: newVariant.name, sku: newVariant.sku || undefined, price: parseFloat(newVariant.price) || 0, stock: parseInt(newVariant.stock) || 0 }, {
                          onSuccess: () => { setVariantDialogOpen(false); setNewVariant({ name: "", sku: "", price: "0", stock: "0" }); }
                        });
                      }}>{createVariant.isPending ? "Creating..." : "Create Variant"}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </TabsContent>

              {/* SPECIFICS TAB */}
              <TabsContent value="specifics" className="mt-0 space-y-3">
                <Card>
                  <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Item Specifics / Attributes</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-2 space-y-3">
                    {!isEdit ? (
                      <p className="text-xs text-muted-foreground">Save the product first, then add specifics.</p>
                    ) : (
                      <>
                        {specifics.length > 0 && (
                          <div className="space-y-1">
                            {specifics.map((s: any) => (
                              <div key={s.id} className="flex items-center justify-between bg-muted/50 rounded px-2 py-1">
                                <span className="text-xs"><span className="font-medium">{s.name}:</span> {s.value}</span>
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => deleteSpecific.mutate({ id: s.id, productId: id! })}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="grid grid-cols-5 gap-2 items-end">
                          <div className="col-span-2 space-y-1">
                            <Label className="text-xs">Name</Label>
                            <Input className="h-7 text-xs" value={newSpecName} onChange={(e) => setNewSpecName(e.target.value)} placeholder="e.g. Colour" />
                          </div>
                          <div className="col-span-2 space-y-1">
                            <Label className="text-xs">Value</Label>
                            <Input className="h-7 text-xs" value={newSpecValue} onChange={(e) => setNewSpecValue(e.target.value)} placeholder="e.g. Red" />
                          </div>
                          <Button size="sm" className="h-7 text-xs" onClick={() => {
                            if (!newSpecName || !newSpecValue) return;
                            createSpecific.mutate({ product_id: id!, name: newSpecName, value: newSpecValue });
                            setNewSpecName(""); setNewSpecValue("");
                          }}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* MERCHANDISING TAB */}
              <TabsContent value="merchandising" className="mt-0 space-y-3">
                <Card>
                  <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Cross-Sells, Upsells & Free Gifts</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-2 space-y-3">
                    {!isEdit ? (
                      <p className="text-xs text-muted-foreground">Save the product first, then add relations.</p>
                    ) : (
                      <>
                        {relations.length > 0 && (
                          <div className="space-y-1">
                            {relations.map((r: any) => (
                              <div key={r.id} className="flex items-center justify-between bg-muted/50 rounded px-2 py-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-2xs">{r.relation_type.replace("_", " ")}</Badge>
                                  <span className="text-xs">{r.related_product?.title || r.related_product_id}</span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => deleteRelation.mutate({ id: r.id, productId: id! })}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="grid grid-cols-3 gap-2 items-end">
                          <div className="space-y-1">
                            <Label className="text-xs">Type</Label>
                            <Select defaultValue="cross_sell" onValueChange={() => {}}>
                              <SelectTrigger className="h-7 text-xs" id="rel-type"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cross_sell" className="text-xs">Cross-Sell</SelectItem>
                                <SelectItem value="upsell" className="text-xs">Upsell</SelectItem>
                                <SelectItem value="free_gift" className="text-xs">Free Gift</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Product</Label>
                            <Select onValueChange={(productId) => {
                              const typeEl = document.getElementById("rel-type") as any;
                              const relType = typeEl?.textContent?.toLowerCase().replace(/-/g, "_").replace(" ", "_") || "cross_sell";
                              createRelation.mutate({
                                product_id: id!,
                                related_product_id: productId,
                                relation_type: relType,
                              });
                            }}>
                              <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                              <SelectContent>
                                {otherProducts.slice(0, 20).map((p: any) => (
                                  <SelectItem key={p.id} value={p.id} className="text-xs">{p.title}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Product Flags</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Kit / Bundle Product</Label>
                      <Switch checked={form.is_kit} onCheckedChange={(v) => update("is_kit", v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Editable Bundle</Label>
                      <Switch checked={form.editable_bundle} onCheckedChange={(v) => update("editable_bundle", v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Virtual Product (Allow Oversell)</Label>
                      <Switch checked={form.virtual_product} onCheckedChange={(v) => update("virtual_product", v)} />
                    </div>
                    <Separator className="my-2" />
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Handling Flags</p>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-destructive">⚠ Dangerous Goods</Label>
                      <Switch checked={form.dangerous_goods} onCheckedChange={(v) => update("dangerous_goods", v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">📦 Oversized Item</Label>
                      <Switch checked={form.oversized_item} onCheckedChange={(v) => update("oversized_item", v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">🌡 Temperature Sensitive</Label>
                      <Switch checked={form.temperature_sensitive} onCheckedChange={(v) => update("temperature_sensitive", v)} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ADDONS TAB */}
              <TabsContent value="addons" className="mt-0 space-y-3">
                <ProductAddonsTab productId={isEdit ? id! : ""} isEdit={isEdit} />
              </TabsContent>

              {/* KIT COMPONENTS TAB */}
              {form.is_kit && (
                <TabsContent value="kit" className="mt-0 space-y-3">
                  <KitComponentsTab productId={isEdit ? id! : ""} isEdit={isEdit} />
                </TabsContent>
              )}

              {/* SEO TAB */}
              <TabsContent value="seo" className="mt-0 space-y-3">
                <Card>
                  <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">SEO</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-2 space-y-3">
                    <div className="space-y-1">
                      <FieldLabel label="Page Title" field="seo_title" />
                      <Input className="h-8 text-xs" value={form.seo_title} onChange={(e) => update("seo_title", e.target.value)} placeholder="SEO page title" />
                      <p className="text-2xs text-muted-foreground">{form.seo_title.length}/60 characters</p>
                    </div>
                    <div className="space-y-1">
                      <FieldLabel label="Meta Description" field="seo_description" />
                      <Textarea className="text-xs min-h-[60px]" value={form.seo_description} onChange={(e) => update("seo_description", e.target.value)} placeholder="SEO description" />
                      <p className="text-2xs text-muted-foreground">{form.seo_description.length}/160 characters</p>
                    </div>
                    <div className="space-y-1">
                      <FieldLabel label="Meta Keywords" field="seo_keywords" />
                      <Input className="h-8 text-xs" value={form.seo_keywords} onChange={(e) => update("seo_keywords", e.target.value)} placeholder="Comma-separated keywords" />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel label="URL Slug" field="slug" />
                      <Input className="h-8 text-xs font-mono" value={form.slug} onChange={(e) => update("slug", e.target.value)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Auto-Generate URL</Label>
                      <Switch checked={form.auto_url_update} onCheckedChange={(v) => update("auto_url_update", v)} />
                    </div>
                    <div className="rounded-md bg-muted p-3 space-y-0.5">
                      <p className="text-xs text-primary">{form.seo_title || form.title || "Page Title"}</p>
                      <p className="text-2xs text-accent-foreground">store.com/products/{form.slug || "product-slug"}</p>
                      <p className="text-2xs text-muted-foreground">{form.seo_description || "Meta description preview..."}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ADVANCED TAB */}
              <TabsContent value="advanced" className="mt-0 space-y-3">
                <Card>
                  <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Miscellaneous Fields</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-2 space-y-3">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div key={n} className="space-y-1">
                        <FieldLabel label={`Misc ${n}`} field={`misc${n}`} />
                        <Input className="h-8 text-xs" value={(form as any)[`misc${n}`]} onChange={(e) => update(`misc${n}`, e.target.value)} placeholder={`Custom field ${n}`} />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="space-y-3">
              <Card>
                <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Status & Visibility</CardTitle></CardHeader>
                <CardContent className="p-4 pt-2 space-y-3">
                  <Select value={form.status} onValueChange={(v) => setForm((prev) => ({ ...prev, status: v }))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft" className="text-xs">Draft</SelectItem>
                      <SelectItem value="active" className="text-xs">Active</SelectItem>
                      <SelectItem value="archived" className="text-xs">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Active</Label>
                    <Switch checked={form.is_active} onCheckedChange={(v) => update("is_active", v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Approved</Label>
                    <Switch checked={form.is_approved} onCheckedChange={(v) => update("is_approved", v)} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Scheduling</CardTitle></CardHeader>
                <CardContent className="p-4 pt-2 space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Publish At</Label>
                    <Input type="datetime-local" className="h-8 text-xs" value={form.scheduled_publish_at} onChange={(e) => update("scheduled_publish_at", e.target.value)} />
                    <p className="text-2xs text-muted-foreground">Auto-set status to active at this time</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Unpublish At</Label>
                    <Input type="datetime-local" className="h-8 text-xs" value={form.scheduled_unpublish_at} onChange={(e) => update("scheduled_unpublish_at", e.target.value)} />
                    <p className="text-2xs text-muted-foreground">Auto-set status to draft at this time</p>
                  </div>
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
                    <FieldLabel label="Tags" field="tags" />
                    <Input className="h-8 text-xs" value={form.tags} onChange={(e) => update("tags", e.target.value)} placeholder="Comma separated tags" />
                  </div>
                  <div className="space-y-1">
                    <FieldLabel label="Search Keywords" field="search_keywords" />
                    <Input className="h-8 text-xs" value={form.search_keywords} onChange={(e) => update("search_keywords", e.target.value)} placeholder="Additional search terms" />
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