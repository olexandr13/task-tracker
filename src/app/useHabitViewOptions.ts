import { useCallback, useState } from 'react'
import type { HabitViewOptions, HabitViewOptionsRepository } from '../storage/habitViewOptionsRepository'

/**
 * How the habits view is shown, read once when the screen opens and saved on
 * every change.
 */
export function useHabitViewOptions(repository: HabitViewOptionsRepository): [HabitViewOptions, (options: HabitViewOptions) => void] {
  const [options, setOptions] = useState(() => repository.load())

  const change = useCallback(
    (next: HabitViewOptions) => {
      setOptions(next)
      repository.save(next)
    },
    [repository],
  )

  return [options, change]
}
