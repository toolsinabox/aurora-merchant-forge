// Maps URL pathname patterns to lazy chunk loaders so we can pre-warm the
// dynamic import on hover/focus, eliminating the perceived blank flash on
// first navigation. Loaders are registered from src/App.tsx.

type Loader = () => Promise<unknown>;

interface PrefetchEntry {
  match: (pathname: string) => boolean;
  load: Loader;
}

const entries: PrefetchEntry[] = [];
const requested = new Set<Loader>();

export function registerRoutePrefetch(pattern: RegExp, load: Loader) {
  entries.push({ match: (pathname) => pattern.test(pathname), load });
}

export function prefetchRouteChunk(pathname: string) {
  if (!pathname) return;
  // Strip query/hash to keep matching simple
  const cleanPath = pathname.split("?")[0].split("#")[0];
  for (const entry of entries) {
    if (entry.match(cleanPath) && !requested.has(entry.load)) {
      requested.add(entry.load);
      // Fire-and-forget: warm the chunk cache; ignore failures
      entry.load().catch(() => requested.delete(entry.load));
    }
  }
}