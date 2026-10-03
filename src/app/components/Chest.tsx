import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { chestQuarter, type ChestBlock, type ChestOpen, type ChestQuarter } from '../../core'
import { CHEST_READY, describeChestBlock, describeChestPoints, describeOpened, describeOutOf, describeSound } from '../chestLabels'
import { buildReel, reelTicks, type Reel } from '../chestReel'
import {
  hushChest,
  playLanded,
  playLatches,
  playPowerOn,
  playReelTick,
  playRefusal,
  playReveal,
  playSpinBed,
  playTick,
  playUnlock,
} from '../chestSound'
import {
  CHEST_COUNT_AT,
  CHEST_COUNT_MS,
  CHEST_LANDED_AT,
  CHEST_LATCH_AT,
  CHEST_POWER_AT,
  CHEST_PRESS_MS,
  CHEST_REFUSAL_MS,
  CHEST_REVEAL_AT,
  CHEST_SETTLED_AT,
  CHEST_SPIN_AT,
  CHEST_SPIN_MS,
  CHEST_UNLOCK_AT,
} from '../chestTiming'
import { CHEST_TONES, CHEST_UNKNOWN_TONE } from '../chestTones'
import { ChestArt, type CrateState } from './ChestArt'
import { ChestBurst } from './ChestBurst'
import { ChestReel, ChestSpotlight, type ReelPhase } from './ChestReel'
import { SpeakerIcon } from './SpeakerIcon'

/** Where the opening is (CHST-14): the crate's part, the reel's part, and the card out. */
type Stage = CrateState | 'power' | 'spinning' | 'landed' | 'open'

/** What the reel is doing at each stage it is on screen for. */
const REEL_PHASES: Partial<Record<Stage, ReelPhase>> = {
  power: 'power',
  spinning: 'spinning',
  landed: 'landed',
  open: 'off',
}

/**
 * The cabinet is a dark stage in either theme (CHST-25), as a jeweller's box is
 * lined dark whatever room it is opened in: light can only be seen to come out
 * of something against what is darker than itself. Its lining — gunmetal, a
 * pool of light from above, grit in the paint, hazard stripes along its foot —
 * is in `.chest-stage` in `src/styles.css`.
 */
const cabinet =
  'chest-stage relative isolate aspect-[6/5] w-full max-w-[40rem] overflow-hidden rounded-[1.75rem] ring-1 ring-black/20 sm:aspect-[16/10] dark:ring-white/10'

const lid =
  'absolute inset-0 z-[1] cursor-pointer rounded-[1.75rem] aria-disabled:cursor-default focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-amber-400 [-webkit-tap-highlight-color:transparent]'

/** Whether the device asks for less motion, which jsdom has no answer for. */
function wantsLessMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** A short tap, where the device has one to give. */
function buzz(pattern: number | number[]): void {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // A device that will not buzz is no reason to stop.
  }
}

/** Eases a count out, quick to start and slow to land, so the last few points are felt. */
function easeOut(through: number): number {
  return 1 - Math.pow(1 - through, 3)
}

interface ChestProps {
  /** Why there is nothing to open, or null while a key is waiting. */
  blocked: ChestBlock | null
  /** How many tasks Today asked for, and how many a key needs, for the refusal to say so. */
  dayAsked: number
  leastTasks: number
  /** What today's chest gave, where it is already open. */
  openedPoints: number | null
  /** Which quarter of the jackpot it came to, where this device saw it happen. */
  openedQuarter: ChestQuarter | null
  sound: boolean
  onSound: (on: boolean) => void
  /** Draws, records and hands back an opening — or null where there was nothing to open. */
  onOpen: () => ChestOpen | null
  /** Practice: the show is skipped, so thirty openings do not cost three minutes of it. */
  skipWait?: boolean
  /** What a practice opening is marked with under the chest, or null when it is real. */
  band?: string | null
}

/**
 * The chest, and the opening of it (CHST-14).
 *
 * **The chest is the button** (CHST-13): the whole cabinet takes the press, as
 * do Enter and Space. A press with no key behind it is **refused in place** —
 * the dial jerks, the lamp blinks red and the line under it says what would
 * earn one — rather than the crate being dimmed out of reach, which could not
 * say why it was dim (CHST-17).
 *
 * The opening is conducted here, beat by beat, from `chestTiming`: the crate
 * squashes as it is pressed, its dial turns and its latches go with a hiss; it
 * drops away and a screen comes on behind it; a reel of cards runs past a
 * marker, ticking, and slows to a crawl; a beat with the marker on one card —
 * and that card comes out of the screen onto a starburst in its own colour,
 * throwing sparks (`ChestBurst`), while the points count up.
 *
 * What the opening gives is drawn and written by `onOpen` before the first
 * frame (CHST-16), and the reel is built round it (`buildReel`), so nothing here
 * can change it: all of this is a replay. Asked for less motion, the card is
 * out **at once** (CHST-18) — the wait goes with the movement, there being no
 * point in sitting through a pause whose reason cannot be seen.
 */
export function Chest({
  blocked,
  dayAsked,
  leastTasks,
  openedPoints,
  openedQuarter,
  sound,
  onSound,
  onOpen,
  skipWait = false,
  band = null,
}: ChestProps) {
  const [stage, setStage] = useState<Stage>('shut')
  const [result, setResult] = useState<ChestOpen | null>(null)
  /** The strip of cards this opening runs, built round what it drew. */
  const [reel, setReel] = useState<Reel | null>(null)
  /** How many cards have crossed the marker so far, which flicks it each time. */
  const [ticks, setTicks] = useState(0)
  const [counted, setCounted] = useState(0)
  const [refused, setRefused] = useState(false)
  /** Whether this opening skipped the show: no reel, nothing thrown, nothing shaken. */
  const [quick, setQuick] = useState(false)
  /** How many cards this chest has seen come out, which names each burst so it plays afresh. */
  const [bursts, setBursts] = useState(0)
  /**
   * Whether the last card's burst is still to be shown. Cleared on the next
   * press, so what was thrown off one opening is never still falling over the
   * crate as it unlocks for the next.
   */
  const [bursting, setBursting] = useState(false)

  /**
   * Whether an opening is still being shown, from the press until the number
   * has counted and everything thrown has died away (`CHEST_SETTLED_AT`). The
   * chest takes no press meanwhile — not a refusal, not a sound, nothing — so a
   * second tap in the excitement can neither cut the show short nor, outside
   * practice, be refused in the middle of it (CHST-16).
   */
  const [busy, setBusy] = useState(false)

  const timers = useRef<number[]>([])

  useEffect(
    () => () => {
      for (const timer of timers.current) window.clearTimeout(timer)
      hushChest()
    },
    [],
  )

  // Turned off in the middle of the show, the noise stops there and then, the
  // drone and the tails included, rather than playing out what was lined up.
  useEffect(() => {
    if (!sound) hushChest()
  }, [sound])

  function after(ms: number, run: () => void): void {
    timers.current.push(window.setTimeout(run, ms))
  }

  function noise(play: () => void): void {
    if (sound) play()
  }

  /** The counting at the end, which is the only part whose length says anything. */
  function count(opening: ChestOpen): void {
    const ms = CHEST_COUNT_MS[chestQuarter(opening.points, opening.jackpot)]
    const steps = Math.max(1, Math.min(opening.points, 32))

    for (let step = 1; step <= steps; step++) {
      const through = step / steps
      after(CHEST_COUNT_AT + ms * through, () => {
        setCounted(Math.round(opening.points * easeOut(through)))
        noise(() => {
          playTick(through)
        })
      })
    }
  }

  function refuse(): void {
    setRefused(false)
    // A frame apart, so a second refusal straight after the first shakes again.
    window.requestAnimationFrame(() => {
      setRefused(true)
    })
    noise(playRefusal)
    buzz([30, 60, 30])
    after(CHEST_REFUSAL_MS, () => {
      setRefused(false)
    })
  }

  function press(): void {
    if (busy) return

    const opening = onOpen()
    if (opening === null) {
      refuse()
      return
    }
    const quarter = chestQuarter(opening.points, opening.jackpot)

    setResult(opening)
    setCounted(0)
    setTicks(0)
    setBursting(false)

    if (skipWait || wantsLessMotion()) {
      setQuick(true)
      setReel(null)
      setStage('open')
      setCounted(opening.points)
      noise(() => {
        playReveal(quarter)
      })
      return
    }

    const built = buildReel(opening)
    setReel(built)
    setQuick(false)
    setBusy(true)
    after(CHEST_SETTLED_AT, () => {
      setBusy(false)
    })

    setStage('pressed')
    noise(playUnlock)
    buzz(18)
    after(Math.max(CHEST_PRESS_MS, CHEST_UNLOCK_AT), () => {
      setStage('unlocking')
    })
    after(CHEST_LATCH_AT, () => {
      setStage('unlatched')
      noise(playLatches)
      buzz(24)
    })
    after(CHEST_POWER_AT, () => {
      setStage('power')
      noise(playPowerOn)
    })
    after(CHEST_SPIN_AT, () => {
      setStage('spinning')
      noise(() => {
        playSpinBed(CHEST_SPIN_MS)
      })
    })
    for (const at of reelTicks(built, CHEST_SPIN_MS)) {
      after(CHEST_SPIN_AT + at, () => {
        setTicks((before) => before + 1)
        noise(playReelTick)
      })
    }
    after(CHEST_LANDED_AT, () => {
      setStage('landed')
      noise(() => {
        playLanded(CHEST_REVEAL_AT - CHEST_LANDED_AT)
      })
      buzz(20)
    })
    after(CHEST_REVEAL_AT, () => {
      setStage('open')
      setBursts((before) => before + 1)
      setBursting(true)
      noise(() => {
        playReveal(quarter)
      })
      buzz(quarter === 4 ? [50, 40, 50, 40, 160] : [40, 30, 60])
    })
    count(opening)
  }

  // A chest opened earlier, come back to: the card out and glowing, nothing flying.
  const still = result === null && openedPoints !== null
  const resultQuarter = result === null ? null : chestQuarter(result.points, result.jackpot)
  const shownQuarter = still ? openedQuarter : resultQuarter
  const tone = shownQuarter === null ? (still ? CHEST_UNKNOWN_TONE : null) : CHEST_TONES[shownQuarter]
  const out = still || (result !== null && stage === 'open')
  const landed = result !== null && stage === 'open'
  const top = landed && resultQuarter === 4
  const crate: CrateState | null = !still && (stage === 'shut' || stage === 'pressed' || stage === 'unlocking' || stage === 'unlatched') ? stage : null
  const inviting = blocked === null && crate === 'shut'
  const phase = reel !== null && !quick ? REEL_PHASES[stage] : undefined

  const glow = { '--chest-glow': out && tone !== null ? tone.light : 'transparent' } as CSSProperties

  return (
    <div className="chest-frame flex w-full flex-col items-center gap-5">
      <div
        style={glow}
        className={[cabinet, out && 'chest-cabinet-open', refused && 'chest-refusal-shake', top && !quick && 'chest-shake']
          .filter(Boolean)
          .join(' ')}
      >
        {/* The light the card throws on the cabinet once it is out. */}
        <div aria-hidden="true" className={`chest-ambient ${out ? (still || quick ? 'chest-ambient-still' : 'chest-ambient-on') : ''}`} />
        {/* Dust turning in the light while the crate waits. */}
        {crate !== null && (
          <div aria-hidden="true" className="chest-dust">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        )}
        {/* The room going quiet round the screen while the reel runs. */}
        <div aria-hidden="true" className={`chest-vignette ${stage === 'spinning' || stage === 'landed' ? 'chest-vignette-on' : ''}`} />

        <button
          type="button"
          onClick={press}
          aria-label={blocked === null ? 'Open today’s chest' : 'Today’s chest'}
          // Not `disabled`: that would throw keyboard focus off the chest in the
          // middle of the show. Said to a screen reader instead, and ignored.
          aria-disabled={busy || undefined}
          className={lid}
        >
          {(crate !== null || stage === 'power') && !still && (
            <span className={`absolute inset-[7%] block ${stage === 'power' ? 'chest-crate-away' : ''}`}>
              <ChestArt state={crate ?? 'unlatched'} inviting={inviting} refused={refused} />
            </span>
          )}
        </button>

        {reel !== null && phase !== undefined && <ChestReel reel={reel} phase={phase} ticks={ticks} />}

        {out && (
          <ChestSpotlight
            key={`spot${String(bursts)}`}
            quarter={shownQuarter}
            points={still ? (openedPoints ?? 0) : (result?.points ?? 0)}
            arriving={!still && !quick}
            land={reel === null ? 0 : reel.winner + 0.5 - reel.to}
          />
        )}

        {bursting && !quick && <ChestBurst key={`burst${String(bursts)}`} quarter={resultQuarter} play={bursts} />}

        {/* The card coming out: a flash, and two rings of light going out from it. */}
        {bursting && !quick && (
          <div key={`flash${String(bursts)}`} aria-hidden="true" className="pointer-events-none absolute inset-0 z-[3]">
            <div className="chest-flash" />
            <div className="chest-shockwave" />
            <div className="chest-shockwave chest-shockwave-late" />
          </div>
        )}

        <div aria-hidden="true" className="chest-hazard" />

        <button
          type="button"
          onClick={() => {
            onSound(!sound)
          }}
          aria-label={describeSound(sound)}
          aria-pressed={sound}
          title={describeSound(sound)}
          className="absolute right-2.5 bottom-3.5 z-10 grid size-11 place-items-center rounded-full text-white/45 transition-colors hover:bg-white/10 hover:text-white/90 md:size-9"
        >
          <SpeakerIcon on={sound} className="size-5" />
        </button>
      </div>

      {/* Under the chest rather than over it, where it never covers the card. */}
      {band !== null && (
        <p className="rounded-full bg-neutral-900/90 px-3 py-1 text-[11px] font-semibold tracking-[0.08em] text-white uppercase dark:bg-white/90 dark:text-neutral-900">
          {band}
        </p>
      )}

      {/* What came of it, or what would earn a key. Spoken, so it is never only a colour. */}
      <div role="status" aria-live="polite" className="flex min-h-16 flex-col items-center justify-start text-center">
        {landed && tone !== null ? (
          <>
            <p key={`n${String(bursts)}`} className={`chest-number chest-type text-5xl font-bold tabular-nums ${tone.points}`}>
              {describeChestPoints(counted)}
            </p>
            {/* The card's colour has already shown how big it was; this says it to a screen reader. */}
            <p className="sr-only">{describeOutOf(result.points, result.jackpot)}</p>
          </>
        ) : blocked === 'opened' && openedPoints !== null ? (
          <>
            <p className={`text-2xl font-semibold tabular-nums ${(openedQuarter === null ? CHEST_UNKNOWN_TONE : CHEST_TONES[openedQuarter]).points}`}>
              {describeOpened(openedPoints)}
            </p>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{describeChestBlock('opened', dayAsked, leastTasks)}</p>
          </>
        ) : blocked !== null ? (
          <p className="max-w-xs text-sm text-neutral-500 dark:text-neutral-400">{describeChestBlock(blocked, dayAsked, leastTasks)}</p>
        ) : (
          <p className={`text-sm font-semibold tracking-[0.16em] text-amber-700 uppercase dark:text-amber-300 ${busy ? 'opacity-0' : 'chest-ready'}`}>
            {CHEST_READY}
          </p>
        )}
      </div>
    </div>
  )
}
