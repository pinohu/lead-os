import { Database, Clock, Shield, AlertTriangle } from "lucide-react";
import { Card } from "./ui/card";

const DataRetentionPolicy = () => {
  return (
    <section className="py-12 bg-background" role="complementary" aria-labelledby="data-retention-heading">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <Card className="p-8 border-2 border-primary/20">
            <div className="flex items-start gap-4 mb-6">
              <Database className="w-8 h-8 text-primary flex-shrink-0 mt-1" aria-hidden="true" />
              <div>
                <h2 id="data-retention-heading" className="text-2xl font-bold mb-2">
                  Data Retention & Record Management Policy
                </h2>
                <p className="text-muted-foreground">
                  How we store, secure, and manage your notarial records and personal information
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Legal Requirements */}
              <div className="border-l-4 border-primary pl-6">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-primary" aria-hidden="true" />
                  <h3 className="text-lg font-semibold">Pennsylvania Legal Requirements</h3>
                </div>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Notarial Records (57 Pa.C.S. § 319):</strong> All notarial 
                    journals, certificates, and related records must be retained for a minimum of <strong>10 years</strong> 
                    from the date of notarial act. This is a statutory requirement under Pennsylvania law.
                  </p>
                  <p>
                    <strong className="text-foreground">RON Audio-Visual Recordings (PA RULONA):</strong> Complete 
                    audio-video recordings of all Remote Online Notarization sessions must be securely stored for 
                    a minimum of <strong>10 years</strong> as mandated by Pennsylvania Department of State regulations.
                  </p>
                </div>
              </div>

              {/* Retention Periods by Category */}
              <div className="bg-muted/30 p-6 rounded-lg">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" aria-hidden="true" />
                  Retention Periods by Data Category
                </h3>
                
                <div className="space-y-4 text-sm">
                  <div className="border-b border-border pb-3">
                    <div className="font-semibold text-foreground mb-1">
                      Notarial Records & RON Recordings
                    </div>
                    <div className="text-muted-foreground">
                      <strong>Retention Period:</strong> 10 years minimum (legal requirement)
                    </div>
                    <div className="text-muted-foreground mt-1">
                      <strong>Includes:</strong> Electronic journal entries, notarial certificates, seals, 
                      signatures, audio-video recordings, document copies, identification records, KBA results
                    </div>
                    <div className="text-xs text-primary mt-2">
                      ✓ Stored on secure, encrypted servers with access controls
                    </div>
                  </div>

                  <div className="border-b border-border pb-3">
                    <div className="font-semibold text-foreground mb-1">
                      Transaction & Payment Records
                    </div>
                    <div className="text-muted-foreground">
                      <strong>Retention Period:</strong> 7 years (tax & accounting compliance)
                    </div>
                    <div className="text-muted-foreground mt-1">
                      <strong>Includes:</strong> Invoices, receipts, payment details, billing addresses, 
                      transaction history, refund records
                    </div>
                    <div className="text-xs text-primary mt-2">
                      ✓ Maintained for IRS audit requirements and financial record-keeping
                    </div>
                  </div>

                  <div className="border-b border-border pb-3">
                    <div className="font-semibold text-foreground mb-1">
                      Personal Identification Information
                    </div>
                    <div className="text-muted-foreground">
                      <strong>Retention Period:</strong> Duration of business relationship + 10 years
                    </div>
                    <div className="text-muted-foreground mt-1">
                      <strong>Includes:</strong> Name, contact information, government ID copies, 
                      biometric data, facial recognition results
                    </div>
                    <div className="text-xs text-primary mt-2">
                      ✓ Essential for notarial journal compliance and fraud prevention
                    </div>
                  </div>

                  <div className="border-b border-border pb-3">
                    <div className="font-semibold text-foreground mb-1">
                      Customer Communications
                    </div>
                    <div className="text-muted-foreground">
                      <strong>Retention Period:</strong> 3 years from last interaction
                    </div>
                    <div className="text-muted-foreground mt-1">
                      <strong>Includes:</strong> Emails, support tickets, chat transcripts, phone recordings, 
                      feedback, reviews
                    </div>
                    <div className="text-xs text-primary mt-2">
                      ✓ Customer service quality, dispute resolution, legal defense
                    </div>
                  </div>

                  <div className="border-b border-border pb-3">
                    <div className="font-semibold text-foreground mb-1">
                      Marketing & Analytics Data
                    </div>
                    <div className="text-muted-foreground">
                      <strong>Retention Period:</strong> 2 years or until consent withdrawn
                    </div>
                    <div className="text-muted-foreground mt-1">
                      <strong>Includes:</strong> Website usage data, cookies, IP addresses, device information, 
                      marketing preferences
                    </div>
                    <div className="text-xs text-primary mt-2">
                      ✓ You may opt-out or request deletion at any time
                    </div>
                  </div>

                  <div>
                    <div className="font-semibold text-foreground mb-1">
                      Account Credentials & Access Logs
                    </div>
                    <div className="text-muted-foreground">
                      <strong>Retention Period:</strong> Duration of account + 90 days after deletion
                    </div>
                    <div className="text-muted-foreground mt-1">
                      <strong>Includes:</strong> Login credentials (encrypted), session logs, access history, 
                      security events
                    </div>
                    <div className="text-xs text-primary mt-2">
                      ✓ Security monitoring, fraud detection, account recovery
                    </div>
                  </div>
                </div>
              </div>

              {/* Secure Destruction */}
              <div className="border-l-4 border-destructive pl-6">
                <h3 className="text-lg font-semibold mb-3 text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" aria-hidden="true" />
                  Secure Data Destruction Procedures
                </h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    When retention periods expire and no legal hold or ongoing investigation requires continued 
                    storage, we securely destroy data using industry-standard methods:
                  </p>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Electronic data: Cryptographic erasure, secure deletion, and overwriting</li>
                    <li>Database records: Permanent deletion with no recovery capability</li>
                    <li>Backup systems: Purging from all backup and archive systems</li>
                    <li>Physical media: Shredding or degaussing (if applicable)</li>
                    <li>Third-party storage: Verified deletion certificates from cloud providers</li>
                  </ul>
                  <p className="mt-3">
                    <strong className="text-foreground">Legal Holds:</strong> Data subject to litigation, 
                    government investigation, audit, or other legal obligations will be preserved beyond 
                    standard retention periods until the legal matter is resolved.
                  </p>
                </div>
              </div>

              {/* Your Rights */}
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <h3 className="font-bold text-foreground mb-3">Your Data Rights & Limitations</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Right to Access:</strong> You may request copies of 
                    your personal information and notarial records we maintain.
                  </p>
                  <p>
                    <strong className="text-foreground">Limited Deletion Rights:</strong> While you may request 
                    deletion of marketing data, <strong className="text-destructive">notarial records, RON 
                    recordings, and transaction records CANNOT be deleted</strong> before the 10-year legal 
                    retention period due to Pennsylvania statutory requirements.
                  </p>
                  <p>
                    <strong className="text-foreground">Data Portability:</strong> You may request a copy of 
                    your personal data in a structured, machine-readable format.
                  </p>
                  <p className="mt-3">
                    To exercise these rights, contact us at{" "}
                    <a href="mailto:privacy@notroom.com" className="text-primary hover:underline">
                      privacy@notroom.com
                    </a>
                    {" "}or call{" "}
                    <a href="tel:814-480-0989" className="text-primary hover:underline">
                      (814) 480-0989
                    </a>
                  </p>
                </div>
              </div>

              {/* Security Measures */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="font-bold text-foreground mb-3">Data Security During Retention</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <strong className="text-foreground block mb-2">Technical Safeguards:</strong>
                    <ul className="list-disc ml-5 space-y-1">
                      <li>AES-256 encryption at rest</li>
                      <li>TLS 1.3 encryption in transit</li>
                      <li>Multi-factor authentication</li>
                      <li>Intrusion detection systems</li>
                      <li>Regular security audits</li>
                    </ul>
                  </div>
                  <div>
                    <strong className="text-foreground block mb-2">Administrative Controls:</strong>
                    <ul className="list-disc ml-5 space-y-1">
                      <li>Role-based access controls</li>
                      <li>Audit logging of all access</li>
                      <li>Employee background checks</li>
                      <li>Confidentiality agreements</li>
                      <li>Incident response procedures</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">
                <strong>Questions about data retention?</strong> Review our full{" "}
                <a href="/privacy-policy" className="text-primary hover:underline">
                  Privacy Policy
                </a>
                {" "}or contact our Data Protection Officer at{" "}
                <a href="mailto:privacy@notroom.com" className="text-primary hover:underline">
                  privacy@notroom.com
                </a>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default DataRetentionPolicy;
