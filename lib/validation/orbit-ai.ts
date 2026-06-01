import { z } from "zod";

const textField = (message: string) =>
  z.preprocess(
    (value) => (typeof value === "string" ? value : ""),
    z.string().trim().min(1, message)
  );

export const orbitAiChatSchema = z.object({
  conversationId: z.preprocess(
    (value) => (typeof value === "string" && value.trim() ? value : undefined),
    z.string().trim().min(1).optional()
  ),
  question: textField("Escribe una consulta valida para MAIA Executive Agent."),
  inputMode: z.enum(["text", "voice"]).default("text"),
  routePath: z.preprocess(
    (value) => (typeof value === "string" && value.trim() ? value : undefined),
    z.string().trim().min(1).optional()
  ),
  contextLabel: z.preprocess(
    (value) => (typeof value === "string" && value.trim() ? value : undefined),
    z.string().trim().min(1).optional()
  )
});
