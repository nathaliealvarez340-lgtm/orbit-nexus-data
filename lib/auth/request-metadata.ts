export function getRequestMetadata(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const userAgent = request.headers.get("user-agent");

  return {
    ipAddress: forwardedFor?.split(",")[0]?.trim() ?? realIp ?? "unknown",
    device: userAgent?.trim() || "unknown"
  };
}

