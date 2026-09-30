import type { ReactNode } from "react";

export function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-lg border border-line bg-surface p-4">
      <h2 className="mb-3 font-display text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}
