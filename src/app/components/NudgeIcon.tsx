/** Bell — the app speaking up when the work goes quiet. Marks the Nudge mode. */
export function NudgeIcon({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={className ?? 'inline-flex size-4 shrink-0 items-center justify-center text-base leading-none'}
    >
      🔔
    </span>
  )
}
