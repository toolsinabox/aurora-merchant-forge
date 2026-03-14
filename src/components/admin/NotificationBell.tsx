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
  type: "order" | "customer" | "review";
  title: string;
  detail: string;
  created_at: string;
  read: boolean;
  link: string;
}

export function NotificationBell() {
  const { currentStore } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load recent orders as initial notifications
  useEffect(() => {
    if (!currentStore) return;
    supabase
      .from("orders")
      .select("id, order_number, total, created_at")
      .eq("store_id", currentStore.id)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) {
          const notifs = data.map((o) => ({ ...o, read: true }));
          setNotifications(notifs);
        }
      });
  }, [currentStore]);

  // Listen for realtime new orders
  useEffect(() => {
    if (!currentStore) return;

    const channel = supabase
      .channel(`orders-${currentStore.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `store_id=eq.${currentStore.id}`,
        },
        (payload) => {
          const newOrder = payload.new as any;
          const notif: OrderNotification = {
            id: newOrder.id,
            order_number: newOrder.order_number,
            total: newOrder.total,
            created_at: newOrder.created_at,
            read: false,
          };
          setNotifications((prev) => [notif, ...prev.slice(0, 19)]);
          setUnreadCount((c) => c + 1);
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
        <DropdownMenuLabel className="text-xs">Order Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">No notifications yet</div>
        ) : (
          notifications.slice(0, 8).map((n) => (
            <DropdownMenuItem
              key={n.id}
              className="flex items-start gap-3 py-2.5 cursor-pointer"
              onClick={() => navigate(`/orders/${n.id}`)}
            >
              <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${n.read ? "bg-transparent" : "bg-primary"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">New order {n.order_number}</p>
                <p className="text-2xs text-muted-foreground">
                  ${Number(n.total).toFixed(2)} · {format(new Date(n.created_at), "MMM d, h:mm a")}
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
