import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StorefrontLayout } from "@/components/storefront/StorefrontLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { ShoppingBag, Minus, Plus, Check, Heart, ChevronRight, Home, Package, Shield, Truck, Clock, Bell, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { ProductReviews } from "@/components/storefront/ProductReviews";
import { ImageLightbox } from "@/components/storefront/ImageLightbox";
import { toast } from "sonner";
import { useStoreSlug, resolveStoreBySlug } from "@/lib/subdomain";
import { RenderedTemplate } from "@/components/storefront/RenderedTemplate";
import { SEOHead } from "@/components/storefront/SEOHead";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { AddToCartPopup } from "@/components/storefront/AddToCartPopup";
import type { TemplateContext } from "@/lib/base-template-engine";

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
  const [specifics, setSpecifics] = useState<any[]>([]);
  const [shipping, setShipping] = useState<any>(null);
  const [pricingTiers, setPricingTiers] = useState<any[]>([]);
  const [crossSells, setCrossSells] = useState<any[]>([]);
  const [childProducts, setChildProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [added, setAdded] = useState(false);
  const [zooming, setZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { addProduct: trackView, getRecent } = useRecentlyViewed();
  const { user } = useAuth();
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifySubmitted, setNotifySubmitted] = useState(false);
  const [shippingEstimate, setShippingEstimate] = useState<{ zone: string; cost: string } | null>(null);
  const [shippingZones, setShippingZones] = useState<any[]>([]);
  const [estimateZip, setEstimateZip] = useState("");
  const [cartPopupOpen, setCartPopupOpen] = useState(false);
  const [cartPopupItem, setCartPopupItem] = useState<any>(null);
  const { items: cartItems, totalItems: cartItemCount, totalPrice: cartTotal } = useCart();

  useEffect(() => {
    async function load() {
      if (!storeSlug) { setLoading(false); return; }
      const found = await resolveStoreBySlug(storeSlug, supabase);
      if (found) setStore(found);

      if (productId) {
        const [prodRes, varsRes, specsRes, shipRes, tiersRes, relsRes] = await Promise.all([
          supabase.from("products").select("*").eq("id", productId).single(),
          supabase.from("product_variants").select("*").eq("product_id", productId),
          supabase.from("product_specifics").select("*").eq("product_id", productId).order("sort_order"),
          supabase.from("product_shipping").select("*").eq("product_id", productId).maybeSingle(),
          supabase.from("product_pricing_tiers").select("*").eq("product_id", productId).order("min_quantity"),
          supabase.from("product_relations").select("*, related:related_product_id(id, title, price, images, compare_at_price)").eq("product_id", productId),
        ]);

        setProduct(prodRes.data);
        setVariants(varsRes.data || []);
        setSpecifics(specsRes.data || []);
        setShipping(shipRes.data);
        setPricingTiers(tiersRes.data || []);
        
        if (varsRes.data && varsRes.data.length > 0) setSelectedVariant(varsRes.data[0].id);

        // Separate cross-sells, upsells, and child products
        const rels = relsRes.data || [];
        const crossSellProducts = rels.filter((r: any) => r.relation_type === "cross_sell" || r.relation_type === "upsell").map((r: any) => r.related).filter(Boolean);
        setCrossSells(crossSellProducts);
        const children = rels.filter((r: any) => r.relation_type === "child" || r.relation_type === "accessory").map((r: any) => r.related).filter(Boolean);
        setChildProducts(children);

        // Fallback related products if no relations
        if (prodRes.data && found && crossSellProducts.length === 0) {
          const query = supabase
            .from("products")
            .select("id, title, price, images, compare_at_price")
            .eq("store_id", found.id)
            .eq("status", "active")
            .neq("id", productId)
            .limit(4);
          if (prodRes.data.category_id) query.eq("category_id", prodRes.data.category_id);
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

  // Track recently viewed
  useEffect(() => {
    if (product) trackView(product);
  }, [product?.id]);

  const currentVariant = variants.find((v) => v.id === selectedVariant);
  const price = currentVariant ? currentVariant.price : product?.price || 0;
  const images = product?.images || [];
  const wishlisted = product ? isWishlisted(product.id) : false;

  // Check if promo is active
  const now = new Date();
  const promoActive = product?.promo_price && 
    (!product.promo_start || new Date(product.promo_start) <= now) &&
    (!product.promo_end || new Date(product.promo_end) >= now);
  const displayPrice = promoActive ? product.promo_price : price;

  // Find applicable tier price
  const applicableTier = pricingTiers.filter(t => quantity >= t.min_quantity).sort((a, b) => b.min_quantity - a.min_quantity)[0];
  const finalPrice = applicableTier ? applicableTier.price : displayPrice;

  const handleAddToCart = () => {
    if (!product) return;
    const itemData = {
      product_id: product.id,
      variant_id: currentVariant?.id || null,
      title: product.title,
      variant_name: currentVariant?.name,
      price: Number(finalPrice),
      image: images[0],
      sku: currentVariant?.sku || product.sku,
      quantity,
    };
    addItem(itemData);
    setCartPopupItem({
      title: product.title,
      price: Number(finalPrice),
      quantity,
      image: images[0],
      variant_name: currentVariant?.name,
    });
    setCartPopupOpen(true);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const handleEstimateShipping = useCallback(async () => {
    if (!estimateZip.trim() || !store) return;
    if (shippingZones.length === 0) {
      const { data: zones } = await supabase.from("shipping_zones").select("*").eq("store_id", store.id);
      if (zones) setShippingZones(zones);
      if (!zones || zones.length === 0) {
        setShippingEstimate({ zone: "Shipping", cost: "Contact us" });
        return;
      }
      // Find matching zone or first
      const match = zones.find((z: any) => z.regions.toLowerCase().includes(estimateZip.toLowerCase())) || zones[0];
      const productPrice = Number(finalPrice) * quantity;
      const isFree = (shipping?.free_shipping) || (match.free_above && productPrice >= Number(match.free_above));
      setShippingEstimate({
        zone: match.name,
        cost: isFree ? "Free" : `$${Number(match.flat_rate).toFixed(2)}`,
      });
    } else {
      const match = shippingZones.find((z: any) => z.regions.toLowerCase().includes(estimateZip.toLowerCase())) || shippingZones[0];
      const productPrice = Number(finalPrice) * quantity;
      const isFree = (shipping?.free_shipping) || (match.free_above && productPrice >= Number(match.free_above));
      setShippingEstimate({
        zone: match.name,
        cost: isFree ? "Free" : `$${Number(match.flat_rate).toFixed(2)}`,
      });
    }
  }, [estimateZip, store, shippingZones, finalPrice, quantity, shipping]);

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

  const allRelated = crossSells.length > 0 ? crossSells : relatedProducts;

  return (
    <StorefrontLayout storeName={store?.name}>
      <SEOHead
        title={product.seo_title || `${product.title} — ${store?.name || "Store"}`}
        description={product.seo_description || product.short_description || product.description?.slice(0, 160)}
        image={images[0] ? getImageUrl(images[0]) : undefined}
        url={window.location.href}
        type="product"
        price={Number(finalPrice)}
        currency={store?.currency || "USD"}
        canonicalUrl={window.location.origin + window.location.pathname}
        product={{
          name: product.title,
          description: product.short_description || product.description?.slice(0, 300),
          sku: currentVariant?.sku || product.sku,
          brand: product.brand,
          image: images[0] ? getImageUrl(images[0]) : undefined,
          price: Number(finalPrice),
          currency: store?.currency || "USD",
          availability: (currentVariant && currentVariant.stock <= 0) ? "OutOfStock" : "InStock",
          url: window.location.href,
        }}
      />
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
              onClick={() => images.length > 0 && setLightboxOpen(true)}
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
              {promoActive && product.promo_tag && (
                <Badge className="absolute top-3 left-3 bg-destructive text-destructive-foreground">{product.promo_tag}</Badge>
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
              {product.brand && <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide mb-1">{product.brand}</p>}
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{product.title}</h1>
              {product.subtitle && <p className="text-muted-foreground mt-1">{product.subtitle}</p>}
              
              {product.poa ? (
                <div className="mt-3">
                  <span className="text-xl font-semibold text-primary">Contact for Price</span>
                  <p className="text-sm text-muted-foreground mt-1">This product is available on application. Please contact us for pricing.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-baseline gap-3 mt-3">
                    <span className="text-2xl font-bold">${Number(finalPrice).toFixed(2)}</span>
                    {product.tax_inclusive === false && (
                      <span className="text-xs text-muted-foreground">ex. tax</span>
                    )}
                    {product.tax_inclusive === true && (
                      <span className="text-xs text-muted-foreground">inc. tax</span>
                    )}
                    {promoActive && (
                      <>
                        <span className="text-lg text-muted-foreground line-through">${Number(price).toFixed(2)}</span>
                        <Badge variant="destructive" className="text-xs">
                          {Math.round((1 - Number(product.promo_price) / Number(price)) * 100)}% OFF
                        </Badge>
                      </>
                    )}
                    {!promoActive && product.compare_at_price && product.compare_at_price > finalPrice && (
                      <>
                        <span className="text-lg text-muted-foreground line-through">${Number(product.compare_at_price).toFixed(2)}</span>
                        <span className="text-sm font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded">
                          {Math.round((1 - Number(finalPrice) / Number(product.compare_at_price)) * 100)}% OFF
                        </span>
                      </>
                    )}
                  </div>
                  {promoActive && product.promo_end && (
                    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Sale ends {new Date(product.promo_end).toLocaleDateString()}
                    </p>
                  )}
                </>
              )}
              {applicableTier && (
                <p className="text-xs text-primary mt-1">Bulk price applied: {applicableTier.tier_name} (min {applicableTier.min_quantity} units)</p>
              )}
            </div>

            <Separator />

            {product.short_description && (
              <p className="text-muted-foreground leading-relaxed">{product.short_description}</p>
            )}
            {!product.short_description && product.description && (
              <p className="text-muted-foreground leading-relaxed line-clamp-4">{product.description}</p>
            )}

            {/* Specifics as inline badges */}
            {specifics.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {specifics.map((s: any) => (
                  <div key={s.id} className="text-xs">
                    <span className="text-muted-foreground">{s.name}:</span>{" "}
                    <Badge variant="secondary" className="font-normal">{s.value}</Badge>
                  </div>
                ))}
              </div>
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

            {/* Quantity pricing tiers */}
            {pricingTiers.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Bulk Pricing</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {pricingTiers.map((t: any) => (
                    <div key={t.id} className={`text-center p-2 rounded-lg border text-sm ${quantity >= t.min_quantity ? "border-primary bg-primary/5" : "border-border"}`}>
                      <div className="font-semibold">${Number(t.price).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">{t.min_quantity}+ units</div>
                      {t.tier_name && t.tier_name !== "default" && <div className="text-xs text-muted-foreground">{t.tier_name}</div>}
                    </div>
                  ))}
                </div>
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

            {!product.poa && (() => {
              const isOutOfStock = currentVariant ? currentVariant.stock <= 0 : false;
              const preorderQty = product.preorder_quantity || 0;
              const canPreorder = isOutOfStock && preorderQty > 0;
              const canBuy = !isOutOfStock || canPreorder;
              return (
                <div className="flex gap-3">
                  <Button
                    className="flex-1 h-12 text-base font-medium gap-2"
                    onClick={handleAddToCart}
                    disabled={!canBuy}
                  >
                    {added ? <><Check className="h-5 w-5" /> Added!</> :
                      canPreorder ? <><Clock className="h-5 w-5" /> Pre-Order — ${(Number(finalPrice) * quantity).toFixed(2)}</> :
                      <><ShoppingBag className="h-5 w-5" /> Add to Cart — ${(Number(finalPrice) * quantity).toFixed(2)}</>}
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
              );
            })()}

            {/* Back in Stock Notification - show when out of stock */}
            {!product.poa && (currentVariant ? (currentVariant.stock <= 0 && !(product.preorder_quantity > 0)) : (product.track_inventory && product.status === "active")) && !notifySubmitted && (
              <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
                <p className="text-sm font-medium flex items-center gap-1.5"><Bell className="h-4 w-4" /> Notify me when back in stock</p>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Your email"
                    value={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.value)}
                    className="h-9 text-sm"
                  />
                  <Button size="sm" className="h-9 shrink-0" onClick={async () => {
                    if (!notifyEmail || !store) return;
                    await supabase.from("back_in_stock_requests" as any).insert({
                      store_id: store.id,
                      product_id: product.id,
                      variant_id: currentVariant?.id || null,
                      email: notifyEmail,
                      user_id: user?.id || null,
                    });
                    setNotifySubmitted(true);
                    toast.success("You'll be notified when this item is back in stock!");
                  }}>Notify Me</Button>
                </div>
              </div>
            )}
            {notifySubmitted && (
              <div className="border rounded-lg p-3 bg-primary/5 text-sm flex items-center gap-2 text-primary">
                <Check className="h-4 w-4" /> We'll email you when this product is available
              </div>
            )}

            {product.poa && (
              <Button variant="outline" className="w-full h-12" onClick={() => window.location.href = `mailto:${store?.contact_email || ''}`}>
                Contact Us for Pricing
              </Button>
            )}

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="flex flex-col items-center text-center p-2 rounded-lg bg-muted/50">
                <Truck className="h-4 w-4 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">Fast Shipping</span>
              </div>
              <div className="flex flex-col items-center text-center p-2 rounded-lg bg-muted/50">
                <Shield className="h-4 w-4 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">Secure Checkout</span>
              </div>
              <div className="flex flex-col items-center text-center p-2 rounded-lg bg-muted/50">
                <Package className="h-4 w-4 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">Easy Returns</span>
              </div>
            </div>

            {(product.sku || currentVariant?.sku) && (
              <p className="text-xs text-muted-foreground">SKU: {currentVariant?.sku || product.sku}</p>
            )}
            {product.availability_description && (
              <p className="text-sm text-muted-foreground">{product.availability_description}</p>
            )}
          </div>
            </div>

            {/* Shipping Calculator */}
            <div className="border rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium flex items-center gap-1.5"><MapPin className="h-4 w-4" /> Estimate Shipping</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter postcode / ZIP"
                  value={estimateZip}
                  onChange={(e) => setEstimateZip(e.target.value)}
                  className="h-9 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleEstimateShipping();
                    }
                  }}
                />
                <Button variant="outline" size="sm" className="h-9 shrink-0" onClick={handleEstimateShipping}>
                  Calculate
                </Button>
              </div>
              {shippingEstimate && (
                <p className="text-sm">
                  <span className="text-muted-foreground">{shippingEstimate.zone}:</span>{" "}
                  <span className="font-medium">{shippingEstimate.cost}</span>
                </p>
              )}
            </div>

        {/* Tabbed content: Description, Features, Specs, Shipping, Warranty */}
        <div className="mt-10">
          <Tabs defaultValue="description">
            <TabsList className="w-full justify-start overflow-x-auto">
              {product.description && <TabsTrigger value="description">Description</TabsTrigger>}
              {product.features && <TabsTrigger value="features">Features</TabsTrigger>}
              {product.specifications && <TabsTrigger value="specifications">Specifications</TabsTrigger>}
              {shipping && <TabsTrigger value="shipping">Shipping</TabsTrigger>}
              {product.warranty && <TabsTrigger value="warranty">Warranty</TabsTrigger>}
            </TabsList>
            {product.description && (
              <TabsContent value="description" className="mt-4 prose prose-sm max-w-none text-muted-foreground">
                <div className="whitespace-pre-wrap">{product.description}</div>
              </TabsContent>
            )}
            {product.features && (
              <TabsContent value="features" className="mt-4 prose prose-sm max-w-none text-muted-foreground">
                <div className="whitespace-pre-wrap">{product.features}</div>
              </TabsContent>
            )}
            {product.specifications && (
              <TabsContent value="specifications" className="mt-4 prose prose-sm max-w-none text-muted-foreground">
                <div className="whitespace-pre-wrap">{product.specifications}</div>
              </TabsContent>
            )}
            {shipping && (
              <TabsContent value="shipping" className="mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  {shipping.shipping_weight > 0 && <div><span className="text-muted-foreground">Weight:</span> {shipping.shipping_weight} kg</div>}
                  {shipping.shipping_length > 0 && <div><span className="text-muted-foreground">Length:</span> {shipping.shipping_length} m</div>}
                  {shipping.shipping_width > 0 && <div><span className="text-muted-foreground">Width:</span> {shipping.shipping_width} m</div>}
                  {shipping.shipping_height > 0 && <div><span className="text-muted-foreground">Height:</span> {shipping.shipping_height} m</div>}
                  {shipping.shipping_cubic > 0 && <div><span className="text-muted-foreground">Cubic:</span> {shipping.shipping_cubic} m³</div>}
                  {shipping.selling_unit && <div><span className="text-muted-foreground">Unit:</span> {shipping.selling_unit}</div>}
                  {shipping.flat_rate_charge && <div><span className="text-muted-foreground">Flat Rate:</span> ${Number(shipping.flat_rate_charge).toFixed(2)}</div>}
                </div>
              </TabsContent>
            )}
            {product.warranty && (
              <TabsContent value="warranty" className="mt-4 prose prose-sm max-w-none text-muted-foreground">
                <div className="whitespace-pre-wrap">{product.warranty}</div>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* B@SE Template Content Blocks */}
        {store && product && (
          <div className="mt-8">
            <RenderedTemplate
              storeId={store.id}
              templateType="content_block"
              contextType="product"
              context={{
                product,
                variants,
                specifics,
                pricing_tiers: pricingTiers,
                cross_sells: crossSells,
                shipping: shipping || undefined,
                store,
              } as TemplateContext}
              className="prose prose-sm max-w-none"
            />
          </div>
        )}

        {/* Child Products (non-variant children via product_relations) */}
        {childProducts.length > 0 && (
          <div className="mt-10">
            <Separator className="mb-8" />
            <h2 className="text-xl font-bold mb-5">Included Components</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {childProducts.map((p: any) => (
                <Link key={p.id} to={`${basePath}/product/${p.id}`} className="group">
                  <div className="aspect-square rounded-xl overflow-hidden bg-muted border mb-2.5">
                    {p.images?.[0] ? (
                      <img src={getImageUrl(p.images[0])} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No image</div>
                    )}
                  </div>
                  <h3 className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">{p.title}</h3>
                  <span className="text-sm font-bold">${Number(p.price).toFixed(2)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Cross-sells / Related Products */}
        {allRelated.length > 0 && (
          <div className="mt-12">
            <Separator className="mb-8" />
            <h2 className="text-xl font-bold mb-5">{crossSells.length > 0 ? "Frequently Bought Together" : "You May Also Like"}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {allRelated.map((p: any) => (
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

        {/* Recently Viewed */}
        {(() => {
          const recentItems = getRecent(product.id, 4);
          if (recentItems.length === 0) return null;
          return (
            <div className="mt-12">
              <Separator className="mb-8" />
              <h2 className="text-xl font-bold mb-5">Recently Viewed</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {recentItems.map((p) => (
                  <Link key={p.id} to={`${basePath}/product/${p.id}`} className="group">
                    <div className="aspect-square rounded-xl overflow-hidden bg-muted border mb-2.5">
                      {p.image ? (
                        <img src={getImageUrl(p.image)} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No image</div>
                      )}
                    </div>
                    <h3 className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">{p.title}</h3>
                    <p className="text-sm font-bold mt-0.5">${Number(p.price).toFixed(2)}</p>
                  </Link>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Reviews */}
        {store && (
          <div className="mt-12">
            <Separator className="mb-8" />
            <ProductReviews productId={product.id} storeId={store.id} />
          </div>
        )}
      </div>
      {lightboxOpen && images.length > 0 && (
        <ImageLightbox
          images={images}
          currentIndex={selectedImage}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setSelectedImage}
          getImageUrl={getImageUrl}
        />
      )}
      <AddToCartPopup
        open={cartPopupOpen}
        onOpenChange={setCartPopupOpen}
        item={cartPopupItem}
        cartTotal={cartTotal}
        cartItemCount={cartItemCount}
        basePath={basePath}
      />
    </StorefrontLayout>
  );
}
