import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Mail, Plus, Pencil, Trash2, Send, Clock, CheckCircle, XCircle, Eye } from "lucide-react";

const DEFAULT_TEMPLATES = [
  { template_key: "order_confirmation", name: "Order Confirmation", subject: "Order Confirmation #{{order_number}} — {{store_name}}", html_body: '<div style="font-family:sans-serif;max-width:600px;margin:0 auto"><h2>Order Confirmation</h2><p>Hi {{customer_name}},</p><p>Thank you for your order <strong>#{{order_number}}</strong>.</p><p><strong>Total:</strong> ${{order_total}}</p><p>We\'ll let you know when your order ships.</p><p>Thanks,<br/>{{store_name}}</p></div>' },
  { template_key: "new_order_admin", name: "New Order Admin Notification", subject: "[New Order] #{{order_number}} — ${{order_total}}", html_body: '<div style="font-family:sans-serif;max-width:600px;margin:0 auto"><h2>New Order Received</h2><p>Order <strong>#{{order_number}}</strong> has been placed.</p><p><strong>Customer:</strong> {{customer_name}}</p><p><strong>Total:</strong> ${{order_total}}</p></div>' },
  { template_key: "contact_form", name: "Contact Form Notification", subject: "[Contact Form] {{subject}} — {{store_name}}", html_body: '<div style="font-family:sans-serif;max-width:600px;margin:0 auto"><h2>New Contact Form Submission</h2><p><strong>Name:</strong> {{name}}</p><p><strong>Email:</strong> {{email}}</p><p><strong>Message:</strong></p><p>{{message}}</p></div>' },
  { template_key: "order_shipped", name: "Order Shipped", subject: "Your order #{{order_number}} has shipped!", html_body: '<div style="font-family:sans-serif;max-width:600px;margin:0 auto"><h2>Your Order Has Shipped!</h2><p>Hi {{customer_name}},</p><p>Your order <strong>#{{order_number}}</strong> is on its way.</p><p><strong>Tracking:</strong> {{tracking_number}}</p><p>Thanks,<br/>{{store_name}}</p></div>' },
  { template_key: "payment_confirmation", name: "Payment Confirmation", subject: "Payment Received — Order #{{order_number}}", html_body: '<div style="font-family:sans-serif;max-width:600px;margin:0 auto"><h2>Payment Received</h2><p>Hi {{customer_name}},</p><p>We have received your payment of <strong>${{amount}}</strong> for order <strong>#{{order_number}}</strong>.</p><p>Thanks,<br/>{{store_name}}</p></div>' },
  { template_key: "low_stock_alert", name: "Low Stock Alert", subject: "[Alert] Low stock — {{product_name}}", html_body: '<div style="font-family:sans-serif;max-width:600px;margin:0 auto"><h2>Low Stock Alert</h2><p>Product <strong>{{product_name}}</strong> is running low.</p><p><strong>Current stock:</strong> {{current_stock}}</p><p><strong>Threshold:</strong> {{threshold}}</p></div>' },
];

export default function EmailTemplates() {
  const { currentStore } = useAuth();
  const [templates, setTemplates] = useState<any[]>([]);
  const [emailQueue, setEmailQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTemplate, setEditTemplate] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const fetchData = async () => {
    if (!currentStore) return;
    setLoading(true);
    const [{ data: tmpl }, { data: queue }] = await Promise.all([
      supabase.from("email_templates").select("*").eq("store_id", currentStore.id).order("created_at"),
      supabase.from("email_queue").select("*").eq("store_id", currentStore.id).order("created_at", { ascending: false }).limit(50),
    ]);
    setTemplates(tmpl || []);
    setEmailQueue(queue || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [currentStore]);

  const seedDefaults = async () => {
    if (!currentStore) return;
    const existing = templates.map(t => t.template_key);
    const toInsert = DEFAULT_TEMPLATES.filter(d => !existing.includes(d.template_key)).map(d => ({
      ...d,
      store_id: currentStore.id,
      is_active: true,
    }));
    if (toInsert.length === 0) { toast.info("All default templates already exist"); return; }
    const { error } = await supabase.from("email_templates").insert(toInsert as any);
    if (error) { toast.error(error.message); return; }
    toast.success(`${toInsert.length} templates added`);
    fetchData();
  };

  const handleSave = async () => {
    if (!editTemplate || !currentStore) return;
    const payload = {
      store_id: currentStore.id,
      template_key: editTemplate.template_key,
      name: editTemplate.name,
      subject: editTemplate.subject,
      html_body: editTemplate.html_body,
      is_active: editTemplate.is_active ?? true,
    };
    if (editTemplate.id) {
      const { error } = await supabase.from("email_templates").update(payload as any).eq("id", editTemplate.id);
      if (error) { toast.error(error.message); return; }
    } else {
      const { error } = await supabase.from("email_templates").insert(payload as any);
      if (error) { toast.error(error.message); return; }
    }
    toast.success("Template saved");
    setEditOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("email_templates").delete().eq("id", id);
    toast.success("Deleted");
    fetchData();
  };

  const statusIcon = (status: string) => {
    if (status === "sent") return <CheckCircle className="h-3.5 w-3.5 text-primary" />;
    if (status === "failed") return <XCircle className="h-3.5 w-3.5 text-destructive" />;
    return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Email Templates</h1>
            <p className="text-xs text-muted-foreground">Manage system email templates and view email queue</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={seedDefaults}>
              <Plus className="h-4 w-4 mr-1" /> Seed Defaults
            </Button>
            <Button size="sm" onClick={() => { setEditTemplate({ template_key: "", name: "", subject: "", html_body: "", is_active: true }); setEditOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> New Template
            </Button>
          </div>
        </div>

        <Tabs defaultValue="templates">
          <TabsList>
            <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
            <TabsTrigger value="queue">Email Queue ({emailQueue.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="templates">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs h-8">Key</TableHead>
                      <TableHead className="text-xs h-8">Name</TableHead>
                      <TableHead className="text-xs h-8">Subject</TableHead>
                      <TableHead className="text-xs h-8">Active</TableHead>
                      <TableHead className="text-xs h-8 w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">
                        <Mail className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                        No templates — click "Seed Defaults" to create standard templates
                      </TableCell></TableRow>
                    ) : templates.map((t: any) => (
                      <TableRow key={t.id} className="text-xs">
                        <TableCell className="py-2 font-mono">{t.template_key}</TableCell>
                        <TableCell className="py-2 font-medium">{t.name}</TableCell>
                        <TableCell className="py-2 text-muted-foreground truncate max-w-[200px]">{t.subject}</TableCell>
                        <TableCell className="py-2"><Badge variant={t.is_active ? "default" : "outline"} className="text-[10px]">{t.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                        <TableCell className="py-2">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setPreviewHtml(t.html_body); setPreviewOpen(true); }}><Eye className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditTemplate(t); setEditOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDelete(t.id)}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="queue">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emailQueue.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No emails sent yet</TableCell></TableRow>
                    ) : emailQueue.map((e: any) => (
                      <TableRow key={e.id}>
                        <TableCell>{statusIcon(e.status)}</TableCell>
                        <TableCell className="text-sm">{e.to_email}</TableCell>
                        <TableCell className="text-sm truncate max-w-[200px]">{e.subject}</TableCell>
                        <TableCell className="font-mono text-xs">{e.template_key || "—"}</TableCell>
                        <TableCell><Badge variant={e.status === "sent" ? "default" : e.status === "failed" ? "destructive" : "outline"} className="text-xs">{e.status}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{e.sent_at ? new Date(e.sent_at).toLocaleString() : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editTemplate?.id ? "Edit" : "New"} Email Template</DialogTitle></DialogHeader>
            {editTemplate && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Template Key</Label>
                    <Input value={editTemplate.template_key} onChange={e => setEditTemplate({ ...editTemplate, template_key: e.target.value })} placeholder="order_confirmation" disabled={!!editTemplate.id} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Name</Label>
                    <Input value={editTemplate.name} onChange={e => setEditTemplate({ ...editTemplate, name: e.target.value })} placeholder="Order Confirmation" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Subject Line</Label>
                  <Input value={editTemplate.subject} onChange={e => setEditTemplate({ ...editTemplate, subject: e.target.value })} placeholder="Order Confirmation #{{order_number}}" />
                  <p className="text-xs text-muted-foreground">Use {"{{variable}}"} for dynamic values</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">HTML Body</Label>
                  <Textarea rows={12} value={editTemplate.html_body} onChange={e => setEditTemplate({ ...editTemplate, html_body: e.target.value })} className="font-mono text-xs" />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={editTemplate.is_active} onCheckedChange={v => setEditTemplate({ ...editTemplate, is_active: v })} />
                  <Label className="text-sm">Active</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => { setPreviewHtml(editTemplate.html_body); setPreviewOpen(true); }}>
                    <Eye className="h-4 w-4 mr-1" /> Preview
                  </Button>
                  <Button onClick={handleSave}>Save Template</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh]">
            <DialogHeader><DialogTitle>Email Preview</DialogTitle></DialogHeader>
            <div className="border rounded-lg p-4 bg-background overflow-auto max-h-[60vh]" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
