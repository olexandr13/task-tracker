import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_VIEW, parentView, rootView, viewFromHash, viewHash, type View } from './view'

function viewInAddress(): View {
  return viewFromHash(window.location.hash) ?? DEFAULT_VIEW
}

/**
 * Which of the app's two history entries one is: the **root**, whose address is
 * the top of the branch on screen, or the **page** above it, whose address is
 * the view under it that is open. An entry the app did not write — the one it
 * was opened from, or an address typed in — has neither.
 */
type Level = 'root' | 'page'

function levelOf(state: unknown): Level | null {
  if (state === null || typeof state !== 'object' || !('level' in state)) return null
  return state.level === 'root' || state.level === 'page' ? state.level : null
}

function replaceEntry(level: Level, view: View) {
  window.history.replaceState({ level }, '', viewHash(view))
}

function pushEntry(level: Level, view: View) {
  window.history.pushState({ level }, '', viewHash(view))
}

/**
 * Lays the entries out for `view` from an entry the app did not write: the root
 * alone for a view at the top, or the root of its branch with the view pushed
 * above it, so back has a level to climb to.
 */
function settleEntries(view: View) {
  if (parentView(view) === null) {
    replaceEntry('root', view)
  } else {
    replaceEntry('root', rootView(view))
    pushEntry('page', view)
  }
}

/**
 * The view on screen, kept in the address. A reload opens the view that was
 * open, and **back goes one level up** the views (UI-37) — from a mode's page to
 * Modes, from Modes to More, from a list to Lists — rather than back through
 * the views that happened to be visited.
 *
 * The browser's history is not a record of where one has been but a ladder of
 * at most two rungs: the root of the branch on screen and, while a view under
 * it is open, that view as a page above the root. A sheet over the page sits on
 * a rung of its own above those (UI-71). Switching views rewrites the
 * rungs in place, so nothing piles up. Back drops the page rung; what is shown
 * then is the parent of the view that was open, pushed as a fresh page when it
 * is itself under something, or written into the root when it is the top. From
 * the top, back leaves the app, as it would leave any other.
 */
export function useView(): [View, (view: View) => void] {
  const [view, setView] = useState(viewInAddress)
  /** The view on screen, for the back handler to find the parent of. */
  const shown = useRef(view)
  /** A top view switched to from under another: its page rung is being dropped for it. */
  const climbingTo = useRef<View | null>(null)

  function show(next: View) {
    shown.current = next
    setView(next)
  }

  // An entry the app was opened on, rather than reloaded on, has to be laid out.
  useEffect(() => {
    if (levelOf(window.history.state) === null) settleEntries(shown.current)
  }, [])

  // Back, forward, or an address typed or pasted in.
  useEffect(() => {
    function follow(event: PopStateEvent) {
      const landed = levelOf(event.state)

      if (climbingTo.current !== null) {
        replaceEntry('root', climbingTo.current)
        climbingTo.current = null
        return
      }

      const above = parentView(shown.current)
      if (landed === 'root' && above !== null) {
        if (parentView(above) === null) replaceEntry('root', above)
        else pushEntry('page', above)
        show(above)
        return
      }

      const named = viewInAddress()
      if (landed === null) settleEntries(named)
      show(named)
    }
    window.addEventListener('popstate', follow)
    return () => { window.removeEventListener('popstate', follow) }
  }, [])

  const go = useCallback((next: View) => {
    if (next === shown.current) return
    show(next)

    const onPage = levelOf(window.history.state) === 'page'
    if (parentView(next) !== null) {
      if (onPage) {
        replaceEntry('page', next)
      } else {
        replaceEntry('root', rootView(next))
        pushEntry('page', next)
      }
    } else if (onPage) {
      climbingTo.current = next
      window.history.back()
    } else {
      replaceEntry('root', next)
    }
  }, [])

  return [view, go]
}
