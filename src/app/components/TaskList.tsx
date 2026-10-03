import { useEffect, useEffectEvent, useId, useState, type ReactNode } from 'react'
import {
  groupByCompletion,
  isComplete,
  isSpanHeld,
  spanStart,
  splitOverdue,
  type CompletionSpan,
  type CompletionSpans,
  type List,
  type LocalDay,
  type Task,
  type TaskId,
} from '../../core'
import { COMPLETION_SPAN_LABELS, DONE_LABEL, SPAN_EMPTY, SPAN_LOADING } from '../completionLabels'
import { OVERDUE_LABEL } from '../dueLabels'
import { CelebrateIcon } from './CelebrateIcon'
import { ChevronIcon } from './ChevronIcon'
import { SortableTasks } from './SortableTasks'
import { TaskItem } from './TaskItem'
import type { TaskActions } from '../taskActions'
import type { TaskTimer } from '../useTaskTimer'

/** A phone leaves room between rows so a tap aimed at one does not catch the next. */
const rows = 'flex flex-col gap-1.5 md:gap-1'

/** A run of rows under a heading: the overdue, or a span of done work. */
const section = 'flex flex-col gap-1.5'

const heading = 'flex items-baseline gap-2 px-1 text-xs font-medium'

const doneHeading = `${heading} text-neutral-400 dark:text-neutral-500`

const doneCount = 'font-normal text-neutral-300 tabular-nums dark:text-neutral-600'

/** What an open span says in place of rows it is still loading, or does not have. */
const spanNote = 'px-1 text-xs text-neutral-400 dark:text-neutral-500'

/**
 * A folded span's heading is a button the size of its words, padded out past
 * them into the gaps around it so a finger finds it without the list moving.
 */
const foldButton =
  '-my-1.5 flex items-center gap-2 rounded-md py-1.5 outline-offset-2 transition-colors hover:text-neutral-600 focus-visible:outline-2 focus-visible:outline-blue-500 dark:hover:text-neutral-300'

/**
 * Older done work fades further back: yesterday still near full, last week and
 * last month progressively softer. Today and earlier stay at full strength. A
 * folded span fades its rows alone, its heading being what opens it (TASK-65).
 */
function doneSpanClass(span: CompletionSpan): string {
  switch (span) {
    case 'yesterday':
      return 'opacity-80'
    case 'last7Days':
      return 'opacity-60'
    case 'last30Days':
      return 'opacity-40'
    default:
      return ''
  }
}

/**
 * The done work of a list that is not loaded yet (TASK-74): every task finished
 * on or after `heldSince` is held, and a folded span starting before that day is
 * loaded when it is opened.
 */
export interface ListHistory {
  readonly heldSince: LocalDay
  /** Whether the list is known to have work not loaded, or that is not known yet. */
  readonly unheld: 'some' | 'unknown'
  /** Asks for every task finished on or after `day`, or for all of them with null. */
  readonly onReachBack: (day: LocalDay | null) => void
}

interface TaskListProps {
  tasks: Task[]
  /** The moment the list is drawn for; a repeating task is only done for its current occurrence. */
  now: Date
  /** Every tag there is, for a row to offer. */
  knownTags: readonly string[]
  /** Every list there is, for a row to file its task under. */
  lists: readonly List[]
  /** Whether every row spells out what its controls hold, not only the woken one. */
  showDetails?: boolean
  /**
   * The open task Procrastination mode is focusing on. Every other row is dimmed;
   * null leaves the list at full strength unless `dimAll` is set.
   */
  focusId?: TaskId | null
  /**
   * Dim every row — Procrastination mode is on but idle after Rest, so nothing is
   * selected yet (JUST-5).
   */
  dimAll?: boolean
  /**
   * The spans the done tasks are divided into by when they were finished, each
   * under a heading, or null for one run of them under a plain **Done**. The tasks
   * are then given in that order too: to do, then done today, yesterday and so on
   * (`groupByCompletion`). Each is drawn open unless it is one of `foldedSpans`.
   */
  doneSpans?: CompletionSpans | null
  /**
   * The spans — `earlier` among them when it is — drawn folded away behind their
   * headings, each until its heading is clicked (TASK-72, TASK-73). Folded, a
   * heading still says how many it holds, once they are all held (TASK-74).
   */
  foldedSpans?: readonly CompletionSpan[]
  /** The done work not loaded yet, or null when every task the list could show is (TASK-74). */
  history?: ListHistory | null
  /** What an empty list says, pointing at the box above it. */
  emptyMessage: string
  /** What the list says above its tasks once every one of them is done. */
  allDoneMessage: string
  /** What a row can do to its task. */
  actions: TaskActions
  timer?: Pick<TaskTimer, 'clock' | 'start' | 'stop' | 'isRunningFor' | 'state'>
  /** The task being gone to (TIME-20): its row is brought into view and opened. */
  revealId?: TaskId | null
  /** Its row has been brought into view and opened. */
  onRevealed?: () => void
}

export function TaskList({
  tasks,
  now,
  knownTags,
  lists,
  showDetails = false,
  focusId = null,
  dimAll = false,
  doneSpans = null,
  foldedSpans = [],
  history = null,
  emptyMessage,
  allDoneMessage,
  actions,
  timer,
  revealId = null,
  onRevealed,
}: TaskListProps) {
  /** Whether all of a folded span's tasks are held, so its count is how many it has. */
  const isHeld = (span: CompletionSpan) => history === null || isSpanHeld(span, history.heldSince, now)

  // A span still to load, in a list known to have work not loaded, may hold any
  // of it: until it is opened, the list is not known to be empty.
  const mayHoldMore = (span: CompletionSpan) => !isHeld(span) && history?.unheld === 'some'

  if (tasks.length === 0 && !foldedSpans.some(mayHoldMore)) {
    return (
      <p className="py-10 text-center text-neutral-400 dark:text-neutral-600">
        {emptyMessage}
      </p>
    )
  }

  const allDone = tasks.every((task) => isComplete(task, now))

  /**
   * Procrastination mode draws its tasks in one run: the chosen task is pinned
   * to the top whatever its day (JUST-5), so no heading could speak for what
   * follows it — and headings are a distraction the mode is there to remove.
   */
  const headRuns = focusId === null && !dimAll

  /** A row. Done rows are not dragged at all: their place is when they were finished. */
  function row(task: Task) {
    return (
      <TaskItem
        key={task.id}
        task={task}
        now={now}
        knownTags={knownTags}
        lists={lists}
        showDetails={showDetails}
        dimmed={dimAll || (focusId !== null && focusId !== task.id)}
        emphasized={!dimAll && focusId !== null && focusId === task.id}
        actions={actions}
        timer={timer}
        revealed={revealId === task.id}
        onRevealed={onRevealed}
      />
    )
  }

  /**
   * The tasks still to do: the overdue under their own heading, then the rest
   * with none. A list with nothing overdue is one plain run, as it was.
   *
   * Both runs are **one list**, and one flat set of keyed items in it — the
   * heading an item among the rows rather than a section around the overdue,
   * the rows of both runs siblings in the same array: a task that turns overdue
   * while its row is open — an hour before now picked for it (DUE-10) — then
   * moves within that set, and React keeps its row, and the sheet and the
   * picker open on it, rather than drawing a new row elsewhere and closing them
   * with the old one. Two arrays, or a section each, would be two places, and
   * a row crossing between them a new row.
   */
  function todoRun(group: readonly Task[]) {
    const { overdue, rest } = headRuns ? splitOverdue(group, now) : { overdue: [], rest: group }

    const items = [
      ...(overdue.length === 0
        ? []
        : [
            <li key="overdue" role="presentation">
              <h2 className={`${heading} text-red-600 dark:text-red-400`}>
                {OVERDUE_LABEL}
                <span className="font-normal text-red-600/60 tabular-nums dark:text-red-400/60">{overdue.length}</span>
              </h2>
            </li>,
          ]),
      ...overdue.map((task) => row(task)),
      // The runs as far apart as the sections are (TASK-68): the list's own gap
      // either side of an item with nothing in it.
      ...(overdue.length > 0 && rest.length > 0
        ? [<li key="gap" role="presentation" aria-hidden="true" className="h-0 md:h-1" />]
        : []),
      ...rest.map((task) => row(task)),
    ]

    return (
      <ul key="todo" className={rows}>
        {items}
      </ul>
    )
  }

  /**
   * The done work under its heading: a span of it, faded by how long ago it was
   * finished or folded away, where the view divides it that way — otherwise all
   * of it under a plain **Done**, so finished work reads as finished without the
   * list being scanned row by row.
   */
  function doneRun(span: CompletionSpan, group: readonly Task[]) {
    const label = doneSpans !== null ? COMPLETION_SPAN_LABELS[span] : DONE_LABEL

    if (foldedSpans.includes(span)) {
      return (
        <FoldedRun
          key={span}
          label={label}
          size={group.length}
          held={isHeld(span)}
          shown={group.length > 0 || mayHoldMore(span)}
          fade={doneSpanClass(span)}
          holdsReveal={revealId !== null && group.some((task) => task.id === revealId)}
          onReach={() => { history?.onReachBack(spanStart(span, now)) }}
        >
          {group.map((task) => row(task))}
        </FoldedRun>
      )
    }

    return (
      <section
        key={span}
        aria-label={label}
        className={[section, doneSpanClass(span)].filter(Boolean).join(' ')}
      >
        <h2 className={doneHeading}>
          {label}
          <span className={doneCount}>{group.length}</span>
        </h2>
        <ul className={rows}>{group.map((task) => row(task))}</ul>
      </section>
    )
  }

  /**
   * The done tasks apart from the ones still to do: divided by when they were
   * finished where the view asks for it, else one run of them (`earlier` holds
   * whatever no span does, so no spans leaves every done task in it).
   */
  const groups = headRuns ? groupByCompletion(tasks, doneSpans ?? [], now) : [{ span: null, tasks }]

  /**
   * The runs in the order they are drawn. A folded span is drawn whether or not
   * it holds anything — it draws nothing while it has nothing to show — so one
   * opened as it loads keeps its place, and stays open, whatever it turns out to hold.
   */
  const runs: (CompletionSpan | null)[] = headRuns ? [null, ...(doneSpans ?? []), 'earlier'] : [null]
  const groupOf = (span: CompletionSpan | null) => groups.find((group) => group.span === span)?.tasks ?? []

  return (
    <>
      {allDone && (
        <div
          role="status"
          className="mb-3 flex items-center justify-center gap-2 rounded-xl border border-green-300/70 bg-green-50 px-4 py-3 dark:border-green-500/35 dark:bg-green-950/50"
        >
          <CelebrateIcon className="size-5 text-amber-500 dark:text-amber-300" />
          <p className="text-sm font-medium text-green-900 dark:text-green-100">{allDoneMessage}</p>
        </div>
      )}
      <div className="flex flex-col gap-3">
        <SortableTasks tasks={tasks}>
          {runs.map((span) => {
            const group = groupOf(span)
            if (span === null) return group.length > 0 ? todoRun(group) : null
            return group.length > 0 || foldedSpans.includes(span) ? doneRun(span, group) : null
          })}
        </SortableTasks>
      </div>
    </>
  )
}

interface FoldedRunProps {
  label: string
  /** How many of its tasks are held. */
  size: number
  /** Whether every task it could hold is, so `size` is how many it has. */
  held: boolean
  /** Whether it is drawn while folded: it holds something, or may. */
  shown: boolean
  /** How far its rows fade once open (TASK-65). */
  fade: string
  /** Whether the task being gone to (TIME-20) is in it, which opens it. */
  holdsReveal: boolean
  /** Asks for the rest of its tasks, once it is open with some still to load (TASK-74). */
  onReach: () => void
  /** Its rows, drawn only while it is open. */
  children: ReactNode
}

/**
 * A span of done work folded away behind its heading, which opens it and folds
 * it again (TASK-72, TASK-73). It starts folded whenever it is drawn afresh —
 * coming back to the view — so how much is shown is the view's to say, not
 * whatever was opened last time. Opened with tasks still to load, it asks for
 * them and says it is loading; its count waits until they are all there, since
 * a count of some of them would be wrong (TASK-74).
 */
function FoldedRun({ label, size, held, shown, fade, holdsReveal, onReach, children }: FoldedRunProps) {
  const [open, setOpen] = useState(false)
  const rowsId = useId()

  // The task being gone to is in here, so its row has to be there to bring up.
  // Opened for good rather than while the reveal lasts, or the row would fold
  // away again the moment it had been brought up. Adjusted while rendering,
  // which React redoes at once.
  if (holdsReveal && !open) setOpen(true)

  // Asking again for what is on its way asks nothing, so this can ask each time
  // the span is open and not all there.
  const reach = useEffectEvent(onReach)
  useEffect(() => {
    if (open && !held) reach()
  }, [open, held])

  if (!open && !shown) return null

  return (
    <section aria-label={label} className={section}>
      <h2 className={doneHeading}>
        <button
          type="button"
          onClick={() => { setOpen(!open) }}
          aria-expanded={open}
          aria-controls={open ? rowsId : undefined}
          className={foldButton}
        >
          {label}
          {held && <span className={doneCount}>{size}</span>}
          <ChevronIcon className={`size-3.5 shrink-0 transition-transform ${open ? '' : '-rotate-90'}`} />
        </button>
      </h2>
      {open && (
        <div id={rowsId} className={section}>
          {size > 0 && <ul className={[rows, fade].filter(Boolean).join(' ')}>{children}</ul>}
          {!held ? (
            <p role="status" className={spanNote}>{SPAN_LOADING}</p>
          ) : size === 0 ? (
            <p className={spanNote}>{SPAN_EMPTY}</p>
          ) : null}
        </div>
      )}
    </section>
  )
}
