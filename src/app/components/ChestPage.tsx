import { useState } from 'react'
import { CHEST_QUARTERS, chestQuarter, MIN_CHEST_POINTS, openChest, type ChestOpen, type ChestQuarter } from '../../core'
import {
  CHEST_SUMMARY,
  describeTally,
  PRACTICE_BAND,
  PRACTICE_HINT,
  PRACTICE_LABEL,
  PRACTICE_SKIP_LABEL,
  QUARTER_NAMES,
  RANGE_MOST,
  RANGE_MOST_HINT,
  RANGE_NOTHING_YET,
} from '../chestLabels'
import type { Chest as ChestState } from '../useChest'
import { Chest } from './Chest'
import { ChestRange } from './ChestRange'
import { InfoButton } from './InfoButton'
import { ModeSwitch } from './ModeSwitch'

const heading = 'text-sm font-medium text-neutral-700 dark:text-neutral-300'
const card = 'rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
const field =
  'w-20 min-w-0 rounded-lg border border-neutral-300 bg-transparent px-2 py-1 text-center text-sm tabular-nums text-neutral-900 focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:text-neutral-100'

/** What a run of practice openings came to, so the odds can be eyed: every quarter about as often (CHST-10). */
interface Tally {
  readonly counts: Record<ChestQuarter, number>
  readonly points: number
}

const NOTHING_YET: Tally = {
  counts: { 1: 0, 2: 0, 3: 0, 4: 0 },
  points: 0,
}

/**
 * The chest's page: what it is, what it can give from least to most (CHST-26),
 * and the chest itself (CHST-22).
 *
 * The settings are not here — what the chest asks of a day and what its key
 * plays for are on Rules, with everything else that is one amount for the whole
 * account (RWD-39). What *is* here is the practice switch, which is about trying
 * the chest rather than about setting it.
 */
export function ChestPage({ chest }: { chest: ChestState }) {
  const [practising, setPractising] = useState(false)
  const [skipWait, setSkipWait] = useState(false)
  const [practiceJackpot, setPracticeJackpot] = useState(String(chest.jackpot))
  const [tally, setTally] = useState<Tally>(NOTHING_YET)

  const practiceFor = Math.max(1, Math.round(Number(practiceJackpot) || chest.jackpot))

  /** A practice opening: drawn the same way, written nowhere (CHST-21). */
  function practiseOpen(): ChestOpen {
    const opening = openChest(practiceFor)
    const quarter = chestQuarter(opening.points, opening.jackpot)
    setTally((before) => ({
      counts: { ...before.counts, [quarter]: before.counts[quarter] + 1 },
      points: before.points + opening.points,
    }))
    return opening
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex">
        <InfoButton label="The chest">
          <p>{CHEST_SUMMARY}</p>
          <h3 className="mt-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">{PRACTICE_LABEL}</h3>
          <p>{PRACTICE_HINT}</p>
        </InfoButton>
      </div>

      <ChestRange
        jackpot={practising ? practiceFor : chest.jackpot}
        hint={
          practising
            ? null
            : chest.jackpot === MIN_CHEST_POINTS
              ? RANGE_NOTHING_YET
              : RANGE_MOST_HINT
        }
      />

      <div className="flex justify-center">
        <Chest
          // Keyed by which chest it is, so a practice opening is left behind
          // with practice: without it, the number from a practice run stays on
          // screen once the band has gone, where it reads as today's own.
          key={practising ? 'practice' : 'real'}
          blocked={practising ? null : chest.blocked}
          dayAsked={chest.dayAsked}
          leastTasks={chest.settings.leastTasks}
          openedPoints={practising ? null : (chest.opened?.points ?? null)}
          openedQuarter={practising ? null : chest.lastQuarter}
          sound={chest.sound}
          onSound={chest.setSound}
          onOpen={practising ? practiseOpen : chest.open}
          skipWait={practising && skipWait}
          band={practising ? PRACTICE_BAND : null}
        />
      </div>

      <section aria-label={PRACTICE_LABEL} className="flex flex-col gap-2">
        <h2 className={heading}>{PRACTICE_LABEL}</h2>
        <div className={`${card} flex flex-col gap-3 px-4 py-3.5`}>
          <ModeSwitch
            label={PRACTICE_LABEL}
            state={practising ? 'On' : 'Off'}
            checked={practising}
            blocked={null}
            onChange={(on) => {
              setPractising(on)
              setTally(NOTHING_YET)
              setPracticeJackpot(String(chest.jackpot))
            }}
          />

          {practising && (
            <div className="flex flex-col gap-3 border-t border-neutral-200 pt-3 dark:border-neutral-800">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                  {RANGE_MOST}
                  <input
                    type="number"
                    name="chest-practice-jackpot"
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
                    name="chest-skip-wait"
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
                  {[...CHEST_QUARTERS].reverse().map((quarter) => (
                    <li key={quarter} className="text-xs text-neutral-600 tabular-nums dark:text-neutral-400">
                      {`${QUARTER_NAMES[quarter]}: ${String(tally.counts[quarter])}`}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
