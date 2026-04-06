const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_TEXT = 1000;
const MAX_SHORT = 200;

export function sanitizeText(input: unknown, maxLen = MAX_TEXT): string {
  if (typeof input !== "string") return "";
  return input.trim().slice(0, maxLen).replace(/[<>]/g, "");
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email) && email.length <= MAX_SHORT;
}

export interface ContactInput {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  phone: string;
  service: string;
  message: string;
}

export function validateContactInput(body: unknown): { valid: true; data: ContactInput } | { valid: false; error: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Invalid request body" };
  }

  const b = body as Record<string, unknown>;
  const firstName = sanitizeText(b.firstName, MAX_SHORT);
  const lastName = sanitizeText(b.lastName, MAX_SHORT);
  const email = sanitizeText(b.email, MAX_SHORT);

  if (!firstName) return { valid: false, error: "First name is required" };
  if (!lastName) return { valid: false, error: "Last name is required" };
  if (!email || !isValidEmail(email)) return { valid: false, error: "A valid email is required" };

  return {
    valid: true,
    data: {
      firstName,
      lastName,
      email,
      company: sanitizeText(b.company, MAX_SHORT),
      phone: sanitizeText(b.phone, MAX_SHORT),
      service: sanitizeText(b.service, MAX_SHORT),
      message: sanitizeText(b.message),
    },
  };
}

export interface SubscribeInput {
  email: string;
  firstName: string;
}

export function validateSubscribeInput(body: unknown): { valid: true; data: SubscribeInput } | { valid: false; error: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Invalid request body" };
  }

  const b = body as Record<string, unknown>;
  const email = sanitizeText(b.email, MAX_SHORT);
  if (!email || !isValidEmail(email)) return { valid: false, error: "A valid email is required" };

  return {
    valid: true,
    data: {
      email,
      firstName: sanitizeText(b.firstName, MAX_SHORT),
    },
  };
}
