import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StorefrontLayout } from "@/components/storefront/StorefrontLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, GitCompareArrows, SlidersHorizontal, X } from "lucide-react";
import { useStoreSlug, resolveStoreBySlug } from "@/lib/subdomain";
import { useCompare } from "@/contexts/CompareContext";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const getImageUrl = (path: string) => path?.startsWith("http") ? path : `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;

type SpecFilter = Record<string, string[]>; // { "Colour": ["Red", "Blue"], "Size": ["M"] }

export default function StorefrontProducts() {
  const { storeSlug: paramSlug } = useParams();
  const { storeSlug, basePath } = useStoreSlug(paramSlug);
  const { items: compareItems, addItem: addCompare, removeItem: removeCompare, isComparing } = useCompare();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [allSpecifics, setAllSpecifics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");
  const [brandFilter, setBrandFilter] = useState<string[]>([]);
  const [specFilters, setSpecFilters] = useState<SpecFilter>({});
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function load() {
      if (!storeSlug) { setLoading(false); return; }
      const found = await resolveStoreBySlug(storeSlug, supabase);
      if (!found) { setLoading(false); return; }
      setStore(found);

      const [prodsRes, catsRes, specsRes] = await Promise.all([
        supabase.from("products").select("*").eq("store_id", found.id).eq("status", "active").order("created_at", { ascending: false }),
        supabase.from("categories").select("*").eq("store_id", found.id).order("sort_order"),
        supabase.from("product_specifics").select("*").eq("store_id", found.id),
      ]);
      setProducts(prodsRes.data || []);
      setCategories(catsRes.data || []);
      setAllSpecifics(specsRes.data || []);
      setLoading(false);
    }
    load();
  }, [storeSlug]);

  // Build filter options from specifics
  const specOptions: Record<string, string[]> = {};
  allSpecifics.forEach((s: any) => {
    if (!specOptions[s.name]) specOptions[s.name] = [];
    if (!specOptions[s.name].includes(s.value)) specOptions[s.name].push(s.value);
  });

  // Get unique brands
  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))].sort();

  // Build product ID sets that match each spec filter
  const specProductIds = new Map<string, Set<string>>();
  Object.entries(specFilters).forEach(([name, values]) => {
    if (values.length === 0) return;
    const ids = new Set<string>();
    allSpecifics.filter(s => s.name === name && values.includes(s.value)).forEach(s => ids.add(s.product_id));
    specProductIds.set(name, ids);
  });

  const filtered = products
    .filter((p) => {
      const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
        (p.search_keywords && p.search_keywords.toLowerCase().includes(search.toLowerCase()));
      const matchCat = category === "all" || p.category_id === category;
      const matchBrand = brandFilter.length === 0 || brandFilter.includes(p.brand);
      // Check all spec filters
      let matchSpecs = true;
      specProductIds.forEach((ids) => {
        if (!ids.has(p.id)) matchSpecs = false;
      });
      return matchSearch && matchCat && matchBrand && matchSpecs;
    })
    .sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "name") return a.title.localeCompare(b.title);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const activeFilterCount = brandFilter.length + Object.values(specFilters).reduce((sum, v) => sum + v.length, 0);

  const toggleSpecFilter = (name: string, value: string) => {
    setSpecFilters(prev => {
      const current = prev[name] || [];
      const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
      return { ...prev, [name]: next };
    });
  };

  const clearAllFilters = () => {
    setBrandFilter([]);
    setSpecFilters({});
    setCategory("all");
    setSearch("");
  };

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

  const hasFilters = brands.length > 0 || Object.keys(specOptions).length > 0;

  return (
    <StorefrontLayout storeName={store?.name}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">All Products</h1>

        {/* Top bar: search, category, sort, filter toggle */}
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
          {hasFilters && (
            <Button variant="outline" size="sm" className="h-10 gap-1.5" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5">{activeFilterCount}</Badge>}
            </Button>
          )}
        </div>

        {/* Active filter badges */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {brandFilter.map(b => (
              <Badge key={b} variant="secondary" className="gap-1 cursor-pointer" onClick={() => setBrandFilter(prev => prev.filter(x => x !== b))}>
                Brand: {b} <X className="h-3 w-3" />
              </Badge>
            ))}
            {Object.entries(specFilters).flatMap(([name, values]) =>
              values.map(v => (
                <Badge key={`${name}-${v}`} variant="secondary" className="gap-1 cursor-pointer" onClick={() => toggleSpecFilter(name, v)}>
                  {name}: {v} <X className="h-3 w-3" />
                </Badge>
              ))
            )}
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={clearAllFilters}>Clear all</Button>
          </div>
        )}

        {/* Compare bar */}
        {compareItems.length > 0 && (
          <div className="mb-6 p-3 rounded-lg border bg-card flex items-center justify-between">
            <p className="text-sm font-medium">{compareItems.length} product{compareItems.length > 1 ? "s" : ""} selected for comparison</p>
            <Link to={`${basePath}/compare`}>
              <Button size="sm" className="gap-1.5"><GitCompareArrows className="h-4 w-4" /> Compare Now</Button>
            </Link>
          </div>
        )}

        <div className="flex gap-6">
          {/* Filter sidebar */}
          {showFilters && hasFilters && (
            <div className="w-56 flex-shrink-0 space-y-6 hidden sm:block">
              {/* Brand filter */}
              {brands.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Brand</h3>
                  <div className="space-y-1.5">
                    {brands.map(b => (
                      <label key={b} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={brandFilter.includes(b)}
                          onCheckedChange={() => setBrandFilter(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b])}
                        />
                        {b}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Specifics filters */}
              {Object.entries(specOptions).sort().map(([name, values]) => (
                <div key={name}>
                  <h3 className="text-sm font-semibold mb-2">{name}</h3>
                  <div className="space-y-1.5">
                    {values.sort().map(v => (
                      <label key={v} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={(specFilters[name] || []).includes(v)}
                          onCheckedChange={() => toggleSpecFilter(name, v)}
                        />
                        {v}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Grid */}
          <div className="flex-1">
            {filtered.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filtered.map((p) => {
                  const comparing = isComparing(p.id);
                  const now = new Date();
                  const promoActive = p.promo_price && (!p.promo_start || new Date(p.promo_start) <= now) && (!p.promo_end || new Date(p.promo_end) >= now);
                  return (
                    <div key={p.id} className="group relative">
                      <Link to={`${basePath}/product/${p.id}`}>
                        <div className="aspect-square rounded-lg overflow-hidden bg-muted border mb-2.5 relative">
                          {p.images?.[0] ? (
                            <img src={getImageUrl(p.images[0])} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No image</div>
                          )}
                          {promoActive && p.promo_tag && (
                            <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-2xs">{p.promo_tag}</Badge>
                          )}
                        </div>
                        {p.brand && <p className="text-2xs text-muted-foreground uppercase tracking-wide">{p.brand}</p>}
                        <h3 className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">{p.title}</h3>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <p className="text-sm font-semibold">${Number(promoActive ? p.promo_price : p.price).toFixed(2)}</p>
                          {promoActive && <p className="text-xs text-muted-foreground line-through">${Number(p.price).toFixed(2)}</p>}
                          {!promoActive && p.compare_at_price && p.compare_at_price > p.price && (
                            <p className="text-xs text-muted-foreground line-through">${Number(p.compare_at_price).toFixed(2)}</p>
                          )}
                        </div>
                      </Link>
                      <Button
                        variant={comparing ? "default" : "outline"}
                        size="sm"
                        className="absolute top-2 right-2 h-7 text-2xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => comparing ? removeCompare(p.id) : addCompare({
                          id: p.id, title: p.title, price: p.price,
                          compare_at_price: p.compare_at_price, images: p.images,
                          description: p.description, sku: p.sku,
                        })}
                      >
                        <GitCompareArrows className="h-3 w-3" />
                        {comparing ? "Remove" : "Compare"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <p>No products found.</p>
                {activeFilterCount > 0 && (
                  <Button variant="link" onClick={clearAllFilters} className="mt-2">Clear all filters</Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
}
