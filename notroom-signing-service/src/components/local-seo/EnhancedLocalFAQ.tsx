import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQItem {
  question: string;
  answer: string;
}

interface EnhancedLocalFAQProps {
  cityName: string;
  county: string;
  zipCodes: string[];
  faqs?: FAQItem[];
}

export const EnhancedLocalFAQ = ({ 
  cityName, 
  county,
  zipCodes,
  faqs 
}: EnhancedLocalFAQProps) => {
  const defaultFAQs: FAQItem[] = [
    {
      question: `How quickly can you arrive in ${cityName}?`,
      answer: `For mobile notary services in ${cityName} (zip codes ${zipCodes.slice(0, 3).join(', ')}), we typically arrive within 30-60 minutes during business hours, depending on your location and our current schedule. Same-day appointments are usually available. For Remote Online Notary (RON), you can connect instantly 24/7 from anywhere in ${cityName}.`
    },
    {
      question: `Do you serve all neighborhoods in ${cityName}?`,
      answer: `Yes! We provide mobile notary services throughout all of ${cityName} and surrounding ${county} areas. Our service area covers all ${cityName} zip codes including ${zipCodes.slice(0, 5).join(', ')}, and more. If you're in ${county}, we can reach you.`
    },
    {
      question: `What are your rates for ${cityName} residents?`,
      answer: `Mobile notary service starts at $125 base ($5 PA notary fee per signature + $120 service fee for travel coordination) plus $1.50/mile travel from our Erie office. Remote Online Notary (RON) is a flat $60 ($5 PA notary fee + $55 technology platform fee for secure video, KBA, and 10-year storage) with no travel charges - available 24/7 for ${cityName} residents. Loan signings start at $175 ($5 PA notary per signature + $170 agent service). We provide transparent quotes before every appointment.`
    },
    {
      question: `Are you licensed to notarize in Pennsylvania?`,
      answer: `Yes, we hold active Pennsylvania notary commissions issued by the PA Department of State. We're fully bonded, insured, and compliant with all Pennsylvania notary laws (57 Pa.C.S. § 301 et seq.). Our notarizations are valid throughout Pennsylvania and accepted by all ${county} offices, courts, and institutions.`
    },
    {
      question: `Can you notarize documents after hours in ${cityName}?`,
      answer: `Yes! Remote Online Notary (RON) is available 24/7 for ${cityName} residents - evenings, weekends, and holidays. Mobile notary appointments can be scheduled for after-hours and weekends in ${cityName}, though evening/weekend rates may apply. Contact us to schedule a time that works for you.`
    },
    {
      question: `Do you handle real estate closings in ${cityName}?`,
      answer: `Absolutely! We're certified loan signing agents serving ${cityName} and ${county}. We handle purchase, refinance, HELOC, and reverse mortgage closings throughout ${cityName}. We're familiar with local title companies, lenders, and ${county} recording requirements.`
    }
  ];

  const displayFAQs = faqs && faqs.length > 0 ? faqs : defaultFAQs;

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked Questions - {cityName}
            </h2>
            <p className="text-lg text-muted-foreground">
              Common questions from {cityName} residents about our notary services
            </p>
          </div>
          
          <Accordion type="single" collapsible className="w-full space-y-4">
            {displayFAQs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-6 bg-background">
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
