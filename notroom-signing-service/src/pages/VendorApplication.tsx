import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { 
  CheckCircle, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Award,
  Briefcase,
  MapPin,
  Star,
  ArrowRight,
  Zap,
} from "lucide-react";
import { getActiveStates, VENDOR_TIER_THRESHOLDS } from "@/constants/stateEligibility";
import SigningLayout from "@/components/SigningLayout";
import type { VendorSpecialization } from "@/types/vendor";

const SPECIALIZATION_OPTIONS: { id: VendorSpecialization; label: string }[] = [
  { id: "heloc", label: "HELOC" },
  { id: "reverse", label: "Reverse Mortgage" },
  { id: "commercial", label: "Commercial" },
  { id: "va", label: "VA Loans" },
  { id: "hospital", label: "Hospital Signings" },
  { id: "jail", label: "Correctional Facility" },
  { id: "nursing_home", label: "Nursing Home" },
  { id: "seller_finance", label: "Seller Finance" },
  { id: "private_lending", label: "Private Lending" },
];

const LANGUAGE_OPTIONS = [
  "English",
  "Spanish",
  "Mandarin",
  "Vietnamese",
  "Korean",
  "Tagalog",
  "French",
  "German",
  "Arabic",
  "Portuguese",
];

export default function VendorApplication() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedSpecializations, setSelectedSpecializations] = useState<VendorSpecialization[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["English"]);

  const activeStates = getActiveStates();

  const submitMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const vendorData = {
        first_name: formData.get("first_name") as string,
        last_name: formData.get("last_name") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        secondary_phone: formData.get("secondary_phone") as string || null,
        business_name: formData.get("business_name") as string || null,
        city: formData.get("city") as string,
        state: formData.get("state") as string,
        zip_code: formData.get("zip_code") as string,
        primary_commission_state: formData.get("commission_state") as string,
        primary_commission_number: formData.get("commission_number") as string,
        primary_commission_expiry: formData.get("commission_expiry") as string,
        is_nsa_certified: formData.get("nsa_certified") === "on",
        nna_member_id: formData.get("nna_member_id") as string || null,
        years_experience: parseInt(formData.get("years_experience") as string) || 0,
        languages: selectedLanguages,
        has_dual_tray_printer: formData.get("dual_tray_printer") === "on",
        has_scanner: formData.get("scanner") === "on",
        has_mobile_hotspot: formData.get("mobile_hotspot") === "on",
        has_backup_equipment: formData.get("backup_equipment") === "on",
        eo_insurance_amount: parseFloat(formData.get("eo_amount") as string) || null,
        eo_policy_number: formData.get("eo_policy") as string || null,
        eo_expiry_date: formData.get("eo_expiry") as string || null,
        background_check_passed: formData.get("background_check") === "on",
        ron_certified: formData.get("ron_certified") === "on",
        ron_platform: formData.get("ron_platform") as string || null,
        max_travel_radius_miles: parseInt(formData.get("travel_radius") as string) || 25,
        available_weekends: formData.get("weekends") === "on",
        available_after_hours: formData.get("after_hours") === "on",
        specializations: selectedSpecializations,
        preferred_payment_method: formData.get("payment_method") as string || "ach",
        payment_email: formData.get("payment_email") as string || null,
        status: "pending" as const,
        tier: "bronze" as const,
        elite_score: 50,
      };

      // Supabase types are stale - regenerate with `supabase gen types`
      const { error } = await (supabase as any).from("vendors").insert(vendorData);
      if (error) throw error;
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast.success("Application submitted successfully!");
    },
    onError: () => {
      toast.error("Failed to submit application. Please try again.");
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    await submitMutation.mutateAsync(formData);
    setIsSubmitting(false);
  };

  if (isSuccess) {
    return (
      <SigningLayout>
        <div className="min-h-screen flex items-center justify-center p-4 pt-24">
          <Card className="w-full max-w-lg text-center">
            <CardContent className="pt-12 pb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Application Received!
              </h1>
              <p className="text-gray-600 mb-6">
                Thank you for applying to join the Notroom National Vendor Network. 
                We'll review your application within 24-48 hours and contact you with next steps.
              </p>
              <div className="bg-slate-50 rounded-lg p-4 text-left mb-6">
                <h3 className="font-medium text-gray-900 mb-2">What Happens Next:</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>✓ Commission verification</li>
                  <li>✓ Background check confirmation</li>
                  <li>✓ E&O insurance validation</li>
                  <li>✓ Equipment verification call (optional)</li>
                  <li>✓ Welcome to the network!</li>
                </ul>
              </div>
              <Link to="/">
                <Button>Return to Home</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </SigningLayout>
    );
  }

  return (
    <SigningLayout>
      <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/90 to-primary text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Badge className="bg-white/20 text-white border-none mb-4">
            <Zap className="h-3 w-3 mr-1" />
            Now Recruiting Elite Notaries
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Join the Notroom National Network
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Earn more, get paid faster, and work with a team that values quality. 
            We're building the most reliable signing service in America.
          </p>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="max-w-6xl mx-auto px-4 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <Card className="bg-white shadow-lg">
            <CardContent className="pt-6 text-center">
              <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-bold text-lg">Fast Pay</h3>
              <p className="text-sm text-gray-600">
                Elite tier: 2-day payment
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg">
            <CardContent className="pt-6 text-center">
              <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-bold text-lg">Performance Routing</h3>
              <p className="text-sm text-gray-600">
                Top performers get first offers
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg">
            <CardContent className="pt-6 text-center">
              <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-bold text-lg">Rescue Premium</h3>
              <p className="text-sm text-gray-600">
                $250-350 for after-hours
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg">
            <CardContent className="pt-6 text-center">
              <Award className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <h3 className="font-bold text-lg">Elite Network</h3>
              <p className="text-sm text-gray-600">
                Work with top 10% notaries
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Application Form */}
        <Card className="max-w-3xl mx-auto mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Vendor Application
            </CardTitle>
            <CardDescription>
              Step {step} of 4 — Complete all sections to join the network
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Personal Information */}
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Personal Information
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name">First Name *</Label>
                      <Input id="first_name" name="first_name" required />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Last Name *</Label>
                      <Input id="last_name" name="last_name" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" name="email" type="email" required />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone *</Label>
                      <Input id="phone" name="phone" type="tel" required />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="secondary_phone">Secondary Phone</Label>
                    <Input id="secondary_phone" name="secondary_phone" type="tel" />
                  </div>

                  <div>
                    <Label htmlFor="business_name">Business Name (optional)</Label>
                    <Input id="business_name" name="business_name" />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input id="city" name="city" required />
                    </div>
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Select name="state" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeStates.map((s) => (
                            <SelectItem key={s.state} value={s.state}>
                              {s.state} - {s.stateName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="zip_code">ZIP Code *</Label>
                      <Input id="zip_code" name="zip_code" required />
                    </div>
                  </div>

                  <Button type="button" onClick={() => setStep(2)} className="w-full">
                    Continue <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}

              {/* Step 2: Commission & Credentials */}
              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Commission & Credentials
                  </h3>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="commission_state">Commission State *</Label>
                      <Select name="commission_state" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeStates.map((s) => (
                            <SelectItem key={s.state} value={s.state}>
                              {s.state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="commission_number">Commission # *</Label>
                      <Input id="commission_number" name="commission_number" required />
                    </div>
                    <div>
                      <Label htmlFor="commission_expiry">Expiry Date *</Label>
                      <Input id="commission_expiry" name="commission_expiry" type="date" required />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="years_experience">Years of Signing Experience *</Label>
                    <Input id="years_experience" name="years_experience" type="number" min="0" required />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox id="nsa_certified" name="nsa_certified" />
                      <Label htmlFor="nsa_certified">NNA NSA Certified</Label>
                    </div>
                    <div>
                      <Label htmlFor="nna_member_id">NNA Member ID</Label>
                      <Input id="nna_member_id" name="nna_member_id" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox id="background_check" name="background_check" />
                    <Label htmlFor="background_check">I have passed a background check within the last 5 years</Label>
                  </div>

                  <div className="space-y-2">
                    <Label>Languages Spoken</Label>
                    <div className="flex flex-wrap gap-2">
                      {LANGUAGE_OPTIONS.map((lang) => (
                        <Badge
                          key={lang}
                          variant={selectedLanguages.includes(lang) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            if (selectedLanguages.includes(lang)) {
                              setSelectedLanguages(selectedLanguages.filter(l => l !== lang));
                            } else {
                              setSelectedLanguages([...selectedLanguages, lang]);
                            }
                          }}
                        >
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button type="button" variant="outline" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button type="button" onClick={() => setStep(3)} className="flex-1">
                      Continue <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Equipment & Insurance */}
              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Equipment & Insurance
                  </h3>

                  <div className="space-y-3">
                    <Label>Equipment (check all that apply)</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <Checkbox id="dual_tray_printer" name="dual_tray_printer" />
                        <Label htmlFor="dual_tray_printer">Dual-Tray Laser Printer</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox id="scanner" name="scanner" />
                        <Label htmlFor="scanner">Scanner (or Scan App)</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox id="mobile_hotspot" name="mobile_hotspot" />
                        <Label htmlFor="mobile_hotspot">Mobile Hotspot</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox id="backup_equipment" name="backup_equipment" />
                        <Label htmlFor="backup_equipment">Backup Equipment</Label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="eo_amount">E&O Insurance Amount</Label>
                      <Input id="eo_amount" name="eo_amount" type="number" placeholder="100000" />
                    </div>
                    <div>
                      <Label htmlFor="eo_policy">Policy Number</Label>
                      <Input id="eo_policy" name="eo_policy" />
                    </div>
                    <div>
                      <Label htmlFor="eo_expiry">Expiry Date</Label>
                      <Input id="eo_expiry" name="eo_expiry" type="date" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Checkbox id="ron_certified" name="ron_certified" />
                      <Label htmlFor="ron_certified">RON Certified / Registered</Label>
                    </div>
                    <div>
                      <Label htmlFor="ron_platform">RON Platform (if certified)</Label>
                      <Select name="ron_platform">
                        <SelectTrigger>
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="proof">Proof (Notarize)</SelectItem>
                          <SelectItem value="notarycam">NotaryCam</SelectItem>
                          <SelectItem value="docverify">DocVerify</SelectItem>
                          <SelectItem value="pavaso">Pavaso</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button type="button" variant="outline" onClick={() => setStep(2)}>
                      Back
                    </Button>
                    <Button type="button" onClick={() => setStep(4)} className="flex-1">
                      Continue <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Preferences & Submit */}
              {step === 4 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Preferences & Specializations
                  </h3>

                  <div>
                    <Label htmlFor="travel_radius">Max Travel Radius (miles)</Label>
                    <Select name="travel_radius" defaultValue="25">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 miles</SelectItem>
                        <SelectItem value="25">25 miles</SelectItem>
                        <SelectItem value="50">50 miles</SelectItem>
                        <SelectItem value="75">75 miles</SelectItem>
                        <SelectItem value="100">100+ miles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox id="weekends" name="weekends" defaultChecked />
                      <Label htmlFor="weekends">Available Weekends</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="after_hours" name="after_hours" defaultChecked />
                      <Label htmlFor="after_hours">Available After-Hours</Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Specializations (select all that apply)</Label>
                    <div className="flex flex-wrap gap-2">
                      {SPECIALIZATION_OPTIONS.map((spec) => (
                        <Badge
                          key={spec.id}
                          variant={selectedSpecializations.includes(spec.id) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            if (selectedSpecializations.includes(spec.id)) {
                              setSelectedSpecializations(selectedSpecializations.filter(s => s !== spec.id));
                            } else {
                              setSelectedSpecializations([...selectedSpecializations, spec.id]);
                            }
                          }}
                        >
                          {spec.label}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="payment_method">Preferred Payment Method</Label>
                      <Select name="payment_method" defaultValue="ach">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ach">ACH / Direct Deposit</SelectItem>
                          <SelectItem value="check">Check</SelectItem>
                          <SelectItem value="zelle">Zelle</SelectItem>
                          <SelectItem value="venmo">Venmo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="payment_email">Payment Email (for Zelle/Venmo)</Label>
                      <Input id="payment_email" name="payment_email" type="email" />
                    </div>
                  </div>

                  {/* Tier Benefits Preview */}
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Elite Tier Benefits (Score 90+)
                    </h4>
                    <ul className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      {VENDOR_TIER_THRESHOLDS[0].benefits.map((benefit, i) => (
                        <li key={i} className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex gap-4">
                    <Button type="button" variant="outline" onClick={() => setStep(3)}>
                      Back
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isSubmitting}>
                      {isSubmitting ? "Submitting..." : "Submit Application"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Progress Indicator */}
              <div className="flex justify-center gap-2 mt-6">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={`w-2 h-2 rounded-full ${
                      s === step ? "bg-primary" : s < step ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Trust Signals */}
        <div className="text-center pb-12">
          <p className="text-white/70 text-sm">
            Trusted by title companies across PA, OH, NJ, MD, NY, VA, NC, FL, TX, and CA
          </p>
        </div>
      </div>
      </div>
    </SigningLayout>
  );
}

