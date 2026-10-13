import { useCallback, useEffect, useRef, useState } from 'react'

/** How long the toast stays before it goes by itself. */
const TOAST_MS = 8000

export interface LevelChange {
  readonly from: number
  readonly to: number
}

/**
 * The level going up or down while the app is open, for the toast that says so
 * (LVL-11). The level it first reads — on load, or once everything it is read
 * from has arrived — is where it starts, not a change, so opening the app says
 * nothing. Null for no change to say; it goes by itself after a few seconds.
 */
export function useLevelChange(level: number | null) {
  const [change, setChange] = useState<LevelChange | null>(null)
  const last = useRef<number | null>(null)

  useEffect(() => {
    if (level === null) return
    const was = last.current
    last.current = level
    if (was !== null && was !== level) setChange({ from: was, to: level })
  }, [level])

  useEffect(() => {
    if (change === null) return
    const timer = setTimeout(() => { setChange(null) }, TOAST_MS)
    return () => { clearTimeout(timer) }
  }, [change])

  const dismiss = useCallback(() => { setChange(null) }, [])

  return { change, dismiss }
}
