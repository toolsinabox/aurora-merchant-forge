import { Truck, Calendar } from "lucide-react";
import { addBusinessDays, format } from "date-fns";

interface DeliveryEstimateProps {
  shippingDays?: number;
  className?: string;
}

export function DeliveryEstimate({ shippingDays = 5, className = "" }: DeliveryEstimateProps) {
  const minDate = addBusinessDays(new Date(), Math.max(1, shippingDays - 1));
  const maxDate = addBusinessDays(new Date(), shippingDays + 2);

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <Truck className="h-4 w-4 text-primary shrink-0" />
      <div>
        <span className="text-muted-foreground">Estimated delivery: </span>
        <span className="font-medium">
          {format(minDate, "MMM d")} – {format(maxDate, "MMM d")}
        </span>
      </div>
    </div>
  );
}
