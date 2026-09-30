export default function Loading() {
  return (
    <div role="status" className="animate-pulse space-y-4">
      <div className="h-8 w-64 rounded bg-surface" />
      <div className="h-4 w-96 max-w-full rounded bg-surface" />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-80 rounded-lg bg-surface" />
        <div className="h-80 rounded-lg bg-surface" />
      </div>
      <span className="sr-only">Loading release data…</span>
    </div>
  );
}
