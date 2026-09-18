/**
 * Fails any test that writes to the console without saying it meant to.
 *
 * Loaded for every test file (`setupFiles` in vite.config.ts), so it needs no
 * importing to be in force. It catches two things that otherwise pass quietly:
 * React's own complaints — a missing key, an update outside `act`, a nesting no
 * browser allows — and the app's error paths firing when nothing is wrong.
 *
 * The app writes to the console on purpose in a dozen places: a save the
 * database refuses, data too old to read (STORE-7, STORE-13). A test that
 * exercises one of those declares it with `expectConsole`, which is the point —
 * intended output is written down, so anything left over is a surprise.
 *
 * `console` is saved and put back by hand rather than through `vi.spyOn`,
 * because a test file's own `vi.restoreAllMocks()` would otherwise put the real
 * console back mid-test and disarm this without a word.
 */

import { afterEach, beforeEach } from 'vitest'

type Level = 'error' | 'warn' | 'log' | 'info' | 'debug'

const LEVELS: readonly Level[] = ['error', 'warn', 'log', 'info', 'debug']

interface Line {
  readonly level: Level
  readonly text: string
}

let lines: Line[] = []
let expected: (string | RegExp)[] = []
let original: Partial<Record<Level, typeof console.log>> = {}

/**
 * Declares console output this test means to cause: a substring, or a pattern.
 * Output matching any of them no longer fails the test. Call it before the thing
 * that logs, or after — all that matters is that it happens within the test.
 */
export function expectConsole(...matches: (string | RegExp)[]): void {
  expected.push(...matches)
}

/** What the app has written to the console so far in this test, for asserting on. */
export function consoleOutput(): readonly Line[] {
  return lines
}

beforeEach(() => {
  lines = []
  expected = []
  original = {}

  for (const level of LEVELS) {
    original[level] = console[level]
    console[level] = (...args: unknown[]) => {
      lines.push({ level, text: args.map(textOf).join(' ') })
    }
  }
})

afterEach(() => {
  for (const level of LEVELS) {
    const put = original[level]
    if (put !== undefined) console[level] = put
  }

  const surprises = lines.filter((line) => !expected.some((match) => isMatch(line.text, match)))
  if (surprises.length === 0) return

  const listed = surprises.map((line) => `  console.${line.level}: ${line.text}`).join('\n')
  throw new Error(
    `Unexpected console output:\n${listed}\n\n` +
      'If the test means to cause it, say so with expectConsole() from src/test/consoleGuard.',
  )
})

function isMatch(text: string, match: string | RegExp): boolean {
  return typeof match === 'string' ? text.includes(match) : match.test(text)
}

/** What one logged argument reads as. An Error is worth more than `[object Object]`. */
function textOf(value: unknown): string {
  if (typeof value === 'string') return value
  if (value instanceof Error) return `${value.name}: ${value.message}`

  try {
    return JSON.stringify(value) ?? String(value)
  } catch {
    return String(value)
  }
}
