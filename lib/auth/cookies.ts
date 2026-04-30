import { AUTH_COOKIE_NAME } from "@/lib/constants";

type AuthCookieOptions = {
  domain?: string;
  httpOnly: boolean;
  path: string;
  sameSite: "lax" | "strict" | "none";
  secure: boolean;
  maxAge?: number;
  expires?: Date;
};

const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function normalizeCookieDomain(value: string) {
  const trimmed = value.trim().replace(/^\.+/, "");

  if (!trimmed) {
    return undefined;
  }

  if (trimmed.includes("://")) {
    return new URL(trimmed).hostname.toLowerCase();
  }

  return trimmed.toLowerCase();
}

function resolveAuthCookieDomain() {
  if (process.env.NODE_ENV !== "production") {
    return undefined;
  }

  try {
    return normalizeCookieDomain(process.env.AUTH_COOKIE_DOMAIN ?? "");
  } catch {
    return undefined;
  }
}

export const authCookie = {
  name: AUTH_COOKIE_NAME,
  options: {
    domain: resolveAuthCookieDomain(),
    httpOnly: true,
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  } satisfies AuthCookieOptions
};
