import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StorefrontLayout } from "@/components/storefront/StorefrontLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useStoreSlug, resolveStoreBySlug } from "@/lib/subdomain";
import { Calendar, ArrowRight } from "lucide-react";
import { format } from "date-fns";

export default function StorefrontBlog() {
  const { storeSlug: paramSlug } = useParams();
  const { storeSlug, basePath } = useStoreSlug(paramSlug);
  const [store, setStore] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <StorefrontLayout storeName={store?.name}>
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
