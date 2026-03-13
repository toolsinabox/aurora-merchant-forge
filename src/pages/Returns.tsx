import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useReturns, useUpdateReturn } from "@/hooks/use-data";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, RotateCcw, BarChart3, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const RETURN_STATUSES = ["requested", "approved", "rejected", "refunded", "completed"];

export default function Returns() {
  const { data: returns = [], isLoading } = useReturns();
  const updateReturn = useUpdateReturn();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [refundAmount, setRefundAmount] = useState("");

  const filtered = (returns as any[]).filter((r) => {
    const matchSearch =
      (r.orders?.order_number || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.customers?.name || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openDetail = (r: any) => {
    setSelected(r);
    setAdminNotes(r.admin_notes || "");
    setRefundAmount(String(r.refund_amount || 0));
  };

  const handleUpdate = (status: string) => {
    if (!selected) return;
    updateReturn.mutate({
      id: selected.id,
      status,
      admin_notes: adminNotes,
      refund_amount: Number(refundAmount) || 0,
    });
    setSelected(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Returns & Refunds</h1>
            <p className="text-xs text-muted-foreground">{returns.length} total returns</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="flex items-center gap-2 p-3 border-b">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search returns..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 pl-8 text-xs" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All</SelectItem>
                  {RETURN_STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-8">Order</TableHead>
                  <TableHead className="text-xs h-8">Customer</TableHead>
                  <TableHead className="text-xs h-8">Reason</TableHead>
                  <TableHead className="text-xs h-8">Status</TableHead>
                  <TableHead className="text-xs h-8 text-right">Refund</TableHead>
                  <TableHead className="text-xs h-8">Date</TableHead>
                  <TableHead className="text-xs h-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-6">
                      <RotateCcw className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                      No return requests yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r: any) => (
                    <TableRow key={r.id} className="text-xs">
                      <TableCell className="py-2 font-medium">{r.orders?.order_number || "—"}</TableCell>
                      <TableCell className="py-2">{r.customers?.name || "—"}</TableCell>
                      <TableCell className="py-2 max-w-[200px] truncate">{r.reason}</TableCell>
                      <TableCell className="py-2"><StatusBadge status={r.status} /></TableCell>
                      <TableCell className="py-2 text-right font-medium">${Number(r.refund_amount).toFixed(2)}</TableCell>
                      <TableCell className="py-2 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="py-2">
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => openDetail(r)}>
                          Manage
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

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Return Request</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order</span>
                  <span className="font-medium">{selected.orders?.order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <span>{selected.customers?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge status={selected.status} />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Total</span>
                  <span>${Number(selected.orders?.total || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Customer Reason</Label>
                <p className="text-sm bg-muted/50 rounded-md p-3">{selected.reason}</p>
              </div>

              {selected.notes && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Customer Notes</Label>
                  <p className="text-sm bg-muted/50 rounded-md p-3">{selected.notes}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs">Refund Amount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Admin Notes</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Internal notes..."
                  className="min-h-[60px] text-sm"
                />
              </div>

              <div className="flex gap-2">
                {selected.status === "requested" && (
                  <>
                    <Button size="sm" className="flex-1 text-xs" onClick={() => handleUpdate("approved")}>
                      Approve
                    </Button>
                    <Button size="sm" variant="destructive" className="flex-1 text-xs" onClick={() => handleUpdate("rejected")}>
                      Reject
                    </Button>
                  </>
                )}
                {selected.status === "approved" && (
                  <Button size="sm" className="flex-1 text-xs" onClick={() => handleUpdate("refunded")}>
                    Mark Refunded
                  </Button>
                )}
                {selected.status === "refunded" && (
                  <Button size="sm" className="flex-1 text-xs" onClick={() => handleUpdate("completed")}>
                    Complete
                  </Button>
                )}
                {["requested", "approved"].includes(selected.status) && (
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => {
                    updateReturn.mutate({ id: selected.id, admin_notes: adminNotes, refund_amount: Number(refundAmount) || 0 });
                    setSelected(null);
                  }}>
                    Save Notes
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
