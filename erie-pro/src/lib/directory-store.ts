// ── Directory Listing Data Access Layer ─────────────────────────────
// CRUD for scraped Google Places listings.
// Mirrors provider-store.ts patterns.

import { prisma } from "@/lib/db";
import type { DirectoryListing } from "@/generated/prisma";

export type { DirectoryListing };

// ── Slug generation ───────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function generateListingSlug(
  businessName: string,
  niche: string,
  city: string
): string {
  return slugify(`${businessName}-${niche}-${city}`);
}

// ── Reads ─────────────────────────────────────────────────────────

export async function getDirectoryListingBySlug(
  slug: string
): Promise<DirectoryListing | null> {
  return prisma.directoryListing.findUnique({ where: { slug } });
}

export async function getDirectoryListingById(
  id: string
): Promise<DirectoryListing | null> {
  return prisma.directoryListing.findUnique({ where: { id } });
}

export async function getDirectoryListingsByNiche(
  niche: string,
  options?: { limit?: number; orderBy?: "rating" | "reviewCount" | "businessName" }
): Promise<DirectoryListing[]> {
  const { limit = 50, orderBy = "rating" } = options ?? {};
  return prisma.directoryListing.findMany({
    where: { niche, isActive: true },
    orderBy: { [orderBy]: "desc" },
    take: limit,
  });
}

export async function getDirectoryListingByGooglePlaceId(
  googlePlaceId: string
): Promise<DirectoryListing | null> {
  return prisma.directoryListing.findUnique({ where: { googlePlaceId } });
}

export async function getAllDirectoryListingSlugs(): Promise<
  { niche: string; slug: string; updatedAt: Date }[]
> {
  return prisma.directoryListing.findMany({
    where: { isActive: true },
    select: { niche: true, slug: true, updatedAt: true },
  });
}

export async function getDirectoryListingCount(
  niche?: string
): Promise<number> {
  return prisma.directoryListing.count({
    where: { isActive: true, ...(niche ? { niche } : {}) },
  });
}

// ── Writes ────────────────────────────────────────────────────────

export interface UpsertDirectoryListingInput {
  googlePlaceId: string;
  businessName: string;
  niche: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  addressStreet?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressZip?: string | null;
  addressFormatted?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  rating?: number | null;
  reviewCount?: number;
  priceLevel?: number | null;
  hoursJson?: unknown;
  categories?: string[];
  photoRefs?: string[];
  reviewsJson?: unknown;
  servicesOffered?: string[];
  source?: string;
}

export async function upsertDirectoryListing(
  data: UpsertDirectoryListingInput
): Promise<{ listing: DirectoryListing; created: boolean }> {
  const slug = generateListingSlug(
    data.businessName,
    data.niche,
    data.addressCity ?? "erie"
  );

  const existing = await prisma.directoryListing.findUnique({
    where: { googlePlaceId: data.googlePlaceId },
  });

  if (existing) {
    // Update with fresh data but preserve slug (URL stability)
    const updated = await prisma.directoryListing.update({
      where: { id: existing.id },
      data: {
        businessName: data.businessName,
        phone: data.phone,
        email: data.email,
        website: data.website,
        addressStreet: data.addressStreet,
        addressCity: data.addressCity,
        addressState: data.addressState,
        addressZip: data.addressZip,
        addressFormatted: data.addressFormatted,
        latitude: data.latitude,
        longitude: data.longitude,
        description: data.description,
        rating: data.rating,
        reviewCount: data.reviewCount ?? 0,
        priceLevel: data.priceLevel,
        hoursJson: data.hoursJson as object | undefined,
        categories: data.categories ?? [],
        photoRefs: data.photoRefs ?? [],
        reviewsJson: data.reviewsJson as object | undefined,
        servicesOffered: data.servicesOffered ?? [],
        lastScrapedAt: new Date(),
        isActive: true,
      },
    });
    return { listing: updated, created: false };
  }

  // Handle slug collision by appending a suffix
  let finalSlug = slug;
  let attempt = 0;
  while (await prisma.directoryListing.findUnique({ where: { slug: finalSlug } })) {
    attempt++;
    finalSlug = `${slug}-${attempt}`;
  }

  const created = await prisma.directoryListing.create({
    data: {
      slug: finalSlug,
      googlePlaceId: data.googlePlaceId,
      businessName: data.businessName,
      niche: data.niche,
      phone: data.phone,
      email: data.email,
      website: data.website,
      addressStreet: data.addressStreet,
      addressCity: data.addressCity,
      addressState: data.addressState,
      addressZip: data.addressZip,
      addressFormatted: data.addressFormatted,
      latitude: data.latitude,
      longitude: data.longitude,
      description: data.description,
      rating: data.rating,
      reviewCount: data.reviewCount ?? 0,
      priceLevel: data.priceLevel,
      hoursJson: data.hoursJson as object | undefined,
      categories: data.categories ?? [],
      photoRefs: data.photoRefs ?? [],
      reviewsJson: data.reviewsJson as object | undefined,
      servicesOffered: data.servicesOffered ?? [],
      source: data.source ?? "google_places",
      lastScrapedAt: new Date(),
    },
  });

  return { listing: created, created: true };
}
