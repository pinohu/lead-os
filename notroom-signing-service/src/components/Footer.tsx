import { Mail, Phone, MapPin } from "lucide-react";
import notroomLogo from "@/assets/notroom-logo.png";
import { useNavigate } from "react-router-dom";
import nsaBadge from "@/assets/nsa_member_badge.png";
import nnaMemberBadge from "@/assets/nna_member_badge.png";
import panMemberBadge from "@/assets/pan_member_badge.png";
import nngUxcBadge from "@/assets/nng_uxc_badge.png";
import { siteConfig } from "@/constants/siteConfig";
import { COMMISSION_INFO } from "@/constants/commission";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();

  const navigateToPage = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-[hsl(var(--neutral-dark))] text-primary-foreground">
      {/* Footer Top */}
    <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <img 
              src={notroomLogo} 
              alt="Notroom logo" 
              className="h-10 mb-3 brightness-0 invert" 
              width="120" 
              height="40"
              loading="lazy"
            />
            <p className="text-primary-foreground/70 mb-4 text-sm">
              Erie's Most Trusted Notary Service
            </p>
            <div className="flex gap-4">
              <a 
                href="https://facebook.com/notroom" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary-foreground/70 hover:text-primary-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded px-1"
                aria-label="Visit Notroom on Facebook (opens in new tab)"
              >
                Facebook
              </a>
              <a 
                href="https://linkedin.com/company/notroom" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary-foreground/70 hover:text-primary-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded px-1"
                aria-label="Visit Notroom on LinkedIn (opens in new tab)"
              >
                LinkedIn
              </a>
            </div>
          </div>

          {/* Business Services Column */}
          <div>
            <h4 className="font-bold mb-4 text-lg">Business Services</h4>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => navigateToPage("/crop")} 
                  className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-primary rounded px-1"
                  aria-label="Learn about Registered Office & CROP services"
                >
                  Registered Office & CROP
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateToPage("/transaction-coordination")} 
                  className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-primary rounded px-1"
                  aria-label="Learn about Transaction Coordination services"
                >
                  Transaction Coordination
                </button>
              </li>
              <li>
                <button onClick={() => navigateToPage("/services/registered-office")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  LLC & Entity Setup Support
                </button>
              </li>
              <li>
                <button onClick={() => navigateToPage("/services/business-retainer")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Business Retainer Plans
                </button>
              </li>
            </ul>
          </div>

          {/* Services Column 1 */}
          <div>
            <h4 className="font-bold mb-4 text-lg">Core Services</h4>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => navigateToPage("/services/remote-online-notary")} 
                  className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-primary rounded px-1"
                  aria-label="Learn about Remote Online Notary services"
                >
                  Remote Online Notary
                </button>
              </li>
              <li>
                <button onClick={() => navigateToPage("/services/mobile-notary")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Mobile Notary
                </button>
              </li>
              <li>
                <button onClick={() => navigateToPage("/services/loan-signing-agent")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Loan Signing Agent
                </button>
              </li>
              <li>
                <button onClick={() => navigateToPage("/services/healthcare-facility")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Healthcare Facilities
                </button>
              </li>
              <li>
                <button onClick={() => navigateToPage("/services/apostille")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Apostille Services
                </button>
              </li>
              <li>
                <button onClick={() => navigateToPage("/services/i9-verification")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  I-9 Verification
                </button>
              </li>
            </ul>
          </div>

          {/* Services Column 2 */}
          <div>
            <h4 className="font-bold mb-4 text-lg">Additional Services</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => navigateToPage("/services/certified-copies")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Certified Copies
                </button>
              </li>
              <li>
              </li>
              <li>
              </li>
              <li>
                <button onClick={() => navigateToPage("/services/witness-service")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Witness Service
                </button>
              </li>
              <li>
                <button onClick={() => navigateToPage("/services/passport-photos")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Passport Photos
                </button>
              </li>
              <li>
                <button onClick={() => navigateToPage("/services/translation-certification")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Translation Certification
                </button>
              </li>
              <li>
                <button onClick={() => navigateToPage("/services/vehicle-title-transfer")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Vehicle Title Transfer
                </button>
              </li>
              <li>
                <button onClick={() => navigateToPage("/services/virtual-mailbox")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Virtual Mailbox
                </button>
              </li>
              <li>
                <button onClick={() => navigateToPage("/services/ucc-filing")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  UCC Filing
                </button>
              </li>
              <li>
                <button onClick={() => navigateToPage("/services/document-retrieval")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Document Retrieval
                </button>
              </li>
            </ul>
          </div>

          {/* Service Areas Column */}
          <div>
            <h4 className="font-bold mb-4 text-lg">Counties</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => navigateToPage("/areas/erie-county")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm font-medium">
                  Erie County
                </button>
              </li>
              <li>
                <button onClick={() => navigateToPage("/areas/crawford-county")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm font-medium">
                  Crawford County
                </button>
              </li>
              <li>
                <button onClick={() => navigateToPage("/areas/warren-county")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm font-medium">
                  Warren County
                </button>
              </li>
              <li>
                <button onClick={() => navigateToPage("/areas/mercer-county")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm font-medium">
                  Mercer County
                </button>
              </li>
              <li>
                <button onClick={() => navigateToPage("/areas/venango-county")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm font-medium">
                  Venango County
                </button>
              </li>
              <li>
                <button onClick={() => navigateToPage("/areas/statewide-online")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm font-medium">
                  Statewide Online
                </button>
              </li>
            </ul>
          </div>

          {/* Major Cities Column */}
          <div>
            <h4 className="font-bold mb-4 text-lg">Major Cities</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => navigateToPage("/areas/erie-pa")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Erie
                </button>
              </li>
              <li>
                <button onClick={() => navigateToPage("/areas/meadville-pa")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Meadville
                </button>
              </li>
              <li>
                <button onClick={() => navigateToPage("/areas/warren-pa")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Warren
                </button>
              </li>
              <li>
                <button onClick={() => navigateToPage("/areas/oil-city-pa")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Oil City
                </button>
              </li>
              <li>
                <button onClick={() => navigateToPage("/areas/sharon-pa")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Sharon
                </button>
              </li>
              <li>
                <button onClick={() => navigateToPage("/areas/titusville-pa")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Titusville
                </button>
              </li>
              <li>
                <button onClick={() => navigateToPage("/areas/hermitage-pa")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Hermitage
                </button>
              </li>
              <li>
                <button onClick={() => navigateToPage("/areas/grove-city-pa")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Grove City
                </button>
              </li>
              <li>
                <button onClick={() => navigateToPage("/areas/edinboro-pa")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Edinboro
                </button>
              </li>
              <li>
                <button onClick={() => navigateToPage("/areas/corry-pa")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Corry
                </button>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h4 className="font-bold mb-4 text-lg">Resources</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => navigateToPage("/resources/how-ron-works")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  How RON Works
                </button>
              </li>
              <li>
                <button onClick={() => { navigate("/"); setTimeout(() => document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" }), 100); }} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  FAQ
                </button>
              </li>
              <li>
                <button onClick={() => navigateToPage("/pricing")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Pricing
                </button>
              </li>
              <li>
                <button onClick={() => navigateToPage("/calculator")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Price Calculator
                </button>
              </li>
              <li>
                <button onClick={() => navigateToPage("/subscriptions")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Subscription Plans
                </button>
              </li>
              <li>
                <button onClick={() => navigateToPage("/track-booking")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Track Booking
                </button>
              </li>
              <li>
                <button onClick={() => navigateToPage("/legal/agreements")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Service Agreements
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="font-bold mb-4 text-lg">Contact</h4>
            <ul className="space-y-3">
              <li>
                <a 
                  href="tel:814-480-0989" 
                  className="flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-primary rounded px-1"
                  aria-label="Call Notroom at 814-480-0989"
                >
                  <Phone className="w-4 h-4" aria-hidden="true" />
                  (814) 480-0989
                </a>
              </li>
              <li>
                <a 
                  href="mailto:support@notroom.com" 
                  className="flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-primary rounded px-1"
                  aria-label="Email Notroom at support@notroom.com"
                >
                  <Mail className="w-4 h-4" aria-hidden="true" />
                  support@notroom.com
                </a>
              </li>
              <li>
                <div className="flex items-start gap-2 text-primary-foreground/70 text-sm">
                  <MapPin className="w-4 h-4 mt-1 flex-shrink-0" aria-hidden="true" />
                  <span>Serving Erie, PA & Surrounding Areas</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Certifications Column */}
          <div>
            <h4 className="font-bold mb-4 text-lg">Certifications</h4>
            <div className="flex flex-wrap gap-3">
              <a 
                href="https://www.nationalnotary.org/knowledge-center/signing-agent-resources"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform hover:scale-105"
                aria-label="Certified NNA Notary Signing Agent 2025"
              >
                <img 
                  src={nsaBadge}
                  alt="Certified NNA Notary Signing Agent 2025" 
                  width="60" 
                  height="60"
                  title="Certified NNA Notary Signing Agent 2025"
                  className="object-contain"
                  loading="lazy"
                />
              </a>
              <a 
                href="https://www.nationalnotary.org"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform hover:scale-105"
                aria-label="National Notary Association Member"
              >
                <img 
                  src={nnaMemberBadge}
                  alt="National Notary Association Member" 
                  width="60" 
                  height="60"
                  title="National Notary Association Member"
                  className="object-contain"
                  loading="lazy"
                />
              </a>
              <a 
                href="https://panotary.org"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform hover:scale-105"
                aria-label="Pennsylvania Association of Notaries Member"
              >
                <img 
                  src={panMemberBadge}
                  alt="Pennsylvania Association of Notaries Member" 
                  width="60" 
                  height="60"
                  title="Pennsylvania Association of Notaries Member"
                  className="object-contain"
                  loading="lazy"
                />
              </a>
              <a 
                href="https://www.nngroup.com/ux-certification/"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform hover:scale-105"
                aria-label="Nielsen Norman Group UX Certified"
              >
                <img 
                  src={nngUxcBadge}
                  alt="Nielsen Norman Group UX Certified" 
                  width="60" 
                  height="60"
                  title="Nielsen Norman Group UX Certified"
                  className="object-contain"
                  loading="lazy"
                />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Legal Compliance Section - Minimized for Production */}
      <div className="border-t border-border/10 bg-muted/5">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-6xl mx-auto">
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground transition-colors font-medium">
                📋 Legal Credentials & Compliance Information
              </summary>
              <div className="mt-4 space-y-2 text-xs bg-muted/10 p-4 rounded">
                <p><strong>Pennsylvania Notary Public</strong></p>
                <p>Commission #{COMMISSION_INFO.commissionNumber}</p>
                <p>Commission Expires: {COMMISSION_INFO.commissionExpires}</p>
                <p>Commissioned in {COMMISSION_INFO.county}</p>
                <p>Bonded: {COMMISSION_INFO.bondAmount}</p>
                <p>E&O Insurance: {COMMISSION_INFO.eoInsurance}</p>
                <p>RON Authorized: {COMMISSION_INFO.ronAuthorized}</p>
                <p>RON Platforms: {COMMISSION_INFO.ronPlatforms.join(", ")}</p>
                <p className="mt-2 pt-2 border-t border-border/20">• Background Checked | NNA Certified</p>
                <p>• Operating under Pennsylvania law (57 Pa.C.S. § 321 et seq.)</p>
              </div>
            </details>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="border-t border-border/10" id="footer-content">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright & Trademark */}
            <div className="text-primary-foreground/60 text-sm text-center md:text-left">
              <div>© {currentYear} Notroom LLC. All rights reserved.</div>
              <div className="text-xs mt-1">
                "Notroom" is a trademark of Notroom LLC. Unauthorized use prohibited.
              </div>
            </div>

            {/* Legal Links */}
            <div className="flex gap-6" role="navigation" aria-label="Legal information">
              <button 
                onClick={() => navigateToPage("/privacy-policy")} 
                className="text-primary-foreground/60 hover:text-primary-foreground text-sm transition-colors underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                aria-label="View privacy policy"
              >
                Privacy Policy
              </button>
              <button 
                onClick={() => navigateToPage("/terms-of-service")} 
                className="text-primary-foreground/60 hover:text-primary-foreground text-sm transition-colors underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                aria-label="View terms of service"
              >
                Terms of Service
              </button>
              <button 
                onClick={() => navigateToPage("/sitemap")} 
                className="text-primary-foreground/60 hover:text-primary-foreground text-sm transition-colors underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                aria-label="View site map"
              >
                Sitemap
              </button>
            </div>

            {/* Badges */}
            <div className="flex gap-3 flex-wrap justify-center" role="list" aria-label="Compliance certifications">
              <div className="px-3 py-1 bg-background/10 rounded-full text-xs font-semibold" role="listitem">
                PA State Licensed
              </div>
              <div className="px-3 py-1 bg-background/10 rounded-full text-xs font-semibold" role="listitem">
                Background Checked
              </div>
              <div className="px-3 py-1 bg-background/10 rounded-full text-xs font-semibold" role="listitem">
                RULONA Compliant
              </div>
            </div>
          </div>

          {/* E-Sign Act & AML Disclaimer */}
          <div className="mt-6 pt-6 border-t border-border/10 max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-4 text-xs text-primary-foreground/50">
              <div>
                <strong className="text-primary-foreground/70">E-Sign Act Compliance:</strong> Electronic signatures 
                and records provided through our RON services comply with the Electronic Signatures in Global and 
                National Commerce Act (15 U.S.C. § 7001) and Pennsylvania RULONA (57 Pa.C.S. § 301 et seq.). 
                Electronic signatures have the same legal effect as handwritten signatures.
              </div>
              <div>
                <strong className="text-primary-foreground/70">AML & Financial Crimes Prevention:</strong> We maintain 
                procedures to detect and prevent money laundering in compliance with FinCEN guidelines. We reserve 
                the right to refuse service, request additional identification, and report suspicious activity to 
                appropriate authorities without prior notice.
              </div>
            </div>
          </div>

          {/* CCPA Link */}
          <div className="mt-4 text-center">
            <button 
              onClick={() => navigateToPage("/privacy-policy#ccpa")} 
              className="text-xs text-primary-foreground/60 hover:text-primary-foreground underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-2 py-1"
              aria-label="California privacy rights - Do not sell my personal information"
            >
              Do Not Sell or Share My Personal Information (CCPA)
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
