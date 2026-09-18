import { describe, expect, it, vi } from 'vitest'
import { consoleOutput, expectConsole } from './consoleGuard'

/*
 * The guard watching for console output, tested because everything else leans on
 * it: if it quietly stopped working, every test it protects would go unprotected
 * and nothing would say so. What it cannot test on itself is the failing — a
 * test that fails on purpose is a failing test — so what is checked here is that
 * output is captured, matched and still captured after the ways it could be lost.
 */

describe('the console guard', () => {
  it('records what was written, and at which level', () => {
    expectConsole('a warning', 'an error')

    console.warn('a warning')
    console.error('an error')

    expect(consoleOutput().map((line) => `${line.level}: ${line.text}`)).toEqual([
      'warn: a warning',
      'error: an error',
    ])
  })

  it('starts each test with nothing written: what one test logs is not another\'s', () => {
    expect(consoleOutput()).toEqual([])
  })

  it('takes a pattern as well as a substring', () => {
    expectConsole(/Ignoring saved list \w+/u)

    console.warn('Ignoring saved list abc123: unexpected shape.')

    expect(consoleOutput()).toHaveLength(1)
  })

  it('reads an Error for what it says, rather than as an object', () => {
    expectConsole('Could not load lists.')

    console.error('Could not load lists.', new TypeError('insufficient permissions'))

    expect(consoleOutput()[0].text).toBe('Could not load lists. TypeError: insufficient permissions')
  })

  it('reads an argument that cannot be turned into JSON without throwing', () => {
    expectConsole('a cycle')
    const cycle: Record<string, unknown> = {}
    cycle.self = cycle

    console.log('a cycle', cycle)

    expect(consoleOutput()).toHaveLength(1)
  })

  it('is not disarmed by a test putting every mock back', () => {
    // The reason `console` is saved and restored by hand: `vi.spyOn` would be
    // undone here, handing the real console back mid-test without a word.
    vi.restoreAllMocks()
    expectConsole('still watched')

    console.warn('still watched')

    expect(consoleOutput()).toHaveLength(1)
  })
})
