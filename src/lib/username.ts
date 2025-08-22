import { db } from "@/lib/db";

// Simple random suffix
function rand(n = 6) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < n; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

// Make a base from name/email
function baseFrom(name?: string | null, email?: string | null) {
  const fromName = name?.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const fromEmail = email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return (fromName || fromEmail || "buyer").slice(0, 15) || "buyer";
}

export async function generateUniqueUsername(name?: string | null, email?: string | null) {
  const base = baseFrom(name, email) || "buyer";
  // Try base, then base+random until free
  const candidates = [base, `${base}${rand(3)}`, `${base}${rand(4)}`, `buyer${rand(5)}`];
  for (const c of candidates) {
    const hit = await db.user.findUnique({ where: { username: c } });
    if (!hit) return c;
  }

  // Fallback loop (extremely unlikely)
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const c = `buyer${rand(6)}`;
    const hit = await db.user.findUnique({ where: { username: c } });
    if (!hit) return c;
  }
}
