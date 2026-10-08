import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'

/** How close to the screen's side a panel may come: a phone page's own gutter. */
const GUTTER = 16

/**
 * Where a panel that opens in place ends up, for the ref it hands back to put
 * on that panel.
 *
 * A panel lines up with the button that opened it, and on a phone it is nearly
 * as wide as the screen while its button can sit anywhere along a row — so it
 * can run off one side. It is nudged back inside the page's gutter.
 *
 * It opens below its button too, which may be near the foot of a sheet or of
 * the window, so the whole of it is brought into view: what it is kept clear of
 * at either end is the panel's own scroll margin (`panelScrollMargin`).
 *
 * Once open it **stays where it is on the screen** while what it hangs off moves
 * under it — a row whose hour, picked in the panel, carries it into the Overdue
 * run or out of it (DUE-20, TASK-68): the next click is aimed at where the panel
 * was. It goes with the page as the page scrolls, as anything on it does.
 */
export function usePanelPlacement(
  isOpen: boolean,
  /** What the panel is showing, where that changes its size: it is placed again as this changes. */
  showing: unknown = null,
): RefObject<HTMLDivElement | null> {
  const panel = useRef<HTMLDivElement>(null)
  // How far the panel is nudged sideways to stay inside the gutter, and how far
  // up or down to stay where it was as what it hangs off moved.
  const shift = useRef({ x: 0, y: 0 })
  // Where on the screen the panel's top was last put, or null before it is placed.
  const placedTop = useRef<number | null>(null)

  function nudge(opened: HTMLDivElement) {
    const { x, y } = shift.current
    opened.style.translate = x === 0 && y === 0 ? '' : `${String(x)}px ${String(y)}px`
  }

  // After every render, since a render is what moves a row: the panel is put
  // back where it was. A scroll in between is taken as the panel's new place.
  useLayoutEffect(() => {
    const opened = panel.current
    if (!isOpen || opened === null || placedTop.current === null) return

    const moved = opened.getBoundingClientRect().top - placedTop.current
    // Under half a pixel is the page's rounding, not a move.
    if (Math.abs(moved) < 0.5) return
    shift.current.y -= moved
    nudge(opened)
  })

  useLayoutEffect(() => {
    const opened = panel.current
    if (!isOpen || opened === null) {
      shift.current = { x: 0, y: 0 }
      placedTop.current = null
      return
    }

    // Measured with any earlier sideways nudge taken off, so what is read is the panel's own place.
    shift.current.x = 0
    nudge(opened)
    const { left, right } = opened.getBoundingClientRect()
    const edge = document.documentElement.clientWidth - GUTTER
    shift.current.x = left < GUTTER ? GUTTER - left : right > edge ? edge - right : 0
    nudge(opened)

    // A test's page has no layout, and so no way to scroll.
    if (typeof opened.scrollIntoView === 'function') opened.scrollIntoView({ block: 'nearest' })
    placedTop.current = opened.getBoundingClientRect().top
  }, [isOpen, showing])

  useEffect(() => {
    const opened = panel.current
    if (!isOpen || opened === null) return

    function follow() {
      if (opened !== null && placedTop.current !== null) placedTop.current = opened.getBoundingClientRect().top
    }

    // Captured, so a scroll of whatever the panel sits in is heard, not only the window's.
    window.addEventListener('scroll', follow, { capture: true, passive: true })
    window.addEventListener('resize', follow)
    // Where a press lands is where the panel is meant to stay, whether or not the
    // scroll that took it there has been heard yet: those come a frame late.
    opened.addEventListener('pointerdown', follow, { capture: true })
    return () => {
      window.removeEventListener('scroll', follow, { capture: true })
      window.removeEventListener('resize', follow)
      opened.removeEventListener('pointerdown', follow, { capture: true })
    }
  }, [isOpen])

  return panel
}
