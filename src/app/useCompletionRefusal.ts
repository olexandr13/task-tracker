import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * How long the refused note stays before the row settles back to itself. Long
 * enough to read a short sentence and look at the checklist it points to,
 * short enough that a row is not left wearing a complaint.
 */
const REFUSAL_MS = 4000

/**
 * A tick the task turned down, because its checklist still has an open item
 * (CHK-11). The row says so and shakes; nothing about the task changes, so
 * there is nothing to undo and nothing to save.
 *
 * One flag drives both: the note the row shows and the shake it plays. The
 * shake is written to run once, so a second refusal inside the window renews
 * the note rather than shaking again — by then the words are already on screen,
 * which is what a second click was asking for.
 */
export function useCompletionRefusal() {
  const [refused, setRefused] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clear = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current)
    timer.current = null
  }, [])

  const refuse = useCallback(() => {
    clear()
    setRefused(true)
    timer.current = setTimeout(() => {
      timer.current = null
      setRefused(false)
    }, REFUSAL_MS)
  }, [clear])

  /** Leaving the screen takes the timer with it; a row gone has nothing to say. */
  useEffect(() => clear, [clear])

  return { refused, refuse }
}
