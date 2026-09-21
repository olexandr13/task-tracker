/** Melting face — putting things off until you melt. Marks Procrastination mode. */
export function ProcrastinationIcon({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={className ?? 'inline-flex size-4 shrink-0 items-center justify-center text-base leading-none'}
    >
      🫠
    </span>
  )
}
