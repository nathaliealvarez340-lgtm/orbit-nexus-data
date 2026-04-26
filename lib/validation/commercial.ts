import { z } from "zod";

import { CORE_MAX_EXTRA_USERS } from "@/lib/commercial/plans";

export const companyActivationPayloadSchema = z.object({
  fullName: z.string().trim().min(3, "Ingresa el nombre completo del contacto."),
  contactName: z.string().trim().optional(),
  email: z.string().trim().email("Ingresa un correo valido."),
  contactEmail: z.string().trim().email("Ingresa un correo valido.").optional(),
  companyName: z.string().trim().min(2, "Ingresa el nombre de la empresa."),
  sector: z.string().trim().min(2, "Selecciona el sector de tu empresa."),
  plan: z.enum(["CORE", "GROWTH", "ENTERPRISE"]),
  includedUsers: z.number().int().min(0).optional(),
  extraUsers: z.number().int().min(0).max(CORE_MAX_EXTRA_USERS).default(0),
  monthlyAmount: z.number().int().min(0).optional(),
  totalUsers: z.number().int().min(0).optional()
});
