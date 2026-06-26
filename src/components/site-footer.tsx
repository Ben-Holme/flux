"use client";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import Year from "@/components/year";

export default function SiteFooter() {
  const pathname = usePathname();
  if (pathname === "/pixeltest-map") return null;
  return (
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
        <Link href="/" className="transition-colors hover:text-white/60">About</Link>
        <Link href="/devlog" className="transition-colors hover:text-white/60">Devlog</Link>
        <Link href="/privacy-policy" className="transition-colors hover:text-white/60">Privacy Policy</Link>
      </nav>
      <p className="text-xs text-white/30">
        {"©"} Realspawn Studios,{" "}
        <Suspense fallback="2026"><Year /></Suspense>
      </p>
    </footer>
  );
}
