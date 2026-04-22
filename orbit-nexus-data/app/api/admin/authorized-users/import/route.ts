import { NextResponse } from "next/server";

import { assertRole } from "@/lib/auth/authorization";
import { getSession } from "@/lib/auth/session";
import { assertTenantAccess } from "@/lib/auth/tenant";
import { createErrorResponse } from "@/lib/http";
import { importAuthorizedUsers } from "@/lib/services/import/import-authorized-users";
import { importAuthorizedUsersSchema } from "@/lib/validation/import";

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { message: "Sesion no valida." },
        { status: 401 }
      );
    }

    assertRole(session, ["SUPERADMIN", "LEADER"]);

    const body = await request.json();
    const input = importAuthorizedUsersSchema.parse(body);

    if (session.role !== "SUPERADMIN") {
      for (const dataset of input.datasets) {
        assertTenantAccess(session, dataset.companyId);
      }
    }

    const results = await importAuthorizedUsers(input.datasets);

    return NextResponse.json({
      message: "Importacion de usuarios autorizados completada.",
      data: results
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

