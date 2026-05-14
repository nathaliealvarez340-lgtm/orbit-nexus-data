import { InvoiceStatus } from "@prisma/client";
import { z } from "zod";

const fiscalText = z.string().trim().min(2).max(180);

export const invoiceFiscalDataSchema = z.object({
  rfc: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^([A-ZÑ&]{3,4})(\d{6})([A-Z\d]{3})$/, "Ingresa un RFC valido."),
  legalName: fiscalText,
  cfdiUse: fiscalText,
  fiscalRegime: fiscalText,
  fiscalAddress: z.string().trim().min(8).max(300),
  paymentMethod: fiscalText,
  paymentForm: fiscalText,
  currency: z.string().trim().toUpperCase().default("MXN")
});

export const invoiceCreateFromQuoteSchema = z.object({
  quoteId: z.string().trim().min(1),
  fiscalData: invoiceFiscalDataSchema
});

export const invoiceStatusUpdateSchema = z.object({
  status: z.nativeEnum(InvoiceStatus),
  failureReason: z.string().trim().max(300).optional()
});
