import { useEffect, useState, useMemo } from "react";
import { SEOHead } from "@/components/storefront/SEOHead";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ThemedStorefrontLayout as StorefrontLayout } from "@/components/storefront/ThemedStorefrontLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useStoreSlug, resolveStoreBySlug } from "@/lib/subdomain";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { useActiveTheme, findThemeFile, findMainThemeFile, buildIncludesMap } from "@/hooks/use-active-theme";
import { renderTemplate, type TemplateContext } from "@/lib/base-template-engine";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-5 w-5 cursor-${readonly ? "default" : "pointer"} transition-colors ${
            s <= (hover || value) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
          }`}
          onMouseEnter={() => !readonly && setHover(s)}
          onMouseLeave={() => !readonly && setHover(0)}
          onClick={() => onChange?.(s)}
        />
      ))}
    </div>
  );
}

export default function StorefrontContentPage() {
  const { storeSlug: paramSlug, pageSlug } = useParams();
  const { storeSlug } = useStoreSlug(paramSlug);
  const { user } = useAuth();
  const [store, setStore] = useState<any>(null);
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", body: "" });
  const [submitting, setSubmitting] = useState(false);

  // ── Theme hooks (must be before early returns) ──
  const { data: theme } = useActiveTheme(store?.id);

  const contentTemplate = useMemo(() => {
    if (!theme) return null;
    return findThemeFile(theme, "templates", "content")
      || findMainThemeFile(theme, "content")
      || findThemeFile(theme, "templates", "page");
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

        if (data) {
          const { data: revs } = await supabase
            .from("content_reviews" as any)
            .select("*")
            .eq("content_page_id", data.id)
            .eq("is_approved", true)
            .order("created_at", { ascending: false });
          setReviews(revs || []);
        }
      }
      setLoading(false);
    }
    load();
  }, [storeSlug, pageSlug]);

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length
    : 0;

  const handleSubmitReview = async () => {
    if (!user || !page || !store) return;
    if (!reviewForm.body.trim()) { toast.error("Please write a review"); return; }
    setSubmitting(true);

    const profile = await supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle();
    const authorName = profile.data?.display_name || user.email?.split("@")[0] || "Anonymous";

    const { error } = await supabase.from("content_reviews" as any).insert({
      content_page_id: page.id,
      store_id: store.id,
      user_id: user.id,
      rating: reviewForm.rating,
      title: reviewForm.title || null,
      body: reviewForm.body,
      author_name: authorName,
      is_approved: false,
    });

    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Review submitted! It will appear after moderation.");
    setReviewForm({ rating: 5, title: "", body: "" });
  };
  // Extract FAQ pairs from content for JSON-LD
  const faqItems = useMemo(() => {
    if (!page?.content) return [];
    const doc = new DOMParser().parseFromString(page.content, "text/html");
    const items: { question: string; answer: string }[] = [];
    const headings = doc.querySelectorAll("h2, h3");
    headings.forEach((h) => {
      const text = h.textContent?.trim();
      if (text && text.endsWith("?")) {
        let answer = "";
        let sibling = h.nextElementSibling;
        while (sibling && !["H2", "H3"].includes(sibling.tagName)) {
          answer += sibling.textContent?.trim() + " ";
          sibling = sibling.nextElementSibling;
        }
        if (answer.trim()) items.push({ question: text, answer: answer.trim() });
      }
    });
    return items;
  }, [page?.content]);

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


  if (contentTemplate?.content && theme && page && store) {
    const includes = buildIncludesMap(theme);
    const contentCtx: TemplateContext = {
      content: {
        ...page,
        body: page.content || "",
      },
      reviews,
      store: { name: store.name, ...store },
      includes,
      themeFiles,
      themeAssetBaseUrl,
      basePath: "",
      pageType: "content",
    };

    let rendered = renderTemplate(contentTemplate.content, contentCtx);

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
      <StorefrontLayout storeName={store.name} extraContext={contentCtx}>
        <SEOHead
          title={page.seo_title || `${page.title} — ${store.name}`}
          description={page.seo_description || page.content?.slice(0, 160)?.replace(/<[^>]+>/g, "")}
          image={page.featured_image}
        />
        <div dangerouslySetInnerHTML={{ __html: rendered }} />
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout storeName={store?.name}>
      <SEOHead
        title={page.seo_title || `${page.title} — ${store?.name || "Store"}`}
        description={page.seo_description || page.content?.slice(0, 160)?.replace(/<[^>]+>/g, "")}
        image={page.featured_image}
      />
      {faqItems.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqItems.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: { "@type": "Answer", text: faq.answer },
          })),
        })}} />
      )}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {page.featured_image && (
          <img src={page.featured_image} alt={page.title} className="w-full rounded-xl mb-8 max-h-[400px] object-cover" />
        )}
        <h1 className="text-3xl sm:text-4xl font-bold mb-6">{page.title}</h1>
        <div
          className="prose prose-neutral dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: page.content || "" }}
        />

        {/* Reviews Section */}
        <div className="mt-12 pt-8 border-t space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Reviews</h2>
            {reviews.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <StarRating value={Math.round(avgRating)} readonly />
                <span>{avgRating.toFixed(1)} ({reviews.length})</span>
              </div>
            )}
          </div>

          {/* Review Form */}
          {user ? (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
              <p className="text-sm font-medium">Write a Review</p>
              <StarRating value={reviewForm.rating} onChange={(v) => setReviewForm({ ...reviewForm, rating: v })} />
              <Input
                placeholder="Review title (optional)"
                className="h-8 text-sm"
                value={reviewForm.title}
                onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
              />
              <Textarea
                placeholder="Share your thoughts..."
                className="text-sm min-h-[80px]"
                value={reviewForm.body}
                onChange={(e) => setReviewForm({ ...reviewForm, body: e.target.value })}
              />
              <Button size="sm" onClick={handleSubmitReview} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sign in to leave a review.</p>
          )}

          {/* Review List */}
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reviews yet. Be the first!</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((r: any) => (
                <div key={r.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{r.author_name}</span>
                      <StarRating value={r.rating} readonly />
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  {r.title && <p className="text-sm font-medium">{r.title}</p>}
                  {r.body && <p className="text-sm text-muted-foreground">{r.body}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </StorefrontLayout>
  );
}
