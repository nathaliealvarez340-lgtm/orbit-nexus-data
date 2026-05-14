import { z } from "zod";

const optionalText = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().max(500).optional()
);

export const workspaceClientSchema = z.object({
  legalName: z.string().trim().min(2, "La razon social es obligatoria.").max(180),
  commercialName: optionalText,
  rfc: optionalText,
  personType: z.enum(["FISICA", "MORAL"]).optional(),
  fiscalRegime: optionalText,
  cfdiUse: optionalText,
  fiscalZipCode: optionalText,
  fiscalAddress: optionalText,
  email: z.string().trim().email("Correo principal invalido."),
  additionalEmails: z.array(z.string().trim().email()).default([]),
  phone: optionalText,
  primaryContact: optionalText,
  sector: optionalText,
  notes: optionalText
});

export type WorkspaceClientInput = z.infer<typeof workspaceClientSchema>;

