/** Play-to-the-end: the glyph for passing over one occurrence of a repeating task. */
export function SkipIcon({ className }: { className?: string }) {
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
      <path d="M6 5l10 7-10 7z" />
      <path d="M19 5v14" />
    </svg>
  )
}
