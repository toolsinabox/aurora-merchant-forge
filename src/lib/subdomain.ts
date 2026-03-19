import { useMemo } from "react";

/**
 * Known platform hostnames where we should NOT try subdomain detection.
 * Add your main platform domain here.
 */
const PLATFORM_DOMAINS = [
  "localhost",
  "lovable.app",
  "lovable.dev",
  "lovableproject.com",
  "127.0.0.1",
];

/**
 * Detects if the current hostname is a store subdomain.
 * e.g. cool-gadgets.myplatform.com → "cool-gadgets"
 * myplatform.com → null (no subdomain)
 * cool-gadgets.myplatform.com → "cool-gadgets"
 */
export function getSubdomainSlug(): string | null {
  const hostname = window.location.hostname;

  // Skip subdomain detection on known platform domains
  if (PLATFORM_DOMAINS.some((d) => hostname.includes(d))) {
    return null;
  }

  // Split hostname into parts: cool-gadgets.myplatform.com → ["cool-gadgets", "myplatform", "com"]
  const parts = hostname.split(".");

  // Need at least 3 parts for a subdomain (sub.domain.tld)
  // Skip "www" as it's not a store subdomain
  if (parts.length >= 3 && parts[0] !== "www") {
    return parts[0];
  }

  return null;
}

/**
 * Hook that returns the store slug from either:
 * 1. Subdomain (cool-gadgets.myplatform.com → "cool-gadgets")
 * 2. URL param (myplatform.com/store/cool-gadgets → "cool-gadgets")
 *
 * Also returns whether we're in subdomain mode (affects URL generation).
 */
export function useStoreSlug(paramSlug?: string) {
  return useMemo(() => {
    const subdomainSlug = getSubdomainSlug();

    if (subdomainSlug) {
      return {
        storeSlug: subdomainSlug,
        isSubdomain: true,
        // In subdomain mode, base path is root
        basePath: "",
      };
    }

    return {
      storeSlug: paramSlug || null,
      isSubdomain: false,
      // In path mode, base path includes /store/slug
      basePath: paramSlug ? `/store/${paramSlug}` : "",
    };
  }, [paramSlug]);
}

/**
 * Resolves a store from the database by slug.
 * Tries slug column first, then falls back to name-based matching.
 */
export async function resolveStoreBySlug(slug: string, supabase: any) {
  // Try exact slug match first
  const { data: bySlug } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (bySlug) return bySlug;

  // Fallback: match by name converted to slug
  const { data: stores } = await supabase.from("stores").select("*").limit(100);
  const found = stores?.find(
    (s: any) => s.name.toLowerCase().replace(/\s+/g, "-") === slug
  );

  return found || stores?.[0] || null;
}
