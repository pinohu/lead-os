import { NextResponse } from "next/server";
import { embeddedSecrets } from "@/lib/embedded-secrets";
import { createCompany, updateProject, SuiteDashError } from "@/lib/suitedash";
import { serverSiteConfig } from "@/lib/site-config";

const EMAILIT = {
  apiKey: process.env.EMAILIT_API_KEY ?? embeddedSecrets.emailit.apiKey,
  apiBase: "https://api.emailit.com/v1",
  domain: serverSiteConfig.siteDomain,
};

const AITABLE = {
  apiToken: process.env.AITABLE_API_TOKEN ?? embeddedSecrets.aitable.apiToken,
  datasheetId: process.env.AITABLE_DATASHEET_ID ?? embeddedSecrets.aitable.datasheetId,
  apiBase: "https://aitable.ai/fusion/v1",
};

interface ConvertRequest {
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  phone?: string;
  scenario: string;
  projectTemplate?: string;
  dealValue?: number;
}

async function httpJson(
  method: string,
  url: string,
  body?: unknown,
  headers: Record<string, string> = {},
) {
  const opts: RequestInit = {
    method,
    headers: { "Content-Type": "application/json", ...headers },
  };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: res.status, ok: res.ok, data };
  } catch (err) {
    return { status: 0, ok: false, data: (err as Error).message };
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ConvertRequest;

    if (!body.email || !body.firstName || !body.lastName || !body.company || !body.scenario) {
      return NextResponse.json(
        { error: "Missing required fields: email, firstName, lastName, company, scenario" },
        { status: 400 },
      );
    }

    const results: Record<string, unknown> = {};

    // 1. Update SuiteDash contact role: Lead → Client
    try {
      const companyRes = await createCompany({
        name: body.company,
        role: "Client",
        primaryContact: {
          email: body.email,
          first_name: body.firstName,
          last_name: body.lastName,
          create_primary_contact_if_not_exists: true,
        },
        phone: body.phone,
        tags: ["converted", "client", body.scenario],
      });
      results.suitedash = { success: true, uid: companyRes.data?.uid };
    } catch (err) {
      if (err instanceof SuiteDashError) {
        results.suitedash = { success: false, error: err.message };
      } else {
        results.suitedash = { success: false, error: (err as Error).message };
      }
    }

    // 2. Create SuiteDash project from template (if uid available)
    const companyUid = (results.suitedash as Record<string, unknown>)?.uid as string | undefined;
    if (companyUid && body.projectTemplate) {
      try {
        await updateProject(companyUid, {
          name: `${body.company} — ${body.scenario} Onboarding`,
          description: `Converted lead. Scenario: ${body.scenario}. Contact: ${body.firstName} ${body.lastName} (${body.email}).`,
          status: "active",
          tags: ["onboarding", body.scenario],
        });
        results.project = { success: true };
      } catch (err) {
        results.project = { success: false, error: (err as Error).message };
      }
    }

    // 3. Send project kickoff email (Emailit Template 5)
    const kickoffHtml = `
      <div style="font-family:Georgia,serif;max-width:600px;line-height:1.6;color:#333;">
        <h2>Welcome aboard, ${body.firstName}!</h2>
        <p>We're excited to officially welcome <strong>${body.company}</strong> as a client.</p>
        <p>Here's what happens next:</p>
        <ol>
          <li><strong>Onboarding call</strong> — We'll schedule a 30-minute kickoff call to align on goals and timeline</li>
          <li><strong>Portal access</strong> — You'll receive login credentials to your dedicated client portal</li>
          <li><strong>Project setup</strong> — Your ${body.scenario.replace(/-/g, " ")} project will be configured within 48 hours</li>
        </ol>
        <p>In the meantime, if you have any questions, just reply to this email.</p>
        <p style="color:#888;font-size:12px;margin-top:30px;border-top:1px solid #eee;padding-top:15px;">
          ${serverSiteConfig.brandName} Client Success Team
        </p>
      </div>`;

    const emailRes = await httpJson(
      "POST",
      `${EMAILIT.apiBase}/emails`,
      {
        from: `${serverSiteConfig.brandName} <${serverSiteConfig.fromEmail}>`,
        to: body.email,
        subject: `Welcome to ${serverSiteConfig.brandName}, ${body.firstName}!`,
        html: kickoffHtml,
        tracking: { opens: true, clicks: true },
      },
      { Authorization: `Bearer ${EMAILIT.apiKey}` },
    );
    results.kickoffEmail = { success: emailRes.ok };

    // 4. Log to AITable
    await httpJson(
      "POST",
      `${AITABLE.apiBase}/datasheets/${AITABLE.datasheetId}/records?fieldKey=name`,
      {
        records: [
          {
            fields: {
              Title: `CONVERTED — ${body.scenario} — ${body.company}`,
              Scenario: body.scenario,
              Company: body.company,
              "Contact Email": body.email,
              "Contact Name": `${body.firstName} ${body.lastName}`,
              Status: "CONVERTED",
              Touchpoint: "client.onboarded",
              "AI Generated": `Lead converted to client. Deal value: $${body.dealValue ?? "TBD"}. Kickoff email sent.`,
            },
          },
        ],
        fieldKey: "name",
      },
      { Authorization: `Bearer ${AITABLE.apiToken}` },
    );
    results.aitable = { success: true };

    return NextResponse.json({
      success: true,
      automation: "convert",
      results,
      message: `${body.company} converted to client`,
    });
  } catch (err) {
    if (err instanceof SuiteDashError) {
      return NextResponse.json(
        { error: err.message, statusCode: err.statusCode },
        { status: 502 },
      );
    }
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
