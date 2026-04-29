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
  organizationAccessType: z.enum(["COMPANY", "OWN_BUSINESS"]),
  authorizedEmailDomain: z.string().trim().optional(),
  ownerContactEmail: z.string().trim().email("Ingresa un correo valido.").optional(),
  includedUsers: z.number().int().min(0).optional(),
  extraUsers: z.number().int().min(0).max(CORE_MAX_EXTRA_USERS).default(0),
  monthlyAmount: z.number().int().min(0).optional(),
  totalUsers: z.number().int().min(0).optional()
}).superRefine((value, ctx) => {
  if (value.organizationAccessType === "COMPANY" && !value.authorizedEmailDomain) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["authorizedEmailDomain"],
      message: "Ingresa un dominio corporativo valido."
    });
  }

  if (value.organizationAccessType === "OWN_BUSINESS" && !value.ownerContactEmail) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["ownerContactEmail"],
      message: "Ingresa el correo principal del acceso."
    });
  }
});
