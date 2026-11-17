import crypto from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "chazmaster_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || "1308";
}

function getSigningSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    crypto
      .createHash("sha256")
      .update(`${process.env.DATABASE_URL || "local"}:chazmaster-album-vault-v1`)
      .digest("hex")
  );
}

export function verifyAdminPassword(candidate: string): boolean {
  const expected = getAdminPassword();
  const a = Buffer.from(String(candidate).trim(), "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

export function createAdminSessionToken(): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const nonce = crypto.randomBytes(12).toString("hex");
  const payload = Buffer.from(
    JSON.stringify({ role: "admin", exp, nonce }),
    "utf8"
  ).toString("base64url");
  const sig = crypto
    .createHmac("sha256", getSigningSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyAdminSessionToken(token: string | undefined): boolean {
  if (!token || !token.includes(".")) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;

  const expectedSig = crypto
    .createHmac("sha256", getSigningSecret())
    .update(payload)
    .digest("base64url");

  const a = Buffer.from(sig, "utf8");
  const b = Buffer.from(expectedSig, "utf8");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return false;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as { role?: string; exp?: number };
    if (parsed.role !== "admin" || typeof parsed.exp !== "number") {
      return false;
    }
    return parsed.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return verifyAdminSessionToken(token);
}

export const ADMIN_COOKIE_MAX_AGE = SESSION_TTL_SECONDS;
