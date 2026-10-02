import { useId } from 'react'
import { CHEST_LAMPLIGHT } from '../chestTones'

/** Where the chest is in the opening (CHST-14). */
export type ChestState = 'shut' | 'pressed' | 'rattling' | 'seam' | 'held' | 'open'

/**
 * The shafts of light out of an open chest: an angle each, a width and a
 * reach, uneven on purpose — light through a gap is never a fan of equal spokes.
 */
const RAYS: readonly { readonly angle: number; readonly width: number; readonly reach: number }[] = [
  { angle: -74, width: 5, reach: 104 },
  { angle: -52, width: 8, reach: 120 },
  { angle: -33, width: 4, reach: 112 },
  { angle: -16, width: 9, reach: 128 },
  { angle: 0, width: 6, reach: 132 },
  { angle: 14, width: 10, reach: 124 },
  { angle: 31, width: 4, reach: 116 },
  { angle: 50, width: 8, reach: 122 },
  { angle: 71, width: 5, reach: 106 },
]

/** Where the light comes from: the middle of the chest's mouth. */
const MOUTH = { x: 100, y: 106 }

/** One shaft as a triangle out of the mouth, its tip as wide as the shaft. */
function rayPoints({ angle, width, reach }: (typeof RAYS)[number]): string {
  const radians = (degrees: number) => (degrees * Math.PI) / 180
  const tip = (degrees: number) =>
    `${(MOUTH.x + Math.sin(radians(degrees)) * reach).toFixed(1)},${(MOUTH.y - Math.cos(radians(degrees)) * reach).toFixed(1)}`
  return `${String(MOUTH.x)},${String(MOUTH.y)} ${tip(angle - width / 2)} ${tip(angle + width / 2)}`
}

/** Where the bands of iron run down the chest, front left and front right. */
const STRAPS = [52, 136]

interface ChestArtProps {
  state: ChestState
  /** The colour the light comes out in, or null while it is still plain lamplight. */
  light: string | null
  /** A key is waiting: the chest breathes, and a glint runs over its lid (CHST-13). */
  inviting?: boolean
  /** Open already, as it is when coming back to a chest opened earlier: no lid flying. */
  still?: boolean
  /** The jackpot's light runs through every colour rather than holding one. */
  rainbow?: boolean
  /** Which of the three rattles is shaking it, or -1 for none. */
  rattle?: number
}

/** Each rattle harder than the one before, and the shadow under each hop. */
const RATTLES = ['chest-rattle-1', 'chest-rattle-2', 'chest-rattle-3']
const HOPS = ['chest-hop-1', 'chest-hop-2', 'chest-hop-3']

/**
 * The chest itself, drawn rather than drawn from a file, as every glyph in the
 * app is — but as an object rather than an icon: wood that is lighter where the
 * light falls, iron bands with a sheen on them, a lock, and a mouth that is
 * dark until it is not.
 *
 * It is built in layers, back to front, because the opening is a matter of
 * which of them is moving: the **bloom** and the **shafts** behind the chest,
 * which are the light once it is out; the **chest**, which squashes, hops and
 * trembles as one; the **mouth** and its **core**, which are where the light
 * comes from; and the **lid**, which lifts clear on a spring and tips back. The
 * **seam** sits over all of it, screened rather than painted, because it is a
 * crack of light rather than a thing.
 *
 * The light takes the tier's colour, through `currentColor`, and is the only
 * thing in the whole opening that says how rich it turned out (CHST-15).
 */
export function ChestArt({ state, light, inviting = false, still = false, rainbow = false, rattle = -1 }: ChestArtProps) {
  // Gradients are named per chest, so two on one page never borrow each other's.
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  const ref = (name: string) => `url(#${name}${id})`
  const def = (name: string) => `${name}${id}`

  const open = state === 'open'
  const lit = state === 'seam' || state === 'held'

  const object = [
    'chest-object',
    rattle >= 0 && RATTLES[rattle],
    state === 'pressed' && 'chest-press',
    state === 'held' && 'chest-tremble',
    open && !still && 'chest-recoil',
    inviting && state === 'shut' && 'chest-breathe',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      aria-hidden="true"
      className="size-full overflow-visible"
      style={{ color: light ?? CHEST_LAMPLIGHT, transition: 'color 420ms ease' }}
    >
      <defs>
        <linearGradient id={def('wood')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a8652e" />
          <stop offset="0.5" stopColor="#7d431a" />
          <stop offset="1" stopColor="#4a240b" />
        </linearGradient>
        <linearGradient id={def('lid')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9843f" />
          <stop offset="0.6" stopColor="#9a5523" />
          <stop offset="1" stopColor="#6f3a14" />
        </linearGradient>
        <linearGradient id={def('band')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff1b8" />
          <stop offset="0.3" stopColor="#e8b950" />
          <stop offset="0.7" stopColor="#a8701c" />
          <stop offset="1" stopColor="#6a440c" />
        </linearGradient>
        <linearGradient id={def('strap')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7a5212" />
          <stop offset="0.35" stopColor="#f4d27a" />
          <stop offset="0.6" stopColor="#c48a26" />
          <stop offset="1" stopColor="#5f3e0b" />
        </linearGradient>
        <linearGradient id={def('mouth')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0d0603" />
          <stop offset="1" stopColor="#2f170a" />
        </linearGradient>
        <linearGradient id={def('sheen')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.42" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0.06" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={def('glint')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.75" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={def('bloom')} cx={MOUTH.x} cy={MOUTH.y - 8} r="104" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.95" />
          <stop offset="0.3" stopColor="currentColor" stopOpacity="0.5" />
          <stop offset="0.65" stopColor="currentColor" stopOpacity="0.14" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={def('core')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.35" stopColor="currentColor" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={def('seam')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="currentColor" stopOpacity="0" />
          <stop offset="0.2" stopColor="currentColor" />
          <stop offset="0.5" stopColor="#fff" />
          <stop offset="0.8" stopColor="currentColor" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={def('fade')} cx={MOUTH.x} cy={MOUTH.y} r="132" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id={def('rays')} maskUnits="userSpaceOnUse" x="-40" y="-40" width="280" height="200">
          <rect x="-40" y="-40" width="280" height="200" fill={ref('fade')} />
        </mask>
        <clipPath id={def('dome')}>
          <path d="M36 106V91C36 75 60 67 100 67S164 75 164 91V106Z" />
        </clipPath>
        <filter id={def('soft')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
      </defs>

      {/* The light once it is out: a bloom, and the shafts through it. */}
      <g className={open ? (still ? 'chest-bloom-still' : 'chest-bloom') : 'chest-dark'}>
        <ellipse cx={MOUTH.x} cy={MOUTH.y - 8} rx="104" ry="92" fill={ref('bloom')} />
      </g>
      <g className={open ? (still ? 'chest-rays-still' : 'chest-rays') : 'chest-dark'} mask={ref('rays')}>
        <g className={`chest-rays-sway ${rainbow ? 'chest-rainbow' : ''}`} fill="currentColor">
          {RAYS.map((ray) => (
            <polygon key={ray.angle} points={rayPoints(ray)} opacity={0.18 + ray.width / 40} />
          ))}
        </g>
      </g>

      {/* Light leaking round the lid before it opens. Behind the chest, so all of
          it that is seen is what spills round the outline — the way light
          round a door reads in a dark room. */}
      <ellipse
        cx={MOUTH.x}
        cy="104"
        rx="86"
        ry="30"
        fill={ref('core')}
        className={lit ? (state === 'held' ? 'chest-backlight-held' : 'chest-backlight') : 'chest-dark'}
      />

      {/* The floor under it, which keeps it standing on something. */}
      <ellipse
        cx="100"
        cy="166"
        rx="66"
        ry="7"
        className={[
          'chest-shadow fill-black/60',
          inviting && state === 'shut' && 'chest-shadow-breathe',
          rattle >= 0 && HOPS[rattle],
        ]
          .filter(Boolean)
          .join(' ')}
      />

      <g className={object}>
        {/* The body: planks, the iron round its top and down its front, and its corners. */}
        <path d="M36 106H164V156A8 8 0 0 1 156 164H44A8 8 0 0 1 36 156Z" fill={ref('wood')} />
        <path d="M36 125H164M36 145H164" stroke="#2a1205" strokeOpacity="0.45" strokeWidth="1.4" />
        <path d="M36 126H164M36 146H164" stroke="#e7a25c" strokeOpacity="0.12" strokeWidth="1" />
        {STRAPS.map((x) => (
          <g key={x}>
            <rect x={x} y="106" width="12" height="58" fill={ref('strap')} />
            <circle cx={x + 6} cy="122" r="1.7" fill="#fff3c4" fillOpacity="0.85" />
            <circle cx={x + 6} cy="150" r="1.7" fill="#fff3c4" fillOpacity="0.85" />
          </g>
        ))}
        <path d="M36 150V156A8 8 0 0 0 44 164H52V150Z M164 150V156A8 8 0 0 1 156 164H148V150Z" fill={ref('band')} />
        <path d="M36 106H164V156A8 8 0 0 1 156 164H44A8 8 0 0 1 36 156Z" stroke="#2a1205" strokeWidth="2.4" strokeLinejoin="round" />

        {/* The mouth, dark until the lid is off it, and the light rising out of it. */}
        <path d="M40 106H160L156 116H44Z" fill={ref('mouth')} className={open ? 'opacity-100' : 'opacity-0'} />
        <ellipse
          cx={MOUTH.x}
          cy="108"
          rx="62"
          ry="9"
          fill={ref('core')}
          className={open ? (still ? 'chest-core-still' : 'chest-core') : 'chest-dark'}
        />

        {/* The lock, on the body. */}
        <rect x="87" y="110" width="26" height="28" rx="5" fill={ref('band')} stroke="#5a3608" strokeWidth="1.6" />
        <circle cx="100" cy="121" r="3.4" fill="#1a0b03" />
        <path d="M98.4 122.4 97.2 131H102.8L101.6 122.4Z" fill="#1a0b03" />

        {/* The lid: lifts clear on a spring and tips back, the hasp going with it. */}
        <g className={open ? (still ? 'chest-lid-still' : 'chest-lid') : undefined}>
          <path d="M36 106V91C36 75 60 67 100 67S164 75 164 91V106Z" fill={ref('lid')} />
          <g clipPath={ref('dome')}>
            <path d="M44 84Q100 64 156 84" stroke="#2a1205" strokeOpacity="0.35" strokeWidth="1.3" fill="none" />
            {STRAPS.map((x) => (
              <rect key={x} x={x} y="60" width="12" height="46" fill={ref('strap')} />
            ))}
            <rect x="36" y="99" width="128" height="7" fill={ref('band')} />
            <path d="M36 67H164V100H36Z" fill={ref('sheen')} />
            <g className={inviting && state === 'shut' ? 'chest-glint' : 'opacity-0'}>
              <rect x="-30" y="60" width="22" height="52" fill={ref('glint')} transform="skewX(-22)" />
            </g>
          </g>
          <path d="M36 106V91C36 75 60 67 100 67S164 75 164 91V106Z" stroke="#2a1205" strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M93 98H107V112A3 3 0 0 1 104 115H96A3 3 0 0 1 93 112Z" fill={ref('band')} stroke="#5a3608" strokeWidth="1.4" />
        </g>
      </g>

      {/* The crack of light where the lid meets the body, screened over all of it. */}
      <g className={lit ? (state === 'held' ? 'chest-seam-held' : 'chest-seam') : 'chest-dark'}>
        <rect x="28" y="99" width="144" height="14" rx="7" fill={ref('seam')} filter={ref('soft')} opacity="0.9" />
        <rect x="40" y="104" width="120" height="4" rx="2" fill={ref('seam')} />
        <rect x="58" y="105.2" width="84" height="1.6" rx="0.8" fill="#fff" />
      </g>
    </svg>
  )
}
