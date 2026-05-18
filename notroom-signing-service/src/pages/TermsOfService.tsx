import SigningLayout from "@/components/SigningLayout";
import SEO from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { COMMISSION_INFO } from "@/constants/commission";

const TermsOfService = () => {
  return (
    <SigningLayout>
      <SEO
        title="Terms of Service - Notroom Notary Services"
        description="Comprehensive Terms of Service for Notroom notary services in Pennsylvania. Service limitations, fee structure, legal compliance, and customer responsibilities."
        canonical="https://notroom.com/terms-of-service"
      />

      <section className="bg-gradient-to-br from-[hsl(var(--hero-gradient-from))] to-[hsl(var(--hero-gradient-to))] text-primary-foreground py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Terms of Service</h1>
            <p className="text-xl opacity-90">Last Updated: January 2025</p>
            <p className="text-sm opacity-80 mt-4">PLEASE READ THESE TERMS CAREFULLY BEFORE USING OUR SERVICES</p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            
            <Card className="p-6 bg-destructive/10 border-destructive">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-destructive mb-2">IMPORTANT LEGAL NOTICE</h3>
                  <p className="text-sm text-muted-foreground">
                    These Terms of Service contain important provisions including an ARBITRATION CLAUSE and CLASS ACTION WAIVER that affect your legal rights. By using our services, you agree to be bound by these terms without exception.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms and Binding Agreement</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  By accessing, browsing, or using any services provided by Notroom LLC ("Company," "we," "us," or "our"), you ("User," "you," or "your") acknowledge that you have read, understood, and agree to be legally bound by these Terms of Service ("Terms"), our Privacy Policy, and all applicable laws and regulations.
                </p>
                <p>
                  <strong className="text-foreground">IF YOU DO NOT AGREE TO THESE TERMS IN THEIR ENTIRETY, YOU MUST IMMEDIATELY CEASE ALL USE OF OUR SERVICES AND WEBSITE.</strong>
                </p>
                <p>
                  Your use of our services constitutes acceptance of these Terms, regardless of whether you have created an account or paid for services. You represent and warrant that you are at least 18 years of age and possess the legal capacity to enter into this binding agreement.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">2. Service Description and Strict Limitations</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Notroom LLC provides notary public services in Pennsylvania, including but not limited to Remote Online Notarization (RON), mobile notary services, loan signing agent services, and apostille assistance. All services are subject to availability and at the sole discretion of the Company.
                </p>
                <div className="bg-destructive/5 p-4 rounded-lg border border-destructive/20">
                  <h3 className="font-bold mb-3 text-foreground">CRITICAL SERVICE LIMITATIONS - NO EXCEPTIONS:</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li><strong>NO LEGAL ADVICE:</strong> Notaries are NOT attorneys and CANNOT provide legal advice, recommend legal actions, or draft legal documents under any circumstances.</li>
                    <li><strong>NO APOSTILLE ISSUANCE:</strong> Only the Pennsylvania Department of State can issue apostilles. We provide application assistance only.</li>
                    <li><strong>NO CONFLICTS OF INTEREST:</strong> Notaries cannot notarize documents in which they have any financial or beneficial interest whatsoever.</li>
                    <li><strong>PENNSYLVANIA LOCATION REQUIRED FOR RON:</strong> Remote Online Notarization requires the signer to be physically present within Pennsylvania state boundaries during the entire session. Misrepresentation of location is fraud and may result in criminal prosecution.</li>
                    <li><strong>NO INCOMPLETE DOCUMENTS:</strong> Notaries cannot and will not notarize documents containing blank spaces, incomplete information, or documents that appear fraudulent or coerced.</li>
                    <li><strong>NO GUARANTEE OF ACCEPTANCE:</strong> We do not guarantee that notarized documents will be accepted by any third party, court, government agency, or institution.</li>
                    <li><strong>NO IMPLIED WARRANTY:</strong> Notarization does not verify the truthfulness, accuracy, or legal validity of document contents.</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">3. Fee Structure and Payment Terms</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  All notary fees comply strictly with Pennsylvania law (57 Pa.C.S. Chapter 3), which limits notary fees to $5-15 per signature depending on the type of notarial act. Additional fees represent separate, non-notarial services.
                </p>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="font-bold text-foreground mb-2">Detailed Fee Breakdown:</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li><strong>Remote Online Notary (RON):</strong> $5 PA notary fee per signature (57 Pa. Code § 307.1 statutory maximum) + $55 technology platform fee covering: secure video infrastructure, knowledge-based authentication (KBA) identity verification, tamper-evident digital certificates, 10-year session recording storage (PA law requirement), scheduling systems, and administrative overhead. <strong>Total: $60 per session.</strong></li>
                    <li><strong>Mobile Notary Services:</strong> $5 PA notary fee per signature (statutory maximum) + $120 mobile service fee covering: travel coordination, scheduling systems, administrative processing, on-site service delivery + $1.50 per mile round-trip travel reimbursement from Erie office (6238 Cobblestone Dr, Erie, PA 16509). <strong>Base total: $125 + mileage.</strong></li>
                    <li><strong>Loan Signing Agent Services:</strong> $5 PA notary fee per signature (typically 3-10 signatures per closing) + $170 signing agent service fee covering: NNA certification, $100K E&O insurance, document printing and preparation, travel within service area, scan-back services to title company, and administrative coordination. <strong>Base total: $175+.</strong></li>
                    <li><strong>Business Retainer Plans:</strong> Monthly prepaid notarization packages at reduced per-act pricing. Pennsylvania statutory $5 notary fee applies to each individual notarial act. Technology and service fees are discounted based on volume commitment. Unused notarizations expire at contract termination and are non-refundable.</li>
                  </ul>
                </div>
                <p>
                  <strong className="text-foreground">Payment Terms:</strong> All fees are due and payable at time of booking unless alternative arrangements are made in writing. Payments are processed through secure third-party payment processors. We accept credit cards, debit cards, and ACH transfers. A $35 fee will be assessed for returned payments. Prices are subject to change with 30 days notice.
                </p>
                <p>
                  <strong className="text-foreground">No Refund Policy:</strong> All fees are non-refundable except as explicitly stated in Section 7 (Cancellations). Once a notarial act is performed, no refunds will be issued under any circumstances. Services are provided on an "as-is" basis.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">4. Geographic Jurisdiction and Venue</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  <strong className="text-foreground">Remote Online Notarization (RON):</strong> Available exclusively to individuals physically located within Pennsylvania state boundaries during the video notarization session. You must truthfully confirm your physical presence in Pennsylvania at the start of each session. False representation of your location constitutes fraud and may result in immediate termination of services, legal action, and criminal prosecution under Pennsylvania law.
                </p>
                <p>
                  <strong className="text-foreground">Mobile Notary Services:</strong> Available for in-person notarization within Erie County, Pennsylvania, and select surrounding counties as specified on our service area pages. Additional travel fees apply for locations outside Erie city limits.
                </p>
                <p>
                  <strong className="text-foreground">Governing Law:</strong> These Terms and all transactions are governed exclusively by the laws of the Commonwealth of Pennsylvania, without regard to conflict of law provisions. The exclusive venue for any legal action shall be the state or federal courts located in Erie County, Pennsylvania.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">5. Identity Verification and Security Requirements</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  All signers must provide valid, unexpired government-issued photo identification meeting Pennsylvania requirements. Acceptable forms include state driver's license, state-issued ID card, U.S. passport, military ID, or permanent resident card.
                </p>
                <p>
                  <strong className="text-foreground">RON-Specific Requirements:</strong> Knowledge-Based Authentication (KBA) verification is mandatory by Pennsylvania law for all remote online notarizations. KBA involves answering multiple questions based on your public records. Failure to pass KBA verification will result in denial of service with no refund.
                </p>
                <p>
                  <strong className="text-foreground">Right to Refuse Service:</strong> The notary reserves absolute discretion to refuse service for any of the following reasons without obligation to provide refund: (1) inability to verify identity through acceptable means; (2) signer appears to lack understanding of document contents; (3) signer appears to be under duress, coercion, or undue influence; (4) suspicion of fraud, forgery, or illegal activity; (5) incomplete or improperly prepared documents; (6) conflicts of interest; (7) technical difficulties preventing proper notarization; (8) violation of any provision of these Terms.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">6. User Representations, Warranties, and Obligations</h2>
              <div className="space-y-4 text-muted-foreground">
                <p className="font-bold text-foreground">
                  By using our services, you represent, warrant, and covenant the following:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>You are at least 18 years of age and possess full legal capacity to enter contracts.</li>
                  <li>All information provided is true, accurate, current, and complete.</li>
                  <li>You are the person identified in the presented identification documents.</li>
                  <li>You are physically located in Pennsylvania during RON sessions (if applicable).</li>
                  <li>You are signing documents voluntarily without duress, coercion, or undue influence.</li>
                  <li>You understand the contents of documents you are signing.</li>
                  <li>Documents do not contain fraudulent, false, or misleading information to your knowledge.</li>
                  <li>You will not use our services for any illegal purpose or in violation of any law.</li>
                  <li>You will comply with all applicable laws regarding document execution and recording.</li>
                  <li>You will not attempt to circumvent security measures or identity verification procedures.</li>
                  <li>You will maintain confidentiality of any account credentials.</li>
                  <li>You will pay all fees when due and in full.</li>
                </ul>
                <p className="text-sm">
                  <strong className="text-foreground">Breach of these representations and warranties constitutes a material breach of this agreement and may result in immediate termination of services, legal action, and criminal prosecution.</strong>
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">7. Scheduling, Cancellations, and Refunds</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Appointments are scheduled subject to notary availability and at the Company's sole discretion. Appointment times are not guaranteed and may be subject to change.
                </p>
                <p>
                  <strong className="text-foreground">Cancellation Policy:</strong> You may cancel appointments at least 24 hours before the scheduled time for a full refund. Cancellations made less than 24 hours before the scheduled time will incur a $35 cancellation fee deducted from any refund. "No-show" appointments (failure to appear without cancellation) forfeit all fees paid with zero refund.
                </p>
                <p>
                  <strong className="text-foreground">Company Cancellation Rights:</strong> We reserve the right to cancel or reschedule appointments at any time due to notary unavailability, technical difficulties, emergencies, weather conditions, or any other reason at our sole discretion. In the event we cancel, you will receive a full refund or opportunity to reschedule at no additional charge. Our liability is strictly limited to refund of fees paid; we are not liable for any consequential damages.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">8. Limitation of Liability and Disclaimer of Warranties</h2>
              <div className="space-y-4 text-muted-foreground">
                <div className="bg-destructive/5 p-4 rounded-lg border-2 border-destructive/30">
                  <p className="font-bold text-foreground mb-3">MAXIMUM LIABILITY CAP:</p>
                  <p className="text-sm">
                    TO THE MAXIMUM EXTENT PERMITTED BY PENNSYLVANIA LAW, THE TOTAL AGGREGATE LIABILITY OF NOTROOM LLC, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, CONTRACTORS, AND NOTARIES (COLLECTIVELY, "COMPANY PARTIES") FOR ANY AND ALL CLAIMS ARISING FROM OR RELATED TO SERVICES PROVIDED SHALL NOT EXCEED THE TOTAL AMOUNT OF FEES ACTUALLY PAID BY YOU TO NOTROOM LLC FOR THE SPECIFIC NOTARIAL ACT GIVING RISE TO THE CLAIM, NOT TO EXCEED ONE HUNDRED DOLLARS ($100.00), REGARDLESS OF THE THEORY OF LIABILITY.
                  </p>
                </div>
                <div className="bg-destructive/5 p-4 rounded-lg border-2 border-destructive/30">
                  <p className="font-bold text-foreground mb-3">DISCLAIMER OF WARRANTIES:</p>
                  <p className="text-sm mb-3">
                    ALL SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMISSIBLE UNDER APPLICABLE LAW, COMPANY PARTIES DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>IMPLIED WARRANTIES OF MERCHANTABILITY</li>
                    <li>FITNESS FOR A PARTICULAR PURPOSE</li>
                    <li>NON-INFRINGEMENT</li>
                    <li>TITLE</li>
                    <li>ACCURACY OF INFORMATION</li>
                    <li>QUIET ENJOYMENT</li>
                    <li>INTEGRATION</li>
                    <li>QUALITY OF SERVICE</li>
                    <li>UNINTERRUPTED OR ERROR-FREE SERVICE</li>
                  </ul>
                </div>
                <p className="font-bold text-foreground">EXCLUSION OF CONSEQUENTIAL DAMAGES:</p>
                <p className="text-sm">
                  IN NO EVENT SHALL COMPANY PARTIES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO: LOST PROFITS, LOST REVENUE, LOST DATA, LOSS OF BUSINESS OPPORTUNITY, COST OF SUBSTITUTE SERVICES, PERSONAL INJURY, EMOTIONAL DISTRESS, OR ANY OTHER INTANGIBLE LOSSES, EVEN IF COMPANY PARTIES HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
                </p>
                <p className="font-bold text-foreground">SPECIFIC EXCLUSIONS OF LIABILITY:</p>
                <p>Company Parties are not liable for:</p>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>Legal validity, enforceability, or consequences of documents notarized</li>
                  <li>Truthfulness or accuracy of document contents</li>
                  <li>Third-party acceptance or rejection of notarized documents</li>
                  <li>Recording or filing of documents with government agencies or courts</li>
                  <li>Technical failures including internet outages, platform malfunctions, or equipment failures</li>
                  <li>Third-party service provider failures</li>
                  <li>Identity theft or fraud by signers or third parties</li>
                  <li>Data breaches or security incidents beyond our reasonable control</li>
                  <li>Delays in service delivery</li>
                  <li>Any use of documents after notarization</li>
                </ul>
                <p className="text-sm">
                  <strong className="text-foreground">Notroom LLC maintains errors and omissions (E&O) insurance as required by Pennsylvania law; however, such insurance coverage does not expand our liability beyond the limits stated herein.</strong>
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">9. Indemnification</h2>
              <div className="space-y-4 text-muted-foreground">
                <p className="font-bold text-foreground">
                  YOU AGREE TO INDEMNIFY, DEFEND, AND HOLD HARMLESS COMPANY PARTIES FROM AND AGAINST ANY AND ALL CLAIMS, LIABILITIES, DAMAGES, LOSSES, COSTS, EXPENSES, FEES (INCLUDING REASONABLE ATTORNEYS' FEES AND COURT COSTS) ARISING FROM OR RELATED TO:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>Your use or misuse of our services</li>
                  <li>Your violation of these Terms of Service</li>
                  <li>Your violation of any applicable law or regulation</li>
                  <li>Your violation of any third-party rights including intellectual property, privacy, or publicity rights</li>
                  <li>Any false or misleading information you provide</li>
                  <li>Any fraudulent, illegal, or unauthorized use of services</li>
                  <li>The content of any documents you present for notarization</li>
                  <li>Consequences of document execution, recording, or use</li>
                  <li>Claims brought by third parties arising from your use of services</li>
                  <li>Your breach of any representations or warranties</li>
                </ul>
                <p className="text-sm">
                  This indemnification obligation survives termination of these Terms and your use of services. You agree to cooperate fully in the defense of any claim. We reserve the right to assume exclusive defense and control of any matter subject to indemnification, in which case you agree to cooperate with our defense.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">10. Mandatory Arbitration and Class Action Waiver</h2>
              <div className="space-y-4 text-muted-foreground">
                <div className="bg-destructive/5 p-4 rounded-lg border-2 border-destructive/30">
                  <p className="font-bold text-foreground mb-3">PLEASE READ THIS SECTION CAREFULLY. IT AFFECTS YOUR LEGAL RIGHTS.</p>
                  <p className="text-sm mb-3">
                    <strong className="text-foreground">Agreement to Arbitrate:</strong> You and Notroom LLC mutually agree that any dispute, claim, or controversy arising out of or relating to these Terms, your use of services, or your relationship with Company (collectively, "Disputes") shall be resolved exclusively through binding arbitration rather than in court, except as provided below.
                  </p>
                  <p className="text-sm mb-3">
                    <strong className="text-foreground">Arbitration Rules:</strong> Arbitration shall be administered by the American Arbitration Association (AAA) under its Commercial Arbitration Rules and Consumer Arbitration Rules (as applicable). The Federal Arbitration Act governs interpretation and enforcement of this arbitration provision.
                  </p>
                  <p className="text-sm mb-3">
                    <strong className="text-foreground">Arbitration Location:</strong> Any arbitration hearing shall take place in Erie County, Pennsylvania, unless both parties agree to a different location or agree to conduct arbitration by telephone or videoconference.
                  </p>
                  <p className="text-sm mb-3">
                    <strong className="text-foreground">Arbitrator's Authority:</strong> The arbitrator has exclusive authority to resolve all Disputes, including disputes about the interpretation, applicability, enforceability, or formation of this arbitration agreement. The arbitrator's decision is final and binding, subject only to limited court review under the Federal Arbitration Act.
                  </p>
                  <p className="text-sm mb-3">
                    <strong className="text-foreground">CLASS ACTION WAIVER:</strong> YOU AND NOTROOM LLC AGREE THAT EACH PARTY MAY BRING DISPUTES AGAINST THE OTHER ONLY IN AN INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS, CONSOLIDATED, OR REPRESENTATIVE PROCEEDING. UNLESS BOTH PARTIES AGREE OTHERWISE IN WRITING, THE ARBITRATOR MAY NOT CONSOLIDATE MORE THAN ONE PERSON'S CLAIMS AND MAY NOT OTHERWISE PRESIDE OVER ANY FORM OF REPRESENTATIVE OR CLASS PROCEEDING.
                  </p>
                  <p className="text-sm mb-3">
                    <strong className="text-foreground">Exceptions to Arbitration:</strong> Either party may bring a lawsuit in court (instead of arbitration) solely for claims of intellectual property infringement, claims under the Computer Fraud and Abuse Act, or to seek injunctive relief to stop unauthorized use or abuse of services or infringement of intellectual property rights.
                  </p>
                  <p className="text-sm mb-3">
                    <strong className="text-foreground">Small Claims Court:</strong> Either party may bring a claim in small claims court if the claim qualifies for small claims court jurisdiction and proceeds on an individual (non-class, non-representative) basis.
                  </p>
                  <p className="text-sm">
                    <strong className="text-foreground">Opt-Out Right:</strong> You have the right to opt out of this arbitration agreement within 30 days of first accepting these Terms by sending written notice to: Notroom LLC, Legal Department, Erie, PA with your name and clear statement of intent to opt out. Opting out does not affect any other terms.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">11. Record Retention and Data Storage</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  As mandated by Pennsylvania law (57 Pa.C.S. § 319), we maintain comprehensive records of all notarial acts:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li><strong>RON Session Recordings:</strong> Audio-visual recordings of entire remote online notarization sessions stored securely for minimum of 10 years</li>
                  <li><strong>Notarial Journals:</strong> Electronic journals documenting all notarial acts with required information maintained per Pennsylvania requirements</li>
                  <li><strong>Electronic Certificates:</strong> Digital certificates, seals, and signatures preserved with tamper-evident technology</li>
                  <li><strong>Audit Trails:</strong> Complete audit logs of all system access and actions performed</li>
                  <li><strong>Identity Verification Records:</strong> Documentation of identity verification procedures including credential analysis and KBA results</li>
                </ul>
                <p>
                  <strong className="text-foreground">Access to Records:</strong> You may request copies of your notarization records by submitting a written request to support@notroom.com. We may charge reasonable copying fees. Records requests are subject to verification of identity and legitimate interest. We are not obligated to provide access to records beyond what is legally required.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">12. Intellectual Property Rights</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  All content, features, and functionality of our website and services, including but not limited to text, graphics, logos, icons, images, audio clips, video clips, data compilations, software, designs, and the selection and arrangement thereof (collectively, "Company IP") are the exclusive property of Notroom LLC or its licensors and are protected by U.S. and international copyright, trademark, patent, trade secret, and other intellectual property laws.
                </p>
                <p>
                  <strong className="text-foreground">Limited License:</strong> Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, non-sublicensable, revocable license to access and use our services solely for their intended purpose. This license does not include any right to: (a) resell or make commercial use of services or Company IP; (b) modify, reproduce, distribute, or create derivative works based on services or Company IP; (c) download (except for page caching) or copy any portion of services or Company IP; (d) use any data mining, robots, or similar data gathering or extraction methods; (e) use services or Company IP for any purpose other than their intended purpose.
                </p>
                <p>
                  <strong className="text-foreground">Trademarks:</strong> The Notroom name, logo, and all related names, logos, product and service names, designs, and slogans are trademarks of Notroom LLC. You may not use such marks without our prior written permission. Other names, logos, and marks are the property of their respective owners.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">13. Prohibited Uses and Conduct</h2>
              <div className="space-y-4 text-muted-foreground">
                <p className="font-bold text-foreground">
                  You agree NOT to use our services for any of the following prohibited purposes:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>Any unlawful purpose or to violate any federal, state, or local law or regulation</li>
                  <li>To engage in fraud, forgery, or misrepresentation of any kind</li>
                  <li>To impersonate another person or entity</li>
                  <li>To provide false, misleading, or deceptive information</li>
                  <li>To notarize documents you know or should know contain false statements</li>
                  <li>To circumvent identity verification procedures</li>
                  <li>To misrepresent your physical location during RON sessions</li>
                  <li>To harass, abuse, threaten, or intimidate any notary or Company personnel</li>
                  <li>To upload or transmit viruses, malware, or any malicious code</li>
                  <li>To interfere with or disrupt services, servers, or networks</li>
                  <li>To attempt unauthorized access to any portion of services or systems</li>
                  <li>To collect or harvest information about users without consent</li>
                  <li>To use services to violate privacy or publicity rights of others</li>
                  <li>To use automated systems or software to extract data from our website</li>
                  <li>To reverse engineer, decompile, or disassemble any software</li>
                </ul>
                <p className="text-sm">
                  <strong className="text-foreground">Violation of these prohibitions may result in immediate termination of services, legal action, referral to law enforcement, and full liability for all resulting damages.</strong>
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">14. Third-Party Services and Links</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Our services may integrate with or link to third-party websites, services, or applications not owned or controlled by Notroom LLC, including but not limited to payment processors, identity verification services, video communication platforms, and document storage providers.
                </p>
                <p>
                  <strong className="text-foreground">No Endorsement or Control:</strong> We have no control over and assume no responsibility for the content, privacy policies, practices, or services of any third party. We do not endorse or make any representations about third-party services. Your use of third-party services is at your own risk and subject to their terms and conditions.
                </p>
                <p>
                  <strong className="text-foreground">Release:</strong> You expressly release Notroom LLC from any and all liability arising from your use of third-party services or websites. We strongly advise you to read the terms and privacy policies of any third-party services you access.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">15. Force Majeure</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Notroom LLC shall not be liable for any failure or delay in performance of services due to causes beyond our reasonable control, including but not limited to: acts of God, natural disasters, war, terrorism, riots, embargoes, acts of civil or military authorities, fire, floods, accidents, pandemics, epidemics, strikes or labor disputes, failure of third-party service providers, failure of telecommunications or internet infrastructure, power outages, or compliance with governmental orders or regulations.
                </p>
                <p>
                  In the event of force majeure, our obligations shall be suspended for the duration of such event. We will make reasonable efforts to notify you and resume services as soon as practicable. If force majeure continues for more than 30 days, either party may terminate affected services with refund of prepaid but unused fees.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">16. Privacy and Data Security</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We use bank-level 256-bit AES encryption to protect documents and personal information during transmission and storage. All remote online notarization sessions are recorded and encrypted as required by Pennsylvania law. We implement administrative, technical, and physical security measures designed to protect against unauthorized access, use, modification, or disclosure of data.
                </p>
                <p>
                  <strong className="text-foreground">However, no system is completely secure.</strong> While we strive to protect your information, we cannot guarantee absolute security of data transmitted through our services or stored in our systems. You acknowledge and accept the inherent security risks of internet transmission and electronic storage.
                </p>
                <p>
                  For detailed information about our data practices, please review our separate Privacy Policy, which is incorporated into these Terms by reference.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">17. Business Retainer Plans - Additional Terms</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Business retainer plans are prepaid notarization packages billed monthly or annually. Pennsylvania statutory notary fee limits ($5-15 per signature) apply to each individual notarial act performed under the retainer. Additional fees represent non-notarial services including administrative support, priority scheduling, and account management.
                </p>
                <p>
                  <strong className="text-foreground">Non-Refundable:</strong> Unused notarizations expire at the end of each contract period (monthly or annually) and are strictly non-refundable. No credits or rollovers are provided.
                </p>
                <p>
                  <strong className="text-foreground">Termination:</strong> Either party may terminate retainer agreements with 30 days written notice. Upon termination, no refund will be provided for unused notarizations in the current billing period. Outstanding balances become immediately due.
                </p>
                <p>
                  <strong className="text-foreground">Price Changes:</strong> We reserve the right to modify retainer pricing upon 60 days written notice. Changes apply to renewal periods only, not current contract periods.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">18. Apostille Services - Special Limitations</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  <strong className="text-foreground">Critical Understanding:</strong> Notaries public in Pennsylvania CANNOT and DO NOT issue apostilles. Only the Pennsylvania Department of State is legally authorized to authenticate documents with apostilles under the Hague Convention.
                </p>
                <p>
                  <strong className="text-foreground">Our Limited Role:</strong> Our "apostille services" consist solely of: (1) notarizing your document if notarization is required for apostille eligibility; (2) assisting with completion of Pennsylvania Department of State apostille application forms; (3) submitting your documents to the Department of State on your behalf (if requested); and (4) coordinating return delivery.
                </p>
                <p>
                  <strong className="text-foreground">No Guarantees:</strong> We make NO guarantee that the Pennsylvania Department of State will issue an apostille for your document. Apostille issuance is entirely at the discretion of the Department of State. We are not liable for denial, delay, or rejection of apostille applications. Processing times quoted are estimates based on typical Department of State turnaround and are not guaranteed. State processing fees are separate and payable directly to the Department of State.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">19. Legal Compliance and Regulatory Information</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  All services are provided in strict compliance with:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>57 Pa.C.S. Chapter 3 (Pennsylvania Revised Uniform Law on Notarial Acts - RULONA)</li>
                  <li>Act 79 of 2020 (Remote Online Notarization Authorization in Pennsylvania)</li>
                  <li>Pennsylvania Department of State Notary Division regulations</li>
                  <li>National Notary Association Standards of Practice</li>
                  <li>Hague Convention Abolishing the Requirement of Legalization for Foreign Public Documents (for apostille services)</li>
                  <li>All applicable federal and state privacy, data security, and consumer protection laws</li>
                </ul>
                <p className="mt-4">
                  <strong className="text-foreground">Notary Commission Information:</strong> All notarial acts are performed by commissioned Pennsylvania notaries public. Pennsylvania Notary Public Commission #{COMMISSION_INFO.commissionNumber}, expires {COMMISSION_INFO.commissionExpires}, commissioned in {COMMISSION_INFO.county}. Bonded: {COMMISSION_INFO.bondAmount}. E&O Insurance: {COMMISSION_INFO.eoInsurance}. RON Authorized: {COMMISSION_INFO.ronAuthorized} (Platforms: {COMMISSION_INFO.ronPlatforms.join(", ")}). Commission information appears on all notarial certificates.
                </p>
                <p>
                  <strong className="text-foreground">Errors and Omissions Insurance:</strong> As required by Pennsylvania law, our notaries maintain errors and omissions insurance coverage. Insurance information is available upon written request.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">20. Modifications to Terms</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We reserve the right to modify, amend, or update these Terms of Service at any time in our sole discretion. Changes will be effective immediately upon posting the revised Terms on our website. The "Last Updated" date at the top of this document reflects the most recent revision.
                </p>
                <p>
                  <strong className="text-foreground">Your Continued Use Constitutes Acceptance:</strong> Your continued access to or use of services following the posting of changes constitutes your binding acceptance of such changes. If you do not agree to modified Terms, you must immediately discontinue all use of services.
                </p>
                <p>
                  <strong className="text-foreground">Material Changes:</strong> For material changes to these Terms (as determined in our sole discretion), we will provide reasonable advance notice by email (if you have provided an email address) or by prominent notice on our website. However, you are responsible for regularly reviewing these Terms for any changes.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">21. Termination</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  <strong className="text-foreground">Termination by Company:</strong> We reserve the right to suspend, restrict, or terminate your access to services immediately, without prior notice or liability, for any reason or no reason, including but not limited to: violation of these Terms, suspected fraud or illegal activity, non-payment of fees, abusive conduct toward notaries or staff, or any conduct we deem harmful to our business, other users, or third parties.
                </p>
                <p>
                  <strong className="text-foreground">Termination by You:</strong> You may cease using services at any time. Termination does not relieve you of obligations to pay outstanding fees or affect completed transactions.
                </p>
                <p>
                  <strong className="text-foreground">Effect of Termination:</strong> Upon termination: (1) your right to use services immediately ceases; (2) we are not obligated to provide refunds for prepaid but unused services unless required by law; (3) provisions of these Terms that by their nature should survive termination shall survive, including but not limited to: ownership provisions, warranty disclaimers, indemnification, limitations of liability, dispute resolution, and arbitration provisions.
                </p>
                <p>
                  <strong className="text-foreground">Post-Termination Access to Records:</strong> Even after termination, we will maintain notarization records as required by Pennsylvania law. You may request copies of your records subject to our record access policies and applicable fees.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">22. Severability and Waiver</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  <strong className="text-foreground">Severability:</strong> If any provision of these Terms is held by a court or arbitrator of competent jurisdiction to be invalid, illegal, or unenforceable, such provision shall be modified to the minimum extent necessary to make it valid and enforceable while preserving its intent, or if such modification is not possible, the provision shall be severed from these Terms. The validity, legality, and enforceability of the remaining provisions shall not be affected or impaired in any way.
                </p>
                <p>
                  <strong className="text-foreground">Waiver:</strong> No waiver by Notroom LLC of any term or condition of these Terms shall be deemed a further or continuing waiver of such term or any other term. Any failure by us to assert a right or provision under these Terms does not constitute a waiver of such right or provision. All waivers must be in writing and signed by an authorized representative of Notroom LLC.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">23. Entire Agreement and Assignment</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  <strong className="text-foreground">Entire Agreement:</strong> These Terms of Service, together with our Privacy Policy and any additional terms presented during the service transaction, constitute the entire agreement between you and Notroom LLC regarding use of our services and supersede all prior or contemporaneous understandings, agreements, representations, and warranties, both written and oral, regarding services.
                </p>
                <p>
                  <strong className="text-foreground">Assignment:</strong> You may not assign, transfer, or delegate these Terms or your rights and obligations hereunder without our prior written consent. We may assign these Terms or our rights hereunder at any time without notice or consent. These Terms bind and inure to the benefit of each party's permitted successors and assigns.
                </p>
                <p>
                  <strong className="text-foreground">No Agency Relationship:</strong> Nothing in these Terms creates any agency, partnership, joint venture, employment, or franchisee relationship between you and Notroom LLC. You have no authority to bind us or make commitments on our behalf.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">24. Contact Information and Legal Notices</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  For questions, concerns, or legal notices regarding these Terms of Service, contact us at:
                </p>
                <div className="bg-muted/30 p-4 rounded-lg text-sm">
                  <p className="font-bold text-foreground mb-2">Notroom LLC</p>
                  <p>Legal Department</p>
                  <p>Phone: (814) 480-0989</p>
                  <p>Email: legal@notroom.com</p>
                  <p>General Support: support@notroom.com</p>
                  <p>Service Area: Erie, PA & Surrounding Areas</p>
                </div>
                <p className="text-sm">
                  <strong className="text-foreground">Legal Notices:</strong> All legal notices must be sent to the address above via certified mail, return receipt requested, or via email to legal@notroom.com. Notices are deemed effective upon receipt or 3 business days after mailing, whichever is earlier.
                </p>
                <p className="text-sm">
                  <strong className="text-foreground">Language:</strong> These Terms are drafted in English. Any translation is provided for convenience only. In the event of conflict between English and translated versions, the English version shall prevail.
                </p>
              </div>
            </Card>

            <Card className="p-6 bg-muted/30 border-primary">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  BY USING OUR SERVICES, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS OF SERVICE IN THEIR ENTIRETY.
                </p>
                <p className="text-xs text-muted-foreground">
                  Document Version: 2.0 | Last Updated: January 2025 | © 2025 Notroom LLC. All rights reserved.
                </p>
              </div>
            </Card>

          </div>
        </div>
      </section>
    </SigningLayout>
  );
};

export default TermsOfService;
