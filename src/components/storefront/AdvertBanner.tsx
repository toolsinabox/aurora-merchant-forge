import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const resolveUrl = (path: string | null) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;
};

interface AdvertBannerProps {
  storeId: string;
  placement: string;
  basePath?: string;
}

export function AdvertBanner({ storeId, placement, basePath = "" }: AdvertBannerProps) {
  const [adverts, setAdverts] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    async function load() {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("adverts" as any)
        .select("*")
        .eq("store_id", storeId)
        .eq("placement", placement)
        .eq("is_active", true)
        .order("sort_order");

      // Filter by schedule client-side
      const filtered = (data || []).filter((ad: any) => {
        if (ad.starts_at && new Date(ad.starts_at) > new Date(now)) return false;
        if (ad.ends_at && new Date(ad.ends_at) < new Date(now)) return false;
        return true;
      });
      setAdverts(filtered);
    }
    if (storeId) load();
  }, [storeId, placement]);

  useEffect(() => {
    if (adverts.length <= 1) return;
    const timer = setInterval(() => setCurrent((c) => (c + 1) % adverts.length), 5000);
    return () => clearInterval(timer);
  }, [adverts.length]);

  if (adverts.length === 0) return null;

  const ad = adverts[current];
  const linkUrl = ad.link_url?.startsWith("/") ? `${basePath}${ad.link_url}` : ad.link_url;

  if (ad.advert_type === "html") {
    return <div dangerouslySetInnerHTML={{ __html: ad.html_content || "" }} />;
  }

  if (ad.advert_type === "text") {
    return (
      <div className="bg-primary/5 border rounded-xl p-6 text-center my-4">
        {ad.title && <h3 className="text-lg font-bold">{ad.title}</h3>}
        {ad.subtitle && <p className="text-sm text-muted-foreground mt-1">{ad.subtitle}</p>}
        {ad.button_text && linkUrl && (
          <a href={linkUrl}>
            <Button size="sm" className="mt-3">{ad.button_text}</Button>
          </a>
        )}
      </div>
    );
  }

  // Banner / Carousel
  return (
    <div className="relative overflow-hidden rounded-xl my-4">
      <a href={linkUrl || "#"} className="block">
        {ad.image_url ? (
          <div className="relative">
            <img src={resolveUrl(ad.image_url)} alt={ad.title || ad.name} className="w-full h-[200px] sm:h-[280px] object-cover rounded-xl" />
            {(ad.title || ad.subtitle || ad.button_text) && (
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-center rounded-xl">
                <div className="px-8 py-6 max-w-md">
                  {ad.title && <h3 className="text-xl sm:text-2xl font-bold text-white">{ad.title}</h3>}
                  {ad.subtitle && <p className="text-white/80 text-sm mt-1">{ad.subtitle}</p>}
                  {ad.button_text && (
                    <Button size="sm" variant="secondary" className="mt-3">{ad.button_text}</Button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-primary/10 h-[200px] rounded-xl flex items-center justify-center">
            <div className="text-center">
              {ad.title && <h3 className="text-xl font-bold">{ad.title}</h3>}
              {ad.subtitle && <p className="text-sm text-muted-foreground mt-1">{ad.subtitle}</p>}
            </div>
          </div>
        )}
      </a>

      {/* Carousel navigation */}
      {adverts.length > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); setCurrent((c) => (c - 1 + adverts.length) % adverts.length); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 rounded-full p-1.5 hover:bg-background transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); setCurrent((c) => (c + 1) % adverts.length); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 rounded-full p-1.5 hover:bg-background transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {adverts.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); setCurrent(i); }}
                className={`w-2 h-2 rounded-full transition-colors ${i === current ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
