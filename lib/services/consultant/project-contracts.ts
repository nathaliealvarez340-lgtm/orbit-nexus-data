import { AssignmentStatus, NotificationType, RoleKey, UserStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/services/service-error";

type SignProjectContractInput = {
  companyId: string | null;
  consultantUserId: string;
  consultantName: string;
  projectExternalId: string;
  projectSlug: string;
  projectName: string;
  companyName?: string;
  leaderName?: string;
};

export type ContractAcceptanceSummary = {
  id: string;
  projectSlug: string;
  projectName: string;
  signedAt: string;
  status: "CONTRACT_SIGNED";
};

function buildContractBody(input: {
  companyName: string;
  consultantName: string;
  projectName: string;
  projectExternalId: string;
  signedAt: Date;
}) {
  const signedAtLabel = input.signedAt.toLocaleString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  return [
    "Contrato interno de participacion profesional",
    "",
    `La empresa ${input.companyName} asigna al consultor ${input.consultantName} al proyecto "${input.projectName}".`,
    `Identificador del proyecto: ${input.projectExternalId}.`,
    `Fecha de aceptacion: ${signedAtLabel}.`,
    "",
    "El consultor acepta participar en el proyecto asignado, cumplir con entregables, tiempos, confidencialidad, lineamientos internos, condiciones operativas y buenas practicas profesionales establecidas por la empresa contratante.",
    "",
    "La firma digital interna mediante el boton correspondiente deja constancia de aceptacion de terminos, condiciones y compromiso operativo dentro de ORBIT NEXUS."
  ].join("\n");
}

export async function signProjectContract(input: SignProjectContractInput) {
  if (!input.companyId) {
    throw new ServiceError("No encontramos la empresa asociada a esta sesion.", 403);
  }

  const existing = await prisma.contractAcceptance.findFirst({
    where: {
      companyId: input.companyId,
      projectSlug: input.projectSlug,
      consultantUserId: input.consultantUserId
    },
    select: {
      id: true,
      projectSlug: true,
      projectName: true,
      signedAt: true,
      status: true
    }
  });

  if (existing) {
    return {
      id: existing.id,
      projectSlug: existing.projectSlug,
      projectName: existing.projectName,
      signedAt: existing.signedAt.toISOString(),
      status: existing.status
    } satisfies ContractAcceptanceSummary;
  }

  const company = await prisma.company.findUnique({
    where: {
      id: input.companyId
    },
    select: {
      id: true,
      name: true
    }
  });

  const project = await prisma.project.findFirst({
    where: {
      id: input.projectExternalId,
      companyId: input.companyId
    },
    select: {
      id: true,
      leaderId: true,
      name: true
    }
  });

  const assignment = project
    ? await prisma.projectAssignment.findFirst({
        where: {
          companyId: input.companyId,
          projectId: project.id,
          consultantId: input.consultantUserId
        },
        select: {
          id: true
        }
      })
    : null;

  const signedAt = new Date();
  const resolvedCompanyName = company?.name ?? input.companyName ?? "la empresa contratante";
  const resolvedProjectName = project?.name ?? input.projectName;
  const resolvedLeaderName = input.leaderName ?? null;
  const contractBody = buildContractBody({
    companyName: resolvedCompanyName,
    consultantName: input.consultantName,
    projectName: resolvedProjectName,
    projectExternalId: input.projectExternalId,
    signedAt
  });

  const acceptance = await prisma.$transaction(async (tx) => {
    const createdAcceptance = await tx.contractAcceptance.create({
      data: {
        companyId: input.companyId,
        projectId: project?.id ?? null,
        projectExternalId: input.projectExternalId,
        projectSlug: input.projectSlug,
        projectName: resolvedProjectName,
        assignmentId: assignment?.id ?? null,
        consultantUserId: input.consultantUserId,
        consultantName: input.consultantName,
        leaderUserId: project?.leaderId ?? null,
        leaderName: resolvedLeaderName,
        companyName: resolvedCompanyName,
        contractTitle: "Contrato interno de participacion profesional",
        contractBody,
        signedAt
      }
    });

    if (project?.id && assignment?.id) {
      await tx.projectAssignment.updateMany({
        where: {
          companyId: input.companyId,
          projectId: project.id,
          consultantId: input.consultantUserId
        },
        data: {
          status: AssignmentStatus.ACCEPTED,
          acceptedAt: signedAt
        }
      });
    }

    const leaders = await tx.user.findMany({
      where: {
        companyId: input.companyId,
        role: {
          key: RoleKey.LEADER
        },
        status: UserStatus.ACTIVE
      },
      select: {
        id: true
      }
    });

    if (leaders.length) {
      await tx.notification.createMany({
        data: leaders.map((leader) => ({
          companyId: input.companyId!,
          userId: leader.id,
          projectId: project?.id ?? null,
          type: NotificationType.PROJECT,
          title: "Contrato firmado por consultor",
          message: `${input.consultantName} acepto el proyecto ${resolvedProjectName} y firmo terminos, condiciones y contrato interno.`
        }))
      });
    }

    return createdAcceptance;
  });

  return {
    id: acceptance.id,
    projectSlug: acceptance.projectSlug,
    projectName: acceptance.projectName,
    signedAt: acceptance.signedAt.toISOString(),
    status: acceptance.status
  } satisfies ContractAcceptanceSummary;
}
