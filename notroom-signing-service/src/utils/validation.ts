/**
 * Input validation utilities for forms and user input
 */

import { z } from 'zod';

// Phone number validation (US format)
export const phoneSchema = z
  .string()
  .min(10, "Phone number must be at least 10 digits")
  .max(15, "Phone number is too long")
  .regex(/^\+?[\d\s\-()]+$/, "Invalid phone number format");

// Email validation
export const emailSchema = z
  .string()
  .email("Invalid email address")
  .max(255, "Email is too long");

// Name validation
export const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name is too long")
  .regex(/^[a-zA-Z\s'-]+$/, "Name contains invalid characters");

// Message/textarea validation
export const messageSchema = z
  .string()
  .min(10, "Message must be at least 10 characters")
  .max(2000, "Message is too long");

// URL validation
export const urlSchema = z
  .string()
  .url("Invalid URL format")
  .max(500, "URL is too long");

/**
 * Sanitize user input to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone;
};

/**
 * Validate and format email
 */
export const formatEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

/**
 * Check if a string is a valid US zip code
 */
export const isValidZipCode = (zip: string): boolean => {
  return /^\d{5}(-\d{4})?$/.test(zip);
};

/**
 * Debounce function for input validation
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}