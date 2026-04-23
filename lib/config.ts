function readEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getJwtSecret() {
  return readEnv("JWT_SECRET");
}

export function getAppUrl() {
  return process.env.APP_URL ?? "http://localhost:3000";
}

export function getDefaultCompanySeed() {
  return {
    name: process.env.DEFAULT_COMPANY_NAME ?? "NTT DATA",
    slug: process.env.DEFAULT_COMPANY_SLUG ?? "orbit-nexus-base",
    codePrefix: process.env.DEFAULT_COMPANY_CODE_PREFIX ?? "NT",
    registrationCode:
      process.env.DEFAULT_COMPANY_REGISTRATION_CODE ?? "NTT-LEADER-2026"
  };
}

export function getSuperadminSeed() {
  return {
    name: process.env.SUPERADMIN_NAME ?? "Nathalie Garcia Alvarez",
    email: process.env.SUPERADMIN_EMAIL ?? "nathaliealvarez340@gmail.com",
    phone: process.env.SUPERADMIN_PHONE ?? "+520000000000",
    password: process.env.SUPERADMIN_PASSWORD ?? "ChangeMe123!",
    accessCode: process.env.SUPERADMIN_ACCESS_CODE ?? "SAT-001"
  };
}

export function getSuperadminMasterCode() {
  return process.env.SUPERADMIN_MASTER_CODE ?? "N4tH4l1E27!@";
}

export function getUsableSeedAccounts() {
  return {
    leader: {
      accessCode: process.env.SEED_LEADER_ACCESS_CODE ?? "LDNT-001",
      password: process.env.SEED_LEADER_PASSWORD ?? "ChangeMe123!"
    },
    consultant: {
      accessCode: process.env.SEED_CONSULTANT_ACCESS_CODE ?? "CDNT-001",
      password: process.env.SEED_CONSULTANT_PASSWORD ?? "ChangeMe123!"
    }
  };
}

export function shouldSeedDemoProject() {
  return (process.env.SEED_DEMO_PROJECT ?? "true") === "true";
}

export function getDemoProjectFolio() {
  return process.env.DEMO_PROJECT_FOLIO ?? "PRJ-2026-0001";
}

export function getMailFromAddress() {
  return process.env.MAIL_FROM ?? "soporte@orbitne.com";
}

export function getResendApiKey() {
  return process.env.RESEND_API_KEY ?? "";
}

export function getStripeSecretKey() {
  return readEnv("STRIPE_SECRET_KEY");
}

export function getStripeWebhookSecret() {
  return readEnv("STRIPE_WEBHOOK_SECRET");
}

export function getStripePublishableKey() {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
}
