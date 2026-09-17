import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { defaultReward, isRewardAmount, MAX_REWARD, MIN_REWARD, type Repeat } from '../../core'
import { panelStep as stepButton } from '../panelControls'
import { describePoints } from '../rewardLabels'
import { controlOff, controlOn } from '../rowControls'
import { StarIcon } from './StarIcon'

const button = 'flex h-6 w-full items-center gap-1.5 rounded-lg px-2 text-sm leading-none transition-colors'

/** What the box can hold: a reward, or 0 for none. */
function isPoints(points: number): boolean {
  return points === 0 || isRewardAmount(points)
}

interface RewardPickerProps {
  /** The points each completion earns, or null for none. */
  reward: number | null
  /** The task's rule, which says where the first step up from no reward lands. */
  repeat: Repeat | null
  onChange: (reward: number | null) => void
  /** What this picker is for, when there is more than one on screen. */
  label?: string
  /** Whether the button spells the points out beside its star, or a way to add some when there are none. */
  showAmount?: boolean
  /** Which edge of the button the panel lines up with: the one nearer the middle of the screen. */
  align?: 'left' | 'right'
}

/**
 * A task's reward: a small star that opens a panel for the points each
 * completion earns.
 *
 * Clicking the star of a task without a reward gives it 1 point and opens the
 * panel on it. The panel is like the other pickers: every step or number typed
 * is saved as it is made, with nothing to confirm. 0 is no reward, so stepping
 * down to it or typing it takes the reward away. A step up from 0 lands on what
 * the task's rule starts at rather than on 1, so a monthly task is not 25 clicks
 * from its reward.
 */
export function RewardPicker({
  reward,
  repeat,
  onChange,
  label = 'Reward',
  showAmount = false,
  align = 'right',
}: RewardPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  // What the box holds: the reward, or 0 for none, and whatever is typed over
  // it until that is a number of points or given up.
  const [typed, setTyped] = useState('')
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setIsOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => { document.removeEventListener('pointerdown', handlePointerDown) }
  }, [isOpen])

  const settled = reward ?? 0
  const amount = Number(typed)
  const isValid = typed.trim() !== '' && isPoints(amount)
  // Where the steps count from: what is typed while it is a number of points, and what it was otherwise.
  const base = isValid ? amount : settled
  const summary = reward === null ? 'No reward' : describePoints(reward)

  function toggle() {
    if (isOpen) {
      setIsOpen(false)
      return
    }
    // Reaching for the star of a task without a reward is asking for one: it gets
    // the least there is at once, to step up from.
    if (reward === null) {
      onChange(MIN_REWARD)
      setTyped(String(MIN_REWARD))
    } else {
      setTyped(String(reward))
    }
    setIsOpen(true)
  }

  /** Saved as it is chosen, 0 as no reward. */
  function choose(next: number) {
    setTyped(String(next))
    onChange(next === 0 ? null : next)
  }

  function handleType(value: string) {
    setTyped(value)
    const next = Number(value)
    if (value.trim() !== '' && isPoints(next)) onChange(next === 0 ? null : next)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    setIsOpen(false)
  }

  return (
    <div
      ref={root}
      className="relative min-w-0 shrink"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && isOpen) {
          event.stopPropagation()
          setIsOpen(false)
        }
      }}
    >
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={`${label}: ${summary}`}
        title={reward === null ? 'Add a reward' : summary}
        className={reward === null ? `${button} ${controlOff}` : `${button} ${controlOn}`}
      >
        <StarIcon />
        {showAmount && <span className="min-w-0 truncate">{reward === null ? 'Add reward' : summary}</span>}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label={label}
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} z-10 mt-1.5 flex w-52 flex-col gap-1 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl dark:border-neutral-700 dark:bg-neutral-900`}
        >
          <p className="px-1 pt-0.5 text-xs text-neutral-500 dark:text-neutral-400">Points each time it is done</p>

          <div role="group" aria-label="Points" className="flex items-center justify-center gap-1">
            <button
              type="button"
              onClick={() => { choose(base - 1) }}
              disabled={base <= 0}
              aria-label="Fewer points"
              className={stepButton}
            >
              −
            </button>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={MAX_REWARD}
              step={1}
              value={typed}
              onChange={(event) => { handleType(event.target.value) }}
              onKeyDown={handleKeyDown}
              // A number that cannot be points is not kept: the box goes back to what is.
              onBlur={() => { if (!isValid) setTyped(String(settled)) }}
              aria-label="Points"
              enterKeyHint="done"
              className="w-14 [appearance:textfield] rounded-lg border border-neutral-300 bg-transparent px-2 py-1 text-center text-sm text-neutral-900 tabular-nums focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:text-neutral-100 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={() => { choose(base === 0 ? defaultReward(repeat) : base + 1) }}
              disabled={base >= MAX_REWARD}
              aria-label="More points"
              className={stepButton}
            >
              +
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
