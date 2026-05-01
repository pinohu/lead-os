import { NextResponse } from "next/server";
import { z } from "zod";
import { getOperatorPortal, isPackageSubscribed } from "@/lib/operator-portals";
import { provisionPackage, provisionPackageBundle } from "@/lib/package-provisioner";
import { saveProvisionedPackage } from "@/lib/package-provisioning-store";
import type { PackageSlug } from "@/lib/package-catalog";

type RouteContext = {
  params: Promise<{ operatorSlug: string }>;
};

const OperatorPortalProvisionSchema = z.object({
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
      message: "Choose at least one service.",
      path: ["packageSlug"],
    });
  }
});

function getPortalAppUrl(request: Request, operatorSlug: string): string {
  const url = new URL(request.url);
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host") || url.host;
  const proto = forwardedProto || url.protocol.replace(":", "") || "https";
  return `${proto}://${host}/portal/${operatorSlug}`;
}

function uniqueRequestedSlugs(data: z.infer<typeof OperatorPortalProvisionSchema>): string[] {
  return Array.from(new Set(data.packageSlugs?.length ? data.packageSlugs : [data.packageSlug as string]));
}

export async function POST(request: Request, context: RouteContext) {
  const { operatorSlug } = await context.params;
  const portal = getOperatorPortal(operatorSlug);
  if (!portal) {
    return NextResponse.json(
      { data: null, error: { code: "PORTAL_NOT_FOUND", message: "This operator portal is not available." } },
      { status: 404 },
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "Content-Type must be application/json." } },
      { status: 415 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = OperatorPortalProvisionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: "Service launch requires a selected service and the required intake details.",
          details: parsed.error.issues,
        },
      },
      { status: 422 },
    );
  }

  const requestedSlugs = uniqueRequestedSlugs(parsed.data);
  const unauthorizedSlug = requestedSlugs.find((slug) => !isPackageSubscribed(portal, slug));
  if (unauthorizedSlug) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "SERVICE_NOT_ACTIVE",
          message: "That service is not active on this operator portal.",
          details: { packageSlug: unauthorizedSlug },
        },
      },
      { status: 403 },
    );
  }

  const baseInput = {
    brandName: parsed.data.brandName,
    operatorEmail: parsed.data.operatorEmail,
    primaryDomain: parsed.data.primaryDomain,
    targetMarket: parsed.data.targetMarket,
    primaryOffer: parsed.data.primaryOffer,
    credentials: parsed.data.credentials,
    appUrl: getPortalAppUrl(request, operatorSlug),
    deliveryBrandName: portal.brandName,
    guidanceOptions: {
      engineRoleName: `${portal.brandName} service engine`,
      managedHandoffLabel: "service handoff",
    },
  };

  if (requestedSlugs.length > 1) {
    const bundle = provisionPackageBundle({
      ...baseInput,
      packageSlugs: requestedSlugs as PackageSlug[],
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

    const savedPackages = await Promise.all(bundle.packages.map((pkg) => saveProvisionedPackage(pkg)));
    return NextResponse.json({
      data: {
        ...bundle,
        packages: savedPackages,
        portal: {
          slug: portal.slug,
          brandName: portal.brandName,
          supportEmail: portal.supportEmail,
        },
      },
      error: null,
    });
  }

  const provisioned = provisionPackage({
    ...baseInput,
    packageSlug: requestedSlugs[0] as PackageSlug,
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

  const saved = await saveProvisionedPackage(provisioned);
  return NextResponse.json({
    data: {
      ...saved,
      portal: {
        slug: portal.slug,
        brandName: portal.brandName,
        supportEmail: portal.supportEmail,
      },
    },
    error: null,
  });
}
