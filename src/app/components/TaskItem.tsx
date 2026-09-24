import { CSS } from '@dnd-kit/utilities'
import { useEffect, useEffectEvent, useRef, useState, type FocusEvent, type KeyboardEvent, type MouseEvent, type TouchEvent } from 'react'
import {
  canSkipOccurrence,
  countSubtasks,
  currentEntries,
  defaultReward,
  dueDay,
  elapsedSeconds,
  hasDescription,
  hasSubtasks,
  hasTags,
  isComplete,
  isHabitRepeat,
  sameRepeat,
  isOverdue,
  isTimeGoalReached,
  listOf,
  scheduledDay,
  sessionSeconds,
  skipOccurrence,
  sortLists,
  wholeMinutes,
  type List,
  type LocalDay,
  type LocalTime,
  type Task,
  type TimeEntryId,
} from '../../core'
import { dateChoices } from '../dateChoices'
import { describeDueDate, describeTimeOfDay } from '../dueLabels'
import { describeTimeProgress, describeTimerRunning } from '../durationLabels'
import { toDraft, toRepeat, type RepeatDraft } from '../repeatDraft'
import { describeRepeatBriefly } from '../repeatLabels'
import { describeReward } from '../rewardLabels'
import {
  controlMarker,
  controlMarkerOverdue,
  controlMarkerRunning,
  controlOff,
  controlOn,
  deleteControl,
  detailReached,
  dragGrip,
  rowControlIcon,
} from '../rowControls'
import { isInTextEntry } from '../textEntry'
import { textOffsetAtPoint } from '../textOffsetAtPoint'
import { isHeldInPlace } from '../useLongPress'
import { usePhoneLayout } from '../usePhoneLayout'
import { useRowSwipe } from '../useRowSwipe'
import { useSortableTask } from '../useSortableTask'
import type { TaskActions } from '../taskActions'
import type { TaskTimer } from '../useTaskTimer'
import { CalendarIcon } from './CalendarIcon'
import { ChecklistIcon } from './ChecklistIcon'
import { ClockIcon } from './ClockIcon'
import { CompletionBox } from './CompletionBox'
import { ContextMenu, type ContextMenuEntry } from './ContextMenu'
import { DueChoices } from './DueChoices'
import { DuplicateIcon } from './DuplicateIcon'
import { FlagIcon } from './FlagIcon'
import { FloatingPanel } from './FloatingPanel'
import { FolderIcon } from './FolderIcon'
import { GripIcon } from './GripIcon'
import { InboxIcon } from './InboxIcon'
import { ListPicker } from './ListPicker'
import { NoteIcon } from './NoteIcon'
import { RepeatIcon } from './RepeatIcon'
import { RewardPicker } from './RewardPicker'
import { SchedulePicker } from './SchedulePicker'
import { StarIcon } from './StarIcon'
import { SubtaskList } from './SubtaskList'
import { TagIcon } from './TagIcon'
import { TagPanel } from './TagPanel'
import { TagPicker } from './TagPicker'
import { TaskDescription } from './TaskDescription'
import { TaskSheet } from './TaskSheet'
import { TimePicker } from './TimePicker'
import { UrgentToggle } from './UrgentToggle'

interface TaskItemProps {
  task: Task
  now: Date
  /** Every tag there is, to offer in the task's menu when tagging it. */
  knownTags: readonly string[]
  /** Every list there is, to offer in the task's menu when filing it. */
  lists: readonly List[]
  /** Whether the row spells out what its controls hold at rest too, not only once woken. */
  showDetails?: boolean
  /** Soften the row while Procrastination mode has another task in focus (JUST-5). */
  dimmed?: boolean
  /** Give the focused row extra space from its neighbours (JUST-5). */
  emphasized?: boolean
  /** What the row can do to its task. */
  actions: TaskActions
  /** The screen's timer, when one is offered for logging time by running a clock. */
  timer?: Pick<TaskTimer, 'clock' | 'start' | 'stop' | 'isRunningFor' | 'state'>
  /** Gone to from elsewhere (TIME-20): brought into view and opened, as a click on it would. */
  revealed?: boolean
  /** Said once the row has been brought into view and opened. */
  onRevealed?: () => void
}

/**
 * The title and the box that replaces it start in the same place, so nothing
 * shifts. Their size is the caller's: small on a wide screen's row, a step up on
 * a phone's (UI-47), and larger again at the head of a phone's sheet (UI-48).
 */
const titleBox = 'min-w-0 text-left'

/**
 * Where the title starts, and so where everything the row holds lines up: the
 * row's own padding, the completion box, and the gap between them. A phone's
 * row has more of both around the box, so the indent is a little deeper.
 */
const indent = 'pl-11 md:pl-10'

/**
 * Each control sits in a slot of one icon button's width, so an icon is in the
 * same place on every row whatever its neighbours hold. The slot is the button
 * and nothing more: the controls belong together, so only the line's gap is
 * between them. It keeps its width while it is empty, which a resting row's
 * unset controls leave it (UI-18), so the icons that are there still line up.
 */
const slot = 'flex w-6 shrink-0 items-center'

/**
 * The columns of a task's line: the completion box, the title, the schedule (the
 * date or the repeat rule), checklist, time and reward slots, the description and
 * delete.
 * The slots are fixed, so what is spelled out under them can run wider without
 * widening them. A phone has no room for the time and reward *controls* beside the
 * title; its time and reward are set from the sheet a tap opens instead, and the
 * rest row shows tinted marks for what is set (UI-50). The list
 * and the tags have no slot anywhere: a task is filed and tagged from its menu,
 * or on a phone from that sheet as well. Urgent is the same: set from the menu
 * or the sheet, never a control on the resting row (TASK-62).
 */
const lineColumns =
  'grid-cols-[auto_minmax(0,1fr)_repeat(2,--spacing(6))_auto_auto] md:grid-cols-[auto_minmax(0,1fr)_repeat(4,--spacing(6))_auto_auto]'

/**
 * A tag the task carries, on the line of details under its title: a label on the
 * task rather than part of what it says, the size of the details beside it.
 */
const chip =
  'max-w-28 min-w-0 truncate rounded-full bg-neutral-100 px-1.5 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'

/** What a control holds, on the second line under it. */
const detail = 'row-start-2 pb-1 text-[10px] leading-3 whitespace-nowrap text-neutral-400 tabular-nums dark:text-neutral-500'

/** Shares the shape of the pickers beside them: small controls, not a row. */
const rowButton = `${rowControlIcon} shrink-0`
/** Level with the row's single line. */
const grip = `${dragGrip} top-1`

export function TaskItem({
  task,
  now,
  knownTags,
  lists,
  showDetails = false,
  dimmed = false,
  emphasized = false,
  actions,
  timer,
  revealed = false,
  onRevealed,
}: TaskItemProps) {
  const phone = usePhoneLayout()
  const done = isComplete(task, now)
  const urgent = !done && task.urgent
  const checklist = countSubtasks(task, now)
  // The time that counts for the occurrence in play; once it meets the goal the
  // box invites a tick, and ticking it is still the owner's to do.
  const sessions = currentEntries(task.timeLog, task.repeat, now)
  const spentSeconds = sessionSeconds(sessions)
  const spent = wholeMinutes(spentSeconds)
  const timerRunning = timer?.isRunningFor(task.id) ?? false
  const timerStartedAt =
    timerRunning && timer !== undefined && timer.state.status === 'running'
      ? timer.state.startedAt
      : null
  const liveSeconds =
    timerRunning && timerStartedAt !== null && timer !== undefined
      ? elapsedSeconds(timerStartedAt, timer.clock)
      : 0
  const ready = !done && isTimeGoalReached(task, now)
  // The picker edits a draft; every change is saved straight away, so there is
  // no separate confirm step and nothing to lose by closing the panel.
  const [draft, setDraft] = useState(() => toDraft(task.repeat, now))
  // A rule the app refuses — a warm-up holding a habit back (WARM-4) — would
  // otherwise leave the picker claiming a habit the task is not, so a draft
  // that describes a habit while the task's own rule does not is put back to
  // the task's. Adjusted while rendering, which React redoes at once.
  if (isHabitRepeat(toRepeat(draft)) && !isHabitRepeat(task.repeat)) {
    setDraft(toDraft(task.repeat, now))
  }
  // The task's rule can also change from outside the picker — an undo putting
  // a repeat back (DUE-17), or another device — and the draft follows it when it
  // does, or the button would go on reading the rule the draft last held. A rule
  // the draft itself set already agrees with the task, so nothing moves and the
  // weekday and month-day choices it is keeping are safe (RPT-21). The draft
  // still leads the task the rest of the time, as it does the moment a day is
  // picked for a repeating task (DUE-12).
  const [ruleShown, setRuleShown] = useState(task.repeat)
  if (!sameRepeat(ruleShown, task.repeat)) {
    setRuleShown(task.repeat)
    if (!sameRepeat(toRepeat(draft), task.repeat)) setDraft(toDraft(task.repeat, now))
  }
  // Null unless the title is being edited. The text lives here rather than in the
  // task while it is being typed, so an abandoned edit leaves nothing behind.
  const [editedTitle, setEditedTitle] = useState<string | null>(null)
  // A woken row is the one being worked on: it spells its repeat rule out, opens
  // what it holds, and brings out the controls holding nothing yet (UI-18).
  const [isActive, setIsActive] = useState(false)
  // What the woken row is showing. Both come up with it — clicking a task is
  // asking to see the whole of it, not to be handed two more buttons to press —
  // and either can be put away again without leaving the row.
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false)
  const [isChecklistOpen, setIsChecklistOpen] = useState(false)
  // Where the caret goes when the title opens as a box: where it was clicked, or
  // the end when there is no such place.
  const caret = useRef<number | null>(null)
  // Where the task's menu was opened, while it is open.
  const [menuAt, setMenuAt] = useState<{ x: number; y: number; fromKeyboard: boolean } | null>(null)
  // What last pressed on the row, a mouse or a finger, which a click does not say
  // everywhere; and where a finger went down, to tell holding it from dragging it.
  const pointer = useRef('mouse')
  const touchedAt = useRef<{ x: number; y: number } | null>(null)
  // Where the tag panel opens from the menu: where the menu was, while it is open.
  const [tagsAt, setTagsAt] = useState<{ x: number; y: number } | null>(null)
  // Where the date panel opens from the menu, the same way.
  const [dateAt, setDateAt] = useState<{ x: number; y: number } | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const row = useRef<HTMLLIElement>(null)
  const line = useRef<HTMLDivElement>(null)
  const { setNodeRef, setActivatorNodeRef, listeners, attributes, isDragging, transform, transition } =
    useSortableTask(task, now)
  // Right completes (or takes back), left deletes — phone only, and not while the
  // sheet is open or the row is being dragged to a new place.
  const swipe = useRowSwipe(phone && !isActive && !isDragging, row, {
    onComplete: () => {
      if (done) actions.uncomplete(task.id)
      else actions.complete(task.id)
    },
    onDelete: () => { actions.remove(task.id) },
  })
  const isEditing = editedTitle !== null
  // What the controls hold, spelled out on a second line under each once woken, or
  // at rest too when the view asks for it: the date or the repeat rule, the checklist
  // count, the time and the reward, and the tags under the title. Otherwise the tinted
  // icons say what is set, so every resting row is one line high. A repeating task's
  // day is its rule's, and the rule is what is spelled out, so the date is a one-off's
  // alone here.
  // On a phone the sheet holds the details and the action buttons; the rest row still
  // shows tinted marks for what is set (UI-50), and spells the words out under the
  // title only when the view asks for details on every row.
  const detailed = phone ? showDetails : isActive || showDetails
  const day = dueDay(task, now)
  const scheduled = task.repeat !== null || day !== null
  const timed = task.timeGoal !== null || spentSeconds > 0 || timerRunning
  const rewarded = task.reward !== null
  const checklisted = hasSubtasks(task)
  const described = hasDescription(task)
  const tagged = hasTags(task)
  // Labels, not controls: a click on one is a click on the row. One line of them,
  // each giving up room to the rest when there is not enough.
  const tags =
    detailed && tagged ? (
      <ul aria-label="Tags" className="flex min-w-0 gap-1 overflow-hidden">
        {task.tags.map((tag) => (
          <li key={tag} className={chip}>
            {tag}
          </li>
        ))}
      </ul>
    ) : null
  const overdue = isOverdue(task, now)
  // Each said once and shown two ways: spelled out under the controls, or read out
  // from a phone's marks. A repeating task's day is its rule's, so the rule is what is said.
  const scheduleDay =
    task.repeat !== null ? describeRepeatBriefly(task.repeat) : day !== null ? describeDueDate(day, now) : null
  // The hour (DUE-19) rides with whichever of the two is said, being the same hour
  // on every day the task falls on — "Today at 8:14 PM", "Daily at 9:00 AM".
  const scheduleLabel =
    scheduleDay !== null && task.dueTime !== null
      ? `${scheduleDay} at ${describeTimeOfDay(task.dueTime, now)}`
      : scheduleDay
  const timeProgress = describeTimeProgress(spent, task.timeGoal)
  const timeLabel = (separator: string) =>
    !timerRunning
      ? timeProgress
      : spentSeconds > 0 || task.timeGoal !== null
        ? `${timeProgress}${separator}${describeTimerRunning(liveSeconds)}`
        : describeTimerRunning(liveSeconds)
  const rewardLabel = task.reward === null ? null : describeReward(task.reward)
  const schedule = detailed ? scheduleLabel : null
  const count = detailed && checklisted ? `${String(checklist.done)}/${String(checklist.total)}` : null
  const time = detailed && timed ? timeLabel(' · ') : null
  const points = detailed ? rewardLabel : null
  const urgentLabel = detailed && task.urgent ? 'Urgent' : null
  // On a phone, marks for what the task carries — set ones only, not buttons.
  // A tap on them is a tap on the row and opens the sheet.
  const marks =
    phone && (scheduled || timed || rewarded || checklisted || described || tagged)
      ? {
          label: [
            scheduleLabel,
            checklisted ? `Checklist ${String(checklist.done)} of ${String(checklist.total)}` : null,
            timed ? timeLabel(', ') : null,
            rewardLabel,
            described ? 'Description' : null,
            tagged ? `Tags ${task.tags.join(', ')}` : null,
          ]
            .filter((part): part is string => part !== null)
            .join(', '),
          overdue: scheduled && task.repeat === null && overdue,
        }
      : null
  const timePicker = {
    goal: task.timeGoal,
    sessions,
    now,
    onLog: (minutes: number) => { actions.logTime(task.id, minutes) },
    onRemove: (entryId: TimeEntryId) => { actions.removeTimeEntry(task.id, entryId) },
    onChangeGoal: (minutes: number | null) => { actions.changeTimeGoal(task.id, minutes) },
    label: `Time for "${task.title}"`,
    timer:
      timer === undefined
        ? undefined
        : {
            running: timerRunning,
            startedAt: timerStartedAt,
            clock: timer.clock,
            onStart: () => { timer.start(task.id) },
            onStop: () => { timer.stop() },
          },
  }
  // The list the task is filed under, or null in the Inbox.
  const filed = listOf(task, lists)
  // Where skipping the occurrence in play would move the task on to, while it has one to skip.
  const skipTo = canSkipOccurrence(task, now) ? dueDay(skipOccurrence(task, now), now) : null
  const skip = skipTo === null ? undefined : { to: skipTo, onSkip: () => { actions.skip(task.id) } }
  // The quick day choices, the same in the task's menu and on the woken row's strip
  // (DUE-14, UI-53). The menu adds Select date, having no calendar of its own; the
  // strip leaves it out, the row's own schedule control opening one beside it.
  const dateOptions = {
    chosen: scheduledDay(task),
    now,
    repeats: task.repeat !== null,
    skip,
    onChange: changeDay,
  }
  const menuItems: ContextMenuEntry[] = [
    // The same quick choices as the date panel; Select date opens that panel, calendar and all, where the menu was.
    {
      group: 'Date',
      icons: dateChoices({ ...dateOptions, onSelectDate: () => { setDateAt(menuAt) } }),
    },
    // A mark that is on or off, not one of a set: tinted rather than ticked, so it
    // starts where Duplicate and Tags start (UI-31).
    {
      label: 'Urgent',
      icon: <FlagIcon />,
      toggled: task.urgent,
      onSelect: () => { actions.changeUrgent(task.id, !task.urgent) },
    },
    { label: 'Duplicate', icon: <DuplicateIcon />, onSelect: () => { actions.duplicate(task.id) } },
    // A panel of its own rather than a group, since it takes typing and more than one choice.
    { label: 'Tags', icon: <TagIcon />, onSelect: () => { setTagsAt(menuAt) } },
    // Only once there is a list to choose: the Inbox alone is no choice at all.
    ...(lists.length === 0
      ? []
      : [
          {
            group: 'List',
            items: [
              {
                label: 'Inbox',
                icon: <InboxIcon />,
                checked: filed === null,
                onSelect: () => { actions.changeList(task.id, null) },
              },
              ...sortLists(lists).map((list) => ({
                label: list.name,
                icon: <FolderIcon />,
                checked: list.id === filed?.id,
                onSelect: () => { actions.changeList(task.id, list.id) },
              })),
            ],
          },
        ]),
  ]

  useEffect(() => {
    const element = input.current
    if (element === null) return

    element.focus()
    // A caret rather than the whole title selected: an edit is usually a tweak to
    // what is already there, not a rewrite.
    const at = Math.min(caret.current ?? element.value.length, element.value.length)
    element.setSelectionRange(at, at)
  }, [isEditing])

  const putAway = useEffectEvent(rest)

  useEffect(() => {
    // A phone's sheet lives outside the row and closes itself.
    if (!isActive || phone) return

    function handlePointerDown(event: PointerEvent) {
      if (!row.current?.contains(event.target as Node)) putAway()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => { document.removeEventListener('pointerdown', handlePointerDown) }
  }, [isActive, phone])

  const bringUp = useEffectEvent(() => {
    row.current?.scrollIntoView({ block: 'center' })
    wake()
    onRevealed?.()
  })

  useEffect(() => {
    if (revealed) bringUp()
  }, [revealed])

  /**
   * Opening the row: it shows what it holds. A row already awake is left as it
   * is, so focus moving between its controls does not bring back what was put away.
   */
  function wake() {
    if (isActive) return
    setIsActive(true)
    // On a phone the sheet always shows both; the toggles are a wide screen's.
    if (!phone) {
      setIsChecklistOpen(true)
      setIsDescriptionOpen(true)
    }
  }

  /** Letting it rest again, and putting away what it was showing. */
  function rest() {
    if (phone && editedTitle !== null) {
      const trimmed = editedTitle.trim()
      if (trimmed.length > 0) actions.rename(task.id, trimmed)
      setEditedTitle(null)
    }
    setIsActive(false)
    setIsChecklistOpen(false)
    setIsDescriptionOpen(false)
  }

  /**
   * A click on a resting row wakes it. On a phone that is the sheet, and a
   * further click on the row does nothing — the dimmed page closes it. On a
   * wide screen only a click on the task's own line, clear of everything on it
   * that does something, does anything more: a mouse's rests it again, and a
   * finger's opens the task's menu where it landed — a finger has no
   * right-click, and a tap anywhere else rests the row. So a double tap opens
   * the menu. A click inside a control, a picker or a panel is about that, and
   * a button that closes one of those is not undone by the same click reaching
   * the row.
   */
  function handleClick(event: MouseEvent<HTMLLIElement>) {
    if (!isActive) {
      wake()
      return
    }

    if (phone) return

    const target = event.target as Element
    const onLine = target === event.currentTarget || line.current?.contains(target) === true
    if (!onLine || target.closest('button, input, [role="dialog"]') !== null) return

    if (pointer.current === 'mouse') rest()
    else setMenuAt({ x: event.clientX, y: event.clientY, fromKeyboard: false })
  }

  /**
   * A finger held on the row until it is picked up (TaskDragAndDrop) and let go
   * where it went down opens the task's menu there, as a right-click would; moved,
   * it was a drag. Letting go is kept from also clicking what the menu opens over.
   */
  function handleTouchEnd(event: TouchEvent<HTMLLIElement>) {
    const start = touchedAt.current
    const end = event.changedTouches[0]
    touchedAt.current = null
    if (!isDragging || start === null || end === undefined) return

    const at = { x: end.clientX, y: end.clientY }
    if (!isHeldInPlace(start, at)) return

    event.preventDefault()
    setMenuAt({ ...at, fromKeyboard: false })
  }

  /** The title opens as a box, caret where it was clicked; from the keyboard, at the end. */
  function startEdit(event: MouseEvent<HTMLButtonElement>) {
    caret.current =
      event.detail === 0 ? null : textOffsetAtPoint(event.currentTarget, event.clientX, event.clientY)
    setEditedTitle(task.title)
  }

  /**
   * Keyboard focus wakes the row, so its controls can be tabbed to at all; a
   * mouse click is left to the row's own pointer handler, which ignores the
   * completion box.
   */
  function handleFocus(event: FocusEvent<HTMLElement>) {
    // On a phone the controls live in the sheet; focusing the box must not open it.
    if (!phone && event.target.matches(':focus-visible')) wake()
  }

  /** Tabbing out rests the row; moving between its own controls does not. */
  function handleBlur(event: FocusEvent<HTMLLIElement>) {
    if (phone) return
    if (event.relatedTarget !== null && !event.currentTarget.contains(event.relatedTarget)) {
      rest()
    }
  }

  /**
   * A right-click opens the task's menu where it was clicked, and leaves the row
   * as it was: the menu is about the task as a whole, not working on it. Text
   * being typed in keeps the browser's own menu, which is there for the text.
   */
  function handleContextMenu(event: MouseEvent<HTMLLIElement>) {
    if (isInTextEntry(event.target) || isDragging) return

    event.preventDefault()
    // The context-menu key presses no button, so there is no pointer to open at:
    // it opens under the task's line instead.
    if (event.button !== 2 && event.buttons === 0) {
      const box = line.current?.getBoundingClientRect()
      setMenuAt({ x: box?.left ?? 0, y: box?.bottom ?? 0, fromKeyboard: true })
      return
    }
    setMenuAt({ x: event.clientX, y: event.clientY, fromKeyboard: false })
  }

  /**
   * A day picked for the task, or taken away: the task is due on it, or its rule
   * starts there (DUE-12). The rule is left as it is, so the draft is too.
   */
  function changeDay(day: LocalDay | null) {
    actions.changeDay(task.id, day)
  }

  /**
   * An hour picked for the task, or taken away: it is due at that hour on the
   * day it already falls on (DUE-19), and the app says so when it comes round
   * (REM-1). The day and the rule are left as they are.
   */
  function changeTime(time: LocalTime | null) {
    actions.changeTime(task.id, time)
  }

  function handleRepeatChange(next: RepeatDraft) {
    setDraft(next)
    actions.changeRepeat(task.id, toRepeat(next))
  }

  /** Keeping the edit. An empty box is an abandoned edit, not a nameless task. */
  function commitEdit() {
    const trimmed = editedTitle?.trim() ?? ''
    if (trimmed.length > 0) {
      actions.rename(task.id, trimmed)
    }
    setEditedTitle(null)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitEdit()
      return
    }

    if (event.key === 'Escape') {
      // Dropping the edit unmounts the box, so the blur that follows cannot save it.
      event.stopPropagation()
      setEditedTitle(null)
    }
  }

  const titleClass = done
    ? `${titleBox} cursor-text pr-[13px] break-words text-neutral-400 line-through dark:text-neutral-600`
    : `${titleBox} cursor-text pr-[13px] break-words text-neutral-900 dark:text-neutral-100`
  const titleEditor =
    editedTitle === null ? (
      <button
        type="button"
        onClick={startEdit}
        aria-label={`Edit "${task.title}"`}
        className={`${titleClass} ${phone ? 'text-lg' : 'text-sm'}`}
      >
        {task.title}
      </button>
    ) : (
      <input
        ref={input}
        type="text"
        value={editedTitle}
        onChange={(event) => { setEditedTitle(event.target.value) }}
        onKeyDown={handleKeyDown}
        onBlur={commitEdit}
        aria-label={`Title of "${task.title}"`}
        autoComplete="off"
        enterKeyHint="done"
        className={`${titleBox} ${phone ? 'text-lg' : 'text-sm'} flex-1 bg-transparent text-neutral-900 focus:outline-none dark:text-neutral-100`}
      />
    )

  // The card surface: dashed and faded while dragged; marked while its menu or
  // sheet is open. On a phone the same classes ride the sliding face so a swipe
  // can reveal complete and delete underneath.
  const surface = isDragging
    ? 'rounded-xl border border-dashed border-neutral-300 bg-white opacity-50 dark:border-neutral-700 dark:bg-neutral-900'
    : menuAt !== null || tagsAt !== null || dateAt !== null || (phone && isActive)
      ? `rounded-xl border border-neutral-400 bg-white dark:border-neutral-600 dark:bg-neutral-900${urgent ? ' shadow-[inset_3px_0_0_rgb(217_119_6_/_0.55)] dark:shadow-[inset_3px_0_0_rgb(251_191_36_/_0.45)]' : ''}${dimmed ? ' opacity-25' : ''}`
      : `rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900${urgent ? ' shadow-[inset_3px_0_0_rgb(217_119_6_/_0.55)] dark:shadow-[inset_3px_0_0_rgb(251_191_36_/_0.45)]' : ''}${dimmed ? ' opacity-25' : ''}`

  return (
    <li
      ref={(element) => {
        row.current = element
        setNodeRef(element)
      }}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      // A mouse or a finger can pick the row up anywhere; the keyboard only from
      // its grip, which is where these listeners check a key press came from.
      {...listeners}
      // On the click rather than the press: waking the row moves the buttons
      // along, and a press that moves what is under it never becomes a click.
      onClick={handleClick}
      onClickCapture={swipe.onClickCapture}
      onPointerDown={(event) => { pointer.current = event.pointerType }}
      onTouchStart={(event) => {
        listeners?.onTouchStart?.(event)
        swipe.onTouchStart(event)
        const touch = event.touches[0]
        touchedAt.current = touch === undefined ? null : { x: touch.clientX, y: touch.clientY }
      }}
      onTouchEnd={(event) => {
        swipe.onTouchEnd(event)
        handleTouchEnd(event)
      }}
      onTouchCancel={swipe.onTouchCancel}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onContextMenu={handleContextMenu}
      onKeyDown={(event) => {
        listeners?.onKeyDown?.(event)
        // Panels and edit boxes stop Escape before it reaches here, so this only
        // ever rests a row that has nothing of its own open — or cancels a drag,
        // which should leave the row as it was.
        if (event.key === 'Escape' && !isDragging) rest()
      }}
      className={
        phone
          ? `group relative touch-manipulation overflow-hidden rounded-xl${emphasized ? ' my-3' : ''}`
          : `group relative touch-manipulation ${surface}${emphasized ? ' my-3' : ''}`
      }
      title={urgent ? 'Urgent' : undefined}
    >
      {/* In the gutter left of the row, so it takes nothing from the row itself.
          Shown on hover and on the woken row, where the keyboard reaches it. A
          done row has none: its place is when it was finished (TASK-17), so
          there is nothing for a drag to change. */}
      {!done && (
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          aria-label={`Move "${task.title}"`}
          title="Drag to move"
          className={
            isActive || isDragging
              ? `${grip} opacity-100`
              : `${grip} opacity-0 group-hover:opacity-100 focus-visible:opacity-100`
          }
        >
          <GripIcon className="size-3.5" />
        </button>
      )}

      {/* Under the sliding face on a phone: green to the right (complete), red to
          the left (delete). Covered at rest; a swipe peels the face back. */}
      {phone && (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div
            className={`absolute inset-0 flex items-center bg-green-600 pl-5 text-lg text-white dark:bg-green-700 ${
              swipe.offset > 0 ? 'opacity-100' : 'opacity-0'
            }`}
          >
            ✓
          </div>
          <div
            className={`absolute inset-0 flex items-center justify-end bg-red-600 pr-5 text-lg text-white dark:bg-red-700 ${
              swipe.offset < 0 ? 'opacity-100' : 'opacity-0'
            }`}
          >
            ×
          </div>
        </div>
      )}

      <div
        // A phone's row answers a touch by darkening while pressed (UI-61).
        className={phone ? `relative ${surface} active:bg-neutral-100 dark:active:bg-neutral-800` : undefined}
        style={
          phone
            ? {
                transform: swipe.offset === 0 ? undefined : `translate3d(${swipe.offset}px, 0, 0)`,
                transition: swipe.dragging ? 'none' : 'transform 150ms ease-out',
              }
            : undefined
        }
      >
      {/* Two lines sharing columns: the task's own, then what its controls hold, each
          detail under the column it belongs to. */}
      {/* The line's gap is the one between the controls; the title adds to it, so it
          stands apart from them. The box adds only what keeps the title at the indent. */}
      <div
        ref={line}
        className={
          phone
            ? 'flex items-center gap-3 px-3 py-2'
            : `grid ${lineColumns} items-center gap-x-2 px-2 py-1.5 md:px-2.5 md:py-1`
        }
      >
        <CompletionBox
          title={task.title}
          done={done}
          ready={ready}
          onComplete={() => { actions.complete(task.id) }}
          onUncomplete={() => { actions.uncomplete(task.id) }}
          inert={phone && isActive}
          className="md:mr-0.5"
        />

        {/* On a phone the title is part of the tap that opens the sheet, not an
            edit. The words plus a little past them are the edit on a wide screen. */}
        <div className={phone ? 'flex min-w-0 flex-1 items-center pr-1.5' : 'flex min-w-0 items-center pr-1.5'}>
          {phone ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                wake()
              }}
              aria-haspopup="dialog"
              aria-expanded={isActive}
              aria-hidden={isActive ? true : undefined}
              tabIndex={isActive ? -1 : undefined}
              className={
                done
                  ? `${titleBox} text-base break-words text-neutral-400 line-through dark:text-neutral-600`
                  : `${titleBox} text-base break-words text-neutral-900 dark:text-neutral-100`
              }
            >
              {task.title}
            </button>
          ) : (
            titleEditor
          )}
        </div>

        {/* On a phone: tinted marks for what is set, not controls — a tap still
            opens the sheet. Empty ones stay off, so a bare task stays one title. */}
        {marks !== null && (
          <div
            role="group"
            aria-label={marks.label}
            aria-hidden={phone && isActive ? true : undefined}
            className="flex shrink-0 items-center gap-0.5"
          >
            {scheduled && (
              <span className={marks.overdue ? controlMarkerOverdue : controlMarker}>
                {task.repeat === null ? <CalendarIcon /> : <RepeatIcon />}
              </span>
            )}
            {checklisted && (
              <span className={controlMarker}>
                <ChecklistIcon />
              </span>
            )}
            {timed && (
              <span
                className={
                  timerRunning
                    ? controlMarkerRunning
                    : ready
                      ? `${controlMarker} ${detailReached}`
                      : controlMarker
                }
              >
                <ClockIcon />
              </span>
            )}
            {rewarded && (
              <span className={controlMarker}>
                <StarIcon />
              </span>
            )}
            {described && (
              <span className={controlMarker}>
                <NoteIcon />
              </span>
            )}
            {tagged && (
              <span className={controlMarker}>
                <TagIcon />
              </span>
            )}
          </div>
        )}

        {!phone && (
          <>
            {/* A resting row shows only the controls holding something, so the list reads as
                what its tasks carry rather than as rows of empty buttons; waking it brings the
                rest out, the row being worked on having every control one click away (UI-18).
                The slots stay either way, so an icon keeps its column down the list (UI-27). */}
            {/* On every row: the date and the repeat rule are one control, since a rule is
                what gives a repeating task its days. Its name carries the occurrence in play,
                and a day picked there is the task's date, or the day its rule starts on. */}
            <div className={slot}>
              {(isActive || scheduled) && (
                <SchedulePicker
                  dueDate={dueDay(task, now)}
                  startDay={task.startDay}
                  draft={draft}
                  now={now}
                  overdue={overdue}
                  onChangeDay={changeDay}
                  dueTime={task.dueTime}
                  onChangeTime={changeTime}
                  onChangeRepeat={handleRepeatChange}
                  skip={skip}
                  label={`Schedule for "${task.title}"`}
                />
              )}
            </div>

            <div className={slot}>
              {(isActive || checklisted) && (
                <button
                  type="button"
                  onClick={() => { setIsChecklistOpen(!isChecklistOpen) }}
                  aria-expanded={isChecklistOpen}
                  aria-label={
                    hasSubtasks(task)
                      ? `Checklist for "${task.title}": ${String(checklist.done)} of ${String(checklist.total)} done`
                      : `Add a checklist to "${task.title}"`
                  }
                  title={hasSubtasks(task) ? `${String(checklist.done)}/${String(checklist.total)} done` : 'Add a checklist'}
                  className={hasSubtasks(task) ? `${rowButton} ${controlOn}` : `${rowButton} ${controlOff}`}
                >
                  <ChecklistIcon />
                </button>
              )}
            </div>

            <div className={slot}>{(isActive || timed) && <TimePicker {...timePicker} />}</div>

            <div className={slot}>
              {(isActive || rewarded) && (
                <RewardPicker
                  reward={task.reward}
                  startAt={defaultReward(task.repeat)}
                  onChange={(reward) => { actions.changeReward(task.id, reward) }}
                  label={`Reward for "${task.title}"`}
                />
              )}
            </div>

            {/* In a slot of its own like the rest, so the delete beside it keeps its place
                whether or not there is a description to show. */}
            <div className={slot}>
              {(isActive || described) && (
                <button
                  type="button"
                  onClick={() => { setIsDescriptionOpen(!isDescriptionOpen) }}
                  aria-expanded={isDescriptionOpen}
                  aria-label={
                    hasDescription(task) ? `Description of "${task.title}"` : `Add a description to "${task.title}"`
                  }
                  title={hasDescription(task) ? 'Description' : 'Add a description'}
                  className={hasDescription(task) ? `${rowButton} ${controlOn}` : `${rowButton} ${controlOff}`}
                >
                  <NoteIcon />
                </button>
              )}
            </div>

            {/* Always on show, and last, so it keeps its place as the row wakes and rests. */}
            <button
              type="button"
              onClick={(event) => {
                // Deleting is not engaging with the task either: the row is on its way out.
                event.stopPropagation()
                actions.remove(task.id)
              }}
              aria-label={`Delete "${task.title}"`}
              className={`flex h-6 shrink-0 items-center rounded-lg px-1 text-base leading-none ${deleteControl}`}
            >
              ×
            </button>
          </>
        )}

        {!phone && (
          <>
            {/* The second line is part of the task's line too, so a click on it rests a woken
                row as the line does. Each detail is centred under its control and free to run
                wider than it. Whether the task is done is the box's to say. */}
            {/* The tags are under the title, from where it starts. A long rule centred on its
                button would run into the details beside it, so the schedule's detail ends under
                its button instead and runs left over the title's column, sharing that with the
                tags, which give up room to it. An overdue date is red; a rule is no day, so not. */}
            {(tags !== null || urgentLabel !== null || schedule !== null) && (
              <div className={`${detail} col-start-2 col-end-4 flex min-w-0 gap-2`}>
                {tags}
                {urgentLabel !== null && <p className="shrink-0">{urgentLabel}</p>}
                {schedule !== null && (
                  <p
                    className={
                      task.repeat === null && overdue
                        ? 'ml-auto min-w-6 shrink-0 text-center text-red-600 dark:text-red-400'
                        : 'ml-auto min-w-6 shrink-0 text-center'
                    }
                  >
                    {schedule}
                  </p>
                )}
              </div>
            )}

            {count !== null && <p className={`${detail} col-start-4 justify-self-center`}>{count}</p>}

            {time !== null && (
              <p
                className={
                  ready
                    ? `${detail} col-start-5 justify-self-center ${detailReached}`
                    : `${detail} col-start-5 justify-self-center`
                }
              >
                {time}
              </p>
            )}

            {points !== null && <p className={`${detail} col-start-6 justify-self-center`}>{points}</p>}
          </>
        )}
      </div>

      {phone && detailed && (tags !== null || urgentLabel !== null || schedule !== null || count !== null || time !== null || points !== null) && (
        <div className={`${detail} flex min-w-0 flex-wrap items-center gap-x-2 px-3 pb-2 ${indent}`}>
          {tags}
          {urgentLabel !== null && <p>{urgentLabel}</p>}
          {schedule !== null && (
            <p className={task.repeat === null && overdue ? 'text-red-600 dark:text-red-400' : undefined}>
              {schedule}
            </p>
          )}
          {count !== null && <p>{count}</p>}
          {time !== null && <p className={ready ? detailReached : undefined}>{time}</p>}
          {points !== null && <p>{points}</p>}
        </div>
      )}

      {/* The menu's actions, once the row is open — the date, list, tags, urgent,
          duplicate — so a wide screen need not right-click for what a phone's sheet
          already has. */}
      {!phone && isActive && (
        <div
          className={`flex flex-wrap items-center gap-1 border-t border-neutral-200 py-1 pr-2 md:pr-2.5 ${indent} dark:border-neutral-800`}
        >
          {/* The menu's Date row (DUE-14), less Select date: the schedule control on
              the row's own line, out on every woken row (UI-18), opens the calendar. */}
          <div role="group" aria-label={`Date for "${task.title}"`} className="flex items-center gap-1">
            {dateChoices(dateOptions).map((choice) => (
              <button
                key={choice.label}
                type="button"
                onClick={choice.onSelect}
                aria-label={choice.label}
                aria-pressed={choice.checked}
                title={choice.hint ?? choice.label}
                className={choice.checked === true ? `${rowControlIcon} ${controlOn}` : `${rowControlIcon} ${controlOff}`}
              >
                {choice.icon}
              </button>
            ))}
          </div>

          {/* The line the menu draws between the Date row and the rest (UI-31). */}
          <div aria-hidden="true" className="mx-0.5 h-4 w-px bg-neutral-200 dark:bg-neutral-800" />

          {lists.length > 0 && (
            <ListPicker
              listId={task.listId}
              lists={lists}
              onChange={(listId) => { actions.changeList(task.id, listId) }}
              label={`List for "${task.title}"`}
              align="left"
            />
          )}
          <TagPicker
            tags={task.tags}
            known={knownTags}
            onAdd={(name) => { actions.addTag(task.id, name) }}
            onRemove={(name) => { actions.removeTag(task.id, name) }}
            label={`Tags for "${task.title}"`}
            align="left"
          />
          <UrgentToggle
            urgent={task.urgent}
            onChange={(next) => { actions.changeUrgent(task.id, next) }}
            label={`Urgent for "${task.title}"`}
          />
          <button
            type="button"
            onClick={() => { actions.duplicate(task.id) }}
            aria-label={`Duplicate "${task.title}"`}
            title="Duplicate"
            className={`${rowControlIcon} ${controlOff}`}
          >
            <DuplicateIcon />
          </button>
        </div>
      )}

      {/* Indented to start where the title does, so it reads as part of the same row. */}
      {!phone && isChecklistOpen && (
        <div className={`border-t border-neutral-200 py-1 pr-2 md:pr-2.5 ${indent} dark:border-neutral-800`}>
          <SubtaskList
            subtasks={task.subtasks}
            repeat={task.repeat}
            now={now}
            taskTitle={task.title}
            onAdd={(index, title) => { actions.addSubtask(task.id, index, title) }}
            onSetDone={(subtaskId, done) => { actions.setSubtaskDone(task.id, subtaskId, done) }}
            onRename={(subtaskId, title) => { actions.renameSubtask(task.id, subtaskId, title) }}
            onRemove={(subtaskId) => { actions.removeSubtask(task.id, subtaskId) }}
          />
        </div>
      )}

      {!phone && isDescriptionOpen && (
        <div className={`border-t border-neutral-200 py-1.5 pr-2 md:pr-2.5 ${indent} dark:border-neutral-800`}>
          <TaskDescription
            description={task.description}
            title={task.title}
            tags={task.tags}
            knownTags={knownTags}
            onChange={(description) => { actions.changeDescription(task.id, description) }}
            onAddTag={(name) => { actions.addTag(task.id, name) }}
          />
        </div>
      )}
      </div>

      {phone && isActive && (
        <TaskSheet
          task={task}
          now={now}
          knownTags={knownTags}
          lists={lists}
          draft={draft}
          title={titleEditor}
          onClose={rest}
          actions={actions}
          onChangeDay={changeDay}
          onChangeTime={changeTime}
          onChangeRepeat={handleRepeatChange}
          timer={timer}
        />
      )}

      {menuAt !== null && (
        <ContextMenu
          x={menuAt.x}
          y={menuAt.y}
          label={`Actions for "${task.title}"`}
          fromKeyboard={menuAt.fromKeyboard}
          items={menuItems}
          onClose={() => { setMenuAt(null) }}
        />
      )}

      {dateAt !== null && (
        <FloatingPanel
          x={dateAt.x}
          y={dateAt.y}
          role="dialog"
          label={`Date for "${task.title}"`}
          // Opening it is asking to pick a day, so the calendar has the focus, on the day it opens on.
          focusFirst='[role="grid"] [tabindex="0"]'
          onClose={() => { setDateAt(null) }}
          className="w-64"
        >
          <DueChoices
            dueDate={dueDay(task, now)}
            chosen={scheduledDay(task)}
            now={now}
            repeats={task.repeat !== null}
            skip={skip}
            onChange={changeDay}
            dueTime={task.dueTime}
            onChangeTime={changeTime}
            onDone={() => { setDateAt(null) }}
          />
        </FloatingPanel>
      )}

      {tagsAt !== null && (
        <FloatingPanel
          x={tagsAt.x}
          y={tagsAt.y}
          role="dialog"
          label={`Tags for "${task.title}"`}
          // Opening it is asking to type a tag, so the caret is put there.
          focusFirst="input"
          onClose={() => { setTagsAt(null) }}
          className="w-56"
        >
          <TagPanel
            tags={task.tags}
            known={knownTags}
            onAdd={(name) => { actions.addTag(task.id, name) }}
            onRemove={(name) => { actions.removeTag(task.id, name) }}
          />
        </FloatingPanel>
      )}
    </li>
  )
}
