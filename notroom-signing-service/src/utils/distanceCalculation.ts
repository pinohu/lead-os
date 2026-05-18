// Distance calculation utilities for mobile notary pricing

import { logger } from './logger';

const ORIGIN_ADDRESS = "6238 Cobblestone Dr, Erie, PA 16509";

/**
 * Calculate distance between two addresses using backend edge function
 */
export const calculateDistance = async (
  destinationAddress: string
): Promise<{ distance: number; duration: string; error?: string }> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    if (!supabaseUrl) {
      return {
        distance: 15,
        duration: "20 mins",
        error: "Configuration error. Estimate shown."
      };
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/calculate-distance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      },
      body: JSON.stringify({ destination: destinationAddress }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error('Distance API error:', errorData);
      throw new Error('Failed to calculate distance');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    logger.error("Distance calculation error:", error);
    return {
      distance: 15,
      duration: "20 mins",
      error: "Unable to calculate exact distance. Using estimate. Exact mileage will be calculated at booking."
    };
  }
};

/**
 * Calculate round-trip distance
 */
export const calculateRoundTripDistance = (oneWayDistance: number): number => {
  return oneWayDistance * 2;
};

/**
 * Format distance for display
 */
export const formatDistance = (miles: number): string => {
  return `${miles.toFixed(1)} miles`;
};

/**
 * Get origin address for display
 */
export const getOriginAddress = (): string => {
  return ORIGIN_ADDRESS;
};
