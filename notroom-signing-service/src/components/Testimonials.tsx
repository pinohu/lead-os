import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import { Button } from "@/components/ui/button";
import { memo } from "react";

const Testimonials = memo(() => {
  const scrollToBooking = () => {
    const element = document.getElementById("booking-form");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const testimonials = [
    {
      quote: "Online notarization saves so much time. No driving to the bank, no waiting in line. Just jump on a video call and you're done in minutes.",
      author: "Typical Online User",
      location: "Pennsylvania",
      avatar: "OU"
    },
    {
      quote: "Mobile notary services are perfect for real estate closings. Having a notary come to you makes the process so much smoother and more convenient.",
      author: "Real Estate Professional",
      location: "Erie County",
      avatar: "RE"
    },
    {
      quote: "For elderly or hospitalized family members, mobile notary services are essential. Being able to get documents notarized at home or in care facilities makes a difficult time easier.",
      author: "Family Caregiver",
      location: "Erie Area",
      avatar: "FC"
    }
  ];

  return (
    <section id="testimonials" className="py-20 bg-muted" aria-labelledby="testimonials-heading">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 id="testimonials-heading" className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Why Choose Professional Notary Services
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Here's what people typically experience with quality notary services
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <ScrollReveal key={index} delay={index * 150}>
              <Card className="bg-background shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
                <CardContent className="p-8">
                  {/* Stars */}
                  <div className="flex gap-1 mb-4" role="img" aria-label="5 out of 5 stars">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-5 h-5 fill-[hsl(var(--urgency-amber))] text-[hsl(var(--urgency-amber))]" aria-hidden="true" />
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote className="text-foreground mb-6 leading-relaxed text-lg">
                    "{testimonial.quote}"
                  </blockquote>

                  {/* Author */}
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-md"
                      aria-label={`Avatar for ${testimonial.author}`}
                    >
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-foreground">{testimonial.author}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.location}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </div>

        {/* CTA Link */}
        <div className="text-center mt-12">
          <Button
            onClick={scrollToBooking}
            variant="link"
            className="text-primary hover:text-accent font-semibold text-lg underline underline-offset-4 transition-colors"
          >
            Book Your Appointment →
          </Button>
        </div>
      </div>
    </section>
  );
});

Testimonials.displayName = 'Testimonials';

export default Testimonials;
