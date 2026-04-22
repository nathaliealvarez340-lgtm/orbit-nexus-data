export const PHONE_COUNTRY_OPTIONS = [
  { value: "+52", label: "+52 Mexico" },
  { value: "+1", label: "+1 USA/Canada" },
  { value: "+34", label: "+34 Espana" },
  { value: "+57", label: "+57 Colombia" },
  { value: "+54", label: "+54 Argentina" },
  { value: "+51", label: "+51 Peru" },
  { value: "+56", label: "+56 Chile" }
] as const;

export function normalizePhoneCountryCode(value: string) {
  const digits = value.replace(/\D/g, "");

  return digits ? `+${digits}` : "";
}

export function normalizePhoneLocalNumber(value: string) {
  return value.replace(/\D/g, "");
}

export function buildInternationalPhone(countryCode: string, localNumber: string) {
  const normalizedCountryCode = normalizePhoneCountryCode(countryCode);
  const normalizedLocalNumber = normalizePhoneLocalNumber(localNumber);

  if (!normalizedCountryCode || !normalizedLocalNumber) {
    return "";
  }

  return `${normalizedCountryCode}${normalizedLocalNumber}`;
}

export function isPhoneNumberComplete(countryCode: string, localNumber: string) {
  return buildInternationalPhone(countryCode, localNumber).length >= 8;
}

export function normalizeInternationalPhone(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  const digits = trimmed.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  return trimmed.startsWith("+") ? `+${digits}` : digits;
}
