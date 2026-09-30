import type { Metadata, Viewport } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site.ts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
};

export const viewport: Viewport = {
  colorScheme: "dark light",
  themeColor: "#0a0a0a",
};

const NAV = [
  { href: "/", label: "Home" },
  { href: "/players", label: "Players" },
  { href: "/teams", label: "Teams" },
  { href: "/scatter", label: "Scatter" },
  { href: "/leaders", label: "Leaders" },
  { href: "/about", label: "About" },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:rounded focus:bg-fg focus:px-3 focus:py-2 focus:text-bg"
        >
          Skip to content
        </a>
        <header className="border-b border-line">
          <div className="mx-auto flex max-w-6xl flex-wrap items-baseline justify-between gap-x-6 gap-y-2 px-4 py-4">
            <Link href="/" className="font-display text-2xl font-bold tracking-tight">
              Blazing the <span className="text-accent">Nets</span>
            </Link>
            <nav aria-label="Main" className="flex gap-4 text-sm">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="text-muted hover:text-fg">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-line">
          <p className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted">
            Created by Saiem Gilani. Data:{" "}
            <a href="https://github.com/sportsdataverse/sportsdataverse-data/releases" className="underline hover:text-fg">
              sportsdataverse-data releases
            </a>{" "}
            (stats.nba.com play-by-play shots, refreshed nightly). Not affiliated with the NBA or the Brooklyn Nets.
          </p>
        </footer>
      </body>
    </html>
  );
}
