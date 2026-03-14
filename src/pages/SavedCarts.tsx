import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShoppingCart, Trash2, Eye, DollarSign, Users, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TablePagination } from "@/components/admin/TablePagination";

export default function SavedCarts() {
  const { currentStore } = useAuth();
  const storeId = currentStore?.id;
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [viewCart, setViewCart] = useState<any>(null);

  const { data: carts = [] } = useQuery({
    queryKey: ["saved-carts", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data } = await supabase.from("saved_carts").select("*, customers(name, email)").eq("store_id", storeId!).order("updated_at", { ascending: false });
      return data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("saved_carts").delete().eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-carts"] });
      toast.success("Saved cart deleted");
    },
  });

  const paged = carts.slice((page - 1) * pageSize, page * pageSize);
  const totalValue = carts.reduce((s: number, c: any) => s + (c.cart_total || 0), 0);
  const uniqueCustomers = new Set(carts.map((c: any) => c.customer_id)).size;

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div>
          <h1 className="text-lg font-semibold">Saved Carts</h1>
          <p className="text-xs text-muted-foreground">Customer carts saved for later purchase</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <ShoppingCart className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-xs text-muted-foreground">Saved Carts</p>
              <p className="text-2xl font-bold">{carts.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <DollarSign className="h-5 w-5 mx-auto mb-1 text-green-600" />
              <p className="text-xs text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold">${totalValue.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <Users className="h-5 w-5 mx-auto mb-1 text-blue-600" />
              <p className="text-xs text-muted-foreground">Unique Customers</p>
              <p className="text-2xl font-bold">{uniqueCustomers}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">All Saved Carts</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Cart Name</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Saved</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((cart: any) => {
                  const items = Array.isArray(cart.cart_items) ? cart.cart_items : [];
                  return (
                    <TableRow key={cart.id}>
                      <TableCell>
                        <div className="text-sm font-medium">{(cart as any).customers?.name || "Unknown"}</div>
                        <div className="text-xs text-muted-foreground">{(cart as any).customers?.email}</div>
                      </TableCell>
                      <TableCell className="text-sm">{cart.name}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{items.length} items</Badge></TableCell>
                      <TableCell className="font-medium">${(cart.cart_total || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(cart.updated_at).toLocaleDateString()}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewCart(cart)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(cart.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {paged.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No saved carts</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination page={page} pageSize={pageSize} total={carts.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!viewCart} onOpenChange={() => setViewCart(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cart: {viewCart?.name}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Customer: {viewCart?.customers?.name} ({viewCart?.customers?.email})</p>
            <div className="border rounded-lg divide-y">
              {(Array.isArray(viewCart?.cart_items) ? viewCart.cart_items : []).map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-center px-3 py-2 text-sm">
                  <div>
                    <span className="font-medium">{item.title || item.name || "Item"}</span>
                    <span className="text-muted-foreground ml-2">× {item.quantity || 1}</span>
                  </div>
                  <span className="font-medium">${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-2 font-medium">
              <span>Total</span>
              <span>${(viewCart?.cart_total || 0).toFixed(2)}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
