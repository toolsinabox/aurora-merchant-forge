import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { StorefrontLayout } from "@/components/storefront/StorefrontLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Package, User } from "lucide-react";
import { toast } from "sonner";

export default function StorefrontAccount() {
  const { storeSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const base = `/store/${storeSlug}`;
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate(`${base}/login`);
      return;
    }

    async function load() {
      // Get customer record for this user
      const { data: custs } = await supabase
        .from("customers")
        .select("*")
        .eq("user_id", user!.id)
        .limit(1);

      const cust = custs?.[0];
      setCustomer(cust);

      if (cust) {
        const { data: ords } = await supabase
          .from("orders")
          .select("*")
          .eq("customer_id", cust.id)
          .order("created_at", { ascending: false });
        setOrders(ords || []);
      }
      setLoading(false);
    }
    load();
  }, [user, base, navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate(base);
  };

  if (!user) return null;

  return (
    <StorefrontLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My Account</h1>
          <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-2">
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4" /> Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {loading ? (
                <><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-48" /></>
              ) : (
                <>
                  <p className="font-medium">{customer?.name || user.email}</p>
                  <p className="text-muted-foreground">{user.email}</p>
                  {customer?.phone && <p className="text-muted-foreground">{customer.phone}</p>}
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground">Total Orders: {customer?.total_orders || 0}</p>
                    <p className="text-xs text-muted-foreground">Total Spent: ${Number(customer?.total_spent || 0).toFixed(2)}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Orders */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><Package className="h-4 w-4" /> Order History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                </div>
              ) : orders.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-muted-foreground text-sm mb-3">No orders yet.</p>
                  <Link to={`${base}/products`}>
                    <Button size="sm">Start Shopping</Button>
                  </Link>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Order</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Payment</TableHead>
                      <TableHead className="text-xs text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((o) => (
                      <TableRow key={o.id} className="text-sm">
                        <TableCell className="font-medium">{o.order_number}</TableCell>
                        <TableCell className="text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</TableCell>
                        <TableCell><StatusBadge status={o.status} /></TableCell>
                        <TableCell><StatusBadge status={o.payment_status} /></TableCell>
                        <TableCell className="text-right font-medium">${Number(o.total).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </StorefrontLayout>
  );
}
