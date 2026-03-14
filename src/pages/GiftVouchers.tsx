import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Gift, Trash2, Search, Copy } from "lucide-react";
import { format } from "date-fns";

interface VoucherForm {
  code: string;
  initial_value: number;
  balance: number;
  recipient_email: string;
  recipient_name: string;
  sender_name: string;
  message: string;
  is_active: boolean;
  expires_at: string;
}

const generateCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "GV-";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

const emptyForm: VoucherForm = {
  code: generateCode(), initial_value: 50, balance: 50,
  recipient_email: "", recipient_name: "", sender_name: "",
  message: "", is_active: true, expires_at: "",
};

export default function GiftVouchers() {
  const { currentStore } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<VoucherForm>({ ...emptyForm });
  const [search, setSearch] = useState("");

  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ["gift_vouchers", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data, error } = await supabase
        .from("gift_vouchers")
        .select("*")
        .eq("store_id", currentStore.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!currentStore,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!currentStore) throw new Error("No store");
      const { data: inserted, error } = await supabase.from("gift_vouchers").insert({
        store_id: currentStore.id,
        code: form.code,
        initial_value: form.initial_value,
        balance: form.initial_value,
        recipient_email: form.recipient_email || null,
        recipient_name: form.recipient_name || null,
        sender_name: form.sender_name || null,
        message: form.message || null,
        is_active: form.is_active,
        expires_at: form.expires_at || null,
      }).select("id").single();
      if (error) throw error;
      // Send gift voucher email to recipient if email provided
      if (form.recipient_email && inserted?.id) {
        supabase.functions.invoke("gift-voucher-email", {
          body: { voucher_id: inserted.id, store_id: currentStore.id },
        }).catch(() => {});
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gift_vouchers"] });
      toast.success("Gift voucher created");
      setOpen(false);
      setForm({ ...emptyForm, code: generateCode() });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gift_vouchers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gift_vouchers"] });
      toast.success("Voucher deleted");
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("gift_vouchers").update({ is_active: active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gift_vouchers"] }),
  });

  const filtered = vouchers.filter((v: any) =>
    v.code.toLowerCase().includes(search.toLowerCase()) ||
    (v.recipient_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (v.recipient_email || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalValue = vouchers.reduce((s: number, v: any) => s + Number(v.initial_value), 0);
  const totalBalance = vouchers.reduce((s: number, v: any) => s + Number(v.balance), 0);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Gift Vouchers</h1>
            <p className="text-xs text-muted-foreground">{vouchers.length} vouchers · ${totalValue.toFixed(2)} issued · ${totalBalance.toFixed(2)} outstanding</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm({ ...emptyForm, code: generateCode() }); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs gap-1"><Plus className="h-3.5 w-3.5" /> Create Voucher</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-sm">New Gift Voucher</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="space-y-1">
                  <Label className="text-xs">Voucher Code</Label>
                  <div className="flex gap-2">
                    <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="h-8 text-xs font-mono" />
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setForm({ ...form, code: generateCode() })} title="Generate new code"><Copy className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Value ($)</Label>
                  <Input type="number" className="h-8 text-xs" value={form.initial_value} onChange={e => setForm({ ...form, initial_value: Number(e.target.value) })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1"><Label className="text-xs">Recipient Name</Label><Input className="h-8 text-xs" value={form.recipient_name} onChange={e => setForm({ ...form, recipient_name: e.target.value })} /></div>
                  <div className="space-y-1"><Label className="text-xs">Recipient Email</Label><Input className="h-8 text-xs" type="email" value={form.recipient_email} onChange={e => setForm({ ...form, recipient_email: e.target.value })} /></div>
                </div>
                <div className="space-y-1"><Label className="text-xs">Sender Name</Label><Input className="h-8 text-xs" value={form.sender_name} onChange={e => setForm({ ...form, sender_name: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs">Message</Label><Textarea className="text-xs min-h-[60px]" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Happy birthday!" /></div>
                <div className="space-y-1"><Label className="text-xs">Expires At</Label><Input type="date" className="h-8 text-xs" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} /></div>
                <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} /><Label className="text-xs">Active</Label></div>
                <Button size="sm" className="w-full text-xs" onClick={() => createMutation.mutate()} disabled={!form.code || !form.initial_value || createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Voucher"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-children">
          <Card className="card-hover">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center"><Gift className="h-4 w-4 text-primary" /></div>
              <div><p className="text-2xs text-muted-foreground">Total</p><p className="text-lg font-bold">{vouchers.length}</p></div>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-success/10 flex items-center justify-center"><Gift className="h-4 w-4 text-success" /></div>
              <div><p className="text-2xs text-muted-foreground">Active</p><p className="text-lg font-bold">{vouchers.filter((v: any) => v.is_active).length}</p></div>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-info/10 flex items-center justify-center"><Gift className="h-4 w-4 text-info" /></div>
              <div><p className="text-2xs text-muted-foreground">Issued</p><p className="text-lg font-bold">${totalValue.toFixed(0)}</p></div>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-warning/10 flex items-center justify-center"><Gift className="h-4 w-4 text-warning" /></div>
              <div><p className="text-2xs text-muted-foreground">Outstanding</p><p className="text-lg font-bold">${totalBalance.toFixed(0)}</p></div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="flex items-center gap-2 p-3 border-b">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search vouchers..." value={search} onChange={e => setSearch(e.target.value)} className="h-8 pl-8 text-xs" />
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Initial Value</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No gift vouchers found</TableCell></TableRow>
                ) : filtered.map((v: any) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono font-medium text-sm">{v.code}</TableCell>
                    <TableCell className="text-sm">
                      <div>{v.recipient_name || "—"}</div>
                      {v.recipient_email && <div className="text-xs text-muted-foreground">{v.recipient_email}</div>}
                    </TableCell>
                    <TableCell className="font-medium">${Number(v.initial_value).toFixed(2)}</TableCell>
                    <TableCell className={Number(v.balance) === 0 ? "text-muted-foreground" : "font-medium text-primary"}>${Number(v.balance).toFixed(2)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{v.expires_at ? format(new Date(v.expires_at), "dd MMM yyyy") : "Never"}</TableCell>
                    <TableCell>
                      <Switch checked={v.is_active} onCheckedChange={active => toggleActive.mutate({ id: v.id, active })} />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(v.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </TableCell>
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
