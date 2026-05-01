import { NextResponse } from "next/server";
import { z } from "zod";
import { getProvisionablePackage } from "@/lib/package-catalog";
import { provisionPackage, provisionPackageBundle } from "@/lib/package-provisioner";
import { getProvisionedPackage, saveProvisionedPackage } from "@/lib/package-provisioning-store";

const ProvisionPackageSchema = z.object({
  packageSlug: z.string().min(1).max(120).optional(),
  packageSlugs: z.array(z.string().min(1).max(120)).max(50).optional(),
  brandName: z.string().min(1).max(120),
  operatorEmail: z.string().email().max(254),
  primaryDomain: z.string().min(3).max(240),
  targetMarket: z.string().min(2).max(180),
  primaryOffer: z.string().min(4).max(1000),
  credentials: z.record(z.string(), z.string().max(5000)).default({}),
}).superRefine((value, ctx) => {
  if (!value.packageSlug && (!value.packageSlugs || value.packageSlugs.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Choose at least one solution.",
      path: ["packageSlug"],
    });
  }
});

function getAppUrl(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured;
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: "Content-Type must be application/json.",
        },
      },
      { status: 415 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = ProvisionPackageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: "Solution provisioning requires a selected outcome and the required intake details.",
          details: parsed.error.issues,
        },
      },
      { status: 422 },
    );
  }

  const requestedSlugs = parsed.data.packageSlugs?.length ? parsed.data.packageSlugs : [parsed.data.packageSlug as string];
  const packages = requestedSlugs.map((slug) => getProvisionablePackage(slug));
  const missingPackage = packages.findIndex((pkg) => !pkg);
  if (missingPackage >= 0) {
    return NextResponse.json(
      { data: null, error: { code: "SOLUTION_NOT_FOUND", message: `Unknown solution: ${requestedSlugs[missingPackage]}.` } },
      { status: 404 },
    );
  }

  if (packages.length > 1) {
    const bundle = provisionPackageBundle({
      packageSlugs: packages.map((pkg) => pkg!.slug),
      brandName: parsed.data.brandName,
      operatorEmail: parsed.data.operatorEmail,
      primaryDomain: parsed.data.primaryDomain,
      targetMarket: parsed.data.targetMarket,
      primaryOffer: parsed.data.primaryOffer,
      credentials: parsed.data.credentials,
      appUrl: getAppUrl(request),
    });
    const missingRequired = bundle.packages.flatMap((pkg) =>
      pkg.credentials.missingRequired.map((field) => ({
        packageSlug: pkg.packageSlug,
        ...field,
      })),
    );

    if (missingRequired.length > 0) {
      return NextResponse.json(
        {
          data: bundle,
          error: {
            code: "MISSING_REQUIRED_CREDENTIALS",
            message: "Required intake fields are missing.",
            details: missingRequired,
          },
        },
        { status: 422 },
      );
    }

    try {
      const savedPackages = await Promise.all(bundle.packages.map((pkg) => saveProvisionedPackage(pkg)));
      return NextResponse.json({
        data: {
          ...bundle,
          packages: savedPackages,
        },
        error: null,
      });
    } catch (err) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "PROVISIONING_PERSISTENCE_FAILED",
            message: err instanceof Error ? err.message : "Solution bundle was generated but could not be persisted.",
          },
        },
        { status: 503 },
      );
    }
  }

  const pkg = packages[0]!;
  const provisioned = provisionPackage({
    packageSlug: pkg.slug,
    brandName: parsed.data.brandName,
    operatorEmail: parsed.data.operatorEmail,
    primaryDomain: parsed.data.primaryDomain,
    targetMarket: parsed.data.targetMarket,
    primaryOffer: parsed.data.primaryOffer,
    credentials: parsed.data.credentials,
    appUrl: getAppUrl(request),
  });

  if (provisioned.credentials.missingRequired.length > 0) {
    return NextResponse.json(
      {
        data: provisioned,
        error: {
          code: "MISSING_REQUIRED_CREDENTIALS",
          message: "Required intake fields are missing.",
          details: provisioned.credentials.missingRequired,
        },
      },
      { status: 422 },
    );
  }

  try {
    const saved = await saveProvisionedPackage(provisioned);
    return NextResponse.json({ data: saved, error: null });
  } catch (err) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "PROVISIONING_PERSISTENCE_FAILED",
          message: err instanceof Error ? err.message : "Solution was generated but could not be persisted.",
        },
      },
      { status: 503 },
    );
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const launchId = url.searchParams.get("launchId")?.trim();
  if (!launchId) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "launchId is required." } },
      { status: 400 },
    );
  }

  try {
    const record = await getProvisionedPackage(launchId);
    if (!record) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Provisioned solution was not found." } },
        { status: 404 },
      );
    }
    return NextResponse.json({ data: record, error: null });
  } catch (err) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "PROVISIONING_LOOKUP_FAILED",
          message: err instanceof Error ? err.message : "Provisioned solution lookup failed.",
        },
      },
      { status: 503 },
    );
  }
}
