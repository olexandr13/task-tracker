/**
 * Pulling a sheet down by its handle to close it (UI-48): how far a finger must
 * travel to count as a pull, and how far or how fast a pull must be to close
 * the sheet on release rather than let it settle back.
 */

/** A press that travels less than this is a tap on the handle, not a pull. */
export const SHEET_TAP_SLOP = 6

/** Pulled at least this far down, a sheet closes on release — or a third of its height, if that is less. */
export const SHEET_CLOSE_DISTANCE = 96

/** Let go while still moving down at least this fast (pixels per millisecond), a sheet closes however short the pull. */
export const SHEET_CLOSE_SPEED = 0.5

/** How far down the sheet follows a finger that has moved `dy`: never up, the sheet being anchored to the bottom. */
export function sheetPull(dy: number): number {
  return Math.max(0, dy)
}

/**
 * Whether a sheet let go of `pull` pixels down, of `height` (0 when not known),
 * moving at `speed`, closes.
 */
export function closesSheet(pull: number, height: number, speed: number): boolean {
  if (pull < SHEET_TAP_SLOP) return false
  if (speed >= SHEET_CLOSE_SPEED) return true
  return pull >= (height > 0 ? Math.min(SHEET_CLOSE_DISTANCE, height / 3) : SHEET_CLOSE_DISTANCE)
}
