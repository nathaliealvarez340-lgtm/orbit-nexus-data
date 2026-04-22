import { normalizeAccessCode, normalizeEmail } from "@/lib/normalization";
import { getPasswordValidationMessage } from "@/lib/password-policy";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/services/service-error";

const RESET_PASSWORD_MISMATCH_MESSAGE =
  "El codigo unico y el correo no coinciden con un usuario registrado.";

type ResetPasswordInput = {
  accessCode: string;
  email: string;
  newPassword: string;
};

export async function resetPassword(input: ResetPasswordInput) {
  const passwordValidationMessage = getPasswordValidationMessage(input.newPassword);

  if (passwordValidationMessage) {
    throw new ServiceError(passwordValidationMessage, 400);
  }

  const user = await prisma.user.findFirst({
    where: {
      accessCode: normalizeAccessCode(input.accessCode),
      email: normalizeEmail(input.email),
      status: "ACTIVE"
    },
    select: {
      id: true,
      fullName: true
    }
  });

  if (!user) {
    throw new ServiceError(RESET_PASSWORD_MISMATCH_MESSAGE, 400);
  }

  const passwordHash = await hashPassword(input.newPassword);

  await prisma.user.update({
    where: {
      id: user.id
    },
    data: {
      passwordHash
    }
  });

  return {
    success: true,
    fullName: user.fullName
  };
}
