"use client";

import { useState, type ReactNode } from "react";

/**
 * Below 640 px the content starts collapsed behind a button (long sections make the phone page
 * very tall); at 640 px and up it is always shown and the button is hidden. Hidden charts measure
 * 0 px and draw once they are shown.
 */
export function MobileCollapse({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="mb-3 rounded border border-line px-3 py-1 text-sm text-muted hover:text-fg sm:hidden"
      >
        {open ? "Hide" : label}
      </button>
      <div className={open ? "block" : "hidden sm:block"}>{children}</div>
    </div>
  );
}
