import { normalizeInternationalPhone } from "@/lib/phone";

export function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeAccessCode(value: string) {
  return value.trim().toUpperCase();
}

export function normalizeOptionalPhone(value?: string | null) {
  if (!value) {
    return null;
  }

  const normalizedPhone = normalizeInternationalPhone(value);

  return normalizedPhone || null;
}
