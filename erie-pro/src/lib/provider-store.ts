// ── Provider Data Management ────────────────────────────────────────
// Persistent store for service provider profiles using Prisma/Postgres.
// All functions are async — callers must await.

import { prisma } from "@/lib/db";
import type {
  Provider as PrismaProvider,
  ProviderTier,
  SubscriptionStatus,
} from "@/generated/prisma";

// ── Public Interface ───────────────────────────────────────────────
// Kept for backward compatibility — maps Prisma model to the shape
// the rest of the codebase already expects.

export interface ProviderProfile {
  id: string;
  slug: string;
  businessName: string;
  niche: string;
  city: string;
  phone: string;
  email: string;
  website?: string;
  address: { street: string; city: string; state: string; zip: string };
  serviceAreas: string[];
  description: string;
  yearEstablished: number;
  employeeCount: string;
  license?: string;
  insurance: boolean;
  tier: "primary" | "backup" | "overflow";
  subscriptionStatus: "active" | "trial" | "expired" | "cancelled";
  monthlyFee: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  totalLeads: number;
  convertedLeads: number;
  avgResponseTime: number;
  avgRating: number;
  reviewCount: number;
  claimedAt: string;
  lastLeadAt?: string;
}

// ── Mapper ─────────────────────────────────────────────────────────

function toProfile(p: PrismaProvider): ProviderProfile {
  return {
    id: p.id,
    slug: p.slug,
    businessName: p.businessName,
    niche: p.niche,
    city: p.city,
    phone: p.phone,
    email: p.email,
    website: p.website ?? undefined,
    address: {
      street: p.addressStreet ?? "",
      city: p.addressCity ?? "",
      state: p.addressState ?? "",
      zip: p.addressZip ?? "",
    },
    serviceAreas: p.serviceAreas,
    description: p.description,
    yearEstablished: p.yearEstablished ?? 0,
    employeeCount: p.employeeCount ?? "",
    license: p.license ?? undefined,
    insurance: p.insurance,
    tier: p.tier as ProviderProfile["tier"],
    subscriptionStatus: p.subscriptionStatus as ProviderProfile["subscriptionStatus"],
    monthlyFee: p.monthlyFee,
    stripeCustomerId: p.stripeCustomerId ?? undefined,
    stripeSubscriptionId: p.stripeSubscriptionId ?? undefined,
    totalLeads: p.totalLeads,
    convertedLeads: p.convertedLeads,
    avgResponseTime: p.avgResponseTime,
    avgRating: p.avgRating,
    reviewCount: p.reviewCount,
    claimedAt: p.claimedAt.toISOString(),
    lastLeadAt: p.lastLeadAt?.toISOString(),
  };
}

// ── Helpers ────────────────────────────────────────────────────────

function slugify(name: string, city: string): string {
  return (name + "-" + city)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ── CRUD Operations ────────────────────────────────────────────────

export async function getProvider(id: string): Promise<ProviderProfile | undefined> {
  const p = await prisma.provider.findUnique({ where: { id } });
  return p ? toProfile(p) : undefined;
}

export async function getProviderBySlug(slug: string): Promise<ProviderProfile | undefined> {
  const p = await prisma.provider.findUnique({ where: { slug } });
  return p ? toProfile(p) : undefined;
}

export async function getProviderByNicheAndCity(
  niche: string,
  city: string
): Promise<ProviderProfile | undefined> {
  const p = await prisma.provider.findFirst({
    where: {
      niche,
      city: { equals: city, mode: "insensitive" },
      tier: "primary",
      subscriptionStatus: "active",
    },
  });
  return p ? toProfile(p) : undefined;
}

export async function getProvidersByNiche(niche: string): Promise<ProviderProfile[]> {
  const providers = await prisma.provider.findMany({ where: { niche } });
  return providers.map(toProfile);
}

export async function getAllProviders(): Promise<ProviderProfile[]> {
  const providers = await prisma.provider.findMany();
  return providers.map(toProfile);
}

export async function getActiveProviders(): Promise<ProviderProfile[]> {
  const providers = await prisma.provider.findMany({
    where: { subscriptionStatus: "active" },
  });
  return providers.map(toProfile);
}

export async function createProvider(
  data: Omit<ProviderProfile, "id" | "claimedAt">
): Promise<ProviderProfile> {
  const slug = data.slug || slugify(data.businessName, data.city);

  const p = await prisma.provider.create({
    data: {
      slug,
      businessName: data.businessName,
      niche: data.niche,
      city: data.city,
      phone: data.phone,
      email: data.email.toLowerCase(),
      website: data.website,
      addressStreet: data.address.street,
      addressCity: data.address.city,
      addressState: data.address.state,
      addressZip: data.address.zip,
      serviceAreas: data.serviceAreas,
      description: data.description,
      yearEstablished: data.yearEstablished,
      employeeCount: data.employeeCount,
      license: data.license,
      insurance: data.insurance,
      tier: data.tier as ProviderTier,
      subscriptionStatus: data.subscriptionStatus as SubscriptionStatus,
      monthlyFee: data.monthlyFee,
      stripeCustomerId: data.stripeCustomerId,
      stripeSubscriptionId: data.stripeSubscriptionId,
      totalLeads: data.totalLeads,
      convertedLeads: data.convertedLeads,
      avgResponseTime: data.avgResponseTime,
      avgRating: data.avgRating,
      reviewCount: data.reviewCount,
      lastLeadAt: data.lastLeadAt ? new Date(data.lastLeadAt) : undefined,
    },
  });

  return toProfile(p);
}

export async function updateProvider(
  id: string,
  updates: Partial<ProviderProfile>
): Promise<ProviderProfile | undefined> {
  try {
    // Build the Prisma-compatible update data
    const data: Record<string, unknown> = {};

    if (updates.businessName !== undefined) data.businessName = updates.businessName;
    if (updates.niche !== undefined) data.niche = updates.niche;
    if (updates.city !== undefined) data.city = updates.city;
    if (updates.phone !== undefined) data.phone = updates.phone;
    if (updates.email !== undefined) data.email = updates.email.toLowerCase();
    if (updates.website !== undefined) data.website = updates.website;
    if (updates.description !== undefined) data.description = updates.description;
    if (updates.yearEstablished !== undefined) data.yearEstablished = updates.yearEstablished;
    if (updates.employeeCount !== undefined) data.employeeCount = updates.employeeCount;
    if (updates.license !== undefined) data.license = updates.license;
    if (updates.insurance !== undefined) data.insurance = updates.insurance;
    if (updates.tier !== undefined) data.tier = updates.tier as ProviderTier;
    if (updates.subscriptionStatus !== undefined)
      data.subscriptionStatus = updates.subscriptionStatus as SubscriptionStatus;
    if (updates.monthlyFee !== undefined) data.monthlyFee = updates.monthlyFee;
    if (updates.stripeCustomerId !== undefined) data.stripeCustomerId = updates.stripeCustomerId;
    if (updates.stripeSubscriptionId !== undefined)
      data.stripeSubscriptionId = updates.stripeSubscriptionId;
    if (updates.totalLeads !== undefined) data.totalLeads = updates.totalLeads;
    if (updates.convertedLeads !== undefined) data.convertedLeads = updates.convertedLeads;
    if (updates.avgResponseTime !== undefined) data.avgResponseTime = updates.avgResponseTime;
    if (updates.avgRating !== undefined) data.avgRating = updates.avgRating;
    if (updates.reviewCount !== undefined) data.reviewCount = updates.reviewCount;
    if (updates.serviceAreas !== undefined) data.serviceAreas = updates.serviceAreas;
    if (updates.lastLeadAt !== undefined)
      data.lastLeadAt = updates.lastLeadAt ? new Date(updates.lastLeadAt) : null;

    if (updates.address) {
      if (updates.address.street !== undefined) data.addressStreet = updates.address.street;
      if (updates.address.city !== undefined) data.addressCity = updates.address.city;
      if (updates.address.state !== undefined) data.addressState = updates.address.state;
      if (updates.address.zip !== undefined) data.addressZip = updates.address.zip;
    }

    const p = await prisma.provider.update({ where: { id }, data });
    return toProfile(p);
  } catch {
    return undefined;
  }
}

export async function deleteProvider(id: string): Promise<boolean> {
  try {
    await prisma.provider.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

// ── Query Helpers ──────────────────────────────────────────────────

export async function getProviderStats(): Promise<{
  total: number;
  active: number;
  totalLeads: number;
  totalConverted: number;
  avgRating: number;
}> {
  const [total, active, agg] = await Promise.all([
    prisma.provider.count(),
    prisma.provider.count({ where: { subscriptionStatus: "active" } }),
    prisma.provider.aggregate({
      _sum: { totalLeads: true, convertedLeads: true },
      _avg: { avgRating: true },
    }),
  ]);

  return {
    total,
    active,
    totalLeads: agg._sum.totalLeads ?? 0,
    totalConverted: agg._sum.convertedLeads ?? 0,
    avgRating: Math.round((agg._avg.avgRating ?? 0) * 10) / 10,
  };
}

export async function getClaimedNiches(city: string): Promise<string[]> {
  const providers = await prisma.provider.findMany({
    where: {
      city: { equals: city, mode: "insensitive" },
      subscriptionStatus: "active",
      tier: "primary",
    },
    select: { niche: true },
  });
  return providers.map((p) => p.niche);
}

export async function getAvailableNiches(
  city: string,
  allNicheSlugs: string[]
): Promise<string[]> {
  const claimed = new Set(await getClaimedNiches(city));
  return allNicheSlugs.filter((slug) => !claimed.has(slug));
}
