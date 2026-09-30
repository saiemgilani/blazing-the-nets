"use client";

/** Any failure below the layout: almost always a release file that could not be read. */
export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <section className="space-y-3">
      <h1 className="font-display text-3xl font-bold">Release data unavailable</h1>
      <p className="text-muted">
        The sportsdataverse-data release files could not be read just now. This is usually temporary.
      </p>
      <button type="button" onClick={() => retry()} className="rounded border border-line px-3 py-1 hover:text-accent">
        Try again
      </button>
    </section>
  );
}
