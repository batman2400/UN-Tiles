import { NextRequest } from "next/server";
import { checkRateLimit as checkScopedRateLimit } from "@/lib/rate-limit";

/**
 * Re-export checkRateLimit for visual search with the "visual-search" scope.
 */
export function checkRateLimit(
  req: NextRequest,
  limit: number = 30,
  windowMs: number = 60 * 1000
) {
  return checkScopedRateLimit(req, limit, windowMs, "visual-search");
}
