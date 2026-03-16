import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart3, Download, Play, Filter, Calendar, Plus, Trash2, Calculator, Save, FolderOpen, TrendingUp, PieChart } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

const ENTITY_OPTIONS = [
  { value: "orders", label: "Orders", fields: ["id", "order_number", "status", "payment_status", "fulfillment_status", "total", "subtotal", "tax", "shipping", "discount", "items_count", "order_channel", "created_at"] },
  { value: "products", label: "Products", fields: ["id", "title", "sku", "price", "compare_at_price", "cost_price", "stock_quantity", "status", "product_type", "brand", "created_at"] },
  { value: "customers", label: "Customers", fields: ["id", "name", "email", "phone", "segment", "total_orders", "total_spent", "created_at"] },
  { value: "order_items", label: "Order Items", fields: ["id", "order_id", "title", "sku", "quantity", "unit_price", "total"] },
  { value: "categories", label: "Categories", fields: ["id", "name", "slug", "sort_order", "created_at"] },
  { value: "coupons", label: "Coupons", fields: ["id", "code", "discount_type", "discount_value", "used_count", "max_uses", "is_active", "created_at"] },
  { value: "inventory_stock", label: "Inventory", fields: ["id", "product_id", "location_id", "quantity", "low_stock_threshold", "bin_location", "batch_number", "created_at"] },
  { value: "gift_vouchers", label: "Gift Vouchers", fields: ["id", "code", "initial_value", "balance", "is_active", "expires_at", "created_at"] },
];

type FormulaCol = { name: string; formula: string; sourceField: string; operation: "sum" | "avg" | "min" | "max" | "count" | "percent" | "multiply" | "divide"; param?: string };

const FORMULA_OPS = [
  { value: "sum", label: "Sum (running)" },
  { value: "avg", label: "Average" },
  { value: "min", label: "Min" },
  { value: "max", label: "Max" },
  { value: "count", label: "Count Non-Null" },
  { value: "percent", label: "% of Total" },
  { value: "multiply", label: "Multiply by Field" },
  { value: "divide", label: "Divide by Field" },
];

interface SavedReport {
  id: string;
  name: string;
  entity: string;
  dateFrom: string;
  dateTo: string;
  statusFilter: string;
  selectedFields: string[];
  formulaCols: FormulaCol[];
  createdAt: string;
}

function computeFormula(results: any[], col: FormulaCol): (string | number)[] {
  const vals = results.map(r => Number(r[col.sourceField]) || 0);
  const total = vals.reduce((a, b) => a + b, 0);
  const avg = vals.length ? total / vals.length : 0;
  const min = vals.length ? Math.min(...vals) : 0;
  const max = vals.length ? Math.max(...vals) : 0;

  switch (col.operation) {
    case "sum": { let running = 0; return vals.map(v => { running += v; return Math.round(running * 100) / 100; }); }
    case "avg": return vals.map(() => Math.round(avg * 100) / 100);
    case "min": return vals.map(() => min);
    case "max": return vals.map(() => max);
    case "count": return results.map(() => results.filter(r => r[col.sourceField] != null && r[col.sourceField] !== "").length);
    case "percent": return vals.map(v => total ? Math.round((v / total) * 10000) / 100 : 0);
    case "multiply": return results.map(r => Math.round((Number(r[col.sourceField]) || 0) * (Number(r[col.param]) || 0) * 100) / 100);
    case "divide": return results.map(r => { const d = Number(r[col.param]) || 0; return d ? Math.round(((Number(r[col.sourceField]) || 0) / d) * 100) / 100 : 0; });
    default: return vals;
  }
}

function SimpleBarChart({ data, labelKey, valueKey }: { data: any[]; labelKey: string; valueKey: string }) {
  const values = data.map(d => Number(d[valueKey]) || 0);
  const maxVal = Math.max(...values, 1);
  const top10 = data.slice(0, 15);
  return (
    <div className="space-y-1.5">
      {top10.map((row, i) => {
        const val = Number(row[valueKey]) || 0;
        const pct = (val / maxVal) * 100;
        return (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-24 truncate text-right">{String(row[labelKey] ?? "—").slice(0, 20)}</span>
            <div className="flex-1 h-5 bg-muted rounded-sm overflow-hidden">
              <div className="h-full bg-primary/70 rounded-sm transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] font-mono w-16 text-right">{typeof val === "number" ? val.toLocaleString() : val}</span>
          </div>
        );
      })}
    </div>
  );
}

function SummaryCards({ results, numericFields }: { results: any[]; numericFields: string[] }) {
  if (numericFields.length === 0) return null;
  const topFields = numericFields.slice(0, 4);
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
      {topFields.map(field => {
        const vals = results.map(r => Number(r[field]) || 0);
        const total = vals.reduce((a, b) => a + b, 0);
        const avg = vals.length ? total / vals.length : 0;
        return (
          <div key={field} className="border rounded-lg p-2.5">
            <p className="text-[10px] text-muted-foreground uppercase truncate">{field}</p>
            <p className="text-sm font-bold">{total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            <p className="text-[10px] text-muted-foreground">avg: {avg.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          </div>
        );
      })}
    </div>
  );
}

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
  const [formulaCols, setFormulaCols] = useState<FormulaCol[]>([]);
  const [formulaOpen, setFormulaOpen] = useState(false);
  const [newFormula, setNewFormula] = useState<FormulaCol>({ name: "", formula: "", sourceField: "", operation: "sum" });
  const [savedReports, setSavedReports] = useState<SavedReport[]>(() => {
    try { return JSON.parse(localStorage.getItem("saved_reports") || "[]"); } catch { return []; }
  });
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [reportName, setReportName] = useState("");
  const [chartLabel, setChartLabel] = useState("");
  const [chartValue, setChartValue] = useState("");

  const entityConfig = ENTITY_OPTIONS.find(e => e.value === entity);

  const numericFields = useMemo(() => {
    if (!results || results.length === 0) return [];
    return Object.keys(results[0]).filter(k => {
      const sample = results.find(r => r[k] != null);
      return sample && !isNaN(Number(sample[k]));
    });
  }, [results]);

  const computedFormulas = useMemo(() => {
    if (!results || results.length === 0) return {};
    const map: Record<string, (string | number)[]> = {};
    formulaCols.forEach(fc => { map[fc.name] = computeFormula(results, fc); });
    return map;
  }, [results, formulaCols]);

  const addFormula = () => {
    if (!newFormula.name || !newFormula.sourceField) { toast.error("Name and source field required"); return; }
    if (formulaCols.some(f => f.name === newFormula.name)) { toast.error("Column name already exists"); return; }
    setFormulaCols([...formulaCols, { ...newFormula }]);
    setNewFormula({ name: "", formula: "", sourceField: "", operation: "sum" });
    setFormulaOpen(false);
    toast.success(`Calculated column "${newFormula.name}" added`);
  };

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
      // Auto-set chart axes
      if (data && data.length > 0) {
        const keys = Object.keys(data[0]);
        const textKey = keys.find(k => typeof data[0][k] === "string" && k !== "id") || keys[0];
        const numKey = keys.find(k => !isNaN(Number(data[0][k])) && k !== "id");
        setChartLabel(textKey || "");
        setChartValue(numKey || "");
      }
      toast.success(`Report returned ${data?.length || 0} rows`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveReport = () => {
    if (!reportName.trim()) { toast.error("Enter a name"); return; }
    const report: SavedReport = {
      id: Date.now().toString(36),
      name: reportName,
      entity, dateFrom, dateTo, statusFilter, selectedFields, formulaCols,
      createdAt: new Date().toISOString(),
    };
    const updated = [...savedReports, report];
    setSavedReports(updated);
    localStorage.setItem("saved_reports", JSON.stringify(updated));
    setSaveDialogOpen(false);
    setReportName("");
    toast.success("Report saved");
  };

  const loadReport = (r: SavedReport) => {
    setEntity(r.entity);
    setDateFrom(r.dateFrom);
    setDateTo(r.dateTo);
    setStatusFilter(r.statusFilter);
    setSelectedFields(r.selectedFields);
    setFormulaCols(r.formulaCols);
    setResults(null);
    toast.success(`Loaded "${r.name}" — click Run`);
  };

  const deleteReport = (id: string) => {
    const updated = savedReports.filter(r => r.id !== id);
    setSavedReports(updated);
    localStorage.setItem("saved_reports", JSON.stringify(updated));
    toast.success("Report deleted");
  };

  const exportCsv = () => {
    if (!results || results.length === 0) return;
    const headers = [...Object.keys(results[0]), ...formulaCols.map(f => f.name)];
    const csv = [
      headers.join(","),
      ...results.map((row, i) =>
        headers.map(h => {
          const val = computedFormulas[h] ? computedFormulas[h][i] : row[h];
          if (val === null || val === undefined) return "";
          const str = typeof val === "object" ? JSON.stringify(val) : String(val);
          return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
        }).join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `report_${entity}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const exportJson = () => {
    if (!results || results.length === 0) return;
    const enriched = results.map((row, i) => {
      const r = { ...row };
      formulaCols.forEach(fc => { r[fc.name] = computedFormulas[fc.name]?.[i]; });
      return r;
    });
    const blob = new Blob([JSON.stringify(enriched, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `report_${entity}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const toggleField = (field: string) => {
    setSelectedFields(prev => prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]);
  };

  const columns = results && results.length > 0 ? [...Object.keys(results[0]), ...formulaCols.map(f => f.name)] : [];

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Report Builder</h1>
            <p className="text-xs text-muted-foreground">Build custom reports with filters, charts, calculated columns, and saved templates</p>
          </div>
          <div className="flex gap-1">
            {savedReports.length > 0 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1 h-7 text-xs"><FolderOpen className="h-3 w-3" /> Saved ({savedReports.length})</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle className="text-sm">Saved Reports</DialogTitle></DialogHeader>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {savedReports.map(r => (
                      <div key={r.id} className="flex items-center justify-between p-2 border rounded-lg">
                        <div className="cursor-pointer flex-1" onClick={() => loadReport(r)}>
                          <p className="text-sm font-medium">{r.name}</p>
                          <p className="text-[10px] text-muted-foreground">{ENTITY_OPTIONS.find(e => e.value === r.entity)?.label} · {new Date(r.createdAt).toLocaleDateString()}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteReport(r.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><Filter className="h-4 w-4" /> Config</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs">Entity</Label>
                <Select value={entity} onValueChange={(v) => { setEntity(v); setSelectedFields([]); setResults(null); setFormulaCols([]); }}>
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

              {/* Calculated Columns */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs flex items-center gap-1"><Calculator className="h-3 w-3" /> Formulas ({formulaCols.length})</Label>
                  <Dialog open={formulaOpen} onOpenChange={setFormulaOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-5 w-5"><Plus className="h-3 w-3" /></Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle className="text-sm">Add Calculated Column</DialogTitle></DialogHeader>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs">Column Name</Label>
                          <Input className="h-8 text-xs" value={newFormula.name} onChange={e => setNewFormula({ ...newFormula, name: e.target.value })} placeholder="e.g. Running Total" />
                        </div>
                        <div>
                          <Label className="text-xs">Source Field</Label>
                          <Select value={newFormula.sourceField} onValueChange={v => setNewFormula({ ...newFormula, sourceField: v })}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select field" /></SelectTrigger>
                            <SelectContent>
                              {(results && results.length > 0 ? Object.keys(results[0]) : entityConfig?.fields || []).map(f => (
                                <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Operation</Label>
                          <Select value={newFormula.operation} onValueChange={v => setNewFormula({ ...newFormula, operation: v as any })}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {FORMULA_OPS.map(o => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        {(newFormula.operation === "multiply" || newFormula.operation === "divide") && (
                          <div>
                            <Label className="text-xs">Second Field</Label>
                            <Select value={newFormula.param || ""} onValueChange={v => setNewFormula({ ...newFormula, param: v })}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select field" /></SelectTrigger>
                              <SelectContent>
                                {(results && results.length > 0 ? Object.keys(results[0]) : entityConfig?.fields || []).map(f => (
                                  <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <Button size="sm" className="w-full" onClick={addFormula}>Add Column</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                {formulaCols.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {formulaCols.map(fc => (
                      <Badge key={fc.name} variant="secondary" className="text-[10px] gap-1">
                        {fc.name}
                        <Trash2 className="h-2.5 w-2.5 cursor-pointer opacity-60 hover:opacity-100" onClick={() => setFormulaCols(formulaCols.filter(f => f.name !== fc.name))} />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-1">
                <Button onClick={runReport} disabled={loading} className="flex-1 gap-2">
                  <Play className="h-4 w-4" /> {loading ? "Running..." : "Run Report"}
                </Button>
                {results && results.length > 0 && (
                  <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" className="h-9 w-9"><Save className="h-4 w-4" /></Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle className="text-sm">Save Report</DialogTitle></DialogHeader>
                      <div>
                        <Label className="text-xs">Report Name</Label>
                        <Input className="h-8 text-xs mt-1" value={reportName} onChange={e => setReportName(e.target.value)} placeholder="e.g. Monthly Sales Summary" />
                      </div>
                      <DialogFooter>
                        <Button size="sm" onClick={saveReport}>Save</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Results {results && <Badge variant="secondary" className="text-[10px]">{results.length} rows</Badge>}
              </CardTitle>
              {results && results.length > 0 && (
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={exportCsv} className="gap-1 h-7 text-xs">
                    <Download className="h-3 w-3" /> CSV
                  </Button>
                  <Button size="sm" variant="outline" onClick={exportJson} className="gap-1 h-7 text-xs">
                    <Download className="h-3 w-3" /> JSON
                  </Button>
                </div>
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
                <Tabs defaultValue="table">
                  <TabsList className="h-7 mb-3">
                    <TabsTrigger value="table" className="text-xs h-6 gap-1"><BarChart3 className="h-3 w-3" /> Table</TabsTrigger>
                    <TabsTrigger value="chart" className="text-xs h-6 gap-1"><TrendingUp className="h-3 w-3" /> Chart</TabsTrigger>
                    <TabsTrigger value="summary" className="text-xs h-6 gap-1"><PieChart className="h-3 w-3" /> Summary</TabsTrigger>
                  </TabsList>

                  <TabsContent value="table">
                    <div className="overflow-x-auto max-h-[600px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {columns.map(col => (
                              <TableHead key={col} className={`text-xs whitespace-nowrap ${computedFormulas[col] ? "bg-primary/5 text-primary font-semibold" : ""}`}>
                                {col} {computedFormulas[col] && <Calculator className="h-3 w-3 inline ml-0.5" />}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {results.slice(0, 100).map((row, i) => (
                            <TableRow key={i}>
                              {columns.map(col => (
                                <TableCell key={col} className={`text-xs max-w-[200px] truncate ${computedFormulas[col] ? "bg-primary/5 font-mono" : ""}`}>
                                  {computedFormulas[col] != null
                                    ? (computedFormulas[col][i] != null ? String(computedFormulas[col][i]) : "—")
                                    : row[col] === null ? <span className="text-muted-foreground italic">null</span>
                                    : typeof row[col] === "object" ? JSON.stringify(row[col]).slice(0, 60)
                                    : String(row[col]).slice(0, 60)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {results.length > 100 && <p className="text-xs text-muted-foreground text-center mt-2">Showing first 100 of {results.length}</p>}
                    </div>
                  </TabsContent>

                  <TabsContent value="chart">
                    <div className="space-y-3">
                      <div className="flex gap-2 items-end">
                        <div>
                          <Label className="text-[10px]">Label Axis</Label>
                          <Select value={chartLabel} onValueChange={setChartLabel}>
                            <SelectTrigger className="h-7 text-xs w-40"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {columns.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-[10px]">Value Axis</Label>
                          <Select value={chartValue} onValueChange={setChartValue}>
                            <SelectTrigger className="h-7 text-xs w-40"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {columns.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {chartLabel && chartValue ? (
                        <SimpleBarChart data={results} labelKey={chartLabel} valueKey={chartValue} />
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-8">Select label and value axes above</p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="summary">
                    <SummaryCards results={results} numericFields={numericFields} />
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="border rounded-lg p-3">
                        <p className="text-xs font-medium mb-2">Row Count</p>
                        <p className="text-2xl font-bold">{results.length.toLocaleString()}</p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <p className="text-xs font-medium mb-2">Columns</p>
                        <p className="text-2xl font-bold">{columns.length}</p>
                      </div>
                    </div>
                    {numericFields.length > 0 && (
                      <div className="border rounded-lg p-3 mt-3">
                        <p className="text-xs font-medium mb-2">Numeric Field Stats</p>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-[10px] h-7">Field</TableHead>
                              <TableHead className="text-[10px] h-7 text-right">Sum</TableHead>
                              <TableHead className="text-[10px] h-7 text-right">Avg</TableHead>
                              <TableHead className="text-[10px] h-7 text-right">Min</TableHead>
                              <TableHead className="text-[10px] h-7 text-right">Max</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {numericFields.slice(0, 8).map(f => {
                              const vals = results.map(r => Number(r[f]) || 0);
                              const sum = vals.reduce((a, b) => a + b, 0);
                              return (
                                <TableRow key={f}>
                                  <TableCell className="text-xs py-1 font-medium">{f}</TableCell>
                                  <TableCell className="text-xs py-1 text-right font-mono">{sum.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                                  <TableCell className="text-xs py-1 text-right font-mono">{(sum / vals.length).toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                                  <TableCell className="text-xs py-1 text-right font-mono">{Math.min(...vals).toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                                  <TableCell className="text-xs py-1 text-right font-mono">{Math.max(...vals).toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
  const { currentStore } = useAuth();
  const storeId = currentStore?.id;
  const [entity, setEntity] = useState("orders");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [results, setResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [formulaCols, setFormulaCols] = useState<FormulaCol[]>([]);
  const [formulaOpen, setFormulaOpen] = useState(false);
  const [newFormula, setNewFormula] = useState<FormulaCol>({ name: "", formula: "", sourceField: "", operation: "sum" });

  const entityConfig = ENTITY_OPTIONS.find(e => e.value === entity);

  const numericFields = useMemo(() => {
    if (!results || results.length === 0) return [];
    return Object.keys(results[0]).filter(k => typeof results[0][k] === "number" || !isNaN(Number(results[0][k])));
  }, [results]);

  const computedFormulas = useMemo(() => {
    if (!results || results.length === 0) return {};
    const map: Record<string, (string | number)[]> = {};
    formulaCols.forEach(fc => { map[fc.name] = computeFormula(results, fc); });
    return map;
  }, [results, formulaCols]);

  const addFormula = () => {
    if (!newFormula.name || !newFormula.sourceField) { toast.error("Name and source field required"); return; }
    if (formulaCols.some(f => f.name === newFormula.name)) { toast.error("Column name already exists"); return; }
    setFormulaCols([...formulaCols, { ...newFormula }]);
    setNewFormula({ name: "", formula: "", sourceField: "", operation: "sum" });
    setFormulaOpen(false);
    toast.success(`Calculated column "${newFormula.name}" added`);
  };

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
    const headers = [...Object.keys(results[0]), ...formulaCols.map(f => f.name)];
    const csv = [
      headers.join(","),
      ...results.map((row, i) =>
        headers.map(h => {
          const val = computedFormulas[h] ? computedFormulas[h][i] : row[h];
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

  const exportJson = () => {
    if (!results || results.length === 0) return;
    const enriched = results.map((row, i) => {
      const r = { ...row };
      formulaCols.forEach(fc => { r[fc.name] = computedFormulas[fc.name]?.[i]; });
      return r;
    });
    const blob = new Blob([JSON.stringify(enriched, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report_${entity}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    if (!results || results.length === 0) return;
    const headers = [...Object.keys(results[0]), ...formulaCols.map(f => f.name)];
    const tsv = "\uFEFF" + [
      headers.join("\t"),
      ...results.map((row, i) =>
        headers.map(h => {
          const val = computedFormulas[h] ? computedFormulas[h][i] : row[h];
          if (val === null || val === undefined) return "";
          return typeof val === "object" ? JSON.stringify(val) : String(val).replace(/\t/g, " ");
        }).join("\t")
      ),
    ].join("\n");
    const blob = new Blob([tsv], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report_${entity}_${new Date().toISOString().slice(0, 10)}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleField = (field: string) => {
    setSelectedFields(prev => prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]);
  };

  const columns = results && results.length > 0 ? [...Object.keys(results[0]), ...formulaCols.map(f => f.name)] : [];

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div>
          <h1 className="text-lg font-semibold">Report Builder</h1>
          <p className="text-xs text-muted-foreground">Build custom reports with filters, date ranges, and calculated columns</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><Filter className="h-4 w-4" /> Config</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs">Entity</Label>
                <Select value={entity} onValueChange={(v) => { setEntity(v); setSelectedFields([]); setResults(null); setFormulaCols([]); }}>
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

              {/* Calculated Columns */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs flex items-center gap-1"><Calculator className="h-3 w-3" /> Formulas ({formulaCols.length})</Label>
                  <Dialog open={formulaOpen} onOpenChange={setFormulaOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-5 w-5"><Plus className="h-3 w-3" /></Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle className="text-sm">Add Calculated Column</DialogTitle></DialogHeader>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs">Column Name</Label>
                          <Input className="h-8 text-xs" value={newFormula.name} onChange={e => setNewFormula({ ...newFormula, name: e.target.value })} placeholder="e.g. Running Total" />
                        </div>
                        <div>
                          <Label className="text-xs">Source Field</Label>
                          <Select value={newFormula.sourceField} onValueChange={v => setNewFormula({ ...newFormula, sourceField: v })}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select field" /></SelectTrigger>
                            <SelectContent>
                              {(results && results.length > 0 ? Object.keys(results[0]) : entityConfig?.fields || []).map(f => (
                                <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Operation</Label>
                          <Select value={newFormula.operation} onValueChange={v => setNewFormula({ ...newFormula, operation: v as any })}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {FORMULA_OPS.map(o => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        {(newFormula.operation === "multiply" || newFormula.operation === "divide") && (
                          <div>
                            <Label className="text-xs">Second Field</Label>
                            <Select value={newFormula.param || ""} onValueChange={v => setNewFormula({ ...newFormula, param: v })}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select field" /></SelectTrigger>
                              <SelectContent>
                                {(results && results.length > 0 ? Object.keys(results[0]) : entityConfig?.fields || []).map(f => (
                                  <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <Button size="sm" className="w-full" onClick={addFormula}>Add Column</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                {formulaCols.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {formulaCols.map(fc => (
                      <Badge key={fc.name} variant="secondary" className="text-[10px] gap-1">
                        {fc.name}
                        <Trash2 className="h-2.5 w-2.5 cursor-pointer opacity-60 hover:opacity-100" onClick={() => setFormulaCols(formulaCols.filter(f => f.name !== fc.name))} />
                      </Badge>
                    ))}
                  </div>
                )}
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
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={exportCsv} className="gap-1 h-7 text-xs">
                    <Download className="h-3 w-3" /> CSV
                  </Button>
                  <Button size="sm" variant="outline" onClick={exportExcel} className="gap-1 h-7 text-xs">
                    <Download className="h-3 w-3" /> Excel
                  </Button>
                  <Button size="sm" variant="outline" onClick={exportJson} className="gap-1 h-7 text-xs">
                    <Download className="h-3 w-3" /> JSON
                  </Button>
                </div>
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
                        {columns.map(col => (
                          <TableHead key={col} className={`text-xs whitespace-nowrap ${computedFormulas[col] ? "bg-primary/5 text-primary font-semibold" : ""}`}>
                            {col} {computedFormulas[col] && <Calculator className="h-3 w-3 inline ml-0.5" />}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.slice(0, 100).map((row, i) => (
                        <TableRow key={i}>
                          {columns.map(col => (
                            <TableCell key={col} className={`text-xs max-w-[200px] truncate ${computedFormulas[col] ? "bg-primary/5 font-mono" : ""}`}>
                              {computedFormulas[col] != null
                                ? (computedFormulas[col][i] != null ? String(computedFormulas[col][i]) : "—")
                                : row[col] === null ? <span className="text-muted-foreground italic">null</span>
                                : typeof row[col] === "object" ? JSON.stringify(row[col]).slice(0, 60)
                                : String(row[col]).slice(0, 60)}
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