import { z } from "zod";

import { CORE_MAX_EXTRA_USERS } from "@/lib/commercial/plans";

export const companyActivationPayloadSchema = z.object({
  fullName: z.string().trim().min(3, "Ingresa el nombre completo del contacto."),
  email: z.string().trim().email("Ingresa un correo valido."),
  companyName: z.string().trim().min(2, "Ingresa el nombre de la empresa."),
  sector: z.string().trim().min(2, "Ingresa el sector principal de la empresa."),
  plan: z.enum(["CORE", "GROWTH", "ENTERPRISE"]),
  extraUsers: z.number().int().min(0).max(CORE_MAX_EXTRA_USERS).default(0)
});
