import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StorefrontLayout } from "@/components/storefront/StorefrontLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, GitCompareArrows } from "lucide-react";
import { useStoreSlug, resolveStoreBySlug } from "@/lib/subdomain";
import { useCompare } from "@/contexts/CompareContext";
import { useStoreSlug, resolveStoreBySlug } from "@/lib/subdomain";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const getImageUrl = (path: string) => path?.startsWith("http") ? path : `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;

export default function StorefrontProducts() {
  const { storeSlug: paramSlug } = useParams();
  const { storeSlug, basePath } = useStoreSlug(paramSlug);
  const { items: compareItems, addItem: addCompare, removeItem: removeCompare, isComparing } = useCompare();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    async function load() {
      if (!storeSlug) { setLoading(false); return; }
      const found = await resolveStoreBySlug(storeSlug, supabase);
      if (!found) { setLoading(false); return; }
      setStore(found);

      const [prodsRes, catsRes] = await Promise.all([
        supabase.from("products").select("*").eq("store_id", found.id).eq("status", "active").order("created_at", { ascending: false }),
        supabase.from("categories").select("*").eq("store_id", found.id).order("sort_order"),
      ]);
      setProducts(prodsRes.data || []);
      setCategories(catsRes.data || []);
      setLoading(false);
    }
    load();
  }, [storeSlug]);

  const filtered = products
    .filter((p) => {
      const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === "all" || p.category_id === category;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "name") return a.title.localeCompare(b.title);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  if (loading) {
    return (
      <StorefrontLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg" />)}
          </div>
        </div>
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout storeName={store?.name}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">All Products</h1>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10" />
          </div>
          {categories.length > 0 && (
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-44 h-10"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-40 h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((p) => (
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
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <p>No products found.</p>
          </div>
        )}
      </div>
    </StorefrontLayout>
  );
}
