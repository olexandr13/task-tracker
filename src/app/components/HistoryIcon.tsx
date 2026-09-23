/** The clock turned back that marks a history: what was earned and what was spent. */
export function HistoryIcon({ className }: { className?: string }) {
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
      <path d="M3.5 9a9 9 0 1 1-.4 5" />
      <path d="M3 4v5h5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  )
}
