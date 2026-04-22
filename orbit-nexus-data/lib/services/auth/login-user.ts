import { AUTH_INVALID_CREDENTIALS_MESSAGE } from "@/lib/constants";
import { normalizeAccessCode } from "@/lib/normalization";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/services/service-error";

type LoginUserInput = {
  accessCode: string;
  password: string;
  ipAddress?: string;
  device?: string;
};

async function recordLoginActivity(input: {
  userId?: string;
  roleId?: string;
  companyId?: string;
  accessCodeAttempt?: string;
  ipAddress?: string;
  device?: string;
  status: "SUCCESS" | "FAILED";
  failureReason?: string;
}) {
  await prisma.loginActivity.create({
    data: input
  });
}

export async function loginUser(input: LoginUserInput) {
  const accessCode = normalizeAccessCode(input.accessCode);

  const user = await prisma.user.findFirst({
    where: {
      accessCode
    },
    include: {
      role: true
    }
  });

  if (!user || !user.passwordHash || user.status !== "ACTIVE") {
    await recordLoginActivity({
      userId: user?.id,
      roleId: user?.roleId,
      companyId: user?.companyId ?? undefined,
      accessCodeAttempt: accessCode,
      ipAddress: input.ipAddress,
      device: input.device,
      status: "FAILED",
      failureReason: "INVALID_CREDENTIALS"
    });

    throw new ServiceError(AUTH_INVALID_CREDENTIALS_MESSAGE, 401);
  }

  const isValid = await verifyPassword(input.password, user.passwordHash);

  if (!isValid) {
    await recordLoginActivity({
      userId: user.id,
      roleId: user.roleId,
      companyId: user.companyId ?? undefined,
      accessCodeAttempt: accessCode,
      ipAddress: input.ipAddress,
      device: input.device,
      status: "FAILED",
      failureReason: "INVALID_CREDENTIALS"
    });

    throw new ServiceError(AUTH_INVALID_CREDENTIALS_MESSAGE, 401);
  }

  await recordLoginActivity({
    userId: user.id,
    roleId: user.roleId,
    companyId: user.companyId ?? undefined,
    accessCodeAttempt: accessCode,
    ipAddress: input.ipAddress,
    device: input.device,
    status: "SUCCESS"
  });

  return {
    id: user.id,
    fullName: user.fullName,
    accessCode: user.accessCode!,
    tenantId: user.companyId,
    companyId: user.companyId,
    role: user.role.key
  };
}
