import { useEffect } from "react";

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  price?: number;
  currency?: string;
}

export function SEOHead({ title, description, image, url, type = "website", price, currency = "USD" }: SEOHeadProps) {
  useEffect(() => {
    // Set document title
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

    return () => {
      // Cleanup on unmount
      document.title = "Store";
    };
  }, [title, description, image, url, type, price, currency]);

  return null;
}
