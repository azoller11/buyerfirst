import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { email, password, name } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  // basic length check (add stronger rules later)
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: {
      email,
      name: name || null,
      passwordHash,            // ← this should be recognized after prisma generate
    },
    select: { id: true, email: true, name: true },
  });

  return NextResponse.json(user, { status: 201 });
}
