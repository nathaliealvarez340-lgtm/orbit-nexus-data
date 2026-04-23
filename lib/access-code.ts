import type { Prisma, RoleKey } from "@prisma/client";

import { normalizeCompanyCodePrefix } from "@/lib/company-code";

type RoleWithGeneratedAccessCode = Extract<RoleKey, "LEADER" | "CONSULTANT" | "CLIENT">;
type AccessCodeClient = {
  user: Pick<Prisma.TransactionClient["user"], "findMany" | "findUnique">;
};

const ROLE_ACCESS_CODE_PREFIX: Record<RoleWithGeneratedAccessCode, string> = {
  LEADER: "L",
  CONSULTANT: "C",
  CLIENT: "U"
};

function buildAccessCodePrefix(role: RoleWithGeneratedAccessCode, companyCodePrefix: string) {
  return `${ROLE_ACCESS_CODE_PREFIX[role]}D${normalizeCompanyCodePrefix(companyCodePrefix)}`;
}

function parseSequence(accessCode: string, prefix: string) {
  const rawValue = accessCode.replace(`${prefix}-`, "");
  const parsed = Number(rawValue);

  return Number.isFinite(parsed) ? parsed : 0;
}

export async function generateUniqueAccessCode(
  tx: AccessCodeClient,
  role: RoleWithGeneratedAccessCode,
  companyCodePrefix: string
) {
  const prefix = buildAccessCodePrefix(role, companyCodePrefix);
  const usersWithPrefix = await tx.user.findMany({
    where: {
      accessCode: {
        startsWith: `${prefix}-`
      }
    },
    select: {
      accessCode: true
    }
  });

  let nextSequence =
    usersWithPrefix.reduce((maxValue, user) => {
      if (!user.accessCode) {
        return maxValue;
      }

      return Math.max(maxValue, parseSequence(user.accessCode, prefix));
    }, 0) + 1;

  while (true) {
    const candidate = `${prefix}-${String(nextSequence).padStart(3, "0")}`;
    const existing = await tx.user.findUnique({
      where: {
        accessCode: candidate
      },
      select: {
        id: true
      }
    });

    if (!existing) {
      return candidate;
    }

    nextSequence += 1;
  }
}

