import { isPrizeName, isPrizePoints, PRIZE_KINDS, type Prize, type PrizeKind } from '../core'
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
 * kind it was written as.
 */
export const PRIZE_SCHEMA_VERSION = 2

export interface StoredPrize {
  version: number
  prize: Prize
}

export function toStoredPrize(prize: Prize): StoredPrize {
  return { version: PRIZE_SCHEMA_VERSION, prize }
}

/**
 * A saved prize in today's shape, upgraded from the one before it, or null when
 * it can't be trusted — an unknown version, or anything in it that is not what
 * it should be. A prize that cannot be read is left unread rather than deleted,
 * as a list is.
 */
export function readPrize(data: unknown): Prize | null {
  if (!isRecord(data) || !isRecord(data.prize)) return null
  if (data.version !== PRIZE_SCHEMA_VERSION && data.version !== 1) return null

  const { id, name, points, kind, boughtAt, createdAt } = data.prize
  if (
    typeof id !== 'string' ||
    id === '' ||
    typeof name !== 'string' ||
    !isPrizeName(name) ||
    typeof points !== 'number' ||
    !isPrizePoints(points) ||
    typeof createdAt !== 'string' ||
    Number.isNaN(new Date(createdAt).getTime())
  ) {
    return null
  }

  // Version 1 knew only one kind, and nothing was ever bought.
  if (data.version === 1) return { id, name, points, kind: 'prize', boughtAt: null, createdAt }

  if (typeof kind !== 'string' || !(PRIZE_KINDS as readonly string[]).includes(kind)) return null
  if (boughtAt !== null && (typeof boughtAt !== 'string' || Number.isNaN(new Date(boughtAt).getTime()))) return null
  // Only a wish is ever bought: a prize comes round again.
  if (kind === 'prize' && boughtAt !== null) return null

  return { id, name, points, kind: kind as PrizeKind, boughtAt, createdAt }
}
