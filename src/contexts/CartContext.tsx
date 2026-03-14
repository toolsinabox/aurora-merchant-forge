import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

export interface CartItem {
  product_id: string;
  variant_id?: string | null;
  title: string;
  variant_name?: string;
  price: number;
  quantity: number;
  image?: string;
  sku?: string;
}

interface CartContextType {
  items: CartItem[];
  savedItems: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (product_id: string, variant_id?: string | null) => void;
  updateQuantity: (product_id: string, variant_id: string | null | undefined, quantity: number) => void;
  clearCart: () => void;
  saveForLater: (product_id: string, variant_id?: string | null) => void;
  moveToCart: (product_id: string, variant_id?: string | null) => void;
  removeSaved: (product_id: string, variant_id?: string | null) => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType>({
  items: [], savedItems: [], addItem: () => {}, removeItem: () => {},
  updateQuantity: () => {}, clearCart: () => {},
  saveForLater: () => {}, moveToCart: () => {}, removeSaved: () => {},
  totalItems: 0, totalPrice: 0,
});

const CART_KEY = "storefront_cart";
const SAVED_KEY = "storefront_saved";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.product_id === item.product_id && i.variant_id === item.variant_id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + (item.quantity || 1) };
        return updated;
      }
      return [...prev, { ...item, quantity: item.quantity || 1 }];
    });
  }, []);

  const removeItem = useCallback((product_id: string, variant_id?: string | null) => {
    setItems((prev) => prev.filter((i) => !(i.product_id === product_id && i.variant_id === variant_id)));
  }, []);

  const updateQuantity = useCallback((product_id: string, variant_id: string | null | undefined, quantity: number) => {
    if (quantity <= 0) { removeItem(product_id, variant_id); return; }
    setItems((prev) => prev.map((i) =>
      i.product_id === product_id && i.variant_id === variant_id ? { ...i, quantity } : i
    ));
  }, [removeItem]);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
