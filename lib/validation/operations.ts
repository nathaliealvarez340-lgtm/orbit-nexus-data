import { RoleKey, SupportTicketPriority, SupportTicketSource, SupportTicketStatus } from "@prisma/client";
import { z } from "zod";

export const supportTicketCreateSchema = z.object({
  title: z.string().trim().min(4, "Escribe un titulo breve para el reporte."),
  message: z.string().trim().min(8, "Describe con un poco mas de detalle lo que esta ocurriendo."),
  contextLabel: z.string().trim().min(2, "Indica el contexto del reporte."),
  routePath: z.string().trim().min(1, "No encontramos la ruta del contexto actual."),
  assistantReply: z.string().trim().optional(),
  priority: z.nativeEnum(SupportTicketPriority).optional(),
  source: z.nativeEnum(SupportTicketSource).optional()
});

export const supportTicketStatusUpdateSchema = z.object({
  status: z.nativeEnum(SupportTicketStatus)
});

export const pricingSettingsSchema = z.object({
  coreMonthlyMxn: z.number().int().min(1),
  growthMonthlyMxn: z.number().int().min(1),
  extraUserMonthlyMxn: z.number().int().min(0),
  enterpriseStartingUsd: z.number().int().min(1)
});

export const contractAcceptanceSchema = z.object({
  projectExternalId: z.string().trim().min(1),
  projectSlug: z.string().trim().min(1),
  projectName: z.string().trim().min(2),
  companyName: z.string().trim().optional(),
  leaderName: z.string().trim().optional()
});

export const nexusRoleSchema = z.nativeEnum(RoleKey);
