import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Search, ArrowLeft, FileQuestion, Users, MapPin, FileText, Phone } from "lucide-react";
import SigningLayout from "@/components/SigningLayout";
import SEO from "@/components/SEO";
import { logger } from "@/utils/logger";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    logger.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const commonPages = [
    { path: "/", label: "Home", icon: Home },
    { path: "/services", label: "Service Tiers", icon: FileText },
    { path: "/coverage", label: "Coverage Map", icon: MapPin },
    { path: "/for-notaries", label: "Join Network", icon: Users },
    { path: "/about", label: "About Us" },
    { path: "/contact", label: "Contact", icon: Phone },
  ];

  return (
    <SigningLayout>
      <SEO
        title="404 - Page Not Found | Notroom"
        description="The page you're looking for doesn't exist. Return to Notroom's homepage or browse our services."
        canonical="https://notroom.com/404"
      />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white px-4 py-20 pt-32">
        <div className="max-w-2xl w-full text-center">
          {/* 404 Icon */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <FileQuestion className="w-24 h-24 text-slate-300" aria-hidden="true" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl font-bold text-slate-900">404</span>
              </div>
            </div>
          </div>

          {/* Main Message */}
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Page Not Found
          </h1>
          <p className="text-xl text-slate-600 mb-2">
            Oops! The page you're looking for doesn't exist.
          </p>
          <p className="text-slate-500 mb-8">
            The URL <code className="px-2 py-1 bg-slate-100 rounded text-sm font-mono">{location.pathname}</code> could not be found.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              onClick={() => navigate(-1)}
              variant="outline"
              className="min-h-[48px]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              Go Back
            </Button>
            <Button
              size="lg"
              asChild
              className="min-h-[48px] bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
            >
              <Link to="/">
                <Home className="w-4 h-4 mr-2" aria-hidden="true" />
                Return to Home
              </Link>
            </Button>
          </div>

          {/* Popular Pages */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-left shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-cyan-600" aria-hidden="true" />
              Popular Pages
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="list">
              {commonPages.map((page) => {
                const Icon = page.icon;
                return (
                  <li key={page.path} role="listitem">
                    <Link
                      to={page.path}
                      className="flex items-center gap-2 p-3 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 hover:text-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                    >
                      {Icon && <Icon className="w-4 h-4" aria-hidden="true" />}
                      <span>{page.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Help Text */}
          <p className="mt-8 text-sm text-slate-500">
            Need help? <Link to="/contact" className="text-cyan-600 hover:underline font-medium">Contact our support team</Link> or call <a href="tel:814-480-0989" className="text-cyan-600 hover:underline font-medium">(814) 480-0989</a>
          </p>
        </div>
      </div>
    </SigningLayout>
  );
};

export default NotFound;
