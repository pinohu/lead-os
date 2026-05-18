import { AlertTriangle, Scale, Shield } from "lucide-react";
import { Card } from "./ui/card";

interface LegalDisclaimerProps {
  variant?: "full" | "compact";
}

const LegalDisclaimer = ({ variant = "full" }: LegalDisclaimerProps) => {
  if (variant === "compact") {
    return (
      <div className="bg-muted/50 border-l-4 border-primary p-4 rounded-r-lg">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Professional Liability Disclaimer:</strong> Notary services provided are 
          administrative in nature. We cannot provide legal advice, draft legal documents, or represent you in legal matters. 
          For legal advice, consult a licensed attorney. <strong>Errors & Omissions Insurance:</strong> Professional liability 
          coverage maintained. <strong>E-Sign Act Compliance:</strong> Electronic signatures comply with ESIGN Act (15 U.S.C. § 7001).
        </p>
      </div>
    );
  }

  return (
    <section className="py-12 bg-muted/30" role="complementary" aria-labelledby="legal-disclaimer-heading">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <Card className="p-8 border-2 border-muted">
            <div className="flex items-start gap-4 mb-6">
              <AlertTriangle className="w-8 h-8 text-primary flex-shrink-0 mt-1" aria-hidden="true" />
              <div>
                <h2 id="legal-disclaimer-heading" className="text-2xl font-bold mb-2">Legal Disclaimers & Limitations</h2>
                <p className="text-muted-foreground">
                  Please read these important legal notices regarding our services
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Professional Liability */}
              <div className="border-l-4 border-primary pl-6">
                <div className="flex items-center gap-2 mb-3">
                  <Scale className="w-5 h-5 text-primary" aria-hidden="true" />
                  <h3 className="text-lg font-semibold">Professional Liability & Service Limitations</h3>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <strong className="text-foreground">No Attorney-Client Relationship:</strong> Notary public services 
                    are administrative in nature and do not create an attorney-client relationship. We cannot:
                  </p>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Provide legal advice, opinions, or recommendations</li>
                    <li>Select or prepare legal documents for you</li>
                    <li>Represent you in legal matters or court proceedings</li>
                    <li>Interpret laws, regulations, or legal documents</li>
                    <li>Advise on legal rights, remedies, or consequences</li>
                  </ul>
                  <p className="mt-3">
                    <strong className="text-foreground">Legal Advice Requirement:</strong> For legal advice or document 
                    selection, consult a licensed attorney. Pennsylvania rules prohibit notaries from practicing law 
                    (42 Pa.C.S. § 2524 - Unauthorized Practice of Law).
                  </p>
                </div>
              </div>

              {/* E&O Insurance */}
              <div className="border-l-4 border-primary pl-6">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-primary" aria-hidden="true" />
                  <h3 className="text-lg font-semibold">Professional Insurance Coverage</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Errors & Omissions Insurance:</strong> We maintain professional 
                  liability insurance (E&O) to protect clients from notarial errors. Coverage details available upon 
                  request. This insurance does not extend to legal advice or unauthorized practice of law.
                </p>
              </div>

              {/* E-Sign Act Compliance */}
              <div className="border-l-4 border-primary pl-6">
                <h3 className="text-lg font-semibold mb-3">Electronic Signature Compliance (E-Sign Act)</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Federal Law Compliance:</strong> Our electronic notarization 
                    services comply with the Electronic Signatures in Global and National Commerce Act (ESIGN Act, 
                    15 U.S.C. § 7001) and Pennsylvania's Revised Uniform Law on Notarial Acts (RULONA, 57 Pa.C.S. § 301 et seq.).
                  </p>
                  <p>
                    <strong className="text-foreground">Electronic Record Requirements:</strong> By using our RON services, 
                    you consent to:
                  </p>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Conducting notarizations via audio-video communication</li>
                    <li>Electronic signatures having the same legal effect as handwritten signatures</li>
                    <li>Receiving electronic records and notarial certificates</li>
                    <li>Retention of audiovisual recordings as required by PA law (minimum 10 years)</li>
                  </ul>
                  <p className="mt-3">
                    <strong className="text-foreground">Right to Withdraw Consent:</strong> You may withdraw consent to 
                    electronic records at any time and request paper alternatives where legally permissible.
                  </p>
                </div>
              </div>

              {/* Anti-Money Laundering */}
              <div className="border-l-4 border-primary pl-6">
                <h3 className="text-lg font-semibold mb-3">Anti-Money Laundering (AML) Compliance</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Federal Compliance Notice:</strong> We maintain internal 
                    procedures to detect and prevent money laundering and financial crimes as recommended by the 
                    Financial Crimes Enforcement Network (FinCEN).
                  </p>
                  <p>
                    <strong className="text-foreground">Suspicious Activity Reporting:</strong> We reserve the right to:
                  </p>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Request additional identification for high-value transactions</li>
                    <li>Refuse service if we suspect fraudulent activity</li>
                    <li>Report suspicious transactions to appropriate authorities without prior notice</li>
                    <li>Maintain records of transactions as required by federal and state law</li>
                  </ul>
                </div>
              </div>

              {/* Trademark Notice */}
              <div className="border-l-4 border-primary pl-6">
                <h3 className="text-lg font-semibold mb-3">Trademark & Intellectual Property</h3>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Trademark Status:</strong> "Notroom" and associated logos are 
                  trademarks of Notroom LLC. All rights reserved. Unauthorized use of our trademarks, service marks, 
                  trade names, or branding is strictly prohibited and may violate state and federal trademark laws.
                </p>
              </div>

              {/* Limitation of Liability */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-xs text-muted-foreground font-semibold mb-2">
                  LIMITATION OF LIABILITY
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Our liability is limited to the notarial act performed and any E&O insurance coverage in effect. 
                  We are not liable for: (1) content of documents presented for notarization, (2) legal validity or 
                  enforceability of documents, (3) decisions made based on notarized documents, or (4) consequential, 
                  indirect, or punitive damages. Maximum liability shall not exceed fees paid for services rendered.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                <strong>Questions about these disclaimers?</strong> Contact us at{" "}
                <a href="mailto:support@notroom.com" className="text-primary hover:underline">
                  support@notroom.com
                </a>
                {" "}or{" "}
                <a href="tel:814-480-0989" className="text-primary hover:underline">
                  (814) 480-0989
                </a>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default LegalDisclaimer;
