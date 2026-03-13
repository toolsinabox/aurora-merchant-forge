import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTaxRates, useCreateTaxRate, useDeleteTaxRate } from "@/hooks/use-data";
import { Plus, Trash2, Percent, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function TaxRates() {
  const { data: rates = [], isLoading } = useTaxRates();
  const createRate = useCreateTaxRate();
  const deleteRate = useDeleteTaxRate();
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", region: "", rate: "10" });

  const resetForm = () => setForm({ name: "", region: "", rate: "10" });

  const filtered = (rates as any[]).filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.region.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!form.name.trim() || !form.region.trim()) { toast.error("Name and region required"); return; }
    await createRate.mutateAsync({ name: form.name, region: form.region, rate: Number(form.rate) || 0 });
    resetForm();
    setCreateOpen(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Tax Rates</h1>
            <p className="text-xs text-muted-foreground">{rates.length} tax rates configured</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={resetForm}><Plus className="h-4 w-4 mr-1" /> Add Tax Rate</Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle>Add Tax Rate</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Name</Label>
                  <Input placeholder="e.g. GST" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Region</Label>
                  <Input placeholder="e.g. AU, US-CA" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Rate (%)</Label>
                  <Input type="number" step="0.01" min="0" max="100" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
                </div>
                <Button onClick={handleCreate} disabled={createRate.isPending} className="w-full">Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="flex items-center gap-2 p-3 border-b">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search tax rates..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 pl-8 text-xs" />
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-8">Name</TableHead>
                  <TableHead className="text-xs h-8">Region</TableHead>
                  <TableHead className="text-xs h-8 text-right">Rate</TableHead>
                  <TableHead className="text-xs h-8 w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-6">
                      <Percent className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                      No tax rates configured.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r: any) => (
                    <TableRow key={r.id} className="text-xs">
                      <TableCell className="py-2 font-medium">{r.name}</TableCell>
                      <TableCell className="py-2 text-muted-foreground">{r.region}</TableCell>
                      <TableCell className="py-2 text-right font-medium">{Number(r.rate).toFixed(2)}%</TableCell>
                      <TableCell className="py-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteRate.mutate(r.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
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
