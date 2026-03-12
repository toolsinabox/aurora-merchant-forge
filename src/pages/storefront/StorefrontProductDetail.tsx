import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StorefrontLayout } from "@/components/storefront/StorefrontLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { ShoppingBag, Minus, Plus, Check, Heart, ChevronRight, Home } from "lucide-react";
import { ProductReviews } from "@/components/storefront/ProductReviews";
import { ImageLightbox } from "@/components/storefront/ImageLightbox";
import { toast } from "sonner";
import { useStoreSlug, resolveStoreBySlug } from "@/lib/subdomain";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const getImageUrl = (path: string) => path?.startsWith("http") ? path : `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;

export default function StorefrontProductDetail() {
  const { storeSlug: paramSlug, productId } = useParams();
  const { storeSlug, basePath } = useStoreSlug(paramSlug);
  const { addItem } = useCart();
  const { toggleItem, isWishlisted } = useWishlist();
  const [store, setStore] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [added, setAdded] = useState(false);
  const [zooming, setZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    async function load() {
      if (!storeSlug) { setLoading(false); return; }
      const found = await resolveStoreBySlug(storeSlug, supabase);
      if (found) setStore(found);

      if (productId) {
        const { data: prod } = await supabase.from("products").select("*").eq("id", productId).single();
        setProduct(prod);
        const { data: vars } = await supabase.from("product_variants").select("*").eq("product_id", productId);
        setVariants(vars || []);
        if (vars && vars.length > 0) setSelectedVariant(vars[0].id);

        // Fetch related products (same category or random from same store)
        if (prod && found) {
          const query = supabase
            .from("products")
            .select("id, title, price, images, compare_at_price")
            .eq("store_id", found.id)
            .eq("status", "active")
            .neq("id", productId)
            .limit(4);

          if (prod.category_id) {
            query.eq("category_id", prod.category_id);
          }

          const { data: related } = await query;
          setRelatedProducts(related || []);
        }
      }
      setLoading(false);
    }
    load();
    setSelectedImage(0);
    setQuantity(1);
  }, [storeSlug, productId]);

  const currentVariant = variants.find((v) => v.id === selectedVariant);
  const price = currentVariant ? currentVariant.price : product?.price || 0;
  const images = product?.images || [];
  const wishlisted = product ? isWishlisted(product.id) : false;

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

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
          <Link to={basePath || "/"} className="hover:text-foreground flex items-center gap-1">
            <Home className="h-3.5 w-3.5" /> Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link to={`${basePath}/products`} className="hover:text-foreground">Products</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium truncate max-w-[200px]">{product.title}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Images with zoom */}
          <div className="space-y-3">
            <div
              className="aspect-square rounded-xl overflow-hidden bg-muted border relative cursor-crosshair"
              onMouseEnter={() => setZooming(true)}
              onMouseLeave={() => setZooming(false)}
              onMouseMove={handleImageMouseMove}
            >
              {images[selectedImage] ? (
                <img
                  src={getImageUrl(images[selectedImage])}
                  alt={product.title}
                  className="w-full h-full object-cover transition-transform duration-200"
                  style={zooming ? {
                    transform: "scale(2)",
                    transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                  } : undefined}
                />
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
                  <>
                    <span className="text-lg text-muted-foreground line-through">${Number(product.compare_at_price).toFixed(2)}</span>
                    <span className="text-sm font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded">
                      {Math.round((1 - price / product.compare_at_price) * 100)}% OFF
                    </span>
                  </>
                )}
              </div>
            </div>

            <Separator />

            {product.description && (
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            )}

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

            <div className="flex gap-3">
              <Button
                className="flex-1 h-12 text-base font-medium gap-2"
                onClick={handleAddToCart}
                disabled={currentVariant && currentVariant.stock <= 0}
              >
                {added ? <><Check className="h-5 w-5" /> Added!</> : <><ShoppingBag className="h-5 w-5" /> Add to Cart — ${(Number(price) * quantity).toFixed(2)}</>}
              </Button>
              {store && (
                <Button
                  variant="outline"
                  size="icon"
                  className={`h-12 w-12 ${wishlisted ? "text-destructive border-destructive/30" : ""}`}
                  onClick={() => toggleItem(product.id, store.id)}
                >
                  <Heart className={`h-5 w-5 ${wishlisted ? "fill-current" : ""}`} />
                </Button>
              )}
            </div>

            {(product.sku || currentVariant?.sku) && (
              <p className="text-xs text-muted-foreground">SKU: {currentVariant?.sku || product.sku}</p>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <Separator className="mb-8" />
            <h2 className="text-xl font-bold mb-5">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {relatedProducts.map((p) => (
                <Link key={p.id} to={`${basePath}/product/${p.id}`} className="group">
                  <div className="aspect-square rounded-xl overflow-hidden bg-muted border mb-2.5">
                    {p.images?.[0] ? (
                      <img src={getImageUrl(p.images[0])} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No image</div>
                    )}
                  </div>
                  <h3 className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">{p.title}</h3>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-sm font-bold">${Number(p.price).toFixed(2)}</span>
                    {p.compare_at_price && p.compare_at_price > p.price && (
                      <span className="text-xs text-muted-foreground line-through">${Number(p.compare_at_price).toFixed(2)}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        {store && (
          <div className="mt-12">
            <Separator className="mb-8" />
            <ProductReviews productId={product.id} storeId={store.id} />
          </div>
        )}
      </div>
    </StorefrontLayout>
  );
}
