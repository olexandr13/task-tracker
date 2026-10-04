/** A shut case, for the Cases page wherever it is navigated to (CHST-22). */
export function CasesIcon({ className }: { className?: string }) {
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
      <path d="M4 10.5a4 4 0 0 1 8 0 4 4 0 0 1 8 0" />
      <path d="M3 10.5h18v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z" />
      <path d="M10 10.5h4v4h-4z" />
    </svg>
  )
}
