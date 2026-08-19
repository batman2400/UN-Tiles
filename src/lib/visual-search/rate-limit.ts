import { NextRequest } from "next/server";

interface RateLimitRecord {
  timestamps: number[];
}

const ipMap = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;

  lastCleanup = now;
  const oneMinuteAgo = now - 60 * 1000;

  for (const [ip, record] of ipMap.entries()) {
    const freshTimestamps = record.timestamps.filter((ts) => ts > oneMinuteAgo);
    if (freshTimestamps.length === 0) {
      ipMap.delete(ip);
    } else {
      record.timestamps = freshTimestamps;
    }
  }
}

/**
 * Checks if the request from a given client IP is within rate limits.
 * Default: 10 requests per minute per IP.
 */
export function checkRateLimit(
  req: NextRequest,
  limit: number = 10,
  windowMs: number = 60 * 1000
): { allowed: boolean; remaining: number; resetMs: number } {
  cleanup();

  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") || "anonymous-client";

  const now = Date.now();
  const windowStart = now - windowMs;

  let record = ipMap.get(ip);
  if (!record) {
    record = { timestamps: [] };
    ipMap.set(ip, record);
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
