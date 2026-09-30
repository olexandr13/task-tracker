/**
 * Relieved face — one task in front of you instead of all of them. Marks
 * Procrastination mode at rest, and the mode's own page while it is on.
 */
export function CalmIcon({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={className ?? 'inline-flex size-4 shrink-0 items-center justify-center text-base leading-none'}
    >
      😌
    </span>
  )
}
