import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { generateUniqueUsername } from "@/lib/username";

export async function POST(req: Request) {
  const { email: rawEmail, password, name } = await req.json();
  const email = String(rawEmail || "").toLowerCase().trim();   // 👈 normalize

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);        // 👈 bcryptjs
  const username = await generateUniqueUsername(name, email);

  const user = await db.user.create({
    data: { email, name: name || null, passwordHash, username },
    select: { id: true, email: true, name: true, username: true },
  });

  return NextResponse.json(user, { status: 201 });
}
