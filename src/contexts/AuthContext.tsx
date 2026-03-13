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
    if (session?.user) {
      // Get all store IDs user has roles for
      supabase
        .rpc("get_user_store_ids", { _user_id: session.user.id })
        .then(({ data: storeIds }) => {
          if (storeIds && storeIds.length > 0) {
            supabase
              .from("stores")
              .select("id, name, slug, currency, timezone")
              .in("id", storeIds)
              .order("name")
              .then(({ data: stores }) => {
                if (stores && stores.length > 0) {
                  setAvailableStores(stores);
                  // Set first store or restore from localStorage
                  const savedStoreId = localStorage.getItem("currentStoreId");
                  const savedStore = savedStoreId ? stores.find(s => s.id === savedStoreId) : null;
                  if (!currentStore) {
                    setCurrentStore(savedStore || stores[0]);
                  }
                }
              });
          } else {
            // Fallback: try loading any store (for owners)
            supabase
              .from("stores")
              .select("id, name, slug, currency, timezone")
              .limit(10)
              .then(({ data: stores }) => {
                if (stores && stores.length > 0) {
                  setAvailableStores(stores);
                  if (!currentStore) setCurrentStore(stores[0]);
                }
              });
          }
        });
    }
    if (!session) {
      setCurrentStore(null);
      setAvailableStores([]);
    }
  }, [session]);

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
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, currentStore, setCurrentStore, availableStores, switchStore, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
