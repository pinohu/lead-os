const SD_API = "https://app.suitedash.com/secure-api";

function getHeaders(): Record<string, string> {
  const publicId = process.env.SUITEDASH_PUBLIC_ID ?? "";
  const secretKey = process.env.SUITEDASH_SECRET_KEY ?? "";

  if (!publicId || !secretKey) {
    throw new SuiteDashError("Missing SUITEDASH_PUBLIC_ID or SUITEDASH_SECRET_KEY");
  }

  return {
    "X-Public-ID": publicId,
    "X-Secret-Key": secretKey,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

// --- Types ---

export class SuiteDashError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public responseBody?: string,
  ) {
    super(message);
    this.name = "SuiteDashError";
  }
}

export interface SuiteDashContactPayload {
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
  company_name?: string;
  phone?: string;
  tags?: string[];
  notes?: string[];
  send_welcome_email?: boolean;
}

export interface SuiteDashCompanyContact {
  email: string;
  first_name: string;
  last_name: string;
  create_primary_contact_if_not_exists?: boolean;
  role?: "Lead" | "Prospect" | "Client";
}

export interface SuiteDashCompanyPayload {
  name: string;
  role: "Lead" | "Prospect" | "Client";
  primaryContact: SuiteDashCompanyContact;
  phone?: string;
  website?: string;
  tags?: string[];
  background_info?: string;
}

export interface SuiteDashProjectPayload {
  name?: string;
  description?: string;
  status?: string;
  tags?: string[];
  [key: string]: unknown;
}

export interface SuiteDashResponse {
  success: boolean;
  message?: string;
  data?: {
    uid?: string;
    [key: string]: unknown;
  };
}

export interface SuiteDashListResponse {
  success: boolean;
  message?: string;
  data?: Array<Record<string, unknown>>;
  meta?: Record<string, unknown>;
}

// --- Helpers ---

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let parsed: T;

  try {
    parsed = JSON.parse(text) as T;
  } catch {
    throw new SuiteDashError(
      `Invalid JSON response from SuiteDash`,
      res.status,
      text,
    );
  }

  if (!res.ok) {
    const msg =
      (parsed as Record<string, unknown>)?.message ?? "SuiteDash API error";
    throw new SuiteDashError(String(msg), res.status, text);
  }

  return parsed;
}

function isAlreadyExists(response: SuiteDashResponse): boolean {
  return (
    !response.success &&
    typeof response.message === "string" &&
    response.message.toLowerCase().includes("already exists")
  );
}

// --- API Methods ---

export async function createContact(
  payload: SuiteDashContactPayload,
): Promise<SuiteDashResponse> {
  const res = await fetch(`${SD_API}/contact`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await handleResponse<SuiteDashResponse>(res);

  if (data.success || isAlreadyExists(data)) {
    return {
      success: true,
      message: isAlreadyExists(data) ? "Contact already exists" : data.message,
      data: data.data,
    };
  }

  throw new SuiteDashError(
    data.message ?? "Failed to create contact",
    undefined,
    JSON.stringify(data),
  );
}

function normalizeWebsite(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

export async function createCompany(
  payload: SuiteDashCompanyPayload,
): Promise<SuiteDashResponse> {
  const body = { ...payload, website: normalizeWebsite(payload.website) };
  const res = await fetch(`${SD_API}/company`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  const data = await handleResponse<SuiteDashResponse>(res);

  if (data.success || isAlreadyExists(data)) {
    return {
      success: true,
      message: isAlreadyExists(data) ? "Company already exists" : data.message,
      data: data.data,
    };
  }

  throw new SuiteDashError(
    data.message ?? "Failed to create company",
    undefined,
    JSON.stringify(data),
  );
}

export async function getContacts(
  params?: Record<string, string>,
): Promise<SuiteDashListResponse> {
  const url = new URL(`${SD_API}/contacts`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: getHeaders(),
  });

  return handleResponse<SuiteDashListResponse>(res);
}

export async function updateProject(
  uid: string,
  payload: SuiteDashProjectPayload,
): Promise<SuiteDashResponse> {
  const res = await fetch(`${SD_API}/project/${uid}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse<SuiteDashResponse>(res);
}

export async function checkConnectivity(): Promise<boolean> {
  try {
    const res = await fetch(`${SD_API}/contacts?per_page=1`, {
      method: "GET",
      headers: getHeaders(),
    });
    return res.ok;
  } catch {
    return false;
  }
}
