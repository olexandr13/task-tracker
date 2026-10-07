import { type CaseOdds, type CaseSlot, type CaseSource } from '../../core'
import {
  describeNextCase,
  describeOpenCase,
  describeSourceRule,
  describeTasksLeftUnit,
  OPENED_TAG,
  SOURCE_LABEL,
  SOURCE_WAITING,
  TIMER_LABEL,
} from '../caseLabels'
import { CASE_STRIPE } from '../caseTones'
import { CaseArt } from './CaseArt'
import { CaseRange } from './CaseRange'
import { CaseLock } from './CaseLock'
import { CaseTag } from './CaseTag'
import { KeyTimer } from './KeyTimer'
import { TickIcon } from './TickIcon'

interface CaseCardsProps {
  /** What each case can pay. Practice passes the number typed in; a real day passes `caseSpan`. */
  ranges: Readonly<Record<CaseSource, CaseOdds>>
  slots: readonly CaseSlot[]
  /** While an opening is still on screen, another case does nothing (CHST-16). */
  busy: boolean
  /** Whether tasks without points are counted, which the rule under a ready case says (CHST-32). */
  countUnpaid: boolean
  onOpen: (source: CaseSource) => void
}

/**
 * The day's cases (CHST-28). A ready case is the button that opens it
 * (CHST-13): one press, and the cabinet appears for that opening. Nothing is
 * chosen first. A case that is planned and not yet — Today still has work
 * left, the daily case has not reached its time, or Weekly is waiting for
 * Monday — is shown half transparent, its crate grey, and a padlock on the
 * crate says when it will be ready: Payday how many tasks are left (CHST-31),
 * the Drop and Weekly a countdown (CHST-29, CHST-30).
 * One already opened stays until the day ends, with the lid up, the picture
 * dimmed and *Opened* on the crate where the padlock would be, and it is not
 * a button. Under it, the line says when the next one comes. The opened Drop
 * does not say at what time, and it says that earning more today raises the
 * next reward. Weekly is among them every day: planned until Monday, then
 * ready (CHST-30).
 *
 * The cards share their rows, so the names stay level (CHST-28). A possible
 * win sits inside a ready case, above the crate. While any case is ready,
 * every case keeps that band, so the crates stay level. The three sit in a
 * row once there is room; on a narrow screen Weekly wraps under the other two.
 */
export function CaseCards({ ranges, slots, busy, countUnpaid, onOpen }: CaseCardsProps) {
  if (slots.length === 0) return null

  // The win is only drawn on a ready case. The band stays on every case while
  // one of them is ready, so a crate without a win does not sit higher.
  const reserveWin = slots.some((slot) => slot.state === 'ready')
  const span = 'row-span-3'
  const shell = `${span} grid w-full min-w-0 grid-rows-subgrid rounded-2xl border border-transparent p-1.5 text-center`
  const wide = slots.length > 2

  return (
    <ul
      aria-label="Cases"
      className={`mx-auto grid w-full gap-x-3 gap-y-1.5 ${wide ? 'max-w-2xl grid-cols-2 sm:grid-cols-3' : 'max-w-md grid-cols-2'}`}
    >
      {slots.map((slot) => {
        const ready = slot.state === 'ready'
        const opened = slot.state === 'opened'
        const odds = ranges[slot.source]
        // Planned cases fade, and their crate loses its colour as well, so it
        // reads as shut rather than faint. What says when they will be ready
        // stays solid on top of it so it can still be read. An opened case
        // keeps its dark plate and dims the picture, so the open lid still
        // reads against it.
        const plateDim = ready || opened ? '' : 'opacity-50'
        const crateLook = ready ? '' : opened ? 'opacity-40' : 'opacity-40 grayscale'
        const textDim = ready ? '' : 'opacity-50'
        const caption = opened ? emphasizeToday(describeNextCase(slot.source)) : ready ? describeSourceRule(slot.source, countUnpaid) : waitingLine(slot.source)
        const tag = opened ? <OpenedTag /> : whenReady(slot)
        const body = (
          <>
            <span className="case-card-plate relative flex h-full w-full flex-col overflow-hidden rounded-xl">
              <span className={`absolute inset-0 bg-neutral-900 ${plateDim}`}>
                <span aria-hidden="true" className={`absolute inset-x-0 top-0 z-[1] h-1 ${CASE_STRIPE[slot.source]}`} />
              </span>
              {reserveWin && (
                <span className="case-card-head z-[2] mx-1.5 mt-2 flex h-10 shrink-0 items-center">
                  {ready && (
                    <span className="case-card-win flex h-full w-full items-center">
                      <CaseRange odds={odds} />
                    </span>
                  )}
                </span>
              )}
              <span className={`relative z-[1] flex flex-1 items-center px-[8%] ${reserveWin ? 'mt-1 mb-[8%]' : 'my-[8%]'}`}>
                <span className="relative aspect-[5/4] w-full">
                  <span className={`absolute inset-0 ${crateLook}`}>
                    <CaseArt state={opened ? 'open' : 'shut'} />
                  </span>
                </span>
                {tag !== null && (
                  <span className="case-card-tag absolute inset-0 flex items-center justify-center px-1.5">{tag}</span>
                )}
              </span>
            </span>
            <span className={`text-sm font-medium text-neutral-800 dark:text-neutral-100 ${textDim}`}>{SOURCE_LABEL[slot.source]}</span>
            <span className={`text-xs leading-snug text-neutral-500 dark:text-neutral-400 ${textDim}`}>{caption}</span>
          </>
        )

        return (
          <li key={slot.source} className={`grid min-w-0 grid-rows-subgrid ${span}`}>
            {ready ? (
              <button
                type="button"
                aria-disabled={busy || undefined}
                onClick={() => {
                  if (busy) return
                  onOpen(slot.source)
                }}
                className={`${shell} relative cursor-pointer outline-offset-2 transition-colors hover:bg-white hover:shadow-sm focus-visible:outline-2 focus-visible:outline-blue-500 dark:hover:bg-neutral-900`}
              >
                <span className="sr-only">{`${describeOpenCase(slot.source)}. `}</span>
                {body}
              </button>
            ) : (
              <div className={shell}>{body}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/**
 * The padlock on a case still on its way, saying when it will be ready:
 * Payday how many tasks are left (CHST-31), the Drop and Weekly a countdown
 * (CHST-29, CHST-30). Nothing on a ready case; an opened one has its own tag.
 */
function whenReady(slot: CaseSlot) {
  if (slot.source !== 'today' && slot.at !== null) return <KeyTimer at={slot.at} label={TIMER_LABEL[slot.source]} />
  if (slot.tasksLeft !== undefined) return <TasksLeft tasks={slot.tasksLeft} />
  return null
}

/**
 * The tag on an opened case, where a planned one has its padlock (CHST-28),
 * so the case reads as had today rather than merely faint.
 */
function OpenedTag() {
  return (
    <CaseTag icon={<TickIcon className="size-3.5 shrink-0 text-emerald-400" />}>
      <span className="text-[13px] font-semibold text-neutral-100">{OPENED_TAG}</span>
    </CaseTag>
  )
}

/**
 * How many tasks are still between a planned Payday and being ready, under
 * its padlock as the timer is under the others'. It changes as tasks are
 * ticked, so there is no clock to watch.
 */
function TasksLeft({ tasks }: { tasks: number }) {
  return (
    <CaseLock>
      <span className="text-[13px] font-semibold text-amber-300 tabular-nums">{tasks}</span>{' '}
      <span className="text-[11px] text-neutral-300">{describeTasksLeftUnit(tasks)}</span>
    </CaseLock>
  )
}

/**
 * The line under a case still on its way. Today names the list to finish,
 * and that name is set apart so it reads as the list. The case itself is
 * called Payday.
 */
function waitingLine(source: CaseSource) {
  return emphasizeToday(SOURCE_WAITING[source])
}

/** Sets the list name apart wherever a line names it. */
function emphasizeToday(text: string) {
  const name = 'Today'
  const at = text.indexOf(name)
  if (at < 0) return text
  return (
    <>
      {text.slice(0, at)}
      <strong className="font-semibold text-neutral-800 dark:text-neutral-100">{name}</strong>
      {text.slice(at + name.length)}
    </>
  )
}
