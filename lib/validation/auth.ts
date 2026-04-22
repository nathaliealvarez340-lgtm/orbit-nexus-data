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

export const loginSchema = z.object({
  accessCode: z.string().trim().min(1, "El código único es obligatorio."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres.")
});

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(3, "Ingresa tu nombre completo."),
    email: z.string().trim().email("Ingresa un correo válido."),
    phone: z.string().trim().min(8, "Ingresa un celular válido."),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
    role: z.enum(REGISTRABLE_ROLE_KEYS),
    projectFolio: z.string().trim().optional()
  })
  .superRefine((value, ctx) => {
    if (value.role === "CLIENT" && !value.projectFolio) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["projectFolio"],
        message: "El folio único del proyecto es obligatorio para clientes."
      });
    }
  });
