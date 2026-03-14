import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Gift, Star, TrendingUp, Users, Award } from "lucide-react";
import { toast } from "sonner";

const TIER_COLORS: Record<string, string> = {
  bronze: "bg-amber-700 text-primary-foreground",
  silver: "bg-muted text-muted-foreground",
  gold: "bg-primary text-primary-foreground",
  platinum: "bg-accent text-accent-foreground",
};

export default function LoyaltyProgram() {
  const { currentStore } = useAuth();
  const storeId = currentStore?.id;
  const queryClient = useQueryClient();
  const [showAdjust, setShowAdjust] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [adjustPoints, setAdjustPoints] = useState("");
  const [adjustType, setAdjustType] = useState("earn");
  const [adjustDesc, setAdjustDesc] = useState("");

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
      const { data } = await supabase.from("loyalty_transactions" as any).select("*").eq("store_id", storeId).order("created_at", { ascending: false }).limit(20);
      return data || [];
    },
    enabled: !!storeId,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers_lookup", storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data } = await supabase.from("customers").select("id, name").eq("store_id", storeId);
      return data || [];
    },
    enabled: !!storeId,
  });

  const customerMap = new Map(customers.map((c: any) => [c.id, c]));
  const totalMembers = members.length;
  const totalPoints = members.reduce((s: number, m: any) => s + (m.balance || 0), 0);
  const totalEarned = members.reduce((s: number, m: any) => s + (m.lifetime_earned || 0), 0);
  const totalRedeemed = members.reduce((s: number, m: any) => s + (m.lifetime_redeemed || 0), 0);

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
    if (earned >= 10000) updates.tier = "platinum";
    else if (earned >= 5000) updates.tier = "gold";
    else if (earned >= 1000) updates.tier = "silver";
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
            <p className="text-xs text-muted-foreground">Manage points, tiers, and member rewards</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger-children">
          <Card className="card-hover">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center"><Users className="h-4 w-4 text-primary" /></div>
              <div><p className="text-2xs text-muted-foreground">Members</p><p className="text-lg font-bold">{totalMembers}</p></div>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-success/10 flex items-center justify-center"><Star className="h-4 w-4 text-success" /></div>
              <div><p className="text-2xs text-muted-foreground">Active Points</p><p className="text-lg font-bold">{totalPoints.toLocaleString()}</p></div>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-info/10 flex items-center justify-center"><TrendingUp className="h-4 w-4 text-info" /></div>
              <div><p className="text-2xs text-muted-foreground">Lifetime Earned</p><p className="text-lg font-bold">{totalEarned.toLocaleString()}</p></div>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-warning/10 flex items-center justify-center"><Gift className="h-4 w-4 text-warning" /></div>
              <div><p className="text-2xs text-muted-foreground">Redeemed</p><p className="text-lg font-bold">{totalRedeemed.toLocaleString()}</p></div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Members</CardTitle>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No loyalty members yet.</p>
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
                  {members.map((m: any) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-sm font-medium">{customerMap.get(m.customer_id)?.name || "Unknown"}</TableCell>
                      <TableCell><Badge className={`text-[10px] ${TIER_COLORS[m.tier] || ""}`}>{m.tier}</Badge></TableCell>
                      <TableCell className="text-right font-mono text-sm">{m.balance?.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">{m.lifetime_earned?.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">{m.lifetime_redeemed?.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => { setSelectedMember(m); setShowAdjust(true); }}>
                          <Award className="h-3 w-3" /> Adjust
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {transactions.length > 0 && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Recent Transactions</CardTitle></CardHeader>
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
                  {transactions.map((tx: any) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-sm">{customerMap.get(tx.customer_id)?.name || "Unknown"}</TableCell>
                      <TableCell><Badge variant={tx.transaction_type === "earn" ? "default" : "secondary"} className="text-[10px]">{tx.transaction_type}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{tx.description}</TableCell>
                      <TableCell className={`text-right font-mono text-sm ${tx.points > 0 ? "text-primary" : "text-destructive"}`}>{tx.points > 0 ? "+" : ""}{tx.points}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showAdjust} onOpenChange={setShowAdjust}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adjust Points</DialogTitle></DialogHeader>
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
