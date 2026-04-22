export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_REQUIREMENTS = [
  {
    id: "length",
    label: `Minimo ${PASSWORD_MIN_LENGTH} caracteres`,
    validator: (password: string) => password.length >= PASSWORD_MIN_LENGTH,
    message: `La contrasena debe tener minimo ${PASSWORD_MIN_LENGTH} caracteres.`
  },
  {
    id: "uppercase",
    label: "Al menos una letra mayuscula",
    validator: (password: string) => /[A-Z]/.test(password),
    message: "La contrasena debe incluir al menos una letra mayuscula."
  },
  {
    id: "lowercase",
    label: "Al menos una letra minuscula",
    validator: (password: string) => /[a-z]/.test(password),
    message: "La contrasena debe incluir al menos una letra minuscula."
  },
  {
    id: "number",
    label: "Al menos un numero",
    validator: (password: string) => /\d/.test(password),
    message: "La contrasena debe incluir al menos un numero."
  }
] as const;

export type PasswordRequirementCheck = {
  id: (typeof PASSWORD_REQUIREMENTS)[number]["id"];
  label: string;
  message: string;
  passed: boolean;
};

export function getPasswordRequirementChecks(password: string): PasswordRequirementCheck[] {
  return PASSWORD_REQUIREMENTS.map((requirement) => ({
    id: requirement.id,
    label: requirement.label,
    message: requirement.message,
    passed: requirement.validator(password)
  }));
}

export function getPasswordValidationMessages(password: string) {
  return getPasswordRequirementChecks(password)
    .filter((requirement) => !requirement.passed)
    .map((requirement) => requirement.message);
}

export function getPasswordValidationMessage(password: string) {
  return getPasswordValidationMessages(password)[0] ?? null;
}

export function isPasswordValid(password: string) {
  return getPasswordRequirementChecks(password).every((requirement) => requirement.passed);
}
