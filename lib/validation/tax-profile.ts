import { z } from "zod";

const optionalText = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().max(600).optional()
);

export const taxProfileSchema = z.object({
  rfc: optionalText,
  legalName: optionalText,
  personType: z.enum(["FISICA", "MORAL"]).optional(),
  fiscalRegime: optionalText,
  fiscalZipCode: optionalText,
  fiscalAddress: optionalText,
  fiscalEmail: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().email("Correo fiscal invalido.").optional()
  ),
  phone: optionalText,
  commercialName: optionalText
});

export type TaxProfileInput = z.infer<typeof taxProfileSchema>;

