import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StorefrontLayout } from "@/components/storefront/StorefrontLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useStoreSlug, resolveStoreBySlug } from "@/lib/subdomain";

export default function StorefrontContentPage() {
  const { storeSlug: paramSlug, pageSlug } = useParams();
  const { storeSlug } = useStoreSlug(paramSlug);
  const [store, setStore] = useState<any>(null);
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!storeSlug || !pageSlug) { setLoading(false); return; }
      const found = await resolveStoreBySlug(storeSlug, supabase);
      if (found) {
        setStore(found);
        const { data } = await supabase
          .from("content_pages")
          .select("*")
          .eq("store_id", found.id)
          .eq("slug", pageSlug)
          .eq("is_published", true)
          .maybeSingle();
        setPage(data);
      }
      setLoading(false);
    }
    load();
  }, [storeSlug, pageSlug]);

  if (loading) {
    return (
      <StorefrontLayout storeName={store?.name}>
        <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      </StorefrontLayout>
    );
  }

  if (!page) {
    return (
      <StorefrontLayout storeName={store?.name}>
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold mb-2">Page not found</h1>
          <p className="text-muted-foreground">The page you're looking for doesn't exist or isn't published.</p>
        </div>
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout storeName={store?.name}>
      {page.seo_title && <title>{page.seo_title}</title>}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {page.featured_image && (
          <img src={page.featured_image} alt={page.title} className="w-full rounded-xl mb-8 max-h-[400px] object-cover" />
        )}
        <h1 className="text-3xl sm:text-4xl font-bold mb-6">{page.title}</h1>
        <div
          className="prose prose-neutral dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: page.content || "" }}
        />
      </div>
    </StorefrontLayout>
  );
}
