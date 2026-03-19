import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle2, XCircle, Info, ExternalLink } from "lucide-react";

/**
 * Maropost Theme Learning — Deep analysis of the live www.toolsinabox.com.au
 * Maropost site vs our Celora rendering engine. Documents every structural
 * difference and what needs to be fixed.
 */

interface Finding {
  area: string;
  maropost: string;
  celora: string;
  status: "match" | "partial" | "missing" | "broken";
  priority: "critical" | "high" | "medium" | "low";
  fix?: string;
}

const findings: Finding[] = [
  // ── Page Structure ──
  {
    area: "Body Classes",
    maropost: '<body id="n_home" class="n_skeletal is-scroll-up"> — Theme CSS selectors depend on these classes for page-specific styling.',
    celora: "No body class injection. The #neto-theme wrapper div doesn't carry the n_home/n_skeletal classes.",
    status: "missing",
    priority: "critical",
    fix: "The render-page edge function must inject body id/class attributes into the wrapper div: id=\"n_home\" class=\"n_skeletal\" for homepage, id=\"n_category\" for category pages, etc. Many CSS rules target body.n_skeletal or #n_home.",
  },
  {
    area: "Header HTML (Sticky Nav)",
    maropost: "Header is a separate template (headers/template.html) with sticky positioning, announcement bar, search, logo, utility icons (phone, search, account, wishlist, cart), and mega-menu navigation.",
    celora: "Header template IS rendered via SSR but the header is wrapped inside a <header> tag which may break CSS selectors that expect the header content to be a direct child of body or #mainContent.",
    status: "partial",
    priority: "high",
    fix: "Ensure the header HTML is injected WITHOUT extra wrapper tags, or ensure the wrapper has the same classes/ids the theme expects.",
  },
  {
    area: "Announcement Bar",
    maropost: "Dual announcement bars at the very top of the page with store messaging (e.g., 'Merry Christmas & Happy New Year'). These come from Maropost's [%advert type:'announcement'%] tag or hardcoded in header template.",
    celora: "Announcement bar content depends on the adverts table. If no adverts with matching type exist, the bar is empty. The [%advert%] tag processing may not correctly match announcement-type adverts.",
    status: "partial",
    priority: "medium",
  },

  // ── Carousel ──
  {
    area: "Homepage Carousel (Desktop)",
    maropost: "Bootstrap 4 carousel (#homepageCarousel) with 6 slides, carousel-indicators, prev/next controls. Uses data-ride=\"carousel\" for auto-play. Images are 2880x810px from /assets/marketing/{ID}.webp.",
    celora: "Carousel HTML is rendered but Bootstrap JS is not loaded (we removed CDN injection). The carousel won't auto-rotate or respond to controls without Bootstrap's carousel.js or jQuery.",
    status: "broken",
    priority: "critical",
    fix: "The theme's own JS files should include jQuery + Bootstrap bundle. Ensure theme JS files are executed in correct order: jQuery first, then Bootstrap, then Slick, then custom.js. The theme's JS handles carousel initialization.",
  },
  {
    area: "Homepage Carousel (Mobile)",
    maropost: "Separate mobile carousel (#mainCarousel_mb) with different images (960x520px). Desktop carousel is hidden on mobile via CSS, mobile carousel shown. This is standard Maropost responsive pattern.",
    celora: "If the template renders both carousels, the CSS must properly show/hide them. Depends on theme CSS being loaded correctly.",
    status: "partial",
    priority: "high",
  },
  {
    area: "Marketing Image URLs",
    maropost: "Banner images use /assets/marketing/{ID}.webp?{timestamp} — these are stored in Maropost's CDN, NOT in the theme files.",
    celora: "Our asset rewriter may incorrectly rewrite these to the theme-assets bucket. Marketing images are separate from theme assets — they're uploaded via the admin's Adverts/Marketing section and stored differently.",
    status: "broken",
    priority: "critical",
    fix: "The asset URL rewriter must NOT rewrite /assets/marketing/ paths. These should either point to the original Maropost CDN (during migration) or to our own storage bucket for marketing assets (not theme-assets).",
  },

  // ── USP Section ──
  {
    area: "USP Bar (Trust Badges)",
    maropost: "4-column USP row with inline SVG icons + text labels: '100% Australian Owned', 'Next Business Day Dispatch', 'Satisfaction Guarantee', 'Genuine Support'. Uses .js-usp container with Bootstrap grid (.col-6.col-md-3).",
    celora: "Rendered if present in the theme template. Depends on the SVG content being preserved in the template — our B@SE engine must not strip SVG tags.",
    status: "partial",
    priority: "medium",
    fix: "Verify SVG content is preserved during template processing. Some engines strip SVG tags for security.",
  },

  // ── Category Grid ──
  {
    area: "Popular Categories Grid",
    maropost: "22 category tiles in a .js-list-category Slick carousel container. Each tile: <div class='hovercartmain'><a class='hovercart'><img 217x137 /assets/webshop/cms/{last2}/{ID}.webp><p class='view'>Name</p></a></div>. Title 'POPULAR CATEGORIES' with .section-title.meg-h2.",
    celora: "Our [%thumb_list type:'category'%] processing generates category items, but the image URLs use the Maropost physical path pattern /assets/webshop/cms/{last2digits}/{ID}.webp which must be resolved correctly.",
    status: "partial",
    priority: "high",
    fix: "Category image URLs follow pattern: /assets/webshop/cms/{LAST_2_DIGITS_OF_ID}/{ID}.webp. Our engine must generate these paths from the category ID, or store the original image URLs during migration.",
  },
  {
    area: "Category Image Path Pattern",
    maropost: "/assets/webshop/cms/{last2digits}/{ID}.webp — e.g., category ID 180 → /assets/webshop/cms/80/180.webp, ID 318 → /assets/webshop/cms/18/318.webp",
    celora: "We store category images in our own storage. The path mapping from Maropost's physical path convention is not implemented.",
    status: "missing",
    priority: "high",
    fix: "During Maropost migration, store the original Maropost image URL in the category record. During rendering, map [%image%] to the stored URL or our storage equivalent.",
  },

  // ── Product Grid ──
  {
    area: "Featured Products Carousel",
    maropost: "Slick carousel (.slick-product) with 8 product cards. Each card: <article class='col-padding col-6 col-md-4 col-lg-3 allprod'> containing product-item > product-info > thumbnail, dims, GA4 data, reviews block, title, price (with RRP), stock badge, sale label, action buttons.",
    celora: "Our [%thumb_list type:'product'%] renders product items using the thumbs/product/ template. The template structure must exactly match this HTML structure for CSS to apply.",
    status: "partial",
    priority: "critical",
    fix: "The thumb template must output the exact class structure: .col-padding.col-6.col-md-4.col-lg-3.allprod > .product-item > .product-info. Our B@SE tag replacements must fill in all fields including dimensions, price, RRP, stock status, and sale labels.",
  },
  {
    area: "Product Image Paths",
    maropost: "/assets/thumb/{SKU}.png or .jpg — e.g., /assets/thumb/2168A.png, /assets/thumb/1758FD.jpg. Full images at /assets/full/{SKU}.png.",
    celora: "Product images are stored in our product-images bucket. The [%image%] tag in product templates must resolve to our storage URL, not the Maropost path.",
    status: "partial",
    priority: "high",
    fix: "During migration, import product images and map SKU-based paths. During rendering, [%image%] should output the correct storage URL.",
  },
  {
    area: "Product Price Display",
    maropost: "Complex price structure: .price-wrapper > .price (current price as <span>$X.XX</span>) + optional <label class='text-small text-gray'>RRP $X.XX</label>. Uses Bootstrap flex classes (d-flex, justify-content-between, flex-wrap).",
    celora: "Price rendering depends on the thumb template and B@SE tags like [%price%], [%rrp%]. These must output the exact wrapper structure.",
    status: "partial",
    priority: "high",
  },
  {
    area: "Stock Badge Image",
    maropost: "In-stock products show <img src='/assets/themes/skeletal/images/instockbadge.png'> — this is a THEME asset, not a product asset.",
    celora: "Theme asset paths /assets/themes/skeletal/... must be rewritten to our theme-assets storage bucket path.",
    status: "partial",
    priority: "medium",
  },
  {
    area: "Sale / Stock Labels",
    maropost: "Positioned absolutely: <div class='tops'><label class='save-label-custom'>ON SALE</label><label class='save-label-custom' style='background:#1aab63'>IN STOCK</label></div>",
    celora: "These labels come from conditional B@SE tags in the thumb template. Need to ensure [%if onsale%] and [%if instock%] conditions are evaluated.",
    status: "partial",
    priority: "medium",
  },
  {
    area: "Add to Cart Button",
    maropost: "<form class='form-inline buying-options'> with quantity input + <button class='addtocart btn-primary btn btn-block btn-loads'>Add to Cart</button>. Out of stock: <a class='notify_popup btn btn-ofs btn-block'>Out Of Stock</a>.",
    celora: "Cart form rendering depends on B@SE tags. The form must be wired to our cart context via event interception.",
    status: "partial",
    priority: "high",
  },

  // ── Content Sections ──
  {
    area: "Homepage Content (#homepage-content)",
    maropost: "Rich HTML content in a .testimonials section containing .firstpage-custom-collection with text-image layouts, USP cards with SVG icons, expandable content (checkbox trick), and styled lists.",
    celora: "This content comes from a content page or content zone, rendered via [%content%] tag. If the store has this content in the content_pages or content_zones table, it should render. If not migrated, it's missing.",
    status: "partial",
    priority: "medium",
  },
  {
    area: "Bottom Product Showcase",
    maropost: "Second .home-outer-wrapper section below content with another image + text layout promoting products.",
    celora: "Same as above — depends on content migration.",
    status: "partial",
    priority: "low",
  },

  // ── JavaScript Dependencies ──
  {
    area: "jQuery",
    maropost: "jQuery is loaded (required by Bootstrap 4 and Slick). The theme's JS files likely include or expect jQuery globally.",
    celora: "We removed CDN injection. The theme's own JS files must include jQuery. If the theme JS only has custom.js that depends on jQuery but doesn't bundle it, jQuery must be loaded separately.",
    status: "broken",
    priority: "critical",
    fix: "Check if the theme's JS files include jquery.min.js. If not, the CDN link for jQuery must be re-added, OR we detect the dependency and inject it. Most Maropost themes assume jQuery + Bootstrap are available globally.",
  },
  {
    area: "Bootstrap 4 JS",
    maropost: "Bootstrap 4.6 JS bundle (includes Popper.js) — required for carousel, dropdowns, modals, tooltips, collapse.",
    celora: "Same issue as jQuery — if not in theme JS files, needs CDN injection.",
    status: "broken",
    priority: "critical",
    fix: "Bootstrap JS is essential for carousel auto-rotation, dropdown menus, and responsive navbar toggle. Without it, the site is functionally broken.",
  },
  {
    area: "Slick Carousel JS",
    maropost: "Slick carousel library for product carousels and category grids. The .js-list-category and .slick-product containers are initialized by Slick.",
    celora: "Slick JS should be in the theme files. If present, it runs after jQuery. If missing, carousels show as flat grids.",
    status: "partial",
    priority: "high",
  },
  {
    area: "Theme Custom JS Execution",
    maropost: "Theme's custom.js / ba_custom.js runs last, initializing Slick carousels, lazy loading, sticky header, search overlay, etc.",
    celora: "We have a script executor that runs theme JS injected via dangerouslySetInnerHTML. Execution order must be: jQuery → Bootstrap → Slick → custom.js. If order is wrong, custom.js fails silently.",
    status: "partial",
    priority: "critical",
    fix: "Enforce strict JS execution order. Use a sequential loader that waits for each script to execute before loading the next.",
  },

  // ── CSS ──
  {
    area: "Theme CSS Loading",
    maropost: "CSS loads via <link> tags in <head>: slick.css → slick-theme.css → bootstrap (CDN) → app.css → custom.css. The order matters for cascade.",
    celora: "We inject theme CSS inline from the database content. The inline injection preserves order, but if there are @import statements or url() references in the CSS, they may break without the correct base URL.",
    status: "partial",
    priority: "high",
    fix: "Ensure CSS url() references are rewritten to point to the theme-assets storage bucket. CSS @import statements must be resolved.",
  },
  {
    area: "Font Awesome 4.7",
    maropost: "Font Awesome 4.7 loaded via CDN — used for icons throughout (fa-spinner, fa-search, fa-bars, fa-heart, etc.).",
    celora: "We removed CDN injection. If the theme CSS references FA classes but FA isn't loaded, icons appear as empty squares.",
    status: "broken",
    priority: "high",
    fix: "Check if theme CSS files include Font Awesome. If not (most themes use CDN), we need to detect FA usage in templates and auto-inject the CDN link.",
  },

  // ── GA4 / Analytics ──
  {
    area: "GA4 Product Data Attributes",
    maropost: "Each product card has <div class='ga4-product' data-id='SKU' data-name='...' data-price='...' data-category='...' data-currency='AUD'>. Used for Google Analytics 4 e-commerce tracking.",
    celora: "We don't inject GA4 data attributes. Not critical for visual rendering but important for analytics.",
    status: "missing",
    priority: "low",
  },

  // ── Footer ──
  {
    area: "Footer Structure",
    maropost: "Footer with link columns, payment icons, social links, copyright, ABN, and 'Popular Searches' expandable section.",
    celora: "Footer template is rendered via SSR. Content depends on template and data availability.",
    status: "partial",
    priority: "medium",
  },
];

function StatusIcon({ status }: { status: Finding["status"] }) {
  switch (status) {
    case "match": return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case "partial": return <Info className="h-5 w-5 text-yellow-500" />;
    case "missing": return <XCircle className="h-5 w-5 text-red-500" />;
    case "broken": return <AlertTriangle className="h-5 w-5 text-red-600" />;
  }
}

function PriorityBadge({ priority }: { priority: Finding["priority"] }) {
  const variants: Record<string, string> = {
    critical: "bg-red-100 text-red-800 border-red-200",
    high: "bg-orange-100 text-orange-800 border-orange-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    low: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${variants[priority]}`}>{priority.toUpperCase()}</span>;
}

function StatusBadge({ status }: { status: Finding["status"] }) {
  const variants: Record<string, string> = {
    match: "bg-green-100 text-green-800",
    partial: "bg-yellow-100 text-yellow-800",
    missing: "bg-red-100 text-red-800",
    broken: "bg-red-200 text-red-900",
  };
  const labels: Record<string, string> = { match: "✓ Match", partial: "⚠ Partial", missing: "✗ Missing", broken: "🔴 Broken" };
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${variants[status]}`}>{labels[status]}</span>;
}

export default function MaropostThemeLearning() {
  const critical = findings.filter(f => f.priority === "critical");
  const high = findings.filter(f => f.priority === "high");
  const broken = findings.filter(f => f.status === "broken");
  const missing = findings.filter(f => f.status === "missing");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Maropost Theme Learning</h1>
          <p className="text-muted-foreground mt-1">
            Deep analysis of <a href="https://www.toolsinabox.com.au" target="_blank" rel="noopener" className="text-primary underline inline-flex items-center gap-1">www.toolsinabox.com.au <ExternalLink className="h-3 w-3" /></a> vs our Celora rendering engine
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-bold">{findings.length}</div>
              <div className="text-xs text-muted-foreground">Total Findings</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-bold text-red-600">{broken.length}</div>
              <div className="text-xs text-muted-foreground">Broken</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-bold text-red-500">{missing.length}</div>
              <div className="text-xs text-muted-foreground">Missing</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-bold text-red-700">{critical.length}</div>
              <div className="text-xs text-muted-foreground">Critical Priority</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-bold text-orange-600">{high.length}</div>
              <div className="text-xs text-muted-foreground">High Priority</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Findings ({findings.length})</TabsTrigger>
            <TabsTrigger value="critical">Critical ({critical.length})</TabsTrigger>
            <TabsTrigger value="broken">Broken ({broken.length})</TabsTrigger>
            <TabsTrigger value="structure">Page Structure</TabsTrigger>
            <TabsTrigger value="assets">Asset Paths</TabsTrigger>
            <TabsTrigger value="js">JavaScript</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 mt-4">
            {findings.map((f, i) => (
              <FindingCard key={i} finding={f} />
            ))}
          </TabsContent>

          <TabsContent value="critical" className="space-y-3 mt-4">
            {critical.map((f, i) => (
              <FindingCard key={i} finding={f} />
            ))}
          </TabsContent>

          <TabsContent value="broken" className="space-y-3 mt-4">
            {broken.map((f, i) => (
              <FindingCard key={i} finding={f} />
            ))}
          </TabsContent>

          <TabsContent value="structure" className="space-y-3 mt-4">
            {findings.filter(f => ["Body Classes", "Header HTML", "Announcement Bar", "Homepage Carousel", "USP Bar"].some(a => f.area.includes(a))).map((f, i) => (
              <FindingCard key={i} finding={f} />
            ))}
          </TabsContent>

          <TabsContent value="assets" className="space-y-3 mt-4">
            {findings.filter(f => f.area.toLowerCase().includes("image") || f.area.toLowerCase().includes("path") || f.area.toLowerCase().includes("url") || f.area.toLowerCase().includes("asset") || f.area.toLowerCase().includes("font")).map((f, i) => (
              <FindingCard key={i} finding={f} />
            ))}
          </TabsContent>

          <TabsContent value="js" className="space-y-3 mt-4">
            {findings.filter(f => f.area.toLowerCase().includes("jquery") || f.area.toLowerCase().includes("bootstrap") || f.area.toLowerCase().includes("slick") || f.area.toLowerCase().includes("js") || f.area.toLowerCase().includes("javascript")).map((f, i) => (
              <FindingCard key={i} finding={f} />
            ))}
          </TabsContent>
        </Tabs>

        {/* Key Architecture Differences */}
        <Card>
          <CardHeader>
            <CardTitle>Key Architecture Differences: Maropost vs Celora</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold text-base mb-2">1. CDN Dependencies (THE #1 ISSUE)</h3>
              <p className="text-muted-foreground">
                Maropost themes assume jQuery 3.x, Bootstrap 4.6, Font Awesome 4.7, and Slick Carousel are globally available via CDN. The theme's own JS files (custom.js, ba_custom.js) call <code>$('.slick-product').slick(&#123;...&#125;)</code> expecting jQuery to exist. Without these CDN libraries, carousels don't rotate, dropdowns don't work, and icons are invisible.
              </p>
              <p className="mt-2 font-medium text-destructive">
                FIX: We must detect which CDN dependencies a theme expects and auto-inject them. Check theme templates for Bootstrap/jQuery/FA usage and inject CDN links in the correct order.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-base mb-2">2. Body/Page-Level Classes</h3>
              <p className="text-muted-foreground">
                Maropost sets <code>&lt;body id="n_home" class="n_skeletal is-scroll-up"&gt;</code> for homepage, <code>id="n_category"</code> for category pages, etc. The theme CSS has hundreds of rules targeting these selectors. Without them, most layout/spacing rules don't apply.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-base mb-2">3. Asset URL Physical Paths</h3>
              <p className="text-muted-foreground">
                Maropost uses deterministic URL patterns for all assets:
              </p>
              <ul className="list-disc pl-6 mt-1 space-y-1 text-muted-foreground">
                <li><strong>Product thumbs:</strong> <code>/assets/thumb/&#123;SKU&#125;.png</code></li>
                <li><strong>Full product images:</strong> <code>/assets/full/&#123;SKU&#125;.png</code></li>
                <li><strong>Category images:</strong> <code>/assets/webshop/cms/&#123;last2digits&#125;/&#123;ID&#125;.webp</code></li>
                <li><strong>Marketing banners:</strong> <code>/assets/marketing/&#123;ID&#125;.webp</code></li>
                <li><strong>Theme assets:</strong> <code>/assets/themes/&#123;theme_name&#125;/&#123;path&#125;</code></li>
              </ul>
              <p className="mt-2 font-medium text-destructive">
                Our asset rewriter must only rewrite theme-specific paths. Marketing, product, and category image paths must be left alone or mapped to our storage.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-base mb-2">4. Script Execution Order</h3>
              <p className="text-muted-foreground">
                The exact order matters: jQuery → Popper.js → Bootstrap → Slick → Lazy Load → Custom JS. If scripts execute out of order, <code>$</code> is undefined when custom.js runs, causing silent failures.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-base mb-2">5. Inline Content vs Template Content</h3>
              <p className="text-muted-foreground">
                The live site has rich HTML content in <code>#homepage-content</code> (USP cards, text-image layouts, expandable sections) that comes from Maropost's CMS content editor, NOT from the theme template. This content must be migrated into our content_pages or content_zones table.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Live Site HTML Structure Reference */}
        <Card>
          <CardHeader>
            <CardTitle>Live Site HTML Structure Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted/50 p-4 rounded-lg text-xs overflow-x-auto whitespace-pre leading-relaxed">{`<!-- Maropost Homepage Structure (www.toolsinabox.com.au) -->
<body id="n_home" class="n_skeletal is-scroll-up">
  <!-- HEADER (from headers/template.html) -->
  <div class="overlap-bg"></div>
  <div class="overlap-bg-menu"></div>
  
  <!-- BODY CONTENT -->
  <div class="main-content--homepage" id="mainContent">
    
    <!-- 1. Desktop Carousel -->
    <section id="homepageCarousel" class="carousel slide" data-ride="carousel">
      <ol class="carousel-indicators">...</ol>
      <div class="carousel-inner">
        <div class="carousel-item active">
          <a href="/white-series/">
            <img src="/assets/marketing/151.webp" class="edd-block edw-100" />
          </a>
        </div>
        <!-- 5 more slides -->
      </div>
      <a class="carousel-control-prev" data-slide="prev">...</a>
      <a class="carousel-control-next" data-slide="next">...</a>
    </section>
    
    <!-- 2. Mobile Carousel (separate) -->
    <section id="mainCarousel_mb" class="carousel slide" data-ride="carousel">
      <!-- 4 mobile-specific slides with 960x520 images -->
    </section>
    
    <!-- 3. USP Trust Badges -->
    <section class="section home-usps">
      <div class="container"><div class="row">
        <div class="js-usp">
          <div class="col-6 col-md-3 usps">
            <a href="/about_us">
              <div class="usps__icon"><svg>...</svg></div>
              <div class="usps__content">100% Australian Owned</div>
            </a>
          </div>
          <!-- 3 more USP items -->
        </div>
      </div></div>
    </section>
    
    <!-- 4. Popular Categories Grid (Slick carousel) -->
    <section class="section list-category-box">
      <div class="section-title meg-h2">POPULAR CATEGORIES</div>
      <div class="container"><div class="row justify-content-center">
        <div class="js-list-category">
          <div class="hovercartmain">
            <a class="hovercart" href="/all-toolboxes">
              <img width="217" height="137" src="/assets/webshop/cms/80/180.webp" />
              <p class="view">All Toolboxes</p>
            </a>
          </div>
          <!-- 21 more category tiles -->
        </div>
      </div></div>
    </section>
    
    <!-- 5. CMS Content (from Maropost content editor) -->
    <section class="section testimonials">
      <div class="container">
        <div id="homepage-content">
          <div class="firstpage-custom-collection">
            <!-- Rich HTML: text-image layouts, USP cards, lists -->
          </div>
        </div>
      </div>
    </section>
    
    <!-- 6. Featured Products Carousel (Slick) -->
    <div class="home-outer-wrapper">
      <section class="section overflow-hidden">
        <div class="container"><div class="row">
          <h2 class="section-title">Featured <span>PRODUCTS</span></h2>
          <div class="slick-product">
            <article class="col-padding col-6 col-md-4 col-lg-3 allprod">
              <div class="product-item">
                <div class="product-info">
                  <a class="product-thumbnail" href="/product-slug">
                    <img src="/assets/thumb/SKU.png" class="product-image" />
                  </a>
                  <div class="dims text-center">210 x 60 x 82cm</div>
                  <div class="product-title meg-h3"><a>Product Name</a></div>
                  <div class="product-price">
                    <div class="price"><span>$1,550.00</span></div>
                    <label class="text-small text-gray">RRP $2,150.00</label>
                    <img src="/assets/themes/skeletal/images/instockbadge.png" />
                  </div>
                  <div class="tops">
                    <label class="save-label-custom">ON SALE</label>
                  </div>
                  <div class="product-action">
                    <div class="view-more btn"><a>VIEW MORE</a></div>
                    <form class="buying-options">
                      <button class="addtocart btn-primary">Add to Cart</button>
                    </form>
                  </div>
                </div>
              </div>
            </article>
            <!-- 7 more products -->
          </div>
        </div></div>
      </section>
    </div>
    
  </div>
  
  <!-- FOOTER (from footers/template.html) -->
</body>`}</pre>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function FindingCard({ finding }: { finding: Finding }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <StatusIcon status={finding.status} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-semibold">{finding.area}</span>
              <StatusBadge status={finding.status} />
              <PriorityBadge priority={finding.priority} />
            </div>
            <div className="grid md:grid-cols-2 gap-3 mt-2 text-sm">
              <div>
                <div className="text-xs font-medium text-green-700 mb-1">Maropost (Live Site)</div>
                <p className="text-muted-foreground">{finding.maropost}</p>
              </div>
              <div>
                <div className="text-xs font-medium text-blue-700 mb-1">Celora (Our Engine)</div>
                <p className="text-muted-foreground">{finding.celora}</p>
              </div>
            </div>
            {finding.fix && (
              <div className="mt-2 bg-destructive/5 border border-destructive/20 rounded p-2 text-sm">
                <span className="font-medium text-destructive">Fix: </span>
                <span className="text-muted-foreground">{finding.fix}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
