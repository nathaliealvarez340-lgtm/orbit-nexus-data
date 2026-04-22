import { prisma } from "@/lib/prisma";
import { syncAuthorizedUsersFromDataset } from "@/lib/services/import/sync-authorized-users";
import type { AuthorizedDirectoryDataset } from "@/types/directory";

export async function importAuthorizedUsers(datasets: AuthorizedDirectoryDataset[]) {
  return prisma.$transaction(async (tx) => {
    const results = [];

    for (const dataset of datasets) {
      await tx.company.findUniqueOrThrow({
        where: {
          id: dataset.companyId
        },
        select: {
          id: true
        }
      });

      const summary = await syncAuthorizedUsersFromDataset(tx, dataset);

      results.push({
        companyId: dataset.companyId,
        role: dataset.role,
        ...summary
      });
    }

    return results;
  });
}
