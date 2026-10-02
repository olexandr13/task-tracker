/** An alarm clock — the top of the hour, and the question that comes with it. Marks the Check-in mode. */
export function CheckInIcon({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={className ?? 'inline-flex size-4 shrink-0 items-center justify-center text-base leading-none'}
    >
      ⏰
    </span>
  )
}
