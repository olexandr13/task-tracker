import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { TickIcon } from './TickIcon'

/**
 * The box that ticks a task off, wherever a task can be ticked off — a row, a
 * habit's card, the head of a phone's sheet — so finishing something looks and
 * feels the same everywhere. It is drawn small on every screen, about the size of
 * the title beside it, so a list stays dense. On a phone it answers a touch well
 * past its edge — a thumb's 44 pixels square — and shrinks a touch while pressed
 * (UI-47).
 */
const completionBox =
  'relative grid size-5 shrink-0 place-items-center rounded-md border-2 transition before:absolute before:-inset-3 active:scale-90 md:before:hidden'

const completionBoxOn = `${completionBox} border-green-600 bg-green-600 text-white hover:border-green-700 hover:bg-green-700`

const completionBoxOff = `${completionBox} border-neutral-300 text-transparent hover:border-neutral-900 dark:border-neutral-600 dark:hover:border-neutral-300`

/**
 * Not done yet, but ready to be: the time it asks for is in. Green like a done
 * box and hollow like an open one, so it reads as an invitation to tick it off.
 */
const completionBoxReady = `${completionBox} border-green-600 text-green-600/60 hover:border-green-700 hover:text-green-700 dark:border-green-500 dark:text-green-500/60 dark:hover:border-green-400 dark:hover:text-green-400`

/** The flourish a tick lands with, drawn in `src/styles.css` (UI-65). */
const completionBoxLanding = 'completion-box-landing'

/**
 * How long a tick takes to land. The row holds its place for this long, ticked
 * but not yet done, so the flourish plays where the click was rather than
 * wherever the list carries the task next (UI-65). The same length is written
 * into the animation in `src/styles.css`; changing one means changing the other.
 */
const LANDING_MS = 500

/** Whether the device asks for less motion, which jsdom has no answer for. */
function wantsLessMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** What the box is called for a screen reader, which names its task (UI-12). */
function boxLabel(title: string, { done, ready, today }: { done: boolean; ready: boolean; today: boolean }): string {
  const mark = done ? 'as not done' : 'as done'
  const when = today ? ' today' : ''
  const why = !done && ready ? ': its time goal is reached' : ''
  return `Mark "${title}" ${mark}${when}${why}`
}

interface CompletionBoxProps {
  /** The task's title, which the box is named after for a screen reader. */
  title: string
  /** Whether the task reads as done as of now. */
  done: boolean
  /** Its time goal is met, so the box invites a tick (TIME-5). */
  ready?: boolean
  /** A habit's box, which speaks for today rather than for the task as a whole. */
  today?: boolean
  /**
   * Ticks the task off. Called when the tick has landed, not as it is clicked:
   * until then the task is untouched, which is what keeps its row where it is.
   */
  onComplete: () => void
  /** Takes the tick back. This happens at once — undoing something is quiet. */
  onUncomplete: () => void
  /**
   * Something else has taken the row over — a phone's open sheet — so the box is
   * out of reach of the pointer and the keyboard alike.
   */
  inert?: boolean
  /** Where the box sits and what room it leaves, which is the caller's. */
  className?: string
}

export function CompletionBox({
  title,
  done,
  ready = false,
  today = false,
  onComplete,
  onUncomplete,
  inert = false,
  className,
}: CompletionBoxProps) {
  /** A tick clicked but not yet landed: the box reads as done while it plays. */
  const [landing, setLanding] = useState(false)
  const timer = useRef<number | null>(null)
  /** The completion the timer owes, so leaving the screen pays it rather than dropping it. */
  const owed = useRef<(() => void) | null>(null)

  useEffect(
    () => () => {
      if (timer.current === null) return

      window.clearTimeout(timer.current)
      owed.current?.()
    },
    [],
  )

  function forget() {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
    owed.current = null
  }

  function land(complete: () => void) {
    setLanding(true)
    owed.current = complete
    timer.current = window.setTimeout(() => {
      forget()
      setLanding(false)
      complete()
    }, LANDING_MS)
  }

  /** What the box shows: a tick on its way counts, which is the point of it. */
  const ticked = done || landing

  return (
    <button
      type="button"
      onClick={(event: MouseEvent) => {
        // Ticking a task off is not engaging with it: the row stays as it was (UI-19).
        event.stopPropagation()

        if (landing) {
          // A second click takes back a tick that has not landed yet.
          forget()
          setLanding(false)
        } else if (done) {
          onUncomplete()
        } else if (wantsLessMotion()) {
          onComplete()
        } else {
          land(onComplete)
        }
      }}
      aria-pressed={ticked}
      aria-label={boxLabel(title, { done: ticked, ready, today })}
      title={!ticked && ready ? 'Time goal reached: ready to tick off' : undefined}
      aria-hidden={inert ? true : undefined}
      tabIndex={inert ? -1 : undefined}
      className={[ticked ? completionBoxOn : ready ? completionBoxReady : completionBoxOff, landing && completionBoxLanding, className]
        .filter(Boolean)
        .join(' ')}
    >
      <TickIcon className="size-4" />
    </button>
  )
}
