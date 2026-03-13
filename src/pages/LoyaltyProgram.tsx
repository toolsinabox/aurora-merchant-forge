import { useState } from "react";
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
import { useData } from "@/hooks/use-data";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Gift, Star, TrendingUp, Users, Plus, Award } from "lucide-react";
import { toast } from "sonner";

const TIER_COLORS: Record<string, string> = {
  bronze: "bg-amber-700 text-white",
  silver: "bg-gray-400 text-white",
  gold: "bg-yellow-500 text-white",
  platinum: "bg-purple-600 text-white",
};

export default function LoyaltyProgram() {
  const { storeId } = useAuth();
  const { data: members, refetch } = useData("loyalty_points" as any, storeId);
  const { data: transactions } = useData("loyalty_transactions" as any, storeId);
  const { data: customers } = useData("customers", storeId);
  const { data: storeData } = useData("stores", storeId);
  const [showAdjust, setShowAdjust] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [adjustPoints, setAdjustPoints] = useState("");
  const [adjustType, setAdjustType] = useState("earn");
  const [adjustDesc, setAdjustDesc] = useState("");

  const store = (storeData as any)?.[0];
  const loyaltyConfig = store?.loyalty_config || { enabled: false, points_per_dollar: 1, redemption_rate: 100, signup_bonus: 0 };

  const membersList = (members as any[]) || [];
  const txList = (transactions as any[]) || [];
  const customerMap = new Map((customers as any[])?.map(c => [c.id, c]) || []);

  const totalMembers = membersList.length;
  const totalPoints = membersList.reduce((s, m) => s + (m.balance || 0), 0);
  const totalEarned = membersList.reduce((s, m) => s + (m.lifetime_earned || 0), 0);
  const totalRedeemed = membersList.reduce((s, m) => s + (m.lifetime_redeemed || 0), 0);

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
    if (adjustType === "earn") updates.lifetime_earned = (selectedMember.lifetime_earned || 0) + pts;
    else updates.lifetime_redeemed = (selectedMember.lifetime_redeemed || 0) + pts;

    // Auto-tier
    const earned = updates.lifetime_earned || selectedMember.lifetime_earned || 0;
    if (earned >= 10000) updates.tier = "platinum";
    else if (earned >= 5000) updates.tier = "gold";
    else if (earned >= 1000) updates.tier = "silver";
    else updates.tier = "bronze";

    await supabase.from("loyalty_points" as any).update(updates).eq("id", selectedMember.id);

    toast.success(`${adjustType === "earn" ? "Added" : "Redeemed"} ${pts} points`);
    setShowAdjust(false);
    setAdjustPoints("");
    setAdjustDesc("");
    refetch();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Loyalty Program</h1>
            <p className="text-sm text-muted-foreground">Manage points, tiers, and member rewards</p>
          </div>
          <Badge variant={loyaltyConfig.enabled ? "default" : "outline"}>
            {loyaltyConfig.enabled ? "Active" : "Disabled"}
          </Badge>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold">{totalMembers}</p>
              <p className="text-xs text-muted-foreground">Members</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <Star className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
              <p className="text-2xl font-bold">{totalPoints.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Active Points</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-500" />
              <p className="text-2xl font-bold">{totalEarned.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Lifetime Earned</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <Gift className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{totalRedeemed.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Redeemed</p>
            </CardContent>
          </Card>
        </div>

        {/* Config */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Program Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <Label className="text-xs text-muted-foreground">Points per $1</Label>
                <p className="font-medium">{loyaltyConfig.points_per_dollar}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Redemption Rate</Label>
                <p className="font-medium">{loyaltyConfig.redemption_rate} pts = $1</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Signup Bonus</Label>
                <p className="font-medium">{loyaltyConfig.signup_bonus} pts</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Tiers</Label>
                <div className="flex gap-1 mt-1">
                  {["bronze", "silver", "gold", "platinum"].map(t => (
                    <Badge key={t} className={`text-[9px] ${TIER_COLORS[t]}`}>{t}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Members */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Members</CardTitle>
          </CardHeader>
          <CardContent>
            {membersList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No loyalty members yet. Points are earned automatically on orders when the program is enabled.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Customer</TableHead>
                    <TableHead className="text-xs">Tier</TableHead>
                    <TableHead className="text-xs text-right">Balance</TableHead>
                    <TableHead className="text-xs text-right">Earned</TableHead>
                    <TableHead className="text-xs text-right">Redeemed</TableHead>
                    <TableHead className="text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {membersList.map((m: any) => {
                    const customer = customerMap.get(m.customer_id);
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="text-sm font-medium">{customer?.name || "Unknown"}</TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] ${TIER_COLORS[m.tier] || ""}`}>{m.tier}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">{m.balance?.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">{m.lifetime_earned?.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">{m.lifetime_redeemed?.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => { setSelectedMember(m); setShowAdjust(true); }}>
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

        {/* Recent Transactions */}
        {txList.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Customer</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Description</TableHead>
                    <TableHead className="text-xs text-right">Points</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {txList.slice(0, 20).map((tx: any) => {
                    const customer = customerMap.get(tx.customer_id);
                    return (
                      <TableRow key={tx.id}>
                        <TableCell className="text-sm">{customer?.name || "Unknown"}</TableCell>
                        <TableCell>
                          <Badge variant={tx.transaction_type === "earn" ? "default" : "secondary"} className="text-[10px]">
                            {tx.transaction_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{tx.description}</TableCell>
                        <TableCell className={`text-right font-mono text-sm ${tx.points > 0 ? "text-green-600" : "text-red-500"}`}>
                          {tx.points > 0 ? "+" : ""}{tx.points}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Adjust Dialog */}
      <Dialog open={showAdjust} onOpenChange={setShowAdjust}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Points</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={adjustType} onValueChange={setAdjustType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="earn">Add Points</SelectItem>
                  <SelectItem value="redeem">Redeem Points</SelectItem>
                  <SelectItem value="bonus">Bonus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Points</Label>
              <Input type="number" value={adjustPoints} onChange={e => setAdjustPoints(e.target.value)} placeholder="100" />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Input value={adjustDesc} onChange={e => setAdjustDesc(e.target.value)} placeholder="Manual adjustment" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdjust(false)}>Cancel</Button>
            <Button onClick={handleAdjust}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
