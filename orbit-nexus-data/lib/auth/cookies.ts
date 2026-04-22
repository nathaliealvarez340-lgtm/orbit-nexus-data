import { AUTH_COOKIE_NAME } from "@/lib/constants";

type AuthCookieOptions = {
  httpOnly: boolean;
  path: string;
  sameSite: "lax" | "strict" | "none";
  secure: boolean;
  maxAge?: number;
  expires?: Date;
};

export const authCookie = {
  name: AUTH_COOKIE_NAME,
  options: {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  } satisfies AuthCookieOptions
};
