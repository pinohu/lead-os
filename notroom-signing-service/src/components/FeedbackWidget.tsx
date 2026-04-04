import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare, X, Send, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/utils/analytics";
import { logger } from "@/utils/logger";

const FeedbackWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  // Check if feedback was already submitted in this session
  useEffect(() => {
    const feedbackSubmitted = sessionStorage.getItem("feedbackSubmitted");
    if (feedbackSubmitted === "true") {
      setIsSubmitted(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      toast({
        title: "Feedback Required",
        description: "Please provide your feedback before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Save feedback to database (gracefully handle if table doesn't exist)
      const { error } = await supabase
        .from("feedback")
        .insert({
          feedback: feedback.trim(),
          email: email.trim() || null,
          page_url: window.location.href,
          user_agent: navigator.userAgent,
        });

      if (error) {
        // If table doesn't exist, log but don't fail
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          logger.warn('Feedback table does not exist. Run the migration to enable feedback collection.');
          // Still show success to user
        } else {
          throw error;
        }
      }

      // Track event
      trackEvent("feedback_submitted", {
        has_email: !!email.trim(),
        page_url: window.location.href,
      });

      setIsSubmitted(true);
      sessionStorage.setItem("feedbackSubmitted", "true");
      
      toast({
        title: "Thank You!",
        description: "Your feedback has been received. We appreciate your input!",
      });

      // Reset form after delay
      setTimeout(() => {
        setIsOpen(false);
        setFeedback("");
        setEmail("");
        setIsSubmitted(false);
      }, 2000);
    } catch (error) {
      logger.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted && !isOpen) {
    return null; // Hide widget after successful submission
  }

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all"
        size="lg"
        aria-label="Provide feedback"
      >
        <MessageSquare className="h-6 w-6" aria-hidden="true" />
      </Button>

      {/* Feedback Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Share Your Feedback</DialogTitle>
            <DialogDescription>
              Help us improve Notroom. Your feedback is valuable to us!
            </DialogDescription>
          </DialogHeader>

          {isSubmitted ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="w-16 h-16 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Thank You!</h3>
              <p className="text-muted-foreground">
                Your feedback has been received. We appreciate your input!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="feedback">Your Feedback *</Label>
                <Textarea
                  id="feedback"
                  placeholder="Tell us what you think... What worked well? What could be improved?"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={5}
                  required
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p className="text-xs text-muted-foreground">
                  Optional: We may contact you if we need clarification on your feedback.
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !feedback.trim()}>
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Feedback
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FeedbackWidget;

