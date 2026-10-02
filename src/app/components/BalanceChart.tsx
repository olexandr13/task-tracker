import type { Period } from '../../core'
import { describeBalanceTime, describeBar } from '../balanceLabels'
import type { BalancePiece, PieceKey } from '../balancePieces'

/** A share is written inside its piece only from this size up, where it fits even on a phone. */
const LABELLED_SHARE = 12

const rowIdle = 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
/** A legend row pressed, its category picked out: shaded as a row under the pointer is. */
const rowPressed = 'bg-neutral-100 dark:bg-neutral-800'

interface BalanceChartProps {
  pieces: readonly BalancePiece[]
  total: number
  period: Period
  /** The piece picked out, the rest faded (BAL-6), or null for none. */
  active: PieceKey | null
  /** The piece pressed in the legend, which stays picked out until pressed again. */
  pinned: PieceKey | null
  onPin: (key: PieceKey) => void
  /** A piece pointed at or focused, picked out while it is; null when it is left. */
  onPreview: (key: PieceKey | null) => void
}

/**
 * The time spent in the period as one chart (BAL-6): the total, a single bar
 * divided into a piece per category and Other, and under it the legend, which
 * names every piece with its time and share — the colours are never the only
 * way to tell the pieces apart. A piece of the legend pressed picks its
 * category out, here and in the day-by-day chart.
 */
export function BalanceChart({ pieces, total, period, active, pinned, onPin, onPreview }: BalanceChartProps) {
  const faded = (key: PieceKey) => active !== null && key !== active

  return (
    <div className="flex flex-col gap-3">
      <p className="text-3xl leading-9 font-semibold text-neutral-900 dark:text-neutral-100">
        {describeBalanceTime(total)}
      </p>

      {/* The gaps between pieces are the card showing through; the outer ends are rounded. */}
      <div role="img" aria-label={describeBar(pieces, total, period)} className="flex h-5 w-full gap-0.5 overflow-hidden rounded-[4px]">
        {pieces.map((piece) => (
          <div
            key={piece.key}
            onPointerEnter={() => { onPreview(piece.key) }}
            onPointerLeave={() => { onPreview(null) }}
            className={`flex min-w-[3px] items-center justify-center transition-opacity ${piece.color.fill}${faded(piece.key) ? ' opacity-25' : ''}`}
            style={{ flexGrow: piece.seconds, flexBasis: 0 }}
            data-piece={piece.key}
          >
            {piece.share >= LABELLED_SHARE && (
              <span aria-hidden="true" className={`text-[11px] leading-none font-medium tabular-nums ${piece.color.ink}`}>
                {piece.share}%
              </span>
            )}
          </div>
        ))}
      </div>

      <ul aria-label="Legend" className="-mx-2 flex flex-col">
        {pieces.map((piece) => (
          <li key={piece.key}>
            <button
              type="button"
              aria-pressed={pinned === piece.key}
              aria-label={`${piece.label}: ${describeBalanceTime(piece.seconds)}, ${String(piece.share)}%`}
              onClick={() => { onPin(piece.key) }}
              onPointerEnter={() => { onPreview(piece.key) }}
              onPointerLeave={() => { onPreview(null) }}
              onFocus={() => { onPreview(piece.key) }}
              onBlur={() => { onPreview(null) }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-[background-color,opacity] ${
                pinned === piece.key ? rowPressed : rowIdle
              }${faded(piece.key) ? ' opacity-40' : ''}`}
            >
              <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-[3px] ${piece.color.fill}`} />
              <span className="min-w-0 flex-1 truncate text-neutral-800 dark:text-neutral-200">{piece.label}</span>
              <span className="shrink-0 tabular-nums text-neutral-900 dark:text-neutral-100">
                {describeBalanceTime(piece.seconds)}
              </span>
              <span className="w-10 shrink-0 text-right tabular-nums text-neutral-500 dark:text-neutral-400">
                {piece.share}%
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
