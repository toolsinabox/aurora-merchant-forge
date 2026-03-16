import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { ThemedStorefrontLayout as StorefrontLayout } from "@/components/storefront/ThemedStorefrontLayout";
import { useCompare } from "@/contexts/CompareContext";
import { Button } from "@/components/ui/button";
import { X, ArrowLeft } from "lucide-react";
import { useStoreSlug, resolveStoreBySlug } from "@/lib/subdomain";
import { supabase } from "@/integrations/supabase/client";
import { useActiveTheme, findMainThemeFile, buildIncludesMap } from "@/hooks/use-active-theme";
import { renderTemplate, type TemplateContext } from "@/lib/base-template-engine";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const getImageUrl = (path: string) => path?.startsWith("http") ? path : `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;

export default function StorefrontCompare() {
  const { storeSlug: paramSlug } = useParams();
  const { basePath, storeSlug } = useStoreSlug(paramSlug);
  const { items, removeItem, clearAll } = useCompare();
  const [store, setStore] = useState<any>(null);

  useEffect(() => {
    if (!storeSlug) return;
    resolveStoreBySlug(storeSlug, supabase).then((s) => { if (s) setStore(s); });
  }, [storeSlug]);

  const { data: activeTheme } = useActiveTheme(store?.id);

  const themeHtml = useMemo(() => {
    if (!activeTheme || !store || items.length === 0) return null;
    const templateFile = findMainThemeFile(activeTheme, "compare") || findMainThemeFile(activeTheme, "product-compare");
    if (!templateFile?.content) return null;
    const themeFilesMap: Record<string, string> = {};
    activeTheme.files.forEach(f => { themeFilesMap[f.file_path] = f.content || ""; });
    const themeAssetBaseUrl = `${SUPABASE_URL}/storage/v1/object/public/theme-assets/${store.id}`;
    const ctx: TemplateContext = {
      store, basePath, pageType: "compare",
      products: items,
      themeFiles: themeFilesMap, themeAssetBaseUrl,
      includes: buildIncludesMap(activeTheme),
      content: { title: "Compare Products" },
    };
    let html = renderTemplate(templateFile.content, ctx);
    html = html.replace(/(src|href)="(?!https?:\/\/|\/\/|\/|#|data:)([^"]+)"/gi, (_, attr, path) => `${attr}="${themeAssetBaseUrl}/${path}"`);
    return html;
  }, [activeTheme, store, basePath, items]);

  const rows = [
    { label: "Price", render: (p: any) => `$${Number(p.price).toFixed(2)}` },
    { label: "Original Price", render: (p: any) => p.compare_at_price ? `$${Number(p.compare_at_price).toFixed(2)}` : "—" },
    { label: "SKU", render: (p: any) => p.sku || "—" },
    { label: "Description", render: (p: any) => p.description ? (p.description.length > 120 ? p.description.slice(0, 120) + "..." : p.description) : "—" },
  ];

  if (themeHtml) {
    return (
      <StorefrontLayout storeName={store?.name}>
        <div dangerouslySetInnerHTML={{ __html: themeHtml }} />
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout storeName={store?.name}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to={`${basePath}/products`}>
              <Button variant="ghost" size="icon" className="h-9 w-9"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <h1 className="text-2xl font-bold">Compare Products</h1>
            <span className="text-sm text-muted-foreground">({items.length}/4)</span>
          </div>
          {items.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAll}>Clear All</Button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">No products selected for comparison.</p>
            <Link to={`${basePath}/products`}>
              <Button>Browse Products</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-sm font-medium text-muted-foreground p-3 w-32 border-b" />
                  {items.map((p) => (
                    <th key={p.id} className="p-3 border-b min-w-[200px]">
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute -top-1 -right-1 h-6 w-6"
                          onClick={() => removeItem(p.id)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                        <Link to={`${basePath}/product/${p.id}`}>
                          <div className="aspect-square w-full max-w-[160px] mx-auto rounded-lg overflow-hidden bg-muted border mb-3">
                            {p.images?.[0] ? (
                              <img src={getImageUrl(p.images[0])} alt={p.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No image</div>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-center hover:text-primary transition-colors line-clamp-2">{p.title}</p>
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label} className="border-b">
                    <td className="p-3 text-sm font-medium text-muted-foreground">{row.label}</td>
                    {items.map((p) => (
                      <td key={p.id} className="p-3 text-sm">{row.render(p)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </StorefrontLayout>
  );
}
