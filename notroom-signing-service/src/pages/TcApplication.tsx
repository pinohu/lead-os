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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, ArrowLeft, FileText, User, Phone, Target, Calendar, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { TC_PLANS } from "@/constants/tcPlans";
import { logger } from "@/utils/logger";
import { validatePriceIdForCheckout, getStripeConfigError } from "@/utils/stripeValidation";
import type { User as SupabaseUser } from "@supabase/supabase-js";

// Validation schemas
const clientInfoSchema = z.object({
  clientName: z.string().trim().min(1, "Name is required").max(200),
  clientEmail: z.string().trim().email("Invalid email address").max(255),
  clientPhone: z.string().trim().min(10, "Valid phone number required").max(20),
  businessName: z.string().trim().max(200).optional(),
});

const transactionDetailsSchema = z.object({
  transactionType: z.string().min(1, "Please select a transaction type"),
  transactionDescription: z.string().trim().min(10, "Please provide a description (at least 10 characters)").max(2000),
  partiesInvolved: z.array(z.string().trim().min(1)).min(1, "At least one party is required"),
  keyDocuments: z.array(z.string().trim().min(1)).optional(),
  targetCompletionDate: z.string().optional(),
  urgencyLevel: z.string().min(1, "Please select urgency level"),
});

const TcApplication = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    // Step 1: Client Information
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    businessName: "",

    // Step 2: Transaction Details
    transactionType: "",
    transactionDescription: "",
    partiesInvolved: [""],
    keyDocuments: [""],
    targetCompletionDate: "",
    urgencyLevel: "standard",

    // Step 3: Plan Selection
    selectedPlan: "standard",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [partyInput, setPartyInput] = useState("");
  const [documentInput, setDocumentInput] = useState("");

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
      toast.error("Please sign in to apply for transaction coordination services");
      navigate("/auth");
      return;
    }
    setUser(user);
    setFormData(prev => ({
      ...prev,
      clientEmail: user.email || "",
    }));
  };

  const addParty = () => {
    if (partyInput.trim()) {
      setFormData(prev => ({
        ...prev,
        partiesInvolved: [...prev.partiesInvolved.filter(p => p), partyInput.trim()],
      }));
      setPartyInput("");
    }
  };

  const removeParty = (index: number) => {
    setFormData(prev => ({
      ...prev,
      partiesInvolved: prev.partiesInvolved.filter((_, i) => i !== index),
    }));
  };

  const addDocument = () => {
    if (documentInput.trim()) {
      setFormData(prev => ({
        ...prev,
        keyDocuments: [...(prev.keyDocuments || []).filter(d => d), documentInput.trim()],
      }));
      setDocumentInput("");
    }
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      keyDocuments: prev.keyDocuments?.filter((_, i) => i !== index) || [],
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    try {
      if (step === 1) {
        clientInfoSchema.parse({
          clientName: formData.clientName,
          clientEmail: formData.clientEmail,
          clientPhone: formData.clientPhone,
          businessName: formData.businessName,
        });
      } else if (step === 2) {
        const validParties = formData.partiesInvolved.filter(p => p.trim());
        if (validParties.length === 0) {
          newErrors.partiesInvolved = "At least one party is required";
        }
        
        transactionDetailsSchema.parse({
          transactionType: formData.transactionType,
          transactionDescription: formData.transactionDescription,
          partiesInvolved: validParties,
          keyDocuments: formData.keyDocuments?.filter(d => d.trim()) || [],
          targetCompletionDate: formData.targetCompletionDate,
          urgencyLevel: formData.urgencyLevel,
        });
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
      setCurrentStep(prev => Math.min(prev + 1, 3));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      toast.error("Please fix the errors before continuing");
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
      const validParties = formData.partiesInvolved.filter(p => p.trim());
      const validDocuments = formData.keyDocuments?.filter(d => d.trim()) || [];

      // Save application to database
      const { data, error } = await supabase
        .from('tc_clients')
        .insert({
          user_id: user.id,
          client_name: formData.clientName,
          client_email: formData.clientEmail,
          client_phone: formData.clientPhone,
          business_name: formData.businessName || null,
          transaction_type: formData.transactionType,
          transaction_description: formData.transactionDescription,
          parties_involved: validParties,
          key_documents: validDocuments.length > 0 ? validDocuments : null,
          target_completion_date: formData.targetCompletionDate || null,
          urgency_level: formData.urgencyLevel,
          selected_plan: formData.selectedPlan,
          plan_price_id: TC_PLANS[formData.selectedPlan as keyof typeof TC_PLANS].priceId,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      const appId = data.id;
      setApplicationId(appId);

      // Validate Stripe price ID before checkout
      const selectedPlan = TC_PLANS[formData.selectedPlan as keyof typeof TC_PLANS];
      const priceId = selectedPlan.priceId;
      
      try {
        validatePriceIdForCheckout(priceId, 'Transaction Coordination');
      } catch (validationError) {
        // Show user-friendly error
        const errorMessage = validationError instanceof Error 
          ? validationError.message 
          : getStripeConfigError('Transaction Coordination');
        
        toast.error(errorMessage);
        setIsSubmitting(false);
        return;
      }

      // Create Stripe checkout session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) throw new Error("No active session");

      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('tc-checkout', {
        body: {
          priceId: priceId,
          applicationId: appId,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (checkoutError) throw checkoutError;

      if (checkoutData?.url) {
        window.location.href = checkoutData.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error("Application submission error:", errorMessage);
      toast.error(errorMessage || "Failed to submit application. Please try again.");
      setIsSubmitting(false);
    }
  };

  const progress = (currentStep / 3) * 100;

  return (
    <Layout>
      <SEO
        title="Transaction Coordination Application | Notroom"
        description="Apply for professional transaction coordination services. Complete the secure intake form to get started."
        canonical="https://notroom.com/transaction-coordination/application"
      />

      <section className="py-16 pt-32 bg-muted/30 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* Progress Indicator */}
            <div className="mb-8">
              <div className="flex justify-between mb-2 text-sm text-muted-foreground">
                <span>Step {currentStep} of 3</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Step 1: Client Information */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Step 1: Client Information
                  </CardTitle>
                  <CardDescription>
                    Tell us about yourself and how to reach you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Full Name *</Label>
                    <Input
                      id="clientName"
                      value={formData.clientName}
                      onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                      placeholder="John Doe"
                      className={errors.clientName ? "border-destructive" : ""}
                    />
                    {errors.clientName && <p className="text-sm text-destructive">{errors.clientName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientEmail">Email Address *</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                      placeholder="john@example.com"
                      className={errors.clientEmail ? "border-destructive" : ""}
                    />
                    {errors.clientEmail && <p className="text-sm text-destructive">{errors.clientEmail}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientPhone">Phone Number *</Label>
                    <Input
                      id="clientPhone"
                      type="tel"
                      value={formData.clientPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                      placeholder="(814) 555-0100"
                      className={errors.clientPhone ? "border-destructive" : ""}
                    />
                    {errors.clientPhone && <p className="text-sm text-destructive">{errors.clientPhone}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name (Optional)</Label>
                    <Input
                      id="businessName"
                      value={formData.businessName}
                      onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                      placeholder="Acme Corporation"
                    />
                    <p className="text-xs text-muted-foreground">If this transaction is related to a business</p>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button onClick={nextStep} size="lg">
                      Continue to Transaction Details
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Transaction Details */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Step 2: Transaction Details
                  </CardTitle>
                  <CardDescription>
                    Tell us about your transaction and coordination needs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="transactionType">Transaction Type *</Label>
                    <Select
                      value={formData.transactionType}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, transactionType: value }))}
                    >
                      <SelectTrigger className={errors.transactionType ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select transaction type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="real_estate">Real Estate Transaction</SelectItem>
                        <SelectItem value="business_sale">Business Sale</SelectItem>
                        <SelectItem value="merger_acquisition">Merger & Acquisition</SelectItem>
                        <SelectItem value="contract_negotiation">Contract Negotiation</SelectItem>
                        <SelectItem value="settlement">Settlement Agreement</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.transactionType && <p className="text-sm text-destructive">{errors.transactionType}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transactionDescription">Transaction Description *</Label>
                    <Textarea
                      id="transactionDescription"
                      value={formData.transactionDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, transactionDescription: e.target.value }))}
                      placeholder="Describe your transaction, key stakeholders, what needs to be coordinated, and any special requirements..."
                      rows={6}
                      className={errors.transactionDescription ? "border-destructive" : ""}
                    />
                    {errors.transactionDescription && <p className="text-sm text-destructive">{errors.transactionDescription}</p>}
                    <p className="text-xs text-muted-foreground">Minimum 10 characters, maximum 2000 characters</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Parties Involved *</Label>
                    <div className="flex gap-2">
                      <Input
                        value={partyInput}
                        onChange={(e) => setPartyInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addParty())}
                        placeholder="Add party name or entity"
                      />
                      <Button type="button" onClick={addParty} variant="outline">Add</Button>
                    </div>
                    {formData.partiesInvolved.filter(p => p).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.partiesInvolved.filter(p => p).map((party, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {party}
                            <button
                              type="button"
                              onClick={() => removeParty(index)}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    {errors.partiesInvolved && <p className="text-sm text-destructive">{errors.partiesInvolved}</p>}
                    <p className="text-xs text-muted-foreground">List all parties involved in the transaction (buyers, sellers, attorneys, lenders, etc.)</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Key Documents (Optional)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={documentInput}
                        onChange={(e) => setDocumentInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDocument())}
                        placeholder="Add document name"
                      />
                      <Button type="button" onClick={addDocument} variant="outline">Add</Button>
                    </div>
                    {formData.keyDocuments && formData.keyDocuments.filter(d => d).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.keyDocuments.filter(d => d).map((doc, index) => (
                          <Badge key={index} variant="outline" className="flex items-center gap-1">
                            {doc}
                            <button
                              type="button"
                              onClick={() => removeDocument(index)}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">List any key documents you already have or know will be needed</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="targetCompletionDate">Target Completion Date (Optional)</Label>
                      <Input
                        id="targetCompletionDate"
                        type="date"
                        value={formData.targetCompletionDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, targetCompletionDate: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Urgency Level *</Label>
                      <Select
                        value={formData.urgencyLevel}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, urgencyLevel: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard (Normal Timeline)</SelectItem>
                          <SelectItem value="expedited">Expedited (Faster Processing)</SelectItem>
                          <SelectItem value="rush">Rush (Urgent Deadline)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button onClick={prevStep} variant="outline">
                      <ArrowLeft className="mr-2 w-4 h-4" />
                      Back
                    </Button>
                    <Button onClick={nextStep} size="lg">
                      Continue to Plan Selection
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Plan Selection */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Step 3: Select Your Coordination Plan
                  </CardTitle>
                  <CardDescription>
                    Choose the plan that best matches your transaction complexity
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <RadioGroup
                    value={formData.selectedPlan}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, selectedPlan: value }))}
                    className="space-y-4"
                  >
                    {Object.entries(TC_PLANS).map(([key, plan]) => (
                      <Card
                        key={key}
                        className={`cursor-pointer transition-all ${
                          formData.selectedPlan === key
                            ? 'border-2 border-primary shadow-lg'
                            : 'hover:border-primary/50'
                        }`}
                        onClick={() => setFormData(prev => ({ ...prev, selectedPlan: key }))}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <RadioGroupItem value={key} id={key} className="mt-1" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <Label htmlFor={key} className="text-xl font-bold cursor-pointer">
                                  {plan.shortName} - {plan.price}
                                </Label>
                                {plan.recommended && (
                                  <Badge className="bg-primary">Recommended</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
                              <div className="mb-3 p-3 bg-muted rounded-lg">
                                <p className="text-xs font-semibold text-muted-foreground mb-1">Ideal For:</p>
                                <p className="text-sm text-foreground">{plan.idealFor}</p>
                              </div>
                              <ul className="space-y-1 text-sm">
                                {plan.features.slice(0, 4).map((feature, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                                    <span>{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </RadioGroup>

                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Note:</strong> Pricing is per transaction. All plans include secure document handling, deadline tracking, and professional coordination support. You can upgrade or downgrade during the transaction if your needs change.
                    </p>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button onClick={prevStep} variant="outline">
                      <ArrowLeft className="mr-2 w-4 h-4" />
                      Back
                    </Button>
                    <Button
                      onClick={handleSubmitAndCheckout}
                      size="lg"
                      disabled={isSubmitting}
                      className="min-w-[200px]"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Processing...
                        </>
                      ) : (
                        <>
                          Proceed to Payment
                          <ArrowRight className="ml-2 w-4 h-4" />
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

export default TcApplication;

