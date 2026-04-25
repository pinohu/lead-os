/**
 * Notary Commission Information
 * Official credentials as required by Pennsylvania law for notary advertising
 */

export const COMMISSION_INFO = {
  /** Pennsylvania Notary Public Commission Number */
  commissionNumber: "1464221",
  
  /** Commission expiration date (MM/DD/YYYY format) */
  commissionExpires: "11/03/2029",
  
  /** County where commission was filed */
  county: "Erie County",
  
  /** Surety bond amount */
  bondAmount: "$10,000",
  
  /** Errors & Omissions insurance coverage */
  eoInsurance: "$100,000",
  
  /** Remote Online Notarization authorization date */
  ronAuthorized: "11/11/2029",
  
  /** Approved RON platforms */
  ronPlatforms: ["BlueNotary", "Pactima", "Notarize"],
  
  /** NNA Signing Agent Account Number */
  nnaAccountNumber: "161977718",
} as const;

/**
 * Format commission information for display
 */
export function getCommissionDisplay(): string {
  return `Pennsylvania Notary Public\nCommission #${COMMISSION_INFO.commissionNumber}\nCommission Expires: ${COMMISSION_INFO.commissionExpires}\nCommissioned in ${COMMISSION_INFO.county}\nBonded: ${COMMISSION_INFO.bondAmount}\nE&O Insurance: ${COMMISSION_INFO.eoInsurance}\nRON Authorized: ${COMMISSION_INFO.ronAuthorized}\nPlatform: ${COMMISSION_INFO.ronPlatforms.join(", ")}`;
}

/**
 * Get formatted RON platforms as string
 */
export function getRonPlatformsDisplay(): string {
  return COMMISSION_INFO.ronPlatforms.join(", ");
}

