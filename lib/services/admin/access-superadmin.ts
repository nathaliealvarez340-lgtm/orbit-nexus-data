import { normalizeEmail, normalizeName } from "@/lib/normalization";
import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/services/service-error";
import { getSuperadminMasterCode, getSuperadminSeed } from "@/lib/config";

type AccessSuperadminInput = {
  fullName: string;
  email: string;
  masterCode: string;
};

export async function accessSuperadmin(input: AccessSuperadminInput) {
  const seed = getSuperadminSeed();
  const expectedName = normalizeName(seed.name);
  const expectedEmail = normalizeEmail(seed.email);
  const incomingName = normalizeName(input.fullName);
  const incomingEmail = normalizeEmail(input.email);
  const masterCode = input.masterCode.trim();

  if (
    incomingName !== expectedName ||
    incomingEmail !== expectedEmail ||
    masterCode !== getSuperadminMasterCode()
  ) {
    throw new ServiceError("Los datos de administracion no son validos.", 401);
  }

  const role = await prisma.role.findUniqueOrThrow({
    where: {
      key: "SUPERADMIN"
    }
  });

  const user = await prisma.user.upsert({
    where: {
      accessCode: seed.accessCode
    },
    update: {
      roleId: role.id,
      fullName: seed.name,
      normalizedFullName: expectedName,
      email: expectedEmail,
      phone: seed.phone,
      status: "ACTIVE",
      registeredAt: new Date(),
      disabledAt: null
    },
    create: {
      roleId: role.id,
      fullName: seed.name,
      normalizedFullName: expectedName,
      email: expectedEmail,
      phone: seed.phone,
      accessCode: seed.accessCode,
      status: "ACTIVE",
      registeredAt: new Date()
    },
    include: {
      role: true
    }
  });

  return {
    id: user.id,
    fullName: user.fullName,
    accessCode: user.accessCode ?? seed.accessCode,
    tenantId: null,
    companyId: null,
    role: user.role.key
  } as const;
}

