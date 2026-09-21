/**
 * Firebase Auth reloads the saved session from Google at start-up. On a phone
 * with no connection that request often does not fail — it waits, up to a
 * minute — and until it settles nobody is signed in, so the app stays blank
 * and an installed copy sits on its splash screen (AUTH-14).
 *
 * Fail those requests at once when the browser already knows it is offline,
 * and abort a hung start-up reload quickly when the browser thinks it is
 * online but nothing answers, so the cached session is used instead. Later
 * requests (signing in on a slow connection) keep the full wait.
 */

const AUTH_HOSTS = ['identitytoolkit.googleapis.com', 'securetoken.googleapis.com']

/** How long start-up may wait for Google before the device's saved session is used. */
export const AUTH_STARTUP_TIMEOUT_MS = 3000

function isGoogleAuthUrl(url: string): boolean {
  return AUTH_HOSTS.some((host) => url.includes(host))
}

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.href
  return input.url
}

function offline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false
}

/**
 * Fetch that aborts after `ms`, chaining onto a signal the caller already had.
 * `AbortSignal.timeout` / `.any` are skipped: a phone's Safari may not have them.
 */
function fetchWithTimeout(
  original: typeof fetch,
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  ms: number,
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => { controller.abort() }, ms)
  const existing = init?.signal
  if (existing != null) {
    if (existing.aborted) controller.abort()
    else existing.addEventListener('abort', () => { controller.abort() }, { once: true })
  }

  return original(input, { ...init, signal: controller.signal }).finally(() => { clearTimeout(timer) })
}

let uninstall: (() => void) | null = null

/**
 * Wraps `fetch` for Google Auth's hosts. Returns the way to put the original
 * back — tests, and nothing in the app itself.
 */
export function installFailFastAuthFetch(): () => void {
  if (uninstall !== null) return uninstall

  const original = globalThis.fetch.bind(globalThis)
  let startupOver = false

  globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    if (!isGoogleAuthUrl(urlOf(input))) {
      return original(input, init)
    }

    if (offline()) {
      return Promise.reject(new TypeError('Failed to fetch'))
    }

    if (startupOver) {
      return original(input, init)
    }

    return fetchWithTimeout(original, input, init, AUTH_STARTUP_TIMEOUT_MS).finally(() => {
      startupOver = true
    })
  }

  uninstall = () => {
    globalThis.fetch = original
    uninstall = null
  }
  return uninstall
}
