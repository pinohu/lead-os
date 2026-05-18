import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, MapPin, FileText, Users, Clock, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { CommunityData } from "@/data/communityData";
import { formatPhoneNumber } from "@/utils/validation";
import BiometricConsent from "@/components/BiometricConsent";
import { getPriceIdForService, getProductForService, STRIPE_PRODUCTS } from "@/constants/stripeProducts";
import { calculateDistance, calculateRoundTripDistance } from "@/utils/distanceCalculation";
import { PRICING } from "@/constants/pricing";
import EmailVerification from "@/components/EmailVerification";
import { logger } from "@/utils/logger";

// Cloudflare Turnstile site key (get from Cloudflare dashboard)
const TURNSTILE_SITE_KEY = "0x4AAAAAAB8ttRw5M8Z_vCdC";

const bookingSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().min(1, "Phone number is required").max(20, "Phone number must be less than 20 characters"),
  service: z.enum([
    "ron", "mobile", "loan", "apostille", "i9", "registered_office", 
    "business_retainer", "certified_copies", 
    "witness", "passport_photos", "translation", 
    "vehicle_title", "virtual_mailbox", "ucc_filing", "document_retrieval"
  ], { required_error: "Please select a service" }),
  preferred_date: z.date().optional(),
  preferred_time: z.string().optional(),
  document_type: z.string().max(100).optional(),
  number_of_signers: z.number().min(1).max(20).default(1),
  location_address: z.string().max(300).optional(),
    urgency: z.enum(["flexible", "within_week", "within_24hrs", "same_day"]).default("flexible"),
  message: z.string().max(1000, "Message must be less than 1000 characters").optional(),
  sms_opt_in: z.boolean().default(false),
  whatsapp_opt_in: z.boolean().default(false),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingFormProps {
  community?: CommunityData;
}

const BookingForm = ({ community }: BookingFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionField, setActiveSuggestionField] = useState<string | null>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    phone: string;
    service: string;
    preferred_date?: Date;
    preferred_time: string;
    document_type: string;
    number_of_signers: number;
    location_address: string;
    urgency: string;
    message: string;
    sms_opt_in: boolean;
    whatsapp_opt_in: boolean;
  }>({
    name: "",
    email: "",
    phone: "",
    service: "",
    preferred_time: "",
    document_type: "",
    number_of_signers: 1,
    location_address: "",
    urgency: "flexible",
    message: "",
    sms_opt_in: false,
    whatsapp_opt_in: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showBiometricConsent, setShowBiometricConsent] = useState(false);
  const [biometricConsent, setBiometricConsent] = useState(false);
  const [showPaymentPrompt, setShowPaymentPrompt] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [turnstileLoaded, setTurnstileLoaded] = useState(false);
  const [turnstileWidgetId, setTurnstileWidgetId] = useState<string | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ field: string; message: string }[]>([]);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  // Detect referral code from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      setReferralCode(refCode);
      toast.success("🎁 Referral discount applied! You'll save $25 on this booking.");
      logger.log("Referral code detected:", refCode);
    }
  }, []);

  // Load Turnstile script and set up callback
  useEffect(() => {
    // Define global callback for Turnstile
    window.onTurnstileSuccess = (token: string) => {
      logger.info("Turnstile token received");
      setTurnstileToken(token);
    };

    // Load Turnstile script if not already loaded
    if (!document.querySelector('script[src*="challenges.cloudflare.com"]')) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        logger.info("Turnstile script loaded");
        setTurnstileLoaded(true);
      };
      script.onerror = () => {
        logger.error("Failed to load Turnstile script");
      };
      document.head.appendChild(script);
    } else {
      setTurnstileLoaded(true);
    }

    return () => {
      delete window.onTurnstileSuccess;
    };
  }, []);

  // Render Turnstile widget when on step 3 and script is loaded
  useEffect(() => {
    if (currentStep === 3 && turnstileLoaded && turnstileRef.current && !turnstileWidgetId) {
      // Check if widget already exists
      const existingWidget = turnstileRef.current.querySelector('iframe');
      if (!existingWidget && window.turnstile) {
        logger.info("Rendering Turnstile widget");
        const widgetId = window.turnstile.render(turnstileRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token: string) => {
            logger.info("Turnstile verification successful");
            setTurnstileToken(token);
          },
          theme: 'auto',
        });
        setTurnstileWidgetId(widgetId);
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (turnstileWidgetId && window.turnstile) {
        try {
          window.turnstile.remove(turnstileWidgetId);
        } catch (e) {
          logger.debug("Turnstile cleanup:", e);
        }
      }
    };
  }, [currentStep, turnstileLoaded, turnstileWidgetId]);

  // Generate 15-minute time slots based on urgency
  useEffect(() => {
    const generateTimeSlots = () => {
      const slots: string[] = [];
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Determine start time based on urgency
      let startHour = 8;
      let startMinute = 0;
      
      if (formData.urgency === 'same_day' || formData.urgency === 'within_24hrs') {
        // For urgent requests, start from next available 15-min slot + 15min buffer
        const nextSlot = Math.ceil((currentMinute + 15) / 15) * 15;
        if (nextSlot >= 60) {
          startHour = currentHour + 1;
          startMinute = 0;
        } else {
          startHour = currentHour;
          startMinute = nextSlot;
        }
      }
      
      // Generate slots from 8 AM to 8 PM
      for (let hour = Math.max(8, startHour); hour < 20; hour++) {
        const startMinuteForHour = hour === startHour ? startMinute : 0;
        for (let minute = startMinuteForHour; minute < 60; minute += 15) {
          const period = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
          const displayMinute = minute.toString().padStart(2, '0');
          slots.push(`${displayHour}:${displayMinute} ${period}`);
        }
      }
      
      setAvailableTimeSlots(slots);
    };
    
    if (formData.urgency) {
      generateTimeSlots();
    }
  }, [formData.urgency, formData.preferred_date]);

  // Validation function
  const validateStep = (step: number): { field: string; message: string }[] => {
    const errors: { field: string; message: string }[] = [];
    
    if (step === 1) {
      if (!formData.name.trim()) {
        errors.push({ field: 'name', message: 'Full name is required' });
      } else if (formData.name.length > 100) {
        errors.push({ field: 'name', message: 'Name must be less than 100 characters' });
      }
      
      if (!formData.email.trim()) {
        errors.push({ field: 'email', message: 'Email address is required' });
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.push({ field: 'email', message: 'Please enter a valid email address' });
      }
      
      if (!formData.phone.trim()) {
        errors.push({ field: 'phone', message: 'Phone number is required' });
      } else if (formData.phone.replace(/\D/g, '').length < 10) {
        errors.push({ field: 'phone', message: 'Please enter a valid 10-digit phone number' });
      }
    }
    
    if (step === 2) {
      if (!formData.service) {
        errors.push({ field: 'service', message: 'Please select a service' });
      }
      
      if (formData.service === 'mobile' && !formData.location_address.trim()) {
        errors.push({ field: 'location_address', message: 'Service location is required for mobile notary' });
      }
    }
    
    if (step === 3) {
      if (!agreedToTerms) {
        errors.push({ field: 'terms', message: 'You must agree to the Terms of Service and Privacy Policy' });
      }
      
      if (formData.service === 'ron' && !biometricConsent) {
        errors.push({ field: 'biometric', message: 'Biometric consent is required for Remote Online Notarization' });
      }
      
      if (!turnstileToken) {
        errors.push({ field: 'turnstile', message: 'Please complete the security verification' });
      }
      
      if (!emailVerified) {
        errors.push({ field: 'email_verification', message: 'Please verify your email address' });
      }
    }
    
    return errors;
  };

  const canProceedFromStep1 = formData.name && formData.email && formData.phone;
  const canProceedFromStep2 = formData.service && (formData.service !== "mobile" || formData.location_address);

  const getServiceTitle = () => {
    const communityName = community?.name || "";
    const titles: Record<string, string> = {
      ron: `Book Your Remote Online Notary${communityName ? ` - ${communityName}` : ""}`,
      mobile: `Book Your Mobile Notary${communityName ? ` in ${communityName}` : " Service"}`,
      loan: `Book Your Loan Signing Agent${communityName ? ` - ${communityName}` : ""}`,
      apostille: `Book Apostille Services${communityName ? ` - ${communityName}` : ""}`,
      i9: `Book I-9 Verification${communityName ? ` - ${communityName}` : ""}`,
      registered_office: `Book Registered Office Service${communityName ? ` - ${communityName}` : ""}`,
      business_retainer: `Business Retainer Plans${communityName ? ` - ${communityName}` : ""}`,
      certified_copies: `Book Certified Copies Service${communityName ? ` - ${communityName}` : ""}`,
      
      witness: `Book Professional Witness Service${communityName ? ` - ${communityName}` : ""}`,
      passport_photos: `Book Passport Photos${communityName ? ` - ${communityName}` : ""}`,
      translation: `Book Translation Certification${communityName ? ` - ${communityName}` : ""}`,
      vehicle_title: `Book Vehicle Title Transfer${communityName ? ` - ${communityName}` : ""}`,
      virtual_mailbox: `Book Virtual Mailbox Service${communityName ? ` - ${communityName}` : ""}`,
      ucc_filing: `Book UCC Filing Service${communityName ? ` - ${communityName}` : ""}`,
      document_retrieval: `Book Document Retrieval${communityName ? ` - ${communityName}` : ""}`,
    };
    return formData.service ? titles[formData.service] || `Book Your Notary Service${communityName ? ` in ${communityName}` : ""}` : `Book Your Notary Service${communityName ? ` in ${communityName}` : ""}`;
  };

  // Common PA street names for autocomplete
  const getLocationSuggestions = (input: string) => {
    const paAddresses = [
      "Main Street",
      "State Street",
      "Peach Street",
      "West 8th Street",
      "East 12th Street",
      "26th Street",
      "38th Street",
      "Peninsula Drive",
      "Interchange Road",
      ...(community?.landmarks || [])
    ];
    
    return paAddresses
      .filter(addr => addr.toLowerCase().includes(input.toLowerCase()))
      .slice(0, 5)
      .map(addr => `${addr}${community?.name ? `, ${community.name}, PA` : ", PA"}`);
  };

  // Handle phone number formatting
  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setFormData({ ...formData, phone: formatted });
  };

  // Handle location input with suggestions
  const handleLocationChange = (value: string) => {
    setFormData({ ...formData, location_address: value });
    if (value.length > 2) {
      const locationSuggestions = getLocationSuggestions(value);
      setSuggestions(locationSuggestions);
      setShowSuggestions(locationSuggestions.length > 0);
      setActiveSuggestionField('location');
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: string) => {
    if (activeSuggestionField === 'location') {
      setFormData({ ...formData, location_address: suggestion });
    }
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Comprehensive validation
    const errors = validateStep(3);
    
    // Security Check 1: Honeypot field
    if (honeypot) {
      // Bot detected - silently fail
      toast.error("Please try again.");
      return;
    }

    if (errors.length > 0) {
      setFormErrors(errors);
      errorSummaryRef.current?.focus();
      toast.error('Please fix the errors before submitting');
      return;
    }

    // Security Check 2: Turnstile verification
    if (!turnstileToken) {
      toast.error("Please complete the security verification.");
      return;
    }

    // Validate terms agreement
    if (!agreedToTerms) {
      toast.error("You must agree to the Terms of Service and Privacy Policy to continue.");
      return;
    }

    // Check if RON service requires biometric consent
    if (formData.service === "ron" && !biometricConsent) {
      setShowBiometricConsent(true);
      toast.error("Biometric data consent is required for Remote Online Notarization.");
      return;
    }

    // Security Check 3: Email verification
    if (!emailVerified) {
      setShowEmailVerification(true);
      return;
    }

    setFormErrors([]);
    setIsSubmitting(true);

    try {
      // Validate form data
      const validatedData = bookingSchema.parse({
        ...formData,
        preferred_date: formData.preferred_date || undefined,
        preferred_time: formData.preferred_time || undefined,
        document_type: formData.document_type || undefined,
        location_address: formData.location_address || undefined,
        message: formData.message || undefined
      });

      // Insert booking into database
      const { data: bookingData, error } = await supabase
        .from("bookings")
        .insert([{
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone,
          service: validatedData.service,
          preferred_date: validatedData.preferred_date ? format(validatedData.preferred_date, "yyyy-MM-dd") : null,
          preferred_time: validatedData.preferred_time || null,
          document_type: validatedData.document_type || null,
          number_of_signers: validatedData.number_of_signers,
          location_address: validatedData.location_address || null,
          urgency: validatedData.urgency,
          message: validatedData.message || null,
          sms_opt_in: formData.sms_opt_in,
          whatsapp_opt_in: formData.whatsapp_opt_in
        }])
        .select()
        .single();

      if (error) {
        logger.error("Booking submission error:", error);
        toast.error("Failed to submit booking. Please try again.");
        return;
      }

      // PHASE 12: Trigger Master Automation Orchestrator
      // This replaces individual calls and handles all automation end-to-end:
      // - SMS-iT sync (Phase 2)
      // - SuiteDash sync (Phase 7)
      // - AI Lead Scoring (Phase 10)
      // - Confirmation SMS
      // - Auto-followup sequence start (Phase 3-4)
      try {
        const automationResult = await supabase.functions.invoke('smsit-master-automation', {
          body: {
            eventType: 'new_booking',
            bookingId: bookingData.id
          }
        });

        logger.log("Master automation triggered:", automationResult);

        if (!automationResult.error) {
          toast.success("🎉 Booking confirmed! Our automation system is processing your request.");
        }
      } catch (automationError) {
        logger.error("Master automation error:", automationError);
        
        // Fallback: If master automation fails, send confirmation email manually
        try {
          await supabase.functions.invoke('send-booking-confirmation', {
            body: {
              name: validatedData.name,
              email: validatedData.email,
              service: validatedData.service,
              preferredDate: validatedData.preferred_date ? format(validatedData.preferred_date, "PPP") : undefined,
              preferredTime: validatedData.preferred_time || undefined,
              bookingId: bookingData.id
            }
          });
        } catch (emailError) {
          logger.error("Email fallback error:", emailError);
        }
      }

      // Legacy: Keep smsit-sync call as backup (will be removed once master automation is stable)
      try {
        await supabase.functions.invoke('smsit-sync', {
          body: {
            booking: {
              id: bookingData.id,
              name: validatedData.name,
              email: validatedData.email,
              phone: validatedData.phone,
              service: validatedData.service,
              location_address: validatedData.location_address || undefined,
              preferred_date: validatedData.preferred_date ? format(validatedData.preferred_date, "yyyy-MM-dd") : undefined,
              preferred_time: validatedData.preferred_time || undefined,
              message: validatedData.message || undefined,
              urgency: validatedData.urgency,
            },
            action: 'full_sync'
          }
        });
        logger.log("Booking synced to SMS-iT CRM - Lead automation started");
      } catch (smsitError) {
        logger.error("SMS-iT sync error:", smsitError);
        // Don't fail the booking if SMS-iT sync fails
      }

      // Sync booking to calendars (Lunacal & Google Calendar)
      try {
        await supabase.functions.invoke('sync-calendar', {
          body: {
            bookingId: bookingData.id,
            action: 'sync'
          }
        });
        logger.log("Booking synced to calendars successfully");
      } catch (calendarError) {
        logger.error("Calendar sync error:", calendarError);
        // Don't fail the booking if calendar sync fails
      }

      // Send notification if user opted in (WhatsApp preferred, SMS fallback)
      if (formData.whatsapp_opt_in || formData.sms_opt_in) {
        try {
          const message = `Hi ${validatedData.name}! Your ${validatedData.service.toUpperCase()} notary appointment has been received. Booking ID: ${bookingData.id.slice(0, 8)}. We'll contact you within 2 hours to confirm. - Notroom`;
          
          await supabase.functions.invoke('send-sms-notification', {
            body: {
              phone: validatedData.phone,
              message: message,
              bookingId: bookingData.id,
              preferWhatsApp: formData.whatsapp_opt_in
            }
          });
          
          logger.log(`Notification sent via ${formData.whatsapp_opt_in ? 'WhatsApp (preferred)' : 'SMS'}`);
        } catch (notificationError) {
          logger.error("Notification sending error:", notificationError);
          // Don't fail the booking if notification fails
        }
      }

      // Process referral if referral code exists
      if (referralCode) {
        try {
          await supabase.functions.invoke('smsit-referral', {
            body: {
              bookingId: bookingData.id,
              referralCode: referralCode,
              action: 'process_referral'
            }
          });
          
          logger.log("Referral processed successfully", { referralCode });
          
          toast.success("🎉 Referral rewards sent! You and your referrer both get $25 off!");
        } catch (referralError) {
          logger.error("Referral processing error:", referralError);
          // Don't fail the booking if referral fails
        }
      }

      // Calculate price and show payment prompt
      await handlePaymentPrompt(bookingData.id, validatedData);
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Show first validation error
        toast.error(error.errors[0].message);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentPrompt = async (bookingId: string, validatedData: BookingFormData) => {
    setCurrentBookingId(bookingId);
    
    // Calculate price based on service
    let totalPrice = 0;
    
    if (validatedData.service === "ron") {
      totalPrice = STRIPE_PRODUCTS.RON.amount;
    } else if (validatedData.service === "mobile") {
      totalPrice = STRIPE_PRODUCTS.MOBILE_NOTARY.base_amount;
      
      // Add mileage if location provided
      if (validatedData.location_address) {
        try {
          const distanceResult = await calculateDistance(validatedData.location_address);
          if (distanceResult.distance) {
            const roundTrip = calculateRoundTripDistance(distanceResult.distance);
            const mileageFee = Math.round(roundTrip * PRICING.MOBILE.mileageRate * 100); // Convert to cents
            totalPrice += mileageFee;
          }
        } catch (error) {
          logger.error("Distance calculation error:", error);
        }
      }
    } else if (validatedData.service === "loan") {
      totalPrice = STRIPE_PRODUCTS.LOAN_SIGNING.amount;
    }
    
    setCalculatedPrice(totalPrice);
    setShowPaymentPrompt(true);
  };

  const handlePayNow = async () => {
    if (!currentBookingId || !calculatedPrice) {
      toast.error("Payment information missing. Please try again.");
      return;
    }

    if (!turnstileToken) {
      toast.error("Security verification expired. Please refresh the page.");
      return;
    }

    setIsProcessingPayment(true);

    try {
      const priceId = getPriceIdForService(formData.service);
      const useCustomAmount = formData.service === "mobile" && calculatedPrice !== STRIPE_PRODUCTS.MOBILE_NOTARY.base_amount;

      const { data, error } = await supabase.functions.invoke('create-payment-secure', {
        body: {
          priceId: useCustomAmount ? null : priceId,
          customAmount: useCustomAmount ? calculatedPrice : null,
          bookingId: currentBookingId,
          customerEmail: formData.email,
          customerName: formData.name,
          turnstileToken,
        }
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      logger.error("Payment error:", error);
      toast.error("Failed to process payment. Please try again or contact us.");
      setIsProcessingPayment(false);
    }
  };

  const handlePayLater = () => {
    toast.success("Thank you! We'll contact you within 2 hours to confirm your appointment and arrange payment.");
    resetForm();
  };

  const resetForm = () => {
    setCurrentStep(1);
    setAgreedToTerms(false);
    setBiometricConsent(false);
    setShowBiometricConsent(false);
    setShowPaymentPrompt(false);
    setCalculatedPrice(null);
    setCurrentBookingId(null);
    setHoneypot("");
    setTurnstileToken(null);
    setTurnstileWidgetId(null);
    setEmailVerified(false);
    setSmsOptIn(false);
    setAvailableTimeSlots([]);
    setFormData({
      name: "",
      email: "",
      phone: "",
      service: "",
      preferred_date: undefined,
      preferred_time: "",
      document_type: "",
      number_of_signers: 1,
      location_address: "",
      urgency: "flexible",
      message: "",
      sms_opt_in: false,
      whatsapp_opt_in: false
    });

    // Reset Turnstile widget
    if (window.turnstile && turnstileWidgetId) {
      try {
        window.turnstile.remove(turnstileWidgetId);
      } catch (e) {
        logger.debug("Turnstile widget removal failed:", e);
      }
    }
  };

  return (
    <section id="booking-form" className="py-20 bg-background" aria-labelledby="booking-form-title">
      {/* ARIA Live Region for Form Status Announcements */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
        aria-relevant="additions text"
      >
        {currentStep === 1 && "Step 1 of 3: Contact Information"}
        {currentStep === 2 && "Step 2 of 3: Service Details"}
        {currentStep === 3 && "Step 3 of 3: Scheduling Preferences"}
      </div>
      
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 id="booking-form-title" className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {getServiceTitle()}
            </h2>
            <p className="text-xl text-muted-foreground">
              {community 
                ? `Trusted by ${community.name} residents and businesses. Complete the form below for fast, professional notary service.`
                : formData.service 
                  ? "Complete the form below and we'll contact you within 2 hours to confirm your appointment."
                  : "Select a service and complete the form below. We'll contact you within 2 hours to confirm your appointment."}
            </p>
          </div>

          {/* Progress Indicator */}
          <div 
            className="mb-8" 
            role="progressbar" 
            aria-valuenow={currentStep} 
            aria-valuemin={1} 
            aria-valuemax={3}
            aria-valuetext={`Step ${currentStep} of 3: ${['Contact Information', 'Service Details', 'Scheduling Preferences'][currentStep-1]}`}
          >
            <div className="flex items-center justify-between max-w-md mx-auto">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      currentStep >= step
                        ? "bg-primary text-primary-foreground shadow-lg"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step}
                  </div>
                  {step < 3 && (
                    <div
                      className={`flex-1 h-1 mx-2 transition-all ${
                        currentStep > step ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between max-w-md mx-auto mt-2">
              <span className={`text-xs ${currentStep >= 1 ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                Contact
              </span>
              <span className={`text-xs ${currentStep >= 2 ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                Service
              </span>
              <span className={`text-xs ${currentStep >= 3 ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                Schedule
              </span>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Error Summary */}
            {formErrors.length > 0 && (
              <div 
                ref={errorSummaryRef}
                tabIndex={-1}
                role="alert"
                aria-labelledby="error-summary-title"
                className="bg-destructive/10 border-2 border-destructive rounded-lg p-6 animate-in fade-in slide-in-from-top-4 duration-300"
              >
                <h3 
                  id="error-summary-title" 
                  className="text-lg font-semibold text-destructive flex items-center gap-2 mb-4"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-6 w-6" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                    />
                  </svg>
                  There {formErrors.length === 1 ? 'is' : 'are'} {formErrors.length} error{formErrors.length === 1 ? '' : 's'} with your submission
                </h3>
                <ul className="space-y-2" role="list">
                  {formErrors.map((error, index) => (
                    <li key={index} className="text-sm">
                      <a
                        href={`#${error.field}`}
                        onClick={(e) => {
                          e.preventDefault();
                          const element = document.getElementById(error.field);
                          element?.focus();
                          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className="text-destructive hover:text-destructive/80 underline font-medium focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2 rounded"
                      >
                        {error.message}
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-muted-foreground mt-4">
                  Please correct these errors and try again.
                </p>
              </div>
            )}

            {/* Step 1: Contact Information */}
            {currentStep === 1 && (
              <div className="space-y-6 p-6 rounded-lg border border-border bg-card animate-in fade-in slide-in-from-bottom-4 duration-300">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Contact Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">
                      Full Name <span className="text-destructive" aria-label="required">*</span>
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      autoComplete="name"
                      aria-required="true"
                      aria-describedby={formErrors.some(e => e.field === 'name') ? "name-error name-hint" : "name-hint"}
                      placeholder="John Doe"
                      required
                      aria-invalid={formErrors.some(e => e.field === 'name')}
                    />
                    {formErrors.some(e => e.field === 'name') && (
                      <p id="name-error" className="text-sm text-destructive mt-1">
                        {formErrors.find(e => e.field === 'name')?.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone">
                      Phone Number <span className="text-destructive" aria-label="required">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="tel"
                      value={formData.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="(814) 555-0123"
                      autoComplete="tel"
                      required
                      aria-required="true"
                      aria-describedby={formErrors.some(e => e.field === 'phone') ? "phone-error phone-hint" : "phone-hint"}
                      aria-invalid={formErrors.some(e => e.field === 'phone')}
                    />
                    <p id="phone-hint" className="text-xs text-muted-foreground mt-1">Format applied automatically</p>
                    {formErrors.some(e => e.field === 'phone') && (
                      <p id="phone-error" className="text-sm text-destructive mt-1">
                        {formErrors.find(e => e.field === 'phone')?.message}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">
                    Email Address <span className="text-destructive" aria-label="required">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    inputMode="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    autoComplete="email"
                    required
                    aria-required="true"
                    aria-describedby={formErrors.some(e => e.field === 'email') ? "email-error email-hint" : "email-hint"}
                    aria-invalid={formErrors.some(e => e.field === 'email')}
                  />
                  <p id="email-hint" className="sr-only">We'll send your booking confirmation here</p>
                  {formErrors.some(e => e.field === 'email') && (
                    <p id="email-error" className="text-sm text-destructive mt-1">
                      {formErrors.find(e => e.field === 'email')?.message}
                    </p>
                  )}
                </div>
                <Button 
                  type="button"
                  onClick={() => {
                    const errors = validateStep(1);
                    if (errors.length > 0) {
                      setFormErrors(errors);
                      errorSummaryRef.current?.focus();
                      toast.error('Please fix the errors before continuing');
                    } else {
                      setFormErrors([]);
                      setCurrentStep(2);
                    }
                  }}
                  disabled={!canProceedFromStep1}
                  className="w-full"
                >
                  Continue to Service Details
                </Button>
              </div>
            )}

            {/* Step 2: Service Details */}
            {currentStep === 2 && (
              <div className="space-y-6 p-6 rounded-lg border border-border bg-card animate-in fade-in slide-in-from-bottom-4 duration-300">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Service Details
                </h3>
                <div>
                  <Label htmlFor="service">
                    Select Service <span className="text-destructive" aria-label="required">*</span>
                  </Label>
                  <Select 
                    value={formData.service}
                    onValueChange={(value) => setFormData({ ...formData, service: value })}
                  >
                    <SelectTrigger 
                      aria-required="true"
                      aria-invalid={formErrors.some(e => e.field === 'service')}
                      aria-describedby={formErrors.some(e => e.field === 'service') ? "service-error" : undefined}
                    >
                      <SelectValue placeholder="Choose your service" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover/98 backdrop-blur-md z-[100]">
                      <SelectItem value="ron">Remote Online Notary (RON) - $60</SelectItem>
                      <SelectItem value="mobile">Mobile Notary Service - $125+</SelectItem>
                      <SelectItem value="loan">Loan Signing Agent - $175</SelectItem>
                      <SelectItem value="apostille">Apostille Services - Contact for pricing</SelectItem>
                      <SelectItem value="i9">I-9 Verification - Contact for pricing</SelectItem>
                      <SelectItem value="registered_office">Registered Office & Filings - Contact for pricing</SelectItem>
                      <SelectItem value="business_retainer">Business Retainer Plans - Contact for pricing</SelectItem>
                      <SelectItem value="certified_copies">Certified Copies - Contact for pricing</SelectItem>
                      
                      <SelectItem value="witness">Professional Witness Service - Contact for pricing</SelectItem>
                      <SelectItem value="passport_photos">Passport Photos - Contact for pricing</SelectItem>
                      <SelectItem value="translation">Translation Certification - Contact for pricing</SelectItem>
                      <SelectItem value="vehicle_title">Vehicle Title Transfer - Contact for pricing</SelectItem>
                      <SelectItem value="virtual_mailbox">Virtual Mailbox - Contact for pricing</SelectItem>
                      <SelectItem value="ucc_filing">UCC Filing - Contact for pricing</SelectItem>
                      <SelectItem value="document_retrieval">Document Retrieval - Contact for pricing</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.some(e => e.field === 'service') && (
                    <p id="service-error" className="text-sm text-destructive mt-1">
                      {formErrors.find(e => e.field === 'service')?.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="document_type">Document Type (Optional)</Label>
                  <Select 
                    value={formData.document_type}
                    onValueChange={(value) => setFormData({ ...formData, document_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="What needs to be notarized?" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover/98 backdrop-blur-md z-[100]">
                      <SelectItem value="real_estate">Real Estate Document</SelectItem>
                      <SelectItem value="power_of_attorney">Power of Attorney</SelectItem>
                      <SelectItem value="affidavit">Affidavit</SelectItem>
                      <SelectItem value="loan_documents">Loan Documents</SelectItem>
                      <SelectItem value="will">Will/Trust</SelectItem>
                      <SelectItem value="contract">Contract/Agreement</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="number_of_signers">Number of Signers</Label>
                  <Input
                    id="number_of_signers"
                    type="number"
                    min="1"
                    max="20"
                    value={formData.number_of_signers}
                    onChange={(e) => setFormData({ ...formData, number_of_signers: parseInt(e.target.value) || 1 })}
                  />
                </div>

                {formData.service === "mobile" && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300 relative">
                    <Label htmlFor="location_address" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Service Location *
                    </Label>
                    <Input
                      id="location_address"
                      type="text"
                      value={formData.location_address}
                      onChange={(e) => handleLocationChange(e.target.value)}
                      onFocus={() => setActiveSuggestionField('location')}
                      placeholder={community ? `123 Main St, ${community.name}, PA` : "123 Main St, Erie, PA 16501"}
                      required={formData.service === "mobile"}
                      autoComplete="off"
                      aria-invalid={formErrors.some(e => e.field === 'location_address')}
                      aria-describedby={formErrors.some(e => e.field === 'location_address') ? "location-error" : undefined}
                    />
                    {showSuggestions && activeSuggestionField === 'location' && suggestions.length > 0 && (
                      <div 
                        ref={suggestionRef}
                        className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto"
                      >
                        {suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground text-sm transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      {community 
                        ? `Mobile service available throughout ${community.name} and ${community.county}`
                        : "Mobile service is available within Erie County"}
                    </p>
                    {formErrors.some(e => e.field === 'location_address') && (
                      <p id="location-error" className="text-sm text-destructive mt-1">
                        {formErrors.find(e => e.field === 'location_address')?.message}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-4">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="w-full"
                  >
                    Back
                  </Button>
                  <Button 
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    disabled={!canProceedFromStep2}
                    className="w-full"
                  >
                    Continue to Scheduling
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Scheduling */}
            {currentStep === 3 && (
              <div className="space-y-6 p-6 rounded-lg border border-border bg-card animate-in fade-in slide-in-from-bottom-4 duration-300">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Scheduling Preferences
                </h3>
                
                <div>
                  <Label>Urgency</Label>
                  <Select 
                    value={formData.urgency}
                    onValueChange={(value) => setFormData({ ...formData, urgency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover/98 backdrop-blur-md z-[100]">
                      <SelectItem value="flexible">Flexible - Any time works</SelectItem>
                      <SelectItem value="within_week">Within a week</SelectItem>
                      <SelectItem value="within_24hrs">Within 24 hours</SelectItem>
                      <SelectItem value="same_day">Same day (if available)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Preferred Date (Optional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.preferred_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.preferred_date ? format(formData.preferred_date, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                       <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.preferred_date}
                          onSelect={(date) => setFormData({ ...formData, preferred_date: date })}
                          disabled={(date) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            
                            // Disable past dates
                            if (date < today) return true;
                            
                            // For same_day urgency, only allow today
                            if (formData.urgency === 'same_day') {
                              return date.toDateString() !== today.toDateString();
                            }
                            
                            // For within_24hrs, only allow today and tomorrow
                            if (formData.urgency === 'within_24hrs') {
                              const tomorrow = new Date(today);
                              tomorrow.setDate(tomorrow.getDate() + 1);
                              return date > tomorrow;
                            }
                            
                            // For within_week, allow up to 7 days
                            if (formData.urgency === 'within_week') {
                              const weekFromNow = new Date(today);
                              weekFromNow.setDate(weekFromNow.getDate() + 7);
                              return date > weekFromNow;
                            }
                            
                            return false;
                          }}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                   <div>
                    <Label htmlFor="preferred_time">Preferred Time (Optional)</Label>
                    <Select 
                      value={formData.preferred_time}
                      onValueChange={(value) => setFormData({ ...formData, preferred_time: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select time slot" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50 max-h-[300px]">
                        {availableTimeSlots.length > 0 ? (
                          availableTimeSlots.map((slot) => (
                            <SelectItem key={slot} value={slot}>
                              {slot}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="flexible" disabled>
                            Select a date first
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      15-minute intervals with buffer between appointments
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="message">Additional Information (Optional)</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Any special requirements or questions?"
                    rows={4}
                    className="resize-none"
                  />
                </div>

                {/* SMS Opt-in */}
                <div className="bg-muted/20 p-4 rounded-lg border">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="sms-opt-in"
                      checked={smsOptIn}
                      onChange={(e) => {
                        setSmsOptIn(e.target.checked);
                        setFormData({ ...formData, sms_opt_in: e.target.checked });
                      }}
                      className="mt-1 w-4 h-4"
                    />
                    <Label htmlFor="sms-opt-in" className="text-sm cursor-pointer">
                      <span className="font-semibold">📱 SMS Updates (Optional):</span> I would like to receive text message updates about my appointment status and service journey. Standard message rates may apply.
                    </Label>
                  </div>
                </div>

                {/* WhatsApp Opt-in */}
                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-900">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="whatsapp-opt-in"
                      checked={whatsappOptIn}
                      onChange={(e) => {
                        setWhatsappOptIn(e.target.checked);
                        setFormData({ ...formData, whatsapp_opt_in: e.target.checked });
                      }}
                      className="mt-1 w-4 h-4"
                    />
                    <Label htmlFor="whatsapp-opt-in" className="text-sm cursor-pointer">
                      <span className="font-semibold">💬 WhatsApp Updates (Recommended):</span> Get instant updates via WhatsApp with rich media, appointment details, and easy 2-way communication. Free delivery (standard WhatsApp data rates apply).
                    </Label>
                  </div>
                </div>

                {/* Terms and Conditions Clickwrap */}
                <div className="bg-muted/30 p-4 rounded-lg border-2">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="terms-agreement"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-1 w-4 h-4"
                      required
                    />
                    <Label htmlFor="terms-agreement" className="text-sm cursor-pointer">
                      <span className="text-destructive font-bold">* REQUIRED:</span> I have read and agree to the{" "}
                      <button
                        type="button"
                        onClick={() => window.open("/terms-of-service", "_blank")}
                        className="text-primary hover:underline font-semibold"
                      >
                        Terms of Service
                      </button>
                      {" "}and{" "}
                      <button
                        type="button"
                        onClick={() => window.open("/privacy-policy", "_blank")}
                        className="text-primary hover:underline font-semibold"
                      >
                        Privacy Policy
                      </button>
                      . I understand that this creates a legally binding agreement.
                    </Label>
                  </div>
                </div>

                {/* Biometric Consent for RON */}
                {formData.service === "ron" && showBiometricConsent && (
                  <div className="animate-in fade-in slide-in-from-top duration-500">
                    <BiometricConsent
                      onConsent={(consented) => {
                        setBiometricConsent(consented);
                        if (!consented) {
                          toast.info("Biometric consent declined. Consider our mobile notary service instead.");
                        } else {
                          setShowBiometricConsent(false);
                        }
                      }}
                      required={true}
                    />
                  </div>
                )}

                {formData.service === "ron" && !showBiometricConsent && !biometricConsent && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 p-4 rounded">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      <strong>⚠️ Remote Online Notarization Notice:</strong> RON requires collection of biometric data (facial recognition) for identity verification. You will be asked to provide consent before submission.
                    </p>
                  </div>
                )}

                {/* Honeypot field - hidden from users */}
                <input
                  type="text"
                  name="website"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />

                {/* Cloudflare Turnstile CAPTCHA */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Security Verification</Label>
                  <div className="flex justify-center p-4 bg-muted/30 rounded-lg border">
                    {!turnstileLoaded ? (
                      <div className="text-sm text-muted-foreground">Loading security verification...</div>
                    ) : (
                      <div ref={turnstileRef} className="cf-turnstile"></div>
                    )}
                  </div>
                  {turnstileToken && (
                    <p className="text-xs text-success text-center">✓ Security verification completed</p>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFormErrors([]);
                      setCurrentStep(2);
                    }}
                    className="w-full"
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Request Appointment"}
                  </Button>
                </div>
                
                <p className="text-center text-sm text-muted-foreground">
                  We'll review your request and contact you within 2 hours to confirm your appointment
                </p>
              </div>
            )}
          </form>

          {/* Email Verification Dialog */}
          {showEmailVerification && (
            <EmailVerification
              email={formData.email}
              onVerified={() => {
                setEmailVerified(true);
                setShowEmailVerification(false);
                // Auto-submit form after verification
                document.querySelector<HTMLFormElement>('form')?.requestSubmit();
              }}
              onCancel={() => {
                setShowEmailVerification(false);
                setIsSubmitting(false);
              }}
            />
          )}

          {/* Payment Prompt Dialog */}
          {showPaymentPrompt && calculatedPrice && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-card rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="mb-6 text-center">
                  <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-success" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Booking Received!</h3>
                  <p className="text-muted-foreground">
                    Your appointment request has been saved.
                  </p>
                </div>

                <div className="bg-accent/10 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Service:</span>
                    <span className="font-semibold capitalize">{formData.service}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg">
                    <span className="font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-primary">
                      ${(calculatedPrice / 100).toFixed(2)}
                    </span>
                  </div>
                  {formData.service === "mobile" && formData.location_address && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Includes base fee + round-trip mileage
                    </p>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-2 text-sm">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-primary font-semibold">1</span>
                    </div>
                    <p className="text-muted-foreground">Pay now to secure your appointment instantly</p>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-primary font-semibold">2</span>
                    </div>
                    <p className="text-muted-foreground">Or pay later - we'll call you within 2 hours to arrange payment</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handlePayNow}
                    disabled={isProcessingPayment}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessingPayment ? "Processing..." : `Pay Now - $${(calculatedPrice / 100).toFixed(2)}`}
                  </Button>
                  <Button
                    onClick={handlePayLater}
                    disabled={isProcessingPayment}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    Pay Later
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground mt-4">
                  Secure payment powered by Stripe
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default BookingForm;
