/** The tray glyph that marks the Inbox: the tasks filed in no list at all. */
export function InboxIcon({ className }: { className?: string }) {
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
      <path d="M4 13h4l1.5 2.5h5L16 13h4" />
      <path d="M6.5 5h11l3.5 8v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Z" />
    </svg>
  )
}
