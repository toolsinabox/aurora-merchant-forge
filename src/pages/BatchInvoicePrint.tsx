import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/hooks/use-data";
import { Printer, Search, FileText, CheckSquare } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function BatchInvoicePrint() {
  const { currentStore } = useAuth();
  const { data: orders = [], isLoading } = useOrders();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    return orders.filter((o: any) => {
      if (search && !o.order_number?.toLowerCase().includes(search.toLowerCase()) && !o.customer_name?.toLowerCase().includes(search.toLowerCase())) return false;
      if (dateFrom && o.created_at < dateFrom) return false;
      if (dateTo && o.created_at > dateTo + "T23:59:59") return false;
      return true;
    });
  }, [orders, search, dateFrom, dateTo]);

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const toggleAll = () => {
    if (selectedCount === filtered.length) {
      setSelected({});
    } else {
      const newSel: Record<string, boolean> = {};
      filtered.forEach((o: any) => { newSel[o.id] = true; });
      setSelected(newSel);
    }
  };

  const printSelected = () => {
    const selectedOrders = filtered.filter((o: any) => selected[o.id]);
    if (selectedOrders.length === 0) { toast.error("Select at least one order"); return; }
    const w = window.open("", "_blank");
    if (!w) { toast.error("Allow popups to print"); return; }
    const invoices = selectedOrders.map((o: any) => `
      <div class="invoice" style="page-break-after: always; padding: 40px;">
        <div style="border-bottom: 2px solid #333; padding-bottom: 12px; margin-bottom: 20px;">
          <h1 style="font-size: 22px; margin: 0;">TAX INVOICE</h1>
          <p style="font-size: 12px; color: #666; margin: 4px 0 0;">${currentStore?.name || "Store"}</p>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; font-size: 12px;">
          <div>
            <p style="color: #888; margin: 0;">Invoice #</p>
            <p style="font-weight: 600; margin: 2px 0 0;">${o.order_number}</p>
          </div>
          <div>
            <p style="color: #888; margin: 0;">Date</p>
            <p style="font-weight: 600; margin: 2px 0 0;">${format(new Date(o.created_at), "dd MMM yyyy")}</p>
          </div>
          <div>
            <p style="color: #888; margin: 0;">Customer</p>
            <p style="font-weight: 600; margin: 2px 0 0;">${o.customer_name || "—"}</p>
          </div>
          <div>
            <p style="color: #888; margin: 0;">Status</p>
            <p style="font-weight: 600; margin: 2px 0 0;">${o.status}</p>
          </div>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead><tr style="background: #f5f5f5;">
            <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Description</th>
            <th style="text-align: right; padding: 8px; border: 1px solid #ddd;">Subtotal</th>
            <th style="text-align: right; padding: 8px; border: 1px solid #ddd;">Tax</th>
            <th style="text-align: right; padding: 8px; border: 1px solid #ddd;">Total</th>
          </tr></thead>
          <tbody>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">Order ${o.order_number}</td>
              <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">$${Number(o.subtotal || o.total || 0).toFixed(2)}</td>
              <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">$${Number(o.tax || 0).toFixed(2)}</td>
              <td style="text-align: right; padding: 8px; border: 1px solid #ddd; font-weight: 700;">$${Number(o.total || 0).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        <div style="text-align: right; margin-top: 16px; font-size: 18px; font-weight: 700;">Total: $${Number(o.total || 0).toFixed(2)}</div>
      </div>
    `).join("");

    w.document.write(`<html><head><title>Batch Invoices</title>
      <style>body{font-family:Arial,sans-serif;margin:0}@media print{.invoice:last-child{page-break-after:avoid}}</style>
    </head><body>${invoices}<script>window.print();</script></body></html>`);
    w.document.close();
    toast.success(`${selectedOrders.length} invoice(s) sent to print`);
  };

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Batch Invoice Print</h1>
            <p className="text-xs text-muted-foreground">Select multiple orders and print invoices in bulk</p>
          </div>
          <Button size="sm" className="text-xs h-8 gap-1" disabled={selectedCount === 0} onClick={printSelected}>
            <Printer className="h-3.5 w-3.5" /> Print {selectedCount} Invoice{selectedCount !== 1 ? "s" : ""}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search order# or customer..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 text-xs" />
          </div>
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9 text-xs w-[140px]" placeholder="From" />
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9 text-xs w-[140px]" placeholder="To" />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Button variant="outline" size="sm" className="text-xs h-7 gap-1" onClick={toggleAll}>
            <CheckSquare className="h-3 w-3" /> {selectedCount === filtered.length ? "Deselect All" : "Select All"}
          </Button>
          <span>{filtered.length} orders | {selectedCount} selected</span>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-8 w-8"></TableHead>
                  <TableHead className="text-xs h-8">Order #</TableHead>
                  <TableHead className="text-xs h-8">Customer</TableHead>
                  <TableHead className="text-xs h-8">Date</TableHead>
                  <TableHead className="text-xs h-8">Status</TableHead>
                  <TableHead className="text-xs h-8 text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
                )) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">
                    <FileText className="h-6 w-6 mx-auto mb-1 text-muted-foreground/40" />No orders found
                  </TableCell></TableRow>
                ) : filtered.map((o: any) => (
                  <TableRow key={o.id} className={`text-xs ${selected[o.id] ? "bg-primary/5" : ""}`}>
                    <TableCell className="py-1.5">
                      <Checkbox checked={!!selected[o.id]} onCheckedChange={() => setSelected(s => ({ ...s, [o.id]: !s[o.id] }))} />
                    </TableCell>
                    <TableCell className="py-1.5 font-mono font-medium">{o.order_number}</TableCell>
                    <TableCell className="py-1.5">{o.customer_name || "Guest"}</TableCell>
                    <TableCell className="py-1.5 text-muted-foreground">{format(new Date(o.created_at), "MMM d, yyyy")}</TableCell>
                    <TableCell className="py-1.5">
                      <Badge variant={o.status === "completed" ? "default" : "secondary"} className="text-[10px] capitalize">{o.status}</Badge>
                    </TableCell>
                    <TableCell className="py-1.5 text-right font-semibold">${Number(o.total || 0).toFixed(2)}</TableCell>
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
