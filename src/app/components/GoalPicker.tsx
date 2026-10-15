import { useRef, useState } from 'react'
import { sortGoals, type Goal, type GoalId } from '../../core'
import { panelOption as option, panelOptionOff as optionOff, panelOptionOn as optionOn } from '../panelControls'
import { controlOff, controlOn, rowControlIcon } from '../rowControls'
import { PickerPanel } from './PickerPanel'
import { TargetIcon } from './TargetIcon'

const hint = 'px-2 py-1.5 text-xs text-neutral-400 dark:text-neutral-500'

interface GoalPickerProps {
  /** The goal the task serves, or null for none. */
  goalId: GoalId | null
  /** Every goal there is, to choose from. */
  goals: readonly Goal[]
  onChange: (goalId: GoalId | null) => void
  /** What this picker is for, when there is more than one on screen. */
  label?: string
  /** Which edge of the button the panel lines up with: the one nearer the middle of the screen. */
  align?: 'left' | 'right'
}

/**
 * What a task is done for (GOAL-13, GOAL-14): a small button — the target,
 * tinted while the task serves a goal — that opens a panel listing **No goal**
 * and then every goal, the task's own marked. Like the list picker it **closes
 * on a choice**: a task serves one goal at a time, so choosing is the whole of
 * the job. No goal is first and always there, so there is always a way back out.
 *
 * Making a goal is not done from here: a goal outlives the task that wanted it,
 * so it is made on the Goals page (GoalsPage) rather than in passing (GOAL-1).
 */
export function GoalPicker({ goalId, goals, onChange, label = 'Goal', align = 'right' }: GoalPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  const shown = sortGoals(goals)
  // A task naming a goal that has gone serves none, here as everywhere else (GOAL-6).
  const served = goalId === null ? null : (shown.find((goal) => goal.id === goalId) ?? null)
  const summary = served?.name ?? 'No goal'

  const button = `${rowControlIcon} w-full`

  function choose(next: GoalId | null) {
    onChange(next)
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
        onClick={() => { setIsOpen(!isOpen) }}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={`${label}: ${summary}`}
        title={served === null ? 'Link to a goal' : summary}
        className={served === null ? `${button} ${controlOff}` : `${button} ${controlOn}`}
      >
        <TargetIcon />
      </button>

      {isOpen && (
        <PickerPanel
          anchor={root}
          label={label}
          align={align}
          width="w-64 md:w-56"
          content="gap-0.5 p-1.5 md:p-1"
          onClose={() => { setIsOpen(false) }}
        >
          <div role="group" aria-label="Goals" className="flex max-h-60 flex-col overflow-y-auto">
            <Choice name="No goal" chosen={served === null} onSelect={() => { choose(null) }} />
            {shown.map((goal) => (
              <Choice key={goal.id} name={goal.name} chosen={goal.id === served?.id} onSelect={() => { choose(goal.id) }} />
            ))}
          </div>

          {shown.length === 0 && <p className={hint}>No goals yet. Make one on the Goals page.</p>}
        </PickerPanel>
      )}
    </div>
  )
}

function Choice({ name, chosen, onSelect }: { name: string; chosen: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={chosen}
      onClick={onSelect}
      className={chosen ? `${option} ${optionOn}` : `${option} ${optionOff}`}
    >
      <span aria-hidden="true" className="w-5 shrink-0 md:w-3">
        {chosen ? '✓' : ''}
      </span>
      <span className="min-w-0 truncate">{name}</span>
    </button>
  )
}
