// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/*
 * The browser's notification on a phone, posted through the service worker,
 * and pressing it. NOTIF ids refer to wiki/notifications.md.
 */

type Module = typeof import('./browserNotification')

/** The worker's own script, as the build loads it into the service worker. */
const workerScript = Object.values(
  import.meta.glob<string>('../../public/notification-sw.js', { query: '?raw', import: 'default', eager: true }),
)[0] ?? ''

/** A fresh copy each test: the module keeps what pressing each notification does. */
async function load(): Promise<Module> {
  vi.resetModules()
  return import('./browserNotification')
}

function allowNotifications(): ReturnType<typeof vi.fn> {
  const NotificationMock = vi.fn()
  Object.defineProperty(NotificationMock, 'permission', { value: 'granted', configurable: true })
  vi.stubGlobal('Notification', NotificationMock)
  return NotificationMock
}

/** A service worker running the page, as the built app has: posted through, and its messages heard. */
class FakeWorker extends EventTarget {
  readonly controller = {}
  readonly showNotification = vi.fn<(title: string, options: NotificationOptions) => Promise<void>>(
    () => Promise.resolve(),
  )
  readonly ready = Promise.resolve({ showNotification: this.showNotification })
  readonly startMessages = vi.fn()
}

function runPageUnder(worker: FakeWorker | undefined): void {
  if (worker === undefined) {
    Reflect.deleteProperty(navigator, 'serviceWorker')
    return
  }
  Object.defineProperty(navigator, 'serviceWorker', { value: worker, configurable: true })
}

/** A window the worker can see: told what was pressed, and brought forward. */
function windowOf(page: FakeWorker) {
  return {
    focus: vi.fn(() => Promise.resolve()),
    postMessage: vi.fn((message: unknown) => {
      page.dispatchEvent(new MessageEvent('message', { data: message }))
    }),
  }
}

type WorkerWindow = ReturnType<typeof windowOf>

/** The worker's own script (public/notification-sw.js), run against the windows given. */
function pressInWorker(data: unknown, windows: readonly WorkerWindow[]) {
  const listeners = new Map<string, (event: unknown) => void>()
  const clients = {
    matchAll: vi.fn(() => Promise.resolve(windows)),
    openWindow: vi.fn(() => Promise.resolve(null)),
  }
  const scope = { clients, addEventListener: (type: string, listener: (event: unknown) => void) => { listeners.set(type, listener) } }
  new Function('self', workerScript)(scope)

  let done: Promise<unknown> = Promise.resolve()
  const close = vi.fn()
  listeners.get('notificationclick')?.({
    notification: { data, close },
    waitUntil: (promise: Promise<unknown>) => { done = promise },
  })
  return { done: () => done, close, clients }
}

/** What the last notification was posted with, through the worker. */
function posted(worker: FakeWorker): { title: string; options: NotificationOptions } {
  const call = worker.showNotification.mock.lastCall
  if (call === undefined) throw new Error('nothing was posted through the worker')
  return { title: call[0], options: call[1] }
}

beforeEach(() => {
  allowNotifications()
})

afterEach(() => {
  runPageUnder(undefined)
  Reflect.deleteProperty(navigator, 'standalone')
  vi.unstubAllGlobals()
})

describe('notifyBrowser with a service worker (NOTIF-9)', () => {
  it('posts through the worker, never with `new Notification`, which a phone refuses', async () => {
    const constructed = allowNotifications()
    const worker = new FakeWorker()
    runPageUnder(worker)
    const { notifyBrowser } = await load()

    notifyBrowser('Due now', '“write”', { tag: 'due' })
    await worker.ready

    expect(constructed).not.toHaveBeenCalled()
    const { title, options } = posted(worker)
    expect(title).toBe('Due now')
    expect(options).toMatchObject({ body: '“write”', tag: 'due', icon: '/pwa-192.png' })
  })

  it('posts with `new Notification` where no worker runs the page', async () => {
    const constructed = allowNotifications()
    const { notifyBrowser } = await load()

    notifyBrowser('Due now', '“write”')

    expect(constructed).toHaveBeenCalledWith('Due now', { body: '“write”' })
  })

  it('posts nothing where notifications are not allowed', async () => {
    const constructed = vi.fn()
    Object.defineProperty(constructed, 'permission', { value: 'default', configurable: true })
    vi.stubGlobal('Notification', constructed)
    const worker = new FakeWorker()
    runPageUnder(worker)
    const { notifyBrowser } = await load()

    notifyBrowser('Due now', '“write”')
    await worker.ready

    expect(worker.showNotification).not.toHaveBeenCalled()
    expect(constructed).not.toHaveBeenCalled()
  })

  it('pressing it brings the window forward and does what the notice’s button does', async () => {
    const worker = new FakeWorker()
    runPageUnder(worker)
    const { notifyBrowser } = await load()
    const onClick = vi.fn()

    notifyBrowser('The Drop is here.', 'Open Cases.', { tag: 'chest-daily', onClick })
    await worker.ready
    const app = windowOf(worker)
    const press = pressInWorker(posted(worker).options.data, [app])
    await press.done()

    expect(press.close).toHaveBeenCalledOnce()
    expect(app.focus).toHaveBeenCalledOnce()
    expect(onClick).toHaveBeenCalledOnce()
    expect(worker.startMessages).toHaveBeenCalled()
  })

  it('does what the latest notification of a tag says, once', async () => {
    const worker = new FakeWorker()
    runPageUnder(worker)
    const { notifyBrowser } = await load()
    const first = vi.fn()
    const second = vi.fn()

    notifyBrowser('Check-in', 'Log it.', { tag: 'check-in', onClick: first })
    notifyBrowser('Check-in', 'Log it.', { tag: 'check-in', onClick: second })
    await worker.ready
    const app = windowOf(worker)
    const { data } = posted(worker).options
    await pressInWorker(data, [app]).done()
    await pressInWorker(data, [app]).done()

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledOnce()
  })

  it('leaves another PickMe window be: only the one that posted it acts', async () => {
    const worker = new FakeWorker()
    runPageUnder(worker)
    const { notifyBrowser } = await load()
    const onClick = vi.fn()

    notifyBrowser('The Drop is here.', 'Open Cases.', { tag: 'chest-daily', onClick })
    await worker.ready
    const { data } = posted(worker).options
    const elsewhere = { ...(data as object), page: 'another-window' }
    await pressInWorker(elsewhere, [windowOf(worker)]).done()

    expect(onClick).not.toHaveBeenCalled()
  })

  it('opens the app when no window is left to bring forward', async () => {
    const press = pressInWorker(null, [])
    await press.done()

    expect(press.clients.openWindow).toHaveBeenCalledWith('/')
  })
})

describe('notifyPermission on an iPhone (NOTIF-10)', () => {
  it('says a Safari tab needs the Home Screen app', async () => {
    vi.stubGlobal('Notification', undefined)
    Object.defineProperty(navigator, 'standalone', { value: false, configurable: true })
    const { notifyPermission, askToNotify } = await load()

    expect(notifyPermission()).toBe('home-screen')
    await expect(askToNotify()).resolves.toBe('home-screen')
  })

  it('says a browser without notifications has none', async () => {
    vi.stubGlobal('Notification', undefined)
    const { notifyPermission } = await load()

    expect(notifyPermission()).toBe('unavailable')
  })
})
