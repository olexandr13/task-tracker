import { useId } from 'react'

/** Where the crate is in the opening (CHST-14): pressed, the dial turning, the latches gone. */
export type CrateState = 'shut' | 'pressed' | 'unlocking' | 'unlatched'

interface ChestArtProps {
  state: CrateState
  /** A key is waiting: the crate breathes, its lamp glows, a glint runs over its lid (CHST-13). */
  inviting?: boolean
  /** A press with no key behind it: the dial jerks and the lamp blinks red (CHST-17). */
  refused?: boolean
}

/** The notches round the dial, every thirty degrees. */
const NOTCHES = Array.from({ length: 12 }, (_, index) => index * 30)

/** The rivets along the lid and the body, where the corner guards are held on. */
const RIVETS: readonly (readonly [number, number])[] = [
  [41, 65],
  [159, 65],
  [41, 151],
  [159, 151],
  [62, 65],
  [138, 65],
  [62, 151],
  [138, 151],
]

/** Where the paint has chipped off the lid, down to the metal under it. */
const CHIPS = [
  'M36 76l3-2 1 4-3 3z',
  'M151 59l6 1-2 3-5-1z',
  'M163 84l2 5-3 1-1-4z',
  'M74 60l5 0-2 2z',
]

/**
 * The crate itself — a supply crate from a world that ended in 1962 and kept
 * its paint scheme: cream enamel over a teal body, gone at the corners, with a
 * band of hazard stripes where the lid meets it, a latch at each side and a dial
 * lock in the middle whose lamp is lit while a key is waiting.
 *
 * Drawn rather than drawn from a file, as every glyph in the app is, and built
 * in the layers the opening moves: the **dial**, which turns; the **latches**,
 * which let go; the **lid**, which lifts a hair on the hiss; and the **seam**
 * between, where light from inside shows once the latches are off. After that
 * the crate drops away and the reel takes over (`ChestReel`), so nothing here
 * ever says what is inside.
 */
export function ChestArt({ state, inviting = false, refused = false }: ChestArtProps) {
  // Gradients are named per crate, so two on one page never borrow each other's.
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  const ref = (name: string) => `url(#${name}${id})`
  const def = (name: string) => `${name}${id}`

  const loose = state === 'unlatched'
  const waiting = inviting && state === 'shut'

  const object = ['chest-object', state === 'pressed' && 'chest-press', state === 'unlocking' && 'chest-jolt', waiting && 'chest-breathe']
    .filter(Boolean)
    .join(' ')

  const lamp = refused ? 'chest-lamp-refused' : state === 'unlocking' || loose ? 'chest-lamp-open' : waiting ? 'chest-lamp-waiting' : 'chest-lamp-idle'

  return (
    <svg viewBox="16 26 168 152" fill="none" aria-hidden="true" className="size-full overflow-visible">
      <defs>
        <linearGradient id={def('enamel')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3ead3" />
          <stop offset="0.55" stopColor="#dccfad" />
          <stop offset="1" stopColor="#b8a882" />
        </linearGradient>
        <linearGradient id={def('teal')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a7d75" />
          <stop offset="0.5" stopColor="#24564f" />
          <stop offset="1" stopColor="#173a36" />
        </linearGradient>
        <linearGradient id={def('metal')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8d949b" />
          <stop offset="0.45" stopColor="#555b62" />
          <stop offset="1" stopColor="#2a2e33" />
        </linearGradient>
        <linearGradient id={def('chrome')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f4f5f6" />
          <stop offset="0.45" stopColor="#a3a9b0" />
          <stop offset="0.7" stopColor="#5d636a" />
          <stop offset="1" stopColor="#c4c9ce" />
        </linearGradient>
        <linearGradient id={def('glint')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.7" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={def('leak')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff3d6" stopOpacity="0" />
          <stop offset="0.2" stopColor="#ffe2a8" />
          <stop offset="0.5" stopColor="#fff" />
          <stop offset="0.8" stopColor="#ffe2a8" />
          <stop offset="1" stopColor="#fff3d6" stopOpacity="0" />
        </linearGradient>
        <pattern id={def('hazard')} width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="skewX(-35)">
          <rect width="12" height="12" fill="#1b1c1e" />
          <rect width="6" height="12" fill="#e9a23b" />
        </pattern>
        <clipPath id={def('lidClip')}>
          <path d="M34 98V68Q34 58 44 58H156Q166 58 166 68V98Z" />
        </clipPath>
        <filter id={def('soft')} x="-50%" y="-200%" width="200%" height="500%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
      </defs>

      {/* The floor under it, which keeps it standing on something. */}
      <ellipse cx="100" cy="166" rx="70" ry="7" className={`chest-shadow fill-black/60 ${waiting ? 'chest-shadow-breathe' : ''}`} />

      <g className={object}>
        {/* Feet. */}
        <rect x="44" y="154" width="22" height="10" rx="2" fill="#1c1f22" />
        <rect x="134" y="154" width="22" height="10" rx="2" fill="#1c1f22" />

        {/* The body: teal, ribbed, rust running from its rivets. */}
        <path d="M34 104H166V150Q166 158 158 158H42Q34 158 34 150Z" fill={ref('teal')} />
        <path d="M38 121H162M38 138H162" stroke="#0d2321" strokeOpacity="0.55" strokeWidth="1.6" />
        <path d="M38 122.6H162M38 139.6H162" stroke="#8fd3c8" strokeOpacity="0.14" strokeWidth="1" />
        <path d="M62 153v4M138 153c1 2 0 4 1 5" stroke="#8a4b22" strokeOpacity="0.55" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M120 106c0 6 2 9 1 14" stroke="#8a4b22" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round" />
        {/* An emblem stencilled on: a starburst, and three bars. */}
        <g fill="#efe6cf" fillOpacity="0.55">
          <path d="M60 122l1.6 6.4 6.4 1.6-6.4 1.6-1.6 6.4-1.6-6.4-6.4-1.6 6.4-1.6Z" />
          <path d="M60 126.4l.7 2.9 2.9.7-2.9.7-.7 2.9-.7-2.9-2.9-.7 2.9-.7Z" transform="rotate(45 60 130)" />
          <rect x="128" y="126" width="3" height="10" />
          <rect x="133" y="126" width="3" height="10" />
          <rect x="138" y="126" width="10" height="10" fillOpacity="0.6" />
        </g>
        <path d="M34 104H166V150Q166 158 158 158H42Q34 158 34 150Z" stroke="#0b1a19" strokeWidth="2.2" strokeLinejoin="round" />

        {/* The lid: cream enamel, chipped, with a handle pressed into it. */}
        <g className={loose ? 'chest-lid-loose' : undefined}>
          <path d="M34 98V68Q34 58 44 58H156Q166 58 166 68V98Z" fill={ref('enamel')} />
          <g clipPath={ref('lidClip')}>
            <path d="M34 61H166" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.4" />
            <rect x="80" y="64" width="40" height="9" rx="4.5" fill="#6b5f48" fillOpacity="0.45" />
            <rect x="83" y="66" width="34" height="5" rx="2.5" fill="#2b2620" fillOpacity="0.55" />
            {CHIPS.map((chip) => (
              <path key={chip} d={chip} fill="#4a4f55" fillOpacity="0.75" />
            ))}
            <g className={waiting ? 'chest-glint' : 'opacity-0'}>
              <rect x="-34" y="54" width="20" height="50" fill={ref('glint')} transform="skewX(-22)" />
            </g>
          </g>
          <path d="M34 98V68Q34 58 44 58H156Q166 58 166 68V98Z" stroke="#4a4232" strokeWidth="2.2" strokeLinejoin="round" />
        </g>

        {/* Corner guards, riveted on. */}
        <path d="M34 72V68Q34 58 44 58H50V64H44Q40 64 40 68V72Z" fill={ref('metal')} />
        <path d="M166 72V68Q166 58 156 58H150V64H156Q160 64 160 68V72Z" fill={ref('metal')} />
        <path d="M34 144V150Q34 158 42 158H50V152H42Q40 152 40 150V144Z" fill={ref('metal')} />
        <path d="M166 144V150Q166 158 158 158H150V152H158Q160 152 160 150V144Z" fill={ref('metal')} />
        {RIVETS.map(([x, y]) => (
          <g key={`${String(x)}-${String(y)}`}>
            <circle cx={x} cy={y} r="2.1" fill="#2a2e33" />
            <circle cx={x - 0.5} cy={y - 0.6} r="1.2" fill="#c9ced3" />
          </g>
        ))}

        {/* Where the lid meets the body: a band of hazard stripes, and the light from
            inside showing along it once the latches have gone. */}
        <rect x="30" y="96" width="140" height="11" rx="2.5" fill={ref('hazard')} />
        <rect x="30" y="96" width="140" height="11" rx="2.5" stroke="#0e0f10" strokeWidth="1.6" />
        <rect x="31" y="96.8" width="138" height="1.2" fill="#fff" fillOpacity="0.25" />
        <g className={loose ? 'chest-leak' : 'opacity-0'}>
          <rect x="26" y="91" width="148" height="9" rx="4.5" fill={ref('leak')} filter={ref('soft')} />
          <rect x="36" y="94.6" width="128" height="1.8" rx="0.9" fill={ref('leak')} />
        </g>

        {/* The latches, one each side, which spring off on the hiss. */}
        {[
          { x: 46, side: 'left' },
          { x: 154, side: 'right' },
        ].map(({ x, side }) => (
          <g key={side}>
            <rect x={x - 8} y="104" width="16" height="16" rx="2" fill={ref('metal')} stroke="#16181b" strokeWidth="1.2" />
            <g className={`chest-latch ${loose ? `chest-latch-${side}` : ''}`} style={{ transformOrigin: `${String(x)}px 116px` }}>
              <rect x={x - 4.5} y="86" width="9" height="32" rx="2.5" fill={ref('chrome')} stroke="#16181b" strokeWidth="1.2" />
              <rect x={x - 2} y="89" width="4" height="7" rx="1" fill="#16181b" fillOpacity="0.55" />
            </g>
            <circle cx={x} cy="116" r="2" fill="#16181b" />
          </g>
        ))}

        {/* The dial lock: it turns as the key does, and its lamp says whether a key is waiting. */}
        <g className={`chest-dial ${state === 'unlocking' || loose ? 'chest-dial-turned' : refused ? 'chest-dial-refused' : ''}`}>
          <circle cx="100" cy="101" r="20" fill="#16181b" />
          <circle cx="100" cy="101" r="18.5" fill={ref('chrome')} />
          {NOTCHES.map((angle) => (
            <rect
              key={angle}
              x="99.2"
              y="84.2"
              width="1.6"
              height={angle % 90 === 0 ? 4.4 : 2.8}
              rx="0.8"
              fill="#24272b"
              transform={`rotate(${String(angle)} 100 101)`}
            />
          ))}
          <circle cx="100" cy="101" r="12.5" fill="#121416" stroke="#000" strokeWidth="1" />
          <path d="M100 89.4l2.4 3.6h-4.8Z" fill="#e9a23b" />
        </g>
        <g className={lamp}>
          {/* Its own gradients, inside it, so that their `currentColor` is the lamp's. */}
          <defs>
            <radialGradient id={def('lamp')} cx="0.4" cy="0.35" r="0.7">
              <stop offset="0" stopColor="#fff" />
              <stop offset="0.35" stopColor="currentColor" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0.35" />
            </radialGradient>
            <radialGradient id={def('halo')} cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="currentColor" stopOpacity="0.7" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="101" r="16" fill={ref('halo')} className="chest-lamp-halo" />
          <circle cx="100" cy="101" r="6.5" fill={ref('lamp')} />
        </g>
      </g>

      {/* The hiss as the latches go: a puff each side. */}
      {loose && (
        <g fill="#f5f5f4">
          <circle cx="30" cy="100" r="7" className="chest-puff chest-puff-left" />
          <circle cx="170" cy="100" r="7" className="chest-puff chest-puff-right" />
        </g>
      )}
    </svg>
  )
}
