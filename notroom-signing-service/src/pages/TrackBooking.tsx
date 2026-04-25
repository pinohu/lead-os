import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Calendar, Clock, FileText, MapPin, User, Mail, Phone, Shield, CheckCircle, MessageCircle, HelpCircle } from "lucide-react";
import { format } from "date-fns";
import { emailSchema } from "@/utils/validation";
import type { Tables } from "@/integrations/supabase/types";
import { logger } from "@/utils/logger";

const TrackBooking = () => {
  const [bookingId, setBookingId] = useState("");
  const [email, setEmail] = useState("");
  const [booking, setBooking] = useState<Tables<"bookings"> | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-warning/10 text-warning border-warning/20";
      case "confirmed": return "bg-success/10 text-success border-success/20";
      case "completed": return "bg-primary/10 text-primary border-primary/20";
      case "cancelled": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getServiceLabel = (service: string) => {
    const labels: Record<string, string> = {
      ron: "Remote Online Notary (RON)",
      mobile: "Mobile Notary",
      apostille: "Apostille Service",
      loan: "Loan Signing Agent",
    };
    return labels[service] || service;
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    const trimmedEmail = email.toLowerCase().trim();
    const trimmedBookingId = bookingId.trim();
    
    if (!trimmedBookingId) {
      toast.error("Please enter a Booking ID");
      return;
    }
    
    const emailValidation = emailSchema.safeParse(trimmedEmail);
    if (!emailValidation.success) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsSearching(true);

    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", trimmedBookingId)
        .eq("email", trimmedEmail)
        .maybeSingle();

      if (error) {
        logger.error("Error fetching booking:", error);
        toast.error("An error occurred. Please try again.");
        setBooking(null);
        return;
      }

      if (!data) {
        toast.error("Booking not found. Please check your Booking ID and email address.");
        setBooking(null);
        return;
      }

      setBooking(data);
      toast.success("Booking found!");
    } catch (error) {
      logger.error("Unexpected error:", error);
      toast.error("An error occurred. Please try again.");
      setBooking(null);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <>
      <SEO 
        title="Track Your Booking - Notroom"
        description="Check the status of your notary service booking with Notroom. Track your appointment and get real-time updates."
        canonical="/track-booking"
      />
      
      <Header />
      
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-32 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Track Your Booking
            </h1>
            <p className="text-xl text-muted-foreground">
              Enter your booking details to check your appointment status
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Find Your Booking
              </CardTitle>
              <CardDescription>
                You received a Booking ID in your confirmation email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <Label htmlFor="bookingId">Booking ID</Label>
                  <Input
                    id="bookingId"
                    type="text"
                    value={bookingId}
                    onChange={(e) => setBookingId(e.target.value)}
                    placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSearching}>
                  {isSearching ? "Searching..." : "Find Booking"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {booking && (
            <Card className="animate-in fade-in slide-in-from-bottom-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Booking Details</CardTitle>
                  <Badge className={getStatusColor(booking.status)}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </Badge>
                </div>
                {booking.suitedash_synced_at && (
                  <CardDescription className="text-xs text-muted-foreground">
                    Synced to Suitedash {format(new Date(booking.suitedash_synced_at), "PPp")}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{booking.name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{booking.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{booking.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Service</p>
                      <p className="font-medium">{getServiceLabel(booking.service)}</p>
                    </div>
                  </div>
                </div>

                {booking.preferred_date && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Preferred Date</p>
                      <p className="font-medium">{format(new Date(booking.preferred_date), "PPP")}</p>
                    </div>
                  </div>
                )}

                {booking.preferred_time && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Preferred Time</p>
                      <p className="font-medium capitalize">{booking.preferred_time}</p>
                    </div>
                  </div>
                )}

                {booking.location_address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{booking.location_address}</p>
                    </div>
                  </div>
                )}

                {booking.message && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Additional Information</p>
                    <p className="text-sm">{booking.message}</p>
                  </div>
                )}

                <div className="pt-4 border-t bg-muted/30 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                  <p className="text-sm text-muted-foreground mb-2">Status Update</p>
                  {booking.status === "pending" && (
                    <p className="text-sm">Your booking is pending confirmation. We'll contact you within 24 hours to confirm your appointment.</p>
                  )}
                  {booking.status === "confirmed" && (
                    <p className="text-sm">Your booking is confirmed! We look forward to serving you.</p>
                  )}
                  {booking.status === "completed" && (
                    <p className="text-sm">Your booking has been completed. Thank you for choosing Notroom!</p>
                  )}
                  {booking.status === "cancelled" && (
                    <p className="text-sm">This booking has been cancelled. Please contact us if you have any questions.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trust & Help Section */}
          {!booking && (
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Secure Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Your booking information is protected with industry-standard encryption and security measures.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-2">
                    <CheckCircle className="w-6 h-6 text-success" />
                  </div>
                  <CardTitle className="text-lg">Real-Time Updates</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Get instant status updates on your booking. We'll contact you within 24 hours to confirm your appointment.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-2">
                    <MessageCircle className="w-6 h-6 text-accent" />
                  </div>
                  <CardTitle className="text-lg">24/7 Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Have questions? Call us at <a href="tel:814-480-0989" className="text-primary font-medium hover:underline">(814) 480-0989</a> or email support@notroom.com
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* FAQ Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Where can I find my Booking ID?</h3>
                <p className="text-sm text-muted-foreground">
                  Your Booking ID was sent to your email immediately after you submitted your booking request. Check your inbox and spam folder for an email from Notroom.
                </p>
              </div>
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-1">How long does confirmation take?</h3>
                <p className="text-sm text-muted-foreground">
                  We typically confirm bookings within 24 hours. For urgent requests, please call us directly at (814) 480-0989.
                </p>
              </div>
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-1">Can I modify my booking?</h3>
                <p className="text-sm text-muted-foreground">
                  Yes! Contact us at (814) 480-0989 or support@notroom.com with your Booking ID to reschedule or make changes.
                </p>
              </div>
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-1">What if I can't find my booking?</h3>
                <p className="text-sm text-muted-foreground">
                  Make sure you're using the exact email address you provided during booking. If you still can't find it, contact us and we'll help you locate it.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <div className="text-center mt-8 p-6 bg-primary/5 rounded-lg border border-primary/10">
            <h3 className="text-xl font-bold mb-2">Need to Make a New Booking?</h3>
            <p className="text-muted-foreground mb-4">
              Book your notary appointment today. Available for Remote Online Notary, Mobile Notary, and more.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => navigate("/")}>
                Book Appointment
              </Button>
              <Button variant="outline" onClick={() => navigate("/pricing")}>
                View Pricing
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </>
  );
};

export default TrackBooking;
