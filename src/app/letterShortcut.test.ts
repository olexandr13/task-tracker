// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { isLetterShortcut } from './letterShortcut'

/* Lone-letter shortcuts. UI ids refer to wiki/interface.md. */

function keyEvent(key: string, extras: Partial<KeyboardEvent> = {}): KeyboardEvent {
  return {
    key,
    defaultPrevented: false,
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    target: document.body,
    ...extras,
  } as KeyboardEvent
}

describe('isLetterShortcut', () => {
  it('matches a lone letter case-insensitively (UI-55, UI-56, UI-57, UI-58)', () => {
    expect(isLetterShortcut(keyEvent('n'), 'n')).toBe(true)
    expect(isLetterShortcut(keyEvent('N'), 'n')).toBe(true)
    expect(isLetterShortcut(keyEvent('h'), 'h')).toBe(true)
    expect(isLetterShortcut(keyEvent('H'), 'h')).toBe(true)
    expect(isLetterShortcut(keyEvent('r'), 'r')).toBe(true)
    expect(isLetterShortcut(keyEvent('R'), 'r')).toBe(true)
    expect(isLetterShortcut(keyEvent('p'), 'p')).toBe(true)
    expect(isLetterShortcut(keyEvent('P'), 'p')).toBe(true)
  })

  it('does nothing with a modifier', () => {
    expect(isLetterShortcut(keyEvent('n', { metaKey: true }), 'n')).toBe(false)
    expect(isLetterShortcut(keyEvent('h', { ctrlKey: true }), 'h')).toBe(false)
    expect(isLetterShortcut(keyEvent('h', { altKey: true }), 'h')).toBe(false)
  })

  it('does nothing while typing in a box', () => {
    const input = document.createElement('input')
    expect(isLetterShortcut(keyEvent('n', { target: input }), 'n')).toBe(false)
    expect(isLetterShortcut(keyEvent('h', { target: input }), 'h')).toBe(false)
  })

  it('does nothing for another key', () => {
    expect(isLetterShortcut(keyEvent('a'), 'n')).toBe(false)
    expect(isLetterShortcut(keyEvent('n'), 'h')).toBe(false)
  })

  it('does nothing once the press is already handled', () => {
    expect(isLetterShortcut(keyEvent('n', { defaultPrevented: true }), 'n')).toBe(false)
  })
})
