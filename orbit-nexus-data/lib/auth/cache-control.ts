import type { NextResponse } from "next/server";

export const PROTECTED_NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
  Vary: "Cookie"
} as const;

export function applyProtectedNoStoreHeaders<T extends NextResponse>(response: T) {
  Object.entries(PROTECTED_NO_STORE_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}
