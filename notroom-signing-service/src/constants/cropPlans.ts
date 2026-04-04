// Stripe price IDs and plan configuration for CROP services
export const CROP_PLANS = {
  standard: {
    priceId: "price_1SRzSiLeZEBBH8L7224SrEin",
    name: "Registered Office - Standard",
    shortName: "Standard",
    price: "$149",
    priceAnnual: 149,
    period: "per year",
    description: "Professional PA registered office address with weekly mail forwarding, service of process acceptance, and annual renewal reminders.",
    features: [
      "Professional PA registered office address",
      "Service of process acceptance & immediate notification",
      "Weekly physical mail forwarding to your address",
      "Secure online portal access",
      "Annual renewal reminders",
      "Email & phone support"
    ]
  },
  digital: {
    priceId: "price_1SRzSkLeZEBBH8L7fwo0DKyf",
    name: "Registered Office - Digital",
    shortName: "Digital",
    price: "$199",
    priceAnnual: 199,
    period: "per year",
    description: "Everything in Standard plus 24-hour digital mail scanning, secure cloud storage, and open-and-scan on demand.",
    features: [
      "Everything in Registered Office Only",
      "Digital mail scanning within 24 hours",
      "Scan exterior of all envelopes to portal",
      "Request open-and-scan for specific items",
      "Secure cloud storage of scanned documents",
      "Shredding service for routine mail"
    ],
    recommended: true
  },
  premium: {
    priceId: "price_1SRzSlLeZEBBH8L75LKGrCZr",
    name: "Registered Office - Premium",
    shortName: "Premium",
    price: "$249",
    priceAnnual: 249,
    period: "per year",
    description: "Everything in Digital plus annual compliance review call, entity monitoring, priority support, and 10% discount on business filings.",
    features: [
      "Everything in Mail Scanning Plan",
      "Annual compliance review intro call (30 min)",
      "Personalized deadline reminders (annual reports, BOI, renewals)",
      "Entity status monitoring with PA DOS",
      "Priority customer support",
      "10% discount on all business filing services"
    ]
  }
} as const;

export type CropPlanKey = keyof typeof CROP_PLANS;
