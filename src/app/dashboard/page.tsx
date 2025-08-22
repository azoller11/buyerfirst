import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import Link from "next/link";

export default async function Dashboard() {
  const session = await getSession();
  const me = session?.user?.email
    ? await db.user.findUnique({ where: { email: session.user.email } })
    : null;

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold">Welcome{me?.name ? `, ${me.name}` : ""}</h1>
      <div className="mt-4 space-x-4">
        <Link href="/listings/new" className="underline">+ Post a WTB</Link>
        <form className="inline" method="post" action="/api/auth/signout">
          <button className="underline">Sign out</button>
        </form>
      </div>
    </main>
  );
}
