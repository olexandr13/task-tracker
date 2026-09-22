/**
 * The app's mark: the progress-ring icon (UI-39) beside the name. Drawn the same
 * way as the favicon, so the tile stays dark on light and dark screens alike.
 */
export function AppLogo({ className }: { className?: string }) {
  return (
    <div className={className ?? 'flex items-center gap-2.5 px-3'}>
      <AppIcon />
      <span className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
        PickMe
      </span>
    </div>
  )
}

/** The progress-ring icon alone, as the favicon draws it (UI-39): the sidebar's mark and the sign-in screen's. */
export function AppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={className ?? 'size-7 shrink-0 rounded-[0.4rem]'}
    >
      <rect width="64" height="64" rx="14" fill="#171717" />
      <circle cx="32" cy="32" r="20" fill="none" stroke="#404040" strokeWidth="6" />
      <circle
        cx="32"
        cy="32"
        r="20"
        fill="none"
        stroke="#3b82f6"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray="94 126"
        transform="rotate(-90 32 32)"
      />
      <path
        d="M24 32.5l5.5 5.5 11-11"
        fill="none"
        stroke="#fff"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
