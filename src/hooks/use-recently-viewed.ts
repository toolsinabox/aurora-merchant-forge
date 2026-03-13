import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "recently_viewed_products";
const MAX_ITEMS = 12;

interface RecentProduct {
  id: string;
  title: string;
  price: number;
  image?: string;
  viewedAt: number;
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentProduct[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {}
  }, []);

  const addProduct = useCallback((product: { id: string; title: string; price: number; images?: string[] }) => {
    setItems((prev) => {
      const filtered = prev.filter((p) => p.id !== product.id);
      const next = [
        { id: product.id, title: product.title, price: product.price, image: product.images?.[0], viewedAt: Date.now() },
        ...filtered,
      ].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const getRecent = useCallback((excludeId?: string, limit = 6) => {
    return items.filter((p) => p.id !== excludeId).slice(0, limit);
  }, [items]);

  return { items, addProduct, getRecent };
}
