import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ClipboardList, Filter } from "lucide-react";
import { format } from "date-fns";

const actionColors: Record<string, string> = {
  created: "bg-success/10 text-success border-success/20",
  updated: "bg-info/10 text-info border-info/20",
  deleted: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function ActivityLog() {
  const { currentStore } = useAuth();
  const [entityFilter, setEntityFilter] = useState("all");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["activity_log", currentStore?.id, entityFilter],
    queryFn: async () => {
      if (!currentStore) return [];
      let query = supabase
        .from("activity_log")
        .select("*")
        .eq("store_id", currentStore.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (entityFilter !== "all") {
        query = query.eq("entity_type", entityFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!currentStore,
  });

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Activity Log</h1>
            <p className="text-xs text-muted-foreground">Track all changes made to your store</p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Types</SelectItem>
                <SelectItem value="product" className="text-xs">Products</SelectItem>
                <SelectItem value="order" className="text-xs">Orders</SelectItem>
                <SelectItem value="customer" className="text-xs">Customers</SelectItem>
                <SelectItem value="settings" className="text-xs">Settings</SelectItem>
                <SelectItem value="inventory" className="text-xs">Inventory</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-8">Action</TableHead>
                  <TableHead className="text-xs h-8">Type</TableHead>
                  <TableHead className="text-xs h-8">Details</TableHead>
                  <TableHead className="text-xs h-8">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
                  ))
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12">
                      <ClipboardList className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No activity recorded yet</p>
                      <p className="text-2xs text-muted-foreground mt-1">Actions like creating products, updating orders, etc. will appear here</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log: any) => (
                    <TableRow key={log.id} className="text-xs">
                      <TableCell className="py-2">
                        <Badge variant="outline" className={`text-2xs ${actionColors[log.action] || ""}`}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 capitalize font-medium">{log.entity_type}</TableCell>
                      <TableCell className="py-2 text-muted-foreground max-w-xs truncate">
                        {log.details?.message || log.details?.title || log.entity_id || "—"}
                      </TableCell>
                      <TableCell className="py-2 text-muted-foreground">
                        {format(new Date(log.created_at), "MMM d, h:mm a")}
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
