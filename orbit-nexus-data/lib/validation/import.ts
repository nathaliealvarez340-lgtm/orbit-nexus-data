import { z } from "zod";

export const authorizedDirectoryRowSchema = z.object({
  fullName: z.string().trim().min(3, "Cada fila debe incluir nombre completo."),
  email: z.string().trim().email("Cada fila debe incluir un correo valido.")
});

export const authorizedDirectoryDatasetSchema = z.object({
  companyId: z.string().trim().min(1, "El dataset debe incluir companyId."),
  role: z.enum(["LEADER", "CONSULTANT"]),
  rows: z
    .array(authorizedDirectoryRowSchema)
    .min(1, "Cada dataset debe incluir al menos una fila.")
});

export const importAuthorizedUsersSchema = z.object({
  datasets: z
    .array(authorizedDirectoryDatasetSchema)
    .min(1, "Debes enviar al menos un dataset para importar.")
});

