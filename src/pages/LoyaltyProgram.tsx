import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Gift, Star, TrendingUp, Users, Award, Settings2, Percent, ShoppingCart, Crown, Zap, Search } from "lucide-react";
import { toast } from "sonner";

const TIER_COLORS: Record<string, string> = {
  bronze: "bg-amber-700/80 text-primary-foreground",
  silver: "bg-muted text-muted-foreground",
  gold: "bg-primary text-primary-foreground",
  platinum: "bg-accent text-accent-foreground",
};

const TIER_ICONS: Record<string, React.ReactNode> = {
  bronze: <Award className="h-3 w-3" />,
  silver: <Star className="h-3 w-3" />,
  gold: <Crown className="h-3 w-3" />,
  platinum: <Zap className="h-3 w-3" />,
};

interface LoyaltyConfig {
  points_per_dollar: number;
  points_value_cents: number; // how many cents 1 point is worth for redemption
  min_redeem: number;
  signup_bonus: number;
  birthday_bonus: number;
  review_bonus: number;
  referral_bonus: number;
  tier_silver: number;
  tier_gold: number;
  tier_platinum: number;
  silver_multiplier: number;
  gold_multiplier: number;
  platinum_multiplier: number;
  enabled: boolean;
}

const DEFAULT_CONFIG: LoyaltyConfig = {
  points_per_dollar: 1,
  points_value_cents: 1,
  min_redeem: 100,
  signup_bonus: 50,
  birthday_bonus: 100,
  review_bonus: 25,
  referral_bonus: 200,
  tier_silver: 1000,
  tier_gold: 5000,
  tier_platinum: 10000,
  silver_multiplier: 1.5,
  gold_multiplier: 2,
  platinum_multiplier: 3,
  enabled: true,
};

function getConfig(): LoyaltyConfig {
  try { return { ...DEFAULT_CONFIG, ...JSON.parse(localStorage.getItem("loyalty_config") || "{}") }; } catch { return DEFAULT_CONFIG; }
}

export default function LoyaltyProgram() {
  const { currentStore } = useAuth();
  const storeId = currentStore?.id;
  const queryClient = useQueryClient();
  const [showAdjust, setShowAdjust] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [adjustPoints, setAdjustPoints] = useState("");
  const [adjustType, setAdjustType] = useState("earn");
  const [adjustDesc, setAdjustDesc] = useState("");
  const [config, setConfig] = useState<LoyaltyConfig>(getConfig);
  const [search, setSearch] = useState("");

  const saveConfig = (c: LoyaltyConfig) => {
    setConfig(c);
    localStorage.setItem("loyalty_config", JSON.stringify(c));
    toast.success("Configuration saved");
  };

  const { data: members = [] } = useQuery({
    queryKey: ["loyalty_points", storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data } = await supabase.from("loyalty_points" as any).select("*").eq("store_id", storeId);
      return data || [];
    },
    enabled: !!storeId,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["loyalty_transactions", storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data } = await supabase.from("loyalty_transactions" as any).select("*").eq("store_id", storeId).order("created_at", { ascending: false }).limit(50);
      return data || [];
    },
    enabled: !!storeId,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers_lookup", storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data } = await supabase.from("customers").select("id, name, email").eq("store_id", storeId);
      return data || [];
    },
    enabled: !!storeId,
  });

  const customerMap = new Map(customers.map((c: any) => [c.id, c]));
  const totalMembers = members.length;
  const totalPoints = members.reduce((s: number, m: any) => s + (m.balance || 0), 0);
  const totalEarned = members.reduce((s: number, m: any) => s + (m.lifetime_earned || 0), 0);
  const totalRedeemed = members.reduce((s: number, m: any) => s + (m.lifetime_redeemed || 0), 0);
  const redemptionValue = (totalPoints * config.points_value_cents / 100);

  const tierCounts = {
    bronze: members.filter((m: any) => m.tier === "bronze").length,
    silver: members.filter((m: any) => m.tier === "silver").length,
    gold: members.filter((m: any) => m.tier === "gold").length,
    platinum: members.filter((m: any) => m.tier === "platinum").length,
  };

  const filteredMembers = members.filter((m: any) => {
    if (!search) return true;
    const customer = customerMap.get(m.customer_id);
    return customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
           customer?.email?.toLowerCase().includes(search.toLowerCase());
  });

  const handleAdjust = async () => {
    if (!selectedMember || !adjustPoints || !storeId) return;
    const pts = parseInt(adjustPoints);
    if (isNaN(pts) || pts <= 0) return;

    const actualPts = adjustType === "redeem" ? -pts : pts;

    await supabase.from("loyalty_transactions" as any).insert({
      store_id: storeId,
      customer_id: selectedMember.customer_id,
      points: actualPts,
      transaction_type: adjustType,
      description: adjustDesc || (adjustType === "earn" ? "Manual adjustment" : "Points redeemed"),
    });

    const newBalance = (selectedMember.balance || 0) + actualPts;
    const updates: any = { balance: Math.max(0, newBalance), updated_at: new Date().toISOString() };
    if (adjustType === "earn" || adjustType === "bonus") updates.lifetime_earned = (selectedMember.lifetime_earned || 0) + pts;
    else updates.lifetime_redeemed = (selectedMember.lifetime_redeemed || 0) + pts;

    const earned = updates.lifetime_earned || selectedMember.lifetime_earned || 0;
    if (earned >= config.tier_platinum) updates.tier = "platinum";
    else if (earned >= config.tier_gold) updates.tier = "gold";
    else if (earned >= config.tier_silver) updates.tier = "silver";
    else updates.tier = "bronze";

    await supabase.from("loyalty_points" as any).update(updates).eq("id", selectedMember.id);

    toast.success(`${adjustType === "earn" ? "Added" : "Redeemed"} ${pts} points`);
    setShowAdjust(false);
    setAdjustPoints("");
    setAdjustDesc("");
    queryClient.invalidateQueries({ queryKey: ["loyalty_points"] });
    queryClient.invalidateQueries({ queryKey: ["loyalty_transactions"] });
  };

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Loyalty Program</h1>
            <p className="text-xs text-muted-foreground">Points, tiers, earning rules, and member management</p>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={config.enabled} onCheckedChange={v => saveConfig({ ...config, enabled: v })} />
            <span className="text-xs">{config.enabled ? "Active" : "Disabled"}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center"><Users className="h-4 w-4 text-primary" /></div>
              <div><p className="text-[10px] text-muted-foreground uppercase">Members</p><p className="text-lg font-bold">{totalMembers}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-success/10 flex items-center justify-center"><Star className="h-4 w-4 text-success" /></div>
              <div><p className="text-[10px] text-muted-foreground uppercase">Active Points</p><p className="text-lg font-bold">{totalPoints.toLocaleString()}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-info/10 flex items-center justify-center"><TrendingUp className="h-4 w-4 text-info" /></div>
              <div><p className="text-[10px] text-muted-foreground uppercase">Earned</p><p className="text-lg font-bold">{totalEarned.toLocaleString()}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-warning/10 flex items-center justify-center"><Gift className="h-4 w-4 text-warning" /></div>
              <div><p className="text-[10px] text-muted-foreground uppercase">Redeemed</p><p className="text-lg font-bold">{totalRedeemed.toLocaleString()}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-destructive/10 flex items-center justify-center"><ShoppingCart className="h-4 w-4 text-destructive" /></div>
              <div><p className="text-[10px] text-muted-foreground uppercase">Liability</p><p className="text-lg font-bold">${redemptionValue.toFixed(2)}</p></div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="members">
          <TabsList className="h-8">
            <TabsTrigger value="members" className="text-xs h-7">Members ({totalMembers})</TabsTrigger>
            <TabsTrigger value="activity" className="text-xs h-7">Activity</TabsTrigger>
            <TabsTrigger value="tiers" className="text-xs h-7">Tiers</TabsTrigger>
            <TabsTrigger value="rules" className="text-xs h-7">Earning Rules</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs h-7">Settings</TabsTrigger>
          </TabsList>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-3">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input className="pl-9 h-8 text-xs" placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Card>
              <CardContent className="p-0">
                {filteredMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No loyalty members yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs h-8">Customer</TableHead>
                        <TableHead className="text-xs h-8">Email</TableHead>
                        <TableHead className="text-xs h-8">Tier</TableHead>
                        <TableHead className="text-xs h-8 text-right">Balance</TableHead>
                        <TableHead className="text-xs h-8 text-right">Earned</TableHead>
                        <TableHead className="text-xs h-8 text-right">Redeemed</TableHead>
                        <TableHead className="text-xs h-8 text-right">Value</TableHead>
                        <TableHead className="text-xs h-8 w-24"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMembers.map((m: any) => {
                        const customer = customerMap.get(m.customer_id);
                        const pointValue = ((m.balance || 0) * config.points_value_cents / 100);
                        return (
                          <TableRow key={m.id} className="text-xs">
                            <TableCell className="py-2 font-medium">{customer?.name || "Unknown"}</TableCell>
                            <TableCell className="py-2 text-muted-foreground">{customer?.email || "—"}</TableCell>
                            <TableCell className="py-2">
                              <Badge className={`text-[10px] gap-1 ${TIER_COLORS[m.tier] || ""}`}>
                                {TIER_ICONS[m.tier]}{m.tier}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-2 text-right font-mono font-bold">{(m.balance || 0).toLocaleString()}</TableCell>
                            <TableCell className="py-2 text-right font-mono text-muted-foreground">{(m.lifetime_earned || 0).toLocaleString()}</TableCell>
                            <TableCell className="py-2 text-right font-mono text-muted-foreground">{(m.lifetime_redeemed || 0).toLocaleString()}</TableCell>
                            <TableCell className="py-2 text-right text-primary font-medium">${pointValue.toFixed(2)}</TableCell>
                            <TableCell className="py-2 text-right">
                              <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1" onClick={() => { setSelectedMember(m); setShowAdjust(true); }}>
                                <Award className="h-3 w-3" /> Adjust
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardContent className="p-0">
                {transactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No transactions yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs h-8">Customer</TableHead>
                        <TableHead className="text-xs h-8">Type</TableHead>
                        <TableHead className="text-xs h-8">Description</TableHead>
                        <TableHead className="text-xs h-8 text-right">Points</TableHead>
                        <TableHead className="text-xs h-8">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx: any) => (
                        <TableRow key={tx.id} className="text-xs">
                          <TableCell className="py-2">{customerMap.get(tx.customer_id)?.name || "Unknown"}</TableCell>
                          <TableCell className="py-2">
                            <Badge variant={tx.transaction_type === "earn" || tx.transaction_type === "bonus" ? "default" : "secondary"} className="text-[10px]">{tx.transaction_type}</Badge>
                          </TableCell>
                          <TableCell className="py-2 text-muted-foreground">{tx.description}</TableCell>
                          <TableCell className={`py-2 text-right font-mono font-bold ${tx.points > 0 ? "text-success" : "text-destructive"}`}>
                            {tx.points > 0 ? "+" : ""}{tx.points}
                          </TableCell>
                          <TableCell className="py-2 text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tiers Tab */}
          <TabsContent value="tiers">
            <div className="grid grid-cols-4 gap-3">
              {(["bronze", "silver", "gold", "platinum"] as const).map(tier => (
                <Card key={tier} className="relative overflow-hidden">
                  <div className={`absolute top-0 left-0 right-0 h-1 ${TIER_COLORS[tier]}`} />
                  <CardContent className="p-4 pt-5 text-center">
                    <div className="text-2xl mb-1">{TIER_ICONS[tier]}</div>
                    <h3 className="font-bold capitalize text-sm">{tier}</h3>
                    <p className="text-2xl font-bold mt-2">{tierCounts[tier]}</p>
                    <p className="text-[10px] text-muted-foreground">members</p>
                    <div className="mt-3 pt-3 border-t text-xs text-muted-foreground space-y-1">
                      <p>Threshold: <span className="font-medium text-foreground">{config[`tier_${tier}` as keyof LoyaltyConfig]?.toLocaleString() || 0} pts</span></p>
                      <p>Multiplier: <span className="font-medium text-foreground">{tier === "bronze" ? "1x" : `${config[`${tier}_multiplier` as keyof LoyaltyConfig]}x`}</span></p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Earning Rules Tab */}
          <TabsContent value="rules">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><Percent className="h-4 w-4" /> Earning Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs h-8">Action</TableHead>
                      <TableHead className="text-xs h-8">Description</TableHead>
                      <TableHead className="text-xs h-8 text-right">Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="text-xs">
                      <TableCell className="py-2 font-medium">Purchase</TableCell>
                      <TableCell className="py-2 text-muted-foreground">Points earned per dollar spent</TableCell>
                      <TableCell className="py-2 text-right font-mono font-bold">{config.points_per_dollar} pts/$</TableCell>
                    </TableRow>
                    <TableRow className="text-xs">
                      <TableCell className="py-2 font-medium">Sign Up</TableCell>
                      <TableCell className="py-2 text-muted-foreground">Welcome bonus for new loyalty members</TableCell>
                      <TableCell className="py-2 text-right font-mono font-bold">{config.signup_bonus} pts</TableCell>
                    </TableRow>
                    <TableRow className="text-xs">
                      <TableCell className="py-2 font-medium">Birthday</TableCell>
                      <TableCell className="py-2 text-muted-foreground">Annual birthday bonus</TableCell>
                      <TableCell className="py-2 text-right font-mono font-bold">{config.birthday_bonus} pts</TableCell>
                    </TableRow>
                    <TableRow className="text-xs">
                      <TableCell className="py-2 font-medium">Review</TableCell>
                      <TableCell className="py-2 text-muted-foreground">Points for submitting a product review</TableCell>
                      <TableCell className="py-2 text-right font-mono font-bold">{config.review_bonus} pts</TableCell>
                    </TableRow>
                    <TableRow className="text-xs">
                      <TableCell className="py-2 font-medium">Referral</TableCell>
                      <TableCell className="py-2 text-muted-foreground">Points when a referred friend makes a purchase</TableCell>
                      <TableCell className="py-2 text-right font-mono font-bold">{config.referral_bonus} pts</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <p className="text-[10px] text-muted-foreground mt-3">Modify values in the Settings tab.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Points & Redemption</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Points per $1 spent</Label>
                      <Input type="number" className="h-8 text-xs mt-1" value={config.points_per_dollar}
                        onChange={e => setConfig(c => ({ ...c, points_per_dollar: Number(e.target.value) || 1 }))} />
                    </div>
                    <div>
                      <Label className="text-xs">Point value (cents)</Label>
                      <Input type="number" className="h-8 text-xs mt-1" value={config.points_value_cents}
                        onChange={e => setConfig(c => ({ ...c, points_value_cents: Number(e.target.value) || 1 }))} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Min points to redeem</Label>
                    <Input type="number" className="h-8 text-xs mt-1" value={config.min_redeem}
                      onChange={e => setConfig(c => ({ ...c, min_redeem: Number(e.target.value) || 0 }))} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Bonus Points</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Sign-up bonus</Label>
                      <Input type="number" className="h-8 text-xs mt-1" value={config.signup_bonus} onChange={e => setConfig(c => ({ ...c, signup_bonus: Number(e.target.value) }))} /></div>
                    <div><Label className="text-xs">Birthday bonus</Label>
                      <Input type="number" className="h-8 text-xs mt-1" value={config.birthday_bonus} onChange={e => setConfig(c => ({ ...c, birthday_bonus: Number(e.target.value) }))} /></div>
                    <div><Label className="text-xs">Review bonus</Label>
                      <Input type="number" className="h-8 text-xs mt-1" value={config.review_bonus} onChange={e => setConfig(c => ({ ...c, review_bonus: Number(e.target.value) }))} /></div>
                    <div><Label className="text-xs">Referral bonus</Label>
                      <Input type="number" className="h-8 text-xs mt-1" value={config.referral_bonus} onChange={e => setConfig(c => ({ ...c, referral_bonus: Number(e.target.value) }))} /></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-2">
                <CardHeader className="pb-3"><CardTitle className="text-sm">Tier Thresholds & Multipliers</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {(["silver", "gold", "platinum"] as const).map(tier => (
                      <div key={tier} className="space-y-2 border rounded-lg p-3">
                        <h4 className="text-xs font-bold capitalize flex items-center gap-1">{TIER_ICONS[tier]} {tier}</h4>
                        <div>
                          <Label className="text-[10px]">Points threshold</Label>
                          <Input type="number" className="h-7 text-xs mt-0.5" value={config[`tier_${tier}` as keyof LoyaltyConfig] as number}
                            onChange={e => setConfig(c => ({ ...c, [`tier_${tier}`]: Number(e.target.value) }))} />
                        </div>
                        <div>
                          <Label className="text-[10px]">Earn multiplier</Label>
                          <Input type="number" step="0.1" className="h-7 text-xs mt-0.5" value={config[`${tier}_multiplier` as keyof LoyaltyConfig] as number}
                            onChange={e => setConfig(c => ({ ...c, [`${tier}_multiplier`]: Number(e.target.value) }))} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button size="sm" className="mt-4" onClick={() => saveConfig(config)}>Save Configuration</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Adjust Dialog */}
      <Dialog open={showAdjust} onOpenChange={setShowAdjust}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-sm">Adjust Points</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Member: <span className="font-medium text-foreground">{customerMap.get(selectedMember?.customer_id)?.name || "Unknown"}</span>
              {" · "}Current balance: <span className="font-bold">{selectedMember?.balance?.toLocaleString() || 0}</span> pts
            </p>
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={adjustType} onValueChange={setAdjustType}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="earn" className="text-xs">Add Points</SelectItem>
                  <SelectItem value="redeem" className="text-xs">Redeem Points</SelectItem>
                  <SelectItem value="bonus" className="text-xs">Bonus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Points</Label>
              <Input type="number" className="h-8 text-xs" value={adjustPoints} onChange={e => setAdjustPoints(e.target.value)} placeholder="100" />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Input className="h-8 text-xs" value={adjustDesc} onChange={e => setAdjustDesc(e.target.value)} placeholder="Manual adjustment" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowAdjust(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAdjust}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
