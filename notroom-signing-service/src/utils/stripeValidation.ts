/**
 * Stripe Price ID Validation Utility
 * Validates Stripe price IDs and prevents checkout with placeholder IDs
 */

/**
 * Check if a Stripe price ID is a placeholder
 */
export function isPlaceholderPriceId(priceId: string): boolean {
  return priceId.includes('placeholder') || 
         priceId.includes('PLACEHOLDER') ||
         priceId.startsWith('price_tc_') && priceId.includes('placeholder') ||
         priceId.startsWith('price_crop_') && priceId.includes('placeholder');
}

/**
 * Validate Stripe price ID format
 * Stripe price IDs start with 'price_' followed by alphanumeric characters
 */
export function isValidStripePriceIdFormat(priceId: string): boolean {
  // Stripe price IDs format: price_XXXXXXXXXXXXXXXXXXXXXX
  const stripePriceIdPattern = /^price_[a-zA-Z0-9]{24,}$/;
  return stripePriceIdPattern.test(priceId);
}

/**
 * Validate that a price ID is ready for checkout
 * @throws Error if price ID is invalid or placeholder
 */
export function validatePriceIdForCheckout(priceId: string, serviceName: string): void {
  if (!priceId || priceId.trim() === '') {
    throw new Error(`Stripe price ID is required for ${serviceName}. Please contact support.`);
  }

  if (isPlaceholderPriceId(priceId)) {
    throw new Error(
      `Payment processing is not yet configured for ${serviceName}. ` +
      `The Stripe price ID is still a placeholder. Please contact support or try again later.`
    );
  }

  if (!isValidStripePriceIdFormat(priceId)) {
    throw new Error(
      `Invalid Stripe price ID format for ${serviceName}. ` +
      `Please contact support.`
    );
  }
}

/**
 * Get user-friendly error message for missing Stripe configuration
 */
export function getStripeConfigError(serviceName: string): string {
  return `Payment processing for ${serviceName} is not yet configured. Please contact support at support@notroom.com or call (814) 480-0989.`;
}

