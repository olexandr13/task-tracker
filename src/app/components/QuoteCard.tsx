import type { Quote } from '../../core'

interface QuoteCardProps {
  /** Null until today's quote has been settled on. */
  quote: Quote | null
}

/** Today's quote, sat below the progress bars in the rail. */
export function QuoteCard({ quote }: QuoteCardProps) {
  if (quote === null) {
    return null
  }

  return (
    <figure
      lang={quote.language}
      className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3.5 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <blockquote className="text-sm leading-relaxed text-balance text-neutral-700 dark:text-neutral-300">
        {quote.text}
      </blockquote>
      <figcaption className="text-xs text-neutral-500 dark:text-neutral-400">— {quote.author}</figcaption>
    </figure>
  )
}
