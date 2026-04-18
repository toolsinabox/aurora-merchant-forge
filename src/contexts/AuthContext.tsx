import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface StoreContext {
  id: string;
  name: string;
  slug: string | null;
  currency: string;
  timezone: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  currentStore: StoreContext | null;
  setCurrentStore: (store: StoreContext | null) => void;
  availableStores: StoreContext[];
  switchStore: (storeId: string) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  currentStore: null,
  setCurrentStore: () => {},
  availableStores: [],
  switchStore: () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [storesLoading, setStoresLoading] = useState(false);
  const [currentStore, setCurrentStore] = useState<StoreContext | null>(null);
  const [availableStores, setAvailableStores] = useState<StoreContext[]>([]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load all stores the user has access to
  useEffect(() => {
    if (!session?.user) {
      setCurrentStore(null);
      setAvailableStores([]);
      setStoresLoading(false);
      return;
    }

    let cancelled = false;

    const loadStores = async () => {
      setStoresLoading(true);

      const savedStoreId = localStorage.getItem("currentStoreId");
      const { data: storeIds } = await supabase.rpc("get_user_store_ids", { _user_id: session.user.id });

      const storesQuery = storeIds && storeIds.length > 0
        ? supabase
            .from("stores")
            .select("id, name, slug, currency, timezone")
            .in("id", storeIds)
            .order("name")
        : supabase
            .from("stores")
            .select("id, name, slug, currency, timezone")
            .limit(10)
            .order("name");

      const { data: stores } = await storesQuery;

      if (cancelled) return;

      if (stores && stores.length > 0) {
        setAvailableStores(stores);
        setCurrentStore((prev) => {
          const persistedStore = savedStoreId ? stores.find((store) => store.id === savedStoreId) : null;
          if (prev && stores.some((store) => store.id === prev.id)) {
            return prev;
          }
          return persistedStore || stores[0];
        });
      } else {
        setAvailableStores([]);
        setCurrentStore(null);
      }

      setStoresLoading(false);
    };

    void loadStores();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const switchStore = (storeId: string) => {
    const store = availableStores.find(s => s.id === storeId);
    if (store) {
      setCurrentStore(store);
      localStorage.setItem("currentStoreId", storeId);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setCurrentStore(null);
    setAvailableStores([]);
    localStorage.removeItem("currentStoreId");
  };

  return (
      <AuthContext.Provider value={{ session, user: session?.user ?? null, loading: loading || storesLoading, currentStore, setCurrentStore, availableStores, switchStore, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
