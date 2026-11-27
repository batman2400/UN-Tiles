import { NextRequest } from "next/server";

interface RateLimitRecord {
  timestamps: number[];
}

const MAX_BUCKETS = 5_000;
const bucketMap = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;

  lastCleanup = now;
  const oneHourAgo = now - 60 * 60 * 1000;

  for (const [key, record] of bucketMap.entries()) {
    const freshTimestamps = record.timestamps.filter((ts) => ts > oneHourAgo);
    if (freshTimestamps.length === 0) {
      bucketMap.delete(key);
    } else {
      record.timestamps = freshTimestamps;
    }
  }
}

function resolveClientIp(req: NextRequest): string {
  const vercelForwarded = req.headers.get("x-vercel-forwarded-for");
  if (vercelForwarded) {
    const first = vercelForwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return "anonymous-client";
}

/**
 * Checks if the request from a given client IP is within rate limits for a given scope.
 */
export function checkRateLimit(
  req: NextRequest,
  limit: number = 30,
  windowMs: number = 60 * 1000,
  scope: string = "default"
): { allowed: boolean; remaining: number; resetMs: number } {
  // Allow unrestricted testing during local development
  if (process.env.NODE_ENV === "development") {
    return { allowed: true, remaining: 999, resetMs: windowMs };
  }

  cleanup();

  const ip = resolveClientIp(req);
  const key = `${scope}:${ip}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  let record = bucketMap.get(key);
  if (!record) {
    if (bucketMap.size >= MAX_BUCKETS) {
      const oldestKey = bucketMap.keys().next().value;
      if (oldestKey !== undefined) {
        bucketMap.delete(oldestKey);
      }
    }
    record = { timestamps: [] };
    bucketMap.set(key, record);
  }

  // Filter timestamps within current window
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const resetMs = oldest + windowMs - now;
    return {
      allowed: false,
      remaining: 0,
      resetMs: Math.max(0, resetMs),
    };
  }

  record.timestamps.push(now);

  return {
    allowed: true,
    remaining: limit - record.timestamps.length,
    resetMs: windowMs,
  };
}
