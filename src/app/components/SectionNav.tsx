import { useEffect, useRef } from 'react'
import type { List } from '../../core'
import { sectionPagesShown, useFeaturesOff } from '../features'
import { VIEW_LABELS, viewLabel, type SectionView, type View } from '../view'
import { KeyWaitingMark } from './KeyWaitingMark'
import { ViewGlyph } from './ViewGlyph'

const pill =
  'flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-sm whitespace-nowrap transition-colors [-webkit-tap-highlight-color:transparent] md:min-h-8 md:px-3'
const pillOn = 'bg-neutral-200/80 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
const pillCount = 'shrink-0 text-xs tabular-nums text-neutral-400 dark:text-neutral-500'
const pillOff = 'text-neutral-500 hover:bg-neutral-100 active:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:active:bg-neutral-800/60'

/** How far in from the strip's edge a pill brought into it stops: the page's own margin, which the strip runs under (`-mx-4 px-4`). */
const STRIP_GUTTER = 16

interface SectionNavProps {
  section: SectionView
  view: View
  /** Every list there is, for the Lists strip to name the Inbox's neighbours. */
  lists?: readonly List[]
  /** How many tasks are still to do on a page, beside its pill: the Inbox and each list (LST-18). */
  counts?: Partial<Record<View, number>>
  /** Whether a key is waiting, which marks the Cases pill (CHST-22). */
  keyWaiting?: boolean
  onChange: (view: View) => void
}

/**
 * The way between the pages of a section (UI-84): Lists with the Inbox and
 * every list, Rewards with its pages (RWD-30), Modes with each mode (MODE-7),
 * Organize with Tags and the notes, and Reflect with Balance, the activity log
 * and the journal — in a strip across the top of whichever one is open, the
 * section's own page first and the one you are on marked. A phone has no
 * sidebar, so it is the way between them there; a wide screen has them under
 * the section in the sidebar too (UI-30), and the strip saves going back to it
 * to step from one to the next. Its pills are a thumb's height on a phone and
 * compact on a wide screen (UI-49). The Inbox's and each list's pill carries
 * how many of its tasks are still to do, as the Lists page does (LST-18), so a
 * list's own view says how much is in it.
 *
 * It scrolls sideways rather than wrapping: a pill or two beyond the width of a
 * phone is a sideways nudge away, and a second line would push the page itself
 * down. A list's name, however long, is cut short rather than widening its pill
 * past the rest. A page switched off has no pill (FEAT-2), and a section left
 * with nothing under it has no strip: one pill goes nowhere.
 */
export function SectionNav({ section, view, lists = [], counts = {}, keyWaiting = false, onChange }: SectionNavProps) {
  const pages = sectionPagesShown(section, useFeaturesOff(), lists)
  const strip = useRef<HTMLElement>(null)

  // The pill of the page just opened is brought into the strip, so the page you
  // are on is never one scrolled out of sight past the edge of a phone (UI-84).
  // Only the strip moves sideways: the page itself still opens at its top (UI-80).
  useEffect(() => {
    const nav = strip.current
    if (nav === null) return
    const pill = nav.querySelector('[aria-current="page"]')
    if (pill === null) return
    const edge = nav.getBoundingClientRect()
    const box = pill.getBoundingClientRect()
    if (box.right > edge.right - STRIP_GUTTER) nav.scrollLeft += box.right - edge.right + STRIP_GUTTER
    else if (box.left < edge.left + STRIP_GUTTER) nav.scrollLeft -= edge.left + STRIP_GUTTER - box.left
  }, [view])

  if (pages.length < 2) return null

  return (
    <nav
      ref={strip}
      aria-label={VIEW_LABELS[section]}
      className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {/* As wide as its pills, not the strip, so the strip's margin is still there past the last of them. */}
      <ul className="flex w-max gap-1">
        {pages.map((page) => {
          const active = view === page
          const label = viewLabel(page, lists)
          const count = counts[page] ?? 0
          return (
            <li key={page}>
              <button
                type="button"
                onClick={() => { onChange(page) }}
                aria-current={active ? 'page' : undefined}
                aria-label={count > 0 ? `${label}: ${String(count)} to do` : undefined}
                className={`${pill} ${active ? pillOn : pillOff}`}
              >
                <ViewGlyph view={page} />
                <span className="max-w-40 truncate">{label}</span>
                {count > 0 && (
                  <span aria-hidden="true" className={pillCount}>
                    {count}
                  </span>
                )}
                {page === 'rewards/cases' && keyWaiting && <KeyWaitingMark />}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
