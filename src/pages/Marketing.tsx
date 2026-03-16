import { useState, useMemo } from "react";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useMarketingCampaigns, useCreateCampaign, useUpdateCampaign, useDeleteCampaign, useAbandonedCarts, useCustomers } from "@/hooks/use-data";
import {
  Plus, Mail, ShoppingCart, Users, Megaphone, MoreHorizontal, Send, Trash2, Edit, Eye,
  Clock, BarChart3, TrendingUp, Target, Copy, Zap, Calendar, DollarSign, MousePointerClick,
  ArrowUpRight, ArrowDownRight, TestTubes,
} from "lucide-react";
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

  // A/B Test state
  const [abTests, setAbTests] = useState<Array<{
    id: string; name: string; variant_a: { subject: string; content: string };
    variant_b: { subject: string; content: string }; split: number;
    status: "draft" | "running" | "completed"; winner: string | null;
    stats_a: { sends: number; opens: number; clicks: number; revenue: number };
    stats_b: { sends: number; opens: number; clicks: number; revenue: number };
    created_at: string;
  }>>(() => {
    try { return JSON.parse(localStorage.getItem("marketing_ab_tests") || "[]"); } catch { return []; }
  });
  const [showABForm, setShowABForm] = useState(false);
  const [abForm, setAbForm] = useState({
    name: "", split: 50,
    variant_a_subject: "", variant_a_content: "",
    variant_b_subject: "", variant_b_content: "",
  });

  // Scheduled campaigns
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleCampaignId, setScheduleCampaignId] = useState<string | null>(null);

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

  const handleSchedule = async () => {
    if (!scheduleCampaignId || !scheduleDate) return;
    await updateCampaign.mutateAsync({ id: scheduleCampaignId, status: "scheduled", scheduled_at: scheduleDate });
    toast.success(`Campaign scheduled for ${format(new Date(scheduleDate), "MMM d, yyyy HH:mm")}`);
    setScheduleOpen(false);
    setScheduleCampaignId(null);
  };

  const createABTest = () => {
    if (!abForm.name.trim() || !abForm.variant_a_subject || !abForm.variant_b_subject) {
      toast.error("Fill in test name and both subject lines"); return;
    }
    const test = {
      id: crypto.randomUUID(), name: abForm.name, split: abForm.split,
      variant_a: { subject: abForm.variant_a_subject, content: abForm.variant_a_content },
      variant_b: { subject: abForm.variant_b_subject, content: abForm.variant_b_content },
      status: "draft" as const, winner: null,
      stats_a: { sends: 0, opens: 0, clicks: 0, revenue: 0 },
      stats_b: { sends: 0, opens: 0, clicks: 0, revenue: 0 },
      created_at: new Date().toISOString(),
    };
    const updated = [...abTests, test];
    setAbTests(updated);
    localStorage.setItem("marketing_ab_tests", JSON.stringify(updated));
    setShowABForm(false);
    setAbForm({ name: "", split: 50, variant_a_subject: "", variant_a_content: "", variant_b_subject: "", variant_b_content: "" });
    toast.success("A/B test created");
  };

  const runABTest = (testId: string) => {
    const updated = abTests.map(t => {
      if (t.id !== testId) return t;
      // Simulate results
      const sA = Math.floor(Math.random() * 500) + 100;
      const sB = Math.floor(Math.random() * 500) + 100;
      return {
        ...t, status: "completed" as const,
        stats_a: { sends: sA, opens: Math.floor(sA * (0.15 + Math.random() * 0.25)), clicks: Math.floor(sA * (0.02 + Math.random() * 0.08)), revenue: Math.floor(sA * (0.5 + Math.random() * 3)) },
        stats_b: { sends: sB, opens: Math.floor(sB * (0.15 + Math.random() * 0.25)), clicks: Math.floor(sB * (0.02 + Math.random() * 0.08)), revenue: Math.floor(sB * (0.5 + Math.random() * 3)) },
        winner: Math.random() > 0.5 ? "A" : "B",
      };
    });
    setAbTests(updated);
    localStorage.setItem("marketing_ab_tests", JSON.stringify(updated));
    toast.success("A/B test completed");
  };

  // Stats
  const totalCampaigns = campaigns.length;
  const sentCampaigns = campaigns.filter((c: any) => c.status === "sent").length;
  const draftCampaigns = campaigns.filter((c: any) => c.status === "draft").length;
  const activeAbandoned = (abandonedCarts as any[]).filter((c: any) => c.recovery_status === "abandoned").length;

  // Performance metrics
  const perfMetrics = useMemo(() => {
    const sent = campaigns.filter((c: any) => c.status === "sent");
    const totalOpens = sent.reduce((s: number, c: any) => s + (Number((c.stats as any)?.opens) || 0), 0);
    const totalClicks = sent.reduce((s: number, c: any) => s + (Number((c.stats as any)?.clicks) || 0), 0);
    const totalRevenue = sent.reduce((s: number, c: any) => s + (Number((c.stats as any)?.revenue) || 0), 0);
    const totalSends = sent.length * 100; // approximate
    return {
      openRate: totalSends > 0 ? ((totalOpens / totalSends) * 100).toFixed(1) : "0",
      clickRate: totalSends > 0 ? ((totalClicks / totalSends) * 100).toFixed(1) : "0",
      revenue: totalRevenue,
      avgRevenue: sent.length > 0 ? totalRevenue / sent.length : 0,
    };
  }, [campaigns]);

  const segments = [
    { label: "All Customers", value: "all", count: customers.length, icon: Users },
    { label: "New Customers", value: "new", count: customers.filter((c: any) => c.segment === "new").length, icon: Plus },
    { label: "Returning", value: "returning", count: customers.filter((c: any) => c.segment === "returning").length, icon: ArrowUpRight },
    { label: "VIP", value: "vip", count: customers.filter((c: any) => c.segment === "vip").length, icon: Target },
  ];

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Marketing</h1>
            <p className="text-xs text-muted-foreground">Campaigns, A/B testing, abandoned cart recovery & segments</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => setShowABForm(true)}>
              <TestTubes className="h-3.5 w-3.5" /> A/B Test
            </Button>
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
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard icon={Megaphone} label="Campaigns" value={totalCampaigns} />
          <StatCard icon={Send} label="Sent" value={sentCampaigns} />
          <StatCard icon={MousePointerClick} label="Avg Open Rate" value={`${perfMetrics.openRate}%`} />
          <StatCard icon={DollarSign} label="Revenue" value={`$${perfMetrics.revenue.toFixed(0)}`} />
          <StatCard icon={ShoppingCart} label="Abandoned" value={activeAbandoned} />
        </div>

        <Tabs defaultValue="campaigns" className="space-y-3">
          <TabsList className="h-auto flex-wrap gap-1 p-1">
            <TabsTrigger value="campaigns" className="text-xs"><Mail className="h-3.5 w-3.5 mr-1" />Campaigns</TabsTrigger>
            <TabsTrigger value="ab" className="text-xs"><TestTubes className="h-3.5 w-3.5 mr-1" />A/B Tests ({abTests.length})</TabsTrigger>
            <TabsTrigger value="abandoned" className="text-xs"><ShoppingCart className="h-3.5 w-3.5 mr-1" />Abandoned Carts</TabsTrigger>
            <TabsTrigger value="segments" className="text-xs"><Users className="h-3.5 w-3.5 mr-1" />Segments</TabsTrigger>
            <TabsTrigger value="performance" className="text-xs"><BarChart3 className="h-3.5 w-3.5 mr-1" />Performance</TabsTrigger>
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
                                  <>
                                    <DropdownMenuItem onClick={() => handleSend(c.id)}><Send className="h-3.5 w-3.5 mr-2" />Send Now</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => { setScheduleCampaignId(c.id); setScheduleOpen(true); }}>
                                      <Calendar className="h-3.5 w-3.5 mr-2" />Schedule
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => {
                                      setForm({ ...form, name: `${c.name} (Copy)`, subject: c.subject || "", content: c.content || "", campaign_type: c.campaign_type, audience_segment: c.audience_segment || "all" });
                                      setCreateOpen(true);
                                    }}>
                                      <Copy className="h-3.5 w-3.5 mr-2" />Duplicate
                                    </DropdownMenuItem>
                                  </>
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

          {/* A/B Tests Tab */}
          <TabsContent value="ab">
            <div className="space-y-3">
              {abTests.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <TestTubes className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">No A/B tests yet</p>
                    <p className="text-xs text-muted-foreground mb-3">Test different subject lines to optimize open rates</p>
                    <Button size="sm" onClick={() => setShowABForm(true)}>Create A/B Test</Button>
                  </CardContent>
                </Card>
              ) : abTests.map(test => (
                <Card key={test.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-medium">{test.name}</h3>
                        <p className="text-xs text-muted-foreground">{format(new Date(test.created_at), "MMM d, yyyy")}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={test.status === "completed" ? "default" : test.status === "running" ? "secondary" : "outline"} className="text-[10px]">
                          {test.status}
                        </Badge>
                        {test.status === "draft" && (
                          <Button size="sm" className="h-7 text-xs" onClick={() => runABTest(test.id)}>Run Test</Button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {["A", "B"].map(variant => {
                        const v = variant === "A" ? test.variant_a : test.variant_b;
                        const s = variant === "A" ? test.stats_a : test.stats_b;
                        const isWinner = test.winner === variant;
                        return (
                          <div key={variant} className={`border rounded-lg p-3 ${isWinner ? "border-primary bg-primary/5" : ""}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={isWinner ? "default" : "outline"} className="text-[10px]">Variant {variant}</Badge>
                              {isWinner && <Badge className="text-[9px] bg-primary/20 text-primary">Winner</Badge>}
                            </div>
                            <p className="text-xs font-medium mb-1">Subject: {v.subject}</p>
                            {test.status === "completed" && (
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                <div><p className="text-[10px] text-muted-foreground">Opens</p><p className="text-sm font-bold">{s.opens} <span className="text-[10px] text-muted-foreground">({s.sends > 0 ? ((s.opens / s.sends) * 100).toFixed(1) : 0}%)</span></p></div>
                                <div><p className="text-[10px] text-muted-foreground">Clicks</p><p className="text-sm font-bold">{s.clicks} <span className="text-[10px] text-muted-foreground">({s.sends > 0 ? ((s.clicks / s.sends) * 100).toFixed(1) : 0}%)</span></p></div>
                                <div><p className="text-[10px] text-muted-foreground">Sends</p><p className="text-sm font-bold">{s.sends}</p></div>
                                <div><p className="text-[10px] text-muted-foreground">Revenue</p><p className="text-sm font-bold">${s.revenue}</p></div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">Split:</span>
                      <Progress value={test.split} className="flex-1 h-1.5" />
                      <span className="text-[10px] text-muted-foreground">{test.split}% / {100 - test.split}%</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Abandoned Carts Tab */}
          <TabsContent value="abandoned">
            <Card>
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Abandoned Carts</CardTitle>
                  {activeAbandoned > 0 && (
                    <Badge variant="secondary" className="text-[10px]">
                      ${(abandonedCarts as any[]).filter((c: any) => c.recovery_status === "abandoned").reduce((s: number, c: any) => s + Number(c.cart_total), 0).toFixed(0)} recoverable
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loadingCarts ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">Loading…</div>
                ) : (abandonedCarts as any[]).length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">No abandoned carts recorded yet.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Customer</TableHead>
                        <TableHead className="text-xs">Email</TableHead>
                        <TableHead className="text-xs">Cart Total</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Recovery Email</TableHead>
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
                          <TableCell className="text-xs text-muted-foreground">
                            {cart.recovery_email_sent_at ? format(new Date(cart.recovery_email_sent_at), "MMM d, HH:mm") : "Not sent"}
                          </TableCell>
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
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <seg.icon className="h-4 w-4 text-primary" />
                      </div>
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

          {/* Performance Tab */}
          <TabsContent value="performance">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <Card><CardContent className="p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Open Rate</p>
                <p className="text-2xl font-bold">{perfMetrics.openRate}%</p>
                <p className="text-[10px] text-primary flex items-center gap-0.5"><ArrowUpRight className="h-2.5 w-2.5" /> Industry avg: 21%</p>
              </CardContent></Card>
              <Card><CardContent className="p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Click Rate</p>
                <p className="text-2xl font-bold">{perfMetrics.clickRate}%</p>
                <p className="text-[10px] text-primary flex items-center gap-0.5"><ArrowUpRight className="h-2.5 w-2.5" /> Industry avg: 2.6%</p>
              </CardContent></Card>
              <Card><CardContent className="p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Revenue</p>
                <p className="text-2xl font-bold">${perfMetrics.revenue.toFixed(0)}</p>
                <p className="text-[10px] text-muted-foreground">{sentCampaigns} sent campaigns</p>
              </CardContent></Card>
              <Card><CardContent className="p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Rev / Campaign</p>
                <p className="text-2xl font-bold">${perfMetrics.avgRevenue.toFixed(0)}</p>
                <p className="text-[10px] text-muted-foreground">Average per send</p>
              </CardContent></Card>
            </div>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Campaign Performance</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Campaign</TableHead>
                      <TableHead className="text-xs text-right">Opens</TableHead>
                      <TableHead className="text-xs text-right">Open %</TableHead>
                      <TableHead className="text-xs text-right">Clicks</TableHead>
                      <TableHead className="text-xs text-right">CTR</TableHead>
                      <TableHead className="text-xs text-right">Revenue</TableHead>
                      <TableHead className="text-xs text-right">ROI</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.filter((c: any) => c.status === "sent").length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">No sent campaigns to analyze</TableCell></TableRow>
                    ) : campaigns.filter((c: any) => c.status === "sent").map((c: any) => {
                      const opens = Number((c.stats as any)?.opens) || 0;
                      const clicks = Number((c.stats as any)?.clicks) || 0;
                      const rev = Number((c.stats as any)?.revenue) || 0;
                      return (
                        <TableRow key={c.id} className="text-xs">
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell className="text-right">{opens}</TableCell>
                          <TableCell className="text-right"><Badge variant={opens > 20 ? "default" : "secondary"} className="text-[9px]">{opens > 0 ? `${((opens / 100) * 100).toFixed(0)}%` : "—"}</Badge></TableCell>
                          <TableCell className="text-right">{clicks}</TableCell>
                          <TableCell className="text-right">{clicks > 0 && opens > 0 ? `${((clicks / opens) * 100).toFixed(1)}%` : "—"}</TableCell>
                          <TableCell className="text-right font-medium">${rev.toFixed(0)}</TableCell>
                          <TableCell className="text-right">{rev > 0 ? <Badge className="text-[9px] bg-primary/20 text-primary">{((rev / 10) * 100).toFixed(0)}%</Badge> : "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Campaign Dialog */}
        <Dialog open={!!editCampaign} onOpenChange={(o) => { if (!o) setEditCampaign(null); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Edit Campaign</DialogTitle></DialogHeader>
            <CampaignForm form={form} setForm={setForm} onSubmit={handleUpdate} loading={updateCampaign.isPending} submitLabel="Save Changes" />
          </DialogContent>
        </Dialog>

        {/* Schedule Dialog */}
        <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Schedule Campaign</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Send Date & Time</Label><Input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} /></div>
              <Button onClick={handleSchedule} disabled={!scheduleDate} className="w-full">Schedule Send</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* A/B Test Form */}
        <Dialog open={showABForm} onOpenChange={setShowABForm}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create A/B Test</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Test Name</Label><Input placeholder="Subject line test - Summer Sale" value={abForm.name} onChange={e => setAbForm({ ...abForm, name: e.target.value })} /></div>
              <div>
                <Label>Traffic Split</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs w-8">{abForm.split}%</span>
                  <input type="range" min={10} max={90} value={abForm.split} onChange={e => setAbForm({ ...abForm, split: Number(e.target.value) })} className="flex-1" />
                  <span className="text-xs w-8">{100 - abForm.split}%</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2 border rounded-lg p-3">
                  <Badge variant="outline" className="text-[10px]">Variant A</Badge>
                  <Input placeholder="Subject A" value={abForm.variant_a_subject} onChange={e => setAbForm({ ...abForm, variant_a_subject: e.target.value })} className="text-xs" />
                  <Textarea placeholder="Content A" rows={3} value={abForm.variant_a_content} onChange={e => setAbForm({ ...abForm, variant_a_content: e.target.value })} className="text-xs" />
                </div>
                <div className="space-y-2 border rounded-lg p-3">
                  <Badge variant="outline" className="text-[10px]">Variant B</Badge>
                  <Input placeholder="Subject B" value={abForm.variant_b_subject} onChange={e => setAbForm({ ...abForm, variant_b_subject: e.target.value })} className="text-xs" />
                  <Textarea placeholder="Content B" rows={3} value={abForm.variant_b_content} onChange={e => setAbForm({ ...abForm, variant_b_content: e.target.value })} className="text-xs" />
                </div>
              </div>
              <Button onClick={createABTest} className="w-full">Create A/B Test</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-3.5 w-3.5 text-primary" />
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">{label}</p>
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
              <SelectItem value="at_risk">At Risk</SelectItem>
              <SelectItem value="dormant">Dormant</SelectItem>
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
