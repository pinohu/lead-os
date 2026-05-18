/**
 * Common type definitions for the Notroom application
 */

export interface ServiceArea {
  name: string;
  county: string;
  distance?: number;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: string;
  icon: string;
}

export interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  date?: string;
  time?: string;
  location?: string;
  message?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  message?: string;
}

export interface PricingOption {
  id: string;
  name: string;
  basePrice: number;
  description: string;
  features: string[];
}