import { describe, expect, it } from 'vitest'
import { MAX_CATEGORIES } from '../core'
import { categoryColor, CATEGORY_COLORS, OTHER_COLOR } from './balanceColors'
import { chartCeiling, dayAxisLabel, describeDay, describeGridline } from './balanceLabels'

/* How the Balance charts read. BAL ids refer to wiki/balance.md. */

describe('the day-by-day chart (BAL-13)', () => {
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

describe('the colours (BAL-6)', () => {
  it('has one for each category there can be, and grey for anything beyond', () => {
    expect(CATEGORY_COLORS).toHaveLength(MAX_CATEGORIES)
    expect(new Set(CATEGORY_COLORS.map((color) => color.fill)).size).toBe(MAX_CATEGORIES)
    expect(categoryColor(0)).toBe(CATEGORY_COLORS[0])
    expect(categoryColor(MAX_CATEGORIES)).toBe(OTHER_COLOR)
  })
})
