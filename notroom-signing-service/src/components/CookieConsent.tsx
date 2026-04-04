import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Cookie, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const navigate = useNavigate();

  const [preferences, setPreferences] = useState({
    necessary: true, // Always required
    functional: true,
    analytics: true,
    advertising: false
  });

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      // Delay showing banner slightly for better UX
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const acceptAll = () => {
    const consentData = {
      necessary: true,
      functional: true,
      analytics: true,
      advertising: true,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem("cookie-consent", JSON.stringify(consentData));
    setShowBanner(false);
  };

  const acceptNecessaryOnly = () => {
    const consentData = {
      necessary: true,
      functional: false,
      analytics: false,
      advertising: false,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem("cookie-consent", JSON.stringify(consentData));
    setShowBanner(false);
  };

  const savePreferences = () => {
    const consentData = {
      ...preferences,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem("cookie-consent", JSON.stringify(consentData));
    setShowBanner(false);
    setShowPreferences(false);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Cookie Consent Banner */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom duration-500 max-w-full"
        role="dialog"
        aria-labelledby="cookie-banner-title"
        aria-describedby="cookie-banner-description"
        aria-modal="false"
      >
        <Card className="max-w-6xl mx-auto shadow-2xl border-2">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Cookie className="w-6 h-6 text-primary" />
              </div>
              
              <div className="flex-1">
                <h3 id="cookie-banner-title" className="text-lg font-bold mb-2 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" aria-hidden="true" />
                  Your Privacy Matters
                </h3>
                <p id="cookie-banner-description" className="text-sm text-muted-foreground mb-4">
                  We use cookies and similar technologies to provide essential functionality, analyze usage, and improve your experience. 
                  Some cookies are necessary for the website to function, while others help us understand how you use our services.
                  <button 
                    onClick={() => navigate("/privacy-policy")}
                    className="text-primary hover:underline ml-1"
                  >
                    Learn more in our Privacy Policy
                  </button>
                </p>

                {!showPreferences ? (
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      onClick={acceptAll}
                      className="font-semibold"
                    >
                      Accept All Cookies
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={acceptNecessaryOnly}
                    >
                      Necessary Only
                    </Button>
                    <Button 
                      variant="ghost"
                      onClick={() => setShowPreferences(true)}
                    >
                      Customize Settings
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg opacity-75">
                        <input 
                          type="checkbox" 
                          checked={true}
                          disabled
                          id="cookie-necessary"
                          className="mt-1 focus:ring-2 focus:ring-primary focus:ring-offset-2"
                          aria-label="Necessary cookies - always enabled"
                        />
                        <label htmlFor="cookie-necessary" className="flex-1">
                          <div className="font-semibold text-sm">Necessary Cookies</div>
                          <div className="text-xs text-muted-foreground">Required for website functionality. Cannot be disabled.</div>
                        </label>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-background rounded-lg hover:bg-muted/30 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={preferences.functional}
                          onChange={(e) => setPreferences({...preferences, functional: e.target.checked})}
                          id="cookie-functional"
                          className="mt-1 cursor-pointer focus:ring-2 focus:ring-primary focus:ring-offset-2"
                          aria-describedby="cookie-functional-desc"
                        />
                        <label htmlFor="cookie-functional" className="flex-1 cursor-pointer">
                          <div className="font-semibold text-sm">Functional Cookies</div>
                          <div id="cookie-functional-desc" className="text-xs text-muted-foreground">Remember your preferences and settings.</div>
                        </label>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-background rounded-lg hover:bg-muted/30 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={preferences.analytics}
                          onChange={(e) => setPreferences({...preferences, analytics: e.target.checked})}
                          id="cookie-analytics"
                          className="mt-1 cursor-pointer focus:ring-2 focus:ring-primary focus:ring-offset-2"
                          aria-describedby="cookie-analytics-desc"
                        />
                        <label htmlFor="cookie-analytics" className="flex-1 cursor-pointer">
                          <div className="font-semibold text-sm">Analytics Cookies</div>
                          <div id="cookie-analytics-desc" className="text-xs text-muted-foreground">Help us improve our services by analyzing usage.</div>
                        </label>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-background rounded-lg hover:bg-muted/30 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={preferences.advertising}
                          onChange={(e) => setPreferences({...preferences, advertising: e.target.checked})}
                          id="cookie-advertising"
                          className="mt-1 cursor-pointer focus:ring-2 focus:ring-primary focus:ring-offset-2"
                          aria-describedby="cookie-advertising-desc"
                        />
                        <label htmlFor="cookie-advertising" className="flex-1 cursor-pointer">
                          <div className="font-semibold text-sm">Advertising Cookies</div>
                          <div id="cookie-advertising-desc" className="text-xs text-muted-foreground">Personalize ads and measure campaign effectiveness.</div>
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button onClick={savePreferences}>
                        Save Preferences
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setShowPreferences(false)}
                      >
                        Back
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowBanner(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                aria-label="Close cookie banner"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};

export default CookieConsent;
