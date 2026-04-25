import fs from "node:fs";
import path from "node:path";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

const cwd = process.cwd();
const envName = process.env.NODE_ENV === "production" ? "production" : "development";
const envFiles = [
  `.env.${envName}.local`,
  envName === "development" ? ".env.local" : null,
  `.env.${envName}`,
  ".env"
].filter(Boolean);

for (const file of envFiles) {
  loadEnvFile(path.join(cwd, file));
}

const strict = process.argv.includes("--strict");
const isVercelProduction = process.env.VERCEL_ENV === "production";
const isProductionLike =
  strict || process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
const requirePublicProductionUrl = strict || isVercelProduction;

const errors = [];
const warnings = [];

function requireValue(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    errors.push(`Missing required environment variable: ${name}`);
    return "";
  }

  return value;
}

function readValue(name) {
  return process.env[name]?.trim() ?? "";
}

function validateUrl(name, value, { httpsOnly = false } = {}) {
  if (!value) {
    return;
  }

  try {
    const url = new URL(value);

    if (httpsOnly && url.protocol !== "https:") {
      errors.push(`${name} must use https in production. Current value: ${value}`);
    }
  } catch {
    errors.push(`${name} must be a valid absolute URL. Current value: ${value}`);
  }
}

const databaseUrl = requireValue("DATABASE_URL");
const jwtSecret = requireValue("JWT_SECRET");
const superadminMasterCode = readValue("SUPERADMIN_MASTER_CODE");
const explicitAppUrl = readValue("APP_URL");
const publicClientAppUrl = readValue("NEXT_PUBLIC_APP_URL");
const vercelProjectProductionUrl = readValue("VERCEL_PROJECT_PRODUCTION_URL");
const vercelUrl = readValue("VERCEL_URL");

let resolvedAppUrl = explicitAppUrl || publicClientAppUrl;

if (!resolvedAppUrl && vercelProjectProductionUrl) {
  resolvedAppUrl = `https://${vercelProjectProductionUrl}`;
}

if (!resolvedAppUrl && vercelUrl) {
  resolvedAppUrl = `https://${vercelUrl}`;
}

if (!resolvedAppUrl && !isProductionLike) {
  resolvedAppUrl = "http://localhost:3000";
}

if (!resolvedAppUrl) {
  errors.push(
    "Missing APP_URL / NEXT_PUBLIC_APP_URL (or a Vercel deployment URL fallback). Set your public origin, for example https://orbitne.com."
  );
} else {
  validateUrl("APP_URL", resolvedAppUrl, { httpsOnly: isProductionLike });
}

if (explicitAppUrl && publicClientAppUrl) {
  try {
    const serverOrigin = new URL(explicitAppUrl).origin;
    const clientOrigin = new URL(publicClientAppUrl).origin;

    if (serverOrigin !== clientOrigin) {
      errors.push("APP_URL and NEXT_PUBLIC_APP_URL must resolve to the same origin.");
    }
  } catch {
    // URL validation is already handled above.
  }
}

if (requirePublicProductionUrl && !resolvedAppUrl) {
  errors.push(
    "A public app URL is required for production deployments. Set APP_URL or NEXT_PUBLIC_APP_URL explicitly to https://orbitne.com."
  );
}

if (isProductionLike && !publicClientAppUrl) {
  warnings.push(
    "NEXT_PUBLIC_APP_URL is not configured. Add NEXT_PUBLIC_APP_URL=https://orbitne.com to keep client-side public origin references explicit."
  );
}

if (databaseUrl && databaseUrl.startsWith("file:") && isProductionLike) {
  errors.push("DATABASE_URL cannot use SQLite file storage in production. Use PostgreSQL for public deployment.");
}

if (jwtSecret && jwtSecret.length < 24) {
  warnings.push("JWT_SECRET is shorter than recommended. Use a longer secret for production.");
}

if (isProductionLike && !superadminMasterCode) {
  errors.push("Missing required environment variable: SUPERADMIN_MASTER_CODE");
}

const stripeSecret = readValue("STRIPE_SECRET_KEY");
const stripePublic = readValue("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
const stripeWebhook = readValue("STRIPE_WEBHOOK_SECRET");
const stripeValues = [stripeSecret, stripePublic, stripeWebhook];
const hasSomeStripe = stripeValues.some(Boolean);
const hasAllStripe = stripeValues.every(Boolean);

if (hasSomeStripe && !hasAllStripe) {
  errors.push(
    "Stripe is partially configured. Set STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, and STRIPE_WEBHOOK_SECRET together."
  );
}

if (!hasAllStripe) {
  warnings.push(
    "Stripe environment variables are incomplete or missing. Commercial checkout will remain unavailable until Stripe is configured."
  );
}

if (!readValue("RESEND_API_KEY")) {
  warnings.push(
    "RESEND_API_KEY is not configured. Access recovery emails will not send from production until you add it."
  );
}

if (errors.length > 0) {
  console.error("\n[orbit-nexus] Environment validation failed:\n");
  for (const error of errors) {
    console.error(`- ${error}`);
  }

  if (warnings.length > 0) {
    console.error("\nWarnings:");
    for (const warning of warnings) {
      console.error(`- ${warning}`);
    }
  }

  process.exit(1);
}

if (warnings.length > 0) {
  console.warn("\n[orbit-nexus] Environment validation warnings:\n");
  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }
}

console.log("[orbit-nexus] Environment validation passed.");
