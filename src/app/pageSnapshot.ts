import { useEffect } from 'react'
import { toLocalDay } from '../core'
import { deviceStorage } from '../storage/deviceStorage'
import type { PageSnapshotRepository } from '../storage/pageSnapshotRepository'
import { isPhoneLayout } from './usePhoneLayout'

/**
 * How long the picture may stand in for a page still gathering what it shows.
 * Past it the page is shown as it is, its own `Loading…` included, rather than
 * a picture nothing on can be pressed.
 */
const LONGEST_WAIT_MS = 6000

/** How long the picture takes to fade into the page under it. */
const FADE_MS = 150

/**
 * Keeps the page on screen through a reload (UI-86). As the tab is left, what
 * the page shows is kept (STORE-68); as it opens again on the same view, the
 * same day and the same size of screen, that is put over the empty page, frozen,
 * until the page under it has everything it shows — then the picture fades into
 * it. Nothing in the picture can be pressed: what is pressed is always the page
 * itself, never a copy that may be behind it.
 */
export interface PageSnapshotKeeper {
  /** Puts the page as it was left over the page about to be drawn, if it pictures this one. */
  show(now: Date): void
  /** Keeps what `root` shows each time the tab is left or hidden; returns how to stop. */
  keep(root: HTMLElement, now: () => Date): () => void
  /** Held by each part of the page still on its way; returns how to let go. */
  hold(): () => void
  /** Held while the signed-in screen is up; returns how to let go. */
  screenUp(): () => void
  /** Takes the picture away now — for the way in, which it never pictures. */
  drop(): void
}

function addressOf(location: Location): string {
  return location.pathname + location.hash
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function createPageSnapshotKeeper(repository: PageSnapshotRepository): PageSnapshotKeeper {
  let picture: HTMLElement | null = null
  let giveUp: ReturnType<typeof setTimeout> | undefined
  let holds = 0
  let screens = 0
  let settling = false

  function drop() {
    const leaving = picture
    if (leaving === null) return

    picture = null
    clearTimeout(giveUp)
    if (prefersReducedMotion()) {
      leaving.remove()
      return
    }
    // The page is under it already: let presses through while it fades.
    leaving.style.pointerEvents = 'none'
    leaving.style.transition = `opacity ${String(FADE_MS)}ms ease-out`
    leaving.style.opacity = '0'
    setTimeout(() => { leaving.remove() }, FADE_MS)
  }

  // Looked at once the render that changed things is over, so a part that stops
  // loading and the content taking its place — or StrictMode's second mount —
  // count as the one change they are.
  function settle() {
    if (settling) return
    settling = true
    queueMicrotask(() => {
      settling = false
      if (screens > 0 && holds === 0) drop()
    })
  }

  return {
    show(now) {
      const kept = repository.load()
      if (kept === null) return
      if (kept.address !== addressOf(location) || kept.day !== toLocalDay(now) || kept.phone !== isPhoneLayout()) return

      // Over everything the page draws, in the page's own background. The page
      // inside is inert, so a press falls on the cover and goes no further.
      const cover = document.createElement('div')
      cover.dataset.pageSnapshot = ''
      cover.setAttribute('aria-hidden', 'true')
      cover.className = 'fixed inset-0 z-[100] overflow-hidden overscroll-contain'
      cover.style.backgroundColor = 'inherit'

      const page = document.createElement('div')
      page.setAttribute('inert', '')
      page.innerHTML = kept.html

      // A thin line across the top: the page is catching up, which is why a press does nothing yet.
      const catchingUp = document.createElement('div')
      catchingUp.className = 'absolute inset-x-0 top-[env(safe-area-inset-top)] h-0.5 animate-pulse bg-blue-500'

      cover.append(page, catchingUp)
      document.body.append(cover)
      picture = cover
      giveUp = setTimeout(drop, LONGEST_WAIT_MS)
    },

    keep(root, now) {
      function leave() {
        // Still standing in for the page: it is still the page as it was.
        if (picture !== null) return
        // The way in, or a page with parts still on their way: nothing worth showing again.
        if (screens === 0 || holds > 0) {
          repository.save(null)
          return
        }
        repository.save({ address: addressOf(location), day: toLocalDay(now()), phone: isPhoneLayout(), html: root.innerHTML })
      }

      // Hidden as well as left: a phone may close a hidden app without saying it is leaving.
      function handleVisibility() {
        if (document.visibilityState === 'hidden') leave()
      }

      window.addEventListener('pagehide', leave)
      document.addEventListener('visibilitychange', handleVisibility)
      return () => {
        window.removeEventListener('pagehide', leave)
        document.removeEventListener('visibilitychange', handleVisibility)
      }
    },

    hold() {
      holds += 1
      return () => {
        holds -= 1
        settle()
      }
    },

    screenUp() {
      screens += 1
      settle()
      return () => { screens -= 1 }
    },

    drop,
  }
}

/** The one for the page, kept in this tab's storage. */
export const pageSnapshot = createPageSnapshotKeeper(deviceStorage.pageSnapshot)

/** Keeps the picture of the page up for as long as the component holding it is on screen (UI-86). */
export function useHoldPageSnapshot(): void {
  useEffect(() => pageSnapshot.hold(), [])
}

/** Marks the signed-in screen as drawn: once no part of it is on its way, the picture gives way to it. */
export function usePageSnapshotScreen(): void {
  useEffect(() => pageSnapshot.screenUp(), [])
}
