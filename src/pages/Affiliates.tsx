import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Users, DollarSign, Link, Copy, CheckCircle, XCircle, MoreHorizontal, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Affiliates() {
  const { currentStore } = useAuth();
  const storeId = currentStore?.id;
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showPayouts, setShowPayouts] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null);
  const [form, setForm] = useState({ name: "", email: "", commission_rate: "10", commission_type: "percentage" });

  const { data: affiliates = [] } = useQuery({
    queryKey: ["affiliates", storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data } = await supabase.from("affiliates" as any).select("*").eq("store_id", storeId).order("created_at", { ascending: false });
      return (data || []) as any[];
    },
    enabled: !!storeId,
  });

  const { data: referrals = [] } = useQuery({
    queryKey: ["affiliate_referrals", storeId, selectedAffiliate?.id],
    queryFn: async () => {
      if (!storeId || !selectedAffiliate) return [];
      const { data } = await supabase.from("affiliate_referrals" as any).select("*, order:orders(order_number, total)").eq("affiliate_id", selectedAffiliate.id).order("created_at", { ascending: false });
      return (data || []) as any[];
    },
    enabled: !!storeId && !!selectedAffiliate,
  });

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  const createAffiliate = async () => {
    if (!storeId || !form.name || !form.email) return;
    const code = generateCode();
    const { error } = await supabase.from("affiliates" as any).insert({
      store_id: storeId, name: form.name, email: form.email,
      referral_code: code, commission_rate: Number(form.commission_rate),
      commission_type: form.commission_type,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`Affiliate created with code: ${code}`);
    setShowCreate(false);
    setForm({ name: "", email: "", commission_rate: "10", commission_type: "percentage" });
    qc.invalidateQueries({ queryKey: ["affiliates"] });
  };

  const toggleStatus = async (id: string, current: string) => {
    await supabase.from("affiliates" as any).update({ status: current === "active" ? "inactive" : "active" }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["affiliates"] });
  };

  const deleteAffiliate = async (id: string) => {
    if (!confirm("Delete this affiliate?")) return;
    await supabase.from("affiliates" as any).delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["affiliates"] });
    toast.success("Affiliate deleted");
  };

  const markPaid = async (referralId: string) => {
    await supabase.from("affiliate_referrals" as any).update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", referralId);
    qc.invalidateQueries({ queryKey: ["affiliate_referrals"] });
    toast.success("Marked as paid");
  };

  const totalAffiliates = affiliates.length;
  const activeAffiliates = affiliates.filter((a: any) => a.status === "active").length;
  const totalRevenue = affiliates.reduce((s: number, a: any) => s + Number(a.total_revenue), 0);
  const unpaidCommission = affiliates.reduce((s: number, a: any) => s + Number(a.unpaid_commission), 0);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Affiliate Program</h1>
            <p className="text-xs text-muted-foreground">Manage affiliates, referral codes, and commissions</p>
          </div>
          <Button size="sm" className="h-8 text-xs gap-1" onClick={() => setShowCreate(true)}><Plus className="h-3.5 w-3.5" /> Add Affiliate</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger-children">
          <Card className="card-hover">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center"><Users className="h-4 w-4 text-primary" /></div>
              <div><p className="text-2xs text-muted-foreground">Total</p><p className="text-lg font-bold">{totalAffiliates}</p></div>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-success/10 flex items-center justify-center"><CheckCircle className="h-4 w-4 text-success" /></div>
              <div><p className="text-2xs text-muted-foreground">Active</p><p className="text-lg font-bold">{activeAffiliates}</p></div>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-info/10 flex items-center justify-center"><DollarSign className="h-4 w-4 text-info" /></div>
              <div><p className="text-2xs text-muted-foreground">Revenue</p><p className="text-lg font-bold">${totalRevenue.toFixed(0)}</p></div>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-destructive/10 flex items-center justify-center"><DollarSign className="h-4 w-4 text-destructive" /></div>
              <div><p className="text-2xs text-muted-foreground">Unpaid</p><p className="text-lg font-bold">${unpaidCommission.toFixed(0)}</p></div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Referrals</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Unpaid</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {affiliates.map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell className="text-sm">{a.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{a.referral_code}</code>
                        <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => { navigator.clipboard.writeText(a.referral_code); toast.success("Copied!"); }}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{a.commission_rate}{a.commission_type === "percentage" ? "%" : " flat"}</TableCell>
                    <TableCell>{a.total_referrals}</TableCell>
                    <TableCell>${Number(a.total_revenue).toFixed(2)}</TableCell>
                    <TableCell className="font-medium text-destructive">${Number(a.unpaid_commission).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={a.status === "active" ? "default" : "secondary"}>{a.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button size="sm" variant="ghost" className="h-7 w-7 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedAffiliate(a); setShowPayouts(true); }}>View Referrals</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleStatus(a.id, a.status)}>{a.status === "active" ? "Deactivate" : "Activate"}</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => deleteAffiliate(a.id)}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {affiliates.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No affiliates yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Affiliate</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Affiliate name" /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="affiliate@email.com" type="email" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Commission Rate</Label><Input type="number" value={form.commission_rate} onChange={e => setForm({ ...form, commission_rate: e.target.value })} /></div>
              <div>
                <Label>Type</Label>
                <Select value={form.commission_type} onValueChange={v => setForm({ ...form, commission_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="flat">Flat ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={createAffiliate}>Create Affiliate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Referrals/Payouts Dialog */}
      <Dialog open={showPayouts} onOpenChange={setShowPayouts}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Referrals — {selectedAffiliate?.name}</DialogTitle></DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">{format(new Date(r.created_at), "MMM d, yyyy")}</TableCell>
                  <TableCell className="font-mono text-xs">{(r as any).order?.order_number || "—"}</TableCell>
                  <TableCell>${Number(r.order_total).toFixed(2)}</TableCell>
                  <TableCell className="font-medium">${Number(r.commission_amount).toFixed(2)}</TableCell>
                  <TableCell><Badge variant={r.status === "paid" ? "default" : "secondary"}>{r.status}</Badge></TableCell>
                  <TableCell>
                    {r.status === "pending" && <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => markPaid(r.id)}>Pay</Button>}
                  </TableCell>
                </TableRow>
              ))}
              {referrals.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-4">No referrals yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
