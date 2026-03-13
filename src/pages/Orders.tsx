import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { useOrders } from "@/hooks/use-data";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Download, Copy, CheckSquare, Printer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateOrderDialog } from "@/components/orders/CreateOrderDialog";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

function downloadCSV(data: any[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map((row) =>
      headers.map((h) => {
        const val = row[h];
        const str = val === null || val === undefined ? "" : String(val);
        return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(",")
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function Orders() {
  const { data: orders = [], isLoading } = useOrders();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const filtered = orders.filter((o: any) => {
    const matchSearch = o.order_number.includes(search) || (o.customers?.name || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((o: any) => o.id)));
    }
  };

  const handleBulkUpdate = async () => {
    if (!bulkStatus || selected.size === 0) return;
    setBulkProcessing(true);
    try {
      const ids = Array.from(selected);
      const { error } = await supabase
        .from("orders")
        .update({ status: bulkStatus } as any)
        .in("id", ids);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success(`Updated ${ids.length} orders to "${bulkStatus}"`);
      setSelected(new Set());
      setBulkStatus("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleDuplicate = async (order: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const orderNum = `ORD-${Date.now().toString(36).toUpperCase()}`;
      const { data: newOrder, error } = await supabase
        .from("orders")
        .insert({
          store_id: order.store_id,
          order_number: orderNum,
          customer_id: order.customer_id,
          items_count: order.items_count,
          subtotal: order.subtotal,
          discount: 0,
          shipping: order.shipping,
          tax: order.tax,
          total: order.subtotal + order.shipping + order.tax,
          status: "pending",
          payment_status: "pending",
          fulfillment_status: "unfulfilled",
          notes: `Duplicated from ${order.order_number}`,
          shipping_address: order.shipping_address,
        } as any)
        .select()
        .single();
      if (error) throw error;

      // Copy order items
      const { data: items } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", order.id);

      if (items && items.length > 0) {
        const newItems = items.map((item: any) => ({
          order_id: newOrder.id,
          store_id: item.store_id,
          product_id: item.product_id,
          variant_id: item.variant_id,
          title: item.title,
          sku: item.sku,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
        }));
        await supabase.from("order_items").insert(newItems);
      }

      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success(`Order duplicated as ${orderNum}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleExport = () => {
    const data = filtered.map((o: any) => ({
      order_number: o.order_number,
      customer: o.customers?.name || "",
      email: o.customers?.email || "",
      status: o.status,
      payment_status: o.payment_status,
      fulfillment_status: o.fulfillment_status,
      items_count: o.items_count,
      subtotal: o.subtotal,
      discount: o.discount,
      shipping: o.shipping,
      tax: o.tax,
      total: o.total,
      date: o.created_at,
    }));
    downloadCSV(data, `orders-${new Date().toISOString().split("T")[0]}.csv`);
    toast.success(`Exported ${data.length} orders`);
  };

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Orders</h1>
            <p className="text-xs text-muted-foreground">{orders.length} total orders</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
            <CreateOrderDialog />
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selected.size > 0 && (
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <CheckSquare className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium">{selected.size} selected</span>
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger className="h-7 w-36 text-xs"><SelectValue placeholder="Set status..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                  <SelectItem value="processing" className="text-xs">Processing</SelectItem>
                  <SelectItem value="shipped" className="text-xs">Shipped</SelectItem>
                  <SelectItem value="delivered" className="text-xs">Delivered</SelectItem>
                  <SelectItem value="cancelled" className="text-xs">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" className="h-7 text-xs" onClick={handleBulkUpdate} disabled={!bulkStatus || bulkProcessing}>
                {bulkProcessing ? "Updating..." : "Apply"}
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelected(new Set())}>Clear</Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-0">
            <div className="flex items-center gap-2 p-3 border-b">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 pl-8 text-xs" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All</SelectItem>
                  <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                  <SelectItem value="processing" className="text-xs">Processing</SelectItem>
                  <SelectItem value="shipped" className="text-xs">Shipped</SelectItem>
                  <SelectItem value="delivered" className="text-xs">Delivered</SelectItem>
                  <SelectItem value="cancelled" className="text-xs">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-8 w-8">
                    <Checkbox
                      checked={filtered.length > 0 && selected.size === filtered.length}
                      onCheckedChange={toggleAll}
                      className="h-3.5 w-3.5"
                    />
                  </TableHead>
                  <TableHead className="text-xs h-8">Order</TableHead>
                  <TableHead className="text-xs h-8">Customer</TableHead>
                  <TableHead className="text-xs h-8">Items</TableHead>
                  <TableHead className="text-xs h-8">Status</TableHead>
                  <TableHead className="text-xs h-8">Payment</TableHead>
                  <TableHead className="text-xs h-8">Fulfillment</TableHead>
                  <TableHead className="text-xs h-8 text-right">Total</TableHead>
                  <TableHead className="text-xs h-8">Date</TableHead>
                  <TableHead className="text-xs h-8 w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={10}><Skeleton className="h-4 w-full" /></TableCell></TableRow>)
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={10} className="text-center text-xs text-muted-foreground py-6">No orders yet.</TableCell></TableRow>
                ) : (
                  filtered.map((o: any) => (
                    <TableRow key={o.id} className="text-xs cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/orders/${o.id}`)}>
                      <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selected.has(o.id)}
                          onCheckedChange={() => toggleSelect(o.id)}
                          className="h-3.5 w-3.5"
                        />
                      </TableCell>
                      <TableCell className="py-2 font-medium">{o.order_number}</TableCell>
                      <TableCell className="py-2">{o.customers?.name || "—"}</TableCell>
                      <TableCell className="py-2">{o.items_count}</TableCell>
                      <TableCell className="py-2"><StatusBadge status={o.status} /></TableCell>
                      <TableCell className="py-2"><StatusBadge status={o.payment_status} /></TableCell>
                      <TableCell className="py-2"><StatusBadge status={o.fulfillment_status || "unfulfilled"} /></TableCell>
                      <TableCell className="py-2 text-right font-medium">${Number(o.total).toFixed(2)}</TableCell>
                      <TableCell className="py-2 text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          title="Duplicate order"
                          onClick={(e) => handleDuplicate(o, e)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}