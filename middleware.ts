import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);
const CANONICAL_FALLBACK_ORIGIN = "https://orbitne.com";

function resolveCanonicalOrigin() {
  const value =
    process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? CANONICAL_FALLBACK_ORIGIN;

  try {
    return new URL(value);
  } catch {
    return new URL(CANONICAL_FALLBACK_ORIGIN);
  }
}

function isLocalHostname(hostname: string) {
  return LOCAL_HOSTNAMES.has(hostname) || hostname.endsWith(".local");
}

export function middleware(request: NextRequest) {
  const currentUrl = request.nextUrl;
  const currentHostname = currentUrl.hostname.toLowerCase();

  if (isLocalHostname(currentHostname)) {
    return NextResponse.next();
  }

  const canonicalUrl = resolveCanonicalOrigin();
  const canonicalHostname = canonicalUrl.hostname.toLowerCase();

  if (currentHostname === canonicalHostname) {
    return NextResponse.next();
  }

  const redirectUrl = new URL(currentUrl.pathname + currentUrl.search, canonicalUrl);

  return NextResponse.redirect(redirectUrl, 308);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"
  ]
};
