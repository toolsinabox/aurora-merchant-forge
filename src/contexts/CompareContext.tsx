import { createContext, useContext, useState, ReactNode } from "react";

interface CompareItem {
  id: string;
  title: string;
  price: number;
  compare_at_price?: number | null;
  images?: string[];
  description?: string;
  sku?: string;
}

interface CompareContextType {
  items: CompareItem[];
  addItem: (item: CompareItem) => void;
  removeItem: (id: string) => void;
  isComparing: (id: string) => boolean;
  clearAll: () => void;
}

const CompareContext = createContext<CompareContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  isComparing: () => false,
  clearAll: () => {},
});

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([]);

  const addItem = (item: CompareItem) => {
    setItems((prev) => {
      if (prev.length >= 4) return prev;
      if (prev.find((i) => i.id === item.id)) return prev;
      return [...prev, item];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const isComparing = (id: string) => items.some((i) => i.id === id);

  const clearAll = () => setItems([]);

  return (
    <CompareContext.Provider value={{ items, addItem, removeItem, isComparing, clearAll }}>
      {children}
    </CompareContext.Provider>
  );
}

export const useCompare = () => useContext(CompareContext);
