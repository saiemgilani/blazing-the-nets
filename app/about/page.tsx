import type { Metadata } from "next";

export const metadata: Metadata = { title: "About", alternates: { canonical: "/about" } };

export default function About() {
  return (
    <article className="max-w-2xl space-y-4">
      <h1 className="font-display text-3xl font-bold">About</h1>
      <p>
        Blazing the Nets charts where the Brooklyn Nets, and every other NBA player and team, take their shots and how
        often they go in compared with the rest of the league. It started in 2021 as a React and d3 project and was
        rebuilt in 2026 on Next.js and d3 v7.
      </p>
      <p>
        Every number comes from public{" "}
        <a href="https://github.com/sportsdataverse/sportsdataverse-data/releases" className="text-accent underline">
          sportsdataverse-data
        </a>{" "}
        release files: stats.nba.com play-by-play shots, player season stats and ESPN headshots, refreshed nightly.
        Colours compare a player with the league at the same spot: red is above the league rate, blue is below.
      </p>
      <p>
        Seasons go back to 1997-98, when the franchise was the New Jersey Nets (Brooklyn from 2012-13). Before 2010-11
        the play-by-play records most layups, dunks and tip-ins at the centre of the hoop rather than where they were
        taken, so in those seasons the rim is one dense hex; zone and distance numbers are not affected. 1996-97 and
        earlier are left out because whole games have no shot locations.
      </p>
      <p>
        The views borrow ideas from Peter Beshai&apos;s{" "}
        <a href="https://buckets.peterbeshai.com" className="text-accent underline">Buckets</a>,{" "}
        <a href="https://scattershot.peterbeshai.com" className="text-accent underline">Scattershot</a> and{" "}
        <a href="https://shotline.peterbeshai.com" className="text-accent underline">Shotline</a>, and from{" "}
        <a href="https://databallr.com" className="text-accent underline">databallr</a>. This site is not affiliated with
        them, the NBA or the Brooklyn Nets.
      </p>
    </article>
  );
}
