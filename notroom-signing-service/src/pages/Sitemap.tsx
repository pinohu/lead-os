import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";

const Sitemap = () => {
  return (
    <Layout>
      <SEO 
        title="Sitemap - Notroom Notary Services"
        description="Complete sitemap for Notroom - Pennsylvania notary services, mobile notary, and online notarization across Erie, Crawford, Warren, Mercer, and Venango counties."
        canonical="https://notroom.com/sitemap"
      />

      <div className="min-h-screen bg-background py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Site Map</h1>
            <p className="text-lg text-muted-foreground mb-12">
              Complete navigation for all Notroom pages and services
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Core Pages */}
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-primary">Main Pages</h2>
                <ul className="space-y-2">
                  <li><Link to="/" className="text-foreground hover:text-primary transition-colors">Home</Link></li>
                  <li><Link to="/pricing" className="text-foreground hover:text-primary transition-colors">Pricing</Link></li>
                  <li><Link to="/calculator" className="text-foreground hover:text-primary transition-colors">Price Calculator</Link></li>
                  <li><Link to="/subscriptions" className="text-foreground hover:text-primary transition-colors">Subscriptions</Link></li>
                  <li><Link to="/track-booking" className="text-foreground hover:text-primary transition-colors">Track Booking</Link></li>
                </ul>
              </Card>

              {/* Core Services */}
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-primary">Core Services</h2>
                <ul className="space-y-2">
                  <li><Link to="/services/remote-online-notary" className="text-foreground hover:text-primary transition-colors">Remote Online Notary (RON)</Link></li>
                  <li><Link to="/services/mobile-notary" className="text-foreground hover:text-primary transition-colors">Mobile Notary</Link></li>
                  <li><Link to="/services/loan-signing-agent" className="text-foreground hover:text-primary transition-colors">Loan Signing Agent</Link></li>
                  <li><Link to="/services/business-retainer" className="text-foreground hover:text-primary transition-colors">Business Retainer</Link></li>
                  <li><Link to="/services/apostille" className="text-foreground hover:text-primary transition-colors">Apostille Services</Link></li>
                  <li><Link to="/services/i9-verification" className="text-foreground hover:text-primary transition-colors">I-9 Verification</Link></li>
                </ul>
              </Card>

              {/* Additional Services */}
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-primary">Additional Services</h2>
                <ul className="space-y-2">
                  <li><Link to="/services/registered-office" className="text-foreground hover:text-primary transition-colors">Registered Office Agent</Link></li>
                  <li><Link to="/services/healthcare-facility" className="text-foreground hover:text-primary transition-colors">Healthcare Facility Notary</Link></li>
                  <li><Link to="/services/certified-copies" className="text-foreground hover:text-primary transition-colors">Certified Copies</Link></li>
                  
                  <li><Link to="/services/fingerprinting" className="text-foreground hover:text-primary transition-colors">Fingerprinting Services</Link></li>
                  <li><Link to="/services/witness-service" className="text-foreground hover:text-primary transition-colors">Witness Services</Link></li>
                  <li><Link to="/services/passport-photos" className="text-foreground hover:text-primary transition-colors">Passport Photos</Link></li>
                  <li><Link to="/services/translation-certification" className="text-foreground hover:text-primary transition-colors">Translation Certification</Link></li>
                  <li><Link to="/services/vehicle-title-transfer" className="text-foreground hover:text-primary transition-colors">Vehicle Title Transfer</Link></li>
                  <li><Link to="/services/virtual-mailbox" className="text-foreground hover:text-primary transition-colors">Virtual Mailbox</Link></li>
                  <li><Link to="/services/ucc-filing" className="text-foreground hover:text-primary transition-colors">UCC Filing</Link></li>
                  <li><Link to="/services/document-retrieval" className="text-foreground hover:text-primary transition-colors">Document Retrieval</Link></li>
                </ul>
              </Card>

              {/* Resources */}
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-primary">Resources</h2>
                <ul className="space-y-2">
                  <li><Link to="/resources/how-ron-works" className="text-foreground hover:text-primary transition-colors">How RON Works</Link></li>
                  <li><Link to="/legal/agreements" className="text-foreground hover:text-primary transition-colors">Service Agreements</Link></li>
                </ul>
              </Card>

              {/* Counties */}
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-primary">Service Areas - Counties</h2>
                <ul className="space-y-2">
                  <li><Link to="/areas/erie-county" className="text-foreground hover:text-primary transition-colors">Erie County</Link></li>
                  <li><Link to="/areas/crawford-county" className="text-foreground hover:text-primary transition-colors">Crawford County</Link></li>
                  <li><Link to="/areas/warren-county" className="text-foreground hover:text-primary transition-colors">Warren County</Link></li>
                  <li><Link to="/areas/mercer-county" className="text-foreground hover:text-primary transition-colors">Mercer County</Link></li>
                  <li><Link to="/areas/venango-county" className="text-foreground hover:text-primary transition-colors">Venango County</Link></li>
                  <li><Link to="/areas/statewide-online" className="text-foreground hover:text-primary transition-colors">Statewide Online</Link></li>
                </ul>
              </Card>

              {/* Erie County Cities */}
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-primary">Erie County Cities</h2>
                <ul className="space-y-2">
                  <li><Link to="/areas/erie-pa" className="text-foreground hover:text-primary transition-colors">Erie</Link></li>
                  <li><Link to="/areas/edinboro-pa" className="text-foreground hover:text-primary transition-colors">Edinboro</Link></li>
                  <li><Link to="/areas/north-east-pa" className="text-foreground hover:text-primary transition-colors">North East</Link></li>
                  <li><Link to="/areas/girard-pa" className="text-foreground hover:text-primary transition-colors">Girard</Link></li>
                  <li><Link to="/areas/corry-pa" className="text-foreground hover:text-primary transition-colors">Corry</Link></li>
                  <li><Link to="/areas/waterford-pa" className="text-foreground hover:text-primary transition-colors">Waterford</Link></li>
                  <li><Link to="/areas/albion-pa" className="text-foreground hover:text-primary transition-colors">Albion</Link></li>
                  <li><Link to="/areas/bear-lake-pa" className="text-foreground hover:text-primary transition-colors">Bear Lake</Link></li>
                  <li><Link to="/areas/millcreek-pa" className="text-foreground hover:text-primary transition-colors">Millcreek</Link></li>
                  <li><Link to="/areas/harborcreek-pa" className="text-foreground hover:text-primary transition-colors">Harborcreek</Link></li>
                  <li><Link to="/areas/fairview-pa" className="text-foreground hover:text-primary transition-colors">Fairview</Link></li>
                  <li><Link to="/areas/wesleyville-pa" className="text-foreground hover:text-primary transition-colors">Wesleyville</Link></li>
                  <li><Link to="/areas/lawrence-park-pa" className="text-foreground hover:text-primary transition-colors">Lawrence Park</Link></li>
                  <li><Link to="/areas/union-city-pa" className="text-foreground hover:text-primary transition-colors">Union City</Link></li>
                  <li><Link to="/areas/lake-city-pa" className="text-foreground hover:text-primary transition-colors">Lake City</Link></li>
                  <li><Link to="/areas/wattsburg-pa" className="text-foreground hover:text-primary transition-colors">Wattsburg</Link></li>
                </ul>
              </Card>

              {/* Crawford County Cities */}
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-primary">Crawford County Cities</h2>
                <ul className="space-y-2">
                  <li><Link to="/areas/meadville-pa" className="text-foreground hover:text-primary transition-colors">Meadville</Link></li>
                  <li><Link to="/areas/titusville-pa" className="text-foreground hover:text-primary transition-colors">Titusville</Link></li>
                  <li><Link to="/areas/cambridge-springs-pa" className="text-foreground hover:text-primary transition-colors">Cambridge Springs</Link></li>
                  <li><Link to="/areas/linesville-pa" className="text-foreground hover:text-primary transition-colors">Linesville</Link></li>
                  <li><Link to="/areas/conneaut-lake-pa" className="text-foreground hover:text-primary transition-colors">Conneaut Lake</Link></li>
                  <li><Link to="/areas/cochranton-pa" className="text-foreground hover:text-primary transition-colors">Cochranton</Link></li>
                  <li><Link to="/areas/saegertown-pa" className="text-foreground hover:text-primary transition-colors">Saegertown</Link></li>
                  <li><Link to="/areas/spartansburg-pa" className="text-foreground hover:text-primary transition-colors">Spartansburg</Link></li>
                  <li><Link to="/areas/guys-mills-pa" className="text-foreground hover:text-primary transition-colors">Guys Mills</Link></li>
                  <li><Link to="/areas/blooming-valley-pa" className="text-foreground hover:text-primary transition-colors">Blooming Valley</Link></li>
                  <li><Link to="/areas/harmonsburg-pa" className="text-foreground hover:text-primary transition-colors">Harmonsburg</Link></li>
                  <li><Link to="/areas/venango-pa" className="text-foreground hover:text-primary transition-colors">Venango</Link></li>
                  <li><Link to="/areas/townville-pa" className="text-foreground hover:text-primary transition-colors">Townville</Link></li>
                  <li><Link to="/areas/conneautville-pa" className="text-foreground hover:text-primary transition-colors">Conneautville</Link></li>
                  <li><Link to="/areas/hydetown-pa" className="text-foreground hover:text-primary transition-colors">Hydetown</Link></li>
                </ul>
              </Card>

              {/* Warren County Cities */}
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-primary">Warren County Cities</h2>
                <ul className="space-y-2">
                  <li><Link to="/areas/warren-pa" className="text-foreground hover:text-primary transition-colors">Warren</Link></li>
                  <li><Link to="/areas/youngsville-pa" className="text-foreground hover:text-primary transition-colors">Youngsville</Link></li>
                  <li><Link to="/areas/sheffield-pa" className="text-foreground hover:text-primary transition-colors">Sheffield</Link></li>
                  <li><Link to="/areas/sugar-grove-pa" className="text-foreground hover:text-primary transition-colors">Sugar Grove</Link></li>
                  <li><Link to="/areas/tidioute-pa" className="text-foreground hover:text-primary transition-colors">Tidioute</Link></li>
                  <li><Link to="/areas/clarendon-pa" className="text-foreground hover:text-primary transition-colors">Clarendon</Link></li>
                  <li><Link to="/areas/russell-pa" className="text-foreground hover:text-primary transition-colors">Russell</Link></li>
                  <li><Link to="/areas/north-warren-pa" className="text-foreground hover:text-primary transition-colors">North Warren</Link></li>
                  <li><Link to="/areas/kinzua-pa" className="text-foreground hover:text-primary transition-colors">Kinzua</Link></li>
                  <li><Link to="/areas/irvine-pa" className="text-foreground hover:text-primary transition-colors">Irvine</Link></li>
                  <li><Link to="/areas/pittsfield-pa" className="text-foreground hover:text-primary transition-colors">Pittsfield</Link></li>
                </ul>
              </Card>

              {/* Mercer County Cities */}
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-primary">Mercer County Cities</h2>
                <ul className="space-y-2">
                  <li><Link to="/areas/sharon-pa" className="text-foreground hover:text-primary transition-colors">Sharon</Link></li>
                  <li><Link to="/areas/hermitage-pa" className="text-foreground hover:text-primary transition-colors">Hermitage</Link></li>
                  <li><Link to="/areas/grove-city-pa" className="text-foreground hover:text-primary transition-colors">Grove City</Link></li>
                  <li><Link to="/areas/mercer-pa" className="text-foreground hover:text-primary transition-colors">Mercer</Link></li>
                  <li><Link to="/areas/farrell-pa" className="text-foreground hover:text-primary transition-colors">Farrell</Link></li>
                  <li><Link to="/areas/sharpsville-pa" className="text-foreground hover:text-primary transition-colors">Sharpsville</Link></li>
                  <li><Link to="/areas/greenville-pa" className="text-foreground hover:text-primary transition-colors">Greenville</Link></li>
                  <li><Link to="/areas/stoneboro-pa" className="text-foreground hover:text-primary transition-colors">Stoneboro</Link></li>
                  <li><Link to="/areas/sandy-lake-pa" className="text-foreground hover:text-primary transition-colors">Sandy Lake</Link></li>
                  <li><Link to="/areas/clark-pa" className="text-foreground hover:text-primary transition-colors">Clark</Link></li>
                  <li><Link to="/areas/cranberry-township-pa" className="text-foreground hover:text-primary transition-colors">Cranberry Township</Link></li>
                </ul>
              </Card>

              {/* Venango County Cities */}
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-primary">Venango County Cities</h2>
                <ul className="space-y-2">
                  <li><Link to="/areas/oil-city-pa" className="text-foreground hover:text-primary transition-colors">Oil City</Link></li>
                  <li><Link to="/areas/franklin-pa" className="text-foreground hover:text-primary transition-colors">Franklin</Link></li>
                  <li><Link to="/areas/sugarcreek-pa" className="text-foreground hover:text-primary transition-colors">Sugarcreek</Link></li>
                  <li><Link to="/areas/clintonville-pa" className="text-foreground hover:text-primary transition-colors">Clintonville</Link></li>
                  <li><Link to="/areas/emlenton-pa" className="text-foreground hover:text-primary transition-colors">Emlenton</Link></li>
                  <li><Link to="/areas/mckean-pa" className="text-foreground hover:text-primary transition-colors">McKean</Link></li>
                  <li><Link to="/areas/riceville-pa" className="text-foreground hover:text-primary transition-colors">Riceville</Link></li>
                  <li><Link to="/areas/chandlers-valley-pa" className="text-foreground hover:text-primary transition-colors">Chandlers Valley</Link></li>
                  <li><Link to="/areas/spring-creek-pa" className="text-foreground hover:text-primary transition-colors">Spring Creek</Link></li>
                  <li><Link to="/areas/polk-pa" className="text-foreground hover:text-primary transition-colors">Polk</Link></li>
                  <li><Link to="/areas/rouseville-pa" className="text-foreground hover:text-primary transition-colors">Rouseville</Link></li>
                  <li><Link to="/areas/cooperstown-pa" className="text-foreground hover:text-primary transition-colors">Cooperstown</Link></li>
                  <li><Link to="/areas/utica-pa" className="text-foreground hover:text-primary transition-colors">Utica</Link></li>
                  <li><Link to="/areas/pleasantville-pa" className="text-foreground hover:text-primary transition-colors">Pleasantville</Link></li>
                </ul>
              </Card>

              {/* Legal Pages */}
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-primary">Legal</h2>
                <ul className="space-y-2">
                  <li><Link to="/privacy-policy" className="text-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
                  <li><Link to="/terms-of-service" className="text-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
                </ul>
              </Card>

              {/* Additional Pages */}
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-primary">Additional Pages</h2>
                <ul className="space-y-2">
                  <li><Link to="/payment-success" className="text-foreground hover:text-primary transition-colors">Payment Success</Link></li>
                  <li><Link to="/payment-canceled" className="text-foreground hover:text-primary transition-colors">Payment Canceled</Link></li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Sitemap;
