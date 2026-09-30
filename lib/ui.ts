/** The pressed/unpressed toggle button every picker uses; `small` for the roster table's denser toolbar. */
export function toggleClass(active: boolean, small = false): string {
  return `rounded border ${small ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm"} ${active ? "border-fg bg-fg text-bg" : "border-line text-muted hover:text-fg"}`;
}
