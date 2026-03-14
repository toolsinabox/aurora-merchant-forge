import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCheck, Trash2, AlertTriangle, Info, ShoppingCart, Package, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  order: <ShoppingCart className="h-3.5 w-3.5" />,
  inventory: <Package className="h-3.5 w-3.5" />,
  customer: <Users className="h-3.5 w-3.5" />,
  warning: <AlertTriangle className="h-3.5 w-3.5 text-warning" />,
  info: <Info className="h-3.5 w-3.5 text-primary" />,
};

export default function Notifications() {
  const { currentStore } = useAuth();
  const storeId = currentStore?.id;
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase.from("notifications" as any).select("*")
        .eq("store_id", storeId!).eq("user_id", user.id)
        .order("created_at", { ascending: false }).limit(100);
      return (data || []) as any[];
    },
  });

  const filtered = filter === "unread" ? notifications.filter((n: any) => !n.is_read) : notifications;
  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  const markRead = async (id: string) => {
    await supabase.from("notifications" as any).update({ is_read: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !storeId) return;
    await supabase.from("notifications" as any).update({ is_read: true }).eq("store_id", storeId).eq("user_id", user.id).eq("is_read", false);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  const deleteNotification = async (id: string) => {
    await supabase.from("notifications" as any).delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold flex items-center gap-2">
              Notifications
              {unreadCount > 0 && <Badge variant="destructive" className="text-[10px]">{unreadCount} unread</Badge>}
            </h1>
            <p className="text-xs text-muted-foreground">System alerts, order updates, and inventory warnings</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => setFilter(f => f === "all" ? "unread" : "all")}>
              {filter === "all" ? "Show Unread" : "Show All"}
            </Button>
            {unreadCount > 0 && (
              <Button size="sm" className="text-xs h-8 gap-1" onClick={markAllRead}>
                <CheckCheck className="h-3.5 w-3.5" /> Mark All Read
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-bold">{notifications.length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Unread</p><p className="text-xl font-bold text-destructive">{unreadCount}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Today</p><p className="text-xl font-bold">{notifications.filter((n: any) => new Date(n.created_at).toDateString() === new Date().toDateString()).length}</p></CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-8 w-8"></TableHead>
                  <TableHead className="text-xs h-8">Notification</TableHead>
                  <TableHead className="text-xs h-8">Type</TableHead>
                  <TableHead className="text-xs h-8">Time</TableHead>
                  <TableHead className="text-xs h-8 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
                )) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">
                    <Bell className="h-6 w-6 mx-auto mb-1 text-muted-foreground/40" />
                    {filter === "unread" ? "No unread notifications" : "No notifications yet"}
                  </TableCell></TableRow>
                ) : filtered.map((n: any) => (
                  <TableRow key={n.id} className={`text-xs ${!n.is_read ? "bg-primary/5" : ""}`}>
                    <TableCell className="py-1.5">{TYPE_ICONS[n.type] || TYPE_ICONS.info}</TableCell>
                    <TableCell className="py-1.5">
                      <div className={`font-medium ${!n.is_read ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</div>
                      {n.message && <div className="text-muted-foreground mt-0.5">{n.message}</div>}
                    </TableCell>
                    <TableCell className="py-1.5"><Badge variant="outline" className="text-[10px] capitalize">{n.type}</Badge></TableCell>
                    <TableCell className="py-1.5 text-muted-foreground">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</TableCell>
                    <TableCell className="py-1.5 text-right">
                      {!n.is_read && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => markRead(n.id)}><Check className="h-3 w-3" /></Button>}
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteNotification(n.id)}><Trash2 className="h-3 w-3" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
