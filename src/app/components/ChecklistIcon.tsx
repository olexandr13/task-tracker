/** The ticked-lines glyph that marks anything to do with a task's checklist. */
export function ChecklistIcon({ className }: { className?: string }) {
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
      <path d="M3 6l2 2 3-3" />
      <path d="M3 17l2 2 3-3" />
      <path d="M12 6h9" />
      <path d="M12 18h9" />
    </svg>
  )
}
