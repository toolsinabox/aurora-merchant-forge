import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StorefrontLayout } from "@/components/storefront/StorefrontLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useStoreSlug, resolveStoreBySlug } from "@/lib/subdomain";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const getImageUrl = (path: string) => path?.startsWith("http") ? path : `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;

export default function StorefrontHome() {
  const { storeSlug: paramSlug } = useParams();
  const { storeSlug, basePath } = useStoreSlug(paramSlug);
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!storeSlug) { setLoading(false); return; }
      const found = await resolveStoreBySlug(storeSlug, supabase);
      if (!found) { setLoading(false); return; }
      setStore(found);

      const { data: prods } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", found.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(12);
      setProducts(prods || []);
      setLoading(false);
    }
    load();
  }, [storeSlug]);

  if (loading) {
    return (
      <StorefrontLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Skeleton className="h-48 w-full rounded-xl mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg" />)}
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border p-8 sm:p-12 mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">Welcome to {store.name}</h1>
          <p className="text-muted-foreground text-lg max-w-lg mb-6">Discover our curated collection of products.</p>
          <Link to={`${basePath}/products`}>
            <button className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition">
              Shop All Products
            </button>
          </Link>
        </div>

        {/* Featured products */}
        {products.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-5">Featured Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p) => (
                <Link key={p.id} to={`${basePath}/product/${p.id}`} className="group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted border mb-2.5">
                    {p.images?.[0] ? (
                      <img src={getImageUrl(p.images[0])} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No image</div>
                    )}
                  </div>
                  <h3 className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">{p.title}</h3>
                  <p className="text-sm font-semibold mt-0.5">${Number(p.price).toFixed(2)}</p>
                  {p.compare_at_price && p.compare_at_price > p.price && (
                    <p className="text-xs text-muted-foreground line-through">${Number(p.compare_at_price).toFixed(2)}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {products.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">No products available yet.</p>
          </div>
        )}
      </div>
    </StorefrontLayout>
  );
}
