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
    name: process.env.DEFAULT_COMPANY_NAME ?? "Orbit Nexus Base",
    slug: process.env.DEFAULT_COMPANY_SLUG ?? "orbit-nexus-base"
  };
}

export function getSuperadminSeed() {
  return {
    name: process.env.SUPERADMIN_NAME ?? "Superadmin Orbit Nexus",
    email: process.env.SUPERADMIN_EMAIL ?? "superadmin@orbitnexus.local",
    phone: process.env.SUPERADMIN_PHONE ?? "+520000000000",
    password: process.env.SUPERADMIN_PASSWORD ?? "ChangeMe123!",
    accessCode: process.env.SUPERADMIN_ACCESS_CODE ?? "SAT-001"
  };
}

export function shouldSeedDemoProject() {
  return (process.env.SEED_DEMO_PROJECT ?? "true") === "true";
}

export function getDemoProjectFolio() {
  return process.env.DEMO_PROJECT_FOLIO ?? "ORBIT-DEMO-001";
}

