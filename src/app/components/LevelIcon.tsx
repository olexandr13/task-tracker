/** The chevrons that mark the level: rank climbed one step at a time (LVL-1). */
export function LevelIcon({ className }: { className?: string }) {
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
      <path d="M6 20l6-4 6 4M6 14l6-4 6 4M6 8l6-4 6 4" />
    </svg>
  )
}
