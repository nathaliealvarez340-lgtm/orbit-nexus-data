import type { Prisma } from "@prisma/client";

import { normalizeEmail, normalizeName } from "@/lib/normalization";
import type { AuthorizedDirectoryDataset } from "@/types/directory";

type SyncSummary = {
  created: number;
  updated: number;
  skipped: number;
};

export async function syncAuthorizedUsersFromDataset(
  tx: Prisma.TransactionClient,
  dataset: AuthorizedDirectoryDataset
) {
  const role = await tx.role.findUniqueOrThrow({
    where: {
      key: dataset.role
    }
  });

  const summary: SyncSummary = {
    created: 0,
    updated: 0,
    skipped: 0
  };

  const seen = new Set<string>();

  for (const row of dataset.rows) {
    const email = normalizeEmail(row.email);
    const normalizedFullName = normalizeName(row.fullName);
    const dedupeKey = `${dataset.companyId}:${dataset.role}:${email}:${normalizedFullName}`;

    if (!email || !normalizedFullName || seen.has(dedupeKey)) {
      summary.skipped += 1;
      continue;
    }

    seen.add(dedupeKey);

    const existingUser = await tx.user.findFirst({
      where: {
        companyId: dataset.companyId,
        roleId: role.id,
        email
      }
    });

    if (!existingUser) {
      await tx.user.create({
        data: {
          companyId: dataset.companyId,
          roleId: role.id,
          fullName: row.fullName.trim(),
          normalizedFullName,
          email,
          status: "PENDING_REGISTRATION",
          importedFromDirectory: true,
          directorySyncedAt: new Date()
        }
      });

      summary.created += 1;
      continue;
    }

    await tx.user.update({
      where: {
        id: existingUser.id
      },
      data: {
        fullName: row.fullName.trim(),
        normalizedFullName,
        importedFromDirectory: true,
        directorySyncedAt: new Date()
      }
    });

    summary.updated += 1;
  }

  return summary;
}

