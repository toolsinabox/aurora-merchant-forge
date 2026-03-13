import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, ShoppingCart, Mail, MailCheck, CheckCircle2, Clock, DollarSign, AlertTriangle, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function AbandonedCarts() {
  const { currentStore } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: carts = [], isLoading } = useQuery({
    queryKey: ["abandoned_carts", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data, error } = await supabase
        .from("abandoned_carts")
        .select("*, customers(name, email)")
        .eq("store_id", currentStore.id)
        .order("abandoned_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!currentStore,
  });

  const markRecovered = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("abandoned_carts")
        .update({ recovery_status: "recovered", recovered_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["abandoned_carts"] });
      toast.success("Cart marked as recovered");
    },
  });

  const markEmailSent = useMutation({
    mutationFn: async ({ id, couponCode }: { id: string; couponCode?: string }) => {
      // Trigger recovery email via edge function (with optional coupon)
      const { error: fnErr } = await supabase.functions.invoke("abandoned-cart-email", {
        body: { cart_id: id, store_id: currentStore?.id, coupon_code: couponCode || undefined },
      });
      if (fnErr) throw fnErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["abandoned_carts"] });
      toast.success("Recovery email sent");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("abandoned_carts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["abandoned_carts"] });
      toast.success("Cart removed");
    },
  });

  const filtered = carts.filter((c: any) => {
    const matchSearch =
      (c.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.customers?.name || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.recovery_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalValue = carts.reduce((s: number, c: any) => s + Number(c.cart_total || 0), 0);
  const pendingCount = carts.filter((c: any) => c.recovery_status === "pending").length;
  const recoveredCount = carts.filter((c: any) => c.recovery_status === "recovered").length;
  const recoveryRate = carts.length > 0 ? ((recoveredCount / carts.length) * 100).toFixed(1) : "0";

  const statusBadge = (status: string) => {
    switch (status) {
      case "recovered": return <Badge variant="default" className="text-[10px]"><CheckCircle2 className="h-3 w-3 mr-1" />Recovered</Badge>;
      case "email_sent": return <Badge variant="secondary" className="text-[10px]"><MailCheck className="h-3 w-3 mr-1" />Email Sent</Badge>;
      default: return <Badge variant="outline" className="text-[10px]"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div>
          <h1 className="text-lg font-semibold">Abandoned Carts</h1>
          <p className="text-xs text-muted-foreground">{carts.length} abandoned carts tracked</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Card><CardContent className="p-4 flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-primary" />
            <div><p className="text-2xs text-muted-foreground">Total Carts</p><p className="text-lg font-bold">{carts.length}</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-warning" />
            <div><p className="text-2xs text-muted-foreground">Potential Revenue</p><p className="text-lg font-bold">${totalValue.toFixed(2)}</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div><p className="text-2xs text-muted-foreground">Pending Recovery</p><p className="text-lg font-bold">{pendingCount}</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-success" />
            <div><p className="text-2xs text-muted-foreground">Recovery Rate</p><p className="text-lg font-bold">{recoveryRate}%</p></div>
          </CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="flex items-center gap-2 p-3 border-b">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search by email or name..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 pl-8 text-xs" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All</SelectItem>
                  <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                  <SelectItem value="email_sent" className="text-xs">Email Sent</SelectItem>
                  <SelectItem value="recovered" className="text-xs">Recovered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-8">Customer / Email</TableHead>
                  <TableHead className="text-xs h-8">Items</TableHead>
                  <TableHead className="text-xs h-8 text-right">Cart Value</TableHead>
                  <TableHead className="text-xs h-8">Status</TableHead>
                  <TableHead className="text-xs h-8">Abandoned</TableHead>
                  <TableHead className="text-xs h-8 w-28"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-4 w-full" /></TableCell></TableRow>)
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-6">No abandoned carts found.</TableCell></TableRow>
                ) : (
                  filtered.map((c: any) => {
                    const cartItems = Array.isArray(c.cart_items) ? c.cart_items : [];
                    return (
                      <TableRow key={c.id} className="text-xs">
                        <TableCell className="py-2">
                          <div>
                            <p className="font-medium">{c.customers?.name || "Guest"}</p>
                            <p className="text-muted-foreground">{c.email || c.customers?.email || "—"}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">{cartItems.length} items</TableCell>
                        <TableCell className="py-2 text-right font-medium">${Number(c.cart_total).toFixed(2)}</TableCell>
                        <TableCell className="py-2">{statusBadge(c.recovery_status)}</TableCell>
                        <TableCell className="py-2 text-muted-foreground">{format(new Date(c.abandoned_at), "MMM d, HH:mm")}</TableCell>
                        <TableCell className="py-2">
                          <div className="flex gap-1">
                            {c.recovery_status === "pending" && (
                              <Button variant="ghost" size="icon" className="h-6 w-6" title="Mark email sent" onClick={() => markEmailSent.mutate(c.id)}>
                                <Mail className="h-3 w-3" />
                              </Button>
                            )}
                            {c.recovery_status !== "recovered" && (
                              <Button variant="ghost" size="icon" className="h-6 w-6" title="Mark recovered" onClick={() => markRecovered.mutate(c.id)}>
                                <CheckCircle2 className="h-3 w-3" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" title="Delete" onClick={() => deleteMutation.mutate(c.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
