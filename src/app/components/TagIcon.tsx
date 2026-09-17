/** The hash glyph that marks anything to do with tags — the `#` a tag is typed with. */
export function TagIcon({ className }: { className?: string }) {
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
      <path d="M5 9h15" />
      <path d="M4 15h15" />
      <path d="M10 3 8 21" />
      <path d="M16 3l-2 18" />
    </svg>
  )
}
