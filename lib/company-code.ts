const COMPANY_CODE_FALLBACK = "NX";

function sanitizeLetters(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^A-Za-z\s]/g, " ")
    .trim()
    .toUpperCase();
}

export function normalizeCompanyCodePrefix(value: string | null | undefined) {
  const sanitized = sanitizeLetters(value ?? "").replace(/\s+/g, "");

  if (sanitized.length >= 2) {
    return sanitized.slice(0, 2);
  }

  if (sanitized.length === 1) {
    return `${sanitized}${COMPANY_CODE_FALLBACK[1]}`;
  }

  return COMPANY_CODE_FALLBACK;
}

export function deriveCompanyCodePrefix(companyName: string) {
  const sanitized = sanitizeLetters(companyName);
  const words = sanitized.split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return normalizeCompanyCodePrefix(`${words[0][0]}${words[1][0]}`);
  }

  if (words.length === 1) {
    return normalizeCompanyCodePrefix(words[0].slice(0, 2));
  }

  return COMPANY_CODE_FALLBACK;
}

export function generateCompanyRegistrationCode(codePrefix: string) {
  const randomChunk = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${normalizeCompanyCodePrefix(codePrefix)}-LEAD-${randomChunk}`;
}

