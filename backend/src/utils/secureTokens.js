import crypto from "crypto";

/** Cryptographically strong token for URLs (no padding, URL-safe). */
export function newUrlSafeToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString("base64url");
}
