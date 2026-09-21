import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import {
  currentEntries,
  habitRate,
  habitStats,
  hasTimeGoal,
  isComplete,
  isTimeGoalReached,
  type HabitDayState,
  type HabitRate,
  type List,
  type ListId,
  type LocalDay,
  type Repeat,
  type SubtaskId,
  type Task,
  type TaskId,
  type TimeEntryId,
} from '../../core'
import { describeDays, describeRate, HABIT_DAY_LABELS } from '../habitLabels'
import { toDraft, toRepeat, type RepeatDraft } from '../repeatDraft'
import { completionBoxOff, completionBoxOn, completionBoxReady } from '../rowControls'
import { HABIT_DAY_TONES } from '../habitTones'
import { textOffsetAtPoint } from '../textOffsetAtPoint'
import { ChevronIcon } from './ChevronIcon'
import { FlameIcon } from './FlameIcon'
import { HabitGrid } from './HabitGrid'
import { MoreVerticalIcon } from './MoreVerticalIcon'
import { TaskSheet } from './TaskSheet'
import { TimePicker } from './TimePicker'

interface HabitListProps {
  /** Already chosen and ordered by `habitTasks`. */
  habits: Task[]
  /** The moment the record is read for: which day is today, and whether it is done. */
  now: Date
  /** Whether each card starts open; changing it resets the cards to that default. */
  showDetails: boolean
  /** Every tag there is, to offer when editing a habit. */
  knownTags: readonly string[]
  /** Every list there is, to offer when filing a habit. */
  lists: readonly List[]
  onComplete: (id: TaskId) => void
  onUncomplete: (id: TaskId) => void
  /** Marks a day up to today done, or not done: what clicking a day in the grid asks for. */
  onSetDay: (id: TaskId, day: LocalDay, done: boolean) => void
  onRename: (id: TaskId, title: string) => void
  onChangeDescription: (id: TaskId, description: string) => void
  onChangeDueDate: (id: TaskId, dueDate: LocalDay | null) => void
  onSkipOccurrence: (id: TaskId) => void
  onChangeRepeat: (id: TaskId, repeat: Repeat | null) => void
  onChangeReward: (id: TaskId, reward: number | null) => void
  onChangeUrgent: (id: TaskId, urgent: boolean) => void
  onChangeTimeGoal: (id: TaskId, minutes: number | null) => void
  onLogTime: (id: TaskId, minutes: number) => void
  onRemoveTimeEntry: (id: TaskId, entryId: TimeEntryId) => void
  onChangeList: (id: TaskId, listId: ListId | null) => void
  onAddTag: (id: TaskId, name: string) => void
  onRemoveTag: (id: TaskId, name: string) => void
  onRemove: (id: TaskId) => void
  onDuplicate: (id: TaskId) => void
  onAddSubtask: (id: TaskId, index: number, title: string) => void
  onSetSubtaskDone: (id: TaskId, subtaskId: SubtaskId, done: boolean) => void
  onRenameSubtask: (id: TaskId, subtaskId: SubtaskId, title: string) => void
  onRemoveSubtask: (id: TaskId, subtaskId: SubtaskId) => void
}

const LEGEND: readonly HabitDayState[] = ['done', 'missed', 'untracked']

/** How far back each rate looks, in days, today included, and what it is called. */
const RATE_WINDOWS: readonly (readonly [days: number, label: string])[] = [
  [7, 'Last 7 days'],
  [30, 'Last 30 days'],
  [365, 'Last year'],
]

const titleBox = 'min-w-0 text-left text-sm'

/**
 * Every habit's record, one card each: whether today is done, how the streak
 * stands, and the days behind it. The habits are the tasks themselves, so
 * ticking one off here is ticking it off in the list, and the other way round.
 * A card's ⋮ opens the same sheet a task row uses on a phone, so a habit can
 * be edited without leaving the page.
 */
export function HabitList({
  habits,
  now,
  showDetails,
  knownTags,
  lists,
  onComplete,
  onUncomplete,
  onSetDay,
  onRename,
  onChangeDescription,
  onChangeDueDate,
  onSkipOccurrence,
  onChangeRepeat,
  onChangeReward,
  onChangeUrgent,
  onChangeTimeGoal,
  onLogTime,
  onRemoveTimeEntry,
  onChangeList,
  onAddTag,
  onRemoveTag,
  onRemove,
  onDuplicate,
  onAddSubtask,
  onSetSubtaskDone,
  onRenameSubtask,
  onRemoveSubtask,
}: HabitListProps) {
  if (habits.length === 0) {
    return (
      <p className="py-10 text-center text-neutral-400 dark:text-neutral-600">
        No habits yet. Give a task a daily repeat and it is tracked here.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Tasks that repeat every day.{' '}
        </p>

        <ul aria-label="Legend" className="flex items-center gap-3 self-end">
          {LEGEND.map((state) => (
            <li key={state} className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
              <span className={`size-3 rounded-[3px] ring-1 ring-neutral-900/5 ring-inset dark:ring-white/5 ${HABIT_DAY_TONES[state]}`} />
              {HABIT_DAY_LABELS[state]}
            </li>
          ))}
        </ul>
      </div>

      <ul className="flex flex-col gap-3">
        {habits.map((habit) => (
          <HabitCard
            key={`${habit.id}:${showDetails ? 'open' : 'folded'}`}
            habit={habit}
            now={now}
            knownTags={knownTags}
            lists={lists}
            onComplete={onComplete}
            onUncomplete={onUncomplete}
            onSetDay={onSetDay}
            onRename={onRename}
            onChangeDescription={onChangeDescription}
            onChangeDueDate={onChangeDueDate}
            onSkipOccurrence={onSkipOccurrence}
            onChangeRepeat={onChangeRepeat}
            onChangeReward={onChangeReward}
            onChangeUrgent={onChangeUrgent}
            onChangeTimeGoal={onChangeTimeGoal}
            onLogTime={onLogTime}
            onRemoveTimeEntry={onRemoveTimeEntry}
            onChangeList={onChangeList}
            onAddTag={onAddTag}
            onRemoveTag={onRemoveTag}
            onRemove={onRemove}
            onDuplicate={onDuplicate}
            onAddSubtask={onAddSubtask}
            onSetSubtaskDone={onSetSubtaskDone}
            onRenameSubtask={onRenameSubtask}
            onRemoveSubtask={onRemoveSubtask}
            showDetails={showDetails}
          />
        ))}
      </ul>
    </div>
  )
}

/**
 * One habit. A list of year-long grids is a long way to scroll for a box to
 * tick, so a card starts folded to the box, the title and the streak, and a tap
 * on its line unfolds the numbers and the days. Each card folds on its own, so
 * opening one never moves the one being reached for.
 *
 * The toggle and its hit area are always available; the hit area is stretched
 * over the card's line so ticking the box, changing the time goal or opening
 * the edit sheet does not unfold the card.
 *
 * A habit that asks for an amount of time has its clock on the card's line, so
 * the time is logged where the habit is ticked off. The ⋮ opens the task's
 * sheet so the habit can be renamed, scheduled and the rest without leaving.
 */
function HabitCard({
  habit,
  now,
  showDetails,
  knownTags,
  lists,
  onComplete,
  onUncomplete,
  onSetDay,
  onRename,
  onChangeDescription,
  onChangeDueDate,
  onSkipOccurrence,
  onChangeRepeat,
  onChangeReward,
  onChangeUrgent,
  onChangeTimeGoal,
  onLogTime,
  onRemoveTimeEntry,
  onChangeList,
  onAddTag,
  onRemoveTag,
  onRemove,
  onDuplicate,
  onAddSubtask,
  onSetSubtaskDone,
  onRenameSubtask,
  onRemoveSubtask,
}: { habit: Task } & Omit<HabitListProps, 'habits'>) {
  const done = isComplete(habit, now)
  const timed = hasTimeGoal(habit)
  const ready = !done && isTimeGoalReached(habit, now)
  const { currentStreak, bestStreak } = habitStats(habit, now)
  const [isOpen, setIsOpen] = useState(() => showDetails)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(() => toDraft(habit.repeat, now))
  const [editedTitle, setEditedTitle] = useState<string | null>(null)
  const caret = useRef<number | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const recordId = useId()

  useEffect(() => {
    const element = input.current
    if (element === null) return

    element.focus()
    const at = Math.min(caret.current ?? element.value.length, element.value.length)
    element.setSelectionRange(at, at)
  }, [editedTitle !== null])

  function closeEdit() {
    if (editedTitle !== null) {
      const trimmed = editedTitle.trim()
      if (trimmed.length > 0) onRename(habit.id, trimmed)
      setEditedTitle(null)
    }
    setIsEditing(false)
  }

  function changeDueDate(dueDate: LocalDay | null) {
    if (dueDate !== null && habit.repeat !== null) setDraft({ ...draft, kind: 'once' })
    onChangeDueDate(habit.id, dueDate)
  }

  function handleRepeatChange(next: RepeatDraft) {
    setDraft(next)
    onChangeRepeat(habit.id, toRepeat(next))
  }

  function startEdit(event: MouseEvent<HTMLButtonElement>) {
    caret.current =
      event.detail === 0 ? null : textOffsetAtPoint(event.currentTarget, event.clientX, event.clientY)
    setEditedTitle(habit.title)
  }

  function commitEdit() {
    const trimmed = editedTitle?.trim() ?? ''
    if (trimmed.length > 0) onRename(habit.id, trimmed)
    setEditedTitle(null)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitEdit()
      return
    }

    if (event.key === 'Escape') {
      event.stopPropagation()
      setEditedTitle(null)
    }
  }

  const titleClass = done
    ? `${titleBox} cursor-text pr-[13px] break-words text-neutral-400 line-through dark:text-neutral-600`
    : `${titleBox} cursor-text pr-[13px] break-words text-neutral-900 dark:text-neutral-100`
  const titleEditor =
    editedTitle === null ? (
      <button type="button" onClick={startEdit} aria-label={`Edit "${habit.title}"`} className={`${titleClass} text-lg`}>
        {habit.title}
      </button>
    ) : (
      <input
        ref={input}
        type="text"
        value={editedTitle}
        onChange={(event) => { setEditedTitle(event.target.value) }}
        onKeyDown={handleKeyDown}
        onBlur={commitEdit}
        aria-label={`Title of "${habit.title}"`}
        autoComplete="off"
        enterKeyHint="done"
        className={`${titleBox} flex-1 bg-transparent text-lg text-neutral-900 focus:outline-none dark:text-neutral-100`}
      />
    )

  return (
    <li className="flex flex-col rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="relative flex items-center gap-2.5 px-4 py-3.5">
        {/* Above the toggle's hit area, so ticking off never unfolds the card. */}
        <button
          type="button"
          onClick={() => { if (done) onUncomplete(habit.id); else onComplete(habit.id) }}
          aria-pressed={done}
          aria-label={
            done
              ? `Mark "${habit.title}" as not done today`
              : ready
                ? `Mark "${habit.title}" as done today: its time goal is reached`
                : `Mark "${habit.title}" as done today`
          }
          title={ready ? 'Time goal reached: ready to tick off' : undefined}
          className={`relative z-10 ${done ? completionBoxOn : ready ? completionBoxReady : completionBoxOff}`}
        >
          ✓
        </button>

        <h2 className="min-w-0 truncate text-sm font-medium">{habit.title}</h2>

        {!isOpen && (
          <span className="flex shrink-0 items-center gap-1 text-sm font-medium tabular-nums">
            <Flame streak={currentStreak} />
            <span className="sr-only">Current streak: </span>
            {String(currentStreak)}
          </span>
        )}

        <div className="relative z-20 ml-auto flex shrink-0 items-center gap-2.5">
          {timed && (
            <div className="shrink-0">
              <TimePicker
                goal={habit.timeGoal}
                sessions={currentEntries(habit.timeLog, habit.repeat, now)}
                now={now}
                onLog={(minutes) => { onLogTime(habit.id, minutes) }}
                onRemove={(entryId) => { onRemoveTimeEntry(habit.id, entryId) }}
                onChangeGoal={(minutes) => { onChangeTimeGoal(habit.id, minutes) }}
                label={`Time for "${habit.title}"`}
                showAmount
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => { setIsEditing(true) }}
            aria-haspopup="dialog"
            aria-expanded={isEditing}
            aria-label={`Edit "${habit.title}"`}
            title="Edit"
            className="relative z-20 grid size-6 shrink-0 place-items-center rounded-md text-neutral-400 outline-offset-2 focus-visible:outline-2 focus-visible:outline-blue-500 dark:text-neutral-500"
          >
            <MoreVerticalIcon className="size-4" />
          </button>

          <button
            type="button"
            onClick={() => { setIsOpen(!isOpen) }}
            aria-expanded={isOpen}
            aria-controls={recordId}
            aria-label={`Record of "${habit.title}"`}
            className="grid size-6 shrink-0 place-items-center rounded-md text-neutral-400 outline-offset-2 after:absolute after:inset-0 after:content-[''] focus-visible:outline-2 focus-visible:outline-blue-500 dark:text-neutral-500"
          >
            <ChevronIcon className={`size-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      <div
        id={recordId}
        className={`${isOpen ? 'flex' : 'hidden'} @container flex-col gap-4 px-4 pt-0.5 pb-3.5`}
      >
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 @xs:grid-cols-3 @lg:grid-cols-5">
          <Stat label="Current streak">
            <span className="flex items-center gap-1">
              <Flame streak={currentStreak} />
              {describeDays(currentStreak)}
            </span>
          </Stat>
          <Stat label="Best streak">{describeDays(bestStreak)}</Stat>
          {RATE_WINDOWS.map(([days, label]) => (
            <Stat key={days} label={label}>
              <Rate rate={habitRate(habit, days, now)} />
            </Stat>
          ))}
        </dl>

        <HabitGrid task={habit} now={now} onSetDay={(day, dayDone) => { onSetDay(habit.id, day, dayDone) }} />
      </div>

      {isEditing && (
        <TaskSheet
          task={habit}
          now={now}
          knownTags={knownTags}
          lists={lists}
          draft={draft}
          title={titleEditor}
          onClose={closeEdit}
          onComplete={onComplete}
          onUncomplete={onUncomplete}
          onChangeDescription={onChangeDescription}
          onChangeDueDate={changeDueDate}
          onSkipOccurrence={onSkipOccurrence}
          onChangeRepeat={handleRepeatChange}
          onChangeReward={onChangeReward}
          onChangeUrgent={onChangeUrgent}
          onChangeTimeGoal={onChangeTimeGoal}
          onLogTime={onLogTime}
          onRemoveTimeEntry={onRemoveTimeEntry}
          onChangeList={onChangeList}
          onAddTag={onAddTag}
          onRemoveTag={onRemoveTag}
          onRemove={(id) => {
            setIsEditing(false)
            onRemove(id)
          }}
          onDuplicate={onDuplicate}
          onAddSubtask={onAddSubtask}
          onSetSubtaskDone={onSetSubtaskDone}
          onRenameSubtask={onRenameSubtask}
          onRemoveSubtask={onRemoveSubtask}
        />
      )}
    </li>
  )
}

/** Lit while there is a streak (HAB-5). */
function Flame({ streak }: { streak: number }) {
  return (
    <FlameIcon
      className={streak > 0 ? 'size-4 shrink-0 text-orange-500' : 'size-4 shrink-0 text-neutral-300 dark:text-neutral-600'}
    />
  )
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col-reverse gap-0.5">
      <dt className="text-xs text-neutral-500 dark:text-neutral-400">{label}</dt>
      <dd className="text-base font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">{children}</dd>
    </div>
  )
}

/** "84%", with the days behind it beside it in a quieter voice: "25/30". */
function Rate({ rate }: { rate: HabitRate }) {
  return (
    <>
      {describeRate(rate)}
      {rate.days > 0 && (
        <span className="ml-1.5 text-xs font-normal text-neutral-500 dark:text-neutral-400">
          {String(rate.done)}/{String(rate.days)}
        </span>
      )}
    </>
  )
}
