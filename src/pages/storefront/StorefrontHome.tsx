import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StorefrontLayout } from "@/components/storefront/StorefrontLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Truck, ShieldCheck, RotateCcw, ShoppingCart, Heart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { toast } from "sonner";
import { useStoreSlug, resolveStoreBySlug } from "@/lib/subdomain";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const getImageUrl = (path: string) => path?.startsWith("http") ? path : `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;

export default function StorefrontHome() {
  const { storeSlug: paramSlug } = useParams();
  const { storeSlug, basePath } = useStoreSlug(paramSlug);
  const { addItem } = useCart();
  const { toggleItem, isWishlisted } = useWishlist();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!storeSlug) { setLoading(false); return; }
      const found = await resolveStoreBySlug(storeSlug, supabase);
      if (!found) { setLoading(false); return; }
      setStore(found);

      const [prodsRes, catsRes] = await Promise.all([
        supabase
          .from("products")
          .select("*")
          .eq("store_id", found.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(12),
        supabase
          .from("categories")
          .select("*")
          .eq("store_id", found.id)
          .order("sort_order")
          .limit(6),
      ]);
      setProducts(prodsRes.data || []);
      setCategories(catsRes.data || []);
      setLoading(false);
    }
    load();
  }, [storeSlug]);

  if (loading) {
    return (
      <StorefrontLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Skeleton className="h-[340px] w-full rounded-2xl mb-10" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
          </div>
        </div>
      </StorefrontLayout>
    );
  }

  if (!store) {
    return (
      <StorefrontLayout>
        <div className="max-w-7xl mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold mb-2">Store not found</h1>
          <p className="text-muted-foreground">The store you're looking for doesn't exist.</p>
        </div>
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout storeName={store.name}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground my-6 sm:my-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_60%)]" />
          <div className="relative px-8 py-14 sm:px-12 sm:py-20 lg:py-24 max-w-2xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-4">
              Welcome to {store.name}
            </h1>
            <p className="text-primary-foreground/80 text-base sm:text-lg max-w-lg mb-8 leading-relaxed">
              Discover our curated collection of quality products, crafted with care and delivered to your doorstep.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to={`${basePath}/products`}>
                <Button size="lg" variant="secondary" className="gap-2 font-semibold">
                  Shop All Products <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-8 sm:my-10">
          {[
            { icon: Truck, label: "Free Shipping", desc: "On qualifying orders" },
            { icon: ShieldCheck, label: "Secure Checkout", desc: "100% encrypted" },
            { icon: RotateCcw, label: "Easy Returns", desc: "Hassle-free process" },
            { icon: Star, label: "Quality Promise", desc: "Curated products" },
          ].map((badge) => (
            <div key={badge.label} className="flex flex-col items-center text-center p-4 rounded-xl bg-card border hover:shadow-sm transition-shadow">
              <badge.icon className="h-6 w-6 text-primary mb-2" />
              <p className="text-sm font-semibold">{badge.label}</p>
              <p className="text-xs text-muted-foreground">{badge.desc}</p>
            </div>
          ))}
        </section>

        {/* Categories (if any) */}
        {categories.length > 0 && (
          <section className="my-8 sm:my-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">Shop by Category</h2>
              <Link to={`${basePath}/products`} className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {categories.map((cat: any) => (
                <Link
                  key={cat.id}
                  to={`${basePath}/products`}
                  className="group p-5 rounded-xl border bg-card text-center hover:border-primary/30 hover:shadow-md transition-all"
                >
                  <p className="text-sm font-semibold group-hover:text-primary transition-colors">{cat.name}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Featured Products */}
        {products.length > 0 && (
          <section className="my-8 sm:my-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">Featured Products</h2>
              <Link to={`${basePath}/products`} className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {products.map((p) => (
                <Link key={p.id} to={`${basePath}/product/${p.id}`} className="group">
                  <div className="aspect-square rounded-xl overflow-hidden bg-muted border mb-3 relative">
                    {p.images?.[0] ? (
                      <img
                        src={getImageUrl(p.images[0])}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No image</div>
                    )}
                    {p.compare_at_price && p.compare_at_price > p.price && (
                      <span className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-semibold px-2 py-0.5 rounded-md">
                        Sale
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2 leading-snug">{p.title}</h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-sm font-bold">${Number(p.price).toFixed(2)}</p>
                    {p.compare_at_price && p.compare_at_price > p.price && (
                      <p className="text-xs text-muted-foreground line-through">${Number(p.compare_at_price).toFixed(2)}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {products.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">No products available yet. Check back soon!</p>
          </div>
        )}

        {/* Spacer before footer */}
        <div className="h-8" />
      </div>
    </StorefrontLayout>
  );
}
