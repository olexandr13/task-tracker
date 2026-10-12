/** One, two, three, each with its line: a numbered list (NOTE-7). */
export function NumberedListIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className ?? 'size-4 shrink-0'}
    >
      <path d="M10 6h10" />
      <path d="M10 12h10" />
      <path d="M10 18h10" />
      <path d="M4 5l1.5-1v5" />
      <path d="M3.5 14.5a1.5 1.5 0 0 1 3 .2c0 .7-3 2.3-3 3.3h3" strokeWidth="1.5" />
    </svg>
  )
}
