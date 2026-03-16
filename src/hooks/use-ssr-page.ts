import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SSRPageResult {
  has_theme: boolean;
  head_content: string;
  header_html: string;
  body_html: string;
  footer_html: string;
  css_link_tags: string;
  css_inline: { name: string; content: string }[];
  js_files: { name: string; content: string }[];
  theme_asset_base_url: string;
  store_name: string;
}

interface UseSSRPageOptions {
  storeId: string | undefined;
  pageType?: string;
  slug?: string;
  basePath?: string;
  extraContext?: Record<string, any>;
  enabled?: boolean;
  /** Maropost template override params: ?templatehead=name&templatebody=name&templatefoot=name */
  templateOverrides?: { templatehead?: string; templatebody?: string; templatefoot?: string };
}

/**
 * Fetches a fully server-side rendered page from the render-page edge function.
 * Mirrors Maropost's SSR architecture — B@SE processing happens on the server,
 * and the client receives pre-rendered HTML.
 */
export function useSSRPage({ storeId, pageType = "content", slug, basePath, extraContext, enabled = true, templateOverrides }: UseSSRPageOptions) {
  const [data, setData] = useState<SSRPageResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSSR = useCallback(async () => {
    if (!storeId || !enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: result, error: fnError } = await supabase.functions.invoke("render-page", {
        body: {
          store_id: storeId,
          page_type: pageType,
          slug,
          template_overrides: templateOverrides || {},
          extra_context: {
            basePath: basePath || "",
            ...extraContext,
          },
        },
      });

      if (fnError) {
        console.warn("SSR fetch failed, will fall back to client-side:", fnError);
        setError(fnError.message);
        setData(null);
      } else if (result && result.has_theme) {
        setData(result as SSRPageResult);
      } else {
        setData(null);
      }
    } catch (err: any) {
      console.warn("SSR fetch error:", err);
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [storeId, pageType, slug, basePath, enabled]);

  useEffect(() => {
    fetchSSR();
  }, [fetchSSR]);

  return { data, loading, error, refetch: fetchSSR };
}
