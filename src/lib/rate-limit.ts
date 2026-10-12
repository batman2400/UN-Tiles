import { NextRequest } from "next/server";

interface RateLimitRecord {
  timestamps: number[];
}

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

/**
 * Checks if the request from a given client IP is within rate limits for a given scope.
 *
 * @param req NextRequest
 * @param limit Max requests allowed within windowMs (e.g. 10)
 * @param windowMs Time window in milliseconds (default: 60,000ms / 1 minute)
 * @param scope Namespace for the rate limit (e.g. "checkout", "contact", "stripe")
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

  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0].trim()
    : req.headers.get("x-real-ip") || "anonymous-client";

  const key = `${scope}:${ip}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  let record = bucketMap.get(key);
  if (!record) {
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
