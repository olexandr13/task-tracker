import { useEffect, useRef, useState } from 'react'
import {
  CASE_FOR_SOURCE,
  CASE_QUARTERS,
  caseQuarter,
  oddsForSpan,
  openCase,
  type CaseOdds,
  type CaseSlot,
  type CaseSource,
  type CaseOpen,
  type CaseQuarter,
  type OpenedCase,
} from '../../core'
import { CASE_LEAVE_MS, CASE_LINGER_MS, CASE_RESULT_HOLD_MS } from '../caseTiming'
import {
  CASES_RULES_HEADING,
  describeCasePoints,
  describePointsUnit,
  describeTally,
  OPENED_TODAY_LABEL,
  PRACTICE_BAND,
  PRACTICE_JACKPOT_LABEL,
  PRACTICE_LABEL,
  PRACTICE_OFF_LABEL,
  PRACTICE_ON,
  PRACTICE_SKIP_LABEL,
  QUARTER_NAMES,
  SOURCE_LABEL,
} from '../caseLabels'
import { CASE_STRIPE } from '../caseTones'
import { panelScrollMargin } from '../panelControls'
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
 * once the show has finished (CHST-13, CHST-22, CHST-25). Under the cases,
 * what each one opened today gave (CHST-33).
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
  /** The show whose cabinet is on its way out. A later press is a new show, so it never inherits this. */
  const [leaving, setLeaving] = useState<number | null>(null)
  const [practiceSeen, setPracticeSeen] = useState(practising)
  const shows = useRef(0)
  /** Takes the cabinet down once the show is over, without cutting a later opening short. */
  const dismissTimer = useRef<number | null>(null)
  const stage = useRef<HTMLDivElement>(null)

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

  // The cabinet comes in under the cases, which on a phone is below the fold:
  // each press brings it up, clear of the bottom bar, so the reel is watched
  // rather than heard (CHST-13).
  const showId = performance?.id ?? null
  useEffect(() => {
    const cabinet = stage.current
    // A test's page has no layout, and so no way to scroll.
    if (showId === null || cabinet === null || typeof cabinet.scrollIntoView !== 'function') return
    cabinet.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }, [showId])

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
  // An opening is in the ledger from the press (CHST-16), so its row waits for
  // the reel to stop rather than saying first what the show is about to.
  // Practice opens every case afresh, and lists none of the day's.
  const playing = busy && performance !== null ? performance.source : null
  const openings = practising ? [] : cases.openings.filter((opening) => opening.source !== playing)

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
   * The show is over. Another case can be opened. The result stays a moment
   * more to be read — longer where there was no reel to watch it arrive — then
   * the cabinet switches off and the room it took closes up (CHST-25).
   */
  function finishShow(id: number): void {
    setBusy(false)
    clearDismiss()
    const pause = (practising && skipWait) || prefersReducedMotion() ? CASE_RESULT_HOLD_MS : CASE_LINGER_MS
    dismissTimer.current = window.setTimeout(() => {
      setLeaving(id)
      dismissTimer.current = window.setTimeout(() => {
        dismissTimer.current = null
        setPerformance((current) => (current?.id === id ? null : current))
      }, CASE_LEAVE_MS)
    }, pause)
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
        // A grid of one row, so the room the cabinet takes can close up as it
        // leaves rather than the page jumping (CHST-25).
        <div ref={stage} className={`grid ${panelScrollMargin} ${leaving === performance.id ? 'case-closing' : ''}`}>
          <div className="flex min-h-0 justify-center">
            <CaseOpening
              // Keyed by the press, so the next case starts a fresh show, and a
              // practice opening is left behind once practice is turned off.
              key={performance.id}
              script={performance.opening}
              caseKind={CASE_FOR_SOURCE[performance.source]}
              blocked={null}
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
              leaving={leaving === performance.id}
            />
          </div>
        </div>
      )}

      {openings.length > 0 && <OpenedToday openings={openings} />}

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

/**
 * What each case opened today gave (CHST-33), banded down its side in the
 * case's colour as its card is (CHST-28). Today's only, and only to read:
 * every day's is on History, where a row can be deleted (RWD-44).
 */
function OpenedToday({ openings }: { openings: readonly OpenedCase[] }) {
  return (
    <section aria-label={OPENED_TODAY_LABEL} className="flex flex-col gap-2">
      <h2 className={heading}>{OPENED_TODAY_LABEL}</h2>
      <ul className="flex flex-col gap-1">
        {openings.map((opening) => (
          <li
            key={opening.source}
            className={`${card} relative flex items-center justify-between gap-3 overflow-hidden py-2 pr-4 pl-5 text-sm`}
          >
            <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${CASE_STRIPE[opening.source]}`} />
            <span className="min-w-0 text-neutral-900 dark:text-neutral-100">{SOURCE_LABEL[opening.source]}</span>
            <span className="shrink-0 text-emerald-700 tabular-nums dark:text-emerald-400">
              {describeCasePoints(opening.points)}
              <span className="sr-only">{` ${describePointsUnit(opening.points)}`}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
