import type { ChestTier } from '../core'

/**
 * How long opening a chest takes, step by step (CHST-14).
 *
 * The same lengths are written into the keyframes in `src/styles.css`; changing
 * one means changing the other. They are gathered here because the shape of the
 * moment *is* these numbers: a press that squashes the chest, three rattles
 * growing, a held beat that is almost still while the light builds, and then
 * the lid.
 *
 * Everything up to the burst takes the same time whatever is inside, so the wait
 * itself never says what is coming. Only what follows it — how long the coins
 * fly and the number counts — is longer for a bigger prize, by which time the
 * answer is already out.
 */

/** The squash as the chest is pressed, before the lock turns. */
export const CHEST_PRESS_MS = 160

/** When each rattle begins, and how long it shakes for. */
export const CHEST_RATTLES: readonly { readonly at: number; readonly ms: number }[] = [
  { at: 180, ms: 260 },
  { at: 720, ms: 300 },
  { at: 1320, ms: 380 },
]

/** When the light along the lid seam first shows: with the second rattle. */
export const CHEST_SEAM_AT = 720

/** When the light takes on its colour: with the third, which is the tell (CHST-15). */
export const CHEST_COLOUR_AT = 1320

/** When the rattling stops and the chest goes almost still — the beat that does the work. */
export const CHEST_HELD_AT = 1760

/** When the lid goes. */
export const CHEST_BURST_AT = 2300

/** When the points start counting up, a moment behind the lid. */
export const CHEST_COUNT_AT = 2480

/** How long the counting takes, by how rich the opening was. */
export const CHEST_COUNT_MS: Readonly<Record<ChestTier, number>> = {
  pinch: 500,
  handful: 800,
  haul: 1200,
  jackpot: 1800,
}

/**
 * How long what is thrown out of the lid lasts (`ChestBurst`), in sixtieths of
 * a second: the most each kind waits before it is thrown, and the least and the
 * most it lives once it is.
 */
export const CHEST_THROWN = {
  coin: { wait: 14, life: [96, 128] },
  spark: { wait: 6, life: [40, 85] },
  gem: { wait: 18, life: [100, 140] },
} as const

/** The longest anything thrown can last from the lid going: the latest out, living longest. */
export const CHEST_SHOWER_MS = Math.ceil(
  (Math.max(...Object.values(CHEST_THROWN).map((kind) => kind.wait + kind.life[1])) * 1000) / 60,
)

/**
 * When the opening is over, counted from the press: the number has finished
 * counting and everything thrown out of the lid has come down and gone. Until
 * then the chest takes no press at all (CHST-16) — worked out from the lengths
 * above rather than written down, so that making the counting or the coins last
 * longer can never leave the chest taking a press while something is still
 * moving on it.
 */
export const CHEST_SETTLED_AT = Math.max(
  CHEST_COUNT_AT + Math.max(...Object.values(CHEST_COUNT_MS)),
  CHEST_BURST_AT + CHEST_SHOWER_MS,
)

/** How long a refused press rattles the lock for. */
export const CHEST_REFUSAL_MS = 420
