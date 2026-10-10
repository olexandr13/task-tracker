import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { caseQuarter, type CaseBlock, type CaseKindId, type CaseOpen, type CaseQuarter } from '../../core'
import { CASE_READY, SOURCE_LABEL, describeCaseBlock, describeCasePoints, describeOpenCase, describeOpened, describeOutOf, describeSound } from '../caseLabels'
import { buildReel, reelTicks, type Reel } from '../caseReel'
import {
  hushCase,
  playLanded,
  playLatches,
  playPowerOff,
  playPowerOn,
  playReelTick,
  playRefusal,
  playReveal,
  playSpinBed,
  playTick,
  playUnlock,
} from '../caseSound'
import {
  CASE_COUNT_AT,
  CASE_COUNT_MS,
  CASE_LANDED_AT,
  CASE_LATCH_AT,
  CASE_POWER_AT,
  CASE_PRESS_MS,
  CASE_REFUSAL_MS,
  CASE_REVEAL_AT,
  CASE_SETTLED_AT,
  CASE_SPIN_AT,
  CASE_SPIN_MS,
  CASE_UNLOCK_AT,
} from '../caseTiming'
import { CASE_TONES, CASE_UNKNOWN_TONE } from '../caseTones'
import { CaseArt, type CrateState } from './CaseArt'
import { CaseBurst } from './CaseBurst'
import { CaseReel, CaseSpotlight, type ReelPhase } from './CaseReel'
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
 * is in `.case-stage` in `src/styles.css`.
 */
const cabinet =
  'case-stage relative isolate aspect-[6/5] w-full max-w-[40rem] overflow-hidden rounded-[1.75rem] ring-1 ring-black/20 sm:aspect-[16/10] dark:ring-white/10'

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

interface CaseOpeningProps {
  /** Why there is nothing to open, or null while a key is waiting. */
  blocked: CaseBlock | null
  /** What today's case gave, where it is already open. */
  openedPoints: number | null
  /** Which quarter of the jackpot it came to, where this device saw it happen. */
  openedQuarter: CaseQuarter | null
  sound: boolean
  onSound: (on: boolean) => void
  /** Draws, records and hands back an opening — or null where there was nothing to open. */
  onOpen: () => CaseOpen | null
  /**
   * An opening already drawn. The cabinet plays it as soon as it is shown, and
   * is not itself the button: the case that was pressed is (CHST-13).
   */
  script?: CaseOpen | null
  /** Called when the show has finished, so another case can be opened (CHST-16). */
  onSettled?: () => void
  /** Which case this opening is. The reel shows what that case can pay (CHST-28). */
  caseKind?: CaseKindId
  /** Practice: the show is skipped, so thirty openings do not cost three minutes of it. */
  skipWait?: boolean
  /** What a practice opening is marked with under Cases, or null when it is real. */
  band?: string | null
  /** The show is over and the cabinet is on its way out: it switches off (CHST-25). */
  leaving?: boolean
}

/**
 * Cases, and the opening of it (CHST-14).
 *
 * **Cases is the button** (CHST-13) when it is waiting on its own: the whole
 * cabinet takes the press, as do Enter and Space. Handed a `script`, it is only
 * the show — the case already pressed — and it plays that opening at once. A
 * press with no key behind it is **refused in place** —
 * the dial jerks, the lamp blinks red and the line under it says what would
 * earn one — rather than the crate being dimmed out of reach, which could not
 * say why it was dim (CHST-17).
 *
 * The opening is conducted here, beat by beat, from `caseTiming`: the crate
 * squashes as it is pressed, its dial turns and its latches go with a hiss; it
 * drops away and a screen comes on behind it; a reel of cards runs past a
 * marker, ticking, and slows to a crawl; a beat with the marker on one card —
 * and that card comes out of the screen onto a starburst in its own colour,
 * throwing sparks (`CaseBurst`), while the points count up.
 *
 * What the opening gives is drawn and written by `onOpen` before the first
 * frame (CHST-16), and the reel is built round it (`buildReel`), so nothing here
 * can change it: all of this is a replay. Asked for less motion, the card is
 * out **at once** (CHST-18) — the wait goes with the movement, there being no
 * point in sitting through a pause whose reason cannot be seen.
 */
export function CaseOpening({
  blocked,
  openedPoints,
  openedQuarter,
  sound,
  onSound,
  onOpen,
  script = null,
  onSettled,
  caseKind = 'fair',
  skipWait = false,
  band = null,
  leaving = false,
}: CaseOpeningProps) {
  // A handed opening is already on its way on the first paint: the page drew it,
  // and this cabinet only plays it (CHST-13). A press still starts from shut.
  const opensQuick = script !== null && (skipWait || wantsLessMotion())
  const [stage, setStage] = useState<Stage>(script === null ? 'shut' : opensQuick ? 'open' : 'pressed')
  const [result, setResult] = useState<CaseOpen | null>(script)
  /** The strip of cards this opening runs, built round what it drew. */
  const [reel, setReel] = useState<Reel | null>(() => (script !== null && !opensQuick ? buildReel(script, Math.random, caseKind) : null))
  /** How many cards have crossed the marker so far, which flicks it each time. */
  const [ticks, setTicks] = useState(0)
  const [counted, setCounted] = useState(opensQuick && script !== null ? script.points : 0)
  const [refused, setRefused] = useState(false)
  /** Whether this opening skipped the show: no reel, nothing thrown, nothing shaken. */
  const [quick, setQuick] = useState(opensQuick)
  /** How many cards this cases has seen come out, which names each burst so it plays afresh. */
  const [bursts, setBursts] = useState(0)
  /**
   * Whether the last card's burst is still to be shown. Cleared on the next
   * press, so what was thrown off one opening is never still falling over the
   * crate as it unlocks for the next.
   */
  const [bursting, setBursting] = useState(false)

  /**
   * Whether an opening is still being shown, from the press until the number
   * has counted and everything thrown has died away (`CASE_SETTLED_AT`). The
   * cases takes no press meanwhile — not a refusal, not a sound, nothing — so a
   * second tap in the excitement can neither cut the show short nor, outside
   * practice, be refused in the middle of it (CHST-16).
   */
  const [busy, setBusy] = useState(script !== null && !opensQuick)

  const timers = useRef<number[]>([])

  useEffect(
    () => () => {
      for (const timer of timers.current) window.clearTimeout(timer)
      hushCase()
    },
    [],
  )

  // Turned off in the middle of the show, the noise stops there and then, the
  // drone and the tails included, rather than playing out what was lined up.
  useEffect(() => {
    if (!sound) hushCase()
  }, [sound])

  // The set switching off as the cabinet goes. Only the moment it starts:
  // turning the sound on while it goes does not play it late.
  useEffect(() => {
    if (leaving && sound) playPowerOff()
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- the noise belongs to the moment it starts
  }, [leaving])

  function after(ms: number, run: () => void): void {
    timers.current.push(window.setTimeout(run, ms))
  }

  function noise(play: () => void): void {
    if (sound) play()
  }

  /** The counting at the end, which is the only part whose length says anything. */
  function count(opening: CaseOpen): void {
    const ms = CASE_COUNT_MS[caseQuarter(opening.points, opening.jackpot)]
    const steps = Math.max(1, Math.min(opening.points, 32))

    for (let step = 1; step <= steps; step++) {
      const through = step / steps
      after(CASE_COUNT_AT + ms * through, () => {
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
    after(CASE_REFUSAL_MS, () => {
      setRefused(false)
    })
  }

  /**
   * The beats after the opening is already on screen: the noise, and every
   * later change. Nothing here is set before the first timeout, so a handed
   * opening can start from the state it mounted with.
   */
  function arm(opening: CaseOpen, built: Reel | null): void {
    const quarter = caseQuarter(opening.points, opening.jackpot)

    if (skipWait || wantsLessMotion()) {
      noise(() => {
        playReveal(quarter)
      })
      onSettled?.()
      return
    }

    noise(playUnlock)
    buzz(18)
    after(CASE_SETTLED_AT, () => {
      setBusy(false)
      onSettled?.()
    })
    after(Math.max(CASE_PRESS_MS, CASE_UNLOCK_AT), () => {
      setStage('unlocking')
    })
    after(CASE_LATCH_AT, () => {
      setStage('unlatched')
      noise(playLatches)
      buzz(24)
    })
    after(CASE_POWER_AT, () => {
      setStage('power')
      noise(playPowerOn)
    })
    after(CASE_SPIN_AT, () => {
      setStage('spinning')
      noise(() => {
        playSpinBed(CASE_SPIN_MS)
      })
    })
    if (built !== null) {
      for (const at of reelTicks(built, CASE_SPIN_MS)) {
        after(CASE_SPIN_AT + at, () => {
          setTicks((before) => before + 1)
          noise(playReelTick)
        })
      }
    }
    after(CASE_LANDED_AT, () => {
      setStage('landed')
      noise(() => {
        playLanded(CASE_REVEAL_AT - CASE_LANDED_AT)
      })
      buzz(20)
    })
    after(CASE_REVEAL_AT, () => {
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

  /** A press: the opening is drawn here, then shown. A handed one mounts already shown. */
  function begin(opening: CaseOpen): void {
    const fast = skipWait || wantsLessMotion()
    const built = fast ? null : buildReel(opening, Math.random, caseKind)
    setResult(opening)
    setTicks(0)
    setBursting(false)
    setQuick(fast)
    setCounted(fast ? opening.points : 0)
    setReel(built)
    if (fast) {
      setStage('open')
      setBusy(false)
    } else {
      setStage('pressed')
      setBusy(true)
    }
    arm(opening, built)
  }

  function press(): void {
    if (busy || script != null) return

    const opening = onOpen()
    if (opening === null) {
      refuse()
      return
    }
    begin(opening)
  }

  // Sound and the later beats of an opening the page already drew. The first
  // frame is the state this mounted with. `arm` and `reel` are that render's:
  // a later one must not start the show again.
  useEffect(() => {
    if (script == null) return
    arm(script, reel)
    return () => {
      for (const timer of timers.current) window.clearTimeout(timer)
      timers.current = []
      hushCase()
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- the show belongs to the opening it mounted with
  }, [script])

  // A case opened earlier, come back to: the card out and glowing, nothing flying.
  const still = result === null && openedPoints !== null
  const resultQuarter = result === null ? null : caseQuarter(result.points, result.jackpot)
  const shownQuarter = still ? openedQuarter : resultQuarter
  const tone = shownQuarter === null ? (still ? CASE_UNKNOWN_TONE : null) : CASE_TONES[shownQuarter]
  const out = still || (result !== null && stage === 'open')
  const landed = result !== null && stage === 'open'
  const top = landed && resultQuarter === 4
  const crate: CrateState | null = !still && (stage === 'shut' || stage === 'pressed' || stage === 'unlocking' || stage === 'unlatched') ? stage : null
  const inviting = script == null && blocked === null && crate === 'shut'
  const phase = reel !== null && !quick ? REEL_PHASES[stage] : undefined

  const glow = { '--case-glow': out && tone !== null ? tone.light : 'transparent' } as CSSProperties

  return (
    <div className="case-frame flex w-full flex-col items-center gap-5">
      <div
        style={glow}
        className={[cabinet, out && 'case-cabinet-open', refused && 'case-refusal-shake', top && !quick && !leaving && 'case-shake', leaving && 'case-off']
          .filter(Boolean)
          .join(' ')}
      >
        {/* The light the card throws on the cabinet once it is out. */}
        <div aria-hidden="true" className={`case-ambient ${out ? (still || quick ? 'case-ambient-still' : 'case-ambient-on') : ''}`} />
        {/* Dust turning in the light while the crate waits. */}
        {crate !== null && (
          <div aria-hidden="true" className="case-dust">
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
        <div aria-hidden="true" className={`case-vignette ${stage === 'spinning' || stage === 'landed' ? 'case-vignette-on' : ''}`} />

        {script == null ? (
          <button
            type="button"
            onClick={press}
            aria-label={blocked === null ? describeOpenCase('today') : SOURCE_LABEL.today}
            // Not `disabled`: that would throw keyboard focus off Cases in the
            // middle of the show. Said to a screen reader instead, and ignored.
            aria-disabled={busy || undefined}
            className={lid}
          >
            {(crate !== null || stage === 'power') && !still && (
              <span className={`absolute inset-[7%] block ${stage === 'power' ? 'case-crate-away' : ''}`}>
                <CaseArt state={crate ?? 'unlatched'} inviting={inviting} refused={refused} />
              </span>
            )}
          </button>
        ) : (
          (crate !== null || stage === 'power') &&
          !still && (
            <span className={`pointer-events-none absolute inset-[7%] z-[1] block ${stage === 'power' ? 'case-crate-away' : ''}`}>
              <CaseArt state={crate ?? 'unlatched'} inviting={inviting} refused={refused} />
            </span>
          )
        )}

        {reel !== null && phase !== undefined && <CaseReel reel={reel} phase={phase} ticks={ticks} />}

        {out && (
          <CaseSpotlight
            key={`spot${String(bursts)}`}
            quarter={shownQuarter}
            points={still ? (openedPoints ?? 0) : (result?.points ?? 0)}
            arriving={!still && !quick}
            land={reel === null ? 0 : reel.winner + 0.5 - reel.to}
          />
        )}

        {bursting && !quick && <CaseBurst key={`burst${String(bursts)}`} quarter={resultQuarter} play={bursts} />}

        {/* The card coming out: a flash, and two rings of light going out from it. */}
        {bursting && !quick && (
          <div key={`flash${String(bursts)}`} aria-hidden="true" className="pointer-events-none absolute inset-0 z-[3]">
            <div className="case-flash" />
            <div className="case-shockwave" />
            <div className="case-shockwave case-shockwave-late" />
          </div>
        )}

        <div aria-hidden="true" className="case-hazard" />

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

      {/* Under Cases rather than over it, where it never covers the card. */}
      {band !== null && (
        <p
          className={`rounded-full bg-neutral-900/90 px-3 py-1 text-[11px] font-semibold tracking-[0.08em] text-white uppercase dark:bg-white/90 dark:text-neutral-900 ${leaving ? 'case-fade-away' : ''}`}
        >
          {band}
        </p>
      )}

      {/* What came of it, or what would earn a key. Spoken, so it is never only a colour. */}
      <div
        role="status"
        aria-live="polite"
        className={`flex min-h-16 flex-col items-center justify-start text-center ${leaving ? 'case-fade-away' : ''}`}
      >
        {landed && tone !== null ? (
          <>
            <p key={`n${String(bursts)}`} className={`case-number case-type text-5xl font-bold tabular-nums ${tone.points}`}>
              {describeCasePoints(counted)}
            </p>
            {/* The card's colour has already shown how big it was; this says it to a screen reader. */}
            <p className="sr-only">{describeOutOf(result.points, result.jackpot)}</p>
          </>
        ) : blocked === 'opened' && openedPoints !== null ? (
          <>
            <p className={`text-2xl font-semibold tabular-nums ${(openedQuarter === null ? CASE_UNKNOWN_TONE : CASE_TONES[openedQuarter]).points}`}>
              {describeOpened(openedPoints)}
            </p>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{describeCaseBlock('opened')}</p>
          </>
        ) : blocked !== null && blocked !== 'unclear' ? (
          <p className="max-w-xs text-sm text-neutral-500 dark:text-neutral-400">{describeCaseBlock(blocked)}</p>
        ) : blocked !== null || script != null ? null : (
          <p className={`text-sm font-semibold tracking-[0.16em] text-amber-700 uppercase dark:text-amber-300 ${busy ? 'opacity-0' : 'case-ready'}`}>
            {CASE_READY}
          </p>
        )}
      </div>
    </div>
  )
}
