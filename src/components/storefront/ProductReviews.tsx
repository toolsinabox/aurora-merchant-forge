import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Star } from "lucide-react";
import { toast } from "sonner";

interface ProductReviewsProps {
  productId: string;
  storeId: string;
}

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
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userReview, setUserReview] = useState<any>(null);

  const loadReviews = async () => {
    const { data } = await supabase
      .from("product_reviews" as any)
      .select("*")
      .eq("product_id", productId)
      .eq("is_approved", true)
      .order("created_at", { ascending: false });
    setReviews(data || []);

    if (user) {
      const existing = (data || []).find((r: any) => r.user_id === user.id);
      setUserReview(existing || null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadReviews();
  }, [productId, user]);

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to leave a review");
      return;
    }

    setSubmitting(true);
    try {
      // Get customer name
      const { data: custs } = await supabase
        .from("customers")
        .select("name")
        .eq("user_id", user.id)
        .limit(1);
      const authorName = custs?.[0]?.name || user.email?.split("@")[0] || "Anonymous";

      const { error } = await supabase.from("product_reviews" as any).insert({
        store_id: storeId,
        product_id: productId,
        user_id: user.id,
        customer_id: custs?.[0] ? undefined : undefined,
        rating,
        title: title || null,
        body: body || null,
        author_name: authorName,
      });
      if (error) throw error;

      toast.success("Review submitted!");
      setShowForm(false);
      setTitle("");
      setBody("");
      setRating(5);
      await loadReviews();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No reviews yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review: any) => (
            <div key={review.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StarRating rating={review.rating} />
                  <span className="text-sm font-medium">{review.author_name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              {review.title && <p className="font-medium text-sm">{review.title}</p>}
              {review.body && <p className="text-sm text-muted-foreground">{review.body}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
