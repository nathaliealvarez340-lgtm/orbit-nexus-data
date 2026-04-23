import { z } from "zod";

import { getPasswordValidationMessages } from "@/lib/password-policy";
import { REGISTRABLE_ROLE_KEYS, type RegistrableRoleKey } from "@/types/auth";

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
    fullName: z.string().trim().min(1, "fullName es obligatorio."),
    email: z.string().trim().min(1, "email es obligatorio.").email("email no es valido."),
    phone: z.string().trim().min(1, "phone es obligatorio."),
    password: z.string().min(1, "password es obligatorio."),
    role: z.string().trim().min(1, "role es obligatorio."),
    projectFolio: z.string().trim().optional(),
    companyRegistrationCode: z.string().trim().optional()
  })
  .superRefine((value, ctx) => {
    appendPasswordIssues(value.password, ctx, ["password"]);

    const role = normalizeRegistrableRoleInput(value.role);

    if (!role) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["role"],
        message: "role debe ser Lider, Consultor o Cliente."
      });
    }

    if (role === "CLIENT" && !value.projectFolio) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["projectFolio"],
        message: "projectFolio es obligatorio para Cliente."
      });
    }

    if (role === "LEADER" && !value.companyRegistrationCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["companyRegistrationCode"],
        message: "companyRegistrationCode es obligatorio para Lider."
      });
    }
  })
  .transform((value) => ({
    fullName: value.fullName,
    email: value.email,
    phone: value.phone,
    password: value.password,
    role: normalizeRegistrableRoleInput(value.role)!,
    projectFolio: value.projectFolio,
    companyRegistrationCode: value.companyRegistrationCode
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
    fullName: z.string().trim().min(3, "Ingresa tu nombre completo."),
    email: z.string().trim().email("Ingresa un correo valido."),
    phone: z.string().trim().min(8, "Ingresa un celular valido."),
    password: z.string().min(1, "La contrasena es obligatoria."),
    role: z.enum(REGISTRABLE_ROLE_KEYS),
    projectFolio: z.string().trim().optional(),
    companyRegistrationCode: z.string().trim().optional()
  })
  .superRefine((value, ctx) => {
    appendPasswordIssues(value.password, ctx, ["password"]);

    if (value.role === "CLIENT" && !value.projectFolio) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["projectFolio"],
        message: "El folio unico del proyecto es obligatorio para clientes."
      });
    }

    if (value.role === "LEADER" && !value.companyRegistrationCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["companyRegistrationCode"],
        message: "El codigo maestro de empresa es obligatorio para lideres."
      });
    }
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
  startDate: z.string().trim().min(1, "La fecha inicial es obligatoria."),
  endDate: z.string().trim().min(1, "La fecha final es obligatoria."),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
});
