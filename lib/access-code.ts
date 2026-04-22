import type { Prisma, RoleKey } from "@prisma/client";

import { ACCESS_CODE_PREFIXES } from "@/lib/constants";

type RoleWithGeneratedAccessCode = Extract<RoleKey, "LEADER" | "CONSULTANT" | "CLIENT">;
type AccessCodeClient = {
  user: Pick<Prisma.TransactionClient["user"], "findMany" | "findUnique">;
};

function parseSequence(accessCode: string, prefix: string) {
  const rawValue = accessCode.replace(`${prefix}-`, "");
  const parsed = Number(rawValue);

  return Number.isFinite(parsed) ? parsed : 0;
}

export async function generateUniqueAccessCode(
  tx: AccessCodeClient,
  role: RoleWithGeneratedAccessCode
) {
  const prefix = ACCESS_CODE_PREFIXES[role];
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
