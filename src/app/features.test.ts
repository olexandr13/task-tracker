import { describe, expect, it } from 'vitest'
import { isViewOn, modesShown, morePagesShown, nearestViewOn, rewardsPagesShown } from './features'
import { oneListView, tagView } from './view'

/* Which pages a feature switched off takes away. FEAT ids refer to wiki/features.md. */

describe('the pages there are (FEAT-2)', () => {
  it('is every one while nothing is switched off', () => {
    for (const view of ['habits', 'rewards', 'rewards/cases', 'lists', 'inbox', 'tags', 'balance', 'activity', 'journal', 'modes', 'more'] as const) {
      expect(isViewOn(view, [])).toBe(true)
    }
  })

  it('takes a feature’s pages away with it, those under it too', () => {
    expect(isViewOn('habits', ['habits'])).toBe(false)
    expect(isViewOn('rewards/history', ['rewards'])).toBe(false)
    expect(isViewOn(oneListView('list-1'), ['lists'])).toBe(false)
    expect(isViewOn('inbox', ['lists'])).toBe(false)
    expect(isViewOn(tagView('work'), ['tags'])).toBe(false)
    expect(isViewOn('modes/nudge', ['modes'])).toBe(false)
    expect(isViewOn('journal', ['journal'])).toBe(false)
  })

  it('takes Cases away on its own, and with Rewards (FEAT-4)', () => {
    expect(isViewOn('rewards/cases', ['cases'])).toBe(false)
    expect(isViewOn('rewards', ['cases'])).toBe(true)
    expect(isViewOn('rewards/cases', ['rewards'])).toBe(false)
  })

  it('takes a mode away with what it needs (FEAT-9)', () => {
    expect(isViewOn('modes/warm-up', ['habits'])).toBe(false)
    expect(isViewOn('modes/check-in', ['activity'])).toBe(false)
    expect(isViewOn('modes/procrastination', ['habits', 'activity'])).toBe(true)
  })

  it('takes More away once everything on it is', () => {
    expect(isViewOn('more', ['lists', 'tags', 'balance', 'activity', 'modes'])).toBe(true)
    expect(isViewOn('more', ['lists', 'tags', 'balance', 'activity', 'journal', 'modes'])).toBe(false)
  })

  it('never takes the tasks, the trash or settings away', () => {
    const everything = ['habits', 'rewards', 'lists', 'tags', 'balance', 'activity', 'journal', 'modes', 'progress', 'quote', 'reminders'] as const
    for (const view of ['today', 'week', 'month', 'tasks', 'trash', 'settings'] as const) {
      expect(isViewOn(view, everything)).toBe(true)
    }
  })
})

describe('where the address of a page switched off lands (FEAT-2)', () => {
  it('stays where it is while the page is on', () => {
    expect(nearestViewOn('rewards/cases', [])).toBe('rewards/cases')
  })

  it('climbs to the nearest page above it that is on', () => {
    expect(nearestViewOn('rewards/cases', ['cases'])).toBe('rewards')
    expect(nearestViewOn(oneListView('list-1'), ['lists'])).toBe('tasks')
    expect(nearestViewOn('modes/check-in', ['activity'])).toBe('modes')
    expect(nearestViewOn('balance', ['balance'])).toBe('more')
    expect(nearestViewOn('journal', ['journal'])).toBe('more')
  })

  it('lands on Today when nothing above it is on', () => {
    expect(nearestViewOn('habits', ['habits'])).toBe('today')
    expect(nearestViewOn('rewards/history', ['rewards'])).toBe('today')
    expect(nearestViewOn('modes', ['lists', 'tags', 'balance', 'activity', 'journal', 'modes'])).toBe('today')
  })
})

describe('what the lists of pages hold', () => {
  it('leaves Cases out from under Rewards while it is off', () => {
    expect(rewardsPagesShown(['cases'])).toEqual(['rewards/history', 'rewards/prizes', 'rewards/wishlist', 'rewards/rules'])
  })

  it('leaves out the modes whose feature is off (FEAT-9)', () => {
    expect(modesShown(['habits'])).toEqual(['modes/procrastination', 'modes/nudge', 'modes/check-in'])
    expect(modesShown(['modes'])).toEqual([])
  })

  it('leaves out More’s pages that are off, Balance with the tags it divides time by (FEAT-4)', () => {
    expect(morePagesShown(['activity', 'journal', 'modes'])).toEqual(['lists', 'tags', 'balance'])
    expect(morePagesShown(['tags'])).toEqual(['lists', 'modes', 'activity', 'journal'])
  })
})
