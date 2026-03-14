import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, ShieldCheck, ImagePlus, X, ThumbsUp, ThumbsDown, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const getReviewImageUrl = (path: string) => path?.startsWith("http") ? path : `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;

const VOTES_KEY = "review_votes";
function getVotedReviews(): Record<string, "up" | "down"> {
  try { return JSON.parse(localStorage.getItem(VOTES_KEY) || "{}"); } catch { return {}; }
}
function saveVote(reviewId: string, vote: "up" | "down") {
  const votes = getVotedReviews();
  votes[reviewId] = vote;
  localStorage.setItem(VOTES_KEY, JSON.stringify(votes));
}

interface ProductReviewsProps {
  productId: string;
  storeId: string;
}

type SortOption = "newest" | "oldest" | "highest" | "lowest" | "helpful";

function StarRating({ rating, onRate, interactive = false }: { rating: number; onRate?: (r: number) => void; interactive?: boolean }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          className={interactive ? "cursor-pointer" : "cursor-default"}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => onRate?.(star)}
        >
          <Star
            className={`h-4 w-4 ${
              star <= (hover || rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function ProductReviews({ productId, storeId }: ProductReviewsProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [verifiedBuyers, setVerifiedBuyers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userReview, setUserReview] = useState<any>(null);
  const [reviewPhotos, setReviewPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Sort and filter state
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterRating, setFilterRating] = useState<number>(0); // 0 = all
  const [localVotes, setLocalVotes] = useState<Record<string, { up: number; down: number }>>({});
  const [userVotes, setUserVotes] = useState<Record<string, "up" | "down">>(getVotedReviews());

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (reviewPhotos.length + files.length > 5) {
      toast.error("Maximum 5 photos per review");
      return;
    }
    const newPhotos = [...reviewPhotos, ...files];
    setReviewPhotos(newPhotos);
    setPhotoPreviewUrls(newPhotos.map(f => URL.createObjectURL(f)));
  };

  const removePhoto = (index: number) => {
    const next = reviewPhotos.filter((_, i) => i !== index);
    setReviewPhotos(next);
    setPhotoPreviewUrls(next.map(f => URL.createObjectURL(f)));
  };

  const loadReviews = async () => {
    const { data } = await supabase
      .from("product_reviews" as any)
      .select("*")
      .eq("product_id", productId)
      .eq("is_approved", true)
      .order("created_at", { ascending: false });
    const reviewsData = data || [];
    setReviews(reviewsData);

    // Initialize vote counts from data
    const voteCounts: Record<string, { up: number; down: number }> = {};
    reviewsData.forEach((r: any) => {
      voteCounts[r.id] = { up: r.helpful_count || 0, down: r.not_helpful_count || 0 };
    });
    setLocalVotes(voteCounts);

    // Check which reviewers are verified buyers
    const reviewerIds = [...new Set(reviewsData.map((r: any) => r.user_id).filter(Boolean))];
    if (reviewerIds.length > 0) {
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("order_id, orders!inner(customer_id, customers!inner(user_id))")
        .eq("product_id", productId)
        .eq("store_id", storeId);
      
      const buyerUserIds = new Set<string>();
      (orderItems || []).forEach((item: any) => {
        const userId = item.orders?.customers?.user_id;
        if (userId) buyerUserIds.add(userId);
      });
      setVerifiedBuyers(buyerUserIds);
    }

    if (user) {
      const existing = reviewsData.find((r: any) => r.user_id === user.id);
      setUserReview(existing || null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadReviews();
  }, [productId, user]);

  const handleVote = async (reviewId: string, vote: "up" | "down") => {
    if (userVotes[reviewId]) return; // Already voted
    saveVote(reviewId, vote);
    setUserVotes(prev => ({ ...prev, [reviewId]: vote }));
    setLocalVotes(prev => ({
      ...prev,
      [reviewId]: {
        up: (prev[reviewId]?.up || 0) + (vote === "up" ? 1 : 0),
        down: (prev[reviewId]?.down || 0) + (vote === "down" ? 1 : 0),
      }
    }));
    // Persist to DB
    try {
      const field = vote === "up" ? "helpful_count" : "not_helpful_count";
      const current = reviews.find(r => r.id === reviewId);
      await supabase.from("product_reviews" as any).update({
        [field]: (current?.[field] || 0) + 1,
      } as any).eq("id", reviewId);
    } catch { /* silent */ }
  };

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const ratingCounts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length > 0 ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 : 0,
  }));

  // Filtered and sorted reviews
  const displayReviews = useMemo(() => {
    let filtered = filterRating > 0 ? reviews.filter(r => r.rating === filterRating) : reviews;
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "oldest": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "highest": return b.rating - a.rating;
        case "lowest": return a.rating - b.rating;
        case "helpful": return ((localVotes[b.id]?.up || 0) - (localVotes[b.id]?.down || 0)) - ((localVotes[a.id]?.up || 0) - (localVotes[a.id]?.down || 0));
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }, [reviews, sortBy, filterRating, localVotes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to leave a review");
      return;
    }

    setSubmitting(true);
    try {
      const { data: custs } = await supabase
        .from("customers")
        .select("name")
        .eq("user_id", user.id)
        .limit(1);
      const authorName = custs?.[0]?.name || user.email?.split("@")[0] || "Anonymous";

      const uploadedPaths: string[] = [];
      for (const photo of reviewPhotos) {
        const ext = photo.name.split('.').pop();
        const path = `reviews/${storeId}/${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("product-images").upload(path, photo);
        if (!uploadError) uploadedPaths.push(path);
      }

      const { error } = await supabase.from("product_reviews" as any).insert({
        store_id: storeId,
        product_id: productId,
        user_id: user.id,
        rating,
        title: title || null,
        body: body || null,
        author_name: authorName,
        review_photos: uploadedPaths.length > 0 ? uploadedPaths : undefined,
        helpful_count: 0,
        not_helpful_count: 0,
      } as any);
      if (error) throw error;

      toast.success("Review submitted!");
      setShowForm(false);
      setTitle("");
      setBody("");
      setRating(5);
      setReviewPhotos([]);
      setPhotoPreviewUrls([]);
      await loadReviews();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Reviews</h2>
          <div className="flex items-center gap-2 mt-1">
            <StarRating rating={Math.round(avgRating)} />
            <span className="text-sm text-muted-foreground">
              {avgRating.toFixed(1)} ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
            </span>
          </div>
        </div>
        {user && !userReview && !showForm && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            Write a Review
          </Button>
        )}
      </div>

      {/* Rating breakdown — clickable to filter */}
      {reviews.length > 0 && (
        <div className="space-y-1.5 max-w-xs">
          {ratingCounts.map(({ star, count, pct }) => (
            <button
              key={star}
              className={`flex items-center gap-2 text-sm w-full rounded px-1 py-0.5 transition-colors ${filterRating === star ? "bg-primary/10" : "hover:bg-muted"}`}
              onClick={() => setFilterRating(filterRating === star ? 0 : star)}
            >
              <span className="w-6 text-right text-muted-foreground">{star}★</span>
              <Progress value={pct} className="h-2 flex-1" />
              <span className="w-6 text-xs text-muted-foreground">{count}</span>
            </button>
          ))}
          {filterRating > 0 && (
            <button className="text-xs text-primary hover:underline" onClick={() => setFilterRating(0)}>
              Clear filter
            </button>
          )}
        </div>
      )}

      {/* Sort controls */}
      {reviews.length > 1 && (
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Most Recent</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="highest">Highest Rated</SelectItem>
              <SelectItem value="lowest">Lowest Rated</SelectItem>
              <SelectItem value="helpful">Most Helpful</SelectItem>
            </SelectContent>
          </Select>
          {filterRating > 0 && (
            <Badge variant="secondary" className="text-xs gap-1">
              {filterRating}★ only
              <button onClick={() => setFilterRating(0)}><X className="h-3 w-3" /></button>
            </Badge>
          )}
        </div>
      )}

      {/* Review form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-4">
          <h3 className="font-medium text-sm">Your Review</h3>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Rating</label>
            <StarRating rating={rating} onRate={setRating} interactive />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Title (optional)</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sum it up..."
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Review</label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share your experience..."
              className="min-h-[80px]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Photos (optional, up to 5)</label>
            <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoSelect} />
            <div className="flex gap-2 flex-wrap">
              {photoPreviewUrls.map((url, i) => (
                <div key={i} className="relative w-16 h-16 rounded border overflow-hidden">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removePhoto(i)} className="absolute top-0 right-0 bg-background/80 rounded-bl p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {reviewPhotos.length < 5 && (
                <button type="button" onClick={() => photoInputRef.current?.click()} className="w-16 h-16 rounded border border-dashed flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
                  <ImagePlus className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <Separator />

      {/* Reviews list */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading reviews...</p>
      ) : displayReviews.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          {filterRating > 0 ? `No ${filterRating}-star reviews yet.` : "No reviews yet. Be the first!"}
        </p>
      ) : (
        <div className="space-y-4">
          {displayReviews.map((review: any) => {
            const isVerified = verifiedBuyers.has(review.user_id);
            const votes = localVotes[review.id] || { up: 0, down: 0 };
            const myVote = userVotes[review.id];
            return (
              <div key={review.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StarRating rating={review.rating} />
                    <span className="text-sm font-medium">{review.author_name}</span>
                    {isVerified && (
                      <Badge variant="secondary" className="text-[10px] gap-1 px-1.5 py-0">
                        <ShieldCheck className="h-3 w-3" /> Verified Purchase
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                {review.title && <p className="font-medium text-sm">{review.title}</p>}
                {review.body && <p className="text-sm text-muted-foreground">{review.body}</p>}
                {review.review_photos && review.review_photos.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {review.review_photos.map((photo: string, i: number) => (
                      <a key={i} href={getReviewImageUrl(photo)} target="_blank" rel="noopener noreferrer">
                        <img src={getReviewImageUrl(photo)} alt={`Review photo ${i + 1}`} className="w-20 h-20 rounded object-cover border hover:opacity-80 transition-opacity" />
                      </a>
                    ))}
                  </div>
                )}
                {/* Voting */}
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-muted-foreground">Helpful?</span>
                  <button
                    onClick={() => handleVote(review.id, "up")}
                    disabled={!!myVote}
                    className={`flex items-center gap-1 text-xs rounded px-2 py-1 transition-colors ${myVote === "up" ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground"} ${myVote ? "cursor-default" : "cursor-pointer"}`}
                  >
                    <ThumbsUp className="h-3 w-3" /> {votes.up > 0 && votes.up}
                  </button>
                  <button
                    onClick={() => handleVote(review.id, "down")}
                    disabled={!!myVote}
                    className={`flex items-center gap-1 text-xs rounded px-2 py-1 transition-colors ${myVote === "down" ? "bg-destructive/10 text-destructive" : "hover:bg-muted text-muted-foreground"} ${myVote ? "cursor-default" : "cursor-pointer"}`}
                  >
                    <ThumbsDown className="h-3 w-3" /> {votes.down > 0 && votes.down}
                  </button>
                </div>
                {review.admin_reply && (
                  <div className="ml-6 mt-2 border-l-2 border-primary/30 pl-3 py-1">
                    <p className="text-xs font-medium text-primary">Store Response</p>
                    <p className="text-sm text-muted-foreground">{review.admin_reply}</p>
                    {review.admin_reply_at && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(review.admin_reply_at).toLocaleDateString()}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
