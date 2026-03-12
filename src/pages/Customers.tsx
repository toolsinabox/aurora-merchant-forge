import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockCustomers } from "@/lib/mock-data";
import { Search, Plus, Users, DollarSign, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Customers() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [segFilter, setSegFilter] = useState("all");

  const filtered = mockCustomers.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    const matchSeg = segFilter === "all" || c.segment === segFilter;
    return matchSearch && matchSeg;
  });

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Customers</h1>
            <p className="text-xs text-muted-foreground">{mockCustomers.length} total customers</p>
          </div>
          <Button size="sm" className="h-8 text-xs gap-1"><Plus className="h-3.5 w-3.5" /> Add Customer</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card><CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div><p className="text-2xs text-muted-foreground">Total Customers</p><p className="text-lg font-bold">{mockCustomers.length}</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-success" />
            <div><p className="text-2xs text-muted-foreground">Total Revenue</p><p className="text-lg font-bold">${mockCustomers.reduce((s, c) => s + c.totalSpent, 0).toLocaleString()}</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-info" />
            <div><p className="text-2xs text-muted-foreground">Avg. Orders</p><p className="text-lg font-bold">{(mockCustomers.reduce((s, c) => s + c.totalOrders, 0) / mockCustomers.length).toFixed(1)}</p></div>
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
                  <TableHead className="text-xs h-8">Last Order</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id} className="text-xs cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/customers/${c.id}`)}>
                    <TableCell className="py-2 font-medium">{c.name}</TableCell>
                    <TableCell className="py-2 text-muted-foreground">{c.email}</TableCell>
                    <TableCell className="py-2"><StatusBadge status={c.segment} /></TableCell>
                    <TableCell className="py-2 text-right">{c.totalOrders}</TableCell>
                    <TableCell className="py-2 text-right font-medium">${c.totalSpent.toLocaleString()}</TableCell>
                    <TableCell className="py-2 text-muted-foreground">{c.lastOrder}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
