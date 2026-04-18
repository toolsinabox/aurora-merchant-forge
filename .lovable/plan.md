

The user is asking for a comprehensive system-wide audit to make sure everything works. This is a huge platform (200+ pages, 60+ edge functions, multi-tenant SaaS with platform admin, merchant cpanel, and storefront). I need to scope this realistically and present a clear plan for how I'll audit and verify the system.

Let me think about what "everything works" means here:
1. **Authentication flows** — signup, login, password reset, platform admin, merchant cpanel
2. **Platform admin** — merchant list, dashboard, settings
3. **Merchant cpanel** — 150+ admin pages (products, orders, customers, inventory, etc.)
4. **Storefront** — themed rendering, cart, checkout, account, products, categories
5. **Edge functions** — 60+ functions (emails, syncs, payments, render-page, etc.)
6. **Database** — RLS policies, triggers, schema integrity
7. **Integrations** — payment gateways, shipping, marketplaces

A truly exhaustive audit of every page would take many iterations. I need to propose a tiered, prioritized approach.

## Plan Structure

I'll propose:
- **Tier 1 (Critical Paths)**: Auth, storefront load, checkout, admin login — anything user-facing that must not break
- **Tier 2 (Core Admin)**: Products, orders, customers, inventory CRUD
- **Tier 3 (Backend Health)**: Edge function logs, DB linter, RLS coverage, security scan
- **Tier 4 (Secondary Features)**: Marketing, integrations, reports, etc.

For each tier I'll: load the page, check console errors, verify data flows, test one happy path, capture issues into a report.

I'll deliver a single "System Health Report" document with: ✅ working, ⚠️ partial, ❌ broken — plus fix-it actions.

Keep the plan concise.

