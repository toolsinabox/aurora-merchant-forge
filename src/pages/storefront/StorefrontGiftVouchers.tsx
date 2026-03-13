import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { StorefrontLayout } from "@/components/storefront/StorefrontLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useStoreSlug, resolveStoreBySlug } from "@/lib/subdomain";
import { toast } from "sonner";
import { Gift, Check, Loader2 } from "lucide-react";

const PRESET_VALUES = [25, 50, 100, 200];

export default function StorefrontGiftVouchers() {
  const { storeSlug: paramSlug } = useParams();
  const { basePath, storeSlug } = useStoreSlug(paramSlug);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [storeId, setStoreId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");

  const [form, setForm] = useState({
    value: 50,
    customValue: "",
    recipientName: "",
    recipientEmail: "",
    senderName: "",
    message: "",
  });

  useEffect(() => {
    if (!storeSlug) return;
    resolveStoreBySlug(storeSlug, supabase).then((s) => {
      if (s) setStoreId(s.id);
    });
  }, [storeSlug]);

  const selectedValue = form.customValue ? Number(form.customValue) : form.value;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || selectedValue <= 0) return;
    if (!form.recipientEmail) { toast.error("Recipient email is required"); return; }

    setSubmitting(true);
    try {
      const code = `GV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      const { error } = await supabase.from("gift_vouchers").insert({
        store_id: storeId,
        code,
        initial_value: selectedValue,
        balance: selectedValue,
        recipient_name: form.recipientName || null,
        recipient_email: form.recipientEmail,
        sender_name: form.senderName || null,
        message: form.message || null,
        purchased_by: user?.id || null,
        is_active: true,
      } as any);

      if (error) throw error;
      // Send gift voucher email to recipient
      const { data: inserted } = await supabase.from("gift_vouchers").select("id").eq("code", code).eq("store_id", storeId).maybeSingle();
      if (inserted?.id) {
        supabase.functions.invoke("gift-voucher-email", {
          body: { voucher_id: inserted.id, store_id: storeId },
        }).catch(() => {});
      }
      setVoucherCode(code);
      setCompleted(true);
      toast.success("Gift voucher purchased!");
    } catch (err: any) {
      toast.error(err.message || "Failed to purchase gift voucher");
    } finally {
      setSubmitting(false);
    }
  };

  if (completed) {
    return (
      <StorefrontLayout>
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Check className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Gift Voucher Purchased!</h1>
          <p className="text-muted-foreground mb-4">Your gift voucher has been created.</p>
          <div className="bg-muted/50 rounded-lg p-6 mb-6">
            <p className="text-xs text-muted-foreground mb-1">Voucher Code</p>
            <p className="text-2xl font-mono font-bold tracking-widest">{voucherCode}</p>
            <p className="text-lg font-semibold mt-2">${selectedValue.toFixed(2)}</p>
            {form.recipientName && <p className="text-sm text-muted-foreground mt-1">For: {form.recipientName}</p>}
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate(`${basePath}/gift-vouchers/print/${voucherCode}`)}>
              Print Voucher
            </Button>
            <Button onClick={() => navigate(basePath || "/")}>Continue Shopping</Button>
          </div>
        </div>
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Gift className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Purchase a Gift Voucher</h1>
          <p className="text-muted-foreground mt-1">Send a thoughtful gift to someone special</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Value Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Select Value</Label>
                <div className="grid grid-cols-4 gap-3">
                  {PRESET_VALUES.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, value: v, customValue: "" }))}
                      className={`p-3 rounded-lg border text-center font-semibold transition-colors ${
                        !form.customValue && form.value === v
                          ? "border-primary bg-primary/10 text-primary"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      ${v}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">or custom:</span>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Custom amount"
                    value={form.customValue}
                    onChange={(e) => setForm(prev => ({ ...prev, customValue: e.target.value }))}
                    className="h-9 w-40"
                  />
                </div>
              </div>

              {/* Recipient */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Recipient Details</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Recipient Name</Label>
                    <Input
                      value={form.recipientName}
                      onChange={(e) => setForm(prev => ({ ...prev, recipientName: e.target.value }))}
                      placeholder="Their name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Recipient Email *</Label>
                    <Input
                      type="email"
                      required
                      value={form.recipientEmail}
                      onChange={(e) => setForm(prev => ({ ...prev, recipientEmail: e.target.value }))}
                      placeholder="their@email.com"
                    />
                  </div>
                </div>
              </div>

              {/* Sender */}
              <div className="space-y-1.5">
                <Label className="text-sm">Your Name</Label>
                <Input
                  value={form.senderName}
                  onChange={(e) => setForm(prev => ({ ...prev, senderName: e.target.value }))}
                  placeholder="From..."
                />
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <Label className="text-sm">Personal Message</Label>
                <Textarea
                  value={form.message}
                  onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Write a personal message to include with the gift voucher..."
                  className="min-h-[80px]"
                />
              </div>

              {/* Summary */}
              <div className="bg-muted/30 rounded-lg p-4 flex items-center justify-between">
                <span className="font-medium">Total</span>
                <span className="text-xl font-bold">${selectedValue > 0 ? selectedValue.toFixed(2) : "0.00"}</span>
              </div>

              <Button type="submit" className="w-full h-11" disabled={submitting || selectedValue <= 0}>
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing...</> : `Purchase $${selectedValue > 0 ? selectedValue.toFixed(2) : "0"} Gift Voucher`}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </StorefrontLayout>
  );
}
