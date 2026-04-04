import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Video, Car, FileText, Globe, Users, Building2, Briefcase, MapPin, ArrowRight, CheckCircle, Phone, Shield, Clock, Star, Award, Heart, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { CommunityData, getNearbyLinks } from "@/data/communityData";
import PricingCalculator from "@/components/PricingCalculator";
import BookingForm from "@/components/BookingForm";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LocalCaseStudies } from "@/components/local-seo/LocalCaseStudies";
import { LocalProofSection } from "@/components/local-seo/LocalProofSection";
import { EnhancedLocalFAQ } from "@/components/local-seo/EnhancedLocalFAQ";
import { ServiceAreaMap } from "@/components/local-seo/ServiceAreaMap";
import { getCaseStudiesForCity } from "@/data/localCaseStudies";
import { generateFAQSchema, generateBreadcrumbSchema } from "@/utils/schemaGenerator";
import { logger } from "@/utils/logger";

interface CommunityPageProps {
  community: CommunityData;
}

const CommunityPage = ({ community }: CommunityPageProps) => {
  const [communityImage, setCommunityImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  
  const scrollToBooking = () => {
    const element = document.getElementById("booking-form");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  // Generate community image on mount if prompt exists
  useEffect(() => {
    const generateImage = async () => {
      if (!community.imagePrompt || imageLoading || communityImage) return;
      
      setImageLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('generate-community-image', {
          body: { prompt: community.imagePrompt }
        });

        if (error) throw error;
        if (data?.imageUrl) {
          setCommunityImage(data.imageUrl);
        }
      } catch (error) {
        logger.error('Error generating community image:', error);
      } finally {
        setImageLoading(false);
      }
    };

    generateImage();
  }, [community.imagePrompt]);

  const services = [
    { icon: Video, title: "Remote Online Notary (RON)", price: "$60", description: `Online notarization 24/7 for ${community.name} residents`, link: "/services/remote-online-notary" },
    { icon: Car, title: "Mobile Notary", price: "$125 + mileage", description: `We come to your location in ${community.name}`, link: "/services/mobile-notary" },
    { icon: FileText, title: "Loan Signing Agent", price: "$175", description: `Real estate closing services in ${community.name}`, link: "/services/loan-signing-agent" },
    { icon: Globe, title: "Apostille Services", price: "$245+", description: "International document authentication", link: "/services/apostille" },
    { icon: Users, title: "I-9 Verification", price: "$85+", description: `Employment verification for ${community.name} businesses`, link: "/services/i9-verification" },
    { icon: Building2, title: "LLC Formation", price: "$149+", description: `Start your ${community.name} business today`, link: "/services/registered-office" },
    { icon: Briefcase, title: "Business Retainer", price: "$399+", description: `Monthly plans for ${community.name} companies`, link: "/services/business-retainer" }
  ];

  const caseStudies = getCaseStudiesForCity(community.slug);
  
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": `Erie Notary - Professional Notary Services in ${community.name}, PA`,
    "image": "https://notroom.com/logo.png",
    "description": `Licensed mobile notary and remote online notary (RON) services in ${community.name}, ${community.county}, Pennsylvania. Specializing in apostille, loan signing, I-9 verification, and business services.`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": community.name,
      "addressRegion": "PA",
      "addressCountry": "US",
      "postalCode": community.zipCodes[0]
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "",
      "longitude": ""
    },
    "url": `https://notroom.com/areas/${community.slug}-pa`,
    "telephone": "(814) 480-0989",
    "priceRange": "$60-$399",
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "09:00",
        "closes": "18:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Saturday",
        "opens": "10:00",
        "closes": "16:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Sunday",
        "opens": "00:00",
        "closes": "23:59",
        "description": "Remote Online Notary (RON) available 24/7 by appointment"
      }
    ],
    "areaServed": [
      {
        "@type": "City",
        "name": community.name,
        "address": {
          "@type": "PostalAddress",
          "addressRegion": "PA",
          "addressCountry": "US"
        }
      },
      ...community.nearbyComm.map(nearby => ({
        "@type": "City",
        "name": nearby,
        "address": {
          "@type": "PostalAddress",
          "addressRegion": "PA",
          "addressCountry": "US"
        }
      }))
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Notary Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Mobile Notary Service",
            "description": `Professional mobile notary service in ${community.name}, PA. We come to your location.`
          },
          "price": "60.00",
          "priceCurrency": "USD"
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Remote Online Notary (RON)",
            "description": `24/7 online notarization for ${community.name} residents via secure video call.`
          },
          "price": "125.00",
          "priceCurrency": "USD"
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Apostille Services",
            "description": `International document authentication and apostille services for ${community.name}.`
          },
          "price": "245.00",
          "priceCurrency": "USD"
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Loan Signing Agent",
            "description": `Professional real estate closing and loan signing services in ${community.name}.`
          },
          "price": "175.00",
          "priceCurrency": "USD"
        }
      ]
    },
    "verified": {
      "@type": "PropertyValue",
      "name": "Verification",
      "value": "PA State Licensed & NNA Certified"
    }
  };
  
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://notroom.com/" },
    { name: community.county, url: `https://notroom.com/areas/${community.county.toLowerCase().replace(/\s+/g, '-')}` },
    { name: community.name, url: `https://notroom.com/areas/${community.slug}-pa` }
  ]);
  
  const faqSchema = generateFAQSchema([
    {
      question: `How quickly can you arrive in ${community.name}?`,
      answer: `For mobile notary services in ${community.name}, we typically arrive within 30-60 minutes during business hours. Same-day appointments are usually available.`
    },
    {
      question: `Do you serve all of ${community.name}?`,
      answer: `Yes! We provide mobile notary services throughout all of ${community.name} and surrounding ${community.county} areas.`
    },
    {
      question: `What are your rates for ${community.name} residents?`,
      answer: `Mobile notary service starts at $125 base ($5 PA notary fee + $120 service fee for travel coordination and scheduling) plus $1.50/mile travel. Remote Online Notary (RON) is a flat $60 ($5 PA notary fee + $55 technology platform fee for video infrastructure, KBA verification, and storage) with no travel charges.`
    },
    {
      question: `Are you licensed to notarize in Pennsylvania?`,
      answer: `Yes, we hold active Pennsylvania notary commissions and are fully bonded and insured.`
    }
  ]);
  
  const combinedSchema = {
    "@context": "https://schema.org",
    "@graph": [localBusinessSchema, breadcrumbSchema, faqSchema]
  };

  const nearbyLinks = getNearbyLinks(community.nearbyComm);

  // Generate localized keywords
  const localKeywords = [
    `${community.name} notary`,
    `mobile notary ${community.name}`,
    `apostille ${community.name}`,
    `notary ${community.name} PA`,
    `${community.name} notary public`,
    `loan signing agent ${community.name}`,
    `RON ${community.name}`,
    `remote online notary ${community.name}`,
    `${community.county} notary`,
    `notary near ${community.landmarks[0]}`,
    `${community.name} mobile notary service`,
    `same day notary ${community.name}`,
    `24/7 notary ${community.name}`,
    `I-9 verification ${community.name}`,
    `business notary ${community.name}`
  ].join(', ');

  return (
    <Layout>
      <SEO
        title={`${community.name} Notary Public PA | Mobile Notary & RON ${community.name} | Apostille Services`}
        description={`#1 rated notary services in ${community.name}, ${community.county}, PA. Mobile notary, Remote Online Notary (RON), apostille, loan signing, I-9 verification. Serving ${community.landmarks.slice(0, 3).join(', ')}. Same-day & 24/7 available. Licensed & insured.`}
        keywords={localKeywords}
        canonical={`https://notroom.com/areas/${community.slug}-pa`}
        schema={combinedSchema}
      />

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary via-primary to-accent overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtMy4zMTQgMC02IDIuNjg2LTYgNnMyLjY4NiA2IDYgNiA2LTIuNjg2IDYtNi0yLjY4Ni02LTYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-20"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center text-primary-foreground">
            <div className="inline-flex items-center gap-2 bg-background/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-background/20">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">Proudly Serving {community.name}, PA</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Your Trusted {community.name} Notary Public
            </h1>
            <p className="text-xl md:text-2xl mb-4 text-primary-foreground/90 font-medium">
              Mobile & Remote Online Notary Services
            </p>
            <p className="text-lg md:text-xl mb-8 text-primary-foreground/80 max-w-3xl mx-auto">
              Serving {community.name} families and businesses near {community.landmarks.slice(0, 2).join(', ')} 
              {community.population && ` - trusted by ${community.population.replace('~', 'over ')} residents`}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" onClick={scrollToBooking} className="bg-background text-primary hover:bg-background/90 text-lg px-8 py-6 h-auto shadow-xl">
                Book {community.name} Notary
              </Button>
              <Button size="lg" variant="outline" asChild className="border-2 border-background text-primary-foreground hover:bg-background hover:text-primary text-lg px-8 py-6 h-auto">
                <a href="tel:814-480-0989"><Phone className="w-5 h-5 mr-2" />Call (814) 480-0989</a>
              </Button>
            </div>
            
            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-6 mt-12 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span>Licensed & Insured</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>Same-Day Available</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                <span>PA Licensed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Breadcrumbs */}
      <section className="py-4 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary">Home</Link>
            <ArrowRight className="w-4 h-4" />
            <Link to={`/areas/${community.county.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-primary">{community.county}</Link>
            <ArrowRight className="w-4 h-4" />
            <span className="text-foreground">{community.name}</span>
          </div>
        </div>
      </section>

      {/* About Community Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
                  <Award className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Your Local Notary Partner</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Trusted by {community.name} Residents
                </h2>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  {community.description}. {community.population && `Serving all ${community.population.replace('~', '')} residents, `}
                  we understand what makes {community.name} special.
                </p>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  {community.uniqueTrait}
                </p>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Whether you're a long-time resident near {community.landmarks[0]} or new to the {community.name} area, 
                  our licensed Pennsylvania notaries provide the professional service you deserve. We bring notary services 
                  directly to your home or office, or meet you online 24/7 with secure Remote Online Notarization.
                </p>
              </div>
              
              <div className="space-y-4">
                <Card className="p-6 border-2 border-primary/20 bg-primary/5">
                  <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Local Landmarks We Serve
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {community.landmarks.slice(0, 6).map((landmark, index) => (
                      <span key={index} className="text-sm bg-background px-3 py-1.5 rounded-full border">
                        {landmark}
                      </span>
                    ))}
                  </div>
                </Card>
                
                <Card className="p-6 border-2">
                  <h3 className="text-xl font-bold mb-4">Why {community.name} Chooses Us</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">We Know {community.name}</p>
                        <p className="text-sm text-muted-foreground">Familiar with local businesses, neighborhoods, and community needs</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">Same-Day Service</p>
                        <p className="text-sm text-muted-foreground">Mobile notary available same-day throughout {community.name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">Licensed & Trusted</p>
                        <p className="text-sm text-muted-foreground">Fully licensed PA notaries, bonded and insured</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Historical Narrative Section - Only show if data exists */}
      {community.historicalNarrative && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="order-2 md:order-1">
                  <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">Our Heritage</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-6">
                    {community.name}'s Story
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {community.historicalNarrative}
                  </p>
                </div>
                <div className="order-1 md:order-2">
                  {imageLoading ? (
                    <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-sm text-muted-foreground">Generating historic scene...</p>
                      </div>
                    </div>
                  ) : communityImage ? (
                    <img 
                      src={communityImage} 
                      alt={`Historic scene of ${community.name}, Pennsylvania`}
                      className="rounded-lg shadow-xl w-full aspect-[4/3] object-cover"
                      width="800"
                      height="600"
                      loading="lazy"
                    />
                  ) : (
                    <div className="aspect-[4/3] bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
                      <MapPin className="w-16 h-16 text-primary/40" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Favorite Things Section - Only show if data exists */}
      {community.favoriteThings && community.favoriteThings.length > 0 && (
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
                  <Heart className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Local Favorites</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  What We Love About {community.name}
                </h2>
                <p className="text-muted-foreground">
                  The little things that make {community.name} special to those who call it home
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {community.favoriteThings.map((thing, index) => (
                  <Card key={index} className="p-4 border-2 hover:border-primary/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <Heart className="w-5 h-5 text-primary mt-0.5 flex-shrink-0 fill-primary/20" />
                      <p className="text-sm leading-relaxed">{thing}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Services Grid */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            Complete Notary Services in {community.name}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow bg-background">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                  <div className="text-2xl font-bold text-primary mb-3">{service.price}</div>
                  <p className="text-muted-foreground mb-4 text-sm">{service.description}</p>
                  <Button asChild className="w-full">
                    <Link to={service.link}>Learn More</Link>
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Distance-Sensitive Pricing Calculator */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto mb-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Calculate Your Exact Price
            </h2>
            <p className="text-lg text-muted-foreground">
              Get instant pricing based on your location in {community.name}, {community.county}
            </p>
          </div>
          <PricingCalculator />
        </div>
      </section>

      {/* Community Testimonial Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
              What {community.name} Neighbors Are Saying
            </h2>
            <p className="text-center text-muted-foreground mb-12">
              Trusted by families and businesses throughout {community.name}
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <Card className="p-6 border-2">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4 italic">
                  "Outstanding service! They came right to my home near {community.landmarks[0]} and made the 
                  whole process incredibly easy. Professional, friendly, and efficient."
                </p>
                <p className="font-semibold text-sm">— {community.name} Homeowner</p>
              </Card>
              
              <Card className="p-6 border-2">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4 italic">
                  "As a local {community.name} business, we need reliable notary services. Same-day service, 
                  competitive pricing, and they truly understand our community's needs."
                </p>
                <p className="font-semibold text-sm">— {community.name} Business Owner</p>
              </Card>
            </div>
            
            <div className="grid sm:grid-cols-3 gap-6 text-center">
              <div className="p-6">
                <div className="text-4xl font-bold text-primary mb-2">6</div>
                <p className="text-sm text-muted-foreground">Essential Services Offered</p>
              </div>
              <div className="p-6">
                <div className="text-4xl font-bold text-primary mb-2">24/7</div>
                <p className="text-sm text-muted-foreground">Remote Online Notary Availability</p>
              </div>
              <div className="p-6">
                <div className="text-4xl font-bold text-primary mb-2">Same-Day</div>
                <p className="text-sm text-muted-foreground">Service Available in {community.name}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Why Choose Us - Enhanced Local Focus */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
              Your {community.name} Notary Advantage
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Local expertise meets professional service - here's why {community.name} trusts us
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 text-center border-2 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">True Local Service</h3>
                <p className="text-muted-foreground text-sm">
                  We serve every neighborhood in {community.name}, from {community.landmarks[0]} to {community.landmarks[1] || 'all surrounding areas'}
                </p>
              </Card>
              
              <Card className="p-6 text-center border-2 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Fast Response</h3>
                <p className="text-muted-foreground text-sm">
                  Same-day mobile service throughout {community.name} or instant RON available 24/7
                </p>
              </Card>
              
              <Card className="p-6 text-center border-2 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Licensed & Protected</h3>
                <p className="text-muted-foreground text-sm">
                  PA-licensed notaries with $100,000 E&O insurance protecting every transaction
                </p>
              </Card>
              
              <Card className="p-6 text-center border-2 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Transparent Pricing</h3>
                <p className="text-muted-foreground text-sm">
                  Clear rates, no hidden fees, PA-compliant pricing for all {community.name} services
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Service Area Map */}
      <ServiceAreaMap 
        cityName={community.name}
        zipCodes={community.zipCodes}
        nearbyComm={community.nearbyComm}
        county={community.county}
      />

      {/* Local Proof Section */}
      <LocalProofSection 
        cityName={community.name}
        county={community.county}
        nearbyLandmarks={community.landmarks}
      />

      {/* Case Studies */}
      <LocalCaseStudies 
        cityName={community.name}
        caseStudies={caseStudies}
      />

      {/* Enhanced FAQ */}
      <EnhancedLocalFAQ 
        cityName={community.name}
        county={community.county}
        zipCodes={community.zipCodes}
      />

      {/* Nearby Communities */}
      {nearbyLinks.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">
                We Also Serve Nearby Communities
              </h2>
              <p className="text-muted-foreground mb-8">
                Professional notary services throughout {community.county}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                {nearbyLinks.map((nearby, index) => (
                  <Button key={index} variant="outline" asChild>
                    <Link to={`/areas/${nearby.slug}-pa`}>
                      {nearby.name} Notary
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Book Your {community.name} Notary Today
          </h2>
          <p className="text-xl mb-8 text-primary-foreground/90">
            Fast, professional notary services in {community.name}, PA. Mobile or online – you choose!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={scrollToBooking} className="bg-background text-primary hover:bg-background/90">
              Book Appointment
            </Button>
            <Button size="lg" variant="outline" asChild className="border-2 border-background text-primary-foreground hover:bg-background hover:text-primary">
              <Link to={`/areas/${community.county.toLowerCase().replace(/\s+/g, '-')}`}>
                View All {community.county} Services
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Booking Form */}
      <BookingForm community={community} />
    </Layout>
  );
};

export default CommunityPage;
