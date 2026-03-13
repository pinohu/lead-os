import { NextRequest, NextResponse } from "next/server";
import { createCompany, createContact, SuiteDashError } from "@/lib/suitedash";
import { serverSiteConfig } from "@/lib/site-config";

interface Employee {
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
}

interface ComplianceTrainingRequest {
  companyName: string;
  employees: Employee[];
  courses: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<ComplianceTrainingRequest>;
    const { companyName, employees, courses } = body;

    if (!companyName || !employees?.length || !courses?.length) {
      return NextResponse.json(
        { error: "companyName, employees (non-empty array), and courses (non-empty array) are required." },
        { status: 400 },
      );
    }

    for (const employee of employees) {
      if (!employee.firstName || !employee.lastName || !employee.email) {
        return NextResponse.json(
          { error: "Each employee must have firstName, lastName, and email." },
          { status: 400 },
        );
      }
    }

    const courseTags = courses.map((course) => `course-${course.toLowerCase().replace(/\s+/g, "-")}`);
    const companyTags = ["compliance-training", serverSiteConfig.tenantSlug, ...courseTags];
    const [primaryEmployee, ...remainingEmployees] = employees;

    const companyResult = await createCompany({
      name: companyName,
      role: "Lead",
      primaryContact: {
        email: primaryEmployee.email,
        first_name: primaryEmployee.firstName,
        last_name: primaryEmployee.lastName,
        create_primary_contact_if_not_exists: true,
      },
      tags: companyTags,
      background_info: `Compliance courses: ${courses.join(", ")}\nEmployee count: ${employees.length}`,
    });

    const contactResults: Array<{ email: string; uid?: string; existing?: boolean }> = [
      {
        email: primaryEmployee.email,
        uid: companyResult.data?.uid as string | undefined,
      },
    ];

    for (const employee of remainingEmployees) {
      const employeeTags = [
        "compliance-training",
        serverSiteConfig.tenantSlug,
        ...courseTags,
        employee.role ? `role-${employee.role.toLowerCase().replace(/\s+/g, "-")}` : "",
      ].filter(Boolean);

      const result = await createContact({
        first_name: employee.firstName,
        last_name: employee.lastName,
        email: employee.email,
        company_name: companyName,
        role: employee.role ?? "Employee",
        tags: employeeTags,
        notes: [`Assigned courses: ${courses.join(", ")}`],
        send_welcome_email: false,
      });

      contactResults.push({
        email: employee.email,
        uid: result.data?.uid as string | undefined,
        existing: result.message === "Contact already exists",
      });
    }

    return NextResponse.json({
      success: true,
      automation: "compliance-training",
      companyUid: companyResult.data?.uid,
      contacts: contactResults,
      coursesAssigned: courses,
      message: `${contactResults.length} employees enrolled in ${courses.length} compliance course(s)`,
    });
  } catch (err) {
    console.error("compliance-training error:", err);
    if (err instanceof SuiteDashError) {
      return NextResponse.json(
        { error: err.message, automation: "compliance-training" },
        { status: err.statusCode ?? 502 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
