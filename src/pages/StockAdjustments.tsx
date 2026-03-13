import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useStockAdjustments } from "@/hooks/use-data";
import { Search, History, ArrowUp, ArrowDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function StockAdjustments() {
  const { data: adjustments = [], isLoading } = useStockAdjustments();
  const [search, setSearch] = useState("");

  const filtered = (adjustments as any[]).filter((a) =>
    (a.reason || "").toLowerCase().includes(search.toLowerCase()) ||
    (a.profiles?.display_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div>
          <h1 className="text-lg font-semibold">Stock Adjustments</h1>
          <p className="text-xs text-muted-foreground">{adjustments.length} adjustments recorded</p>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="flex items-center gap-2 p-3 border-b">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search adjustments..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 pl-8 text-xs" />
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-8">Date</TableHead>
                  <TableHead className="text-xs h-8">Adjusted By</TableHead>
                  <TableHead className="text-xs h-8">Change</TableHead>
                  <TableHead className="text-xs h-8">Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-6">
                      <History className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                      No stock adjustments recorded.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((a: any) => (
                    <TableRow key={a.id} className="text-xs">
                      <TableCell className="py-2 text-muted-foreground">
                        {format(new Date(a.created_at), "MMM d, yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="py-2">{a.profiles?.display_name || "System"}</TableCell>
                      <TableCell className="py-2">
                        <Badge variant={a.quantity_change > 0 ? "default" : "destructive"} className="text-[10px] gap-0.5">
                          {a.quantity_change > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                          {a.quantity_change > 0 ? `+${a.quantity_change}` : a.quantity_change}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 max-w-[300px] truncate">{a.reason || "—"}</TableCell>
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
