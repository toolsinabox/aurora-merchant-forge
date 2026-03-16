import { useEffect, useState, useMemo } from "react";
import { SEOHead } from "@/components/storefront/SEOHead";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ThemedStorefrontLayout as StorefrontLayout } from "@/components/storefront/ThemedStorefrontLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useStoreSlug, resolveStoreBySlug } from "@/lib/subdomain";
import { Calendar, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { useActiveTheme, findThemeFile, findMainThemeFile, buildIncludesMap } from "@/hooks/use-active-theme";
import { renderTemplate, type TemplateContext } from "@/lib/base-template-engine";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export default function StorefrontBlog() {
  const { storeSlug: paramSlug } = useParams();
  const { storeSlug, basePath } = useStoreSlug(paramSlug);
  const [store, setStore] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Theme hooks (must be before early returns) ──
  const { data: theme } = useActiveTheme(store?.id);

  const blogTemplate = useMemo(() => {
    if (!theme) return null;
    return findThemeFile(theme, "templates", "blog")
      || findMainThemeFile(theme, "blog")
      || findThemeFile(theme, "templates", "news");
  }, [theme]);

  const themeFiles = useMemo(() => {
    if (!theme) return {};
    const map: Record<string, string> = {};
    for (const f of theme.files) {
      map[f.file_path] = f.content || "";
      map[`${f.folder}/${f.file_name}`] = f.content || "";
      map[f.file_name] = f.content || "";
      const parts = f.file_path.split("/");
      for (let i = 0; i < parts.length; i++) {
        map[parts.slice(i).join("/")] = f.content || "";
      }
    }
    return map;
  }, [theme]);

  const themeAssetBaseUrl = useMemo(() => {
    if (!store?.id || !theme?.id) return "";
    return `${SUPABASE_URL}/storage/v1/object/public/theme-assets/${store.id}/${theme.id}`;
  }, [store?.id, theme?.id]);

  useEffect(() => {
    async function load() {
      if (!storeSlug) { setLoading(false); return; }
      const found = await resolveStoreBySlug(storeSlug, supabase);
      if (!found) { setLoading(false); return; }
      setStore(found);

      const { data } = await supabase
        .from("content_pages")
        .select("*")
        .eq("store_id", found.id)
        .eq("page_type", "blog")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      setPosts(data || []);
      setLoading(false);
    }
    load();
  }, [storeSlug]);

  if (loading) {
    return (
      <StorefrontLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
          </div>
        </div>
      </StorefrontLayout>
    );
  }

  if (blogTemplate?.content && theme && store) {
    const includes = buildIncludesMap(theme);
    const blogCtx: TemplateContext = {
      products: posts.map(p => ({
        ...p,
        URL: `${basePath}/page/${p.slug}`,
        url: `${basePath}/page/${p.slug}`,
        image_url: p.featured_image || "",
        date: p.published_at ? format(new Date(p.published_at), "MMM d, yyyy") : "",
        excerpt: p.seo_description || "",
      })),
      store: { name: store.name, ...store },
      includes,
      themeFiles,
      themeAssetBaseUrl,
      basePath: basePath || "",
      pageType: "blog",
    };

    let rendered = renderTemplate(blogTemplate.content, blogCtx);

    if (themeAssetBaseUrl) {
      const assetExt = /\.(png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)(\?[^"']*)?/i;
      rendered = rendered.replace(/(src|href)=["']((?!https?:\/\/|\/\/|data:|#|mailto:|javascript:|\{)[^"']+)["']/gi, (match, attr, path) => {
        if (!assetExt.test(path)) return match;
        if (/^(\/placeholder\.|\/assets\/|\/favicon)/i.test(path)) return match;
        const cleanPath = path.replace(/^\/+/, "");
        return `${attr}="${themeAssetBaseUrl}/${cleanPath}"`;
      });
    }

    return (
      <StorefrontLayout storeName={store.name} extraContext={blogCtx}>
        <SEOHead title={`Blog — ${store.name}`} description={`Latest news and articles from ${store.name}`} />
        <div dangerouslySetInnerHTML={{ __html: rendered }} />
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout storeName={store?.name}>
      <SEOHead title={`Blog — ${store?.name || "Store"}`} description={`Latest news and articles from ${store?.name || "our store"}`} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-8">Blog</h1>

        {posts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>No blog posts yet. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`${basePath}/page/${post.slug}`}
                className="block group"
              >
                <article className="flex gap-5 p-5 rounded-xl border bg-card hover:shadow-md transition-shadow">
                  {post.featured_image && (
                    <div className="w-40 h-28 rounded-lg overflow-hidden bg-muted shrink-0 hidden sm:block">
                      <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-2 mb-1">
                      {post.title}
                    </h2>
                    {post.seo_description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.seo_description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {post.published_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(post.published_at), "MMM d, yyyy")}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-primary font-medium">
                        Read more <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </StorefrontLayout>
  );
}
