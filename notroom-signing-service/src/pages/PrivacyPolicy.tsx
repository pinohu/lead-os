import SigningLayout from "@/components/SigningLayout";
import SEO from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Shield, AlertCircle } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <SigningLayout>
      <SEO
        title="Privacy Policy - Notroom Notary Services"
        description="Comprehensive Privacy Policy for Notroom. Learn how we collect, use, protect, and manage your personal information and notarization records in compliance with all applicable laws."
        canonical="https://notroom.com/privacy-policy"
      />

      <section className="bg-gradient-to-br from-[hsl(var(--hero-gradient-from))] to-[hsl(var(--hero-gradient-to))] text-primary-foreground py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Shield className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Privacy Policy</h1>
            <p className="text-xl opacity-90">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            <p className="text-sm opacity-80 mt-4">Effective Date: January 1, 2025</p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">

            <Card className="p-6 bg-primary/10 border-primary">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-primary mb-2">YOUR PRIVACY RIGHTS</h3>
                  <p className="text-sm text-muted-foreground">
                    This Privacy Policy explains how Notroom LLC collects, uses, discloses, and protects your personal information. We are committed to transparency and giving you control over your data. Please read this policy carefully to understand our practices.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">1. Introduction and Scope</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Notroom LLC ("Company," "we," "us," or "our") respects your privacy and is committed to protecting your personal information. This Privacy Policy describes how we collect, use, share, and safeguard information when you use our notary services, visit our website (notroom.com), or interact with us.
                </p>
                <p>
                  <strong className="text-foreground">Who This Policy Applies To:</strong> This Privacy Policy applies to all visitors, users, customers, and other individuals who access or use our services ("you" or "your").
                </p>
                <p>
                  <strong className="text-foreground">Binding Agreement:</strong> By using our services or providing us with personal information, you acknowledge that you have read and understood this Privacy Policy and consent to the collection, use, and disclosure of your information as described herein. If you do not agree with this Privacy Policy, you must not use our services.
                </p>
                <p>
                  <strong className="text-foreground">Relationship to Terms of Service:</strong> This Privacy Policy is incorporated into and subject to our Terms of Service. Capitalized terms not defined herein have the meanings given in the Terms of Service.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We collect various types of information to provide, maintain, and improve our services, comply with legal obligations, and protect our rights.
                </p>
                
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="font-bold text-foreground mb-3">A. Personal Identification Information</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li><strong>Identity Information:</strong> Full legal name, date of birth, social security number (if required for certain transactions), driver's license or state ID number, passport number, signature specimens</li>
                    <li><strong>Contact Information:</strong> Email address, phone number, mailing address, physical address for mobile services</li>
                    <li><strong>Account Information:</strong> Username, password (encrypted), account preferences, communication preferences</li>
                    <li><strong>Payment Information:</strong> Credit/debit card numbers (processed securely through third-party payment processors), billing address, payment method details, transaction history</li>
                  </ul>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="font-bold text-foreground mb-3">B. Biometric and Identification Data</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li><strong>Government-Issued ID Scans:</strong> High-resolution digital copies of your government-issued photo identification (driver's license, state ID, passport, military ID)</li>
                    <li><strong>Facial Recognition Data:</strong> Facial geometry data extracted from ID photos and video for identity verification purposes during RON sessions</li>
                    <li><strong>Video and Audio Recordings:</strong> Complete audio-visual recordings of remote online notarization sessions including your appearance, voice, statements, and conduct (required by Pennsylvania law, retained for 10 years)</li>
                    <li><strong>Credential Analysis Results:</strong> Technical data from automated verification of ID document authenticity, security features, and validity</li>
                    <li><strong>Knowledge-Based Authentication (KBA) Data:</strong> Questions, answers, and results from identity verification questionnaires based on your public records</li>
                  </ul>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="font-bold text-foreground mb-3">C. Document and Transaction Information</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li><strong>Documents for Notarization:</strong> Complete copies of all documents you submit for notarization, including contents, metadata, and any attachments</li>
                    <li><strong>Notarial Records:</strong> Electronic journal entries documenting date, time, type of notarial act, document description, signer information, fee charged, and identification details</li>
                    <li><strong>Electronic Certificates:</strong> Digital notarial certificates, electronic seals, signatures, and timestamps</li>
                    <li><strong>Transaction Details:</strong> Service type selected, appointment date/time, duration, location (for mobile services), special requests, and any notes or communications</li>
                  </ul>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="font-bold text-foreground mb-3">D. Technical and Usage Information</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li><strong>Device Information:</strong> IP address, device type, operating system, browser type and version, device identifiers, screen resolution, time zone settings</li>
                    <li><strong>Geolocation Data:</strong> Precise geographic location during RON sessions (required to verify Pennsylvania presence), approximate location from IP address</li>
                    <li><strong>Website Usage Data:</strong> Pages visited, time spent on pages, links clicked, search queries, referral sources, exit pages</li>
                    <li><strong>Session Data:</strong> Login/logout times, session duration, features accessed, errors encountered, performance metrics</li>
                    <li><strong>Cookies and Tracking Technologies:</strong> See Section 4 below for detailed information about our use of cookies and similar technologies</li>
                  </ul>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="font-bold text-foreground mb-3">E. Communications and Customer Service</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li><strong>Correspondence:</strong> Emails, text messages, phone call recordings, chat transcripts, support tickets, and other communications with us</li>
                    <li><strong>Feedback and Reviews:</strong> Survey responses, testimonials, reviews, complaints, and other feedback you provide</li>
                    <li><strong>Marketing Communications:</strong> Records of marketing emails sent, opened, clicked, and your communication preferences</li>
                  </ul>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="font-bold text-foreground mb-3">F. Public Records and Third-Party Data</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li><strong>Identity Verification Data:</strong> Information obtained from third-party identity verification services, credit bureaus, and public records databases to verify your identity and prevent fraud</li>
                    <li><strong>Background Information:</strong> Publicly available information from government databases, commercial data providers, and aggregators used for KBA and fraud detection</li>
                  </ul>
                </div>

                <p className="text-sm mt-4">
                  <strong className="text-foreground">Legal Basis for Collection:</strong> We collect this information based on: (1) your consent; (2) contractual necessity to provide services; (3) our legitimate business interests in operating, securing, and improving services; and (4) legal obligations under Pennsylvania and federal law.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We use collected information for the following purposes:
                </p>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-bold text-foreground mb-2">A. Service Delivery and Performance</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                      <li>Perform notarization services and notarial acts</li>
                      <li>Verify your identity as required by Pennsylvania law</li>
                      <li>Schedule and coordinate appointments</li>
                      <li>Process payments and manage billing</li>
                      <li>Facilitate communication between you and notaries</li>
                      <li>Deliver notarized documents and certificates</li>
                      <li>Provide customer support and respond to inquiries</li>
                      <li>Troubleshoot technical issues and optimize performance</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-foreground mb-2">B. Legal Compliance and Record Keeping</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                      <li>Maintain notarial journals and records as mandated by 57 Pa.C.S. § 319 (10-year retention period)</li>
                      <li>Store RON session recordings as required by Pennsylvania Department of State regulations</li>
                      <li>Comply with federal and state laws, regulations, legal processes, and law enforcement requests</li>
                      <li>Respond to subpoenas, court orders, and government inquiries</li>
                      <li>Maintain audit trails for regulatory compliance</li>
                      <li>Report suspicious activities to appropriate authorities</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-foreground mb-2">C. Security and Fraud Prevention</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                      <li>Detect, prevent, and investigate fraud, unauthorized access, and other illegal activities</li>
                      <li>Verify identities and prevent identity theft</li>
                      <li>Monitor for suspicious patterns and anomalies</li>
                      <li>Protect against security threats and vulnerabilities</li>
                      <li>Enforce our Terms of Service and other policies</li>
                      <li>Protect the rights, property, and safety of Notroom, users, and the public</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-foreground mb-2">D. Business Operations and Improvement</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                      <li>Analyze service usage and performance metrics</li>
                      <li>Improve and optimize our services, website, and user experience</li>
                      <li>Develop new features and services</li>
                      <li>Conduct research and analytics</li>
                      <li>Train machine learning models for identity verification and fraud detection</li>
                      <li>Generate aggregate, de-identified statistics for business analysis</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-foreground mb-2">E. Marketing and Communications (With Your Consent)</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                      <li>Send service-related notifications and updates</li>
                      <li>Send promotional emails about new services, features, or special offers (you may opt out at any time)</li>
                      <li>Conduct customer satisfaction surveys</li>
                      <li>Request reviews and testimonials</li>
                      <li>Personalize your experience and marketing communications</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-foreground mb-2">F. Legal Rights and Business Transactions</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                      <li>Establish, exercise, or defend legal claims</li>
                      <li>Facilitate business transactions such as mergers, acquisitions, or sales of assets</li>
                      <li>Evaluate and negotiate business opportunities</li>
                    </ul>
                  </div>
                </div>

                <p className="text-sm mt-4">
                  <strong className="text-foreground">Automated Decision-Making:</strong> We may use automated systems and algorithms for identity verification, fraud detection, and risk assessment. However, significant decisions affecting you (such as service denial) involve human review. You have the right to request human review of automated decisions.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">4. Cookies and Tracking Technologies</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We and our third-party service providers use cookies, web beacons, pixels, local storage, and similar tracking technologies to collect information about your use of our website and services.
                </p>

                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="font-bold text-foreground mb-2">Types of Cookies We Use:</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li><strong>Essential Cookies:</strong> Necessary for website functionality, authentication, security, and service delivery. These cannot be disabled.</li>
                    <li><strong>Performance Cookies:</strong> Collect information about how visitors use our website, helping us improve performance and user experience.</li>
                    <li><strong>Functional Cookies:</strong> Remember your preferences, settings, and choices to provide enhanced features.</li>
                    <li><strong>Analytics Cookies:</strong> Help us understand user behavior, traffic sources, and engagement metrics (e.g., Google Analytics).</li>
                    <li><strong>Advertising Cookies:</strong> Used to deliver relevant advertisements and track advertising campaign effectiveness.</li>
                  </ul>
                </div>

                <p>
                  <strong className="text-foreground">Your Cookie Choices:</strong> Most browsers allow you to refuse cookies or alert you when cookies are being sent. However, disabling cookies may limit your ability to use certain features of our services. You can manage cookie preferences through your browser settings or opt-out tools provided by third-party advertising networks.
                </p>

                <p>
                  <strong className="text-foreground">Do Not Track Signals:</strong> Some browsers include "Do Not Track" (DNT) features. Currently, there is no universal standard for how companies should respond to DNT signals. We do not currently respond to DNT signals, but you can use the cookie management options described above.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">5. How We Share Your Information</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We do not sell your personal information to third parties. However, we may share your information in the following circumstances:
                </p>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-bold text-foreground mb-2">A. Service Providers and Business Partners</h4>
                    <p className="text-sm mb-2">
                      We share information with trusted third-party service providers who perform services on our behalf, including:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                      <li><strong>Payment Processors:</strong> To process transactions securely (e.g., Stripe, PayPal)</li>
                      <li><strong>Identity Verification Services:</strong> To verify identities and conduct KBA (e.g., LexisNexis, Experian)</li>
                      <li><strong>Video Communication Platforms:</strong> To facilitate RON sessions (e.g., Zoom, custom video platforms)</li>
                      <li><strong>Cloud Storage Providers:</strong> To securely store documents and recordings (e.g., AWS, Microsoft Azure)</li>
                      <li><strong>IT and Security Services:</strong> To maintain and secure our systems, detect threats, and prevent fraud</li>
                      <li><strong>Analytics Providers:</strong> To analyze website usage and service performance (e.g., Google Analytics)</li>
                      <li><strong>Email and Communication Services:</strong> To send notifications, confirmations, and marketing communications</li>
                      <li><strong>Customer Support Platforms:</strong> To provide customer service and support</li>
                    </ul>
                    <p className="text-sm mt-2">
                      These service providers are contractually obligated to protect your information, use it only for specified purposes, and comply with applicable privacy laws.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-foreground mb-2">B. Legal Requirements and Protection of Rights</h4>
                    <p className="text-sm">
                      We may disclose your information when required by law or when we believe disclosure is necessary to:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm ml-4 mt-2">
                      <li>Comply with legal obligations, court orders, subpoenas, or legal processes</li>
                      <li>Respond to government or law enforcement requests</li>
                      <li>Enforce our Terms of Service or other agreements</li>
                      <li>Protect the rights, property, safety, or security of Notroom, our users, or the public</li>
                      <li>Detect, prevent, or investigate fraud, security breaches, or illegal activities</li>
                      <li>Establish or defend legal claims</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-foreground mb-2">C. Business Transactions</h4>
                    <p className="text-sm">
                      If Notroom LLC is involved in a merger, acquisition, asset sale, bankruptcy, or other business transaction, your information may be transferred as part of that transaction. We will provide notice and, where required, obtain consent before your information is transferred and becomes subject to a different privacy policy.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-foreground mb-2">D. With Your Consent</h4>
                    <p className="text-sm">
                      We may share your information with third parties when you explicitly consent to such sharing, such as when you authorize us to share information with document recipients, title companies, or other parties involved in your transaction.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-foreground mb-2">E. Aggregate and De-Identified Information</h4>
                    <p className="text-sm">
                      We may share aggregate, de-identified, or anonymized information that cannot reasonably be used to identify you for research, marketing, analytics, or other business purposes. This information is not considered personal information and is not subject to this Privacy Policy.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">6. Data Security Measures</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We implement comprehensive administrative, technical, and physical security measures designed to protect your information from unauthorized access, use, modification, disclosure, or destruction.
                </p>

                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="font-bold text-foreground mb-2">Technical Security Measures:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>Encryption:</strong> 256-bit AES encryption for data at rest and TLS 1.2+ for data in transit</li>
                    <li><strong>Access Controls:</strong> Role-based access controls (RBAC) limiting access to authorized personnel only</li>
                    <li><strong>Authentication:</strong> Multi-factor authentication (MFA) for system access</li>
                    <li><strong>Network Security:</strong> Firewalls, intrusion detection/prevention systems (IDS/IPS), and network segmentation</li>
                    <li><strong>Monitoring:</strong> 24/7 security monitoring, logging, and alerting for suspicious activities</li>
                    <li><strong>Penetration Testing:</strong> Regular security assessments and vulnerability scans</li>
                    <li><strong>Secure Development:</strong> Security-by-design principles in software development</li>
                  </ul>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="font-bold text-foreground mb-2">Administrative Security Measures:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>Employee Training:</strong> Regular security awareness and privacy training for all personnel</li>
                    <li><strong>Background Checks:</strong> Pre-employment screening of personnel with access to sensitive data</li>
                    <li><strong>Confidentiality Agreements:</strong> All employees and contractors sign confidentiality and data protection agreements</li>
                    <li><strong>Incident Response Plan:</strong> Documented procedures for detecting, responding to, and recovering from security incidents</li>
                    <li><strong>Vendor Management:</strong> Due diligence and contractual safeguards for third-party service providers</li>
                  </ul>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="font-bold text-foreground mb-2">Physical Security Measures:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Secure data centers with restricted access, surveillance, and environmental controls</li>
                    <li>Geographic redundancy and disaster recovery capabilities</li>
                    <li>Secure disposal procedures for hardware and media containing sensitive data</li>
                  </ul>
                </div>

                <div className="bg-destructive/5 p-4 rounded-lg border border-destructive/20">
                  <p className="text-sm font-bold text-foreground mb-2">IMPORTANT SECURITY DISCLAIMER:</p>
                  <p className="text-sm">
                    While we implement industry-standard security measures, no method of electronic transmission or storage is 100% secure. We cannot guarantee absolute security of your information. You acknowledge and accept the inherent security risks of internet-based services and electronic data storage. We are not liable for security breaches resulting from circumstances beyond our reasonable control, including but not limited to: sophisticated cyber attacks, zero-day vulnerabilities, third-party security failures, or your own security lapses (e.g., weak passwords, phishing attacks, compromised devices).
                  </p>
                </div>

                <p>
                  <strong className="text-foreground">Your Responsibility:</strong> You are responsible for maintaining the confidentiality of your account credentials, using strong and unique passwords, enabling available security features, keeping your devices and software updated, and promptly reporting any unauthorized access or security concerns.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">7. Data Retention</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We retain your personal information for as long as necessary to fulfill the purposes described in this Privacy Policy, comply with legal obligations, resolve disputes, and enforce our agreements.
                </p>

                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="font-bold text-foreground mb-2">Specific Retention Periods:</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li><strong>Notarial Records and RON Session Recordings:</strong> Minimum 10 years as required by Pennsylvania law (57 Pa.C.S. § 319)</li>
                    <li><strong>Transaction and Payment Records:</strong> Minimum 7 years for tax and accounting purposes</li>
                    <li><strong>Identity Verification Records:</strong> Retained as long as legally required for compliance and fraud prevention purposes</li>
                    <li><strong>Account Information:</strong> Retained while account is active plus minimum 3 years after closure</li>
                    <li><strong>Marketing Communications Data:</strong> Retained until you opt out or request deletion</li>
                    <li><strong>Website Usage and Analytics Data:</strong> Typically retained for 24-36 months</li>
                    <li><strong>Customer Support Records:</strong> Retained for 5 years for quality assurance and dispute resolution</li>
                    <li><strong>Legal and Compliance Records:</strong> Retained as long as required by applicable statutes of limitations and legal holds</li>
                  </ul>
                </div>

                <p>
                  <strong className="text-foreground">Deletion Requests:</strong> You may request deletion of your information subject to legal retention requirements and legitimate business needs. Some information must be retained by law and cannot be deleted even upon request. See Section 10 for information about your privacy rights.
                </p>

                <p>
                  <strong className="text-foreground">Secure Deletion:</strong> When information is no longer needed and can be deleted, we use secure deletion methods to ensure data cannot be recovered or reconstructed.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">8. International Data Transfers</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Notroom LLC is based in the United States and primarily serves customers in Pennsylvania. Your information is collected, processed, and stored in the United States.
                </p>
                <p>
                  <strong className="text-foreground">Cross-Border Transfers:</strong> If you access our services from outside the United States, you acknowledge and consent to the transfer of your information to the United States, which may have different data protection laws than your country of residence. By using our services, you consent to such transfers.
                </p>
                <p>
                  <strong className="text-foreground">Third-Party Service Providers:</strong> Some of our third-party service providers may process data in countries other than the United States. We require these providers to implement appropriate safeguards to protect your information consistent with this Privacy Policy and applicable laws.
                </p>
                <p>
                  <strong className="text-foreground">EU and UK Residents:</strong> If you are a resident of the European Economic Area (EEA) or United Kingdom, please note that we do not specifically target services to EEA/UK residents. However, if you choose to use our services, we will process your information in compliance with the General Data Protection Regulation (GDPR) to the extent applicable, including implementing appropriate transfer mechanisms such as Standard Contractual Clauses.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">9. Children's Privacy</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children under 18. Notarization services require legal capacity, and Pennsylvania law requires signers to be adults (18+) or emancipated minors.
                </p>
                <p>
                  <strong className="text-foreground">Parental Notice:</strong> If we become aware that we have collected personal information from a child under 18 without parental consent (where required), we will take steps to delete such information. If you believe we have collected information from a child under 18, please contact us immediately at privacy@notroom.com.
                </p>
                <p>
                  <strong className="text-foreground">Age Verification:</strong> We implement age verification measures including reviewing government-issued identification documents to ensure users are 18 years or older.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">10. Your Privacy Rights and Choices</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Depending on your location, you may have certain rights regarding your personal information. We provide these rights to all users regardless of location to the extent feasible.
                </p>

                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="font-bold text-foreground mb-3">Your Rights Include:</h3>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-bold text-foreground">Right to Access:</p>
                      <p>You may request confirmation of whether we process your personal information and obtain a copy of your information in a structured, commonly used format.</p>
                    </div>

                    <div>
                      <p className="font-bold text-foreground">Right to Correct/Update:</p>
                      <p>You may request correction of inaccurate or incomplete personal information. You can also update your account information directly through your account settings.</p>
                    </div>

                    <div>
                      <p className="font-bold text-foreground">Right to Delete:</p>
                      <p>You may request deletion of your personal information, subject to legal retention requirements and legitimate business needs. Note: We CANNOT delete notarial records, RON session recordings, or other information that must be retained by law.</p>
                    </div>

                    <div>
                      <p className="font-bold text-foreground">Right to Opt-Out of Marketing:</p>
                      <p>You may opt out of promotional emails by clicking the "unsubscribe" link in emails or contacting us. You cannot opt out of transactional or service-related communications necessary for service delivery.</p>
                    </div>

                    <div>
                      <p className="font-bold text-foreground">Right to Restrict Processing:</p>
                      <p>You may request restriction of processing in certain circumstances, such as while we verify accuracy of information or assess whether you have legitimate grounds to request deletion.</p>
                    </div>

                    <div>
                      <p className="font-bold text-foreground">Right to Data Portability:</p>
                      <p>You may request a copy of personal information you provided to us in a portable format where technically feasible.</p>
                    </div>

                    <div>
                      <p className="font-bold text-foreground">Right to Object:</p>
                      <p>You may object to processing based on legitimate interests or for direct marketing purposes.</p>
                    </div>

                    <div>
                      <p className="font-bold text-foreground">Right to Withdraw Consent:</p>
                      <p>Where processing is based on consent, you may withdraw consent at any time. Withdrawal does not affect lawfulness of processing before withdrawal.</p>
                    </div>

                    <div>
                      <p className="font-bold text-foreground">Right to Non-Discrimination:</p>
                      <p>We will not discriminate against you for exercising any of these privacy rights.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/10 p-4 rounded-lg">
                  <h3 className="font-bold text-foreground mb-2">How to Exercise Your Rights:</h3>
                  <p className="text-sm mb-2">
                    To exercise these rights, submit a verifiable request to:
                  </p>
                  <ul className="list-none space-y-1 text-sm">
                    <li><strong>Email:</strong> privacy@notroom.com</li>
                    <li><strong>Phone:</strong> (814) 480-0989</li>
                    <li><strong>Mail:</strong> Notroom LLC, Privacy Department, Erie, PA</li>
                  </ul>
                  <p className="text-sm mt-3">
                    We will respond to verifiable requests within 30-45 days (or as required by law). We may need to verify your identity before processing your request by asking for identifying information or documentation. You may designate an authorized agent to make requests on your behalf by providing written authorization.
                  </p>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="font-bold text-foreground mb-2">Limitations on Rights:</h3>
                  <p className="text-sm">
                    These rights are not absolute and may be subject to limitations, including:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                    <li>Legal retention requirements (e.g., 10-year retention of notarial records under Pennsylvania law)</li>
                    <li>Ongoing legal proceedings or investigations</li>
                    <li>Fraud prevention and security measures</li>
                    <li>Legitimate business needs and interests</li>
                    <li>Exercise or defense of legal claims</li>
                    <li>Compliance with other legal obligations</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="p-8" id="ccpa">
              <h2 className="text-2xl font-bold mb-4">11. California Privacy Rights (CCPA)</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  If you are a California resident, the California Consumer Privacy Act (CCPA) provides additional privacy rights.
                </p>

                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="font-bold text-foreground mb-2">CCPA Rights Summary:</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li><strong>Right to Know:</strong> Request disclosure of categories and specific pieces of personal information collected, sold, or disclosed</li>
                    <li><strong>Right to Delete:</strong> Request deletion of personal information (subject to exceptions)</li>
                    <li><strong>Right to Opt-Out:</strong> Opt out of "sale" or "sharing" of personal information for targeted advertising</li>
                    <li><strong>Right to Correct:</strong> Request correction of inaccurate personal information</li>
                    <li><strong>Right to Limit Use:</strong> Limit use and disclosure of sensitive personal information</li>
                    <li><strong>Right to Non-Discrimination:</strong> Not face discrimination for exercising CCPA rights</li>
                  </ul>
                </div>

                <p>
                  <strong className="text-foreground">Do We "Sell" Personal Information?</strong> As defined by the CCPA, we do not "sell" personal information in exchange for monetary compensation. However, we may "share" information for targeted advertising purposes through cookies and analytics. You can opt out using the cookie management tools described in Section 4 or by contacting us.
                </p>

                <p>
                  <strong className="text-foreground">Sensitive Personal Information:</strong> We collect certain categories of sensitive personal information including government ID numbers, precise geolocation, and biometric data for identity verification. We use this information only for purposes necessary to provide services and comply with legal obligations. You have the right to limit use of sensitive personal information.
                </p>

                <p>
                  <strong className="text-foreground">Retention:</strong> See Section 7 for detailed information about data retention periods.
                </p>

                <p>
                  <strong className="text-foreground">Authorized Agents:</strong> California residents may designate authorized agents to make CCPA requests on their behalf. We may require verification of authorization before processing such requests.
                </p>

                <p>
                  <strong className="text-foreground">Shine the Light:</strong> Under California Civil Code Section 1798.83, California residents may request information about disclosure of personal information to third parties for direct marketing purposes. Contact us at privacy@notroom.com for such requests.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">12. Data Breach Notification</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  In the event of a data breach involving your personal information, we will comply with all applicable data breach notification laws.
                </p>
                <p>
                  <strong className="text-foreground">Notification Procedures:</strong> If we experience a breach that compromises the security, confidentiality, or integrity of your personal information, we will:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>Conduct prompt investigation to determine scope and impact</li>
                  <li>Notify affected individuals without unreasonable delay (typically within 30-60 days or as required by law)</li>
                  <li>Notify appropriate regulatory authorities as required</li>
                  <li>Provide information about the breach, types of information compromised, steps taken to address the breach, and recommendations to protect yourself</li>
                  <li>Offer identity theft protection services where appropriate and required</li>
                </ul>
                <p>
                  <strong className="text-foreground">Your Responsibilities:</strong> If you suspect unauthorized access to your account or information, immediately change your password and contact us at security@notroom.com.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">13. Changes to This Privacy Policy</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We reserve the right to modify this Privacy Policy at any time to reflect changes in our practices, services, legal requirements, or for other operational, legal, or regulatory reasons.
                </p>
                <p>
                  <strong className="text-foreground">Notice of Changes:</strong> When we make changes, we will:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Update the "Last Updated" date at the top of this policy</li>
                  <li>Post the revised policy on our website</li>
                  <li>For material changes, provide prominent notice on our website or via email (if you have provided an email address)</li>
                  <li>Where required by law, obtain your consent to material changes</li>
                </ul>
                <p>
                  <strong className="text-foreground">Your Continued Use:</strong> Your continued use of services after changes take effect constitutes acceptance of the revised Privacy Policy. If you do not agree to changes, you must stop using our services.
                </p>
                <p>
                  <strong className="text-foreground">Review Regularly:</strong> We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">14. Third-Party Links and Services</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Our website and services may contain links to third-party websites, applications, or services not operated or controlled by Notroom LLC. This Privacy Policy applies only to information collected by us and does not apply to third-party services.
                </p>
                <p>
                  <strong className="text-foreground">No Responsibility for Third Parties:</strong> We are not responsible for the privacy practices, policies, or content of third parties. We encourage you to read the privacy policies of any third-party services you visit or use.
                </p>
                <p>
                  <strong className="text-foreground">Social Media:</strong> Our website may include social media features (e.g., Facebook "Like" button, Twitter sharing). These features may collect your IP address, track which pages you visit, and set cookies. Your interactions with these features are governed by the privacy policies of the companies providing them.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">15. Contact Information and Complaints</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  If you have questions, concerns, or complaints about this Privacy Policy or our privacy practices, please contact us:
                </p>

                <div className="bg-primary/10 p-4 rounded-lg">
                  <h3 className="font-bold text-foreground mb-2">Privacy Contact Information:</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Email:</strong> privacy@notroom.com</p>
                    <p><strong>Phone:</strong> (814) 480-0989</p>
                    <p><strong>Mail:</strong> Notroom LLC, Privacy Department, Erie, Pennsylvania</p>
                    <p><strong>General Support:</strong> support@notroom.com</p>
                  </div>
                </div>

                <p>
                  <strong className="text-foreground">Response Time:</strong> We will respond to your inquiries within 30-45 days (or as required by applicable law). We may need additional time for complex requests and will notify you if an extension is needed.
                </p>

                <p>
                  <strong className="text-foreground">Filing Complaints with Regulators:</strong> You have the right to file a complaint with data protection authorities if you believe your privacy rights have been violated. For Pennsylvania residents, you may contact the Pennsylvania Attorney General's Office. For California residents, you may contact the California Attorney General. For EU/UK residents, you may contact your local data protection authority.
                </p>

                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="font-bold text-foreground mb-2">Regulatory Contacts:</h3>
                  <ul className="list-none space-y-1 text-sm">
                    <li><strong>Pennsylvania Attorney General:</strong> Office of Consumer Protection, (717) 787-3391</li>
                    <li><strong>Federal Trade Commission:</strong> www.ftc.gov</li>
                    <li><strong>Pennsylvania Department of State (Notary Division):</strong> (717) 787-5280</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-muted/30 border-primary">
              <div className="text-center space-y-4">
                <Shield className="w-12 h-12 mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Your Privacy Matters to Us.</strong> We are committed to protecting your personal information and maintaining your trust. If you have any questions or concerns about this Privacy Policy or how we handle your data, please don't hesitate to contact us.
                </p>
                <p className="text-xs text-muted-foreground mt-4">
                  <strong>Document Version:</strong> 2.0 | <strong>Effective Date:</strong> January 1, 2025 | <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
                <p className="text-xs text-muted-foreground">
                  © 2025 Notroom LLC. All rights reserved.
                </p>
              </div>
            </Card>

          </div>
        </div>
      </section>
    </SigningLayout>
  );
};

export default PrivacyPolicy;
