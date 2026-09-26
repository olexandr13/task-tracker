import { useLayoutEffect, useRef, type RefObject } from 'react'

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
 */
export function usePanelPlacement(
  isOpen: boolean,
  /** What the panel is showing, where that changes its size: it is placed again as this changes. */
  showing: unknown = null,
): RefObject<HTMLDivElement | null> {
  const panel = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const opened = panel.current
    if (!isOpen || opened === null) return

    // Measured with any earlier nudge taken off, so what is read is the panel's own place.
    opened.style.translate = ''
    const { left, right } = opened.getBoundingClientRect()
    const edge = document.documentElement.clientWidth - GUTTER
    const shift = left < GUTTER ? GUTTER - left : right > edge ? edge - right : 0
    opened.style.translate = shift === 0 ? '' : `${String(shift)}px 0`

    // A test's page has no layout, and so no way to scroll.
    if (typeof opened.scrollIntoView === 'function') opened.scrollIntoView({ block: 'nearest' })
  }, [isOpen, showing])

  return panel
}
