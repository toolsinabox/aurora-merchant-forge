import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PlatformLayout } from "@/components/platform/PlatformLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

function useAllCustomers() {
  return useQuery({
    queryKey: ["platform-all-customers"],
    queryFn: async () => {
      // Fetch customers with their store name
      const { data: customers, error } = await supabase
        .from("customers")
        .select("*, stores(name)")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return customers;
    },
  });
}

export default function PlatformCustomers() {
  const { data: customers = [], isLoading } = useAllCustomers();
  const [search, setSearch] = useState("");

  const filtered = customers.filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalSpent = customers.reduce((sum: number, c: any) => sum + (c.total_spent || 0), 0);

  return (
    <PlatformLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">All Customers</h1>
            <p className="text-xs text-muted-foreground">
              {customers.length} customers across all stores · ${totalSpent.toLocaleString()} total spent
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-3 space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone…"
                className="pl-8 h-8 text-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-2xs">
                    <TableHead>Customer</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead>Segment</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Spent</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                        <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                        No customers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((c: any) => (
                      <TableRow key={c.id} className="text-xs">
                        <TableCell>
                          <div>
                            <p className="font-medium">{c.name}</p>
                            {c.email && <p className="text-2xs text-muted-foreground">{c.email}</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">{c.stores?.name || "—"}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-2xs capitalize">{c.segment}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{c.total_orders}</TableCell>
                        <TableCell className="text-right font-medium">${c.total_spent.toLocaleString()}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(c.created_at), "MMM d, yyyy")}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PlatformLayout>
  );
}
