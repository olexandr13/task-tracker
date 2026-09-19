/** The sun coming up over the horizon: the glyph for tomorrow. */
export function SunriseIcon({ className }: { className?: string }) {
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
      <path d="M12 3v6" />
      <path d="M9 6l3-3 3 3" />
      <path d="M16 18a4 4 0 0 0-8 0" />
      <path d="M4.9 11.9l1.4 1.4" />
      <path d="M19.1 11.9l-1.4 1.4" />
      <path d="M2 18h2" />
      <path d="M20 18h2" />
      <path d="M2 22h20" />
    </svg>
  )
}
