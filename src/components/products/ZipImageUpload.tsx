import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, ImageIcon, Check, AlertTriangle, Archive } from "lucide-react";
import JSZip from "jszip";

interface ZipImageUploadProps {
  storeId: string;
}

interface MatchResult {
  fileName: string;
  productId: string | null;
  productTitle: string | null;
  matchedBy: string | null;
  status: "matched" | "unmatched" | "uploaded" | "error";
  error?: string;
}

export function ZipImageUpload({ storeId }: ZipImageUploadProps) {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [phase, setPhase] = useState<"idle" | "extracting" | "matching" | "uploading" | "done">("idle");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".zip")) {
      toast.error("Please select a ZIP file");
      return;
    }

    setProcessing(true);
    setResults([]);
    setProgress(0);

    try {
      // Phase 1: Extract ZIP
      setPhase("extracting");
      const zip = await JSZip.loadAsync(file);
      const imageFiles: { name: string; blob: Blob }[] = [];
      const imageExts = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];

      for (const [path, zipEntry] of Object.entries(zip.files)) {
        if (zipEntry.dir) continue;
        const ext = path.substring(path.lastIndexOf(".")).toLowerCase();
        if (!imageExts.includes(ext)) continue;
        const blob = await zipEntry.async("blob");
        // Use just the filename without path
        const fileName = path.includes("/") ? path.substring(path.lastIndexOf("/") + 1) : path;
        imageFiles.push({ name: fileName, blob });
      }

      if (imageFiles.length === 0) {
        toast.error("No image files found in ZIP");
        setProcessing(false);
        setPhase("idle");
        return;
      }

      toast.info(`Found ${imageFiles.length} images in ZIP`);

      // Phase 2: Load products for matching
      setPhase("matching");
      const { data: products } = await supabase
        .from("products")
        .select("id, title, sku, barcode")
        .eq("store_id", storeId);

      const matchResults: MatchResult[] = [];

      for (const img of imageFiles) {
        const nameWithoutExt = img.name.substring(0, img.name.lastIndexOf(".")).toLowerCase();
        let matched = false;

        if (products) {
          for (const p of products) {
            // Match by SKU
            if (p.sku && nameWithoutExt === p.sku.toLowerCase()) {
              matchResults.push({ fileName: img.name, productId: p.id, productTitle: p.title, matchedBy: "SKU", status: "matched" });
              matched = true;
              break;
            }
            // Match by barcode
            if (p.barcode && nameWithoutExt === p.barcode.toLowerCase()) {
              matchResults.push({ fileName: img.name, productId: p.id, productTitle: p.title, matchedBy: "Barcode", status: "matched" });
              matched = true;
              break;
            }
            // Match by title (slugified)
            const titleSlug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
            if (nameWithoutExt === titleSlug || nameWithoutExt.replace(/[_-]/g, "") === titleSlug.replace(/[_-]/g, "")) {
              matchResults.push({ fileName: img.name, productId: p.id, productTitle: p.title, matchedBy: "Title", status: "matched" });
              matched = true;
              break;
            }
            // Match by product ID prefix
            if (p.id.startsWith(nameWithoutExt) || nameWithoutExt.startsWith(p.id.substring(0, 8))) {
              matchResults.push({ fileName: img.name, productId: p.id, productTitle: p.title, matchedBy: "ID", status: "matched" });
              matched = true;
              break;
            }
          }
        }

        if (!matched) {
          matchResults.push({ fileName: img.name, productId: null, productTitle: null, matchedBy: null, status: "unmatched" });
        }
      }

      setResults([...matchResults]);

      // Phase 3: Upload matched images
      setPhase("uploading");
      const matched = matchResults.filter(r => r.status === "matched");
      let uploaded = 0;

      for (let i = 0; i < matched.length; i++) {
        const result = matched[i];
        const imgFile = imageFiles.find(f => f.name === result.fileName);
        if (!imgFile || !result.productId) continue;

        try {
          const filePath = `${storeId}/${result.productId}/${Date.now()}-${imgFile.name}`;
          const { error: uploadError } = await supabase.storage
            .from("product-images")
            .upload(filePath, imgFile.blob, { contentType: imgFile.blob.type || "image/jpeg" });

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(filePath);

          // Get current images
          const { data: product } = await supabase.from("products").select("images").eq("id", result.productId).single();
          const currentImages = (product?.images as string[]) || [];
          await supabase.from("products").update({ images: [...currentImages, urlData.publicUrl] } as any).eq("id", result.productId);

          result.status = "uploaded";
          uploaded++;
        } catch (err: any) {
          result.status = "error";
          result.error = err.message;
        }

        setProgress(Math.round(((i + 1) / matched.length) * 100));
        setResults([...matchResults]);
      }

      setPhase("done");
      toast.success(`Uploaded ${uploaded} images to ${uploaded} products`);
    } catch (err: any) {
      toast.error(`ZIP processing failed: ${err.message}`);
    } finally {
      setProcessing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const matchedCount = results.filter(r => r.status === "matched" || r.status === "uploaded").length;
  const unmatchedCount = results.filter(r => r.status === "unmatched").length;
  const errorCount = results.filter(r => r.status === "error").length;

  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Archive className="h-4 w-4" /> ZIP Image Bulk Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-3">
        <p className="text-xs text-muted-foreground">
          Upload a ZIP file containing product images. Files are matched to products by filename:
          <strong> SKU</strong>, <strong>barcode</strong>, or <strong>product title</strong> (slugified).
        </p>

        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept=".zip" onChange={handleZipUpload} className="hidden" />
          <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={() => fileRef.current?.click()} disabled={processing}>
            <Upload className="h-3.5 w-3.5" />
            {processing ? "Processing..." : "Select ZIP File"}
          </Button>
          {phase !== "idle" && (
            <Badge variant="secondary" className="text-[10px]">
              {phase === "extracting" && "Extracting..."}
              {phase === "matching" && "Matching..."}
              {phase === "uploading" && "Uploading..."}
              {phase === "done" && "Complete"}
            </Badge>
          )}
        </div>

        {phase === "uploading" && <Progress value={progress} className="h-1.5" />}

        {results.length > 0 && (
          <div className="space-y-2">
            <div className="flex gap-2 text-xs">
              <Badge variant="default" className="text-[10px]"><Check className="h-3 w-3 mr-0.5" /> {matchedCount} matched</Badge>
              <Badge variant="outline" className="text-[10px]"><AlertTriangle className="h-3 w-3 mr-0.5" /> {unmatchedCount} unmatched</Badge>
              {errorCount > 0 && <Badge variant="destructive" className="text-[10px]">{errorCount} errors</Badge>}
            </div>
            <div className="max-h-48 overflow-auto border rounded text-xs">
              {results.map((r, i) => (
                <div key={i} className={`flex items-center gap-2 px-2 py-1 border-b last:border-0 ${r.status === "unmatched" ? "bg-muted/50" : r.status === "error" ? "bg-destructive/5" : ""}`}>
                  <ImageIcon className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="font-mono truncate flex-1">{r.fileName}</span>
                  {r.productTitle && <span className="text-muted-foreground truncate max-w-[200px]">→ {r.productTitle}</span>}
                  {r.matchedBy && <Badge variant="secondary" className="text-[9px]">{r.matchedBy}</Badge>}
                  {r.status === "uploaded" && <Check className="h-3 w-3 text-primary shrink-0" />}
                  {r.status === "unmatched" && <span className="text-muted-foreground">No match</span>}
                  {r.status === "error" && <span className="text-destructive truncate max-w-[150px]">{r.error}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
