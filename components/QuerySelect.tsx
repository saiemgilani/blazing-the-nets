"use client";

import { useRouter } from "next/navigation";

/**
 * A <select> that navigates to `basePath?name=value` (keeping `params`), e.g. the season or team
 * switcher. Options and labels come from the server so no data code reaches the client bundle.
 */
export function QuerySelect({
  label,
  name,
  value,
  options,
  basePath,
  params = {},
}: {
  label: string;
  name: string;
  value: string;
  options: { value: string; label: string }[];
  basePath: string;
  params?: Record<string, string>;
}) {
  const router = useRouter();
  return (
    <label className="inline-flex items-center gap-2 text-sm text-muted">
      {label}
      <select
        name={name}
        value={value}
        onChange={(e) => router.push(`${basePath}?${new URLSearchParams({ ...params, [name]: e.target.value })}`)}
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
