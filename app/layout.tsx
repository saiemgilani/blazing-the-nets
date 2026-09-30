import type { Metadata, Viewport } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blazing the Nets",
  description:
    "Brooklyn Nets shooting dashboards: hex shot charts, shooting signatures and distance and side splits from NBA play-by-play.",
  icons: { icon: "/nets.ico" },
};

export const viewport: Viewport = {
  colorScheme: "dark light",
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col antialiased">
        <header className="border-b border-line">
          <div className="mx-auto flex max-w-6xl items-baseline justify-between px-4 py-4">
            <Link href="/" className="font-display text-2xl font-bold tracking-tight">
              Blazing the <span className="text-accent">Nets</span>
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-line">
          <p className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted">
            Created by Saiem Gilani. Data from the sportsdataverse-data releases. Not affiliated with the NBA or the
            Brooklyn Nets.
          </p>
        </footer>
      </body>
    </html>
  );
}
