import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Code2, FolderTree, Link2, Tag, Layout, Image, ShoppingCart, Users, FileText, Zap, Globe, Server, Palette, Search, CreditCard, Package, Filter, Layers, Database, AlertTriangle, Settings, Boxes } from "lucide-react";

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
            <TabsList className="inline-flex w-auto flex-wrap">
              <TabsTrigger value="architecture">Architecture</TabsTrigger>
              <TabsTrigger value="base-tags">B@SE Tags</TabsTrigger>
              <TabsTrigger value="data-tags">Data Tags</TabsTrigger>
              <TabsTrigger value="function-tags">Function Tags</TabsTrigger>
              <TabsTrigger value="advanced-functions">Advanced Functions</TabsTrigger>
              <TabsTrigger value="value-tags">Value Tags</TabsTrigger>
              <TabsTrigger value="urls">URL System</TabsTrigger>
              <TabsTrigger value="theme">Theme Structure</TabsTrigger>
              <TabsTrigger value="api">API</TabsTrigger>
              <TabsTrigger value="api-actions">API Actions Detail</TabsTrigger>
              <TabsTrigger value="orders">Order System</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="customers">Customers</TabsTrigger>
              <TabsTrigger value="assets">Assets & CDN</TabsTrigger>
              <TabsTrigger value="cart">Cart & Checkout</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="filters">Filters & Sorting</TabsTrigger>
              <TabsTrigger value="seo">SEO & Optimisation</TabsTrigger>
              <TabsTrigger value="ebay">eBay & Marketplaces</TabsTrigger>
              <TabsTrigger value="emails">Emails & Printables</TabsTrigger>
              <TabsTrigger value="theme-structure">Theme Structure</TabsTrigger>
              <TabsTrigger value="webhooks">Webhooks & API</TabsTrigger>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm mb-2">Logic & Calculation</h4>
                  <ul className="text-xs space-y-1">
                    <li><code>if / elseif / else</code> — conditional logic</li>
                    <li><code>set</code> — variable assignment</li>
                    <li><code>calc</code> — arithmetic operations</li>
                    <li><code>round</code> — decimal rounding</li>
                    <li><code>forloop</code> — counted loops</li>
                    <li><code>data</code> — switch/case (deprecated)</li>
                  </ul>
                </div>
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm mb-2">Formatting & Data</h4>
                  <ul className="text-xs space-y-1">
                    <li><code>format</code> — currency, date, number, text</li>
                    <li><code>split</code> — delimiter-based array splitting</li>
                    <li><code>trim</code> — whitespace removal</li>
                    <li><code>escape</code> — prevent code injection</li>
                    <li><code>nohtml</code> — strip HTML tags</li>
                    <li><code>nojs</code> — strip JavaScript</li>
                    <li><code>parse</code> — execute B@SE in dynamic content</li>
                    <li><code>random_number / random_text</code> — random generation</li>
                    <li><code>url_encode / url_decode</code> — URL encoding</li>
                    <li><code>site_value</code> — cross-template data transfer</li>
                    <li><code>months / years</code> — date lists</li>
                    <li><code>debug</code> — tag debugging</li>
                  </ul>
                </div>
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm mb-2">Listing & Navigation</h4>
                  <ul className="text-xs space-y-1">
                    <li><code>thumb_list</code> — product/content listings</li>
                    <li><code>list</code> — new unified listing (beta)</li>
                    <li><code>content_menu</code> — navigation tree menus</li>
                    <li><code>content_path</code> — breadcrumb/category paths</li>
                    <li><code>advert</code> — advertisement blocks</li>
                    <li><code>menu</code> — CP-managed menus</li>
                    <li><code>breadcrumb</code> — breadcrumb trails</li>
                    <li><code>paging / pagination</code> — page navigation</li>
                  </ul>
                </div>
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm mb-2">Product Information</h4>
                  <ul className="text-xs space-y-1">
                    <li><code>product</code> — single product data query</li>
                    <li><code>related_products</code> — related items</li>
                    <li><code>child_products</code> — variation children</li>
                    <li><code>list_item_variations</code> — variation dropdowns</li>
                    <li><code>multilevelpricing</code> — qty break pricing</li>
                    <li><code>discount_products</code> — free/discount incentives</li>
                    <li><code>item_kitting</code> — bundle components</li>
                    <li><code>warehouse_qty</code> — stock by location</li>
                  </ul>
                </div>
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm mb-2">Cart, Checkout & Orders</h4>
                  <ul className="text-xs space-y-1">
                    <li><code>cart</code> — cart value queries</li>
                    <li><code>payment_methods</code> — list payment options</li>
                    <li><code>shipping_methods</code> — list shipping options</li>
                    <li><code>show_order</code> — order detail display</li>
                    <li><code>order_payment_history</code> — payment list</li>
                    <li><code>order_refunds</code> — refund list</li>
                    <li><code>print_order</code> — printable order</li>
                    <li><code>consignment_breakdown</code> — shipment items</li>
                    <li><code>show_standing_order</code> — recurring orders</li>
                  </ul>
                </div>
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm mb-2">URLs, Assets & Templating</h4>
                  <ul className="text-xs space-y-1">
                    <li><code>url</code> — URL generation</li>
                    <li><code>ntheme_asset</code> — theme asset paths</li>
                    <li><code>asset_url</code> — CP-uploaded asset paths</li>
                    <li><code>cdn_asset</code> — CDN asset paths</li>
                    <li><code>load_template</code> — include sub-templates</li>
                    <li><code>load_ajax_template</code> — async includes</li>
                    <li><code>cache</code> — output caching</li>
                    <li><code>ajax_loader</code> — prevent accelerator cache</li>
                  </ul>
                </div>
              </div>
              <div className="border rounded-md p-3 mt-3">
                <h4 className="font-medium text-sm mb-2">Data Tags by Page Type</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div><strong>Product</strong> — SKU, price, stock, images, variants, kitting, misc1-50</div>
                  <div><strong>Category</strong> — name, description, level, breadcrumbs, parent</div>
                  <div><strong>Cart/Checkout</strong> — totals, billing, shipping, payment methods</div>
                  <div><strong>Customer</strong> — account, addresses, groups, custom1-50</div>
                  <div><strong>Value</strong> — config:*, user:*, form:*, cart:*</div>
                  <div><strong>Email</strong> — order details, customer info, tracking</div>
                  <div><strong>eBay</strong> — separate tag set for eBay templates</div>
                  <div><strong>Order</strong> — line items, payments, refunds, consignments</div>
                </div>
              </div>
            </Section>
          </TabsContent>

          {/* ═══════════════ DATA TAGS ═══════════════ */}
          <TabsContent value="data-tags" className="space-y-4">
            <Section title="Product Page Data Tags (Complete)" icon={Tag}>
              <TagTable rows={[
                ["[@SKU@], [@current_sku@]", "Product SKU identifier"],
                ["[@name@], [@model@]", "Product name / model"],
                ["[@subtitle@]", "Product subtitle"],
                ["[@description@]", "Full HTML description"],
                ["[@short_description@]", "Short/summary description"],
                ["[@store_price@]", "Price based on user's group ID"],
                ["[@retail_price@], [@rrp@]", "Retail/RRP price"],
                ["[@cost@]", "Cost price"],
                ["[@promotional_price@]", "Sale/promotional price"],
                ["[@store_quantity@]", "Available quantity for purchase"],
                ["[@limited_stock@]", "True when stock is below global low-stock config"],
                ["[@min_qty@], [@max_qty@]", "Min/max purchase quantity per order"],
                ["[@date_created@]", "Date product was created (YYYY-MM-DD)"],
                ["[@date_updated@]", "Date product was last updated"],
                ["[@brand@]", "Product brand name"],
                ["[@weight@]", "Product weight"],
                ["[@actual_height@], [@actual_length@], [@actual_width@]", "Assembled dimensions (meters)"],
                ["[@acc_code@]", "Accounting code"],
                ["[@acc_qty_multiplier@]", "Accounting quantity multiplier"],
                ["[@active@]", "Boolean: 1 when product is active"],
                ["[@approval@]", "Boolean: 1 when product is approved"],
                ["[@extra@]", "Boolean: true if product has Extra Options"],
                ["[@content_fullpath@]", "Full URL path to the product"],
                ["[@content_id@]", "Internal content ID"],
                ["[@current_id@]", "Active selected variation ID"],
                ["[@thumb_url@], [@thumb@]", "Primary thumbnail image URL"],
                ["[@print_label@]", "Number of labels to print per product"],
                ["[@status@]", "Product status code"],
                ["[@access_control@]", "True if page requires login"],
                ["[@keywords@]", "SEO keywords list"],
                ["[@manufacturer_model@]", "Manufacturer's model/SKU"],
                ["[@misc1@] - [@misc50@]", "Miscellaneous custom fields (50 available)"],
                ["[@group_name@]", "Customer's price group name (Retail, Wholesale, etc.)"],
                ["[@is_kit@]", "Boolean: 1 if this is a kitted product"],
                ["[@is_neto_utility@]", "Internal product (SHIPPING, ROUNDING) for POS/accounting"],
                ["[@kitting_sku@]", "Parent kit SKU"],
                ["[@barcode@]", "Product barcode / UPC / EAN"],
                ["[@supplier_item_code@]", "Supplier's product code"],
                ["[@warranty@]", "Warranty information"],
                ["[@specifications@]", "Product specifications HTML"],
                ["[@features@]", "Product features HTML"],
                ["[@terms_and_conditions@]", "Product-specific terms"],
                ["[@rndm@]", "Random string — used for unique DOM IDs"],
              ]} />
            </Section>

            <Section title="Content & Category Page Data Tags (Complete)" icon={FileText}>
              <TagTable rows={[
                ["[@content_name@]", "Category/content page name/title"],
                ["[@content_id@]", "Content page unique ID"],
                ["[@content_ref@]", "Reference ID (integer, 50 char limit)"],
                ["[@content_description1@] - [@content_description3@]", "Full description fields (3 available)"],
                ["[@content_short_description1@] - [@content_short_description3@]", "Short descriptions (3 available)"],
                ["[@content_allow_reviews@]", "True when reviews are enabled on this page"],
                ["[@content_level@]", "Nesting depth level (1 = top level)"],
                ["[@content_module@]", "Page module type (Contact_form, Subscribe, etc.)"],
                ["[@content_type_code@]", "Content type code defined at creation"],
                ["[@content_fullpath@]", "Full URL path"],
                ["[@seo_title@]", "SEO meta title"],
                ["[@seo_description@]", "SEO meta description"],
                ["[@parent_content_id@]", "Parent content type ID"],
                ["[@parent_id@]", "Parent page ID"],
                ["[@parent_name@]", "Parent category name"],
                ["[@parent_url@]", "Parent category URL"],
                ["[@breadcrumb@]", "Breadcrumb trail HTML"],
                ["[@page_subheader@]", "Deprecated subtitle tag"],
                ["[@rating@]", "Average review rating"],
                ["[@reviews@]", "Review count"],
                ["[@sortorder@]", "Sort order value"],
                ["[@timestamp@]", "Page timestamp"],
                ["[@title@]", "Page title"],
                ["[@templatebody@]", "Body template name"],
                ["[@templatehead@]", "Header template name"],
                ["[@templatefoot@]", "Footer template name"],
                ["[@templatesearch@]", "Search template name"],
                ["[@thumb_content_type_id@]", "Content type ID for thumbnails"],
              ]} />
            </Section>

            <Section title="Checkout & Cart Data Tags (Complete)" icon={ShoppingCart}>
              <TagTable rows={[
                ["[@grand_total@]", "Grand total of the order"],
                ["[@subtotal@]", "Subtotal before tax/shipping"],
                ["[@product_total@]", "Product total prior to discounts"],
                ["[@product_discount@]", "Total product discount amount"],
                ["[@shipping_total@], [@shipping_cost@]", "Shipping cost"],
                ["[@shipping_discount@]", "Shipping discount amount"],
                ["[@discount_total@]", "Total of product + shipping discounts"],
                ["[@tax_total@]", "Tax amount"],
                ["[@voucher_credit@]", "Gift voucher credit applied"],
                ["[@payment_method@]", "Selected payment method name"],
                ["[@payment_method_id@]", "Selected payment method ID"],
                ["[@payment_plan@]", "Selected payment plan"],
                ["[@shipping_method@]", "Selected shipping method name"],
                ["[@shipping_method_id@]", "Selected shipping method ID"],
                ["[@total_items@]", "Total items in cart"],
                ["[@bill_firstname@], [@bill_lastname@]", "Billing first/last name"],
                ["[@bill_company@]", "Billing company"],
                ["[@bill_city@], [@bill_country@]", "Billing city/country"],
                ["[@ship_firstname@], [@ship_lastname@]", "Shipping first/last name"],
                ["[@ship_city@], [@ship_country@]", "Shipping city/country"],
                ["[@customer_ref1@] - [@customer_ref4@]", "Order reference/misc fields"],
                ["[@add_reminder@]", "Add reminder field value"],
                ["[@agree@]", "T&C checkbox value"],
                ["[@apply_credit@]", "True/false if credit was applied"],
                ["[@cart_count@]", "Number of items (Cart Page exclusive)"],
                ["[@order_id@]", "Order ID after completion"],
              ]} />
            </Section>

            <Section title="Customer Page Data Tags (Complete)" icon={Users}>
              <TagTable rows={[
                ["[@active@]", "Boolean: true when customer is active"],
                ["[@addr_id@]", "Unique ID for default address"],
                ["[@approval_username@]", "Username of quote approver"],
                ["[@def_order_type@]", "Default order type for the account"],
                ["[@default_discounts@]", "Default order-wide discount percentage"],
                ["[@haslogin@]", "True if customer is currently logged in"],
                ["[@terms@]", "User payment terms (COD, Net EOM, Net 10)"],
                ["[@unresolve_dispute@]", "Total unresolved disputes count"],
                ["[@user_id@]", "Customer number ID"],
                ["[@usercustom1@] - [@usercustom50@]", "Custom customer fields (up to 50)"],
                ["[@username@]", "Login username"],
                ["[@email@]", "Customer email"],
                ["[@company@]", "Company name"],
                ["[@firstname@], [@lastname@]", "Customer first/last name"],
                ["[@phone@]", "Phone number"],
                ["[@fax@]", "Fax number"],
                ["[@abn@]", "Australian Business Number"],
              ]} />
            </Section>
          </TabsContent>

          {/* ═══════════════ VALUE TAGS (NEW) ═══════════════ */}
          <TabsContent value="value-tags" className="space-y-4">
            <Section title="Value Tags — Dynamic Data Sources" icon={Database}>
              <p>Value tags pull data from dynamic sources: the logged-in user, URL query strings, and store configuration. They work anywhere in any template.</p>
            </Section>

            <Section title="User Data Tags" icon={Users}>
              <p className="mb-2">Load data from the currently logged-in user:</p>
              <TagTable rows={[
                ["[@user:username@]", "Login username"],
                ["[@user:email@]", "Email address"],
                ["[@user:firstname@]", "First name"],
                ["[@user:lastname@]", "Last name"],
                ["[@user:company@]", "Company name"],
                ["[@user:phone@]", "Phone number"],
                ["[@user:active@]", "True when account is active"],
                ["[@user:usercustom1@] - [@user:usercustom50@]", "Custom fields (up to 50)"],
                ["[@user:group_id@]", "Customer group/price tier ID"],
                ["[@user:default_discounts@]", "Default discount percentage"],
                ["[@user:credit_limit@]", "Credit limit"],
                ["[@user:terms@]", "Payment terms"],
              ]} />
            </Section>

            <Section title="Config Tags" icon={Settings}>
              <p className="mb-2">Load store configuration values set in Control Panel:</p>
              <TagTable rows={[
                ["[@config:home_url@]", "Store home URL (e.g., https://www.mystore.com.au)"],
                ["[@config:store_name@]", "Store display name"],
                ["[@config:display_special_content@]", "Config flag for special content"],
                ["[@config:imageurl@]", "Base image URL from config"],
                ["[@config:currency_symbol@]", "Currency symbol ($, £, €)"],
                ["[@config:currency_code@]", "Currency ISO code (AUD, USD)"],
                ["[@config:country@]", "Store country"],
                ["[@config:timezone@]", "Store timezone"],
                ["[@config:tax_inclusive@]", "Whether prices include tax"],
                ["[@config:google_analytics_id@]", "Google Analytics ID"],
              ]} />
            </Section>

            <Section title="Form Data Tags (URL Query Strings)" icon={Link2}>
              <CodeBlock title="How form tags work">{`URL: mysite.com.au/page?color=red&size=large

[@form:color@]  → outputs "red"
[@form:size@]   → outputs "large"
[@form:anything@] → outputs value of ?anything= parameter

Use case: Pre-filling forms, filtering, passing data between pages`}</CodeBlock>
            </Section>

            <Section title="Cart Data Tags (Inline)" icon={ShoppingCart}>
              <p className="mb-2">Access cart values inline anywhere (faster than the cart function tag):</p>
              <CodeBlock>{`[@cart:product_total@]     → Product subtotal
[@cart:grand_total@]      → Grand total
[@cart:total_items@]      → Item count
[@cart:shipping_cost@]    → Shipping cost
[@cart:payment_method@]   → Selected payment method
[@cart:discount_total@]   → Total discounts applied
[@cart:voucher_credit@]   → Gift voucher amount`}</CodeBlock>
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

          {/* ═══════════════ ADVANCED FUNCTIONS (NEW) ═══════════════ */}
          <TabsContent value="advanced-functions" className="space-y-4">
            <Section title="CONTENT_MENU — Navigation Trees" icon={Layers}>
              <p>Generates a hierarchical navigation menu from content types (categories, pages, blogs, etc.).</p>
              <CodeBlock title="Multi-level category menu">{`[%content_menu content_type:'category' sortby:'sortorder,name' show_empty:'1'%]
    [%param *header%]<ul class="category-menu">[%/param%]
    [%param *level_1%]
        <li>
            <a href="[@url@]">[@name@]</a>
            [%if [@next_level@]%]<ul>[@next_level@]</ul>[%/if%]
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
    [%param *footer%]</ul>[%/param%]
[%/content_menu%]`}</CodeBlock>
              <h4 className="font-medium mt-3 mb-1">Parameters</h4>
              <TagTable rows={[
                ["content_type:''", "Content type to target: category, brand, blog, information, etc."],
                ["sortby:''", "Sort field: sortorder, name, date"],
                ["show_empty:'1'", "Show categories with no products"],
                ["category:'[@id@]'", "Start menu from specific category ID"],
                ["limit:''", "Max items per level"],
              ]} />
              <h4 className="font-medium mt-3 mb-1">Data Tags (within levels)</h4>
              <TagTable rows={[
                ["[@name@]", "Content/category name"],
                ["[@url@]", "Full URL path"],
                ["[@id@], [@content_id@]", "Content ID"],
                ["[@next_level@]", "Renders the next depth level (recursive)"],
                ["[@parent_content_id@]", "Parent content type ID"],
                ["[@thumb@]", "Thumbnail image URL"],
                ["[@description@]", "Description text"],
              ]} />
            </Section>

            <Section title="CONTENT_PATH — Breadcrumb & Category Assignment" icon={FolderTree}>
              <CodeBlock>{`[%content_path content_id:'[@content_id@]' show_path:'y'%]
    [%param *header%]<nav class="breadcrumb">[%/param%]
    [%param *body%]
        <a href="[@url@]">[@content_name@]</a> &gt;
    [%/param%]
    [%param *footer%]</nav>[%/param%]
[%/content_path%]

<!-- Show which category a product belongs to -->
[%content_path id:'[@inventory_id@]' type:'category' limit:'1'%]
    [%param *body%]
        <a href="[%url type:'cms'%][%param id%][@content_id@][%/param%][%/url%]">
            [@content_name@]
        </a>
    [%/param%]
[%/content_path%]`}</CodeBlock>
            </Section>

            <Section title="ITEM_KITTING — Kit/Bundle Components" icon={Boxes}>
              <p>Displays editable kit component items for bundled/kitted products.</p>
              <CodeBlock>{`[%item_kitting id:'[@SKU@]'%]
    [%param *group_header%]
        <input type="hidden" id="model[@rndm@][@SKU@]" 
               name="model" value="[@model@]">
        <h4>[@group_name@]</h4>
    [%/param%]
    [%param *body%]
        <select name="kit_component_[@count@]">
            <option value="[@sku@]">[@name@] - $[@price@]</option>
        </select>
    [%/param%]
[%/item_kitting%]`}</CodeBlock>
              <h4 className="font-medium mt-3 mb-1">Kit Data Tags</h4>
              <TagTable rows={[
                ["[@kit_price_total@]", "Minimum cost of required components"],
                ["[@total_components@]", "Total number of components"],
                ["[@is_kit@]", "Boolean: 1 if kitted product"],
                ["[@kitting_sku@]", "Parent kit SKU"],
                ["[@group_name@]", "Component group name"],
              ]} />
            </Section>

            <Section title="PRODUCT — Single Product Query" icon={Package}>
              <CodeBlock>{`[%product sku:'SPECIFIC-SKU'%]
    [%param *body%]
        <div class="featured-product">
            <img src="[@thumb@]" alt="[@name@]" />
            <h3>[@name@]</h3>
            <span>$[@store_price@]</span>
        </div>
    [%/param%]
    [%param *ifempty%]Product not found[%/param%]
[%/product%]

<!-- With group pricing -->
[%product sku:'[@sku@]' group_id:'5'%]
    [%param *body%]Wholesale price: $[@price@][%/param%]
[%/product%]`}</CodeBlock>
              <p className="text-xs text-muted-foreground mt-2">The product tag gives access to ALL product data tags. Can query by <code>sku:''</code> or <code>id:''</code>.</p>
            </Section>

            <Section title="RELATED_PRODUCTS & CHILD_PRODUCTS" icon={Package}>
              <CodeBlock>{`<!-- Related products -->
[%related_products id:'[@SKU@]' limit:'4'%]
    [%param *body%]
        <a href="[@url@]">[@name@] - $[@price@]</a>
    [%/param%]
[%/related_products%]

<!-- Variation child products -->
[%child_products id:'[@SKU@]'%]
    [%param *body%]
        [@sku@]: [@name@] ([@store_quantity@] in stock)
    [%/param%]
[%/child_products%]

<!-- List item variations (dropdowns) -->
[%list_item_variations id:'[@SKU@]'%]
    [%param *body%]
        <option value="[@sku@]">[@variation_name@] - $[@price@]</option>
    [%/param%]
[%/list_item_variations%]`}</CodeBlock>
            </Section>

            <Section title="MULTILEVELPRICING — Quantity Break Pricing" icon={CreditCard}>
              <CodeBlock>{`[%multilevelpricing id:'[@SKU@]'%]
    [%param *header%]<table class="qty-pricing">[%/param%]
    [%param *body%]
        <tr>
            <td>[@qty_from@] - [@qty_to@]</td>
            <td>$[@price@]</td>
        </tr>
    [%/param%]
    [%param *footer%]</table>[%/param%]
[%/multilevelpricing%]`}</CodeBlock>
            </Section>

            <Section title="DISCOUNT_PRODUCTS — Free/Discounted Items" icon={Tag}>
              <CodeBlock>{`[%discount_products id:'[@SKU@]' template:'' show_all:'1'%]
    [%param *body%]
        <div>Buy [@name@] and get this FREE: [@discount_name@]</div>
    [%/param%]
[%/discount_products%]`}</CodeBlock>
              <p className="text-xs text-muted-foreground mt-2">Displays products with discount incentives configured in the Control Panel.</p>
            </Section>

            <Section title="WAREHOUSE_QTY — Stock by Location" icon={Boxes}>
              <CodeBlock>{`[%warehouse_qty sku:'[@SKU@]' warehouse:'Sydney'%]
    [%param *body%]
        Sydney stock: [@quantity@]
    [%/param%]
[%/warehouse_qty%]`}</CodeBlock>
            </Section>

            <Section title="MENU — Control Panel Managed Menus" icon={Layers}>
              <CodeBlock>{`[%menu id:'web_header'%]
    [%param *header%]<ul class="nav">[%/param%]
    [%param *body%]
        <li><a href="[@url@]">[@name@]</a></li>
    [%/param%]
    [%param *footer%]</ul>[%/param%]
[%/menu%]`}</CodeBlock>
              <p className="text-xs text-muted-foreground mt-2">Loads custom menus built in the Neto Control Panel menu builder.</p>
            </Section>

            <Section title="BREADCRUMB" icon={FolderTree}>
              <CodeBlock>{`[%breadcrumb%]
    [%param *header%]<ol class="breadcrumb">[%/param%]
    [%param *body%]
        <li><a href="[@url@]">[@name@]</a></li>
    [%/param%]
    [%param *current%]
        <li class="active">[@name@]</li>
    [%/param%]
    [%param *footer%]</ol>[%/param%]
[%/breadcrumb%]`}</CodeBlock>
            </Section>

            <Section title="PAYMENT_METHODS" icon={CreditCard}>
              <CodeBlock>{`[%payment_methods%]
    [%param *body%]
        <div class="payment-option">
            <img src="[@icon@]" alt="[@name@]" />
            <span>[@name@]</span>
        </div>
    [%/param%]
[%/payment_methods%]`}</CodeBlock>
              <p className="text-xs text-muted-foreground mt-2">Lists payment methods enabled in the Control Panel.</p>
            </Section>

            <Section title="PAGING / PAGINATION" icon={Filter}>
              <CodeBlock>{`[%paging%]
    [%param *body%]
        <a href="[@url@]" class="[@current@]">[@page_number@]</a>
    [%/param%]
    [%param *prev%]<a href="[@url@]">Previous</a>[%/param%]
    [%param *next%]<a href="[@url@]">Next</a>[%/param%]
[%/paging%]`}</CodeBlock>
            </Section>

            <Section title="SPLIT — Array Splitting" icon={Code2}>
              <p>Splits delimited data into iterable arrays — very useful for processing CSV-like values.</p>
              <CodeBlock>{`[%split delimiter:','%]
    [%param data1%]author1,author2,author3[%/param%]
    [%param data2%]book1,book2,book3[%/param%]
    [%param *header%]
        [@count@] items found.
    [%/param%]
    [%param *body%]
        <p>[@data1@] wrote [@data2@]</p>
    [%/param%]
[%/split%]`}</CodeBlock>
              <TagTable rows={[
                ["delimiter:''", "Character to split on: , ; | & = etc."],
                ["data1, data2, data3...", "Multiple data streams to split in parallel"],
                ["[@count@]", "Total number of items after split"],
                ["[@data1@], [@data2@]...", "Current item from each data stream"],
              ]} />
            </Section>

            <Section title="SITE_VALUE — Cross-Template Data" icon={Database}>
              <p>Stores content in one template location and loads it in another — essential for moving JS to footer.</p>
              <CodeBlock>{`<!-- STORE content (e.g., in product body template) -->
[%site_value id:'footer_javascript'%]
    <script>
        var productSku = '[@SKU@]';
        initProductGallery();
    </script>
[%/site_value%]

<!-- LOAD content (e.g., in footer template) -->
[%site_value id:'footer_javascript' type:'load' /%]`}</CodeBlock>
              <div className="border rounded-md p-3 mt-2 text-xs space-y-1">
                <p className="text-destructive font-medium">⚠️ Limitations:</p>
                <ul className="list-disc pl-4">
                  <li>Won't work across print or email templates</li>
                  <li>Won't react dynamically to AJAX calls</li>
                  <li>Keyhole caching breaks results</li>
                  <li>Can only load BELOW where data was stored in page flow</li>
                </ul>
              </div>
            </Section>

            <Section title="PARSE — Execute B@SE in Dynamic Content" icon={Code2}>
              <CodeBlock>{`<!-- Parse B@SE tags inside a product description -->
[%parse%]
    [@description@]
[%/parse%]`}</CodeBlock>
              <div className="border rounded-md p-3 mt-2 text-xs text-destructive">
                <p className="font-medium">🔴 SECURITY WARNING:</p>
                <p>NEVER use [%parse%] around user-accessible fields (forms, customer input). Attackers could inject B@SE tags that execute server-side code.</p>
              </div>
            </Section>

            <Section title="Formatting & Utility Functions" icon={Code2}>
              <TagTable rows={[
                ["[%nohtml%]...[%/nohtml%]", "Strip all HTML tags from content"],
                ["[%nojs%]...[%/nojs%]", "Strip all JavaScript from content"],
                ["[%escape%]...[%/escape%]", "Prevent code injection — escape special chars"],
                ["[%trim%]...[%/trim%]", "Remove whitespace from start/end"],
                ["[%trim inner:'1'%]...[%/trim%]", "Remove all internal whitespace too"],
                ["[%url_encode%]...[%/url_encode%]", "URL-encode a string"],
                ["[%url_decode%]...[%/url_decode%]", "URL-decode a string"],
                ["[%random_number length:'5'/%]", "Generate random number of N digits"],
                ["[%random_text length:'8'/%]", "Generate random string of N chars"],
                ["[%debug%][@some_tag@][%/debug%]", "Output debug info about a tag"],
                ["[%months%]...[%/months%]", "Generate list of months (full names)"],
                ["[%years from:'2020' to:'2030'%]...[%/years%]", "Generate list of years"],
                ["[%ajax_loader%]...[%/ajax_loader%]", "Prevent Neto web accelerator caching"],
              ]} />
            </Section>

            <Section title="SHOW_ORDER — Order Detail Display" icon={ShoppingCart}>
              <CodeBlock>{`[%show_order id:'[@order_id@]' hidechild:'1'%]
    [%param *header%]
        <h2>Order: [@order_id@]</h2>
        <p>Status: [@order_status@]</p>
        <p>Grand Total: [%format type:'currency'%][@grand_total@][%/format%]</p>
    [%/param%]
    [%param *body%]
        <tr>
            <td>[@sku@]</td>
            <td>[@model@]</td>
            <td>[@quantity@]</td>
            <td>[%format type:'currency'%][@unit_price@][%/format%]</td>
        </tr>
    [%/param%]
[%/show_order%]`}</CodeBlock>
              <h4 className="font-medium mt-3 mb-1">show_order Data Tags</h4>
              <TagTable rows={[
                ["[@order_id@]", "Order ID"],
                ["[@order_status@]", "Status name (New, Dispatched, etc.)"],
                ["[@sku@]", "Order line SKU"],
                ["[@model@], [@name@]", "Product name"],
                ["[@quantity@]", "Line quantity"],
                ["[@unit_price@]", "Unit price"],
                ["[@grand_total@]", "Grand total"],
                ["[@total_items@]", "Total order lines"],
                ["[@tracking_id@]", "Tracking number ID"],
                ["[@ship_tracking@]", "Tracking number"],
                ["[@iskitting@]", "True if line is a kit component"],
                ["[@itemnotes@]", "Order line notes"],
                ["[@acc_code@]", "Accounting code"],
              ]} />
            </Section>

            <Section title="ORDER_PAYMENT_HISTORY" icon={CreditCard}>
              <CodeBlock>{`[%order_payment_history id:'[@order_id@]'%]
    [%param *body%]
        <p>[@payment_amount@] paid on [@date_paid@] via [@payment_name@]</p>
    [%/param%]
[%/order_payment_history%]`}</CodeBlock>
            </Section>

            <Section title="ORDER_REFUNDS" icon={CreditCard}>
              <CodeBlock>{`[%order_refunds id:'[@order_id@]'%]
    [%param *body%]
        <p>Refund #[@count@]: [@refund_total@] issued [@date_issued@]</p>
    [%/param%]
[%/order_refunds%]`}</CodeBlock>
              <TagTable rows={[
                ["[@refund_total@]", "Total refund amount"],
                ["[@date_issued@]", "Date refund was issued"],
                ["[@date_approved@]", "Date refund was approved"],
                ["[@count@]", "Incrementing counter"],
              ]} />
            </Section>

            <Section title="SHIPPING_METHODS — Available Shipping Options" icon={Package}>
              <CodeBlock>{`[%shipping_methods%]
    [%param *body%]
        <div class="shipping-option">
            <h4>[@shipping_method@] - 
                [%if [@shipping_quote@]%]P.O.A
                [%else%]
                    [%if [@cost@] == 0%]
                        [%if [@na@] == 0%]Free[%else%]Not Applicable[%/if%]
                    [%else%]
                        [%format type:'currency'%][@cost@][%/format%]
                    [%/if%]
                [%/if%]
            </h4>
            <p>Est. arrival: [%format type:'number' tl_unit:'day'%][@delivery_time@][%/format%]</p>
        </div>
    [%/param%]
[%/shipping_methods%]`}</CodeBlock>
              <TagTable rows={[
                ["[@shipping_method@]", "Shipping option name"],
                ["[@cost@]", "Calculated cost after discounts"],
                ["[@actual_cost@]", "Original cost before discounts"],
                ["[@delivery_time@]", "Estimated delivery time"],
                ["[@na@]", "Not applicable flag (0=available, 1=N/A)"],
                ["[@shipping_quote@]", "True if freight quote required"],
                ["[@sh_group_routing@]", "Routing group for cheapest-default logic"],
                ["[@sortorder@]", "Sort order"],
                ["sortby:''", "Param: sort by actual_cost, sortorder, delivery_time"],
              ]} />
            </Section>

            <Section title="CONSIGNMENT_BREAKDOWN — Shipment Details" icon={Package}>
              <CodeBlock>{`[%consignment_breakdown order_id:'[@order_id@]' 
    article_id:'[@article_id@]' cngmt_id:'[@cngmt_id@]'%]
    [%param *body%]
        <p>[@SKU@] × [@quantity@]</p>
    [%/param%]
[%/consignment_breakdown%]`}</CodeBlock>
              <p className="text-xs text-muted-foreground mt-2">Used in dispatch dockets and shipping labels to show what's in each consignment/article.</p>
            </Section>

            <Section title="PRINT_ORDER" icon={FileText}>
              <CodeBlock>{`[%print_order id:'[@order_id@]'%]
    [%param *body%]
        <!-- Invoice/printable template content -->
    [%/param%]
[%/print_order%]`}</CodeBlock>
              <p className="text-xs text-muted-foreground mt-2">Used in printable documents (invoices, pick slips, etc.) to load order data.</p>
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

            <Section title="Complete Product Data Tags" icon={Tag}>
              <p className="text-xs mb-2">All tags available on product pages and inside product-related functions:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm mb-1">Identity & Display</h4>
                  <TagTable rows={[
                    ["[@sku@] / [@current_sku@]", "Product SKU"],
                    ["[@model@]", "Model number"],
                    ["[@name@]", "Product name"],
                    ["[@subtitle@]", "Subtitle"],
                    ["[@brand@]", "Brand name"],
                    ["[@short_description@]", "Short description"],
                    ["[@description@]", "Full description"],
                    ["[@specifications@]", "Specifications text"],
                    ["[@warranty@]", "Warranty details"],
                    ["[@keywords@]", "SEO keywords"],
                    ["[@acc_code@] / [@custom_label@]", "Accounting/eBay label"],
                  ]} />
                </div>
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm mb-1">Pricing</h4>
                  <TagTable rows={[
                    ["[@store_price@]", "Resolved price for current user's group"],
                    ["[@rrp@]", "Recommended retail price"],
                    ["[@promo_price@]", "Promotional/sale price"],
                    ["[@cost_price@]", "Cost price (wholesale)"],
                    ["[@retail@]", "Retail price"],
                    ["[@has_mlp@]", "Has multi-level pricing"],
                    ["[@has_from_price@]", "Child price used as 'From' price"],
                    ["[@save_price@]", "Savings amount (RRP - price)"],
                    ["[@save_percent@]", "Savings percentage"],
                  ]} />
                </div>
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm mb-1">Dimensions & Weight</h4>
                  <TagTable rows={[
                    ["[@weight@]", "Item weight"],
                    ["[@height@] / [@length@] / [@width@]", "Dimensions (meters default)"],
                    ["[@actual_height@] / [@actual_length@] / [@actual_width@]", "Assembled dimensions"],
                    ["[@cubic@]", "Cubic weight"],
                  ]} />
                </div>
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm mb-1">Stock & Inventory</h4>
                  <TagTable rows={[
                    ["[@store_quantity@]", "Quantity available for purchase"],
                    ["[@allow_oversell@]", "y = don't track, n = track inventory"],
                    ["[@preorder@]", "Pre-order flag"],
                    ["[@active@]", "Product active"],
                    ["[@approved@]", "Product approved for display"],
                  ]} />
                </div>
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm mb-1">Variation & Kit Flags</h4>
                  <TagTable rows={[
                    ["[@has_child@]", "0/1 — has child variants"],
                    ["[@has_components@]", "1 = editable kit"],
                    ["[@fixed_assemble@]", "true = NOT editable kit"],
                    ["[@itm_gp_id@]", "Unique ID for kit/variation group"],
                    ["[@free_gifts@]", "Free gifts from discount/coupon"],
                  ]} />
                </div>
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm mb-1">Misc & Custom Fields</h4>
                  <TagTable rows={[
                    ["[@misc1@] to [@misc50@]", "50 miscellaneous fields"],
                    ["[@filter1@] to [@filter9@]", "Legacy filter fields (v4)"],
                    ["[@extra@]", "Extra options format string"],
                    ["[@image_url@]", "Full product image URL"],
                    ["[@thumb@]", "Thumbnail image URL"],
                    ["[@access_control@]", "Requires login to view"],
                  ]} />
                </div>
              </div>
            </Section>

            <Section title="[%product%] — Query Product Anywhere" icon={Tag}>
              <CodeBlock>{`<!-- Use product data in any template (header, footer, content page, etc.) -->
[%product sku:'SOME-SKU'%]
    [%param *body%]
        <h3>[@name@]</h3>
        <p>Price: [%format type:'currency'%][@store_price@][%/format%]</p>
        <p>Stock: [@store_quantity@]</p>
    [%/param%]
    [%param *ifempty%]<p>Product not found</p>[%/param%]
[%/product%]

<!-- By inventory ID -->
[%product id:'12345'%]...[%/product%]`}</CodeBlock>
              <p className="text-xs text-muted-foreground mt-2">Covers ALL product data tags. Use to embed product data outside product pages (e.g., in headers, banners, content pages).</p>
            </Section>

            <Section title="URL Generation" icon={Tag}>
              <CodeBlock>{`<!-- Link to cart -->
[%url page:'checkout' type:'cart'/%]

<!-- Link home -->
[%url type:'home'/%]
<!-- Also: [@config:home_url@] -->

<!-- Link to specific product -->
[%url type:'item' id:'[@sku@]'/%]

<!-- Link to content page -->
[%url page:'content' id:'42'/%]

<!-- Link to account pages -->
[%url page:'account' type:'login'/%]
[%url page:'account' type:'register'/%]
[%url page:'account' type:'approve_quote'/%]

<!-- Newsletter subscribe action -->
[%url type:'page' id:'subscribe' https:'1'%][%END url%]

<!-- Relative URL (no protocol/domain) -->
[%url type:'item' id:'[@sku@]' nohost:'1'/%]`}</CodeBlock>
              <TagTable rows={[
                ["page:''", "Section: account, checkout, content, home, item, page"],
                ["type:''", "Page type (cart, login, register, etc.)"],
                ["id:''", "Target ID (SKU, content ID, etc.)"],
                ["https:'1'", "Force HTTPS"],
                ["nohost:'1'", "Relative URL (no domain)"],
              ]} />
            </Section>

            <Section title="Newsletter & Forms" icon={Tag}>
              <CodeBlock>{`<!-- Footer newsletter subscribe -->
<form method="post" 
    action="[%url type:'page' id:'subscribe' https:'1'%][%END url%]"
    aria-label="Newsletter subscribe form">
    <input type="hidden" name="list_id" value="1" />
    <input type="email" name="email" placeholder="Your email" required />
    <label>
        <input type="checkbox" name="opt_in_newsletter" 
            [%if [@opt_in_newsletter@]%]checked[%/if%] />
        Subscribe to newsletter
    </label>
    <button type="submit">Subscribe</button>
</form>

<!-- Contact form -->
<form method="post" action="[%url type:'page' id:'contact'%][%END url%]">
    <input name="name" required />
    <input name="email" required />
    <textarea name="message"></textarea>
    <button type="submit">Send</button>
</form>`}</CodeBlock>
              <div className="border rounded-md p-3 mt-2 text-xs">
                <p className="font-medium">📝 Form Notes:</p>
                <ul className="list-disc pl-4">
                  <li>ReCAPTCHA enabled in CP Settings → no template code needed</li>
                  <li>GDPR consent: add checkbox for Terms & Privacy (post-2018)</li>
                  <li>Use content zones for Terms & Privacy modal content</li>
                  <li>Contact form file upload via <code>enctype="multipart/form-data"</code></li>
                </ul>
              </div>
            </Section>

            <Section title="Config Value Tags Reference" icon={Tag}>
              <TagTable rows={[
                ["[@config:home_url@]", "Store home URL"],
                ["[@config:store_name@]", "Store name"],
                ["[@config:website_name@]", "Website name"],
                ["[@config:company_phone@]", "Company phone number"],
                ["[@config:defaultcurrency@]", "Default currency code"],
                ["[@config:current_url@]", "Current page URL"],
                ["[@config:IMG_THUMB_WIDTH@]", "Thumbnail image width setting"],
                ["[@config:IMG_THUMB_HEIGHT@]", "Thumbnail image height setting"],
                ["[@config:IMG_FULL_WIDTH@]", "Full image width setting"],
                ["[@config:CUSTOMER_REGISTRATION_IGNORE_USERNAME@]", "Auto-use email as username"],
              ]} />
              <p className="text-xs text-muted-foreground mt-2">Access any CP config setting via <code>[@config:SETTING_ID@]</code>. Also works for custom configs.</p>
            </Section>

            <Section title="Content & Category Data Tags" icon={Tag}>
              <TagTable rows={[
                ["[@content_id@]", "Unique page ID"],
                ["[@content_name@]", "Page/category name"],
                ["[@content_description1/2/3@]", "Description fields"],
                ["[@content_ref@]", "Reference ID (integer, 50 char max)"],
                ["[@content_allow_reviews@]", "Reviews enabled"],
                ["[@parent_content_id@]", "Parent page ID"],
                ["[@content_fullpath@]", "Full URL path"],
                ["[@subtitle@]", "Page subtitle"],
                ["[@sortorder@]", "Sort order number"],
                ["[@rating@]", "Average review rating"],
                ["[@templatebody@] / [@templatehead@] / [@templatefoot@]", "Assigned template IDs"],
                ["[@access_control@]", "Requires login"],
              ]} />
            </Section>
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

            <Section title="Variations & Child Products" icon={Tag}>
              <h4 className="font-medium mb-1">list_item_variations — Dropdown/Swatch Selectors</h4>
              <CodeBlock>{`[%list_item_variations id:'[@current_sku@]'%]
    [%param *variation_header%]
        <label>[@specific@]:</label>
        <select name="[@specific@]">
    [%/param%]
    [%param *variation_body%]
        <option value="[@value@]" [@selected@]>[@value@]</option>
    [%/param%]
    [%param *variation_footer%]
        </select>
    [%/param%]
[%/list_item_variations%]`}</CodeBlock>
              <TagTable rows={[
                ["[@specific@]", "Variation type name (Size, Colour, etc.)"],
                ["[@value@]", "Individual option value (S, M, L, Red, Blue)"],
                ["[@selected@]", "Prints 'selected' for the current selection"],
                ["[@sku@]", "Child SKU for this variation"],
                ["[@price@]", "Price for this variation"],
                ["[@stock@]", "Stock for this variation"],
              ]} />

              <h4 className="font-medium mt-4 mb-1">Variation Grid (Matrix Layout)</h4>
              <CodeBlock>{`<!-- Grid/matrix for multi-add (e.g., size × colour table) -->
[%list_item_variations id:'[@sku@]' grid_style:'1d,2d'%]
    [%param grid_header%]<table class="table">[%/param%]
    [%param grid_row_header%]<tr>[%/param%]
    [%param grid_corner_cell%]<th></th>[%/param%]
    [%param grid_column_header%]<th>[@value@]</th>[%/param%]
    [%param grid_cell%]
        <td><input type="number" name="qty_[@sku@]" value="0" min="0" /></td>
    [%/param%]
    [%param grid_row_footer%]</tr>[%/param%]
    [%param grid_footer%]</table>[%/param%]
[%/list_item_variations%]`}</CodeBlock>
              <p className="text-xs text-muted-foreground mt-2">Grid file: <code>products/includes/grid.template.html</code></p>

              <h4 className="font-medium mt-4 mb-1">display_child_products — List All Children</h4>
              <CodeBlock>{`[%display_child_products id:'[@sku@]' template:'default' sortby:'sortorder'%]
    [%param *header%]<h4>Available Variants</h4>[%/param%]
    [%param *footer%][%/param%]
    [%param *ifempty%]<p>No variants available</p>[%/param%]
[%/display_child_products%]`}</CodeBlock>
              <p className="text-xs text-muted-foreground mt-1">Uses thumb templates from <code>thumbs/product/</code>. Sort options: brand, name, sku, shippingweight, sortorder.</p>

              <h4 className="font-medium mt-4 mb-1">Colour Swatches & Size Blocks</h4>
              <ul className="list-disc pl-5 text-xs space-y-1">
                <li><strong>Colour swatches</strong>: Replace dropdown with coloured squares using variation specifics</li>
                <li><strong>Size blocks</strong>: Small clickable blocks instead of dropdown</li>
                <li><strong>Stop preselection</strong>: By default Neto preselects a child — can be disabled</li>
                <li>Deprecated: <code>item_variations</code> → use <code>display_child_products</code> instead</li>
              </ul>
            </Section>

            <Section title="Related, Cross-sell, Upsell & Free Gifts" icon={Tag}>
              <CodeBlock>{`<!-- Related (auto-generated from purchase behavior) -->
[%related_products id:'[@SKU@]' limit:'10' template:'' show_all:'1'%]
    [%param *header%]<h4>Customers Also Bought</h4>[%/param%]
    [%param *ifempty%]<p>No related products.</p>[%/param%]
[%/related_products%]

<!-- Cross-sell (manually assigned in CP) -->
[%crosssell id:'[@SKU@]' limit:'10' template:'' show_all:'1'/%]

<!-- Upsell (manually assigned, also shows at checkout) -->
[%upsell_products id:'[@SKU@]' limit:'10' template:'' show_all:'1'/%]

<!-- Discount/bonus products (from Discounts & Coupons CP section) -->
[%discount_products id:'[@SKU@]' template:'' show_all:'1' limit:'100'%]
    [%param *header%]
        <h3>BONUS! Buy [@name@] & Get These FREE!</h3>
    [%/param%]
[%/discount_products%]

<!-- Free gifts (requires Freebies addon) -->
[%free_gifts id:'[@sku@]'%]
    [%param *header%]<h4>Free Gifts</h4>[%/param%]
[%/free_gifts%]`}</CodeBlock>
              <TagTable rows={[
                ["related_products", "Auto-generated from purchase behavior (people who bought X also bought Y)"],
                ["crosssell", "Manually assigned in CP — shows on product page"],
                ["upsell_products", "Manually assigned in CP — also appears during checkout"],
                ["discount_products", "Products discounted/free via Discounts & Coupons section"],
                ["free_gifts", "Requires Freebies addon — buy X get Y free (appears in cart)"],
              ]} />
            </Section>

            <Section title="Extra Options (Non-Inventoried)" icon={Tag}>
              <CodeBlock>{`[%extra_options id:'[@sku@]'%]
    [%param *header%]<h4>Available Options</h4>[%/param%]
    [%param *choices%]
        <label>[@title@] [@price_label@]</label>
        <div>[@choices@]</div>
    [%/param%]
    [%param *text_option%]
        <label>[@title@] [@price_label@]</label>
        <input type="text" name="[@name@]" maxlength="[@maxlength@]" />
    [%/param%]
    [%param *number_option%]
        <label>[@title@]</label>
        <input type="number" name="[@name@]" />
    [%/param%]
    [%param *select_option%]
        <label>[@title@]</label>
        <select name="[@name@]">[@choices@]</select>
    [%/param%]
[%/extra_options%]`}</CodeBlock>
              <p className="text-xs text-muted-foreground mt-2">Extra options are non-inventoried add-ons (gift wrapping, engraving, etc.) configured per product in CP. Format in product data: <code>**Gift Message;*-TEXT_FIELD-;LENGTH=+80</code></p>
            </Section>

            <Section title="Caching & Performance" icon={Zap}>
              <h4 className="font-medium mb-1">Cache Tag</h4>
              <CodeBlock>{`<!-- Cache a product thumbnail (most effective cache) -->
[%cache id:'thumb_[@inventory_id@]' type:'product'%]
    <div class="product-card">
        <img src="[@thumb@]" alt="[@name@]" />
        <p>[@name@] - [@store_price@]</p>
    </div>
[%/cache%]

<!-- Cache category menu -->
[%cache id:'header_category_menu' type:'cmenu'%]
    [%content_menu content_type:'category' ...%]...[%/content_menu%]
[%/cache%]`}</CodeBlock>
              <TagTable rows={[
                ["type:'product'", "Refreshes when product data changes"],
                ["type:'content'", "Refreshes when content/category changes"],
                ["type:'cmenu'", "Refreshes when menu structure changes"],
                ["type:'cart'", "Refreshes per cart session"],
                ["id:''", "Unique identifier for this cache block"],
              ]} />
              <div className="border rounded-md p-3 mt-2 text-xs space-y-1">
                <p className="font-medium">⚠️ Cache Rules:</p>
                <ul className="list-disc pl-4">
                  <li><code>type</code> is required and cannot be blank</li>
                  <li>Cached hourly OR when related data updates in CP</li>
                  <li><strong>Never cache</strong> customer-specific or cart-specific content</li>
                  <li>Max size: 1MB per cached snippet (excl. images)</li>
                  <li>Use <code>[@inventory_id@]</code> for per-product cache keys</li>
                </ul>
              </div>

              <h4 className="font-medium mt-4 mb-1">Performance Best Practices</h4>
              <ul className="list-disc pl-5 text-xs space-y-1">
                <li>Images: x1 to x1.5 display size, use TinyPNG for compression</li>
                <li>Upload optimized images to <code>raw_imagedrop</code> folder (bypasses CP processing)</li>
                <li>Use <code>[@config:IMG_THUMB_WIDTH@]</code> for image dimension attributes</li>
                <li>Lazy load below-fold images (native <code>loading="lazy"</code>)</li>
                <li>Keep Web Accelerator ON for production (use Developer Mode only when needed)</li>
                <li>Don't nest functions too deeply in large loops</li>
                <li>Provide facades for 3rd-party widgets (chat, analytics) to avoid blocking render</li>
                <li>Remove thumbnail code referencing 3rd-party assets</li>
                <li>Use <code>[%ajax_loader%]</code> to exclude dynamic content from accelerator cache</li>
              </ul>
            </Section>
          </TabsContent>
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
                ["/_myaccount?page=addressbook", "Address book management"],
              ]} />
            </Section>

            <Section title="Registration Form Fields" icon={Users}>
              <p>Template locations:</p>
              <CodeBlock>{`THEME-NAME/templates/customer/register/template.html
THEME-NAME/templates/customer/login.template.html`}</CodeBlock>
              <h4 className="font-medium mt-3 mb-1">Standard Form Input Names</h4>
              <TagTable rows={[
                ["reg_username", "Username (auto-use email via CUSTOMER_REGISTRATION_IGNORE_USERNAME=1)"],
                ["reg_password / reg_confirm_password", "Password fields"],
                ["reg_email_address", "Email address"],
                ["reg_bill_first_name / reg_bill_last_name", "Name fields"],
                ["reg_bill_company", "Company name"],
                ["reg_bill_phone", "Phone number"],
                ["reg_bill_zip / reg_bill_city / reg_bill_state", "Address fields"],
                ["reg_bill_country", "Country"],
                ["reg_usercustom1 ... reg_usercustom9", "Custom fields (read back as [@user:usercustom1@])"],
                ["reg_usermisc1", "Miscellaneous field"],
              ]} />
            </Section>

            <Section title="Address Book Function Tag" icon={Users}>
              <CodeBlock>{`[%address_book%]
    [%param *header%]<ul>[%/param%]
    [%param *body%]
        <li>
            <strong>[@ship_title@]</strong><br/>
            [@ship_first_name@] [@ship_last_name@]<br/>
            [@ship_street1@] [@ship_street2@]<br/>
            [@ship_city@] [@ship_state@] [@ship_postcode@]<br/>
            [@ship_country@]
        </li>
    [%/param%]
    [%param *footer%]</ul>[%/param%]
[%/address_book%]`}</CodeBlock>
              <TagTable rows={[
                ["[@id@]", "Address ID ('b' for billing, integer for shipping)"],
                ["[@ship_title@]", "Address label"],
                ["[@ship_first_name@], [@ship_last_name@]", "Name"],
                ["[@ship_street1@], [@ship_street2@]", "Street lines"],
                ["[@ship_city@], [@ship_state@], [@ship_postcode@]", "Location"],
                ["[@ship_country@]", "Country code"],
              ]} />
            </Section>

            <Section title="User Value Tags (Logged-in Customer)" icon={Users}>
              <p>All via <code>[@user:field_name@]</code>:</p>
              <TagTable rows={[
                ["[@user:email@]", "Email"],
                ["[@user:username@]", "Username"],
                ["[@user:bill_first_name@] / [@user:bill_last_name@]", "Name"],
                ["[@user:haslogin@]", "True if logged in"],
                ["[@user:active@]", "True if active"],
                ["[@user:registration_date@]", "Registration date"],
                ["[@user:sales_agent@]", "Sales agent"],
                ["[@user:approval_username@]", "B2B approval parent"],
                ["[@user:balance@]", "Credit balance"],
                ["[@user:addr_id@]", "Default address ID"],
                ["[@user:referral_username@]", "Referral code"],
                ["[@user:usercustom1@] to [@user:usercustom9@]", "Custom fields"],
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

            <Section title="Physical Asset Path Structure (Critical)" icon={Link2}>
              <p className="text-xs font-medium text-primary mb-2">These are the actual on-disk / URL paths Maropost uses. Our platform must mirror these exactly.</p>
              
              <h4 className="font-medium mt-2 mb-1">Theme Assets</h4>
              <CodeBlock title="Pattern: /assets/themes/THEME_NAME/...">{`/assets/themes/skeletal/img/logo.png          ← Store logo
/assets/themes/skeletal/css/app.css            ← Compiled base CSS
/assets/themes/skeletal/css/style.css          ← Theme-specific CSS
/assets/themes/skeletal/css/custom.css         ← Custom overrides
/assets/themes/skeletal/css/slick.css          ← Slick carousel
/assets/themes/skeletal/css/slick-theme.css    ← Slick theme
/assets/themes/skeletal/js/custom.js           ← Theme JS
/assets/themes/skeletal/js/ba_custom.js        ← Custom JS
/assets/themes/skeletal/fonts/titillium.css    ← Font CSS
/assets/themes/skeletal/img/...                ← Theme images`}</CodeBlock>
              <p className="text-xs text-muted-foreground mt-1"><code>skeletal</code> is the base/default theme name. Replace with actual theme folder name.</p>

              <h4 className="font-medium mt-3 mb-1">Product Images</h4>
              <CodeBlock title="Pattern: /assets/thumb/SKU.ext and /assets/full/SKU.ext">{`/assets/thumb/2168A.png           ← Product thumbnail (by SKU)
/assets/thumb/SKU.png?timestamp   ← Cache-busted thumbnail
/assets/full/1778-DB-B.png        ← Full-size product image (by SKU)
/assets/full/SKU.webp             ← WebP format supported

Alternate images:
/assets/thumb/SKU_alt_1.png       ← Alt image 1 thumbnail
/assets/thumb/SKU_alt_2.png       ← Alt image 2 thumbnail
/assets/full/SKU_alt_1.png        ← Alt image 1 full size`}</CodeBlock>

              <h4 className="font-medium mt-3 mb-1">Category / Content Images</h4>
              <CodeBlock title="Pattern: /assets/webshop/cms/LAST2DIGITS/CONTENT_ID.ext">{`/assets/webshop/cms/82/182.webp    ← Category image (ID=182, last 2 digits=82)
/assets/webshop/cms/80/180.webp    ← Category "All Toolboxes" (ID=180)
/assets/webshop/cms/18/318.webp    ← Category (ID=318, last 2 digits=18)
/assets/webshop/cms/06/206.webp    ← Category (ID=206, last 2 digits=06)
/assets/webshop/cms/22/422.webp    ← Category (ID=422, last 2 digits=22)

The subfolder is the LAST 2 DIGITS of the content ID.
Format: /assets/webshop/cms/{ID % 100 padded to 2 digits}/{ID}.{ext}`}</CodeBlock>

              <h4 className="font-medium mt-3 mb-1">Marketing / Advert Banners</h4>
              <CodeBlock title="Pattern: /assets/marketing/ID.ext">{`/assets/marketing/151.webp         ← Desktop banner (advert ID=151)
/assets/marketing/156.webp         ← Mobile banner (advert ID=156)
/assets/marketing/ID.webp?timestamp`}</CodeBlock>

              <h4 className="font-medium mt-3 mb-1">Other Asset Paths</h4>
              <TagTable rows={[
                ["/assets/pixel.gif", "1x1 transparent pixel — universal fallback/placeholder"],
                ["/assets/themes/THEME/img/logo.png", "Store logo in theme folder"],
                ["/assets/webshop/cms/ID/ID.webp", "Content/category page primary image"],
                ["/assets/thumb/SKU.png", "Product thumbnail image"],
                ["/assets/full/SKU.png", "Product full-size image"],
                ["/assets/thumbL/SKU.png", "Product large thumbnail"],
                ["/assets/marketing/ID.webp", "Marketing/advert banner image"],
                ["/assets/brochure/SKU.pdf", "Product brochure PDF"],
                ["/assets/logo/logo.png", "Main site logo"],
                ["/assets/logo/favicon.ico", "Site favicon"],
              ]} />

              <h4 className="font-medium mt-3 mb-1">Path Resolution Rules</h4>
              <div className="border rounded-md p-3 text-xs space-y-1">
                <p><strong>1.</strong> <code>[%ntheme_asset%]path[%/ntheme_asset%]</code> → <code>/assets/themes/ACTIVE_THEME/path</code></p>
                <p><strong>2.</strong> <code>[%asset_url type:'product' id:'SKU' thumb:'full'/%]</code> → <code>/assets/full/SKU.png</code></p>
                <p><strong>3.</strong> <code>[%asset_url type:'product' id:'SKU' thumb:'thumb'/%]</code> → <code>/assets/thumb/SKU.png</code></p>
                <p><strong>4.</strong> <code>[%asset_url type:'content' id:'182'/%]</code> → <code>/assets/webshop/cms/82/182.webp</code></p>
                <p><strong>5.</strong> <code>[%asset_url type:'logo'/%]</code> → <code>/assets/themes/THEME/img/logo.png</code></p>
                <p><strong>6.</strong> <code>[%cdn_asset%]path[%/cdn_asset%]</code> → CDN base URL + path</p>
              </div>
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

            <Section title="AJAX Cart & JavaScript API" icon={Code2}>
              <p>Maropost provides JavaScript cart functions available after jQuery loads:</p>
              <CodeBlock title="Built-in Cart JavaScript">{`// Get current cart contents (returns array of product objects)
$.getCartCache()

// Get last product added to cart
$.getLastItemAdded()

// Cart loaded callback — fires after cart initializes
function cartLoaded() {
    console.log('Cart ready');
    var items = $.getCartCache();
}

// Add to Cart callback for analytics
nAddItemCallback = {
    addToCart: function() {
        var product = $.getLastItemAdded();
        // Send to Google Analytics, Facebook Pixel, etc.
        gtag('event', 'add_to_cart', { items: [product] });
    },
    addMultiToCart: function() {
        var items = $.getCartCache();
        // Handle multi-add
    },
    init: function() {
        // Runs on page load
    }
};

// AJAX add to cart
document.getElementById("myBtn").addEventListener("click", async () => {
    await fetch("/_mycart?sku=SOME_SKU&qty=1");
    window.location = "/_mycart?fn=payment";
});`}</CodeBlock>
              <p className="text-xs text-muted-foreground mt-2">
                <strong>Init chain:</strong> <code>$.initPageFuncs</code> → <code>$.addToCartInit</code> → <code>$.buildCartItem</code> → <code>$.cartCacheUpdate</code> → callback
              </p>
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

          {/* ═══════════════ API ACTIONS DETAIL (NEW) ═══════════════ */}
          <TabsContent value="api-actions" className="space-y-4">
            <Section title="Complete API Action List" icon={Server}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm mb-2">Products (Items)</h4>
                  <ul className="text-xs space-y-1 font-mono">
                    <li>AddItem</li>
                    <li>GetItem</li>
                    <li>UpdateItem</li>
                  </ul>
                </div>
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm mb-2">Orders</h4>
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
                  <h4 className="font-medium text-sm mb-2">Categories / Content</h4>
                  <ul className="text-xs space-y-1 font-mono">
                    <li>AddCategory</li>
                    <li>GetCategory</li>
                    <li>UpdateCategory</li>
                    <li>AddContent</li>
                    <li>GetContent</li>
                    <li>UpdateContent</li>
                  </ul>
                </div>
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm mb-2">Payments</h4>
                  <ul className="text-xs space-y-1 font-mono">
                    <li>AddPayment</li>
                    <li>GetPayment</li>
                    <li>GetPaymentMethods</li>
                  </ul>
                </div>
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm mb-2">Shipping</h4>
                  <ul className="text-xs space-y-1 font-mono">
                    <li>GetShippingQuote</li>
                    <li>GetShippingMethods</li>
                  </ul>
                </div>
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm mb-2">Vouchers / RMA</h4>
                  <ul className="text-xs space-y-1 font-mono">
                    <li>AddVoucher</li>
                    <li>GetVoucher</li>
                    <li>UpdateVoucher</li>
                    <li>AddRma</li>
                    <li>GetRma</li>
                    <li>UpdateRma</li>
                  </ul>
                </div>
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm mb-2">Warehouses / Suppliers</h4>
                  <ul className="text-xs space-y-1 font-mono">
                    <li>GetWarehouse</li>
                    <li>GetSupplier</li>
                    <li>GetCurrency</li>
                  </ul>
                </div>
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm mb-2">Cart</h4>
                  <ul className="text-xs space-y-1 font-mono">
                    <li>GetCart (internal)</li>
                    <li>UpdateCart (internal)</li>
                  </ul>
                </div>
              </div>
            </Section>

            <Section title="GetPayment API Call" icon={CreditCard}>
              <CodeBlock title="GetPayment request">{`POST https://www.yoursite.com.au/do/WS/NetoAPI
Headers:
  NETOAPI_ACTION: GetPayment
  Accept: application/json
  NETOAPI_KEY: your-api-key

{
  "Filter": {
    "PaymentID": [123],
    "OrderID": ["N10001"],
    "Page": 0,
    "Limit": 50,
    "OutputSelector": [
      "PaymentID", "OrderID", "PaymentMethodName",
      "AmountPaid", "DatePaid", "PaymentStatus"
    ]
  }
}`}</CodeBlock>
            </Section>

            <Section title="AddPayment API Call" icon={CreditCard}>
              <CodeBlock title="AddPayment request">{`{
  "Payment": [{
    "OrderID": "N10001",
    "PaymentMethodName": "Credit Card",
    "AmountPaid": 99.95,
    "DatePaid": "2024-01-15 10:30:00",
    "PaymentReference": "txn_123456"
  }]
}`}</CodeBlock>
            </Section>
          </TabsContent>

          {/* ═══════════════ PAYMENTS (NEW) ═══════════════ */}
          <TabsContent value="payments" className="space-y-4">
            <Section title="Payment Gateways Supported" icon={CreditCard}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {["PayPal", "Stripe", "eWAY", "Afterpay", "Zip Pay", "zipMoney", "Braintree", "SecurePay", 
                  "Commonwealth Bank", "NAB Transact", "Westpac", "ANZ eGate", "Pin Payments", "Windcave",
                  "Klarna", "Laybuy", "Openpay", "Humm", "LatitudePay", "Bank Transfer", "Cash on Delivery", "Phone Order"
                ].map(gw => (
                  <div key={gw} className="border rounded-md p-2 text-xs text-center">{gw}</div>
                ))}
              </div>
            </Section>

            <Section title="Payment Flow in Templates" icon={Code2}>
              <CodeBlock>{`<!-- Payment is entirely server-side. Templates just provide the form: -->

<!-- 1. Cart page shows order summary -->
/_mycart → templates/checkout/cart.template.html

<!-- 2. Checkout page collects billing/shipping -->
/_mycart?fn=payment → templates/checkout/payment.template.html

<!-- 3. Third-party redirect (PayPal, Afterpay) -->
/_mycart?fn=3rdparty → handled by gateway

<!-- 4. Order confirmation -->
/_mycart?fn=confirm → templates/checkout/confirm.template.html

<!-- Payment methods listed via function tag -->
[%payment_methods%]
    [%param *body%][@name@][%/param%]
[%/payment_methods%]`}</CodeBlock>
            </Section>

            <Section title="Cart Function Tag — Cart Values" icon={ShoppingCart}>
              <CodeBlock>{`<!-- Load specific cart value -->
[%cart id:'grand_total'/%]
[%cart id:'total_items'/%]
[%cart id:'shipping_cost'/%]
[%cart id:'payment_method'/%]
[%cart id:'payment_method_id'/%]
[%cart id:'discount_total'/%]
[%cart id:'product_total'/%]
[%cart id:'product_discount'/%]
[%cart id:'shipping_method'/%]
[%cart id:'shipping_method_id'/%]
[%cart id:'shipping_total'/%]
[%cart id:'voucher_credit'/%]`}</CodeBlock>
              <p className="text-xs text-muted-foreground mt-2">
                <strong>Note:</strong> These values are rendered at page load time — they won't update dynamically. For live updates, use AJAX calls.
              </p>
            </Section>
          </TabsContent>

          {/* ═══════════════ FILTERS & SORTING (NEW) ═══════════════ */}
          <TabsContent value="filters" className="space-y-4">
            <Section title="product_filter — Faceted Search" icon={Filter}>
              <CodeBlock>{`<!-- Category filter -->
[%product_filter type:'category' limit:'100' autohide:'0' filter_parent_content:'1'%]
    [%param header%]<h4>Filter By Category</h4>[%/param%]
    [%param *body%]
        [%if [@selected@]%]
            <a href="[@url@]" class="active">[@name@] ([@count@])</a>
        [%else%]
            <a href="[@url@]">[@name@] ([@count@])</a>
        [%/if%]
    [%/param%]
[%/product_filter%]

<!-- Brand filter -->
[%product_filter type:'brand' limit:'50'%]...[%/product_filter%]

<!-- Price filter -->
[%product_filter type:'price'%]...[%/product_filter%]

<!-- Variation specifics filter (Size, Colour, etc.) -->
[%product_filter type:'variations'%]...[%/product_filter%]

<!-- A-Z filter (for brands/content) -->
[%a2z%]
    [%param *body%]
        <a href="[%url type:'page'%]?lead=[@upper@][%END url%]">[@upper@]</a>
    [%/param%]
[%/a2z%]`}</CodeBlock>
              <TagTable rows={[
                ["type:'category'", "Filter by category tree"],
                ["type:'brand'", "Filter by product brand"],
                ["type:'price'", "Price range buckets"],
                ["type:'variations'", "Variation specifics (size, colour)"],
                ["type:'a2z'", "A-Z alphabetical filter"],
                ["type:'keywords'", "Keyword/tag filter"],
                ["type:'instock'", "In-stock only toggle"],
                ["autohide:'0'", "Show filter even when only 1 option"],
                ["filter_parent_content:'1'", "Include parent category products"],
                ["ignorefilter:''", "Ignore specific filter types (brand, price, misc#, filter#)"],
                ["[@selected@]", "True if this filter option is currently active"],
                ["[@name@]", "Filter option label"],
                ["[@count@]", "Number of matching products"],
                ["[@url@]", "URL with this filter applied"],
              ]} />
            </Section>

            <Section title="filter & filter_code Functions" icon={Filter}>
              <CodeBlock>{`<!-- Check if a filter is active -->
[%filter id:'keywords' if:'ne' value:''%]
    [%param if_true%]
        <p>Search results for: [%filter id:'keywords'/%]</p>
    [%/param%]
    [%param if_false%]
        <p>Browse all products</p>
    [%/param%]
[%/filter%]

<!-- Get filter query string for forms -->
<form method="get" action="[@config:current_url@]">
    <input type="hidden" name="rf" value="[%filter_code id:'brand,category'/%]" />
    <input name="price_from" /> to <input name="price_to" />
    <button type="submit">Filter</button>
</form>`}</CodeBlock>
              <p className="text-xs text-muted-foreground mt-2"><code>filter</code> returns the value; <code>filter_code</code> returns the query string preserving other active filters.</p>
            </Section>

            <Section title="sortby & viewby Functions" icon={Filter}>
              <CodeBlock>{`<!-- Get current sort setting -->
Current sort: [%sortby type:'products'/%]
<!-- Returns: popular, name, lowest_price, etc. -->

<!-- Get current view mode -->
Current view: [%viewby type:'products'/%]
<!-- Returns: gallery, list, etc. -->`}</CodeBlock>
              <h4 className="font-medium mt-3 mb-1">All Sort Options</h4>
              <TagTable rows={[
                ["popular", "Most popular (default)"],
                ["name", "Product name A-Z"],
                ["brand", "Brand name"],
                ["SKU", "Product SKU"],
                ["lowest_price / highest_price", "Price sorting"],
                ["sortorder / sortorder2", "Manual sort order 1 & 2"],
                ["sortorder_price / sortorder2_price", "Sort order then price"],
                ["largest_item / smallest_item", "By size"],
                ["longest_item / shortest_item", "By length"],
                ["top_sellers", "By sales count"],
              ]} />
            </Section>

            <Section title="thumb_list Filter Parameters" icon={Filter}>
              <TagTable rows={[
                ["filter_category:''", "Filter by category ID or slug"],
                ["filter_brand:''", "Filter by brand name"],
                ["filter_price_from:'' / filter_price_to:''", "Price range"],
                ["filter_in_stock:'y'", "Only in-stock items"],
                ["filter_new:'y'", "Only new products"],
                ["filter_on_sale:'y' / filter_has_save:''", "On sale / has RRP discount"],
                ["filter_featured:'y'", "Only featured"],
                ["filter_a2z:'[@form:lead@]'", "A-Z letter filter"],
                ["filter_exsku1:'[@sku@]'", "Exclude specific SKU"],
                ["filter_field:'value'", "Custom field filter"],
                ["filter_date_from:'' / filter_date_to:''", "Date range"],
              ]} />
            </Section>

            <Section title="Pagination" icon={Filter}>
              <CodeBlock>{`[%thumb_list type:'products' limit:'24' page:'[@form:page@]'%]
    [%param *body%]...product card...[%/param%]
[%/thumb_list%]

[%paging%]
    [%param *prev%]<a href="[@url@]">&laquo; Prev</a>[%/param%]
    [%param *body%]<a href="[@url@]" class="[@current@]">[@page_number@]</a>[%/param%]
    [%param *next%]<a href="[@url@]">Next &raquo;</a>[%/param%]
[%/paging%]`}</CodeBlock>
            </Section>
          </TabsContent>

          {/* ═══════════════ EBAY & MARKETPLACES (NEW) ═══════════════ */}
          <TabsContent value="ebay" className="space-y-4">
            <Section title="eBay Template System" icon={Globe}>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>eBay has its <strong>own set of B@SE tags</strong> separate from the webstore</li>
                <li>eBay templates are stored in a separate directory structure</li>
                <li>eBay templates cannot use JavaScript (eBay policy)</li>
                <li>Product listings are synced via the Maropost Control Panel</li>
                <li>eBay-specific data tags documented separately</li>
              </ul>
            </Section>

            <Section title="Marketplace Channels" icon={ShoppingCart}>
              <TagTable rows={[
                ["eBay AU/US/UK", "Full listing management with templates"],
                ["Amazon AU", "Product feed sync"],
                ["Catch.com.au", "Product feed sync"],
                ["Google Shopping", "XML product feed via sitemap"],
                ["Facebook Shop", "Catalogue sync"],
                ["Trade Me (NZ)", "Auction/buy now listings"],
                ["Kogan", "Product feed"],
              ]} />
            </Section>
          </TabsContent>

          {/* ═══════════════ EMAILS & PRINTABLES (NEW) ═══════════════ */}
          <TabsContent value="emails" className="space-y-4">
            <Section title="Email Template System" icon={FileText}>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>Email templates use the same B@SE tag syntax as webstore templates</li>
                <li>Stored in <code>templates/emails/</code> directory</li>
                <li>Support all order, customer, and product data tags</li>
                <li>HTML email with inline CSS (no external stylesheets)</li>
                <li>Triggered automatically by order status changes</li>
              </ul>
            </Section>

            <Section title="Email Types" icon={FileText}>
              <TagTable rows={[
                ["Order Confirmation", "Sent when order is placed (status 110)"],
                ["Order Dispatched", "Sent when order ships (status 200)"],
                ["Order Completed", "Sent when delivered (status 300)"],
                ["Abandoned Cart", "Sent after cart abandonment delay"],
                ["Welcome Email", "Sent on new customer registration"],
                ["Password Reset", "Triggered by forgot password"],
                ["Quote Email", "Sent for quote orders (status 100)"],
                ["Back in Stock", "Triggered when product restocked"],
                ["Review Request", "Sent after order completion delay"],
                ["Gift Voucher", "Sent when voucher is purchased"],
                ["Invoice", "Order invoice email"],
                ["Credit Note", "Credit note notification"],
                ["Shipment Tracking", "Tracking number update"],
              ]} />
            </Section>

            <Section title="Printable Templates" icon={FileText}>
              <TagTable rows={[
                ["Invoice", "templates/printables/invoice.template.html"],
                ["Packing Slip", "templates/printables/packing_slip.template.html"],
                ["Pick List", "templates/printables/pick_list.template.html"],
                ["Shipping Label", "templates/printables/shipping_label.template.html"],
                ["Return Label", "templates/printables/return_label.template.html"],
                ["Quote", "templates/printables/quote.template.html"],
                ["Customer Statement", "templates/printables/statement.template.html"],
                ["Gift Voucher", "templates/printables/gift_voucher.template.html"],
                ["Barcode Labels", "templates/printables/barcode_label.template.html"],
              ]} />
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

          {/* ═══════════════ THEME STRUCTURE ═══════════════ */}
          <TabsContent value="theme-structure" className="space-y-4">
            <Section title="Complete Theme Directory" icon={FileText}>
              <p>All themes at <code>/httpdocs/assets/themes/THEME_NAME/</code></p>
              <CodeBlock>{`skeletal/
├── css/
│   ├── style.css        ← Your custom CSS (EDIT THIS)
│   └── app.css          ← Compiled framework (DO NOT EDIT)
├── js/
│   ├── ba_custom.js     ← Your custom JS (EDIT THIS)
│   └── custom.js        ← Framework JS (DO NOT EDIT)
├── img/
│   └── logo.png
└── templates/
    ├── headers/
    │   ├── template.html
    │   └── empty.template.html
    ├── footers/
    │   ├── template.html
    │   └── empty.template.html
    ├── products/
    │   ├── template.html          ← Product detail page
    │   └── includes/
    │       ├── header.template.html
    │       ├── buying_options.template.html
    │       ├── related.template.html
    │       └── reviews.template.html
    ├── cms/
    │   ├── template.html          ← Default content page
    │   ├── category.template.html ← Category listing
    │   ├── blog.template.html
    │   └── includes/
    │       └── sidebar.template.html
    ├── cart/
    │   ├── template.html
    │   ├── cart.error.html
    │   └── confirmation.template.html
    ├── checkout/
    │   └── template.html
    ├── customer/
    │   ├── login.template.html    ← Login + Registration
    │   ├── register/template.html
    │   ├── account/template.html
    │   └── forgot_password/template.html
    ├── search/
    │   └── template.html
    ├── thumbs/
    │   ├── product/template.html  ← Product card
    │   └── content/template.html  ← Content card
    └── write_review/
        ├── write.template.html
        ├── preview.template.html
        └── confirm.template.html`}</CodeBlock>
            </Section>

            <Section title="Page Composition" icon={FileText}>
              <p>Every page = <strong>Header + Body + Footer</strong> template</p>
              <CodeBlock>{`<!-- Override via URL params (testing) -->
?templatehead=alt_header
?templatebody=alt_body
?templatefoot=alt_footer

<!-- Preview staging theme -->
?nview=THEME_NAME

<!-- Include sub-templates -->
[%load_template file:'cms/includes/sidebar.template.html'/%]

<!-- Async include -->
[%load_ajax_template file:'products/includes/reviews.template.html'/%]`}</CodeBlock>
              <div className="border rounded-md p-3 mt-2 text-xs">
                <p className="font-medium">⚠️ Rules:</p>
                <ul className="list-disc pl-4">
                  <li>Only <code>.template.html</code> files processed by B@SE engine</li>
                  <li>Plain <code>.html</code> = static, no B@SE tag processing</li>
                  <li>Custom templates assignable only when theme is <strong>active</strong></li>
                  <li>SFTP upload = immediately live (no build step)</li>
                </ul>
              </div>
            </Section>

            <Section title="Thumb Templates" icon={FileText}>
              <CodeBlock>{`<!-- Default thumb: thumbs/product/template.html -->
[%thumb_list type:'products' template:''%]  ← uses default

<!-- Custom thumb: thumbs/product/grid.template.html -->
[%thumb_list type:'products' template:'grid'%]

<!-- Content thumbs from thumbs/content/ -->
[%thumb_list type:'blog' template:'card'%]`}</CodeBlock>
            </Section>
          </TabsContent>

          {/* ═══════════════ WEBHOOKS & API ═══════════════ */}
          <TabsContent value="webhooks" className="space-y-4">
            <Section title="Order Notification Webhooks" icon={Zap}>
              <CodeBlock>{`POST https://your-webhook-url.com/endpoint
Headers:
  NETO_NOTIFICATION: Order
  NETOAPI_KEY: your-api-secure-key

Body (XML):
<?xml version="1.0" encoding="utf-8"?>
<Event>
    <CurrentTime>2024-01-03 01:11:12</CurrentTime>
    <Order>
        <OrderID>N10001</OrderID>
        <Username>customer@email.com</Username>
        <OrderStatus>Pick</OrderStatus>
        <PreviousOrderStatus>New</PreviousOrderStatus>
    </Order>
</Event>`}</CodeBlock>
              <div className="border rounded-md p-3 mt-2 text-xs">
                <p className="font-medium">⚠️ Webhook Notes:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Fires on <strong>order status changes</strong> only — not on creation</li>
                  <li>Payload is minimal — use <code>GetOrder</code> API for full details</li>
                  <li>Verify <code>NETOAPI_KEY</code> header for authentication</li>
                  <li>v6.354.0+ has stricter security (fewer fields in payload)</li>
                  <li>Rate limit: 500 requests/minute (429 if exceeded)</li>
                </ul>
              </div>
            </Section>

            <Section title="API Endpoint & Best Practices" icon={Code2}>
              <CodeBlock>{`POST https://www.mysite.com.au/do/WS/NetoAPI
Headers:
  NETOAPI_ACTION: GetOrder
  NETOAPI_KEY: your-api-key
  Accept: application/json`}</CodeBlock>
              <h4 className="font-medium mt-3 mb-1">Always Use OutputSelector</h4>
              <CodeBlock>{`// ✅ Only fetch needed fields
{
  "Filter": {
    "OrderID": "N10001",
    "OutputSelector": ["OrderID", "OrderStatus", "GrandTotal", "OrderLine"]
  }
}`}</CodeBlock>
              <ul className="list-disc pl-5 space-y-1 text-xs mt-2">
                <li>Batch create/update in single requests to minimize API calls</li>
                <li>Track order <strong>lines</strong> not just order IDs (orders can split)</li>
                <li>Use UTC date variants for timezone consistency</li>
              </ul>
            </Section>

            <Section title="Cart & Checkout URL Actions" icon={ShoppingCart}>
              <TagTable rows={[
                ["/_mycart", "View cart"],
                ["/_mycart?sku=SKU&qty=1", "Add to cart via URL"],
                ["/_mycart?fn=payment", "Proceed to payment"],
                ["/_mycart?fn=3rdparty", "3rd-party payment redirect"],
                ["/_mycart?fn=complete", "Order confirmation"],
                ["/_mycart?fn=empty", "Empty the cart"],
                ["/_mycart?coupon=CODE", "Apply coupon"],
              ]} />
            </Section>

            <Section title="SEO: url_info Function" icon={Search}>
              <CodeBlock>{`[%url_info name:'page_title'/%]
[%url_info name:'meta_description'/%]
[%url_info name:'canonical_url'/%]
[%url_info name:'page_heading'/%]

<!-- For a specific product -->
[%url_info type:'product' id:'[@sku@]' name:'page_heading' default:'[@content_name@]'/%]`}</CodeBlock>
              <TagTable rows={[
                ["name:'page_title'", "SEO title"],
                ["name:'page_heading'", "H1 heading"],
                ["name:'meta_description'", "Meta description"],
                ["name:'canonical_url'", "Canonical URL path"],
                ["type:'product'", "Query specific product (by SKU)"],
                ["default:''", "Fallback if field is empty"],
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

            <Section title="More Gotchas" icon={AlertTriangle}>
              <div className="space-y-3">
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm text-destructive">❌ Cache invalidation</h4>
                  <p className="text-xs mt-1"><code>[%cache%]</code> blocks don't auto-invalidate on product updates. Clear cache manually or use unique cache IDs per entity.</p>
                </div>
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm text-destructive">❌ [%list%] vs [%thumb_list%]</h4>
                  <p className="text-xs mt-1">The <code>[%list%]</code> function is still "under development" per Maropost. When in doubt, use <code>[%thumb_list%]</code> which is the stable version. <code>[%list%]</code> templates come from <code>list/</code> directory, not <code>thumbs/</code>.</p>
                </div>
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm text-destructive">❌ Hardcoded /assets/ paths</h4>
                  <p className="text-xs mt-1">Some themes hardcode paths like <code>/assets/themes/skeletal/fonts/titillium.css</code> instead of using <code>[%ntheme_asset%]</code>. Our engine must handle both patterns.</p>
                </div>
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm text-destructive">❌ [@cart:...@] vs [%cart id:'...'/%]</h4>
                  <p className="text-xs mt-1">The inline <code>[@cart:grand_total@]</code> syntax is faster but both render at page load time — neither updates dynamically without AJAX.</p>
                </div>
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm text-destructive">❌ content_menu level depth</h4>
                  <p className="text-xs mt-1">Must define <code>*level_1</code>, <code>*level_2</code>, <code>*level_3</code> params explicitly. Missing levels won't render children.</p>
                </div>
                <div className="border rounded-md p-3">
                  <h4 className="font-medium text-sm text-destructive">❌ eBay templates</h4>
                  <p className="text-xs mt-1">eBay templates CANNOT contain JavaScript — eBay strips it. Only inline CSS and HTML.</p>
                </div>
              </div>
            </Section>

            <Section title="Bootstrap Dependency" icon={Palette}>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>Skeletal theme uses <strong>Bootstrap 4</strong> (latest version; older Skeletal used Bootstrap 3)</li>
                <li>Bootstrap CSS is loaded via CDN in the header template</li>
                <li>jQuery is required — loaded before custom.js</li>
                <li>Slick Carousel is the standard product slider library</li>
                <li>Font Awesome 4.7 is the standard icon library</li>
                <li>FancyBox is commonly used for image lightboxes</li>
                <li>Skeletal is on <strong>GitHub</strong>: <code>NetoECommerce/Skeletal</code></li>
                <li>Theme installation: upload <code>src</code> directory to <code>httpdocs/assets/themes</code></li>
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
