import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { getAppUrl } from "@/lib/config";

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

function resolveAuthCookieDomain() {
  if (process.env.NODE_ENV !== "production") {
    return undefined;
  }

  try {
    const hostname = new URL(getAppUrl()).hostname.toLowerCase();

    if (hostname === "orbitne.com" || hostname.endsWith(".orbitne.com")) {
      return "orbitne.com";
    }

    return undefined;
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
