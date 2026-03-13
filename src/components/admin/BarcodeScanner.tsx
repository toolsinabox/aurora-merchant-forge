import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScanLine, X, Camera } from "lucide-react";
import { toast } from "sonner";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

/**
 * Barcode scanner component. Supports:
 * 1. Manual text input (type/paste barcode)
 * 2. Hardware scanner (HID keyboard emulation — auto-detects rapid keystroke sequences)
 * 3. Camera scan via BarcodeDetector API (where supported)
 */
export function BarcodeScanner({ onScan, placeholder = "Scan or type barcode...", autoFocus = true, className }: BarcodeScannerProps) {
  const [value, setValue] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const bufferRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hardware scanner detection — rapid keystrokes ending with Enter
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Only capture if no focused input (or our input is focused)
      const active = document.activeElement;
      if (active && active !== inputRef.current && (active as HTMLElement).tagName === "INPUT") return;

      if (e.key === "Enter" && bufferRef.current.length >= 3) {
        e.preventDefault();
        const code = bufferRef.current.trim();
        bufferRef.current = "";
        onScan(code);
        setValue("");
        toast.success(`Scanned: ${code}`);
        return;
      }

      if (e.key.length === 1) {
        bufferRef.current += e.key;
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => { bufferRef.current = ""; }, 100);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onScan]);

  const handleManualSubmit = () => {
    if (value.trim().length >= 1) {
      onScan(value.trim());
      toast.success(`Scanned: ${value.trim()}`);
      setValue("");
    }
  };

  // Camera-based scanning via BarcodeDetector
  const startCamera = useCallback(async () => {
    try {
      if (!("BarcodeDetector" in window)) {
        toast.error("Camera barcode scanning not supported in this browser");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setCameraActive(true);

      // Wait for video element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          detectLoop();
        }
      }, 100);
    } catch {
      toast.error("Camera access denied");
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  const detectLoop = useCallback(async () => {
    if (!videoRef.current || !streamRef.current) return;
    try {
      const detector = new (window as any).BarcodeDetector({ formats: ["ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e", "qr_code"] });
      const detect = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const code = barcodes[0].rawValue;
            onScan(code);
            toast.success(`Scanned: ${code}`);
            stopCamera();
            return;
          }
        } catch { /* ignore detection errors */ }
        if (streamRef.current) requestAnimationFrame(detect);
      };
      detect();
    } catch {
      toast.error("Barcode detection failed");
      stopCamera();
    }
  }, [onScan, stopCamera]);

  useEffect(() => {
    return () => { stopCamera(); };
  }, [stopCamera]);

  return (
    <div className={className}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleManualSubmit(); } }}
            placeholder={placeholder}
            className="pl-9 h-9"
            autoFocus={autoFocus}
          />
        </div>
        <Button size="sm" variant="outline" className="h-9" onClick={handleManualSubmit} disabled={!value.trim()}>
          <ScanLine className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" className="h-9" onClick={cameraActive ? stopCamera : startCamera}>
          {cameraActive ? <X className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
        </Button>
      </div>

      {cameraActive && (
        <div className="mt-2 relative rounded-lg overflow-hidden border bg-black">
          <video ref={videoRef} className="w-full h-48 object-cover" muted playsInline />
          <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground animate-pulse">
            Scanning...
          </Badge>
        </div>
      )}
    </div>
  );
}
