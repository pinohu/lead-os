import SigningLayout from "@/components/SigningLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  CheckCircle,
  ArrowRight,
  MapPin,
  Globe2,
  Users,
  Monitor
} from "lucide-react";
import { STATE_ELIGIBILITY_MATRIX, getActiveStates } from "@/constants/stateEligibility";

export default function Coverage() {
  const navigate = useNavigate();
  const activeStates = getActiveStates();

  // Group states by region
  const regions = {
    "Northeast": ["PA", "NY", "NJ", "MA", "CT", "RI", "VT", "NH", "ME"],
    "Mid-Atlantic": ["MD", "VA", "WV", "DE", "DC"],
    "Southeast": ["NC", "SC", "GA", "FL", "AL", "MS", "TN", "KY"],
    "Midwest": ["OH", "MI", "IN", "IL", "WI", "MN", "IA", "MO", "ND", "SD", "NE", "KS"],
    "Southwest": ["TX", "OK", "AR", "LA", "NM", "AZ"],
    "Mountain": ["CO", "UT", "NV", "WY", "MT", "ID"],
    "Pacific": ["CA", "OR", "WA", "AK", "HI"]
  };

  const activeStateAbbrs = activeStates.map(s => s.state);

  return (
    <SigningLayout>
      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
              Coverage Map
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              50-State
              <span className="block text-cyan-400">Nationwide Coverage</span>
            </h1>
            <p className="text-xl text-slate-300">
              One vendor, coast to coast. In-person signings and Remote Online Notarization 
              wherever your borrowers are.
            </p>
          </div>
        </div>
      </section>

      {/* Coverage Stats */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="border-0 shadow-lg text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-cyan-600" />
                </div>
                <div className="text-4xl font-black text-slate-900 mb-2">50</div>
                <div className="text-slate-600">States Covered</div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-cyan-600" />
                </div>
                <div className="text-4xl font-black text-slate-900 mb-2">In-Person</div>
                <div className="text-slate-600">Mobile Notary Network</div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Monitor className="w-8 h-8 text-cyan-600" />
                </div>
                <div className="text-4xl font-black text-slate-900 mb-2">RON</div>
                <div className="text-slate-600">Remote Online Notarization</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Priority States */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Priority Launch States
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                We've built deep notary networks in these states with guaranteed coverage and fastest response times.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {activeStates.map((state) => (
                <Card key={state.state} className="border-2 border-cyan-200 bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-slate-900">{state.state}</span>
                      <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                    </div>
                    <div className="text-sm text-slate-600">{state.stateName}</div>
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                        <span className="text-slate-600">In-Person</span>
                      </div>
                      {state.ronAllowed && (
                        <div className="flex items-center gap-2 text-xs">
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                          <span className="text-slate-600">RON Available</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* All States by Region */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Coverage by Region
              </h2>
              <p className="text-lg text-slate-600">
                Expanding nationwide. Green states have active notary networks.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Object.entries(regions).map(([region, states]) => (
                <Card key={region} className="border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{region}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {states.map(state => (
                        <span 
                          key={state}
                          className={`px-2 py-1 rounded text-sm font-medium ${
                            activeStateAbbrs.includes(state)
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {state}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-emerald-100 rounded" />
                <span className="text-slate-600">Active Network</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-slate-100 rounded" />
                <span className="text-slate-600">Coming Soon</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RON Coverage */}
      <section className="py-16 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Globe2 className="w-16 h-16 text-cyan-400 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Remote Online Notarization
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              For states that allow RON, we offer seamless hybrid closings. Combine in-person 
              and remote signings for maximum flexibility.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {activeStates.filter(s => s.ronAllowed).map(state => (
                <Badge key={state.state} className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-lg px-4 py-2">
                  {state.state}
                </Badge>
              ))}
            </div>
            <Button 
              size="lg"
              onClick={() => navigate("/contact")}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
            >
              Discuss Your Coverage Needs
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>
    </SigningLayout>
  );
}

