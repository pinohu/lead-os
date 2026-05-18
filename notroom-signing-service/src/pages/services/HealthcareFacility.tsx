import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Heart, Clock, Shield, Phone, MapPin } from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { useNavigate } from "react-router-dom";
import TrustIndicators from "@/components/marketing/TrustIndicators";
import { ServiceLocalSEO } from "@/components/local-seo/ServiceLocalSEO";
import FAQSection from "@/components/marketing/FAQSection";
import { generateServiceSchema, generateBreadcrumbSchema, generateFAQSchema } from "@/utils/schemaGenerator";

const HealthcareFacility = () => {
  const navigate = useNavigate();

  const scrollToBooking = () => {
    navigate('/', { state: { scrollToBooking: true } });
    setTimeout(() => {
      const bookingSection = document.getElementById('booking-form');
      if (bookingSection) {
        bookingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handlePhoneClick = () => {
    window.location.href = 'tel:8144800989';
  };

  const facilities = [
    {
      name: "Hospitals",
      price: "$175+",
      features: ["Emergency notarizations", "Bedside service", "After-hours available", "All departments"],
      icon: Heart
    },
    {
      name: "Nursing Homes",
      price: "$150+",
      features: ["Compassionate service", "Estate planning", "Healthcare POAs", "Flexible scheduling"],
      icon: Heart
    },
    {
      name: "Assisted Living",
      price: "$150+",
      features: ["Resident convenience", "Common room meetings", "Private room visits", "Document assistance"],
      icon: Heart
    },
    {
      name: "Hospice Care",
      price: "$190+",
      features: ["Sensitive approach", "Priority scheduling", "At bedside", "Family-centered"],
      icon: Heart
    }
  ];

  const commonDocuments = [
    "Healthcare Power of Attorney",
    "Living Will / Advance Directive",
    "HIPAA Authorization",
    "DNR Orders",
    "Estate Planning Documents",
    "Financial Power of Attorney",
    "Insurance Claim Forms",
    "Medical Consent Forms"
  ];

  const faqs = [
    {
      question: "How quickly can you come to a healthcare facility?",
      answer: "We understand the urgency of healthcare situations. For emergency requests, we can typically arrive within 2-4 hours. For scheduled appointments, we offer same-day and next-day service. After-hours and weekend appointments are available with premium scheduling."
    },
    {
      question: "What if the patient is unable to sign?",
      answer: "Pennsylvania law requires the signer to be conscious, alert, and able to sign their name. We assess each situation carefully. If someone cannot sign, we can discuss alternatives like having someone sign with a pre-existing power of attorney. We cannot notarize documents for individuals who are not conscious or mentally capable."
    },
    {
      question: "Do you charge extra for after-hours hospital visits?",
      answer: "Yes, after-hours visits (6pm-9pm) include a $40 premium, and late-night visits (9pm-midnight) include an $85 premium. This ensures availability for urgent medical situations regardless of the time."
    },
    {
      question: "Can you notarize documents in ICU or COVID units?",
      answer: "Yes, we can serve restricted units. We follow all facility protocols including PPE requirements, health screenings, and visitor policies. Some facilities may require advance clearance or have specific visiting procedures we'll coordinate."
    },
    {
      question: "What's included in the facility visit fee?",
      answer: "The facility visit fee covers travel to the location, coordination with facility staff, time spent navigating security/check-in procedures, waiting time, and the notarization service. It also includes our specialized training in working with patients who may be ill or distressed."
    },
    {
      question: "Will you work with our facility's staff?",
      answer: "Absolutely. We coordinate with nurses, social workers, and family members to ensure the process is smooth and doesn't interfere with medical care. We're experienced in working within the healthcare environment and respect all facility protocols."
    }
  ];

  const serviceSchema = generateServiceSchema({
    name: "Healthcare Facility Notary Services",
    description: "Professional mobile notary services for hospitals, nursing homes, assisted living facilities, and hospice care in Pennsylvania",
    provider: "Notroom - Ron Swank",
    areaServed: "Pennsylvania",
    price: "150",
    url: "https://notroom.com/services/healthcare-facility"
  });

  const faqSchema = generateFAQSchema(faqs);

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://notroom.com" },
    { name: "Services", url: "https://notroom.com/pricing" },
    { name: "Healthcare Facility Notary", url: "https://notroom.com/services/healthcare-facility" }
  ]);

  const combinedSchema = {
    "@context": "https://schema.org",
    "@graph": [serviceSchema, faqSchema, breadcrumbSchema]
  };

  return (
    <Layout>
      <SEO 
        title="Healthcare Facility Notary Services | Hospital, Nursing Home & Hospice"
        description="Professional mobile notary services for hospitals, nursing homes, assisted living facilities, and hospice care. Compassionate, experienced service for healthcare power of attorney, living wills, and estate planning documents. Available 24/7 for urgent needs."
        keywords="healthcare notary, hospital notary, nursing home notary, hospice notary, assisted living notary, bedside notary, healthcare power of attorney, living will notary, DNR notarization, medical facility notary Pennsylvania"
        schema={combinedSchema}
      />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Heart className="h-4 w-4" />
              <span>Compassionate Healthcare Notary Services</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Professional Notary Services for Healthcare Facilities
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Specialized mobile notary services for hospitals, nursing homes, assisted living facilities, and hospice care throughout Pennsylvania. Sensitive, professional service when it matters most.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={scrollToBooking} className="text-lg px-8">
                Request Healthcare Visit
              </Button>
              <Button size="lg" variant="outline" onClick={handlePhoneClick} className="text-lg px-8">
                <Phone className="mr-2 h-5 w-5" />
                Call (814) 480-0989
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              ⚡ Emergency service available • 24/7 on-call for urgent needs
            </p>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-8 border-b">
        <div className="container mx-auto px-4">
          <TrustIndicators />
        </div>
      </section>

      {/* Facility Types & Pricing */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Facilities We Serve</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Premium mobile notary services tailored to healthcare environments with pricing that reflects the specialized nature of facility visits.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {facilities.map((facility) => (
              <Card key={facility.name} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <facility.icon className="h-10 w-10 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{facility.name}</h3>
                  <div className="text-2xl font-bold text-primary mb-4">{facility.price}</div>
                  <ul className="space-y-2">
                    {facility.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Premium Service Notice */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Shield className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Why Healthcare Facility Visits Cost More</h3>
                  <p className="text-muted-foreground mb-4">
                    Healthcare facility notarizations involve specialized requirements that justify premium pricing:
                  </p>
                  <ul className="grid md:grid-cols-2 gap-3">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Security clearance and facility check-in procedures (15-30 minutes)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Coordination with medical staff and family members</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Working around medical care schedules</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Specialized training for working with ill or distressed individuals</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Careful assessment of mental capacity and willingness</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Compassionate, patient-centered approach</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Common Documents */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Documents We Commonly Notarize in Healthcare Settings</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {commonDocuments.map((doc, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-background p-4 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="font-medium">{doc}</span>
                </div>
              ))}
            </div>
            <Card className="mt-8 border-amber-500/50 bg-amber-500/5">
              <CardContent className="pt-6">
                <p className="text-sm text-center">
                  <strong>Important:</strong> We cannot notarize documents for individuals who are not conscious, alert, and mentally capable of understanding what they are signing. Pennsylvania law requires the signer to be willing and able to communicate.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Additional Fees */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Complete Pricing Transparency</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">Base Healthcare Facility Pricing:</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex justify-between">
                        <span>Standard hours (8am-6pm):</span>
                        <span className="font-semibold">$150-175</span>
                      </li>
                      <li className="flex justify-between">
                        <span>After hours (6pm-9pm):</span>
                        <span className="font-semibold">+$40</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Late night (9pm-midnight):</span>
                        <span className="font-semibold">+$85</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Weekend service:</span>
                        <span className="font-semibold">+$65-90</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Major holiday:</span>
                        <span className="font-semibold">+$125</span>
                      </li>
                    </ul>
                  </div>
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Travel Fees (Added to Base Price):</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex justify-between">
                        <span>0-10 miles:</span>
                        <span className="font-semibold">$30</span>
                      </li>
                      <li className="flex justify-between">
                        <span>11-20 miles:</span>
                        <span className="font-semibold">$50</span>
                      </li>
                      <li className="flex justify-between">
                        <span>21-30 miles:</span>
                        <span className="font-semibold">$70</span>
                      </li>
                      <li className="flex justify-between">
                        <span>30+ miles:</span>
                        <span className="font-semibold">$70 + $2/additional mile</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <p className="text-sm font-medium text-center">
                      <Clock className="inline h-4 w-4 mr-1" />
                      Total typical investment: $175-240 for complete healthcare facility notarization service
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <FAQSection faqs={faqs} />
        </div>
      </section>

      {/* Local SEO */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <ServiceLocalSEO
            serviceName="Healthcare Facility Notary Services"
          />
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Providing Dignified Notary Services When It Matters Most
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              We understand that healthcare situations require sensitivity, professionalism, and prompt service. Our experienced notaries are trained to work compassionately in medical environments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={scrollToBooking} className="text-lg px-8">
                Schedule Healthcare Visit
              </Button>
              <Button size="lg" variant="outline" onClick={handlePhoneClick} className="text-lg px-8">
                <Phone className="mr-2 h-5 w-5" />
                Emergency: (814) 480-0989
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              Available 24/7 for urgent healthcare notarization needs
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default HealthcareFacility;
