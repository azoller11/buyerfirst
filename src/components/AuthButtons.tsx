"use client";
import { signIn } from "next-auth/react";

export function GoogleButton({ label = "Continue with Google" }: { label?: string }) {
  return (
    <button
      onClick={() => signIn("google", { callbackUrl: "/" })}
      className="w-full border px-4 py-2"
    >
      {label}
    </button>
  );
}
