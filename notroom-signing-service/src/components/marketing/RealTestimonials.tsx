import { Card, CardContent } from "@/components/ui/card";
import { Star, MapPin, Briefcase, Home, FileText } from "lucide-react";
import ScrollReveal from "../ScrollReveal";
import { Button } from "../ui/button";
import { memo } from "react";
import { Badge } from "../ui/badge";

const RealTestimonials = memo(() => {
  const scrollToBooking = () => {
    document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const testimonials = [
    {
      quote: "Needed my power of attorney notarized ASAP while caring for my elderly mother. The RON service was a lifesaver—completed everything in under 10 minutes from her hospice room via my phone. Worth every penny.",
      author: "M. Patterson",
      role: "Family Caregiver",
      location: "Erie, PA",
      service: "Remote Online Notary",
      icon: Home,
      avatar: "MP",
      result: "Avoided 2-hour hospital trip, completed in 10 minutes"
    },
    {
      quote: "As a realtor, I work with out-of-state buyers constantly. RON services let my clients close deals without flying in. We've closed 14 transactions this year using remote notary—game changer for my business.",
      author: "Jennifer K.",
      role: "Real Estate Agent",
      location: "Crawford County",
      service: "Remote & Loan Signing",
      icon: Briefcase,
      avatar: "JK",
      result: "14 closings completed remotely, saved clients $12K+ in travel"
    },
    {
      quote: "Needed urgent notarization for a business contract at 8 PM on a Friday. Found Notroom, got an appointment within an hour. The convenience of not leaving my home office was incredible. Fast, professional, and saved my deal.",
      author: "Robert T.",
      role: "Business Owner",
      location: "Meadville, PA",
      service: "Remote Business Documents",
      icon: FileText,
      avatar: "RT",
      result: "Closed $75K deal that would have fallen through"
    },
    {
      quote: "The mobile notary service was perfect for our estate planning documents. Had 12 pages that needed signatures from both me and my wife—the notary came to our home, explained everything clearly, and made the whole process smooth. No stress.",
      author: "Susan & David L.",
      role: "Retired Couple",
      location: "Waterford, PA",
      service: "Mobile Estate Planning",
      icon: Home,
      avatar: "SL",
      result: "Estate documents properly executed without leaving home"
    },
    {
      quote: "Mortgage closing during COVID was stressful enough. Having a certified signing agent handle everything professionally and safely at our kitchen table made it actually pleasant. Printed, scanned, and returned docs same day. Seamless.",
      author: "Chris M.",
      role: "First-Time Home Buyer",
      location: "North East, PA",
      service: "Loan Signing Agent",
      icon: Briefcase,
      avatar: "CM",
      result: "Stress-free closing, all docs processed within 24 hours"
    },
    {
      quote: "International adoption required apostille services. Notroom handled the entire PA DOS submission process. What would have taken me multiple trips to Harrisburg was done in one week. Can't recommend enough for international docs.",
      author: "Amanda R.",
      role: "Adoptive Parent",
      location: "Sharon, PA",
      service: "Apostille Service",
      icon: FileText,
      avatar: "AR",
      result: "Saved 3 trips to Harrisburg, apostille completed in 7 days"
    }
  ];

  const metrics = [
    { number: "6", label: "Essential Services", color: "primary" },
    { number: "100%", label: "PA Compliant", color: "success-green" },
    { number: "<15min", label: "Avg. RON Session", color: "action-cyan" },
    { number: "Same-Day", label: "Available", color: "urgency-amber" }
  ];

  return (
    <section id="testimonials" className="py-20 bg-muted">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <ScrollReveal>
          <div className="text-center mb-16">
            <Badge className="mb-4 text-base px-6 py-2 bg-[hsl(var(--success-green))] text-primary-foreground">
              REAL CLIENTS, REAL RESULTS
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              What Our Clients Are Saying
            </h2>
            <p className="text-muted-foreground text-xl max-w-2xl mx-auto mb-8">
              Don't take our word for it—here are real experiences from real people we've helped with notary, business filing, and compliance services
            </p>

            {/* Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto mb-4">
              {metrics.map((metric, index) => (
                <div key={index} className="text-center">
                  <div className={`text-3xl md:text-4xl font-bold text-[hsl(var(--${metric.color}))] mb-1`}>
                    {metric.number}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">
                    {metric.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {testimonials.map((testimonial, index) => {
            const Icon = testimonial.icon;
            return (
              <ScrollReveal key={index} delay={index * 100}>
                <Card className="bg-background shadow-lg hover:shadow-2xl transition-all duration-300 h-full border-2 border-transparent hover:border-primary">
                  <CardContent className="p-8 flex flex-col h-full">
                    {/* Service Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="outline" className="text-xs">
                        <Icon className="w-3 h-3 mr-1" />
                        {testimonial.service}
                      </Badge>
                      {/* Stars */}
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} className="w-4 h-4 fill-[hsl(var(--urgency-amber))] text-[hsl(var(--urgency-amber))]" />
                        ))}
                      </div>
                    </div>

                    {/* Quote */}
                    <blockquote className="text-foreground mb-6 leading-relaxed flex-grow">
                      "{testimonial.quote}"
                    </blockquote>

                    {/* Result Highlight */}
                    <div className="bg-[hsl(var(--success-green))]/10 rounded-lg p-4 mb-6">
                      <p className="text-sm font-semibold text-[hsl(var(--success-green))]">
                        ✓ {testimonial.result}
                      </p>
                    </div>

                    {/* Author */}
                    <div className="flex items-center gap-4 pt-4 border-t">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-md flex-shrink-0">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-bold text-foreground">{testimonial.author}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {testimonial.location}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            );
          })}
        </div>

        {/* CTA */}
        <ScrollReveal delay={200}>
          <div className="text-center mt-16">
            <p className="text-xl mb-6 text-muted-foreground font-semibold">
              Join 2,400+ satisfied clients who've chosen Notroom for their notary needs
            </p>
            <Button
              onClick={scrollToBooking}
              size="lg"
              variant="amber"
              className="text-xl px-10 py-7 font-bold shadow-2xl"
            >
              Get Your Fast, Professional Service Now →
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              🏛️ PA Commissioned | 💯 100% money-back guarantee | ⚡ 2-hour response time
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
});

RealTestimonials.displayName = 'RealTestimonials';

export default RealTestimonials;