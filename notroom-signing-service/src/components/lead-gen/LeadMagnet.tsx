import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/utils/analytics";
import { captureLeadMagnetEmail } from "@/services/emailService";

const LeadMagnet = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !name) {
      toast({
        title: "Missing Information",
        description: "Please provide your name and email.",
        variant: "destructive",
      });
      return;
    }

    // Track lead magnet download
    trackEvent('lead_magnet_downloaded', {
      email,
      name,
      resource: 'PA_Notary_Guide',
      timestamp: Date.now(),
    });

    // Capture lead in email service
    await captureLeadMagnetEmail({
      email,
      name,
      resource: 'PA_Notary_Guide',
      timestamp: Date.now(),
    });

    setIsSubmitted(true);
    
    toast({
      title: "Success!",
      description: "Check your email for the free guide.",
    });
  };

  if (isSubmitted) {
    return (
      <Card className="bg-gradient-to-br from-[hsl(var(--hero-gradient-from))] to-[hsl(var(--hero-gradient-to))] border-none text-primary-foreground">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle2 className="w-16 h-16 text-[hsl(var(--success-green))]" />
          </div>
          <CardTitle className="text-2xl">Check Your Email!</CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Your free guide is on its way. Check your inbox in the next few minutes.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-[hsl(var(--hero-gradient-from))] to-[hsl(var(--hero-gradient-to))] border-none text-primary-foreground">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <FileText className="w-16 h-16 text-[hsl(var(--action-cyan))]" />
        </div>
        <CardTitle className="text-2xl md:text-3xl">
          Free Guide: Pennsylvania Notary Services Explained
        </CardTitle>
        <CardDescription className="text-primary-foreground/80 text-base">
          Everything you need to know about notary services in PA. No confusion, no surprises.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[hsl(var(--success-green))] flex-shrink-0 mt-1" />
            <p className="text-sm">When you need a notary vs. when you don't</p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[hsl(var(--success-green))] flex-shrink-0 mt-1" />
            <p className="text-sm">Remote vs. mobile notary: Which is right for you?</p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[hsl(var(--success-green))] flex-shrink-0 mt-1" />
            <p className="text-sm">How to prepare documents for notarization</p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[hsl(var(--success-green))] flex-shrink-0 mt-1" />
            <p className="text-sm">PA notary fee breakdown (stay compliant)</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-background/20 border-background/40 text-primary-foreground placeholder:text-primary-foreground/60"
            required
          />
          <Input
            type="email"
            placeholder="Your Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-background/20 border-background/40 text-primary-foreground placeholder:text-primary-foreground/60"
            required
          />
          <Button 
            type="submit" 
            variant="amber" 
            size="lg" 
            className="w-full text-lg"
          >
            <Download className="mr-2 w-5 h-5" />
            Download Free Guide
          </Button>
          <p className="text-xs text-center text-primary-foreground/60">
            We respect your privacy. Unsubscribe anytime.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default LeadMagnet;
