/** Sparkles: suggestions from a language model (AI-1). */
export function AssistantIcon({ className }: { className?: string }) {
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
      <path d="M10 3.5 11.6 8a2 2 0 0 0 1.4 1.4l4.5 1.6-4.5 1.6a2 2 0 0 0-1.4 1.4L10 18.5 8.4 14a2 2 0 0 0-1.4-1.4L2.5 11 7 9.4A2 2 0 0 0 8.4 8z" />
      <path d="M19 2v4M21 4h-4M18 17v4M20 19h-4" />
    </svg>
  )
}
