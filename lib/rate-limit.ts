import "server-only";

import { ServiceError } from "@/lib/services/service-error";

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const vercelForwardedFor = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();

  return forwardedFor || vercelForwardedFor || realIp || "unknown";
}

function cleanupExpiredBuckets(now: number) {
  if (buckets.size < 5000) {
    return;
  }

  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function assertRateLimit(request: Request, options: RateLimitOptions) {
  const now = Date.now();
  const ip = getClientIp(request);
  const bucketKey = `${options.key}:${ip}`;
  const currentBucket = buckets.get(bucketKey);

  cleanupExpiredBuckets(now);

  if (!currentBucket || currentBucket.resetAt <= now) {
    buckets.set(bucketKey, {
      count: 1,
      resetAt: now + options.windowMs
    });
    return;
  }

  currentBucket.count += 1;

  if (currentBucket.count > options.limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((currentBucket.resetAt - now) / 1000));
    throw new ServiceError(
      `Demasiadas solicitudes. Intenta nuevamente en ${retryAfterSeconds} segundos.`,
      429
    );
  }
}
