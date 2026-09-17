import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { defaultReward, isRewardAmount, MAX_REWARD, type Repeat } from '../../core'
import { describePoints } from '../rewardLabels'
import { controlOff, controlOn, deleteControl } from '../rowControls'
import { StarIcon } from './StarIcon'

const button = 'flex h-6 w-full items-center gap-1.5 rounded-lg px-2 text-sm leading-none transition-colors'

const stepButton =
  'grid size-7 shrink-0 place-items-center rounded-lg text-base leading-none text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:pointer-events-none disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'

const action = 'flex w-full items-center justify-center rounded-lg px-2 py-1.5 text-sm transition-colors'

interface RewardPickerProps {
  /** The points each completion earns, or null for none. */
  reward: number | null
  /** The task's rule, which says what a reward starts at when one is added. */
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
 * A task without a reward is offered one at the amount its rule starts at,
 * which can be stepped or typed over before **Add reward** gives it. Opening the
 * panel gives nothing: a look is not a choice. Once there is a reward, the
 * panel is like the other pickers — every step or number typed is saved as it
 * is made, with nothing to confirm — and **Remove reward** takes it away.
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
  // What the box holds: the reward, or what a new one would start at, and
  // whatever is typed over it until that is a reward or given up.
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

  const settled = reward ?? defaultReward(repeat)
  const amount = Number(typed)
  const isValid = typed.trim() !== '' && isRewardAmount(amount)
  // Where the steps count from: what is typed while it is a reward, and what it was otherwise.
  const base = isValid ? amount : settled
  const summary = reward === null ? 'No reward' : describePoints(reward)

  function toggle() {
    if (isOpen) {
      setIsOpen(false)
      return
    }
    setTyped(String(settled))
    setIsOpen(true)
  }

  /** Saved as it is chosen once there is a reward; held for Add until then. */
  function choose(next: number) {
    setTyped(String(next))
    if (reward !== null) onChange(next)
  }

  function handleType(value: string) {
    setTyped(value)
    const next = Number(value)
    if (reward !== null && value.trim() !== '' && isRewardAmount(next)) onChange(next)
  }

  function add() {
    if (!isValid) return
    onChange(amount)
    setIsOpen(false)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    if (reward === null) add()
    else setIsOpen(false)
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

          <div role="group" aria-label="Points" className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => { choose(base - 1) }}
              disabled={base <= 1}
              aria-label="Fewer points"
              className={stepButton}
            >
              −
            </button>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_REWARD}
              step={1}
              value={typed}
              onChange={(event) => { handleType(event.target.value) }}
              onKeyDown={handleKeyDown}
              // A number that cannot be a reward is not kept: the box goes back to what is.
              onBlur={() => { if (!isValid) setTyped(String(settled)) }}
              aria-label="Points"
              enterKeyHint="done"
              className="min-w-0 flex-1 [appearance:textfield] rounded-lg border border-neutral-300 bg-transparent px-2 py-1 text-center text-sm text-neutral-900 tabular-nums focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:text-neutral-100 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={() => { choose(base + 1) }}
              disabled={base >= MAX_REWARD}
              aria-label="More points"
              className={stepButton}
            >
              +
            </button>
          </div>

          {reward === null ? (
            <button
              type="button"
              onClick={add}
              disabled={!isValid}
              className={`${action} bg-blue-600 font-medium text-white hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-40`}
            >
              Add reward
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onChange(null)
                setIsOpen(false)
              }}
              className={`${action} ${deleteControl}`}
            >
              Remove reward
            </button>
          )}
        </div>
      )}
    </div>
  )
}
