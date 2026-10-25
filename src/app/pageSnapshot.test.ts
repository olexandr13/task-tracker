// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PageSnapshot, PageSnapshotRepository } from '../storage/pageSnapshotRepository'
import { createPageSnapshotKeeper } from './pageSnapshot'

/* UI-86 and STORE-68 refer to wiki/interface.md and wiki/storage.md. */

const NOW = new Date(2026, 9, 22, 9, 30)

function memory(kept: PageSnapshot | null = null): PageSnapshotRepository & { kept: PageSnapshot | null } {
  return {
    kept,
    load() { return this.kept },
    save(snapshot) { this.kept = snapshot },
  }
}

function snapshotHere(overrides: Partial<PageSnapshot> = {}): PageSnapshot {
  return { address: '/#/today', day: '2026-10-22', phone: false, html: '<main>Water the plants</main>', ...overrides }
}

function picture(): HTMLElement | null {
  return document.querySelector('[data-page-snapshot]')
}

/** Lets the keeper look again once the render that changed things is over. */
async function settled() {
  await Promise.resolve()
}

beforeEach(() => {
  history.replaceState(null, '', '/#/today')
})

afterEach(() => {
  vi.useRealTimers()
  document.body.replaceChildren()
})

describe('showing the page as it was left (UI-86)', () => {
  it('puts the page as it was over the page, where nothing in it can be pressed', () => {
    createPageSnapshotKeeper(memory(snapshotHere())).show(NOW)

    expect(picture()?.textContent).toContain('Water the plants')
    expect(picture()?.getAttribute('aria-hidden')).toBe('true')
    expect(picture()?.querySelector('[inert]')?.textContent).toBe('Water the plants')
  })

  it('shows nothing when the page left was another view, another day or another size of screen', () => {
    for (const other of [{ address: '/#/habits' }, { day: '2026-10-21' }, { phone: true }]) {
      createPageSnapshotKeeper(memory(snapshotHere(other))).show(NOW)
      expect(picture()).toBeNull()
    }
  })

  it('stays up while the screen still has a part on its way, and gives way once it has none', async () => {
    const keeper = createPageSnapshotKeeper(memory(snapshotHere()))
    keeper.show(NOW)
    const release = keeper.hold()
    keeper.screenUp()
    await settled()
    expect(picture()).not.toBeNull()

    release()
    await settled()
    expect(picture()?.style.opacity).toBe('0')
    expect(picture()?.style.pointerEvents).toBe('none')
  })

  it('does not give way before the screen is up, however little is loading', async () => {
    const keeper = createPageSnapshotKeeper(memory(snapshotHere()))
    keeper.show(NOW)
    keeper.hold()()
    await settled()
    expect(picture()?.style.opacity).toBe('')
  })

  it('counts a part let go and held again in the same render as never let go', async () => {
    const keeper = createPageSnapshotKeeper(memory(snapshotHere()))
    keeper.show(NOW)
    keeper.screenUp()
    keeper.hold()()
    keeper.hold()
    await settled()
    expect(picture()?.style.opacity).toBe('')
  })

  it('gives way after six seconds whatever is still loading', () => {
    vi.useFakeTimers()
    const keeper = createPageSnapshotKeeper(memory(snapshotHere()))
    keeper.show(NOW)
    keeper.hold()
    vi.advanceTimersByTime(6000)
    expect(picture()?.style.opacity).toBe('0')
    vi.advanceTimersByTime(150)
    expect(picture()).toBeNull()
  })
})

describe('keeping the page as it is left (STORE-68)', () => {
  function leave() {
    window.dispatchEvent(new Event('pagehide'))
  }

  function drawn(html: string): HTMLElement {
    const root = document.createElement('div')
    root.innerHTML = html
    document.body.append(root)
    return root
  }

  it('keeps what the screen shows, where and when it was', () => {
    const repository = memory()
    const keeper = createPageSnapshotKeeper(repository)
    const stop = keeper.keep(drawn('<main>Water the plants</main>'), () => NOW)
    keeper.screenUp()
    leave()
    stop()

    expect(repository.kept).toEqual(snapshotHere())
  })

  it('keeps nothing from the way in, nor from a screen with a part still on its way', () => {
    const repository = memory(snapshotHere())
    const keeper = createPageSnapshotKeeper(repository)
    const stop = keeper.keep(drawn('<main>Sign in</main>'), () => NOW)
    leave()
    expect(repository.kept).toBeNull()

    repository.kept = snapshotHere()
    keeper.screenUp()
    keeper.hold()
    leave()
    stop()
    expect(repository.kept).toBeNull()
  })

  it('keeps the page as it was when reloaded again before the page under the picture is ready', () => {
    const repository = memory(snapshotHere())
    const keeper = createPageSnapshotKeeper(repository)
    keeper.show(NOW)
    const stop = keeper.keep(drawn('<p>Loading…</p>'), () => NOW)
    keeper.screenUp()
    keeper.hold()
    leave()
    stop()

    expect(repository.kept).toEqual(snapshotHere())
  })
})
