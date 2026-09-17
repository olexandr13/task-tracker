import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_VIEW, viewFromHash, viewHash, type View } from './view'

function viewInAddress(): View {
  return viewFromHash(window.location.hash) ?? DEFAULT_VIEW
}

/**
 * The view on screen, kept in the address. A reload opens the view that was
 * open, and each switch is a step in the browser's history, so back and forward
 * move between views.
 */
export function useView(): [View, (view: View) => void] {
  const [view, setView] = useState(viewInAddress)

  // Back, forward, or an address typed or pasted in.
  useEffect(() => {
    function follow() {
      setView(viewInAddress())
    }
    window.addEventListener('hashchange', follow)
    return () => { window.removeEventListener('hashchange', follow) }
  }, [])

  const go = useCallback((next: View) => {
    setView(next)
    const hash = viewHash(next)
    if (window.location.hash !== hash) {
      window.location.hash = hash
    }
  }, [])

  return [view, go]
}
