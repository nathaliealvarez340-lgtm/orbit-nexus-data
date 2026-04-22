import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { applyProtectedNoStoreHeaders } from "@/lib/auth/cache-control";
import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { verifySessionToken } from "@/lib/jwt";

function isAuthPath(pathname: string) {
  return pathname === "/login" || pathname === "/register";
}

function isProtectedPage(pathname: string) {
  return pathname === "/workspace" || pathname.startsWith("/workspace/");
}

function isProtectedApi(pathname: string) {
  return pathname.startsWith("/api/admin/");
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const protectedPage = isProtectedPage(pathname);
  const protectedApi = isProtectedApi(pathname);

  let hasValidSession = false;

  if (token) {
    try {
      await verifySessionToken(token);
      hasValidSession = true;
    } catch {
      hasValidSession = false;
    }
  }

  if ((protectedPage || protectedApi) && !hasValidSession) {
    if (protectedApi) {
      return applyProtectedNoStoreHeaders(
        NextResponse.json(
          { message: "No autenticado." },
          { status: 401 }
        )
      );
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return applyProtectedNoStoreHeaders(NextResponse.redirect(loginUrl));
  }

  if (isAuthPath(pathname) && hasValidSession) {
    return NextResponse.redirect(new URL("/workspace", request.url));
  }

  if (protectedPage || protectedApi) {
    return applyProtectedNoStoreHeaders(NextResponse.next());
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/register", "/workspace/:path*", "/api/admin/:path*"]
};
