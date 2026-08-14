const FALLBACK_AFTER_LOGIN = "/profile";

/**
 * Allow only same-origin relative paths. Rejects protocol-relative URLs,
 * open-redirect tricks (`/@evil`, `//evil`), and backslashes.
 */
export function getSafeNextPath(
  raw: string | null | undefined,
  fallback: string = FALLBACK_AFTER_LOGIN
): string {
  if (typeof raw !== "string") return fallback;

  let path = raw.trim();
  if (!path) return fallback;

  try {
    path = decodeURIComponent(path);
  } catch {
    return fallback;
  }

  if (!path.startsWith("/")) return fallback;
  if (path.startsWith("//")) return fallback;
  if (path.includes("://") || path.includes("\\") || path.includes("@")) {
    return fallback;
  }
  if (!/^\/[a-zA-Z0-9/_\-?=&%.]*$/.test(path)) return fallback;

  return path;
}

export function loginUrlWithNext(nextPath: string): string {
  const next = getSafeNextPath(nextPath, FALLBACK_AFTER_LOGIN);
  if (next === FALLBACK_AFTER_LOGIN) return "/login";
  return `/login?next=${encodeURIComponent(next)}`;
}
