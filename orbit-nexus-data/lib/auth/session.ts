import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { authCookie } from "@/lib/auth/cookies";
import { verifySessionToken } from "@/lib/jwt";

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookie.name)?.value;

  if (!token) {
    return null;
  }

  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function requireSession() {
  noStore();

  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}
