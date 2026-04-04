import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import BackToTop from "./BackToTop";
import ScrollProgress from "./ScrollProgress";
import { Button } from "./ui/button";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  const scrollToBooking = () => {
    if (isHomePage) {
      const element = document.getElementById("booking-form");
      if (!element) return;

      const headerHeight = 80;
      const additionalOffset = 20;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerHeight - additionalOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    } else {
      window.location.href = "/#booking-form";
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden max-w-full" lang="en">
      {/* Skip Navigation Links - WCAG 2.1 AA Compliance */}
      <div className="sr-only">
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          Skip to main content
        </a>
        <a 
          href="#main-navigation" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-48 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          Skip to navigation
        </a>
        <a 
          href="#footer-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-96 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          Skip to footer
        </a>
      </div>

      <ScrollProgress aria-hidden="true" />
      <Header />
      
      <main id="main-content" role="main" aria-label="Main content" className="pt-20">
        {children}
      </main>
      
      <Footer />
      <BackToTop />
      
      {/* Mobile Sticky CTA - Enhanced with urgency and optimal touch target */}
      <div 
        className="fixed bottom-0 left-0 right-0 p-3 bg-background/95 backdrop-blur-sm border-t border-border lg:hidden z-50 shadow-2xl max-w-full"
        role="region"
        aria-label="Quick booking action"
      >
        <Button 
          variant="amber"
          className="w-full shadow-lg focus:ring-2 focus:ring-primary focus:ring-offset-2 font-bold py-6 min-h-[56px] touch-manipulation"
          size="lg"
          onClick={scrollToBooking}
          aria-label="Book a service now - starting from $60"
        >
          <span className="flex items-center justify-center gap-2">
            📅 Book Now - From $60
            <span className="text-xs font-normal opacity-90">• Same-day available</span>
          </span>
        </Button>
      </div>
    </div>
  );
};

export default Layout;
