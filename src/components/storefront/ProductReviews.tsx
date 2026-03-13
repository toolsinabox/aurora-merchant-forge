import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Star, ShieldCheck, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const getReviewImageUrl = (path: string) => path?.startsWith("http") ? path : `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;

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

    // Check which reviewers are verified buyers
    const reviewerIds = [...new Set(reviewsData.map((r: any) => r.user_id).filter(Boolean))];
    if (reviewerIds.length > 0) {
      // Get customers who placed orders for this product
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

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  // Rating breakdown
  const ratingCounts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length > 0 ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 : 0,
  }));

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

      // Upload photos
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
      } as any);
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

      {/* Rating breakdown */}
      {reviews.length > 0 && (
        <div className="space-y-1.5 max-w-xs">
          {ratingCounts.map(({ star, count, pct }) => (
            <div key={star} className="flex items-center gap-2 text-sm">
              <span className="w-6 text-right text-muted-foreground">{star}★</span>
              <Progress value={pct} className="h-2 flex-1" />
              <span className="w-6 text-xs text-muted-foreground">{count}</span>
            </div>
          ))}
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
          {reviews.map((review: any) => {
            const isVerified = verifiedBuyers.has(review.user_id);
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
                {review.admin_reply && (
                  <div className="ml-6 mt-2 border-l-2 border-primary/30 pl-3 py-1">
                    <p className="text-xs font-medium text-primary">Store Response</p>
                    <p className="text-sm text-muted-foreground">{review.admin_reply}</p>
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
