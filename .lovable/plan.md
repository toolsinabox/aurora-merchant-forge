

## Problem Diagnosis

The B@SE template engine has a `cleanupUnresolved` function (in both the edge function `render-page/index.ts` and the client-side `base-template-engine.ts`) that **silently strips all unresolved tags** — both `[@value@]` data tags and `[%if%]` conditional blocks. This means:

1. When a tag like `[@name@]` or `[@price@]` can't be resolved from the context, it's replaced with an empty string — the user sees nothing
2. When an `[%if [@some_field@]%]` conditional can't resolve, the entire block is stripped
3. This hides real bugs: missing data mappings, missing context fields, unprocessed loops

The result: sections of the page that depend on data tags simply vanish. No data, no markup, nothing.

## Root Causes

1. **`cleanupUnresolved` / `cleanupUnresolvedTags`** — Both engines have a final pass that regex-deletes all remaining `[@...@]` and `[%if%]` tags
2. **`processValueTags`** — Returns empty string `""` for any field that resolves to `null`/`undefined` instead of keeping the tag for debugging or trying harder to resolve it
3. **Missing item context in loops** — Inside `thumb_list`, `advert`, `content_menu`, and `random_products` loops, the item context may not include all the fields the theme expects (e.g., `[@description@]`, `[@subtitle@]`, `[@short_description@]`, etc.)
4. **`ThemedShell` ignores `{children}`** — The layout only renders `ssrBodyHtml` from the edge function; any client-side rendered content passed as children is discarded

## Plan

### Step 1: Fix `cleanupUnresolved` in render-page edge function
- **Remove the blanket `[@...@]` stripping regex** (line 1637)
- **Remove the blanket `[%if%]` stripping regex** (line 1638)
- Keep only targeted cleanup for truly decorative/system tags (`[%cache%]`, `[%NETO_JS%]`, `[%tracking_code%]`, etc.)
- Unresolved data tags should pass through to the HTML so they're either visible for debugging or at minimum don't destroy surrounding markup

### Step 2: Fix `cleanupUnresolvedTags` in client-side base-template-engine.ts
- Same changes: remove the blanket `[@...@]` strip (line 2456) and `[%if%]` strip (line 2458)
- Keep targeted system tag cleanup only

### Step 3: Fix `processValueTags` in both engines
- When a field resolves to `null`/`undefined`, return empty string (current behavior is acceptable for resolved-but-empty fields)
- The key fix is that cleanup shouldn't strip tags that processValueTags already handled — the real problem is cleanup stripping tags that were INSIDE blocks that never got processed (like nested conditionals or loops that weren't entered)

### Step 4: Ensure item loops pass complete context
- In `thumb_list`, `advert`, `content_menu`, `random_products` — make sure the item context includes ALL fields from the database record, not just a curated subset
- Update `buildProductItem`, `buildCategoryItem`, `buildAdvertItem` to spread the full raw record so any `[@field@]` in the theme resolves

### Step 5: Ensure `ThemedShell` renders SSR body OR children
- When `ssrBodyHtml` is available, render it (current behavior)
- When `ssrBodyHtml` is empty but `children` exists, render children as the body content
- This ensures the client-side rendered home page content actually displays

### Step 6: Redeploy render-page edge function

### Files to modify
- `supabase/functions/render-page/index.ts` — Fix cleanup, fix item builders
- `src/lib/base-template-engine.ts` — Fix cleanup
- `src/components/storefront/ThemedStorefrontLayout.tsx` — Render children when no SSR body

