/**
 * Maps internal Gemini / Sharp / DB errors to a short client-safe message.
 * Full details stay in server logs.
 */
export function publicErrorMessage(err: unknown, fallback: string): string {
  const message = err instanceof Error ? err.message : "";
  const lower = message.toLowerCase();

  if (lower.includes("rate limit") || lower.includes("429") || lower.includes("quota") || lower.includes("resource exhausted")) {
    return "The AI service is busy. Please wait a moment and try again.";
  }
  if (lower.includes("unsupported image") || lower.includes("exceeds maximum")) {
    return message;
  }
  if (lower.includes("vision") || lower.includes("not enabled yet")) {
    return "Scene Advisor is not enabled yet. Tile Matcher is available now.";
  }
  if (lower.includes("missing gemini") || lower.includes("api key")) {
    return "Visual Match is not configured yet. Please try again later.";
  }
  if (lower.includes("missing supabase")) {
    return "Catalog matching is temporarily unavailable.";
  }

  return fallback;
}
