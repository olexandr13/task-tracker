import { describe, expect, it } from 'vitest'
import { MAX_CATEGORIES } from '../core'
import { CHART_COLORS, chartColor, OTHER_COLOR } from './chartColors'
import { chartCeiling, dayAxisLabel, describeDay, describeGridline } from './chartLabels'
import { chartPieces } from './chartPieces'

/* How the charts of time spent read. BAL ids refer to wiki/balance.md, ACT ids to wiki/activity-log.md. */

describe('the day-by-day chart (BAL-13, ACT-14)', () => {
  it('reaches up to a round number of hours the busiest day fits under', () => {
    expect(chartCeiling(0)).toBe(3600)
    expect(chartCeiling(45 * 60)).toBe(3600)
    expect(chartCeiling(3600)).toBe(3600)
    expect(chartCeiling(3601)).toBe(2 * 3600)
    expect(chartCeiling(5 * 3600)).toBe(6 * 3600)
    expect(chartCeiling(13 * 3600)).toBe(16 * 3600)
    expect(chartCeiling(30 * 3600)).toBe(24 * 3600)
  })

  it('labels its gridlines in hours, or minutes under one', () => {
    expect([describeGridline(6 * 3600), describeGridline(3 * 3600), describeGridline(1800)]).toEqual(['6h', '3h', '30m'])
  })

  it('names each day of a week, and only every seventh of a month', () => {
    expect(dayAxisLabel('2026-09-14', 'week')).toBe('Mon')
    expect(['2026-09-01', '2026-09-02', '2026-09-08', '2026-09-29'].map((day) => dayAxisLabel(day, 'month'))).toEqual([
      '1',
      '',
      '8',
      '29',
    ])
    expect(describeDay('2026-09-15')).toBe('Tue, Sep 15')
  })
})

describe('the colours (BAL-6, ACT-16)', () => {
  it('has one for each category there can be, coming round again past them', () => {
    expect(CHART_COLORS).toHaveLength(MAX_CATEGORIES)
    expect(new Set(CHART_COLORS.map((color) => color.fill)).size).toBe(MAX_CATEGORIES)
    expect(chartColor(0)).toBe(CHART_COLORS[0])
    expect(chartColor(MAX_CATEGORIES)).toBe(CHART_COLORS[0])
    expect(chartColor(-1)).toBe(OTHER_COLOR)
  })
})

describe('the pieces', () => {
  it('keeps those with time, in the order given, their shares adding up to 100', () => {
    const color = CHART_COLORS[0]
    const pieces = chartPieces(
      [
        { key: 'a', label: 'A', seconds: 1, color },
        { key: 'b', label: 'B', seconds: 0, color },
        { key: 'c', label: 'C', seconds: 2, color },
      ],
      3,
    )

    expect(pieces.map((piece) => [piece.key, piece.share])).toEqual([
      ['a', 33],
      ['c', 67],
    ])
  })
})
