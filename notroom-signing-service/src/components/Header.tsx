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
import { siteConfig } from "@/constants/siteConfig";

const Header = () => {
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

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        scrollToElement(id);
      }, 150);
    } else {
      scrollToElement(id);
    }
  };

  const scrollToElement = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;

    const headerHeight = 80; // h-20
    const additionalOffset = 20;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerHeight - additionalOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  };

  const handleLogoClick = () => {
    navigate("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navigateToPage = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  const services = [
    { label: "Remote Online Notary (RON)", path: "/services/remote-online-notary", desc: "Notarize from anywhere via video" },
    { label: "Mobile Notary Service", path: "/services/mobile-notary", desc: "We come to your location" },
    { label: "Loan Signing Agent", path: "/services/loan-signing-agent", desc: "Certified for real estate closings" },
    { label: "Transaction Coordination", path: "/transaction-coordination", desc: "Professional multi-party transaction coordination" },
    { label: "Healthcare Facility Notary", path: "/services/healthcare-facility", desc: "Hospital, nursing home & hospice visits" },
    { label: "Apostille Services", path: "/services/apostille", desc: "International document authentication" },
    { label: "I-9 Verification", path: "/services/i9-verification", desc: "Employment verification for employers" },
    { label: "Certified Copies", path: "/services/certified-copies", desc: "Official document certification" },
    { label: "Professional Witness", path: "/services/witness-service", desc: "Neutral third-party witness" },
    { label: "Passport Photos", path: "/services/passport-photos", desc: "Government-compliant photos" },
    { label: "Translation Certification", path: "/services/translation-certification", desc: "Certified translation services" },
    { label: "Vehicle Title Transfer", path: "/services/vehicle-title-transfer", desc: "PA title notarization" },
    { label: "Virtual Mailbox", path: "/services/virtual-mailbox", desc: "Business address & mail handling" },
    { label: "UCC Filing", path: "/services/ucc-filing", desc: "UCC-1 filing assistance" },
    { label: "Document Retrieval", path: "/services/document-retrieval", desc: "Court & vital records retrieval" },
  ];

  const businessServices = [
    { 
      label: "Registered Office & CROP", 
      path: "/crop", 
      desc: siteConfig.isOfficialCropApproved
        ? "Approved PA CROP registered office services"
        : "CROP-ready PA registered office services"
    },
    { label: "Transaction Coordination", path: "/transaction-coordination", desc: "Professional multi-party transaction coordination" },
    { label: "LLC & Entity Setup Support", path: "/services/registered-office", desc: "Business formation & compliance assistance" },
    { label: "Business Retainer Plans", path: "/services/business-retainer", desc: "Volume discounts for companies" },
  ];

  const areas = [
    { 
      label: "Erie County", 
      path: "/areas/erie-county",
      cities: [
        { label: "Erie", path: "/areas/erie-pa" },
        { label: "Millcreek", path: "/areas/millcreek-pa" },
        { label: "Edinboro", path: "/areas/edinboro-pa" },
        { label: "North East", path: "/areas/north-east-pa" },
        { label: "Corry", path: "/areas/corry-pa" },
        { label: "Girard", path: "/areas/girard-pa" },
        { label: "Waterford", path: "/areas/waterford-pa" },
        { label: "Harborcreek", path: "/areas/harborcreek-pa" },
      ]
    },
    { 
      label: "Crawford County", 
      path: "/areas/crawford-county",
      cities: [
        { label: "Meadville", path: "/areas/meadville-pa" },
        { label: "Titusville", path: "/areas/titusville-pa" },
        { label: "Conneaut Lake", path: "/areas/conneaut-lake-pa" },
        { label: "Cambridge Springs", path: "/areas/cambridge-springs-pa" },
        { label: "Linesville", path: "/areas/linesville-pa" },
        { label: "Saegertown", path: "/areas/saegertown-pa" },
      ]
    },
    { 
      label: "Warren County", 
      path: "/areas/warren-county",
      cities: [
        { label: "Warren", path: "/areas/warren-pa" },
        { label: "Youngsville", path: "/areas/youngsville-pa" },
        { label: "Sheffield", path: "/areas/sheffield-pa" },
        { label: "Sugar Grove", path: "/areas/sugar-grove-pa" },
      ]
    },
    { 
      label: "Mercer County", 
      path: "/areas/mercer-county",
      cities: [
        { label: "Sharon", path: "/areas/sharon-pa" },
        { label: "Hermitage", path: "/areas/hermitage-pa" },
        { label: "Grove City", path: "/areas/grove-city-pa" },
        { label: "Greenville", path: "/areas/greenville-pa" },
        { label: "Mercer", path: "/areas/mercer-pa" },
      ]
    },
    { 
      label: "Venango County", 
      path: "/areas/venango-county",
      cities: [
        { label: "Oil City", path: "/areas/oil-city-pa" },
        { label: "Franklin", path: "/areas/franklin-pa" },
        { label: "Sugarcreek", path: "/areas/sugarcreek-pa" },
        { label: "Clintonville", path: "/areas/clintonville-pa" },
      ]
    },
    { 
      label: "Statewide Online", 
      path: "/areas/statewide-online",
      cities: []
    },
  ];

  const resources = [
    { label: "How RON Works", path: "/resources/how-ron-works", desc: "Learn about remote notarization" },
    { label: "Pricing Calculator", path: "/calculator", desc: "Estimate your service cost" },
    { label: "Subscription Plans", path: "/subscriptions", desc: "Volume discounts & retainers" },
    { label: "Track Booking", path: "/track-booking", desc: "Check your appointment status" },
    { label: "Service Agreements", path: "/legal/agreements", desc: "Legal agreements & templates" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 max-w-full ${
        isScrolled
          ? "bg-background/98 backdrop-blur-md shadow-lg border-b border-border/50"
          : "bg-background/80 backdrop-blur-sm shadow-sm"
      }`}
      role="banner"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <button
            onClick={handleLogoClick}
            className="hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary rounded"
            aria-label="Notroom home"
          >
            <img 
              src={notroomLogo} 
              alt="Notroom logo" 
              className="h-10" 
              width="120" 
              height="40"
              fetchPriority="high"
            />
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6" aria-label="Main navigation">
            <NavigationMenu>
              <NavigationMenuList>
                {/* Services Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger 
                    className="text-foreground hover:text-primary focus:text-primary font-medium bg-transparent hover:bg-accent/50"
                    aria-label="Services menu"
                  >
                    Services
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="bg-card/98 backdrop-blur-md border border-border shadow-xl z-[100]">
                    <ul className="grid w-[95vw] max-w-[500px] max-h-[70vh] overflow-y-auto gap-2 p-4 bg-card/98" role="menu">
                      {services.map((service) => (
                        <li key={service.path} role="none">
                          <NavigationMenuLink asChild>
                            <button
                              onClick={() => navigateToPage(service.path)}
                              className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground w-full text-left bg-card border border-border/50 hover:border-primary"
                              role="menuitem"
                            >
                              <div className="text-sm font-medium leading-none">{service.label}</div>
                              <p className="text-xs text-muted-foreground leading-snug mt-1">
                                {service.desc}
                              </p>
                            </button>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Business Services Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger 
                    className="text-foreground hover:text-primary focus:text-primary font-medium bg-transparent hover:bg-accent/50"
                    aria-label="Business services menu"
                  >
                    Business Services
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="bg-card/98 backdrop-blur-md border border-border shadow-xl z-[100]">
                    <ul className="grid w-[95vw] max-w-[400px] gap-2 p-4 bg-card/98" role="menu">
                      {businessServices.map((service) => (
                        <li key={service.path} role="none">
                          <NavigationMenuLink asChild>
                            <button
                              onClick={() => navigateToPage(service.path)}
                              className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground w-full text-left bg-card border border-border/50 hover:border-primary"
                              role="menuitem"
                            >
                              <div className="text-sm font-medium leading-none">{service.label}</div>
                              <p className="text-xs text-muted-foreground leading-snug mt-1">
                                {service.desc}
                              </p>
                            </button>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Service Areas Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger 
                    className="text-foreground hover:text-primary focus:text-primary font-medium bg-transparent hover:bg-accent/50"
                    aria-label="Service areas menu"
                  >
                    Service Areas
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="bg-card/98 backdrop-blur-md border border-border shadow-xl z-[100]">
                    <div className="w-[95vw] max-w-[700px] max-h-[70vh] overflow-y-auto p-4 bg-card/98">
                      <div className="grid md:grid-cols-3 gap-4">
                        {areas.map((area) => (
                          <div key={area.path} className="space-y-2">
                             <button
                              onClick={() => navigateToPage(area.path)}
                              className="block w-full text-left font-semibold text-sm hover:text-primary transition-colors p-2 rounded-md hover:bg-accent/50 bg-card border border-border/50 hover:border-primary"
                            >
                              {area.label} →
                            </button>
                            {area.cities && area.cities.length > 0 && (
                              <ul className="space-y-1 pl-2 border-l-2 border-border/50">
                                {area.cities.map((city) => (
                                  <li key={city.path}>
                                    <button
                                      onClick={() => navigateToPage(city.path)}
                                      className="block w-full text-left text-xs text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded hover:bg-accent/30 bg-card border border-transparent hover:border-border/30"
                                    >
                                      {city.label}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Resources Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger 
                    className="text-foreground hover:text-primary focus:text-primary font-medium bg-transparent hover:bg-accent/50"
                    aria-label="Resources menu"
                  >
                    Resources
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="bg-card/98 backdrop-blur-md border border-border shadow-xl z-[100]">
                    <ul className="grid w-[95vw] max-w-[400px] max-h-[70vh] overflow-y-auto gap-2 p-4 bg-card/98" role="menu">
                      {resources.map((resource) => (
                        <li key={resource.path} role="none">
                          <NavigationMenuLink asChild>
                            <button
                              onClick={() => navigateToPage(resource.path)}
                              className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground w-full text-left bg-card border border-border/50 hover:border-primary"
                              role="menuitem"
                            >
                              <div className="text-sm font-medium leading-none">{resource.label}</div>
                              <p className="text-xs text-muted-foreground leading-snug mt-1">
                                {resource.desc}
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

            {/* Primary Navigation Links */}
            <button
              onClick={() => navigateToPage("/pricing")}
              className="text-foreground hover:text-primary transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1"
              aria-label="View pricing"
              aria-current={location.pathname === "/pricing" ? "page" : undefined}
            >
              Pricing
            </button>
            
            <button
              onClick={() => scrollToSection("faq")}
              className="text-foreground hover:text-primary transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1"
              aria-label="View frequently asked questions"
            >
              FAQ
            </button>
          </nav>

          {/* Desktop CTA Section */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Phone Number - Prominent */}
            <a
              href="tel:814-480-0989"
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors font-semibold focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1"
              aria-label="Call us at 814-480-0989"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden lg:inline">(814) 480-0989</span>
            </a>

            {/* Price Calculator Link */}
            <button
              onClick={() => navigateToPage("/calculator")}
              className="text-sm text-primary hover:text-primary/80 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1"
              aria-label="Calculate price"
            >
              💰 Calculate
            </button>

            {/* Secondary Actions */}
            <button
              onClick={() => navigateToPage("/track-booking")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1"
              aria-label="Track your booking"
            >
              Track Booking
            </button>

            <a
              href="https://portal.notroom.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1"
              aria-label="Customer portal (opens in new tab)"
            >
              Portal
            </a>

            {/* Primary CTA */}
            <Button
              variant="amber"
              onClick={() => scrollToSection("booking-form")}
              className="font-semibold shadow-lg hover:shadow-xl transition-all focus:ring-2 focus:ring-offset-2"
              aria-label="Book a notary appointment"
            >
              Book Now
            </Button>
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button 
                variant="ghost" 
                size="icon"
                aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-navigation"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] overflow-y-auto">
              <nav id="mobile-navigation" className="flex flex-col gap-6 mt-8" aria-label="Mobile navigation">
                <div className="mb-4">
                  <img 
                    src={notroomLogo} 
                    alt="Notroom logo" 
                    className="h-10" 
                    width="120" 
                    height="40"
                    loading="lazy"
                  />
                </div>

                {/* Primary CTA - Top of mobile menu */}
                <Button
                  variant="amber"
                  size="lg"
                  onClick={() => scrollToSection("booking-form")}
                  className="w-full font-semibold"
                >
                  Book Now
                </Button>

                {/* Phone Number */}
                <a
                  href="tel:814-480-0989"
                  className="flex items-center gap-2 text-lg font-semibold hover:text-primary transition-colors p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <Phone className="w-5 h-5" />
                  (814) 480-0989
                </a>

                <div className="border-t pt-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Services
                  </h3>
                  <div className="flex flex-col gap-2 pl-2">
                    {services.map((service) => (
                      <button
                        key={service.path}
                        onClick={() => navigateToPage(service.path)}
                        className="text-left text-sm hover:text-primary transition-colors py-2 focus:outline-none focus:text-primary"
                      >
                        {service.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Service Areas
                  </h3>
                  <div className="flex flex-col gap-3 pl-2">
                    {areas.map((area) => (
                      <div key={area.path} className="space-y-1">
                        <button
                          onClick={() => navigateToPage(area.path)}
                          className="text-left text-sm font-semibold hover:text-primary transition-colors focus:outline-none focus:text-primary"
                        >
                          {area.label} →
                        </button>
                        {area.cities && area.cities.length > 0 && (
                          <div className="flex flex-col gap-1 pl-3 border-l-2 border-border/50">
                            {area.cities.map((city) => (
                              <button
                                key={city.path}
                                onClick={() => navigateToPage(city.path)}
                                className="text-left text-xs text-muted-foreground hover:text-foreground transition-colors py-1 focus:outline-none focus:text-foreground"
                              >
                                {city.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Resources
                  </h3>
                  <div className="flex flex-col gap-2 pl-2">
                    {resources.map((resource) => (
                      <button
                        key={resource.path}
                        onClick={() => navigateToPage(resource.path)}
                        className="text-left text-sm hover:text-primary transition-colors py-2 focus:outline-none focus:text-primary"
                      >
                        {resource.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4 flex flex-col gap-3">
                  <button
                    onClick={() => scrollToSection("faq")}
                    className="text-left text-base font-medium hover:text-primary transition-colors focus:outline-none focus:text-primary"
                  >
                    FAQ
                  </button>

                  <a
                    href="https://portal.notroom.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-left text-base font-medium hover:text-primary transition-colors focus:outline-none focus:text-primary"
                  >
                    Customer Portal
                  </a>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
