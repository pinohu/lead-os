import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Mail, RefreshCw, CheckCircle } from "lucide-react";
import { logger } from "@/utils/logger";

interface EmailVerificationProps {
  email: string;
  onVerified: () => void;
  onCancel: () => void;
}

const EmailVerification = ({ email, onVerified, onCancel }: EmailVerificationProps) => {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const sendVerificationCode = async () => {
    setIsSendingCode(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-verification-code', {
        body: { email, purpose: 'booking' }
      });

      if (error) throw error;

      if (data?.success) {
        setCodeSent(true);
        toast.success("Verification code sent to your email!");
      } else {
        throw new Error(data?.error || "Failed to send code");
      }
    } catch (error) {
      logger.error("Send code error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send verification code");
    } finally {
      setIsSendingCode(false);
    }
  };

  const verifyCode = async () => {
    if (code.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-code', {
        body: { email, code }
      });

      if (error) throw error;

      if (data?.valid) {
        toast.success("Email verified successfully!");
        onVerified();
      } else {
        toast.error(data?.error || "Invalid verification code");
      }
    } catch (error) {
      logger.error("Verify code error:", error);
      toast.error("Invalid or expired verification code");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in slide-in-from-bottom-4">
        <div className="mb-6 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Verify Your Email</h3>
          <p className="text-muted-foreground">
            We'll send a 6-digit code to <strong>{email}</strong>
          </p>
        </div>

        {!codeSent ? (
          <div className="space-y-4">
            <Button
              onClick={sendVerificationCode}
              disabled={isSendingCode}
              className="w-full"
              size="lg"
            >
              {isSendingCode ? "Sending..." : "Send Verification Code"}
            </Button>
            <Button
              onClick={onCancel}
              variant="outline"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="verification-code">Enter 6-Digit Code</Label>
              <Input
                id="verification-code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="text-center text-2xl font-mono tracking-widest"
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">
                Code expires in 10 minutes
              </p>
            </div>

            <Button
              onClick={verifyCode}
              disabled={isVerifying || code.length !== 6}
              className="w-full"
              size="lg"
            >
              {isVerifying ? "Verifying..." : "Verify Email"}
              {!isVerifying && <CheckCircle className="ml-2 w-4 h-4" />}
            </Button>

            <Button
              onClick={sendVerificationCode}
              disabled={isSendingCode}
              variant="outline"
              className="w-full"
            >
              {isSendingCode ? "Sending..." : "Resend Code"}
              {!isSendingCode && <RefreshCw className="ml-2 w-4 h-4" />}
            </Button>

            <Button
              onClick={onCancel}
              variant="ghost"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        )}

        <p className="text-xs text-center text-muted-foreground mt-6">
          This helps us prevent spam and protect your booking
        </p>
      </div>
    </div>
  );
};

export default EmailVerification;
