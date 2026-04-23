import { NextResponse } from "next/server";

import { assertRole } from "@/lib/auth/authorization";
import { getSession } from "@/lib/auth/session";
import { createErrorResponse } from "@/lib/http";
import {
  createCompany,
  getCompanySummaryList
} from "@/lib/services/admin/company-management";
import { createCompanyPayloadSchema } from "@/lib/validation/auth-payloads";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ message: "Sesion no valida." }, { status: 401 });
    }

    assertRole(session, ["SUPERADMIN"]);

    const companies = await getCompanySummaryList();

    return NextResponse.json({
      data: companies
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ message: "Sesion no valida." }, { status: 401 });
    }

    assertRole(session, ["SUPERADMIN"]);

    const body = await request.json();
    const input = createCompanyPayloadSchema.parse(body);
    const company = await createCompany(input);

    return NextResponse.json({
      message: "Empresa registrada correctamente.",
      data: company
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

