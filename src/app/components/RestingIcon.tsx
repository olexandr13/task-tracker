/** Relieved face — a calm pause after a win in Procrastination mode. */
export function RestingIcon({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={className ?? 'inline-flex size-4 shrink-0 items-center justify-center text-base leading-none'}
    >
      😌
    </span>
  )
}
