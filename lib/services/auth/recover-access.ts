import { normalizeEmail, normalizeName } from "@/lib/normalization";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/services/service-error";
import { sendPlatformEmail } from "@/lib/email";

type RecoverAccessInput = {
  fullName: string;
  email: string;
  kind: "PASSWORD" | "CODE";
};

function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  let password = "";

  for (let index = 0; index < 14; index += 1) {
    password += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return password;
}

function buildRecoveryMessage(params: {
  kind: "PASSWORD" | "CODE";
  temporaryPassword?: string;
  accessCode?: string | null;
}) {
  const passwordLine =
    params.kind === "PASSWORD"
      ? `Tu contrasena temporal es: ${params.temporaryPassword}`
      : "Si no solicitaste este recordatorio, puedes ignorar este mensaje.";
  const accessCodeLine =
    params.kind === "CODE"
      ? `Tu codigo unico es: ${params.accessCode}`
      : params.accessCode
        ? `Tu codigo unico actual es: ${params.accessCode}`
        : "Tu codigo unico quedara disponible una vez completes tu registro.";

  return `Hola!

Hemos detectado que intentas ingresar a tu cuenta pero olvidaste tus datos de acceso.

${passwordLine}
${accessCodeLine}

No olvides guardar estos datos.

Gracias por ponerte en contacto con Orbit Nexus.`;
}

export async function recoverAccess(input: RecoverAccessInput) {
  const user = await prisma.user.findFirst({
    where: {
      normalizedFullName: normalizeName(input.fullName),
      email: normalizeEmail(input.email)
    },
    include: {
      role: true,
      company: true
    }
  });

  if (!user) {
    throw new ServiceError("No encontramos una cuenta que coincida con el nombre y correo proporcionados.", 404);
  }

  if (user.status !== "ACTIVE" || !user.accessCode) {
    throw new ServiceError("La cuenta aun no esta activa para recuperar acceso.", 409);
  }

  let temporaryPassword: string | undefined;

  if (input.kind === "PASSWORD") {
    temporaryPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(temporaryPassword);

    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        passwordHash
      }
    });
  }

  await sendPlatformEmail({
    to: user.email,
    subject:
      input.kind === "PASSWORD"
        ? "Orbit Nexus | Recuperacion de contrasena"
        : "Orbit Nexus | Recuperacion de codigo unico",
    text: buildRecoveryMessage({
      kind: input.kind,
      temporaryPassword,
      accessCode: user.accessCode
    })
  });

  return {
    fullName: user.fullName,
    email: user.email,
    companyName: user.company?.name ?? null,
    accessCode: input.kind === "CODE" ? user.accessCode : undefined
  };
}

