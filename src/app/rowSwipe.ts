/**
 * How far a finger must travel before the swipe locks to one axis — horizontal
 * for an action, vertical for a scroll — rather than still being a tap.
 */
export const SWIPE_AXIS_LOCK = 10

/**
 * How far a locked horizontal swipe must travel before it commits on release.
 * Short of that, the row snaps back.
 */
export const SWIPE_COMMIT = 72

/** Furthest the row may slide while revealing an action. */
export const SWIPE_MAX = 112

export type SwipeAxis = 'horizontal' | 'vertical'

/**
 * Once movement leaves the lock radius, pick the dominant axis. Null while the
 * finger is still inside it — a tap or a hold, not a swipe.
 */
export function lockSwipeAxis(dx: number, dy: number, lock: number = SWIPE_AXIS_LOCK): SwipeAxis | null {
  if (Math.hypot(dx, dy) < lock) return null
  return Math.abs(dx) >= Math.abs(dy) ? 'horizontal' : 'vertical'
}

export type SwipeAction = 'complete' | 'delete'

/**
 * Which action a horizontal offset commits to on release, or null while it is
 * still a preview that should snap back.
 */
export function swipeActionAt(offset: number, commit: number = SWIPE_COMMIT): SwipeAction | null {
  if (offset >= commit) return 'complete'
  if (offset <= -commit) return 'delete'
  return null
}

/** Keep the sliding row within the reveal, so a long drag does not run off. */
export function clampSwipeOffset(offset: number, max: number = SWIPE_MAX): number {
  return Math.max(-max, Math.min(max, offset))
}
