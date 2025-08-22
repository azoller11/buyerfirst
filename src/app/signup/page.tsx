"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // new
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    // ✅ Confirm password check
    if (password !== confirmPassword) {
      setErr("Passwords do not match");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data.error || "Sign up failed");
      setLoading(false);
      return;
    }

    // Auto sign-in via credentials after successful signup
    const signinRes = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/",
    });

    setLoading(false);
    if (signinRes?.error) setErr(signinRes.error);
    else window.location.href = signinRes?.url || "/";
  }

  return (
    <main className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold">Create your BuyerFirst account</h1>

      {/* Google OAuth on signup too */}
      <div className="mt-6 space-y-3">
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="w-full border px-4 py-2"
          type="button"
        >
          Sign up with Google
        </button>
        <div className="text-center text-sm text-gray-500">or</div>
      </div>

      {/* Email + password signup */}
      <form onSubmit={handleSubmit} className="mt-2 space-y-3">
        <input
          className="border p-2 w-full"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="border p-2 w-full"
          type="password"
          placeholder="Password (min 8 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        <input
          className="border p-2 w-full"
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          minLength={8}
          required
        />

        {err && <div className="text-red-600 text-sm">{err}</div>}

        <button disabled={loading} className="w-full bg-black text-white py-2">
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
    </main>
  );
}
