/** The pencil glyph that marks renaming something in place. */
export function PencilIcon({ className }: { className?: string }) {
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
      <path d="M4 20h4l11-11a2.5 2.5 0 0 0-4-4L4 16Z" />
      <path d="M14.5 6.5 17.5 9.5" />
    </svg>
  )
}
