import type { Prisma } from "@prisma/client";

type ProjectFolioClient = {
  project: Pick<Prisma.TransactionClient["project"], "findMany" | "findUnique">;
};

function parseProjectSequence(folio: string, prefix: string) {
  const rawValue = folio.replace(`${prefix}-`, "");
  const parsed = Number(rawValue);

  return Number.isFinite(parsed) ? parsed : 0;
}

export async function generateUniqueProjectFolio(
  tx: ProjectFolioClient,
  year = new Date().getUTCFullYear()
) {
  const prefix = `PRJ-${year}`;
  const projectsWithPrefix = await tx.project.findMany({
    where: {
      folio: {
        startsWith: `${prefix}-`
      }
    },
    select: {
      folio: true
    }
  });

  let nextSequence =
    projectsWithPrefix.reduce((maxValue, project) => {
      return Math.max(maxValue, parseProjectSequence(project.folio, prefix));
    }, 0) + 1;

  while (true) {
    const candidate = `${prefix}-${String(nextSequence).padStart(4, "0")}`;
    const existing = await tx.project.findUnique({
      where: {
        folio: candidate
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

