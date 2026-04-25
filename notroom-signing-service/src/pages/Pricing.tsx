import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Laptop, Home, Car, Building, FileText, Heart, Shield, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Pricing = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <SEO
        title="Professional Notary Services Pricing - Premium & Accessible"
        description="Comprehensive notary service pricing. Remote online notarization starting at $60 ($5 PA notary + $55 platform), mobile notary $125+ ($5 notary + $120 service + mileage), premium healthcare facility visits $150-240, loan signings $175-400. Transparent PA-compliant pricing."
        keywords="notary prices erie pa, mobile notary pricing, healthcare notary cost, loan signing fees, online notary pricing, pa notary rates"
        canonical="https://notroom.com/pricing"
      />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Professional Notary Services - Premium & Accessible
            </h1>
            <p className="text-xl text-muted-foreground mb-4">
              From convenient online notarization to specialized facility visits, we serve all your needs with transparent pricing.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span>24/7 Online Service</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span>Mobile to Any Location</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span>Healthcare & Facilities</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Services Grid */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            
          {/* Remote Online Notary */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Laptop className="h-6 w-6 text-primary" />
                Remote Online Notary (RON)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">$60</div>
              <p className="text-sm text-muted-foreground mb-4">Single document, $5 PA notary + $55 platform fee</p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span>Available 24/7 from anywhere</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span>Estate planning, POAs, affidavits</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span>Business & financial documents</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span>Secure video recording included</span>
                </li>
              </ul>
              <Button 
                className="w-full" 
                onClick={() => navigate('/services/remote-online-notary')}
              >
                Learn More
              </Button>
            </CardContent>
          </Card>

          {/* Loan Signing */}
          <Card className="hover:shadow-lg transition-shadow border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-6 w-6 text-primary" />
                Loan Signing Agent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">$175-$400</div>
              <p className="text-sm text-muted-foreground mb-4">Varies by closing type & complexity ($5 PA notary per signature + $170+ agent service)</p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span>Refinance: $225-275</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span>Purchase closing: $275</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span>Reverse mortgage: $325</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span>Commercial: $400+</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span>Printing, scan-back & travel included</span>
                </li>
              </ul>
              <Button 
                className="w-full" 
                onClick={() => navigate('/services/loan-signing-agent')}
              >
                Learn More
              </Button>
            </CardContent>
          </Card>

          {/* Healthcare Facility */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-6 w-6 text-primary" />
                Healthcare Facilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">$150-$240</div>
              <p className="text-sm text-muted-foreground mb-4">Hospital, nursing home, hospice</p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span>Hospital bedside service</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span>Nursing home visits</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span>Hospice & assisted living</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span>24/7 emergency available</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span>Compassionate, experienced</span>
                </li>
              </ul>
              <Button 
                className="w-full" 
                onClick={() => navigate('/services/healthcare-facility')}
              >
                Learn More
              </Button>
            </CardContent>
          </Card>

          {/* Mobile Notary */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-6 w-6 text-primary" />
                Mobile Notary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-4">$125 + mileage</div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span>We come to your location</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span>$1.50 per mile from Erie</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span>Same-day available</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span>Evening & weekend service</span>
                </li>
              </ul>
              <Button 
                className="w-full" 
                onClick={() => navigate('/services/mobile-notary')}
              >
                Learn More
              </Button>
            </CardContent>
          </Card>

          {/* Vehicle Title */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-6 w-6 text-primary" />
                Vehicle Title Transfer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">$35-$105</div>
              <p className="text-sm text-muted-foreground mb-4">Office $35 • Mobile $60-105</p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span>PA title notarization required</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span>Mobile service available</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span>Bill of sale included</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span>Fast & convenient</span>
                </li>
              </ul>
              <Button 
                className="w-full" 
                onClick={() => navigate('/services/vehicle-title-transfer')}
              >
                Learn More
              </Button>
            </CardContent>
          </Card>

          {/* Apostille Services */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                Apostille Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-4">$245+</div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span>Standard (7-10 days) $245</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span>Expedited (2-3 days) $395</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span>Full-chain authentication $495</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span>International document authentication</span>
                </li>
              </ul>
              <Button 
                className="w-full" 
                onClick={() => navigate('/services/apostille')}
              >
                Learn More
              </Button>
            </CardContent>
          </Card>

          {/* More services can be added here */}
          
          </div>
        </div>
      </section>

      {/* Premium Services Note */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Clock className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-2xl font-semibold mb-3">Additional Premium Fees</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-semibold mb-2">After-Hours Service:</p>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Evening (6pm-9pm): +$40</li>
                        <li>• Late night (9pm-12am): +$85</li>
                        <li>• Overnight: +$150</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">Weekend & Holiday:</p>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Saturday: +$65</li>
                        <li>• Sunday: +$90</li>
                        <li>• Major holiday: +$125</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">Rush Service:</p>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Same-day: +$65</li>
                        <li>• 2-hour rush: +$100</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">Travel Fees:</p>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• 0-10 miles: $30</li>
                        <li>• 11-20 miles: $50</li>
                        <li>• 21-30 miles: $70</li>
                        <li>• 30+ miles: $70 + $2/mile</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Additional Services Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Additional Professional Services</h2>
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">I-9 Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">$85+</div>
                <p className="text-sm text-muted-foreground mb-4">In-person or remote</p>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => navigate('/services/i9-verification')}
                >
                  Learn More
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">Registered Office</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">$149/yr</div>
                <p className="text-sm text-muted-foreground mb-4">PA business address</p>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => navigate('/services/registered-office')}
                >
                  Learn More
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">Certified Copies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">$20+</div>
                <p className="text-sm text-muted-foreground mb-4">Office, mail, or mobile</p>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => navigate('/services/certified-copies')}
                >
                  Learn More
                </Button>
              </CardContent>
            </Card>


            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">Professional Witness</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">$60+</div>
                <p className="text-sm text-muted-foreground mb-4">Neutral third-party</p>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => navigate('/services/witness-service')}
                >
                  Learn More
                </Button>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>

      {/* Fee Disclosure */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Official PA Department of State Fee Disclosure</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="prose prose-sm max-w-none space-y-4 text-muted-foreground">
                  <p>
                    <strong>Pennsylvania Notary Public Fee Schedule (PA Department of State):</strong> In accordance with 
                    Pennsylvania law and the official PA Department of State Notary Fee Schedule, notaries may charge a maximum of 
                    <strong> $5.00 per notarial act</strong> for acknowledgments, jurats, and oaths/affirmations. All pricing listed 
                    above strictly complies with these official regulations.
                  </p>
                  
                  <div className="bg-background/50 p-4 rounded-lg border">
                    <p className="font-semibold mb-2">How Our Pricing Works:</p>
                    <p className="mb-3">
                      Pennsylvania law permits notaries to charge the $5.00 notary fee <strong>plus reasonable additional fees</strong> for 
                      non-notarial clerical and administrative services. All prices shown include:
                    </p>
                  </div>

                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>$5 Notary Fee (per act):</strong> The official notarial act itself—signature acknowledgment, jurat, or oath/affirmation administration. This is the maximum fee set by the PA Department of State.</li>
                    <li><strong>Additional Service Fees (non-notarial):</strong>
                      <ul className="list-circle pl-6 mt-2 space-y-1">
                        <li><strong>Technology platform (RON):</strong> Secure video conferencing infrastructure, knowledge-based authentication (KBA) identity verification, tamper-evident digital certificates, 10-year recording storage required by PA law</li>
                        <li><strong>Mobile service:</strong> Professional travel to your location, trip coordination, scheduling systems, administrative overhead ($120 base service + $1.50/mile round-trip for mileage reimbursement)</li>
                        <li><strong>Signing agent services:</strong> Specialized loan closing expertise, $100,000 E&O insurance coverage, document printing/scanning equipment, courier and scan-back services</li>
                        <li><strong>Premium scheduling:</strong> After-hours availability ($40-150), weekend service ($65-90), holiday service ($125), expedited same-day or 2-hour rush appointments ($65-100)</li>
                        <li><strong>Specialized facility coordination:</strong> Healthcare facility visits ($145+), correctional facility visits ($180+)—includes compliance with facility security protocols, extended processing times, and special accommodations</li>
                      </ul>
                    </li>
                  </ul>
                  
                  <p className="text-sm mt-4 font-medium">
                    <strong>Legal Compliance:</strong> All fees are transparent, itemized, and fully compliant with Pennsylvania notary regulations 
                    and the official PA Department of State Notary Fee Schedule. The $5.00 notary fee is clearly separated from legitimate 
                    non-notarial service charges as permitted by law.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Book any service online or call us for a custom quote for your specific needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/')}>
                Book Online Now
              </Button>
              <Button size="lg" variant="outline" onClick={() => window.location.href = 'tel:8144800989'}>
                Call (814) 480-0989
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Pricing;
