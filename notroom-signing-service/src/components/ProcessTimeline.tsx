import { Calendar, CheckCircle, FileText } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import { Button } from "@/components/ui/button";
import { memo } from "react";

const ProcessTimeline = memo(() => {
  const steps = [
    {
      number: "1",
      icon: Calendar,
      title: "Choose Your Service",
      description: "Select from notary (online/mobile), loan signing, apostille, I-9 verification, or business filing. Book online or call (814) 480-0989.",
      time: "Takes 2 minutes"
    },
    {
      number: "2",
      icon: CheckCircle,
      title: "Prepare & Schedule",
      description: "For notary: Upload documents. For business: Provide details. For I-9: Coordinate with employer. We guide you through each step.",
      time: "Simple process"
    },
    {
      number: "3",
      icon: FileText,
      title: "Complete & Receive",
      description: "Notarization via video or mobile. Business filings submitted to PA DOS. I-9 completed. Apostille applications prepared. All deliverables sent promptly.",
      time: "Fast turnaround"
    }
  ];

  const scrollToBooking = () => {
    document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="process" className="py-20 bg-muted" aria-labelledby="process-heading">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 id="process-heading" className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            How It Works - 3 Simple Steps
          </h2>
          <p className="text-xl text-muted-foreground">
            Simple process for all our services—notarization, business filing, and compliance
          </p>
        </div>

        {/* Timeline */}
        <div className="max-w-5xl mx-auto">
          <ol className="grid md:grid-cols-3 gap-8 relative" role="list" aria-label="Process steps">
            {/* Connecting Line - Desktop Only */}
            <div className="hidden md:block absolute top-20 left-0 right-0 h-0.5 bg-primary/20" style={{ width: 'calc(100% - 8rem)', left: '4rem' }} aria-hidden="true" />
            
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <ScrollReveal key={index} delay={index * 200}>
                  <li className="relative" role="listitem">
                  {/* Step Number Badge */}
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-lg z-10 relative" aria-label={`Step ${step.number}`}>
                        {step.number}
                      </div>
                      <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" aria-hidden="true" />
                    </div>
                  </div>

                  {/* Content Card */}
                  <div className="bg-background rounded-xl p-6 shadow-lg text-center">
                    {/* Icon */}
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center" aria-hidden="true">
                        <Icon className="w-8 h-8 text-accent" aria-hidden="true" />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-foreground mb-3">
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {step.description}
                    </p>

                    {/* Time Badge */}
                    <div className="inline-block px-4 py-1 bg-[hsl(var(--success-green))]/10 rounded-full">
                      <span className="text-sm font-semibold text-[hsl(var(--success-green))]">
                        {step.time}
                      </span>
                    </div>
                  </div>
                </li>
                </ScrollReveal>
              );
            })}
          </ol>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button 
            size="lg" 
            variant="amber"
            className="text-lg px-12 py-7 h-auto shadow-xl"
            onClick={scrollToBooking}
            aria-label="Book your appointment now"
          >
            Book Your Appointment
          </Button>
        </div>
      </div>
    </section>
  );
});

ProcessTimeline.displayName = 'ProcessTimeline';

export default ProcessTimeline;
