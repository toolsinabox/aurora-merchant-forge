import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, MapPin } from "lucide-react";

interface SocialProofProps {
  storeId: string;
}

const CITIES = ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Auckland", "London", "New York", "Toronto", "Berlin"];
const INTERVALS = [15000, 25000, 35000, 20000]; // stagger intervals

export function SocialProofNotifications({ storeId }: SocialProofProps) {
  const [notification, setNotification] = useState<{ name: string; product: string; city: string } | null>(null);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const indexRef = useRef(0);
  const productsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!storeId) return;
    // Fetch recent order product names
    const load = async () => {
      const { data } = await supabase
        .from("order_items")
        .select("product_title")
        .order("created_at", { ascending: false })
        .limit(20);
      if (data && data.length > 0) {
        productsRef.current = [...new Set(data.map((d: any) => d.product_title).filter(Boolean))];
      }
    };
    load();
  }, [storeId]);

  useEffect(() => {
    const show = () => {
      if (productsRef.current.length === 0) return;
      const product = productsRef.current[indexRef.current % productsRef.current.length];
      const city = CITIES[Math.floor(Math.random() * CITIES.length)];
      const firstNames = ["Sarah", "James", "Emma", "Liam", "Olivia", "Noah", "Ava", "Lucas", "Mia", "Ethan"];
      const name = firstNames[Math.floor(Math.random() * firstNames.length)];
      setNotification({ name, product, city });
      setVisible(true);
      indexRef.current++;

      setTimeout(() => setVisible(false), 5000);
      timerRef.current = setTimeout(show, INTERVALS[indexRef.current % INTERVALS.length]);
    };

    // Start after initial delay
    timerRef.current = setTimeout(show, 8000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  if (!notification || !visible) return null;

  return (
    <div className="fixed bottom-20 left-4 z-40 animate-in slide-in-from-left-5 fade-in duration-500 motion-reduce:animate-none">
      <div className="bg-card border rounded-lg shadow-lg p-3 max-w-[280px] flex items-start gap-2.5">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <ShoppingBag className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium truncate">{notification.name} purchased</p>
          <p className="text-xs text-muted-foreground truncate">{notification.product}</p>
          <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
            <MapPin className="h-2.5 w-2.5" /> {notification.city} · Just now
          </p>
        </div>
      </div>
    </div>
  );
}
