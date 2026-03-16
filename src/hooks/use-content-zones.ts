import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch active content zones for a store and return them as a key→content map
 * ready to inject into the B@SE template context as `contentZones`.
 */
export function useContentZones(storeId: string | undefined) {
  return useQuery({
    queryKey: ["content_zones_map", storeId],
    enabled: !!storeId,
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<Record<string, string>> => {
      if (!storeId) return {};
      const { data, error } = await supabase
        .from("content_zones" as any)
        .select("zone_key, content")
        .eq("store_id", storeId)
        .eq("is_active", true);
      if (error || !data) return {};
      const map: Record<string, string> = {};
      for (const z of data as any[]) {
        if (z.zone_key && z.content) map[z.zone_key] = z.content;
      }
      return map;
    },
  });
}
