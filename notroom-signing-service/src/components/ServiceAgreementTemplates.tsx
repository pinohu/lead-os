import { FileText, Download, CheckCircle2, AlertCircle } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { logger } from "@/utils/logger";

const ServiceAgreementTemplates = () => {
  const agreements = [
    {
      title: "Remote Online Notarization (RON) Service Agreement",
      description: "Comprehensive agreement for RON services including biometric consent, session recording, E-Sign Act compliance, and identity verification procedures.",
      features: [
        "Biometric data collection consent",
        "RON session recording authorization",
        "Pennsylvania location verification",
        "E-Sign Act electronic record consent",
        "10-year record retention acknowledgment",
        "Identity verification procedures",
        "Technical requirements and responsibilities"
      ],
      downloadLink: "/agreements/ron-service-agreement.pdf"
    },
    {
      title: "Mobile Notary Service Agreement",
      description: "Standard agreement for in-person mobile notary services covering travel fees, appointment scheduling, cancellation policy, and service limitations.",
      features: [
        "Appointment scheduling and confirmation",
        "Travel fee structure and mileage",
        "24-hour cancellation policy",
        "Identity verification requirements",
        "Service area limitations",
        "No legal advice disclaimer",
        "Liability limitations"
      ],
      downloadLink: "/agreements/mobile-notary-agreement.pdf"
    },
    {
      title: "Loan Signing Agent Service Agreement",
      description: "Specialized agreement for real estate loan signing services including document handling, scanning requirements, and lender coordination.",
      features: [
        "Pre-closing document review procedures",
        "Signing appointment coordination",
        "Document scanning and return requirements",
        "Lender communication protocols",
        "Professional liability insurance coverage",
        "No legal advice disclaimer",
        "Confidentiality obligations"
      ],
      downloadLink: "/agreements/loan-signing-agreement.pdf"
    },
    {
      title: "Business Retainer Service Agreement",
      description: "Monthly or annual retainer agreement for ongoing notary services with prepaid notarization packages and priority scheduling.",
      features: [
        "Prepaid notarization package details",
        "Monthly/annual billing structure",
        "Priority appointment scheduling",
        "Unused notarization expiration policy",
        "Retainer renewal terms",
        "Cancellation and refund policy",
        "Service level commitments"
      ],
      downloadLink: "/agreements/business-retainer-agreement.pdf"
    },
    {
      title: "Registered Office (CROP) Service Agreement",
      description: "Commercial Registered Office Provider service agreement covering mail handling, service of process, and business address services.",
      features: [
        "Registered office address provision",
        "Service of process acceptance",
        "Mail handling procedures",
        "Business hour availability",
        "Pennsylvania CROP registration compliance",
        "Annual service requirements",
        "Termination procedures"
      ],
      downloadLink: "/agreements/crop-service-agreement.pdf"
    }
  ];

  return (
    <section className="py-12 bg-background" role="complementary" aria-labelledby="service-agreements-heading">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <FileText className="w-12 h-12 text-primary mx-auto mb-4" aria-hidden="true" />
            <h2 id="service-agreements-heading" className="text-3xl font-bold mb-4">
              Professional Service Agreements
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Review our standard service agreements before booking. All services require acceptance of applicable agreement terms.
            </p>
          </div>

          <Card className="p-6 bg-primary/5 border-primary/20 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-sm text-muted-foreground">
                <strong className="text-foreground block mb-2">Important Agreement Notice:</strong>
                <p>
                  These service agreements are legally binding contracts. By booking services, you agree to be bound 
                  by the applicable agreement terms. We recommend reviewing agreements before scheduling to understand 
                  your rights, responsibilities, and our service limitations. All agreements comply with Pennsylvania 
                  notary law and include required legal disclaimers.
                </p>
              </div>
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {agreements.map((agreement, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="mb-4">
                  <h3 className="text-xl font-bold mb-2">{agreement.title}</h3>
                  <p className="text-sm text-muted-foreground">{agreement.description}</p>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" aria-hidden="true" />
                    Key Agreement Provisions:
                  </h4>
                  <ul className="space-y-2">
                    {agreement.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-success mt-1">•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    // In production, this would download the actual PDF
                    logger.log(`Download: ${agreement.downloadLink}`);
                  }}
                  aria-label={`Download ${agreement.title}`}
                >
                  <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                  Download Agreement Template
                </Button>
              </Card>
            ))}

            {/* Custom Agreement Option */}
            <Card className="p-6 bg-muted/30 border-2 border-dashed border-primary/30">
              <div className="flex flex-col items-center justify-center text-center h-full">
                <FileText className="w-12 h-12 text-primary mb-4" aria-hidden="true" />
                <h3 className="text-xl font-bold mb-2">Need a Custom Agreement?</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  For enterprise clients, high-volume services, or specialized requirements, we can create customized 
                  service agreements tailored to your specific needs.
                </p>
                <Button 
                  variant="default"
                  onClick={() => window.location.href = "mailto:contracts@notroom.com?subject=Custom Service Agreement Request"}
                  aria-label="Contact us for custom service agreement"
                >
                  Contact for Custom Agreement
                </Button>
              </div>
            </Card>
          </div>

          <div className="mt-8 p-6 bg-muted/30 rounded-lg">
            <h3 className="font-bold text-foreground mb-3">Agreement Acceptance & Modifications</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Acceptance:</strong> Service agreements are presented during the 
                booking process and require explicit acceptance via clickwrap agreement before appointment confirmation. 
                Proceeding with services constitutes acceptance of applicable agreement terms.
              </p>
              <p>
                <strong className="text-foreground">Modifications:</strong> We reserve the right to update service 
                agreements at any time. Material changes will be communicated via email to active customers. Continued 
                use of services after modifications constitutes acceptance of updated terms.
              </p>
              <p>
                <strong className="text-foreground">Questions?</strong> Contact our contracts department at{" "}
                <a href="mailto:contracts@notroom.com" className="text-primary hover:underline">
                  contracts@notroom.com
                </a>
                {" "}or call{" "}
                <a href="tel:814-480-0989" className="text-primary hover:underline">
                  (814) 480-0989
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServiceAgreementTemplates;
