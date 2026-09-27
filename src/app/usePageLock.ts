import { useLayoutEffect } from 'react'

let locks = 0
let overflowBefore = ''

/**
 * Holds the page behind a sheet or a panel still, and gives back what lets it
 * scroll again. The page is one, whatever is over it, so the lock is **counted**:
 * the first holder takes the page's overflow away and remembers what it was, and
 * only the last to let go gives it back. Each holder's release counts once,
 * however many times it is called.
 *
 * Without the count, a sheet with a picker's sheet over it (UI-64), or a sheet
 * and a tab's panel at once, each remembered what the page had when they
 * opened — for the second, "hidden" — and whichever closed last wrote it back,
 * leaving the page unable to scroll until it was reloaded (UI-70).
 */
export function lockPage(): () => void {
  if (locks === 0) {
    overflowBefore = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  locks += 1

  let held = true
  return () => {
    if (!held) return
    held = false
    locks -= 1
    if (locks === 0) document.body.style.overflow = overflowBefore
  }
}

/** The page held still for as long as the component is on screen. */
export function usePageLock() {
  useLayoutEffect(lockPage, [])
}
