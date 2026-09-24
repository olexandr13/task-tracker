/**
 * The mark inside a box that is ticked off. Drawn thick, with rounded ends, like the
 * tick in ✅ rather than the thin ✓ of a font, so it still reads as a tick at the size
 * a row draws its box (UI-64).
 */
export function TickIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className ?? 'size-4 shrink-0'}
    >
      <path d="M5 12l4.5 4.5L19 7" />
    </svg>
  )
}
