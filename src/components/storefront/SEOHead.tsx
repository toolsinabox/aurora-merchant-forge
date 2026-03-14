import { useEffect } from "react";

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface OrganizationData {
  name: string;
  url?: string;
  logo?: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  socialLinks?: string[];
}

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  price?: number;
  currency?: string;
  canonicalUrl?: string;
  product?: {
    name: string;
    description?: string;
    sku?: string;
    brand?: string;
    image?: string;
    price: number;
    currency: string;
    availability?: "InStock" | "OutOfStock" | "PreOrder";
    ratingValue?: number;
    reviewCount?: number;
    url?: string;
  };
  organization?: OrganizationData;
  breadcrumbs?: BreadcrumbItem[];
}

export function SEOHead({ title, description, image, url, type = "website", price, currency = "USD", canonicalUrl, product }: SEOHeadProps) {
  useEffect(() => {
    if (title) document.title = title;

    const setMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", property);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const setNameMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    if (title) {
      setMeta("og:title", title);
      setNameMeta("twitter:title", title);
    }
    if (description) {
      setMeta("og:description", description);
      setNameMeta("description", description);
      setNameMeta("twitter:description", description);
    }
    if (image) {
      setMeta("og:image", image);
      setNameMeta("twitter:image", image);
      setNameMeta("twitter:card", "summary_large_image");
    }
    if (url) setMeta("og:url", url);
    setMeta("og:type", type);

    // Product-specific meta
    if (price !== undefined) {
      setMeta("product:price:amount", price.toString());
      setMeta("product:price:currency", currency);
    }

    // Canonical URL
    const canonicalHref = canonicalUrl || url;
    if (canonicalHref) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", canonicalHref);
    }

    // JSON-LD Structured Data for Products
    if (product) {
      const jsonLd: Record<string, any> = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        ...(product.description && { description: product.description }),
        ...(product.image && { image: product.image }),
        ...(product.sku && { sku: product.sku }),
        ...(product.brand && { brand: { "@type": "Brand", name: product.brand } }),
        ...(product.url && { url: product.url }),
        offers: {
          "@type": "Offer",
          price: product.price.toFixed(2),
          priceCurrency: product.currency,
          availability: `https://schema.org/${product.availability || "InStock"}`,
        },
      };

      if (product.ratingValue && product.reviewCount && product.reviewCount > 0) {
        jsonLd.aggregateRating = {
          "@type": "AggregateRating",
          ratingValue: product.ratingValue.toFixed(1),
          reviewCount: product.reviewCount,
          bestRating: "5",
          worstRating: "1",
        };
      }

      let script = document.querySelector('script[data-seo="product-jsonld"]') as HTMLScriptElement;
      if (!script) {
        script = document.createElement("script");
        script.type = "application/ld+json";
        script.setAttribute("data-seo", "product-jsonld");
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    }

    return () => {
      document.title = "Store";
      const canonicalLink = document.querySelector('link[rel="canonical"]');
      if (canonicalLink) canonicalLink.remove();
      const jsonLdScript = document.querySelector('script[data-seo="product-jsonld"]');
      if (jsonLdScript) jsonLdScript.remove();
    };
  }, [title, description, image, url, type, price, currency, canonicalUrl, product]);

  return null;
}
