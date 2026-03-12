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
import { LogOut, Package, User, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStoreSlug } from "@/lib/subdomain";

const RETURN_REASONS = [
  "Defective / damaged item",
  "Wrong item received",
  "Item not as described",
  "Changed my mind",
  "Other",
];

export default function StorefrontAccount() {
  const { storeSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const base = `/store/${storeSlug}`;
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Return request dialog
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnOrderId, setReturnOrderId] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [returnNotes, setReturnNotes] = useState("");
  const [submittingReturn, setSubmittingReturn] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate(`${base}/login`);
      return;
    }

    async function load() {
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

        const { data: rets } = await supabase
          .from("returns" as any)
          .select("*, orders(order_number)")
          .eq("customer_id", cust.id)
          .order("created_at", { ascending: false });
        setReturns(rets || []);
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

  const handleReturnRequest = async () => {
    if (!returnOrderId || !returnReason) {
      toast.error("Please select an order and reason");
      return;
    }
    if (!customer) return;

    const order = orders.find((o) => o.id === returnOrderId);
    if (!order) return;

    setSubmittingReturn(true);
    try {
      const { error } = await supabase.from("returns" as any).insert({
        store_id: order.store_id,
        order_id: order.id,
        customer_id: customer.id,
        reason: returnReason,
        notes: returnNotes || null,
        refund_amount: Number(order.total),
      });
      if (error) throw error;

      toast.success("Return request submitted");
      setReturnDialogOpen(false);
      setReturnOrderId("");
      setReturnReason("");
      setReturnNotes("");

      // Reload returns
      const { data: rets } = await supabase
        .from("returns" as any)
        .select("*, orders(order_number)")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false });
      setReturns(rets || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit return request");
    } finally {
      setSubmittingReturn(false);
    }
  };

  if (!user) return null;

  // Orders eligible for returns (delivered/shipped, no existing return)
  const returnOrderIds = new Set(returns.map((r: any) => r.order_id));
  const eligibleOrders = orders.filter(
    (o) => ["delivered", "shipped"].includes(o.status) && !returnOrderIds.has(o.id)
  );

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

          {/* Orders + Returns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Orders */}
            <Card>
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

            {/* Returns */}
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2"><RotateCcw className="h-4 w-4" /> Returns</CardTitle>
                {eligibleOrders.length > 0 && (
                  <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="text-xs h-7">
                        Request Return
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-base">Request a Return</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Order</Label>
                          <Select value={returnOrderId} onValueChange={setReturnOrderId}>
                            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select order" /></SelectTrigger>
                            <SelectContent>
                              {eligibleOrders.map((o) => (
                                <SelectItem key={o.id} value={o.id} className="text-sm">
                                  {o.order_number} — ${Number(o.total).toFixed(2)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Reason</Label>
                          <Select value={returnReason} onValueChange={setReturnReason}>
                            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select reason" /></SelectTrigger>
                            <SelectContent>
                              {RETURN_REASONS.map((r) => (
                                <SelectItem key={r} value={r} className="text-sm">{r}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Additional Notes</Label>
                          <Textarea
                            value={returnNotes}
                            onChange={(e) => setReturnNotes(e.target.value)}
                            placeholder="Describe the issue..."
                            className="min-h-[60px] text-sm"
                          />
                        </div>
                        <Button
                          className="w-full"
                          disabled={submittingReturn || !returnOrderId || !returnReason}
                          onClick={handleReturnRequest}
                        >
                          {submittingReturn ? "Submitting..." : "Submit Return Request"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-4 space-y-2">
                    {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                  </div>
                ) : returns.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-muted-foreground text-sm">No return requests.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Order</TableHead>
                        <TableHead className="text-xs">Reason</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs text-right">Refund</TableHead>
                        <TableHead className="text-xs">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {returns.map((r: any) => (
                        <TableRow key={r.id} className="text-sm">
                          <TableCell className="font-medium">{r.orders?.order_number || "—"}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{r.reason}</TableCell>
                          <TableCell><StatusBadge status={r.status} /></TableCell>
                          <TableCell className="text-right font-medium">${Number(r.refund_amount).toFixed(2)}</TableCell>
                          <TableCell className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
}
