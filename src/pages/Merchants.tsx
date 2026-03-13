import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Store, Package, ShoppingCart, Users, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface MerchantStore {
  id: string;
  name: string;
  slug: string | null;
  currency: string;
  contact_email: string | null;
  logo_url: string | null;
  owner_id: string;
  created_at: string;
  product_count: number;
  order_count: number;
  owner_name: string;
  owner_avatar: string | null;
}

function useMerchants() {
  return useQuery({
    queryKey: ["platform-merchants"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("list-merchants");
      if (response.error) throw response.error;
      return response.data as MerchantStore[];
    },
  });
}

export default function Merchants() {
  const { data: merchants = [], isLoading, error } = useMerchants();
  const [search, setSearch] = useState("");

  const filtered = merchants.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.contact_email || "").toLowerCase().includes(search.toLowerCase()) ||
    m.owner_name.toLowerCase().includes(search.toLowerCase())
  );

  const totalProducts = merchants.reduce((s, m) => s + m.product_count, 0);
  const totalOrders = merchants.reduce((s, m) => s + m.order_count, 0);

  if (error) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Store className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h2 className="text-lg font-semibold">Access Denied</h2>
          <p className="text-sm text-muted-foreground mt-1">
            You need platform admin privileges to view all merchants.
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div>
          <h1 className="text-lg font-semibold">Merchants</h1>
          <p className="text-xs text-muted-foreground">{merchants.length} registered stores</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card><CardContent className="p-4 flex items-center gap-3">
            <Store className="h-8 w-8 text-primary" />
            <div><p className="text-2xs text-muted-foreground">Total Stores</p><p className="text-lg font-bold">{merchants.length}</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <Package className="h-8 w-8 text-accent-foreground" />
            <div><p className="text-2xs text-muted-foreground">Total Products</p><p className="text-lg font-bold">{totalProducts}</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-muted-foreground" />
            <div><p className="text-2xs text-muted-foreground">Total Orders</p><p className="text-lg font-bold">{totalOrders}</p></div>
          </CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-3 space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search merchants…" className="pl-8 h-8 text-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-2xs">
                    <TableHead>Store</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="text-center">Products</TableHead>
                    <TableHead className="text-center">Orders</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                        No merchants found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((m) => (
                      <TableRow key={m.id} className="text-xs">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={m.logo_url || undefined} />
                              <AvatarFallback className="text-2xs">{m.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{m.name}</p>
                              {m.contact_email && <p className="text-2xs text-muted-foreground">{m.contact_email}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={m.owner_avatar || undefined} />
                              <AvatarFallback className="text-[9px]">{m.owner_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span>{m.owner_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{m.product_count}</TableCell>
                        <TableCell className="text-center">{m.order_count}</TableCell>
                        <TableCell>
                          {m.slug ? (
                            <Badge variant="secondary" className="text-2xs font-mono">{m.slug}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(m.created_at), "MMM d, yyyy")}
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
    </AdminLayout>
  );
}
