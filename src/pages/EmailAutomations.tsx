import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Mail, Zap, Clock, Edit, Trash2 } from "lucide-react";

const TRIGGER_TYPES = [
  { value: "welcome", label: "Welcome Series", description: "After customer signup" },
  { value: "post_purchase", label: "Post-Purchase", description: "After order completed" },
  { value: "winback", label: "Win-Back", description: "Inactive customers (30+ days no purchase)" },
  { value: "birthday", label: "Birthday", description: "On customer's birthday (requires birthday field)" },
  { value: "abandoned_cart", label: "Abandoned Cart", description: "Cart abandoned for 1+ hour" },
  { value: "review_request", label: "Review Request", description: "After order delivered" },
  { value: "reorder_reminder", label: "Reorder Reminder", description: "Based on purchase frequency" },
  { value: "browse_abandon", label: "Browse Abandonment", description: "Viewed products but no purchase" },
  { value: "vip_upgrade", label: "VIP Tier Upgrade", description: "When customer reaches new loyalty tier" },
  { value: "subscription_renewal", label: "Subscription Renewal", description: "Before subscription renewal charge" },
];

export default function EmailAutomations() {
  const { currentStore } = useAuth();
  const storeId = currentStore?.id;
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", trigger_type: "welcome", delay_hours: "0", subject: "", html_body: "", step_number: "1",
  });

  const { data: automations = [] } = useQuery({
    queryKey: ["email-automations", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data } = await supabase.from("email_automations").select("*").eq("store_id", storeId!).order("created_at", { ascending: false });
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.name || !form.subject) throw new Error("Name and subject required");
      const payload = {
        store_id: storeId!,
        name: form.name,
        trigger_type: form.trigger_type,
        delay_hours: parseInt(form.delay_hours) || 0,
        subject: form.subject,
        html_body: form.html_body,
      };
      if (editingId) {
        await supabase.from("email_automations").update(payload).eq("id", editingId);
      } else {
        await supabase.from("email_automations").insert(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-automations"] });
      closeForm();
      toast.success(editingId ? "Automation updated" : "Automation created");
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await supabase.from("email_automations").update({ is_active: active }).eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["email-automations"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("email_automations").delete().eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-automations"] });
      toast.success("Automation deleted");
    },
  });

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ name: "", trigger_type: "welcome", delay_hours: "0", subject: "", html_body: "", step_number: "1" });
  };

  const editAutomation = (a: any) => {
    setForm({
      name: a.name,
      trigger_type: a.trigger_type,
      delay_hours: String(a.delay_hours),
      subject: a.subject,
      html_body: a.html_body,
    });
    setEditingId(a.id);
    setShowForm(true);
  };

  const activeCount = automations.filter((a: any) => a.is_active).length;
  const totalSent = automations.reduce((s: number, a: any) => s + (a.sent_count || 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Email Automations</h1>
            <p className="text-xs text-muted-foreground">Automated email workflows triggered by customer actions</p>
          </div>
          <Button size="sm" className="h-8 text-xs gap-1" onClick={() => setShowForm(true)}><Plus className="h-3.5 w-3.5" /> New Automation</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <Zap className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-xs text-muted-foreground">Active Automations</p>
              <p className="text-2xl font-bold">{activeCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <Mail className="h-5 w-5 mx-auto mb-1 text-blue-600" />
              <p className="text-xs text-muted-foreground">Total Emails Sent</p>
              <p className="text-2xl font-bold">{totalSent}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Total Automations</p>
              <p className="text-2xl font-bold">{automations.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Automations</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Delay</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {automations.map((a: any) => {
                  const trigger = TRIGGER_TYPES.find(t => t.value === a.trigger_type);
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium text-sm">{a.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{trigger?.label || a.trigger_type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {a.delay_hours === 0 ? "Immediate" : `${a.delay_hours}h delay`}
                      </TableCell>
                      <TableCell className="text-sm truncate max-w-[200px]">{a.subject}</TableCell>
                      <TableCell className="text-sm font-medium">{a.sent_count}</TableCell>
                      <TableCell>
                        <Switch
                          checked={a.is_active}
                          onCheckedChange={(checked) => toggleMutation.mutate({ id: a.id, active: checked })}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => editAutomation(a)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(a.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {automations.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No automations yet. Create your first workflow above.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showForm} onOpenChange={(o) => !o && closeForm()}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Edit" : "New"} Email Automation</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Welcome Series Email 1" />
            </div>
            <div>
              <Label>Trigger</Label>
              <Select value={form.trigger_type} onValueChange={v => setForm(f => ({ ...f, trigger_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRIGGER_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      <div>
                        <div className="font-medium">{t.label}</div>
                        <div className="text-xs text-muted-foreground">{t.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Delay (hours after trigger)</Label>
              <Input type="number" value={form.delay_hours} onChange={e => setForm(f => ({ ...f, delay_hours: e.target.value }))} min={0} />
            </div>
            <div>
              <Label>Email Subject</Label>
              <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Welcome to {{store_name}}!" />
            </div>
            <div>
              <Label>Email Body (HTML)</Label>
              <Textarea value={form.html_body} onChange={e => setForm(f => ({ ...f, html_body: e.target.value }))} placeholder="<h1>Welcome!</h1><p>Thanks for joining...</p>" className="min-h-[120px] font-mono text-xs" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()}>{editingId ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
