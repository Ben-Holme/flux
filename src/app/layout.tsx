import type { Metadata, Viewport } from "next";
import { Odibee_Sans, Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Nav from "@/components/nav";
import SiteFooter from "@/components/site-footer";
import { AuthProvider } from "@/context/auth-context";

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
  title: {
    template: "%s | Unyha",
    default: "Unyha",
  },
  description: "A medieval gothic online MMO RPG",
  openGraph: {
    siteName: "Unyha",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${odebeeSans.variable} ${inter.variable}`}>
      <body className="flex min-h-screen flex-col bg-void antialiased">
        <AuthProvider>
          <Suspense fallback={null}>
            <Nav />
          </Suspense>
          <main className="flex-1">{children}</main>
          <Suspense fallback={null}><SiteFooter /></Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}
