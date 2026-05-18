// Stripe price IDs and plan configuration for Transaction Coordination services
// 
// ⚠️ IMPORTANT: Replace placeholder price IDs with actual Stripe price IDs before accepting payments
// 
// To set up Stripe products:
// 1. Go to Stripe Dashboard → Products → Add Product
// 2. Create 3 products:
//    - "Transaction Coordination - Basic" ($299)
//    - "Transaction Coordination - Standard" ($599)
//    - "Transaction Coordination - Premium" ($1,299)
// 3. Copy the Price IDs (starts with "price_")
// 4. Replace the placeholder values below
// 5. Test checkout flow in test mode first
//
// See: STRIPE_SETUP_GUIDE.md for detailed instructions

export const TC_PLANS = {
  basic: {
    priceId: "price_tc_basic_placeholder", // ⚠️ REPLACE: Create product in Stripe Dashboard and paste price ID here
    name: "Transaction Coordination - Basic",
    shortName: "Basic",
    price: "$299",
    priceAmount: 299,
    period: "per transaction",
    description: "Essential coordination support for straightforward transactions. Perfect for simple real estate closings or standard contract executions.",
    features: [
      "Document collection and organization",
      "Timeline management and deadline tracking",
      "Basic communication coordination between parties",
      "Single point of contact",
      "Email and phone support",
      "Transaction completion certificate"
    ],
    idealFor: "Simple transactions with 2-3 parties, standard documentation, clear timelines",
    recommended: false
  },
  standard: {
    priceId: "price_tc_standard_placeholder", // ⚠️ REPLACE: Create product in Stripe Dashboard and paste price ID here
    name: "Transaction Coordination - Standard",
    shortName: "Standard",
    price: "$599",
    priceAmount: 599,
    period: "per transaction",
    description: "Comprehensive coordination for moderate complexity transactions. Includes document review, negotiation support, and multi-party coordination.",
    features: [
      "Everything in Basic plan",
      "Document review and compliance checking",
      "Multi-party negotiation coordination",
      "Meeting scheduling and facilitation",
      "Progress reporting and status updates",
      "Priority support (24-hour response)",
      "Post-transaction follow-up"
    ],
    idealFor: "Moderate complexity transactions, 3-5 parties, multiple documents, coordination needs",
    recommended: true
  },
  premium: {
    priceId: "price_tc_premium_placeholder", // ⚠️ REPLACE: Create product in Stripe Dashboard and paste price ID here
    name: "Transaction Coordination - Premium",
    shortName: "Premium",
    price: "$1,299",
    priceAmount: 1299,
    period: "per transaction",
    description: "White-glove coordination for complex, high-stakes transactions. Dedicated coordinator, expedited processing, and comprehensive support.",
    features: [
      "Everything in Standard plan",
      "Dedicated transaction coordinator",
      "Expedited processing and priority handling",
      "Complex document management and version control",
      "Multi-party conference calls and meetings",
      "Risk assessment and mitigation support",
      "Custom reporting and analytics",
      "24/7 emergency support",
      "Post-transaction compliance review"
    ],
    idealFor: "Complex transactions, 5+ parties, high-value deals, tight deadlines, regulatory compliance needs",
    recommended: false
  }
} as const;

export type TcPlanKey = keyof typeof TC_PLANS;

