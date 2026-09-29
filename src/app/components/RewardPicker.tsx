import { useRef, useState, type KeyboardEvent } from 'react'
import { isRewardAmount, MAX_REWARD, MIN_REWARD } from '../../core'
import { panelClear, panelStep as stepButton } from '../panelControls'
import { describePoints } from '../rewardLabels'
import { controlOff, controlOn, deleteControl, rowControlIcon, rowControlLabel } from '../rowControls'
import { PickerPanel } from './PickerPanel'
import { StarIcon } from './StarIcon'
import { TrashIcon } from './TrashIcon'

/** What the box can hold: a reward, or 0 for none. */
function isPoints(points: number): boolean {
  return points === 0 || isRewardAmount(points)
}

interface RewardPickerProps {
  /** The points, or null for none. */
  reward: number | null
  /** Where the first step up from none lands — a task's rule is worth `defaultReward` (RWD-2). */
  startAt: number
  onChange: (reward: number | null) => void
  /** What this picker is for, when there is more than one on screen. */
  label?: string
  /** What the points are for, as the panel says it above them (RWD-43). */
  hint: string
  /** Whether the button spells the points out beside its star, or a way to add some when there are none. */
  showAmount?: boolean
  /** What the button says while there are no points, where it spells them out. */
  addLabel?: string
  /** How no points read where the button is named: `Reward: No reward`. */
  noneLabel?: string
  /** What the trash is named, for a screen reader: **Remove reward**, or **Remove bonus**. */
  removeLabel?: string
  /** Which edge of the button the panel lines up with: the one nearer the middle of the screen. */
  align?: 'left' | 'right'
}

/**
 * Points: a small star that opens a panel for how many. A task's reward uses it
 * for what each completion earns (RWD-5), and the Rewards page for what
 * clearing Today earns (RWD-27) — the panel knows only the number.
 *
 * Clicking the star while there are none gives 1 point and opens the panel on
 * it. The panel is like the other pickers: every step or number typed is saved
 * as it is made, with nothing to confirm. 0 is none, so stepping down to it or
 * typing it takes the points away. A step up from 0 lands on `startAt` rather
 * than on 1, so a monthly task is not 25 clicks from its reward.
 *
 * A muted trash beside the number takes the points away in one tap — ten of
 * them are not ten presses of − — and a **×** at the top right closes the
 * panel from inside it, for a hand that has set the number and is looking for
 * the way out rather than for somewhere beside the panel to click.
 */
export function RewardPicker({
  reward,
  startAt,
  onChange,
  label = 'Reward',
  hint,
  showAmount = false,
  addLabel = 'Add reward',
  noneLabel = 'No reward',
  removeLabel = 'Remove reward',
  align = 'right',
}: RewardPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  // What the box holds: the reward, or 0 for none, and whatever is typed over
  // it until that is a number of points or given up.
  const [typed, setTyped] = useState('')
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)

  const settled = reward ?? 0
  const amount = Number(typed)
  const isValid = typed.trim() !== '' && isPoints(amount)
  // Where the steps count from: what is typed while it is a number of points, and what it was otherwise.
  const base = isValid ? amount : settled
  const summary = reward === null ? noneLabel : describePoints(reward)

  // Named (sheet) fills its row so the whole line is the hit target (UI-59);
  // icon-only stays content-sized for a woken strip.
  const button = `${showAmount ? rowControlLabel : rowControlIcon} w-full`
  const rootClass = showAmount ? 'relative min-w-0 w-full' : 'relative min-w-0 shrink'

  function close() {
    setIsOpen(false)
  }

  /**
   * Closed from inside the panel — Enter, the ×, the trash — the focus goes
   * back to the star it came from rather than being dropped, so the keyboard is
   * not lost with the panel. A sheet gives it back by itself; the aside does not.
   */
  function finish() {
    close()
    trigger.current?.focus({ preventScroll: true })
  }

  function remove() {
    setTyped('0')
    onChange(null)
    finish()
  }

  function toggle() {
    if (isOpen) {
      close()
      return
    }
    // Reaching for the star while there are none is asking for some: they start
    // at the least there is, to step up from.
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
    finish()
  }

  return (
    <div
      ref={root}
      className={rootClass}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && isOpen) {
          event.stopPropagation()
          close()
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={`${label}: ${summary}`}
        title={reward === null ? addLabel : summary}
        className={reward === null ? `${button} ${controlOff}` : `${button} ${controlOn}`}
      >
        <StarIcon />
        {showAmount && <span className="min-w-0 truncate">{reward === null ? addLabel : summary}</span>}
      </button>

      {isOpen && (
        <PickerPanel
          anchor={root}
          label={label}
          align={align}
          width="w-64 md:w-52"
          content="gap-1.5 p-2 md:gap-1 md:p-1.5"
          onClose={close}
        >
          <div className="flex items-start gap-0.5">
            <p className="min-w-0 flex-1 px-1 pt-0.5 text-sm text-neutral-500 md:text-xs dark:text-neutral-400">
              {hint}
            </p>
            <button type="button" onClick={finish} aria-label="Close" className={panelClear}>
              ×
            </button>
          </div>

          {/*
            The number, and the trash at the panel's right edge under the ×. The
            row is three columns — an empty one, the stepper, the trash — so the
            number stays in the middle of the panel whether or not there is a
            reward to remove, rather than sliding across as the trash comes and goes.
          */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 pb-0.5 md:gap-1">
            <div role="group" aria-label="Points" className="col-start-2 flex items-center gap-1.5 md:gap-1">
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
                name="reward-points"
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
                className="w-16 [appearance:textfield] rounded-xl border border-neutral-300 bg-transparent px-2.5 py-2 text-center text-base tabular-nums text-neutral-900 focus:border-blue-500 focus:outline-none md:w-14 md:rounded-lg md:px-2 md:py-1 md:text-sm dark:border-neutral-700 dark:text-neutral-100 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => { choose(base === 0 ? startAt : base + 1) }}
                disabled={base >= MAX_REWARD}
                aria-label="More points"
                className={stepButton}
              >
                +
              </button>
            </div>

            {reward !== null && (
              <button
                type="button"
                onClick={remove}
                aria-label={removeLabel}
                title={removeLabel}
                // As wide as the × above it, so the two line up, and no taller than
                // the number box beside it, so the panel keeps its height as the
                // trash comes and goes.
                className={`col-start-3 grid h-10 w-11 shrink-0 place-items-center justify-self-end rounded-xl md:h-7 md:w-8 md:rounded-lg ${deleteControl}`}
              >
                <TrashIcon />
              </button>
            )}
          </div>
        </PickerPanel>
      )}
    </div>
  )
}
