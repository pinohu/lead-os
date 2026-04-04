import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, ArrowLeft, Building, User, Mail, CreditCard, Shield, FileCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { logger } from "@/utils/logger";
import type { User as SupabaseUser } from "@supabase/supabase-js";

// Stripe price IDs for the three tiers
import { CROP_PLANS } from "@/constants/cropPlans";
import { validatePriceIdForCheckout, getStripeConfigError } from "@/utils/stripeValidation";

// Validation schemas
const entitySchema = z.object({
  entityName: z.string().trim().min(1, "Entity name is required").max(200),
  entityType: z.string().min(1, "Please select an entity type"),
  stateOfFormation: z.string().min(2, "Please select a state").max(2),
  entityEin: z.string().trim().max(20).optional(),
  formationDate: z.string().optional(),
});

const contactSchema = z.object({
  contactPerson: z.string().trim().min(1, "Contact person is required").max(100),
  contactEmail: z.string().trim().email("Invalid email address").max(255),
  contactPhone: z.string().trim().min(10, "Valid phone number required").max(20),
  currentAddress: z.string().trim().min(10, "Current address is required").max(500),
});

const CropApplication = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    // Step 1: Entity Information
    entityName: "",
    entityType: "",
    stateOfFormation: "",
    entityEin: "",
    formationDate: "",

    // Step 2: Contact Information
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    currentAddress: "",

    // Step 3: Mail Preferences
    mailHandlingPreference: "physical",
    mailForwardAddress: "",
    openAndScan: false,
    shredRoutine: false,
    
    // Step 4: Plan Selection
    selectedPlan: "digital",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    checkAuth();
    const step = searchParams.get("step");
    const appId = searchParams.get("application_id");
    if (step) setCurrentStep(parseInt(step));
    if (appId) setApplicationId(appId);
  }, [searchParams]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to apply for CROP services",
        variant: "destructive",
      });
      navigate("/");
      return;
    }
    setUser(user);
    setFormData(prev => ({
      ...prev,
      contactEmail: user.email || "",
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    try {
      if (step === 1) {
        entitySchema.parse({
          entityName: formData.entityName,
          entityType: formData.entityType,
          stateOfFormation: formData.stateOfFormation,
          entityEin: formData.entityEin,
          formationDate: formData.formationDate,
        });
      } else if (step === 2) {
        contactSchema.parse({
          contactPerson: formData.contactPerson,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
          currentAddress: formData.currentAddress,
        });
      } else if (step === 3) {
        if (formData.mailHandlingPreference === "physical" && !formData.mailForwardAddress.trim()) {
          newErrors.mailForwardAddress = "Forward address is required for physical mail";
        }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
      }
      setErrors(newErrors);
      return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before continuing",
        variant: "destructive",
      });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmitAndCheckout = async () => {
    if (!user) return;

    setIsSubmitting(true);

    try {
      // Save application to database
      const { data, error } = await supabase
        .from('crop_applications')
        .insert({
          user_id: user.id,
          entity_name: formData.entityName,
          entity_type: formData.entityType,
          state_of_formation: formData.stateOfFormation,
          entity_ein: formData.entityEin || null,
          formation_date: formData.formationDate || null,
          contact_person: formData.contactPerson,
          contact_email: formData.contactEmail,
          contact_phone: formData.contactPhone,
          current_address: formData.currentAddress,
          mail_handling_preference: formData.mailHandlingPreference,
          mail_forward_address: formData.mailForwardAddress || null,
          scan_preferences: {
            open_scan: formData.openAndScan,
            shred_routine: formData.shredRoutine,
          },
          selected_plan: formData.selectedPlan,
          plan_price_id: CROP_PLANS[formData.selectedPlan as keyof typeof CROP_PLANS].priceId,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      const appId = data.id;
      setApplicationId(appId);

      // Create Stripe checkout session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) throw new Error("No active session");

      // Validate Stripe price ID before checkout
      const selectedPlan = CROP_PLANS[formData.selectedPlan as keyof typeof CROP_PLANS];
      const priceId = selectedPlan.priceId;
      
      try {
        validatePriceIdForCheckout(priceId, 'CROP Services');
      } catch (validationError) {
        const errorMessage = validationError instanceof Error 
          ? validationError.message 
          : getStripeConfigError('CROP Services');
        
        toast({
          title: "Payment Configuration Error",
          description: errorMessage,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const response = await supabase.functions.invoke('crop-checkout', {
        body: {
          priceId: priceId,
          applicationId: appId,
        },
      });

      if (response.error) throw response.error;

      const { url } = response.data;
      
      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url;
      } else {
        throw new Error("No checkout URL returned");
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error("Error creating checkout:", errorMessage);
      toast({
        title: "Application Error",
        description: errorMessage || "Failed to create checkout session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (currentStep / 4) * 100;

  const statesList = ["PA", "OH", "NY", "NJ", "MD", "DE", "WV", "VA", "Other"];
  const entityTypes = [
    { value: "llc", label: "Limited Liability Company (LLC)" },
    { value: "corp", label: "Corporation (C-Corp or S-Corp)" },
    { value: "foreign", label: "Foreign Entity (Registered in PA)" },
    { value: "lp", label: "Limited Partnership" },
    { value: "llp", label: "Limited Liability Partnership" },
  ];

  return (
    <Layout>
      <SEO
        title="CROP Application - Registered Office Service | Notroom"
        description="Apply for Pennsylvania registered office and CROP services. Secure multi-step application with Stripe payment."
        canonical="https://notroom.com/crop/application"
      />

      <section className="py-16 pt-32 bg-muted/30 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                CROP Service Application
              </h1>
              <p className="text-muted-foreground">
                Complete your application in 4 simple steps
              </p>
            </div>

            {/* Progress Bar */}
            <Card className="mb-8">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>Step {currentStep} of 4</span>
                    <span>{Math.round(progress)}% Complete</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between text-xs">
                    <span className={currentStep >= 1 ? "text-primary font-medium" : ""}>Entity</span>
                    <span className={currentStep >= 2 ? "text-primary font-medium" : ""}>Contact</span>
                    <span className={currentStep >= 3 ? "text-primary font-medium" : ""}>Mail</span>
                    <span className={currentStep >= 4 ? "text-primary font-medium" : ""}>Payment</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 1: Entity Information */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Building className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Entity Information</CardTitle>
                      <CardDescription>Tell us about your business entity</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="entityName">Legal Entity Name *</Label>
                    <Input
                      id="entityName"
                      placeholder="e.g., ABC Company LLC"
                      value={formData.entityName}
                      onChange={(e) => setFormData({ ...formData, entityName: e.target.value })}
                      className={errors.entityName ? "border-destructive" : ""}
                    />
                    {errors.entityName && (
                      <p className="text-sm text-destructive">{errors.entityName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="entityType">Entity Type *</Label>
                    <Select
                      value={formData.entityType}
                      onValueChange={(value) => setFormData({ ...formData, entityType: value })}
                    >
                      <SelectTrigger className={errors.entityType ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select entity type" />
                      </SelectTrigger>
                      <SelectContent>
                        {entityTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.entityType && (
                      <p className="text-sm text-destructive">{errors.entityType}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stateOfFormation">State of Formation *</Label>
                      <Select
                        value={formData.stateOfFormation}
                        onValueChange={(value) => setFormData({ ...formData, stateOfFormation: value })}
                      >
                        <SelectTrigger className={errors.stateOfFormation ? "border-destructive" : ""}>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {statesList.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.stateOfFormation && (
                        <p className="text-sm text-destructive">{errors.stateOfFormation}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="formationDate">Formation Date (Optional)</Label>
                      <Input
                        id="formationDate"
                        type="date"
                        value={formData.formationDate}
                        onChange={(e) => setFormData({ ...formData, formationDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="entityEin">Federal EIN (Optional)</Label>
                    <Input
                      id="entityEin"
                      placeholder="XX-XXXXXXX"
                      value={formData.entityEin}
                      onChange={(e) => setFormData({ ...formData, entityEin: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Leave blank if you don't have one yet</p>
                  </div>

                  <Button onClick={nextStep} className="w-full" size="lg">
                    Continue to Contact Information
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Contact Information */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Contact Information</CardTitle>
                      <CardDescription>How can we reach you?</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">Primary Contact Person *</Label>
                    <Input
                      id="contactPerson"
                      placeholder="Full name"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      className={errors.contactPerson ? "border-destructive" : ""}
                    />
                    {errors.contactPerson && (
                      <p className="text-sm text-destructive">{errors.contactPerson}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Email Address *</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="email@example.com"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      className={errors.contactEmail ? "border-destructive" : ""}
                    />
                    {errors.contactEmail && (
                      <p className="text-sm text-destructive">{errors.contactEmail}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Phone Number *</Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      placeholder="(814) 555-0123"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      className={errors.contactPhone ? "border-destructive" : ""}
                    />
                    {errors.contactPhone && (
                      <p className="text-sm text-destructive">{errors.contactPhone}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentAddress">Current Business Address *</Label>
                    <Textarea
                      id="currentAddress"
                      placeholder="Street address, city, state, ZIP"
                      rows={3}
                      value={formData.currentAddress}
                      onChange={(e) => setFormData({ ...formData, currentAddress: e.target.value })}
                      className={errors.currentAddress ? "border-destructive" : ""}
                    />
                    {errors.currentAddress && (
                      <p className="text-sm text-destructive">{errors.currentAddress}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      This is where you're currently located or operating from
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={prevStep} variant="outline" className="flex-1" size="lg">
                      <ArrowLeft className="mr-2 w-4 h-4" />
                      Back
                    </Button>
                    <Button onClick={nextStep} className="flex-1" size="lg">
                      Continue to Mail Preferences
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Mail Preferences */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Mail Handling Preferences</CardTitle>
                      <CardDescription>Choose how you want to receive mail</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label>Mail Handling Method *</Label>
                    <RadioGroup
                      value={formData.mailHandlingPreference}
                      onValueChange={(value) => setFormData({ ...formData, mailHandlingPreference: value })}
                    >
                      <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 cursor-pointer">
                        <RadioGroupItem value="physical" id="physical" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="physical" className="cursor-pointer">
                            <div className="font-semibold">Physical Mail Forwarding</div>
                            <p className="text-sm text-muted-foreground mt-1">
                              We forward physical mail weekly to your designated address
                            </p>
                          </Label>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 cursor-pointer">
                        <RadioGroupItem value="digital" id="digital" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="digital" className="cursor-pointer">
                            <div className="font-semibold">Digital Scanning (Recommended)</div>
                            <p className="text-sm text-muted-foreground mt-1">
                              We scan envelopes within 24 hours and upload to your portal
                            </p>
                          </Label>
                        </div>
                        <Badge variant="secondary">Fast</Badge>
                      </div>
                    </RadioGroup>
                  </div>

                  {formData.mailHandlingPreference === "physical" && (
                    <div className="space-y-2">
                      <Label htmlFor="mailForwardAddress">Mail Forward Address *</Label>
                      <Textarea
                        id="mailForwardAddress"
                        placeholder="Street address where you'd like mail forwarded"
                        rows={3}
                        value={formData.mailForwardAddress}
                        onChange={(e) => setFormData({ ...formData, mailForwardAddress: e.target.value })}
                        className={errors.mailForwardAddress ? "border-destructive" : ""}
                      />
                      {errors.mailForwardAddress && (
                        <p className="text-sm text-destructive">{errors.mailForwardAddress}</p>
                      )}
                    </div>
                  )}

                  {formData.mailHandlingPreference === "digital" && (
                    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                      <p className="font-medium">Additional Scanning Options</p>
                      
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="openAndScan"
                          checked={formData.openAndScan}
                          onCheckedChange={(checked) => 
                            setFormData({ ...formData, openAndScan: checked as boolean })
                          }
                        />
                        <div>
                          <Label htmlFor="openAndScan" className="cursor-pointer">
                            Open and scan contents on request
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            You can request specific items to be opened and scanned
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="shredRoutine"
                          checked={formData.shredRoutine}
                          onCheckedChange={(checked) => 
                            setFormData({ ...formData, shredRoutine: checked as boolean })
                          }
                        />
                        <div>
                          <Label htmlFor="shredRoutine" className="cursor-pointer">
                            Shred routine mail after scanning
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            Automatically shred junk mail and routine correspondence
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button onClick={prevStep} variant="outline" className="flex-1" size="lg">
                      <ArrowLeft className="mr-2 w-4 h-4" />
                      Back
                    </Button>
                    <Button onClick={nextStep} className="flex-1" size="lg">
                      Continue to Payment
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Plan Selection & Payment */}
            {currentStep === 4 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <CreditCard className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Choose Your Plan</CardTitle>
                      <CardDescription>Select the registered office plan that fits your needs</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <RadioGroup
                    value={formData.selectedPlan}
                    onValueChange={(value) => setFormData({ ...formData, selectedPlan: value })}
                    className="space-y-4"
                  >
                    {/* Standard Plan */}
                    <div className="relative">
                      <div className="flex items-start space-x-3 p-4 border-2 rounded-lg hover:bg-accent/30 cursor-pointer">
                        <RadioGroupItem value="standard" id="standard" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="standard" className="cursor-pointer">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-lg">{CROP_PLANS.standard.name}</span>
                              <span className="text-2xl font-bold text-primary">{CROP_PLANS.standard.price}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {CROP_PLANS.standard.description}
                            </p>
                            <ul className="space-y-1 text-sm">
                              <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-success" />
                                Professional PA registered office address
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-success" />
                                Service of process acceptance
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-success" />
                                Weekly physical mail forwarding
                              </li>
                            </ul>
                          </Label>
                        </div>
                      </div>
                    </div>

                    {/* Digital Plan */}
                    <div className="relative">
                      {formData.selectedPlan === "digital" && (
                        <Badge className="absolute -top-2 -right-2 z-10">Most Popular</Badge>
                      )}
                      <div className={`flex items-start space-x-3 p-4 border-2 rounded-lg hover:bg-accent/30 cursor-pointer ${
                        formData.selectedPlan === "digital" ? "border-primary bg-primary/5" : ""
                      }`}>
                        <RadioGroupItem value="digital" id="digital-plan" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="digital-plan" className="cursor-pointer">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-lg">{CROP_PLANS.digital.name}</span>
                              <span className="text-2xl font-bold text-primary">{CROP_PLANS.digital.price}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {CROP_PLANS.digital.description}
                            </p>
                            <ul className="space-y-1 text-sm">
                              <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-success" />
                                Everything in Standard
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-success" />
                                24-hour digital mail scanning
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-success" />
                                Secure cloud document storage
                              </li>
                            </ul>
                          </Label>
                        </div>
                      </div>
                    </div>

                    {/* Premium Plan */}
                    <div className="relative">
                      <div className="flex items-start space-x-3 p-4 border-2 rounded-lg hover:bg-accent/30 cursor-pointer">
                        <RadioGroupItem value="premium" id="premium" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="premium" className="cursor-pointer">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-lg">{CROP_PLANS.premium.name}</span>
                              <span className="text-2xl font-bold text-primary">{CROP_PLANS.premium.price}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {CROP_PLANS.premium.description}
                            </p>
                            <ul className="space-y-1 text-sm">
                              <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-success" />
                                Everything in Digital
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-success" />
                                Annual compliance review call
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-success" />
                                10% discount on business filings
                              </li>
                            </ul>
                          </Label>
                        </div>
                        <Badge variant="secondary">Best Value</Badge>
                      </div>
                    </div>
                  </RadioGroup>

                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex items-start gap-2">
                      <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium mb-1">Secure Payment via Stripe</p>
                        <p className="text-muted-foreground">
                          You'll be redirected to Stripe's secure checkout to complete your subscription. 
                          Your service begins immediately upon payment confirmation.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <p className="text-sm">
                      <strong>What happens next:</strong> After payment, you'll receive a welcome email with your 
                      service agreement, registered office address, and instructions for listing us in your PA filings.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={prevStep} variant="outline" className="flex-1" size="lg">
                      <ArrowLeft className="mr-2 w-4 h-4" />
                      Back
                    </Button>
                    <Button 
                      onClick={handleSubmitAndCheckout} 
                      className="flex-1" 
                      size="lg"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        "Processing..."
                      ) : (
                        <>
                          <FileCheck className="mr-2 w-4 h-4" />
                          Submit & Pay Now
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default CropApplication;
