import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Search, Code2, Copy, ChevronRight, BookOpen, Layers, ShoppingCart, Users, Settings, FileText, Image, Tag } from "lucide-react";
import { toast } from "sonner";

interface TagDoc {
  tag: string;
  description: string;
  example?: string;
  output?: string;
}

interface TagCategory {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  tags: TagDoc[];
}

const categories: TagCategory[] = [
  {
    name: "Config / Store",
    icon: Settings,
    description: "Store-level configuration and settings tags",
    tags: [
      { tag: "[@config:company_name@]", description: "Store / company name", example: '[@config:company_name@]', output: "My Store" },
      { tag: "[@config:home_url@]", description: "Homepage URL", example: '[@config:home_url@]' },
      { tag: "[@config:contact_email@]", description: "Store contact email" },
      { tag: "[@config:phone@]", description: "Store phone number" },
      { tag: "[@config:address@]", description: "Store physical address" },
      { tag: "[@config:logo_url@]", description: "Store logo image URL" },
      { tag: "[@config:store_currency@]", description: "Default currency code (e.g. AUD)" },
      { tag: "[@config:currency_symbol@]", description: "Currency symbol (e.g. $)" },
      { tag: "[@config:tax_label@]", description: "Tax label (e.g. inc. GST)" },
      { tag: "[@config:tax_rate@]", description: "Default tax rate percentage" },
      { tag: "[@config:abn@]", description: "ABN / VAT number" },
      { tag: "[@config:copyright_year@]", description: "Current year for copyright notices" },
      { tag: "[@config:assets_url@]", description: "Base URL for theme asset files" },
      { tag: "[@config:cart_url@]", description: "Cart page URL" },
      { tag: "[@config:checkout_url@]", description: "Checkout page URL" },
      { tag: "[@config:account_url@]", description: "Customer account URL" },
      { tag: "[@config:login_url@]", description: "Login page URL" },
      { tag: "[@config:search_url@]", description: "Product search/listing URL" },
      { tag: "[@config:show_price@]", description: "Whether to show prices (1 or 0)" },
      { tag: "[@config:show_rrp@]", description: "Whether to show RRP (1 or 0)" },
      { tag: "[@config:show_addcart@]", description: "Whether to show Add to Cart (1 or 0)" },
      { tag: "[@config:show_wishlist@]", description: "Whether to show wishlist button" },
      { tag: "[@config:show_reviews@]", description: "Whether to show product reviews" },
      { tag: "[@config:items_per_page@]", description: "Default items per page for listings" },
      { tag: "[@config:social_facebook@]", description: "Facebook URL" },
      { tag: "[@config:social_instagram@]", description: "Instagram URL" },
      { tag: "[@config:social_twitter@]", description: "Twitter/X URL" },
      { tag: "[@config:social_tiktok@]", description: "TikTok URL" },
    ],
  },
  {
    name: "Product",
    icon: Tag,
    description: "Product detail and listing tags",
    tags: [
      { tag: "[@title@]", description: "Product title / name" },
      { tag: "[@sku@]", description: "Product SKU" },
      { tag: "[@price@]", description: "Selling price (formatted with $)", output: "$49.95" },
      { tag: "[@rrp@]", description: "Recommended retail price" },
      { tag: "[@save_amount@]", description: "Amount saved vs RRP" },
      { tag: "[@save_percent@]", description: "Percentage saved vs RRP" },
      { tag: "[@description@]", description: "Full product description (HTML)" },
      { tag: "[@short_description@]", description: "Short / subtitle description" },
      { tag: "[@brand@]", description: "Product brand name" },
      { tag: "[@model@]", description: "Product model number" },
      { tag: "[@weight@]", description: "Product weight" },
      { tag: "[@stock_quantity@]", description: "Current stock level" },
      { tag: "[@status@]", description: "Product status (active, draft, etc.)" },
      { tag: "[@product_url@]", description: "Full URL to product detail page" },
      { tag: "[@thumb_url@]", description: "Primary thumbnail image URL" },
      { tag: "[@image_url@]", description: "Primary full-size image URL" },
      { tag: "[@images@]", description: "Array of all product image URLs" },
      { tag: "[@barcode@]", description: "Product barcode / UPC / EAN" },
      { tag: "[@meta_title@]", description: "SEO meta title" },
      { tag: "[@meta_description@]", description: "SEO meta description" },
      { tag: "[@slug@]", description: "URL-safe product slug" },
      { tag: "[@created_at@]", description: "Product creation date" },
    ],
  },
  {
    name: "Cart",
    icon: ShoppingCart,
    description: "Shopping cart and checkout tags",
    tags: [
      { tag: "[@config:cart_count@]", description: "Number of items in cart" },
      { tag: "[@config:cart_total@]", description: "Cart total (formatted)" },
      { tag: "[@config:cart_subtotal@]", description: "Cart subtotal before tax/shipping" },
      { tag: "[@config:is_logged_in@]", description: "Whether user is logged in (1 or 0)" },
      { tag: "[@config:customer_name@]", description: "Logged-in customer name" },
      { tag: "[@config:customer_email@]", description: "Logged-in customer email" },
    ],
  },
  {
    name: "Content Pages",
    icon: FileText,
    description: "CMS content page tags",
    tags: [
      { tag: "[@content_title@]", description: "Page title" },
      { tag: "[@content_body@]", description: "Page body content (HTML)" },
      { tag: "[@content_slug@]", description: "Page URL slug" },
      { tag: "[@content_featured_image@]", description: "Featured image URL" },
      { tag: "[@content_seo_title@]", description: "SEO title override" },
      { tag: "[@content_seo_description@]", description: "SEO description override" },
    ],
  },
  {
    name: "Loops",
    icon: Layers,
    description: "Repeating template loops for lists of items",
    tags: [
      { tag: "[%ITEMS%]...[%/ITEMS%]", description: "Loop over product listing items", example: '[%ITEMS%]\n  <div>[@title@] - [@price@]</div>\n[%/ITEMS%]' },
      { tag: "[%THUMBLIST%]...[%/THUMBLIST%]", description: "Loop over product thumbnails", example: '[%THUMBLIST%]\n  <img src="[@thumb_url@]" />\n[%/THUMBLIST%]' },
      { tag: "[%VARIANTS%]...[%/VARIANTS%]", description: "Loop over product variants" },
      { tag: "[%SPECIFICS%]...[%/SPECIFICS%]", description: "Loop over product specifications" },
      { tag: "[%REVIEWS%]...[%/REVIEWS%]", description: "Loop over product reviews" },
      { tag: "[%CROSS_SELLS%]...[%/CROSS_SELLS%]", description: "Loop over cross-sell products" },
      { tag: "[%UPSELLS%]...[%/UPSELLS%]", description: "Loop over upsell products" },
      { tag: "[%CART_ITEMS%]...[%/CART_ITEMS%]", description: "Loop over items in cart" },
      { tag: "[%CATEGORIES%]...[%/CATEGORIES%]", description: "Loop over store categories" },
      { tag: "[%ADVERTS%]...[%/ADVERTS%]", description: "Loop over adverts/banners" },
      { tag: "[%LOCATIONS%]...[%/LOCATIONS%]", description: "Loop over store locations" },
      { tag: "[%ADDRESSES%]...[%/ADDRESSES%]", description: "Loop over customer addresses" },
      { tag: "[%WISHLIST_ITEMS%]...[%/WISHLIST_ITEMS%]", description: "Loop over wishlist items" },
    ],
  },
  {
    name: "Conditionals",
    icon: Code2,
    description: "Conditional display logic",
    tags: [
      { tag: "[%IF [@field@]%]...[%/IF%]", description: "Show block if field is truthy", example: '[%IF [@price@]%]\n  <span>[@price@]</span>\n[%/IF%]' },
      { tag: "[%IF [@field@] eq 'value'%]...[%/IF%]", description: "Show block if field equals value" },
      { tag: "[%IF [@field@] ne 'value'%]...[%/IF%]", description: "Show block if field does NOT equal value" },
      { tag: "[%IF [@field@] gt 0%]...[%/IF%]", description: "Show block if field is greater than value" },
      { tag: "[%IF [@field@] lt 100%]...[%/IF%]", description: "Show block if field is less than value" },
      { tag: "[%IF [@field@] contains 'text'%]...[%/IF%]", description: "Show block if field contains text" },
      { tag: "[%ELSE%]", description: "Else branch inside IF block" },
      { tag: "[%IF NOT [@field@]%]...[%/IF%]", description: "Negated condition" },
    ],
  },
  {
    name: "Includes & Assets",
    icon: Image,
    description: "Include sub-templates and reference assets",
    tags: [
      { tag: "[%INCLUDE 'path/file.html'%]", description: "Include another template file", example: "[%INCLUDE 'includes/header.template.html'%]" },
      { tag: "[%LOAD_TEMPLATE 'path'%]", description: "Load and render a sub-template" },
      { tag: "[@asset:filename@]", description: "Reference a theme asset by filename", example: '<img src="[@asset:logo.png@]" />' },
    ],
  },
  {
    name: "Format Pipes",
    icon: BookOpen,
    description: "Transform output values with format pipes",
    tags: [
      { tag: "[@field|currency@]", description: "Format as currency ($XX.XX)", output: "$49.95" },
      { tag: "[@field|currency_no_symbol@]", description: "Format as number (49.95)" },
      { tag: "[@field|integer@]", description: "Round to integer" },
      { tag: "[@field|decimal@]", description: "Two decimal places" },
      { tag: "[@field|date@]", description: "Format as date" },
      { tag: "[@field|datetime@]", description: "Format as date and time" },
      { tag: "[@field|date_short@]", description: "Short date (e.g. Jan 15)" },
      { tag: "[@field|uppercase@]", description: "Convert to UPPERCASE" },
      { tag: "[@field|lowercase@]", description: "Convert to lowercase" },
      { tag: "[@field|capitalize@]", description: "Capitalize first letter" },
      { tag: "[@field|url_encode@]", description: "URL-encode the value" },
      { tag: "[@field|strip_html@]", description: "Remove HTML tags" },
      { tag: "[@field|truncate_50@]", description: "Truncate to 50 characters" },
      { tag: "[@field|truncate_100@]", description: "Truncate to 100 characters" },
      { tag: "[@field|percentage@]", description: "Append % sign" },
      { tag: "[@field|json@]", description: "Output as JSON string" },
      { tag: "[@field|nl2br@]", description: "Convert newlines to <br>" },
      { tag: "[@field|boolean@]", description: 'Output "Yes" or "No"' },
      { tag: "[@field|count@]", description: "Count array items" },
    ],
  },
];

function copyTag(tag: string) {
  navigator.clipboard.writeText(tag);
  toast.success("Copied to clipboard");
}

export default function TemplateReference() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return categories;
    const q = search.toLowerCase();
    return categories.map(cat => ({
      ...cat,
      tags: cat.tags.filter(t =>
        t.tag.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      ),
    })).filter(cat => cat.tags.length > 0);
  }, [search]);

  const totalTags = categories.reduce((s, c) => s + c.tags.length, 0);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-semibold">B@SE Template Tag Reference</h1>
          <p className="text-xs text-muted-foreground">
            Complete reference for all {totalTags} supported template tags — use these in your theme HTML files
          </p>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 h-9"
            placeholder="Search tags (e.g. price, config, IF...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          {/* Sidebar: Quick nav */}
          <Card className="xl:col-span-1">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Categories</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-0.5">
                {categories.map(cat => (
                  <a
                    key={cat.name}
                    href={`#cat-${cat.name.toLowerCase().replace(/[^a-z]/g, "-")}`}
                    className="flex items-center gap-2 px-3 py-2 text-xs rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <cat.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{cat.name}</span>
                    <Badge variant="secondary" className="ml-auto text-[9px] h-4 px-1.5">{cat.tags.length}</Badge>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Main content */}
          <div className="xl:col-span-3 space-y-6">
            {filtered.map(cat => (
              <Card key={cat.name} id={`cat-${cat.name.toLowerCase().replace(/[^a-z]/g, "-")}`}>
                <CardHeader className="py-3 px-5">
                  <div className="flex items-center gap-2">
                    <cat.icon className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm">{cat.name}</CardTitle>
                    <Badge variant="outline" className="text-[10px] ml-1">{cat.tags.length} tags</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{cat.description}</p>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <div className="divide-y">
                    {cat.tags.map((t, i) => (
                      <div key={i} className="px-5 py-3 hover:bg-muted/30 transition-colors group">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <button
                              onClick={() => copyTag(t.tag)}
                              className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded hover:bg-primary/20 transition-colors cursor-pointer"
                              title="Click to copy"
                            >
                              {t.tag}
                            </button>
                            <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                          </div>
                          <button
                            onClick={() => copyTag(t.tag)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            title="Copy tag"
                          >
                            <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                          </button>
                        </div>
                        {t.example && (
                          <pre className="mt-2 text-[10px] bg-muted/50 rounded p-2 font-mono overflow-x-auto text-muted-foreground">
                            {t.example}
                          </pre>
                        )}
                        {t.output && (
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            → Output: <code className="bg-muted px-1 rounded">{t.output}</code>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            {filtered.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground text-sm">
                  No tags match "{search}"
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
