import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Phone, ChevronDown } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useNavigate, useLocation } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import notroomLogo from "@/assets/notroom-logo.png";

const SigningHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogoClick = () => {
    navigate("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navigateToPage = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  const forTitleCompanies = [
    { label: "Service Tiers", path: "/services", desc: "Standard, Priority & Rescue options" },
    { label: "Coverage Map", path: "/coverage", desc: "50-state in-person & RON coverage" },
    { label: "Pricing", path: "/pricing", desc: "Transparent fee schedules" },
    { label: "Start a Pilot", path: "/contact", desc: "First 10 signings free" },
  ];

  const forNotaries = [
    { label: "Why Join Notroom", path: "/for-notaries", desc: "Benefits, tiers & requirements" },
    { label: "Apply Now", path: "/apply", desc: "Join the elite notary network" },
  ];

  const company = [
    { label: "About Notroom", path: "/about", desc: "Our mission & story" },
    { label: "Contact Us", path: "/contact", desc: "Get in touch" },
    { label: "Erie Local Services", path: "/local", desc: "PA local notary services" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 max-w-full ${
        isScrolled
          ? "bg-slate-900/98 backdrop-blur-md shadow-lg border-b border-slate-700/50"
          : "bg-slate-900/80 backdrop-blur-sm"
      }`}
      role="banner"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <button
            onClick={handleLogoClick}
            className="hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded flex items-center gap-3"
            aria-label="Notroom home"
          >
            <img 
              src={notroomLogo} 
              alt="Notroom logo" 
              className="h-10 brightness-0 invert" 
              width="120" 
              height="40"
              fetchPriority="high"
            />
            <span className="hidden sm:inline text-xs font-bold text-white uppercase tracking-wider">
              Signing<br />Services
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
            <NavigationMenu>
              <NavigationMenuList>
                {/* For Title Companies Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger 
                    className="text-slate-200 hover:text-white focus:text-white font-medium bg-transparent hover:bg-white/10"
                    aria-label="For Title Companies menu"
                  >
                    For Title Companies
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="bg-slate-800/98 backdrop-blur-md border border-slate-700 shadow-xl z-[100]">
                    <ul className="grid w-[400px] gap-2 p-4" role="menu">
                      {forTitleCompanies.map((item) => (
                        <li key={item.path} role="none">
                          <NavigationMenuLink asChild>
                            <button
                              onClick={() => navigateToPage(item.path)}
                              className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-slate-700 focus:bg-slate-700 w-full text-left"
                              role="menuitem"
                            >
                              <div className="text-sm font-medium text-white leading-none">{item.label}</div>
                              <p className="text-xs text-slate-400 leading-snug mt-1">
                                {item.desc}
                              </p>
                            </button>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* For Notaries Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger 
                    className="text-slate-200 hover:text-white focus:text-white font-medium bg-transparent hover:bg-white/10"
                    aria-label="For Notaries menu"
                  >
                    For Notaries
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="bg-slate-800/98 backdrop-blur-md border border-slate-700 shadow-xl z-[100]">
                    <ul className="grid w-[400px] gap-2 p-4" role="menu">
                      {forNotaries.map((item) => (
                        <li key={item.path} role="none">
                          <NavigationMenuLink asChild>
                            <button
                              onClick={() => navigateToPage(item.path)}
                              className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-slate-700 focus:bg-slate-700 w-full text-left"
                              role="menuitem"
                            >
                              <div className="text-sm font-medium text-white leading-none">{item.label}</div>
                              <p className="text-xs text-slate-400 leading-snug mt-1">
                                {item.desc}
                              </p>
                            </button>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Company Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger 
                    className="text-slate-200 hover:text-white focus:text-white font-medium bg-transparent hover:bg-white/10"
                    aria-label="Company menu"
                  >
                    Company
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="bg-slate-800/98 backdrop-blur-md border border-slate-700 shadow-xl z-[100]">
                    <ul className="grid w-[350px] gap-2 p-4" role="menu">
                      {company.map((item) => (
                        <li key={item.path} role="none">
                          <NavigationMenuLink asChild>
                            <button
                              onClick={() => navigateToPage(item.path)}
                              className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-slate-700 focus:bg-slate-700 w-full text-left"
                              role="menuitem"
                            >
                              <div className="text-sm font-medium text-white leading-none">{item.label}</div>
                              <p className="text-xs text-slate-400 leading-snug mt-1">
                                {item.desc}
                              </p>
                            </button>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </nav>

          {/* Desktop CTA Section */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Phone Icon */}
            <a
              href="tel:814-480-0989"
              className="flex items-center justify-center w-10 h-10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-500"
              aria-label="Call us at 814-480-0989"
            >
              <Phone className="w-5 h-5" />
            </a>

            {/* Client Login */}
            <button
              onClick={() => navigateToPage("/portal")}
              className="text-sm text-slate-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded px-3 py-2"
              aria-label="Client login"
            >
              Client Login
            </button>

            {/* Primary CTAs */}
            <Button
              variant="outline"
              onClick={() => navigateToPage("/apply")}
              className="border-white/50 text-white hover:bg-white/10 hover:border-white font-semibold"
              aria-label="Join as a notary vendor"
            >
              Join Network
            </Button>
            
            <Button
              onClick={() => navigateToPage("/contact")}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-lg shadow-cyan-500/25"
              aria-label="Request a demo or start pilot"
            >
              Start Pilot
            </Button>
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button 
                variant="ghost" 
                size="icon"
                className="text-white hover:bg-white/10"
                aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] bg-slate-900 border-slate-700 overflow-y-auto">
              <nav className="flex flex-col gap-6 mt-8" aria-label="Mobile navigation">
                <div className="mb-4">
                  <img 
                    src={notroomLogo} 
                    alt="Notroom logo" 
                    className="h-10 brightness-0 invert" 
                    width="120" 
                    height="40"
                    loading="lazy"
                  />
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                    Signing Services
                  </span>
                </div>

                {/* Primary CTAs */}
                <div className="space-y-3">
                  <Button
                    onClick={() => navigateToPage("/contact")}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold"
                  >
                    Start Your Pilot
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigateToPage("/apply")}
                    className="w-full border-cyan-500 text-cyan-400"
                  >
                    Join Network
                  </Button>
                </div>

                {/* Phone */}
                <a
                  href="tel:814-480-0989"
                  className="flex items-center gap-2 text-lg font-semibold text-white hover:text-cyan-400 transition-colors p-2"
                >
                  <Phone className="w-5 h-5" />
                  (814) 480-0989
                </a>

                <div className="border-t border-slate-700 pt-4">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    For Title Companies
                  </h3>
                  <div className="flex flex-col gap-2 pl-2">
                    {forTitleCompanies.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => navigateToPage(item.path)}
                        className="text-left text-sm text-slate-300 hover:text-white transition-colors py-2"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    For Notaries
                  </h3>
                  <div className="flex flex-col gap-2 pl-2">
                    {forNotaries.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => navigateToPage(item.path)}
                        className="text-left text-sm text-slate-300 hover:text-white transition-colors py-2"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Company
                  </h3>
                  <div className="flex flex-col gap-2 pl-2">
                    {company.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => navigateToPage(item.path)}
                        className="text-left text-sm text-slate-300 hover:text-white transition-colors py-2"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default SigningHeader;

