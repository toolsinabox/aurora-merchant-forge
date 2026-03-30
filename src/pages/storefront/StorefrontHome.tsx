import { SEOHead } from "@/components/storefront/SEOHead";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ThemedStorefrontLayout } from "@/components/storefront/ThemedStorefrontLayout";
import { useStoreSlug, resolveStoreBySlug } from "@/lib/subdomain";

/**
 * StorefrontHome — thin wrapper that lets ThemedStorefrontLayout handle
 * ALL rendering via the SSR pipeline. No duplicate data loading or
 * client-side template rendering.
 */
export default function StorefrontHome() {
  const { storeSlug: paramSlug } = useParams();
  const { storeSlug } = useStoreSlug(paramSlug);
  const [store, setStore] = useState<any>(null);

  useEffect(() => {
    if (!storeSlug) return;
    resolveStoreBySlug(storeSlug, supabase).then((s) => {
      if (s) setStore(s);
    });
  }, [storeSlug]);

  return (
    <ThemedStorefrontLayout storeName={store?.name}>
      <SEOHead
        title={store?.seo_title || store?.name || "Store"}
        description={store?.seo_description || `Shop at ${store?.name || "our store"}`}
        url={store?.custom_domain ? `https://${store.custom_domain}` : undefined}
        organization={store ? { name: store.name, url: store.custom_domain ? `https://${store.custom_domain}` : undefined, logo: store.logo_url } : undefined}
      />
      {/* SSR body is rendered by ThemedStorefrontLayout — children here are only shown if SSR body is empty */}
    </ThemedStorefrontLayout>
  );
}
