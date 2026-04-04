import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Camera, Shield, Clock, CheckCircle, AlertCircle, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ServiceLocalSEO } from "@/components/local-seo/ServiceLocalSEO";
import { generateServiceSchema, generateBreadcrumbSchema, generateFAQSchema } from "@/utils/schemaGenerator";
import FAQSection from "@/components/marketing/FAQSection";
import TrustIndicators from "@/components/marketing/TrustIndicators";

const PassportPhotos = () => {
  const navigate = useNavigate();

  const scrollToBooking = () => {
    navigate("/");
    setTimeout(() => {
      document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const serviceSchema = generateServiceSchema({
    name: "Passport & Visa Photos Erie, PA",
    description: "Professional passport and visa photos in Erie, PA. Guaranteed compliant with US State Department and embassy requirements. $15 for 2 photos.",
    provider: "Notroom - Passport Photo Services",
    areaServed: "Northwestern Pennsylvania",
    price: "15",
    url: "https://notroom.com/services/passport-photos"
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://notroom.com" },
    { name: "Services", url: "https://notroom.com/pricing" },
    { name: "Passport Photos", url: "https://notroom.com/services/passport-photos" }
  ]);

  const faqSchema = generateFAQSchema([
    {
      question: "How much do passport photos cost in Erie, PA?",
      answer: "Passport photos are $15 per session, which includes 2 compliant photos. We also offer mobile service at your location for $15 + $1.50/mile travel from Erie. Additional prints are $5 per set of 2."
    },
    {
      question: "Do your passport photos meet US State Department requirements?",
      answer: "Yes! Our passport photos meet all US Department of State specifications: 2x2 inches, white or off-white background, taken within 6 months, neutral expression, both ears visible, no glasses. If your photo is rejected, we'll retake it for free."
    },
    {
      question: "How long does it take to get passport photos?",
      answer: "Passport photos are completed in under 5 minutes at our office. Walk-ins welcome, or schedule an appointment for guaranteed service time. For mobile service, we come to your location throughout Erie County."
    },
    {
      question: "Can I get passport photos for visa applications?",
      answer: "Absolutely! We provide photos for all international visa applications including Schengen visa, UK visa, Canadian visa, Chinese visa, and more. Each country has specific requirements—we ensure compliance with the correct specifications."
    },
    {
      question: "What should I wear for passport photos?",
      answer: "Wear everyday clothing in colors that contrast with white (avoid white shirts). No uniforms, camouflage, or clothing that obscures your face. Remove hats, headbands, and glasses. Religious headwear is permitted if worn daily."
    },
    {
      question: "Do you offer passport photos for infants and children?",
      answer: "Yes! We have experience photographing infants and children for passports. For babies, we provide a white blanket backdrop. No toys or other people can be in the photo. The child's eyes must be open, but expressions are more lenient for infants under 6 months."
    },
    {
      question: "Can I use these photos for Global Entry or TSA PreCheck?",
      answer: "Yes! Our passport-style photos meet requirements for Global Entry, TSA PreCheck, NEXUS, SENTRI, and other Trusted Traveler programs. The photos are also suitable for US passport cards and Enhanced Driver's Licenses."
    }
  ]);

  const combinedSchema = {
    "@context": "https://schema.org",
    "@graph": [serviceSchema, breadcrumbSchema, faqSchema]
  };

  return (
    <Layout>
      <SEO
        title="Passport Photo Services Erie, PA | $15 | US State Dept Compliant | Same-Day"
        description="Professional passport and visa photos Erie, PA. US State Department compliant, guaranteed acceptance. $15 for 2 photos. Walk-ins welcome. Mobile service available Erie County."
        keywords="passport photos Erie PA, visa photos Northwestern PA, passport picture Erie County, Global Entry photo, TSA PreCheck photo, passport photos Crawford County"
        canonical="https://notroom.com/services/passport-photos"
        schema={combinedSchema}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[hsl(var(--hero-gradient-from))] to-[hsl(var(--hero-gradient-to))] text-primary-foreground py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-background/10 backdrop-blur-sm mb-6">
              <Camera className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Professional Passport & Visa Photo Services</h1>
            <p className="text-xl mb-8 opacity-90">
              US State Department compliant passport photos. Guaranteed acceptance or free retake. Same-day service, no appointment needed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="amber" onClick={scrollToBooking} className="text-lg px-8 py-6">
                Walk-In or Book - $15
              </Button>
              <Button size="lg" variant="amberOutline" onClick={() => navigate("/calculator")}>
                Calculate Your Cost
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

      {/* US State Department Requirements */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">US Passport Photo Requirements</h2>
            <Card className="p-8">
              <div className="grid md:grid-cols-2 gap-8 mb-6">
                <div>
                  <h3 className="font-bold text-lg mb-4">Technical Specs:</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm">2 x 2 inches (51 x 51 mm)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Head size: 1-1 3/8 inches from chin to crown</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm">White or off-white background</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Color photo, matte or glossy finish</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Taken within last 6 months</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-4">Appearance Rules:</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Neutral expression, eyes open</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Both ears visible</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm">No glasses (medical exceptions possible)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm">No hats or head coverings (religious exceptions)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Face directly toward camera</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="bg-primary/10 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold mb-2">Compliance Guarantee</h3>
                    <p className="text-sm text-muted-foreground">
                      We verify all passport photos against official US State Department requirements. If your photo is rejected by the passport agency, we'll retake it for free—no questions asked.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Simple, Affordable Pricing</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-8 border-primary border-2">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">Office Service</h3>
                  <div className="text-5xl font-bold text-primary mb-2">$15</div>
                  <p className="text-muted-foreground">Includes 2 compliant photos</p>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Professional photo equipment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Proper lighting & backdrop</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">2 printed photos (matte finish)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Completed in under 5 minutes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Walk-ins welcome (no appointment needed)</span>
                  </li>
                </ul>
                <Button className="w-full" onClick={scrollToBooking}>Visit Office</Button>
              </Card>

              <Card className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">Mobile Service</h3>
                  <div className="text-5xl font-bold text-primary mb-2">$15+</div>
                  <p className="text-muted-foreground">+ $1.50/mile round-trip from Erie</p>
                  <div className="mt-3 bg-muted/30 p-3 rounded text-xs">
                    <p className="font-semibold mb-1">Example: 10 miles from Erie</p>
                    <div className="space-y-1">
                      <div className="flex justify-between"><span>Photo service (2 photos):</span><span>$15</span></div>
                      <div className="flex justify-between"><span>Travel (20 miles round-trip):</span><span>$30</span></div>
                      <div className="flex justify-between border-t pt-1 mt-1 font-semibold"><span>Total:</span><span>$45</span></div>
                    </div>
                  </div>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">We bring equipment to you</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">All office service features</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Perfect for families or groups</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Home, office, or facility visits</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Serving all Erie County</span>
                  </li>
                </ul>
                <Button className="w-full" onClick={scrollToBooking}>Book Mobile Visit</Button>
              </Card>
            </div>
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Additional sets: $5 per 2 photos | Digital copy: +$5 (emailed same day)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Accepted For */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Our Photos Are Accepted For:</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">US Passports</h3>
                <p className="text-sm text-muted-foreground">Adult & child passport books and cards</p>
              </Card>

              <Card className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Visa Applications</h3>
                <p className="text-sm text-muted-foreground">All countries and visa types</p>
              </Card>

              <Card className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Trusted Traveler</h3>
                <p className="text-sm text-muted-foreground">Global Entry, TSA PreCheck, NEXUS</p>
              </Card>

              <Card className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Immigration</h3>
                <p className="text-sm text-muted-foreground">Green cards, citizenship, USCIS forms</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Common Mistakes */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Common Photo Mistakes (We Help You Avoid)</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-1">Wearing Glasses</h3>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      No glasses allowed (since 2016 rule change). Medical exceptions possible with doctor's letter.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-1">Wrong Expression</h3>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Must be neutral—no smiling with teeth showing. Slight smile with closed mouth is acceptable.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-1">Shadows on Face</h3>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Poor lighting creates shadows that cause rejection. We use professional lighting to eliminate shadows.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-1">Head Size Wrong</h3>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Head must be 1-1 3/8 inches from chin to crown. Our system automatically ensures correct sizing.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <FAQSection
        faqs={[
          {
            question: "How much do passport photos cost in Erie PA?",
            answer: "Passport photos are $15 per session, which includes 2 compliant photos. We also offer mobile service at your location for $15 + $1.50/mile travel from Erie. Additional prints are $5 per set of 2."
          },
          {
            question: "Do your passport photos meet US State Department requirements?",
            answer: "Yes! Our passport photos meet all US Department of State specifications: 2x2 inches, white or off-white background, taken within 6 months, neutral expression, both ears visible, no glasses. If your photo is rejected, we'll retake it for free."
          },
          {
            question: "How long does it take to get passport photos?",
            answer: "Passport photos are completed in under 5 minutes at our office. Walk-ins welcome, or schedule an appointment for guaranteed service time. For mobile service, we come to your location throughout Erie County."
          },
          {
            question: "Can I get passport photos for visa applications?",
            answer: "Absolutely! We provide photos for all international visa applications including Schengen visa, UK visa, Canadian visa, Chinese visa, and more. Each country has specific requirements—we ensure compliance with the correct specifications."
          },
          {
            question: "What should I wear for passport photos?",
            answer: "Wear everyday clothing in colors that contrast with white (avoid white shirts). No uniforms, camouflage, or clothing that obscures your face. Remove hats, headbands, and glasses. Religious headwear is permitted if worn daily."
          },
          {
            question: "Do you offer passport photos for infants and children?",
            answer: "Yes! We have experience photographing infants and children for passports. For babies, we provide a white blanket backdrop. No toys or other people can be in the photo. The child's eyes must be open, but expressions are more lenient for infants under 6 months."
          },
          {
            question: "Can I use these photos for Global Entry or TSA PreCheck?",
            answer: "Yes! Our passport-style photos meet requirements for Global Entry, TSA PreCheck, NEXUS, SENTRI, and other Trusted Traveler programs. The photos are also suitable for US passport cards and Enhanced Driver's Licenses."
          }
        ]}
      />

      {/* Local SEO */}
      <ServiceLocalSEO 
        serviceName="Passport Photo Services"
        reviews={[
          { text: "Fast passport photos for my renewal. Met all State Dept requirements perfectly.", author: "Jennifer M.", city: "Erie", rating: 5 },
          { text: "Great service for family passport photos. Kids were comfortable and photos turned out perfect.", author: "Michael R.", city: "Millcreek", rating: 5 },
          { text: "Needed urgent passport photos. Walk-in service was quick and professional.", author: "Sarah K.", city: "Harborcreek", rating: 5 },
          { text: "Mobile passport photo service came to our office. Very convenient for our team.", author: "David L.", city: "Fairview", rating: 5 }
        ]}
      />

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Need Passport Photos Today?</h2>
            <p className="text-xl mb-8 opacity-90">
              Walk-ins welcome! Get compliant passport photos in under 5 minutes. Just $15 for 2 photos. Guaranteed acceptance or free retake.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" onClick={scrollToBooking} className="text-lg px-8">
                Visit Office or Book Mobile
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground opacity-90 hover:opacity-100" onClick={() => window.location.href = "tel:814-480-0989"}>
                Call (814) 480-0989
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PassportPhotos;
