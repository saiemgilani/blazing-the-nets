"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * ESPN headshot (350x254), or the player's initials when the release has none or the image fails
 * to load (ESPN's CDN down or the file gone), never the browser's broken-image icon. `decorative`
 * when the name is already next to it (e.g. inside a link that carries it): alt="" so it is not
 * read twice.
 */
export function Headshot({ src, name, size = 96, decorative = false }: { src: string | null; name: string; size?: number; decorative?: boolean }) {
  const [failed, setFailed] = useState(false);
  const h = Math.round((size * 254) / 350);
  if (!src || failed) {
    const initials = name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 3);
    return (
      <div
        aria-hidden
        style={{ width: size, height: h }}
        className="flex shrink-0 items-center justify-center rounded bg-line font-display text-lg text-muted"
      >
        {initials}
      </div>
    );
  }
  // unoptimized: ESPN already serves small PNGs, and this keeps clear of Vercel's image-optimisation quota.
  // next/image re-fires an error that happened before hydration, so onError also covers a failed first load.
  return (
    <Image
      src={src}
      alt={decorative ? "" : name}
      width={size}
      height={h}
      unoptimized
      onError={() => setFailed(true)}
      className="shrink-0 rounded bg-line object-cover"
    />
  );
}
