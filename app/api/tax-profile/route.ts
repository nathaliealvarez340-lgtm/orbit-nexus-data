import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { createErrorResponse } from "@/lib/http";
import { getTaxProfile, upsertTaxProfile } from "@/lib/services/finance/tax-profile";
import { taxProfileSchema } from "@/lib/validation/tax-profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ message: "Sesion no valida." }, { status: 401 });
    }

    return NextResponse.json({
      message: "Datos fiscales listos.",
      data: await getTaxProfile(session)
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ message: "Sesion no valida." }, { status: 401 });
    }

    const input = taxProfileSchema.parse(await request.json());
    const profile = await upsertTaxProfile(session, input);

    return NextResponse.json({
      message: "Datos fiscales actualizados.",
      data: profile
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

