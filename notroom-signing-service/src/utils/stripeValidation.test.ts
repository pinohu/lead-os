import { describe, it, expect } from 'vitest';
import {
  isPlaceholderPriceId,
  isValidStripePriceIdFormat,
  validatePriceIdForCheckout,
  getStripeConfigError,
} from './stripeValidation';

describe('stripeValidation', () => {
  describe('isPlaceholderPriceId', () => {
    it('should detect placeholder price IDs', () => {
      expect(isPlaceholderPriceId('price_tc_basic_placeholder')).toBe(true);
      expect(isPlaceholderPriceId('price_PLACEHOLDER')).toBe(true);
      expect(isPlaceholderPriceId('price_crop_placeholder')).toBe(true);
    });

    it('should not detect valid price IDs as placeholders', () => {
      expect(isPlaceholderPriceId('price_1ABC123def456GHI789jkl012')).toBe(false);
      expect(isPlaceholderPriceId('price_1SMLKNLeZEBBH8L7OOKjkDj5')).toBe(false);
    });
  });

  describe('isValidStripePriceIdFormat', () => {
    it('should validate correct Stripe price ID format', () => {
      expect(isValidStripePriceIdFormat('price_1ABC123def456GHI789jkl012')).toBe(true);
      expect(isValidStripePriceIdFormat('price_1SMLKNLeZEBBH8L7OOKjkDj5')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(isValidStripePriceIdFormat('price_123')).toBe(false); // Too short
      expect(isValidStripePriceIdFormat('prod_1ABC123def456GHI789jkl012')).toBe(false); // Wrong prefix
      expect(isValidStripePriceIdFormat('1ABC123def456GHI789jkl012')).toBe(false); // Missing prefix
      expect(isValidStripePriceIdFormat('price_1ABC-123')).toBe(false); // Invalid characters
    });
  });

  describe('validatePriceIdForCheckout', () => {
    it('should throw error for empty price ID', () => {
      expect(() => validatePriceIdForCheckout('', 'Test Service')).toThrow();
      expect(() => validatePriceIdForCheckout('   ', 'Test Service')).toThrow();
    });

    it('should throw error for placeholder price IDs', () => {
      expect(() => validatePriceIdForCheckout('price_tc_basic_placeholder', 'Transaction Coordination')).toThrow();
      expect(() => validatePriceIdForCheckout('price_PLACEHOLDER', 'Test Service')).toThrow();
    });

    it('should throw error for invalid format', () => {
      expect(() => validatePriceIdForCheckout('price_123', 'Test Service')).toThrow();
      expect(() => validatePriceIdForCheckout('invalid', 'Test Service')).toThrow();
    });

    it('should not throw for valid price IDs', () => {
      expect(() => validatePriceIdForCheckout('price_1ABC123def456GHI789jkl012', 'Test Service')).not.toThrow();
      expect(() => validatePriceIdForCheckout('price_1SMLKNLeZEBBH8L7OOKjkDj5', 'Test Service')).not.toThrow();
    });
  });

  describe('getStripeConfigError', () => {
    it('should return user-friendly error message', () => {
      const error = getStripeConfigError('Transaction Coordination');
      expect(error).toContain('Transaction Coordination');
      expect(error).toContain('not yet configured');
    });
  });
});

