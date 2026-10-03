import type { ChestQuarter } from '../core'

/**
 * How long opening a chest takes, step by step (CHST-14).
 *
 * The same lengths are written into the keyframes in `src/styles.css`; changing
 * one means changing the other. They are gathered here because the shape of the
 * moment *is* these numbers: the crate unlocking, the screen coming on, the reel
 * running and slowing to a crawl, a beat with the marker on the card — and
 * then the card coming out.
 *
 * Everything up to the card coming out takes the same time whatever is inside,
 * so the wait itself never says what is coming. Only what follows it — how long
 * the sparks fly and the number counts — is longer for a bigger prize, by which
 * time the answer is already out.
 */

/** The squash as the crate is pressed, before the lock turns. */
export const CHEST_PRESS_MS = 140

/** When the lock dial turns, and when the latches let go with a hiss. */
export const CHEST_UNLOCK_AT = 140
export const CHEST_LATCH_AT = 440

/** When the crate drops away and the screen comes on behind it, as an old set does: a line, then the picture. */
export const CHEST_POWER_AT = 700

/** When the reel starts to run, and how long it runs for. */
export const CHEST_SPIN_AT = 980
export const CHEST_SPIN_MS = 4400

/** When the reel has stopped: the marker on the card, and nothing yet said. */
export const CHEST_LANDED_AT = CHEST_SPIN_AT + CHEST_SPIN_MS

/** When the card comes out of the screen, after a beat on it. */
export const CHEST_REVEAL_AT = CHEST_LANDED_AT + 260

/** When the points start counting up, a moment behind the card. */
export const CHEST_COUNT_AT = CHEST_REVEAL_AT + 220

/** How long the counting takes, by which quarter of the jackpot the opening came to. */
export const CHEST_COUNT_MS: Readonly<Record<ChestQuarter, number>> = {
  1: 500,
  2: 800,
  3: 1200,
  4: 1800,
}

/**
 * How long what is thrown out of the card lasts (`ChestBurst`), in sixtieths of
 * a second: the most each kind waits before it is thrown, and the least and the
 * most it lives once it is.
 */
export const CHEST_THROWN = {
  spark: { wait: 4, life: [22, 40] },
  ember: { wait: 20, life: [90, 150] },
  shard: { wait: 8, life: [70, 110] },
} as const

/** The longest anything thrown can last from the card coming out: the latest out, living longest. */
export const CHEST_SHOWER_MS = Math.ceil(
  (Math.max(...Object.values(CHEST_THROWN).map((kind) => kind.wait + kind.life[1])) * 1000) / 60,
)

/**
 * When the opening is over, counted from the press: the number has finished
 * counting and everything thrown has come down and gone. Until then the chest
 * takes no press at all (CHST-16) — worked out from the lengths above rather
 * than written down, so that making the counting or the sparks last longer can
 * never leave the chest taking a press while something is still moving on it.
 */
export const CHEST_SETTLED_AT = Math.max(
  CHEST_COUNT_AT + Math.max(...Object.values(CHEST_COUNT_MS)),
  CHEST_REVEAL_AT + CHEST_SHOWER_MS,
)

/** How long a refused press shakes the cabinet and jerks the dial for. */
export const CHEST_REFUSAL_MS = 420
