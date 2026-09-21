import { describe, expect, it } from 'vitest'
import { describeDuration, describeElapsedClock, describeLoggedAt, describeTimeProgress, describeTimeSummary, describeTimerRunning, parseDuration } from './durationLabels'

/* TIME ids refer to wiki/time-goals.md. */

describe('parseDuration (TIME-11)', () => {
  it('reads a bare number as minutes', () => {
    expect(parseDuration('45')).toBe(45)
    expect(parseDuration(' 90 ')).toBe(90)
  })

  it('reads minutes and hours the ways they are written', () => {
    expect(parseDuration('25m')).toBe(25)
    expect(parseDuration('25 min')).toBe(25)
    expect(parseDuration('1h')).toBe(60)
    expect(parseDuration('1 hour')).toBe(60)
    expect(parseDuration('2 hours')).toBe(120)
    expect(parseDuration('1.5h')).toBe(90)
    expect(parseDuration('1,5h')).toBe(90)
    expect(parseDuration('1h30')).toBe(90)
    expect(parseDuration('1h 30m')).toBe(90)
    expect(parseDuration('1H30M')).toBe(90)
    expect(parseDuration('1:30')).toBe(90)
    expect(parseDuration('0:45')).toBe(45)
  })

  it('reads nothing from what is not a length of time', () => {
    for (const text of ['', ' ', 'soon', 'h', '1:75', '-5', '1h30x', '1d']) {
      expect(parseDuration(text)).toBeNull()
    }
  })
})

describe('the wording', () => {
  it('spells a length out in hours and minutes', () => {
    expect(describeDuration(45)).toBe('45m')
    expect(describeDuration(60)).toBe('1h')
    expect(describeDuration(90)).toBe('1h 30m')
  })

  it('closes a row\'s detail up to fit under its control (TIME-12)', () => {
    expect(describeTimeProgress(20, 60)).toBe('20m/1h')
    expect(describeTimeProgress(65, 90)).toBe('1h05/1h30')
    expect(describeTimeProgress(20, null)).toBe('20m')
  })

  it('says how the time stands, with or without a goal', () => {
    expect(describeTimeSummary(20, 60)).toBe('20m of 1h')
    expect(describeTimeSummary(20, null)).toBe('20m spent')
    expect(describeTimeSummary(0, null)).toBe('No time goal')
  })

  it('spells a live run as a clock and as a running detail', () => {
    expect(describeElapsedClock(45)).toBe('0:45')
    expect(describeElapsedClock(125)).toBe('2:05')
    expect(describeElapsedClock(3723)).toBe('1:02:03')
    expect(describeTimerRunning(125)).toBe('2m running')
    expect(describeTimerRunning(45)).toBe('0m running')
  })

  it('gives a session its time today, and its day before that', () => {
    const now = new Date(2026, 8, 15, 18, 0)

    expect(describeLoggedAt(new Date(2026, 8, 15, 7, 5).toISOString(), now)).toBe('07:05')
    expect(describeLoggedAt(new Date(2026, 8, 14, 19, 30).toISOString(), now)).toBe('Sep 14, 19:30')
  })
})
