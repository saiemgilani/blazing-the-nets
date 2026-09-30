"use client";

import { useRouter } from "next/navigation";
import { withParams } from "@/lib/links.ts";

/**
 * A <select> that navigates to `basePath?name=value` (keeping `params`), e.g. the season or team
 * switcher. Params equal to their `defaults` entry are left out, so choosing the current season
 * lands on the canonical, prerendered URL. Options and labels come from the server.
 */
export function QuerySelect({
  label,
  name,
  value,
  options,
  basePath,
  params = {},
  defaults = {},
}: {
  label: string;
  name: string;
  value: string;
  options: { value: string; label: string }[];
  basePath: string;
  params?: Record<string, string>;
  defaults?: Record<string, string>;
}) {
  const router = useRouter();
  return (
    <label className="inline-flex items-center gap-2 text-sm text-muted">
      {label}
      <select
        name={name}
        value={value}
        onChange={(e) => router.push(withParams(basePath, { ...params, [name]: e.target.value }, defaults))}
        className="rounded border border-line bg-surface px-2 py-1 text-fg"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
