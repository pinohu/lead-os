import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import LegalDisclaimer from "@/components/LegalDisclaimer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, FileText, Shield, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ServiceLocalSEO } from "@/components/local-seo/ServiceLocalSEO";
import FAQSection from "@/components/marketing/FAQSection";
import { generateServiceSchema, generateBreadcrumbSchema } from "@/utils/schemaGenerator";

const UCCFiling = () => {
  const navigate = useNavigate();

  const scrollToBooking = () => {
    navigate("/");
    setTimeout(() => {
      document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const serviceSchema = generateServiceSchema({
    name: "UCC Filing Services Pennsylvania",
    description: "Professional UCC filing services in Pennsylvania. UCC-1, amendments, continuations, terminations. $125 per filing plus state fees.",
    provider: "Notroom - UCC Filing Services",
    areaServed: "Pennsylvania",
    price: "125",
    url: "https://notroom.com/services/ucc-filing"
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://notroom.com" },
    { name: "Services", url: "https://notroom.com/pricing" },
    { name: "UCC Filing", url: "https://notroom.com/services/ucc-filing" }
  ]);

  const combinedSchema = {
    "@context": "https://schema.org",
    "@graph": [serviceSchema, breadcrumbSchema]
  };

  return (
    <Layout>
      <SEO
        title="UCC Filing Services Pennsylvania | $125 per Filing | Erie, Northwestern PA"
        description="Professional UCC filing services Pennsylvania. UCC-1 financing statements, amendments, continuations, terminations. $125 per filing + state fees. Serving Erie, Crawford, Warren, Mercer Counties."
        keywords="UCC filing Pennsylvania, UCC-1 filing Erie PA, UCC filing service Northwestern PA, financing statement filing PA, UCC continuation Pennsylvania"
        canonical="https://notroom.com/services/ucc-filing"
        schema={combinedSchema}
      />

      <section className="bg-gradient-to-br from-[hsl(var(--hero-gradient-from))] to-[hsl(var(--hero-gradient-to))] text-primary-foreground py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-background/10 backdrop-blur-sm mb-6">
              <FileText className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">UCC Filing Services</h1>
            <p className="text-xl mb-8 opacity-90">
              Expert assistance with Uniform Commercial Code filings in Pennsylvania. Protect your secured interests with proper UCC-1 filings.
            </p>
            <Button size="lg" variant="amber" onClick={scrollToBooking} className="text-lg px-8 py-6">
              Get Started - $125
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="p-8 border-primary border-2">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">Professional Service</h2>
                <div className="text-5xl font-bold text-primary mb-2">$125</div>
                <p className="text-xl text-muted-foreground">Per UCC filing</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-4">Our Services:</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span>UCC-1 financing statements</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span>Amendments & assignments</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span>Continuation statements</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span>Termination statements</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Common Uses:</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Business loan security interests</li>
                    <li>• Equipment financing</li>
                    <li>• Inventory financing</li>
                    <li>• Accounts receivable financing</li>
                    <li>• Lease agreements</li>
                    <li>• Secured creditor protection</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>What We Do:</strong> We'll prepare and file your UCC documents with the Pennsylvania Department of State. 
                  Our service includes document preparation, filing with the state, and providing you with filed copies. 
                  State filing fees are additional.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Understanding UCC */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Understanding UCC Filings in Pennsylvania</h2>
            <Card className="p-8">
              <p className="text-lg mb-4">The Uniform Commercial Code (UCC) is a set of laws governing commercial transactions in the United States. UCC filings protect a lender's or creditor's security interest in borrower collateral.</p>
              <p className="text-muted-foreground mb-6">In Pennsylvania, UCC filings are made with the PA Department of State and create public record of a secured party's interest in specific collateral. This notice prevents other creditors from claiming superior rights to the same collateral.</p>
              <div className="bg-primary/10 p-6 rounded-lg">
                <h3 className="font-bold mb-3">Why UCC Filings Matter:</h3>
                <div className="space-y-2 text-sm">
                  <p>• <strong>Priority:</strong> First to file generally has first claim on collateral</p>
                  <p>• <strong>Protection:</strong> Protects lenders against borrower default</p>
                  <p>• <strong>Public Notice:</strong> Alerts other creditors to existing security interests</p>
                  <p>• <strong>Due Diligence:</strong> Buyers/lenders search UCC records before transactions</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Types of UCC Filings */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Types of UCC Filings</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-3">UCC-1 Financing Statement</h3>
                <p className="text-sm text-muted-foreground mb-3">Initial filing to perfect security interest. Valid for 5 years.</p>
                <div className="bg-muted/50 p-4 rounded text-xs space-y-2">
                  <p><strong>Our Fee:</strong> $125</p>
                  <p><strong>PA State Fee:</strong> $69 (standard) or $119 (expedited)</p>
                  <p><strong>Turnaround:</strong> 5-7 business days standard, 24 hours expedited</p>
                </div>
              </Card>
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-3">UCC-3 Amendment</h3>
                <p className="text-sm text-muted-foreground mb-3">Modify existing UCC-1: change debtor name, add/remove collateral, assign to new secured party.</p>
                <div className="bg-muted/50 p-4 rounded text-xs space-y-2">
                  <p><strong>Our Fee:</strong> $100</p>
                  <p><strong>PA State Fee:</strong> $69 (standard) or $119 (expedited)</p>
                  <p><strong>Turnaround:</strong> 5-7 business days standard, 24 hours expedited</p>
                </div>
              </Card>
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-3">UCC-3 Continuation</h3>
                <p className="text-sm text-muted-foreground mb-3">Extend UCC-1 for another 5 years. Must file within 6 months before expiration.</p>
                <div className="bg-muted/50 p-4 rounded text-xs space-y-2">
                  <p><strong>Our Fee:</strong> $95</p>
                  <p><strong>PA State Fee:</strong> $69 (standard) or $119 (expedited)</p>
                  <p><strong>Important:</strong> File between months 55-60 of original filing</p>
                </div>
              </Card>
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-3">UCC-3 Termination</h3>
                <p className="text-sm text-muted-foreground mb-3">Release security interest after loan payoff or to correct erroneous filing.</p>
                <div className="bg-muted/50 p-4 rounded text-xs space-y-2">
                  <p><strong>Our Fee:</strong> $95</p>
                  <p><strong>PA State Fee:</strong> $69 (standard) or $119 (expedited)</p>
                  <p><strong>Note:</strong> Required to release borrower's collateral</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">UCC Filing Process</h2>
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Gather Required Information</h3>
                    <p className="text-muted-foreground">Provide: Secured party name/address, debtor name/address (exactly as appears on records), collateral description, and loan/transaction details.</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Document Preparation</h3>
                    <p className="text-muted-foreground">We prepare your UCC-1 or UCC-3 form according to PA Department of State requirements, ensuring accurate debtor information and proper collateral description.</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Filing with PA Department of State</h3>
                    <p className="text-muted-foreground">We submit your UCC filing electronically to PA Department of State. Choose standard (5-7 days) or expedited (24 hours) processing.</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">4</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Receive Filed Copies</h3>
                    <p className="text-muted-foreground">PA Department of State returns stamped UCC filing with official file number and date. We provide you with filed copies for your records.</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Common Mistakes */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Common UCC Filing Mistakes to Avoid</h2>
            <div className="space-y-4">
              <Card className="p-6 border-l-4 border-amber-500">
                <h3 className="font-bold mb-2">❌ Incorrect Debtor Name</h3>
                <p className="text-sm text-muted-foreground">Debtor name must match EXACTLY as shown on organizational documents or driver's license. Even small variations can invalidate the filing.</p>
              </Card>
              <Card className="p-6 border-l-4 border-amber-500">
                <h3 className="font-bold mb-2">❌ Vague Collateral Description</h3>
                <p className="text-sm text-muted-foreground">"All assets" or overly broad descriptions may be challenged. Be specific: "inventory," "equipment," "accounts receivable," or reference loan agreement.</p>
              </Card>
              <Card className="p-6 border-l-4 border-amber-500">
                <h3 className="font-bold mb-2">❌ Missing Continuation Filing</h3>
                <p className="text-sm text-muted-foreground">UCC-1 expires after 5 years unless continued. Miss the 6-month window (months 55-60) and you lose priority. Your security interest becomes unperfected.</p>
              </Card>
              <Card className="p-6 border-l-4 border-amber-500">
                <h3 className="font-bold mb-2">❌ Failing to Terminate After Payoff</h3>
                <p className="text-sm text-muted-foreground">Not filing UCC-3 termination after loan payoff can harm borrower's credit and ability to obtain new financing. Lenders have duty to terminate.</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Local SEO Section */}
      <ServiceLocalSEO 
        serviceName="UCC Filing Services"
        reviews={[
          { text: "Efficient UCC-1 filing for our business financing. Professional service.", author: "Business Owner Mike R.", city: "Erie", rating: 5 },
          { text: "Fast UCC filing processing. They handled everything with PA Department of State.", author: "Jennifer T.", city: "Meadville", rating: 5 },
          { text: "Great service for UCC continuation filing. Very knowledgeable.", author: "David K.", city: "Warren", rating: 5 },
          { text: "Professional UCC amendment filing. Straightforward pricing.", author: "Susan L.", city: "Sharon", rating: 5 }
        ]}
      />

      {/* FAQs */}
      <FAQSection
        faqs={[
          {
            question: "How long does a UCC-1 filing last in Pennsylvania?",
            answer: "UCC-1 financing statements are effective for 5 years from the filing date. To extend beyond 5 years, you must file a UCC-3 Continuation Statement within the 6-month period before expiration (months 55-60)."
          },
          {
            question: "How much does UCC filing cost in PA?",
            answer: "PA state filing fees: $69 for standard processing (5-7 days) or $119 for expedited (24 hours). Our service fees: $125 for UCC-1 initial filing, $100 for amendments, $95 for continuations/terminations."
          },
          {
            question: "Can I file a UCC-1 myself in Pennsylvania?",
            answer: "Yes, you can file directly with PA Department of State online or by mail. However, errors in debtor names or collateral descriptions can invalidate your security interest. Professional preparation helps avoid costly mistakes."
          },
          {
            question: "What happens if I don't file a UCC-1?",
            answer: "Without a UCC-1 filing, your security interest in collateral is 'unperfected.' Other creditors who file later could have superior claims to your collateral. In bankruptcy, unperfected security interests may lose to trustee."
          },
          {
            question: "Where do I search existing UCC filings in Pennsylvania?",
            answer: "PA Department of State maintains an online UCC search database. You can search by debtor name or file number to check for existing liens before entering financing agreements."
          },
          {
            question: "Do I need a lawyer to file a UCC-1 in Pennsylvania?",
            answer: "No attorney is required for UCC filings. However, we recommend legal advice for complex transactions, determining what collateral to include, or if disputes exist about security interests."
          },
          {
            question: "What is a UCC lien search and do you provide them?",
            answer: "A UCC lien search checks PA Department of State records for existing UCC filings against a debtor. This reveals existing secured debts. We can assist with UCC searches to perform due diligence before lending or purchasing."
          }
        ]}
      />

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Need UCC Filing Assistance?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Protect your secured interests with proper UCC filings. Expert assistance for lenders and secured creditors.
            </p>
            <Button size="lg" variant="amber" onClick={scrollToBooking} className="text-lg px-8">
              Get Started
            </Button>
          </div>
        </div>
      </section>

      {/* Legal Disclaimer */}
      <div className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <LegalDisclaimer variant="compact" />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UCCFiling;
