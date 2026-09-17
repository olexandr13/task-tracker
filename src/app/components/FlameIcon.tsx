/** The flame glyph that marks habits, and the streak that keeps one alight. */
export function FlameIcon({ className }: { className?: string }) {
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
      <path d="M12 3c.5 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.2 1.2-3.8 2.5-5 .2 1.8 1 3 2.5 3.5C11.2 9 11 6 12 3z" />
    </svg>
  )
}
