import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Gift } from "lucide-react";

export default function PrintGiftVoucher() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [voucher, setVoucher] = useState<any>(null);
  const [storeName, setStoreName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) return;
    const load = async () => {
      const { data } = await supabase
        .from("gift_vouchers")
        .select("*, stores:store_id(name)")
        .eq("code", code)
        .maybeSingle();
      if (data) {
        setVoucher(data);
        setStoreName((data as any).stores?.name || "");
      }
      setLoading(false);
    };
    load();
  }, [code]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!voucher) return <div className="p-8 text-center text-muted-foreground">Voucher not found</div>;

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-3 p-4 print:hidden">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-lg font-semibold flex-1">Gift Voucher</h1>
        <Button size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1.5" />Print</Button>
      </div>

      <div className="p-8 print:p-0">
        <div className="border-2 border-dashed rounded-xl p-8 text-center space-y-6">
          {/* Header */}
          <div>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Gift className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">GIFT VOUCHER</h2>
            {storeName && <p className="text-muted-foreground mt-1">{storeName}</p>}
          </div>

          {/* Value */}
          <div className="py-4">
            <p className="text-5xl font-bold text-primary">${Number(voucher.initial_value).toFixed(2)}</p>
          </div>

          {/* Code */}
          <div className="bg-muted/30 rounded-lg p-4 inline-block">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Voucher Code</p>
            <p className="text-2xl font-mono font-bold tracking-[0.2em]">{voucher.code}</p>
          </div>

          {/* Recipient */}
          {(voucher.recipient_name || voucher.sender_name) && (
            <div className="space-y-1">
              {voucher.recipient_name && (
                <p className="text-lg">
                  <span className="text-muted-foreground">To:</span> <span className="font-semibold">{voucher.recipient_name}</span>
                </p>
              )}
              {voucher.sender_name && (
                <p className="text-lg">
                  <span className="text-muted-foreground">From:</span> <span className="font-semibold">{voucher.sender_name}</span>
                </p>
              )}
            </div>
          )}

          {/* Message */}
          {voucher.message && (
            <div className="max-w-sm mx-auto">
              <p className="text-sm italic text-muted-foreground border-t pt-4">"{voucher.message}"</p>
            </div>
          )}

          {/* Expiry */}
          {voucher.expires_at && (
            <p className="text-xs text-muted-foreground">
              Valid until {new Date(voucher.expires_at).toLocaleDateString()}
            </p>
          )}

          <p className="text-xs text-muted-foreground pt-4 border-t">
            Enter this code at checkout to redeem. Not redeemable for cash.
          </p>
        </div>
      </div>
    </div>
  );
}
