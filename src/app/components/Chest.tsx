import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { CHEST_TIERS, type ChestBlock, type ChestOpen, type ChestTier } from '../../core'
import { CHEST_READY, describeChestBlock, describeChestPoints, describeOpened, describeSound, TIER_NAMES, TIER_NOTES } from '../chestLabels'
import { playBurst, playHeld, playKey, playRattle, playRefusal, playTick } from '../chestSound'
import {
  CHEST_BURST_AT,
  CHEST_COLOUR_AT,
  CHEST_COUNT_AT,
  CHEST_COUNT_MS,
  CHEST_HELD_AT,
  CHEST_PRESS_MS,
  CHEST_RATTLES,
  CHEST_REFUSAL_MS,
  CHEST_SEAM_AT,
  CHEST_SETTLED_AT,
} from '../chestTiming'
import { CHEST_TONES } from '../chestTones'
import { ChestArt, type ChestState } from './ChestArt'
import { ChestBurst } from './ChestBurst'
import { SpeakerIcon } from './SpeakerIcon'

/**
 * The cabinet is a dark stage in either theme (CHST-25), as a jeweller's box is
 * lined dark whatever room it is opened in: light can only be seen to come out of a chest
 * against something darker than itself, and on a white card a pinch's pale glow
 * and a haul's gold were simply not there.
 */
const cabinet =
  'chest-stage relative isolate aspect-square w-full max-w-[22rem] overflow-hidden rounded-[2rem] bg-gradient-to-b from-stone-800 via-stone-900 to-stone-950 ring-1 ring-black/10 shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_28px_56px_-28px_rgb(41_37_36/0.75)] dark:ring-white/10 dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_28px_56px_-28px_rgb(0_0_0/0.9)]'

const lid =
  'absolute inset-0 z-0 cursor-pointer rounded-[2rem] aria-disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500 [-webkit-tap-highlight-color:transparent]'

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
  /** Which tier it was, where this device saw it happen. */
  openedTier: ChestTier | null
  sound: boolean
  onSound: (on: boolean) => void
  /** Draws, records and hands back an opening — or null where there was nothing to open. */
  onOpen: () => ChestOpen | null
  /** Practice: the rattling is skipped, so thirty openings do not cost a minute of it. */
  skipWait?: boolean
  /** What a practice opening is marked with under the chest, or null when it is real. */
  band?: string | null
}

/**
 * The chest, and the opening of it (CHST-14).
 *
 * **The chest is the button** (CHST-13): the whole cabinet takes the press, as
 * do Enter and Space. A press with no key behind it is **refused in place** —
 * the lock rattles and the line under it says what would earn one — rather than
 * the lid being dimmed out of reach, which could not say why it was dim
 * (CHST-17).
 *
 * The opening is conducted here, beat by beat, from `chestTiming`: a squash as
 * it is pressed; three rattles, each harder; a crack of light along the lid
 * that takes on a colour; a held beat, the cabinet darkening round a chest that
 * trembles; and then the lid — a flash, a ring going out, the light flooding up
 * and everything thrown out of it (`ChestBurst`) — and the points counting up.
 *
 * What the opening gives is drawn and written by `onOpen` before the first
 * frame (CHST-16), so nothing here can change it: all of this is a replay.
 * Asked for less motion, the lid opens **at once** (CHST-18) — the wait goes
 * with the movement, there being no point in sitting through a pause whose
 * reason cannot be seen.
 */
export function Chest({
  blocked,
  dayAsked,
  leastTasks,
  openedPoints,
  openedTier,
  sound,
  onSound,
  onOpen,
  skipWait = false,
  band = null,
}: ChestProps) {
  const [state, setState] = useState<ChestState>('shut')
  const [result, setResult] = useState<ChestOpen | null>(null)
  /** The tier the light shows, which may run one brighter than the answer (CHST-15). */
  const [hinted, setHinted] = useState<ChestTier | null>(null)
  const [counted, setCounted] = useState(0)
  const [refused, setRefused] = useState(false)
  const [rattle, setRattle] = useState(-1)
  /** Whether this opening skipped the show: no coins to throw, nothing to shake. */
  const [quick, setQuick] = useState(false)
  /** How many lids this chest has seen go, which names each burst so it plays afresh. */
  const [bursts, setBursts] = useState(0)
  /**
   * Whether the last lid's burst is still to be shown. Cleared on the next
   * press, so what was thrown out of one opening is never still falling over
   * the chest as it rattles shut for the next.
   */
  const [bursting, setBursting] = useState(false)

  /**
   * Whether an opening is still being shown, from the press until the number
   * has counted and everything thrown has come down (`CHEST_SETTLED_AT`). The
   * chest takes no press meanwhile — not a refusal, not a sound, nothing — so a
   * second tap in the excitement can neither cut the show short nor, outside
   * practice, be refused in the middle of it (CHST-16).
   */
  const [busy, setBusy] = useState(false)

  const timers = useRef<number[]>([])

  useEffect(
    () => () => {
      for (const timer of timers.current) window.clearTimeout(timer)
    },
    [],
  )

  function after(ms: number, run: () => void): void {
    timers.current.push(window.setTimeout(run, ms))
  }

  function noise(play: () => void): void {
    if (sound) play()
  }

  /** The counting at the end, which is the only part whose length says anything. */
  function count(opening: ChestOpen): void {
    const ms = CHEST_COUNT_MS[opening.tier]
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

    setResult(opening)
    setCounted(0)
    setHinted(null)
    setRattle(-1)
    setBursting(false)

    if (skipWait || wantsLessMotion()) {
      setQuick(true)
      setState('open')
      setHinted(opening.tier)
      setCounted(opening.points)
      noise(() => {
        playBurst(opening.tier)
      })
      return
    }

    setQuick(false)
    setBusy(true)
    after(CHEST_SETTLED_AT, () => {
      setBusy(false)
    })
    setState('pressed')
    noise(playKey)
    buzz(18)
    after(CHEST_PRESS_MS, () => {
      setState('rattling')
    })

    for (const [index, shake] of CHEST_RATTLES.entries()) {
      after(shake.at, () => {
        setRattle(index)
        noise(() => {
          playRattle(index + 1)
        })
        buzz(10 + index * 18)
      })
    }

    after(CHEST_SEAM_AT, () => {
      setState('seam')
    })
    // The light takes a colour a moment before the answer is out, and is allowed
    // to run one tier brighter than it: the "nearly" a third reel would give.
    after(CHEST_COLOUR_AT, () => {
      setHinted(hintTier(opening.tier))
    })
    after(CHEST_HELD_AT, () => {
      setState('held')
      setRattle(-1)
      noise(() => {
        playHeld(CHEST_BURST_AT - CHEST_HELD_AT)
      })
    })
    after(CHEST_BURST_AT, () => {
      setState('open')
      setHinted(opening.tier)
      setBursts((before) => before + 1)
      setBursting(true)
      noise(() => {
        playBurst(opening.tier)
      })
      buzz(opening.tier === 'jackpot' ? [50, 40, 50, 40, 160] : [40, 30, 60])
    })
    count(opening)
  }

  // A chest opened earlier, come back to: open and glowing, with nothing flying.
  const still = result === null && openedPoints !== null
  const shown: ChestState = still ? 'open' : state
  const tier = still ? openedTier : hinted
  const tone = tier === null ? null : CHEST_TONES[tier]
  const landed = result !== null && state === 'open'
  const jackpot = landed && result.tier === 'jackpot'
  const inviting = blocked === null && !still && state === 'shut'

  const glow = { '--chest-glow': tone?.light ?? 'transparent' } as CSSProperties

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div
        style={glow}
        className={[
          cabinet,
          shown === 'open' && 'chest-cabinet-open',
          refused && 'chest-refusal-shake',
          jackpot && !quick && 'chest-shake',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {/* The light the open chest throws on the cabinet itself. */}
        <div aria-hidden="true" className={`chest-ambient ${shown === 'open' ? (still || quick ? 'chest-ambient-still' : 'chest-ambient-on') : ''}`} />
        {/* The room going quiet round it, for the held beat. */}
        <div aria-hidden="true" className={`chest-vignette ${state === 'held' ? 'chest-vignette-on' : ''}`} />

        <button
          type="button"
          onClick={press}
          aria-label={blocked === null ? 'Open today’s chest' : 'Today’s chest'}
          // Not `disabled`: that would throw keyboard focus off the chest in the
          // middle of the show. Said to a screen reader instead, and ignored.
          aria-disabled={busy || undefined}
          className={lid}
        >
          <span className="absolute inset-[6%] block">
            <ChestArt
              state={shown}
              light={tone?.light ?? null}
              inviting={inviting}
              still={still || quick}
              rainbow={tier === 'jackpot' && shown === 'open'}
              rattle={rattle}
            />
          </span>
        </button>

        {bursting && !quick && <ChestBurst key={`burst${String(bursts)}`} tier={result?.tier ?? null} play={bursts} />}

        {/* The lid going: a flash, and a ring of light going out from the mouth. */}
        {bursting && !quick && (
          <div key={`flash${String(bursts)}`} aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="chest-flash" />
            <div className="chest-shockwave" />
            <div className="chest-shockwave chest-shockwave-late" />
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            onSound(!sound)
          }}
          aria-label={describeSound(sound)}
          aria-pressed={sound}
          title={describeSound(sound)}
          className="absolute right-2.5 bottom-2.5 z-10 grid size-11 place-items-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white/90 md:size-9"
        >
          <SpeakerIcon on={sound} className="size-5" />
        </button>
      </div>

      {/* Under the chest rather than over it: the lid lifts clear of the cabinet
          when it opens, and a band across the top would be the one thing it hit. */}
      {band !== null && (
        <p className="rounded-full bg-neutral-900/90 px-3 py-1 text-[11px] font-semibold tracking-[0.08em] text-white uppercase dark:bg-white/90 dark:text-neutral-900">
          {band}
        </p>
      )}

      {/* What came of it, or what would earn a key. Spoken, so it is never only a colour. */}
      <div role="status" aria-live="polite" className="flex min-h-24 flex-col items-center justify-start text-center">
        {landed && tone !== null ? (
          <>
            <p key={`n${String(bursts)}`} className={`chest-number text-5xl font-bold tracking-tight tabular-nums ${tone.points}`}>
              {describeChestPoints(counted)}
            </p>
            <p
              key={`t${String(bursts)}`}
              className={`chest-tier mt-1 text-sm font-semibold tracking-[0.12em] uppercase ${
                result.tier === 'jackpot' ? 'chest-jackpot-text' : tone.points
              }`}
            >
              {TIER_NAMES[result.tier]}
            </p>
            <p key={`w${String(bursts)}`} className="chest-tier mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {TIER_NOTES[result.tier]}
            </p>
          </>
        ) : blocked === 'opened' && openedPoints !== null ? (
          <>
            <p className={`text-2xl font-semibold tabular-nums ${CHEST_TONES[openedTier ?? 'pinch'].points}`}>
              {describeOpened(openedPoints)}
            </p>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {describeChestBlock('opened', dayAsked, leastTasks)}
            </p>
          </>
        ) : blocked !== null ? (
          <p className="max-w-xs text-sm text-neutral-500 dark:text-neutral-400">
            {describeChestBlock(blocked, dayAsked, leastTasks)}
          </p>
        ) : (
          <p className={`text-sm font-semibold tracking-[0.12em] text-amber-700 uppercase dark:text-amber-300 ${busy ? 'opacity-0' : 'chest-ready'}`}>
            {CHEST_READY}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * The tier the light shows at the moment before the lid goes: now and then one
 * brighter than the answer, so a haul can look like a jackpot for half a second.
 * Presentation only — what the chest gives was drawn and written before any of
 * this ran (CHST-15).
 */
function hintTier(tier: ChestTier): ChestTier {
  const next = CHEST_TIERS[CHEST_TIERS.indexOf(tier) + 1]
  return next !== undefined && Math.random() < 0.35 ? next : tier
}
