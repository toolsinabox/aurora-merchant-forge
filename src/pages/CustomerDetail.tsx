import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useCustomer, useOrders, useCustomerAddresses, useCreateCustomerAddress, useDeleteCustomerAddress, useCustomerGroups } from "@/hooks/use-data";
import { ArrowLeft, Mail, Phone, Calendar, MapPin, Plus, Trash2, Save, Tag, FileText, Merge } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: customer, isLoading } = useCustomer(id);
  const { data: orders = [] } = useOrders();
  const { data: addresses = [], isLoading: loadingAddresses } = useCustomerAddresses(id);
  const createAddress = useCreateCustomerAddress();
  const deleteAddress = useDeleteCustomerAddress();
  const { data: customerGroups = [] } = useCustomerGroups();

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", notes: "", segment: "", tags: "", customer_group_id: "" });
  const [addrOpen, setAddrOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeEmail, setMergeEmail] = useState("");
  const [mergeTarget, setMergeTarget] = useState<any>(null);
  const [merging, setMerging] = useState(false);
  const [addrForm, setAddrForm] = useState({
    label: "Home", first_name: "", last_name: "", company: "",
    address_line1: "", address_line2: "", city: "", state: "", postal_code: "", country: "AU", phone: "",
    is_default_shipping: false, is_default_billing: false,
  });

  if (isLoading) return <AdminLayout><Skeleton className="h-64 w-full" /></AdminLayout>;
  if (!customer) return <AdminLayout><p className="text-sm">Customer not found.</p></AdminLayout>;

  const customerOrders = orders.filter((o: any) => o.customer_id === customer.id);

  const startEdit = () => {
    setEditForm({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
      notes: customer.notes || "",
      segment: customer.segment,
      tags: (customer.tags || []).join(", "),
      customer_group_id: (customer as any).customer_group_id || "",
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    const tags = editForm.tags.split(",").map((t) => t.trim()).filter(Boolean);
    const { error } = await supabase
      .from("customers")
      .update({
        name: editForm.name,
        email: editForm.email || null,
        phone: editForm.phone || null,
        notes: editForm.notes || null,
        segment: editForm.segment,
        tags,
        customer_group_id: editForm.customer_group_id || null,
      } as any)
      .eq("id", customer.id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["customer", id] });
    qc.invalidateQueries({ queryKey: ["customers"] });
    toast.success("Customer updated");
    setEditing(false);
  };

  const handleCreateAddress = async () => {
    if (!addrForm.address_line1.trim()) { toast.error("Address line 1 required"); return; }
    await createAddress.mutateAsync({ ...addrForm, customer_id: customer.id });
    setAddrOpen(false);
    setAddrForm({
      label: "Home", first_name: "", last_name: "", company: "",
      address_line1: "", address_line2: "", city: "", state: "", postal_code: "", country: "AU", phone: "",
      is_default_shipping: false, is_default_billing: false,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/customers")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">{customer.name}</h1>
            <p className="text-xs text-muted-foreground">Customer since {new Date(customer.created_at).toLocaleDateString()}</p>
          </div>
          <StatusBadge status={customer.segment} />
          {!editing && (
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" className="text-xs" onClick={() => navigate(`/customers/${id}/statement`)}>
                <FileText className="h-3 w-3 mr-1" />Statement
              </Button>
              <Button size="sm" variant="outline" className="text-xs" onClick={startEdit}>Edit</Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="space-y-3">
            {/* Contact / Edit Card */}
            <Card>
              <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Contact</CardTitle></CardHeader>
              <CardContent className="p-4 pt-2 space-y-2">
                {editing ? (
                  <div className="space-y-2">
                    <div><Label className="text-xs">Name</Label><Input className="h-8 text-xs" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
                    <div><Label className="text-xs">Email</Label><Input className="h-8 text-xs" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></div>
                    <div><Label className="text-xs">Phone</Label><Input className="h-8 text-xs" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></div>
                    <div>
                      <Label className="text-xs">Segment</Label>
                      <Select value={editForm.segment} onValueChange={(v) => setEditForm({ ...editForm, segment: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new" className="text-xs">New</SelectItem>
                          <SelectItem value="returning" className="text-xs">Returning</SelectItem>
                          <SelectItem value="vip" className="text-xs">VIP</SelectItem>
                          <SelectItem value="wholesale" className="text-xs">Wholesale</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {(customerGroups as any[]).length > 0 && (
                      <div>
                        <Label className="text-xs">Customer Group</Label>
                        <Select value={editForm.customer_group_id} onValueChange={(v) => setEditForm({ ...editForm, customer_group_id: v })}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="No group" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="" className="text-xs">No Group</SelectItem>
                            {(customerGroups as any[]).map((g: any) => (
                              <SelectItem key={g.id} value={g.id} className="text-xs">{g.name}{g.discount_percent > 0 ? ` (${g.discount_percent}% off)` : ""}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div><Label className="text-xs">Tags (comma separated)</Label><Input className="h-8 text-xs" value={editForm.tags} onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })} placeholder="vip, wholesale" /></div>
                    <div><Label className="text-xs">Notes</Label><Textarea className="text-xs min-h-[60px]" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} /></div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 text-xs" onClick={saveEdit}><Save className="h-3 w-3 mr-1" />Save</Button>
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => setEditing(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-xs"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> {customer.email || "—"}</div>
                    <div className="flex items-center gap-2 text-xs"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> {customer.phone || "—"}</div>
                    <div className="flex items-center gap-2 text-xs"><Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Joined {new Date(customer.created_at).toLocaleDateString()}</div>
                    {(customer as any).customer_group_id && (customerGroups as any[]).length > 0 && (
                      <div className="flex items-center gap-2 text-xs mt-1">
                        <Badge variant="outline" className="text-[10px]">
                          {(customerGroups as any[]).find((g: any) => g.id === (customer as any).customer_group_id)?.name || "Group"}
                        </Badge>
                      </div>
                    )}
                    {customer.tags && customer.tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap mt-1">
                        <Tag className="h-3 w-3 text-muted-foreground" />
                        {customer.tags.map((t: string) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
                      </div>
                    )}
                    {customer.notes && <p className="text-xs text-muted-foreground mt-2 bg-muted/50 rounded p-2">{customer.notes}</p>}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Stats</CardTitle></CardHeader>
              <CardContent className="p-4 pt-2 space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Total Orders</span><span className="font-medium">{customer.total_orders}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total Spent</span><span className="font-medium">${Number(customer.total_spent).toLocaleString()}</span></div>
                {customer.total_orders > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Avg. Order</span><span className="font-medium">${(Number(customer.total_spent) / customer.total_orders).toFixed(2)}</span></div>
                )}
                {customer.total_orders > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer Lifetime Value</span>
                    <span className="font-medium text-primary">${Number(customer.total_spent).toLocaleString()}</span>
                  </div>
                )}
                {customerOrders.length >= 2 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg. Days Between Orders</span>
                    <span className="font-medium">
                      {(() => {
                        const dates = customerOrders.map((o: any) => new Date(o.created_at).getTime()).sort();
                        const gaps = dates.slice(1).map((d: number, i: number) => (d - dates[i]) / (1000 * 60 * 60 * 24));
                        return Math.round(gaps.reduce((s: number, g: number) => s + g, 0) / gaps.length);
                      })()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-3">
            {/* Addresses */}
            <Card>
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Addresses</CardTitle>
                <Dialog open={addrOpen} onOpenChange={setAddrOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="text-xs h-7"><Plus className="h-3 w-3 mr-1" />Add</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle className="text-sm">Add Address</DialogTitle></DialogHeader>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div><Label className="text-xs">Label</Label><Input className="h-8 text-xs" value={addrForm.label} onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })} /></div>
                        <div><Label className="text-xs">Company</Label><Input className="h-8 text-xs" value={addrForm.company} onChange={(e) => setAddrForm({ ...addrForm, company: e.target.value })} /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><Label className="text-xs">First Name</Label><Input className="h-8 text-xs" value={addrForm.first_name} onChange={(e) => setAddrForm({ ...addrForm, first_name: e.target.value })} /></div>
                        <div><Label className="text-xs">Last Name</Label><Input className="h-8 text-xs" value={addrForm.last_name} onChange={(e) => setAddrForm({ ...addrForm, last_name: e.target.value })} /></div>
                      </div>
                      <div><Label className="text-xs">Address Line 1</Label><Input className="h-8 text-xs" value={addrForm.address_line1} onChange={(e) => setAddrForm({ ...addrForm, address_line1: e.target.value })} /></div>
                      <div><Label className="text-xs">Address Line 2</Label><Input className="h-8 text-xs" value={addrForm.address_line2} onChange={(e) => setAddrForm({ ...addrForm, address_line2: e.target.value })} /></div>
                      <div className="grid grid-cols-3 gap-2">
                        <div><Label className="text-xs">City</Label><Input className="h-8 text-xs" value={addrForm.city} onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} /></div>
                        <div><Label className="text-xs">State</Label><Input className="h-8 text-xs" value={addrForm.state} onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })} /></div>
                        <div><Label className="text-xs">Postal Code</Label><Input className="h-8 text-xs" value={addrForm.postal_code} onChange={(e) => setAddrForm({ ...addrForm, postal_code: e.target.value })} /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><Label className="text-xs">Country</Label><Input className="h-8 text-xs" value={addrForm.country} onChange={(e) => setAddrForm({ ...addrForm, country: e.target.value })} /></div>
                        <div><Label className="text-xs">Phone</Label><Input className="h-8 text-xs" value={addrForm.phone} onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })} /></div>
                      </div>
                      <Button size="sm" className="w-full text-xs" onClick={handleCreateAddress} disabled={createAddress.isPending}>Add Address</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {loadingAddresses ? (
                  <Skeleton className="h-16 w-full" />
                ) : (addresses as any[]).length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No addresses on file.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(addresses as any[]).map((addr: any) => (
                      <div key={addr.id} className="border rounded-md p-3 text-xs relative group">
                        <Badge variant="outline" className="text-[10px] mb-1">{addr.label}</Badge>
                        <p className="font-medium">{[addr.first_name, addr.last_name].filter(Boolean).join(" ") || "—"}</p>
                        {addr.company && <p className="text-muted-foreground">{addr.company}</p>}
                        <p>{addr.address_line1}</p>
                        {addr.address_line2 && <p>{addr.address_line2}</p>}
                        <p>{[addr.city, addr.state, addr.postal_code].filter(Boolean).join(", ")}</p>
                        <p className="text-muted-foreground">{addr.country}</p>
                        <Button
                          variant="ghost" size="icon"
                          className="h-6 w-6 absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-destructive"
                          onClick={() => deleteAddress.mutate({ id: addr.id, customerId: customer.id })}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order History */}
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
                    {customerOrders.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-6">No orders yet</TableCell></TableRow>
                    ) : (
                      customerOrders.map((o: any) => (
                        <TableRow key={o.id} className="text-xs cursor-pointer" onClick={() => navigate(`/orders/${o.id}`)}>
                          <TableCell className="py-2 font-medium">{o.order_number}</TableCell>
                          <TableCell className="py-2"><StatusBadge status={o.status} /></TableCell>
                          <TableCell className="py-2 text-right">${Number(o.total).toFixed(2)}</TableCell>
                          <TableCell className="py-2 text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))
                    )}
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