import { isInTextEntry } from './textEntry'

/**
 * Whether a key press is a lone letter shortcut — used for `N` (add task,
 * UI-55), `H` (add habit, UI-56) and `R` (Rewards, UI-57). Typing in a box, or
 * a key with a modifier, is not.
 */
export function isLetterShortcut(event: KeyboardEvent, letter: string): boolean {
  if (event.defaultPrevented) return false
  if (event.metaKey || event.ctrlKey || event.altKey) return false
  if (event.key.toLowerCase() !== letter.toLowerCase()) return false
  if (isInTextEntry(event.target)) return false
  return true
}
