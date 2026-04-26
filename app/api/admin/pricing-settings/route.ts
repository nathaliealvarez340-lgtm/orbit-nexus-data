import { NextResponse } from "next/server";

import { assertRole } from "@/lib/auth/authorization";
import { getSession } from "@/lib/auth/session";
import { createErrorResponse } from "@/lib/http";
import {
  getPricingSettings,
  savePricingSettings
} from "@/lib/services/admin/platform-settings";
import { pricingSettingsSchema } from "@/lib/validation/operations";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ message: "Sesion no valida." }, { status: 401 });
    }

    assertRole(session, ["SUPERADMIN"]);

    const settings = await getPricingSettings();
    return NextResponse.json({ data: settings });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ message: "Sesion no valida." }, { status: 401 });
    }

    assertRole(session, ["SUPERADMIN"]);

    const body = await request.json();
    const input = pricingSettingsSchema.parse(body);
    const settings = await savePricingSettings({
      ...input,
      updatedByName: session.fullName
    });

    return NextResponse.json({
      message:
        "Precios globales actualizados. Este cambio puede requerir sincronizacion con Stripe.",
      data: settings
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
