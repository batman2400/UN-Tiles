import fs from "fs/promises";
import net from "net";
import path from "path";
import { MAX_IMAGE_SIZE_BYTES } from "./image-input";

const FETCH_TIMEOUT_MS = 5000;

function isPrivateOrReservedIpv4(ip: string): boolean {
  const parts = ip.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true; // link-local / cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a >= 224) return true; // multicast / reserved
  return false;
}

function isBlockedHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    !lower ||
    lower === "localhost" ||
    lower.endsWith(".localhost") ||
    lower.endsWith(".local") ||
    lower.endsWith(".internal")
  ) {
    return true;
  }

  const ipVersion = net.isIP(lower);
  if (ipVersion === 4) {
    return isPrivateOrReservedIpv4(lower);
  }
  if (ipVersion === 6) {
    if (lower === "::" || lower === "::1") return true;
    // ULA fc00::/7, link-local fe80::/10, NAT64 64:ff9b::, Teredo 2001::/32, 6to4 2002::/16, multicast ff00::/8
    if (
      lower.startsWith("fc") ||
      lower.startsWith("fd") ||
      /^fe[89ab][0-9a-f]/i.test(lower) ||
      lower.startsWith("64:ff9b:") ||
      lower.startsWith("2001:") ||
      lower.startsWith("2002:") ||
      lower.startsWith("ff")
    ) {
      return true;
    }
    if (lower.startsWith("::ffff:")) {
      const mappedV4 = lower.slice("::ffff:".length);
      return net.isIP(mappedV4) === 4 ? isPrivateOrReservedIpv4(mappedV4) : true;
    }
  }

  return false;
}

async function readResponseWithLimit(response: Response, maxBytes: number): Promise<Buffer> {
  const contentLength = response.headers.get("content-length");
  if (contentLength) {
    const declared = Number.parseInt(contentLength, 10);
    if (Number.isFinite(declared) && declared > maxBytes) {
      throw new Error("Remote image exceeds maximum allowed size.");
    }
  }

  if (!response.body) {
    const buf = Buffer.from(await response.arrayBuffer());
    if (buf.length > maxBytes) {
      throw new Error("Remote image exceeds maximum allowed size.");
    }
    return buf;
  }

  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => {});
      throw new Error("Remote image exceeds maximum allowed size.");
    }
    chunks.push(Buffer.from(value));
  }

  return Buffer.concat(chunks, total);
}

/**
 * Safely loads a catalog image from either a validated public HTTPS URL
 * (SSRF-protected: HTTPS-only, no redirects, private/link-local hosts blocked,
 * 5s timeout, byte cap) or a local path strictly confined within `public/`.
 */
export async function loadSafeCatalogImage(imageUrl: string): Promise<Buffer> {
  const trimmed = imageUrl.trim();
  if (!trimmed || trimmed.includes("\0")) {
    throw new Error("Invalid image path.");
  }

  if (/^https?:\/\//i.test(trimmed)) {
    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      throw new Error("Invalid remote image URL.");
    }

    if (parsed.protocol !== "https:") {
      throw new Error("Only HTTPS remote catalog images are permitted.");
    }
    if (parsed.username || parsed.password) {
      throw new Error("Credentials in remote image URLs are not permitted.");
    }
    if (isBlockedHostname(parsed.hostname)) {
      throw new Error("Blocked remote image host.");
    }

    const response = await fetch(parsed.toString(), {
      redirect: "error",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch remote image: HTTP ${response.status} ${response.statusText}`);
    }

    return readResponseWithLimit(response, MAX_IMAGE_SIZE_BYTES);
  }

  if (trimmed.startsWith("//") || trimmed.includes("\\")) {
    throw new Error("Invalid local image path.");
  }

  const relativePath = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
  if (!relativePath || path.isAbsolute(relativePath)) {
    throw new Error("Invalid local image path.");
  }

  const publicRoot = path.resolve(process.cwd(), "public");
  const resolved = path.resolve(publicRoot, relativePath);

  if (!resolved.startsWith(publicRoot + path.sep)) {
    throw new Error("Image path escapes public directory.");
  }

  const stat = await fs.stat(resolved);
  if (!stat.isFile() || stat.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("Local catalog image is missing or exceeds size limit.");
  }

  return fs.readFile(resolved);
}
