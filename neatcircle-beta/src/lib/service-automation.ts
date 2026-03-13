import { NextRequest, NextResponse } from "next/server";
import { createCompany, SuiteDashError } from "@/lib/suitedash";
import { serverSiteConfig } from "@/lib/site-config";

export interface AutomationContact {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

interface ServiceAutomationConfig<T> {
  slug: string;
  nameFieldLabel: string;
  successMessage: string;
  getCompanyName: (body: Partial<T>) => string | undefined;
  getContact: (body: Partial<T>) => AutomationContact | undefined;
  buildTags?: (body: Partial<T>) => string[];
  buildBackgroundInfo?: (body: Partial<T>) => Array<string | undefined | false>;
}

function isDryRun(req: NextRequest, body: unknown) {
  if (req.headers.get("x-lead-os-dry-run") === "1") return true;
  return typeof body === "object"
    && body !== null
    && "dryRun" in (body as Record<string, unknown>)
    && (body as Record<string, unknown>).dryRun === true;
}

function normalizeTag(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeTags(slug: string, extraTags: string[] = []) {
  return Array.from(
    new Set(
      [slug, serverSiteConfig.tenantSlug, ...extraTags]
        .map((tag) => normalizeTag(tag))
        .filter(Boolean),
    ),
  );
}

function normalizeBackgroundInfo(lines: Array<string | undefined | false> = []) {
  const value = lines.filter(Boolean).join("\n");
  return value || undefined;
}

export function createServiceAutomationRoute<T>(config: ServiceAutomationConfig<T>) {
  return async function POST(req: NextRequest) {
    try {
      const body = (await req.json()) as Partial<T>;
      const companyName = config.getCompanyName(body);
      const contact = config.getContact(body);

      if (!companyName || !contact?.firstName || !contact?.lastName || !contact?.email) {
        return NextResponse.json(
          {
            error: `${config.nameFieldLabel} and contact information (firstName, lastName, email) are required.`,
          },
          { status: 400 },
        );
      }

      const tags = normalizeTags(config.slug, config.buildTags?.(body) ?? []);
      const backgroundInfo = normalizeBackgroundInfo(config.buildBackgroundInfo?.(body));
      const dryRun = isDryRun(req, body);

      if (dryRun) {
        return NextResponse.json({
          success: true,
          dryRun: true,
          automation: config.slug,
          message: `${config.successMessage} (dry run)`,
          preview: {
            companyName,
            contact,
            tags,
            backgroundInfo,
          },
        });
      }

      const companyResult = await createCompany({
        name: companyName,
        role: "Lead",
        primaryContact: {
          email: contact.email,
          first_name: contact.firstName,
          last_name: contact.lastName,
          create_primary_contact_if_not_exists: true,
        },
        phone: contact.phone,
        tags,
        background_info: backgroundInfo,
      });

      return NextResponse.json({
        success: true,
        automation: config.slug,
        companyUid: companyResult.data?.uid,
        message: config.successMessage,
      });
    } catch (err) {
      console.error(`${config.slug} error:`, err);
      if (err instanceof SuiteDashError) {
        return NextResponse.json(
          { error: err.message, automation: config.slug },
          { status: err.statusCode ?? 502 },
        );
      }
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  };
}
