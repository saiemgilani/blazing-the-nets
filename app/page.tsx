import { listSeasons, seasonLabel } from "@/lib/data/seasons.ts";

// Six hours, matching the release reads in lib/data (a literal: Next reads it statically).
export const revalidate = 21600;

export default async function Home() {
  const seasons = await listSeasons();
  return (
    <section>
      <h1 className="font-display text-3xl font-bold">Brooklyn Nets shooting</h1>
      <p className="mt-2 text-muted">
        Shot charts and splits for every season from {seasonLabel(seasons[0])} to {seasonLabel(seasons[seasons.length - 1])}.
      </p>
      <ul className="mt-6 flex flex-wrap gap-2" aria-label="Seasons">
        {seasons.toReversed().map((season) => (
          <li key={season} className="rounded border border-line bg-surface px-3 py-1 font-mono text-sm">
            {seasonLabel(season)}
          </li>
        ))}
      </ul>
    </section>
  );
}
