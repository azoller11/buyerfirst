"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { GoogleButton } from "@/components/AuthButtons";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    const res = await signIn("credentials", { email, password, redirect: false, callbackUrl: "/" });
    setLoading(false);
    if (res?.error) setErr(res.error);
    else window.location.href = res?.url || "/";
  }

  return (
    <main className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold">Sign in to BuyerFirst</h1>

      <div className="mt-6 space-y-4">
        <GoogleButton label="Sign in with Google" />

        <div className="text-center text-sm text-gray-500">or</div>

        <form onSubmit={handleCredentials} className="space-y-3">
          <input
            className="border p-2 w-full"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            required
          />
          <input
            className="border p-2 w-full"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            required
          />
          {err && <div className="text-red-600 text-sm">{err}</div>}
          <button disabled={loading} className="w-full bg-black text-white py-2">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="text-sm">
          New here? <Link href="/signup" className="underline">Create an account</Link>
        </div>
      </div>
    </main>
  );
}
