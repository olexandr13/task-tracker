import { useCallback, useState } from 'react'
import type { SideNavRepository, SideNavState } from '../storage/sideNavRepository'

/**
 * How the sidebar is laid out, read once when the screen opens and saved on
 * every change.
 */
export function useSideNav(repository: SideNavRepository): [SideNavState, (state: SideNavState) => void] {
  const [state, setState] = useState(() => repository.load())

  const change = useCallback(
    (next: SideNavState) => {
      setState(next)
      repository.save(next)
    },
    [repository],
  )

  return [state, change]
}
