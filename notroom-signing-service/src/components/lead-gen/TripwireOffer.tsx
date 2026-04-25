import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Zap } from "lucide-react";
import { trackEvent } from "@/utils/analytics";

const TripwireOffer = () => {
  const handleTripwireClick = () => {
    trackEvent('tripwire_clicked', {
      offer: 'document_review',
      price: 27,
      timestamp: Date.now(),
    });
    
    // Scroll to booking form and pre-select service
    const bookingForm = document.getElementById("booking-form");
    bookingForm?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Card className="relative overflow-hidden border-2 border-[hsl(var(--action-cyan))]">
      <div className="absolute top-0 right-0 bg-[hsl(var(--success-green))] text-primary-foreground px-4 py-1 rounded-bl-lg">
        <Badge variant="secondary" className="bg-transparent border-none text-primary-foreground font-bold">
          <Zap className="w-4 h-4 mr-1" />
          LIMITED OFFER
        </Badge>
      </div>
      
      <CardHeader className="pt-12">
        <CardTitle className="text-2xl md:text-3xl text-center">
          Document Review & Consultation
        </CardTitle>
        <CardDescription className="text-center text-lg">
          Not sure if your documents are ready? Let's check!
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl text-muted-foreground line-through">$75</span>
            <span className="text-5xl font-bold text-[hsl(var(--action-cyan))]">$27</span>
          </div>
          <p className="text-sm text-muted-foreground">One-time introductory rate</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[hsl(var(--success-green))] flex-shrink-0 mt-1" />
            <div>
              <p className="font-medium">15-Minute Document Review</p>
              <p className="text-sm text-muted-foreground">
                We'll check if your documents are notary-ready
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[hsl(var(--success-green))] flex-shrink-0 mt-1" />
            <div>
              <p className="font-medium">Personalized Guidance</p>
              <p className="text-sm text-muted-foreground">
                Get expert advice on your specific situation
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[hsl(var(--success-green))] flex-shrink-0 mt-1" />
            <div>
              <p className="font-medium">$27 Credit Toward Service</p>
              <p className="text-sm text-muted-foreground">
                Full amount credited if you book within 7 days
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-[hsl(var(--action-cyan))] flex-shrink-0 mt-1" />
            <div>
              <p className="font-medium">Same-Day Scheduling Available</p>
              <p className="text-sm text-muted-foreground">
                Get clarity today, not next week
              </p>
            </div>
          </div>
        </div>

        <Button 
          variant="amber" 
          size="lg" 
          className="w-full text-lg"
          onClick={handleTripwireClick}
        >
          Get Document Review - $27
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          💯 100% satisfaction guaranteed or your money back
        </p>
      </CardContent>
    </Card>
  );
};

export default TripwireOffer;
