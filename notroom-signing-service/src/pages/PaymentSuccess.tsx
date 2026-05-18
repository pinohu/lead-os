import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Home, Phone } from "lucide-react";
import { trackEvent } from "@/utils/analytics";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    // Track successful payment
    if (sessionId) {
      trackEvent("payment_completed", {
        session_id: sessionId,
        timestamp: Date.now(),
      });
    }
  }, [sessionId]);

  return (
    <Layout>
      <SEO
        title="Payment Successful - Notroom"
        description="Your payment has been processed successfully. We'll contact you shortly to confirm your appointment."
        canonical="https://notroom.com/payment-success"
      />

      <section className="py-20 bg-gradient-to-br from-[hsl(var(--hero-gradient-from))] to-[hsl(var(--hero-gradient-to))]">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 md:p-12 text-center bg-card/95 backdrop-blur-sm">
              <div className="mb-6 flex justify-center">
                <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-success" />
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Payment Successful!
              </h1>

              <p className="text-lg text-muted-foreground mb-8">
                Thank you for your payment. Your booking has been confirmed and we've sent a confirmation email to your inbox.
              </p>

              <div className="bg-accent/10 rounded-lg p-6 mb-8 text-left">
                <h2 className="font-semibold text-lg mb-3">What happens next?</h2>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span>You'll receive a confirmation email with your booking details</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span>Our team will contact you within 2 hours to schedule your appointment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span>For urgent requests, call us at (814) 480-0989</span>
                  </li>
                </ul>
              </div>

              {sessionId && (
                <p className="text-sm text-muted-foreground mb-6">
                  Reference ID: {sessionId.slice(-12)}
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => navigate("/")}
                  variant="default"
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <Home className="w-5 h-5" />
                  Return Home
                </Button>
                <Button
                  onClick={() => window.location.href = "tel:+18144800989"}
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <Phone className="w-5 h-5" />
                  Call Us Now
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PaymentSuccess;
