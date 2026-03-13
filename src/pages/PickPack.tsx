import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useOrders } from "@/hooks/use-data";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Package, CheckCircle, Truck, Search, ArrowRight } from "lucide-react";

type WorkflowStep = "pick" | "pack" | "ship";

export default function PickPack() {
  const { currentStore } = useAuth();
  const { data: orders = [], isLoading } = useOrders();
  const qc = useQueryClient();
  const [step, setStep] = useState<WorkflowStep>("pick");
  const [search, setSearch] = useState("");
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Get order items for unfulfilled orders
  const pendingOrders = useMemo(() =>
    orders.filter((o: any) =>
      o.fulfillment_status === "unfulfilled" && o.status !== "cancelled"
    ).filter((o: any) =>
      !search || o.order_number?.toLowerCase().includes(search.toLowerCase())
    ), [orders, search]);

  const processingOrders = useMemo(() =>
    orders.filter((o: any) => o.status === "processing")
      .filter((o: any) => !search || o.order_number?.toLowerCase().includes(search.toLowerCase())),
    [orders, search]);

  const { data: orderItems = [] } = useQuery({
    queryKey: ["pick-pack-items", currentStore?.id],
    enabled: !!currentStore,
    queryFn: async () => {
      const { data } = await supabase
        .from("order_items")
        .select("*, orders:order_id(order_number, fulfillment_status, status)")
        .eq("store_id", currentStore!.id);
      return data || [];
    },
  });

  const pickItems = useMemo(() => {
    const unfulfilledOrderIds = new Set(pendingOrders.map((o: any) => o.id));
    return orderItems.filter((item: any) => unfulfilledOrderIds.has(item.order_id));
  }, [orderItems, pendingOrders]);

  const toggleItem = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const checkedCount = Object.values(checkedItems).filter(Boolean).length;

  const markAsPacked = async () => {
    const orderIds = [...new Set(pickItems.filter((item: any) => checkedItems[item.id]).map((item: any) => item.order_id))];
    for (const orderId of orderIds) {
      await supabase.from("orders").update({ status: "processing" } as any).eq("id", orderId);
    }
    toast.success(`${orderIds.length} order(s) moved to packing`);
    setCheckedItems({});
    qc.invalidateQueries({ queryKey: ["orders"] });
    setStep("pack");
  };

  const markAsShipped = async (orderId: string) => {
    await supabase.from("orders").update({ fulfillment_status: "fulfilled", status: "shipped" } as any).eq("id", orderId);
    toast.success("Order marked as shipped");
    qc.invalidateQueries({ queryKey: ["orders"] });
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-semibold">Pick & Pack</h1>
          <p className="text-xs text-muted-foreground">Guided workflow: Pick → Pack → Ship</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {(["pick", "pack", "ship"] as WorkflowStep[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
              <Button
                variant={step === s ? "default" : "outline"}
                size="sm"
                className="text-xs capitalize"
                onClick={() => setStep(s)}
              >
                {s === "pick" && <Package className="h-3 w-3 mr-1" />}
                {s === "pack" && <CheckCircle className="h-3 w-3 mr-1" />}
                {s === "ship" && <Truck className="h-3 w-3 mr-1" />}
                {s}
                <Badge variant="secondary" className="ml-1.5 text-[10px]">
                  {s === "pick" ? pendingOrders.length : s === "pack" ? processingOrders.length : 0}
                </Badge>
              </Button>
            </div>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search by order number..." value={search}
            onChange={e => setSearch(e.target.value)} className="pl-8 h-9 text-sm" />
        </div>

        {/* Pick Step */}
        {step === "pick" && (
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                Pick Items ({pickItems.length} items from {pendingOrders.length} orders)
                {checkedCount > 0 && (
                  <Button size="sm" className="text-xs" onClick={markAsPacked}>
                    Mark {checkedCount} Picked → Pack
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs h-8 w-8"></TableHead>
                    <TableHead className="text-xs h-8">Order</TableHead>
                    <TableHead className="text-xs h-8">Product</TableHead>
                    <TableHead className="text-xs h-8">SKU</TableHead>
                    <TableHead className="text-xs h-8 text-right">Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
                    ))
                  ) : pickItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">
                        No items to pick
                      </TableCell>
                    </TableRow>
                  ) : (
                    pickItems.map((item: any) => (
                      <TableRow key={item.id} className={`text-xs ${checkedItems[item.id] ? "bg-primary/5" : ""}`}>
                        <TableCell className="py-1.5">
                          <Checkbox checked={!!checkedItems[item.id]} onCheckedChange={() => toggleItem(item.id)} />
                        </TableCell>
                        <TableCell className="py-1.5 font-mono">{(item.orders as any)?.order_number || "—"}</TableCell>
                        <TableCell className="py-1.5 font-medium max-w-[200px] truncate">{item.title}</TableCell>
                        <TableCell className="py-1.5 font-mono text-muted-foreground">{item.sku || "—"}</TableCell>
                        <TableCell className="py-1.5 text-right font-semibold">{item.quantity}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Pack Step */}
        {step === "pack" && (
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm">Pack Orders ({processingOrders.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs h-8">Order #</TableHead>
                    <TableHead className="text-xs h-8">Items</TableHead>
                    <TableHead className="text-xs h-8">Total</TableHead>
                    <TableHead className="text-xs h-8 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processingOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-8">
                        No orders to pack
                      </TableCell>
                    </TableRow>
                  ) : (
                    processingOrders.map((o: any) => (
                      <TableRow key={o.id} className="text-xs">
                        <TableCell className="py-1.5 font-mono">{o.order_number}</TableCell>
                        <TableCell className="py-1.5">{o.items_count} items</TableCell>
                        <TableCell className="py-1.5">${Number(o.total).toFixed(2)}</TableCell>
                        <TableCell className="py-1.5 text-right">
                          <Button size="sm" variant="outline" className="text-xs h-6" onClick={() => markAsShipped(o.id)}>
                            <Truck className="h-3 w-3 mr-1" /> Ship
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Ship Step */}
        {step === "ship" && (
          <Card>
            <CardContent className="p-8 text-center">
              <Truck className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Manage shipments from individual order detail pages. Use the Pack step to mark orders as shipped.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
