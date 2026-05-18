import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Car, FileText, Shield, Clock, AlertCircle, MapPin, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LegalDisclaimer from "@/components/LegalDisclaimer";
import TrustIndicators from "@/components/marketing/TrustIndicators";
import FAQSection from "@/components/marketing/FAQSection";
import { ServiceLocalSEO } from "@/components/local-seo/ServiceLocalSEO";
import { generateServiceSchema, generateBreadcrumbSchema, generateFAQSchema } from "@/utils/schemaGenerator";

const VehicleTitleTransfer = () => {
  const navigate = useNavigate();

  const scrollToBooking = () => {
    navigate("/");
    setTimeout(() => {
      document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const requiredDocuments = [
    { doc: "Current Vehicle Title", desc: "Original PA title certificate signed by seller" },
    { doc: "Valid Photo ID", desc: "Driver's license or state ID for both parties" },
    { doc: "Odometer Disclosure", desc: "Required for vehicles under 10 years old" },
    { doc: "Bill of Sale", desc: "Recommended for proof of purchase price" }
  ];

  const commonSituations = [
    { situation: "Private Vehicle Sale", desc: "Selling or buying a car from/to an individual", timeline: "15-30 minutes" },
    { situation: "Family Gift Transfer", desc: "Gifting a vehicle to family member", timeline: "15-20 minutes" },
    { situation: "Estate Vehicle Transfer", desc: "Transferring deceased owner's vehicle", timeline: "20-30 minutes" },
    { situation: "Out-of-State Transfer", desc: "Bringing vehicle into Pennsylvania", timeline: "30-45 minutes" }
  ];

  const faqs = [
    {
      question: "Does Pennsylvania require notarization for vehicle title transfers?",
      answer: "Yes, Pennsylvania law requires notarization of vehicle title transfers for all private party sales. Both the seller and buyer must sign the title in the presence of a notary public. Dealer sales do not require notarization."
    },
    {
      question: "Can I complete the title transfer before meeting the buyer/seller?",
      answer: "No. Pennsylvania law requires that all parties sign the title in the presence of a notary at the same time. Pre-signed titles are not acceptable and may be rejected by PennDOT."
    },
    {
      question: "What documents do I need for a PA title transfer?",
      answer: "You'll need: (1) Original PA title certificate, (2) Valid photo ID for both buyer and seller, (3) Odometer disclosure (vehicles under 10 years), (4) Bill of sale (recommended), (5) Form MV-4ST if applicable for sales tax."
    },
    {
      question: "How much does mobile vehicle title notarization cost?",
      answer: "Our base notarization fee is $60, plus $1.50 per mile round-trip travel from Erie. For example, if you're 15 miles away, total cost would be $60 + $45 (30 miles round-trip) = $105. This pricing structure separates the notary service from the mobile travel convenience."
    },
    {
      question: "Can you notarize if the seller or buyer isn't present?",
      answer: "No. Pennsylvania notary law requires all signers to personally appear before the notary at the time of signing. We cannot notarize documents signed in advance or by absent parties."
    },
    {
      question: "What happens after the title is notarized?",
      answer: "After notarization, the buyer must take the signed title to PennDOT within 10 days to complete the registration transfer. The buyer will pay PennDOT's title transfer fee ($58) and any applicable sales tax."
    },
    {
      question: "Do you help with PennDOT Form MV-4ST for sales tax?",
      answer: "Yes, we can witness and notarize Form MV-4ST (Vehicle Sales and Use Tax Return/Application for Registration) which is used to document the sale price for PA sales tax purposes."
    }
  ];

  const serviceSchema = generateServiceSchema({
    name: "Vehicle Title Transfer Notary Erie, PA",
    description: "Mobile notary for PA vehicle title transfers. We come to you in Erie County. $60 base fee + $1.50/mile travel. PennDOT MV-4ST forms.",
    provider: "Notroom - Vehicle Title Transfer Notary",
    areaServed: "Erie County PA",
    price: "60",
    url: "https://notroom.com/services/vehicle-title-transfer"
  });

  const faqSchema = generateFAQSchema(faqs.map(f => ({ question: f.question, answer: f.answer })));

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://notroom.com" },
    { name: "Services", url: "https://notroom.com/pricing" },
    { name: "Vehicle Title Transfer", url: "https://notroom.com/services/vehicle-title-transfer" }
  ]);

  const combinedSchema = {
    "@context": "https://schema.org",
    "@graph": [serviceSchema, faqSchema, breadcrumbSchema]
  };

  return (
    <Layout>
      <SEO
        title="Vehicle Title Transfer Notary Erie, PA | $60 + Travel | Mobile Service"
        description="PA vehicle title transfer notarization - $60 + $1.50/mile travel. Mobile service Erie County. Required by law for private sales. PennDOT MV-4ST forms. Same-day appointments."
        keywords="vehicle title transfer Erie PA, car title notary Northwestern PA, auto title notarization Erie County, PA title transfer mobile notary, PennDOT MV-4ST notary"
        canonical="https://notroom.com/services/vehicle-title-transfer"
        schema={combinedSchema}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[hsl(var(--hero-gradient-from))] to-[hsl(var(--hero-gradient-to))] text-primary-foreground py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-accent text-accent-foreground border-0">
              Required by Pennsylvania Law
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">PA Vehicle Title Transfer Notary</h1>
            <p className="text-xl mb-8 opacity-90">
              Mobile notary service for Pennsylvania vehicle title transfers. Required for all private party sales. We come to you anywhere in Erie County.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" onClick={scrollToBooking} className="text-lg px-8 py-6">
                Book Mobile Service - $60 + Travel
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-primary-foreground opacity-90 hover:opacity-100"
                onClick={() => window.location.href = "tel:814-480-0989"}
              >
                Call (814) 480-0989
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <TrustIndicators />
          </div>
        </div>
      </section>

      {/* Pennsylvania Law Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Pennsylvania Vehicle Title Transfer Law</h2>
            <Card className="p-8">
              <div className="bg-primary/10 border-l-4 border-primary p-6 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold mb-2 text-primary">Legal Requirement</h3>
                    <p className="text-sm">
                      Under Pennsylvania law (75 Pa.C.S. § 1115), all private party vehicle title transfers must be notarized. Both the seller (assignor) and buyer (assignee) must sign the title in the presence of a Pennsylvania notary public. Dealer transactions handled through licensed dealers are exempt from this requirement.
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                PennDOT will reject titles that are not properly notarized. A rejected title can delay your registration transfer and may require the seller and buyer to meet again with a notary.
              </p>
              <div className="bg-muted/30 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Why This Law Exists</h4>
                <p className="text-sm text-muted-foreground">
                  Notarization protects both parties by ensuring authentic signatures and creating an official record of the transaction. It helps prevent title fraud and disputes about ownership transfer.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Simple, Transparent Pricing</h2>
            <Card className="p-8 border-primary border-2">
              <div className="text-center mb-8">
                <div className="text-5xl font-bold text-primary mb-2">$60</div>
                <p className="text-xl text-muted-foreground">Base notarization fee + $1.50/mile travel</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    What's Included:
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span>Notarization of PA vehicle title</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span>Mobile service at your location</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span>MV-4ST form notarization (if needed)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span>Same-day appointments available</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span>PennDOT compliance guaranteed</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Car className="w-5 h-5 text-primary" />
                    Common Situations:
                  </h3>
                  {commonSituations.map((item, index) => (
                    <div key={index} className="mb-3 pb-3 border-b last:border-0">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-sm">{item.situation}</span>
                        <span className="text-xs text-muted-foreground">{item.timeline}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-primary/5 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Mobile Service Pricing Example:
                </h4>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base notarization fee:</span>
                    <span className="font-semibold">$60</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Travel (20 miles from Erie × 2 × $1.50):</span>
                    <span className="font-semibold">$60</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-bold">Total:</span>
                    <span className="font-bold text-primary">$120</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Required Documents Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">What You Need to Bring</h2>
            <div className="space-y-4">
              {requiredDocuments.map((item, index) => (
                <Card key={index} className="p-6">
                  <div className="flex gap-4">
                    <FileText className="w-6 h-6 text-primary flex-shrink-0" />
                    <div>
                      <h3 className="font-bold mb-1">{item.doc}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="mt-6 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-6 rounded-lg">
              <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-3">Important Note</h3>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Both buyer and seller must be present at the time of notarization with valid photo identification. We cannot notarize documents signed in advance or by absent parties under Pennsylvania notary law.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Schedule Appointment</h3>
                    <p className="text-muted-foreground">
                      Book online or call (814) 480-0989. Provide your location and preferred date/time. Same-day appointments often available.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">We Come to You</h3>
                    <p className="text-muted-foreground">
                      Our mobile notary arrives at your specified location with all necessary equipment. Typical appointments: parking lot of buyer's or seller's home, workplace, or public meeting space.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Document Verification</h3>
                    <p className="text-muted-foreground">
                      We verify IDs, review the title for completeness, and ensure all required sections are filled out correctly. This takes about 5-10 minutes.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Sign & Notarize</h3>
                    <p className="text-muted-foreground">
                      Both parties sign the title in our presence. We complete the notarization with our official seal and signature. Form MV-4ST notarized if provided.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    5
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Complete Transaction</h3>
                    <p className="text-muted-foreground">
                      Buyer receives the notarized title. Buyer must visit PennDOT within 10 days to complete registration transfer ($58 title fee + sales tax applies at PennDOT).
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Common Mistakes Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Common Mistakes to Avoid</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 border-red-200 dark:border-red-900">
                <h3 className="font-bold text-red-600 dark:text-red-400 mb-2">❌ Pre-Signing the Title</h3>
                <p className="text-sm text-muted-foreground">
                  Never sign the title before meeting with the notary. All signatures must be made in the notary's presence.
                </p>
              </Card>

              <Card className="p-6 border-red-200 dark:border-red-900">
                <h3 className="font-bold text-red-600 dark:text-red-400 mb-2">❌ Missing Odometer Disclosure</h3>
                <p className="text-sm text-muted-foreground">
                  Vehicles under 10 years old require odometer reading. Failure to complete this section will cause PennDOT rejection.
                </p>
              </Card>

              <Card className="p-6 border-red-200 dark:border-red-900">
                <h3 className="font-bold text-red-600 dark:text-red-400 mb-2">❌ Incorrect Names</h3>
                <p className="text-sm text-muted-foreground">
                  Name on title must match ID exactly. Nicknames or variations will cause processing delays.
                </p>
              </Card>

              <Card className="p-6 border-red-200 dark:border-red-900">
                <h3 className="font-bold text-red-600 dark:text-red-400 mb-2">❌ Waiting Too Long</h3>
                <p className="text-sm text-muted-foreground">
                  Buyers must register at PennDOT within 10 days to avoid late fees and penalties.
                </p>
              </Card>

              <Card className="p-6 border-red-200 dark:border-red-900">
                <h3 className="font-bold text-red-600 dark:text-red-400 mb-2">❌ Missing Seller Information</h3>
                <p className="text-sm text-muted-foreground">
                  Seller must complete their section fully including address and signature. Incomplete information causes rejection.
                </p>
              </Card>

              <Card className="p-6 border-red-200 dark:border-red-900">
                <h3 className="font-bold text-red-600 dark:text-red-400 mb-2">❌ Not Bringing ID</h3>
                <p className="text-sm text-muted-foreground">
                  Both parties need valid, unexpired government-issued photo ID. No exceptions for notarization.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection 
        title="Frequently Asked Questions About PA Title Transfers"
        faqs={faqs}
      />

      {/* Local SEO Section */}
      <ServiceLocalSEO 
        serviceName="Vehicle Title Transfer Notary"
        reviews={[
          { text: "Met us at the parking lot for our car sale. Quick and easy title notarization.", author: "Mike T.", city: "Erie", rating: 5 },
          { text: "Came to our home to notarize title for family vehicle gift. Very convenient.", author: "Sarah K.", city: "Millcreek", rating: 5 },
          { text: "Professional mobile notary for our used car purchase. Made it so simple.", author: "James L.", city: "Harborcreek", rating: 5 },
          { text: "Fast service for PA title transfer. Notary arrived on time and was very helpful.", author: "Linda M.", city: "Fairview", rating: 5 }
        ]}
      />

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Ready to Transfer Your Vehicle Title?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Mobile notary service makes PA title transfers simple. We come to you anywhere in Erie County.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="amber" onClick={scrollToBooking} className="text-lg px-8">
                Book Mobile Service
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => window.location.href = "tel:814-480-0989"}
              >
                Call (814) 480-0989
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default VehicleTitleTransfer;
