import { SignJWT, jwtVerify } from "jose";

import { getJwtSecret } from "@/lib/config";
import type { SessionUser } from "@/types/auth";

const secret = new TextEncoder().encode(getJwtSecret());

export async function signSessionToken(session: SessionUser) {
  const tenantId = session.tenantId ?? session.companyId ?? null;

  return new SignJWT({
    tenantId,
    companyId: session.companyId,
    role: session.role,
    accessCode: session.accessCode,
    fullName: session.fullName
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.userId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, secret);
  const companyId = (payload.companyId as string | null | undefined) ?? null;
  const tenantId = (payload.tenantId as string | null | undefined) ?? companyId;

  return {
    userId: payload.sub!,
    tenantId,
    companyId,
    role: payload.role as SessionUser["role"],
    accessCode: payload.accessCode as string,
    fullName: payload.fullName as string
  } satisfies SessionUser;
}
