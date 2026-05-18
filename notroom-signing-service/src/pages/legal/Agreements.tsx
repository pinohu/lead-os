import SigningLayout from "@/components/SigningLayout";
import SEO from "@/components/SEO";
import ServiceAgreementTemplates from "@/components/ServiceAgreementTemplates";
import DataRetentionPolicy from "@/components/DataRetentionPolicy";
import LegalDisclaimer from "@/components/LegalDisclaimer";
import { Card } from "@/components/ui/card";
import { FileText, Shield } from "lucide-react";

const Agreements = () => {
  return (
    <SigningLayout>
      <SEO
        title="Service Agreements & Legal Documents | Notroom"
        description="Review our professional service agreements, data retention policies, and legal documentation for notary services in Pennsylvania. Transparent terms and conditions."
        keywords="notary service agreement, RON agreement, legal documents, data retention policy, Pennsylvania notary contracts"
        canonical="https://notroom.com/legal/agreements"
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[hsl(var(--hero-gradient-from))] to-[hsl(var(--hero-gradient-to))] text-primary-foreground py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Shield className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Service Agreements & Legal Documentation
            </h1>
            <p className="text-xl opacity-90 mb-4">
              Complete transparency in our service terms, agreements, and data handling practices
            </p>
            <p className="text-sm opacity-80">
              All agreements comply with Pennsylvania notary law and professional standards
            </p>
          </div>
        </div>
      </section>

      {/* Overview Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <FileText className="w-8 h-8 text-primary flex-shrink-0 mt-1" aria-hidden="true" />
                <div>
                  <h2 className="text-2xl font-bold mb-4">Legal Documentation Overview</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      At Notroom, we believe in complete transparency regarding our service terms, data handling, 
                      and professional obligations. This page provides comprehensive access to all legal agreements 
                      and policies governing our services.
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-6 mt-6">
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <h3 className="font-bold text-foreground mb-2">Why We Provide These Documents:</h3>
                        <ul className="space-y-2 text-sm">
                          <li>• Legal compliance with Pennsylvania notary regulations</li>
                          <li>• Consumer protection and informed consent</li>
                          <li>• Clear expectations for both parties</li>
                          <li>• Professional liability risk management</li>
                          <li>• Data privacy and security transparency</li>
                        </ul>
                      </div>

                      <div className="bg-muted/30 p-4 rounded-lg">
                        <h3 className="font-bold text-foreground mb-2">What You'll Find Here:</h3>
                        <ul className="space-y-2 text-sm">
                          <li>• Service-specific agreements for each offering</li>
                          <li>• Data retention and record management policies</li>
                          <li>• Professional liability disclaimers</li>
                          <li>• Privacy rights and CCPA/GDPR compliance</li>
                          <li>• Refund, cancellation, and dispute resolution terms</li>
                        </ul>
                      </div>
                    </div>

                    <p className="text-sm mt-6">
                      <strong className="text-foreground">Questions or Concerns?</strong> If you have questions 
                      about any agreement or policy, please contact our legal department at{" "}
                      <a href="mailto:legal@notroom.com" className="text-primary hover:underline">
                        legal@notroom.com
                      </a>
                      {" "}or call{" "}
                      <a href="tel:814-480-0989" className="text-primary hover:underline">
                        (814) 480-0989
                      </a>
                      {" "}before booking services.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Service Agreements */}
      <ServiceAgreementTemplates />

      {/* Data Retention Policy */}
      <DataRetentionPolicy />

      {/* Legal Disclaimers */}
      <LegalDisclaimer variant="full" />

      {/* Additional Legal Resources */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6">Additional Legal Resources</h2>
              
              <div className="grid md:grid-cols-3 gap-6">
                <a 
                  href="/terms-of-service"
                  className="block p-4 bg-background hover:bg-muted/50 rounded-lg border border-border transition-colors"
                >
                  <h3 className="font-bold text-foreground mb-2">Terms of Service</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete terms governing use of our website and services
                  </p>
                </a>

                <a 
                  href="/privacy-policy"
                  className="block p-4 bg-background hover:bg-muted/50 rounded-lg border border-border transition-colors"
                >
                  <h3 className="font-bold text-foreground mb-2">Privacy Policy</h3>
                  <p className="text-sm text-muted-foreground">
                    How we collect, use, and protect your personal information
                  </p>
                </a>

                <a 
                  href="/privacy-policy#ccpa"
                  className="block p-4 bg-background hover:bg-muted/50 rounded-lg border border-border transition-colors"
                >
                  <h3 className="font-bold text-foreground mb-2">CCPA Rights</h3>
                  <p className="text-sm text-muted-foreground">
                    California privacy rights and data request procedures
                  </p>
                </a>
              </div>

              <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Legal Updates:</strong> All legal documents are reviewed 
                  quarterly and updated as necessary to maintain compliance with changing regulations. Last 
                  comprehensive review: January 2025. Material changes are communicated to active customers via email.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </SigningLayout>
  );
};

export default Agreements;
