import { isPrizeName, isPrizePoints, priceOf, PRIZE_KINDS, type Prize, type PrizeKind, type PrizePrice } from '../core'
import { isRecord } from './plainData'

/**
 * The saved shape of a prize. Its own version, apart from the points ledger's:
 * what the points are spent on and what completions earned have no reason to
 * change shape together, and a redemption keeps the name it was made under
 * rather than pointing at a prize (../core/prize). Bump this whenever the shape
 * below changes, and upgrade on reading.
 *
 * Version 1 knew only one kind, before the wishlist was told from the prizes
 * (RWD-40): one saved then is read as a **prize**, which comes round again — the
 * kind it was written as. Versions 1 and 2 priced everything in points, as a
 * bare `points`, before a wish could be priced in money (RWD-47): one saved then
 * is read as priced in those points.
 */
export const PRIZE_SCHEMA_VERSION = 3

export interface StoredPrize {
  version: number
  prize: Prize
}

export function toStoredPrize(prize: Prize): StoredPrize {
  return { version: PRIZE_SCHEMA_VERSION, prize }
}

/** A saved price, in points or in money, or null when it is not one. */
function readPrice(data: unknown): PrizePrice | null {
  if (!isRecord(data)) return null
  if (data.in === 'points') {
    return typeof data.points === 'number' && isPrizePoints(data.points) ? { in: 'points', points: data.points } : null
  }
  if (data.in === 'money' && typeof data.amount === 'number' && typeof data.currency === 'string') {
    return priceOf(data.amount, { in: 'money', currency: data.currency })
  }
  return null
}

/**
 * A saved prize in today's shape, upgraded from the ones before it, or null when
 * it can't be trusted — an unknown version, or anything in it that is not what
 * it should be. A prize that cannot be read is left unread rather than deleted,
 * as a list is.
 */
export function readPrize(data: unknown): Prize | null {
  if (!isRecord(data) || !isRecord(data.prize)) return null
  if (data.version !== PRIZE_SCHEMA_VERSION && data.version !== 2 && data.version !== 1) return null

  const { id, name, points, kind, boughtAt, createdAt } = data.prize
  // Before version 3 every price was a bare number of points.
  const price =
    data.version === PRIZE_SCHEMA_VERSION
      ? readPrice(data.prize.price)
      : typeof points === 'number' && isPrizePoints(points)
        ? ({ in: 'points', points } as const)
        : null
  if (
    typeof id !== 'string' ||
    id === '' ||
    typeof name !== 'string' ||
    !isPrizeName(name) ||
    price === null ||
    typeof createdAt !== 'string' ||
    Number.isNaN(new Date(createdAt).getTime())
  ) {
    return null
  }

  // Version 1 knew only one kind, and nothing was ever bought.
  if (data.version === 1) return { id, name, price, kind: 'prize', boughtAt: null, createdAt }

  if (typeof kind !== 'string' || !(PRIZE_KINDS as readonly string[]).includes(kind)) return null
  if (boughtAt !== null && (typeof boughtAt !== 'string' || Number.isNaN(new Date(boughtAt).getTime()))) return null
  // Only a wish is ever bought: a prize comes round again.
  if (kind === 'prize' && boughtAt !== null) return null

  return { id, name, price, kind: kind as PrizeKind, boughtAt, createdAt }
}
