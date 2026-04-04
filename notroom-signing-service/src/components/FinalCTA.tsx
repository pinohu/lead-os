import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { trackCTAClick } from "@/utils/analytics";

const FinalCTA = () => {
  const scrollToBooking = () => {
    trackCTAClick('final_cta', 'book_any_service');
    document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const handlePhoneClick = () => {
    trackCTAClick('final_cta', 'call_phone');
    window.location.href = "tel:814-480-0989";
  };

  return (
    <section className="py-20 bg-gradient-to-br from-[hsl(var(--hero-gradient-from))] to-[hsl(var(--hero-gradient-to))]" aria-labelledby="final-cta-heading">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Heading */}
          <h2 id="final-cta-heading" className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
            Ready to Get Started?
          </h2>
          
          {/* Subheading */}
          <p className="text-xl text-primary-foreground/90 mb-10 leading-relaxed">
            Professional notary, business filing, and compliance services available now in Erie, PA. Remote, mobile, or concierge—we're here to help.
          </p>

          {/* CTA Buttons - Mobile optimized with urgency */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Button 
              size="lg" 
              variant="amber"
              className="text-base sm:text-lg px-6 sm:px-8 py-7 sm:py-8 min-h-[56px] h-auto shadow-2xl font-bold w-full sm:w-auto touch-manipulation hover-lift"
              onClick={scrollToBooking}
              aria-label="Book any service now"
            >
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <span>📅 Book Any Service Now</span>
                <span className="text-xs sm:text-sm font-normal opacity-90 sm:hidden">Same-day available</span>
              </div>
            </Button>
            
            <Button 
              size="lg" 
              variant="amberOutline"
              className="text-base sm:text-lg px-6 sm:px-8 py-7 sm:py-8 min-h-[56px] h-auto font-bold w-full sm:w-auto touch-manipulation"
              onClick={handlePhoneClick}
              aria-label="Call us at 814-480-0989"
            >
              📞 Call (814) 480-0989
            </Button>
          </div>

          {/* Enhanced Trust Indicators with Urgency */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-primary-foreground/90 mb-8" role="list" aria-label="Trust indicators">
            <div className="flex items-center gap-2 bg-background/10 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full" role="listitem">
              <span className="text-[hsl(var(--success-green))] text-xl" aria-hidden="true">✓</span>
              <span className="font-medium text-sm sm:text-base">15+ Services</span>
            </div>
            <div className="flex items-center gap-2 bg-background/10 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full" role="listitem">
              <span className="text-[hsl(var(--success-green))] text-xl" aria-hidden="true">✓</span>
              <span className="font-medium text-sm sm:text-base">PA Licensed</span>
            </div>
            <div className="flex items-center gap-2 bg-background/10 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full" role="listitem">
              <span className="text-[hsl(var(--success-green))] text-xl" aria-hidden="true">⚡</span>
              <span className="font-medium text-sm sm:text-base">Same-Day Available</span>
            </div>
          </div>

          {/* Contact Alternative - Enhanced mobile touch target */}
          <div className="text-primary-foreground/80 text-base sm:text-lg text-center px-4">
            Questions about which service you need?{" "}
            <a 
              href="tel:814-480-0989" 
              className="inline-flex items-center gap-2 text-primary-foreground font-semibold hover:text-[hsl(var(--urgency-amber))] transition-colors underline underline-offset-4 min-h-[44px] py-2 touch-manipulation"
              aria-label="Call us at 814-480-0989 for questions"
            >
              <Phone className="w-5 h-5" aria-hidden="true" />
              <span>Call us at (814) 480-0989</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
