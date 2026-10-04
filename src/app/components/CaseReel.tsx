import { memo, useId, type CSSProperties } from 'react'
import { CASE_QUARTERS, caseQuarter, type CaseQuarter } from '../../core'
import { describeCasePoints } from '../caseLabels'
import { REEL_EASE_CSS, type Reel, type ReelCard } from '../caseReel'
import { CASE_SPIN_MS } from '../caseTiming'
import { CASE_TONES, CASE_UNKNOWN_TONE } from '../caseTones'

/** Where the reel is in the opening: coming on, running, stopped on a card, or switching off as the card comes out. */
export type ReelPhase = 'power' | 'spinning' | 'landed' | 'off'

/** The tone a card wears, by its quarter of the jackpot, or plain bone where that is not known here. */
function toneOf(quarter: CaseQuarter | null) {
  return quarter === null ? CASE_UNKNOWN_TONE : CASE_TONES[quarter]
}

/**
 * One card: what it pays, an emblem and a colour for which quarter of the
 * jackpot that is (CHST-15). The pips in its corner count the quarter out — one
 * for the lowest, four for the top — so the colour is never the only thing
 * saying it.
 */
export function PrizeCard({ quarter, points, shine = false }: { quarter: CaseQuarter | null; points: number; shine?: boolean }) {
  const tone = toneOf(quarter)
  const style = { '--tone': tone.light, '--tone-deep': tone.deep } as CSSProperties

  return (
    <div className={`case-card ${quarter === 4 ? 'case-card-top' : ''}`} style={style}>
      <span className="case-card-pips">
        {CASE_QUARTERS.map((each) => (
          <i key={each} className={quarter !== null && each <= quarter ? 'case-card-pip-on' : undefined} />
        ))}
      </span>
      <QuarterEmblem quarter={quarter} />
      <span className="case-type case-card-points">{describeCasePoints(points)}</span>
      {shine && <span className="case-card-shine" />}
    </div>
  )
}

/**
 * What each quarter is drawn as, lowest to top: a nut off the scrap heap, a
 * charged cell, a bar of gold, and an atom's own core — salvage, in the order a
 * wasteland would value it.
 */
function QuarterEmblem({ quarter }: { quarter: CaseQuarter | null }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  const def = (name: string) => `${name}${id}`
  const ref = (name: string) => `url(#${name}${id})`

  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className="case-card-emblem">
      <defs>
        <radialGradient id={def('halo')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.55" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={def('steel')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f5f5f4" />
          <stop offset="0.5" stopColor="#a8a29e" />
          <stop offset="1" stopColor="#57534e" />
        </linearGradient>
        <linearGradient id={def('gold')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="0.5" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#92400e" />
        </linearGradient>
        <radialGradient id={def('core')} cx="0.42" cy="0.38" r="0.6">
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.45" stopColor="currentColor" />
          <stop offset="1" stopColor="var(--tone-deep)" />
        </radialGradient>
        <linearGradient id={def('window')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" />
          <stop offset="1" stopColor="var(--tone-deep)" />
        </linearGradient>
      </defs>

      <circle cx="24" cy="24" r="22" fill={ref('halo')} />

      {quarter === 1 && (
        <g transform="rotate(10 24 25)">
          <path d="M39 28 31.5 41H16.5L9 28V24L16.5 37H31.5L39 24Z" fill="#44403c" />
          <path d="M39 24 31.5 37H16.5L9 24 16.5 11H31.5Z" fill={ref('steel')} stroke="#292524" strokeWidth="1.2" strokeLinejoin="round" />
          <circle cx="24" cy="24" r="6.5" fill="#1c1917" stroke="#78716c" strokeWidth="1.2" />
          <circle cx="24" cy="24" r="4.4" stroke="#fff" strokeOpacity="0.18" />
          <path d="M17.5 13H30.5" stroke="#fff" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      )}

      {quarter === 2 && (
        <g>
          <rect x="19" y="5" width="10" height="6" rx="1.5" fill={ref('steel')} stroke="#1c1917" strokeWidth="1" />
          <rect x="14" y="10" width="20" height="32" rx="4.5" fill="#2a2f33" stroke="#0c0d0e" strokeWidth="1.2" />
          <rect x="17.5" y="14" width="13" height="24" rx="2.5" fill={ref('window')} />
          <path d="M25.5 16.5 19.8 27h4.4l-1.8 8.5 6-11.2h-4.4Z" fill="#fff" />
          <rect x="14" y="12.5" width="20" height="1.6" fill="#fff" fillOpacity="0.2" />
          <path d="M16 15v21" stroke="#fff" strokeOpacity="0.18" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      )}

      {quarter === 3 && (
        <g>
          <path d="M9 35 13.5 23H34.5L39 35Z" fill={ref('gold')} stroke="#78350f" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M13.5 23 16.5 15H31.5L34.5 23Z" fill="#fde68a" stroke="#78350f" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M17.5 16.6H30.5" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M24 26.5l1 3 3 1-3 1-1 3-1-3-3-1 3-1Z" fill="#78350f" fillOpacity="0.55" />
          <path d="M11.5 34.5 15 25" stroke="#fff" strokeOpacity="0.45" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      )}

      {quarter === 4 && (
        <g>
          {[0, 60, 120].map((angle) => (
            <ellipse
              key={angle}
              cx="24"
              cy="24"
              rx="18"
              ry="6.6"
              stroke="#fdf4ff"
              strokeOpacity="0.85"
              strokeWidth="1.5"
              transform={`rotate(${String(angle)} 24 24)`}
            />
          ))}
          <circle cx="24" cy="24" r="7" fill={ref('core')} />
          <circle cx="42" cy="24" r="1.9" fill="#fff" />
          <circle cx="15" cy="8.4" r="1.9" fill="#fff" />
          <circle cx="15" cy="39.6" r="1.9" fill="#fff" />
        </g>
      )}

      {quarter === null && (
        <path
          d="M24 6l2.6 12.4L36.7 11.3l-7.1 10.1L42 24l-12.4 2.6 7.1 10.1-10.1-7.1L24 42l-2.6-12.4-10.1 7.1 7.1-10.1L6 24l12.4-2.6-7.1-10.1 10.1 7.1Z"
          fill="currentColor"
          fillOpacity="0.85"
        />
      )}
    </svg>
  )
}

/** The cards themselves, which never change once built: kept out of the marker's ticking re-renders. */
const Strip = memo(function Strip({
  cards,
  jackpot,
  winner,
  hideWinner,
}: {
  cards: readonly ReelCard[]
  jackpot: number
  winner: number
  hideWinner: boolean
}) {
  return (
    <>
      {cards.map((card, index) => (
        <div
          // The strip is built once per opening and never reordered.
          key={index}
          className="case-reel-slot"
          data-reel-winner={index === winner ? '' : undefined}
          style={index === winner && hideWinner ? { visibility: 'hidden' } : undefined}
        >
          <PrizeCard quarter={caseQuarter(card.points, jackpot)} points={card.points} />
        </div>
      ))}
    </>
  )
})

interface CaseReelProps {
  reel: Reel
  phase: ReelPhase
  /** How many cards have crossed the marker, which flicks it each time. */
  ticks: number
}

/**
 * The screen the reel runs on (CHST-14): an old set's rounded glass, scanlines
 * and all, with a strip of cards behind it and a marker down the middle.
 *
 * It comes on as an old set does — a line, then the picture — and the strip is
 * sent from where it starts to where it stops in one CSS animation, drawn with
 * the very curve `reelTicks` reads its ticks off, so each tick lands as a card
 * crosses the marker. When the card comes out the screen switches off behind
 * it, to a line and then to nothing.
 *
 * Shown, not read: the line under Cases says what came out of it.
 */
export function CaseReel({ reel, phase, ticks }: CaseReelProps) {
  const running = phase !== 'power'
  // An animation rather than a transition: a transition needs where the strip
  // starts to have been drawn before it is told where to stop, which a hidden or
  // busy tab may never do, and then it jumps straight to the end.
  const travel = {
    '--reel-from': reel.from,
    '--reel-to': reel.to,
    animation: running ? `case-reel-run ${String(CASE_SPIN_MS)}ms ${REEL_EASE_CSS} forwards` : 'none',
  } as CSSProperties

  return (
    <div aria-hidden="true" data-reel-phase={phase} className={`case-screen ${phase === 'off' ? 'case-screen-off' : 'case-screen-on'}`}>
      <div className="case-reel-window">
        <div className="case-reel" style={travel}>
          <Strip cards={reel.cards} jackpot={reel.jackpot} winner={reel.winner} hideWinner={phase === 'off'} />
        </div>
      </div>
      <div className="case-scanlines" />
      <div key={ticks} className={`case-marker ${ticks > 0 && phase === 'spinning' ? 'case-marker-tick' : ''} ${phase === 'landed' ? 'case-marker-landed' : ''}`} />
      <div className="case-screen-glass" />
    </div>
  )
}

/** The rays behind a card that has come out: long and short by turns, as a 1960s sign's starburst. */
const RAYS = Array.from({ length: 16 }, (_, index) => ({ angle: index * 22.5, long: index % 2 === 0 }))

function rayPoints(angle: number, long: boolean): string {
  const radians = (degrees: number) => (degrees * Math.PI) / 180
  const reach = long ? 98 : 62
  const half = long ? 3.2 : 4.5
  const at = (degrees: number, length: number) =>
    `${(100 + Math.sin(radians(degrees)) * length).toFixed(1)},${(100 - Math.cos(radians(degrees)) * length).toFixed(1)}`
  return `${at(angle - half, 14)} ${at(angle, reach)} ${at(angle + half, 14)}`
}

interface CaseSpotlightProps {
  /** Which quarter of the jackpot it came to, or null where this device never saw. */
  quarter: CaseQuarter | null
  points: number
  /** Coming out of the screen now, or standing there already (come back to, or with less motion). */
  arriving: boolean
  /**
   * Where the card stood under the marker, in cards right of it, so it comes
   * out of the screen from exactly where it stopped rather than from the middle.
   */
  land?: number
}

/**
 * The card once it is out: bigger, on a starburst in its own colour, the light
 * of it on the cabinet. What the cabinet shows from then on — and what it shows
 * coming back to a case opened earlier.
 */
export function CaseSpotlight({ quarter, points, arriving, land = 0 }: CaseSpotlightProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  const tone = toneOf(quarter)
  const style = { '--tone': tone.light, '--land': land, color: tone.light } as CSSProperties

  return (
    <div aria-hidden="true" className={`case-spot ${arriving ? 'case-spot-arriving' : 'case-spot-still'}`} style={style}>
      <div className="case-spot-glow" />
      <svg viewBox="0 0 200 200" className={`case-starburst ${quarter === 4 ? 'case-rainbow' : ''}`}>
        <defs>
          <radialGradient id={`rays${id}`} cx="100" cy="100" r="100" gradientUnits="userSpaceOnUse">
            <stop offset="0.08" stopColor="currentColor" stopOpacity="0.9" />
            <stop offset="0.5" stopColor="currentColor" stopOpacity="0.35" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g fill={`url(#rays${id})`}>
          {RAYS.map(({ angle, long }) => (
            <polygon key={angle} points={rayPoints(angle, long)} />
          ))}
        </g>
      </svg>
      <div className="case-spot-card">
        <PrizeCard quarter={quarter} points={points} shine={arriving} />
      </div>
    </div>
  )
}
