import { ReactNode, useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ShoppingBag, Menu, User, Store, Search, Heart, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useStoreSlug, resolveStoreBySlug } from "@/lib/subdomain";
import { StorefrontSearch } from "./StorefrontSearch";
import { NewsletterSignup } from "./NewsletterSignup";
import { CookieConsentBanner } from "./CookieConsentBanner";
import { PromoPopup } from "./PromoPopup";
import { CurrencySwitcher, useCurrency } from "./CurrencySwitcher";
import { LanguageSwitcher, useLanguage, LanguageProvider } from "./LanguageSwitcher";
import { supabase } from "@/integrations/supabase/client";

interface StorefrontLayoutProps {
  children: ReactNode;
  storeName?: string;
}

export function StorefrontLayout({ children, storeName }: StorefrontLayoutProps) {
  const { storeSlug: paramSlug } = useParams();
  const { totalItems } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { user } = useAuth();
  const { storeSlug, basePath } = useStoreSlug(paramSlug);
  const [searchOpen, setSearchOpen] = useState(false);
  const [storeId, setStoreId] = useState<string>("");
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [bannerText, setBannerText] = useState<string | null>(null);
  const currencyData = useCurrency(storeId);

  useEffect(() => {
    if (!storeSlug) return;
    resolveStoreBySlug(storeSlug, supabase).then((s) => {
      if (s) {
        setStoreId(s.id);
        if ((s as any).social_links) setSocialLinks((s as any).social_links as Record<string, string>);
        // Banner scheduling
        const bt = (s as any).banner_text;
        const bs = (s as any).banner_start;
        const be = (s as any).banner_end;
        if (bt) {
          const now = new Date();
          const startOk = !bs || new Date(bs) <= now;
          const endOk = !be || new Date(be) >= now;
          setBannerText(startOk && endOk ? bt : null);
        }
        // Load categories for mega menu
        supabase.from("categories").select("id, name, slug, parent_id, sort_order")
          .eq("store_id", s.id).order("sort_order").then(({ data }) => {
            setCategories(data || []);
          });
        // Inject GA tracking if configured
        const gaId = (s as any).ga_tracking_id;
        if (gaId && !document.querySelector(`script[src*="gtag"]`)) {
          const script = document.createElement("script");
          script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
          script.async = true;
          document.head.appendChild(script);
          const inline = document.createElement("script");
          inline.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`;
          document.head.appendChild(inline);
        }
        // Inject GTM if configured
        const gtmId = (s as any).gtm_container_id;
        if (gtmId && !document.querySelector(`script[data-gtm]`)) {
          const gtmScript = document.createElement("script");
          gtmScript.setAttribute("data-gtm", "true");
          gtmScript.textContent = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`;
          document.head.appendChild(gtmScript);
        }
        // Inject Facebook/Meta Pixel if configured
        const fbPixel = (s as any).fb_pixel_id;
        if (fbPixel && !document.querySelector(`script[data-fb-pixel]`)) {
          const fbScript = document.createElement("script");
          fbScript.setAttribute("data-fb-pixel", "true");
          fbScript.textContent = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${fbPixel}');fbq('track','PageView');`;
          document.head.appendChild(fbScript);
        }
        // Inject Google Ads conversion tracking if configured
        const gadsId = (s as any).google_ads_id;
        if (gadsId && !document.querySelector(`script[data-gads]`)) {
          const gadsScript = document.createElement("script");
          gadsScript.src = `https://www.googletagmanager.com/gtag/js?id=${gadsId}`;
          gadsScript.async = true;
          gadsScript.setAttribute("data-gads", "true");
          document.head.appendChild(gadsScript);
          const gadsInline = document.createElement("script");
          gadsInline.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gadsId}');`;
          document.head.appendChild(gadsInline);
        }
        // Inject favicon if configured
        const faviconUrl = (s as any).favicon_url;
        if (faviconUrl) {
          let link = document.querySelector("link[rel='icon']") as HTMLLinkElement;
          if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
          link.href = faviconUrl;
        }
      }
    });
  }, [storeSlug]);

  const parentCategories = categories.filter(c => !c.parent_id);
  const getChildren = (parentId: string) => categories.filter(c => c.parent_id === parentId);

  return (
    <div className="min-h-screen flex flex-col bg-background" style={{ fontSize: "16px" }}>
      {/* Announcement Banner */}
      {bannerText && (
        <div className="bg-primary text-primary-foreground text-center text-xs py-2 px-4 font-medium">
          {bannerText}
        </div>
      )}
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="sm:hidden h-9 w-9">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72">
                  <div className="flex items-center gap-2 mb-8 mt-2">
                    <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                      <Store className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <span className="font-bold">{storeName || "Store"}</span>
                  </div>
                  <nav className="flex flex-col gap-4">
                    <Link to={basePath || "/"} className="text-sm font-medium hover:text-primary transition-colors">Home</Link>
                    <Link to={`${basePath}/products`} className="text-sm font-medium hover:text-primary transition-colors">All Products</Link>
                    {user ? (
                      <Link to={`${basePath}/account`} className="text-sm font-medium hover:text-primary transition-colors">My Account</Link>
                    ) : (
                      <Link to={`${basePath}/login`} className="text-sm font-medium hover:text-primary transition-colors">Sign In</Link>
                    )}
                  </nav>
                </SheetContent>
              </Sheet>
              <Link to={basePath || "/"} className="text-xl font-bold tracking-tight hover:opacity-80 transition-opacity">
                {storeName || "Store"}
              </Link>
              <nav className="hidden sm:flex items-center gap-6">
                <Link to={basePath || "/"} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Home
                </Link>
                <Link to={`${basePath}/products`} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  All Products
                </Link>
                {/* Mega Menu */}
                {parentCategories.length > 0 && (
                  <div className="relative" onMouseEnter={() => setMegaMenuOpen(true)} onMouseLeave={() => setMegaMenuOpen(false)}>
                    <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                      Categories <ChevronDown className="h-3 w-3" />
                    </button>
                    {megaMenuOpen && (
                      <div className="absolute top-full left-0 pt-2 z-50">
                        <div className="bg-background border rounded-lg shadow-lg p-4 min-w-[400px] grid grid-cols-2 gap-4">
                          {parentCategories.slice(0, 8).map(cat => (
                            <div key={cat.id}>
                              <Link
                                to={`${basePath}/products?category=${cat.slug}`}
                                className="text-sm font-semibold hover:text-primary transition-colors"
                                onClick={() => setMegaMenuOpen(false)}
                              >
                                {cat.name}
                              </Link>
                              {getChildren(cat.id).length > 0 && (
                                <div className="mt-1 space-y-0.5">
                                  {getChildren(cat.id).slice(0, 5).map(child => (
                                    <Link
                                      key={child.id}
                                      to={`${basePath}/products?category=${child.slug}`}
                                      className="block text-xs text-muted-foreground hover:text-foreground transition-colors"
                                      onClick={() => setMegaMenuOpen(false)}
                                    >
                                      {child.name}
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </nav>
            </div>

            {/* Search + icons */}
            <div className="flex items-center gap-1">
              {/* Currency Switcher */}
              {storeId && <CurrencySwitcher currencies={currencyData.currencies} selectedCode={currencyData.selectedCode} onSwitch={currencyData.switchCurrency} />}
              {/* Desktop search */}
              {storeId && !searchOpen && (
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setSearchOpen(true)}>
                  <Search className="h-5 w-5" />
                </Button>
              )}

              {/* Wishlist */}
              <Link to={user ? `${basePath}/account` : `${basePath}/login`}>
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                  <Heart className="h-5 w-5" />
                  {wishlistItems.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
                      {wishlistItems.length}
                    </span>
                  )}
                </Button>
              </Link>

              <Link to={user ? `${basePath}/account` : `${basePath}/login`}>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
              <Link to={`${basePath}/cart`}>
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                  <ShoppingBag className="h-5 w-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                      {totalItems}
                    </span>
                  )}
                </Button>
              </Link>
            </div>
          </div>

          {/* Search bar (expandable) */}
          {searchOpen && storeId && (
            <div className="relative pb-3">
              <StorefrontSearch storeId={storeId} basePath={basePath} onClose={() => setSearchOpen(false)} />
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-sm mb-3">{storeName || "Store"}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Quality products, great prices, delivered with care.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-sm mb-3">Quick Links</h3>
              <nav className="flex flex-col gap-2">
                <Link to={basePath || "/"} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Home</Link>
                <Link to={`${basePath}/products`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">All Products</Link>
                <Link to={`${basePath}/blog`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</Link>
                <Link to={`${basePath}/contact`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
                <Link to={`${basePath}/cart`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Cart</Link>
                <Link to={`${basePath}/track-order`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Track Order</Link>
                <Link to={`${basePath}/page/terms-and-conditions`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms & Conditions</Link>
                <Link to={`${basePath}/page/privacy-policy`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
              </nav>
            </div>
            <div>
              <h3 className="font-bold text-sm mb-3">Account</h3>
              <nav className="flex flex-col gap-2">
                {user ? (
                  <Link to={`${basePath}/account`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">My Account</Link>
                ) : (
                  <>
                    <Link to={`${basePath}/login`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign In</Link>
                    <Link to={`${basePath}/signup`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Create Account</Link>
                  </>
                )}
              </nav>
              {storeId && (
                <div className="mt-4">
                  <h3 className="font-bold text-sm mb-2">Newsletter</h3>
                  <NewsletterSignup storeId={storeId} />
                </div>
              )}
            </div>
          </div>
          {/* Social Links */}
          {Object.keys(socialLinks).length > 0 && (
            <div className="flex justify-center gap-4 mb-6">
              {socialLinks.facebook && <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Facebook</a>}
              {socialLinks.instagram && <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Instagram</a>}
              {socialLinks.twitter && <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Twitter</a>}
              {socialLinks.youtube && <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">YouTube</a>}
              {socialLinks.tiktok && <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">TikTok</a>}
              {socialLinks.linkedin && <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">LinkedIn</a>}
            </div>
          )}
          <div className="border-t pt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} {storeName || "Store"}. All rights reserved.
          </div>
        </div>
      </footer>

      <CookieConsentBanner />
      <PromoPopup basePath={basePath} storeName={storeName} />
    </div>
  );
}
