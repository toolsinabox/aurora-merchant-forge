

## Understanding Your Vision

Crystal clear. Here's the URL architecture you want:

```text
PLATFORM (you, the owner):
  www.getcelora.com              → Landing page
  www.getcelora.com/platform     → Platform admin login
  www.getcelora.com/platform/*   → Platform admin pages (dashboard, merchants, etc.)

MERCHANT (e.g. toolsinabox):
  toolsinabox.getcelora.com            → Their public storefront
  toolsinabox.getcelora.com/_cpanel    → Their merchant admin login
  toolsinabox.getcelora.com/_cpanel/*  → Their merchant admin (products, orders, etc.)

CUSTOM DOMAIN (optional):
  www.toolsinabox.com            → Same storefront
  www.toolsinabox.com/_cpanel    → Same merchant admin
```

## What Changes

### 1. Rename platform admin routes from `/admin/*` to `/platform/*`
- `/admin/login` → `/platform` (login page)
- `/admin/dashboard` → `/platform/dashboard`
- `/admin/merchants` → `/platform/merchants`
- `/admin/settings` → `/platform/settings`
- `/admin/customers` → `/platform/customers`
- `/admin/analytics` → `/platform/analytics`
- Update `RequirePlatformAdmin` redirect to `/platform`
- Update `PlatformSidebar` and any navigation links

### 2. Restructure subdomain mode routes to include `/_cpanel`
When on a subdomain (e.g. `toolsinabox.getcelora.com`), serve:
- `/` → Storefront home
- `/products`, `/cart`, etc. → Storefront pages
- `/_cpanel` → Merchant login
- `/_cpanel/dashboard` → Merchant dashboard
- `/_cpanel/products` → Merchant products management
- `/_cpanel/*` → All current merchant admin routes under `/_cpanel` prefix
- Update `RequireAuth` redirect to `/_cpanel` when in subdomain mode

### 3. Keep path-based fallback for dev/preview
In non-subdomain mode (lovable.app preview), keep `/store/:slug` routes and existing merchant routes at root for testing. Platform routes move to `/platform/*`.

### 4. Update navigation and auth redirects
- `PlatformSidebar`: Update all `/admin/*` links to `/platform/*`
- `PlatformLogin`: Update redirect after login to `/platform/dashboard`
- `RequireAuth`: Detect subdomain mode and redirect to `/_cpanel` instead of `/login`
- Merchant sidebar (`AppSidebar`): In subdomain mode, prefix all links with `/_cpanel`

### 5. Add `getcelora.com` to platform domains list
Update `subdomain.ts` to include `getcelora.com` as a recognized platform domain so `www.getcelora.com` doesn't trigger subdomain detection.

## Files to Modify
- `src/App.tsx` — Route restructuring
- `src/lib/subdomain.ts` — Add `getcelora.com` to platform domains
- `src/components/auth/RequirePlatformAdmin.tsx` — Redirect to `/platform`
- `src/components/auth/RequireAuth.tsx` — Subdomain-aware redirect to `/_cpanel`
- `src/components/platform/PlatformSidebar.tsx` — Update nav links
- `src/components/admin/AppSidebar.tsx` — Subdomain-aware `/_cpanel` prefix
- `src/pages/platform/PlatformLogin.tsx` — Update post-login redirect

## Going Live Guide
When you deploy to `getcelora.com`:
1. Point `getcelora.com` A record to your host
2. Add a **wildcard DNS** record: `*.getcelora.com` → same IP
3. Enable wildcard SSL (Cloudflare free tier does this automatically)
4. Each merchant subdomain resolves automatically -- no per-store DNS needed
5. For custom domains (e.g. `toolsinabox.com`), the merchant adds a CNAME pointing to `toolsinabox.getcelora.com`, and you add their domain to your host's config

