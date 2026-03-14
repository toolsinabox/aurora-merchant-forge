import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Users, Activity, Clock, Shield } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";

export default function StaffActivity() {
  const { currentStore } = useAuth();

  // Get team members
  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ["staff_members", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data, error } = await supabase
        .from("store_members" as any)
        .select("user_id, role, created_at")
        .eq("store_id", currentStore.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentStore,
  });

  // Get activity logs for last 30 days
  const { data: activities = [], isLoading: loadingActivities } = useQuery({
    queryKey: ["staff_activity", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const since = subDays(new Date(), 30).toISOString();
      const { data, error } = await supabase
        .from("activity_log")
        .select("*")
        .eq("store_id", currentStore.id)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentStore,
  });

  // Aggregate per user
  const userStats = (members as any[]).map((m: any) => {
    const userActivities = (activities as any[]).filter((a: any) => a.user_id === m.user_id);
    const today = startOfDay(new Date()).toISOString();
    const todayActions = userActivities.filter((a: any) => a.created_at >= today).length;
    const lastAction = userActivities[0];

    // Action breakdown
    const actionCounts: Record<string, number> = {};
    userActivities.forEach((a: any) => {
      const key = `${a.entity_type}.${a.action}`;
      actionCounts[key] = (actionCounts[key] || 0) + 1;
    });
    const topActions = Object.entries(actionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      user_id: m.user_id,
      role: m.role,
      joined: m.created_at,
      totalActions: userActivities.length,
      todayActions,
      lastAction,
      topActions,
    };
  });

  const totalActions = (activities as any[]).length;
  const activeToday = userStats.filter(u => u.todayActions > 0).length;

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div>
          <h1 className="text-lg font-semibold">Staff Activity</h1>
          <p className="text-xs text-muted-foreground">Monitor team member actions and activity (last 30 days)</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-3">
          <Card><CardContent className="p-4">
            <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /><div><p className="text-lg font-bold">{(members as any[]).length}</p><p className="text-[10px] text-muted-foreground">Team Members</p></div></div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-muted-foreground" /><div><p className="text-2xl font-bold">{totalActions}</p><p className="text-[10px] text-muted-foreground">Actions (30d)</p></div></div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><div><p className="text-2xl font-bold">{activeToday}</p><p className="text-[10px] text-muted-foreground">Active Today</p></div></div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-muted-foreground" /><div><p className="text-2xl font-bold">{Math.round(totalActions / Math.max((members as any[]).length, 1))}</p><p className="text-[10px] text-muted-foreground">Avg Actions/User</p></div></div>
          </CardContent></Card>
        </div>

        {/* Staff Breakdown */}
        <Card>
          <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Staff Members</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-8">User ID</TableHead>
                  <TableHead className="text-xs h-8">Role</TableHead>
                  <TableHead className="text-xs h-8">Actions (30d)</TableHead>
                  <TableHead className="text-xs h-8">Today</TableHead>
                  <TableHead className="text-xs h-8">Last Active</TableHead>
                  <TableHead className="text-xs h-8">Top Actions</TableHead>
                  <TableHead className="text-xs h-8">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingMembers || loadingActivities ? (
                  Array.from({ length: 3 }).map((_, i) => <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-4 w-full" /></TableCell></TableRow>)
                ) : userStats.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">No staff members found.</TableCell></TableRow>
                ) : (
                  userStats.map((u) => (
                    <TableRow key={u.user_id} className="text-xs">
                      <TableCell className="py-2 font-mono text-[10px]">{u.user_id.slice(0, 8)}…</TableCell>
                      <TableCell className="py-2"><Badge variant="outline" className="text-[10px] capitalize">{u.role}</Badge></TableCell>
                      <TableCell className="py-2 font-medium">{u.totalActions}</TableCell>
                      <TableCell className="py-2">
                        {u.todayActions > 0 ? (
                          <Badge variant="default" className="text-[10px]">{u.todayActions}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2 text-muted-foreground">
                        {u.lastAction ? format(new Date(u.lastAction.created_at), "MMM d, HH:mm") : "Never"}
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex flex-wrap gap-0.5">
                          {u.topActions.slice(0, 3).map(([action, count]) => (
                            <Badge key={action} variant="secondary" className="text-[9px]">{action} ({count})</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-muted-foreground">{format(new Date(u.joined), "MMM d, yyyy")}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card>
          <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Recent Activity</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-8">Time</TableHead>
                  <TableHead className="text-xs h-8">User</TableHead>
                  <TableHead className="text-xs h-8">Action</TableHead>
                  <TableHead className="text-xs h-8">Entity</TableHead>
                  <TableHead className="text-xs h-8">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingActivities ? (
                  Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-4 w-full" /></TableCell></TableRow>)
                ) : (
                  (activities as any[]).slice(0, 50).map((a: any) => (
                    <TableRow key={a.id} className="text-xs">
                      <TableCell className="py-1.5 text-muted-foreground">{format(new Date(a.created_at), "MMM d, HH:mm")}</TableCell>
                      <TableCell className="py-1.5 font-mono text-[10px]">{a.user_id.slice(0, 8)}…</TableCell>
                      <TableCell className="py-1.5"><Badge variant="outline" className="text-[10px]">{a.action}</Badge></TableCell>
                      <TableCell className="py-1.5 capitalize">{a.entity_type}</TableCell>
                      <TableCell className="py-1.5 text-muted-foreground max-w-[200px] truncate">
                        {a.details ? JSON.stringify(a.details).slice(0, 60) : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
