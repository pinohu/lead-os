import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Mail, Phone, FileText, Users, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import { sendTcApplicationConfirmationEmail } from "@/services/emailService";

const TcApplicationSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(true);
  const [error, setError] = useState(false);

  const sessionId = searchParams.get("session_id");
  const applicationId = searchParams.get("application_id");

  useEffect(() => {
    updateApplicationStatus();
  }, [sessionId, applicationId]);

  const updateApplicationStatus = async () => {
    if (!applicationId || !sessionId) {
      setError(true);
      setIsUpdating(false);
      return;
    }

    try {
      // Fetch application data first
      const { data: applicationData, error: fetchError } = await supabase
        .from('tc_clients')
        .select('client_name, client_email, transaction_type, selected_plan')
        .eq('id', applicationId)
        .single();

      if (fetchError) {
        logger.error("Error fetching application:", fetchError);
        setError(true);
        setIsUpdating(false);
        return;
      }

      // Update application status to active
      const { error: updateError } = await supabase
        .from('tc_clients')
        .update({
          status: 'active',
          started_at: new Date().toISOString(),
        })
        .eq('id', applicationId);

      if (updateError) {
        logger.error("Error updating application:", updateError);
        setError(true);
      } else {
        // Send confirmation email (don't block on failure)
        try {
          await sendTcApplicationConfirmationEmail(
            applicationData.client_email,
            {
              applicationId,
              clientName: applicationData.client_name,
              transactionType: applicationData.transaction_type,
              selectedPlan: applicationData.selected_plan
            }
          );
        } catch (emailError) {
          // Log error but don't fail the flow
          logger.error("Failed to send confirmation email:", emailError);
        }
      }
    } catch (err) {
      logger.error("Error:", err);
      setError(true);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Layout>
      <SEO
        title="Transaction Coordination Application Successful | Notroom"
        description="Your transaction coordination application has been successfully submitted. Your coordinator will contact you within 24 hours."
        canonical="https://notroom.com/transaction-coordination/application/success"
      />

      <section className="py-16 pt-32 bg-muted/30 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {isUpdating ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Processing your application...</p>
                </CardContent>
              </Card>
            ) : error ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">⚠️</span>
                  </div>
                  <h2 className="text-2xl font-bold mb-4">Something Went Wrong</h2>
                  <p className="text-muted-foreground mb-6">
                    We couldn't process your application status. Please contact us at{" "}
                    <a href="mailto:support@notroom.com" className="text-primary hover:underline">
                      support@notroom.com
                    </a>{" "}
                    or call us at{" "}
                    <a href="tel:814-480-0989" className="text-primary hover:underline">
                      (814) 480-0989
                    </a>.
                  </p>
                  <Button onClick={() => navigate("/")}>Return Home</Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Success Message */}
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-12 h-12 text-success" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-4">
                    Application Submitted Successfully!
                  </h1>
                  <p className="text-xl text-muted-foreground">
                    Your transaction coordination service is now active.
                  </p>
                </div>

                {/* What Happens Next */}
                <Card className="mb-6">
                  <CardContent className="pt-6">
                    <h2 className="text-2xl font-bold mb-6">What Happens Next?</h2>
                    <div className="space-y-6">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Mail className="w-5 h-5 text-primary" />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-bold mb-2">1. Check Your Email</h3>
                          <p className="text-sm text-muted-foreground">
                            Within 15 minutes, you'll receive:
                          </p>
                          <ul className="text-sm text-muted-foreground mt-2 space-y-1 ml-4">
                            <li>• Payment confirmation from Stripe</li>
                            <li>• Confirmation email with your transaction details</li>
                            <li>• Instructions for sharing documents</li>
                            <li>• Client portal access information</li>
                          </ul>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-bold mb-2">2. Coordinator Assignment</h3>
                          <p className="text-sm text-muted-foreground">
                            Within 24 hours, you'll be introduced to your assigned transaction coordinator. 
                            They'll review your transaction details, establish communication channels, and create 
                            a detailed timeline with milestones and deadlines.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-bold mb-2">3. Share Your Documents</h3>
                          <p className="text-sm text-muted-foreground">
                            Upload documents securely through your client portal. Your coordinator will organize 
                            everything, track versions, and ensure all parties have what they need. You'll receive 
                            regular progress updates throughout the process.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Clock className="w-5 h-5 text-primary" />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-bold mb-2">4. Stay Updated</h3>
                          <p className="text-sm text-muted-foreground">
                            Your coordinator will manage deadlines, schedule meetings, facilitate communication 
                            between parties, and ensure everything stays on track. You'll receive regular progress 
                            reports so you always know where things stand.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Important Information */}
                <Card className="mb-6 bg-primary/5 border-primary/20">
                  <CardContent className="pt-6">
                    <h3 className="font-bold mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Important: Service Scope
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Transaction coordination is an administrative service. We coordinate documents, deadlines, 
                      and communication, but we do not provide legal advice, draft legal documents, or represent 
                      parties. All parties should have their own legal counsel for legal matters.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Your coordination fee covers the full transaction from start to completion. If your transaction 
                      complexity changes, you can upgrade or downgrade your plan with prorated pricing adjustments.
                    </p>
                  </CardContent>
                </Card>

                {/* Contact Card */}
                <Card className="mb-6">
                  <CardContent className="pt-6">
                    <h3 className="font-bold mb-4">Need Help?</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium">Call us</p>
                          <a href="tel:814-480-0989" className="text-sm text-primary hover:underline">
                            (814) 480-0989
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium">Email us</p>
                          <a href="mailto:support@notroom.com" className="text-sm text-primary hover:underline">
                            support@notroom.com
                          </a>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button onClick={() => navigate("/")} variant="outline" className="flex-1">
                    Return Home
                  </Button>
                  <Button onClick={() => navigate("/transaction-coordination")} className="flex-1">
                    Learn More About Transaction Coordination
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default TcApplicationSuccess;

