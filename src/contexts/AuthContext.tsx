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
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  currentStore: null,
  setCurrentStore: () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStore, setCurrentStore] = useState<StoreContext | null>(null);

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

  // Load user's first store when logged in
  useEffect(() => {
    if (session?.user && !currentStore) {
      supabase
        .from("stores")
        .select("id, name, slug, currency, timezone")
        .limit(1)
        .single()
        .then(({ data }) => {
          if (data) setCurrentStore(data);
        });
    }
    if (!session) {
      setCurrentStore(null);
    }
  }, [session]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setCurrentStore(null);
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, currentStore, setCurrentStore, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
