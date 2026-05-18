import { describe, it, expect, vi } from 'vitest';
import {
  emailSchema,
  phoneSchema,
  nameSchema,
  messageSchema,
  urlSchema,
  sanitizeInput,
  formatPhoneNumber,
  formatEmail,
  isValidZipCode,
  debounce,
} from './validation';

describe('validation utilities', () => {
  describe('emailSchema', () => {
    it('should validate correct email addresses', () => {
      expect(emailSchema.safeParse('test@example.com').success).toBe(true);
      expect(emailSchema.safeParse('user.name@domain.co.uk').success).toBe(true);
      expect(emailSchema.safeParse('user+tag@example.com').success).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(emailSchema.safeParse('invalid').success).toBe(false);
      expect(emailSchema.safeParse('@example.com').success).toBe(false);
      expect(emailSchema.safeParse('test@').success).toBe(false);
      expect(emailSchema.safeParse('test@example').success).toBe(false);
    });

    it('should reject emails that are too long', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(emailSchema.safeParse(longEmail).success).toBe(false);
    });
  });

  describe('phoneSchema', () => {
    it('should validate phone numbers', () => {
      expect(phoneSchema.safeParse('8144800989').success).toBe(true);
      expect(phoneSchema.safeParse('(814) 480-0989').success).toBe(true);
      expect(phoneSchema.safeParse('+1 814 480 0989').success).toBe(true);
      expect(phoneSchema.safeParse('814-480-0989').success).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(phoneSchema.safeParse('123').success).toBe(false);
      expect(phoneSchema.safeParse('').success).toBe(false);
      expect(phoneSchema.safeParse('abc123').success).toBe(false);
    });

    it('should reject phone numbers that are too short', () => {
      expect(phoneSchema.safeParse('123456789').success).toBe(false);
    });

    it('should reject phone numbers that are too long', () => {
      const longPhone = '1'.repeat(16);
      expect(phoneSchema.safeParse(longPhone).success).toBe(false);
    });
  });

  describe('nameSchema', () => {
    it('should validate correct names', () => {
      expect(nameSchema.safeParse('John Doe').success).toBe(true);
      expect(nameSchema.safeParse("O'Brien").success).toBe(true);
      expect(nameSchema.safeParse("Mary-Jane").success).toBe(true);
      expect(nameSchema.safeParse("Van Der Berg").success).toBe(true);
    });

    it('should reject invalid names', () => {
      expect(nameSchema.safeParse('J').success).toBe(false);
      expect(nameSchema.safeParse('John123').success).toBe(false);
      expect(nameSchema.safeParse('John@Doe').success).toBe(false);
    });

    it('should reject names that are too long', () => {
      const longName = 'A'.repeat(101);
      expect(nameSchema.safeParse(longName).success).toBe(false);
    });
  });

  describe('messageSchema', () => {
    it('should validate correct messages', () => {
      expect(messageSchema.safeParse('This is a valid message with enough characters').success).toBe(true);
    });

    it('should reject messages that are too short', () => {
      expect(messageSchema.safeParse('Short').success).toBe(false);
    });

    it('should reject messages that are too long', () => {
      const longMessage = 'A'.repeat(2001);
      expect(messageSchema.safeParse(longMessage).success).toBe(false);
    });
  });

  describe('urlSchema', () => {
    it('should validate correct URLs', () => {
      expect(urlSchema.safeParse('https://example.com').success).toBe(true);
      expect(urlSchema.safeParse('http://example.com/path').success).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(urlSchema.safeParse('not-a-url').success).toBe(false);
      expect(urlSchema.safeParse('example.com').success).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('should sanitize HTML tags', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
      expect(sanitizeInput('<img src="x" onerror="alert(1)">')).toContain('&lt;');
    });

    it('should handle normal text', () => {
      expect(sanitizeInput('Hello World')).toBe('Hello World');
    });

    it('should handle empty strings', () => {
      expect(sanitizeInput('')).toBe('');
    });

    it('should sanitize quotes', () => {
      expect(sanitizeInput('"quoted"')).toBe('&quot;quoted&quot;');
      expect(sanitizeInput("'single'")).toBe('&#x27;single&#x27;');
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format 10-digit phone numbers', () => {
      expect(formatPhoneNumber('8144800989')).toBe('(814) 480-0989');
      expect(formatPhoneNumber('814-480-0989')).toBe('(814) 480-0989');
    });

    it('should format 11-digit phone numbers starting with 1', () => {
      expect(formatPhoneNumber('18144800989')).toBe('+1 (814) 480-0989');
    });

    it('should return original if format is not recognized', () => {
      expect(formatPhoneNumber('12345')).toBe('12345');
    });
  });

  describe('formatEmail', () => {
    it('should lowercase and trim emails', () => {
      expect(formatEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
      expect(formatEmail('User@Example.com')).toBe('user@example.com');
    });
  });

  describe('isValidZipCode', () => {
    it('should validate 5-digit zip codes', () => {
      expect(isValidZipCode('16501')).toBe(true);
      expect(isValidZipCode('90210')).toBe(true);
    });

    it('should validate 9-digit zip codes', () => {
      expect(isValidZipCode('16501-1234')).toBe(true);
    });

    it('should reject invalid zip codes', () => {
      expect(isValidZipCode('1234')).toBe(false);
      expect(isValidZipCode('123456')).toBe(false);
      expect(isValidZipCode('abcde')).toBe(false);
      expect(isValidZipCode('1650-123')).toBe(false);
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      const func = vi.fn();
      const debouncedFunc = debounce(func, 100);

      debouncedFunc();
      debouncedFunc();
      debouncedFunc();

      expect(func).not.toHaveBeenCalled();

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should clear timeout on new calls', async () => {
      const func = vi.fn();
      const debouncedFunc = debounce(func, 100);

      debouncedFunc();
      await new Promise(resolve => setTimeout(resolve, 50));
      debouncedFunc();
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(func).toHaveBeenCalledTimes(1);
    });
  });
});


