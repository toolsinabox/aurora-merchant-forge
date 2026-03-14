import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useMarketingCampaigns, useCreateCampaign, useUpdateCampaign, useDeleteCampaign, useAbandonedCarts, useCustomers } from "@/hooks/use-data";
import { Plus, Mail, ShoppingCart, Users, Megaphone, MoreHorizontal, Send, Trash2, Edit, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { toast } from "sonner";

export default function Marketing() {
  const { data: campaigns = [], isLoading: loadingCampaigns } = useMarketingCampaigns();
  const { data: abandonedCarts = [], isLoading: loadingCarts } = useAbandonedCarts();
  const { data: customers = [] } = useCustomers();
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const deleteCampaign = useDeleteCampaign();

  const [createOpen, setCreateOpen] = useState(false);
  const [editCampaign, setEditCampaign] = useState<any>(null);
  const [form, setForm] = useState({ name: "", subject: "", content: "", campaign_type: "email", audience_segment: "all" });

  const resetForm = () => setForm({ name: "", subject: "", content: "", campaign_type: "email", audience_segment: "all" });

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error("Campaign name required"); return; }
    await createCampaign.mutateAsync(form);
    resetForm();
    setCreateOpen(false);
  };

  const handleUpdate = async () => {
    if (!editCampaign) return;
    await updateCampaign.mutateAsync({ id: editCampaign.id, ...form });
    setEditCampaign(null);
    resetForm();
  };

  const openEdit = (c: any) => {
    setForm({ name: c.name, subject: c.subject || "", content: c.content || "", campaign_type: c.campaign_type, audience_segment: c.audience_segment || "all" });
    setEditCampaign(c);
  };

  const handleSend = async (id: string) => {
    await updateCampaign.mutateAsync({ id, status: "sent", sent_at: new Date().toISOString() });
    toast.success("Campaign marked as sent");
  };

  // Stats
  const totalCampaigns = campaigns.length;
  const sentCampaigns = campaigns.filter((c: any) => c.status === "sent").length;
  const draftCampaigns = campaigns.filter((c: any) => c.status === "draft").length;
  const activeAbandoned = (abandonedCarts as any[]).filter((c: any) => c.recovery_status === "abandoned").length;

  // Customer segments
  const segments = [
    { label: "All Customers", value: "all", count: customers.length },
    { label: "New Customers", value: "new", count: customers.filter((c: any) => c.segment === "new").length },
    { label: "Returning", value: "returning", count: customers.filter((c: any) => c.segment === "returning").length },
    { label: "VIP", value: "vip", count: customers.filter((c: any) => c.segment === "vip").length },
  ];

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Marketing</h1>
            <p className="text-xs text-muted-foreground">Campaigns, abandoned cart recovery & customer segments</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={resetForm}><Plus className="h-4 w-4 mr-1" /> New Campaign</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Create Campaign</DialogTitle></DialogHeader>
              <CampaignForm form={form} setForm={setForm} onSubmit={handleCreate} loading={createCampaign.isPending} submitLabel="Create" />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Megaphone} label="Total Campaigns" value={totalCampaigns} />
          <StatCard icon={Send} label="Sent" value={sentCampaigns} />
          <StatCard icon={Edit} label="Drafts" value={draftCampaigns} />
          <StatCard icon={ShoppingCart} label="Abandoned Carts" value={activeAbandoned} />
        </div>

        <Tabs defaultValue="campaigns" className="space-y-3">
          <TabsList className="h-auto flex-wrap gap-1 p-1">
            <TabsTrigger value="campaigns" className="text-xs"><Mail className="h-3.5 w-3.5 mr-1" />Campaigns</TabsTrigger>
            <TabsTrigger value="abandoned" className="text-xs"><ShoppingCart className="h-3.5 w-3.5 mr-1" />Abandoned Carts</TabsTrigger>
            <TabsTrigger value="segments" className="text-xs"><Users className="h-3.5 w-3.5 mr-1" />Segments</TabsTrigger>
          </TabsList>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns">
            <Card>
              <CardContent className="p-0">
                {loadingCampaigns ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">Loading…</div>
                ) : campaigns.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">No campaigns yet. Create your first campaign above.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Name</TableHead>
                        <TableHead className="text-xs">Type</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Audience</TableHead>
                        <TableHead className="text-xs text-right">Opens</TableHead>
                        <TableHead className="text-xs text-right">Clicks</TableHead>
                        <TableHead className="text-xs text-right">Revenue</TableHead>
                        <TableHead className="text-xs">Created</TableHead>
                        <TableHead className="text-xs w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns.map((c: any) => (
                        <TableRow key={c.id}>
                          <TableCell className="text-xs font-medium">{c.name}</TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px]">{c.campaign_type}</Badge></TableCell>
                          <TableCell><StatusBadge status={c.status} /></TableCell>
                          <TableCell className="text-xs capitalize">{c.audience_segment}</TableCell>
                          <TableCell className="text-xs text-right">{(c.stats as any)?.opens ?? "—"}</TableCell>
                          <TableCell className="text-xs text-right">{(c.stats as any)?.clicks ?? "—"}</TableCell>
                          <TableCell className="text-xs text-right">{(c.stats as any)?.revenue != null ? `$${Number((c.stats as any).revenue).toFixed(2)}` : "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{format(new Date(c.created_at), "MMM d, yyyy")}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEdit(c)}><Edit className="h-3.5 w-3.5 mr-2" />Edit</DropdownMenuItem>
                                {c.status === "draft" && (
                                  <DropdownMenuItem onClick={() => handleSend(c.id)}><Send className="h-3.5 w-3.5 mr-2" />Mark Sent</DropdownMenuItem>
                                )}
                                <DropdownMenuItem className="text-destructive" onClick={() => deleteCampaign.mutate(c.id)}>
                                  <Trash2 className="h-3.5 w-3.5 mr-2" />Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Abandoned Carts Tab */}
          <TabsContent value="abandoned">
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">Abandoned Carts</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loadingCarts ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">Loading…</div>
                ) : (abandonedCarts as any[]).length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">No abandoned carts recorded yet. Carts will appear here when customers leave without completing checkout.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Customer</TableHead>
                        <TableHead className="text-xs">Email</TableHead>
                        <TableHead className="text-xs">Cart Total</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Abandoned</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(abandonedCarts as any[]).map((cart: any) => (
                        <TableRow key={cart.id}>
                          <TableCell className="text-xs">{cart.customers?.name || "Guest"}</TableCell>
                          <TableCell className="text-xs">{cart.email || cart.customers?.email || "—"}</TableCell>
                          <TableCell className="text-xs font-medium">${Number(cart.cart_total).toFixed(2)}</TableCell>
                          <TableCell><StatusBadge status={cart.recovery_status} /></TableCell>
                          <TableCell className="text-xs text-muted-foreground">{format(new Date(cart.abandoned_at), "MMM d, HH:mm")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Segments Tab */}
          <TabsContent value="segments">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {segments.map((seg) => (
                <Card key={seg.value}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">{seg.label}</p>
                        <p className="text-lg font-bold">{seg.count}</p>
                      </div>
                      <Users className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-3 text-xs" onClick={() => {
                      setForm((f) => ({ ...f, audience_segment: seg.value, name: `Campaign for ${seg.label}` }));
                      setCreateOpen(true);
                    }}>
                      <Mail className="h-3 w-3 mr-1" /> Create Campaign
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Campaign Dialog */}
        <Dialog open={!!editCampaign} onOpenChange={(o) => { if (!o) setEditCampaign(null); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Edit Campaign</DialogTitle></DialogHeader>
            <CampaignForm form={form} setForm={setForm} onSubmit={handleUpdate} loading={updateCampaign.isPending} submitLabel="Save Changes" />
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function CampaignForm({ form, setForm, onSubmit, loading, submitLabel }: {
  form: { name: string; subject: string; content: string; campaign_type: string; audience_segment: string };
  setForm: (fn: (f: any) => any) => void;
  onSubmit: () => void;
  loading: boolean;
  submitLabel: string;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium">Campaign Name</label>
        <Input placeholder="Summer Sale Blast" value={form.name} onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium">Type</label>
          <Select value={form.campaign_type} onValueChange={(v) => setForm((f: any) => ({ ...f, campaign_type: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="push">Push Notification</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium">Audience</label>
          <Select value={form.audience_segment} onValueChange={(v) => setForm((f: any) => ({ ...f, audience_segment: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>
              <SelectItem value="new">New Customers</SelectItem>
              <SelectItem value="returning">Returning</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium">Subject Line</label>
        <Input placeholder="Don't miss our biggest sale!" value={form.subject} onChange={(e) => setForm((f: any) => ({ ...f, subject: e.target.value }))} />
      </div>
      <div>
        <label className="text-xs font-medium">Content</label>
        <Textarea placeholder="Write your campaign content…" rows={5} value={form.content} onChange={(e) => setForm((f: any) => ({ ...f, content: e.target.value }))} />
      </div>
      <Button onClick={onSubmit} disabled={loading} className="w-full">{submitLabel}</Button>
    </div>
  );
}
