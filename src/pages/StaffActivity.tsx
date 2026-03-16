import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Users, Activity, Clock, Shield, TrendingUp, Search, BarChart3 } from "lucide-react";
import { format, subDays, startOfDay, differenceInDays } from "date-fns";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
} from "recharts";

const COLORS = ["hsl(217, 91%, 50%)", "hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)", "hsl(280, 68%, 55%)", "hsl(0, 72%, 51%)", "hsl(190, 80%, 45%)"];

export default function StaffActivity() {
  const { currentStore } = useAuth();
  const [range, setRange] = useState("30");
  const [search, setSearch] = useState("");

  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ["staff_members", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data } = await supabase.from("store_members" as any).select("user_id, role, created_at").eq("store_id", currentStore.id);
      return data || [];
    },
    enabled: !!currentStore,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["staff_profiles", currentStore?.id],
    queryFn: async () => {
      const ids = (members as any[]).map((m: any) => m.user_id).filter(Boolean);
      if (!ids.length) return [];
      const { data } = await supabase.from("profiles").select("user_id, display_name").in("user_id", ids);
      return data || [];
    },
    enabled: (members as any[]).length > 0,
  });

  const profileMap = new Map((profiles as any[]).map((p: any) => [p.user_id, p.display_name]));

  const { data: activities = [], isLoading: loadingActivities } = useQuery({
    queryKey: ["staff_activity", currentStore?.id, range],
    queryFn: async () => {
      if (!currentStore) return [];
      const since = subDays(new Date(), Number(range)).toISOString();
      const { data } = await supabase.from("activity_log").select("*").eq("store_id", currentStore.id)
        .gte("created_at", since).order("created_at", { ascending: false }).limit(1000);
      return data || [];
    },
    enabled: !!currentStore,
  });

  // Per-user stats
  const userStats = (members as any[]).map((m: any) => {
    const ua = (activities as any[]).filter((a: any) => a.user_id === m.user_id);
    const today = startOfDay(new Date()).toISOString();
    const todayActions = ua.filter((a: any) => a.created_at >= today).length;
    const lastAction = ua[0];
    const actionCounts: Record<string, number> = {};
    ua.forEach((a: any) => { const k = `${a.entity_type}.${a.action}`; actionCounts[k] = (actionCounts[k] || 0) + 1; });
    const topActions = Object.entries(actionCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { user_id: m.user_id, name: profileMap.get(m.user_id) || m.user_id?.slice(0, 8), role: m.role, joined: m.created_at, totalActions: ua.length, todayActions, lastAction, topActions };
  });

  const totalActions = (activities as any[]).length;
  const activeToday = userStats.filter(u => u.todayActions > 0).length;

  // Daily activity chart
  const dailyData = (() => {
    const days = Number(range);
    const result: { date: string; actions: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split("T")[0];
      const count = (activities as any[]).filter((a: any) => a.created_at?.startsWith(ds)).length;
      result.push({ date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), actions: count });
    }
    return result;
  })();

  // Action type breakdown
  const actionBreakdown = (() => {
    const map: Record<string, number> = {};
    (activities as any[]).forEach((a: any) => { map[a.action] = (map[a.action] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  })();

  // Entity breakdown
  const entityBreakdown = (() => {
    const map: Record<string, number> = {};
    (activities as any[]).forEach((a: any) => { map[a.entity_type] = (map[a.entity_type] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  })();

  // Hourly heatmap data
  const hourlyData = (() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: `${i.toString().padStart(2, "0")}:00`, actions: 0 }));
    (activities as any[]).forEach((a: any) => { const h = new Date(a.created_at).getHours(); hours[h].actions++; });
    return hours;
  })();

  // Per-user actions for bar chart
  const userBarData = userStats.sort((a, b) => b.totalActions - a.totalActions).slice(0, 10).map(u => ({
    name: u.name?.slice(0, 12), actions: u.totalActions,
  }));

  const filteredActivities = search
    ? (activities as any[]).filter((a: any) =>
        a.action?.toLowerCase().includes(search.toLowerCase()) ||
        a.entity_type?.toLowerCase().includes(search.toLowerCase()) ||
        profileMap.get(a.user_id)?.toLowerCase().includes(search.toLowerCase())
      )
    : (activities as any[]);

  const loading = loadingMembers || loadingActivities;

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Staff Activity</h1>
            <p className="text-xs text-muted-foreground">Monitor team member actions and productivity</p>
          </div>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7" className="text-xs">Last 7 days</SelectItem>
              <SelectItem value="14" className="text-xs">Last 14 days</SelectItem>
              <SelectItem value="30" className="text-xs">Last 30 days</SelectItem>
              <SelectItem value="90" className="text-xs">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { icon: Users, label: "Team", value: (members as any[]).length, color: "text-primary" },
            { icon: Activity, label: `Actions (${range}d)`, value: totalActions, color: "text-primary" },
            { icon: Clock, label: "Active Today", value: activeToday, color: "text-success" },
            { icon: Shield, label: "Avg/User", value: Math.round(totalActions / Math.max((members as any[]).length, 1)), color: "text-warning" },
            { icon: TrendingUp, label: "Avg/Day", value: Math.round(totalActions / Math.max(Number(range), 1)), color: "text-info" },
          ].map((kpi, i) => (
            <Card key={i}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center"><kpi.icon className={`h-4 w-4 ${kpi.color}`} /></div>
                <div><p className="text-[10px] text-muted-foreground uppercase">{kpi.label}</p><p className="text-lg font-bold">{kpi.value}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="h-8">
            <TabsTrigger value="overview" className="text-xs h-7">Overview</TabsTrigger>
            <TabsTrigger value="members" className="text-xs h-7">Members</TabsTrigger>
            <TabsTrigger value="feed" className="text-xs h-7">Activity Feed</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-3 mt-3">
            <div className="grid grid-cols-2 gap-3">
              {/* Daily Activity */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs">Daily Activity</CardTitle></CardHeader>
                <CardContent className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                      <Area type="monotone" dataKey="actions" fill="hsl(217, 91%, 50%)" fillOpacity={0.15} stroke="hsl(217, 91%, 50%)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Hourly Distribution */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs">Hourly Distribution</CardTitle></CardHeader>
                <CardContent className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={2} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                      <Bar dataKey="actions" fill="hsl(142, 71%, 45%)" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Action Types */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs">By Action Type</CardTitle></CardHeader>
                <CardContent className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={actionBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, value }) => `${name} (${value})`} labelLine={false} fontSize={10}>
                        {actionBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Users */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs">Actions by User</CardTitle></CardHeader>
                <CardContent className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={userBarData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                      <Bar dataKey="actions" fill="hsl(280, 68%, 55%)" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Entity breakdown table */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs">Actions by Entity Type</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs h-7">Entity</TableHead>
                      <TableHead className="text-xs h-7 text-right">Count</TableHead>
                      <TableHead className="text-xs h-7 text-right">% of Total</TableHead>
                      <TableHead className="text-xs h-7">Distribution</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entityBreakdown.map(e => (
                      <TableRow key={e.name} className="text-xs">
                        <TableCell className="py-1.5 capitalize font-medium">{e.name}</TableCell>
                        <TableCell className="py-1.5 text-right font-mono">{e.value}</TableCell>
                        <TableCell className="py-1.5 text-right text-muted-foreground">{(e.value / Math.max(totalActions, 1) * 100).toFixed(1)}%</TableCell>
                        <TableCell className="py-1.5">
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${(e.value / Math.max(entityBreakdown[0]?.value || 1, 1) * 100)}%` }} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="mt-3">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs h-8">Member</TableHead>
                      <TableHead className="text-xs h-8">Role</TableHead>
                      <TableHead className="text-xs h-8 text-right">Actions</TableHead>
                      <TableHead className="text-xs h-8 text-right">Today</TableHead>
                      <TableHead className="text-xs h-8">Last Active</TableHead>
                      <TableHead className="text-xs h-8">Top Actions</TableHead>
                      <TableHead className="text-xs h-8">Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 3 }).map((_, i) => <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-4 w-full" /></TableCell></TableRow>)
                    ) : userStats.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">No staff members found.</TableCell></TableRow>
                    ) : (
                      userStats.sort((a, b) => b.totalActions - a.totalActions).map((u) => (
                        <TableRow key={u.user_id} className="text-xs">
                          <TableCell className="py-2">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                {u.name?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                              <span className="font-medium">{u.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-2"><Badge variant="outline" className="text-[10px] capitalize">{u.role}</Badge></TableCell>
                          <TableCell className="py-2 text-right font-mono font-bold">{u.totalActions}</TableCell>
                          <TableCell className="py-2 text-right">
                            {u.todayActions > 0 ? <Badge className="text-[10px]">{u.todayActions}</Badge> : <span className="text-muted-foreground">0</span>}
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
          </TabsContent>

          {/* Activity Feed Tab */}
          <TabsContent value="feed" className="space-y-3 mt-3">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input className="pl-9 h-8 text-xs" placeholder="Filter by action, entity, user..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Card>
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
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-4 w-full" /></TableCell></TableRow>)
                    ) : (
                      filteredActivities.slice(0, 100).map((a: any) => (
                        <TableRow key={a.id} className="text-xs">
                          <TableCell className="py-1.5 text-muted-foreground whitespace-nowrap">{format(new Date(a.created_at), "MMM d, HH:mm")}</TableCell>
                          <TableCell className="py-1.5">
                            <div className="flex items-center gap-1.5">
                              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary">
                                {(profileMap.get(a.user_id) || a.user_id)?.charAt(0)?.toUpperCase()}
                              </div>
                              <span>{profileMap.get(a.user_id) || a.user_id?.slice(0, 8)}</span>
                            </div>
                          </TableCell>
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
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
