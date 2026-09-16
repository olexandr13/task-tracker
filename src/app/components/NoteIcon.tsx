/** The lines-of-text glyph that marks anything to do with a task's description. */
export function NoteIcon({ className }: { className?: string }) {
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
      <path d="M4 6h16" />
      <path d="M4 11h16" />
      <path d="M4 16h9" />
    </svg>
  )
}
