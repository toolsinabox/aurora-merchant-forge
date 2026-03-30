

# Performance Audit: Storefront Page Load

## Problem
The storefront has a **5-step sequential waterfall** before anything renders, plus heavy redundant work on every page load.

## Root Cause Analysis

### Bottleneck 1: Sequential Request Waterfall (Client-Side)
The current loading chain is entirely sequential — each step waits for the previous:

```text
1. resolveStoreBySlug()        → DB query (stores table)
   ↓ waits
2. categories query             → DB query (categories table)
   ↓ waits (storeResolved=true)
3. useActiveTheme()             → 2 DB queries (theme_packages + theme_files with ALL content)
   ↓ waits (theme loaded)
4. useSSRPage()                 → Edge function call (render-page)
   ↓ waits (ssrLoading=false)
5. Render HTML + inject CSS/JS
```

That's **5 sequential network round-trips** before a single pixel appears. Each takes 200-500ms = 1-2.5 seconds minimum just in network latency.

### Bottleneck 2: Redundant Theme File Loading
`useActiveTheme` fetches ALL theme file **contents** (HTML, CSS, JS) from the database — could be hundreds of KB. But the edge function `render-page` ALSO loads all theme files independently. The client loads theme files only to:
- Build CSS `<link>` tags (but the edge function already returns `css_link_tags`)
- Inject JS files (could use the `js_files` array from SSR response)
- Build `themeAssetBaseUrl` (also returned by SSR)

**The entire `useActiveTheme` hook is redundant when SSR is enabled.**

### Bottleneck 3: CSS/JS Upload Check on Every Page Load
Lines 192-216: On every page load, the client does a `HEAD` request for EACH CSS/JS file to check if it exists in storage, then uploads missing ones. This fires on every navigation and adds N network requests where N = number of theme assets.

### Bottleneck 4: Edge Function Does Too Much Sequentially
Inside `render-page`, the `loadPageData` function runs products/content queries **sequentially** after the parallel batch. The `renderTemplate` pipeline processes header, body, and footer sequentially (3 calls to `renderTemplate`).

### Bottleneck 5: Categories Loaded Twice
Categories are loaded by `ThemedStorefrontLayout` (line 55-63) AND by the edge function (line 184). The client-side copy is passed to `ThemedShell` but never used since SSR handles everything.

### Bottleneck 6: Content Zones Loaded Twice
`useContentZones` hook in `ThemedShell` (line 136) loads content zones, but the edge function already loads and processes them.

---

## Fix Plan

### Step 1: Eliminate the client-side waterfall — single SSR call
Remove `useActiveTheme`, `useContentZones`, and the categories fetch from `ThemedStorefrontLayout`. The edge function already loads all this data. The client only needs:
1. `resolveStoreBySlug()` → get store ID
2. `useSSRPage()` → get fully rendered HTML + CSS links + JS files

This cuts the waterfall from 5 steps to 2.

### Step 2: Return CSS/JS metadata from SSR (already done)
The edge function already returns `css_link_tags`, `css_inline`, `js_files`, and `theme_asset_base_url`. Use these directly instead of fetching theme files separately.

### Step 3: Remove the CSS/JS upload-check effect
The asset upload to storage should happen once during theme import/save, NOT on every page load. Remove the `useEffect` that does HEAD requests and uploads on lines 192-216. If assets aren't in storage, they should be synced as a one-time migration task.

### Step 4: Parallelize edge function internals
Render header, body, and footer templates in parallel using `Promise.all`-style (though they're CPU-bound string ops, they can be interleaved). More importantly, ensure `loadPageData` runs fully in parallel with the first batch.

### Step 5: Add response caching on the client
Cache SSR responses in `useSSRPage` using `staleTime` so navigating back to a previously visited page is instant. Use `react-query` instead of raw `useState/useEffect`.

### Step 6: Simplify ThemedStorefrontLayout
Strip it down to:
- Resolve store by slug
- Call SSR edge function
- Inject returned CSS links into `<head>`
- Inject returned JS files into `<body>`
- Render the returned HTML

### Files to modify
- `src/components/storefront/ThemedStorefrontLayout.tsx` — Major refactor: remove `useActiveTheme`, `useContentZones`, categories fetch, asset upload effect
- `src/hooks/use-ssr-page.ts` — Convert to react-query for caching + staleTime
- `supabase/functions/render-page/index.ts` — Minor: ensure full parallelization of data loading
- `src/hooks/use-active-theme.ts` — No changes needed (still used by admin theme editor)

### Expected Result
- **Before**: 5 sequential requests, ~3-6 seconds
- **After**: 2 sequential requests (store lookup + SSR call), ~0.8-1.5 seconds
- Plus client-side caching means repeat visits are near-instant

