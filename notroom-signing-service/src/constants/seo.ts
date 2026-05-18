/**
 * SEO constants and metadata for the Notroom application
 */

export const SITE_CONFIG = {
  name: 'Notroom',
  description: 'Professional notary and business services in Erie, PA',
  url: 'https://notroom.com',
  ogImage: 'https://lovable.dev/opengraph-image-p98pqg.png',
  phone: '(814) 480-0989',
  phoneRaw: '814-480-0989',
  email: 'support@notroom.com',
  address: {
    city: 'Erie',
    state: 'PA',
    stateCode: 'PA',
    country: 'US',
    latitude: '42.1292',
    longitude: '-80.0851',
  },
} as const;

export const DEFAULT_SEO = {
  title: 'Notroom | Notary, Business Filing & Compliance Services | Erie, PA',
  description: 'Complete business services in Erie, PA: Remote & mobile notary (from $60), loan signing ($175), apostille services ($245+), I-9 verification ($85+), LLC formation ($149), and registered office ($149/yr). Licensed, bonded, PA-compliant.',
  keywords: 'notary Erie PA, online notary, mobile notary, loan signing agent, apostille service, I-9 verification, LLC formation Pennsylvania, registered office PA, business filing Erie',
  ogType: 'website',
} as const;

export const SERVICE_AREAS = [
  'Erie County',
  'Crawford County',
  'Warren County',
  'Mercer County',
  'Venango County',
] as const;

export const MAJOR_CITIES = [
  'Erie',
  'Meadville',
  'Warren',
  'Oil City',
  'Sharon',
  'Hermitage',
  'Titusville',
] as const;

export const SERVICES = [
  {
    id: 'remote-online-notary',
    name: 'Remote Online Notarization',
    shortName: 'RON',
    basePrice: 60,
    path: '/services/remote-online-notary',
  },
  {
    id: 'mobile-notary',
    name: 'Mobile Notary Service',
    shortName: 'Mobile Notary',
    basePrice: 125,
    path: '/services/mobile-notary',
  },
  {
    id: 'loan-signing-agent',
    name: 'Loan Signing Agent',
    shortName: 'Loan Signing',
    basePrice: 175,
    path: '/services/loan-signing-agent',
  },
  {
    id: 'apostille',
    name: 'Apostille Services',
    shortName: 'Apostille',
    basePrice: 245,
    path: '/services/apostille',
  },
  {
    id: 'i9-verification',
    name: 'I-9 Employment Verification',
    shortName: 'I-9 Verification',
    basePrice: 85,
    path: '/services/i9-verification',
  },
  {
    id: 'business-retainer',
    name: 'Business Retainer Services',
    shortName: 'Business Retainer',
    basePrice: 399,
    path: '/services/business-retainer',
  },
  {
    id: 'registered-office',
    name: 'Registered Office Provider',
    shortName: 'Registered Office',
    basePrice: 149,
    path: '/services/registered-office',
  },
] as const;

export const SOCIAL_LINKS = {
  facebook: '',
  twitter: '',
  linkedin: '',
  instagram: '',
} as const;

export const BUSINESS_HOURS = {
  monday: '24/7',
  tuesday: '24/7',
  wednesday: '24/7',
  thursday: '24/7',
  friday: '24/7',
  saturday: '24/7',
  sunday: '24/7',
} as const;

// No rating data yet - business started in 2025
export const RATING = {
  value: 0,
  count: 0,
  max: 5,
} as const;