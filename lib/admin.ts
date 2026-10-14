import { createHmac, timingSafeEqual } from "node:crypto";

export const OWNER_SESSION_COOKIE = "jobflow-owner-session";
const OWNER_SESSION_MAX_AGE = 60 * 60 * 8;

export function ownerAdminConfiguration() {
  const username = process.env.OWNER_USERNAME?.trim();
  const code = process.env.OWNER_ADMIN_CODE;
  const secret = process.env.NEXTAUTH_SECRET;

  if (!username || !code || !/^\d{6}$/.test(code) || !secret) return null;
  return { username, code, secret };
}

function digest(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest();
}

export function matchesOwnerCredentials(username: string, code: string) {
  const config = ownerAdminConfiguration();
  if (!config || !/^\d{6}$/.test(code)) return false;

  return (
    timingSafeEqual(digest(username.trim(), config.secret), digest(config.username, config.secret)) &&
    timingSafeEqual(digest(code, config.secret), digest(config.code, config.secret))
  );
}

export function createOwnerSessionToken() {
  const config = ownerAdminConfiguration();
  if (!config) return null;
  const expiresAt = Date.now() + OWNER_SESSION_MAX_AGE * 1000;
  const signature = createHmac("sha256", config.secret).update(String(expiresAt)).digest("hex");
  return { value: `${expiresAt}.${signature}`, maxAge: OWNER_SESSION_MAX_AGE };
}

export function isValidOwnerSession(token?: string) {
  const config = ownerAdminConfiguration();
  if (!config || !token) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [expiresAt, signature] = parts;
  if (!expiresAt || !/^[a-f0-9]{64}$/.test(signature) || !/^\d+$/.test(expiresAt) || Number(expiresAt) <= Date.now()) return false;

  const expected = createHmac("sha256", config.secret).update(expiresAt).digest();
  const actual = Buffer.from(signature, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
