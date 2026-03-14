import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const getImageUrl = (path: string) => path?.startsWith("http") ? path : `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;

interface Props {
  storeId: string;
  basePath: string;
  onClose?: () => void;
}

export function StorefrontSearch({ storeId, basePath, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase
        .from("products")
        .select("id, title, price, images, compare_at_price")
        .eq("store_id", storeId)
        .eq("status", "active")
        .ilike("title", `%${query.trim()}%`)
        .limit(8);
      setResults(data || []);
      setLoading(false);

      // Track search query for analytics
      supabase.from("search_queries" as any).insert({
        store_id: storeId,
        query: query.trim(),
        results_count: data?.length || 0,
      }).then(() => {});
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, storeId]);

  return (
    <div className="w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 pr-9 h-10"
        />
        {query && (
          <button onClick={() => { setQuery(""); onClose?.(); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {query.trim() && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-popover border rounded-lg shadow-lg z-50 max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="p-4 text-sm text-muted-foreground text-center">Searching...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">No products found for "{query}"</div>
          ) : (
            <div className="py-1">
              {results.map((p) => (
                <Link
                  key={p.id}
                  to={`${basePath}/product/${p.id}`}
                  onClick={() => { setQuery(""); onClose?.(); }}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors"
                >
                  <div className="h-10 w-10 rounded-md overflow-hidden bg-muted border flex-shrink-0">
                    {p.images?.[0] ? (
                      <img src={getImageUrl(p.images[0])} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">—</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.title}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-bold">${Number(p.price).toFixed(2)}</span>
                      {p.compare_at_price && p.compare_at_price > p.price && (
                        <span className="text-xs text-muted-foreground line-through">${Number(p.compare_at_price).toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
              <Link
                to={`${basePath}/products`}
                onClick={() => { setQuery(""); onClose?.(); }}
                className="block px-4 py-2.5 text-sm text-primary font-medium hover:bg-muted border-t text-center"
              >
                View all products →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
