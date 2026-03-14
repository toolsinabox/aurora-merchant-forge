import { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface Notification {
  id: string;
  type: "order" | "customer" | "review" | "stock";
  title: string;
  detail: string;
  created_at: string;
  read: boolean;
  link: string;
}

// Simple beep for new order alerts
function playOrderAlert() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.value = 0.15;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.stop(ctx.currentTime + 0.3);
  } catch {}
}

export function NotificationBell() {
  const { currentStore } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load recent orders as initial notifications
  useEffect(() => {
    if (!currentStore) return;
    supabase
      .from("orders")
      .select("id, order_number, total, created_at")
      .eq("store_id", currentStore.id)
      .order("created_at", { ascending: false })
      .limit(8)
      .then(({ data }) => {
        if (data) {
          const notifs: Notification[] = data.map((o) => ({
            id: o.id, type: "order" as const,
            title: `New order ${o.order_number}`,
            detail: `$${Number(o.total).toFixed(2)}`,
            created_at: o.created_at, read: true,
            link: `/orders/${o.id}`,
          }));
          setNotifications(notifs);
        }
      });
  }, [currentStore]);

  // Listen for realtime new orders, customers, and reviews
  useEffect(() => {
    if (!currentStore) return;

    const channel = supabase
      .channel(`notifications-${currentStore.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders", filter: `store_id=eq.${currentStore.id}` },
        (payload) => {
          const n = payload.new as any;
          const notif: Notification = {
            id: n.id, type: "order",
            title: `🛒 New order ${n.order_number}`,
            detail: `$${Number(n.total).toFixed(2)}`,
            created_at: n.created_at, read: false,
            link: `/orders/${n.id}`,
          };
          setNotifications((prev) => [notif, ...prev.slice(0, 19)]);
          setUnreadCount((c) => c + 1);
          playOrderAlert();
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "customers", filter: `store_id=eq.${currentStore.id}` },
        (payload) => {
          const n = payload.new as any;
          const notif: Notification = {
            id: n.id, type: "customer",
            title: `New customer signup`,
            detail: n.name || n.email || "Unknown",
            created_at: n.created_at, read: false,
            link: `/customers/${n.id}`,
          };
          setNotifications((prev) => [notif, ...prev.slice(0, 19)]);
          setUnreadCount((c) => c + 1);
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "product_reviews", filter: `store_id=eq.${currentStore.id}` },
        (payload) => {
          const n = payload.new as any;
          const notif: Notification = {
            id: n.id, type: "review",
            title: `New review submitted`,
            detail: `${n.rating}★ — ${(n.title || "").slice(0, 30)}`,
            created_at: n.created_at, read: false,
            link: `/reviews`,
          };
          setNotifications((prev) => [notif, ...prev.slice(0, 19)]);
          setUnreadCount((c) => c + 1);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "inventory_stock", filter: `store_id=eq.${currentStore.id}` },
        (payload) => {
          const n = payload.new as any;
          if (n.quantity <= 0) {
            const notif: Notification = {
              id: `stock-${n.id}-${Date.now()}`, type: "stock",
              title: `⚠️ Out of stock alert`,
              detail: `Product stock reached 0`,
              created_at: new Date().toISOString(), read: false,
              link: `/inventory`,
            };
            setNotifications((prev) => [notif, ...prev.slice(0, 19)]);
            setUnreadCount((c) => c + 1);
          } else if (n.quantity <= n.low_stock_threshold) {
            const notif: Notification = {
              id: `lowstock-${n.id}-${Date.now()}`, type: "stock",
              title: `📦 Low stock warning`,
              detail: `${n.quantity} units remaining`,
              created_at: new Date().toISOString(), read: false,
              link: `/inventory`,
            };
            setNotifications((prev) => [notif, ...prev.slice(0, 19)]);
            setUnreadCount((c) => c + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentStore]);

  const handleOpen = useCallback(() => {
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  return (
    <DropdownMenu onOpenChange={(open) => open && handleOpen()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 flex items-center justify-center text-2xs bg-destructive text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="text-xs">Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">No notifications yet</div>
        ) : (
          notifications.slice(0, 10).map((n) => (
            <DropdownMenuItem
              key={n.id}
              className="flex items-start gap-3 py-2.5 cursor-pointer"
              onClick={() => navigate(n.link)}
            >
              <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${n.read ? "bg-transparent" : "bg-primary"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{n.title}</p>
                <p className="text-2xs text-muted-foreground">
                  {n.detail} · {format(new Date(n.created_at), "MMM d, h:mm a")}
                </p>
              </div>
            </DropdownMenuItem>
          ))
        )}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs text-center justify-center text-primary" onClick={() => navigate("/orders")}>
              View all orders
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
