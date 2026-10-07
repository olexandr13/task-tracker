import type { CaseQuarter } from '../core'

/**
 * How long opening a case takes, step by step (CHST-14).
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
export const CASE_PRESS_MS = 140

/** When the lock dial turns, and when the latches let go with a hiss. */
export const CASE_UNLOCK_AT = 140
export const CASE_LATCH_AT = 440

/** When the crate drops away and the screen comes on behind it, as an old set does: a line, then the picture. */
export const CASE_POWER_AT = 700

/** When the reel starts to run, and how long it runs for. */
export const CASE_SPIN_AT = 980
export const CASE_SPIN_MS = 4400

/** When the reel has stopped: the marker on the card, and nothing yet said. */
export const CASE_LANDED_AT = CASE_SPIN_AT + CASE_SPIN_MS

/** When the card comes out of the screen, after a beat on it. */
export const CASE_REVEAL_AT = CASE_LANDED_AT + 260

/** When the points start counting up, a moment behind the card. */
export const CASE_COUNT_AT = CASE_REVEAL_AT + 220

/** How long the counting takes, by which quarter of the jackpot the opening came to. */
export const CASE_COUNT_MS: Readonly<Record<CaseQuarter, number>> = {
  1: 500,
  2: 800,
  3: 1200,
  4: 1800,
}

/**
 * How long what is thrown out of the card lasts (`CaseBurst`), in sixtieths of
 * a second: the most each kind waits before it is thrown, and the least and the
 * most it lives once it is.
 */
export const CASE_THROWN = {
  spark: { wait: 4, life: [22, 40] },
  ember: { wait: 20, life: [90, 150] },
  shard: { wait: 8, life: [70, 110] },
} as const

/** The longest anything thrown can last from the card coming out: the latest out, living longest. */
export const CASE_SHOWER_MS = Math.ceil(
  (Math.max(...Object.values(CASE_THROWN).map((kind) => kind.wait + kind.life[1])) * 1000) / 60,
)

/**
 * When the opening is over, counted from the press: the number has finished
 * counting and everything thrown has come down and gone. Until then Cases
 * takes no press at all (CHST-16) — worked out from the lengths above rather
 * than written down, so that making the counting or the sparks last longer can
 * never leave Cases taking a press while something is still moving on it.
 */
export const CASE_SETTLED_AT = Math.max(
  CASE_COUNT_AT + Math.max(...Object.values(CASE_COUNT_MS)),
  CASE_REVEAL_AT + CASE_SHOWER_MS,
)

/**
 * How long a result with no reel stays up before the cabinet leaves (CHST-18,
 * CHST-25). Less motion, and practice skipping the wait, put the number on
 * screen at once, so it needs a moment to be read.
 */
export const CASE_RESULT_HOLD_MS = 2000

/**
 * How long the full show's result stays up once it has settled, before the
 * cabinet leaves (CHST-25). The number has only just stopped counting, so it
 * gets a moment more to be read.
 */
export const CASE_LINGER_MS = 1000

/**
 * How the cabinet leaves (CHST-25): it switches off as an old set does — a
 * flare, the picture squeezed to a line, the line drawn in to a dot — and then
 * the room it took on the page closes up. Written into `.case-off` and
 * `.case-closing` in `src/styles.css` too.
 */
export const CASE_OFF_MS = 560
export const CASE_CLOSE_MS = 320

/** From the cabinet starting to switch off to its being gone from the page. */
export const CASE_LEAVE_MS = CASE_OFF_MS + CASE_CLOSE_MS

/** How long a refused press shakes the cabinet and jerks the dial for. */
export const CASE_REFUSAL_MS = 420
