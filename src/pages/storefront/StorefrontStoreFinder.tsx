import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { ThemedStorefrontLayout as StorefrontLayout } from "@/components/storefront/ThemedStorefrontLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useStoreSlug, resolveStoreBySlug } from "@/lib/subdomain";
import { MapPin, Phone, Clock, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveTheme, findMainThemeFile, buildIncludesMap } from "@/hooks/use-active-theme";
import { renderTemplate, type TemplateContext } from "@/lib/base-template-engine";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export default function StorefrontStoreFinder() {
  const { storeSlug: paramSlug } = useParams();
  const { storeSlug } = useStoreSlug(paramSlug);
  const [store, setStore] = useState<any>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!storeSlug) return;
    resolveStoreBySlug(storeSlug, supabase).then(async (s) => {
      if (!s) { setLoading(false); return; }
      setStore(s);
      const { data } = await supabase
        .from("inventory_locations")
        .select("*")
        .eq("store_id", s.id)
        .order("name");
      setLocations(data || []);
      setLoading(false);
    });
  }, [storeSlug]);

  const { data: activeTheme } = useActiveTheme(store?.id);

  const themeHtml = useMemo(() => {
    if (!activeTheme || !store) return null;

    const templateFile =
      findMainThemeFile(activeTheme, "store-finder") ||
      findMainThemeFile(activeTheme, "store_finder") ||
      findMainThemeFile(activeTheme, "locations");
    if (!templateFile?.content) return null;

    const themeFilesMap: Record<string, string> = {};
    activeTheme.files.forEach(f => { themeFilesMap[f.file_path] = f.content || ""; });
    const themeAssetBaseUrl = `${SUPABASE_URL}/storage/v1/object/public/theme-assets/${store.id}`;
    const basePath = storeSlug ? `/store/${storeSlug}` : "";

    const ctx: TemplateContext = {
      store,
      locations,
      basePath,
      pageType: "store-finder",
      themeFiles: themeFilesMap,
      themeAssetBaseUrl,
      includes: buildIncludesMap(activeTheme),
      content: { title: "Store Finder", description: "Find a store or warehouse location near you" },
    };

    let html = renderTemplate(templateFile.content, ctx);
    html = html.replace(/(src|href)="(?!https?:\/\/|\/\/|\/|#|data:)([^"]+)"/gi,
      (_, attr, path) => `${attr}="${themeAssetBaseUrl}/${path}"`);
    return html;
  }, [activeTheme, store, locations, storeSlug]);

  const filtered = locations.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return l.name.toLowerCase().includes(q) || (l.address || "").toLowerCase().includes(q);
  });

  if (themeHtml && !loading) {
    return (
      <StorefrontLayout storeName={store?.name}>
        <div dangerouslySetInnerHTML={{ __html: themeHtml }} />
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout storeName={store?.name}>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Store Finder</h1>
          <p className="text-muted-foreground mt-2">Find a store or warehouse location near you</p>
        </div>

        <div className="relative max-w-md mx-auto mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <MapPin className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No locations found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((loc) => (
              <Card key={loc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-lg">{loc.name}</h3>
                    <Badge variant="secondary" className="text-xs capitalize">{loc.type}</Badge>
                  </div>
                  {loc.address && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{loc.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Mon-Fri 9am-5pm
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </StorefrontLayout>
  );
}
