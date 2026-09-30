import type { ReactNode } from 'react'
import {
  canSkipOccurrence,
  currentEntries,
  defaultReward,
  dueDay,
  isComplete,
  isOverdue,
  isSkippedToday,
  isTimeGoalReached,
  sessionSeconds,
  skipOccurrence,
  wholeMinutes,
  type List,
  type LocalDay,
  type LocalTime,
  type Task,
} from '../../core'
import type { SkipChoice } from '../dateChoices'
import type { RepeatDraft } from '../repeatDraft'
import { describeTimeProgress } from '../durationLabels'
import { describeDueDate, describeShortDate, describeTimeOfDay } from '../dueLabels'
import { describeRepeatBriefly } from '../repeatLabels'
import { describeReward, describeRewardHint } from '../rewardLabels'
import {
  controlOff,
  deleteAction,
  rowControlLabel,
} from '../rowControls'
import { BottomSheet } from './BottomSheet'
import { CompletionBox } from './CompletionBox'
import { DuplicateIcon } from './DuplicateIcon'
import { ListPicker } from './ListPicker'
import { RewardPicker } from './RewardPicker'
import { SchedulePicker } from './SchedulePicker'
import { SheetActions } from './SheetActions'
import { SkipIcon } from './SkipIcon'
import { SubtaskList } from './SubtaskList'
import { TagPicker } from './TagPicker'
import { TaskDescription } from './TaskDescription'
import { TimePicker } from './TimePicker'
import { TrashIcon } from './TrashIcon'
import { UrgentToggle } from './UrgentToggle'
import type { TaskActions } from '../taskActions'
import type { TaskTimer } from '../useTaskTimer'

/**
 * The sheet's Skip while today is skipped: pressed, in the same soft yellow as
 * the box beside it at the head of the sheet (HAB-31), so the button and the box
 * say the same thing.
 */
const skippedAction =
  'bg-yellow-500/10 text-yellow-700 transition-colors hover:bg-yellow-500/15 active:bg-yellow-500/15 dark:bg-yellow-400/10 dark:text-yellow-300 dark:hover:bg-yellow-400/15 dark:active:bg-yellow-400/15'

interface TaskSheetProps {
  task: Task
  now: Date
  knownTags: readonly string[]
  lists: readonly List[]
  draft: RepeatDraft
  /** The title, already the box or the words that open it. */
  title: ReactNode
  onClose: () => void
  /** What can be done to the task; a day and a rule go through the two below, which keep the row's draft in step. */
  actions: TaskActions
  onChangeDay: (day: LocalDay | null) => void
  /** The hour picked, or taken away: the task is due at it on the day it falls on (DUE-19). */
  onChangeTime: (time: LocalTime | null) => void
  onChangeRepeat: (draft: RepeatDraft) => void
  /** The screen's timer, when one is offered for logging time by running a clock. */
  timer?: Pick<TaskTimer, 'clock' | 'start' | 'stop' | 'isRunningFor' | 'state'>
}

/**
 * A phone's look at a task: the title to edit, what the task holds, and the
 * buttons that act on it, in a sheet over the bar.
 */
export function TaskSheet({
  task,
  now,
  knownTags,
  lists,
  draft,
  title,
  onClose,
  actions,
  onChangeDay,
  onChangeTime,
  onChangeRepeat,
  timer,
}: TaskSheetProps) {
  const done = isComplete(task, now)
  const ready = !done && isTimeGoalReached(task, now)
  const overdue = isOverdue(task, now)
  const sessions = currentEntries(task.timeLog, task.repeat, now)
  const timerRunning = timer?.isRunningFor(task.id) ?? false
  const timerStartedAt =
    timerRunning && timer !== undefined && timer.state.status === 'running'
      ? timer.state.startedAt
      : null
  const skipTo = canSkipOccurrence(task, now) ? dueDay(skipOccurrence(task, now), now) : null
  const skip: SkipChoice | undefined =
    skipTo === null ? undefined : { to: skipTo, onSkip: () => { actions.skip(task.id) } }
  // Today passed over and not done after all: the foot's Skip reads as pressed and takes it back (HAB-31).
  const skippedToday = !done && isSkippedToday(task, now)

  // What the icons hold, spelled out under them (UI-63). A repeating task's days
  // come from its rule, so the rule is what is said, and the hour rides with
  // whichever of the two that is (DUE-19) — under the icon it sits on a line of
  // its own, which says "at" without the word. The list and the tags are spelled
  // out nowhere here (UI-63): their icons and panels say it in the width they have.
  const due = dueDay(task, now)
  const scheduleWords =
    task.repeat !== null ? describeRepeatBriefly(task.repeat) : due === null ? null : describeDueDate(due, now)
  const scheduleLabel =
    scheduleWords === null
      ? null
      : task.dueTime === null
        ? scheduleWords
        : `${scheduleWords} ${describeTimeOfDay(task.dueTime)}`
  const spent = wholeMinutes(sessionSeconds(sessions))
  const timeLabel = task.timeGoal === null && spent === 0 ? null : describeTimeProgress(spent, task.timeGoal)

  return (
    <BottomSheet label={`Details of "${task.title}"`} onClose={onClose}>
      <div className="flex shrink-0 items-start gap-3 px-4 pb-3">
        <CompletionBox
          title={task.title}
          done={done}
          ready={ready}
          skipped={skippedToday}
          onComplete={() => { actions.complete(task.id) }}
          onUncomplete={() => { actions.uncomplete(task.id) }}
        />
        <div className="flex min-h-8 min-w-0 flex-1 items-center">{title}</div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <SheetActions
          label={`What "${task.title}" has`}
          actions={[
            {
              name: 'Date',
              detail: scheduleLabel,
              control: (
                <SchedulePicker
                  dueDate={due}
                  startDay={task.startDay}
                  draft={draft}
                  now={now}
                  overdue={overdue}
                  onChangeDay={onChangeDay}
                  dueTime={task.dueTime}
                  onChangeTime={onChangeTime}
                  onChangeRepeat={onChangeRepeat}
                  skip={skip}
                  label={`Schedule for "${task.title}"`}
                  align="left"
                />
              ),
            },
            {
              name: 'List',
              control: (
                <ListPicker
                  listId={task.listId}
                  lists={lists}
                  onChange={(listId) => { actions.changeList(task.id, listId) }}
                  label={`List for "${task.title}"`}
                  align="left"
                />
              ),
            },
            {
              name: 'Time',
              detail: timeLabel,
              control: (
                <TimePicker
                  goal={task.timeGoal}
                  sessions={sessions}
                  now={now}
                  onLog={(minutes) => { actions.logTime(task.id, minutes) }}
                  onRemove={(entryId) => { actions.removeTimeEntry(task.id, entryId) }}
                  onChangeGoal={(minutes) => { actions.changeTimeGoal(task.id, minutes) }}
                  label={`Time for "${task.title}"`}
                  align="left"
                  timer={
                    timer === undefined
                      ? undefined
                      : {
                          running: timerRunning,
                          startedAt: timerStartedAt,
                          clock: timer.clock,
                          onStart: () => { timer.start(task.id) },
                          onStop: () => { timer.stop() },
                        }
                  }
                />
              ),
            },
            {
              name: 'Tags',
              control: (
                <TagPicker
                  tags={task.tags}
                  known={knownTags}
                  onAdd={(name) => { actions.addTag(task.id, name) }}
                  onRemove={(name) => { actions.removeTag(task.id, name) }}
                  label={`Tags for "${task.title}"`}
                  align="right"
                />
              ),
            },
            {
              name: 'Urgent',
              detail: task.urgent ? 'Urgent' : null,
              control: (
                <UrgentToggle
                  urgent={task.urgent}
                  onChange={(next) => { actions.changeUrgent(task.id, next) }}
                  label={`Urgent for "${task.title}"`}
                />
              ),
            },
            {
              name: 'Reward',
              detail: task.reward === null ? null : describeReward(task.reward),
              control: (
                <RewardPicker
                  reward={task.reward}
                  startAt={defaultReward(task.repeat)}
                  hint={describeRewardHint(task.repeat)}
                  onChange={(reward) => { actions.changeReward(task.id, reward) }}
                  label={`Reward for "${task.title}"`}
                  align="right"
                />
              ),
            },
          ]}
        />

        <div className="border-t border-neutral-200 px-4 py-1 dark:border-neutral-800">
          <SubtaskList
            subtasks={task.subtasks}
            repeat={task.repeat}
            now={now}
            taskTitle={task.title}
            onAdd={(index, next) => { actions.addSubtask(task.id, index, next) }}
            onSetDone={(subtaskId, next) => { actions.setSubtaskDone(task.id, subtaskId, next) }}
            onRename={(subtaskId, next) => { actions.renameSubtask(task.id, subtaskId, next) }}
            onRemove={(subtaskId) => { actions.removeSubtask(task.id, subtaskId) }}
            onMove={(subtaskId, targetId, placement) => { actions.moveSubtask(task.id, subtaskId, targetId, placement) }}
          />
        </div>

        <div className="border-t border-neutral-200 px-4 py-1.5 dark:border-neutral-800">
          <TaskDescription
            description={task.description}
            title={task.title}
            tags={task.tags}
            knownTags={knownTags}
            onChange={(description) => { actions.changeDescription(task.id, description) }}
            onAddTag={(name) => { actions.addTag(task.id, name) }}
          />
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-neutral-200 px-4 py-2 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => { actions.duplicate(task.id) }}
            className={`${rowControlLabel} min-h-12 md:min-h-11 ${controlOff}`}
          >
            <DuplicateIcon />
            Duplicate
          </button>

          {/* The occurrence passed over (RPT-34), or today's skip taken back — where a habit
              rests for the day (HAB-31). Nothing while there is no occurrence to skip. */}
          {skippedToday ? (
            <button
              type="button"
              onClick={() => { actions.unskip(task.id) }}
              aria-pressed
              aria-label={`Skipped "${task.title}" today`}
              title="Skipped today · press to take it back"
              className={`${rowControlLabel} min-h-12 md:min-h-11 ${skippedAction}`}
            >
              <SkipIcon />
              Skipped
            </button>
          ) : skipTo !== null ? (
            <button
              type="button"
              onClick={() => { actions.skip(task.id) }}
              aria-pressed={false}
              aria-label={`Skip "${task.title}"`}
              title={`Skip to ${describeShortDate(skipTo, now)}`}
              className={`${rowControlLabel} min-h-12 md:min-h-11 ${controlOff}`}
            >
              <SkipIcon />
              Skip
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => { actions.remove(task.id) }}
            aria-label={`Delete "${task.title}"`}
            className={`${rowControlLabel} min-h-12 md:min-h-11 ${deleteAction}`}
          >
            <TrashIcon />
            Delete
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
