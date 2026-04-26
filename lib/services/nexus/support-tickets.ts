import {
  SupportTicketPriority,
  SupportTicketSource,
  SupportTicketStatus,
  type RoleKey
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type SupportTicketSummary = {
  id: string;
  companyId: string | null;
  source: SupportTicketSource;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  userId: string | null;
  userRole: RoleKey;
  userName: string;
  title: string;
  message: string;
  contextLabel: string;
  routePath: string;
  assistantReply: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  companyName: string | null;
  createdAt: string;
  updatedAt: string;
};

type CreateSupportTicketInput = {
  companyId: string | null;
  userId: string | null;
  userRole: RoleKey;
  userName: string;
  title: string;
  message: string;
  contextLabel: string;
  routePath: string;
  assistantReply?: string;
  priority?: SupportTicketPriority;
  source?: SupportTicketSource;
};

function mapSupportTicket(record: {
  id: string;
  companyId: string | null;
  source: SupportTicketSource;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  userId: string | null;
  userRole: RoleKey;
  userName: string;
  title: string;
  message: string;
  contextLabel: string;
  routePath: string;
  assistantReply: string | null;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  company?: {
    name: string;
  } | null;
}) {
  return {
    id: record.id,
    companyId: record.companyId,
    source: record.source,
    status: record.status,
    priority: record.priority,
    userId: record.userId,
    userRole: record.userRole,
    userName: record.userName,
    title: record.title,
    message: record.message,
    contextLabel: record.contextLabel,
    routePath: record.routePath,
    assistantReply: record.assistantReply,
    resolvedAt: record.resolvedAt?.toISOString() ?? null,
    resolvedBy: record.resolvedBy,
    companyName: record.company?.name ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  } satisfies SupportTicketSummary;
}

export async function createSupportTicket(input: CreateSupportTicketInput) {
  const ticket = await prisma.supportTicket.create({
    data: {
      companyId: input.companyId,
      userId: input.userId,
      userRole: input.userRole,
      userName: input.userName,
      title: input.title.trim(),
      message: input.message.trim(),
      contextLabel: input.contextLabel.trim(),
      routePath: input.routePath.trim(),
      assistantReply: input.assistantReply?.trim() || null,
      priority: input.priority ?? SupportTicketPriority.MEDIUM,
      source: input.source ?? SupportTicketSource.NEXUS_CHAT
    },
    include: {
      company: {
        select: {
          name: true
        }
      }
    }
  });

  return mapSupportTicket(ticket);
}

export async function getSupportTicketList(limit = 20) {
  const tickets = await prisma.supportTicket.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: limit,
    include: {
      company: {
        select: {
          name: true
        }
      }
    }
  });

  return tickets.map(mapSupportTicket);
}

export async function updateSupportTicketStatus(input: {
  ticketId: string;
  status: SupportTicketStatus;
  resolvedBy: string;
}) {
  const ticket = await prisma.supportTicket.update({
    where: {
      id: input.ticketId
    },
    data: {
      status: input.status,
      resolvedBy: input.status === SupportTicketStatus.RESOLVED ? input.resolvedBy : null,
      resolvedAt:
        input.status === SupportTicketStatus.RESOLVED
          ? new Date()
          : null
    },
    include: {
      company: {
        select: {
          name: true
        }
      }
    }
  });

  return mapSupportTicket(ticket);
}
