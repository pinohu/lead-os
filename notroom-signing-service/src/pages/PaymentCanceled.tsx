import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { XCircle, ArrowLeft, Phone } from "lucide-react";
import { trackEvent } from "@/utils/analytics";

const PaymentCanceled = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("booking_id");

  useEffect(() => {
    // Track payment cancellation
    trackEvent("payment_canceled", {
      booking_id: bookingId || "unknown",
      timestamp: Date.now(),
    });
  }, [bookingId]);

  return (
    <Layout>
      <SEO
        title="Payment Canceled - Notroom"
        description="Your payment was canceled. You can try again or contact us for assistance."
        canonical="https://notroom.com/payment-canceled"
      />

      <section className="py-20 bg-gradient-to-br from-[hsl(var(--hero-gradient-from))] to-[hsl(var(--hero-gradient-to))]">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 md:p-12 text-center bg-card/95 backdrop-blur-sm">
              <div className="mb-6 flex justify-center">
                <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
                  <XCircle className="w-12 h-12 text-destructive" />
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Payment Canceled
              </h1>

              <p className="text-lg text-muted-foreground mb-8">
                Your payment was canceled. Don't worry - your booking is still saved and no charges were made.
              </p>

              <div className="bg-accent/10 rounded-lg p-6 mb-8 text-left">
                <h2 className="font-semibold text-lg mb-3">What would you like to do?</h2>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-foreground">Try payment again:</span>
                    <span>Return to the booking form to complete payment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-foreground">Pay later:</span>
                    <span>Call us to arrange payment over the phone</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-foreground">Need help?</span>
                    <span>Contact our support team for assistance</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => navigate("/#booking-form")}
                  variant="default"
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Return to Booking
                </Button>
                <Button
                  onClick={() => window.location.href = "tel:+18144800989"}
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <Phone className="w-5 h-5" />
                  Call Us: (814) 480-0989
                </Button>
              </div>

              <p className="text-sm text-muted-foreground mt-6">
                Questions? Email us at{" "}
                <a href="mailto:support@notroom.com" className="text-primary hover:underline">
                  support@notroom.com
                </a>
              </p>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PaymentCanceled;
