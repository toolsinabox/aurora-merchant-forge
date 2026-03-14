import { useState, useMemo, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useReturns, useUpdateReturn } from "@/hooks/use-data";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, RotateCcw, BarChart3, DollarSign, TrendingUp, AlertTriangle, RefreshCw, ShieldAlert, Plus, ScanLine, CheckCircle, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

const RETURN_STATUSES = ["requested", "approved", "rejected", "refunded", "completed"];
const RETURN_TYPES = ["return", "warranty_claim"];
const DISPUTE_TYPES = ["refund", "repair", "replace"];
const DISPUTE_REASONS = [
  "Product defective on arrival",
  "Product broke within warranty period",
  "Product not as described",
  "Missing parts or accessories",
  "Performance issues",
  "Safety concern",
  "Other",
];

export default function Returns() {
  const { data: returns = [], isLoading } = useReturns();
  const updateReturn = useUpdateReturn();
  const { currentStore } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [creatingReplacement, setCreatingReplacement] = useState(false);

  const handleCreateReplacement = async () => {
    if (!selected || !currentStore) return;
    setCreatingReplacement(true);
    try {
      const orderNum = `RPL-${Date.now().toString(36).toUpperCase()}`;
      // Get original order items
      const { data: origItems } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", selected.order_id);
      const subtotal = origItems?.reduce((s, i) => s + Number(i.total), 0) || 0;
      const { data: newOrder, error } = await supabase
        .from("orders")
        .insert({
          store_id: currentStore.id,
          order_number: orderNum,
          customer_id: selected.customer_id,
          items_count: origItems?.length || 0,
          subtotal,
          total: subtotal,
          status: "processing",
          payment_status: "pending",
          fulfillment_status: "unfulfilled",
          notes: `Replacement for return on order ${selected.orders?.order_number || ""}`,
          shipping_address: selected.orders?.shipping_address,
        } as any)
        .select()
        .single();
      if (error) throw error;
      if (origItems && origItems.length > 0) {
        const newItems = origItems.map((item: any) => ({
          order_id: newOrder.id,
          store_id: currentStore.id,
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
      toast.success(`Replacement order ${orderNum} created`);
      setSelected(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreatingReplacement(false);
    }
  };

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

  // RMA Report stats
  const rmaStats = useMemo(() => {
    const all = returns as any[];
    const totalRefunds = all.reduce((s, r) => s + (Number(r.refund_amount) || 0), 0);
    const byStatus: Record<string, number> = {};
    const byReason: Record<string, number> = {};
    all.forEach(r => {
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
      const reason = (r.reason || "Other").slice(0, 50);
      byReason[reason] = (byReason[reason] || 0) + 1;
    });
    const topReasons = Object.entries(byReason)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    return { total: all.length, totalRefunds, byStatus, topReasons };
  }, [returns]);

  const [activeTab, setActiveTab] = useState("list");

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Returns & Refunds</h1>
            <p className="text-xs text-muted-foreground">{returns.length} total returns</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-auto flex-wrap gap-1 p-1">
            <TabsTrigger value="list">Returns List</TabsTrigger>
            <TabsTrigger value="receiving">Receiving</TabsTrigger>
            <TabsTrigger value="quarantine">Damaged Goods</TabsTrigger>
            <TabsTrigger value="warranty">Warranty Claims</TabsTrigger>
            <TabsTrigger value="disputes">Warranty Disputes</TabsTrigger>
            <TabsTrigger value="report">RMA Report</TabsTrigger>
          </TabsList>

          <TabsContent value="report" className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <BarChart3 className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-xs text-muted-foreground">Total Returns</p>
                  <p className="text-lg font-bold">{rmaStats.total}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <DollarSign className="h-5 w-5 mx-auto mb-1 text-destructive" />
                  <p className="text-xs text-muted-foreground">Total Refunds</p>
                  <p className="text-lg font-bold">${rmaStats.totalRefunds.toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <TrendingUp className="h-5 w-5 mx-auto mb-1 text-warning" />
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-lg font-bold">{rmaStats.byStatus["requested"] || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-chart-2" />
                  <p className="text-xs text-muted-foreground">Refunded</p>
                  <p className="text-lg font-bold">{(rmaStats.byStatus["refunded"] || 0) + (rmaStats.byStatus["completed"] || 0)}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* By Status */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Returns by Status</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(rmaStats.byStatus).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between text-sm">
                        <StatusBadge status={status} />
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                    {Object.keys(rmaStats.byStatus).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No data</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Top Reasons */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Top Return Reasons</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {rmaStats.topReasons.map(([reason, count]) => (
                      <div key={reason} className="flex items-center justify-between text-sm">
                        <span className="truncate max-w-[200px]">{reason}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                    {rmaStats.topReasons.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No data</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="receiving">
            <ReturnsReceivingTab />
          </TabsContent>

          <TabsContent value="warranty">
            <WarrantyClaimsTab />
          </TabsContent>

          <TabsContent value="disputes">
            <DisputesTab />
          </TabsContent>

          <TabsContent value="list">

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
        </TabsContent>
        </Tabs>
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

              <div className="grid grid-cols-2 gap-3">
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
                  <Label className="text-xs">Restocking Fee ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={(selected as any)?._restockingFee || "0"}
                    onChange={(e) => {
                      const fee = Number(e.target.value) || 0;
                      setSelected({ ...selected, _restockingFee: e.target.value });
                      const origRefund = Number(selected.refund_amount || refundAmount || 0);
                      setRefundAmount(String(Math.max(0, origRefund - fee)));
                    }}
                    className="h-9"
                    placeholder="0.00"
                  />
                  <p className="text-[10px] text-muted-foreground">Deducted from refund amount</p>
                </div>
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
                {["approved", "refunded", "completed"].includes(selected.status) && (
                  <Button size="sm" variant="secondary" className="text-xs gap-1" onClick={handleCreateReplacement} disabled={creatingReplacement}>
                    <RefreshCw className="h-3 w-3" /> {creatingReplacement ? "Creating..." : "Replacement Order"}
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

function ReturnsReceivingTab() {
  const { currentStore } = useAuth();
  const { data: returns = [] } = useReturns();
  const updateReturn = useUpdateReturn();
  const [scanInput, setScanInput] = useState("");
  const [receivedItems, setReceivedItems] = useState<Record<string, { condition: string; notes: string; receivedAt: string }>>({});

  // Filter returns that are approved (ready to receive back)
  const approvedReturns = useMemo(() => 
    (returns as any[]).filter(r => r.status === "approved"), 
    [returns]
  );

  const handleScan = (barcode: string) => {
    // Find a matching approved return by order number
    const match = approvedReturns.find(r => 
      r.orders?.order_number?.toLowerCase() === barcode.toLowerCase()
    );
    if (match && !receivedItems[match.id]) {
      setReceivedItems(prev => ({
        ...prev,
        [match.id]: { condition: "good", notes: "", receivedAt: new Date().toISOString() }
      }));
      toast.success(`Return received: Order ${match.orders?.order_number}`);
    } else if (match && receivedItems[match.id]) {
      toast.info("Already scanned this return");
    } else {
      toast.error(`No approved return found for: ${barcode}`);
    }
    setScanInput("");
  };

  const updateCondition = (returnId: string, condition: string) => {
    setReceivedItems(prev => ({
      ...prev,
      [returnId]: { ...prev[returnId], condition }
    }));
  };

  const updateNotes = (returnId: string, notes: string) => {
    setReceivedItems(prev => ({
      ...prev,
      [returnId]: { ...prev[returnId], notes }
    }));
  };

  const processReceived = (returnId: string) => {
    const item = receivedItems[returnId];
    if (!item) return;
    const isDamaged = item.condition === "damaged" || item.condition === "defective";
    const adminNotes = `Received: ${item.condition} condition${isDamaged ? " [QUARANTINED]" : ""}${item.notes ? `. Notes: ${item.notes}` : ""}. Received at ${format(new Date(item.receivedAt), "MMM d, yyyy HH:mm")}`;
    updateReturn.mutate({
      id: returnId,
      status: isDamaged ? "approved" : "refunded",
      admin_notes: adminNotes,
    });
    if (isDamaged) {
      // Track quarantined items in localStorage
      const quarantined = JSON.parse(localStorage.getItem("quarantined_goods") || "[]");
      const ret = approvedReturns.find(r => r.id === returnId);
      quarantined.push({
        id: crypto.randomUUID(),
        return_id: returnId,
        order_number: (ret as any)?.orders?.order_number || "—",
        customer: (ret as any)?.customers?.name || "—",
        condition: item.condition,
        notes: item.notes,
        quarantined_at: new Date().toISOString(),
        disposition: "pending", // pending, write_off, repair, resell
      });
      localStorage.setItem("quarantined_goods", JSON.stringify(quarantined));
      toast.warning(`Item quarantined (${item.condition}) — requires disposition decision`);
    } else {
      toast.success("Return processed and marked for refund");
    }
    setReceivedItems(prev => {
      const copy = { ...prev };
      delete copy[returnId];
      return copy;
    });
  };

  const receivedCount = Object.keys(receivedItems).length;

  return (
    <div className="space-y-3">
      {/* Scanning */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ScanLine className="h-4 w-4" /> Scan Returned Items
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Scan or type order number..."
              value={scanInput}
              onChange={e => setScanInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && scanInput.trim()) handleScan(scanInput.trim()); }}
              className="h-9 text-sm max-w-md"
              autoFocus
            />
            <Button size="sm" onClick={() => { if (scanInput.trim()) handleScan(scanInput.trim()); }}>Scan</Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {approvedReturns.length} approved return(s) awaiting receipt • {receivedCount} scanned in this session
          </p>
        </CardContent>
      </Card>

      {/* Scanned items ready to process */}
      {receivedCount > 0 && (
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm">Scanned Returns ({receivedCount})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-8">Order</TableHead>
                  <TableHead className="text-xs h-8">Customer</TableHead>
                  <TableHead className="text-xs h-8">Reason</TableHead>
                  <TableHead className="text-xs h-8">Condition</TableHead>
                  <TableHead className="text-xs h-8">Notes</TableHead>
                  <TableHead className="text-xs h-8 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedReturns.filter(r => receivedItems[r.id]).map((r: any) => (
                  <TableRow key={r.id} className="text-xs">
                    <TableCell className="py-2 font-mono font-medium">{r.orders?.order_number || "—"}</TableCell>
                    <TableCell className="py-2">{r.customers?.name || "—"}</TableCell>
                    <TableCell className="py-2 max-w-[120px] truncate">{r.reason}</TableCell>
                    <TableCell className="py-2">
                      <Select value={receivedItems[r.id]?.condition || "good"} onValueChange={v => updateCondition(r.id, v)}>
                        <SelectTrigger className="h-7 w-28 text-[11px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="good" className="text-xs">Good</SelectItem>
                          <SelectItem value="damaged" className="text-xs">Damaged</SelectItem>
                          <SelectItem value="defective" className="text-xs">Defective</SelectItem>
                          <SelectItem value="opened" className="text-xs">Opened</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="py-2">
                      <Input
                        value={receivedItems[r.id]?.notes || ""}
                        onChange={e => updateNotes(r.id, e.target.value)}
                        placeholder="Notes..."
                        className="h-7 text-[11px] w-32"
                      />
                    </TableCell>
                    <TableCell className="py-2 text-right">
                      <Button size="sm" className="text-xs h-6" onClick={() => processReceived(r.id)}>
                        <CheckCircle className="h-3 w-3 mr-1" /> Process
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Approved returns awaiting receipt */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm">Awaiting Receipt ({approvedReturns.filter(r => !receivedItems[r.id]).length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs h-8">Order</TableHead>
                <TableHead className="text-xs h-8">Customer</TableHead>
                <TableHead className="text-xs h-8">Reason</TableHead>
                <TableHead className="text-xs h-8">Refund</TableHead>
                <TableHead className="text-xs h-8">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvedReturns.filter(r => !receivedItems[r.id]).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">
                    <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                    No approved returns awaiting receipt. Scan order numbers above to receive.
                  </TableCell>
                </TableRow>
              ) : (
                approvedReturns.filter(r => !receivedItems[r.id]).map((r: any) => (
                  <TableRow key={r.id} className="text-xs">
                    <TableCell className="py-2 font-mono font-medium">{r.orders?.order_number || "—"}</TableCell>
                    <TableCell className="py-2">{r.customers?.name || "—"}</TableCell>
                    <TableCell className="py-2 max-w-[200px] truncate">{r.reason}</TableCell>
                    <TableCell className="py-2 font-medium">${Number(r.refund_amount).toFixed(2)}</TableCell>
                    <TableCell className="py-2 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function WarrantyClaimsTab() {
  const { currentStore } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [claimForm, setClaimForm] = useState({
    orderId: "", productId: "", claimType: "repair", reason: "", description: "",
    purchaseDate: "", warrantyExpiry: "",
  });

  const { data: claims = [], isLoading } = useQuery({
    queryKey: ["warranty_claims", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data } = await supabase
        .from("warranty_disputes" as any)
        .select("*, orders(order_number), customers(name), products(title)")
        .eq("store_id", currentStore.id)
        .not("dispute_type", "eq", "refund") // warranty claims are repair/replace type
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!currentStore,
  });

  const createClaim = useMutation({
    mutationFn: async () => {
      if (!currentStore) throw new Error("No store");
      const { error } = await supabase.from("warranty_disputes" as any).insert({
        store_id: currentStore.id,
        order_id: claimForm.orderId || null,
        product_id: claimForm.productId || null,
        dispute_type: claimForm.claimType,
        reason: claimForm.reason,
        description: `${claimForm.description}\n\nPurchase Date: ${claimForm.purchaseDate || "N/A"}\nWarranty Expiry: ${claimForm.warrantyExpiry || "N/A"}`,
        status: "open",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warranty_claims"] });
      setShowCreate(false);
      setClaimForm({ orderId: "", productId: "", claimType: "repair", reason: "", description: "", purchaseDate: "", warrantyExpiry: "" });
      toast.success("Warranty claim created");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["orders-for-claims", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data } = await supabase.from("orders").select("id, order_number").eq("store_id", currentStore.id).order("created_at", { ascending: false }).limit(100);
      return data || [];
    },
    enabled: !!currentStore && showCreate,
  });

  const { data: productsList = [] } = useQuery({
    queryKey: ["products-for-claims", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data } = await supabase.from("products").select("id, title").eq("store_id", currentStore.id).eq("status", "active").order("title").limit(200);
      return data || [];
    },
    enabled: !!currentStore && showCreate,
  });

  return (
    <Card>
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm">Warranty Claims</CardTitle>
        <Button size="sm" className="h-7 text-xs gap-1" onClick={() => setShowCreate(true)}>
          <Plus className="h-3 w-3" /> New Claim
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs h-8">Order</TableHead>
              <TableHead className="text-xs h-8">Product</TableHead>
              <TableHead className="text-xs h-8">Type</TableHead>
              <TableHead className="text-xs h-8">Reason</TableHead>
              <TableHead className="text-xs h-8">Status</TableHead>
              <TableHead className="text-xs h-8">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
            ) : claims.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-6">
                  <ShieldAlert className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                  No warranty claims yet.
                </TableCell>
              </TableRow>
            ) : (
              claims.map((c: any) => (
                <TableRow key={c.id} className="text-xs">
                  <TableCell className="py-2 font-medium">{c.orders?.order_number || "—"}</TableCell>
                  <TableCell className="py-2 max-w-[150px] truncate">{c.products?.title || "—"}</TableCell>
                  <TableCell className="py-2"><Badge variant="outline" className="text-[10px] capitalize">{c.dispute_type}</Badge></TableCell>
                  <TableCell className="py-2 max-w-[150px] truncate">{c.reason}</TableCell>
                  <TableCell className="py-2"><Badge variant={c.status === "resolved" ? "default" : "secondary"} className="text-[10px] capitalize">{c.status?.replace("_", " ")}</Badge></TableCell>
                  <TableCell className="py-2 text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-base">New Warranty Claim</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Order (optional)</Label>
              <Select value={claimForm.orderId} onValueChange={(v) => setClaimForm({ ...claimForm, orderId: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select order..." /></SelectTrigger>
                <SelectContent>{orders.map((o: any) => <SelectItem key={o.id} value={o.id} className="text-xs">{o.order_number}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Product</Label>
              <Select value={claimForm.productId} onValueChange={(v) => setClaimForm({ ...claimForm, productId: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select product..." /></SelectTrigger>
                <SelectContent>{productsList.map((p: any) => <SelectItem key={p.id} value={p.id} className="text-xs">{p.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Claim Type</Label>
              <Select value={claimForm.claimType} onValueChange={(v) => setClaimForm({ ...claimForm, claimType: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="repair" className="text-xs">Repair</SelectItem>
                  <SelectItem value="replace" className="text-xs">Replace</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Purchase Date</Label>
                <Input type="date" className="h-8 text-xs" value={claimForm.purchaseDate} onChange={(e) => setClaimForm({ ...claimForm, purchaseDate: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Warranty Expiry</Label>
                <Input type="date" className="h-8 text-xs" value={claimForm.warrantyExpiry} onChange={(e) => setClaimForm({ ...claimForm, warrantyExpiry: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Reason</Label>
              <Select value={claimForm.reason} onValueChange={(v) => setClaimForm({ ...claimForm, reason: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select reason..." /></SelectTrigger>
                <SelectContent>
                  {DISPUTE_REASONS.map((r) => <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <Textarea className="text-sm min-h-[60px]" value={claimForm.description} onChange={(e) => setClaimForm({ ...claimForm, description: e.target.value })} placeholder="Describe the issue..." />
            </div>
            <Button size="sm" className="w-full text-xs" onClick={() => createClaim.mutate()} disabled={createClaim.isPending || !claimForm.reason}>
              {createClaim.isPending ? "Creating..." : "Create Warranty Claim"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function DisputesTab() {
  const { currentStore } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [disputeNotes, setDisputeNotes] = useState("");
  const [resolution, setResolution] = useState("");

  const { data: disputes = [], isLoading } = useQuery({
    queryKey: ["warranty_disputes", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data } = await supabase
        .from("warranty_disputes" as any)
        .select("*, orders(order_number), customers(name), products(title)")
        .eq("store_id", currentStore.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!currentStore,
  });

  const updateDispute = useMutation({
    mutationFn: async ({ id, status, admin_notes, resolution: res }: any) => {
      const update: any = { status, admin_notes };
      if (res) update.resolution = res;
      if (status === "resolved" || status === "closed") update.resolved_at = new Date().toISOString();
      const { error } = await supabase.from("warranty_disputes" as any).update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warranty_disputes"] });
      toast.success("Dispute updated");
      setSelectedDispute(null);
    },
  });

  const statusColor = (s: string) => {
    if (s === "open") return "secondary";
    if (s === "in_review") return "outline";
    if (s === "resolved") return "default";
    return "destructive";
  };

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs h-8">Order</TableHead>
              <TableHead className="text-xs h-8">Customer</TableHead>
              <TableHead className="text-xs h-8">Product</TableHead>
              <TableHead className="text-xs h-8">Type</TableHead>
              <TableHead className="text-xs h-8">Reason</TableHead>
              <TableHead className="text-xs h-8">Status</TableHead>
              <TableHead className="text-xs h-8">Date</TableHead>
              <TableHead className="text-xs h-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
            ) : disputes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-6">
                  <ShieldAlert className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                  No warranty disputes yet.
                </TableCell>
              </TableRow>
            ) : (
              disputes.map((d: any) => (
                <TableRow key={d.id} className="text-xs">
                  <TableCell className="py-2 font-medium">{d.orders?.order_number || "—"}</TableCell>
                  <TableCell className="py-2">{d.customers?.name || "—"}</TableCell>
                  <TableCell className="py-2 max-w-[150px] truncate">{d.products?.title || "—"}</TableCell>
                  <TableCell className="py-2 capitalize">{d.dispute_type}</TableCell>
                  <TableCell className="py-2 max-w-[150px] truncate">{d.reason}</TableCell>
                  <TableCell className="py-2"><Badge variant={statusColor(d.status)} className="text-[10px] capitalize">{d.status.replace("_", " ")}</Badge></TableCell>
                  <TableCell className="py-2 text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="py-2">
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => {
                      setSelectedDispute(d);
                      setDisputeNotes(d.admin_notes || "");
                      setResolution(d.resolution || "");
                    }}>Manage</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={!!selectedDispute} onOpenChange={(o) => !o && setSelectedDispute(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-base">Warranty Dispute</DialogTitle></DialogHeader>
          {selectedDispute && (
            <div className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Order</span><span className="font-medium">{selectedDispute.orders?.order_number || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span>{selectedDispute.customers?.name || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Product</span><span className="max-w-[200px] truncate">{selectedDispute.products?.title || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Type</span><Badge variant="outline" className="text-[10px] capitalize">{selectedDispute.dispute_type}</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant={statusColor(selectedDispute.status)} className="text-[10px] capitalize">{selectedDispute.status.replace("_", " ")}</Badge></div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Customer Reason</Label>
                <p className="text-sm bg-muted/50 rounded-md p-3">{selectedDispute.reason}</p>
              </div>
              {selectedDispute.description && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Description</Label>
                  <p className="text-sm bg-muted/50 rounded-md p-3">{selectedDispute.description}</p>
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs">Resolution</Label>
                <Textarea value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Describe the resolution..." className="min-h-[50px] text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Admin Notes</Label>
                <Textarea value={disputeNotes} onChange={(e) => setDisputeNotes(e.target.value)} placeholder="Internal notes..." className="min-h-[50px] text-sm" />
              </div>
              <div className="flex gap-2">
                {selectedDispute.status === "open" && (
                  <Button size="sm" className="flex-1 text-xs" onClick={() => updateDispute.mutate({ id: selectedDispute.id, status: "in_review", admin_notes: disputeNotes, resolution })}>
                    Start Review
                  </Button>
                )}
                {["open", "in_review"].includes(selectedDispute.status) && (
                  <Button size="sm" className="flex-1 text-xs" onClick={() => updateDispute.mutate({ id: selectedDispute.id, status: "resolved", admin_notes: disputeNotes, resolution })}>
                    Resolve
                  </Button>
                )}
                {["open", "in_review"].includes(selectedDispute.status) && (
                  <Button size="sm" variant="destructive" className="text-xs" onClick={() => updateDispute.mutate({ id: selectedDispute.id, status: "closed", admin_notes: disputeNotes, resolution })}>
                    Close
                  </Button>
                )}
                <Button size="sm" variant="outline" className="text-xs" onClick={() => updateDispute.mutate({ id: selectedDispute.id, status: selectedDispute.status, admin_notes: disputeNotes, resolution })}>
                  Save Notes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
