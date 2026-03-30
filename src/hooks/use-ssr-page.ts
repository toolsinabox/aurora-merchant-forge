import { useQuery } from "@tanstack/react-query";
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
  templateOverrides?: { templatehead?: string; templatebody?: string; templatefoot?: string };
}

/**
 * Fetches a fully server-side rendered page from the render-page edge function.
 * Uses react-query for caching — repeat visits are instant.
 */
export function useSSRPage({ storeId, pageType = "content", slug, basePath, extraContext, enabled = true, templateOverrides }: UseSSRPageOptions) {
  const result = useQuery({
    queryKey: ["ssr-page", storeId, pageType, slug, basePath],
    enabled: !!storeId && enabled,
    staleTime: 2 * 60 * 1000, // cached for 2 min
    gcTime: 5 * 60 * 1000,
    queryFn: async (): Promise<SSRPageResult | null> => {
      const { data, error } = await supabase.functions.invoke("render-page", {
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

      if (error) {
        console.warn("SSR fetch failed:", error);
        return null;
      }
      if (data && data.has_theme) {
        return data as SSRPageResult;
      }
      return null;
    },
  });

  return {
    data: result.data ?? null,
    loading: result.isLoading,
    error: result.error?.message ?? null,
    refetch: result.refetch,
  };
}
