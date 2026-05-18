import { Mail, Phone, Globe2 } from "lucide-react";
import notroomLogo from "@/assets/notroom-logo.png";
import { useNavigate } from "react-router-dom";

const SigningFooter = () => {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();

  const navigateToPage = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-slate-900 text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img 
                src={notroomLogo} 
                alt="Notroom logo" 
                className="h-10 brightness-0 invert" 
                width="120" 
                height="40"
                loading="lazy"
              />
            </div>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              National signing service operations. 50-state coverage. 
              3-minute confirmation. 98%+ first-pass funding.
            </p>
            <div className="space-y-3">
              <a
                href="tel:814-480-0989"
                className="flex items-center gap-2 text-slate-300 hover:text-cyan-400 transition-colors text-sm"
              >
                <Phone className="w-4 h-4" />
                (814) 480-0989
              </a>
              <a
                href="mailto:closings@notroom.com"
                className="flex items-center gap-2 text-slate-300 hover:text-cyan-400 transition-colors text-sm"
              >
                <Mail className="w-4 h-4" />
                closings@notroom.com
              </a>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Globe2 className="w-4 h-4" />
                50-State Coverage
              </div>
            </div>
          </div>

          {/* For Title Companies */}
          <div>
            <h4 className="font-bold mb-4 text-lg text-white">For Title Companies</h4>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={() => navigateToPage("/services")} 
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Service Tiers
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateToPage("/coverage")} 
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Coverage Map
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateToPage("/services")} 
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Pricing & Tiers
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateToPage("/contact")} 
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Start a Pilot
                </button>
              </li>
            </ul>
          </div>

          {/* For Notaries */}
          <div>
            <h4 className="font-bold mb-4 text-lg text-white">For Notaries</h4>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={() => navigateToPage("/for-notaries")} 
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Why Join Notroom
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateToPage("/apply")} 
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Apply Now
                </button>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold mb-4 text-lg text-white">Company</h4>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={() => navigateToPage("/about")} 
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  About Notroom
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateToPage("/contact")} 
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Contact Us
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateToPage("/local")} 
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Erie Local Services
                </button>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-bold mb-4 text-lg text-white">Resources</h4>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={() => navigateToPage("/resources/how-ron-works")} 
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  How RON Works
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateToPage("/calculator")} 
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Price Calculator
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateToPage("/portal")} 
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Client Portal
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="mt-16 pt-8 border-t border-slate-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-cyan-400">3<span className="text-lg">min</span></div>
              <div className="text-sm text-slate-500">Avg. Confirmation</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-cyan-400">98%<span className="text-lg">+</span></div>
              <div className="text-sm text-slate-500">First-Pass Funding</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-cyan-400">50</div>
              <div className="text-sm text-slate-500">States Covered</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-cyan-400">2-7<span className="text-lg">day</span></div>
              <div className="text-sm text-slate-500">Vendor Pay</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <div className="text-slate-500 text-sm text-center md:text-left">
              <div>© {currentYear} Notroom LLC. All rights reserved.</div>
              <div className="text-xs mt-1">
                National Signing Service Operations • PA HQ
              </div>
            </div>

            {/* Legal Links */}
            <div className="flex gap-6">
              <button 
                onClick={() => navigateToPage("/privacy-policy")} 
                className="text-slate-500 hover:text-white text-sm transition-colors"
              >
                Privacy
              </button>
              <button 
                onClick={() => navigateToPage("/terms-of-service")} 
                className="text-slate-500 hover:text-white text-sm transition-colors"
              >
                Terms
              </button>
              <button 
                onClick={() => navigateToPage("/legal/agreements")} 
                className="text-slate-500 hover:text-white text-sm transition-colors"
              >
                Agreements
              </button>
            </div>

            {/* Compliance Badges */}
            <div className="flex gap-3 flex-wrap justify-center">
              <div className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-400">
                NNA Certified
              </div>
              <div className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-400">
                E&O Insured
              </div>
              <div className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-400">
                Background Checked
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SigningFooter;
