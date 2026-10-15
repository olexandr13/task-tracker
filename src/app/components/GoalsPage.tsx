import { useState, type KeyboardEvent } from 'react'
import { isGoalName, MAX_GOAL_NAME_LENGTH, type GoalId, type GoalSummary } from '../../core'
import { askDeleteGoal, describeGoalButton, GOAL_NAME_TAKEN, GOALS_HEADING, GOALS_INTRO, NO_GOALS } from '../goalLabels'
import { deleteControl } from '../rowControls'
import { ConfirmSheet } from './ConfirmSheet'
import { GoalProgressBar } from './GoalProgressBar'
import { InfoButton } from './InfoButton'
import { PencilIcon } from './PencilIcon'
import { TargetIcon } from './TargetIcon'

const row =
  'flex items-center rounded-xl border border-neutral-200 bg-white pr-1.5 transition-colors hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700'
const open = 'flex min-w-0 flex-1 flex-col gap-1.5 rounded-l-xl px-3 py-2.5 text-left text-sm text-neutral-900 dark:text-neutral-100'
const glyph = 'size-4 shrink-0 text-neutral-400 dark:text-neutral-500'
const smallControl =
  'flex size-6 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'
const field =
  'min-w-0 flex-1 rounded-lg border border-neutral-300 bg-transparent px-2.5 py-2 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none md:px-2 md:py-1 md:text-sm dark:border-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500'
const alert = 'px-1 text-xs text-red-600 dark:text-red-400'

interface GoalsPageProps {
  /** Every goal, in the order they are shown, with how far each has got (`summarizeGoals`). */
  goals: readonly GoalSummary[]
  onOpen: (id: GoalId) => void
  /** Makes a goal and opens it. False when the name will not do — one another goal has. */
  onAdd: (name: string) => boolean
  /** Renames a goal. False when another goal is called that already. */
  onRename: (id: GoalId, name: string) => boolean
  /** Deletes the goal; its tasks stop serving it. */
  onDelete: (id: GoalId) => void
}

/**
 * The Goals page (GOAL-16): every goal, each with how far it has got and
 * opening the tasks serving it, and buttons to rename and delete it. A box on
 * top makes a goal: a goal outlives the tasks that serve it, so it is made here
 * on purpose rather than in passing on a task (GOAL-1).
 */
export function GoalsPage({ goals, onOpen, onAdd, onRename, onDelete }: GoalsPageProps) {
  const [typed, setTyped] = useState('')
  // The goal being renamed, and what has been typed over its name so far.
  const [editing, setEditing] = useState<{ id: GoalId; name: string } | null>(null)
  // What went wrong with the last name tried, under the box or the row it was typed in.
  const [taken, setTaken] = useState<GoalId | 'new' | null>(null)
  // The goal asked about before it is deleted.
  const [asking, setAsking] = useState<GoalId | null>(null)
  const asked = goals.find(({ goal }) => goal.id === asking)?.goal
  // Deleted elsewhere — on another device — while asked, there is nothing left to ask about.
  if (asking !== null && asked === undefined) setAsking(null)

  function handleAdd() {
    if (!isGoalName(typed)) return

    if (onAdd(typed)) {
      setTyped('')
      setTaken(null)
    } else {
      setTaken('new')
    }
  }

  function commitRename() {
    if (editing === null) return

    // A name that will not do leaves the box open with it still in, to fix or give up on.
    if (!isGoalName(editing.name)) return
    if (onRename(editing.id, editing.name)) {
      setEditing(null)
      setTaken(null)
    } else {
      setTaken(editing.id)
    }
  }

  function handleRenameKeys(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitRename()
    } else if (event.key === 'Escape') {
      // Giving up leaves the goal named as it was, as dropping a title edit does (GOAL-5).
      event.preventDefault()
      setEditing(null)
      setTaken(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <h2 className="text-lg leading-6 text-neutral-900 dark:text-neutral-100">{GOALS_HEADING}</h2>
        <InfoButton label={GOALS_HEADING}>
          {GOALS_INTRO.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </InfoButton>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            name="goal-name"
            value={typed}
            onChange={(event) => {
              setTyped(event.target.value)
              if (taken === 'new') setTaken(null)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                handleAdd()
              }
            }}
            maxLength={MAX_GOAL_NAME_LENGTH}
            placeholder="Add a goal"
            aria-label="Name of the new goal"
            autoComplete="off"
            enterKeyHint="done"
            className={field}
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!isGoalName(typed)}
            className="shrink-0 self-stretch rounded-lg px-3 text-base text-neutral-600 transition-colors hover:bg-neutral-100 active:bg-neutral-100 md:self-auto md:px-2.5 md:py-1 md:text-sm dark:active:bg-neutral-800 hover:text-neutral-900 disabled:pointer-events-none disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
          >
            Add
          </button>
        </div>
        {taken === 'new' && (
          <p role="alert" className={alert}>
            {GOAL_NAME_TAKEN}
          </p>
        )}
      </div>

      <ul className="flex flex-col gap-1.5">
        {goals.map(({ goal, done, total }) => (
          <li key={goal.id} className="flex flex-col gap-1">
            <div className={row}>
              {editing?.id === goal.id ? (
                <div className="flex min-w-0 flex-1 items-center gap-1.5 px-1.5 py-1">
                  <TargetIcon className={glyph} />
                  <input
                    type="text"
                    name="goal-name"
                    value={editing.name}
                    onChange={(event) => {
                      setEditing({ id: goal.id, name: event.target.value })
                      if (taken === goal.id) setTaken(null)
                    }}
                    onKeyDown={handleRenameKeys}
                    onBlur={commitRename}
                    maxLength={MAX_GOAL_NAME_LENGTH}
                    // Asking to rename is asking to type: the caret goes there, over the old name.
                    autoFocus
                    aria-label={`Name of the goal "${goal.name}"`}
                    autoComplete="off"
                    enterKeyHint="done"
                    className={field}
                  />
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => { onOpen(goal.id) }}
                    aria-label={describeGoalButton(goal.name, { done, total })}
                    className={open}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <TargetIcon className={glyph} />
                      <span className="min-w-0 flex-1 truncate">{goal.name}</span>
                    </span>
                    <span className="pl-[1.625rem]">
                      <GoalProgressBar progress={{ done, total }} name={goal.name} />
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditing({ id: goal.id, name: goal.name })
                      setTaken(null)
                    }}
                    aria-label={`Rename the goal "${goal.name}"`}
                    title="Rename goal"
                    className={smallControl}
                  >
                    <PencilIcon className="size-3.5 shrink-0" />
                  </button>

                  <button
                    type="button"
                    // The goal goes for good, with nothing to undo it from, so it asks first.
                    onClick={() => { setAsking(goal.id) }}
                    aria-label={`Delete the goal "${goal.name}"`}
                    title="Delete goal"
                    className={`flex h-6 shrink-0 items-center rounded-lg px-1.5 text-base leading-none ${deleteControl}`}
                  >
                    ×
                  </button>
                </>
              )}
            </div>

            {taken === goal.id && (
              <p role="alert" className={alert}>
                {GOAL_NAME_TAKEN}
              </p>
            )}
          </li>
        ))}
      </ul>

      {goals.length === 0 && <p className="py-6 text-center text-neutral-400 dark:text-neutral-600">{NO_GOALS}</p>}

      {asked !== undefined && (
        <ConfirmSheet
          confirmation={askDeleteGoal(asked.name)}
          onCancel={() => { setAsking(null) }}
          onConfirm={() => {
            setAsking(null)
            onDelete(asked.id)
          }}
        />
      )}
    </div>
  )
}
