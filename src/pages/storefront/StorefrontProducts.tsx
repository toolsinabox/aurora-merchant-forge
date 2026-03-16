import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ThemedStorefrontLayout as StorefrontLayout } from "@/components/storefront/ThemedStorefrontLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Search, GitCompareArrows, SlidersHorizontal, X, ShoppingCart, Heart, Eye, Loader2 } from "lucide-react";
import { useStoreSlug, resolveStoreBySlug } from "@/lib/subdomain";
import { useCompare } from "@/contexts/CompareContext";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { toast } from "sonner";
import { ProductQuickView } from "@/components/storefront/ProductQuickView";
import { useActiveTheme, findMainThemeFile, buildIncludesMap } from "@/hooks/use-active-theme";
import { renderTemplate, type TemplateContext } from "@/lib/base-template-engine";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const getImageUrl = (path: string) => path?.startsWith("http") ? path : `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;

type SpecFilter = Record<string, string[]>;

const PAGE_SIZES = [12, 24, 48];

function ProductCard({ p, basePath, store, onQuickView }: { p: any; basePath: string; store: any; onQuickView: (product: any) => void }) {
  const { items: compareItems, addItem: addCompare, removeItem: removeCompare, isComparing } = useCompare();
  const { addItem } = useCart();
  const { toggleItem, isWishlisted } = useWishlist();
  const comparing = isComparing(p.id);
  const wishlisted = isWishlisted(p.id);
  const now = new Date();
  const promoActive = p.promo_price && (!p.promo_start || new Date(p.promo_start) <= now) && (!p.promo_end || new Date(p.promo_end) >= now);
  const displayPrice = promoActive ? p.promo_price : p.price;

  return (
    <div key={p.id} className="group relative card-hover rounded-xl border bg-card overflow-hidden">
      <Link to={`${basePath}/product/${p.id}`}>
        <div className="aspect-square overflow-hidden bg-muted relative">
          {p.images?.[0] ? (
            <img src={getImageUrl(p.images[0])} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No image</div>
          )}
          {promoActive && p.promo_tag && (
            <Badge className="absolute top-2.5 left-2.5 bg-destructive text-destructive-foreground text-2xs shadow-sm">{p.promo_tag}</Badge>
          )}
        </div>
        <div className="p-3">
          {p.brand && <p className="text-2xs text-muted-foreground uppercase tracking-wide">{p.brand}</p>}
          <h3 className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">{p.title}</h3>
          <div className="flex items-baseline gap-1.5 mt-1">
            <p className="text-sm font-semibold">${Number(displayPrice).toFixed(2)}</p>
            {promoActive && <p className="text-xs text-muted-foreground line-through">${Number(p.price).toFixed(2)}</p>}
            {!promoActive && p.compare_at_price && p.compare_at_price > p.price && (
              <p className="text-xs text-muted-foreground line-through">${Number(p.compare_at_price).toFixed(2)}</p>
            )}
          </div>
        </div>
      </Link>

      {/* Action buttons overlay */}
      <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 rounded-full shadow-md backdrop-blur-sm bg-card/80"
          title="Quick View"
          onClick={(e) => {
            e.preventDefault();
            onQuickView(p);
          }}
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 rounded-full shadow-md backdrop-blur-sm bg-card/80"
          onClick={(e) => {
            e.preventDefault();
            toggleItem(p.id, store?.id);
          }}
        >
          <Heart className={`h-3.5 w-3.5 ${wishlisted ? "fill-destructive text-destructive" : ""}`} />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 rounded-full shadow-md backdrop-blur-sm bg-card/80"
          onClick={(e) => {
            e.preventDefault();
            addItem({
              product_id: p.id,
              title: p.title,
              price: Number(displayPrice),
              image: p.images?.[0] ? getImageUrl(p.images[0]) : undefined,
              sku: p.sku,
            });
            toast.success("Added to cart");
          }}
        >
          <ShoppingCart className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant={comparing ? "default" : "secondary"}
          size="icon"
          className="h-8 w-8 rounded-full shadow-md backdrop-blur-sm bg-card/80"
          onClick={(e) => {
            e.preventDefault();
            comparing ? removeCompare(p.id) : addCompare({
              id: p.id, title: p.title, price: p.price,
              compare_at_price: p.compare_at_price, images: p.images,
              description: p.description, sku: p.sku,
            });
          }}
        >
          <GitCompareArrows className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function FilterSidebar({ brands, brandFilter, setBrandFilter, specOptions, specFilters, toggleSpecFilter, priceRange, setPriceRange, maxPrice }: any) {
  return (
    <div className="space-y-6">
      {/* Price Range */}
      {maxPrice > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Price Range</h3>
          <Slider
            min={0}
            max={maxPrice}
            step={1}
            value={priceRange}
            onValueChange={setPriceRange}
            className="mb-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>${priceRange[0]}</span>
            <span>${priceRange[1]}</span>
          </div>
        </div>
      )}

      {/* Brand filter */}
      {brands.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Brand</h3>
          <div className="space-y-1.5">
            {brands.map((b: string) => (
              <label key={b} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={brandFilter.includes(b)}
                  onCheckedChange={() => setBrandFilter((prev: string[]) => prev.includes(b) ? prev.filter((x: string) => x !== b) : [...prev, b])}
                />
                {b}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Specifics filters */}
      {Object.entries(specOptions).sort().map(([name, values]: [string, any]) => (
        <div key={name}>
          <h3 className="text-sm font-semibold mb-2">{name}</h3>
          <div className="space-y-1.5">
            {values.sort().map((v: string) => (
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
  );
}

export default function StorefrontProducts() {
  const { storeSlug: paramSlug } = useParams();
  const { storeSlug, basePath } = useStoreSlug(paramSlug);
  const { items: compareItems } = useCompare();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [allSpecifics, setAllSpecifics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("q") || "");
  const [category, setCategory] = useState(() => searchParams.get("category") || "all");
  const [sort, setSort] = useState("newest");
  const [brandFilter, setBrandFilter] = useState<string[]>([]);
  const [specFilters, setSpecFilters] = useState<SpecFilter>({});
  const [showFilters, setShowFilters] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<any>(null);
  const [pageSize] = useState(PAGE_SIZES[1]); // 24 items per batch

  // Price range
  const maxPrice = useMemo(() => Math.ceil(Math.max(...products.map(p => Number(p.price)), 0)), [products]);
  const [priceRange, setPriceRange] = useState<number[]>([0, 0]);

  useEffect(() => {
    if (maxPrice > 0 && priceRange[1] === 0) setPriceRange([0, maxPrice]);
  }, [maxPrice]);

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

  const specOptions: Record<string, string[]> = {};
  allSpecifics.forEach((s: any) => {
    if (!specOptions[s.name]) specOptions[s.name] = [];
    if (!specOptions[s.name].includes(s.value)) specOptions[s.name].push(s.value);
  });

  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))].sort();

  const specProductIds = new Map<string, Set<string>>();
  Object.entries(specFilters).forEach(([name, values]) => {
    if (values.length === 0) return;
    const ids = new Set<string>();
    allSpecifics.filter(s => s.name === name && values.includes(s.value)).forEach(s => ids.add(s.product_id));
    specProductIds.set(name, ids);
  });

  const filtered = useMemo(() => {
    return products
      .filter((p) => {
        const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
          (p.search_keywords && p.search_keywords.toLowerCase().includes(search.toLowerCase()));
        const matchCat = category === "all" || p.category_id === category || categories.find((c: any) => c.slug === category)?.id === p.category_id;
        const matchBrand = brandFilter.length === 0 || brandFilter.includes(p.brand);
        const matchPrice = Number(p.price) >= priceRange[0] && Number(p.price) <= priceRange[1];
        let matchSpecs = true;
        specProductIds.forEach((ids) => {
          if (!ids.has(p.id)) matchSpecs = false;
        });
        return matchSearch && matchCat && matchBrand && matchSpecs && matchPrice;
      })
      .sort((a, b) => {
        if (sort === "price-asc") return a.price - b.price;
        if (sort === "price-desc") return b.price - a.price;
        if (sort === "name") return a.title.localeCompare(b.title);
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [products, search, category, brandFilter, specFilters, sort, priceRange, allSpecifics]);

  // Reset visible count when filters change
  const [visibleCount, setVisibleCount] = useState(pageSize);
  useEffect(() => { setVisibleCount(pageSize); }, [search, category, brandFilter, specFilters, sort, priceRange, pageSize]);

  const paginated = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  // Infinite scroll observer
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        setLoadingMore(true);
        setTimeout(() => {
          setVisibleCount((prev) => prev + pageSize);
          setLoadingMore(false);
        }, 300);
      }
    }, { rootMargin: "200px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, pageSize, visibleCount]);

  const activeFilterCount = brandFilter.length + Object.values(specFilters).reduce((sum, v) => sum + v.length, 0) +
    (priceRange[0] > 0 || priceRange[1] < maxPrice ? 1 : 0);

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
    setPriceRange([0, maxPrice]);
  };

  const { data: activeTheme } = useActiveTheme(store?.id);

  const themeHtml = useMemo(() => {
    if (!activeTheme || !store) return null;
    const templateFile = findMainThemeFile(activeTheme, "products") || findMainThemeFile(activeTheme, "category") || findMainThemeFile(activeTheme, "product-list");
    if (!templateFile?.content) return null;
    const themeFilesMap: Record<string, string> = {};
    activeTheme.files.forEach(f => { themeFilesMap[f.file_path] = f.content || ""; });
    const themeAssetBaseUrl = `${SUPABASE_URL}/storage/v1/object/public/theme-assets/${store.id}`;
    const ctx: TemplateContext = {
      store, basePath, pageType: "category", products,
      themeFiles: themeFilesMap, themeAssetBaseUrl,
      includes: buildIncludesMap(activeTheme),
      categories,
      content: { title: "All Products" },
    };
    let html = renderTemplate(templateFile.content, ctx);
    html = html.replace(/(src|href)="(?!https?:\/\/|\/\/|\/|#|data:)([^"]+)"/gi, (_, attr, path) => `${attr}="${themeAssetBaseUrl}/${path}"`);
    return html;
  }, [activeTheme, store, basePath, products, categories]);

  if (!loading && themeHtml) {
    return (
      <StorefrontLayout storeName={store?.name}>
        <div dangerouslySetInnerHTML={{ __html: themeHtml }} />
      </StorefrontLayout>
    );
  }

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

  const hasFilters = brands.length > 0 || Object.keys(specOptions).length > 0 || maxPrice > 0;

  const filterContent = (
    <FilterSidebar
      brands={brands}
      brandFilter={brandFilter}
      setBrandFilter={setBrandFilter}
      specOptions={specOptions}
      specFilters={specFilters}
      toggleSpecFilter={toggleSpecFilter}
      priceRange={priceRange}
      setPriceRange={setPriceRange}
      maxPrice={maxPrice}
    />
  );

  return (
    <StorefrontLayout storeName={store?.name}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">All Products</h1>

        {/* Top bar */}
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

          {/* Desktop filter toggle */}
          {hasFilters && (
            <Button variant="outline" size="sm" className="h-10 gap-1.5 hidden sm:flex" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5">{activeFilterCount}</Badge>}
            </Button>
          )}

          {/* Mobile filter sheet */}
          {hasFilters && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-10 gap-1.5 sm:hidden">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {activeFilterCount > 0 && <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5">{activeFilterCount}</Badge>}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  {filterContent}
                  {activeFilterCount > 0 && (
                    <Button variant="outline" size="sm" className="w-full mt-4" onClick={clearAllFilters}>Clear all filters</Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>

        {/* Active filter badges + result count */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm text-muted-foreground">{filtered.length} product{filtered.length !== 1 ? "s" : ""}</span>
          {activeFilterCount > 0 && (
            <>
              <span className="text-muted-foreground">·</span>
              {brandFilter.map(b => (
                <Badge key={b} variant="secondary" className="gap-1 cursor-pointer" onClick={() => setBrandFilter(prev => prev.filter(x => x !== b))}>
                  Brand: {b} <X className="h-3 w-3" />
                </Badge>
              ))}
              {priceRange[0] > 0 || priceRange[1] < maxPrice ? (
                <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setPriceRange([0, maxPrice])}>
                  ${priceRange[0]}–${priceRange[1]} <X className="h-3 w-3" />
                </Badge>
              ) : null}
              {Object.entries(specFilters).flatMap(([name, values]) =>
                values.map(v => (
                  <Badge key={`${name}-${v}`} variant="secondary" className="gap-1 cursor-pointer" onClick={() => toggleSpecFilter(name, v)}>
                    {name}: {v} <X className="h-3 w-3" />
                  </Badge>
                ))
              )}
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={clearAllFilters}>Clear all</Button>
            </>
          )}
        </div>

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
          {/* Desktop filter sidebar */}
          {showFilters && hasFilters && (
            <div className="w-56 flex-shrink-0 hidden sm:block">
              {filterContent}
            </div>
          )}

          {/* Grid */}
          <div className="flex-1">
            {paginated.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {paginated.map((p) => (
                    <ProductCard key={p.id} p={p} basePath={basePath} store={store} onQuickView={setQuickViewProduct} />
                  ))}
                </div>

                {/* Infinite scroll sentinel */}
                <div ref={sentinelRef} className="py-4 flex justify-center">
                  {loadingMore && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                  {!hasMore && filtered.length > pageSize && (
                    <p className="text-xs text-muted-foreground">Showing all {filtered.length} products</p>
                  )}
                </div>
              </>
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
      <ProductQuickView
        product={quickViewProduct}
        open={!!quickViewProduct}
        onOpenChange={(open) => { if (!open) setQuickViewProduct(null); }}
        basePath={basePath}
        storeId={store?.id}
      />
    </StorefrontLayout>
  );
}
