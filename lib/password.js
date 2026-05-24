// ─── Password utilities ───────────────────────────────────────────────────────
// Uses bcryptjs (pure JS, no native build needed)

import bcrypt from "bcryptjs";
import { getDb, getSetting } from "@/lib/db";

const SALT_ROUNDS = 10;

// Check if a string looks like a bcrypt hash
export function isBcryptHash(str) {
  return str && (str.startsWith("$2a$") || str.startsWith("$2b$"));
}

// Hash a plaintext password
export async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

// Compare a plaintext password against stored value (hash or plaintext)
// Auto-migrates plaintext to bcrypt on first successful match
export async function verifyPassword(plain, stored) {
  if (!stored) return false;

  if (isBcryptHash(stored)) {
    return bcrypt.compare(plain, stored);
  }

  // Plaintext comparison — migrate to bcrypt if correct
  if (plain === stored) {
    const hashed = await hashPassword(plain);
    const db = getDb();
    await db.execute({
      sql: "INSERT OR REPLACE INTO settings (key, value) VALUES (?,?)",
      args: ["app_password", hashed],
    });
    console.log("[auth] Password migrated from plaintext to bcrypt");
    return true;
  }

  return false;
}
