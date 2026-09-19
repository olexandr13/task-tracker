import { describe, expect, it } from 'vitest'
import { describeRepeat, describeRepeatBriefly } from './repeatLabels'

describe('describeRepeat', () => {
  it('reads each kind of rule briefly', () => {
    expect(describeRepeat({ kind: 'daily' })).toBe('Daily')
    expect(describeRepeat({ kind: 'weekly', weekdays: [3, 1] })).toBe('Every Mon, Wed')
    expect(describeRepeat({ kind: 'monthly', day: 23 })).toBe('Every 23rd')
  })

  it('reads a weekly rule on all seven days as daily', () => {
    expect(describeRepeat({ kind: 'weekly', weekdays: [0, 1, 2, 3, 4, 5, 6] })).toBe('Daily')
  })

  it('names Monday to Friday and Saturday with Sunday, which need no "every"', () => {
    expect(describeRepeat({ kind: 'weekly', weekdays: [5, 4, 3, 2, 1] })).toBe('Workdays')
    expect(describeRepeat({ kind: 'weekly', weekdays: [6, 0] })).toBe('Weekends')
    expect(describeRepeatBriefly({ kind: 'weekly', weekdays: [1, 2, 3, 4, 5] })).toBe('Workdays')
    expect(describeRepeatBriefly({ kind: 'weekly', weekdays: [0, 6] })).toBe('Weekends')
  })

  it('names Sunday to Thursday "Workdays" too, the working week where the weekend is Friday and Saturday', () => {
    expect(describeRepeat({ kind: 'weekly', weekdays: [4, 3, 2, 1, 0] })).toBe('Workdays')
    expect(describeRepeatBriefly({ kind: 'weekly', weekdays: [0, 1, 2, 3, 4] })).toBe('Workdays')
  })

  it('lists the days of a week that is only close to a named one', () => {
    expect(describeRepeat({ kind: 'weekly', weekdays: [1, 2, 3, 4] })).toBe('Every Mon, Tue, Wed, Thu')
    expect(describeRepeat({ kind: 'weekly', weekdays: [0, 1, 2, 3, 4, 5] })).toBe('Every Mon, Tue, Wed, Thu, Fri, Sun')
    expect(describeRepeatBriefly({ kind: 'weekly', weekdays: [6] })).toBe('Sat')
  })

  it('lists the days Monday first, Sunday last', () => {
    expect(describeRepeatBriefly({ kind: 'weekly', weekdays: [0, 3] })).toBe('Wed, Sun')
  })
})

describe('describeRepeatBriefly', () => {
  it('leaves "every" to the icon beside it', () => {
    expect(describeRepeatBriefly({ kind: 'daily' })).toBe('Daily')
    expect(describeRepeatBriefly({ kind: 'weekly', weekdays: [3, 1] })).toBe('Mon, Wed')
    expect(describeRepeatBriefly({ kind: 'monthly', day: 23 })).toBe('23rd')
    expect(describeRepeatBriefly({ kind: 'weekly', weekdays: [0, 1, 2, 3, 4, 5, 6] })).toBe('Daily')
  })
})
