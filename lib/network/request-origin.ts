import { getAppUrl } from "@/lib/config";

function normalizeOrigin(value: string) {
  return new URL(value).origin.replace(/\/$/, "");
}

export function resolveRequestOrigin(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host")?.trim();

  if (host) {
    const requestProtocol = new URL(request.url).protocol.replace(/:$/, "");
    const protocol = forwardedProto || requestProtocol || "https";

    try {
      return normalizeOrigin(`${protocol}://${host}`);
    } catch {
      // Fall through to the request URL or configured public URL below.
    }
  }

  try {
    return normalizeOrigin(request.url);
  } catch {
    return getAppUrl();
  }
}
