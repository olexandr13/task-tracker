/**
 * Whether an event started inside something being typed in — a text box, or an
 * editable description. What a press or a right-click means there is the text's
 * business: selecting it, or the browser's own menu for it.
 */
export function isInTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return target.closest('input, textarea') !== null || (target instanceof HTMLElement && target.isContentEditable)
}
