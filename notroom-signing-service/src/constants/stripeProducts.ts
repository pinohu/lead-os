// Stripe Product and Price IDs for Notroom Services

export const STRIPE_PRODUCTS = {
  RON: {
    product_id: "prod_TIxEQDDcsDxeId",
    price_id: "price_1SMLKNLeZEBBH8L7OOKjkDj5",
    amount: 6000, // $60.00 in cents
    name: "Remote Online Notary (RON)",
    description: "24/7 online notarization via secure video call"
  },
  MOBILE_NOTARY: {
    product_id: "prod_TIxFj0TZ5jQmEQ",
    price_id: "price_1SMLKWLeZEBBH8L7DBcfiF3R",
    base_amount: 12500, // $125.00 base in cents
    name: "Mobile Notary Service",
    description: "We come to your location (base price + mileage)"
  },
  LOAN_SIGNING: {
    product_id: "prod_TIxFkrbmifWgPg",
    price_id: "price_1SMLKYLeZEBBH8L72nrueNIV",
    amount: 17500, // $175.00 in cents
    name: "Loan Signing Agent",
    description: "Professional loan signing services"
  }
} as const;

export const getPriceIdForService = (service: string): string | null => {
  switch (service) {
    case "ron":
      return STRIPE_PRODUCTS.RON.price_id;
    case "mobile":
      return STRIPE_PRODUCTS.MOBILE_NOTARY.price_id;
    case "loan":
      return STRIPE_PRODUCTS.LOAN_SIGNING.price_id;
    default:
      return null;
  }
};

export const getProductForService = (service: string) => {
  switch (service) {
    case "ron":
      return STRIPE_PRODUCTS.RON;
    case "mobile":
      return STRIPE_PRODUCTS.MOBILE_NOTARY;
    case "loan":
      return STRIPE_PRODUCTS.LOAN_SIGNING;
    default:
      return null;
  }
};
