import { useEffect, useEffectEvent, useId, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import {
  habitLastDays,
  habitRate,
  habitStats,
  isComplete,
  isTimeGoalReached,
  type HabitDayState,
  type HabitRate,
  type List,
  type LocalDay,
  type Task,
  type TaskId,
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
import type { TaskActions } from '../taskActions'
import type { TaskTimer } from '../useTaskTimer'

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
  /** What a card can do to its habit. */
  actions: TaskActions
  /** Marks a day up to today done, or not done: what clicking a day in the grid asks for. */
  onSetDay: (id: TaskId, day: LocalDay, done: boolean) => void
  timer?: Pick<TaskTimer, 'clock' | 'start' | 'stop' | 'isRunningFor' | 'state'>
  /** The habit being gone to (TIME-20): its card is brought into view and its sheet opened. */
  revealId?: TaskId | null
  /** Its card has been brought into view and its sheet opened. */
  onRevealed?: () => void
}

const LEGEND: readonly HabitDayState[] = ['done', 'missed', 'untracked']

/** How many days a folded card's run shows beside its streak. */
const GLANCE_DAYS = 7

/** How far back each rate looks, in days, today included, and what it is called. */
const RATE_WINDOWS: readonly (readonly [days: number, label: string])[] = [
  [7, 'Last 7 days'],
  [30, 'Last 30 days'],
  [365, 'Last year'],
]

/** The title and the box that replaces it, at the head of the habit's sheet: the size is the caller's. */
const titleBox = 'min-w-0 text-left'

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
  actions,
  onSetDay,
  timer,
  revealId = null,
  onRevealed,
}: HabitListProps) {
  // Per-card folds override the page default; clearing them when the default
  // changes is what "every card resets" means (HAB-23). The legend sits under
  // the list and only while at least one grid is open — it names shades that
  // otherwise are not on the page.
  const [openOverrides, setOpenOverrides] = useState<ReadonlyMap<TaskId, boolean>>(() => new Map())
  const [appliedDefault, setAppliedDefault] = useState(showDetails)
  if (appliedDefault !== showDetails) {
    setAppliedDefault(showDetails)
    setOpenOverrides(new Map())
  }

  function isOpen(id: TaskId): boolean {
    return openOverrides.get(id) ?? showDetails
  }

  function toggleOpen(id: TaskId) {
    setOpenOverrides((prev) => {
      const next = new Map(prev)
      next.set(id, !(prev.get(id) ?? showDetails))
      return next
    })
  }

  if (habits.length === 0) {
    return (
      <p className="py-10 text-center text-neutral-400 dark:text-neutral-600">
        No habits yet. Give a task a daily repeat and it is tracked here.
      </p>
    )
  }

  const anyOpen = habits.some((habit) => isOpen(habit.id))

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        Tasks that repeat every day.{' '}
      </p>

      <ul className="flex flex-col gap-3">
        {habits.map((habit) => (
          <HabitCard
            key={habit.id}
            habit={habit}
            now={now}
            knownTags={knownTags}
            lists={lists}
            actions={actions}
            onSetDay={onSetDay}
            timer={timer}
            revealed={revealId === habit.id}
            onRevealed={onRevealed}
            isOpen={isOpen(habit.id)}
            onToggleOpen={() => { toggleOpen(habit.id) }}
          />
        ))}
      </ul>

      {anyOpen && (
        <ul aria-label="Legend" className="flex items-center gap-3 self-end">
          {LEGEND.map((state) => (
            <li key={state} className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
              <span className={`size-3 rounded-[3px] ring-1 ring-neutral-900/5 ring-inset dark:ring-white/5 ${HABIT_DAY_TONES[state]}`} />
              {HABIT_DAY_LABELS[state]}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * One habit. A list of year-long grids is a long way to scroll for a box to
 * tick, so a card starts folded to the box, the title and, under it, the streak
 * and the last week, and a tap on its line unfolds the numbers and the days.
 * Each card folds on its own, so opening one never moves the one being reached
 * for.
 *
 * The title has the width of the card to itself, wrapping rather than being cut
 * off: what a habit is matters more than anything said about it. The toggle's
 * hit area is stretched over the card's line so ticking the box or opening the
 * edit sheet does not unfold the card.
 *
 * The ⋮ opens the task's sheet so the habit can be renamed, scheduled, timed
 * and the rest without leaving. The time is logged there, not on the card.
 */
function HabitCard({
  habit,
  now,
  isOpen,
  onToggleOpen,
  knownTags,
  lists,
  actions,
  onSetDay,
  timer,
  revealed,
  onRevealed,
}: {
  habit: Task
  isOpen: boolean
  onToggleOpen: () => void
  revealed: boolean
} & Omit<HabitListProps, 'habits' | 'showDetails' | 'revealId'>) {
  const done = isComplete(habit, now)
  const ready = !done && isTimeGoalReached(habit, now)
  const { currentStreak, bestStreak } = habitStats(habit, now)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(() => toDraft(habit.repeat, now))
  const [editedTitle, setEditedTitle] = useState<string | null>(null)
  const caret = useRef<number | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const card = useRef<HTMLLIElement>(null)
  const recordId = useId()
  const isTitleEditing = editedTitle !== null

  useEffect(() => {
    const element = input.current
    if (element === null) return

    element.focus()
    const at = Math.min(caret.current ?? element.value.length, element.value.length)
    element.setSelectionRange(at, at)
  }, [isTitleEditing])

  // Gone to from elsewhere (TIME-20): the sheet opens with the render that asks,
  // and the card is scrolled to once it is drawn.
  const [wasRevealed, setWasRevealed] = useState(false)
  if (revealed !== wasRevealed) {
    setWasRevealed(revealed)
    if (revealed) setIsEditing(true)
  }

  const bringUp = useEffectEvent(() => {
    card.current?.scrollIntoView({ block: 'center' })
    onRevealed?.()
  })

  useEffect(() => {
    if (revealed) bringUp()
  }, [revealed])

  function closeEdit() {
    if (editedTitle !== null) {
      const trimmed = editedTitle.trim()
      if (trimmed.length > 0) actions.rename(habit.id, trimmed)
      setEditedTitle(null)
    }
    setIsEditing(false)
  }

  function changeDueDate(dueDate: LocalDay | null) {
    if (dueDate !== null && habit.repeat !== null) setDraft({ ...draft, kind: 'once' })
    actions.changeDueDate(habit.id, dueDate)
  }

  function handleRepeatChange(next: RepeatDraft) {
    setDraft(next)
    actions.changeRepeat(habit.id, toRepeat(next))
  }

  function startEdit(event: MouseEvent<HTMLButtonElement>) {
    caret.current =
      event.detail === 0 ? null : textOffsetAtPoint(event.currentTarget, event.clientX, event.clientY)
    setEditedTitle(habit.title)
  }

  function commitEdit() {
    const trimmed = editedTitle?.trim() ?? ''
    if (trimmed.length > 0) actions.rename(habit.id, trimmed)
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
    <li ref={card} className="flex flex-col rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="relative flex items-start gap-2.5 px-4 py-3">
        {/* Above the toggle's hit area, so ticking off never unfolds the card. Level with the title's first line. */}
        <button
          type="button"
          onClick={() => { if (done) actions.uncomplete(habit.id); else actions.complete(habit.id) }}
          aria-pressed={done}
          aria-label={
            done
              ? `Mark "${habit.title}" as not done today`
              : ready
                ? `Mark "${habit.title}" as done today: its time goal is reached`
                : `Mark "${habit.title}" as done today`
          }
          title={ready ? 'Time goal reached: ready to tick off' : undefined}
          className={`relative z-10 mt-0.5 md:mt-0 ${done ? completionBoxOn : ready ? completionBoxReady : completionBoxOff}`}
        >
          ✓
        </button>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="text-base font-medium break-words md:text-sm">{habit.title}</h2>
          {!isOpen && <Glance habit={habit} streak={currentStreak} now={now} />}
        </div>

        {/*
          Level with the title's first line, like the box, so folding does not move them. Not positioned
          itself, so the chevron's hit area stretches over the whole line rather than this group.
        */}
        <div className="flex shrink-0 items-center gap-2.5 md:-my-0.5">
          <button
            type="button"
            onClick={() => { setIsEditing(true) }}
            aria-haspopup="dialog"
            aria-expanded={isEditing}
            aria-hidden={isEditing ? true : undefined}
            tabIndex={isEditing ? -1 : undefined}
            aria-label={`Edit "${habit.title}"`}
            title="Edit"
            // A thumb's size on a phone (UI-47), without growing the card: the margin gives back what it takes.
            className="relative z-20 -m-2 grid size-10 shrink-0 place-items-center rounded-lg text-neutral-400 outline-offset-2 transition-colors focus-visible:outline-2 focus-visible:outline-blue-500 active:bg-neutral-100 md:m-0 md:size-6 md:rounded-md dark:text-neutral-500 dark:active:bg-neutral-800"
          >
            <MoreVerticalIcon className="size-4" />
          </button>

          <button
            type="button"
            onClick={onToggleOpen}
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
          actions={{
            ...actions,
            remove: (id) => {
              setIsEditing(false)
              actions.remove(id)
            },
          }}
          onChangeDueDate={changeDueDate}
          onChangeRepeat={handleRepeatChange}
          timer={timer}
        />
      )}
    </li>
  )
}

/**
 * What a folded card says under its title (HAB-21): the streak, and how the
 * last week went, a square a day with today on the right, in the grid's shades.
 */
function Glance({ habit, streak, now }: { habit: Task; streak: number; now: Date }) {
  const days = habitLastDays(habit, GLANCE_DAYS, now)
  const kept = days.filter((day) => day.state === 'done').length

  return (
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-1 text-sm font-medium whitespace-nowrap tabular-nums text-neutral-700 dark:text-neutral-300">
        <Flame streak={streak} />
        <span className="sr-only">Current streak: </span>
        {describeDays(streak)}
      </span>
      <span
        role="img"
        aria-label={`Last ${String(GLANCE_DAYS)} days: done on ${describeDays(kept)}`}
        className="flex items-center gap-[3px]"
      >
        {days.map(({ day, state }) => (
          <span
            key={day}
            className={`size-2.5 rounded-[3px] ${HABIT_DAY_TONES[state]}`}
          />
        ))}
      </span>
    </div>
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
