/** Stopping a timer: a square. */
export function StopIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className ?? 'size-4 shrink-0'}>
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  )
}
