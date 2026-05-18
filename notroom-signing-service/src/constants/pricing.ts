// Pennsylvania Law Compliant Pricing Structure - Profit Optimized
// Based on official PA Department of State Notary Fee Schedule
// Reference: Pennsylvania Notary Public Fee Schedule (PA DOS)
// Maximum notary fee: $5.00 per notarial act (acknowledgment, jurat, oath/affirmation)
// Additional fees permitted for non-notarial clerical and administrative services
export const PRICING = {
  RON: {
    display: "$60",
    notaryFee: 5, // PA Department of State official maximum per notarial act
    technologyFee: 55, // Secure video platform, KBA verification, 10-year storage
    total: 60,
    description: "$5 PA notary fee (PA DOS official maximum) + $55 technology platform fee (video, KBA, storage)",
    premium: 125,
    premiumDescription: "Complex documents requiring extended review"
  },
  MOBILE: {
    display: "$125 + mileage",
    notaryFee: 5, // PA law maximum per notarial act
    serviceFee: 120, // Travel, scheduling, coordination, administrative overhead
    baseTotal: 125,
    mileageRate: 1.50, // Round-trip travel reimbursement
    originAddress: "6238 Cobblestone Dr, Erie, PA 16509",
    description: "$5 PA notary fee (legal maximum) + $120 mobile service fee (travel, scheduling, admin) + $1.50/mile round-trip"
  },
  LOAN_SIGNING: {
    display: "$175+",
    notaryFee: 5, // PA law maximum per notarial act (typically 3-10 signatures per closing)
    agentFee: 170, // NNA certification, E&O insurance, document printing, travel, scan-back
    baseTotal: 175,
    description: "$5 PA notary fee (per signature) + $170 signing agent service (printing, travel, insurance, scan-back)",
    refinanceStandard: 225,
    refinanceComplex: 275,
    purchaseClosing: 275,
    sellerPackage: 225,
    heloc: 250,
    reverseMortgage: 325,
    commercial: 400,
    rush: 350
  },
  LOAN_SIGNING_MOBILE: {
    display: "$175+ + mileage",
    notaryFee: 5, // PA law maximum per signature
    agentFee: 170, // Professional signing agent services
    baseTotal: 175,
    mileageRate: 1.50,
    originAddress: "6238 Cobblestone Dr, Erie, PA 16509",
    description: "$5 PA notary fee (per signature) + $170 agent service (printing, insurance, scan-back) + $1.50/mile travel",
    afterHours: 50, // Premium for after 7pm weekdays
    weekend: 75, // Premium for Saturday/Sunday
    holiday: 150, // Premium for major holidays
    scanBack: 35 // Already included in base fee
  },
  APOSTILLE: {
    display: "$245+",
    notaryFee: 5, // PA law maximum (if notarization required)
    processingFee: 240, // PA Dept of State filing, document prep, courier, coordination
    baseTotal: 245,
    description: "$5 PA notary fee (if required) + $240 processing (state filing, courier, document prep, coordination)"
  },
  I9_VERIFICATION: {
    display: "$85+",
    inPerson: 85,
    remote: 125,
    description: "Employment verification services"
  },
  I9_VERIFICATION_MOBILE: {
    display: "$85 + mileage",
    baseFee: 85,
    mileageRate: 1.50,
    originAddress: "6238 Cobblestone Dr, Erie, PA 16509",
    description: "In-person verification with travel"
  },
  LLC_FORMATION: {
    display: "$149+",
    total: 149,
    description: "LLC formation and filing assistance"
  },
  BUSINESS_RETAINER: {
    display: "$399+",
    monthly: 399,
    description: "Monthly retainer plans for businesses"
  },
  CERTIFIED_COPIES: {
    display: "$20",
    perDocument: 20,
    office: 20,
    remote: 25,
    description: "At office or by mail"
  },
  CERTIFIED_COPIES_MOBILE: {
    display: "$20 + mileage",
    perDocument: 20,
    mileageRate: 1.50,
    originAddress: "6238 Cobblestone Dr, Erie, PA 16509",
    description: "Mobile certified copy service with travel"
  },
  WITNESS_SERVICE: {
    display: "$60",
    baseFee: 60,
    description: "Professional witness services"
  },
  WITNESS_SERVICE_MOBILE: {
    display: "$60 + mileage",
    baseFee: 60,
    mileageRate: 1.50,
    originAddress: "6238 Cobblestone Dr, Erie, PA 16509",
    description: "Mobile witness service with travel"
  },
  PASSPORT_PHOTOS: {
    display: "$15",
    perSession: 15,
    office: 15,
    description: "At our office location"
  },
  PASSPORT_PHOTOS_MOBILE: {
    display: "$15 + mileage",
    perSession: 15,
    mileageRate: 1.50,
    originAddress: "6238 Cobblestone Dr, Erie, PA 16509",
    description: "Mobile passport photo service with travel"
  },
  TRANSLATION_CERT: {
    display: "$35+",
    perPage: 35,
    remote: 35,
    description: "Remote service - mail or email"
  },
  VEHICLE_TITLE: {
    display: "$40",
    baseFee: 40,
    description: "Vehicle title transfer notarization"
  },
  VEHICLE_TITLE_MOBILE: {
    display: "$40 + mileage",
    baseFee: 40,
    mileageRate: 1.50,
    originAddress: "6238 Cobblestone Dr, Erie, PA 16509",
    description: "Mobile vehicle title service with travel"
  },
  WEDDING_OFFICIANT: {
    display: "$200",
    baseFee: 200,
    description: "Wedding ceremony officiant services"
  },
  PROCESS_SERVING: {
    display: "$75",
    perServe: 75,
    description: "Legal document process serving"
  },
  PROCESS_SERVING_MOBILE: {
    display: "$75 + mileage",
    baseFee: 75,
    mileageRate: 1.50,
    originAddress: "6238 Cobblestone Dr, Erie, PA 16509",
    description: "Process serving with travel"
  },
  VIRTUAL_MAILBOX: {
    display: "$50/mo",
    monthly: 50,
    description: "Virtual mailbox and mail forwarding"
  },
  UCC_FILING: {
    display: "$125",
    baseFee: 125,
    description: "UCC filing services"
  },
  DOCUMENT_RETRIEVAL: {
    display: "$75+",
    baseFee: 75,
    description: "Document retrieval from government offices"
  },
  HEALTHCARE_FACILITY: {
    display: "$150-240",
    notaryFee: 5, // PA law maximum per signature
    facilityFee: 145, // Premium service: special accommodations, facility coordination, extended time
    baseTotal: 150,
    hospital: 175,
    nursingHome: 150,
    assistedLiving: 150,
    hospice: 190,
    afterHours: 200,
    mileageRate: 1.50,
    originAddress: "6238 Cobblestone Dr, Erie, PA 16509",
    description: "$5 PA notary fee (per signature) + $145+ facility coordination fee (special accommodations, facility protocols) + travel"
  },
  CORRECTIONAL_FACILITY: {
    display: "$185-290",
    notaryFee: 5, // PA law maximum per signature
    facilityFee: 180, // Premium: security clearance, extensive coordination, facility protocols
    countyJail: 185,
    statePrison: 230,
    federalFacility: 260,
    mileageRate: 1.50,
    originAddress: "6238 Cobblestone Dr, Erie, PA 16509",
    description: "$5 PA notary fee (per signature) + $180+ facility coordination (security clearance, protocols, extended processing) + travel"
  },
  CORPORATE_BULK: {
    display: "$205+",
    perEmployee: 14,
    visitFee: 100,
    description: "Volume corporate notarization services"
  },
  ESTATE_PLANNING_MOBILE: {
    display: "$140-285",
    notaryFee: 15, // PA law maximum (typically 3-5 signatures per estate package)
    serviceFee: 125, // Mobile service, document review, witness coordination
    willSimple: 140,
    willComplex: 175,
    trustDocuments: 190,
    poaPackage: 175,
    completeEstate: 250,
    mileageRate: 1.50,
    originAddress: "6238 Cobblestone Dr, Erie, PA 16509",
    description: "$15 PA notary fees (3-5 signatures typical) + $125+ mobile service (travel, document review, witness coordination) + $1.50/mile"
  },
  PREMIUM_FEES: {
    afterHours: 40,
    lateNight: 85,
    overnight: 150,
    weekendSaturday: 65,
    weekendSunday: 90,
    majorHoliday: 125,
    sameDayRush: 65,
    twoHourRush: 100,
    waitingTime: 35
  }
};

export const getServicePricing = (cityName: string) => ({
  RON: { ...PRICING.RON, description: `Online notarization 24/7 for ${cityName} residents` },
  MOBILE: { ...PRICING.MOBILE, description: `We come to your location in ${cityName}` },
  LOAN_SIGNING: { ...PRICING.LOAN_SIGNING, description: `Real estate closing services in ${cityName}` },
  APOSTILLE: { ...PRICING.APOSTILLE, description: "International document authentication" },
  I9: { ...PRICING.I9_VERIFICATION, description: `Employment verification for ${cityName} businesses` },
  LLC: { ...PRICING.LLC_FORMATION, description: `Start your ${cityName} business today` },
  RETAINER: { ...PRICING.BUSINESS_RETAINER, description: `Monthly plans for ${cityName} companies` },
  CERTIFIED_COPIES: { ...PRICING.CERTIFIED_COPIES, description: `Document certification in ${cityName}` },
  
  
  WITNESS: { ...PRICING.WITNESS_SERVICE_MOBILE, description: `Professional witness service in ${cityName}` },
  PASSPORT_PHOTOS: { ...PRICING.PASSPORT_PHOTOS, description: `Passport photos in ${cityName}` },
  TRANSLATION_CERT: { ...PRICING.TRANSLATION_CERT, description: `Translation certification in ${cityName}` },
  VEHICLE_TITLE: { ...PRICING.VEHICLE_TITLE_MOBILE, description: `Vehicle title services in ${cityName}` },
  WEDDING: { ...PRICING.WEDDING_OFFICIANT, description: `Wedding officiant in ${cityName}` },
  PROCESS_SERVING: { ...PRICING.PROCESS_SERVING_MOBILE, description: `Process serving in ${cityName}` },
  VIRTUAL_MAILBOX: { ...PRICING.VIRTUAL_MAILBOX, description: `Virtual mailbox for ${cityName} businesses` },
  UCC_FILING: { ...PRICING.UCC_FILING, description: `UCC filing services in ${cityName}` },
  DOCUMENT_RETRIEVAL: { ...PRICING.DOCUMENT_RETRIEVAL, description: `Document retrieval in ${cityName}` }
});