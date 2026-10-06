import { useEffect, useRef, useState } from 'react'
import { CASE_FOR_SOURCE, CASE_QUARTERS, caseQuarter, oddsForSpan, openCase, type CaseOdds, type CaseSlot, type CaseSource, type CaseOpen, type CaseQuarter } from '../../core'
import { CASE_RESULT_HOLD_MS } from '../caseTiming'
import {
  CASES_RULES_HEADING,
  describeTally,
  PRACTICE_BAND,
  PRACTICE_JACKPOT_LABEL,
  PRACTICE_LABEL,
  PRACTICE_OFF_LABEL,
  PRACTICE_ON,
  PRACTICE_SKIP_LABEL,
  QUARTER_NAMES,
} from '../caseLabels'
import type { Cases as CasesState } from '../useCases'
import { CaseOpening } from './CaseOpening'
import { CaseCards } from './CaseCards'
import { CaseRules } from './CaseRules'
import { InfoButton } from './InfoButton'

const heading = 'text-sm font-medium text-neutral-700 dark:text-neutral-300'
const card = 'rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
const action =
  'shrink-0 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800'
const field =
  'w-20 min-w-0 rounded-lg border border-neutral-300 bg-transparent px-2 py-1 text-center text-sm tabular-nums text-neutral-900 focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:text-neutral-100'

/** What a run of practice openings came to, so the odds can be eyed: every quarter about as often (CHST-10). */
interface Tally {
  readonly counts: Record<CaseQuarter, number>
  readonly points: number
}

const NOTHING_YET: Tally = {
  counts: { 1: 0, 2: 0, 3: 0, 4: 0 },
  points: 0,
}

/** Whether the device asks for less motion. The opening then has no reel to wait out (CHST-18). */
function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** One press of a case, and the opening it drew, so the cabinet can play it. */
interface Show {
  readonly id: number
  readonly source: CaseSource
  readonly opening: CaseOpen
}

interface CasesPageProps {
  cases: CasesState
  /** Whether practice is on, which is switched on Settings (CHST-21). */
  practising: boolean
  onPractisingChange: (practising: boolean) => void
}

/**
 * Cases' page: what it is, and the cases for today — ready, still on their
 * way, or opened and kept until the day ends (CHST-26, CHST-28). Pressing a
 * ready case opens it, and the cabinet appears for that opening, then leaves
 * once the show has finished (CHST-13, CHST-22, CHST-25).
 *
 * The settings are not here — what Cases asks of a day and what its key
 * plays for are on Rules, with everything else that is one amount for the whole
 * account (RWD-39) — and nor is the practice switch, which is on Settings. While
 * practice is on, what it is played for and how the run has gone are here, by
 * Cases they are about, with the way to turn it off.
 */
export function CasesPage({ cases, practising, onPractisingChange }: CasesPageProps) {
  const [skipWait, setSkipWait] = useState(false)
  const [practiceJackpot, setPracticeJackpot] = useState(String(cases.jackpot))
  const [tally, setTally] = useState<Tally>(NOTHING_YET)
  /** The opening a case was just pressed for. The cabinet exists only while this show is up. */
  const [performance, setPerformance] = useState<Show | null>(null)
  /** True from the press until the show has settled, so a second case does nothing meanwhile (CHST-16). */
  const [busy, setBusy] = useState(false)
  const [practiceSeen, setPracticeSeen] = useState(practising)
  const shows = useRef(0)
  /** Takes the cabinet down once the show is over, without cutting a later opening short. */
  const dismissTimer = useRef<number | null>(null)

  function clearDismiss(): void {
    if (dismissTimer.current === null) return
    window.clearTimeout(dismissTimer.current)
    dismissTimer.current = null
  }

  useEffect(
    () => () => {
      if (dismissTimer.current !== null) window.clearTimeout(dismissTimer.current)
    },
    [],
  )

  // Practice turned off: the show it left on screen is not today's case.
  if (practiceSeen !== practising) {
    setPracticeSeen(practising)
    if (!practising) {
      setPerformance(null)
      setBusy(false)
    }
  }

  const practiceFor = Math.max(1, Math.round(Number(practiceJackpot) || cases.jackpot))
  const practiceRange = oddsForSpan({ least: 1, most: practiceFor })
  const ranges: Readonly<Record<CaseSource, CaseOdds>> = practising
    ? { today: practiceRange, daily: practiceRange, week: practiceRange }
    : {
        today: oddsForSpan(cases.spans.today),
        daily: oddsForSpan(cases.spans.daily),
        week: oddsForSpan(cases.spans.week),
      }
  // Practice spends nothing, so every case is ready to try, Weekly included,
  // without waiting for Monday. Otherwise the day shows the cases it holds,
  // including one already opened and Weekly while it is only planned.
  const slots: readonly CaseSlot[] = practising
    ? [
        { source: 'today', state: 'ready', at: null },
        { source: 'daily', state: 'ready', at: null },
        { source: 'week', state: 'ready', at: null },
      ]
    : cases.slots

  /** A practice opening of one case: drawn the same way, written nowhere (CHST-21). */
  function drawPractice(source: CaseSource): CaseOpen {
    const opening = openCase(CASE_FOR_SOURCE[source], practiceFor)
    const quarter = caseQuarter(opening.points, opening.jackpot)
    setTally((before) => ({
      counts: { ...before.counts, [quarter]: before.counts[quarter] + 1 },
      points: before.points + opening.points,
    }))
    return opening
  }

  /** Opens the case that was pressed. The cabinet then plays what was drawn. */
  function openSource(source: CaseSource): void {
    if (busy) return
    const opening = practising ? drawPractice(source) : cases.open(source)
    if (opening === null) return
    clearDismiss()
    shows.current += 1
    setBusy(true)
    setPerformance({ id: shows.current, source, opening })
  }

  /**
   * The show is over. Another case can be opened. The cabinet leaves now,
   * except where there was no reel: that result stays long enough to be read
   * (CHST-25).
   */
  function finishShow(id: number): void {
    setBusy(false)
    clearDismiss()
    const pause = (practising && skipWait) || prefersReducedMotion() ? CASE_RESULT_HOLD_MS : 0
    const leave = () => {
      dismissTimer.current = null
      setPerformance((current) => (current?.id === id ? null : current))
    }
    if (pause === 0) {
      leave()
      return
    }
    dismissTimer.current = window.setTimeout(leave, pause)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex">
        <InfoButton label="Cases" heading={CASES_RULES_HEADING}>
          <CaseRules countUnpaid={cases.settings.countUnpaid} />
        </InfoButton>
      </div>

      <CaseCards
        ranges={ranges}
        slots={slots}
        busy={busy}
        countUnpaid={cases.settings.countUnpaid}
        onOpen={openSource}
      />

      {performance !== null && (
        <div className="flex justify-center">
          <CaseOpening
            // Keyed by the press, so the next case starts a fresh show, and a
            // practice opening is left behind once practice is turned off.
            key={performance.id}
            script={performance.opening}
            caseKind={CASE_FOR_SOURCE[performance.source]}
            blocked={null}
            dayAsked={cases.dayAsked}
            leastTasks={cases.settings.leastTasks}
            openedPoints={null}
            openedQuarter={null}
            sound={cases.sound}
            onSound={cases.setSound}
            onOpen={() => null}
            onSettled={() => {
              finishShow(performance.id)
            }}
            skipWait={practising && skipWait}
            band={practising ? PRACTICE_BAND : null}
          />
        </div>
      )}

      {practising && (
        <section aria-label={PRACTICE_LABEL} className="flex flex-col gap-2">
          <h2 className={heading}>{PRACTICE_LABEL}</h2>
          <div className={`${card} flex flex-col gap-3 px-4 py-3.5`}>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <p className="text-sm text-neutral-700 dark:text-neutral-300">{PRACTICE_ON}</p>
              <button
                type="button"
                onClick={() => {
                  clearDismiss()
                  onPractisingChange(false)
                  setTally(NOTHING_YET)
                  setPerformance(null)
                  setBusy(false)
                }}
                className={action}
              >
                {PRACTICE_OFF_LABEL}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-neutral-200 pt-3 dark:border-neutral-800">
              <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                {PRACTICE_JACKPOT_LABEL}
                <input
                  type="number"
                  name="case-practice-jackpot"
                  inputMode="numeric"
                  min={1}
                  value={practiceJackpot}
                  onChange={(event) => {
                    setPracticeJackpot(event.target.value)
                  }}
                  className={field}
                />
                points
              </label>
              <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                <input
                  type="checkbox"
                  name="case-skip-wait"
                  checked={skipWait}
                  onChange={(event) => {
                    setSkipWait(event.target.checked)
                  }}
                  className="size-4 accent-blue-600"
                />
                {PRACTICE_SKIP_LABEL}
              </label>
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{describeTally(tally.counts, tally.points)}</p>
              <ul className="flex flex-wrap gap-x-4 gap-y-1">
                {[...CASE_QUARTERS].reverse().map((quarter) => (
                  <li key={quarter} className="text-xs text-neutral-600 tabular-nums dark:text-neutral-400">
                    {`${QUARTER_NAMES[quarter]}: ${String(tally.counts[quarter])}`}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
