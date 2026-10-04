/** Three bars of different lengths, for the progress bars beside the tasks (PROG-1). */
export function ProgressIcon({ className }: { className?: string }) {
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
      <path d="M4 12h10" />
      <path d="M4 18h6" />
    </svg>
  )
}
