import { useEffect, useRef } from 'react'
import { isLetterShortcut } from './letterShortcut'

/**
 * Runs `onPress` when a lone letter is pressed (UI-55, UI-56, UI-57). Only while
 * `enabled` — pages that do not use the shortcut leave it off.
 */
export function useLetterShortcut(letter: string, enabled: boolean, onPress: () => void): void {
  const onPressRef = useRef(onPress)

  useEffect(() => {
    onPressRef.current = onPress
  }, [onPress])

  useEffect(() => {
    if (!enabled) return

    function handleKeyDown(event: KeyboardEvent) {
      if (!isLetterShortcut(event, letter)) return
      event.preventDefault()
      onPressRef.current()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => { window.removeEventListener('keydown', handleKeyDown) }
  }, [enabled, letter])
}
