import { useCallback, useState } from 'react'
import type { ViewOptions, ViewOptionsRepository } from '../storage/viewOptionsRepository'

/**
 * How the task views are shown, read once when the screen opens and saved on
 * every change.
 */
export function useViewOptions(repository: ViewOptionsRepository): [ViewOptions, (options: ViewOptions) => void] {
  const [options, setOptions] = useState(() => repository.load())

  const change = useCallback(
    (next: ViewOptions) => {
      setOptions(next)
      repository.save(next)
    },
    [repository],
  )

  return [options, change]
}
