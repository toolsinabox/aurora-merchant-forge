import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Shield, ShieldCheck, ShieldOff, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TwoFactorSetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TwoFactorSetup({ open, onOpenChange }: TwoFactorSetupProps) {
  const [step, setStep] = useState<"start" | "verify" | "enabled" | "disable">("start");
  const [qrUri, setQrUri] = useState("");
  const [secret, setSecret] = useState("");
  const [factorId, setFactorId] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);

  const checkStatus = async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    const totp = data?.totp?.[0];
    if (totp && totp.status === "verified") {
      setMfaEnabled(true);
      setFactorId(totp.id);
      setStep("enabled");
    } else {
      setMfaEnabled(false);
      setStep("start");
    }
  };

  const enroll = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Authenticator App" });
      if (error) throw error;
      setQrUri(data.totp.uri);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      // Create challenge
      const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: data.id });
      if (challengeErr) throw challengeErr;
      setChallengeId(challenge.id);
      setStep("verify");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    if (code.length !== 6) { toast.error("Enter 6-digit code"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.mfa.verify({ factorId, challengeId, code });
      if (error) throw error;
      setMfaEnabled(true);
      setStep("enabled");
      toast.success("Two-factor authentication enabled!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const disable = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      setMfaEnabled(false);
      setStep("start");
      toast.success("Two-factor authentication disabled");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) checkStatus();
    onOpenChange(isOpen);
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    toast.success("Secret copied!");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" /> Two-Factor Authentication
          </DialogTitle>
        </DialogHeader>

        {step === "start" && (
          <div className="space-y-4 text-center">
            <ShieldOff className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Add an extra layer of security to your account using an authenticator app like Google Authenticator or Authy.</p>
            <Button onClick={enroll} disabled={loading} className="w-full gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
              Enable 2FA
            </Button>
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">Scan this QR code with your authenticator app, then enter the 6-digit code.</p>
            {qrUri && (
              <div className="flex justify-center">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUri)}`} alt="QR Code" className="rounded-lg border" />
              </div>
            )}
            <div className="flex items-center gap-2 bg-muted rounded-md p-2">
              <code className="text-xs flex-1 font-mono break-all">{secret}</code>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={copySecret}><Copy className="h-3 w-3" /></Button>
            </div>
            <div>
              <Label className="text-xs">Verification Code</Label>
              <Input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" className="text-center text-lg tracking-widest font-mono" maxLength={6} />
            </div>
            <Button onClick={verify} disabled={loading || code.length !== 6} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Enable"}
            </Button>
          </div>
        )}

        {step === "enabled" && (
          <div className="space-y-4 text-center">
            <ShieldCheck className="h-12 w-12 mx-auto text-primary" />
            <Badge variant="default" className="gap-1"><ShieldCheck className="h-3 w-3" /> 2FA Enabled</Badge>
            <p className="text-sm text-muted-foreground">Your account is protected with two-factor authentication.</p>
            <Button variant="destructive" onClick={disable} disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Disable 2FA"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
