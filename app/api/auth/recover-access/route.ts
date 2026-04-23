import { NextResponse } from "next/server";

import {
  ACCESS_CODE_RECOVERY_SUCCESS_MESSAGE,
  PASSWORD_RECOVERY_SUCCESS_MESSAGE
} from "@/lib/constants";
import { createErrorResponse } from "@/lib/http";
import { recoverAccess } from "@/lib/services/auth/recover-access";
import { recoverAccessPayloadSchema } from "@/lib/validation/auth-payloads";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = recoverAccessPayloadSchema.parse(body);
    const result = await recoverAccess(input);

    return NextResponse.json({
      success: true,
      message:
        input.kind === "PASSWORD"
          ? PASSWORD_RECOVERY_SUCCESS_MESSAGE
          : ACCESS_CODE_RECOVERY_SUCCESS_MESSAGE,
      data: result
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

