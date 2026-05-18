import { ReactNode } from "react";
import SigningHeader from "./SigningHeader";
import SigningFooter from "./SigningFooter";
import BackToTop from "./BackToTop";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";

interface SigningLayoutProps {
  children: ReactNode;
}

const SigningLayout = ({ children }: SigningLayoutProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen overflow-x-hidden max-w-full bg-slate-950" lang="en">
      {/* Skip Navigation Links */}
      <div className="sr-only">
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-cyan-500 focus:text-white focus:rounded-md"
        >
          Skip to main content
        </a>
        <a 
          href="#main-navigation" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-48 focus:z-50 focus:px-4 focus:py-2 focus:bg-cyan-500 focus:text-white focus:rounded-md"
        >
          Skip to navigation
        </a>
        <a 
          href="#footer-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-96 focus:z-50 focus:px-4 focus:py-2 focus:bg-cyan-500 focus:text-white focus:rounded-md"
        >
          Skip to footer
        </a>
      </div>

      <SigningHeader />
      
      <main id="main-content" role="main" aria-label="Main content">
        {children}
      </main>
      
      <SigningFooter />
      <BackToTop />
      
      {/* Mobile Sticky CTA - For B2B conversion */}
      <div 
        className="fixed bottom-0 left-0 right-0 p-3 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700 lg:hidden z-50 shadow-2xl"
        role="region"
        aria-label="Quick actions"
      >
        <div className="flex gap-2">
          <Button 
            variant="outline"
            className="flex-1 border-cyan-500 text-cyan-400 font-semibold py-5"
            onClick={() => navigate("/apply")}
            aria-label="Join our notary network"
          >
            Join Network
          </Button>
          <Button 
            className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-5 shadow-lg shadow-cyan-500/25"
            onClick={() => navigate("/contact")}
            aria-label="Start your free pilot"
          >
            Start Pilot
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SigningLayout;

