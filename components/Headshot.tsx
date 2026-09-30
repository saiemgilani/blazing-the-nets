import Image from "next/image";

/** ESPN headshot (350x254) or the player's initials when the release has none. */
export function Headshot({ src, name, size = 96 }: { src: string | null; name: string; size?: number }) {
  const h = Math.round((size * 254) / 350);
  if (!src) {
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
  return <Image src={src} alt={name} width={size} height={h} unoptimized className="shrink-0 rounded bg-line object-cover" />;
}
