import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StorefrontLayout } from "@/components/storefront/StorefrontLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { ShoppingBag, Minus, Plus, Check } from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const getImageUrl = (path: string) => path?.startsWith("http") ? path : `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;

export default function StorefrontProductDetail() {
  const { storeSlug, productId } = useParams();
  const { addItem } = useCart();
  const [store, setStore] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: stores } = await supabase.from("stores").select("*").limit(100);
      const found = stores?.find((s: any) => s.name.toLowerCase().replace(/\s+/g, "-") === storeSlug) || stores?.[0];
      if (found) setStore(found);

      if (productId) {
        const { data: prod } = await supabase.from("products").select("*").eq("id", productId).single();
        setProduct(prod);
        const { data: vars } = await supabase.from("product_variants").select("*").eq("product_id", productId);
        setVariants(vars || []);
        if (vars && vars.length > 0) setSelectedVariant(vars[0].id);
      }
      setLoading(false);
    }
    load();
  }, [storeSlug, productId]);

  const currentVariant = variants.find((v) => v.id === selectedVariant);
  const price = currentVariant ? currentVariant.price : product?.price || 0;
  const images = product?.images || [];

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      product_id: product.id,
      variant_id: currentVariant?.id || null,
      title: product.title,
      variant_name: currentVariant?.name,
      price: Number(price),
      image: images[0],
      sku: currentVariant?.sku || product.sku,
      quantity,
    });
    setAdded(true);
    toast.success("Added to cart");
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <StorefrontLayout storeName={store?.name}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square rounded-xl" />
            <div className="space-y-4"><Skeleton className="h-8 w-3/4" /><Skeleton className="h-6 w-1/4" /><Skeleton className="h-24 w-full" /></div>
          </div>
        </div>
      </StorefrontLayout>
    );
  }

  if (!product) {
    return (
      <StorefrontLayout storeName={store?.name}>
        <div className="max-w-7xl mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold">Product not found</h1>
        </div>
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout storeName={store?.name}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <div className="space-y-3">
            <div className="aspect-square rounded-xl overflow-hidden bg-muted border">
              {images[selectedImage] ? (
                <img src={getImageUrl(images[selectedImage])} alt={product.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">No image</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 ${idx === selectedImage ? "border-primary" : "border-transparent"}`}
                    onClick={() => setSelectedImage(idx)}
                  >
                    <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{product.title}</h1>
              <div className="flex items-baseline gap-3 mt-2">
                <span className="text-2xl font-bold">${Number(price).toFixed(2)}</span>
                {product.compare_at_price && product.compare_at_price > price && (
                  <span className="text-lg text-muted-foreground line-through">${Number(product.compare_at_price).toFixed(2)}</span>
                )}
              </div>
            </div>

            <Separator />

            {product.description && (
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            )}

            {/* Variant selector */}
            {variants.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Variant</label>
                <Select value={selectedVariant} onValueChange={setSelectedVariant}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {variants.map((v: any) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name} — ${Number(v.price).toFixed(2)}
                        {v.stock <= 0 ? " (Out of stock)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity</label>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-lg font-medium w-8 text-center">{quantity}</span>
                <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setQuantity(quantity + 1)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Add to cart */}
            <Button
              className="w-full h-12 text-base font-medium gap-2"
              onClick={handleAddToCart}
              disabled={currentVariant && currentVariant.stock <= 0}
            >
              {added ? <><Check className="h-5 w-5" /> Added!</> : <><ShoppingBag className="h-5 w-5" /> Add to Cart — ${(Number(price) * quantity).toFixed(2)}</>}
            </Button>

            {/* SKU */}
            {(product.sku || currentVariant?.sku) && (
              <p className="text-xs text-muted-foreground">SKU: {currentVariant?.sku || product.sku}</p>
            )}
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
}
