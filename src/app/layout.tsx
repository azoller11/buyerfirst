import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Providers from "@/components/Providers";
import UserMenu from "@/components/UserMenu";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BuyerFirst",
  description: "A reverse marketplace — buyers post what they want, sellers respond.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <Providers>
          <nav className="p-4 border-b">
            <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Link href="/">Home</Link>
                <Link href="/dashboard">Dashboard</Link>
                <Link href="/listings">Browse</Link>
                <Link href="/listings/new">Post WTB</Link>
              </div>
              <UserMenu />
            </div>
          </nav>
          {children}
        </Providers>
      </body>
    </html>
  );
}
