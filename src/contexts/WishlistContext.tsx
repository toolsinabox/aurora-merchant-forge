import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface WishlistContextType {
  items: string[]; // product IDs
  toggleItem: (productId: string, storeId: string) => void;
  isWishlisted: (productId: string) => boolean;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType>({
  items: [],
  toggleItem: () => {},
  isWishlisted: () => false,
  loading: false,
});

const LOCAL_KEY = "storefront_wishlist";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]"); }
    catch { return []; }
  });
  const [loading, setLoading] = useState(false);

  // Sync from DB when user logs in
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from("wishlists")
      .select("product_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) {
          const ids = data.map((w: any) => w.product_id);
          setItems(ids);
          localStorage.setItem(LOCAL_KEY, JSON.stringify(ids));
        }
        setLoading(false);
      });
  }, [user]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
  }, [items]);

  const toggleItem = useCallback(async (productId: string, storeId: string) => {
    const exists = items.includes(productId);

    if (exists) {
      setItems((prev) => prev.filter((id) => id !== productId));
      if (user) {
        await supabase.from("wishlists").delete().eq("user_id", user.id).eq("product_id", productId);
      }
      toast.success("Removed from wishlist");
    } else {
      setItems((prev) => [...prev, productId]);
      if (user) {
        await supabase.from("wishlists").insert({
          user_id: user.id,
          store_id: storeId,
          product_id: productId,
        } as any);
      }
      toast.success("Added to wishlist");
    }
  }, [items, user]);

  const isWishlisted = useCallback((productId: string) => items.includes(productId), [items]);

  return (
    <WishlistContext.Provider value={{ items, toggleItem, isWishlisted, loading }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
