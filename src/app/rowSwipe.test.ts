import { describe, expect, it } from 'vitest'
import {
  clampSwipeOffset,
  lockSwipeAxis,
  SWIPE_AXIS_LOCK,
  SWIPE_COMMIT,
  SWIPE_MAX,
  swipeActionAt,
} from './rowSwipe'

describe('lockSwipeAxis', () => {
  it('stays undecided inside the lock radius', () => {
    expect(lockSwipeAxis(0, 0)).toBeNull()
    expect(lockSwipeAxis(SWIPE_AXIS_LOCK - 1, 0)).toBeNull()
    expect(lockSwipeAxis(0, SWIPE_AXIS_LOCK - 1)).toBeNull()
  })

  it('locks horizontal when sideways travel wins', () => {
    expect(lockSwipeAxis(SWIPE_AXIS_LOCK, 0)).toBe('horizontal')
    expect(lockSwipeAxis(20, 8)).toBe('horizontal')
    expect(lockSwipeAxis(-20, 8)).toBe('horizontal')
  })

  it('locks vertical when up-or-down travel wins', () => {
    expect(lockSwipeAxis(0, SWIPE_AXIS_LOCK)).toBe('vertical')
    expect(lockSwipeAxis(8, 20)).toBe('vertical')
  })
})

describe('swipeActionAt', () => {
  it('commits complete past the right threshold', () => {
    expect(swipeActionAt(SWIPE_COMMIT)).toBe('complete')
    expect(swipeActionAt(SWIPE_COMMIT - 1)).toBeNull()
  })

  it('commits delete past the left threshold', () => {
    expect(swipeActionAt(-SWIPE_COMMIT)).toBe('delete')
    expect(swipeActionAt(-(SWIPE_COMMIT - 1))).toBeNull()
  })
})

describe('clampSwipeOffset', () => {
  it('caps travel at the reveal width', () => {
    expect(clampSwipeOffset(SWIPE_MAX + 40)).toBe(SWIPE_MAX)
    expect(clampSwipeOffset(-(SWIPE_MAX + 40))).toBe(-SWIPE_MAX)
    expect(clampSwipeOffset(40)).toBe(40)
  })
})
