import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Code2, FolderTree, Link2, Tag, Layout, Image, ShoppingCart, Users, FileText, Zap, Globe, Server, Palette, Search } from "lucide-react";

function Section({ title, icon: Icon, children }: { title: string; icon?: any; children: React.ReactNode }) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-primary" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-2">{children}</CardContent>
    </Card>
  );
}

function CodeBlock({ children, title }: { children: string; title?: string }) {
  return (
    <div className="rounded-md border bg-muted/50 overflow-x-auto">
      {title && <div className="px-3 py-1.5 border-b text-xs font-medium text-muted-foreground bg-muted/30">{title}</div>}
      <pre className="p-3 text-xs font-mono whitespace-pre-wrap">{children}</pre>
    </div>
  );
}

function TagTable({ rows }: { rows: [string, string][] }) {
  return (
    <div className="rounded-md border overflow-hidden">
      <table className="w-full text-xs">
        <thead><tr className="bg-muted/50"><th className="text-left p-2 font-medium">Tag</th><th className="text-left p-2 font-medium">Description</th></tr></thead>
        <tbody>
          {rows.map(([tag, desc], i) => (
            <tr key={i} className={i % 2 === 0 ? "" : "bg-muted/20"}>
              <td className="p-2 font-mono text-primary whitespace-nowrap">{tag}</td>
              <td className="p-2 text-muted-foreground">{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MaropostLearning() {
  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Maropost / Neto Learning Centre
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive reference for Maropost Commerce Cloud (Neto) — B@SE templating, API, theme architecture, URL routing, and data models.
          </p>
        </div>

        <Tabs defaultValue="architecture" className="space-y-4">
          <ScrollArea className="w-full">
            <TabsList className="inline-flex w-auto">
              <TabsTrigger value="architecture">Architecture</TabsTrigger>
              <TabsTrigger value="base-tags">B@SE Tags</TabsTrigger>
              <TabsTrigger value="data-tags">Data Tags</TabsTrigger>
              <TabsTrigger value="function-tags">Function Tags</TabsTrigger>
              <TabsTrigger value="urls">URL System</TabsTrigger>
              <TabsTrigger value="theme">Theme Structure</TabsTrigger>
              <TabsTrigger value="api">API</TabsTrigger>
              <TabsTrigger value="orders">Order System</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="customers">Customers</TabsTrigger>
              <TabsTrigger value="assets">Assets & CDN</TabsTrigger>
              <TabsTrigger value="cart">Cart & Checkout</TabsTrigger>
              <TabsTrigger value="seo">SEO & Optimisation</TabsTrigger>
              <TabsTrigger value="gotchas">Gotchas & Tips</TabsTrigger>
            </TabsList>
          </ScrollArea>

          {/* ═══════════════ ARCHITECTURE ═══════════════ */}
          <TabsContent value="architecture" className="space-y-4">
            <Section title="Platform Overview" icon={Globe}>
              <p>Maropost Commerce Cloud (formerly Neto) is an Australian-built multi-channel eCommerce platform. It provides:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Multi-tenant SaaS</strong> — each merchant gets a webstore at <code>*.neto.com.au</code> or a custom domain</li>
                <li><strong>B@SE Template Engine</strong> — server-side templating language that renders HTML pages from template files</li>
                <li><strong>REST-style API</strong> — POST-based API at <code>/do/WS/NetoAPI</code> for all CRUD operations</li>
                <li><strong>Multi-channel</strong> — online store, POS, eBay, Amazon, Catch, Google Shopping, Facebook Shop, Trade Me</li>
                <li><strong>Bootstrap-based themes</strong> — all official themes use Bootstrap 3 or 4 with jQuery</li>
              </ul>
            </Section>

            <Section title="Page Rendering Pipeline" icon={Layout}>
              <p>Every page in Maropost is composed of <strong>3 template layers</strong>:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">1</Badge>
                  <span><strong>Header Template</strong> — <code>headers/template.html</code> — contains <code>&lt;!DOCTYPE&gt;</code>, <code>&lt;head&gt;</code>, navigation, opening <code>&lt;body&gt;</code></span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">2</Badge>
                  <span><strong>Body Template</strong> — page-specific template from <code>templates/cms/</code>, <code>templates/products/</code>, etc.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">3</Badge>
                  <span><strong>Footer Template</strong> — <code>footers/template.html</code> — closing scripts, footer HTML, closing <code>&lt;/body&gt;&lt;/html&gt;</code></span>
                </div>
              </div>
              <Separator className="my-3" />
              <p>The header template typically includes sub-templates via <code>[%load_template%]</code>:</p>
              <CodeBlock title="Header include chain">{`[%load_template file:'headers/includes/head.template.html'/%]
[%load_template file:'headers/includes/nav.template.html'/%]
[%load_template file:'headers/includes/mega-menu.template.html'/%]`}</CodeBlock>
            </Section>

            <Section title="Template Hierarchy" icon={FolderTree}>
              <p>The B@SE engine processes templates in this order:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li><strong>Page Templates</strong> — the main body template selected per page type</li>
                <li><strong>Shared Includes</strong> — loaded via <code>[%load_template%]</code>, shared across pages</li>
                <li><strong>Thumbs/Partials</strong> — product cards, category tiles loaded by <code>[%thumb_list%]</code></li>
                <li><strong>Assets</strong> — CSS, JS, images referenced via <code>[%ntheme_asset%]</code></li>
              </ol>
              <p className="mt-2 text-muted-foreground">Templates are parsed server-side. You cannot upload raw <code>.html</code> files and expect them to render — they must use the B@SE template structure.</p>
            </Section>

            <Section title="Multi-Channel Architecture" icon={ShoppingCart}>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Online Store</strong> — primary channel with full theme control</li>
                <li><strong>POS</strong> — integrated point-of-sale with barcode scanning</li>
                <li><strong>eBay</strong> — separate eBay templates with eBay-specific B@SE tags</li>
                <li><strong>Amazon / Catch</strong> — feed-based marketplace listings</li>
                <li><strong>Google Shopping</strong> — product feed via XML</li>
                <li><strong>Facebook Shop</strong> — catalogue sync</li>
                <li><strong>B2B / Wholesale</strong> — customer group pricing, approval workflows</li>
              </ul>
            </Section>
          </TabsContent>

          {/* ═══════════════ B@SE TAGS OVERVIEW ═══════════════ */}
          <TabsContent value="base-tags" className="space-y-4">
            <Section title="B@SE Tag Syntax" icon={Code2}>
              <p>B@SE uses two tag formats:</p>
              <div className="space-y-3">
                <div>
                  <Badge className="mb-1">Data Tags</Badge>
                  <CodeBlock>{`[@tag_name@]           — outputs a value
[@config:setting@]     — outputs a config value
[@user:username@]      — outputs current user data`}</CodeBlock>
                </div>
                <div>
                  <Badge className="mb-1">Function Tags</Badge>
                  <CodeBlock>{`[%function_name param:'value'%]   — block open
[%/function_name%]                — block close
[%function_name param:'value' /%] — self-closing`}</CodeBlock>
                </div>
              </div>
            </Section>

            <Section title="Tag Categories" icon={Tag}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm mb-2">Function Tags</h4>
                  <ul className="text-xs space-y-1">
                    <li><code>if / elseif / else</code> — conditional logic</li>
                    <li><code>set</code> — variable assignment</li>
                    <li><code>calc</code> — arithmetic operations</li>
                    <li><code>round</code> — decimal rounding</li>
                    <li><code>forloop</code> — counted loops</li>
                    <li><code>format</code> — data formatting (currency, date, number)</li>
                    <li><code>load_template</code> — include sub-templates</li>
                    <li><code>load_ajax_template</code> — async template loading</li>
                    <li><code>thumb_list</code> — product/content listings</li>
                    <li><code>content_menu</code> — navigation menus</li>
                    <li><code>advert</code> — advertisement blocks</li>
                    <li><code>url</code> — URL generation</li>
                    <li><code>ntheme_asset</code> — theme asset paths</li>
                    <li><code>asset_url</code> — CP-uploaded asset paths</li>
                    <li><code>cdn_asset</code> — CDN asset paths</li>
                    <li><code>cache</code> — output caching</li>
                    <li><code>paging / pagination</code> — page navigation</li>
                    <li><code>product</code> — single product data</li>
                    <li><code>data</code> — legacy conditional/calc (deprecated)</li>
                    <li><code>menu</code> — CP-managed menus</li>
                    <li><code>list</code> — new unified listing function</li>
                  </ul>
                </div>
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm mb-2">Data Tags by Page Type</h4>
                  <ul className="text-xs space-y-1">
                    <li><strong>Product Pages</strong> — SKU, price, images, variants, stock</li>
                    <li><strong>Category Pages</strong> — category name, description, breadcrumbs</li>
                    <li><strong>Content Pages</strong> — title, body, SEO fields, images</li>
                    <li><strong>Cart Pages</strong> — line items, totals, shipping</li>
                    <li><strong>Checkout Pages</strong> — billing/shipping, payment methods</li>
                    <li><strong>Customer Pages</strong> — account, orders, wishlist, addresses</li>
                    <li><strong>Email Templates</strong> — order details, customer info</li>
                    <li><strong>Value Tags</strong> — config, user, form data (dynamic)</li>
                  </ul>
                </div>
              </div>
            </Section>
          </TabsContent>

          {/* ═══════════════ DATA TAGS ═══════════════ */}
          <TabsContent value="data-tags" className="space-y-4">
            <Section title="Product Page Data Tags" icon={Tag}>
              <TagTable rows={[
                ["[@SKU@]", "Product SKU identifier"],
                ["[@name@]", "Product name"],
                ["[@model@]", "Product model number"],
                ["[@subtitle@]", "Product subtitle"],
                ["[@description@]", "Full HTML description"],
                ["[@short_description@]", "Short/summary description"],
                ["[@store_price@]", "Price based on user's group ID"],
                ["[@retail_price@]", "Retail/RRP price"],
                ["[@cost@]", "Cost price"],
                ["[@store_quantity@]", "Available quantity for purchase"],
                ["[@date_created@]", "Date product was created"],
                ["[@date_updated@]", "Date product was last updated"],
                ["[@brand@]", "Product brand name"],
                ["[@weight@]", "Product weight"],
                ["[@acc_code@]", "Accounting code"],
                ["[@active@]", "Boolean: 1 when product is active"],
                ["[@approval@]", "Boolean: 1 when product is approved"],
                ["[@extra@]", "Boolean: true if product has Extra Options"],
                ["[@content_fullpath@]", "Full URL path to the product"],
                ["[@content_id@]", "Internal content ID"],
                ["[@thumb_url@]", "Primary thumbnail image URL"],
                ["[@actual_height@]", "Assembled height dimension"],
                ["[@actual_length@]", "Assembled length dimension"],
                ["[@actual_width@]", "Assembled width dimension"],
                ["[@print_label@]", "Number of labels to print per product"],
                ["[@status@]", "Product status code"],
                ["[@access_control@]", "True if page requires login"],
              ]} />
            </Section>

            <Section title="Content & Category Page Data Tags" icon={FileText}>
              <TagTable rows={[
                ["[@content_name@]", "Category/content page name"],
                ["[@content_description@]", "Category description HTML"],
                ["[@content_fullpath@]", "Full URL path"],
                ["[@content_id@]", "Content page internal ID"],
                ["[@seo_title@]", "SEO meta title"],
                ["[@seo_description@]", "SEO meta description"],
                ["[@parent_name@]", "Parent category name"],
                ["[@parent_url@]", "Parent category URL"],
                ["[@breadcrumb@]", "Breadcrumb trail HTML"],
              ]} />
            </Section>

            <Section title="Checkout & Cart Data Tags" icon={ShoppingCart}>
              <TagTable rows={[
                ["[@grand_total@]", "Grand total of the order"],
                ["[@subtotal@]", "Subtotal before tax/shipping"],
                ["[@shipping_total@]", "Shipping cost"],
                ["[@tax_total@]", "Tax amount"],
                ["[@bill_city@]", "Billing address city"],
                ["[@bill_company@]", "Billing address company"],
                ["[@bill_country@]", "Billing address country"],
                ["[@bill_firstname@]", "Billing first name"],
                ["[@bill_lastname@]", "Billing last name"],
                ["[@ship_city@]", "Shipping address city"],
                ["[@ship_country@]", "Shipping address country"],
                ["[@customer_ref1@] - [@customer_ref4@]", "Order misc/reference fields"],
                ["[@add_reminder@]", "Add reminder field value"],
                ["[@agree@]", "T&C checkbox value"],
                ["[@cart_count@]", "Number of items in cart (Cart Page exclusive)"],
              ]} />
            </Section>

            <Section title="Customer Page Data Tags" icon={Users}>
              <TagTable rows={[
                ["[@active@]", "Boolean: true when customer is active"],
                ["[@addr_id@]", "Unique ID for default address"],
                ["[@approval_username@]", "Username of quote approver"],
                ["[@def_order_type@]", "Default order type for the account"],
                ["[@default_discounts@]", "Default order-wide discount percentage"],
                ["[@usercustom1@] - [@usercustom3@]", "Custom customer fields"],
                ["[@user:username@]", "Current logged-in username (value tag)"],
                ["[@user:email@]", "Current logged-in email (value tag)"],
              ]} />
            </Section>

            <Section title="Value Tags (Dynamic Sources)" icon={Zap}>
              <TagTable rows={[
                ["[@config:home_url@]", "Store home URL"],
                ["[@config:store_name@]", "Store name from settings"],
                ["[@config:display_special_content@]", "Config flag for special content"],
                ["[@config:imageurl@]", "Base image URL from config"],
                ["[@user:username@]", "Currently logged-in username"],
                ["[@user:email@]", "Currently logged-in email"],
                ["[@form:fieldname@]", "Data from URL query string parameter"],
              ]} />
              <p className="mt-2 text-xs text-muted-foreground">
                Form data example: URL <code>mysite.com/page?color=red</code> → <code>[@form:color@]</code> outputs <code>red</code>
              </p>
            </Section>
          </TabsContent>

          {/* ═══════════════ FUNCTION TAGS ═══════════════ */}
          <TabsContent value="function-tags" className="space-y-4">
            <Section title="IF / ELSEIF / ELSE" icon={Code2}>
              <CodeBlock title="Syntax">{`[%if [@somedata@] like 'apple' %]
    Apple
[%elseif [@somedata@] like 'orange' %]
    Orange
[%elseif [@somedata@] ne '' %]
    Has data but not apple or orange
[%else%]
    Nothing
[%/if%]`}</CodeBlock>
              <h4 className="font-medium mt-3 mb-1">Operators</h4>
              <TagTable rows={[
                ["==", "Equal to (integers)"],
                ["eq", "Equal to (strings)"],
                ["!=", "Not equal (integers)"],
                ["ne", "Not equal (strings)"],
                ["<", "Less than"],
                [">", "Greater than"],
                ["<=", "Less than or equal to"],
                [">=", "Greater than or equal to"],
                ["like", "String contains / pattern match"],
                ["or", "Logical OR"],
                ["and", "Logical AND"],
              ]} />
              <p className="mt-2 text-xs text-muted-foreground">
                <strong>Important:</strong> Use <code>eq</code>/<code>ne</code> for string comparisons and <code>==</code>/<code>!=</code> for numeric comparisons.
              </p>
            </Section>

            <Section title="SET (Variable Assignment)" icon={Code2}>
              <CodeBlock title="Setting a variable">{`[%set [@unixdate@] %]
    [%format type:'date' format:'#U'%][@date_created@][%/format%]
[%/set%]

<!-- Use it later -->
[@unixdate@]`}</CodeBlock>
              <p className="text-xs text-muted-foreground mt-2">
                <strong>Scoping:</strong> Variables are scoped to the <code>[%param%]</code> block they are defined in. A variable set inside <code>*header</code> param is NOT available in <code>*body</code> param. Use <code>scope:'global'</code> to make it page-wide.
              </p>
            </Section>

            <Section title="FORLOOP (Counted Loop)" icon={Code2}>
              <CodeBlock title="Syntax">{`[%forloop from:'1' to:'10' %]
    [%param *body%]
        Item [@count@]
    [%/param%]
[%/forloop%]`}</CodeBlock>
              <p className="text-xs text-muted-foreground">The <code>[@count@]</code> tag increments automatically within the loop.</p>
            </Section>

            <Section title="FORMAT (Data Formatting)" icon={Code2}>
              <CodeBlock title="Currency, date, number formatting">{`[%format type:'currency'%][@price@][%/format%]
[%format type:'date' format:'d/m/Y'%][@date_created@][%/format%]
[%format type:'number' decimals:'2'%][@weight@][%/format%]
[%format type:'csv'%]Field with "quotes"[%/format%]
[%format type:'percent'%][@discount@][%/format%]
[%format type:'truncate' length:'100'%][@description@][%/format%]`}</CodeBlock>
              <h4 className="font-medium mt-3 mb-1">Format Types</h4>
              <TagTable rows={[
                ["currency", "Format as currency with store's currency symbol"],
                ["date", "Format date/time with PHP-style format string"],
                ["number", "Format numbers with decimal control"],
                ["percent", "Format as percentage"],
                ["csv", "Escape for CSV export"],
                ["truncate", "Truncate text to length"],
                ["nohtml", "Strip HTML tags"],
                ["urlencode", "URL encode a string"],
              ]} />
            </Section>

            <Section title="LOAD_TEMPLATE (Include)" icon={Code2}>
              <CodeBlock title="Syntax">{`[%load_template file:'headers/includes/head.template.html'/%]
[%load_template file:'headers/includes/nav.template.html'/%]

<!-- AJAX loaded (async) -->
[%load_ajax_template file:'templates/partials/reviews.template.html'/%]`}</CodeBlock>
              <p className="text-xs text-muted-foreground">
                The file path is relative to the theme's root directory: <code>/httpdocs/assets/themes/THEME_NAME/</code>
              </p>
            </Section>

            <Section title="THUMB_LIST (Product/Content Listings)" icon={Code2}>
              <CodeBlock title="Product listing with params">{`[%thumb_list type:'products' template:'' filter_category:'' limit:'10'%]
    [%param *header%]
        <div class="product-grid">
    [%/param%]
    [%param *body%]
        <div class="product-card">
            <img src="[@thumb_url@]" alt="[@name@]" />
            <h3>[@name@]</h3>
            <span>[@store_price@]</span>
        </div>
    [%/param%]
    [%param *footer%]
        </div>
    [%/param%]
    [%param *ifempty%]
        <p>No products found.</p>
    [%/param%]
[%/thumb_list%]`}</CodeBlock>
              <h4 className="font-medium mt-3 mb-1">Types</h4>
              <p className="text-xs">
                <code>products</code>, <code>adverts</code>, <code>allbrands</code>, <code>articles</code>, <code>blogs</code>, <code>brands</code>,
                <code>buying_guides</code>, <code>categories</code>, <code>child_products</code>, <code>content</code>,
                <code>content_reviews</code>, <code>count_products</code>, <code>customers</code>, <code>dispute_messages</code>, <code>dispute_orders</code>
              </p>
              <h4 className="font-medium mt-3 mb-1">Key Parameters</h4>
              <TagTable rows={[
                ["type:''", "Content type to list"],
                ["template:''", "Partial template filename (no extension)"],
                ["limit:''", "Max results to return"],
                ["filter_category:''", "Filter by category"],
                ["filter_inventory_id:''", "Filter by SKU(s), comma-separated"],
                ["filter_a2z:''", "Filter by starting character"],
                ["sort:''", "Sort field"],
              ]} />
              <h4 className="font-medium mt-3 mb-1">Params (sections)</h4>
              <TagTable rows={[
                ["*header", "Rendered once above the listing"],
                ["*body", "Rendered for each item (the loop)"],
                ["*footer", "Rendered once below the listing"],
                ["*ifempty", "Rendered when no results"],
              ]} />
              <h4 className="font-medium mt-3 mb-1">Header/Footer Data Tags</h4>
              <TagTable rows={[
                ["[@current_page@]", "Current page number"],
                ["[@limit@]", "Items per page limit"],
                ["[@total_products@]", "Total items matching filter"],
              ]} />
            </Section>

            <Section title="CONTENT_MENU (Navigation)" icon={Code2}>
              <CodeBlock title="Category mega menu">{`[%content_menu content_type:'category' sortby:'sortorder,name' show_empty:'1'%]
    [%param *header%]
        <ul class="nav">
    [%/param%]
    [%param *level_1%]
        <li class="nav-item">
            <a href="[@url@]">[@name@]</a>
            [%if [@next_level@]%]
                <ul>[@next_level@]</ul>
            [%/if%]
        </li>
    [%/param%]
    [%param *level_2%]
        <li><a href="[@url@]">[@name@]</a>
            [%if [@next_level@]%]<ul>[@next_level@]</ul>[%/if%]
        </li>
    [%/param%]
    [%param *level_3%]
        <li><a href="[@url@]">[@name@]</a></li>
    [%/param%]
    [%param *footer%]
        </ul>
    [%/param%]
[%/content_menu%]`}</CodeBlock>
              <p className="text-xs text-muted-foreground mt-2">
                Available data tags in each level: <code>[@url@]</code>, <code>[@name@]</code>, <code>[@next_level@]</code> (renders child levels recursively).
                Content types: <code>category</code>, <code>blog</code>, <code>information</code>, etc.
              </p>
            </Section>

            <Section title="ADVERT (Advertisements)" icon={Image}>
              <CodeBlock title="Text advert">{`[%advert type:'text' ad_group:'homepage-banners' template:'text' limit:'5'%]
    [%param *header%]<div class="carousel">[%/param%]
    [%param *body%]
        <div class="slide">
            <a href="[@url@]">
                <img src="[@asset_url@]" alt="[@headline@]" />
            </a>
        </div>
    [%/param%]
    [%param *footer%]</div>[%/param%]
[%/advert%]

<!-- Self-closing (uses template file) -->
[%advert type:'text' ad_group:'top-banner' template:'banner' limit:'1'/%]`}</CodeBlock>
              <h4 className="font-medium mt-3 mb-1">Advert Types</h4>
              <TagTable rows={[
                ["text", "Image + headline + description + link — most versatile"],
                ["product", "Product-based advert — uses product data tags"],
                ["banner", "DEPRECATED — use text type with carousel CSS instead"],
              ]} />
              <h4 className="font-medium mt-3 mb-1">Advert Data Tags</h4>
              <TagTable rows={[
                ["[@ad_group@]", "Name of the advert group"],
                ["[@headline@]", "Headline/title of the advert"],
                ["[@description@]", "Advert description text"],
                ["[@asset_url@]", "Advert image URL"],
                ["[@url@]", "Click-through URL"],
                ["[@model@] / [@name@]", "Product name (product type only)"],
                ["[@short_description@]", "Short description (product type)"],
              ]} />
            </Section>

            <Section title="CALC (Arithmetic)" icon={Code2}>
              <CodeBlock title="Arithmetic operations">{`[%calc%][@price@] * 1.1[%/calc%]           <!-- Add 10% -->
[%calc%][@price@] - [@discount@][%/calc%]    <!-- Subtract -->
[%calc%][@qty@] * [@price@][%/calc%]          <!-- Multiply -->

[%round decimals:'2'%]
    [%calc%][@price@] * 1.1[%/calc%]
[%/round%]`}</CodeBlock>
            </Section>

            <Section title="CACHE (Output Caching)" icon={Zap}>
              <CodeBlock>{`[%cache type:'cmenu' id:'header_category_menu'%]
    <!-- Expensive menu generation cached with key -->
    [%content_menu content_type:'category' ...%]...[%/content_menu%]
[%/cache%]`}</CodeBlock>
              <p className="text-xs text-muted-foreground">Used to cache expensive template operations like navigation menus. Cache is invalidated when content changes.</p>
            </Section>

            <Section title="PRODUCT (Single Product Data)" icon={Code2}>
              <CodeBlock>{`[%product sku:'[@sku@]'%]
    [%param *body%]
        <p>[@sku@] — [@model@] — $[@store_price@]</p>
    [%/param%]
[%/product%]`}</CodeBlock>
              <p className="text-xs text-muted-foreground">Pull data from a specific product anywhere on the site by SKU.</p>
            </Section>

            <Section title="DATA (Legacy — Deprecated)" icon={Code2}>
              <CodeBlock>{`[%set [@test@] %]2[%/set%]
[%data id:'test'%]
    [%param case_1%]1[%/param%]
    [%param case_1_value%] one[%/param%]
    [%param case_2%]2[%/param%]
    [%param case_2_value%] two[%/param%]
    [%param default%] unknown[%/param%]
[%/data%]`}</CodeBlock>
              <p className="text-xs text-muted-foreground">Switch/case logic. Superseded by <code>[%if%]</code> statements. Still found in older themes.</p>
            </Section>

            <Section title="LIST (New Unified Listing)" icon={Code2}>
              <CodeBlock>{`[%list type:'content' template:'category' limit:'12' 
      filter:'content_type=category' sort:'content_name' page:'0'%]
    <!-- Uses same *header, *body, *footer, *ifempty params -->
[%/list%]

[%list type:'product' limit:'20' filter:'category=shoes' sort:'price'%]
    ...
[%/list%]`}</CodeBlock>
              <p className="text-xs text-muted-foreground">
                Newer replacement for many older listing functions. Types: <code>content</code>, <code>product</code>, <code>content_review</code>, <code>product_review</code>, <code>store_location</code>.
              </p>
            </Section>
          </TabsContent>

          {/* ═══════════════ URL SYSTEM ═══════════════ */}
          <TabsContent value="urls" className="space-y-4">
            <Section title="URL Tag — [%url%]" icon={Link2}>
              <CodeBlock title="Syntax">{`[%url page:'account' type:'login' /%]
[%url page:'checkout' type:'cart' /%]
[%url type:'home' /%]`}</CodeBlock>
              <h4 className="font-medium mt-3 mb-1">Complete URL Parameter Map</h4>
              <TagTable rows={[
                ["page:'account'", "Customer account page → /_myaccount"],
                ["page:'account' type:'login'", "Login page"],
                ["page:'account' type:'register'", "Registration page"],
                ["page:'account' type:'edit_account'", "Edit account details"],
                ["page:'account' type:'orders'", "Customer order history"],
                ["page:'account' type:'orders' id:'ORDER_ID'", "Specific order view"],
                ["page:'account' type:'wishlist'", "Customer wishlist"],
                ["page:'account' type:'documents'", "Customer files"],
                ["page:'account' type:'approve_quote'", "Quote approval page"],
                ["page:'account' type:'approve_quote' id:'ID' fn:'confirm'", "Confirm specific quote"],
                ["page:'account' type:'nr_track_order'", "Track order page"],
                ["page:'checkout'", "Cart page → /_mycart"],
                ["page:'checkout' type:'cart'", "Cart page"],
                ["page:'checkout' fn:'payment'", "Checkout/payment page"],
                ["page:'checkout' fn:'3rdparty'", "Third-party payment"],
                ["type:'home'", "Homepage"],
                ["page:'home'", "Homepage"],
                ["type:'item' id:'SKU'", "Product detail page → /SKU"],
                ["type:'content' id:'ID'", "Content/category page"],
                ["page:'content' id:'ID'", "Content page by ID"],
                ["page:'page' id:'ID'", "Static page by ID"],
                ["id:'95'", "Specific content page by ID (e.g., contact)"],
              ]} />
            </Section>

            <Section title="Physical URL Routes" icon={Globe}>
              <p>Maropost uses these physical URL paths:</p>
              <TagTable rows={[
                ["/_mycart", "Shopping cart page"],
                ["/_mycart?fn=payment", "Checkout / payment page"],
                ["/_mycart?sku=SKU&qty=1", "Add product to cart"],
                ["/_mycart?multi=2&sku0=A&qty0=1&sku1=B&qty1=2", "Add multiple products"],
                ["/_mycart?addcpn=CODE", "Apply coupon to cart"],
                ["/_myaccount", "Customer account dashboard"],
                ["/_myaccount?page=login", "Login page"],
                ["/_myaccount?page=register", "Registration page"],
                ["/_myaccount?page=wishlist", "Wishlist page"],
                ["/_myaccount?page=nr_track_order", "Track order page"],
                ["/_myaccount?page=forgotpwd", "Forgot password"],
                ["/_myaccount?page=forgotusr", "Forgot username"],
                ["/products", "All products listing"],
                ["/SKU-slug", "Product detail (SEO URL from SKU)"],
                ["/category-slug", "Category page (SEO URL)"],
                ["/contact-us", "Contact page"],
                ["/do/WS/NetoAPI", "API endpoint"],
              ]} />
            </Section>

            <Section title="Cart URL Parameters" icon={ShoppingCart}>
              <CodeBlock title="Cart manipulation via URL">{`<!-- Add single product -->
/_mycart?sku=TEST_PRODUCT&qty=2

<!-- Add multiple products -->
/_mycart?multi=2&sku0=PROD_A&qty0=1&sku1=PROD_B&qty1=3

<!-- Apply coupon -->
/_mycart?addcpn=FREESHIPPING

<!-- Go directly to checkout -->
/_mycart?fn=payment

<!-- AJAX add to cart -->
await fetch("/_mycart?sku=SOME_SKU");
window.location = "/_mycart?fn=payment";`}</CodeBlock>
            </Section>
          </TabsContent>

          {/* ═══════════════ THEME STRUCTURE ═══════════════ */}
          <TabsContent value="theme" className="space-y-4">
            <Section title="Directory Structure" icon={FolderTree}>
              <CodeBlock title="Full theme folder layout">{`httpdocs/
└── assets/
    └── themes/
        └── THEME_NAME/
            ├── templates/
            │   ├── cms/
            │   │   ├── home.template.html          ← Homepage body
            │   │   ├── default.template.html        ← Default content page
            │   │   └── contact.template.html        ← Contact page
            │   ├── products/
            │   │   ├── product.template.html         ← Product detail page
            │   │   ├── search.template.html          ← Search results
            │   │   └── product_list.template.html    ← Product listing
            │   ├── checkout/
            │   │   ├── cart.template.html             ← Shopping cart
            │   │   └── payment.template.html          ← Checkout/payment
            │   ├── account/
            │   │   ├── login.template.html            ← Login page
            │   │   ├── register.template.html         ← Registration
            │   │   ├── dashboard.template.html        ← Account dashboard
            │   │   ├── orders.template.html            ← Order history
            │   │   └── wishlist.template.html          ← Wishlist
            │   ├── write_review/
            │   │   ├── write.template.html
            │   │   ├── preview.template.html
            │   │   ├── not_found.template.html
            │   │   └── confirm.template.html
            │   └── shared/
            │       └── partials...
            ├── headers/
            │   ├── template.html                      ← Main header (<!DOCTYPE> to nav)
            │   └── includes/
            │       ├── head.template.html              ← <head> content
            │       ├── nav.template.html               ← Navigation bar
            │       └── mega-menu.template.html         ← Mega menu
            ├── footers/
            │   ├── template.html                      ← Main footer
            │   └── includes/
            │       └── scripts.template.html           ← Footer JS includes
            ├── thumbs/
            │   ├── product-card.template.html          ← Product card partial
            │   ├── category-card.template.html         ← Category card partial
            │   └── brand-card.template.html            ← Brand card partial
            ├── css/
            │   ├── app.css               ← Compiled base CSS (DO NOT EDIT)
            │   ├── style.css             ← Theme-specific styles
            │   ├── custom.css            ← Custom overrides
            │   ├── slick.css             ← Slick carousel
            │   └── slick-theme.css       ← Slick theme styles
            ├── js/
            │   ├── custom.js             ← Essential front-end scripts (DO NOT EDIT)
            │   ├── vendor.js             ← Third-party libraries
            │   └── ba_custom.js          ← Custom JavaScript
            ├── scss/
            │   ├── app.scss              ← Source SCSS (compiled to css/app.css)
            │   └── _variables.scss       ← Theme variables
            ├── img/
            │   └── ...                   ← Theme images
            └── fonts/
                └── ...                   ← Custom fonts`}</CodeBlock>
            </Section>

            <Section title="Key CSS Files" icon={Palette}>
              <TagTable rows={[
                ["app.css", "Compiled base template CSS — DO NOT EDIT directly. Generated from scss/app.scss"],
                ["style.css", "Theme-specific styles — the main place for custom theme CSS"],
                ["custom.css", "Additional custom overrides — loaded last for highest specificity"],
                ["slick.css", "Slick carousel base styles"],
                ["slick-theme.css", "Slick carousel theme (arrows, dots)"],
              ]} />
            </Section>

            <Section title="CSS Loading Order in Header" icon={Code2}>
              <CodeBlock title="Standard head.template.html CSS includes">{`<!-- Theme CSS files loaded via ntheme_asset -->
<link rel="stylesheet" href="[%ntheme_asset%]css/slick.css[%/ntheme_asset%]" media="all">
<link rel="stylesheet" href="[%ntheme_asset%]css/slick-theme.css[%/ntheme_asset%]" media="all">
<link rel="stylesheet" href="[%ntheme_asset%]css/app.css[%/ntheme_asset%]" media="all"/>
<link rel="stylesheet" href="[%ntheme_asset%]css/style.css[%/ntheme_asset%]" media="all"/>
<link rel="stylesheet" href="[%ntheme_asset%]css/custom.css[%/ntheme_asset%]" media="all"/>

<!-- Platform fonts (hardcoded path) -->
<link rel="stylesheet" href="/assets/themes/skeletal/fonts/titillium.css" media="all">

<!-- CDN resources -->
<link rel="stylesheet" href="[%cdn_asset%]css/bootstrap.min.css[%/cdn_asset%]">
<link rel="stylesheet" href="[%cdn_asset%]css/font-awesome.min.css[%/cdn_asset%]">`}</CodeBlock>
              <p className="text-xs text-muted-foreground mt-2">
                <strong>[%ntheme_asset%]</strong> resolves to <code>/assets/themes/THEME_NAME/</code> — the current active theme's asset folder.
              </p>
            </Section>

            <Section title="Template Query Parameters" icon={Search}>
              <p className="text-xs">When previewing a staging theme, you can override templates via URL params:</p>
              <TagTable rows={[
                ["?nview=THEME_NAME", "Preview a specific theme"],
                ["?templatehead=NAME", "Override header template"],
                ["?templatebody=NAME", "Override body template"],
                ["?templatefoot=NAME", "Override footer template"],
              ]} />
            </Section>
          </TabsContent>

          {/* ═══════════════ API ═══════════════ */}
          <TabsContent value="api" className="space-y-4">
            <Section title="API Overview" icon={Server}>
              <p>All API transactions use HTTPS POST to a fixed endpoint:</p>
              <CodeBlock title="API endpoint">{`POST https://www.yoursite.com.au/do/WS/NetoAPI

Headers:
  NETOAPI_ACTION: GetItem          ← specifies the action
  Accept: application/json
  Content-Type: application/json
  NETOAPI_KEY: your-api-key        ← API key authentication

Rate Limit: 500 requests/minute (429 response when exceeded)`}</CodeBlock>
            </Section>

            <Section title="API Actions" icon={Code2}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm mb-2">Products</h4>
                  <ul className="text-xs space-y-1 font-mono">
                    <li>AddItem</li>
                    <li>GetItem</li>
                    <li>UpdateItem</li>
                  </ul>
                </div>
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm mb-2">Orders / Invoices</h4>
                  <ul className="text-xs space-y-1 font-mono">
                    <li>AddOrder</li>
                    <li>GetOrder</li>
                    <li>UpdateOrder</li>
                  </ul>
                </div>
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm mb-2">Customers</h4>
                  <ul className="text-xs space-y-1 font-mono">
                    <li>AddCustomer</li>
                    <li>GetCustomer</li>
                    <li>UpdateCustomer</li>
                  </ul>
                </div>
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm mb-2">Categories</h4>
                  <ul className="text-xs space-y-1 font-mono">
                    <li>AddCategory</li>
                    <li>GetCategory</li>
                    <li>UpdateCategory</li>
                  </ul>
                </div>
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm mb-2">Content</h4>
                  <ul className="text-xs space-y-1 font-mono">
                    <li>AddContent</li>
                    <li>GetContent</li>
                    <li>UpdateContent</li>
                  </ul>
                </div>
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm mb-2">Other</h4>
                  <ul className="text-xs space-y-1 font-mono">
                    <li>GetWarehouse</li>
                    <li>AddPayment / GetPayment</li>
                    <li>GetShippingQuote</li>
                    <li>GetCurrency</li>
                    <li>AddRma / GetRma / UpdateRma</li>
                    <li>GetSupplier</li>
                    <li>AddVoucher / GetVoucher / UpdateVoucher</li>
                  </ul>
                </div>
              </div>
            </Section>

            <Section title="API Filter Example" icon={Code2}>
              <CodeBlock title="GetItem (products) with filters">{`{
  "Filter": {
    "SKU": ["PROD-001", "PROD-002"],
    "DateAddedFrom": "2024-01-01",
    "DateAddedTo": "2024-12-31",
    "Limit": 50,
    "Page": 0,
    "OutputSelector": [
      "SKU", "Name", "Model", "Brand",
      "RRP", "DefaultPrice", "PromotionPrice",
      "DateAdded", "DateUpdated",
      "Active", "Approved",
      "Images", "WarehouseQuantity"
    ]
  }
}`}</CodeBlock>
              <p className="text-xs text-muted-foreground mt-2">
                <strong>Best Practice:</strong> Always use <code>OutputSelector</code> to limit returned fields — drastically improves response times.
                Batch multiple objects per request where possible.
              </p>
            </Section>
          </TabsContent>

          {/* ═══════════════ ORDERS ═══════════════ */}
          <TabsContent value="orders" className="space-y-4">
            <Section title="Order Status Codes" icon={ShoppingCart}>
              <TagTable rows={[
                ["100", "Quote"],
                ["110", "New"],
                ["120", "On Hold"],
                ["130", "New Backorder"],
                ["140", "Pending Approval"],
                ["150", "Pick"],
                ["160", "Pack"],
                ["200", "Dispatched / Shipped"],
                ["210", "Dispatched (Partial)"],
                ["300", "Completed"],
                ["400", "Cancelled"],
                ["500", "Uncommitted (draft)"],
              ]} />
            </Section>

            <Section title="Order Processing Notes" icon={FileText}>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>Orders don't always follow a linear path — they can be split, backordered, held, or cancelled</li>
                <li>Track <strong>order lines</strong> not just order IDs — a single order can be split into multiple shipments</li>
                <li>Each order line has its own status independent of the parent order</li>
                <li>Payment status is separate from order status</li>
                <li>RMA (Return Merchandise Authorization) is handled through the RMA API</li>
              </ul>
            </Section>
          </TabsContent>

          {/* ═══════════════ PRODUCTS ═══════════════ */}
          <TabsContent value="products" className="space-y-4">
            <Section title="Product Data Model" icon={Tag}>
              <TagTable rows={[
                ["SKU", "Primary identifier — unique per product/variant"],
                ["ParentSKU", "Parent SKU for child/variant products"],
                ["Name", "Product display name"],
                ["Model", "Model number (fallback identifier)"],
                ["Brand", "Brand name"],
                ["DefaultPrice", "Base price"],
                ["PromotionPrice", "Sale/promotion price"],
                ["RRP", "Recommended retail price"],
                ["CostPrice", "Wholesale/cost price"],
                ["Active", "true/false — whether product is live"],
                ["Approved", "true/false — whether product is approved for display"],
                ["WarehouseQuantity", "Stock levels per warehouse"],
                ["Images", "Array of image objects with URLs"],
                ["Categories", "Array of category assignments"],
                ["SEOTitle / SEODescription", "SEO meta fields"],
                ["CustomContent", "Custom HTML content fields"],
                ["ExtraOptions", "Configurable product options (size, color, etc.)"],
              ]} />
            </Section>

            <Section title="Product Types" icon={Tag}>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li><strong>Standard Product</strong> — single SKU, no variants</li>
                <li><strong>Parent Product</strong> — has child SKUs (variants)</li>
                <li><strong>Child Product</strong> — variant of a parent, linked via ParentSKU</li>
                <li><strong>Kit/Bundle</strong> — composite product made of multiple SKUs</li>
                <li><strong>Digital Product</strong> — downloadable file attached to SKU</li>
                <li><strong>Gift Voucher</strong> — special product type for gift cards</li>
                <li><strong>Subscription</strong> — recurring billing product</li>
              </ul>
            </Section>

            <Section title="SKU-Based Asset Resolution" icon={Image}>
              <p className="text-xs">Product images are resolved by SKU:</p>
              <CodeBlock>{`[%asset_url type:'product' id:'[@SKU@]' thumb:'full'/%]     ← Full-size image
[%asset_url type:'product' id:'[@SKU@]' thumb:'medium'/%]   ← Medium thumbnail
[%asset_url type:'product' id:'[@SKU@]' thumb:'small'/%]    ← Small thumbnail

<!-- With default fallback -->
[%asset_url type:'product' id:'[@SKU@]' thumb:'full'%]
    [%param default%][%cdn_asset html:'0'%]img/default-product.png[%/cdn_asset%][%/param%]
[%/asset_url%]`}</CodeBlock>
            </Section>
          </TabsContent>

          {/* ═══════════════ CUSTOMERS ═══════════════ */}
          <TabsContent value="customers" className="space-y-4">
            <Section title="Customer Data Model" icon={Users}>
              <TagTable rows={[
                ["Username", "Login username (often email)"],
                ["Email", "Customer email address"],
                ["FirstName / LastName", "Customer name"],
                ["Company", "Company name (B2B)"],
                ["CustomerGroup", "Price group (Retail, Wholesale, VIP, etc.)"],
                ["DefaultDiscount", "Automatic order-wide discount %"],
                ["CreditLimit", "Maximum credit balance"],
                ["Active", "Account active status"],
                ["ABN", "Australian Business Number (tax ID)"],
                ["UserCustom1-3", "Custom fields"],
                ["DateAdded", "Account creation date"],
              ]} />
            </Section>

            <Section title="Customer Groups & Pricing" icon={Users}>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>Each customer belongs to a <strong>Customer Group</strong> which determines their pricing tier</li>
                <li>Products can have different prices per group (Group Pricing)</li>
                <li><code>[@store_price@]</code> automatically resolves to the logged-in user's group price</li>
                <li>Groups can have default discounts applied to all orders</li>
                <li>B2B customers can require <strong>approval</strong> before they can purchase</li>
                <li>Customer groups control tax exemptions</li>
              </ul>
            </Section>

            <Section title="Authentication Pages" icon={Users}>
              <TagTable rows={[
                ["/_myaccount?page=login", "Login form"],
                ["/_myaccount?page=register", "Registration form"],
                ["/_myaccount?page=forgotpwd", "Forgot password"],
                ["/_myaccount?page=forgotusr", "Forgot username"],
                ["/_myaccount", "Account dashboard (authenticated)"],
                ["/_myaccount?page=wishlist", "Wishlist"],
                ["/_myaccount?page=orders", "Order history"],
                ["/_myaccount?page=edit_account", "Edit account details"],
              ]} />
            </Section>
          </TabsContent>

          {/* ═══════════════ ASSETS & CDN ═══════════════ */}
          <TabsContent value="assets" className="space-y-4">
            <Section title="Asset URL Tags" icon={Image}>
              <h4 className="font-medium mb-2">[%ntheme_asset%] — Theme-relative assets</h4>
              <CodeBlock>{`[%ntheme_asset%]css/style.css[%/ntheme_asset%]
→ /assets/themes/THEME_NAME/css/style.css?timestamp

[%ntheme_asset%]img/logo.png[%/ntheme_asset%]
→ /assets/themes/THEME_NAME/img/logo.png?timestamp`}</CodeBlock>
              <p className="text-xs text-muted-foreground mb-3">Resolves relative to the active theme folder. Always use this for theme-specific assets.</p>

              <h4 className="font-medium mb-2">[%asset_url%] — Control-panel uploaded assets</h4>
              <CodeBlock>{`[%asset_url type:'product' id:'SKU123' thumb:'full'/%]      ← Product image
[%asset_url type:'content' id:'[@content_id@]'/%]          ← Content page image  
[%asset_url type:'logo'/%]                                  ← Store logo
[%asset_url type:'logo' thumb:'pdf'/%]                      ← PDF-sized logo
[%asset_url type:'user' id:'[@username@]'/%]                ← User avatar
[%asset_url type:'adw'/%]                                   ← Advert image`}</CodeBlock>
              <h4 className="font-medium mt-3 mb-2">asset_url types</h4>
              <TagTable rows={[
                ["product", "Product images (by SKU)"],
                ["content", "Content/category page images"],
                ["logo", "Store logo (with optional thumb sizes: pdf, email, etc.)"],
                ["user", "Customer avatar/profile image"],
                ["adw", "Advertising/advert images"],
                ["brochure", "Brochure/document files"],
                ["order", "Order-related files"],
                ["itemspecific", "eBay item-specific images"],
              ]} />

              <h4 className="font-medium mt-3 mb-2">[%cdn_asset%] — CDN-hosted platform assets</h4>
              <CodeBlock>{`[%cdn_asset%]css/bootstrap.min.css[%/cdn_asset%]
[%cdn_asset html:'0'%]img/default-product.png[%/cdn_asset%]`}</CodeBlock>
              <p className="text-xs text-muted-foreground">
                <code>html:'0'</code> returns just the URL string (no wrapping tag). Without it, may return a full HTML element.
              </p>
            </Section>

            <Section title="Hardcoded Asset Paths" icon={Link2}>
              <p className="text-xs">Some themes use hardcoded paths that bypass the template tags:</p>
              <CodeBlock>{`/assets/themes/skeletal/fonts/titillium.css   ← Cross-theme font (shared)
/assets/themes/THEME_NAME/img/logo.png        ← Direct path to theme image
/assets/pixel.gif                               ← 1x1 transparent pixel (placeholder)`}</CodeBlock>
              <p className="text-xs text-muted-foreground mt-2">
                These paths must be mapped to the storage bucket in our system. The <code>/assets/themes/skeletal/</code> prefix is used for shared/base theme resources.
              </p>
            </Section>
          </TabsContent>

          {/* ═══════════════ CART & CHECKOUT ═══════════════ */}
          <TabsContent value="cart" className="space-y-4">
            <Section title="Cart System" icon={ShoppingCart}>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>Cart is server-side session based — survives page reloads</li>
                <li>Products are added via URL: <code>/_mycart?sku=SKU&qty=1</code></li>
                <li>Cart page template: <code>templates/checkout/cart.template.html</code></li>
                <li>Checkout template: <code>templates/checkout/payment.template.html</code></li>
                <li>AJAX cart updates use fetch to <code>/_mycart</code> endpoint</li>
                <li>Coupon codes applied via <code>?addcpn=CODE</code></li>
              </ul>
            </Section>

            <Section title="Cart B@SE Tags" icon={Code2}>
              <CodeBlock>{`<!-- Cart link with item count -->
<a href="[%url page:'checkout' type:'cart' /%]">
    Cart (<span class="cart_qty">[@cart_count@]</span>)
</a>

<!-- Checkout button -->
<a href="[%url page:'checkout' fn:'payment' /%]">
    Proceed to Checkout
</a>

<!-- Add to cart form -->
<form action="/_mycart" method="get">
    <input type="hidden" name="sku" value="[@SKU@]" />
    <input type="number" name="qty" value="1" min="1" />
    <button type="submit">Add to Cart</button>
</form>`}</CodeBlock>
            </Section>

            <Section title="Payment Integration" icon={CreditCard}>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>Supports multiple payment gateways: PayPal, Stripe, eWAY, Afterpay, Zip, etc.</li>
                <li>Payment gateway configured in Control Panel, not in templates</li>
                <li>Templates just provide the checkout form — payment processing is server-side</li>
                <li>Third-party payment redirects use <code>fn:'3rdparty'</code></li>
              </ul>
            </Section>
          </TabsContent>

          {/* ═══════════════ SEO ═══════════════ */}
          <TabsContent value="seo" className="space-y-4">
            <Section title="SEO Tags" icon={Search}>
              <CodeBlock>{`<!-- Meta tags in head.template.html -->
<title>[@seo_title@] | [@config:store_name@]</title>
<meta name="description" content="[@seo_description@]" />
<link rel="canonical" href="[@config:home_url@][@content_fullpath@]" />

<!-- Open Graph -->
<meta property="og:title" content="[@seo_title@]" />
<meta property="og:description" content="[@seo_description@]" />
<meta property="og:image" content="[%asset_url type:'content' id:'[@content_id@]'/%]" />

<!-- Structured Data -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "[@name@]",
  "sku": "[@SKU@]",
  "offers": {
    "@type": "Offer",
    "price": "[@store_price@]"
  }
}
</script>`}</CodeBlock>
            </Section>

            <Section title="Optimisation Tags" icon={Zap}>
              <TagTable rows={[
                ["[%nohtml%]...[%/nohtml%]", "Strip HTML from output"],
                ["[%cache type:'...' id:'...'%]", "Cache rendered output"],
                ["[%filter%]...[%/filter%]", "Filter/sanitize content"],
                ["[%escape%]...[%/escape%]", "Escape special characters"],
              ]} />
            </Section>
          </TabsContent>

          {/* ═══════════════ GOTCHAS & TIPS ═══════════════ */}
          <TabsContent value="gotchas" className="space-y-4">
            <Section title="Common Pitfalls" icon={Zap}>
              <div className="space-y-3">
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm text-destructive">❌ String vs Integer Comparison</h4>
                  <p className="text-xs mt-1">Use <code>eq</code>/<code>ne</code> for strings, <code>==</code>/<code>!=</code> for numbers. Mixing them causes silent failures.</p>
                </div>
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm text-destructive">❌ Variable Scoping in Params</h4>
                  <p className="text-xs mt-1">Variables set inside <code>*header</code> param are NOT available in <code>*body</code> or <code>*footer</code>. Use <code>scope:'global'</code>.</p>
                </div>
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm text-destructive">❌ Editing app.css or custom.js</h4>
                  <p className="text-xs mt-1">These are compiled/essential files. Edit <code>style.css</code> for CSS and <code>ba_custom.js</code> for JavaScript instead.</p>
                </div>
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm text-destructive">❌ Uploading raw .html files</h4>
                  <p className="text-xs mt-1">Maropost only processes <code>.template.html</code> files through the B@SE engine. Plain HTML files won't render template tags.</p>
                </div>
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm text-destructive">❌ API without OutputSelector</h4>
                  <p className="text-xs mt-1">Fetching all fields is extremely slow. Always specify <code>OutputSelector</code> to limit response fields.</p>
                </div>
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm text-destructive">❌ Tracking orders by Order ID only</h4>
                  <p className="text-xs mt-1">Orders can be split. Track individual order <strong>lines</strong> for accurate fulfillment status.</p>
                </div>
              </div>
            </Section>

            <Section title="B@SE Engine Implementation Notes" icon={Code2}>
              <div className="space-y-3">
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm text-primary">💡 Template Processing Order</h4>
                  <ol className="text-xs list-decimal pl-4 mt-1 space-y-0.5">
                    <li>Resolve <code>[%load_template%]</code> includes (recursive)</li>
                    <li>Process <code>[%set%]</code> variable assignments</li>
                    <li>Evaluate <code>[%if%]</code> conditionals</li>
                    <li>Execute <code>[%thumb_list%]</code>, <code>[%content_menu%]</code>, <code>[%advert%]</code></li>
                    <li>Resolve <code>[%ntheme_asset%]</code> and <code>[%url%]</code> tags</li>
                    <li>Replace <code>[@data_tags@]</code> with values</li>
                    <li>Apply <code>[%format%]</code> formatting</li>
                    <li>Clean up unresolved tags</li>
                  </ol>
                </div>
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm text-primary">💡 Our B@SE → React Mapping</h4>
                  <ul className="text-xs mt-1 space-y-0.5">
                    <li><code>/_mycart</code> → <code>/store/cart</code></li>
                    <li><code>/_myaccount</code> → <code>/store/account</code></li>
                    <li><code>/_myaccount?page=login</code> → <code>/store/login</code></li>
                    <li><code>/_myaccount?page=register</code> → <code>/store/signup</code></li>
                    <li><code>/_myaccount?page=wishlist</code> → <code>/store/wishlist</code></li>
                    <li><code>/_myaccount?page=nr_track_order</code> → <code>/store/track-order</code></li>
                    <li><code>[%ntheme_asset%]path[%/ntheme_asset%]</code> → Storage bucket URL</li>
                    <li><code>[%content_menu%]</code> → Category data from DB</li>
                    <li><code>[%thumb_list%]</code> → Product query from DB</li>
                    <li><code>[%advert%]</code> → Adverts query from DB</li>
                  </ul>
                </div>
              </div>
            </Section>

            <Section title="Bootstrap Dependency" icon={Palette}>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>Most Maropost themes use <strong>Bootstrap 3</strong> (Skeletal) or <strong>Bootstrap 4</strong> (newer themes)</li>
                <li>Bootstrap CSS is loaded via CDN in the header template</li>
                <li>jQuery is required — loaded before custom.js</li>
                <li>Slick Carousel is the standard product slider library</li>
                <li>Font Awesome 4.7 is the standard icon library</li>
                <li>FancyBox is commonly used for image lightboxes</li>
              </ul>
            </Section>

            <Section title="Key Differences: Maropost vs Our Platform" icon={FileText}>
              <TagTable rows={[
                ["Template Processing", "Server-side (PHP) → Client-side (JS/React)"],
                ["Asset Storage", "/assets/themes/NAME/ → Supabase Storage bucket"],
                ["URL Routing", "Server-side rewrites → React Router SPA"],
                ["Cart", "Server-side session → React Context state"],
                ["Authentication", "Server-side session → Supabase Auth"],
                ["API", "POST /do/WS/NetoAPI → Supabase client queries"],
                ["Theme Switching", "CP setting → Active theme flag in DB"],
                ["Search", "Server-side Solr → Client-side filtering"],
                ["Email", "Built-in SMTP → Edge functions"],
              ]} />
            </Section>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
