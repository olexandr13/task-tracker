import { useEffectEvent, useLayoutEffect } from 'react'

/**
 * One close for each sheet over the page. The browser's history holds a single
 * extra rung for the lot of them, above the views' ladder (UI-37): back closes
 * the top sheet, and while any remain the rung is put back so the next back
 * closes the next. The last sheet's close drops the rung, so the next back is
 * the same as if no sheet had been opened (UI-71).
 */
const stack: Array<() => void> = []

/** Pops this module started, so they close nothing a second time. */
let skipPop = 0
let listening = false
let popTimer: ReturnType<typeof setTimeout> | null = null

function isOverlay(state: unknown): boolean {
  return state !== null && typeof state === 'object' && 'overlay' in state && state.overlay === true
}

function viewLevelOf(state: unknown): 'root' | 'page' | undefined {
  if (state === null || typeof state !== 'object' || !('level' in state)) return undefined
  return state.level === 'root' || state.level === 'page' ? state.level : undefined
}

function pushOverlayRung() {
  const level = viewLevelOf(window.history.state)
  window.history.pushState(level === undefined ? { overlay: true } : { level, overlay: true }, '')
}

function cancelScheduledPop() {
  if (popTimer === null) return
  clearTimeout(popTimer)
  popTimer = null
}

function schedulePop() {
  cancelScheduledPop()
  popTimer = setTimeout(() => {
    popTimer = null
    if (stack.length === 0 && isOverlay(window.history.state)) {
      skipPop += 1
      window.history.back()
    }
  }, 0)
}

function onPop() {
  if (skipPop > 0) {
    skipPop -= 1
    return
  }
  if (stack.length === 0) return

  const close = stack.pop()
  close?.()
  if (stack.length > 0) pushOverlayRung()
}

function ensureListen() {
  if (listening) return
  window.addEventListener('popstate', onPop)
  listening = true
}

/**
 * Holds a sheet on the overlay rung for as long as it is on screen. Back
 * closes it (UI-71). Closing it from the page drops the rung once nothing
 * else is over it, so the views' history is as it was.
 *
 * The first sheet pushes the rung; a sheet over a sheet (UI-64) shares it.
 * Each holder's release counts once, however many times it is called.
 */
export function holdOverlay(onClose: () => void): () => void {
  cancelScheduledPop()
  if (!isOverlay(window.history.state)) pushOverlayRung()
  stack.push(onClose)
  ensureListen()

  let held = true
  return () => {
    if (!held) return
    held = false
    const at = stack.lastIndexOf(onClose)
    if (at !== -1) stack.splice(at, 1)
    if (stack.length === 0 && isOverlay(window.history.state)) schedulePop()
  }
}

/** The overlay rung held for as long as the sheet is on screen. */
export function useOverlayHistory(onClose: () => void) {
  const close = useEffectEvent(onClose)
  useLayoutEffect(() => holdOverlay(close), [])
}
