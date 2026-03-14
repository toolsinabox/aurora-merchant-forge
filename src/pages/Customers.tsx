import { useState, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCustomers, useCreateCustomer } from "@/hooks/use-data";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Search, Plus, Users, DollarSign, ShoppingCart, Download, Upload, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

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

export default function Customers() {
  const navigate = useNavigate();
  const { data: customers = [], isLoading } = useCustomers();
  const createCustomer = useCreateCustomer();
  const { currentStore } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [segFilter, setSegFilter] = useState("all");
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", email: "", phone: "", segment: "new" });

  const filtered = customers.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || (c.email || "").toLowerCase().includes(search.toLowerCase());
    const matchSeg = segFilter === "all" || c.segment === segFilter;
    return matchSearch && matchSeg;
  });

  const totalRevenue = customers.reduce((s, c) => s + Number(c.total_spent), 0);
  const avgOrders = customers.length > 0 ? (customers.reduce((s, c) => s + c.total_orders, 0) / customers.length).toFixed(1) : "0";

  const handleExport = () => {
    const data = filtered.map((c) => ({
      name: c.name,
      email: c.email || "",
      phone: c.phone || "",
      segment: c.segment,
      total_orders: c.total_orders,
      total_spent: c.total_spent,
      tags: (c.tags || []).join("; "),
      created_at: c.created_at,
    }));
    downloadCSV(data, `customers-${new Date().toISOString().split("T")[0]}.csv`);
    toast.success(`Exported ${data.length} customers`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentStore) return;
    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split("\n").filter(Boolean);
      if (lines.length < 2) { toast.error("CSV must have header + data rows"); return; }
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/"/g, ""));
      const nameIdx = headers.findIndex(h => h === "name");
      const emailIdx = headers.findIndex(h => h === "email");
      const phoneIdx = headers.findIndex(h => h === "phone");
      const segIdx = headers.findIndex(h => h === "segment");
      const tagsIdx = headers.findIndex(h => h === "tags");
      if (nameIdx === -1) { toast.error("CSV must have a 'name' column"); return; }

      const rows = lines.slice(1).map(line => {
        const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
        return {
          store_id: currentStore.id,
          name: cols[nameIdx] || "Unknown",
          email: emailIdx >= 0 ? cols[emailIdx] || null : null,
          phone: phoneIdx >= 0 ? cols[phoneIdx] || null : null,
          segment: segIdx >= 0 ? cols[segIdx] || "new" : "new",
          tags: tagsIdx >= 0 && cols[tagsIdx] ? cols[tagsIdx].split(";").map((t: string) => t.trim()).filter(Boolean) : null,
        };
      });

      const { error } = await supabase.from("customers").insert(rows as any);
      if (error) throw error;
      toast.success(`Imported ${rows.length} customers`);
      qc.invalidateQueries({ queryKey: ["customers"] });
    } catch (err: any) {
      toast.error(err.message || "Import failed");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">Customers</h1>
            <p className="text-xs text-muted-foreground">{customers.length} total customers</p>
          </div>
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => fileRef.current?.click()} disabled={importing}>
              {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Import
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
            <Button size="sm" className="h-8 text-xs gap-1"><Plus className="h-3.5 w-3.5" /> Add Customer</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 stagger-children">
          <Card className="card-hover"><CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div><p className="text-2xs text-muted-foreground">Total Customers</p><p className="text-lg font-bold">{customers.length}</p></div>
          </CardContent></Card>
          <Card className="card-hover"><CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-success" />
            </div>
            <div><p className="text-2xs text-muted-foreground">Total Revenue</p><p className="text-lg font-bold">${totalRevenue.toLocaleString()}</p></div>
          </CardContent></Card>
          <Card className="card-hover"><CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-info" />
            </div>
            <div><p className="text-2xs text-muted-foreground">Avg. Orders</p><p className="text-lg font-bold">{avgOrders}</p></div>
          </CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="flex items-center gap-2 p-3 border-b">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 pl-8 text-xs" />
              </div>
              <Select value={segFilter} onValueChange={setSegFilter}>
                <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All</SelectItem>
                  <SelectItem value="new" className="text-xs">New</SelectItem>
                  <SelectItem value="returning" className="text-xs">Returning</SelectItem>
                  <SelectItem value="vip" className="text-xs">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-8">Name</TableHead>
                  <TableHead className="text-xs h-8">Email</TableHead>
                  <TableHead className="text-xs h-8">Segment</TableHead>
                  <TableHead className="text-xs h-8 text-right">Orders</TableHead>
                  <TableHead className="text-xs h-8 text-right">Total Spent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-4 w-full" /></TableCell></TableRow>)
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-6">No customers yet.</TableCell></TableRow>
                ) : (
                  filtered.map((c) => (
                    <TableRow key={c.id} className="text-xs cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/customers/${c.id}`)}>
                      <TableCell className="py-2 font-medium">{c.name}</TableCell>
                      <TableCell className="py-2 text-muted-foreground">{c.email || "—"}</TableCell>
                      <TableCell className="py-2"><StatusBadge status={c.segment} /></TableCell>
                      <TableCell className="py-2 text-right">{c.total_orders}</TableCell>
                      <TableCell className="py-2 text-right font-medium">${Number(c.total_spent).toLocaleString()}</TableCell>
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
