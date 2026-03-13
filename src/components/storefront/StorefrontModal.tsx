import { ReactNode } from "react";
import { X } from "lucide-react";

interface StorefrontModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: "sm" | "md" | "lg" | "xl";
  children: ReactNode;
  footer?: ReactNode;
}

const sizeClasses: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

export function StorefrontModal({ open, onClose, title, size = "md", children, footer }: StorefrontModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`relative bg-card border rounded-xl shadow-2xl ${sizeClasses[size]} w-full mx-4 animate-in zoom-in-95 duration-200`}>
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Close button when no title */}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/10 transition-colors z-10"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Body */}
        <div className="px-5 py-4 max-h-[70vh] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-5 py-3 border-t bg-muted/30 rounded-b-xl flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
