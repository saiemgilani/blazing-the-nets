import Link from "next/link";

export default function NotFound() {
  return (
    <section className="space-y-3">
      <h1 className="font-display text-3xl font-bold">Not found</h1>
      <p className="text-muted">No player or team with that id took a shot in that season.</p>
      <p>
        <Link href="/players" className="text-accent underline">
          Browse players
        </Link>{" "}
        or{" "}
        <Link href="/teams" className="text-accent underline">
          teams
        </Link>
        .
      </p>
    </section>
  );
}
