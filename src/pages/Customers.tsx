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
import { Checkbox } from "@/components/ui/checkbox";
import { useCustomers, useCreateCustomer } from "@/hooks/use-data";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Search, Plus, Users, DollarSign, ShoppingCart, Download, Upload, Loader2, Merge, Tag, UserCog } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { TablePagination } from "@/components/admin/TablePagination";

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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedForMerge, setSelectedForMerge] = useState<string[]>([]);
  const [showMerge, setShowMerge] = useState(false);
  const [merging, setMerging] = useState(false);
  const [primaryId, setPrimaryId] = useState<string>("");

  // Bulk tag/group state
  const [bulkTagInput, setBulkTagInput] = useState("");
  const [bulkTagAction, setBulkTagAction] = useState<"add" | "remove">("add");
  const [showBulkTag, setShowBulkTag] = useState(false);
  const [bulkGroupId, setBulkGroupId] = useState("");
  const [showBulkGroup, setShowBulkGroup] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [customerGroups, setCustomerGroups] = useState<any[]>([]);

  // Load customer groups for bulk assignment
  useState(() => {
    if (currentStore) {
      supabase.from("customer_groups").select("id, name").eq("store_id", currentStore.id).order("name").then(({ data }) => {
        setCustomerGroups(data || []);
      });
    }
  });

  const handleBulkTagUpdate = async () => {
    if (!bulkTagInput.trim() || selectedForMerge.length === 0 || !currentStore) return;
    setBulkProcessing(true);
    const tag = bulkTagInput.trim();
    try {
      for (const id of selectedForMerge) {
        const customer = customers.find(c => c.id === id);
        if (!customer) continue;
        const currentTags: string[] = customer.tags || [];
        const newTags = bulkTagAction === "add"
          ? [...new Set([...currentTags, tag])]
          : currentTags.filter(t => t !== tag);
        await supabase.from("customers").update({ tags: newTags } as any).eq("id", id);
      }
      toast.success(`${bulkTagAction === "add" ? "Added" : "Removed"} tag "${tag}" on ${selectedForMerge.length} customers`);
      setShowBulkTag(false);
      setBulkTagInput("");
      setSelectedForMerge([]);
      qc.invalidateQueries({ queryKey: ["customers"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkGroupUpdate = async () => {
    if (!bulkGroupId || selectedForMerge.length === 0) return;
    setBulkProcessing(true);
    try {
      const groupVal = bulkGroupId === "none" ? null : bulkGroupId;
      const { error } = await supabase.from("customers")
        .update({ customer_group_id: groupVal } as any)
        .in("id", selectedForMerge);
      if (error) throw error;
      toast.success(`Updated group for ${selectedForMerge.length} customers`);
      setShowBulkGroup(false);
      setBulkGroupId("");
      setSelectedForMerge([]);
      qc.invalidateQueries({ queryKey: ["customers"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBulkProcessing(false);
    }
  };

  const toggleMergeSelection = (id: string) => {
    setSelectedForMerge(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleMerge = async () => {
    if (!primaryId || selectedForMerge.length < 2 || !currentStore) return;
    setMerging(true);
    try {
      const secondaryIds = selectedForMerge.filter(id => id !== primaryId);
      // Reassign orders from secondary customers to primary
      for (const secId of secondaryIds) {
        await supabase.from("orders").update({ customer_id: primaryId } as any).eq("customer_id", secId).eq("store_id", currentStore.id);
      }
      // Sum up totals from secondary customers
      const secondaryCustomers = customers.filter(c => secondaryIds.includes(c.id));
      const primaryCustomer = customers.find(c => c.id === primaryId);
      if (primaryCustomer) {
        const totalOrders = secondaryCustomers.reduce((s, c) => s + c.total_orders, primaryCustomer.total_orders);
        const totalSpent = secondaryCustomers.reduce((s, c) => s + Number(c.total_spent), Number(primaryCustomer.total_spent));
        await supabase.from("customers").update({ total_orders: totalOrders, total_spent: totalSpent } as any).eq("id", primaryId);
      }
      // Delete secondary customers
      for (const secId of secondaryIds) {
        await supabase.from("customers").delete().eq("id", secId);
      }
      toast.success(`Merged ${secondaryIds.length} customers into primary record`);
      setSelectedForMerge([]);
      setShowMerge(false);
      setPrimaryId("");
      qc.invalidateQueries({ queryKey: ["customers"] });
    } catch (err: any) {
      toast.error(err.message || "Merge failed");
    } finally {
      setMerging(false);
    }
  };

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
        <div className="page-header">
          <div>
            <h1 className="text-lg font-semibold">Customers</h1>
            <p className="text-xs text-muted-foreground">{customers.length} total customers</p>
          </div>
          <div className="page-header-actions">
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => fileRef.current?.click()} disabled={importing}>
              {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} <span className="btn-label">Import</span>
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" /> <span className="btn-label">Export</span>
            </Button>
            {selectedForMerge.length >= 2 && (
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => { setPrimaryId(selectedForMerge[0]); setShowMerge(true); }}>
                <Merge className="h-3.5 w-3.5" /> Merge ({selectedForMerge.length})
              </Button>
            )}
            {selectedForMerge.length >= 1 && (
              <>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => setShowBulkTag(true)}>
                  <Tag className="h-3.5 w-3.5" /> Tags ({selectedForMerge.length})
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => setShowBulkGroup(true)}>
                  <UserCog className="h-3.5 w-3.5" /> Group ({selectedForMerge.length})
                </Button>
              </>
            )}
            <Button size="sm" className="h-8 text-xs gap-1" onClick={() => setShowCreate(true)}><Plus className="h-3.5 w-3.5" /> <span className="btn-label">Add Customer</span></Button>
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 border-b">
              <div className="relative flex-1 w-full sm:max-w-xs">
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
            <div className="table-scroll">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-8 w-8"></TableHead>
                  <TableHead className="text-xs h-8">Name</TableHead>
                  <TableHead className="text-xs h-8">Email</TableHead>
                  <TableHead className="text-xs h-8">Segment</TableHead>
                  <TableHead className="text-xs h-8 text-right">Orders</TableHead>
                  <TableHead className="text-xs h-8 text-right">Total Spent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-4 w-full" /></TableCell></TableRow>)
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-6">No customers yet.</TableCell></TableRow>
                ) : (
                  filtered.slice((page - 1) * pageSize, page * pageSize).map((c) => (
                    <TableRow key={c.id} className="text-xs cursor-pointer hover:bg-muted/50">
                      <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={selectedForMerge.includes(c.id)} onCheckedChange={() => toggleMergeSelection(c.id)} />
                      </TableCell>
                      <TableCell className="py-2 font-medium" onClick={() => navigate(`/customers/${c.id}`)}>{c.name}</TableCell>
                      <TableCell className="py-2 text-muted-foreground" onClick={() => navigate(`/customers/${c.id}`)}>{c.email || "—"}</TableCell>
                      <TableCell className="py-2" onClick={() => navigate(`/customers/${c.id}`)}><StatusBadge status={c.segment} /></TableCell>
                      <TableCell className="py-2 text-right" onClick={() => navigate(`/customers/${c.id}`)}>{c.total_orders}</TableCell>
                      <TableCell className="py-2 text-right font-medium" onClick={() => navigate(`/customers/${c.id}`)}>${Number(c.total_spent).toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
            <TablePagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
          </CardContent>
        </Card>

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Customer</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Name *</Label>
                <Input value={newCustomer.name} onChange={(e) => setNewCustomer(p => ({ ...p, name: e.target.value }))} placeholder="Customer name" className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input type="email" value={newCustomer.email} onChange={(e) => setNewCustomer(p => ({ ...p, email: e.target.value }))} placeholder="email@example.com" className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Phone</Label>
                <Input value={newCustomer.phone} onChange={(e) => setNewCustomer(p => ({ ...p, phone: e.target.value }))} placeholder="+1 555-0100" className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Segment</Label>
                <Select value={newCustomer.segment} onValueChange={(v) => setNewCustomer(p => ({ ...p, segment: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new" className="text-xs">New</SelectItem>
                    <SelectItem value="returning" className="text-xs">Returning</SelectItem>
                    <SelectItem value="vip" className="text-xs">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button size="sm" disabled={!newCustomer.name || createCustomer.isPending} onClick={() => {
                createCustomer.mutate({
                  name: newCustomer.name,
                  email: newCustomer.email || undefined,
                  phone: newCustomer.phone || undefined,
                  segment: newCustomer.segment,
                }, {
                  onSuccess: () => {
                    setShowCreate(false);
                    setNewCustomer({ name: "", email: "", phone: "", segment: "new" });
                  }
                });
              }}>
                {createCustomer.isPending ? "Creating..." : "Create Customer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Merge Dialog */}
        <Dialog open={showMerge} onOpenChange={setShowMerge}>
          <DialogContent>
            <DialogHeader><DialogTitle>Merge Customers</DialogTitle></DialogHeader>
            <p className="text-xs text-muted-foreground">Select the primary record. Orders and data from the others will be merged into it, and duplicates will be deleted.</p>
            <div className="space-y-2 my-2">
              {selectedForMerge.map(id => {
                const c = customers.find(x => x.id === id);
                if (!c) return null;
                return (
                  <label key={id} className="flex items-center gap-2 p-2 rounded border text-xs cursor-pointer hover:bg-muted/50">
                    <input type="radio" name="primaryCustomer" checked={primaryId === id} onChange={() => setPrimaryId(id)} className="accent-primary" />
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted-foreground">{c.email || "No email"}</span>
                    <span className="ml-auto text-muted-foreground">{c.total_orders} orders · ${Number(c.total_spent).toLocaleString()}</span>
                    {primaryId === id && <span className="text-primary text-[10px] font-semibold">PRIMARY</span>}
                  </label>
                );
              })}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMerge(false)}>Cancel</Button>
              <Button onClick={handleMerge} disabled={!primaryId || merging} className="gap-1">
                {merging ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Merge className="h-3.5 w-3.5" />}
                Merge Customers
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Tag Dialog */}
        <Dialog open={showBulkTag} onOpenChange={setShowBulkTag}>
          <DialogContent>
            <DialogHeader><DialogTitle>Bulk Tag Assignment</DialogTitle></DialogHeader>
            <p className="text-xs text-muted-foreground">Add or remove a tag on {selectedForMerge.length} selected customers.</p>
            <div className="space-y-3 my-2">
              <div className="flex gap-2">
                <Select value={bulkTagAction} onValueChange={(v) => setBulkTagAction(v as "add" | "remove")}>
                  <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add" className="text-xs">Add tag</SelectItem>
                    <SelectItem value="remove" className="text-xs">Remove tag</SelectItem>
                  </SelectContent>
                </Select>
                <Input value={bulkTagInput} onChange={(e) => setBulkTagInput(e.target.value)} placeholder="Tag name" className="h-8 text-xs" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setShowBulkTag(false)}>Cancel</Button>
              <Button size="sm" onClick={handleBulkTagUpdate} disabled={!bulkTagInput.trim() || bulkProcessing}>
                {bulkProcessing ? "Processing..." : `${bulkTagAction === "add" ? "Add" : "Remove"} Tag`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Group Dialog */}
        <Dialog open={showBulkGroup} onOpenChange={setShowBulkGroup}>
          <DialogContent>
            <DialogHeader><DialogTitle>Bulk Group Assignment</DialogTitle></DialogHeader>
            <p className="text-xs text-muted-foreground">Move {selectedForMerge.length} selected customers to a group.</p>
            <div className="my-2">
              <Select value={bulkGroupId} onValueChange={setBulkGroupId}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select group" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">No Group</SelectItem>
                  {customerGroups.map(g => (
                    <SelectItem key={g.id} value={g.id} className="text-xs">{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setShowBulkGroup(false)}>Cancel</Button>
              <Button size="sm" onClick={handleBulkGroupUpdate} disabled={!bulkGroupId || bulkProcessing}>
                {bulkProcessing ? "Processing..." : "Update Group"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
