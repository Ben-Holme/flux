import type { Metadata } from "next";
import { Cinzel, Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/nav";
import Year from "@/components/year";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
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
    <html lang="en" className={`${cinzel.variable} ${inter.variable}`}>
      <body className="flex min-h-screen flex-col bg-void text-parchment antialiased">
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border py-8 text-center text-sm text-ash">
          © <Year /> Unyha. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
