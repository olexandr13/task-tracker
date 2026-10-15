import { describe, expect, it } from 'vitest'
import { createList } from '../core'
import {
  isViewOn,
  modesShown,
  morePagesShown,
  nearestViewOn,
  organizePagesShown,
  reflectPagesShown,
  rewardsPagesShown,
  sectionPagesShown,
} from './features'
import { goalView, oneListView, tagView } from './view'

/* Which pages a feature switched off takes away. FEAT ids refer to wiki/features.md. */

describe('the pages there are (FEAT-2)', () => {
  it('is every one while nothing is switched off', () => {
    for (const view of ['habits', 'rewards', 'rewards/cases', 'lists', 'inbox', 'goals', 'tags', 'notes', 'balance', 'activity', 'journal', 'modes', 'organize', 'reflect', 'more'] as const) {
      expect(isViewOn(view, [])).toBe(true)
    }
  })

  it('takes a feature’s pages away with it, those under it too', () => {
    expect(isViewOn('habits', ['habits'])).toBe(false)
    expect(isViewOn('rewards/history', ['rewards'])).toBe(false)
    expect(isViewOn(oneListView('list-1'), ['lists'])).toBe(false)
    expect(isViewOn('inbox', ['lists'])).toBe(false)
    expect(isViewOn('goals', ['goals'])).toBe(false)
    expect(isViewOn(goalView('goal-1'), ['goals'])).toBe(false)
    expect(isViewOn(tagView('work'), ['tags'])).toBe(false)
    expect(isViewOn('modes/nudge', ['modes'])).toBe(false)
    expect(isViewOn('journal', ['journal'])).toBe(false)
    expect(isViewOn('notes', ['notes'])).toBe(false)
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

  it('takes Organize away once everything under it is, whatever Modes is (UI-81, MODE-1)', () => {
    expect(isViewOn('organize', ['tags'])).toBe(true)
    expect(isViewOn('organize', ['notes', 'modes'])).toBe(true)
    expect(isViewOn('organize', ['tags', 'notes'])).toBe(false)
  })

  it('takes Reflect away once everything under it is (UI-83)', () => {
    expect(isViewOn('reflect', ['balance', 'activity'])).toBe(true)
    expect(isViewOn('reflect', ['tags', 'activity'])).toBe(true)
    expect(isViewOn('reflect', ['balance', 'activity', 'journal'])).toBe(false)
  })

  it('takes More away once everything on it is', () => {
    expect(isViewOn('more', ['lists', 'tags', 'balance', 'activity', 'journal', 'modes'])).toBe(true)
    expect(isViewOn('more', ['lists', 'tags', 'notes', 'balance', 'activity', 'journal', 'modes'])).toBe(true)
    expect(isViewOn('more', ['levels', 'lists', 'tags', 'notes', 'balance', 'activity', 'journal', 'notifications'])).toBe(true)
    expect(
      isViewOn('more', ['levels', 'lists', 'goals', 'tags', 'notes', 'balance', 'activity', 'journal', 'modes', 'notifications']),
    ).toBe(false)
  })

  it('takes Notifications away with its switch (NOTIF-8)', () => {
    expect(isViewOn('notifications', [])).toBe(true)
    expect(isViewOn('notifications', ['notifications'])).toBe(false)
  })

  it('never takes the tasks, the trash or settings away', () => {
    const everything = ['habits', 'rewards', 'lists', 'goals', 'tags', 'notes', 'balance', 'activity', 'journal', 'modes', 'progress', 'quote', 'reminders'] as const
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
    expect(nearestViewOn(goalView('goal-1'), ['goals'])).toBe('more')
    expect(nearestViewOn('modes/check-in', ['activity'])).toBe('modes')
    expect(nearestViewOn('balance', ['balance'])).toBe('reflect')
    expect(nearestViewOn('journal', ['journal'])).toBe('reflect')
    expect(nearestViewOn('journal', ['balance', 'activity', 'journal'])).toBe('more')
    expect(nearestViewOn('notes', ['notes'])).toBe('organize')
    expect(nearestViewOn('tags', ['tags'])).toBe('organize')
    expect(nearestViewOn('notes', ['tags', 'notes'])).toBe('more')
    expect(nearestViewOn('modes', ['modes'])).toBe('more')
  })

  it('lands on Today when nothing above it is on', () => {
    expect(nearestViewOn('habits', ['habits'])).toBe('today')
    expect(nearestViewOn('rewards/history', ['rewards'])).toBe('today')
    expect(
      nearestViewOn('modes', ['levels', 'lists', 'goals', 'tags', 'notes', 'balance', 'activity', 'journal', 'modes', 'notifications']),
    ).toBe('today')
  })

  it('lands on More for Notifications switched off (NOTIF-8)', () => {
    expect(nearestViewOn('notifications', ['notifications'])).toBe('more')
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

  it('leaves out More’s pages that are off, Reflect once Balance goes with the tags it divides time by (FEAT-4)', () => {
    expect(morePagesShown([])).toEqual(['lists', 'goals', 'level', 'modes', 'organize', 'reflect', 'notifications'])
    expect(morePagesShown(['levels', 'notes', 'activity', 'journal', 'modes'])).toEqual(['lists', 'goals', 'organize', 'reflect', 'notifications'])
    expect(morePagesShown(['levels', 'goals', 'tags', 'notes', 'modes', 'notifications'])).toEqual(['lists', 'reflect'])
    expect(morePagesShown(['levels', 'goals', 'tags', 'activity', 'journal'])).toEqual(['lists', 'modes', 'organize', 'notifications'])
  })

  it('leaves out Organize’s pages that are off (UI-81)', () => {
    expect(organizePagesShown([])).toEqual(['tags', 'notes'])
    expect(organizePagesShown(['notes'])).toEqual(['tags'])
    expect(organizePagesShown(['tags', 'notes'])).toEqual([])
  })

  it('leaves out Reflect’s pages that are off, Balance with the tags (UI-83, FEAT-4)', () => {
    expect(reflectPagesShown([])).toEqual(['balance', 'activity', 'journal'])
    expect(reflectPagesShown(['tags'])).toEqual(['activity', 'journal'])
    expect(reflectPagesShown(['balance', 'activity', 'journal'])).toEqual([])
  })

  it('heads each section\'s strip with the section, then what is under it in the sidebar (UI-84)', () => {
    expect(sectionPagesShown('rewards', ['cases'])).toEqual([
      'rewards',
      'rewards/history',
      'rewards/prizes',
      'rewards/wishlist',
      'rewards/rules',
    ])
    expect(sectionPagesShown('modes', ['habits'])).toEqual(['modes', 'modes/procrastination', 'modes/nudge', 'modes/check-in'])
    expect(sectionPagesShown('organize', [])).toEqual(['organize', 'tags', 'notes'])
    expect(sectionPagesShown('reflect', ['journal'])).toEqual(['reflect', 'balance', 'activity'])
  })

  it('lists the Inbox and every list, in the sidebar\'s order, on the Lists strip (UI-84, LST-13)', () => {
    const work = createList('Work', new Date('2026-09-01T00:00:00.000Z'))
    const home = createList('Home', new Date('2026-09-02T00:00:00.000Z'))

    expect(sectionPagesShown('lists', [], [home, work])).toEqual(['lists', 'inbox', oneListView(work.id), oneListView(home.id)])
    expect(sectionPagesShown('lists', [])).toEqual(['lists', 'inbox'])
  })
})
