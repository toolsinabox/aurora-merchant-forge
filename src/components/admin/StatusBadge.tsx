import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  active: "bg-success/15 text-success border-success/30",
  draft: "bg-warning/15 text-warning border-warning/30",
  archived: "bg-muted text-muted-foreground border-border",
  pending: "bg-warning/15 text-warning border-warning/30",
  processing: "bg-info/15 text-info border-info/30",
  shipped: "bg-primary/15 text-primary border-primary/30",
  delivered: "bg-success/15 text-success border-success/30",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30",
  paid: "bg-success/15 text-success border-success/30",
  refunded: "bg-destructive/15 text-destructive border-destructive/30",
  new: "bg-info/15 text-info border-info/30",
  returning: "bg-primary/15 text-primary border-primary/30",
  vip: "bg-warning/15 text-warning border-warning/30",
  "in-stock": "bg-success/15 text-success border-success/30",
  "low-stock": "bg-warning/15 text-warning border-warning/30",
  "out-of-stock": "bg-destructive/15 text-destructive border-destructive/30",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-2xs font-medium capitalize",
        statusStyles[status] || "bg-muted text-muted-foreground",
        className
      )}
    >
      {status.replace("-", " ")}
    </Badge>
  );
}
