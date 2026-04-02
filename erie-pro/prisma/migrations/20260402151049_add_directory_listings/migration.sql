-- CreateTable
CREATE TABLE "directory_listings" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "googlePlaceId" TEXT,
    "businessName" TEXT NOT NULL,
    "niche" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "addressStreet" TEXT,
    "addressCity" TEXT,
    "addressState" TEXT,
    "addressZip" TEXT,
    "addressFormatted" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "description" TEXT,
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "priceLevel" INTEGER,
    "hoursJson" JSONB,
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "photoRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reviewsJson" JSONB,
    "servicesOffered" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "claimedByProviderId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'google_places',
    "lastScrapedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "directory_listings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "directory_listings_slug_key" ON "directory_listings"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "directory_listings_googlePlaceId_key" ON "directory_listings"("googlePlaceId");

-- CreateIndex
CREATE INDEX "directory_listings_niche_idx" ON "directory_listings"("niche");

-- CreateIndex
CREATE INDEX "directory_listings_niche_addressCity_idx" ON "directory_listings"("niche", "addressCity");

-- CreateIndex
CREATE INDEX "directory_listings_slug_idx" ON "directory_listings"("slug");

-- CreateIndex
CREATE INDEX "providers_niche_subscriptionStatus_idx" ON "providers"("niche", "subscriptionStatus");
