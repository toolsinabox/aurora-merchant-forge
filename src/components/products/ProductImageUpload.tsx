import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Loader2, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProductImageUploadProps {
  storeId: string;
  productId?: string;
  images: string[];
  onImagesChange: (images: string[]) => void;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function ProductImageUpload({ storeId, productId, images, onImagesChange }: ProductImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getPublicUrl = (path: string) => {
    if (path.startsWith("http")) return path;
    return `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;
  };

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) =>
      ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(f.type)
    );
    if (fileArray.length === 0) {
      toast.error("Only JPEG, PNG, WebP, and GIF images are allowed");
      return;
    }

    setUploading(true);
    const newPaths: string[] = [];

    for (const file of fileArray) {
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `${storeId}/${productId || "new"}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error } = await supabase.storage
        .from("product-images")
        .upload(fileName, file, { cacheControl: "3600", upsert: false });

      if (error) {
        toast.error(`Failed to upload ${file.name}: ${error.message}`);
      } else {
        newPaths.push(fileName);
      }
    }

    if (newPaths.length > 0) {
      onImagesChange([...images, ...newPaths]);
      toast.success(`${newPaths.length} image${newPaths.length > 1 ? "s" : ""} uploaded`);
    }
    setUploading(false);
  }, [storeId, productId, images, onImagesChange]);

  const removeImage = useCallback(async (index: number) => {
    const path = images[index];
    if (!path.startsWith("http")) {
      await supabase.storage.from("product-images").remove([path]);
    }
    onImagesChange(images.filter((_, i) => i !== index));
  }, [images, onImagesChange]);

  const moveImage = useCallback((index: number, direction: "up" | "down") => {
    const newIdx = direction === "up" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= images.length) return;
    const newImages = [...images];
    [newImages[index], newImages[newIdx]] = [newImages[newIdx], newImages[index]];
    onImagesChange(newImages);
  }, [images, onImagesChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  }, [uploadFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  return (
    <div className="space-y-3">
      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {images.map((img, idx) => (
            <div key={idx} className="relative group aspect-square rounded-md overflow-hidden border bg-muted">
              <img
                src={getPublicUrl(img)}
                alt={`Product image ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              {idx === 0 && (
                <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-2xs px-1.5 py-0.5 rounded font-medium">
                  Main
                </span>
              )}
              <button
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 bg-background/80 backdrop-blur-sm rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="h-3 w-3" />
              </button>
              <div className="absolute bottom-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-3.5 w-3.5 text-background drop-shadow" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50",
          uploading && "pointer-events-none opacity-60"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <ImagePlus className="h-6 w-6 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Drag and drop images here, or click to browse
            </p>
            <p className="text-2xs text-muted-foreground">
              JPEG, PNG, WebP, GIF up to 5MB
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
