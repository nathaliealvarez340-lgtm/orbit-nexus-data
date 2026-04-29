import { ProjectPriority } from "@prisma/client";

import { TENANT_ACCESS_DENIED_MESSAGE } from "@/lib/constants";
import { generateUniqueProjectFolio } from "@/lib/project-folio";
import { normalizeEmail } from "@/lib/normalization";
import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/services/service-error";

type CreateLeaderProjectInput = {
  leaderId: string;
  companyId: string | null;
  name: string;
  description: string;
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  clientPhone?: string;
  clientSector?: string;
  clientNotes?: string;
  startDate: string;
  endDate: string;
  priority: ProjectPriority;
};

function buildDurationLabel(startDate: Date, endDate: Date) {
  const diffInMs = Math.max(endDate.getTime() - startDate.getTime(), 0);
  const diffInDays = Math.max(1, Math.ceil(diffInMs / (1000 * 60 * 60 * 24)));
  const diffInWeeks = Math.max(1, Math.ceil(diffInDays / 7));

  return `${diffInWeeks} semanas`;
}

export async function createLeaderProject(input: CreateLeaderProjectInput) {
  if (!input.companyId) {
    throw new ServiceError(TENANT_ACCESS_DENIED_MESSAGE, 403);
  }

  const startDate = new Date(`${input.startDate}T00:00:00.000Z`);
  const endDate = new Date(`${input.endDate}T00:00:00.000Z`);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new ServiceError("Las fechas del proyecto no son validas.", 400);
  }

  if (endDate < startDate) {
    throw new ServiceError("La fecha final no puede ser anterior a la fecha inicial.", 400);
  }

  const folio = await generateUniqueProjectFolio(prisma, startDate.getUTCFullYear());

  return prisma.project.create({
    data: {
      companyId: input.companyId,
      leaderId: input.leaderId,
      name: input.name.trim(),
      description: input.description.trim(),
      clientContactName: input.clientName.trim(),
      clientContactEmail: normalizeEmail(input.clientEmail),
      requirements: {
        clientProfile: {
          company: input.clientCompany?.trim() || null,
          email: normalizeEmail(input.clientEmail),
          phone: input.clientPhone?.trim() || null,
          sector: input.clientSector?.trim() || null,
          notes: input.clientNotes?.trim() || null
        }
      },
      durationLabel: buildDurationLabel(startDate, endDate),
      startDate,
      endDate,
      priority: input.priority,
      folio,
      status: "READY_FOR_MATCHING"
    },
    select: {
      id: true,
      folio: true,
      name: true,
      description: true,
      clientContactName: true,
      clientContactEmail: true,
      requirements: true,
      startDate: true,
      endDate: true,
      priority: true,
      status: true
    }
  });
}
