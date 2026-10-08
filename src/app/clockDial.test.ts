import { describe, expect, it } from 'vitest'
import {
  comingHour,
  hourAt,
  ringAtDistance,
  ringOf,
  RING_RADIUS,
  stepAtPoint,
  stepOffset,
  stepOf,
  readTyped,
  timeAt,
  timeParts,
  withHour,
  typedDigits,
  withMinute,
  wrapStep,
} from './clockDial'

/* The clock face, and the hour picked off it (DUE-24). */

describe('the face', () => {
  it('numbers the hours from midnight at the top, clockwise, twice round', () => {
    expect(stepOf(0, 'hour')).toBe(0)
    expect(stepOf(12, 'hour')).toBe(0)
    expect(stepOf(3, 'hour')).toBe(3)
    expect(stepOf(15, 'hour')).toBe(3)
  })

  it('numbers the minutes as themselves', () => {
    expect(stepOf(35, 'minute')).toBe(35)
  })

  it('writes the morning on the outer ring and the rest of the day on the inner', () => {
    expect(ringOf(0)).toBe('outer')
    expect(ringOf(11)).toBe('outer')
    expect(ringOf(12)).toBe('inner')
    expect(ringOf(23)).toBe('inner')
  })

  it('reads the hour at a step of a ring, a ring in being twelve hours on', () => {
    expect(hourAt(0, 'outer')).toBe(0)
    expect(hourAt(0, 'inner')).toBe(12)
    expect(hourAt(9, 'outer')).toBe(9)
    expect(hourAt(9, 'inner')).toBe(21)
  })

  it('comes round to the start rather than off the end', () => {
    expect(wrapStep(12, 12)).toBe(0)
    expect(wrapStep(-1, 12)).toBe(11)
    expect(wrapStep(-1, 60)).toBe(59)
    expect(hourAt(12, 'outer')).toBe(0)
    expect(hourAt(-1, 'inner')).toBe(23)
  })
})

describe('where a step sits', () => {
  /** Rounded, the arithmetic having no business being compared to the atom. */
  const at = (step: number, steps: number) => {
    const { x, y } = stepOffset(step, steps)
    // `|| 0` for the negative zero the arithmetic leaves behind, which is a zero.
    return { x: (Math.round(x * 1000) || 0) / 1000, y: (Math.round(y * 1000) || 0) / 1000 }
  }

  it('puts midnight at the top and 6 at the foot, y counting down the screen', () => {
    expect(at(0, 12)).toEqual({ x: 0, y: -1 })
    expect(at(6, 12)).toEqual({ x: 0, y: 1 })
  })

  it('runs clockwise, 3 to the right and 9 to the left', () => {
    expect(at(3, 12)).toEqual({ x: 1, y: 0 })
    expect(at(9, 12)).toEqual({ x: -1, y: 0 })
  })

  it('spaces the minutes the same way round the same face', () => {
    expect(at(15, 60)).toEqual({ x: 1, y: 0 })
    expect(at(30, 60)).toEqual({ x: 0, y: 1 })
  })
})

describe('the step a point is over', () => {
  it('reads the way the point lies, not how far out it is', () => {
    expect(stepAtPoint(0, -80, 12)).toBe(0)
    expect(stepAtPoint(0, -8, 12)).toBe(0)
    expect(stepAtPoint(200, 0, 12)).toBe(3)
    expect(stepAtPoint(0, 50, 12)).toBe(6)
    expect(stepAtPoint(-50, 0, 12)).toBe(9)
  })

  it('takes the nearest number to a point between two', () => {
    // A shade clockwise of 3 o'clock is still 3, and a shade past 5 to the hour is 11.
    expect(stepAtPoint(100, 5, 12)).toBe(3)
    expect(stepAtPoint(-40, -90, 12)).toBe(11)
  })

  it('reads a minute of its own, the face being sixty steps', () => {
    expect(stepAtPoint(0, -100, 60)).toBe(0)
    expect(stepAtPoint(100, 0, 60)).toBe(15)
    expect(stepAtPoint(-100, 0, 60)).toBe(45)
  })

  it('comes round the face rather than counting past it', () => {
    // Just anticlockwise of noon is the last step, not one before the first.
    expect(stepAtPoint(-1, -100, 12)).toBe(0)
    expect(stepAtPoint(-30, -100, 60)).toBe(57)
  })

  it('reads the middle as the top, there being no way it lies', () => {
    expect(stepAtPoint(0, 0, 12)).toBe(0)
  })
})

describe('the ring a point is on', () => {
  it('parts the two rings half way between them', () => {
    const between = (RING_RADIUS.outer + RING_RADIUS.inner) / 2
    expect(ringAtDistance(between - 0.01)).toBe('inner')
    expect(ringAtDistance(between + 0.01)).toBe('outer')
  })

  it('reads the middle as the inner ring and anything past the face as the outer', () => {
    expect(ringAtDistance(0)).toBe('inner')
    expect(ringAtDistance(RING_RADIUS.inner)).toBe('inner')
    expect(ringAtDistance(RING_RADIUS.outer)).toBe('outer')
    expect(ringAtDistance(2)).toBe('outer')
  })
})

describe('the hour the face stands for', () => {
  it('splits a time into its hours and minutes', () => {
    expect(timeParts('09:05')).toEqual({ hour: 9, minute: 5 })
    expect(timeParts('23:59')).toEqual({ hour: 23, minute: 59 })
  })

  it('refuses anything that is not a time', () => {
    expect(() => timeParts('9:00')).toThrow()
    expect(() => timeParts('24:00')).toThrow()
  })

  it('writes an hour and a minute as a time, padded', () => {
    expect(timeAt(9, 5)).toBe('09:05')
    expect(timeAt(0, 0)).toBe('00:00')
    expect(timeAt(23, 59)).toBe('23:59')
  })

  it('comes round the day rather than counting past it', () => {
    expect(timeAt(24, 0)).toBe('00:00')
    expect(timeAt(-1, 0)).toBe('23:00')
  })
})

describe('setting the hour from the face', () => {
  it('sets the hour of the day, the minutes untouched', () => {
    expect(withHour('14:30', 3)).toBe('03:30')
    expect(withHour('02:30', 15)).toBe('15:30')
    expect(withHour('14:30', 0)).toBe('00:30')
  })

  it('sets the minutes, the hour untouched', () => {
    expect(withMinute('14:30', 7)).toBe('14:07')
    expect(withMinute('14:30', 0)).toBe('14:00')
  })
})

describe('where the dial opens with no hour set', () => {
  it('is the hour coming, on the hour', () => {
    expect(comingHour(new Date(2026, 8, 16, 14, 20))).toBe('15:00')
    expect(comingHour(new Date(2026, 8, 16, 9, 0))).toBe('10:00')
  })

  it('comes round the midnight rather than past it', () => {
    expect(comingHour(new Date(2026, 8, 16, 23, 40))).toBe('00:00')
  })
})

describe('an hour typed into the readout', () => {
  it('keeps the digits, two at most, a third starting the number again', () => {
    expect(typedDigits('1')).toBe('1')
    expect(typedDigits('14')).toBe('14')
    expect(typedDigits('145')).toBe('5')
    expect(typedDigits('1a')).toBe('1')
    expect(typedDigits('')).toBe('')
  })

  it('reads an hour, all said at two digits or at one no second could follow', () => {
    expect(readTyped('1', 'hour')).toEqual({ value: 1, complete: false })
    expect(readTyped('2', 'hour')).toEqual({ value: 2, complete: false })
    expect(readTyped('3', 'hour')).toEqual({ value: 3, complete: true })
    expect(readTyped('14', 'hour')).toEqual({ value: 14, complete: true })
    expect(readTyped('06', 'hour')).toEqual({ value: 6, complete: true })
    expect(readTyped('23', 'hour')).toEqual({ value: 23, complete: true })
  })

  it('reads the minutes the same way, up to 59', () => {
    expect(readTyped('5', 'minute')).toEqual({ value: 5, complete: false })
    expect(readTyped('6', 'minute')).toEqual({ value: 6, complete: true })
    expect(readTyped('59', 'minute')).toEqual({ value: 59, complete: true })
  })

  it('reads nothing into digits that are no hour or minute', () => {
    expect(readTyped('24', 'hour')).toBeNull()
    expect(readTyped('60', 'minute')).toBeNull()
    expect(readTyped('', 'hour')).toBeNull()
  })
})
