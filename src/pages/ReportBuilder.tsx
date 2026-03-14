import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart3, Download, Play, Filter, Calendar } from "lucide-react";
import { toast } from "sonner";

const ENTITY_OPTIONS = [
  { value: "orders", label: "Orders", fields: ["id", "order_number", "status", "payment_status", "fulfillment_status", "total", "subtotal", "tax", "shipping", "discount", "items_count", "order_channel", "created_at"] },
  { value: "products", label: "Products", fields: ["id", "title", "sku", "price", "compare_at_price", "cost_price", "stock_quantity", "status", "product_type", "brand", "created_at"] },
  { value: "customers", label: "Customers", fields: ["id", "name", "email", "phone", "segment", "total_orders", "total_spent", "created_at"] },
  { value: "order_items", label: "Order Items", fields: ["id", "order_id", "title", "sku", "quantity", "unit_price", "total"] },
  { value: "categories", label: "Categories", fields: ["id", "name", "slug", "sort_order", "created_at"] },
  { value: "coupons", label: "Coupons", fields: ["id", "code", "discount_type", "discount_value", "used_count", "max_uses", "is_active", "created_at"] },
];

export default function ReportBuilder() {
  const { currentStore } = useAuth();
  const storeId = currentStore?.id;
  const [entity, setEntity] = useState("orders");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [results, setResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  const entityConfig = ENTITY_OPTIONS.find(e => e.value === entity);

  const runReport = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const fields = selectedFields.length > 0 ? selectedFields.join(",") : "*";
      let query = supabase.from(entity as any).select(fields).eq("store_id", storeId);
      if (dateFrom) query = query.gte("created_at", dateFrom);
      if (dateTo) query = query.lte("created_at", dateTo + "T23:59:59");
      if (statusFilter) query = query.eq("status", statusFilter);
      query = query.order("created_at", { ascending: false }).limit(500);
      const { data, error } = await query;
      if (error) throw error;
      setResults(data || []);
      toast.success(`Report returned ${data?.length || 0} rows`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    if (!results || results.length === 0) return;
    const headers = Object.keys(results[0]);
    const csv = [
      headers.join(","),
      ...results.map(row =>
        headers.map(h => {
          const val = row[h];
          if (val === null || val === undefined) return "";
          const str = typeof val === "object" ? JSON.stringify(val) : String(val);
          return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
        }).join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report_${entity}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleField = (field: string) => {
    setSelectedFields(prev => prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]);
  };

  const columns = results && results.length > 0 ? Object.keys(results[0]) : [];

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div>
          <h1 className="text-lg font-semibold">Report Builder</h1>
          <p className="text-xs text-muted-foreground">Build custom reports with filters and date ranges</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><Filter className="h-4 w-4" /> Config</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs">Entity</Label>
                <Select value={entity} onValueChange={(v) => { setEntity(v); setSelectedFields([]); setResults(null); }}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ENTITY_OPTIONS.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs flex items-center gap-1"><Calendar className="h-3 w-3" /> Date From</Label>
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Date To</Label>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Status Filter</Label>
                <Input placeholder="e.g. completed" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Fields ({selectedFields.length || "all"})</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {entityConfig?.fields.map(f => (
                    <Badge key={f} variant={selectedFields.includes(f) ? "default" : "outline"} className="text-[10px] cursor-pointer" onClick={() => toggleField(f)}>{f}</Badge>
                  ))}
                </div>
              </div>
              <Button onClick={runReport} disabled={loading} className="w-full gap-2">
                <Play className="h-4 w-4" /> {loading ? "Running..." : "Run Report"}
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Results {results && <Badge variant="secondary" className="text-[10px]">{results.length} rows</Badge>}
              </CardTitle>
              {results && results.length > 0 && (
                <Button size="sm" variant="outline" onClick={exportCsv} className="gap-1 h-7 text-xs">
                  <Download className="h-3 w-3" /> Export CSV
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {!results ? (
                <div className="text-center py-16 text-muted-foreground">
                  <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Configure your report and click Run</p>
                </div>
              ) : results.length === 0 ? (
                <p className="text-center py-16 text-sm text-muted-foreground">No results</p>
              ) : (
                <div className="overflow-x-auto max-h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {columns.map(col => <TableHead key={col} className="text-xs whitespace-nowrap">{col}</TableHead>)}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.slice(0, 100).map((row, i) => (
                        <TableRow key={i}>
                          {columns.map(col => (
                            <TableCell key={col} className="text-xs max-w-[200px] truncate">
                              {row[col] === null ? <span className="text-muted-foreground italic">null</span> :
                               typeof row[col] === "object" ? JSON.stringify(row[col]).slice(0, 60) :
                               String(row[col]).slice(0, 60)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {results.length > 100 && <p className="text-xs text-muted-foreground text-center mt-2">Showing first 100 of {results.length}</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
