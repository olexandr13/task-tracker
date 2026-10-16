import { viewLabel, type View } from '../view'
import { ChevronIcon } from './ChevronIcon'

interface UpLinkProps {
  /** The page it goes back to (`upLinkOf`). */
  to: View
  onChange: (view: View) => void
}

/**
 * The way back to the page a goal's or a tag's tasks were opened from (UI-85): a
 * chevron pointing left and that page's name, atop the view where a section's
 * strip would be (UI-84). Back does the same (UI-37), but a phone's app has no
 * back button on screen, and a wide screen's sidebar is a long way across. A
 * thumb's height on a phone and compact on a wide screen (UI-49), and drawn as
 * the strip's pills are, so a page has one look for the way to its neighbours.
 */
export function UpLink({ to, onChange }: UpLinkProps) {
  const label = viewLabel(to)
  return (
    <button
      type="button"
      onClick={() => { onChange(to) }}
      aria-label={`Back to ${label}`}
      className="flex min-h-11 self-start items-center gap-1 rounded-full pr-3.5 pl-2 text-sm text-neutral-500 transition-colors [-webkit-tap-highlight-color:transparent] hover:bg-neutral-100 active:bg-neutral-100 md:min-h-8 md:pr-3 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:active:bg-neutral-800/60"
    >
      <ChevronIcon className="size-4 shrink-0 rotate-90" />
      {label}
    </button>
  )
}
