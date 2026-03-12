import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { mockCustomers, mockOrders } from "@/lib/mock-data";
import { ArrowLeft, Mail, Phone, Calendar } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const customer = mockCustomers.find((c) => c.id === id);

  if (!customer) return <AdminLayout><p className="text-sm">Customer not found.</p></AdminLayout>;

  const customerOrders = mockOrders.slice(0, 3); // mock: show some orders

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/customers")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">{customer.name}</h1>
            <p className="text-xs text-muted-foreground">Customer since {customer.createdAt}</p>
          </div>
          <StatusBadge status={customer.segment} className="ml-2" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="space-y-3">
            <Card>
              <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Contact</CardTitle></CardHeader>
              <CardContent className="p-4 pt-2 space-y-2">
                <div className="flex items-center gap-2 text-xs"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> {customer.email}</div>
                <div className="flex items-center gap-2 text-xs"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> {customer.phone}</div>
                <div className="flex items-center gap-2 text-xs"><Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Joined {customer.createdAt}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Stats</CardTitle></CardHeader>
              <CardContent className="p-4 pt-2 space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Total Orders</span><span className="font-medium">{customer.totalOrders}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total Spent</span><span className="font-medium">${customer.totalSpent.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Avg. Order</span><span className="font-medium">${(customer.totalSpent / customer.totalOrders).toFixed(2)}</span></div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Order History</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs h-8">Order</TableHead>
                      <TableHead className="text-xs h-8">Status</TableHead>
                      <TableHead className="text-xs h-8 text-right">Total</TableHead>
                      <TableHead className="text-xs h-8">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerOrders.map((o) => (
                      <TableRow key={o.id} className="text-xs">
                        <TableCell className="py-2 font-medium">{o.orderNumber}</TableCell>
                        <TableCell className="py-2"><StatusBadge status={o.status} /></TableCell>
                        <TableCell className="py-2 text-right">${o.total.toFixed(2)}</TableCell>
                        <TableCell className="py-2 text-muted-foreground">{o.date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
