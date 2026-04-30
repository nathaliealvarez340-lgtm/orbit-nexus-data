import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);
const PRIVATE_HOST_SUFFIXES = [".local", ".lan", ".home", ".internal"];
const CANONICAL_FALLBACK_ORIGIN = "https://orbitne.com";
const CORS_ALLOW_METHODS = "GET,POST,PUT,PATCH,DELETE,OPTIONS";

function resolveCanonicalOrigin() {
  const value =
    process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? CANONICAL_FALLBACK_ORIGIN;

  try {
    return new URL(value);
  } catch {
    return new URL(CANONICAL_FALLBACK_ORIGIN);
  }
}

function normalizeOrigin(value: string) {
  return new URL(value).origin.replace(/\/$/, "");
}

function isPrivateIpv4(hostname: string) {
  const segments = hostname.split(".");

  if (segments.length !== 4 || segments.some((segment) => !/^\d+$/.test(segment))) {
    return false;
  }

  const [first, second] = segments.map((segment) => Number(segment));

  return (
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

function isPrivateIpv6(hostname: string) {
  const normalized = hostname.toLowerCase();

  return (
    normalized === "::1" ||
    normalized.startsWith("fe80:") ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd")
  );
}

function isPrivateNetworkHostname(hostname: string) {
  return (
    LOCAL_HOSTNAMES.has(hostname) ||
    PRIVATE_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix)) ||
    isPrivateIpv4(hostname) ||
    isPrivateIpv6(hostname) ||
    (!hostname.includes(".") && !hostname.includes(":"))
  );
}

function resolveAllowedOrigins(canonicalUrl: URL) {
  const allowedOrigins = new Set<string>([canonicalUrl.origin]);
  const canonicalHostname = canonicalUrl.hostname.toLowerCase();
  const canonicalRoot = canonicalHostname.startsWith("www.")
    ? canonicalHostname.slice(4)
    : canonicalHostname;
  const allowedOriginsEnv = [
    process.env.ALLOWED_ORIGINS,
    process.env.CORS_ORIGIN
  ]
    .filter(Boolean)
    .join(",");

  allowedOrigins.add(`${canonicalUrl.protocol}//${canonicalRoot}`);
  allowedOrigins.add(`${canonicalUrl.protocol}//www.${canonicalRoot}`);

  for (const host of [
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL
  ]) {
    if (!host) {
      continue;
    }

    try {
      allowedOrigins.add(normalizeOrigin(`https://${host}`));
    } catch {
      // Ignore malformed deployment aliases and keep the rest of the allowlist intact.
    }
  }

  for (const origin of allowedOriginsEnv
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)) {
    try {
      allowedOrigins.add(normalizeOrigin(origin));
    } catch {
      // Ignore malformed custom allowlist values and keep the rest intact.
    }
  }

  if (process.env.NODE_ENV !== "production") {
    allowedOrigins.add("http://localhost:3000");
    allowedOrigins.add("http://127.0.0.1:3000");
  }

  return allowedOrigins;
}

function buildCorsHeaders(request: NextRequest, allowedOrigins: Set<string>) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return null;
  }

  try {
    const normalizedOrigin = normalizeOrigin(origin);
    const requestOrigin = normalizeOrigin(request.nextUrl.origin);

    if (normalizedOrigin !== requestOrigin && !allowedOrigins.has(normalizedOrigin)) {
      return null;
    }

    const headers = new Headers();
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set(
      "Access-Control-Allow-Headers",
      request.headers.get("access-control-request-headers") ?? "Content-Type, Authorization"
    );
    headers.set("Access-Control-Allow-Methods", CORS_ALLOW_METHODS);
    headers.set("Access-Control-Allow-Origin", normalizedOrigin);
    headers.set("Access-Control-Max-Age", "86400");
    headers.set("Vary", "Origin, Access-Control-Request-Headers");

    return headers;
  } catch {
    return null;
  }
}

function applyHeaders(target: Headers, source: Headers) {
  source.forEach((value, key) => {
    target.set(key, value);
  });
}

function shouldRedirectToCanonical(hostname: string, canonicalHostname: string) {
  const canonicalRoot = canonicalHostname.startsWith("www.")
    ? canonicalHostname.slice(4)
    : canonicalHostname;

  if (hostname.endsWith(".vercel.app")) {
    return true;
  }

  if (canonicalHostname === canonicalRoot) {
    return hostname === `www.${canonicalRoot}`;
  }

  return hostname === canonicalRoot;
}

export function middleware(request: NextRequest) {
  const currentUrl = request.nextUrl;
  const pathname = currentUrl.pathname;
  const currentHostname = currentUrl.hostname.toLowerCase();
  const canonicalUrl = resolveCanonicalOrigin();
  const allowedOrigins = resolveAllowedOrigins(canonicalUrl);
  const apiRequest = pathname.startsWith("/api/");
  const corsHeaders = buildCorsHeaders(request, allowedOrigins);

  if (apiRequest) {
    if (request.method === "OPTIONS") {
      if (!corsHeaders) {
        console.warn("[middleware/cors] Blocked preflight request", {
          origin: request.headers.get("origin"),
          pathname
        });

        return NextResponse.json({ message: "Origen no autorizado." }, { status: 403 });
      }

      return new NextResponse(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    const response = NextResponse.next();

    if (corsHeaders) {
      applyHeaders(response.headers, corsHeaders);
    }

    return response;
  }

  const canonicalHostname = canonicalUrl.hostname.toLowerCase();

  if (
    currentHostname === canonicalHostname ||
    isPrivateNetworkHostname(currentHostname) ||
    !shouldRedirectToCanonical(currentHostname, canonicalHostname)
  ) {
    return NextResponse.next();
  }

  const redirectUrl = new URL(currentUrl.pathname + currentUrl.search, canonicalUrl);

  return NextResponse.redirect(redirectUrl, 308);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"
  ]
};
