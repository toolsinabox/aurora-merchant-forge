import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle, XCircle, CheckCircle, Eye, Image, Code, Type, Layers,
  FileCode, Globe, ShoppingCart, LogIn, Home, LayoutGrid, FileText,
} from "lucide-react";

type Severity = "critical" | "major" | "minor" | "info";

interface AuditIssue {
  id: string;
  page: string;
  pageIcon: React.ReactNode;
  severity: Severity;
  title: string;
  description: string;
  expected: string;
  actual: string;
  rootCause: string;
  fix: string;
  screenshot?: string;
}

const severityConfig: Record<Severity, { label: string; color: string; icon: React.ReactNode }> = {
  critical: { label: "Critical", color: "bg-red-600 text-white", icon: <XCircle className="h-4 w-4" /> },
  major: { label: "Major", color: "bg-orange-500 text-white", icon: <AlertTriangle className="h-4 w-4" /> },
  minor: { label: "Minor", color: "bg-yellow-500 text-black", icon: <AlertTriangle className="h-4 w-4" /> },
  info: { label: "Info", color: "bg-blue-500 text-white", icon: <Eye className="h-4 w-4" /> },
};

const auditIssues: AuditIssue[] = [
  // ═══════ HOMEPAGE ═══════
  {
    id: "HOME-001",
    page: "Homepage",
    pageIcon: <Home className="h-4 w-4" />,
    severity: "critical",
    title: "Hero Carousel Not Rendering",
    description: "The homepage carousel/banner section is completely empty — no slides, no images, no navigation arrows. On the live Maropost site, this is the primary visual element with 6 rotating banner images.",
    expected: "Full-width Bootstrap carousel with 6 banner slides, navigation arrows, and dot indicators. Uses #homepageCarousel section with .carousel-item children.",
    actual: "Blank space where the carousel should be. The HTML structure may exist but images reference /assets/marketing/151.webp etc. which are Maropost-hosted URLs not available on our platform.",
    rootCause: "The carousel images are sourced from Maropost's /assets/marketing/ path which points to their CDN. These marketing assets were NOT included in the theme ZIP upload — they are store-specific content (adverts/banners), not theme files. Additionally, Bootstrap 4 JS may not be initialising the carousel correctly.",
    fix: "1) Map /assets/marketing/ URLs to the adverts table — banners should be pulled from the store's adverts/content. 2) Ensure Bootstrap 4.6 JS is loaded and initialised for carousel functionality. 3) Add a B@SE tag handler for [%homepage_carousel%] or similar that renders adverts from the database.",
  },
  {
    id: "HOME-002",
    page: "Homepage",
    pageIcon: <Home className="h-4 w-4" />,
    severity: "major",
    title: "Orphan '0' Text Visible in Body",
    description: "A lone '0' character appears in the middle of the homepage between the header and the USP strip.",
    expected: "No stray text — the carousel should fill this space.",
    actual: "Plain text '0' visible, likely an unprocessed B@SE variable like [%cart_count%] or a slideshow counter that resolved to 0.",
    rootCause: "A B@SE template variable or counter that is not being processed by the engine, leaving the raw output '0' visible. Could be [%slide_count%], [%item_count%], or a JS counter element that renders '0' before initialisation.",
    fix: "Audit the homepage template body for variables that resolve to numbers. Ensure all B@SE variables are either processed or hidden when they resolve to empty/zero values.",
  },
  {
    id: "HOME-003",
    page: "Homepage",
    pageIcon: <Home className="h-4 w-4" />,
    severity: "major",
    title: "Category Images Missing in 'Popular Categories' Section",
    description: "The 'POPULAR CATEGORIES' section shows category names but the associated images are not loading — appears as broken/empty boxes.",
    expected: "Grid of category cards with product images from /assets/webshop/cms/ paths.",
    actual: "Category names visible but image boxes appear empty or show placeholder backgrounds.",
    rootCause: "Category images reference /assets/webshop/cms/{ID}.webp paths which are Maropost CDN URLs. These need to be mapped to our storage system or the original images need to be migrated.",
    fix: "1) During migration, download and store category images in our storage bucket. 2) Map /assets/webshop/cms/ asset paths to our storage URLs in the asset rewriter. 3) Ensure the categories table has image_url populated with valid URLs.",
  },

  // ═══════ PRODUCTS / CATEGORY PAGE ═══════
  {
    id: "PROD-001",
    page: "Products Listing",
    pageIcon: <LayoutGrid className="h-4 w-4" />,
    severity: "critical",
    title: "Raw B@SE Tags Visible — [%CATEGORYMENU%]",
    description: "The products/category page displays raw unprocessed B@SE template tags: [%CATEGORYMENU sortby:'sortorder,selected,name' show_empty:'1'%] [%/CATEGORYMENU%]",
    expected: "A rendered sidebar navigation menu showing product categories in a tree structure.",
    actual: "Raw template syntax visible as plain text on the page.",
    rootCause: "The B@SE engine does not implement the [%CATEGORYMENU%] tag. This is a complex Maropost-specific tag that generates an HTML category tree from the store's categories.",
    fix: "Implement [%CATEGORYMENU%] in the B@SE template engine. It should query the categories table and render a nested <ul> tree structure with links. Support the sortby and show_empty parameters.",
  },
  {
    id: "PROD-002",
    page: "Products Listing",
    pageIcon: <LayoutGrid className="h-4 w-4" />,
    severity: "critical",
    title: "Raw B@SE Tags Visible — [%/param%] [%/thumb_list%]",
    description: "Product listing page shows raw closing tags [%/param%] and [%/thumb_list%] instead of a product grid.",
    expected: "A grid of product cards with images, names, and prices — the standard category/product listing layout.",
    actual: "No products rendered. Just raw tag text visible.",
    rootCause: "The [%thumb_list%] tag (used for product iteration in category/search results) is not being processed by the B@SE engine, or its opening tag was processed but the closing tag wasn't properly consumed.",
    fix: "Ensure [%thumb_list%] iterates over the products array and renders each product using the thumbs template. The [%param%] tags within should resolve product fields (name, price, image, URL). This is the most critical rendering tag for product listings.",
  },
  {
    id: "PROD-003",
    page: "Products Listing",
    pageIcon: <LayoutGrid className="h-4 w-4" />,
    severity: "major",
    title: "'Filter Products' Section Empty",
    description: "The 'Filter Products' collapsible section is visible but has no filter options inside.",
    expected: "Product filters for price range, brand, category, and product specifics (like material, size).",
    actual: "Just the heading 'Filter Products' with a collapse toggle — no filter content.",
    rootCause: "Filter rendering likely depends on B@SE tags like [%FILTERS%] or [%param%] blocks that generate filter HTML from product attributes.",
    fix: "Implement filter B@SE tags or ensure the filter section is populated with category-specific filtering options from product specifics and attributes.",
  },

  // ═══════ CART PAGE ═══════
  {
    id: "CART-001",
    page: "Cart",
    pageIcon: <ShoppingCart className="h-4 w-4" />,
    severity: "critical",
    title: "Raw B@SE Tags — Shipping Methods, Countries, Payment Plans",
    description: "The cart page is riddled with unprocessed B@SE tags: [%shipping_methods zip:'' city:'' state:'' country:''%], [%/countries%], [%/param%], [%/shipping_methods%], [%payment_plans type:'' sortby:'sortorder,name'%], [%/cart_items%], [%ga_funnel%]",
    expected: "Functional cart with product lines, quantity selectors, shipping calculator, and payment method logos.",
    actual: "A broken layout with raw template tags visible everywhere. The Checkout button and Afterpay section render correctly (they're static HTML), but all dynamic sections are broken.",
    rootCause: "Multiple unimplemented B@SE tags: shipping_methods, countries, payment_plans, cart_items, ga_funnel. These are complex iterators that need real data from the store's shipping zones, payment gateways, and cart state.",
    fix: "1) Implement [%cart_items%] to iterate over cart items from CartContext. 2) Implement [%shipping_methods%] to list available shipping rates. 3) Implement [%countries%] for country dropdown. 4) Implement [%payment_plans%] for payment method display. 5) [%ga_funnel%] can output empty or GA tracking script.",
  },

  // ═══════ LOGIN / REGISTER PAGE ═══════
  {
    id: "AUTH-001",
    page: "Login / Register",
    pageIcon: <LogIn className="h-4 w-4" />,
    severity: "critical",
    title: "Registration Form Completely Broken with Raw Tags",
    description: "The registration side of the login page shows dozens of raw B@SE tags: [%/ FORM%], [%EXTRA_CUSTOMER_FIELDS%], [%param *integer_option%], [%NOHTML%][%/ NOHTML%], [%param *text_option%], [%param *short_text_option%], [%param *descimal_option%]",
    expected: "A clean registration form with email, password, confirm password, and any custom fields the merchant has configured.",
    actual: "A mangled form with raw template tags mixed in with the actual form fields. Multiple 'optional' labelled empty fields with [%NOHTML%] placeholder text.",
    rootCause: "The [%EXTRA_CUSTOMER_FIELDS%] tag is not implemented — it should render custom registration fields from the store's custom_fields configuration. The [%param%] tags within are field-type iterators. [%NOHTML%] is a content sanitiser tag. [%/ FORM%] is a form closing tag.",
    fix: "1) Implement [%EXTRA_CUSTOMER_FIELDS%] to render custom fields from custom_fields table where entity_type='customer'. 2) Implement [%NOHTML%] to strip HTML from content. 3) Implement [%/ FORM%] as a form closing tag. 4) If no custom fields exist, the entire EXTRA_CUSTOMER_FIELDS block should render empty.",
  },

  // ═══════ FOOTER ═══════
  {
    id: "FOOT-001",
    page: "Footer (All Pages)",
    pageIcon: <FileText className="h-4 w-4" />,
    severity: "major",
    title: "Copyright Shows 'Invalid Date' and Raw [%/ if%] Tags",
    description: "Footer copyright line shows: 'Copyright © Invalid Date toolsinabox. ABN: [%/ if%] Address: [%/ if%]'",
    expected: "Copyright © 2026 Tools In A Box. ABN: 12 345 678 901 Address: Unit 13, 340 Hoxton Park Road, Prestons NSW 2170",
    actual: "'Invalid Date' instead of year, and raw [%/ if%] closing tags visible.",
    rootCause: "1) The date function that generates the copyright year is failing — likely a B@SE tag like [%date_year%] or [%site_value name:'copyright_year'%] that isn't processing. 2) The [%if%] conditional blocks around ABN and Address are not being matched/processed correctly, leaving orphan closing tags.",
    fix: "1) Implement date-related B@SE tags (e.g., [%date format:'Y'%]) to output the current year. 2) Fix the [%if%] / [%/ if%] conditional processing — ensure nested conditionals are handled correctly and closing tags are consumed even when the condition is false.",
  },
  {
    id: "FOOT-002",
    page: "Footer (All Pages)",
    pageIcon: <FileText className="h-4 w-4" />,
    severity: "minor",
    title: "'jquery-ui.min.js 0' Text Visible at Page Bottom",
    description: "Below the footer, the text 'jquery-ui.min.js 0' appears as visible content.",
    expected: "No visible text — JS files should load silently.",
    actual: "Script filename and a zero value rendered as page content.",
    rootCause: "A <script> tag injection is failing, and instead of executing the JS file, its name is being output as text. This suggests the script executor or the inline-script processing is partially rendering script tags as text nodes.",
    fix: "Audit the JS injection logic in ThemedStorefrontLayout. Ensure script tags are not being double-processed (once by React dangerouslySetInnerHTML and again by the script executor). The '0' may be a return value from document.write or a script load event handler.",
  },

  // ═══════ FONTS / ASSETS ═══════
  {
    id: "ASSET-001",
    page: "All Pages",
    pageIcon: <Type className="h-4 w-4" />,
    severity: "major",
    title: "Custom Fonts Failing to Load (Quatro-Bold, Quatro-Medium)",
    description: "Console shows 'Failed to decode downloaded font' errors for /fonts/Quatro-Bold.ttf, /fonts/Quatro-Bold.woff, /fonts/Quatro-Medium.ttf, /fonts/Quatro-Medium.woff",
    expected: "Custom theme fonts load from the theme-assets storage bucket.",
    actual: "Fonts are being requested from the root /fonts/ path of the preview domain instead of from the theme-assets storage bucket.",
    rootCause: "Font @font-face declarations in the theme CSS reference relative paths like url('fonts/Quatro-Bold.ttf') or url('/fonts/Quatro-Bold.ttf'). The CSS asset URL rewriter is not catching font references inside @font-face blocks, or the inline CSS injection doesn't have the correct base URL context.",
    fix: "1) Extend the CSS url() rewriter in ThemedStorefrontLayout to handle font file extensions (.ttf, .woff, .woff2, .eot, .otf). 2) Ensure inline <style> blocks have their url() paths rewritten to point at the theme-assets bucket. 3) Verify font files were actually extracted from the ZIP and uploaded to storage.",
  },
  {
    id: "ASSET-002",
    page: "All Pages",
    pageIcon: <Image className="h-4 w-4" />,
    severity: "major",
    title: "Marketing Asset Images Not Resolving",
    description: "Banner/carousel images reference paths like /assets/marketing/151.webp which are Maropost CDN URLs, not available in our system.",
    expected: "Banner images display correctly by pulling from migrated asset storage or advert records.",
    actual: "Images fail to load — 404 or empty spaces where banners should be.",
    rootCause: "Marketing images (/assets/marketing/{ID}.webp) are store content managed through Maropost's admin, stored on their CDN. These are NOT part of the theme ZIP — they're separate content assets tied to adverts/content zones.",
    fix: "1) During Maropost migration, download marketing assets and store in our storage bucket. 2) Add an asset path resolver that maps /assets/marketing/{ID}.webp to our storage or adverts table image_url. 3) Alternatively, maintain the original Maropost CDN URLs as a fallback during migration period.",
  },

  // ═══════ B@SE ENGINE GAPS ═══════
  {
    id: "ENGINE-001",
    page: "All Pages",
    pageIcon: <Code className="h-4 w-4" />,
    severity: "critical",
    title: "Unimplemented B@SE Tags Summary",
    description: "Multiple B@SE template tags are not implemented in the engine, causing raw tag syntax to be visible across the storefront.",
    expected: "All B@SE tags either render content or silently resolve to empty when data is unavailable.",
    actual: "Raw tags visible as text content.",
    rootCause: "The B@SE engine implementation is incomplete. The following tags need implementation or fixing:",
    fix: `Priority 1 (Critical — breaks page layout):
• [%thumb_list%] / [%/thumb_list%] — Product listing iterator
• [%cart_items%] / [%/cart_items%] — Cart items iterator  
• [%CATEGORYMENU%] — Category navigation tree
• [%shipping_methods%] — Shipping rate calculator
• [%payment_plans%] — Payment method listing
• [%EXTRA_CUSTOMER_FIELDS%] — Custom registration fields

Priority 2 (Major — visible but not layout-breaking):
• [%if%] / [%/ if%] — Conditional blocks (partially working but orphan closing tags)
• [%date%] — Date formatting (copyright year)
• [%NOHTML%] — HTML stripper
• [%ga_funnel%] — Google Analytics funnel tracking
• [%countries%] — Country dropdown iterator

Priority 3 (Minor — cosmetic):  
• [%param *integer_option%] etc. — Custom field type renderers
• [%/ FORM%] — Form closing tag`,
  },

  // ═══════ BODY WRAPPER / CSS ═══════
  {
    id: "CSS-001",
    page: "All Pages",
    pageIcon: <Layers className="h-4 w-4" />,
    severity: "major",
    title: "Missing Body ID and Classes for CSS Targeting",
    description: "The Maropost site uses <body id=\"n_home\" class=\"n_skeletal is-scroll-up\"> which many CSS rules target. Our storefront wrapper lacks these identifiers.",
    expected: "Outer wrapper element with correct body ID (n_home, n_category, n_product, etc.) and class (n_skeletal) matching the Maropost convention.",
    actual: "Generic React div wrappers without Maropost-compatible IDs/classes.",
    rootCause: "The ThemedShell component in ThemedStorefrontLayout doesn't apply page-specific body classes. Maropost themes heavily rely on these for CSS scoping.",
    fix: "Add a wrapper div with id={pageTypeId} and class='n_skeletal' to ThemedShell. Map page types: home→n_home, category→n_category, product→n_product, cart→n_cart, login→n_login, etc.",
  },
  {
    id: "CSS-002",
    page: "All Pages",
    pageIcon: <Globe className="h-4 w-4" />,
    severity: "major",
    title: "Missing CDN Dependencies (Bootstrap 4, jQuery, Slick)",
    description: "The theme CSS/JS relies on Bootstrap 4.6 grid, jQuery, and Slick carousel — these were previously removed to 'clean up' injections.",
    expected: "Bootstrap 4 grid/components, jQuery 3.x, and Slick carousel loaded as CDN dependencies before theme JS executes.",
    actual: "Theme JS files that depend on jQuery/Bootstrap fail silently. Carousels don't initialise. Dropdowns don't work.",
    rootCause: "CDN dependencies were removed in a previous iteration. Maropost themes universally depend on these libraries — they're not optional, they're required infrastructure.",
    fix: "Re-inject jQuery 3.6, Bootstrap 4.6 JS, and Slick Carousel as CDN <script> tags BEFORE theme JS files execute. These are platform dependencies, not theme modifications. Load order must be: jQuery → Bootstrap JS → Slick → Theme custom.js",
  },
];

const pageGroups = [
  { name: "All Pages", filter: (i: AuditIssue) => true },
  { name: "Homepage", filter: (i: AuditIssue) => i.page === "Homepage" },
  { name: "Products", filter: (i: AuditIssue) => i.page === "Products Listing" },
  { name: "Cart", filter: (i: AuditIssue) => i.page === "Cart" },
  { name: "Login", filter: (i: AuditIssue) => i.page === "Login / Register" },
  { name: "Footer", filter: (i: AuditIssue) => i.page.includes("Footer") },
  { name: "Assets", filter: (i: AuditIssue) => i.page === "All Pages" },
];

export default function StorefrontAudit() {
  const critical = auditIssues.filter(i => i.severity === "critical").length;
  const major = auditIssues.filter(i => i.severity === "major").length;
  const minor = auditIssues.filter(i => i.severity === "minor").length;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Storefront Theme Audit</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive audit of the toolsinabox storefront theme rendering compared to the live Maropost site (www.toolsinabox.com.au)
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-red-100 p-2"><XCircle className="h-5 w-5 text-red-600" /></div>
                <div>
                  <p className="text-2xl font-bold">{critical}</p>
                  <p className="text-sm text-muted-foreground">Critical Issues</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-orange-100 p-2"><AlertTriangle className="h-5 w-5 text-orange-600" /></div>
                <div>
                  <p className="text-2xl font-bold">{major}</p>
                  <p className="text-sm text-muted-foreground">Major Issues</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-yellow-100 p-2"><AlertTriangle className="h-5 w-5 text-yellow-500" /></div>
                <div>
                  <p className="text-2xl font-bold">{minor}</p>
                  <p className="text-sm text-muted-foreground">Minor Issues</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-100 p-2"><FileCode className="h-5 w-5 text-blue-600" /></div>
                <div>
                  <p className="text-2xl font-bold">{auditIssues.length}</p>
                  <p className="text-sm text-muted-foreground">Total Findings</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Issues by Page */}
        <Tabs defaultValue="All Pages">
          <TabsList className="flex-wrap h-auto gap-1">
            {pageGroups.map(g => (
              <TabsTrigger key={g.name} value={g.name} className="text-xs">{g.name}</TabsTrigger>
            ))}
          </TabsList>

          {pageGroups.map(group => (
            <TabsContent key={group.name} value={group.name} className="space-y-4">
              {auditIssues.filter(group.filter).map(issue => (
                <Card key={issue.id} className="border-l-4" style={{
                  borderLeftColor: issue.severity === "critical" ? "#dc2626" : issue.severity === "major" ? "#f97316" : issue.severity === "minor" ? "#eab308" : "#3b82f6"
                }}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className={severityConfig[issue.severity].color}>
                          {severityConfig[issue.severity].icon}
                          <span className="ml-1">{severityConfig[issue.severity].label}</span>
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          {issue.pageIcon}
                          {issue.page}
                        </Badge>
                        <code className="text-xs text-muted-foreground">{issue.id}</code>
                      </div>
                    </div>
                    <CardTitle className="text-lg mt-2">{issue.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{issue.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Expected
                        </p>
                        <p className="text-sm bg-green-50 dark:bg-green-950/30 p-3 rounded text-green-800 dark:text-green-200">{issue.expected}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-red-600 flex items-center gap-1">
                          <XCircle className="h-3 w-3" /> Actual
                        </p>
                        <p className="text-sm bg-red-50 dark:bg-red-950/30 p-3 rounded text-red-800 dark:text-red-200">{issue.actual}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground">Root Cause</p>
                      <p className="text-sm bg-muted/50 p-3 rounded">{issue.rootCause}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-blue-600">Recommended Fix</p>
                      <pre className="text-sm bg-blue-50 dark:bg-blue-950/30 p-3 rounded text-blue-800 dark:text-blue-200 whitespace-pre-wrap">{issue.fix}</pre>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AdminLayout>
  );
}
