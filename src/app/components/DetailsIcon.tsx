/** Two rows, each with a shorter line under it: a task and what it holds, spelled out. */
export function DetailsIcon({ className }: { className?: string }) {
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
      <path d="M4 5h16" />
      <path d="M12 9h8" strokeWidth="1.5" />
      <path d="M4 15h16" />
      <path d="M12 19h8" strokeWidth="1.5" />
    </svg>
  )
}
