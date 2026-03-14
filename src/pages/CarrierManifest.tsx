import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Truck, Printer, Package, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";

interface PickupSchedule {
  id: string;
  carrier: string;
  date: string;
  time: string;
  notes: string;
  status: "scheduled" | "completed" | "cancelled";
}

export default function CarrierManifest() {
  const { currentStore } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [carrierFilter, setCarrierFilter] = useState("all");

  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ["manifest-shipments", currentStore?.id, selectedDate],
    enabled: !!currentStore,
    queryFn: async () => {
      const startOfDay = `${selectedDate}T00:00:00.000Z`;
      const endOfDay = `${selectedDate}T23:59:59.999Z`;
      const { data } = await supabase
        .from("order_shipments")
        .select("*, orders:order_id(order_number, shipping_address)")
        .eq("store_id", currentStore!.id)
        .gte("created_at", startOfDay)
        .lte("created_at", endOfDay)
        .order("created_at", { ascending: false });
      return (data || []) as any[];
    },
  });

  const carriers = useMemo(() => {
    const set = new Set(shipments.map((s: any) => s.carrier || "Unknown"));
    return Array.from(set).sort();
  }, [shipments]);

  const filtered = useMemo(() => {
    if (carrierFilter === "all") return shipments;
    return shipments.filter((s: any) => (s.carrier || "Unknown") === carrierFilter);
  }, [shipments, carrierFilter]);

  const carrierSummary = useMemo(() => {
    const map = new Map<string, { count: number; totalWeight: number }>();
    for (const s of shipments) {
      const carrier = (s as any).carrier || "Unknown";
      const existing = map.get(carrier) || { count: 0, totalWeight: 0 };
      existing.count++;
      existing.totalWeight += Number((s as any).weight) || 0;
      map.set(carrier, existing);
    }
    return Array.from(map.entries()).map(([carrier, stats]) => ({ carrier, ...stats }));
  }, [shipments]);

  const printManifest = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) { toast.error("Allow popups to print"); return; }
    const rows = filtered.map((s: any) => `
      <tr>
        <td>${(s.orders as any)?.order_number || "—"}</td>
        <td>${s.tracking_number || "—"}</td>
        <td>${s.carrier || "—"}</td>
        <td>${Number(s.weight || 0).toFixed(2)} kg</td>
        <td>${new Date(s.created_at).toLocaleTimeString()}</td>
      </tr>
    `).join("");
    printWindow.document.write(`
      <html><head><title>Carrier Manifest — ${selectedDate}</title>
      <style>body{font-family:Arial,sans-serif;padding:20px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:12px}th{background:#f5f5f5;font-weight:600}h1{font-size:18px}h2{font-size:14px;color:#666}.summary{display:flex;gap:24px;margin-top:8px}.summary-item{background:#f9f9f9;padding:12px 16px;border-radius:6px;text-align:center}.summary-item p{margin:0}.summary-item .label{font-size:11px;color:#888}.summary-item .value{font-size:18px;font-weight:700}</style>
      </head><body>
      <h1>Carrier Manifest</h1>
      <h2>Date: ${selectedDate} | Store: ${currentStore?.name || ""} | Total Shipments: ${filtered.length}</h2>
      <div class="summary">${carrierSummary.map(c => `<div class="summary-item"><p class="value">${c.count}</p><p class="label">${c.carrier}</p></div>`).join("")}</div>
      <table><thead><tr><th>Order #</th><th>Tracking #</th><th>Carrier</th><th>Weight</th><th>Time</th></tr></thead><tbody>${rows}</tbody></table>
      <p style="margin-top:24px;font-size:11px;color:#999">Generated ${new Date().toLocaleString()}</p>
      <script>window.print();</script>
      </body></html>
    `);
    printWindow.document.close();
    toast.success("Manifest opened for printing");
  };

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Carrier Manifest</h1>
            <p className="text-xs text-muted-foreground">End-of-day manifest for carrier pickups</p>
          </div>
          <Button size="sm" className="text-xs h-8 gap-1" onClick={printManifest} disabled={filtered.length === 0}>
            <Printer className="h-3.5 w-3.5" /> Print Manifest
          </Button>
        </div>

        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="h-8 text-xs border rounded-md px-2 bg-background" />
          </div>
          <Select value={carrierFilter} onValueChange={setCarrierFilter}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue placeholder="All carriers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Carriers</SelectItem>
              {carriers.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <Package className="h-5 w-5 text-primary mb-1" />
              <p className="text-xl font-bold">{filtered.length}</p>
              <p className="text-2xs text-muted-foreground">Shipments</p>
            </CardContent>
          </Card>
          {carrierSummary.map(c => (
            <Card key={c.carrier}>
              <CardContent className="p-4">
                <Truck className="h-5 w-5 text-chart-2 mb-1" />
                <p className="text-xl font-bold">{c.count}</p>
                <p className="text-2xs text-muted-foreground">{c.carrier} ({c.totalWeight.toFixed(1)} kg)</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Shipments table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-8">Order #</TableHead>
                  <TableHead className="text-xs h-8">Tracking #</TableHead>
                  <TableHead className="text-xs h-8">Carrier</TableHead>
                  <TableHead className="text-xs h-8">Weight</TableHead>
                  <TableHead className="text-xs h-8">Status</TableHead>
                  <TableHead className="text-xs h-8">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">
                      No shipments for {selectedDate}
                    </TableCell>
                  </TableRow>
                ) : filtered.map((s: any) => (
                  <TableRow key={s.id} className="text-xs">
                    <TableCell className="py-1.5 font-mono">{(s.orders as any)?.order_number || "—"}</TableCell>
                    <TableCell className="py-1.5 font-mono">{s.tracking_number || "—"}</TableCell>
                    <TableCell className="py-1.5">
                      <Badge variant="outline" className="text-[10px]">{s.carrier || "Unknown"}</Badge>
                    </TableCell>
                    <TableCell className="py-1.5">{Number(s.weight || 0).toFixed(2)} kg</TableCell>
                    <TableCell className="py-1.5">
                      <Badge variant={s.status === "delivered" ? "default" : "secondary"} className="text-[10px] capitalize">{s.status}</Badge>
                    </TableCell>
                    <TableCell className="py-1.5 text-muted-foreground">{new Date(s.created_at).toLocaleTimeString()}</TableCell>
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
