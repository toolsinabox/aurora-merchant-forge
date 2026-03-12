import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useOrders } from "@/hooks/use-data";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Orders() {
  const { data: orders = [], isLoading } = useOrders();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = orders.filter((o: any) => {
    const matchSearch = o.order_number.includes(search) || (o.customers?.name || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div>
          <h1 className="text-lg font-semibold">Orders</h1>
          <p className="text-xs text-muted-foreground">{orders.length} total orders</p>
        </div>

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
                  <TableHead className="text-xs h-8">Order</TableHead>
                  <TableHead className="text-xs h-8">Customer</TableHead>
                  <TableHead className="text-xs h-8">Items</TableHead>
                  <TableHead className="text-xs h-8">Status</TableHead>
                  <TableHead className="text-xs h-8">Payment</TableHead>
                  <TableHead className="text-xs h-8 text-right">Total</TableHead>
                  <TableHead className="text-xs h-8">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-4 w-full" /></TableCell></TableRow>)
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-6">No orders yet.</TableCell></TableRow>
                ) : (
                  filtered.map((o: any) => (
                    <TableRow key={o.id} className="text-xs cursor-pointer hover:bg-muted/50">
                      <TableCell className="py-2 font-medium">{o.order_number}</TableCell>
                      <TableCell className="py-2">{o.customers?.name || "—"}</TableCell>
                      <TableCell className="py-2">{o.items_count}</TableCell>
                      <TableCell className="py-2"><StatusBadge status={o.status} /></TableCell>
                      <TableCell className="py-2"><StatusBadge status={o.payment_status} /></TableCell>
                      <TableCell className="py-2 text-right font-medium">${Number(o.total).toFixed(2)}</TableCell>
                      <TableCell className="py-2 text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</TableCell>
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
