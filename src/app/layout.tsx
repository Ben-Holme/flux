import type { Metadata } from "next";
import { Odibee_Sans, Inter } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import "./globals.css";
import Nav from "@/components/nav";
import Year from "@/components/year";

const odebeeSans = Odibee_Sans({
  variable: "--font-odibee",
  subsets: ["latin"],
  weight: ["400"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Unyha",
  description: "A medieval gothic online MMO RPG",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${odebeeSans.variable} ${inter.variable}`}>
      <body className="flex min-h-screen flex-col bg-void antialiased">
        <Suspense fallback={null}>
          <Nav />
        </Suspense>
        <main className="flex-1">{children}</main>
        <footer className="flex flex-col items-center justify-center gap-4 bg-black px-6 py-12">
          <a href="https://realspawn.com" target="_blank" rel="noopener noreferrer">
            <Image
              src="/img/RealspawnStudios.png"
              alt="Realspawn Studios"
              width={100}
              height={57}
              className="opacity-30"
            />
          </a>
          <nav className="flex gap-6 text-sm text-white/30">
            <Link href="/" className="transition-colors hover:text-white/60">
              About
            </Link>
            <Link href="/devlog" className="transition-colors hover:text-white/60">
              Devlog
            </Link>
            <Link href="/privacy-policy" className="transition-colors hover:text-white/60">
              Privacy Policy
            </Link>
          </nav>
          <p className="text-xs text-white/30">© Realspawn Studios, <Suspense fallback="2026"><Year /></Suspense></p>
        </footer>
      </body>
    </html>
  );
}
