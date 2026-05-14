import { z } from "zod";

import { getPasswordValidationMessages } from "@/lib/password-policy";
import type { RegistrableRoleKey } from "@/types/auth";

export function normalizeRegistrableRoleInput(value: string): RegistrableRoleKey | null {
  const normalized = value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toUpperCase();

  const roleMap: Record<string, RegistrableRoleKey> = {
    LEADER: "LEADER",
    LIDER: "LEADER",
    CONSULTANT: "CONSULTANT",
    CONSULTOR: "CONSULTANT",
    CLIENT: "CLIENT",
    CLIENTE: "CLIENT"
  };

  return roleMap[normalized] ?? null;
}

function appendPasswordIssues(password: string, ctx: z.RefinementCtx, path: (string | number)[]) {
  for (const message of getPasswordValidationMessages(password)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path,
      message
    });
  }
}

export const loginPayloadSchema = z.object({
  accessCode: z.string().trim().min(1, "El codigo unico es obligatorio."),
  password: z.string().min(1, "La contrasena es obligatoria.")
});

export const registerPayloadSchema = z
  .object({
    companyName: z.string().trim().min(2, "Ingresa el nombre de la empresa."),
    fullName: z.string().trim().min(3, "Ingresa el nombre completo del owner."),
    email: z.string().trim().min(1, "Ingresa el correo empresarial.").email("Ingresa un correo valido."),
    phone: z.string().trim().optional(),
    password: z.string().min(1, "Ingresa una contrasena."),
    confirmPassword: z.string().min(1, "Confirma la contrasena.")
  })
  .superRefine((value, ctx) => {
    appendPasswordIssues(value.password, ctx, ["password"]);

    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "La confirmacion de contrasena no coincide."
      });
    }
  })
  .transform((value) => ({
    companyName: value.companyName,
    fullName: value.fullName,
    email: value.email,
    phone: value.phone,
    password: value.password
  }));

export const resetPasswordPayloadSchema = z
  .object({
    accessCode: z.string().trim().min(1, "El codigo unico es obligatorio."),
    email: z.string().trim().min(1, "El correo es obligatorio.").email("Ingresa un correo valido."),
    newPassword: z.string().min(1, "La nueva contrasena es obligatoria."),
    confirmPassword: z.string().min(1, "Confirma la nueva contrasena.")
  })
  .superRefine((value, ctx) => {
    appendPasswordIssues(value.newPassword, ctx, ["newPassword"]);

    if (value.newPassword !== value.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "La confirmacion de contrasena no coincide."
      });
    }
  });

export const registerServiceSchema = z
  .object({
    companyName: z.string().trim().min(2, "Ingresa el nombre de la empresa."),
    fullName: z.string().trim().min(3, "Ingresa tu nombre completo."),
    email: z.string().trim().email("Ingresa un correo valido."),
    phone: z.string().trim().optional(),
    password: z.string().min(1, "La contrasena es obligatoria.")
  })
  .superRefine((value, ctx) => {
    appendPasswordIssues(value.password, ctx, ["password"]);
  });

export const adminAccessPayloadSchema = z.object({
  fullName: z.string().trim().min(3, "Ingresa tu nombre completo."),
  email: z.string().trim().email("Ingresa un correo valido."),
  masterCode: z.string().trim().min(1, "El codigo maestro es obligatorio.")
});

export const recoverAccessPayloadSchema = z.object({
  fullName: z.string().trim().min(3, "Ingresa tu nombre completo."),
  email: z.string().trim().email("Ingresa un correo valido."),
  kind: z.enum(["PASSWORD", "CODE"])
});

export const createCompanyPayloadSchema = z.object({
  name: z.string().trim().min(2, "El nombre de la empresa es obligatorio."),
  slug: z.string().trim().optional(),
  codePrefix: z.string().trim().optional(),
  registrationCode: z.string().trim().optional(),
  sector: z.string().trim().optional(),
  contactName: z.string().trim().optional(),
  contactEmail: z.string().trim().email("Ingresa un correo valido.").optional().or(z.literal("")),
  subscriptionPlan: z.enum(["CORE", "GROWTH", "ENTERPRISE"]).optional(),
  includedUsers: z.number().int().min(0).optional(),
  extraUsers: z.number().int().min(0).max(10).optional(),
  monthlyAmountMxn: z.number().int().min(0).optional(),
  initialStatus: z.enum(["ACTIVE", "PENDING"]).optional()
});

export const createConsultantAuthorizationSchema = z.object({
  fullName: z.string().trim().min(3, "Ingresa el nombre completo del consultor."),
  email: z.string().trim().email("Ingresa un correo valido."),
  phone: z.string().trim().optional(),
  specializationSummary: z.string().trim().optional()
});

export const createProjectPayloadSchema = z.object({
  name: z.string().trim().min(3, "Ingresa el nombre del proyecto."),
  description: z.string().trim().min(10, "Describe brevemente el proyecto."),
  clientName: z.string().trim().min(3, "Ingresa el nombre del cliente."),
  clientEmail: z.string().trim().email("Ingresa un correo valido del cliente."),
  clientCompany: z.string().trim().optional(),
  clientPhone: z.string().trim().optional(),
  clientSector: z.string().trim().optional(),
  clientNotes: z.string().trim().optional(),
  startDate: z.string().trim().min(1, "La fecha inicial es obligatoria."),
  endDate: z.string().trim().min(1, "La fecha final es obligatoria."),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
});
