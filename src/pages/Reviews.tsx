import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, Star, Check, X, Trash2, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function Reviews() {
  const { currentStore } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [replyDialog, setReplyDialog] = useState<{ open: boolean; review: any | null }>({ open: false, review: null });
  const [replyText, setReplyText] = useState("");

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["admin-reviews", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data, error } = await supabase
        .from("product_reviews" as any)
        .select("*, products(title)")
        .eq("store_id", currentStore.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!currentStore,
  });

  const updateReview = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; is_approved?: boolean; admin_reply?: string | null; admin_reply_at?: string | null }) => {
      const { error } = await supabase
        .from("product_reviews" as any)
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Review updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const bulkUpdate = useMutation({
    mutationFn: async ({ ids, is_approved }: { ids: string[]; is_approved: boolean }) => {
      const { error } = await supabase
        .from("product_reviews" as any)
        .update({ is_approved })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
      setSelected([]);
      toast.success("Reviews updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteReview = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_reviews" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Review deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("product_reviews" as any).delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
      setSelected([]);
      toast.success("Reviews deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleReply = () => {
    if (!replyDialog.review) return;
    updateReview.mutate({
      id: replyDialog.review.id,
      admin_reply: replyText || null,
      admin_reply_at: replyText ? new Date().toISOString() : null,
    });
    setReplyDialog({ open: false, review: null });
    setReplyText("");
  };

  const openReplyDialog = (review: any) => {
    setReplyText(review.admin_reply || "");
    setReplyDialog({ open: true, review });
  };

  const filtered = (reviews as any[]).filter((r) => {
    const matchSearch =
      (r.author_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.products?.title || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "approved" && r.is_approved) ||
      (statusFilter === "pending" && !r.is_approved);
    return matchSearch && matchStatus;
  });

  const toggleSelect = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const toggleAll = () =>
    setSelected((prev) => prev.length === filtered.length ? [] : filtered.map((r: any) => r.id));

  const avgRating = reviews.length > 0
    ? ((reviews as any[]).reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "0";
  const approvedCount = (reviews as any[]).filter((r) => r.is_approved).length;
  const pendingCount = (reviews as any[]).filter((r) => !r.is_approved).length;

  const Stars = ({ count }: { count: number }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`h-3 w-3 ${s <= count ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div>
          <h1 className="text-lg font-semibold">Product Reviews</h1>
          <p className="text-xs text-muted-foreground">{reviews.length} total reviews · Avg {avgRating}★ · {approvedCount} approved · {pendingCount} pending</p>
        </div>

        {selected.length > 0 && (
          <Card>
            <CardContent className="p-3 flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">{selected.length} selected</Badge>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => bulkUpdate.mutate({ ids: selected, is_approved: true })}>
                <Check className="h-3 w-3" /> Approve
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => bulkUpdate.mutate({ ids: selected, is_approved: false })}>
                <X className="h-3 w-3" /> Reject
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-destructive" onClick={() => bulkDelete.mutate(selected)}>
                <Trash2 className="h-3 w-3" /> Delete
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-0">
            <div className="flex items-center gap-2 p-3 border-b">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search reviews..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 pl-8 text-xs" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All</SelectItem>
                  <SelectItem value="approved" className="text-xs">Approved</SelectItem>
                  <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8 h-8">
                    <Checkbox checked={selected.length === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
                  </TableHead>
                  <TableHead className="text-xs h-8">Product</TableHead>
                  <TableHead className="text-xs h-8">Author</TableHead>
                  <TableHead className="text-xs h-8">Rating</TableHead>
                  <TableHead className="text-xs h-8">Review</TableHead>
                  <TableHead className="text-xs h-8">Reply</TableHead>
                  <TableHead className="text-xs h-8">Status</TableHead>
                  <TableHead className="text-xs h-8">Date</TableHead>
                  <TableHead className="text-xs h-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={9}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-xs text-muted-foreground py-6">No reviews yet.</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r: any) => (
                    <TableRow key={r.id} className="text-xs">
                      <TableCell className="py-2">
                        <Checkbox checked={selected.includes(r.id)} onCheckedChange={() => toggleSelect(r.id)} />
                      </TableCell>
                      <TableCell className="py-2 font-medium max-w-[150px] truncate">{r.products?.title || "—"}</TableCell>
                      <TableCell className="py-2">{r.author_name}</TableCell>
                      <TableCell className="py-2"><Stars count={r.rating} /></TableCell>
                      <TableCell className="py-2 max-w-[200px] truncate">{r.title || r.body || "—"}</TableCell>
                      <TableCell className="py-2">
                        {r.admin_reply ? (
                          <Badge variant="secondary" className="text-[10px] gap-1 cursor-pointer" onClick={() => openReplyDialog(r)}>
                            <MessageSquare className="h-2.5 w-2.5" /> Replied
                          </Badge>
                        ) : (
                          <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 px-1.5" onClick={() => openReplyDialog(r)}>
                            <MessageSquare className="h-2.5 w-2.5" /> Reply
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="py-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-medium ${
                          r.is_approved ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                        }`}>
                          {r.is_approved ? "Approved" : "Pending"}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="py-2">
                        <div className="flex gap-1">
                          {r.is_approved ? (
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Unapprove" onClick={() => updateReview.mutate({ id: r.id, is_approved: false })}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Approve" onClick={() => updateReview.mutate({ id: r.id, is_approved: true })}>
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="Delete" onClick={() => deleteReview.mutate(r.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Reply Dialog */}
      <Dialog open={replyDialog.open} onOpenChange={(open) => !open && setReplyDialog({ open: false, review: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Reply to Review</DialogTitle>
          </DialogHeader>
          {replyDialog.review && (
            <div className="space-y-3">
              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <Stars count={replyDialog.review.rating} />
                  <span className="text-xs font-medium">{replyDialog.review.author_name}</span>
                </div>
                {replyDialog.review.title && <p className="text-xs font-medium">{replyDialog.review.title}</p>}
                {replyDialog.review.body && <p className="text-xs text-muted-foreground">{replyDialog.review.body}</p>}
              </div>
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your reply..."
                className="min-h-[100px] text-sm"
              />
            </div>
          )}
          <DialogFooter>
            {replyDialog.review?.admin_reply && (
              <Button variant="outline" size="sm" className="mr-auto text-xs" onClick={() => { setReplyText(""); handleReply(); }}>
                Remove Reply
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setReplyDialog({ open: false, review: null })}>Cancel</Button>
            <Button size="sm" onClick={handleReply} disabled={!replyText.trim()}>Save Reply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
