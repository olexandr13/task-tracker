// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AUTH_STARTUP_TIMEOUT_MS, installFailFastAuthFetch } from './failFastAuthFetch'

/*
 * Google Auth requests must not hold start-up up when there is no connection.
 * AUTH-14 refers to wiki/account.md.
 */

const AUTH_URL = 'https://identitytoolkit.googleapis.com/v1/accounts:lookup'
const OTHER_URL = 'https://api.quotable.kurokeita.dev/api/quotes/random'
const nativeFetch = globalThis.fetch

let stop: (() => void) | undefined

function setOnline(value: boolean): void {
  Object.defineProperty(navigator, 'onLine', { configurable: true, value })
}

/** A fetch that waits until its abort signal fires — what a dead connection looks like. */
function hangingFetch(_input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return new Promise((_, reject) => {
    const signal = init?.signal
    if (signal == null) return
    const fail = () => { reject(new DOMException('Aborted', 'AbortError')) }
    if (signal.aborted) fail()
    else signal.addEventListener('abort', fail, { once: true })
  })
}

beforeEach(() => {
  setOnline(true)
  vi.useFakeTimers()
})

afterEach(() => {
  stop?.()
  stop = undefined
  globalThis.fetch = nativeFetch
  setOnline(true)
  vi.useRealTimers()
})

describe('installFailFastAuthFetch', () => {
  it('rejects Google Auth requests at once when the browser is offline, without sending them (AUTH-14)', async () => {
    setOnline(false)
    const inner = vi.fn(hangingFetch)
    globalThis.fetch = inner
    stop = installFailFastAuthFetch()

    await expect(fetch(AUTH_URL)).rejects.toThrow('Failed to fetch')
    expect(inner).not.toHaveBeenCalled()
  })

  it('aborts a hung start-up reload instead of waiting a minute (AUTH-14)', async () => {
    globalThis.fetch = hangingFetch
    stop = installFailFastAuthFetch()

    const pending = fetch(AUTH_URL)
    const rejected = expect(pending).rejects.toThrow()
    await vi.advanceTimersByTimeAsync(AUTH_STARTUP_TIMEOUT_MS)
    await rejected
  })

  it('leaves later Google Auth requests — signing in — to wait as long as they need', async () => {
    let calls = 0
    const inner = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      calls += 1
      return calls === 1 ? Promise.resolve(new Response('{}')) : hangingFetch(input, init)
    })
    globalThis.fetch = inner
    stop = installFailFastAuthFetch()

    await fetch(AUTH_URL)
    const pending = fetch(AUTH_URL)
    await vi.advanceTimersByTimeAsync(AUTH_STARTUP_TIMEOUT_MS * 4)
    expect(inner).toHaveBeenCalledTimes(2)
    pending.catch(() => {})
  })

  it('does not intercept anything that is not Google Auth', async () => {
    setOnline(false)
    const inner = vi.fn(() => Promise.resolve(new Response('ok')))
    globalThis.fetch = inner
    stop = installFailFastAuthFetch()

    await expect(fetch(OTHER_URL)).resolves.toBeInstanceOf(Response)
    expect(inner).toHaveBeenCalledOnce()
  })
})
