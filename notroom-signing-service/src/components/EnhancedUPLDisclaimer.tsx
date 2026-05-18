import { AlertTriangle, Scale, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface EnhancedUPLDisclaimerProps {
  service: "business" | "document-prep" | "registered-office";
}

const EnhancedUPLDisclaimer = ({ service }: EnhancedUPLDisclaimerProps) => {
  const getServiceSpecificContent = () => {
    switch (service) {
      case "business":
      case "registered-office":
        return {
          title: "CRITICAL: Business Filing Services Are NOT Legal Services",
          warnings: [
            {
              icon: XCircle,
              text: "I am NOT a licensed attorney and cannot practice law in Pennsylvania or any jurisdiction."
            },
            {
              icon: XCircle,
              text: "I CANNOT select your business entity type (LLC vs. Corporation, S-Corp vs. C-Corp, etc.)"
            },
            {
              icon: XCircle,
              text: "I CANNOT draft custom operating agreements, bylaws, or any legal provisions beyond standard templates"
            },
            {
              icon: XCircle,
              text: "I CANNOT advise on tax elections, business structure, liability protection, or legal implications"
            },
            {
              icon: XCircle,
              text: "I CANNOT tell you if forming an LLC is better than a Corporation for YOUR specific situation"
            }
          ],
          whatIDo: [
            "Fill out government forms (Certificate of Organization, Articles of Incorporation) using information YOU provide",
            "Submit completed forms to the PA Department of State on your behalf",
            "Provide standard template documents that you must customize or have an attorney review",
            "Answer procedural questions about filing requirements and timelines"
          ],
          legalNote: "By Pennsylvania law, only licensed attorneys may select business structures, draft custom legal provisions, or provide legal advice about business formation (42 Pa.C.S. § 2524). Unauthorized practice of law is a criminal offense."
        };
      
      case "document-prep":
        return {
          title: "CRITICAL: Document Preparation Is NOT Legal Services",
          warnings: [
            {
              icon: XCircle,
              text: "I am NOT a licensed attorney and cannot provide legal advice about your documents"
            },
            {
              icon: XCircle,
              text: "I CANNOT tell you which legal document you need for your situation"
            },
            {
              icon: XCircle,
              text: "I CANNOT interpret clauses, terms, or legal language in your documents"
            },
            {
              icon: XCircle,
              text: "I CANNOT advise whether a document will be legally enforceable or adequate for your needs"
            },
            {
              icon: XCircle,
              text: "I CANNOT represent you in legal matters or draft custom legal strategies"
            }
          ],
          whatIDo: [
            "Type and format documents YOU have already drafted or obtained from legal sources",
            "Transcribe information you provide into standard document templates",
            "Perform ministerial acts like spell-checking, formatting, and printing",
            "Notarize your signature on documents you have already prepared"
          ],
          legalNote: "Document preparation is a typing service, not legal counseling. I cannot select legal options, advise on legal rights, or explain legal consequences. Consult a licensed attorney for legal advice."
        };
      
      default:
        return {
          title: "Legal Services Disclaimer",
          warnings: [],
          whatIDo: [],
          legalNote: ""
        };
    }
  };

  const content = getServiceSpecificContent();

  return (
    <Card className="p-6 bg-destructive/10 border-2 border-destructive my-8">
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className="w-8 h-8 text-destructive flex-shrink-0 mt-1" />
        <div>
          <h3 className="text-xl font-bold text-destructive mb-2">{content.title}</h3>
          <p className="text-sm text-destructive mb-4">
            <strong>YOU MUST READ THIS BEFORE PROCEEDING</strong> - Failure to consult an attorney when needed can result in serious legal and financial consequences.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* What I CANNOT Do */}
        <div className="bg-background/80 p-4 rounded-lg">
          <h4 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <Scale className="w-5 h-5 text-destructive" />
            What I CANNOT Do (Would Be Unauthorized Practice of Law):
          </h4>
          <ul className="space-y-2">
            {content.warnings.map((warning, index) => {
              const Icon = warning.icon;
              return (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Icon className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                  <span>{warning.text}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* What I CAN Do */}
        <div className="bg-background/80 p-4 rounded-lg">
          <h4 className="font-bold text-foreground mb-3">
            What I CAN Do (Ministerial Services Only):
          </h4>
          <ul className="space-y-2">
            {content.whatIDo.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-success">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal Notice */}
        <div className="bg-destructive/20 border-l-4 border-destructive p-4 rounded">
          <p className="text-xs text-destructive leading-relaxed">
            <strong>⚠️ Pennsylvania Law (42 Pa.C.S. § 2524):</strong> {content.legalNote}
          </p>
        </div>

        {/* Call to Action */}
        <div className="bg-primary/10 p-4 rounded-lg text-center">
          <p className="text-sm font-semibold mb-2">
            🏛️ When You Need an Attorney:
          </p>
          <p className="text-xs text-muted-foreground">
            If you need advice on business structure, tax implications, legal rights, document interpretation, or custom legal provisions, 
            you MUST consult with a licensed Pennsylvania attorney. The Pennsylvania Bar Association can provide attorney referrals: 
            <a href="https://www.pabar.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
              www.pabar.org
            </a>
          </p>
        </div>

        {/* Acknowledgment Note */}
        <div className="text-center pt-4 border-t">
          <p className="text-xs text-muted-foreground italic">
            By using these services, you acknowledge that you understand the limitations described above and that you are not receiving legal advice or legal services.
            You accept full responsibility for decisions made regarding your documents and business matters.
          </p>
        </div>
      </div>
    </Card>
  );
};

export default EnhancedUPLDisclaimer;
