import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calculator, DollarSign, MapPin, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PRICING } from "@/constants/pricing";
import { calculateDistance, getOriginAddress, calculateRoundTripDistance } from "@/utils/distanceCalculation";
import { Alert, AlertDescription } from "@/components/ui/alert";

const PricingCalculator = () => {
  const navigate = useNavigate();
  const [service, setService] = useState("ron");
  const [documents, setDocuments] = useState(1);
  const [signers, setSigners] = useState(1);
  const [urgency, setUrgency] = useState("flexible");
  const [loanType, setLoanType] = useState("standard");
  const [serviceLocation, setServiceLocation] = useState("office");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [distance, setDistance] = useState<number | null>(null);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [distanceError, setDistanceError] = useState<string | null>(null);

  // Calculate distance when address changes (debounced)
  useEffect(() => {
    const needsDistance = service === "mobile" || 
                         (service === "loan" && loanType === "mobile") ||
                         (service === "i9" && urgency === "inPerson") ||
                         (service === "witness" && serviceLocation === "mobile") ||
                         (service === "vehicleTitle" && serviceLocation === "mobile") ||
                         (service === "certifiedCopies" && serviceLocation === "mobile") ||
                         (service === "documentPrep" && serviceLocation === "mobile") ||
                         (service === "passportPhotos" && serviceLocation === "mobile");
    if (needsDistance && destinationAddress.length > 10) {
      const timer = setTimeout(async () => {
        setIsCalculatingDistance(true);
        setDistanceError(null);
        const result = await calculateDistance(destinationAddress);
        setDistance(result.distance);
        if (result.error) {
          setDistanceError(result.error);
        }
        setIsCalculatingDistance(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [destinationAddress, service, loanType, serviceLocation, urgency]);

  const calculatePriceBreakdown = () => {
    let breakdown: {
      baseNotaryFee?: number;
      technologyFee?: number;
      serviceFee?: number;
      mileageFee?: number;
      distance?: number;
      agentFee?: number;
      processingFee?: number;
      urgencyMultiplier?: number;
      total: number;
    } = { total: 0 };
    
    if (service === "ron") {
      breakdown.baseNotaryFee = PRICING.RON.notaryFee;
      breakdown.technologyFee = PRICING.RON.technologyFee;
      breakdown.total = PRICING.RON.total;
    } else if (service === "mobile") {
      breakdown.baseNotaryFee = PRICING.MOBILE.notaryFee;
      breakdown.serviceFee = PRICING.MOBILE.serviceFee;
      breakdown.total = PRICING.MOBILE.baseTotal;
      
      // Add mileage if distance is calculated
      if (distance !== null) {
        const roundTripDistance = calculateRoundTripDistance(distance);
        breakdown.distance = roundTripDistance;
        breakdown.mileageFee = roundTripDistance * PRICING.MOBILE.mileageRate;
        breakdown.total += breakdown.mileageFee;
      }
    } else if (service === "apostille") {
      breakdown.baseNotaryFee = PRICING.APOSTILLE.notaryFee;
      breakdown.processingFee = PRICING.APOSTILLE.processingFee;
      breakdown.total = PRICING.APOSTILLE.baseTotal;
    } else if (service === "loan") {
      if (loanType === "mobile") {
        breakdown.baseNotaryFee = PRICING.LOAN_SIGNING_MOBILE.notaryFee;
        breakdown.agentFee = PRICING.LOAN_SIGNING_MOBILE.agentFee;
        breakdown.total = PRICING.LOAN_SIGNING_MOBILE.baseTotal;
        
        // Add mileage if distance is calculated
        if (distance !== null) {
          const roundTripDistance = calculateRoundTripDistance(distance);
          breakdown.distance = roundTripDistance;
          breakdown.mileageFee = roundTripDistance * PRICING.LOAN_SIGNING_MOBILE.mileageRate;
          breakdown.total += breakdown.mileageFee;
        }
      } else {
        breakdown.baseNotaryFee = PRICING.LOAN_SIGNING.notaryFee;
        breakdown.agentFee = PRICING.LOAN_SIGNING.agentFee;
        breakdown.total = PRICING.LOAN_SIGNING.baseTotal;
      }
    } else if (service === "i9") {
      if (urgency === "inPerson") {
        breakdown.serviceFee = PRICING.I9_VERIFICATION_MOBILE.baseFee;
        breakdown.total = PRICING.I9_VERIFICATION_MOBILE.baseFee;
        
        // Add mileage if distance is calculated
        if (distance !== null) {
          const roundTripDistance = calculateRoundTripDistance(distance);
          breakdown.distance = roundTripDistance;
          breakdown.mileageFee = roundTripDistance * PRICING.I9_VERIFICATION_MOBILE.mileageRate;
          breakdown.total += breakdown.mileageFee;
        }
      } else {
        breakdown.total = PRICING.I9_VERIFICATION.remote;
      }
    } else if (service === "certifiedCopies") {
      if (serviceLocation === "mobile") {
        breakdown.serviceFee = PRICING.CERTIFIED_COPIES_MOBILE.perDocument * documents;
        breakdown.total = breakdown.serviceFee;
        
        if (distance !== null) {
          const roundTripDistance = calculateRoundTripDistance(distance);
          breakdown.distance = roundTripDistance;
          breakdown.mileageFee = roundTripDistance * PRICING.CERTIFIED_COPIES_MOBILE.mileageRate;
          breakdown.total += breakdown.mileageFee;
        }
      } else if (serviceLocation === "remote") {
        breakdown.serviceFee = PRICING.CERTIFIED_COPIES.remote * documents;
        breakdown.total = breakdown.serviceFee;
      } else {
        breakdown.serviceFee = PRICING.CERTIFIED_COPIES.office * documents;
        breakdown.total = breakdown.serviceFee;
      }
    } else if (service === "documentPrep") {
      if (serviceLocation === "mobile") {
        
        breakdown.total = breakdown.serviceFee;
        
        if (distance !== null) {
          const roundTripDistance = calculateRoundTripDistance(distance);
          breakdown.distance = roundTripDistance;
          
          breakdown.total += breakdown.mileageFee;
        }
      } else {
        
        breakdown.total = breakdown.serviceFee;
      }
    } else if (service === "witness") {
      if (serviceLocation === "mobile") {
        breakdown.serviceFee = PRICING.WITNESS_SERVICE_MOBILE.baseFee;
        breakdown.total = PRICING.WITNESS_SERVICE_MOBILE.baseFee;
        
        if (distance !== null) {
          const roundTripDistance = calculateRoundTripDistance(distance);
          breakdown.distance = roundTripDistance;
          breakdown.mileageFee = roundTripDistance * PRICING.WITNESS_SERVICE_MOBILE.mileageRate;
          breakdown.total += breakdown.mileageFee;
        }
      } else {
        breakdown.serviceFee = PRICING.WITNESS_SERVICE.baseFee;
        breakdown.total = PRICING.WITNESS_SERVICE.baseFee;
      }
    } else if (service === "passportPhotos") {
      if (serviceLocation === "mobile") {
        breakdown.serviceFee = PRICING.PASSPORT_PHOTOS_MOBILE.perSession;
        breakdown.total = breakdown.serviceFee;
        
        if (distance !== null) {
          const roundTripDistance = calculateRoundTripDistance(distance);
          breakdown.distance = roundTripDistance;
          breakdown.mileageFee = roundTripDistance * PRICING.PASSPORT_PHOTOS_MOBILE.mileageRate;
          breakdown.total += breakdown.mileageFee;
        }
      } else {
        breakdown.serviceFee = PRICING.PASSPORT_PHOTOS.office;
        breakdown.total = breakdown.serviceFee;
      }
    } else if (service === "translationCert") {
      breakdown.serviceFee = PRICING.TRANSLATION_CERT.perPage;
      breakdown.total = PRICING.TRANSLATION_CERT.perPage;
    } else if (service === "vehicleTitle") {
      if (serviceLocation === "mobile") {
        breakdown.serviceFee = PRICING.VEHICLE_TITLE_MOBILE.baseFee;
        breakdown.total = PRICING.VEHICLE_TITLE_MOBILE.baseFee;
        
        if (distance !== null) {
          const roundTripDistance = calculateRoundTripDistance(distance);
          breakdown.distance = roundTripDistance;
          breakdown.mileageFee = roundTripDistance * PRICING.VEHICLE_TITLE_MOBILE.mileageRate;
          breakdown.total += breakdown.mileageFee;
        }
      } else {
        breakdown.serviceFee = PRICING.VEHICLE_TITLE.baseFee;
        breakdown.total = PRICING.VEHICLE_TITLE.baseFee;
      }
    } else if (service === "virtualMailbox") {
      breakdown.serviceFee = PRICING.VIRTUAL_MAILBOX.monthly;
      breakdown.total = PRICING.VIRTUAL_MAILBOX.monthly;
    } else if (service === "uccFiling") {
      breakdown.serviceFee = PRICING.UCC_FILING.baseFee;
      breakdown.total = PRICING.UCC_FILING.baseFee;
    } else if (service === "documentRetrieval") {
      breakdown.serviceFee = PRICING.DOCUMENT_RETRIEVAL.baseFee;
      breakdown.total = PRICING.DOCUMENT_RETRIEVAL.baseFee;
    }

    return breakdown;
  };

  const breakdown = calculatePriceBreakdown();
  const price = Math.round(breakdown.total);

  const getServiceRoute = () => {
    const routes = {
      ron: "/services/remote-online-notary",
      mobile: "/services/mobile-notary",
      apostille: "/services/apostille",
      loan: "/services/loan-signing-agent",
      i9: "/services/i9-verification",
      certifiedCopies: "/services/certified-copies",
      
      witness: "/services/witness-service",
      passportPhotos: "/services/passport-photos",
      translationCert: "/services/translation-certification",
      vehicleTitle: "/services/vehicle-title-transfer",
      virtualMailbox: "/services/virtual-mailbox",
      uccFiling: "/services/ucc-filing",
      documentRetrieval: "/services/document-retrieval"
    };
    return routes[service as keyof typeof routes] || "/";
  };

  const scrollToBooking = () => {
    if (service === "ron" || service === "mobile") {
      navigate("/");
      setTimeout(() => {
        const element = document.getElementById("booking-form");
        element?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      navigate(getServiceRoute());
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="w-6 h-6 text-primary" />
        <h3 className="text-2xl font-bold">Instant Price Calculator</h3>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <Label htmlFor="service-type">Service Type</Label>
          <Select value={service} onValueChange={setService}>
            <SelectTrigger id="service-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover/98 backdrop-blur-md z-[100]">
              <SelectItem value="ron">Remote Online Notary (RON)</SelectItem>
              <SelectItem value="mobile">Mobile Notary</SelectItem>
              <SelectItem value="apostille">Apostille Service</SelectItem>
              <SelectItem value="loan">Loan Signing</SelectItem>
              <SelectItem value="i9">I-9 Verification</SelectItem>
              <SelectItem value="certifiedCopies">Certified Copies</SelectItem>
              
              <SelectItem value="witness">Professional Witness</SelectItem>
              <SelectItem value="passportPhotos">Passport Photos</SelectItem>
              <SelectItem value="translationCert">Translation Certification</SelectItem>
              <SelectItem value="vehicleTitle">Vehicle Title Transfer</SelectItem>
              <SelectItem value="virtualMailbox">Virtual Mailbox</SelectItem>
              <SelectItem value="uccFiling">UCC Filing</SelectItem>
              <SelectItem value="documentRetrieval">Document Retrieval</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {service === "loan" && (
          <div>
            <Label htmlFor="loanType">Service Location</Label>
            <Select value={loanType} onValueChange={setLoanType}>
              <SelectTrigger id="loanType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover/98 backdrop-blur-md z-[100]">
                <SelectItem value="standard">In-Office/Virtual</SelectItem>
                <SelectItem value="mobile">Mobile (We Come to You)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {(service === "witness" || service === "vehicleTitle" || service === "certifiedCopies" || service === "documentPrep" || service === "passportPhotos") && (
          <div>
            <Label htmlFor="serviceLocation">Service Location</Label>
            <Select value={serviceLocation} onValueChange={setServiceLocation}>
              <SelectTrigger id="serviceLocation">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover/98 backdrop-blur-md z-[100]">
                <SelectItem value="office">At Our Office</SelectItem>
                {service === "certifiedCopies" && <SelectItem value="remote">By Mail (+$5)</SelectItem>}
                <SelectItem value="mobile">Mobile (We Come to You)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {service === "certifiedCopies" && (
          <div>
            <Label htmlFor="documents">Number of Documents</Label>
            <Input
              id="documents"
              type="number"
              min="1"
              value={documents}
              onChange={(e) => setDocuments(parseInt(e.target.value) || 1)}
            />
          </div>
        )}

        {(service === "mobile" || (service === "loan" && loanType === "mobile") || (service === "i9" && urgency === "inPerson") || (service === "witness" && serviceLocation === "mobile") || (service === "vehicleTitle" && serviceLocation === "mobile") || (service === "certifiedCopies" && serviceLocation === "mobile") || (service === "documentPrep" && serviceLocation === "mobile") || (service === "passportPhotos" && serviceLocation === "mobile")) && (
          <div>
            <Label htmlFor="destination">Your Address (for distance calculation)</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="destination"
                type="text"
                placeholder="Enter your full address (e.g., 123 Main St, City, PA 12345)"
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Distance calculated from our Erie location
            </p>
            {isCalculatingDistance && (
              <p className="text-xs text-primary mt-1 animate-pulse">
                Calculating distance...
              </p>
            )}
            {distanceError && (
              <Alert className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {distanceError}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {service === "i9" && (
          <div>
            <Label htmlFor="urgency">Verification Type</Label>
            <Select value={urgency} onValueChange={setUrgency}>
              <SelectTrigger id="urgency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover/98 backdrop-blur-md z-[100]">
                <SelectItem value="inPerson">In-Person Verification</SelectItem>
                <SelectItem value="remote">Remote Verification</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="border-t-2 border-primary/20 pt-6">
        {/* Price Breakdown */}
        <div className="bg-background rounded-lg p-4 mb-4 space-y-2">
          <h4 className="font-semibold text-sm mb-3">Price Breakdown:</h4>
          
          {breakdown.baseNotaryFee !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">PA Notary Fee (per signature, legal max)</span>
              <span className="font-medium">${breakdown.baseNotaryFee}</span>
            </div>
          )}
          
          {breakdown.technologyFee !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Technology Platform Fee (video, KBA, storage)</span>
              <span className="font-medium">${breakdown.technologyFee}</span>
            </div>
          )}
          
          {breakdown.serviceFee !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Mobile Service Fee (travel coordination)</span>
              <span className="font-medium">${breakdown.serviceFee}</span>
            </div>
          )}
          
          {breakdown.agentFee !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Signing Agent Service (printing, insurance, scan-back)</span>
              <span className="font-medium">${breakdown.agentFee}</span>
            </div>
          )}
          
          {breakdown.processingFee !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Processing & Coordination</span>
              <span className="font-medium">${breakdown.processingFee}+</span>
            </div>
          )}
          
          {(service === "mobile" || (service === "loan" && loanType === "mobile") || (service === "i9" && urgency === "inPerson") || (service === "witness" && serviceLocation === "mobile") || (service === "vehicleTitle" && serviceLocation === "mobile") || (service === "certifiedCopies" && serviceLocation === "mobile") || (service === "documentPrep" && serviceLocation === "mobile") || (service === "passportPhotos" && serviceLocation === "mobile")) && breakdown.distance !== undefined && breakdown.mileageFee !== undefined && (
            <>
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="text-muted-foreground">
                  Travel Distance (round-trip)
                </span>
                <span className="font-medium">{breakdown.distance.toFixed(1)} miles</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Mileage Fee ($
                  {service === "mobile" 
                    ? PRICING.MOBILE.mileageRate 
                    : service === "i9" 
                      ? PRICING.I9_VERIFICATION_MOBILE.mileageRate 
                      : service === "witness"
                        ? PRICING.WITNESS_SERVICE_MOBILE.mileageRate
                        : service === "vehicleTitle"
                          ? PRICING.VEHICLE_TITLE_MOBILE.mileageRate
                          : PRICING.LOAN_SIGNING_MOBILE.mileageRate}/mile)
                </span>
                <span className="font-medium">${breakdown.mileageFee.toFixed(2)}</span>
              </div>
            </>
          )}
          
          {((service === "mobile" || (service === "loan" && loanType === "mobile") || (service === "i9" && urgency === "inPerson") || (service === "witness" && serviceLocation === "mobile") || (service === "vehicleTitle" && serviceLocation === "mobile")) && !distance) && (
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="text-muted-foreground italic">
                + Travel mileage (enter address above)
              </span>
              <span className="font-medium text-muted-foreground">$?.??</span>
            </div>
          )}
          
          <div className="flex justify-between text-lg font-bold border-t-2 pt-3 mt-2">
            <span>Total</span>
            <span className="text-primary">${price}{((service === "mobile" || (service === "loan" && loanType === "mobile") || (service === "i9" && urgency === "inPerson") || (service === "fingerprinting" && serviceLocation === "mobile") || (service === "witness" && serviceLocation === "mobile") || (service === "vehicleTitle" && serviceLocation === "mobile")) && !distance) && "+"}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Your Total</p>
            <div className="flex items-center gap-2">
              <DollarSign className="w-8 h-8 text-primary" />
              <span className="text-4xl font-bold text-primary">{price}{((service === "mobile" || (service === "loan" && loanType === "mobile") || (service === "i9" && urgency === "inPerson") || (service === "fingerprinting" && serviceLocation === "mobile") || (service === "witness" && serviceLocation === "mobile") || (service === "vehicleTitle" && serviceLocation === "mobile")) && !distance) && "+"}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">100% Transparent</p>
            <p className="text-xs text-muted-foreground">No hidden fees</p>
          </div>
        </div>
        <Button 
          onClick={scrollToBooking} 
          className="w-full"
          size="lg"
        >
          Book This Service
        </Button>
      </div>

      <div className="mt-4 p-4 bg-background rounded-lg">
        <h4 className="font-semibold mb-2 text-sm">What's Included:</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          {service === "ron" && (
            <>
              <li>• PA state-mandated notary fee: ${PRICING.RON.notaryFee} (per signature, legal maximum)</li>
              <li>• Technology platform fee: ${PRICING.RON.technologyFee} (secure video, KBA verification, 10-year storage)</li>
              <li>• Digital certificate & tamper-evident seal</li>
              <li>• Available 24/7 by appointment with instant confirmation</li>
            </>
          )}
          {service === "mobile" && (
            <>
              <li>• PA state-mandated notary fee: ${PRICING.MOBILE.notaryFee} (per signature, legal maximum)</li>
              <li>• Mobile service fee: ${PRICING.MOBILE.serviceFee} (travel coordination, scheduling, admin)</li>
              <li>• Round-trip mileage: ${PRICING.MOBILE.mileageRate}/mile from Erie office (6238 Cobblestone Dr)</li>
              <li>• All notarial supplies & professional liability insurance included</li>
            </>
          )}
          {service === "apostille" && (
            <>
              <li>• PA notary fee: ${PRICING.APOSTILLE.notaryFee} (if notarization required)</li>
              <li>• Processing fee: ${PRICING.APOSTILLE.processingFee} (state filing, courier, coordination)</li>
              <li>• PA Department of State apostille fee (additional)</li>
              <li>• Document coordination, expediting, & return shipping included</li>
            </>
          )}
          {service === "loan" && (
            <>
              <li>• PA notary fee: ${PRICING.LOAN_SIGNING.notaryFee} per signature (typically 3-10 signatures)</li>
              <li>• Signing agent service: ${PRICING.LOAN_SIGNING.agentFee} (NNA certified, $100K E&O insurance)</li>
              {loanType === "mobile" && (
                <li>• Round-trip mileage: ${PRICING.LOAN_SIGNING_MOBILE.mileageRate}/mile from Erie office</li>
              )}
              <li>• Document printing, scan-back & overnight return shipping included</li>
            </>
          )}
          {service === "i9" && (
            <>
              <li>• In-person verification: ${PRICING.I9_VERIFICATION_MOBILE.baseFee} + ${PRICING.I9_VERIFICATION_MOBILE.mileageRate}/mile from Erie</li>
              <li>• Remote I-9 verification: ${PRICING.I9_VERIFICATION.remote}</li>
              <li>• E-Verify coordination available</li>
              <li>• Volume discounts for multiple employees</li>
            </>
          )}
          {service === "certifiedCopies" && (
            <>
              <li>• ${PRICING.CERTIFIED_COPIES.perDocument} per document certified</li>
              <li>• Official notary seal and signature</li>
              <li>• Accepted for legal, immigration, and business purposes</li>
              <li>• Same-day service available</li>
            </>
          )}
          {service === "documentPrep" && (
            <>
              <li>• Professional document formatting and preparation</li>
              <li>• Common documents: affidavits, contracts, agreements</li>
              <li>• Review for completeness (not legal advice)</li>
              <li>• Quick turnaround - usually same day</li>
            </>
          )}
          {service === "witness" && (
            <>
              <li>• Professional witness for private agreements</li>
              <li>• Neutral third-party verification</li>
              {serviceLocation === "mobile" && (
                <li>• Mobile service: ${PRICING.WITNESS_SERVICE_MOBILE.baseFee} + ${PRICING.WITNESS_SERVICE_MOBILE.mileageRate}/mile</li>
              )}
              <li>• Suitable for contracts not requiring notarization</li>
            </>
          )}
          {service === "passportPhotos" && (
            <>
              <li>• ${PRICING.PASSPORT_PHOTOS.perSession} per session</li>
              <li>• Government-compliant passport & visa photos</li>
              <li>• Digital and print copies provided</li>
              <li>• Quick turnaround</li>
            </>
          )}
          {service === "translationCert" && (
            <>
              <li>• Starting at ${PRICING.TRANSLATION_CERT.perPage} per page</li>
              <li>• Notarized certification of translations</li>
              <li>• Immigration and legal documents</li>
              <li>• Multiple language support</li>
            </>
          )}
          {service === "vehicleTitle" && (
            <>
              <li>• PA vehicle title notarization</li>
              {serviceLocation === "mobile" && (
                <li>• Mobile service: ${PRICING.VEHICLE_TITLE_MOBILE.baseFee} + ${PRICING.VEHICLE_TITLE_MOBILE.mileageRate}/mile</li>
              )}
              <li>• Fast and convenient</li>
              <li>• Both buyer and seller present</li>
            </>
          )}
          {service === "virtualMailbox" && (
            <>
              <li>• ${PRICING.VIRTUAL_MAILBOX.monthly} per month</li>
              <li>• Professional PA business address</li>
              <li>• Mail scanning and forwarding</li>
              <li>• Package handling included</li>
            </>
          )}
          {service === "uccFiling" && (
            <>
              <li>• ${PRICING.UCC_FILING.baseFee} including state filing</li>
              <li>• UCC-1 preparation and submission</li>
              <li>• Filing confirmation provided</li>
              <li>• Expert guidance throughout</li>
            </>
          )}
          {service === "documentRetrieval" && (
            <>
              <li>• Starting at ${PRICING.DOCUMENT_RETRIEVAL.baseFee} + government fees</li>
              <li>• Court documents and vital records</li>
              <li>• Property records retrieval</li>
              <li>• Fast turnaround times</li>
            </>
          )}
        </ul>
      </div>
    </Card>
  );
};

export default PricingCalculator;