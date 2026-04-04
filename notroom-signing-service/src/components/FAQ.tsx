import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "What services does Notroom offer?",
      answer: "We provide six core services: (1) Remote Online Notarization ($60), (2) Mobile Notary Service ($125+), (3) Loan Signing Agent ($175), (4) Apostille Services ($245+), (5) I-9 Employment Verification ($85+), and (6) Registered Office & Business Filing services ($149+). All services are fully licensed and Pennsylvania-compliant."
    },
    {
      question: "How much does notarization cost?",
      answer: "Remote online notary: $60 total ($5 PA notary fee per signature + $55 technology platform fee for video, KBA verification, and 10-year storage). Mobile notary: $125 base ($5 PA notary fee + $120 service fee for travel/coordination) + $1.50/mile. Loan signing: $175+ ($5 PA notary per signature + $170 agent service for printing, travel, insurance, scan-back). All pricing transparent with PA law-compliant fee structure."
    },
    {
      question: "How fast can you get to my location for mobile service?",
      answer: "For Erie County, we offer same-day service with typical arrival within 2-4 hours of booking. Emergency/urgent requests can often be accommodated within 1-2 hours for an additional rush fee. We also offer scheduled appointments for your convenience."
    },
    {
      question: "What do I need for an online notarization?",
      answer: "You'll need: (1) A valid government-issued photo ID (driver's license or passport), (2) A device with camera and microphone (computer or smartphone), (3) Stable internet connection, (4) Your unsigned document in PDF format. The entire process takes about 10-15 minutes."
    },
    {
      question: "Do you notarize wills and estate documents?",
      answer: "Yes, we notarize powers of attorney, living wills, and many estate documents. However, Pennsylvania law requires certain documents (like last wills and testaments) to have witnesses present. For these, we recommend our mobile service where we can bring witnesses if needed. Contact us to discuss your specific document."
    },
    {
      question: "Are your notaries background-checked?",
      answer: "Absolutely. All Notroom notaries are Pennsylvania-commissioned, bonded, and have undergone comprehensive background checks. Our loan signing agents carry professional liability insurance. Your security and privacy are our top priorities."
    }
  ];

  return (
    <section id="faq" className="py-20 bg-background" aria-labelledby="faq-heading">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 id="faq-heading" className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4" aria-label="Frequently asked questions">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-muted rounded-lg px-6 border-none shadow-sm"
              >
                <AccordionTrigger className="text-left text-lg font-semibold text-foreground hover:text-primary py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
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

export default FAQ;
