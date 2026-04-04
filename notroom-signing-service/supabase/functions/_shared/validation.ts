/**
 * Shared validation utilities for Supabase Edge Functions
 * Prevents code duplication and ensures consistent security
 */

// Phone number validation (US format)
export function validatePhone(phone: string): { valid: boolean; error?: string } {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Phone number is required' };
  }
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length < 10) {
    return { valid: false, error: 'Phone number must be at least 10 digits' };
  }
  
  if (cleaned.length > 15) {
    return { valid: false, error: 'Phone number is too long' };
  }
  
  // Basic US format check
  if (cleaned.length === 10 || (cleaned.length === 11 && cleaned[0] === '1')) {
    return { valid: true };
  }
  
  return { valid: false, error: 'Invalid phone number format' };
}

// Email validation
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }
  
  if (email.length > 255) {
    return { valid: false, error: 'Email is too long' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  return { valid: true };
}

// Name validation
export function validateName(name: string): { valid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name is required' };
  }
  
  const trimmed = name.trim();
  
  if (trimmed.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
  }
  
  if (trimmed.length > 100) {
    return { valid: false, error: 'Name is too long' };
  }
  
  // Allow letters, spaces, hyphens, apostrophes
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  if (!nameRegex.test(trimmed)) {
    return { valid: false, error: 'Name contains invalid characters' };
  }
  
  return { valid: true };
}

// Message/text validation
export function validateMessage(message: string, maxLength: number = 2000): { valid: boolean; error?: string } {
  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'Message is required' };
  }
  
  const trimmed = message.trim();
  
  if (trimmed.length < 10) {
    return { valid: false, error: 'Message must be at least 10 characters' };
  }
  
  if (trimmed.length > maxLength) {
    return { valid: false, error: `Message must be less than ${maxLength} characters` };
  }
  
  return { valid: true };
}

// UUID validation
export function validateUUID(uuid: string): { valid: boolean; error?: string } {
  if (!uuid || typeof uuid !== 'string') {
    return { valid: false, error: 'ID is required' };
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    return { valid: false, error: 'Invalid ID format' };
  }
  
  return { valid: true };
}

// Sanitize HTML to prevent XSS
export function sanitizeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Normalize phone number (add +1 for US)
export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+${cleaned}`;
  }
  
  return phone.startsWith('+') ? phone : `+${cleaned}`;
}

// Normalize email (lowercase and trim)
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

// Rate limit check helper
export async function checkRateLimit(
  supabase: any,
  tableName: string,
  identifier: string,
  maxAttempts: number,
  windowMinutes: number
): Promise<{ allowed: boolean; remaining: number; error?: string }> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);
  
  // Count recent attempts
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('identifier', identifier)
    .gte('created_at', windowStart.toISOString());
  
  if (error) {
    console.error('Rate limit check error:', error);
    // Fail open on error to avoid blocking legitimate users
    return { allowed: true, remaining: maxAttempts };
  }
  
  const attempts = data?.length || 0;
  const remaining = Math.max(0, maxAttempts - attempts);
  
  if (attempts >= maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      error: `Rate limit exceeded. Please try again in ${windowMinutes} minutes.`
    };
  }
  
  return { allowed: true, remaining };
}

// Validate booking ownership
export async function validateBookingOwnership(
  supabase: any,
  bookingId: string,
  email: string
): Promise<{ valid: boolean; booking?: any; error?: string }> {
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();
  
  if (error || !booking) {
    return {
      valid: false,
      error: 'Booking not found'
    };
  }
  
  if (booking.email.toLowerCase() !== email.toLowerCase()) {
    return {
      valid: false,
      error: 'Unauthorized access to booking'
    };
  }
  
  return { valid: true, booking };
}

// Extract client IP from request
export function getClientIP(req: Request): string {
  // Try CF-Connecting-IP first (Cloudflare)
  const cfIP = req.headers.get("cf-connecting-ip");
  if (cfIP) return cfIP;

  // Try X-Forwarded-For
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(',')[0].trim();

  // Try X-Real-IP
  const realIP = req.headers.get("x-real-ip");
  if (realIP) return realIP;

  return "unknown";
}
