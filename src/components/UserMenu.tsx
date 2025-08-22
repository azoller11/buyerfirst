"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function UserMenu() {
  const { data: session, status } = useSession();
  if (status === "loading") return <div className="text-sm text-gray-500">…</div>;

  if (status === "authenticated" && session.user) {
    const label = session.user.username || session.user.name || session.user.email || "Account";
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-700 truncate max-w-[220px]" title={label}>
          @{label}
        </span>
        <button onClick={() => signOut({ callbackUrl: "/" })} className="text-sm underline">
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/signin" className="text-sm underline">Sign in</Link>
      <Link href="/signup" className="text-sm underline">Sign up</Link>
    </div>
  );
}
