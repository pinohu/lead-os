import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Download, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/utils/analytics";

const ExitIntent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const [timeOnPage, setTimeOnPage] = useState(0);
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if exit intent has already been shown in this session
    const exitIntentShown = sessionStorage.getItem("exitIntentShown");
    if (exitIntentShown) {
      setHasShown(true);
      return;
    }

    // Track time on page
    const timer = setInterval(() => {
      setTimeOnPage((prev) => prev + 1);
    }, 1000);

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger if mouse leaves from the top and user has been on page for at least 5 seconds
      if (e.clientY <= 0 && e.movementY < 0 && timeOnPage >= 5 && !hasShown) {
        setIsOpen(true);
        setHasShown(true);
        sessionStorage.setItem("exitIntentShown", "true");
        trackEvent('exit_intent_triggered', { timestamp: Date.now() });
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      clearInterval(timer);
    };
  }, [timeOnPage, hasShown]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) return;

    trackEvent('exit_intent_captured', { email, timestamp: Date.now() });
    
    setIsSubmitted(true);
    
    toast({
      title: "Success!",
      description: "Check your email for your free guide + special discount.",
    });
  };

  const scrollToBooking = () => {
    setIsOpen(false);
    document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth" });
  };

  if (isSubmitted) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4">
              <CheckCircle2 className="w-16 h-16 text-[hsl(var(--success-green))]" />
            </div>
            <DialogTitle className="text-2xl">Check Your Email!</DialogTitle>
            <DialogDescription className="text-base">
              We've sent you the free guide + a special 10% discount code.
            </DialogDescription>
          </DialogHeader>
          <Button variant="amber" onClick={() => setIsOpen(false)}>
            Got It!
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4">
            <Gift className="w-12 h-12 text-[hsl(var(--action-cyan))]" />
          </div>
          <DialogTitle className="text-2xl">Wait! We Have a Gift For You</DialogTitle>
          <DialogDescription className="text-base">
            Get our free PA Notary Guide + 10% off your first service
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[hsl(var(--success-green))] flex-shrink-0 mt-1" />
              <p className="text-sm">Free Pennsylvania Notary Services Guide (PDF)</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[hsl(var(--success-green))] flex-shrink-0 mt-1" />
              <p className="text-sm">10% discount code for any service</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[hsl(var(--success-green))] flex-shrink-0 mt-1" />
              <p className="text-sm">Priority booking access</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button 
              type="submit"
              variant="amber" 
              size="lg"
              className="w-full"
            >
              <Download className="mr-2 w-5 h-5" />
              Send Me the Guide + Discount
            </Button>
          </form>
          
          <Button 
            variant="ghost"
            onClick={() => setIsOpen(false)}
            className="w-full"
          >
            No Thanks
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExitIntent;
